const Institution = require('../models/InstitutionModel');
const User = require('../models/UserModel');
const crypto = require('crypto');

// @desc    Create institution (admin only)
// @route   POST /api/institutions
// @access  Private (admin)
exports.createInstitution = async (req, res, next) => {
  try {
    const { name, code, location, contactDetails, accreditationStatus, accreditationBody, naacGrade } = req.body;

    const exists = await Institution.findOne({ name });
    if (exists) return res.status(400).json({ success: false, message: 'Institution already exists.' });

    // Generate API key for ERP integration
    const apiKey = crypto.randomBytes(32).toString('hex');

    const institution = await Institution.create({
      name, code, location, contactDetails,
      accreditationStatus, accreditationBody, naacGrade,
      apiKey,
      addedBy: req.user._id,
    });

    res.status(201).json({ success: true, institution, apiKey });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all institutions
// @route   GET /api/institutions
// @access  Private
exports.getInstitutions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter = { isBlacklisted: false };
    if (status) filter.accreditationStatus = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await Institution.countDocuments(filter);
    const institutions = await Institution.find(filter)
      .select('-apiKey')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), institutions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single institution
// @route   GET /api/institutions/:id
// @access  Private
exports.getInstitution = async (req, res, next) => {
  try {
    const institution = await Institution.findById(req.params.id).select('-apiKey');
    if (!institution) return res.status(404).json({ success: false, message: 'Institution not found.' });
    res.json({ success: true, institution });
  } catch (error) {
    next(error);
  }
};

// @desc    Update institution details
// @route   PUT /api/institutions/:id
// @access  Private (admin)
exports.updateInstitution = async (req, res, next) => {
  try {
    const { apiKey, ...updates } = req.body; // never allow API key update this way
    const institution = await Institution.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    }).select('-apiKey');

    if (!institution) return res.status(404).json({ success: false, message: 'Institution not found.' });
    res.json({ success: true, institution });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate API key for institution
// @route   POST /api/institutions/:id/regenerate-key
// @access  Private (admin)
exports.regenerateAPIKey = async (req, res, next) => {
  try {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const institution = await Institution.findByIdAndUpdate(
      req.params.id, { apiKey }, { new: true }
    );
    if (!institution) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, message: 'API key regenerated.', apiKey });
  } catch (error) {
    next(error);
  }
};