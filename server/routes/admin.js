// Admin API: dashboard, products/variants/stock, orders, comments, users, blog, FAQ, tickets, settings.
import { Router } from 'express';
import { db, getSettings, setSetting, getSetting } from '../db.js';
import { requireAdmin, publicUser, hashPassword } from '../auth.js';
import { serializeProduct } from '../products.js';
import { orderWithItems } from './account.js';

const r = Router();
r.use(requireAdmin);

const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const slugify = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '');

// ---------- Dashboard & Stats ----------
const getDashboardData = () => {
  const low = int(getSetting('low_stock_threshold'), 5);
  const revenue = db.get("SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE status IN ('paid','paid_backorder','processing','shipped','delivered')").v;
  const ordersTotal = db.get('SELECT COUNT(*) AS v FROM orders').v;
  const ordersPaid = db.get("SELECT COUNT(*) AS v FROM orders WHERE status IN ('paid','paid_backorder')").v;
  const customers = db.get("SELECT COUNT(*) AS v FROM users WHERE role = 'customer'").v;
  const pendingComments = db.get("SELECT COUNT(*) AS v FROM comments WHERE status = 'pending'").v;
  const openTickets = db.get("SELECT COUNT(*) AS v FROM tickets WHERE status = 'open'").v;
  const lowStock = db.all('SELECT id, name, slug, stock FROM products WHERE active = 1 AND stock <= ? ORDER BY stock', low);
  const recentOrders = db.all('SELECT o.id, o.total, o.status, o.created_at AS createdAt, u.name AS customer FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 8');
  const totalProducts = db.get('SELECT COUNT(*) AS v FROM products').v;
  const totalStock = db.get('SELECT COALESCE(SUM(stock),0) AS v FROM products').v;
  const totalUsers = db.get('SELECT COUNT(*) AS v FROM users').v;
  const appointmentsTotal = db.get('SELECT COUNT(*) AS v FROM appointments').v;
  const pendingAppointments = db.get("SELECT COUNT(*) AS v FROM appointments WHERE status = 'pending'").v;
  const confirmedAppointments = db.get("SELECT COUNT(*) AS v FROM appointments WHERE status = 'confirmed'").v;
  const inboundShipments = db.get("SELECT COUNT(*) AS v FROM inventory_shipments WHERE type = 'inbound'").v;
  const outboundShipments = db.get("SELECT COUNT(*) AS v FROM inventory_shipments WHERE type = 'outbound'").v;
  const totalBlogPosts = db.get('SELECT COUNT(*) AS v FROM blog_posts').v;
  const statusBreakdown = {
    paid: db.get("SELECT COUNT(*) AS v FROM orders WHERE status = 'paid'").v,
    processing: db.get("SELECT COUNT(*) AS v FROM orders WHERE status = 'processing'").v,
    shipped: db.get("SELECT COUNT(*) AS v FROM orders WHERE status = 'shipped'").v,
    delivered: db.get("SELECT COUNT(*) AS v FROM orders WHERE status = 'delivered'").v,
    pending: db.get("SELECT COUNT(*) AS v FROM orders WHERE status = 'pending_payment'").v
  };

  return {
    revenue,
    ordersTotal,
    ordersPaid,
    customers,
    pendingComments,
    openTickets,
    lowStock,
    recentOrders,
    totalProducts,
    totalStock,
    totalOrders: ordersTotal,
    totalRevenue: revenue,
    totalUsers,
    paidOrdersCount: ordersPaid,
    appointmentsTotal,
    pendingAppointments,
    confirmedAppointments,
    inboundShipments,
    outboundShipments,
    totalBlogPosts,
    statusBreakdown
  };
};

r.get('/dashboard', (_req, res) => res.json(getDashboardData()));
r.get('/stats', (_req, res) => res.json(getDashboardData()));

// ---------- Products ----------
r.get('/products', (_req, res) => res.json(db.all('SELECT * FROM products ORDER BY id DESC').map((p) => serializeProduct(p, { full: true }))));

function saveProduct(id, b, userId) {
  const slug = slugify(b.slug || b.name);
  if (!b.name || !slug) throw new Error('نام و نامک (slug) محصول الزامی است.');
  const clash = db.get('SELECT id FROM products WHERE slug = ? AND id != ?', slug, id || 0);
  if (clash) throw new Error('این نامک قبلاً استفاده شده است.');
  const cpuBrand = b.cpuBrand || (b.specs?.cpu?.toLowerCase().includes('amd') ? 'AMD' : 'Intel');
  const gpuBrand = b.gpuBrand || (b.specs?.gpu?.toLowerCase().includes('nvidia') || b.specs?.gpu?.toLowerCase().includes('rtx') ? 'NVIDIA' : b.specs?.gpu?.toLowerCase().includes('amd') ? 'AMD' : 'Intel');
  const expertReview = typeof b.expertReview === 'object' ? JSON.stringify(b.expertReview) : (b.expertReview || '{}');
  const chassis = b.chassis || b.specs?.chassis || 'All-Aluminum CNC Machined';

  const fields = [
    slug, b.name, b.tagline || '', b.category || '', b.series || '', b.badge || '', b.description || '',
    int(b.basePrice), b.oldPrice ? int(b.oldPrice) : null, b.active === false ? 0 : 1, b.guarantee || '',
    (b.images && b.images[0]) || b.image || '', JSON.stringify(b.specs || {}), JSON.stringify(b.highlights || []),
    expertReview, cpuBrand, gpuBrand, chassis
  ];
  return db.tx(() => {
    let pid = id;
    if (id) {
      db.run(`UPDATE products SET slug=?, name=?, tagline=?, category=?, series=?, badge=?, description=?, base_price=?, old_price=?, active=?, guarantee=?, image=?, specs=?, highlights=?, expert_review=?, cpu_brand=?, gpu_brand=?, chassis=?, updated_at=datetime('now') WHERE id=?`, ...fields, id);
      if (b.stock !== undefined) {
        const cur = db.get('SELECT stock FROM products WHERE id = ?', id);
        const newStock = int(b.stock);
        if (cur && cur.stock !== newStock) {
          db.run('UPDATE products SET stock = ? WHERE id = ?', newStock, id);
          db.run('INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)', id, newStock - cur.stock, 'ویرایش موجودی توسط مدیر', userId);
        }
      }
    } else {
      pid = db.run(`INSERT INTO products (slug, name, tagline, category, series, badge, description, base_price, old_price, active, guarantee, image, specs, highlights, expert_review, cpu_brand, gpu_brand, chassis, stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ...fields, int(b.stock)).lastId;
      if (int(b.stock)) db.run('INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)', pid, int(b.stock), 'موجودی اولیه', userId);
    }
    if (b.upgrades) {
      db.run('DELETE FROM product_variants WHERE product_id = ?', pid);
      for (const type of ['ram', 'storage', 'display']) {
        (b.upgrades[type] || []).filter((v) => v.name).forEach((v, i) => db.run('INSERT INTO product_variants (product_id, type, name, price, sort) VALUES (?, ?, ?, ?, ?)', pid, type, v.name, int(v.price), i));
      }
    }
    if (Array.isArray(b.images)) {
      db.run('DELETE FROM product_images WHERE product_id = ?', pid);
      b.images.filter(Boolean).forEach((url, i) => db.run('INSERT INTO product_images (product_id, url, sort) VALUES (?, ?, ?)', pid, url, i));
    }
    return pid;
  });
}

r.post('/products', (req, res) => {
  try { res.json(serializeProduct(db.get('SELECT * FROM products WHERE id = ?', saveProduct(null, req.body, req.user?.id)), { full: true })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

r.put('/products/:id', (req, res) => {
  if (!db.get('SELECT id FROM products WHERE id = ?', req.params.id)) return res.status(404).json({ error: 'محصول یافت نشد.' });
  try { saveProduct(int(req.params.id), req.body, req.user?.id); res.json(serializeProduct(db.get('SELECT * FROM products WHERE id = ?', req.params.id), { full: true })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

r.patch('/products/:id', (req, res) => {
  const p = db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!p) return res.status(404).json({ error: 'محصول یافت نشد.' });
  const b = req.body || {};
  const stock = b.stockCount !== undefined ? int(b.stockCount) : b.stock !== undefined ? int(b.stock) : p.stock;
  const price = b.basePrice !== undefined ? int(b.basePrice) : p.base_price;
  const badge = b.badge !== undefined ? b.badge : p.badge;
  const active = b.active !== undefined ? (b.active ? 1 : 0) : p.active;
  db.run("UPDATE products SET stock = ?, base_price = ?, badge = ?, active = ?, updated_at = datetime('now') WHERE id = ?", stock, price, badge, active, p.id);
  if (stock !== p.stock) {
    db.run('INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)', p.id, stock - p.stock, 'ویرایش موجودی توسط مدیر', req.user?.id);
  }
  const updated = db.get('SELECT * FROM products WHERE id = ?', p.id);
  res.json(serializeProduct(updated, { full: true }));
});

r.delete('/products/:id', (req, res) => {
  const used = db.get('SELECT COUNT(*) AS c FROM order_items WHERE product_id = ?', req.params.id).c;
  if (used) {
    db.run('UPDATE products SET active = 0 WHERE id = ?', req.params.id);
    return res.json({ success: true, message: 'این محصول در سفارش‌ها استفاده شده و به‌جای حذف، غیرفعال شد.' });
  }
  db.run('DELETE FROM products WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// ---------- Stock ----------
r.post('/products/:id/stock', (req, res) => {
  const p = db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!p) return res.status(404).json({ error: 'محصول یافت نشد.' });
  const mode = req.body?.mode === 'set' ? 'set' : 'add';
  const value = int(req.body?.value);
  const delta = mode === 'set' ? value - p.stock : value;
  if (p.stock + delta < 0) return res.status(400).json({ error: 'موجودی نمی‌تواند منفی شود.' });
  db.tx(() => {
    db.run("UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?", delta, p.id);
    db.run('INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)', p.id, delta, req.body?.reason || (delta >= 0 ? 'ورود کالا' : 'اصلاح موجودی'), req.user?.id);
  });
  res.json({ stock: p.stock + delta });
});

r.get('/stock-log', (req, res) => {
  res.json(db.all(`SELECT l.id, l.delta, l.reason, l.created_at AS createdAt, p.name AS product, u.name AS user
    FROM stock_log l JOIN products p ON p.id = l.product_id LEFT JOIN users u ON u.id = l.user_id
    ${req.query.product ? 'WHERE l.product_id = ?' : ''} ORDER BY l.id DESC LIMIT 200`, ...(req.query.product ? [req.query.product] : [])));
});

// ---------- Orders ----------
const ORDER_STATUSES = ['pending_payment', 'paid', 'paid_backorder', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'];
r.get('/orders', (req, res) => {
  const where = req.query.status ? 'WHERE o.status = ?' : '';
  const rows = db.all(`SELECT o.*, u.name AS customer, u.mobile AS customer_mobile, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id ${where} ORDER BY o.id DESC LIMIT 300`, ...(req.query.status ? [req.query.status] : []));
  res.json(rows.map((o) => ({ ...orderWithItems(o), customer: o.customer, customerMobile: o.customer_mobile, customerEmail: o.customer_email })));
});

r.put('/orders/:id', (req, res) => {
  const { status, trackingCode } = req.body || {};
  if (status && !ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
  const o = db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!o) return res.status(404).json({ error: 'سفارش یافت نشد.' });
  db.run('UPDATE orders SET status = ?, tracking_code = ? WHERE id = ?', status || o.status, trackingCode ?? o.tracking_code, o.id);
  res.json({ success: true });
});

// ---------- Comments ----------
r.get('/comments', (req, res) => {
  const status = req.query.status || 'pending';
  res.json(db.all(`SELECT c.id, c.rating, c.body, c.status, c.created_at AS createdAt, u.name AS author, p.name AS product, p.slug
    FROM comments c JOIN users u ON u.id = c.user_id JOIN products p ON p.id = c.product_id
    ${status === 'all' ? '' : 'WHERE c.status = ?'} ORDER BY c.id DESC LIMIT 300`, ...(status === 'all' ? [] : [status])));
});

r.put('/comments/:id', (req, res) => {
  const s = req.body?.status;
  if (!['approved', 'rejected', 'pending'].includes(s)) return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
  db.run('UPDATE comments SET status = ? WHERE id = ?', s, req.params.id);
  res.json({ success: true });
});

r.delete('/comments/:id', (req, res) => { db.run('DELETE FROM comments WHERE id = ?', req.params.id); res.json({ success: true }); });

// ---------- Users ----------
r.get('/users', (_req, res) => {
  res.json(db.all('SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders FROM users u ORDER BY u.id DESC').map((u) => ({ ...publicUser(u), blocked: !!u.blocked, orders: u.orders })));
});

r.put('/users/:id', (req, res) => {
  const u = db.get('SELECT * FROM users WHERE id = ?', req.params.id);
  if (!u) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  if (u.id === req.user?.id && (req.body.role === 'customer' || req.body.blocked)) return res.status(400).json({ error: 'نمی‌توانید دسترسی خودتان را محدود کنید.' });
  const role = ['admin', 'customer'].includes(req.body.role) ? req.body.role : u.role;
  db.run('UPDATE users SET role = ?, blocked = ? WHERE id = ?', role, req.body.blocked === undefined ? u.blocked : req.body.blocked ? 1 : 0, u.id);
  if (req.body.newPassword) {
    if (String(req.body.newPassword).length < 8) return res.status(400).json({ error: 'رمز باید حداقل ۸ کاراکتر باشد.' });
    db.run('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', hashPassword(req.body.newPassword), u.id);
  }
  res.json({ success: true });
});

// ---------- Blog ----------
r.get('/blog', (_req, res) => res.json(db.all('SELECT * FROM blog_posts ORDER BY rowid DESC')));
r.post('/blog', (req, res) => {
  const b = req.body || {};
  const id = slugify(b.id || b.title) || 'post-' + Date.now();
  const productSlug = b.product_slug || b.productSlug || null;
  db.run(`INSERT INTO blog_posts (id, title, excerpt, category, author, author_role, author_avatar, date, read_time, image, content, published, product_slug)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, category=excluded.category,
    author=excluded.author, author_role=excluded.author_role, author_avatar=excluded.author_avatar, date=excluded.date, read_time=excluded.read_time,
    image=excluded.image, content=excluded.content, published=excluded.published, product_slug=excluded.product_slug`,
    id, b.title, b.excerpt, b.category, b.author, b.author_role, b.author_avatar, b.date, b.read_time, b.image, b.content, b.published === false || b.published === 0 ? 0 : 1, productSlug);
  res.json({ success: true, id });
});
r.delete('/blog/:id', (req, res) => { db.run('DELETE FROM blog_posts WHERE id = ?', req.params.id); res.json({ success: true }); });

// ---------- FAQ ----------
r.get('/faqs', (_req, res) => res.json(db.all('SELECT * FROM faqs ORDER BY category, sort, id')));
r.post('/faqs', (req, res) => {
  const { id, category, q, a, sort } = req.body || {};
  if (!category || !q || !a) return res.status(400).json({ error: 'همه فیلدها الزامی است.' });
  if (id) db.run('UPDATE faqs SET category=?, q=?, a=?, sort=? WHERE id=?', category, q, a, int(sort), id);
  else db.run('INSERT INTO faqs (category, q, a, sort) VALUES (?,?,?,?)', category, q, a, int(sort));
  res.json({ success: true });
});
r.delete('/faqs/:id', (req, res) => { db.run('DELETE FROM faqs WHERE id = ?', req.params.id); res.json({ success: true }); });

// ---------- Tickets ----------
r.get('/tickets', (_req, res) => res.json(db.all('SELECT * FROM tickets ORDER BY id DESC LIMIT 300')));
r.put('/tickets/:id', (req, res) => { db.run('UPDATE tickets SET status = ? WHERE id = ?', req.body?.status === 'closed' ? 'closed' : 'open', req.params.id); res.json({ success: true }); });

// ---------- Appointments (Showcase, Upgrade, Warranty) ----------
r.get('/appointments', (_req, res) => {
  const rows = db.all('SELECT * FROM appointments ORDER BY id DESC LIMIT 500');
  res.json(rows.map(r => ({
    ...r,
    services: JSON.parse(r.services || '[]')
  })));
});

r.put('/appointments/:id', (req, res) => {
  const { status, adminNotes } = req.body || {};
  db.run('UPDATE appointments SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes) WHERE id = ?',
    status || null, adminNotes !== undefined ? adminNotes : null, req.params.id);
  res.json({ success: true });
});

r.delete('/appointments/:id', (req, res) => {
  db.run('DELETE FROM appointments WHERE id = ?', req.params.id);
  res.json({ success: true });
});

// ---------- Inventory & Logistics Hub ----------
r.get('/inventory/shipments', (_req, res) => {
  const rows = db.all(`
    SELECT s.*, p.slug AS product_slug, p.image AS product_image
    FROM inventory_shipments s
    LEFT JOIN products p ON p.id = s.product_id
    ORDER BY s.id DESC LIMIT 300
  `);
  res.json(rows);
});

r.post('/inventory/shipments', (req, res) => {
  const {
    type, // 'inbound' | 'outbound'
    productId,
    productName,
    sku,
    quantity,
    unitCost,
    batchCode,
    supplierOrDest,
    courier,
    shelfLocation,
    notes
  } = req.body || {};

  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'تعداد باید عددی بزرگتر از صفر باشد.' });

  const prod = productId ? db.get('SELECT * FROM products WHERE id = ?', productId) : null;
  const prodName = prod ? prod.name : (productName || 'کالای عمومی انبار');
  const trackingNumber = (type === 'inbound' ? 'IN-' : 'OUT-') + Date.now().toString().slice(-6);

  db.tx(() => {
    // 1. Insert shipment record
    db.run(`
      INSERT INTO inventory_shipments (
        tracking_number, type, product_id, product_name, sku, quantity,
        unit_cost, batch_code, supplier_or_dest, courier, shelf_location, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, trackingNumber, type, prod?.id || null, prodName, sku || prod?.slug || '', qty,
       unitCost || 0, batchCode || '', supplierOrDest || '', courier || '', shelfLocation || '', notes || '', req.user?.name || 'مدیر انبار');

    // 2. Adjust stock in products table & stock_log
    if (prod) {
      const delta = type === 'inbound' ? qty : -qty;
      const newStock = Math.max(0, (prod.stock || 0) + delta);
      db.run('UPDATE products SET stock = ? WHERE id = ?', newStock, prod.id);
      db.run('INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)',
        prod.id, delta, `${type === 'inbound' ? 'ورود به انبار' : 'خروج کالا'} (${trackingNumber}) - ${supplierOrDest || ''} ${notes || ''}`.trim(), req.user?.id || null);
    }
  });

  res.json({ success: true, trackingNumber });
});

r.get('/inventory/stock-log', (_req, res) => {
  const rows = db.all(`
    SELECT sl.*, p.name AS product_name, p.slug AS product_slug, u.name AS user_name
    FROM stock_log sl
    JOIN products p ON p.id = sl.product_id
    LEFT JOIN users u ON u.id = sl.user_id
    ORDER BY sl.id DESC LIMIT 200
  `);
  res.json(rows);
});

// ---------- Settings ----------
const EDITABLE = [
  'store_name', 'site_url', 'banner_text', 'shipping_fee', 'zarinpal_merchant_id', 'zarinpal_sandbox', 'torob_token', 'low_stock_threshold',
  'gateway_zarinpal_active', 'gateway_mellat_active', 'gateway_saman_active', 'gateway_parsian_active',
  'gateway_card_active', 'gateway_cod_active', 'card_number', 'card_holder',
  'store_address', 'store_phone', 'store_mobile', 'store_hours', 'store_map_link', 'store_about',
  'telegram_url', 'instagram_url', 'bale_url', 'aparat_url',
  'homepage_announcement', 'homepage_hero', 'homepage_promotion', 'homepage_showcase'
];
r.get('/settings', (_req, res) => {
  const all = getSettings();
  res.json(all);
});

r.patch('/settings', (req, res) => {
  for (const [k, v] of Object.entries(req.body || {})) {
    if (EDITABLE.includes(k)) {
      setSetting(k, v);
    }
  }
  res.json(getSettings());
});

// ---------- Homepage Customizer API ----------
r.get('/homepage', (_req, res) => {
  const getJson = (key, fallback) => {
    try {
      const v = getSetting(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  };

  const announcement = getJson('homepage_announcement', {});
  const hero = getJson('homepage_hero', {});
  const promotion = getJson('homepage_promotion', {});
  const showcase = getJson('homepage_showcase', { productSlugs: [] });
  const products = db.all('SELECT id, slug, name, brand, model, base_price, old_price, image, category, grade, stock FROM products WHERE active = 1 ORDER BY id DESC');

  res.json({
    announcement,
    hero,
    promotion,
    showcase,
    availableProducts: products
  });
});

r.put('/homepage', (req, res) => {
  const { announcement, hero, promotion, showcase } = req.body || {};
  if (announcement !== undefined) setSetting('homepage_announcement', typeof announcement === 'string' ? announcement : JSON.stringify(announcement));
  if (hero !== undefined) setSetting('homepage_hero', typeof hero === 'string' ? hero : JSON.stringify(hero));
  if (promotion !== undefined) setSetting('homepage_promotion', typeof promotion === 'string' ? promotion : JSON.stringify(promotion));
  if (showcase !== undefined) setSetting('homepage_showcase', typeof showcase === 'string' ? showcase : JSON.stringify(showcase));
  res.json({ success: true, message: 'تنظیمات صفحه اصلی با موفقیت ذخیره شد.' });
});

// ---------- Product Drivers Management ----------
r.get('/products/:slug/drivers', (req, res) => {
  res.json(db.all('SELECT * FROM drivers WHERE product_slug = ? ORDER BY id DESC', req.params.slug));
});

r.post('/products/:slug/drivers', (req, res) => {
  const { name, version, date, size, category, downloadUrl, modelName } = req.body || {};
  if (!name) return res.status(400).json({ error: 'نام درایور الزامی است.' });
  const { lastId } = db.run(
    'INSERT INTO drivers (product_slug, model_name, name, date, size, version, category, download_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    req.params.slug, modelName || req.params.slug, name, date || '۱۴۰۴/۱۲', size || '150 MB', version || '1.0.0', category || 'نرم‌افزار و بایوس', downloadUrl || '#'
  );
  res.json({ success: true, id: lastId });
});

r.delete('/drivers/:id', (req, res) => {
  db.run('DELETE FROM drivers WHERE id = ?', req.params.id);
  res.json({ success: true });
});

export default r;
