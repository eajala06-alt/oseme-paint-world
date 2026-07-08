const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

// Everything that needs to survive redeploys (database + uploaded logo) lives
// under one shared "storage" folder, so a single mounted volume covers both.
const dataDir = path.join(__dirname, 'storage', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(path.join(dataDir, 'db.json'));
const db = low(adapter);

// Default structure + seed products so the store isn't empty on first launch
db.defaults({
  products: [
    {
      id: uuid(),
      name: 'Premium Emulsion Paint - White (4L)',
      description: 'Smooth matte finish, one-coat coverage, interior walls.',
      price: 18500,
      stock: 40,
      category: 'Interior Paint',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600',
      active: true
    },
    {
      id: uuid(),
      name: 'Weatherproof Exterior Paint (4L)',
      description: 'Rain and UV-resistant coating for external walls, 5-year durability.',
      price: 24000,
      stock: 30,
      category: 'Exterior Paint',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600',
      active: true
    },
    {
      id: uuid(),
      name: 'Professional Paint Brush Set (5pc)',
      description: 'Assorted sizes for trim, edges and detail work.',
      price: 7500,
      stock: 55,
      category: 'Tools & Accessories',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600',
      active: true
    },
    {
      id: uuid(),
      name: 'Paint Roller & Tray Kit',
      description: 'Heavy-duty roller, extension pole and tray for large surfaces.',
      price: 9800,
      stock: 45,
      category: 'Tools & Accessories',
      image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600',
      active: true
    }
  ],
  orders: [],
  settings: {
    storeName: 'Oseme Paint World',
    whatsappNumber: '2348000000000',
    currency: 'NGN',
    logoUrl: '',
    heroUrl: '',
    headerColor: '#FBFAF6',
    primaryColor: '#3F5D4E',
    accentColor: '#B8863B',
    adminPasswordHash: null // set on first run from env
  }
}).write();

module.exports = db;
