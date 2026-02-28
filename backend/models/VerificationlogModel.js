const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema(
  {
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate', required: true },
    verifierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    result: {
      type: String,
      enum: ['valid', 'suspicious', 'fake', 'not_found'],
      required: true,
    },
    confidenceScore: { type: Number, min: 0, max: 100 }, // AI confidence %
    ocrData: {
      extractedText: String,
      studentName: String,
      rollNumber: String,
      course: String,
      institution: String,
      issueDate: String,
      marks: String,
      certificateId: String,
    },
    anomaliesDetected: [
      {
        type: String,
        description: String,
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      },
    ],
    blockchainVerified: { type: Boolean, default: false },
    databaseMatched: { type: Boolean, default: false },
    ipAddress: String,
    userAgent: String,
    processingTimeMs: Number,
  },
  { timestamps: true }
);

verificationLogSchema.index({ certificateId: 1 });
verificationLogSchema.index({ verifierId: 1 });
verificationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VerificationLog', verificationLogSchema);