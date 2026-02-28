const Certificate = require("../models/CertificateModel");
const Institution = require("../models/InstitutionModel");
const VerificationLog = require("../models/VerificationlogModel");
const FraudReport = require("../models/FraudReport");
const { callOCRService } = require("../utils/OcrUtil");
const { verifyBlockchainHash } = require("../utils/BlockchainUtil");
const { hashCertificate } = require("../utils/CryptoUtil");
const { sendFraudAlert } = require("../utils/NotificationsUtil");

// ── Core verification logic ──────────────────────────────
const runVerification = async ({
  certificate,
  ocrData,
  verifierId,
  ipAddress,
  userAgent,
}) => {
  const startTime = Date.now();
  const anomalies = [];
  let dbMatch = false;
  let blockchainVerified = false;

  // 1. Database match
  if (certificate) {
    dbMatch = true;

    // Check if revoked
    if (certificate.isRevoked) {
      anomalies.push({
        type: "revoked_certificate",
        description: "Certificate has been officially revoked.",
        severity: "high",
      });
    }

    // Check for duplicate
    if (certificate.isDuplicate) {
      anomalies.push({
        type: "duplicate_submission",
        description: "A certificate with identical data already exists.",
        severity: "high",
      });
    }

    // Blockchain verify if hash exists
    if (certificate.blockchainTxnId) {
      try {
        blockchainVerified = await verifyBlockchainHash(
          certificate.blockchainTxnId,
          certificate.certificateHash,
        );
        if (!blockchainVerified) {
          anomalies.push({
            type: "blockchain_mismatch",
            description: "Certificate hash does not match blockchain record.",
            severity: "critical",
          });
        }
      } catch (e) {
        // Blockchain unavailable — non-blocking
      }
    }

    // OCR cross-check if OCR data available
    if (ocrData) {
      if (
        ocrData.studentName &&
        !fuzzyMatch(ocrData.studentName, certificate.studentName)
      ) {
        anomalies.push({
          type: "name_mismatch",
          description: "OCR extracted name does not match database record.",
          severity: "high",
        });
      }
      if (ocrData.rollNumber && ocrData.rollNumber !== certificate.rollNumber) {
        anomalies.push({
          type: "roll_mismatch",
          description: "Roll number does not match database record.",
          severity: "high",
        });
      }
    }
  } else {
    anomalies.push({
      type: "not_found",
      description: "Certificate not found in any institution database.",
      severity: "critical",
    });
  }

  // Determine final result
  const criticalCount = anomalies.filter(
    (a) => a.severity === "critical" || a.severity === "high",
  ).length;
  let result = "valid";
  if (!certificate) result = "not_found";
  else if (criticalCount >= 2) result = "fake";
  else if (criticalCount === 1 || anomalies.length > 0) result = "suspicious";

  const confidenceScore = certificate
    ? Math.max(0, 100 - anomalies.length * 20 - criticalCount * 15)
    : 0;

  // Save log
  const log = await VerificationLog.create({
    certificateId: certificate?._id,
    verifierId,
    result,
    confidenceScore,
    ocrData,
    anomaliesDetected: anomalies,
    blockchainVerified,
    databaseMatched: dbMatch,
    ipAddress,
    userAgent,
    processingTimeMs: Date.now() - startTime,
  });

  // Update certificate verification count & status
  if (certificate) {
    await Certificate.findByIdAndUpdate(certificate._id, {
      $inc: { verificationCount: 1 },
      verificationStatus: result,
    });
  }

  // Auto-create fraud report if fake
  if (result === "fake" || result === "suspicious") {
    const fraudReport = await FraudReport.create({
      certificateId: certificate?._id,
      reportedBy: verifierId,
      fraudType: anomalies[0]?.type || "other",
      description: anomalies.map((a) => a.description).join("; "),
      status: "open",
      severity: result === "fake" ? "critical" : "medium",
      autoDetected: true,
      anomalyDetails: anomalies,
    });

    // Send alert to admin
    await sendFraudAlert(fraudReport);
  }

  return {
    result,
    confidenceScore,
    anomalies,
    blockchainVerified,
    databaseMatched: dbMatch,
    logId: log._id,
  };
};

// Simple fuzzy match (case-insensitive, trim whitespace)
const fuzzyMatch = (a, b) => {
  return a?.toLowerCase().trim() === b?.toLowerCase().trim();
};

// @desc    Verify by Certificate ID (text input)
// @route   POST /api/verification/by-id
// @access  Private (verifier, institution, admin)
exports.verifyById = async (req, res, next) => {
  try {
    const { certificateId } = req.body;

    const certificate = await Certificate.findOne({ certificateId }).populate(
      "institutionId",
    );
    const result = await runVerification({
      certificate,
      ocrData: null,
      verifierId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ success: true, ...result, certificate: certificate || null });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify by uploading certificate image/PDF (OCR + AI)
// @route   POST /api/verification/by-upload
// @access  Private (verifier, institution, admin)
exports.verifyByUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    // Call Python OCR service
    let ocrData = null;
    try {
      ocrData = await callOCRService(req.file.path);
    } catch (e) {
      return res
        .status(502)
        .json({
          success: false,
          message: "OCR service unavailable. Try again later.",
        });
    }

    // Try to find certificate in DB using OCR-extracted data
    let certificate = null;
    if (ocrData.certificateId) {
      certificate = await Certificate.findOne({
        certificateId: ocrData.certificateId,
      }).populate("institutionId");
    }
    if (!certificate && ocrData.rollNumber && ocrData.institution) {
      const inst = await Institution.findOne({
        name: { $regex: ocrData.institution, $options: "i" },
      });
      if (inst) {
        certificate = await Certificate.findOne({
          rollNumber: ocrData.rollNumber,
          institutionId: inst._id,
        }).populate("institutionId");
      }
    }

    const result = await runVerification({
      certificate,
      ocrData,
      verifierId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      ...result,
      ocrData,
      certificate: certificate || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify by QR code scan data
// @route   POST /api/verification/by-qr
// @access  Private
exports.verifyByQR = async (req, res, next) => {
  try {
    const { qrPayload } = req.body;

    // QR payload expected: { certificateId, hash, signature }
    let parsed;
    try {
      parsed =
        typeof qrPayload === "string" ? JSON.parse(qrPayload) : qrPayload;
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid QR payload." });
    }

    const certificate = await Certificate.findOne({
      certificateId: parsed.certificateId,
    }).populate("institutionId");

    // Extra: validate hash from QR matches stored hash
    const anomalies = [];
    if (
      certificate &&
      parsed.hash &&
      parsed.hash !== certificate.certificateHash
    ) {
      anomalies.push({
        type: "hash_mismatch",
        description: "QR code hash does not match certificate record.",
        severity: "critical",
      });
    }

    const result = await runVerification({
      certificate,
      ocrData: null,
      verifierId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Merge any extra anomalies
    result.anomalies = [...(result.anomalies || []), ...anomalies];

    res.json({ success: true, ...result, certificate: certificate || null });
  } catch (error) {
    next(error);
  }
};

// @desc    Get verification history for current user
// @route   GET /api/verification/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter =
      req.user.role === "admin" ? {} : { verifierId: req.user._id };

    const total = await VerificationLog.countDocuments(filter);
    const logs = await VerificationLog.find(filter)
      .populate("certificateId", "certificateId studentName course")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single verification log details
// @route   GET /api/verification/:logId
// @access  Private
exports.getLog = async (req, res, next) => {
  try {
    const log = await VerificationLog.findById(req.params.logId)
      .populate("certificateId")
      .populate("verifierId", "name email role");

    if (!log)
      return res
        .status(404)
        .json({ success: false, message: "Log not found." });
    res.json({ success: true, log });
  } catch (error) {
    next(error);
  }
};
