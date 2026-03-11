const prisma = require('../config/db');
const { sendOrderConfirmation, sendOrderStatusUpdate, sendNewSaleAlert } = require('../utils/mailer');

const createOrder = async (req, res) => {
  const { items, total_amount, payment_method, coupon_code, shipping } = req.body; 

  try {
    let finalAmount = parseFloat(total_amount);
    let discountAmount = 0;

    // Apply coupon if provided
    if (coupon_code) {
      const coupon = await prisma.coupon.findUnique({
        where: { tenant_id_code: { tenant_id: req.tenantId, code: coupon_code.toUpperCase() } }
      });

      if (coupon && new Date() <= new Date(coupon.expiry_date) && coupon.used_count < coupon.usage_limit) {
        discountAmount = (finalAmount * coupon.discount_percentage) / 100;
        finalAmount = finalAmount - discountAmount;

        // Increment usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { used_count: { increment: 1 } }
        });
      }
    }

    // Calculate shipping & tax
    const shippingCost = finalAmount >= 50 ? 0 : 5.99;
    const taxRate = 0.08; // 8% tax
    const taxAmount = parseFloat((finalAmount * taxRate).toFixed(2));
    const grandTotal = parseFloat((finalAmount + shippingCost + taxAmount).toFixed(2));

    const order = await prisma.order.create({
      data: {
        total_amount: grandTotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        status: 'PENDING',
        payment_status: payment_method === 'COD' ? 'PENDING' : 'PAID',
        payment_method: payment_method || 'COD',
        tenant_id: req.tenantId,
        customer_id: req.user.id,
        shipping_name: shipping?.name || null,
        shipping_address: shipping?.address || null,
        shipping_city: shipping?.city || null,
        shipping_state: shipping?.state || null,
        shipping_zip: shipping?.zip || null,
        shipping_country: shipping?.country || null,
        items: {
          create: items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity,
            price: parseFloat(item.price)
          }))
        },
        history: {
          create: {
            status: 'PENDING',
            comment: coupon_code ? `Order placed with coupon ${coupon_code.toUpperCase()}` : 'Order placed'
          }
        }
      },
      include: { items: true, history: true }
    });

    // Decrement stock
    for (const item of items) {
      if (item.variant_id) {
        await prisma.productVariant.update({
          where: { id: item.variant_id },
          data: { stock: { decrement: item.quantity } }
        });
      } else {
        await prisma.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    // Fetch tenant admin emails and staff for notifications
    const orderWithDetails = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { product: true } },
        customer: { select: { name: true, email: true } },
        tenant: { 
          include: { 
            users: { 
              where: { role: { in: ['admin', 'user'] } }, // Include both admins and staff
              select: { email: true } 
            } 
          } 
        }
      }
    });

    const staffEmails = orderWithDetails?.tenant?.users?.map(u => u.email) || [];
    const tenantEmail = orderWithDetails?.tenant?.email; // Store owner email from tenant record
    const recipientEmails = [...new Set([tenantEmail, ...staffEmails])].filter(Boolean); // Unique list

    const customer = orderWithDetails?.customer;

    // Send confirmation to customer (non-blocking)
    if (customer) {
      sendOrderConfirmation({
        customerEmail: customer.email,
        customerName: customer.name,
        orderId: order.id,
        items: orderWithDetails?.items || [],
        total: grandTotal
      }).catch(e => console.error('Email error (order confirm):', e.message));
    }

    // New sale alert to store team (non-blocking)
    if (recipientEmails.length > 0 && customer) {
      sendNewSaleAlert({
        adminEmails: recipientEmails,
        storeName: orderWithDetails?.tenant?.name || 'Your Store',
        orderId: order.id,
        total: grandTotal,
        customerName: customer.name
      }).catch(e => console.error('Email error (sale alert):', e.message));
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tenant_id: req.tenantId },
      include: { 
        items: { include: { product: true, variant: true } },
        customer: { select: { name: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const orderData = { 
      status,
      history: {
        create: {
          status,
          comment: `Order status updated to ${status}`
        }
      }
    };

    // If order is delivered, it should also be marked as PAID (important for COD)
    if (status === 'DELIVERED') {
      orderData.payment_status = 'PAID';
    }

    const order = await prisma.order.update({
      where: { id: id },
      data: orderData,
      include: { history: true, customer: { select: { name: true, email: true } } }
    });

    // Send status notification email to customer (non-blocking)
    if (order.customer) {
      sendOrderStatusUpdate({
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        orderId: id,
        newStatus: status
      }).catch(e => console.error('Email error (status update):', e.message));
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customer_id: req.user.id, tenant_id: req.tenantId },
      include: { 
        items: { include: { product: true, variant: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getOrderHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const history = await prisma.orderStatusHistory.findMany({
      where: { order_id: id },
      orderBy: { created_at: 'desc' }
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, customer_id: true, tenant_id: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization checks
    const isAdmin = req.user.role === 'admin';
    const isOwner = order.customer_id === req.user.id;
    const isCorrectTenant = order.tenant_id === req.tenantId;

    if (!isCorrectTenant) {
      return res.status(403).json({ message: 'Forbidden: Order belongs to another tenant' });
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this order' });
    }

    // Status check: Only Delivered or Cancelled orders can be deleted
    if (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
      return res.status(400).json({ message: 'Only DELIVERED or CANCELLED orders can be deleted from records' });
    }

    await prisma.order.delete({
      where: { id }
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createOrder, getOrders, updateOrderStatus, getUserOrders, getOrderHistory, deleteOrder };
