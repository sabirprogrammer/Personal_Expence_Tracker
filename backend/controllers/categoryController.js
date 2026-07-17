const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// GET /api/categories - Fetch categories
// Users see active categories, Admin sees all
async function getCategories(req, res) {
  try {
    const filter = req.user && req.user.role === 'admin' ? {} : { status: 'active' };
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving categories', error: err.message });
  }
}

// POST /api/categories - Create category (Admin only)
async function createCategory(req, res) {
  try {
    const { name, status } = req.body || {};
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    // Case-insensitive check
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const newCategory = new Category({
      name: trimmedName,
      status: status || 'active'
    });

    await newCategory.save();
    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (err) {
    res.status(500).json({ message: 'Error creating category', error: err.message });
  }
}

// PUT /api/categories/:id - Update category (Admin only)
async function updateCategory(req, res) {
  try {
    const { name, status } = req.body || {};
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name && name.trim() !== '') {
      const trimmedName = name.trim();
      // Case insensitive check other than this category
      const existing = await Category.findOne({
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      
      // Update name in transactions if name is changed?
      // Since transactions store category as string, we should either update transactions or just allow it.
      // Let's update all transactions using the old name to the new name to ensure database integrity!
      const oldName = category.name;
      category.name = trimmedName;
      await Transaction.updateMany({ category: oldName }, { category: trimmedName });
    }

    if (status !== undefined) {
      category.status = status;
    }

    await category.save();
    res.json({ message: 'Category updated successfully', category });
  } catch (err) {
    res.status(500).json({ message: 'Error updating category', error: err.message });
  }
}

// DELETE /api/categories/:id - Delete category (Admin only)
async function deleteCategory(req, res) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Prevent deleting categories currently in use
    const transactionExists = await Transaction.exists({ category: category.name });
    if (transactionExists) {
      return res.status(400).json({
        message: 'Cannot delete category. It is currently in use by one or more transactions.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category', error: err.message });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
