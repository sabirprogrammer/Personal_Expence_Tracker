/**
 * formatters.js
 * Shared data-formatting utilities for controllers.
 */

/**
 * Formats a Mongoose Transaction document into a plain object
 * suitable for sending to the frontend.
 * @param {import('../models/Transaction')} t - Transaction document
 * @returns {Object}
 */
function formatTransaction(t) {
  return {
    id: t._id.toString(),
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date ? t.date.toISOString().split('T')[0] : '',
    description: t.description
  };
}

module.exports = { formatTransaction };
