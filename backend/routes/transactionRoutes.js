// Ye file transactions endpoints maps manage karti hai.
// Isme individual add, list, delete, edit APIs aur static parameter routing bypass PDF report generation endpoint links set hain.
// Ye user ledger account logs management delete and editing events mapping support karta hai.

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

const {
  getTransactions,
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getExportPDF
} = require('../controllers/transactionController');

// All transactions routes require user authentication
router.use(authenticateUser);

router.use((req, res, next) => {
  console.log(`[Transaction Route] ${req.method} ${req.url} - originalUrl: ${req.originalUrl}`);
  next();
});

router.get('/', getTransactions);
router.get('/export-pdf', getExportPDF);
router.get('/:id', getTransactionById);
router.post('/', addTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;