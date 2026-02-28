const express = require("express");
const institutionRouter = express.Router();
const fraudRouter       = express.Router();

const {
  createInstitution, getInstitutions, getInstitution,
  updateInstitution, regenerateAPIKey,
} = require("../controllers/InstitutionController");
const { protect, authorize } = require("../middleware/AuthMiddleware");
const FraudReport = require("../models/FraudReport");
const {
  validateCreateInstitution, validateFraudReport, validatePagination,
} = require("../middleware/ValidationMiddleware");

// ── Institution Routes ────────────────────────────────────────────────────────
institutionRouter.use(protect);
institutionRouter.get  ("/",    validatePagination,         getInstitutions);
institutionRouter.get  ("/:id",                             getInstitution);
institutionRouter.post ("/",    authorize("admin"), validateCreateInstitution, createInstitution);
institutionRouter.put  ("/:id", authorize("admin"),         updateInstitution);
institutionRouter.post ("/:id/regenerate-key", authorize("admin"), regenerateAPIKey);

// ── Fraud Routes ──────────────────────────────────────────────────────────────
fraudRouter.use(protect);

fraudRouter.post("/", validateFraudReport, async (req, res, next) => {
  try {
    const { certificateId, fraudType, description } = req.body;
    const report = await FraudReport.create({
      certificateId,
      fraudType,
      description,
      reportedBy: req.user._id,
      autoDetected: false,
    });
    res.status(201).json({ success: true, message: "Fraud report submitted.", report });
  } catch (error) {
    next(error);
  }
});

fraudRouter.get("/my-reports", async (req, res, next) => {
  try {
    const reports = await FraudReport.find({ reportedBy: req.user._id })
      .populate("certificateId", "certificateId studentName")
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
});

module.exports = { institutionRouter, fraudRouter };