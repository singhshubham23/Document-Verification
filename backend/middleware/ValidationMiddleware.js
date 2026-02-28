const { body, param, query, validationResult } = require('express-validator');

/**
 * Run after validator chains — returns 422 with all errors if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ───────────────────────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),

  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['verifier', 'institution']).withMessage("Role must be 'verifier' or 'institution'"),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Must be a valid phone number'),

  validate,
];

const validateLogin = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const validateVerifyOTP = [
  body('userId').notEmpty().withMessage('userId is required').isMongoId().withMessage('Invalid userId'),
  body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must be numeric'),
  validate,
];

const validateForgotPassword = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail(),
  validate,
];

const validateResetPassword = [
  body('email').trim().notEmpty().isEmail().normalizeEmail(),
  body('otp').notEmpty().isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
  body('newPassword').notEmpty().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate,
];

// ── Certificate validators ────────────────────────────────────────────────────

const validateUploadCertificate = [
  body('studentName').trim().notEmpty().withMessage('Student name is required').isLength({ max: 100 }),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required').isLength({ max: 50 }),
  body('course').trim().notEmpty().withMessage('Course is required').isLength({ max: 100 }),
  body('issueDate').notEmpty().withMessage('Issue date is required').isISO8601().withMessage('Issue date must be a valid date (YYYY-MM-DD)'),
  body('specialization').optional().trim().isLength({ max: 100 }),
  body('grade').optional().trim().isLength({ max: 10 }),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('marks.obtained').optional().isFloat({ min: 0 }),
  body('marks.total').optional().isFloat({ min: 0 }),
  body('marks.percentage').optional().isFloat({ min: 0, max: 100 }),
  validate,
];

const validateBulkUpload = [
  body('certificates').isArray({ min: 1 }).withMessage('certificates must be a non-empty array'),
  body('certificates.*.studentName').trim().notEmpty().withMessage('Each certificate must have a studentName'),
  body('certificates.*.rollNumber').trim().notEmpty().withMessage('Each certificate must have a rollNumber'),
  body('certificates.*.course').trim().notEmpty().withMessage('Each certificate must have a course'),
  body('certificates.*.issueDate').notEmpty().isISO8601().withMessage('Each certificate must have a valid issueDate'),
  validate,
];

const validateRevoke = [
  param('id').isMongoId().withMessage('Invalid certificate ID'),
  body('reason').optional().trim().isLength({ max: 500 }),
  validate,
];

// ── Verification validators ───────────────────────────────────────────────────

const validateVerifyById = [
  body('certificateId').trim().notEmpty().withMessage('certificateId is required'),
  validate,
];

const validateVerifyByQR = [
  body('qrPayload').notEmpty().withMessage('qrPayload is required'),
  validate,
];

// ── Institution validators ────────────────────────────────────────────────────

const validateCreateInstitution = [
  body('name').trim().notEmpty().withMessage('Institution name is required').isLength({ max: 200 }),
  body('code').optional().trim().isLength({ max: 20 }).isAlphanumeric().withMessage('Code must be alphanumeric'),
  body('accreditationStatus')
    .optional()
    .isIn(['accredited', 'pending', 'revoked', 'unverified'])
    .withMessage('Invalid accreditation status'),
  body('contactDetails.email').optional().isEmail().withMessage('Invalid contact email'),
  body('contactDetails.website').optional().isURL().withMessage('Invalid website URL'),
  validate,
];

// ── Fraud report validators ───────────────────────────────────────────────────

const validateFraudReport = [
  body('certificateId').optional().isMongoId().withMessage('Invalid certificateId'),
  body('fraudType')
    .notEmpty().withMessage('fraudType is required')
    .isIn([
      'tampered_grades', 'edited_photo', 'forged_signature',
      'invalid_certificate_number', 'non_existent_institution',
      'cloned_certificate', 'expired_certificate', 'revoked_certificate',
      'duplicate_submission', 'other',
    ]).withMessage('Invalid fraud type'),
  body('description').optional().trim().isLength({ max: 2000 }),
  validate,
];

// ── Admin validators ──────────────────────────────────────────────────────────

const validateUpdateFraud = [
  param('id').isMongoId().withMessage('Invalid report ID'),
  body('status')
    .optional()
    .isIn(['open', 'under_review', 'confirmed', 'dismissed'])
    .withMessage('Invalid status'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity'),
  body('reviewNotes').optional().trim().isLength({ max: 2000 }),
  validate,
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100').toInt(),
  validate,
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateVerifyOTP,
  validateForgotPassword,
  validateResetPassword,
  validateUploadCertificate,
  validateBulkUpload,
  validateRevoke,
  validateVerifyById,
  validateVerifyByQR,
  validateCreateInstitution,
  validateFraudReport,
  validateUpdateFraud,
  validatePagination,
};