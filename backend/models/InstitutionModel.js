const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Institution name is required'], trim: true, unique: true },
    code: { type: String, unique: true, uppercase: true, trim: true }, // short code e.g. "IIT-BOM"
    location: {
      address: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String,
    },
    contactDetails: {
      email: String,
      phone: String,
      website: String,
    },
    accreditationStatus: {
      type: String,
      enum: ['accredited', 'pending', 'revoked', 'unverified'],
      default: 'unverified',
    },
    accreditationBody: String,          // e.g. UGC, NAAC, AICTE
    naacGrade: String,
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: String,
    apiKey: { type: String, select: false },  // For ERP integration
    logoUrl: String,
    isActive: { type: Boolean, default: true },
    totalCertificatesIssued: { type: Number, default: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Institution', institutionSchema);