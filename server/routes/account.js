// Customer accounts, comments and orders.
import { Router } from 'express';
import { db, getSetting } from '../db.js';
import { hashPassword, verifyPassword, issueToken, publicUser, requireUser, normalizeMobile } from '../auth.js';
import { priceCart } from '../products.js';

const r = Router();
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''));

r.post('/auth/register', (req, res) => {
  const { name, mobile, phone, email, password } = req.body || {};
  const rawPhone = mobile || phone;
  const m = rawPhone ? normalizeMobile(rawPhone) : null;
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'نام را وارد کنید.' });
  if (rawPhone && !m) return res.status(400).json({ error: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'ایمیل معتبر نیست.' });
  if (!m && !email) return res.status(400).json({ error: 'موبایل یا ایمیل الزامی است.' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  const e = email ? String(email).toLowerCase().trim() : null;
  if (db.get('SELECT id FROM users WHERE (mobile IS NOT NULL AND mobile = ?) OR (email IS NOT NULL AND email = ?)', m, e)) {
    return res.status(409).json({ error: 'کاربری با این موبایل یا ایمیل قبلاً ثبت‌نام کرده است.' });
  }
  const { lastId } = db.run('INSERT INTO users (name, mobile, email, password_hash) VALUES (?, ?, ?, ?)', String(name).trim(), m, e, hashPassword(password));
  const user = db.get('SELECT * FROM users WHERE id = ?', lastId);
  res.json({ success: true, token: issueToken(user), user: publicUser(user) });
});

r.post('/auth/login', (req, res) => {
  const { login, email, mobile, phone, password } = req.body || {};
  const identifier = String(login || email || mobile || phone || '').trim();
  const m = normalizeMobile(identifier);
  const user = m
    ? db.get('SELECT * FROM users WHERE mobile = ?', m)
    : db.get('SELECT * FROM users WHERE email = ?', identifier.toLowerCase());
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
  }
  if (user.blocked) return res.status(403).json({ error: 'حساب کاربری شما مسدود شده است.' });
  res.json({ success: true, token: issueToken(user), user: publicUser(user) });
});

r.get('/auth/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

r.put('/auth/profile', requireUser, (req, res) => {
  const { name, mobile, email } = req.body || {};
  const m = mobile ? normalizeMobile(mobile) : null;
  if (mobile && !m) return res.status(400).json({ error: 'شماره موبایل معتبر نیست.' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'ایمیل معتبر نیست.' });
  const e = email ? String(email).toLowerCase().trim() : null;
  if (!m && !e) return res.status(400).json({ error: 'موبایل یا ایمیل الزامی است.' });
  const clash = db.get('SELECT id FROM users WHERE id != ? AND ((mobile IS NOT NULL AND mobile = ?) OR (email IS NOT NULL AND email = ?))', req.user.id, m, e);
  if (clash) return res.status(409).json({ error: 'این موبایل یا ایمیل متعلق به کاربر دیگری است.' });
  db.run('UPDATE users SET name = ?, mobile = ?, email = ? WHERE id = ?', name || req.user.name, m, e, req.user.id);
  res.json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

r.put('/auth/password', requireUser, (req, res) => {
  const { current, next } = req.body || {};
  if (!verifyPassword(String(current || ''), req.user.password_hash)) return res.status(400).json({ error: 'رمز فعلی اشتباه است.' });
  if (!next || String(next).length < 8) return res.status(400).json({ error: 'رمز جدید باید حداقل ۸ کاراکتر باشد.' });
  db.run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', hashPassword(next), req.user.id);
  res.json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

// ---- Comments ----
r.post('/products/:slug/comments', requireUser, (req, res) => {
  const p = db.get('SELECT id FROM products WHERE slug = ?', req.params.slug);
  if (!p) return res.status(404).json({ error: 'محصول یافت نشد.' });
  const body = String(req.body?.body || '').trim();
  const rating = Math.max(1, Math.min(5, parseInt(req.body?.rating, 10) || 5));
  if (body.length < 5) return res.status(400).json({ error: 'متن نظر خیلی کوتاه است.' });
  if (body.length > 2000) return res.status(400).json({ error: 'متن نظر حداکثر ۲۰۰۰ کاراکتر است.' });
  db.run('INSERT INTO comments (product_id, user_id, rating, body) VALUES (?, ?, ?, ?)', p.id, req.user.id, rating, body);
  res.json({ success: true, message: 'نظر شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.' });
});

// ---- Orders ----
r.post('/orders', requireUser, (req, res) => {
  const { items, shipping } = req.body || {};
  const s = shipping || {};
  const mobile = normalizeMobile(s.mobile);
  if (!s.fullName || !s.province || !s.city || !s.address) return res.status(400).json({ error: 'اطلاعات ارسال را کامل کنید.' });
  if (!mobile) return res.status(400).json({ error: 'شماره موبایل گیرنده معتبر نیست.' });
  if (!/^\d{10}$/.test(String(s.postalCode || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))) {
    return res.status(400).json({ error: 'کد پستی باید ۱۰ رقم باشد.' });
  }
  try {
    const { lines, subtotal } = priceCart(items);
    const shippingFee = Number(getSetting('shipping_fee')) || 0;
    const orderId = db.tx(() => {
      const { lastId } = db.run(
        'INSERT INTO orders (user_id, subtotal, shipping, total, shipping_info) VALUES (?, ?, ?, ?, ?)',
        req.user.id, subtotal, shippingFee, subtotal + shippingFee, JSON.stringify({ ...s, mobile })
      );
      for (const l of lines) {
        db.run('INSERT INTO order_items (order_id, product_id, name, config, unit_price, qty) VALUES (?, ?, ?, ?, ?, ?)', lastId, l.productId, l.name, JSON.stringify(l.config), l.unitPrice, l.qty);
      }
      return lastId;
    });
    res.json({ orderId, total: subtotal + shippingFee });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export function orderWithItems(o) {
  return {
    id: o.id, status: o.status, subtotal: o.subtotal, shipping: o.shipping, total: o.total, trackingCode: o.tracking_code,
    shippingInfo: JSON.parse(o.shipping_info || '{}'), createdAt: o.created_at,
    items: db.all('SELECT product_id AS productId, name, config, unit_price AS unitPrice, qty FROM order_items WHERE order_id = ?', o.id).map((i) => ({ ...i, config: JSON.parse(i.config) })),
    payment: db.get('SELECT status, ref_id AS refId, card_pan AS cardPan, message FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', o.id),
  };
}

r.get('/orders', requireUser, (req, res) => {
  res.json(db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', req.user.id).map(orderWithItems));
});

r.get('/orders/:id', requireUser, (req, res) => {
  const o = db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  o ? res.json(orderWithItems(o)) : res.status(404).json({ error: 'سفارش یافت نشد.' });
});

export default r;
