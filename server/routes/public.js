import { Router } from 'express';
import crypto from 'node:crypto';
import { db, getSetting, getSettings } from '../db.js';
import { serializeProduct } from '../products.js';

const r = Router();

r.get('/config', (_req, res) => {
  res.json({ storeName: getSetting('store_name'), bannerText: getSetting('banner_text'), shippingFee: Number(getSetting('shipping_fee')) || 0 });
});

r.get('/settings', (_req, res) => {
  res.json(getSettings());
});

const getProductsHandler = (req, res) => {
  const rows = db.all('SELECT * FROM products WHERE active = 1 ORDER BY id');
  res.json(rows.map((p) => serializeProduct(p)));
};

const getProductDetailHandler = (req, res) => {
  const p = db.get('SELECT * FROM products WHERE (slug = ? OR id = ?) AND active = 1', req.params.slug, parseInt(req.params.slug, 10) || 0);
  if (!p) return res.status(404).json({ error: 'محصول یافت نشد.' });
  res.json(serializeProduct(p, { full: true }));
};

r.get('/products', getProductsHandler);
r.get('/laptops', getProductsHandler);

r.get('/products/:slug', getProductDetailHandler);
r.get('/laptops/:slug', getProductDetailHandler);

r.get('/products/:slug/comments', (req, res) => {
  const p = db.get('SELECT id FROM products WHERE slug = ? OR id = ?', req.params.slug, parseInt(req.params.slug, 10) || 0);
  if (!p) return res.status(404).json({ error: 'محصول یافت نشد.' });
  const rows = db.all(
    `SELECT c.id, c.rating, c.body, c.created_at AS createdAt, u.name AS author
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.product_id = ? AND c.status = 'approved' ORDER BY c.id DESC`,
    p.id
  );
  res.json(rows);
});

const mapPost = (p) => ({
  id: p.id, title: p.title, excerpt: p.excerpt, category: p.category, author: p.author, authorRole: p.author_role,
  authorAvatar: p.author_avatar, date: p.date, readTime: p.read_time, image: p.image, content: p.content,
});
r.get('/blog', (_req, res) => res.json(db.all('SELECT * FROM blog_posts WHERE published = 1 ORDER BY rowid DESC').map(mapPost)));
r.get('/blog/:id', (req, res) => {
  const p = db.get('SELECT * FROM blog_posts WHERE id = ? AND published = 1', req.params.id);
  p ? res.json(mapPost(p)) : res.status(404).json({ error: 'مطلب یافت نشد.' });
});

r.get('/support/faqs', (_req, res) => {
  const groups = new Map();
  for (const f of db.all('SELECT * FROM faqs ORDER BY category, sort, id')) {
    if (!groups.has(f.category)) groups.set(f.category, []);
    groups.get(f.category).push({ q: f.q, a: f.a });
  }
  res.json([...groups].map(([category, items]) => ({ category, items })));
});

r.get('/support/drivers', (_req, res) => {
  const groups = new Map();
  for (const d of db.all('SELECT * FROM drivers ORDER BY product_slug, id')) {
    if (!groups.has(d.product_slug)) groups.set(d.product_slug, { modelId: d.product_slug, modelName: d.model_name, files: [] });
    groups.get(d.product_slug).files.push({ id: d.id, name: d.name, date: d.date, size: d.size, version: d.version, category: d.category, downloadUrl: d.download_url });
  }
  res.json([...groups.values()]);
});

r.get('/products/:slug/drivers', (req, res) => {
  const drivers = db.all('SELECT * FROM drivers WHERE product_slug = ? ORDER BY category, id', req.params.slug);
  res.json(drivers);
});

r.get('/support/warranty/:sn', (req, res) => {
  const w = db.get('SELECT * FROM warranties WHERE serial = ?', String(req.params.sn).toUpperCase());
  if (!w) return res.status(404).json({ error: 'شماره سریال یافت نشد یا نامعتبر است.' });
  res.json({ serialNumber: w.serial, model: w.model, purchaseDate: w.purchase_date, warrantyExpiry: w.expiry, status: w.status, carePlus: !!w.care_plus, owner: w.owner });
});

r.post('/support/ticket', (req, res) => {
  const { name, email, issue } = req.body || {};
  if (!name || !email || !issue) return res.status(400).json({ error: 'لطفاً همه فیلدها را تکمیل کنید.' });
  const code = 'TNK-' + crypto.randomInt(100000, 999999);
  db.run('INSERT INTO tickets (code, user_id, name, email, issue) VALUES (?, ?, ?, ?, ?)', code, req.user?.id ?? null, name, email, issue);
  res.json({ success: true, ticketId: code, message: 'تیکت پشتیبانی با موفقیت ثبت شد.' });
});

export default r;
