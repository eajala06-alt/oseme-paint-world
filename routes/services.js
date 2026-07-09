const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuid } = require('uuid');
const { requireAdmin } = require('./auth');

// Public: list active services
router.get('/', (req, res) => {
  res.json(db.get('services').filter({ active: true }).value());
});

// Admin: list ALL services
router.get('/admin/all', requireAdmin, (req, res) => {
  res.json(db.get('services').value());
});

// Admin: create service
router.post('/', requireAdmin, (req, res) => {
  const { title, description, image } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const service = {
    id: uuid(),
    title,
    description: description || '',
    image: image || '',
    active: true
  };
  db.get('services').push(service).write();
  res.status(201).json(service);
});

// Admin: update service
router.put('/:id', requireAdmin, (req, res) => {
  const service = db.get('services').find({ id: req.params.id });
  if (!service.value()) return res.status(404).json({ error: 'Service not found' });
  const { title, description, image, active } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (image !== undefined) updates.image = image;
  if (active !== undefined) updates.active = active;
  service.assign(updates).write();
  res.json(service.value());
});

// Admin: delete service
router.delete('/:id', requireAdmin, (req, res) => {
  db.get('services').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

module.exports = router;
