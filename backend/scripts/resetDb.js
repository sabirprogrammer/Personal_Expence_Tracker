/**
 * resetDb.js
 * Utility script: wipes the database and re-seeds it with default data.
 * Run with: npm run reset-db
 *
 * CAUTION: This permanently deletes ALL data. Do NOT run in production.
 */

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
const initialTransactions = require('../seed/data/transactions');
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

    // Seed admin user
    const hashedAdminPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = await new User({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: hashedAdminPassword,
      role: 'admin',
      status: 'active',
      gender: 'other',
      country: 'pk'
    }).save();
    console.log('- Admin account created: admin@example.com / Admin@123');

    // Seed default user
    const hashedUserPassword = await bcrypt.hash('User@123', 10);
    const defaultUser = await new User({
      name: 'Default User',
      email: 'user@example.com',
      password: hashedUserPassword,
      role: 'user',
      status: 'active',
      gender: 'male',
      country: 'pk'
    }).save();
    console.log('- Default user created: user@example.com / User@123');

    // Seed transactions
    await Transaction.insertMany(
      initialTransactions.map(t => ({ ...t, userId: defaultUser._id }))
    );
    console.log(`- ${initialTransactions.length} sample transactions seeded.`);

    console.log('\nDatabase reset and re-seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

resetAndSeed();
