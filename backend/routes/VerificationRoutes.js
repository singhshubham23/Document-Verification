const express = require("express");
const router  = express.Router();
const {
  verifyById, verifyByUpload, verifyByQR,
  getHistory, getLog,
} = require("../controllers/VerificationController");
const { protect }  = require("../middleware/AuthMiddleware");
const upload       = require("../middleware/UploadMiddleware");
const {
  validateVerifyById, validateVerifyByQR, validatePagination,
} = require("../middleware/ValidationMiddleware");

router.use(protect);

router.post("/by-id",     validateVerifyById,  verifyById);
router.post("/by-upload", upload.single("certificate"), verifyByUpload);
router.post("/by-qr",     validateVerifyByQR,  verifyByQR);
router.get ("/history",   validatePagination,  getHistory);
router.get ("/:logId",    getLog);

module.exports = router;