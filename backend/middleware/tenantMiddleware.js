const tenantMiddleware = (req, res, next) => {
  // Superadmins don't need a tenant_id for global operations
  if (req.user.role === 'superadmin') {
    return next();
  }

  if (!req.user.tenant_id) {
    return res.status(403).json({ message: 'Access denied: No tenant association' });
  }

  // Inject tenant_id into request for easy access in controllers
  req.tenantId = req.user.tenant_id;
  next();
};

module.exports = tenantMiddleware;
