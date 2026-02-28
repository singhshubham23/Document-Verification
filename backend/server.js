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
  })
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



app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HealBharat API is running",
    timestamp: new Date(),
  });
});


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.get("/api/test/blockchain", async (req, res) => {
  try {
    const { storeCertificateOnChain, verifyBlockchainHash } = require("./utils/BlockchainUtil");

    // Store a dummy cert
    const txnId = await storeCertificateOnChain("TEST-001", "a".repeat(64));

    // Verify it back
    const isValid = await verifyBlockchainHash("TEST-001", "a".repeat(64));

    res.json({ success: true, txnId, isValid });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
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
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();