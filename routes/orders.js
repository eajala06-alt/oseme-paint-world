const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('./auth');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Create a pending order + initialize a Paystack transaction.
// The server recalculates the total from the DB, never trusting client-sent prices.
router.post('/', async (req, res) => {
  try {
    const { items, customer } = req.body; // items: [{productId, qty}], customer: {name, email, phone, address}

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }
    if (!customer || !customer.email || !customer.name || !customer.phone) {
      return res.status(400).json({ error: 'Name, email and phone are required' });
    }

    let total = 0;
    const lineItems = [];
    for (const item of items) {
      const product = db.get('products').find({ id: item.productId }).value();
      if (!product || !product.active) {
        return res.status(400).json({ error: `Product no longer available: ${item.productId}` });
      }
      const qty = Math.max(1, Number(item.qty) || 1);
      if (product.stock < qty) {
        return res.status(400).json({ error: `Not enough stock for ${product.name}` });
      }
      total += product.price * qty;
      lineItems.push({ productId: product.id, name: product.name, price: product.price, qty });
    }

    const order = {
      id: uuid(),
      items: lineItems,
      total,
      customer,
      status: 'pending', // pending -> paid -> fulfilled  (or cancelled)
      createdAt: new Date().toISOString(),
      paystackReference: null
    };
    db.get('orders').push(order).write();

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: 'Payment gateway is not configured yet. Add PAYSTACK_SECRET_KEY to .env' });
    }

    // Paystack expects amount in kobo (smallest currency unit)
    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: customer.email,
        amount: total * 100,
        reference: order.id,
        callback_url: `${req.protocol}://${req.get('host')}/order-success.html?order=${order.id}`
      })
    });
    const initData = await initRes.json();

    if (!initData.status) {
      return res.status(500).json({ error: 'Could not start payment. Please try again.' });
    }

    db.get('orders').find({ id: order.id }).assign({ paystackReference: order.id }).write();

    res.status(201).json({
      orderId: order.id,
      total,
      authorizationUrl: initData.data.authorization_url,
      accessCode: initData.data.access_code,
      reference: initData.data.reference
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating your order' });
  }
});

// Verify payment with Paystack and mark the order paid (called after checkout redirect/popup success)
router.get('/:id/verify', async (req, res) => {
  try {
    const order = db.get('orders').find({ id: req.params.id }).value();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status === 'paid' || order.status === 'fulfilled') {
      return res.json({ status: order.status, order });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: 'Payment gateway is not configured' });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${order.id}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const verifyData = await verifyRes.json();

    if (verifyData.data && verifyData.data.status === 'success' && verifyData.data.amount === order.total * 100) {
      // Reduce stock for each item
      order.items.forEach(item => {
        const product = db.get('products').find({ id: item.productId });
        const current = product.value();
        if (current) {
          product.assign({ stock: Math.max(0, current.stock - item.qty) }).write();
        }
      });
      db.get('orders').find({ id: order.id }).assign({ status: 'paid' }).write();
      return res.json({ status: 'paid', order: db.get('orders').find({ id: order.id }).value() });
    }

    return res.json({ status: 'pending', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify payment' });
  }
});

// Admin: list all orders
router.get('/', requireAdmin, (req, res) => {
  const orders = db.get('orders').value().slice().reverse();
  res.json(orders);
});

// Admin: update order status (e.g. mark fulfilled/cancelled)
router.put('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'fulfilled', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = db.get('orders').find({ id: req.params.id });
  if (!order.value()) return res.status(404).json({ error: 'Order not found' });
  order.assign({ status }).write();
  res.json(order.value());
});

module.exports = router;
