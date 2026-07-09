const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuid } = require('uuid');
const { requireAdmin } = require('./auth');

// Public: list active projects
router.get('/', (req, res) => {
  res.json(db.get('projects').filter({ active: true }).value());
});

// Admin: list ALL projects
router.get('/admin/all', requireAdmin, (req, res) => {
  res.json(db.get('projects').value());
});

// Public: single project (used by the project detail view)
router.get('/:id', (req, res) => {
  const project = db.get('projects').find({ id: req.params.id }).value();
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Admin: create project
router.post('/', requireAdmin, (req, res) => {
  const { title, location, description, image } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const project = {
    id: uuid(),
    title,
    location: location || '',
    description: description || '',
    image: image || '',
    active: true
  };
  db.get('projects').push(project).write();
  res.status(201).json(project);
});

// Admin: update project
router.put('/:id', requireAdmin, (req, res) => {
  const project = db.get('projects').find({ id: req.params.id });
  if (!project.value()) return res.status(404).json({ error: 'Project not found' });
  const { title, location, description, image, active } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (location !== undefined) updates.location = location;
  if (description !== undefined) updates.description = description;
  if (image !== undefined) updates.image = image;
  if (active !== undefined) updates.active = active;
  project.assign(updates).write();
  res.json(project.value());
});

// Admin: delete project
router.delete('/:id', requireAdmin, (req, res) => {
  db.get('projects').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

module.exports = router;
