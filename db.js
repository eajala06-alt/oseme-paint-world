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
  projects: [
    {
      id: uuid(),
      title: 'Lekki Waterfront Villa',
      location: 'Lekki, Lagos',
      description: 'Full interior and exterior repaint of a 5-bedroom villa, including weatherproof exterior coating and a custom feature wall in the living room.',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=700',
      active: true
    },
    {
      id: uuid(),
      title: 'Wuse Office Complex',
      location: 'Wuse II, Abuja',
      description: 'Commercial repaint across 3 floors of office space, completed over a weekend to avoid business disruption. Included wood finishing on reception furniture.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700',
      active: true
    },
    {
      id: uuid(),
      title: 'Maitama Family Home',
      location: 'Maitama, Abuja',
      description: 'Full exterior repaint and driveway wall coating, plus interior color consultation for a family relocating into a newly built home.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700',
      active: true
    },
    {
      id: uuid(),
      title: 'Garki Retail Storefront',
      location: 'Garki, Abuja',
      description: 'Bright, brand-matched storefront repaint for a retail client, including signage-ready wall prep and a durable exterior finish.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700',
      active: true
    }
  ],
  services: [
    {
      id: uuid(),
      title: 'Interior Painting',
      description: 'Full-room or whole-home interior painting with clean, even coverage and minimal disruption to your space.',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600',
      active: true
    },
    {
      id: uuid(),
      title: 'Exterior Painting',
      description: 'Weatherproof exterior coatings built to withstand sun, rain and everyday wear for years to come.',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600',
      active: true
    },
    {
      id: uuid(),
      title: 'Color Consultation',
      description: 'Not sure what colors work? Our team helps you choose a palette that fits your space and style.',
      image: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600',
      active: true
    },
    {
      id: uuid(),
      title: 'Wood Finishing & Varnishing',
      description: 'Protective, high-gloss or matte finishes for doors, furniture and wooden fixtures.',
      image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600',
      active: true
    }
  ],
  settings: {
    storeName: 'Oseme Paint World',
    whatsappNumber: '2348000000000',
    currency: 'NGN',
    logoUrl: '',
    heroUrl: '',
    headerColor: '#FBFAF6',
    primaryColor: '#3F5D4E',
    accentColor: '#B8863B',
    aboutTitle: 'About Oseme Paint World',
    aboutBody: 'Oseme Paint World has been supplying quality paints, tools and finishing products for homes and businesses. We combine premium materials with real, hands-on expertise — whether you\'re picking up supplies for a DIY project or need a full professional repaint.',
    aboutImage: '',
    contactEmail: 'hello@example.com',
    contactPhone: '2348000000000',
    contactAddress: 'Abuja, Nigeria',
    adminPasswordHash: null // set on first run from env
  }
}).write();

module.exports = db;
