const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// Ensure an admin password hash exists (from env var on first boot)
function ensureAdminPassword() {
  const settings = db.get('settings').value();
  if (!settings.adminPasswordHash) {
    const plain = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(plain, 10);
    db.get('settings').assign({ adminPasswordHash: hash }).write();
  }
}
ensureAdminPassword();

router.post('/login', (req, res) => {
  const { password } = req.body;
  const settings = db.get('settings').value();

  if (!password || !bcrypt.compareSync(password, settings.adminPasswordHash)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000
  });
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

module.exports = { router, requireAdmin };
