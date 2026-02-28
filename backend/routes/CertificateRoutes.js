const express = require("express");
const router  = express.Router();
const {
  uploadCertificate, bulkUpload, getCertificates,
  getCertificate, revokeCertificate,
} = require("../controllers/CertificateController");
const { protect, authorize }    = require("../middleware/AuthMiddleware");
const upload                    = require("../middleware/UploadMiddleware");
const {
  validateUploadCertificate, validateBulkUpload,
  validateRevoke, validatePagination,
} = require("../middleware/ValidationMiddleware");

router.use(protect);

router.get("/",    authorize("institution", "admin"), validatePagination, getCertificates);
router.get("/:id", getCertificate);

router.post(
  "/",
  authorize("institution"),
  upload.single("certificate"),
  validateUploadCertificate,
  uploadCertificate
);

router.post("/bulk", authorize("institution", "admin"), validateBulkUpload, bulkUpload);

router.patch("/:id/revoke", authorize("institution", "admin"), validateRevoke, revokeCertificate);

module.exports = router;