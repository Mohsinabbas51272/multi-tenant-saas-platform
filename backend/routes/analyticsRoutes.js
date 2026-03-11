const express = require('express');
const router = express.Router();
const { getSuperadminRevenue, getMerchantStats } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/revenue', roleMiddleware(['superadmin']), getSuperadminRevenue);
router.get('/merchant-stats', roleMiddleware(['admin']), getMerchantStats);

module.exports = router;
