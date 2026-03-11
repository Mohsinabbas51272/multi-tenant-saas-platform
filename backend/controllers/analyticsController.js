const prisma = require('../config/db');

const getSuperadminRevenue = async (req, res) => {
  try {
    const revenue = await prisma.order.aggregate({
      where: { payment_status: 'PAID' },
      _sum: {
        total_amount: true
      }
    });

    const tenantStats = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { orders: true }
        },
        orders: {
          where: { payment_status: 'PAID' },
          select: { total_amount: true }
        }
      }
    });

    const stats = tenantStats.map(tenant => ({
      name: tenant.name,
      orderCount: tenant._count.orders,
      revenue: tenant.orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
    }));

    res.json({
      totalRevenue: revenue._sum.total_amount || 0,
      stats
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMerchantStats = async (req, res) => {
  const { tenant_id } = req.user;

  try {
    if (!tenant_id) {
      return res.status(400).json({ message: 'User is not associated with a tenant' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenant_id },
      select: { name: true }
    });

    const revenue = await prisma.order.aggregate({
      where: { tenant_id, payment_status: 'PAID' },
      _sum: { total_amount: true }
    });

    const orderCount = await prisma.order.count({
      where: { tenant_id }
    });

    const pendingOrders = await prisma.order.count({
      where: { tenant_id, status: 'PENDING' }
    });

    const topProducts = await prisma.product.findMany({
      where: { tenant_id },
      take: 5,
      include: {
        _count: { select: { orderItems: true } }
      },
      orderBy: { orderItems: { _count: 'desc' } }
    });

    const lowStockProducts = await prisma.product.count({
      where: { tenant_id, stock: { lt: 10 } }
    });

    res.json({
      tenantName: tenant?.name || 'Store',
      totalRevenue: revenue._sum.total_amount || 0,
      totalOrders: orderCount,
      pendingOrders,
      lowStockCount: lowStockProducts,
      topProducts: topProducts.map(p => ({
        name: p.name,
        sales: p._count.orderItems,
        stock: p.stock
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getSuperadminRevenue, getMerchantStats };
