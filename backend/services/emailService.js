/**
 * emailService.js
 * Service handling email notifications using Nodemailer.
 * In development, falls back to logging emails to standard output.
 */

const nodemailer = require('nodemailer');

async function sendResetEmail(to, name, resetLink) {
  try {
    // Attempt to load SMTP credentials from environment
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || null,
        pass: process.env.SMTP_PASS || null
      }
    });

    const mailOptions = {
      from: '"ExpenseTracker Support" <noreply@expensetracker.com>',
      to,
      subject: 'Password Recovery Link — ExpenseTracker',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Password Recovery Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to recover your password. Please click the recovery button below to set a new password. This link is valid for 15 minutes.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #8854d0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Recover Password</a>
          </p>
          <p>If you cannot click the button, copy and paste this link in your browser:</p>
          <p>${resetLink}</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">If you did not request password recovery, you can safely ignore this email.</p>
        </div>`
    };

    // If no credentials configured, log recovery details to the terminal
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n======================================================');
      console.log('📬 [EMAIL SIMULATOR] Outgoing Recovery Mail');
      console.log('To:', to);
      console.log('Name:', name);
      console.log('Link:', resetLink);
      console.log('======================================================\n');
      return true;
    }

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email delivery failure:', error.message);
    throw error;
  }
}

module.exports = { sendResetEmail };
