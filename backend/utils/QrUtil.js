const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const QR_DIR = process.env.UPLOAD_PATH
  ? path.join(process.env.UPLOAD_PATH, 'qrcodes')
  : './uploads/qrcodes';

if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

/**
 * Generate a QR code PNG for a certificate.
 * The QR payload embeds certificateId + hash so scanners can verify offline.
 *
 * @param {Object} certDoc  - Mongoose Certificate document
 * @returns {string}        - Relative file path to saved QR image
 */
const generateQRCode = async (certDoc) => {
  const payload = JSON.stringify({
    certificateId: certDoc.certificateId,
    hash: certDoc.certificateHash,
    issuedBy: certDoc.institutionId?.toString(),
    issuedAt: certDoc.issueDate,
  });

  const fileName = `qr-${certDoc.certificateId}.png`;
  const filePath = path.join(QR_DIR, fileName);

  await QRCode.toFile(filePath, payload, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 300,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  return filePath;
};

/**
 * Generate QR code as base64 data URL (for embedding in emails / PDFs)
 */
const generateQRCodeBase64 = async (certDoc) => {
  const payload = JSON.stringify({
    certificateId: certDoc.certificateId,
    hash: certDoc.certificateHash,
  });

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
  });
};

module.exports = { generateQRCode, generateQRCodeBase64 };