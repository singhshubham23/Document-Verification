#!/usr/bin/env node
/**
 * HealBharat Setup Script
 * Initializes and validates the full integration of OCR + Blockchain
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  title: (msg) =>
    console.log(
      `\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`,
    ),
  section: (msg) => console.log(`\n${colors.cyan}➜ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`  ${msg}`),
};

const projectRoot = path.join(__dirname, "../..");
const backendDir = path.join(projectRoot, "backend");
const ocrDir = path.join(projectRoot, "ocr-service");
const blockchainDir = path.join(projectRoot, "blockchain");

const pythonCmd = process.platform === "win32" ? "python" : "python3";
const pipCmd = process.platform === "win32" ? "pip" : "pip3";

log.title();
log.section("HealBharat Integration Setup");

// Check directory structure
log.section("Checking project structure...");
const requiredDirs = {
  Backend: backendDir,
  "OCR Service": ocrDir,
  Blockchain: blockchainDir,
};

for (const [name, dir] of Object.entries(requiredDirs)) {
  if (fs.existsSync(dir)) {
    log.success(`${name} found: ${dir}`);
  } else {
    log.error(`${name} not found: ${dir}`);
    process.exit(1);
  }
}

// Check Node.js version
log.section("Checking Node.js version...");
try {
  const nodeVersion = execSync("node --version", { encoding: "utf-8" }).trim();
  log.success(`Node.js ${nodeVersion} detected`);
} catch (err) {
  log.error("Node.js not found. Please install Node.js 14+");
  process.exit(1);
}

// Check Python version (for local OCR)
log.section("Checking Python installation...");
try {
  const pythonVersion = execSync(`${pythonCmd} --version`, {
    encoding: "utf-8",
  }).trim();
  log.success(`${pythonVersion} detected`);
} catch (err) {
  log.warn(
    `${pythonCmd} not found. Local OCR mode will not work (HTTP mode required)`,
  );
}

// Install backend dependencies
log.section("Installing backend dependencies...");
try {
  execSync("npm install", { cwd: backendDir, stdio: "inherit" });
  log.success("Backend dependencies installed");
} catch (err) {
  log.error("Failed to install backend dependencies");
  process.exit(1);
}

// Install blockchain dependencies
log.section("Installing blockchain dependencies...");
try {
  execSync("npm install", { cwd: blockchainDir, stdio: "inherit" });
  log.success("Blockchain dependencies installed");
} catch (err) {
  log.error("Failed to install blockchain dependencies");
  process.exit(1);
}

// Install Python OCR dependencies
log.section("Installing Python OCR dependencies...");
try {
  const requirementsFile = path.join(ocrDir, "requirements.txt");
  if (fs.existsSync(requirementsFile)) {
    execSync(`${pipCmd} install -r requirements.txt`, {
      cwd: ocrDir,
      stdio: "inherit",
    });
    log.success("Python OCR dependencies installed");
  } else {
    log.warn("requirements.txt not found in ocr-service/");
  }
} catch (err) {
  log.warn("Failed to install Python dependencies. Ensure pip is installed.");
}

// Check for .env file
log.section("Checking environment configuration...");
const envFile = path.join(backendDir, ".env");
const envExampleFile = path.join(backendDir, ".env.example");

if (!fs.existsSync(envFile)) {
  if (fs.existsSync(envExampleFile)) {
    log.warn(".env file not found. Copying from .env.example...");
    fs.copyFileSync(envExampleFile, envFile);
    log.success(".env created. Edit it with your configuration.");
  } else {
    log.error(".env.example not found");
  }
} else {
  log.success(".env file exists");
}

// Validate blockchain setup
log.section("Checking blockchain setup...");
const blockchainEnv = path.join(blockchainDir, ".env");
if (!fs.existsSync(blockchainEnv)) {
  log.warn("Blockchain .env not found. You need to:");
  log.info("1. Create blockchain/.env with your wallet private key");
  log.info("2. Run: cd blockchain && npm run deploy:amoy");
  log.info("3. Copy CONTRACT_ADDRESS to backend/.env");
} else {
  log.success("Blockchain .env exists");
}

// Check OCR service dependencies
log.section("Validating OCR service...");
try {
  // Try to check if pytesseract is available
  execSync(`${pythonCmd} -c "import pytesseract; import cv2; import pdf2image"`, {
    stdio: "pipe",
  });
  log.success("All OCR Python dependencies available");
} catch (err) {
  log.warn("Some Python OCR dependencies might be missing.");
  log.info("Run: pip install -r ocr-service/requirements.txt");
}

// Final checklist
log.section("Setup Checklist");
const checklist = [
  {
    item: "Node.js installed",
    check: fs.existsSync(path.join(backendDir, "node_modules")),
  },
  {
    item: "Backend dependencies installed",
    check: fs.existsSync(path.join(backendDir, "node_modules", "express")),
  },
  {
    item: ".env file configured",
    check: fs.existsSync(envFile),
  },
  {
    item: "MongoDB URI configured in .env",
    check:
      fs.existsSync(envFile) &&
      fs.readFileSync(envFile, "utf-8").includes("MONGO_URI"),
  },
  {
    item: "Blockchain .env present",
    check: fs.existsSync(blockchainEnv),
  },
];

checklist.forEach(({ item, check }) => {
  if (check) {
    log.success(item);
  } else {
    log.warn(item);
  }
});

// Print next steps
log.title();
log.section("Next Steps");
log.info("");
log.info("1️⃣  Configure your environment:");
log.info("   - Edit backend/.env with your MongoDB URI, JWT secret, etc.");
log.info("");
log.info("2️⃣  Deploy smart contract (if not done):");
log.info("   cd blockchain");
log.info("   npm run deploy:amoy    # For Polygon Amoy testnet");
log.info("   # Add the CONTRACT_ADDRESS output to backend/.env");
log.info("");
log.info("3️⃣  Choose OCR mode in backend/.env:");
log.info("   - OCR_MODE=http        # Use external FastAPI service");
log.info("   - OCR_MODE=local       # Use local Python execution");
log.info("");
log.info("4️⃣  Start the services:");
log.info("");
log.info("   Option A: Using HTTP OCR (external service)");
log.info("   Terminal 1: cd ocr-service && python main.py");
log.info("   Terminal 2: cd backend && npm start");
log.info("");
log.info("   Option B: Using LOCAL OCR (no separate service)");
log.info("   Terminal 1: cd backend && npm start");
log.info("");
log.info("5️⃣  Verify the integration:");
log.info("   curl http://localhost:5000/api/health");
log.info("   curl http://localhost:5000/api/health/blockchain");
log.info("   curl http://localhost:5000/api/health/ocr");
log.info("");
log.info("6️⃣  Start the frontend:");
log.info("   cd frontend && npm run dev");
log.info("");
log.success("Setup complete! Follow the steps above to run the system.");
log.title();
