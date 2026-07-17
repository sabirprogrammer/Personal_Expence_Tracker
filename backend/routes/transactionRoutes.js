const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

const {
  getTransactions,
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

// All transactions routes require user authentication
router.use(authenticateUser);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', addTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;