/**
 * OCR Utility - Wrapper for extracting certificate data
 * Uses the integrated OcrService with fallback support
 */

const { extractCertificateData, checkOCRHealth } = require("./OcrService");

/**
 * Call OCR service to extract certificate data from file
 * @param {string} filePath - Path to certificate file (jpg, png, pdf)
 * @returns {Promise<object>} - Extracted certificate data
 */
const callOCRService = async (filePath) => {
  return extractCertificateData(filePath, { fallback: true });
};

/**
 * Validate OCR health & connectivity
 * @returns {Promise<object>} - Health status info
 */
const validateOCRHealth = async () => {
  return checkOCRHealth();
};

module.exports = { callOCRService, validateOCRHealth };
