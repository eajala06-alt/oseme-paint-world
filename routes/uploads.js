const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const router = express.Router();
const { requireAdmin } = require('./auth');

// Shared storage folder so uploaded photos survive redeploys (same volume as the database/logo/hero)
const uploadsDir = path.join(__dirname, '..', 'storage', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `img-${uuid()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Please upload a PNG, JPG or WEBP image'), ok);
  }
});

// Admin: upload a photo (for a product, project or service), returns its URL
router.post('/', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    const url = '/uploads/' + req.file.filename;
    res.json({ url });
  });
});

module.exports = router;
