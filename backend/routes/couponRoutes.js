const express = require('express');
const router = express.Router();
const { createCoupon, getCoupons, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(subscriptionMiddleware);


// Admin CRUD
router.post('/', roleMiddleware(['admin']), createCoupon);
router.get('/', roleMiddleware(['admin']), getCoupons);
router.delete('/:id', roleMiddleware(['admin']), deleteCoupon);

// User validation during checkout
router.post('/validate', roleMiddleware(['user', 'admin']), validateCoupon);

module.exports = router;
