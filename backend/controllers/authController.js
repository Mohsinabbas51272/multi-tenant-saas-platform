const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
require('dotenv').config();

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')   // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
    }

    if (user.role !== 'superadmin' && user.tenant?.subscription_status !== 'active') {
      if (user.tenant?.subscription_status === 'rejected') {
        return res.status(403).json({ 
          message: 'Your store proposal has been REJECTED by SuperAdmin. Please contact support for more details.' 
        });
      }
      return res.status(403).json({ 
        message: 'Your store proposal is pending approval by SuperAdmin. Please wait for the confirmation email.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant?.name,
        tenant_slug: user.tenant?.slug
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const registerTenant = async (req, res) => {
  const { name, email, password, tenantName } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Tenant and Admin User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: slugify(tenantName),
          email: email
        }
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'admin',
          tenant_id: tenant.id
        }
      });

      return { tenant, user };
    });

    res.status(201).json({
      message: 'Registration successful. Waiting for Superadmin approval.',
      tenant: result.tenant,
      user: { id: result.user.id, name: result.user.name, email: result.user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const registerCustomer = async (req, res) => {
  const { name, email, password, tenant_id } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        tenant_id
      }
    });

    res.status(201).json({
      message: 'Registration successful! You can now log in.',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { login, registerTenant, registerCustomer };
