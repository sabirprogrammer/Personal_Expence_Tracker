/**
 * seeder.js
 * Database seeding logic — runs once on application startup.
 * Seeds default categories, admin account, default user, and sample transactions.
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const initialTransactions = require('./data/transactions');

const DEFAULT_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift',
  'Food', 'Groceries', 'Transport', 'Fuel', 'Shopping',
  'Clothing', 'Electronics', 'Bills', 'Rent', 'Insurance',
  'Healthcare', 'Education', 'Entertainment', 'Travel',
  'Subscription', 'Other'
];

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // 1. Seed default categories (skip if already exists)
    for (const catName of DEFAULT_CATEGORIES) {
      const exists = await Category.findOne({ name: catName });
      if (!exists) {
        await Category.create({ name: catName, status: 'active' });
      }
    }
    console.log('- Default categories verified/seeded');

    // 2. Seed admin account (skip if already exists)
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      adminUser = new User({
        name: 'System Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        gender: 'other',
        country: 'pk'
      });
      await adminUser.save();
      console.log('- Default administrator created (admin@example.com / Admin@123)');
    } else {
      console.log('- Administrator account already exists');
    }

    // 3. Seed default user account (skip if already exists)
    let defaultUser = await User.findOne({ email: 'user@example.com' });
    if (!defaultUser) {
      const hashedPassword = await bcrypt.hash('User@123', 10);
      defaultUser = new User({
        name: 'Default User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        status: 'active',
        gender: 'male',
        country: 'pk'
      });
      await defaultUser.save();
      console.log('- Default user created (user@example.com / User@123)');
    } else {
      console.log('- Default user account already exists');
    }

    // 4. Seed sample transactions for the default user (only if DB is empty)
    const transactionCount = await Transaction.countDocuments();
    if (transactionCount < initialTransactions.length) {
      await Transaction.deleteMany({});
      const seedTransactions = initialTransactions.map(t => ({ ...t, userId: defaultUser._id }));
      await Transaction.insertMany(seedTransactions);
      console.log(`- Seeded ${seedTransactions.length} sample transactions for user@example.com`);
    }

    console.log('Seeding complete.\n');
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

module.exports = { seedDatabase, DEFAULT_CATEGORIES };
