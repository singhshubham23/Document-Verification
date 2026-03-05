/**
 * OCR Service Integration
 * Supports:
 * 1. Local Python execution (via child_process)
 * 2. External FastAPI service (via HTTP)
 * 3. Fallback mechanisms
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { spawn } = require("child_process");
const { promisify } = require("util");

const OCR_MODE = process.env.OCR_MODE || "http"; // 'local' or 'http'
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://localhost:8000";
const PYTHON_PATH = process.env.PYTHON_PATH || "python";
const OCR_SERVICE_PATH =
  process.env.OCR_SERVICE_PATH || path.join(__dirname, "../../ocr-service");

/**
 * Call OCR service via HTTP (external FastAPI service)
 */
const callOCRServiceViaHTTP = async (filePath) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(`${OCR_SERVICE_URL}/extract`, form, {
      headers: { ...form.getHeaders() },
      timeout: 60000,
    });

    return response.data;
  } catch (error) {
    console.error("OCR HTTP call failed:", error.message);
    throw new Error(`OCR service error: ${error.message}`);
  }
};

/**
 * Call OCR service locally via Python subprocess
 */
const callOCRServiceLocal = async (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // Prepare the Python command
      const pythonScript = path.join(OCR_SERVICE_PATH, "extract_local.py");
      if (!fs.existsSync(pythonScript)) {
        return reject(
          new Error("Local OCR script not found. Run integration setup."),
        );
      }

      const process = spawn(PYTHON_PATH, [pythonScript, filePath], {
        cwd: OCR_SERVICE_PATH,
        timeout: 120000, // 2 minutes timeout
      });

      let output = "";
      let errorOutput = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (code !== 0) {
          console.error("Python OCR stderr:", errorOutput);
          return reject(
            new Error(`OCR process failed with code ${code}: ${errorOutput}`),
          );
        }

        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Invalid OCR output: ${e.message}`));
        }
      });

      process.on("error", (err) => {
        reject(new Error(`Failed to spawn OCR process: ${err.message}`));
      });
    } catch (error) {
      reject(new Error(`Local OCR setup error: ${error.message}`));
    }
  });
};

/**
 * Main OCR extraction function with fallback mechanism
 */
const extractCertificateData = async (filePath, options = {}) => {
  const fallbackMode = options.fallback || true;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    console.log(`[OCR] Extracting data using ${OCR_MODE} mode...`);

    if (OCR_MODE === "local") {
      return await callOCRServiceLocal(filePath);
    } else {
      return await callOCRServiceViaHTTP(filePath);
    }
  } catch (primaryError) {
    console.warn(
      `[OCR] Primary mode (${OCR_MODE}) failed:`,
      primaryError.message,
    );

    // Fallback to alternate mode
    if (fallbackMode) {
      try {
        const alternateMode = OCR_MODE === "local" ? "http" : "local";
        console.log(`[OCR] Attempting fallback via ${alternateMode} mode...`);

        if (alternateMode === "local") {
          return await callOCRServiceLocal(filePath);
        } else {
          return await callOCRServiceViaHTTP(filePath);
        }
      } catch (fallbackError) {
        console.error(`[OCR] Fallback also failed:`, fallbackError.message);
        throw new Error(
          `OCR extraction failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`,
        );
      }
    }

    throw primaryError;
  }
};

/**
 * Health check for OCR service
 */
const checkOCRHealth = async () => {
  try {
    if (OCR_MODE === "local") {
      const scriptPath = path.join(OCR_SERVICE_PATH, "main.py");
      return fs.existsSync(scriptPath)
        ? { healthy: true, mode: "local", message: "Local OCR ready" }
        : {
            healthy: false,
            mode: "local",
            message: "Local OCR script not found",
          };
    } else {
      const response = await axios.get(`${OCR_SERVICE_URL}/health`, {
        timeout: 5000,
      });
      return {
        healthy: true,
        mode: "http",
        message: response.data?.service || "OCR service running",
      };
    }
  } catch (error) {
    return { healthy: false, mode: OCR_MODE, message: error.message };
  }
};

module.exports = {
  extractCertificateData,
  checkOCRHealth,
  callOCRServiceLocal,
  callOCRServiceViaHTTP,
};
