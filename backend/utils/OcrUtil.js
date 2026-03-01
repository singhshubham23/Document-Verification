const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const OCR_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000';

const callOCRService = async (filePath) => {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath)); // ← 'file' not 'certificate'

  const response = await axios.post(`${OCR_URL}/extract`, form, {
    headers: { ...form.getHeaders() },
    timeout: 30000,
  });

  return response.data;
};

module.exports = { callOCRService };