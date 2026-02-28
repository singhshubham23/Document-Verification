const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      default: () => `CERT-${uuidv4().split("-")[0].toUpperCase()}`,
    },
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    specialization: String,
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    issueDate: { type: Date, required: true },
    expiryDate: Date, // For certificates that expire
    marks: {
      obtained: Number,
      total: Number,
      percentage: Number,
      grade: String, // e.g. A+, B, etc.
      cgpa: Number,
    },
    // Blockchain & crypto
    certificateHash: { type: String, unique: true, sparse: true }, // SHA-256 hash of cert data
    blockchainTxnId: String,
    blockchainNetwork: String,
    smartContractAddress: String,
    isBlockchainVerified: { type: Boolean, default: false },
    // Digital signature
    digitalSignature: String,
    signedBy: String,
    // File storage
    fileUrl: String, // Stored PDF/image path
    qrCodeUrl: String,
    // Status
    verificationStatus: {
      type: String,
      enum: ["unverified", "valid", "suspicious", "fake", "revoked"],
      default: "unverified",
    },
    isRevoked: { type: Boolean, default: false },
    revokedReason: String,
    revokedAt: Date,
    // Metadata
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
    verificationCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Index for fast lookups
certificateSchema.index({ rollNumber: 1, institutionId: 1 }, { unique: true });


module.exports = mongoose.model("Certificate", certificateSchema);
