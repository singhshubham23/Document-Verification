const User = require('../models/UserModel');
const Institution = require('../models/InstitutionModel');
const { generateToken } = require('../middleware/AuthMiddleware');
const { sendEmail } = require('../utils/EmailUtil');
const crypto = require('crypto');

// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, institutionName, location } = req.body;
    const normalizedRole = role === 'user' ? 'verifier' : role;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    let institutionId = undefined;

    // 🔥 If registering as institution → create Institution document
   if (normalizedRole === 'institution') {

  if (!institutionName) {
    return res.status(400).json({
      success: false,
      message: 'Institution name is required.'
    });
  }

  // 1️⃣ Check if institution already exists (created by admin)
  let existingInstitution = await Institution.findOne({
    name: { $regex: `^${institutionName}$`, $options: 'i' }
  });

  if (existingInstitution) {
    institutionId = existingInstitution._id;
  } else {
    // 2️⃣ Create new institution if not exists
    const newInstitution = await Institution.create({
      name: institutionName,
      location: location || {},
      accreditationStatus: 'pending',
      totalCertificatesIssued: 0,
      isBlacklisted: false,
    });

    institutionId = newInstitution._id;
  }
}

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: normalizedRole || 'verifier',
      institutionId,
      otp,
      otpExpiry,
    });

    await sendEmail({
      to: email,
      subject: 'HealBharat — Verify your email',
      html: `<p>Hello <b>${name}</b>,</p>
             <p>Your OTP is: <b style="font-size:24px">${otp}</b></p>
             <p>Valid for 10 minutes.</p>`,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to email.',
      userId: user._id,
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Email verified.', token, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled. Contact admin.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({ success: true, token, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('institutionId', 'name accreditationStatus');
  res.json({ success: true, user });
};

// @desc    Forgot password — send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'No account with that email.' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: user.email,
      subject: 'HealBharat — Password Reset OTP',
      html: `<p>Your password reset OTP: <b>${otp}</b> (valid 10 mins)</p>`,
    });

    res.json({ success: true, message: 'OTP sent to email.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpiry +password');
    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update FCM Token for push notifications
// @route   PATCH /api/auth/fcm-token
// @access  Private
exports.updateFCMToken = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });
    res.json({ success: true, message: 'FCM token updated.' });
  } catch (error) {
    next(error);
  }
};
