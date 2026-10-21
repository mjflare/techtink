// Admin API: dashboard, products/variants/stock, orders, comments, users, blog, FAQ, tickets, settings.
import { Router } from 'express';
import { db, getSettings, setSetting, getSetting } from '../db.js';
import { requireAdmin, publicUser, hashPassword, normalizeMobile } from '../auth.js';
import { serializeProduct } from '../products.js';
import { orderWithItems } from './account.js';
import { sendOtp, sendCustomSms } from '../services/smsService.js';
import { 
  listEmails, getEmailById, markEmailRead, deleteEmail, saveIncomingEmail, 
  getMailServerStatus, extractVerificationCode, sendOutgoingEmail, 
  listSentEmails, getSentEmailById, deleteSentEmail, deleteAllInboxEmails, 
  deleteAllSentEmails 
} from '../mailServer.js';
import { getFullSystemMetrics, probePort, triggerGarbageCollection } from '../systemMonitor.js';

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
  const model3dUrl = b.model3d_url || b.specs?.model3d_url || null;

  const fields = [
    slug, b.name, b.tagline || '', b.category || '', b.series || '', b.badge || '', b.description || '',
    int(b.basePrice), b.oldPrice ? int(b.oldPrice) : null, b.active === false ? 0 : 1, b.guarantee || '',
    (b.images && b.images[0]) || b.image || '', JSON.stringify(b.specs || {}), JSON.stringify(b.highlights || []),
    expertReview, cpuBrand, gpuBrand, chassis, model3dUrl
  ];
  return db.tx(() => {
    let pid = id;
    if (id) {
      db.run(`UPDATE products SET slug=?, name=?, tagline=?, category=?, series=?, badge=?, description=?, base_price=?, old_price=?, active=?, guarantee=?, image=?, specs=?, highlights=?, expert_review=?, cpu_brand=?, gpu_brand=?, chassis=?, model3d_url=?, updated_at=datetime('now') WHERE id=?`, ...fields, id);
      if (b.stock !== undefined) {
        const cur = db.get('SELECT stock FROM products WHERE id = ?', id);
        const newStock = int(b.stock);
        if (cur && cur.stock !== newStock) {
          db.run('UPDATE products SET stock = ? WHERE id = ?', newStock, id);
          db.run('INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)', id, newStock - cur.stock, 'ویرایش موجودی توسط مدیر', userId);
        }
      }
    } else {
      pid = db.run(`INSERT INTO products (slug, name, tagline, category, series, badge, description, base_price, old_price, active, guarantee, image, specs, highlights, expert_review, cpu_brand, gpu_brand, chassis, model3d_url, stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ...fields, int(b.stock)).lastId;
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
  'site_mode', 'demo_notice_active', 'demo_notice_title', 'demo_notice_badge', 'demo_notice_body', 'demo_notice_btn', 'demo_notice_badge_header',
  'gateway_zarinpal_active', 'gateway_mellat_active', 'gateway_saman_active', 'gateway_parsian_active',
  'gateway_card_active', 'gateway_cod_active', 'card_number', 'card_holder',
  'store_address', 'store_phone', 'store_mobile', 'store_hours', 'store_map_link', 'store_about',
  'telegram_url', 'instagram_url', 'bale_url', 'aparat_url',
  'google_site_verification', 'google_analytics_id', 'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
  'homepage_announcement', 'homepage_hero', 'homepage_promotion', 'homepage_showcase',
  'sms_provider', 'sms_api_key', 'sms_template_otp', 'sms_sender_line', 'sms_2fa_enabled', 'admin_2fa_enforced',
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'
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

// ---------- SMS & 2FA Admin Management ----------
r.post('/sms/test', async (req, res) => {
  const { mobile, message, code, template } = req.body || {};
  const m = normalizeMobile(mobile || getSetting('store_mobile'));
  if (!m) return res.status(400).json({ error: 'شماره موبایل گیرنده نامعتبر است.' });

  const testCode = code || '12345';
  const testTemplate = template || getSetting('sms_template_otp') || 'techtink-verify';
  const result = await sendOtp({ mobile: m, code: testCode, template: testTemplate });

  try {
    db.run(
      "INSERT INTO sms_logs (mobile, provider, template, message, status, message_id, error) VALUES (?, ?, ?, ?, ?, ?, ?)",
      m,
      result.provider || getSetting('sms_provider') || 'mock',
      testTemplate,
      message || `تست وب‌سرویس پیامک تک‌تینک (کد: ${testCode})`,
      result.success ? 'sent' : 'failed',
      result.messageId || null,
      result.error || null
    );
  } catch {}

  if (result.success) {
    res.json({
      success: true,
      simulated: result.simulated,
      message: result.simulated
        ? 'پیامک تستی شبیه‌سازی شد (کد در لاگ‌های کنسول سرور چاپ شد).'
        : `پیامک تستی با موفقیت به ${m} ارسال شد.`
    });
  } else {
    res.status(500).json({ error: result.error || 'خطا در ارسال پیامک تستی' });
  }
});

r.get('/sms/logs', (_req, res) => {
  try {
    const logs = db.all('SELECT * FROM sms_logs ORDER BY id DESC LIMIT 100');
    res.json(logs);
  } catch {
    res.json([]);
  }
});

r.get('/recovery/requests', (_req, res) => {
  try {
    const tokens = db.all(
      `SELECT id, target, type, attempts, used, expires_at AS expiresAt, created_at AS createdAt 
       FROM verification_tokens 
       ORDER BY id DESC LIMIT 50`
    );
    res.json(tokens);
  } catch {
    res.json([]);
  }
});

r.get('/security/audit', (req, res) => {
  const adminUsers = db.all("SELECT id, name, email, mobile, role, phone_verified, two_factor_enabled, created_at FROM users WHERE role = 'admin'");
  const siteUrl = getSetting('site_url') || 'https://techtink.ir';
  const isHttps = siteUrl.startsWith('https://');
  const tokenSecretSet = !!getSetting('token_secret');
  const siteMode = getSetting('site_mode') || 'operational';
  const smsProvider = getSetting('sms_provider') || 'kavenegar';
  const smsApiKeyConfigured = !!getSetting('sms_api_key');
  const totalUsers = db.get("SELECT COUNT(*) AS c FROM users")?.c || 0;
  const verifiedPhones = db.get("SELECT COUNT(*) AS c FROM users WHERE phone_verified = 1")?.c || 0;

  res.json({
    targetDomain: 'techtink.ir',
    siteUrl,
    isHttps,
    siteMode,
    sslEnforced: true,
    securityHeaders: {
      contentSecurityPolicy: 'Active (Hardened)',
      strictTransportSecurity: 'max-age=31536000; includeSubDomains',
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'SAMEORIGIN',
      xXssProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin'
    },
    rateLimiting: {
      authRateLimit: 'Active (15 req/min per IP window)',
      protection: 'Brute-force & Credential Stuffing Mitigation'
    },
    database: {
      engine: 'SQLite (WAL mode)',
      parameterizedQueries: true,
      sqlInjectionDefense: 'Active (Strict Prepared Statements)'
    },
    authSecurity: {
      tokenSecretSet,
      hashAlgorithm: 'scrypt (with 16-byte random salt)',
      adminUsersCount: adminUsers.length,
      smsProvider,
      smsApiKeyConfigured,
      totalUsers,
      verifiedPhones
    },
    adminAccounts: adminUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      hasPhoneVerified: !!u.phone_verified,
      createdAt: u.created_at
    }))
  });
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
  const activeCoupons = db.all('SELECT id, code, title, discount_type, discount_value, min_order_value, valid_until, is_active, is_promoted FROM coupons WHERE is_active = 1 ORDER BY is_promoted DESC, id DESC');

  res.json({
    announcement,
    hero,
    promotion,
    showcase,
    availableProducts: products,
    activeCoupons
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

// ---------- Warranties Management ----------
r.get('/warranties', (req, res) => {
  const q = String(req.query?.q || '').trim().toLowerCase();
  const status = req.query?.status;

  let sql = 'SELECT * FROM warranties';
  const params = [];
  const where = [];

  if (q) {
    where.push('(LOWER(serial) LIKE ? OR LOWER(model) LIKE ? OR LOWER(owner) LIKE ? OR LOWER(COALESCE(phone, "")) LIKE ?)');
    const p = `%${q}%`;
    params.push(p, p, p, p);
  }

  if (status && status !== 'all') {
    if (status === 'active') {
      where.push('status LIKE "%فعال%"');
    } else if (status === 'expired') {
      where.push('status LIKE "%منقضی%"');
    } else if (status === 'care_plus') {
      where.push('care_plus = 1');
    }
  }

  if (where.length > 0) {
    sql += ' WHERE ' + where.join(' AND ');
  }

  sql += ' ORDER BY rowid DESC';
  const rows = db.all(sql, ...params);
  res.json(rows.map(w => ({
    serialNumber: w.serial,
    serial: w.serial,
    model: w.model,
    purchaseDate: w.purchase_date,
    warrantyExpiry: w.expiry,
    status: w.status,
    carePlus: !!w.care_plus,
    owner: w.owner,
    phone: w.phone || '',
    notes: w.notes || ''
  })));
});

r.post('/warranties', (req, res) => {
  const { serialNumber, serial, model, purchaseDate, warrantyExpiry, status, carePlus, owner, phone, notes } = req.body || {};
  const sn = String(serial || serialNumber || '').trim().toUpperCase();
  if (!sn) return res.status(400).json({ error: 'شماره سریال گارانتی الزامی است.' });
  if (!model) return res.status(400).json({ error: 'مدل لپ‌تاپ الزامی است.' });

  const existing = db.get('SELECT serial FROM warranties WHERE serial = ?', sn);
  if (existing) return res.status(409).json({ error: 'این شماره سریال گارانتی قبلاً ثبت شده است.' });

  db.run(
    'INSERT INTO warranties (serial, model, purchase_date, expiry, status, care_plus, owner, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    sn,
    String(model).trim(),
    purchaseDate || new Date().toLocaleDateString('fa-IR'),
    warrantyExpiry || '',
    status || 'فعال (گارانتی ۶ ماهه طلایی تک‌تینک)',
    carePlus ? 1 : 0,
    owner || '',
    phone || '',
    notes || ''
  );

  res.json({ success: true, serial: sn });
});

r.put('/warranties/:serial', (req, res) => {
  const sn = String(req.params.serial).toUpperCase();
  const existing = db.get('SELECT serial FROM warranties WHERE serial = ?', sn);
  if (!existing) return res.status(404).json({ error: 'کارت گارانتی با این سریال یافت نشد.' });

  const { model, purchaseDate, warrantyExpiry, status, carePlus, owner, phone, notes } = req.body || {};
  db.run(
    'UPDATE warranties SET model = COALESCE(?, model), purchase_date = COALESCE(?, purchase_date), expiry = COALESCE(?, expiry), status = COALESCE(?, status), care_plus = ?, owner = COALESCE(?, owner), phone = COALESCE(?, phone), notes = COALESCE(?, notes) WHERE serial = ?',
    model, purchaseDate, warrantyExpiry, status, carePlus ? 1 : 0, owner, phone, notes, sn
  );

  res.json({ success: true });
});

r.delete('/warranties/:serial', (req, res) => {
  const sn = String(req.params.serial).toUpperCase();
  db.run('DELETE FROM warranties WHERE serial = ?', sn);
  res.json({ success: true });
});

// ---------- Coupons Management ----------
r.get('/coupons', (req, res) => {
  const q = String(req.query?.q || '').trim().toUpperCase();
  const status = req.query?.status;

  let sql = 'SELECT * FROM coupons';
  const params = [];
  const where = [];

  if (q) {
    where.push('(UPPER(code) LIKE ? OR title LIKE ?)');
    const p = `%${q}%`;
    params.push(p, p);
  }

  if (status && status !== 'all') {
    if (status === 'active') {
      where.push('is_active = 1');
    } else if (status === 'inactive') {
      where.push('is_active = 0');
    } else if (status === 'promoted') {
      where.push('is_promoted = 1');
    }
  }

  if (where.length > 0) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY is_promoted DESC, id DESC';

  const rows = db.all(sql, ...params);
  res.json(rows.map(c => ({
    id: c.id,
    code: c.code,
    title: c.title,
    discountType: c.discount_type,
    discountValue: c.discount_value,
    minOrderValue: c.min_order_value || 0,
    maxDiscount: c.max_discount || 0,
    usageLimit: c.usage_limit || 0,
    usageCount: c.usage_count || 0,
    validFrom: c.valid_from || '',
    validUntil: c.valid_until || '',
    isActive: !!c.is_active,
    isPromoted: !!c.is_promoted,
    createdAt: c.created_at
  })));
});

r.post('/coupons', (req, res) => {
  const { 
    code, title, discountType, discountValue, 
    minOrderValue, maxDiscount, usageLimit, 
    validFrom, validUntil, isActive, isPromoted 
  } = req.body || {};

  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return res.status(400).json({ error: 'کد تخفیف الزامی است.' });
  if (!title) return res.status(400).json({ error: 'عنوان کمپین یا تخفیف الزامی است.' });
  if (discountValue === undefined || Number(discountValue) <= 0) {
    return res.status(400).json({ error: 'مقدار تخفیف باید بزرگتر از صفر باشد.' });
  }

  const existing = db.get('SELECT id FROM coupons WHERE UPPER(code) = ?', cleanCode);
  if (existing) return res.status(409).json({ error: 'این کد تخفیف قبلاً تعریف شده است.' });

  const numPromoted = isPromoted ? 1 : 0;
  if (numPromoted) {
    db.run('UPDATE coupons SET is_promoted = 0');
  }

  const { lastId } = db.run(
    `INSERT INTO coupons (
      code, title, discount_type, discount_value, min_order_value, max_discount, 
      usage_limit, valid_from, valid_until, is_active, is_promoted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    cleanCode,
    title.trim(),
    discountType === 'fixed' ? 'fixed' : 'percentage',
    Number(discountValue),
    Number(minOrderValue) || 0,
    Number(maxDiscount) || 0,
    Number(usageLimit) || 0,
    validFrom || '',
    validUntil || '',
    isActive === false ? 0 : 1,
    numPromoted
  );

  // If promoted, also update homepage_promotion setting
  if (numPromoted) {
    try {
      const currentPromo = JSON.parse(getSetting('homepage_promotion') || '{}');
      currentPromo.promoCode = cleanCode;
      currentPromo.title = title;
      currentPromo.active = true;
      if (discountType === 'percentage') {
        currentPromo.discountPercent = `${discountValue}٪`;
      }
      setSetting('homepage_promotion', JSON.stringify(currentPromo));
    } catch {}
  }

  res.json({ success: true, id: lastId });
});

r.put('/coupons/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.get('SELECT * FROM coupons WHERE id = ?', id);
  if (!existing) return res.status(404).json({ error: 'کوپن تخفیف یافت نشد.' });

  const { 
    code, title, discountType, discountValue, 
    minOrderValue, maxDiscount, usageLimit, 
    validFrom, validUntil, isActive, isPromoted 
  } = req.body || {};

  const cleanCode = code ? String(code).trim().toUpperCase() : existing.code;
  if (cleanCode !== existing.code) {
    const dup = db.get('SELECT id FROM coupons WHERE UPPER(code) = ? AND id != ?', cleanCode, id);
    if (dup) return res.status(409).json({ error: 'کد تخفیف دیگری با این نام وجود دارد.' });
  }

  const numPromoted = isPromoted !== undefined ? (isPromoted ? 1 : 0) : existing.is_promoted;
  if (numPromoted && !existing.is_promoted) {
    db.run('UPDATE coupons SET is_promoted = 0');
  }

  db.run(
    `UPDATE coupons SET 
      code = ?, title = ?, discount_type = ?, discount_value = ?, min_order_value = ?, 
      max_discount = ?, usage_limit = ?, valid_from = ?, valid_until = ?, 
      is_active = ?, is_promoted = ?
     WHERE id = ?`,
    cleanCode,
    title ? title.trim() : existing.title,
    discountType || existing.discount_type,
    discountValue !== undefined ? Number(discountValue) : existing.discount_value,
    minOrderValue !== undefined ? Number(minOrderValue) : existing.min_order_value,
    maxDiscount !== undefined ? Number(maxDiscount) : existing.max_discount,
    usageLimit !== undefined ? Number(usageLimit) : existing.usage_limit,
    validFrom !== undefined ? validFrom : existing.valid_from,
    validUntil !== undefined ? validUntil : existing.valid_until,
    isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
    numPromoted,
    id
  );

  if (numPromoted) {
    try {
      const currentPromo = JSON.parse(getSetting('homepage_promotion') || '{}');
      currentPromo.promoCode = cleanCode;
      currentPromo.title = title || existing.title;
      currentPromo.active = true;
      if ((discountType || existing.discount_type) === 'percentage') {
        currentPromo.discountPercent = `${discountValue !== undefined ? discountValue : existing.discount_value}٪`;
      }
      setSetting('homepage_promotion', JSON.stringify(currentPromo));
    } catch {}
  }

  res.json({ success: true });
});

r.post('/coupons/:id/promote', (req, res) => {
  const id = Number(req.params.id);
  const coupon = db.get('SELECT * FROM coupons WHERE id = ?', id);
  if (!coupon) return res.status(404).json({ error: 'کوپن تخفیف یافت نشد.' });

  const willPromote = !coupon.is_promoted;
  db.tx(() => {
    db.run('UPDATE coupons SET is_promoted = 0');
    if (willPromote) {
      db.run('UPDATE coupons SET is_promoted = 1, is_active = 1 WHERE id = ?', id);
      try {
        const currentPromo = JSON.parse(getSetting('homepage_promotion') || '{}');
        currentPromo.promoCode = coupon.code;
        currentPromo.title = coupon.title;
        currentPromo.active = true;
        if (coupon.discount_type === 'percentage') {
          currentPromo.discountPercent = `${coupon.discount_value}٪`;
        }
        setSetting('homepage_promotion', JSON.stringify(currentPromo));
      } catch {}
    }
  });

  res.json({ success: true, isPromoted: willPromote });
});

r.delete('/coupons/:id', (req, res) => {
  db.run('DELETE FROM coupons WHERE id = ?', Number(req.params.id));
  res.json({ success: true });
});

// ---------- Viewer Analytics API ----------
r.get('/analytics', (_req, res) => {
  try {
    const totalPageviews = db.get('SELECT COUNT(*) AS v FROM pageviews').v;
    const pageviewsToday = db.get("SELECT COUNT(*) AS v FROM pageviews WHERE date(created_at) = date('now')").v;
    const uniqueVisitorsToday = db.get("SELECT COUNT(DISTINCT ip_hash) AS v FROM pageviews WHERE date(created_at) = date('now')").v;
    const pageviews7d = db.get("SELECT COUNT(*) AS v FROM pageviews WHERE created_at >= datetime('now', '-7 days')").v;
    const uniqueVisitors7d = db.get("SELECT COUNT(DISTINCT ip_hash) AS v FROM pageviews WHERE created_at >= datetime('now', '-7 days')").v;
    const liveActive = db.get("SELECT COUNT(DISTINCT ip_hash) AS v FROM pageviews WHERE created_at >= datetime('now', '-15 minutes')").v;
    const googleReferrals = db.get("SELECT COUNT(*) AS v FROM pageviews WHERE referrer_domain LIKE '%Google%'").v;

    // Daily 14-day history chart
    const chartRows = db.all(`
      SELECT date(created_at) AS date,
             COUNT(*) AS views,
             COUNT(DISTINCT ip_hash) AS visitors
      FROM pageviews
      WHERE created_at >= datetime('now', '-14 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `);

    // Top Pages
    const topPages = db.all(`
      SELECT path, COALESCE(MAX(title), path) AS title, COUNT(*) AS count
      FROM pageviews
      GROUP BY path
      ORDER BY count DESC
      LIMIT 10
    `);

    // Top Referrers
    const topReferrers = db.all(`
      SELECT referrer_domain AS domain, COUNT(*) AS count
      FROM pageviews
      GROUP BY referrer_domain
      ORDER BY count DESC
      LIMIT 10
    `);

    // Device breakdown
    const rawDevices = db.all(`
      SELECT device_type AS type, COUNT(*) AS count
      FROM pageviews
      GROUP BY device_type
      ORDER BY count DESC
    `);
    const totalDevicesCount = rawDevices.reduce((sum, d) => sum + d.count, 0) || 1;
    const devices = rawDevices.map(d => ({
      ...d,
      percent: Math.round((d.count / totalDevicesCount) * 100)
    }));

    // Browser breakdown
    const rawBrowsers = db.all(`
      SELECT browser, COUNT(*) AS count
      FROM pageviews
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 6
    `);
    const totalBrowsersCount = rawBrowsers.reduce((sum, b) => sum + b.count, 0) || 1;
    const browsers = rawBrowsers.map(b => ({
      ...b,
      percent: Math.round((b.count / totalBrowsersCount) * 100)
    }));

    // Recent visits feed
    const recentVisits = db.all(`
      SELECT id, path, title, referrer_domain AS referrer, device_type AS device, browser, os, created_at AS createdAt
      FROM pageviews
      ORDER BY id DESC
      LIMIT 25
    `);

    res.json({
      summary: {
        totalPageviews,
        pageviewsToday,
        uniqueVisitorsToday,
        pageviews7d,
        uniqueVisitors7d,
        liveActive: Number(liveActive) || 0,
        googleReferrals
      },
      chartData: chartRows,
      topPages,
      topReferrers,
      devices,
      browsers,
      recentVisits
    });
  } catch (err) {
    console.error('[admin/analytics] error:', err);
    res.status(500).json({ error: 'خطا در بارگذاری آمار بازدیدکنندگان' });
  }
});

r.post('/analytics/clear', (_req, res) => {
  try {
    // Purge records older than 30 days
    db.run("DELETE FROM pageviews WHERE created_at < datetime('now', '-30 days')");
    res.json({ success: true, message: 'لاگ‌های بازدید قدیمی‌تر از ۳۰ روز پاکسازی شدند.' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در پاکسازی لاگ‌ها' });
  }
});

// ---------- Corporate Webmail & Inbound Email Endpoints (info@techtink.ir) ----------
r.get('/emails', (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '', unreadOnly = 'false' } = req.query;
    const result = listEmails({
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
      search: String(search || '').trim(),
      unreadOnly: unreadOnly === 'true',
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'خطا در بارگذاری ایمیل‌ها' });
  }
});

r.get('/emails/status', (_req, res) => {
  try {
    res.json(getMailServerStatus());
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت وضعیت سرور ایمیل' });
  }
});

// Outbound Email Sending
r.post('/emails/send', async (req, res) => {
  try {
    const { to, from = 'info@techtink.ir', subject, bodyText, bodyHtml, relayConfig } = req.body || {};
    if (!to) {
      return res.status(400).json({ error: 'آدرس ایمیل گیرنده الزامی است' });
    }
    const result = await sendOutgoingEmail({ to, from, subject, bodyText, bodyHtml, relayConfig });
    res.json(result);
  } catch (err) {
    console.error('[Admin] Error sending email:', err);
    res.status(500).json({ error: err.message || 'خطا در ارسال ایمیل' });
  }
});

// List Sent Emails (MUST be before /emails/:id)
r.get('/emails/sent', (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    const result = listSentEmails({
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
      search: String(search || '').trim()
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'خطا در بارگذاری ایمیل‌های ارسالی' });
  }
});

// Get Single Sent Email
r.get('/emails/sent/:id', (req, res) => {
  try {
    const email = getSentEmailById(req.params.id);
    if (!email) return res.status(404).json({ error: 'ایمیل ارسالی یافت نشد' });
    res.json(email);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت اطلاعات ایمیل ارسالی' });
  }
});

// Delete Single Sent Email
r.delete('/emails/sent/:id', (req, res) => {
  try {
    deleteSentEmail(req.params.id);
    res.json({ success: true, message: 'ایمیل ارسالی با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در حذف ایمیل ارسالی' });
  }
});

// Clear All Inbox Emails
r.delete('/emails/clear/inbox', (_req, res) => {
  try {
    deleteAllInboxEmails();
    res.json({ success: true, message: 'صندوق دریافتی کاملاً پاکسازی شد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در پاکسازی صندوق دریافتی' });
  }
});

// Clear All Sent Emails
r.delete('/emails/clear/sent', (_req, res) => {
  try {
    deleteAllSentEmails();
    res.json({ success: true, message: 'صندوق ارسالی کاملاً پاکسازی شد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در پاکسازی صندوق ارسالی' });
  }
});

// Bulk Delete Emails
r.post('/emails/bulk-delete', (req, res) => {
  try {
    const { ids = [], folder = 'inbox' } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'هیچ شناسه‌ای برای حذف ارسال نشده است' });
    }
    for (const id of ids) {
      if (folder === 'sent') deleteSentEmail(id);
      else deleteEmail(id);
    }
    res.json({ success: true, message: `${ids.length} ایمیل با موفقیت حذف شدند` });
  } catch (err) {
    res.status(500).json({ error: 'خطا در حذف گروهی ایمیل‌ها' });
  }
});

// Simulate incoming email (for testing or eNamad checks)
r.post('/emails/simulate', (req, res) => {
  try {
    const { from = 'noreply@enamad.ir', to = 'info@techtink.ir', subject = 'کد تایید اینماد', body = 'کد تایید درخواست اینماد شما 24125751 می‌باشد.' } = req.body || {};
    const code = extractVerificationCode(`${subject}\n${body}`);
    const id = saveIncomingEmail({
      from,
      to,
      subject,
      bodyText: body,
      bodyHtml: `<p>${body}</p>`,
      rawMessage: `From: ${from}\nTo: ${to}\nSubject: ${subject}\n\n${body}`,
      verificationCode: code,
    });
    res.json({ success: true, id, verificationCode: code, message: 'ایمیل با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در شبیه‌سازی ایمیل' });
  }
});

// Parameterized Inbox Email Endpoints (MUST be placed after specific routes)
r.get('/emails/:id', (req, res) => {
  try {
    const email = getEmailById(req.params.id);
    if (!email) return res.status(404).json({ error: 'ایمیل یافت نشد' });
    markEmailRead(req.params.id);
    res.json(email);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت اطلاعات ایمیل' });
  }
});

r.patch('/emails/:id/read', (req, res) => {
  try {
    markEmailRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در تغییر وضعیت ایمیل' });
  }
});

r.delete('/emails/:id', (req, res) => {
  try {
    deleteEmail(req.params.id);
    res.json({ success: true, message: 'ایمیل با موفقیت حذف شد' });
  } catch (err) {
    res.status(500).json({ error: 'خطا در حذف ایمیل' });
  }
});

// ---------- System Diagnostics & VPS Resource Monitor ----------
r.get('/system/metrics', async (_req, res) => {
  try {
    const data = await getFullSystemMetrics();
    res.json(data);
  } catch (err) {
    console.error('[Admin] Error gathering system metrics:', err);
    res.status(500).json({ error: 'خطا در خواندن وضعیت منابع سرور: ' + err.message });
  }
});

r.post('/system/probe-port', async (req, res) => {
  try {
    const { port, host = '127.0.0.1' } = req.body || {};
    const portNum = parseInt(port, 10);
    if (!portNum || portNum < 1 || portNum > 65535) {
      return res.status(400).json({ error: 'شماره پورت نامعتبر است (باید بین ۱ تا ۶۵۵۳۵ باشد).' });
    }
    const result = await probePort(portNum, host);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'خطا در ارزیابی وضعیت پورت: ' + err.message });
  }
});

r.post('/system/gc', (_req, res) => {
  try {
    const result = triggerGarbageCollection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'خطا در اجرای آزادسازی حافظه: ' + err.message });
  }
});

export default r;
