const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'expense_tracker_secret_key_12345';

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
}

async function authenticateUser(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact the administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Authentication error' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. You do not have permission to access this resource.' });
    }
    next();
  };
}

module.exports = {
  authenticateUser,
  authorizeRoles,
  JWT_SECRET
};
