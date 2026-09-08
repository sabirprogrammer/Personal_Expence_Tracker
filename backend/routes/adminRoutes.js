// Ye file Admin access ke routing control maps configure karti hai.
// Isme authentication verify karne wale check middlewares apply hone ke baad user management aur global PDF generation API register hain.
// Ye admin dashboard views ko /api/admin relative URL paths provide karti hai.

const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUser,
  deleteUser,
  getAdminTransactions,
  deleteAdminTransaction,
  getAdminReports,
  getAdminExportPDF
} = require('../controllers/adminController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// All admin routes require authentication and admin authorization
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// User management
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Transaction monitoring
router.get('/transactions', getAdminTransactions);
router.delete('/transactions/:id', deleteAdminTransaction);

// Analytics reports
router.get('/reports/export-pdf', getAdminExportPDF);
router.get('/reports', getAdminReports);

module.exports = router;
