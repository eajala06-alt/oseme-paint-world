require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const { router: authRouter } = require('./routes/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Uploaded logo files live in the shared storage folder (see db.js/settings.js), not in public/
app.use('/uploads', express.static(path.join(__dirname, 'storage', 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

// Exposes the PUBLIC (safe) Paystack key to the frontend. Never expose the secret key this way.
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.PAYSTACK_PUBLIC_KEY = ${JSON.stringify(process.env.PAYSTACK_PUBLIC_KEY || '')};`);
});

app.listen(PORT, () => {
  console.log(`Oseme Paint World running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin.html`);
});
