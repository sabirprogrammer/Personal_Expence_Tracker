// Ye file admin panel ke dashboard actions ko handle karti hai.
// Isme system users retrieval, updates, status changes, analytics, aur global transaction activity processing hai.
// Ye controller direct database models ko call karke admin metrics provide karta hai.

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { formatTransaction } = require('../utils/formatters');
const PDFDocument = require('pdfkit');

// ── User Management ────────────────────────────────────────────

async function getUsers(req, res) {
  try {
    const { search, status, role } = req.query || {};
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (role) query.role = role;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const { name, role, status, email, password } = req.body || {};
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from disabling or demoting their own account
    if (userId === req.user._id.toString()) {
      if (status === 'disabled') {
        return res.status(400).json({ message: 'You cannot disable your own admin account.' });
      }
      if (role === 'user') {
        return res.status(400).json({ message: 'You cannot revoke your own administrator role.' });
      }
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      user.email = email.toLowerCase();
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({
      message: 'User updated successfully',
      user: { id: user._id, name: user.name, role: user.role, status: user.status, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role && user.role.toLowerCase() === 'admin') {
      return res.status(403).json({ message: 'Administrator accounts cannot be deleted.' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    // Cascade delete: remove all transactions belonging to this user
    await Transaction.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User and all associated transactions deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
}

// ── Transaction Monitoring ──────────────────────────────────────

async function getAdminTransactions(req, res) {
  try {
    const { search, type, category } = req.query || {};
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1, createdAt: -1 });

    // Filter by user name/email if search provided (post-populate)
    const filtered = search
      ? transactions.filter(t => {
          const userMatch = t.userId && (
            new RegExp(search, 'i').test(t.userId.name) ||
            new RegExp(search, 'i').test(t.userId.email)
          );
          return userMatch || (query.$or !== undefined);
        })
      : transactions;

    const formatted = filtered.map(t => ({
      ...formatTransaction(t),
      user: t.userId
        ? { id: t.userId._id.toString(), name: t.userId.name, email: t.userId.email }
        : { name: 'Unknown User', email: 'N/A' }
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving transactions', error: err.message });
  }
}

async function deleteAdminTransaction(req, res) {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully by administrator' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting transaction', error: err.message });
  }
}

// ── Reports & Analytics ─────────────────────────────────────────

async function getAdminReports(req, res) {
  try {
    const [totalUsers, activeUsers, inactiveUsers, totalTransactions, transactions, recentUsers, recentTransactionDocs] =
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'disabled' }),
        Transaction.countDocuments({}),
        Transaction.find({}),
        User.find({}).select('name email status createdAt').sort({ createdAt: -1 }).limit(5),
        Transaction.find({}).populate('userId', 'name').sort({ date: -1, createdAt: -1 }).limit(5)
      ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = {};
    const monthlyData = {};

    transactions.forEach(t => {
      const amt = t.amount || 0;
      const typeLower = t.type.toLowerCase();

      if (typeLower === 'income') {
        totalIncome += amt;
      } else if (typeLower === 'expense') {
        totalExpenses += amt;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      }

      if (t.date) {
        const monthKey = t.date.toISOString().substring(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        if (typeLower === 'income') {
          monthlyData[monthKey].income += amt;
        } else {
          monthlyData[monthKey].expenses += amt;
        }
      }
    });

    // Format recent transactions (fix: was incorrectly using .map() on a query)
    const recentTransactions = recentTransactionDocs.map(t => ({
      id: t._id,
      userName: t.userId ? t.userId.name : 'Unknown User',
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date ? t.date.toISOString().split('T')[0] : ''
    }));

    res.json({
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalTransactions,
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses
      },
      categoryStats: categoryTotals,
      monthlyReports: monthlyData,
      recentUsers,
      recentTransactions
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving system reports', error: err.message });
  }
}

async function getAdminExportPDF(req, res) {
  try {
    const transactions = await Transaction.find().sort({ date: -1 }).populate('userId', 'name email');

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="admin_system_report.pdf"');
    doc.pipe(res);

    // Document Title & Brand Info
    doc.fillColor('#f59e0b')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('ExpenseTracker - System Report', 50, 50);

    doc.fillColor('#94a3b8')
       .fontSize(10)
       .font('Helvetica')
       .text('Global Administrative System Transactions Logs', 50, 75);

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
       .text('System Summary:', 50, 115);

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#10b981')
       .text(`System Income: Rs: ${totalIncome.toFixed(2)}`, 60, 135)
       .fillColor('#f43f5e')
       .text(`System Expenses: Rs: ${totalExpenses.toFixed(2)}`, 240, 135)
       .fillColor(netBalance >= 0 ? '#10b981' : '#f43f5e')
       .text(`Net System Balance: Rs: ${netBalance.toFixed(2)}`, 420, 135);

    doc.moveDown(2);

    // Table Header
    let y = 175;
    doc.fillColor('#0f172a')
       .font('Helvetica-Bold')
       .fontSize(10);
    
    doc.text('Date', 50, y);
    doc.text('User', 130, y);
    doc.text('Category', 240, y);
    doc.text('Type', 340, y);
    doc.text('Amount', 400, y);
    doc.text('Description', 470, y);

    // Divider under header
    doc.strokeColor('#94a3b8')
       .lineWidth(1)
       .moveTo(50, y + 15)
       .lineTo(550, y + 15)
       .stroke();

    y += 25;
    
    // Transaction Rows
    doc.font('Helvetica').fontSize(8.5);
    transactions.forEach(t => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.fillColor('#0f172a')
           .font('Helvetica-Bold')
           .fontSize(10);
        doc.text('Date', 50, y);
        doc.text('User', 130, y);
        doc.text('Category', 240, y);
        doc.text('Type', 340, y);
        doc.text('Amount', 400, y);
        doc.text('Description', 470, y);
        doc.strokeColor('#94a3b8').moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        y += 25;
        doc.font('Helvetica').fontSize(8.5);
      }

      const dateStr = t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A';
      const isIncome = t.type.toLowerCase() === 'income';
      const userName = t.userId ? t.userId.name : 'Unknown';

      doc.fillColor('#64748b').text(dateStr, 50, y);
      doc.fillColor('#0f172a').text(userName, 130, y, { width: 100, height: 15, ellipsis: true });
      doc.text(t.category, 240, y, { width: 90, height: 15, ellipsis: true });
      doc.fillColor(isIncome ? '#10b981' : '#f43f5e').text(t.type, 340, y);
      doc.fillColor('#0f172a').text(`Rs: ${t.amount.toFixed(2)}`, 400, y);
      doc.fillColor('#64748b').text(t.description || '-', 470, y, { width: 80, height: 15, ellipsis: true });

      doc.strokeColor('#f1f5f9')
         .lineWidth(0.5)
         .moveTo(50, y + 15)
         .lineTo(550, y + 15)
         .stroke();

      y += 22;
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Error generating admin system PDF report', error: err.message });
  }
}

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getAdminTransactions,
  deleteAdminTransaction,
  getAdminReports,
  getAdminExportPDF
};
