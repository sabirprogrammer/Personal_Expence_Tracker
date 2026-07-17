const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUser,
  deleteUser,
  getAdminTransactions,
  deleteAdminTransaction,
  getAdminReports
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
router.get('/reports', getAdminReports);

module.exports = router;
