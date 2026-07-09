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

// Default structure + seed data, based on Oseme Paint World's real product line,
// services and project history, so the store isn't empty on first launch.
db.defaults({
  products: [
    {
      id: uuid(),
      name: 'O-Seme Emulsion Paint (For Walls & Ceilings)',
      description: 'Smooth, long-lasting emulsion finish for interior walls and ceilings.',
      price: 18500,
      stock: 40,
      category: 'Decorative Paint',
      image: '/img/seed/product-emulsion.jpg',
      active: true
    },
    {
      id: uuid(),
      name: 'O-Seme Pure Bright Satin',
      description: 'Luxury satin finish with a smooth, elegant sheen for interior walls.',
      price: 21000,
      stock: 30,
      category: 'Decorative Paint',
      image: '/img/seed/product-satin.jpg',
      active: true
    },
    {
      id: uuid(),
      name: 'O-Seme Super Brilliant Matt (Weather Shield)',
      description: 'Weather-resistant matt finish built for lasting exterior protection.',
      price: 23500,
      stock: 25,
      category: 'Exterior Paint',
      image: '/img/seed/product-matt.jpg',
      active: true
    },
    {
      id: uuid(),
      name: 'O-Seme Screeding Paint',
      description: 'Heavy-duty screeding paint for surface preparation and protective coating.',
      price: 26000,
      stock: 20,
      category: 'Industrial & Protective',
      image: '/img/seed/product-screeding.jpg',
      active: true
    },
    {
      id: uuid(),
      name: 'O-Seme Stucco Paint',
      description: 'Textured decorative stucco finish for a distinctive architectural look.',
      price: 24500,
      stock: 20,
      category: 'Specialty Decorative',
      image: '/img/seed/product-stucco-group.jpg',
      active: true
    }
  ],
  orders: [],
  projects: [
    {
      id: uuid(),
      title: 'Abuja Skyline Luxury Residences',
      location: 'Abuja',
      description: 'Supply of premium satin paints, luxury decorative stucco finishes, customized wall coatings, and technical finishing support for high-end residential apartments. Started January 2021, completed September 2021.',
      image: '/img/seed/project-warehouse-1.jpg',
      active: true
    },
    {
      id: uuid(),
      title: 'Emerald Crest Hotel & Suites Renovation',
      location: 'Lagos',
      description: 'Provision of weather-resistant exterior coatings, textured decorative finishes, luxury interior paint systems, and specialized decorative treatments for hospitality renovation works. Started March 2021, completed December 2021.',
      image: '/img/seed/project-warehouse-2.jpg',
      active: true
    },
    {
      id: uuid(),
      title: 'Unity Corporate Towers',
      location: 'Port Harcourt',
      description: 'Supply of industrial-grade protective coatings, decorative finishing systems, and premium architectural paint solutions for a commercial office complex. Started June 2022, completed February 2023.',
      image: '/img/seed/project-warehouse-1.jpg',
      active: true
    },
    {
      id: uuid(),
      title: 'Dubia Mall (Bright Grillz)',
      location: 'Abuja',
      description: 'Dual-finish painting project — internal and external application for bar, kitchen and lounge areas with priming, glossy finishes for high-traffic zones, matt finishes for ambiance, and precise detailing around fixtures and fittings. Started July 2025, completed November 2025.',
      image: '/img/seed/project-warehouse-2.jpg',
      active: true
    },
    {
      id: uuid(),
      title: 'Area Command & Commercial Bank',
      location: 'Okpela, Edo State',
      description: 'Comprehensive interior and exterior painting of office spaces — application of high-durability stucco finishes, wall priming, and precise color coordination to elevate workplace aesthetics. Started May 2026, ongoing.',
      image: '/img/seed/project-warehouse-1.jpg',
      active: true
    }
  ],
  services: [
    {
      id: uuid(),
      title: 'Product Specification Guidance',
      description: 'Expert guidance on choosing the right paint and coating products for your specific project needs.',
      image: '/img/seed/product-emulsion.jpg',
      active: true
    },
    {
      id: uuid(),
      title: 'Surface Preparation Consultation',
      description: 'Professional advice on preparing surfaces properly for the best finish and long-term durability.',
      image: '/img/seed/product-matt.jpg',
      active: true
    },
    {
      id: uuid(),
      title: 'Color Advisory Services',
      description: 'Not sure what colors work? Our team helps you choose a palette that fits your space and style.',
      image: '/img/seed/product-satin.jpg',
      active: true
    },
    {
      id: uuid(),
      title: 'Contractor Support & Bulk Supply',
      description: 'Project-based coating solutions, contractor support programs and bulk supply coordination for large-scale jobs.',
      image: '/img/seed/product-screeding.jpg',
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
    aboutBody: 'Oseme Paint World (OPW) is the premium paint manufacturing and decorative finishes division of Oseme Group of Companies. The company specializes in the manufacturing, distribution and supply of high-performance decorative, architectural and protective coating solutions developed to meet the demands of modern construction and architectural design.\n\nEstablished with a commitment to quality craftsmanship and decorative excellence, OPW has steadily grown into a recognized and trusted brand within Nigeria\'s paint and coatings industry.\n\nBy combining premium raw materials, advanced manufacturing systems and strict quality-control procedures, OPW consistently delivers products capable of meeting both local and international standards — from luxury residential estates and hotels to commercial complexes and government buildings.',
    aboutImage: '/img/seed/product-stucco-group.jpg',
    contactEmail: 'hello@osemepaintworld.com',
    contactPhone: '2348000000000',
    contactAddress: 'F01 Building Materials Market, Kubwa, Abuja, Nigeria',
    adminPasswordHash: null // set on first run from env
  }
}).write();

module.exports = db;
