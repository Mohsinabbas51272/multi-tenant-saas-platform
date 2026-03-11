const prisma = require('../config/db');

const addReview = async (req, res) => {
  const { product_id, rating, comment } = req.body;
  const customer_id = req.user.id;

  try {
    // Check if customer already reviewed this product
    const existing = await prisma.review.findUnique({
      where: { customer_id_product_id: { customer_id, product_id } }
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await prisma.review.create({
      data: {
        product_id,
        customer_id,
        rating: parseInt(rating),
        comment
      },
      include: { customer: { select: { name: true } } }
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProductReviews = async (req, res) => {
  const { product_id } = req.params;
  try {
    const reviews = await prisma.review.findMany({
      where: { product_id },
      include: { customer: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { addReview, getProductReviews };
