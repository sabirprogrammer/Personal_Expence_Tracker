// Ye file Category options and modification maps route actions set karti hai.
// Isme GET, POST, PUT, aur DELETE categories methods ko authenticate controllers ke sath link kiya gaya hai.
// Ye admin/user categories management dynamically handle karne ke liye route map setup hai.

const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// All category routes require authentication
router.use(authenticateUser);

router.get('/', getCategories);
router.post('/', authorizeRoles('admin'), createCategory);
router.put('/:id', authorizeRoles('admin'), updateCategory);
router.delete('/:id', authorizeRoles('admin'), deleteCategory);

module.exports = router;
