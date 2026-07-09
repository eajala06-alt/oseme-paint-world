const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('./auth');

// ===== Logo upload setup =====
// Lives under the same shared "storage" folder as the database, so both
// survive redeploys with just one mounted volume.
const uploadsDir = path.join(__dirname, '..', 'storage', 'uploads');
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

// Hero banner: bigger size limit since it may be a video, and its own filename so it doesn't clash with the logo
const heroStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'hero' + ext);
  }
});
const heroUpload = multer({
  storage: heroStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max (video needs more room than a logo)
  fileFilter: (req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype);
    cb(ok ? null : new Error('Please upload a JPG/PNG/WEBP photo or an MP4/WEBM/MOV video'), ok);
  }
});

// Public: store name, whatsapp number, currency, branding + about/contact content (safe fields only)
router.get('/', (req, res) => {
  const {
    storeName, whatsappNumber, currency, logoUrl, heroUrl, headerColor, primaryColor, accentColor,
    aboutTitle, aboutBody, aboutImage, contactEmail, contactPhone, contactAddress
  } = db.get('settings').value();
  res.json({
    storeName, whatsappNumber, currency, logoUrl, heroUrl, headerColor, primaryColor, accentColor,
    aboutTitle, aboutBody, aboutImage, contactEmail, contactPhone, contactAddress
  });
});

// Admin: update store name / whatsapp number / currency / colors / about / contact
router.put('/', requireAdmin, (req, res) => {
  const {
    storeName, whatsappNumber, currency, headerColor, primaryColor, accentColor,
    aboutTitle, aboutBody, aboutImage, contactEmail, contactPhone, contactAddress
  } = req.body;
  const updates = {};
  if (storeName !== undefined) updates.storeName = storeName;
  if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
  if (currency !== undefined) updates.currency = currency;
  if (headerColor !== undefined) updates.headerColor = headerColor;
  if (primaryColor !== undefined) updates.primaryColor = primaryColor;
  if (accentColor !== undefined) updates.accentColor = accentColor;
  if (aboutTitle !== undefined) updates.aboutTitle = aboutTitle;
  if (aboutBody !== undefined) updates.aboutBody = aboutBody;
  if (aboutImage !== undefined) updates.aboutImage = aboutImage;
  if (contactEmail !== undefined) updates.contactEmail = contactEmail;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone;
  if (contactAddress !== undefined) updates.contactAddress = contactAddress;
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

// Admin: upload a new hero banner (photo or video)
router.post('/hero', requireAdmin, (req, res) => {
  heroUpload.single('hero')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    const heroUrl = '/uploads/' + req.file.filename + '?v=' + Date.now();
    db.get('settings').assign({ heroUrl }).write();
    res.json({ heroUrl });
  });
});

// Admin: remove the hero banner (falls back to a plain color background)
router.delete('/hero', requireAdmin, (req, res) => {
  db.get('settings').assign({ heroUrl: '' }).write();
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
