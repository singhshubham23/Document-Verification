const express = require("express");
const router  = express.Router();
const {
  getDashboardStats, getAllUsers, toggleUserStatus,
  toggleBlacklist, getFraudReports, updateFraudReport, getAllLogs,
} = require("../controllers/AdminController");
const { protect, authorize } = require("../middleware/AuthMiddleware");
const {
  validateUpdateFraud, validatePagination,
} = require("../middleware/ValidationMiddleware");

router.use(protect, authorize("admin"));

router.get  ("/stats",                    getDashboardStats);
router.get  ("/users",                    validatePagination, getAllUsers);
router.patch("/users/:id/toggle",         toggleUserStatus);
router.patch("/institutions/:id/blacklist", toggleBlacklist);
router.get  ("/fraud",                    validatePagination, getFraudReports);
router.patch("/fraud/:id",                validateUpdateFraud, updateFraudReport);
router.get  ("/logs",                     validatePagination, getAllLogs);

module.exports = router;