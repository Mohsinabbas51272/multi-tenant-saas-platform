const { transporter } = require('./mailer');

/**
 * Generic email sender using the unified SMTP transporter.
 * Used for tenant approvals, registrations, etc.
 */
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Platform Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    // Don't throw, just log to prevent breaking the calling flow
  }
};

module.exports = { sendEmail };
