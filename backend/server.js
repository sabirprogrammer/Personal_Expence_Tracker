require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { seedDatabase } = require('./seed/seeder');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',')
  : ['http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: Request origin not allowed'));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Expose profile static uploads mapping
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directories exist on start
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'ExpenseTracker API is running.',
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      admin: '/api/admin',
      categories: '/api/categories'
    }
  });
});

// Sanitizing Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.message && err.message.startsWith('CORS Policy:')) {
    return res.status(403).json({ message: err.message });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error: please verify input format' });
  }

  res.status(500).json({ message: 'An internal server error occurred' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });