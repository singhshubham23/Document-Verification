const User = require("../models/UserModel");
const Institution = require("../models/InstitutionModel");
const Certificate = require("../models/CertificateModel");
const VerificationLog = require("../models/VerificationlogModel");
const FraudReport = require("../models/FraudReport");

// @desc    Admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalInstitutions,
      totalCertificates,
      totalVerifications,
      openFraudReports,
      fakeCerts,
      recentFraud,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Institution.countDocuments(),
      Certificate.countDocuments(),
      VerificationLog.countDocuments(),
      FraudReport.countDocuments({ status: "open" }),
      Certificate.countDocuments({ verificationStatus: "fake" }),
      FraudReport.find({ status: "open" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("certificateId", "studentName certificateId")
        .populate("reportedBy", "name email"),
    ]);

    // Fraud trend — last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fraudTrend = await FraudReport.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Verification results breakdown
    const verificationBreakdown = await VerificationLog.aggregate([
      { $group: { _id: "$result", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalInstitutions,
        totalCertificates,
        totalVerifications,
        openFraudReports,
        fakeCerts,
      },
      recentFraud,
      fraudTrend,
      verificationBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate("institutionId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), users });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle
// @access  Private (admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Blacklist / un-blacklist an institution
// @route   PATCH /api/admin/institutions/:id/blacklist
// @access  Private (admin)
exports.toggleBlacklist = async (req, res, next) => {
  try {
    const institution = await Institution.findById(req.params.id);
    if (!institution)
      return res
        .status(404)
        .json({ success: false, message: "Institution not found." });

    institution.isBlacklisted = !institution.isBlacklisted;
    institution.blacklistReason = req.body.reason || "";
    await institution.save();

    res.json({
      success: true,
      message: `Institution ${institution.isBlacklisted ? "blacklisted" : "un-blacklisted"}.`,
      institution,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fraud reports
// @route   GET /api/admin/fraud
// @access  Private (admin)
exports.getFraudReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, fraudType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (fraudType) filter.fraudType = fraudType;

    const total = await FraudReport.countDocuments(filter);
    const reports = await FraudReport.find(filter)
      .populate("certificateId", "certificateId studentName course")
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Update fraud report status
// @route   PATCH /api/admin/fraud/:id
// @access  Private (admin)
exports.updateFraudReport = async (req, res, next) => {
  try {
    const { status, reviewNotes, severity } = req.body;
    const report = await FraudReport.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        severity,
        reviewedBy: req.user._id,
        ...(status === "confirmed" || status === "dismissed"
          ? { resolvedAt: new Date() }
          : {}),
      },
      { new: true },
    );

    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all verification logs (admin view)
// @route   GET /api/admin/logs
// @access  Private (admin)
exports.getAllLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, result } = req.query;
    const filter = result ? { result } : {};

    const total = await VerificationLog.countDocuments(filter);
    const logs = await VerificationLog.find(filter)
      .populate("certificateId", "certificateId studentName")
      .populate("verifierId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), logs });
  } catch (error) {
    next(error);
  }
};
