const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config();

console.log('SMTP Configuration:');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('Pass:', process.env.SMTP_PASS ? '[SET]' : '[NOT SET]');
console.log('From:', process.env.SMTP_FROM);

// Check if email is enabled
const emailEnabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
console.log('Email Enabled:', emailEnabled);

if (emailEnabled) {
  // Configure transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.log('SMTP Connection Error:', error.message);
    } else {
      console.log('SMTP Server is ready to take our messages');
    }
  });
} else {
  console.log('Email service is disabled due to missing configuration');
}