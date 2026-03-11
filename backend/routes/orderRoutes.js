const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatus, getUserOrders, getOrderHistory, deleteOrder } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(subscriptionMiddleware);

// Order Tracking for Users
router.get('/my-orders', roleMiddleware(['user', 'admin']), getUserOrders);

// Customers can create orders
router.post('/', roleMiddleware(['user']), createOrder);

// Customers can view order history
router.get('/:id/history', roleMiddleware(['user', 'admin']), getOrderHistory);

// Admin can view all orders and update status
router.get('/', roleMiddleware(['admin']), getOrders);
router.patch('/:id/status', roleMiddleware(['admin']), updateOrderStatus);

// Delete order (Admins can delete any in tenant, users can delete their own if Delivered/Cancelled)
router.delete('/:id', roleMiddleware(['user', 'admin']), deleteOrder);

module.exports = router;
