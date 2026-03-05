const Certificate = require("../models/CertificateModel");
const Institution = require("../models/InstitutionModel");
const FraudReport = require("../models/FraudReport");
const VerificationLog = require("../models/VerificationlogModel");
const { callOCRService } = require("../utils/OcrUtil");
const { hashCertificate } = require("../utils/CryptoUtil");
const { generateQRCode } = require("../utils/QrUtil");
const {
  storeCertificateOnChain,
  revokeCertificateOnChain,
  isBlockchainEnabled,
} = require("../utils/BlockchainUtil");

// @desc    Upload & register a new certificate (by Institution)
// @route   POST /api/certificates
// @access  Private (institution)
const uploadCertificate = async (req, res, next) => {
  try {
    const {
      studentName,
      rollNumber,
      course,
      specialization,
      issueDate,
      marks,
      grade,
      cgpa,
    } = req.body || {};

    const institutionId = req.user.institutionId;
    if (!institutionId)
      return res.status(400).json({
        success: false,
        message: "Institution not linked to account.",
      });

    const institution = await Institution.findById(institutionId);
    if (!institution || institution.isBlacklisted)
      return res.status(403).json({
        success: false,
        message: "Institution is blacklisted or not found.",
      });

    const fileUrl = req.file ? req.file.path : null;

    // Generate deterministic hash
    const certData = {
      studentName,
      rollNumber,
      course,
      institutionId: institutionId.toString(),
      issueDate,
    };
    const certificateHash = hashCertificate(certData);

    const duplicate = await Certificate.findOne({ certificateHash });

    const certificate = await Certificate.create({
      studentName,
      rollNumber,
      course,
      specialization,
      institutionId,
      issueDate,
      marks: {
        obtained: marks?.obtained,
        total: marks?.total,
        percentage: marks?.percentage,
        grade,
        cgpa,
      },
      fileUrl,
      certificateHash,
      uploadedBy: req.user._id,
      isDuplicate: !!duplicate,
      duplicateOf: duplicate?._id,
    });

    // ── Generate QR Code ──────────────────────────────────
    try {
      const qrPath = await generateQRCode(certificate);
      certificate.qrCodeUrl = qrPath;
      await certificate.save({ validateBeforeSave: false });
    } catch (qrErr) {
      console.error("[QR] Generation failed (non-blocking):", qrErr.message);
    }

    // ── Store on Blockchain (non-blocking) ────────────────
    if (isBlockchainEnabled()) {
      setImmediate(async () => {
        try {
          const txnId = await storeCertificateOnChain(
            certificate.certificateId,
            certificate.certificateHash,
          );
          await Certificate.findByIdAndUpdate(certificate._id, {
            blockchainTxnId: txnId,
            isBlockchainVerified: true,
            blockchainNetwork: "polygon",
          });
        } catch (e) {
          console.error(
            "[Blockchain] Storage failed (non-blocking):",
            e.message,
          );
        }
      });
    }

    await Institution.findByIdAndUpdate(institutionId, {
      $inc: { totalCertificatesIssued: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Certificate registered successfully.",
      certificate,
      isDuplicate: !!duplicate,
      blockchainEnabled: isBlockchainEnabled(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk upload certificates via JSON array (Institution)
// @route   POST /api/certificates/bulk
// @access  Private (institution)
const bulkUpload = async (req, res, next) => {
  try {
    const { certificates } = req.body;
    if (!Array.isArray(certificates) || certificates.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "No certificates provided." });

    const institutionId = req.user.institutionId;
    const results = { created: 0, duplicates: 0, errors: [] };

    for (const cert of certificates) {
      try {
        const certData = { ...cert, institutionId: institutionId.toString() };
        const hash = hashCertificate(certData);
        const existing = await Certificate.findOne({ certificateHash: hash });

        const created = await Certificate.create({
          ...certData,
          institutionId,
          certificateHash: hash,
          uploadedBy: req.user._id,
          isDuplicate: !!existing,
          duplicateOf: existing?._id,
        });

        // QR for each cert (non-blocking)
        generateQRCode(created)
          .then((qrPath) =>
            Certificate.findByIdAndUpdate(created._id, { qrCodeUrl: qrPath }),
          )
          .catch(() => {});

        // Store on blockchain (non-blocking)
        if (isBlockchainEnabled()) {
          setImmediate(async () => {
            try {
              const txnId = await storeCertificateOnChain(
                created.certificateId,
                created.certificateHash,
              );
              await Certificate.findByIdAndUpdate(created._id, {
                blockchainTxnId: txnId,
                isBlockchainVerified: true,
              });
            } catch (err) {
              console.error("[Blockchain] Bulk upload failed:", err.message);
            }
          });
        }

        if (existing) results.duplicates++;
        else results.created++;
      } catch (err) {
        results.errors.push({ cert: cert.rollNumber, error: err.message });
      }
    }

    await Institution.findByIdAndUpdate(institutionId, {
      $inc: { totalCertificatesIssued: results.created },
    });

    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all certificates for an institution
// @route   GET /api/certificates
// @access  Private (institution, admin)
const getCertificates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter = {};

    if (req.user.role === "institution")
      filter.institutionId = req.user.institutionId;
    if (status) filter.verificationStatus = status;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { certificateId: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Certificate.countDocuments(filter);
    const certificates = await Certificate.find(filter)
      .populate("institutionId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), certificates });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
const getCertificate = async (req, res, next) => {
  try {
    const query = req.params.id.startsWith("CERT-")
      ? { certificateId: req.params.id }
      : { _id: req.params.id };

    const cert = await Certificate.findOne(query).populate(
      "institutionId",
      "name location accreditationStatus",
    );
    if (!cert)
      return res
        .status(404)
        .json({ success: false, message: "Certificate not found." });

    res.json({ success: true, certificate: cert });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke a certificate
// @route   PATCH /api/certificates/:id/revoke
// @access  Private (institution, admin)
const revokeCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert)
      return res
        .status(404)
        .json({ success: false, message: "Certificate not found." });

    if (
      req.user.role === "institution" &&
      cert.institutionId.toString() !== req.user.institutionId?.toString()
    )
      return res
        .status(403)
        .json({ success: false, message: "Not authorized." });

    cert.isRevoked = true;
    cert.revokedReason = req.body.reason || "Revoked by institution";
    cert.revokedAt = new Date();
    cert.verificationStatus = "revoked";
    await cert.save();

    // Revoke on blockchain (non-blocking)
    if (isBlockchainEnabled() && cert.blockchainTxnId) {
      setImmediate(async () => {
        try {
          await revokeCertificateOnChain(
            cert.certificateId,
            cert.revokedReason,
          );
          console.log(
            `[Blockchain] Certificate ${cert.certificateId} revoked on-chain`,
          );
        } catch (e) {
          console.error("[Blockchain] Revocation failed:", e.message);
        }
      });
    }

    res.json({
      success: true,
      message: "Certificate revoked.",
      certificate: cert,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCertificate,
  bulkUpload,
  getCertificates,
  getCertificate,
  revokeCertificate,
};
