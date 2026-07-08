const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuid } = require('uuid');
const { requireAdmin } = require('./auth');

// Public: list active products
router.get('/', (req, res) => {
  const products = db.get('products').filter({ active: true }).value();
  res.json(products);
});

// Public: single product
router.get('/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Admin: list ALL products (including inactive)
router.get('/admin/all', requireAdmin, (req, res) => {
  res.json(db.get('products').value());
});

// Admin: create product
router.post('/', requireAdmin, (req, res) => {
  const { name, description, price, stock, category, image } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const product = {
    id: uuid(),
    name,
    description: description || '',
    price: Number(price),
    stock: Number(stock) || 0,
    category: category || 'General',
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    active: true
  };
  db.get('products').push(product).write();
  res.status(201).json(product);
});

// Admin: update product
router.put('/:id', requireAdmin, (req, res) => {
  const product = db.get('products').find({ id: req.params.id });
  if (!product.value()) return res.status(404).json({ error: 'Product not found' });
  const { name, description, price, stock, category, image, active } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Number(price);
  if (stock !== undefined) updates.stock = Number(stock);
  if (category !== undefined) updates.category = category;
  if (image !== undefined) updates.image = image;
  if (active !== undefined) updates.active = active;
  product.assign(updates).write();
  res.json(product.value());
});

// Admin: delete product
router.delete('/:id', requireAdmin, (req, res) => {
  db.get('products').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

module.exports = router;
