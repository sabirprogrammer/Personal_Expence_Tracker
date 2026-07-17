/**
 * seeder.js
 * Database seeding logic — runs once on application startup.
 * Seeds default categories and admin account only.
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment'
];

async function seedDatabase() {
  try {
    // 1. Seed default categories (skip if already exists)
    for (const catName of DEFAULT_CATEGORIES) {
      const exists = await Category.findOne({ name: catName });
      if (!exists) {
        await Category.create({ name: catName, status: 'active' });
      }
    }

    // Get credentials from environment variables
    const ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

    // 2. Seed/Sync admin account (skip if already exists and matches)
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      adminUser = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        gender: 'other',
        country: 'pk'
      });
      await adminUser.save();
    } else {
      let updated = false;
      if (adminUser.name !== ADMIN_NAME) {
        adminUser.name = ADMIN_NAME;
        updated = true;
      }
      if (adminUser.email !== ADMIN_EMAIL) {
        adminUser.email = ADMIN_EMAIL;
        updated = true;
      }
      const isPasswordMatch = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password);
      if (!isPasswordMatch) {
        adminUser.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
        updated = true;
      }
      if (updated) {
        await adminUser.save();
      }
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

module.exports = { seedDatabase, DEFAULT_CATEGORIES };
