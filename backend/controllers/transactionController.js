// Ye file user transaction details (Income/Expense) add, fetch, update, delete aur PDF export manage karti hai.
// Isme query parameters (date/type sorting), positive bounds checks, index search logic, aur PDFKit reports formatting hai.
// Ye main frontend dashboard and transactions management views ko backend records serve karti hai.

const Transaction = require('../models/Transaction');
const { formatTransaction } = require('../utils/formatters');
const PDFDocument = require('pdfkit');

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

async function getExportPDF(req, res) {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="financial_report.pdf"');
    doc.pipe(res);

    // Document Title & Brand Info
    doc.fillColor('#a855f7')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('ExpenseTracker', 50, 50);

    doc.fillColor('#94a3b8')
       .fontSize(10)
       .font('Helvetica')
       .text('Smart Financial Reports & Analytics', 50, 75);

    doc.moveDown(1.5);
    
    // Draw divider line
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 95)
       .lineTo(550, 95)
       .stroke();
    
    doc.moveDown(1);

    // Summary calculations
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(t => {
      if (t.type.toLowerCase() === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }
    });
    const netBalance = totalIncome - totalExpenses;

    // Render Summary Block
    doc.fillColor('#0f172a')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Financial Summary:', 50, 115);

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#10b981')
       .text(`Total Income: Rs: ${totalIncome.toFixed(2)}`, 60, 135)
       .fillColor('#f43f5e')
       .text(`Total Expenses: Rs: ${totalExpenses.toFixed(2)}`, 240, 135)
       .fillColor(netBalance >= 0 ? '#10b981' : '#f43f5e')
       .text(`Net Balance: Rs: ${netBalance.toFixed(2)}`, 420, 135);

    doc.moveDown(2);

    // Table Header
    let y = 175;
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(10);
    
    doc.text('Date', 50, y);
    doc.text('Category', 150, y);
    doc.text('Type', 280, y);
    doc.text('Amount', 360, y);
    doc.text('Description', 440, y);

    // Divider under header
    doc.strokeColor('#94a3b8')
       .lineWidth(1)
       .moveTo(50, y + 15)
       .lineTo(550, y + 15)
       .stroke();

    y += 25;
    
    // Transaction Rows
    doc.font('Helvetica').fontSize(9);
    transactions.forEach(t => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.fillColor('#0f172a')
           .font('Helvetica-Bold')
           .fontSize(10);
        doc.text('Date', 50, y);
        doc.text('Category', 150, y);
        doc.text('Type', 280, y);
        doc.text('Amount', 360, y);
        doc.text('Description', 440, y);
        doc.strokeColor('#94a3b8').moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        y += 25;
        doc.font('Helvetica').fontSize(9);
      }

      const dateStr = t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A';
      const isIncome = t.type.toLowerCase() === 'income';

      doc.fillColor('#64748b').text(dateStr, 50, y);
      doc.fillColor('#0f172a').text(t.category, 150, y);
      doc.fillColor(isIncome ? '#10b981' : '#f43f5e').text(t.type, 280, y);
      doc.text(`Rs: ${t.amount.toFixed(2)}`, 360, y);
      doc.fillColor('#64748b').text(t.description || '-', 440, y, { width: 110, height: 15, ellipsis: true });

      doc.strokeColor('#f1f5f9')
         .lineWidth(0.5)
         .moveTo(50, y + 15)
         .lineTo(550, y + 15)
         .stroke();

      y += 22;
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Error generating PDF report', error: err.message });
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getExportPDF
};