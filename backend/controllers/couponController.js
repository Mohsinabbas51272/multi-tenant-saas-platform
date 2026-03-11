const prisma = require('../config/db');

// Create a coupon
const createCoupon = async (req, res) => {
  const { code, discount_percentage, expiry_date, usage_limit } = req.body;

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount_percentage: parseInt(discount_percentage),
        expiry_date: new Date(expiry_date),
        usage_limit: parseInt(usage_limit) || 100,
        tenant_id: req.tenantId
      }
    });
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Coupon code already exists for this store' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all coupons for the tenant
const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { tenant_id: req.tenantId },
      orderBy: { created_at: 'desc' }
    });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a coupon
const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.coupon.delete({ where: { id } });
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Validate a coupon (public for users during checkout)
const validateCoupon = async (req, res) => {
  const { code } = req.body;
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { tenant_id_code: { tenant_id: req.tenantId, code: code.toUpperCase() } }
    });

    if (!coupon) return res.json({ valid: false, message: 'Invalid coupon code' });
    if (new Date() > new Date(coupon.expiry_date)) return res.json({ valid: false, message: 'Coupon has expired' });
    if (coupon.used_count >= coupon.usage_limit) return res.json({ valid: false, message: 'Coupon usage limit reached' });

    res.json({ 
      valid: true, 
      discount_percentage: coupon.discount_percentage,
      code: coupon.code 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createCoupon, getCoupons, deleteCoupon, validateCoupon };
