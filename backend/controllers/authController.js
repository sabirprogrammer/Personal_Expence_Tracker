const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Utility to set HTTP-only cookie containing JWT token.
 */
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

async function register(req, res) {
  try {
    const { fullname, email, password, gender, dob, country } = req.body || {};

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: fullname,
      email: email.toLowerCase(),
      password: hashedPassword,
      gender: gender || '',
      dob: dob ? new Date(dob) : null,
      country: country || '',
      role: 'user',
      status: 'active'
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        profileImage: newUser.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving profile', error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, email, gender, dob, country, profileImage, currentPassword, newPassword } = req.body || {};
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob ? new Date(dob) : null;
    if (country !== undefined) user.country = country;

    // Handle profile image file system storage instead of raw base64 db storage
    if (profileImage !== undefined) {
      if (profileImage && profileImage.startsWith('data:image/')) {
        const matches = profileImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const extension = mimeType.split('/')[1] || 'png';
          const imageBuffer = Buffer.from(matches[2], 'base64');
          
          const filename = `profile_${user._id}_${Date.now()}.${extension}`;
          const relativePath = `/uploads/profiles/${filename}`;
          const absolutePath = path.join(__dirname, '..', 'uploads', 'profiles', filename);
          
          // Save file to disk
          fs.writeFileSync(absolutePath, imageBuffer);
          
          // Delete old local file if exists
          if (user.profileImage && user.profileImage.startsWith('/uploads/profiles/')) {
            const oldFile = path.join(__dirname, '..', user.profileImage);
            if (fs.existsSync(oldFile)) {
              fs.unlinkSync(oldFile);
            }
          }
          
          user.profileImage = relativePath;
        }
      } else if (!profileImage) {
        // Clear profile image if null/empty
        if (user.profileImage && user.profileImage.startsWith('/uploads/profiles/')) {
          const oldFile = path.join(__dirname, '..', user.profileImage);
          if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
          }
        }
        user.profileImage = '';
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Safe generic message to prevent email enumeration/discovery
      return res.json({ message: 'If that email exists in our database, a recovery link has been sent.' });
    }

    // Generate short-lived (15-min) recovery token
    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    
    // Front-end link triggers reset passwords modal
    const resetLink = `http://127.0.0.1:5500/user/login.html?reset=${resetToken}`;
    
    const { sendResetEmail } = require('../services/emailService');
    await sendResetEmail(user.email, user.name, resetLink);

    res.json({ message: 'If that email exists in our database, a recovery link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Error processing forgot password request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired recovery link. Please try again.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting password' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword
};
