const express = require('express');
const router = express.Router();
const { toggleWishlist, getMyWishlist } = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['customer', 'user']));

router.get('/', getMyWishlist);
router.post('/toggle', toggleWishlist);

module.exports = router;
