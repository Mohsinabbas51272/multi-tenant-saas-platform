const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send order confirmation to customer
 */
const sendOrderConfirmation = async ({ customerEmail, customerName, orderId, items, total }) => {
  const itemsList = items.map(i => `<li>${i.product?.name || 'Product'} x${i.quantity} — $${parseFloat(i.price).toFixed(2)}</li>`).join('');
  await transporter.sendMail({
    from: `"Merchant Hub" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `✅ Order Confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#4f46e5;">Order Confirmed!</h2>
        <p>Hi <strong>${customerName}</strong>, thank you for your order.</p>
        <ul>${itemsList}</ul>
        <p style="font-size:1.2em;font-weight:bold;">Total: $${parseFloat(total).toFixed(2)}</p>
        <p style="color:#888;font-size:0.85em;">Order ID: ${orderId}</p>
        <p>We'll notify you when your order is shipped. 🚚</p>
      </div>
    `
  });
};

/**
 * Send order status update to customer
 */
const sendOrderStatusUpdate = async ({ customerEmail, customerName, orderId, newStatus }) => {
  const statusMessages = {
    PROCESSING: 'Your order is now being processed.',
    SHIPPED: 'Great news! Your order has been shipped.',
    DELIVERED: 'Your order has been delivered. Enjoy!',
    CANCELLED: 'Your order has been cancelled.',
  };
  const message = statusMessages[newStatus] || `Your order status is now: ${newStatus}`;

  await transporter.sendMail({
    from: `"Merchant Hub" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `📦 Order Update — #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#4f46e5;">Order Update</h2>
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>${message}</p>
        <p style="color:#888;font-size:0.85em;">Order ID: ${orderId}</p>
      </div>
    `
  });
};

/**
 * Send new sale alert to the tenant admin
 */
const sendNewSaleAlert = async ({ adminEmails, storeName, orderId, total, customerName }) => {
  await transporter.sendMail({
    from: `"Merchant Hub" <${process.env.EMAIL_USER}>`,
    to: Array.isArray(adminEmails) ? adminEmails.join(', ') : adminEmails,
    subject: `🛒 New Sale — $${parseFloat(total).toFixed(2)} from ${customerName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#4f46e5;">💰 New Order on ${storeName}</h2>
        <p>You have a new order from <strong>${customerName}</strong> for <strong>$${parseFloat(total).toFixed(2)}</strong>.</p>
        <p style="color:#888;font-size:0.85em;">Order ID: ${orderId}</p>
        <p>Log in to your Merchant Hub to manage this order.</p>
      </div>
    `
  });
};

module.exports = { transporter, sendOrderConfirmation, sendOrderStatusUpdate, sendNewSaleAlert };
