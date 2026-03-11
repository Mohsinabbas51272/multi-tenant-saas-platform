const express = require('express');
const router = express.Router();
const { createCheckoutSession, createSubscriptionSession, handleWebhook, getBillingInfo, verifyOrderPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

// Webhook must be before any body-parsing middleware (raw body needed for signature verification)
// This is handled in server.js with express.raw

// Authenticated routes
router.post('/create-checkout-session', authMiddleware, tenantMiddleware, subscriptionMiddleware, roleMiddleware(['user']), createCheckoutSession);

// Subscription route - only admins can subscribe their tenant
router.post('/create-subscription', authMiddleware, tenantMiddleware, roleMiddleware(['admin']), createSubscriptionSession);

// Verification route - needed for instant feedback after payment
router.get('/verify-order', authMiddleware, tenantMiddleware, roleMiddleware(['admin', 'user']), verifyOrderPayment);

// Billing info - only admins can view billing details
router.get('/billing-info', authMiddleware, tenantMiddleware, roleMiddleware(['admin']), getBillingInfo);

module.exports = router;
