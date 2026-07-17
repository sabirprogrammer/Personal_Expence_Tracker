const Transaction = require('../models/Transaction');
const { formatTransaction } = require('../utils/formatters');

async function getTransactions(req, res) {
  try {
    const { search, type, category, sort } = req.query || {};
    const query = { userId: req.user._id };

    if (type) {
      query.type = { $regex: new RegExp(`^${type}$`, 'i') };
    }

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Push text search into DB query for better performance
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    const sortMap = {
      'date-newest': { date: -1, createdAt: -1 },
      'date-oldest': { date: 1, createdAt: 1 },
      'amount-high': { amount: -1 },
      'amount-low':  { amount: 1 }
    };
    const sortOrder = sortMap[sort] || { date: -1, createdAt: -1 };

    const transactions = await Transaction.find(query).sort(sortOrder);
    res.json(transactions.map(formatTransaction));
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving transactions', error: err.message });
  }
}

async function getTransactionById(req, res) {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(formatTransaction(transaction));
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving transaction', error: err.message });
  }
}

async function addTransaction(req, res) {
  try {
    const { type, amount, category, date, description } = req.body || {};

    if (!type || amount === undefined || amount === null || !category || !date) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const normalizedType = type.toLowerCase();
    if (normalizedType !== 'income' && normalizedType !== 'expense') {
      return res.status(400).json({ message: 'Transaction type must be income or expense' });
    }

    const newTransaction = new Transaction({
      userId: req.user._id,
      type: normalizedType === 'income' ? 'Income' : 'Expense',
      amount: numAmount,
      category,
      date,
      description: description || ''
    });

    await newTransaction.save();
    res.status(201).json(formatTransaction(newTransaction));
  } catch (err) {
    res.status(500).json({ message: 'Error adding transaction', error: err.message });
  }
}

async function updateTransaction(req, res) {
  try {
    const { type, amount, category, date, description } = req.body || {};
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }
      transaction.amount = numAmount;
    }

    if (type !== undefined) {
      const normalizedType = type.toLowerCase();
      if (normalizedType !== 'income' && normalizedType !== 'expense') {
        return res.status(400).json({ message: 'Transaction type must be income or expense' });
      }
      transaction.type = normalizedType === 'income' ? 'Income' : 'Expense';
    }

    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = date;
    if (description !== undefined) transaction.description = description;

    await transaction.save();
    res.json(formatTransaction(transaction));
  } catch (err) {
    res.status(500).json({ message: 'Error updating transaction', error: err.message });
  }
}

async function deleteTransaction(req, res) {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting transaction', error: err.message });
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction
};