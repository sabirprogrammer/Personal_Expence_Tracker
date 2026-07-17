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
