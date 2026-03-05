require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);

const apiLimiter = rateLimit({
  windowMs: 45 * 60 * 1000, // 45 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/AuthRoutes"));
app.use("/api/certificates", require("./routes/CertificateRoutes"));
app.use("/api/verification", require("./routes/VerificationRoutes"));
app.use("/api/admin", require("./routes/AdminRoutes"));

const {
  institutionRouter,
  fraudRouter,
} = require("./routes/InstitutionRoutes");

app.use("/api/institutions", institutionRouter);
app.use("/api/fraud", fraudRouter);

// ── Health Check Endpoints ─────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const {
      isBlockchainEnabled,
      checkBlockchainHealth,
    } = require("./utils/BlockchainUtil");
    const { checkOCRHealth } = require("./utils/OcrService");

    const mongoConnected = mongoose.connection.readyState === 1;
    const blockchainEnabled = isBlockchainEnabled();

    let blockchainHealth = {
      healthy: false,
      message: "Blockchain not enabled",
    };
    let ocrHealth = { healthy: false, message: "OCR not available" };

    if (blockchainEnabled) {
      try {
        blockchainHealth = await checkBlockchainHealth();
      } catch (err) {
        blockchainHealth = { healthy: false, message: err.message };
      }
    }

    try {
      ocrHealth = await checkOCRHealth();
    } catch (err) {
      ocrHealth = { healthy: false, message: err.message };
    }

    res.status(200).json({
      success: true,
      message: "HealBharat API is running",
      timestamp: new Date(),
      services: {
        database: { healthy: mongoConnected },
        blockchain: blockchainHealth,
        ocr: ocrHealth,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: err.message,
    });
  }
});

app.get("/api/health/blockchain", async (req, res) => {
  try {
    const {
      isBlockchainEnabled,
      checkBlockchainHealth,
    } = require("./utils/BlockchainUtil");

    if (!isBlockchainEnabled()) {
      return res.status(503).json({
        success: false,
        message: "Blockchain not configured",
      });
    }

    const health = await checkBlockchainHealth();
    res.json({ success: true, ...health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/health/ocr", async (req, res) => {
  try {
    const { checkOCRHealth } = require("./utils/OcrService");
    const health = await checkOCRHealth();
    res.json({ success: true, ...health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Test Endpoints ─────────────────────────────────────────────────

app.get("/api/test/blockchain", async (req, res) => {
  try {
    const {
      isBlockchainEnabled,
      storeCertificateOnChain,
      verifyBlockchainHash,
    } = require("./utils/BlockchainUtil");

    if (!isBlockchainEnabled()) {
      return res.status(503).json({
        success: false,
        message:
          "Blockchain not configured. Set BLOCKCHAIN_RPC_URL, CONTRACT_ADDRESS, and BLOCKCHAIN_PRIVATE_KEY.",
      });
    }

    // Store a dummy cert
    const txnId = await storeCertificateOnChain("TEST-001", "a".repeat(64));

    // Verify it back
    const isValid = await verifyBlockchainHash("TEST-001", "a".repeat(64));

    res.json({
      success: true,
      txnId,
      isValid,
      message: "Blockchain integration working!",
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/test/ocr", async (req, res) => {
  try {
    const { checkOCRHealth } = require("./utils/OcrService");
    const health = await checkOCRHealth();

    if (!health.healthy) {
      return res.status(503).json({ success: false, ...health });
    }

    res.json({ success: true, ...health, message: "OCR service is ready!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`\n📊 Service Status Endpoints:`);
      console.log(`  - GET /api/health (full status)`);
      console.log(`  - GET /api/health/blockchain (blockchain only)`);
      console.log(`  - GET /api/health/ocr (OCR only)`);
      console.log(`\n🧪 Test Endpoints:`);
      console.log(`  - GET /api/test/blockchain`);
      console.log(`  - POST /api/test/ocr`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
