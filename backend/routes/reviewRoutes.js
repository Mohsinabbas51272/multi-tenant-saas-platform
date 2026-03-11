const express = require('express');
const router = express.Router();
const { addReview, getProductReviews } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public can view reviews
router.get('/:product_id', getProductReviews);

// Only authenticated customers can post reviews
router.post('/', authMiddleware, roleMiddleware(['customer', 'user']), addReview);

module.exports = router;
