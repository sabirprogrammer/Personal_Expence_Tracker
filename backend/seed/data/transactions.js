/**
 * transactions.js
 * Seed data — initial transactions for the default demo user.
 */

const transactions = [
  { type: 'Income',  amount: 5000, category: 'Salary',        date: '2026-06-01', description: 'Monthly Salary' },
  { type: 'Expense', amount: 500,  category: 'Food',           date: '2026-06-02', description: 'Lunch' },
  { type: 'Expense', amount: 200,  category: 'Transport',      date: '2026-06-03', description: 'Bus Fare' },
  { type: 'Income',  amount: 2000, category: 'Freelance',      date: '2026-06-05', description: 'Website Project' },
  { type: 'Expense', amount: 1000, category: 'Bills',          date: '2026-06-07', description: 'Electricity Bill' },
  { type: 'Expense', amount: 1500, category: 'Rent',           date: '2026-06-08', description: 'Apartment Rent' },
  { type: 'Expense', amount: 300,  category: 'Groceries',      date: '2026-06-10', description: 'Weekly Groceries' },
  { type: 'Income',  amount: 1200, category: 'Freelance',      date: '2026-06-12', description: 'Performance Bonus' },
  { type: 'Expense', amount: 150,  category: 'Entertainment',  date: '2026-06-15', description: 'Movie tickets' }
];

module.exports = transactions;
