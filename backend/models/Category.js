// Ye Mongoose Schema model file Category collections structure define karti hai.
// Isme category name aur unique indexing configurations mapped hain.
// Ye database level par unique categories validate aur save karne ke liye use hoti hai.

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
