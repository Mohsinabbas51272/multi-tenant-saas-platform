const prisma = require('../config/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a Stripe Checkout Session for an order
const createCheckoutSession = async (req, res) => {
  const { items, coupon_code, shipping } = req.body;

  try {
    // Calculate totals
    let subtotal = 0;
    const lineItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.product_id } });
      if (!product) return res.status(404).json({ message: `Product ${item.product_id} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `${product.name} is out of stock` });

      subtotal += parseFloat(product.price) * item.quantity;
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || 'No description',
          },
          unit_amount: Math.round(parseFloat(product.price) * 100),
        },
        quantity: item.quantity,
      });
    }

    // Apply coupon discount if provided
    let discountAmount = 0;
    if (coupon_code) {
      const coupon = await prisma.coupon.findUnique({
        where: { tenant_id_code: { tenant_id: req.tenantId, code: coupon_code.toUpperCase() } }
      });

      if (!coupon) return res.status(400).json({ message: 'Invalid coupon code' });
      if (new Date() > new Date(coupon.expiry_date)) return res.status(400).json({ message: 'Coupon has expired' });
      if (coupon.used_count >= coupon.usage_limit) return res.status(400).json({ message: 'Coupon usage limit reached' });

      discountAmount = (subtotal * coupon.discount_percentage) / 100;
    }

    const totalAfterDiscount = subtotal - discountAmount;

    // Calculate shipping & tax
    const shippingCost = totalAfterDiscount >= 50 ? 0 : 5.99;
    const taxRate = 0.08;
    const taxAmount = parseFloat((totalAfterDiscount * taxRate).toFixed(2));
    const grandTotal = parseFloat((totalAfterDiscount + shippingCost + taxAmount).toFixed(2));

    // Add shipping line item if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping', description: 'Standard Shipping' },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Add tax line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Tax (8%)', description: 'Sales Tax' },
        unit_amount: Math.round(taxAmount * 100),
      },
      quantity: 1,
    });

    // Create order in DB first with pending status
    const order = await prisma.order.create({
      data: {
        total_amount: grandTotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        status: 'PENDING',
        payment_status: 'PENDING',
        payment_method: 'STRIPE',
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
          create: { status: 'PENDING', comment: 'Order placed, awaiting payment' }
        }
      },
      include: { items: true }
    });

    // Create Stripe Checkout Session Payload
    const sessionPayload = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tenant-user?payment=success&order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tenant-user?payment=cancelled`,
      metadata: {
        order_id: order.id,
        tenant_id: req.tenantId,
        coupon_code: coupon_code || '',
      },
    };

    // If there is an internal coupon, create a one-time Stripe coupon to apply the discount
    if (discountAmount > 0 && coupon_code) {
      const stripeCoupon = await stripe.coupons.create({
        percent_off: (discountAmount / subtotal) * 100,
        duration: 'once',
        name: `Promo Code: ${coupon_code}`
      });
      sessionPayload.discounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    // Save checkout session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripe_checkout_id: session.id }
    });

    res.json({ url: session.url, session_id: session.id, order_id: order.id });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    res.status(500).json({ message: 'Payment error', error: err.message });
  }
};

// Create a Stripe Checkout Session for Tenant Subscription
const createSubscriptionSession = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'Tenant ID required' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    // $29.00/month standard plan. Automatically creates a customer and subscription in Stripe.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Pro Merchant Hub Subscription',
            description: 'Monthly access to advanced e-commerce platform features',
          },
          unit_amount: 2900, // $29.00
          recurring: { interval: 'month' }
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?subscription=cancelled`,
      metadata: {
        tenant_id: tenant.id,
        type: 'subscription_checkout'
      },
      client_reference_id: tenant.id,
      customer_email: tenant.email // Link to their tenant email
    });

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Stripe Subscription Error:', err);
    res.status(500).json({ message: 'Subscription setup failed', error: err.message });
  }
};

// Stripe Webhook Handler
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`🔔 Webhook received: ${event.type}`);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Differentiate: subscription checkout vs order payment
    if (session.metadata?.type === 'subscription_checkout') {
      // --- Tenant Subscription Checkout ---
      const tenantId = session.metadata.tenant_id;
      try {
        const customerId = session.customer; // Stripe auto-creates customer
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripe_customer_id: customerId,
            subscription_status: 'active',
            plan: 'pro'
          }
        });
        console.log(`✅ Tenant ${tenantId} subscription checkout completed, customer: ${customerId}`);
      } catch (err) {
        console.error('Subscription checkout processing error:', err);
      }
    } else {
      // --- Regular Order Payment ---
      const orderId = session.metadata?.order_id;
      const couponCode = session.metadata?.coupon_code;
      const tenantId = session.metadata?.tenant_id;

      if (!orderId) {
        console.error('❌ Webhook Error: No order_id in session metadata');
        return res.status(200).json({ received: true });
      }

      try {
        console.log(`⏳ Processing order payment for ID: ${orderId}...`);
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            payment_status: 'PAID',
            status: 'PROCESSING',
            history: {
              create: { status: 'PROCESSING', comment: 'Payment confirmed via Stripe' }
            }
          },
          include: { items: true }
        });

        // Decrement stock
        for (const item of order.items) {
          if (item.variant_id) {
            console.log(`📉 Decrementing variant stock for ID: ${item.variant_id}`);
            await prisma.productVariant.update({
              where: { id: item.variant_id },
              data: { stock: { decrement: item.quantity } }
            });
          } else {
            console.log(`📉 Decrementing product stock for ID: ${item.product_id}`);
            await prisma.product.update({
              where: { id: item.product_id },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }

        // Increment coupon usage
        if (couponCode) {
          console.log(`🎟️ Updating coupon usage for: ${couponCode.toUpperCase()}`);
          await prisma.coupon.update({
            where: { tenant_id_code: { tenant_id: tenantId, code: couponCode.toUpperCase() } },
            data: { used_count: { increment: 1 } }
          });
        }

        console.log(`✅ Order ${orderId} successfully marked as PAID/PROCESSING`);

        // Notify store team via webhook (New!)
        const orderWithTeam = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            customer: { select: { name: true } },
            tenant: { 
              include: { 
                users: { 
                  where: { role: { in: ['admin', 'user'] } },
                  select: { email: true } 
                } 
              } 
            }
          }
        });

        const teamEmails = orderWithTeam?.tenant?.users?.map(u => u.email) || [];
        const tenantEmail = orderWithTeam?.tenant?.email;
        const recipientEmails = [...new Set([tenantEmail, ...teamEmails])].filter(Boolean);

        if (recipientEmails.length > 0) {
          const { sendNewSaleAlert } = require('../utils/mailer');
          sendNewSaleAlert({
            adminEmails: recipientEmails,
            storeName: orderWithTeam?.tenant?.name || 'Your Store',
            orderId: orderId,
            total: order.total_amount,
            customerName: orderWithTeam?.customer?.name || 'Customer'
          }).catch(e => console.error('Webhook Email error:', e.message));
        }
      } catch (err) {
        console.error(`❌ Webhook order processing error for ${orderId}:`, err.message);
      }
    }
  }

  // Handle Tenant Subscription lifecycle events
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    try {
      const tenant = await prisma.tenant.findFirst({ where: { stripe_customer_id: customerId } });
      if (tenant) {
        const endDate = new Date(subscription.current_period_end * 1000);
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: subscription.status === 'active' ? 'active' : 'suspended',
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items?.data?.[0]?.price?.id || null,
            subscription_end_date: endDate
          }
        });
        console.log(`✅ Tenant ${tenant.name} subscription updated: ${subscription.status}`);
      }
    } catch (err) {
      console.error('Subscription update error:', err);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    try {
      const tenant = await prisma.tenant.findFirst({ where: { stripe_subscription_id: subscription.id } });
      if (tenant) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { subscription_status: 'suspended', subscription_end_date: new Date() }
        });
        console.log(`⚠️ Tenant ${tenant.id} subscription cancelled`);
      }
    } catch (err) {
      console.error('Subscription cancellation error:', err);
    }
  }

  res.json({ received: true });
};

// Get billing info for tenant admin dashboard
const getBillingInfo = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || req.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'Tenant ID required' });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true, name: true, plan: true,
        subscription_status: true, stripe_customer_id: true,
        stripe_subscription_id: true, subscription_end_date: true,
        created_at: true
      }
    });

    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    let portalUrl = null;
    if (tenant.stripe_customer_id) {
      try {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: tenant.stripe_customer_id,
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tenant-admin?tab=billing`
        });
        portalUrl = portalSession.url;
      } catch (portalErr) {
        console.error('Portal session error:', portalErr.message);
      }
    }

    res.json({ ...tenant, portalUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Explicitly verify a payment status (Fallback for Success Page)
const verifyOrderPayment = async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ message: 'Session ID required' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const orderId = session.metadata?.order_id;

    if (session.payment_status === 'paid' && orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (order && order.payment_status !== 'PAID') {
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            payment_status: 'PAID',
            status: 'PROCESSING',
            history: {
              create: { status: 'PROCESSING', comment: 'Payment verified via manual fallback' }
            }
          }
        });
        return res.json({ status: 'PAID', order: updatedOrder });
      }
      return res.json({ status: order?.payment_status || 'PENDING' });
    }
    
    res.json({ status: 'PENDING' });
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

module.exports = { createCheckoutSession, createSubscriptionSession, handleWebhook, getBillingInfo, verifyOrderPayment };
