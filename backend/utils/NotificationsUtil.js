const { sendEmail } = require('./EmailUtil');
const User = require('../models/UserModel');

/**
 * Send fraud alert email to all admin users.
 */
const sendFraudAlert = async (fraudReport) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('email name');
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `⚠️ HealBharat — Fraud Alert: ${fraudReport.fraudType}`,
        html: `
          <h2>Fraud Alert Detected</h2>
          <p><b>Type:</b> ${fraudReport.fraudType}</p>
          <p><b>Severity:</b> ${fraudReport.severity}</p>
          <p><b>Description:</b> ${fraudReport.description}</p>
          <p><b>Certificate ID:</b> ${fraudReport.certificateId || 'N/A'}</p>
          <p><b>Detected at:</b> ${new Date().toISOString()}</p>
          <p>Please review this in the Admin Dashboard.</p>
        `,
      });
    }
  } catch (error) {
    console.error('Failed to send fraud alert:', error.message);
    // Non-blocking — don't throw
  }
};

/**
 * Send verification result notification to verifier.
 */
const sendVerificationResult = async (userId, result, certificateId) => {
  try {
    const user = await User.findById(userId).select('email name');
    if (!user) return;

    const emoji = result === 'valid' ? '✅' : result === 'suspicious' ? '⚠️' : '❌';
    await sendEmail({
      to: user.email,
      subject: `${emoji} Verification Result — ${result.toUpperCase()}`,
      html: `
        <p>Hello <b>${user.name}</b>,</p>
        <p>Verification result for certificate <b>${certificateId}</b>: <b>${result.toUpperCase()}</b></p>
        <p>Login to your dashboard for detailed report.</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification notification:', error.message);
  }
};

module.exports = { sendFraudAlert, sendVerificationResult };