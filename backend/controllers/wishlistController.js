const prisma = require('../config/db');

const toggleWishlist = async (req, res) => {
  const { product_id } = req.body;
  const customer_id = req.user.id;

  try {
    const existing = await prisma.wishlist.findUnique({
      where: { customer_id_product_id: { customer_id, product_id } }
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id }
      });
      return res.json({ message: 'Removed from wishlist', isWishlisted: false });
    } else {
      await prisma.wishlist.create({
        data: { product_id, customer_id }
      });
      return res.status(201).json({ message: 'Added to wishlist', isWishlisted: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyWishlist = async (req, res) => {
  const customer_id = req.user.id;
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { customer_id },
      include: { product: true }
    });
    res.json(wishlist.map(w => w.product));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { toggleWishlist, getMyWishlist };
