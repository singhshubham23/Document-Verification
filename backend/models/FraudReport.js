const mongoose = require('mongoose');

const fraudReportSchema = new mongoose.Schema(
  {
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fraudType: {
      type: String,
      enum: [
        'tampered_grades',
        'edited_photo',
        'forged_signature',
        'invalid_certificate_number',
        'non_existent_institution',
        'cloned_certificate',
        'expired_certificate',
        'revoked_certificate',
        'duplicate_submission',
        'other',
      ],
      required: true,
    },
    description: String,
    evidence: [String],                  // URLs to supporting files
    status: {
      type: String,
      enum: ['open', 'under_review', 'confirmed', 'dismissed'],
      default: 'open',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: String,
    resolvedAt: Date,
    autoDetected: { type: Boolean, default: false }, // true = detected by AI, false = manual report
    anomalyDetails: Object,              // Raw anomaly data from AI
  },
  { timestamps: true }
);

fraudReportSchema.index({ status: 1 });
fraudReportSchema.index({ fraudType: 1 });
fraudReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FraudReport', fraudReportSchema);