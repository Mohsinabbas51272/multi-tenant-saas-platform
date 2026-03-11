const prisma = require('../config/db');

/**
 * Middleware to check if the tenant has an active subscription.
 * Blocks access with 403 if subscription is not active.
 * Superadmins bypass this check.
 */
const subscriptionMiddleware = async (req, res, next) => {
  // Superadmins bypass subscription check
  if (req.user.role === 'superadmin') return next();

  const tenantId = req.tenantId || req.user.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ message: 'No tenant association found.' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscription_status: true, subscription_end_date: true }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    if (tenant.subscription_status !== 'active') {
      return res.status(403).json({ 
        message: 'Your store subscription is not active. Please subscribe to access this feature.',
        subscription_status: tenant.subscription_status
      });
    }

    // Optional: check if subscription has expired
    if (tenant.subscription_end_date && new Date(tenant.subscription_end_date) < new Date()) {
      return res.status(403).json({
        message: 'Your subscription has expired. Please renew to continue.',
        subscription_status: 'expired'
      });
    }

    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    res.status(500).json({ message: 'Server error during subscription check.' });
  }
};

module.exports = subscriptionMiddleware;
