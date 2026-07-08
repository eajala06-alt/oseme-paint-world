const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('./auth');

// ===== Logo upload setup =====
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'logo' + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Please upload a PNG, JPG, SVG or WEBP image'), ok);
  }
});

// Public: store name, whatsapp number, currency, branding (safe fields only)
router.get('/', (req, res) => {
  const { storeName, whatsappNumber, currency, logoUrl, primaryColor, accentColor } = db.get('settings').value();
  res.json({ storeName, whatsappNumber, currency, logoUrl, primaryColor, accentColor });
});

// Admin: update store name / whatsapp number / currency / colors
router.put('/', requireAdmin, (req, res) => {
  const { storeName, whatsappNumber, currency, primaryColor, accentColor } = req.body;
  const updates = {};
  if (storeName !== undefined) updates.storeName = storeName;
  if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
  if (currency !== undefined) updates.currency = currency;
  if (primaryColor !== undefined) updates.primaryColor = primaryColor;
  if (accentColor !== undefined) updates.accentColor = accentColor;
  db.get('settings').assign(updates).write();
  res.json(db.get('settings').value());
});

// Admin: upload a new logo image
router.post('/logo', requireAdmin, (req, res) => {
  upload.single('logo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    const logoUrl = '/uploads/' + req.file.filename + '?v=' + Date.now(); // cache-bust so browsers pick up changes
    db.get('settings').assign({ logoUrl }).write();
    res.json({ logoUrl });
  });
});

// Admin: remove the logo (fall back to text store name)
router.delete('/logo', requireAdmin, (req, res) => {
  db.get('settings').assign({ logoUrl: '' }).write();
  res.json({ ok: true });
});

// Admin: change admin password
router.put('/password', requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.get('settings').assign({ adminPasswordHash: hash }).write();
  res.json({ ok: true });
});

module.exports = router;
