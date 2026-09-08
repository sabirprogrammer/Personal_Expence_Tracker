// Ye database maintenance script collections register reset validation handle karti hai.
// Isme tables format drops, default seed indexes triggers, and environment checks setup hain.
// Ye console utility ya package script triggers par MongoDB database fresh seed structure clean setup karti hai.

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: reset-db cannot be run in production environment.');
  process.exit(1);
}

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { DEFAULT_CATEGORIES } = require('../seed/seeder');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

async function resetAndSeed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Clearing all collections...');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Transaction.deleteMany({})
    ]);
    console.log('Collections cleared.');

    // Seed categories
    await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name, status: 'active' })));
    console.log('- Categories seeded.');

    // Get credentials from environment variables
    const ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Seed admin user
    const hashedAdminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedAdminPassword,
      role: 'admin',
      status: 'active',
      gender: 'other',
      country: 'pk'
    }).save();
    console.log(`- Admin account created: ${ADMIN_EMAIL}`);

    console.log('\nDatabase reset and re-seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

resetAndSeed();
