const crypto = require('crypto');

/**
 * Generate a deterministic SHA-256 hash of certificate core data.
 * This hash is stored on-chain and used for tamper detection.
 */
const hashCertificate = (data) => {
  const canonical = JSON.stringify({
    studentName: data.studentName?.toLowerCase().trim(),
    rollNumber: data.rollNumber?.trim(),
    course: data.course?.toLowerCase().trim(),
    institutionId: data.institutionId?.toString(),
    issueDate: data.issueDate?.toString(),
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

/**
 * Verify a digital signature against the public key
 */
const verifySignature = (data, signature, publicKey) => {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(JSON.stringify(data));
    return verify.verify(publicKey, signature, 'hex');
  } catch {
    return false;
  }
};

module.exports = { hashCertificate, verifySignature };