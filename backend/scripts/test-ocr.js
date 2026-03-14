#!/usr/bin/env node
/**
 * OCR Service Test Script
 * Tests the OCR integration with HTTP and local modes
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { spawn } = require("child_process");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

const log = {
  section: (msg) => console.log(`\n${colors.cyan}> ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}OK ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}ERR ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}WARN ${msg}${colors.reset}`),
};

async function testOCRHTTP() {
  log.section("Testing HTTP OCR Service");
  try {
    const response = await axios.get("http://localhost:8000/health", {
      timeout: 5000,
    });
    log.success("HTTP OCR service is running");
    console.log(`  Service: ${response.data.service}`);
    return true;
  } catch (err) {
    log.warn(`HTTP OCR service not available: ${err.message}`);
    return false;
  }
}

async function testOCRLocal() {
  log.section("Testing Local OCR Service");
  return new Promise((resolve) => {
    const testScript = path.join(
      __dirname,
      "../../ocr-service/extract_local.py",
    );
    if (!fs.existsSync(testScript)) {
      log.error("Local OCR script not found");
      resolve(false);
      return;
    }

    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const process = spawn(pythonCmd, ["--version"]);
    process.on("close", (code) => {
      if (code === 0) {
        log.success(`${pythonCmd} is available for local OCR`);
        resolve(true);
      } else {
        log.warn(`${pythonCmd} not found`);
        resolve(false);
      }
    });
    process.on("error", (err) => {
      log.error(`Local OCR test failed: ${err.message}`);
      resolve(false);
    });
  });
}

async function testBackendOCRIntegration() {
  log.section("Testing Backend OCR Integration");
  try {
    const response = await axios.post(
      "http://localhost:5000/api/test/ocr",
      {},
      { timeout: 5000 },
    );
    if (response.data.success) {
      log.success("Backend OCR integration is working");
      console.log(`  Mode: ${response.data.mode}`);
      console.log(`  Message: ${response.data.message}`);
      return true;
    }
  } catch (err) {
    log.warn(`Backend not available or not responding: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("\nOCR Service Test Suite\n");

  const httpOK = await testOCRHTTP();
  const localOK = await testOCRLocal();
  const integrationOK = await testBackendOCRIntegration();

  log.section("Test Summary");
  console.log(
    `  HTTP Mode:        ${httpOK ? colors.green + "OK" + colors.reset : colors.yellow + "X" + colors.reset}`,
  );
  console.log(
    `  Local Mode:       ${localOK ? colors.green + "OK" + colors.reset : colors.yellow + "X" + colors.reset}`,
  );
  console.log(
    `  Integration:      ${integrationOK ? colors.green + "OK" + colors.reset : colors.yellow + "X" + colors.reset}`,
  );

  if (!httpOK && !localOK) {
    log.error("No OCR mode is available. Please:");
    console.log(
      "  - For HTTP: Start ocr-service with: cd ocr-service && python main.py",
    );
    console.log(
      "  - For Local: Ensure Python/Python3 and OCR dependencies are installed",
    );
    process.exit(1);
  } else {
    log.success("At least one OCR mode is available!");
  }
}

main().catch(console.error);


