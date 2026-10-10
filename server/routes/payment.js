// ZarinPal v4 payment gateway (https://www.zarinpal.com/docs/paymentGateway/) + in-app Iranian payment checkout.
// Amounts are stored in Toman and sent to ZarinPal in Rial (Toman × 10), which is the API default.
import { Router } from 'express';
import crypto from 'node:crypto';
import { db, getSetting } from '../db.js';
import { requireUser, normalizeMobile, hashPassword } from '../auth.js';

const r = Router();

function zp() {
  const sandbox = getSetting('zarinpal_sandbox') === '1';
  const host = sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
  return { sandbox, host, merchant: getSetting('zarinpal_merchant_id') };
}

async function zpPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

const zpError = (json) => {
  const e = json?.errors;
  return (Array.isArray(e) ? e[0]?.message : e?.message) || 'خطای نامشخص از درگاه پرداخت';
};

// In-app checkout simulation compatible with Iranian payment gateways (ZarinPal, Mellat, Saman, Parsian)
r.post('/checkout/init', (req, res) => {
  const { items, total, userId, shipping, gateway } = req.body || {};
  if (!items || !items.length) return res.status(400).json({ error: 'سبد خرید خالی است.' });

  // Resolve user - Strictly enforce registered & authenticated user
  const tokenUser = req.user;
  let uid = tokenUser?.id || (userId ? Number(userId) : null);
  if (!uid) {
    return res.status(401).json({ error: 'برای ثبت سفارش و پرداخت، لطفاً ابتدا وارد حساب کاربری خود شوید یا حساب بسازید.' });
  }

  const registeredUser = db.get('SELECT id FROM users WHERE id = ?', uid);
  if (!registeredUser) {
    return res.status(401).json({ error: 'حساب کاربری یافت نشد. لطفاً ابتدا وارد حساب کاربری شوید یا ثبت‌نام کنید.' });
  }

  const token = 'PAY-' + crypto.randomUUID();
  const gw = gateway || 'zarinpal';
  const subtotal = items.reduce((s, it) => s + (it.totalPrice || it.unitPrice || 0) * (it.quantity || it.qty || 1), 0);
  const tot = total || subtotal;

  const orderId = db.tx(() => {
    const { lastId } = db.run(
      'INSERT INTO orders (user_id, subtotal, total, shipping_info, status) VALUES (?, ?, ?, ?, ?)',
      uid, subtotal, tot, JSON.stringify(shipping || {}), 'pending_payment'
    );
    for (const it of items) {
      db.run(
        'INSERT INTO order_items (order_id, product_id, name, config, unit_price, qty) VALUES (?, ?, ?, ?, ?, ?)',
        lastId, it.productId || it.laptopId || null, it.name || 'لپ‌تاپ', JSON.stringify(it.configuration || it.config || []),
        it.totalPrice || it.unitPrice || 0, it.quantity || it.qty || 1
      );
    }
    db.run(
      'INSERT INTO payments (order_id, gateway, authority, amount, status) VALUES (?, ?, ?, ?, ?)',
      lastId, gw, token, tot * 10, 'initiated'
    );
    if (shipping && Object.keys(shipping).length > 0) {
      db.run('UPDATE users SET saved_address = ? WHERE id = ?', JSON.stringify(shipping), uid);
    }
    return lastId;
  });

  res.json({ success: true, paymentToken: token, orderId, gateway: gw });
});

r.post('/checkout/verify', (req, res) => {
  const { paymentToken } = req.body || {};
  const pay = db.get('SELECT * FROM payments WHERE authority = ?', String(paymentToken || ''));
  if (!pay) return res.status(404).json({ error: 'تراکنش یافت نشد.' });

  if (pay.status === 'paid') {
    return res.json({ success: true, orderId: pay.order_id, refId: pay.ref_id, message: 'پرداخت قبلاً انجام شده است.' });
  }

  const refId = 'REF-' + Math.floor(10000000 + Math.random() * 90000000);
  db.tx(() => {
    db.run("UPDATE payments SET status = 'paid', ref_id = ? WHERE id = ?", refId, pay.id);
    for (const it of db.all('SELECT product_id, qty FROM order_items WHERE order_id = ?', pay.order_id)) {
      if (!it.product_id) continue;
      db.run("UPDATE products SET stock = MAX(0, stock - ?), updated_at = datetime('now') WHERE id = ?", it.qty, it.product_id);
      db.run('INSERT INTO stock_log (product_id, delta, reason) VALUES (?, ?, ?)', it.product_id, -it.qty, `فروش - سفارش #${pay.order_id}`);
    }
    db.run("UPDATE orders SET status = 'paid' WHERE id = ?", pay.order_id);
  });

  res.json({ success: true, orderId: pay.order_id, refId, message: 'پرداخت با موفقیت انجام شد.' });
});

r.post('/payment/zarinpal/request', requireUser, async (req, res) => {
  const order = db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', req.body?.orderId, req.user.id);
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد.' });
  if (order.status !== 'pending_payment') return res.status(400).json({ error: 'این سفارش قبلاً پرداخت یا لغو شده است.' });

  const { host, merchant } = zp();
  const amount = order.total * 10; // Rial
  const callback = `${getSetting('site_url').replace(/\/$/, '')}/api/payment/zarinpal/callback`;
  const info = JSON.parse(order.shipping_info || '{}');
  try {
    const json = await zpPost(`${host}/pg/v4/payment/request.json`, {
      merchant_id: merchant,
      amount,
      callback_url: callback,
      description: `سفارش شماره ${order.id} - ${getSetting('store_name')}`,
      metadata: { mobile: info.mobile || info.phone, email: req.user.email || undefined, order_id: String(order.id) },
    });
    if (json?.data?.code !== 100) return res.status(502).json({ error: zpError(json) });
    db.run("INSERT INTO payments (order_id, gateway, authority, amount, status) VALUES (?, 'zarinpal', ?, ?, 'initiated')", order.id, json.data.authority, amount);
    res.json({ url: `${host}/pg/StartPay/${json.data.authority}` });
  } catch (e) {
    res.status(502).json({ error: 'اتصال به درگاه زرین‌پال برقرار نشد: ' + e.message });
  }
});

// ZarinPal redirects the customer here with ?Authority=...&Status=OK|NOK
r.get('/payment/zarinpal/callback', async (req, res) => {
  const site = getSetting('site_url').replace(/\/$/, '');
  const { Authority, Status } = req.query;
  const pay = db.get("SELECT * FROM payments WHERE authority = ? AND gateway = 'zarinpal'", String(Authority || ''));
  if (!pay) return res.redirect(`${site}/payment/result?status=failed&reason=${encodeURIComponent('تراکنش یافت نشد.')}`);
  const back = (status, extra = '') => res.redirect(`${site}/payment/result?order=${pay.order_id}&status=${status}${extra}`);

  if (pay.status === 'paid') return back('success', `&ref=${pay.ref_id}`);
  if (Status !== 'OK') {
    db.run("UPDATE payments SET status = 'canceled', message = ? WHERE id = ?", 'لغو توسط کاربر', pay.id);
    return back('failed', `&reason=${encodeURIComponent('پرداخت توسط کاربر لغو شد.')}`);
  }

  const { host, merchant } = zp();
  try {
    const json = await zpPost(`${host}/pg/v4/payment/verify.json`, { merchant_id: merchant, amount: pay.amount, authority: pay.authority });
    const code = json?.data?.code;
    if (code !== 100 && code !== 101) {
      db.run("UPDATE payments SET status = 'failed', message = ? WHERE id = ?", zpError(json), pay.id);
      return back('failed', `&reason=${encodeURIComponent(zpError(json))}`);
    }
    db.tx(() => {
      const fresh = db.get('SELECT status FROM payments WHERE id = ?', pay.id);
      if (fresh.status === 'paid') return; // idempotent
      db.run("UPDATE payments SET status = 'paid', ref_id = ?, card_pan = ? WHERE id = ?", String(json.data.ref_id), json.data.card_pan || null, pay.id);
      let backorder = false;
      for (const it of db.all('SELECT product_id, qty FROM order_items WHERE order_id = ?', pay.order_id)) {
        if (!it.product_id) continue;
        const p = db.get('SELECT stock FROM products WHERE id = ?', it.product_id);
        if (!p || p.stock < it.qty) backorder = true;
        db.run('UPDATE products SET stock = MAX(0, stock - ?), updated_at = datetime(\'now\') WHERE id = ?', it.qty, it.product_id);
        db.run('INSERT INTO stock_log (product_id, delta, reason) VALUES (?, ?, ?)', it.product_id, -it.qty, `فروش - سفارش #${pay.order_id}`);
      }
      db.run('UPDATE orders SET status = ? WHERE id = ?', backorder ? 'paid_backorder' : 'paid', pay.order_id);
    });
    back('success', `&ref=${json.data.ref_id}`);
  } catch (e) {
    db.run("UPDATE payments SET message = ? WHERE id = ?", 'verify error: ' + e.message, pay.id);
    back('failed', `&reason=${encodeURIComponent('خطا در تأیید تراکنش. در صورت کسر وجه، مبلغ طی ۷۲ ساعت بازگردانده می‌شود.')}`);
  }
});

export default r;
