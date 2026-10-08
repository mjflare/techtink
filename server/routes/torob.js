// Torob (torob.com) product webservice.
// Follows the commonly used "Torob API v3" shop webservice shape. Field names are centralised in
// toTorob() so they can be aligned with the exact spec shown in your Torob merchant panel.
//
// POST /api/torob/products   body: { page?: number, page_urls?: string[], page_uniques?: string[], sort?: 'date_added_desc'|'date_updated_desc' }
// GET  /api/torob/products?page=1   (same, for quick testing in a browser)
// If a Torob token is set in admin settings, requests must send it in the "X-Torob-Token" header (or ?token=).
import { Router } from 'express';
import { db, getSetting } from '../db.js';
import { serializeProduct } from '../products.js';

const r = Router();
const PAGE_SIZE = 100;

function toTorob(p, site) {
  const sp = p.specs || {};
  return {
    page_unique: String(p.id),
    page_url: `${site}/product/${encodeURIComponent(p.slug)}`,
    product_group_id: p.series || undefined,
    title: p.name,
    subtitle: p.tagline || '',
    current_price: p.inStock ? p.basePrice : 0, // Toman
    old_price: p.oldPrice && p.oldPrice > p.basePrice ? p.oldPrice : undefined,
    availability: p.inStock ? 'instock' : 'outofstock',
    category_name: p.category || 'لپ‌تاپ',
    image_links: p.images?.length ? p.images : p.image ? [p.image] : [],
    image_link: p.image || undefined,
    short_desc: p.tagline || '',
    spec: {
      'پردازنده': sp.cpu, 'کارت گرافیک': sp.gpu, 'حافظه رم': sp.ram, 'حافظه داخلی': sp.storage,
      'صفحه نمایش': sp.display, 'باتری': sp.battery, 'وزن': sp.weight, 'سیستم عامل': sp.os,
    },
    guarantee: p.guarantee || '',
    date_added: p.createdAt,
    date_updated: p.updatedAt,
  };
}

function handler(req, res) {
  const token = getSetting('torob_token');
  if (token && (req.get('X-Torob-Token') || req.query.token) !== token) {
    return res.status(401).json({ error: 'invalid token' });
  }
  const site = getSetting('site_url').replace(/\/$/, '');
  const body = { ...req.query, ...(req.body || {}) };
  const toList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const uniques = toList(body.page_uniques).map(String);
  const urls = toList(body.page_urls).map(String);

  let rows;
  if (uniques.length || urls.length) {
    const slugs = urls.map((u) => decodeURIComponent(u.split('/product/')[1] || '').replace(/[/?#].*$/, '')).filter(Boolean);
    const all = db.all('SELECT * FROM products WHERE active = 1');
    rows = all.filter((p) => uniques.includes(String(p.id)) || slugs.includes(p.slug));
    const products = rows.map((p) => toTorob(serializeProduct(p, { full: true }), site));
    return res.json({ api_version: 'torob_api_v3', current_page: 1, total: products.length, max_pages: 1, products });
  }

  const order = body.sort === 'date_updated_desc' ? 'updated_at DESC' : 'created_at DESC';
  const total = db.get('SELECT COUNT(*) AS c FROM products WHERE active = 1').c;
  const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(maxPages, Math.max(1, parseInt(body.page, 10) || 1));
  rows = db.all(`SELECT * FROM products WHERE active = 1 ORDER BY ${order}, id DESC LIMIT ? OFFSET ?`, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  res.json({
    api_version: 'torob_api_v3',
    current_page: page,
    total,
    max_pages: maxPages,
    products: rows.map((p) => toTorob(serializeProduct(p, { full: true }), site)),
  });
}

r.get('/torob/products', handler);
r.post('/torob/products', handler);

export default r;
