const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/AuthMiddleware");
const FraudReport = require("../models/FraudReport");

router.use(protect);

// 
const Certificate = require("../models/Certificate");

router.post("/", async (req, res, next) => {
  try {
    const { certificateId, fraudType, description } = req.body;

    let certificateObjectId = null;

    if (certificateId) {
      const cert = await Certificate.findOne({ certificateId }); // your string field
      if (!cert) {
        return res.status(404).json({
          success: false,
          message: "Certificate not found"
        });
      }
      certificateObjectId = cert._id;
    }

    const report = await FraudReport.create({
      certificateId: certificateObjectId,
      fraudType,
      description,
      reportedBy: req.user._id,
      autoDetected: false,
    });

    res.status(201).json({
      success: true,
      message: "Fraud report submitted.",
      report
    });

  } catch (error) {
    next(error);
  }
});

router.get("/my-reports", async (req, res, next) => {
  try {
    const reports = await FraudReport.find({ reportedBy: req.user._id })
      .populate("certificateId", "certificateId studentName")
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
