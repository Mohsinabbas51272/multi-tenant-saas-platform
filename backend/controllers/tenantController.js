const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/email');

const getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { users: { select: { email: true, name: true } } }
    });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const approveTenant = async (req, res) => {
  const { id } = req.params;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { subscription_status: 'active' }
    });

    // Create default staff user
    const staffEmail = `staff@${tenant.name.toLowerCase().replace(/\s/g, '')}.com`;
    const defaultUserPassword = await bcrypt.hash('user123', 10);
    
    await prisma.user.create({
      data: {
        name: `Staff Member - ${tenant.name}`,
        email: staffEmail,
        password: defaultUserPassword,
        role: 'user',
        tenant_id: tenant.id
      }
    });

    // Send Email to Admin
    await sendEmail(
      tenant.email,
      'Your Store Approval and Credentials',
      `Dear Admin, your store "${tenant.name}" has been approved!
      
      Admin Login: ${tenant.email} (Your registered password)
      Default Staff Login: ${staffEmail} (Password: user123)
      
      You can now log in and manage your products.`
    );

    res.json({ message: 'Tenant approved and default staff user created. Email sent.', tenant: updatedTenant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateTenantStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const tenant = await prisma.tenant.update({
      where: { id },
      data: { subscription_status: status }
    });

    res.json({ message: `Tenant status updated to ${status}`, tenant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'superadmin' } },
      include: { tenant: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const blockUser = async (req, res) => {
  const { id } = req.params;
  const { block } = req.body;

  try {
    await prisma.user.update({
      where: { id },
      data: { is_blocked: block }
    });
    res.json({ message: `User ${block ? 'blocked' : 'unblocked'} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const rejectTenant = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { subscription_status: 'rejected' }
    });

    await sendEmail(
      updatedTenant.email,
      'Store Proposal Status: Rejected',
      `Dear Admin, we regret to inform you that your store proposal for "${updatedTenant.name}" has been rejected. 
      Contact support for more information.`
    );

    res.json({ message: 'Tenant proposal rejected. Email sent.', tenant: updatedTenant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteTenant = async (req, res) => {
  const { id } = req.params;

  try {
    // Delete tenant and all associated data (Cascade delete should be handled by Prisma if configured, or manually)
    // For now, simple delete of tenant.
    await prisma.tenant.delete({ where: { id } });
    res.json({ message: 'Tenant proposal deleted permanently.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getStoreBySlug = async (req, res) => {
  const { slug } = req.params;
  const { search, category } = req.query;

  try {
    const whereClauseForProducts = {};
    if (search) {
      whereClauseForProducts.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category && category !== 'All') {
      whereClauseForProducts.category = category;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { 
        products: {
          where: whereClauseForProducts,
          include: {
            reviews: { select: { rating: true } }
          }
        } 
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (tenant.subscription_status !== 'active') {
      return res.status(403).json({ message: 'This store is currently unavailable.' });
    }

    // Add stats to products
    tenant.products = tenant.products.map(p => {
      const avgRating = p.reviews.length > 0 
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length 
        : 0;
      return {
        ...p,
        avgRating,
        reviewCount: p.reviews.length
      };
    });

    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyTenant = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'No tenant association' });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        plan: true,
        subscription_status: true,
        stripe_subscription_id: true,
        subscription_end_date: true,
        created_at: true
      }
    });

    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getTenants, approveTenant, updateTenantStatus, getUsers, blockUser, deleteUser, rejectTenant, deleteTenant, getStoreBySlug, getMyTenant };

