const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

// Brute-force protection rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  message: { message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);

module.exports = router;
