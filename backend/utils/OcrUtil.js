const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const OCR_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000';

/**
 * Send the certificate file to the Python OCR microservice.
 * Returns extracted fields: { studentName, rollNumber, course, institution, marks, certificateId, issueDate }
 */
const callOCRService = async (filePath) => {
  const form = new FormData();
  form.append('certificate', fs.createReadStream(filePath));

  const response = await axios.post(`${OCR_URL}/extract`, form, {
    headers: { ...form.getHeaders() },
    timeout: 30000, // 30s timeout
  });

  return response.data; // { studentName, rollNumber, course, institution, marks, certificateId, issueDate, rawText }
};

module.exports = { callOCRService };