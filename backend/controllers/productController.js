const prisma = require('../config/db');

const getProducts = async (req, res) => {
  const { search, category } = req.query;
  
  try {
    const where = { tenant_id: req.tenantId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category && category !== 'All') {
      where.category = category;
    }

    const products = await prisma.product.findMany({ 
      where,
      include: {
        variants: true,
        reviews: {
          select: { rating: true }
        },
        wishlistedBy: {
          where: { customer_id: req.user.id },
          select: { id: true }
        }
      }
    });

    const productsWithStats = products.map(p => {
      const avgRating = p.reviews.length > 0 
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length 
        : 0;
      return {
        ...p,
        avgRating,
        reviewCount: p.reviews.length,
        isWishlisted: p.wishlistedBy.length > 0
      };
    });

    res.json(productsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createProduct = async (req, res) => {
  const { name, price, description, category, stock } = req.body;
  const image_url = req.file ? req.file.path : null;

  let variantsData = [];
  try {
    if (req.body.variants) {
      variantsData = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
    }
  } catch (e) {
    console.error('Failed to parse variants', e);
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        category: category || 'General',
        image_url,
        stock: parseInt(stock) || 0,
        tenant_id: req.tenantId,
        variants: variantsData.length > 0 ? {
          create: variantsData.map(v => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: parseInt(v.stock) || 0,
            price_adjustment: parseFloat(v.price_adjustment) || 0
          }))
        } : undefined
      },
      include: { variants: true }
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, category, stock } = req.body;
  const image_url = req.file ? req.file.path : null;

  let variantsData = [];
  try {
    if (req.body.variants) {
      variantsData = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
    }
  } catch (e) {
    console.error('Failed to parse variants', e);
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id, tenant_id: req.tenantId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name || product.name,
        price: price ? parseFloat(price) : product.price,
        description: description || product.description,
        category: category || product.category,
        image_url: image_url || product.image_url,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        ...(variantsData.length > 0 ? {
          variants: {
            deleteMany: {}, // Delete existing variants
            create: variantsData.map(v => ({
              sku: v.sku,
              size: v.size,
              color: v.color,
              stock: parseInt(v.stock) || 0,
              price_adjustment: parseFloat(v.price_adjustment) || 0
            }))
          }
        } : {})
      },
      include: { variants: true }
    });

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.product.deleteMany({
      where: { id, tenant_id: req.tenantId }
    });

    if (result.count === 0) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenant_id: req.tenantId, role: 'user' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const registerStaff = async (req, res) => {
  const { name, email, password } = req.body;
  const bcrypt = require('bcrypt');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        tenant_id: req.tenantId
      }
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getLowStockProducts = async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  try {
    const products = await prisma.product.findMany({
      where: {
        tenant_id: req.tenantId,
        stock: { lte: threshold }
      }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getGlobalProducts = async (req, res) => {
  const { search, category } = req.query;
  
  try {
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category && category !== 'All') {
      where.category = category;
    }

    const products = await prisma.product.findMany({ 
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        variants: true,
        reviews: {
          select: { rating: true }
        }
      }
    });

    const productsWithStats = products.map(p => {
      const avgRating = p.reviews.length > 0 
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length 
        : 0;
      return {
        ...p,
        avgRating,
        reviewCount: p.reviews.length
      };
    });

    res.json(productsWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getStaff, 
  registerStaff,
  getLowStockProducts,
  getGlobalProducts
};
