// Password hashing (scrypt) + HMAC-signed tokens. No native dependencies, works on Node and Bun.
import crypto from 'node:crypto';
import { db, getSetting } from './db.js';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, 'hex');
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', getSetting('token_secret')).update(data).digest('base64url');

export function getAdminTimeoutMinutes() {
  const s = getSetting('admin_session_timeout_minutes');
  const val = parseInt(s, 10);
  return isNaN(val) || val <= 0 ? 15 : val;
}

export function issueToken(user) {
  // Update last_active_at on login/token issue
  try {
    db.run("UPDATE users SET last_active_at = datetime('now') WHERE id = ?", user.id);
  } catch {}
  const payload = b64(JSON.stringify({ uid: user.id, role: user.role, exp: Date.now() + TOKEN_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function issueTemp2FAToken(user) {
  const payload = b64(JSON.stringify({ 
    uid: user.id, 
    role: user.role, 
    type: '2fa_challenge', 
    exp: Date.now() + (5 * 60 * 1000) // 5 minutes validity
  }));
  return `${payload}.${sign(payload)}`;
}

export function readTemp2FAToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (data.type !== '2fa_challenge') return null;
  return data.exp > Date.now() ? data : null;
}

function readToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  return data.exp > Date.now() ? data : null;
}

export const publicUser = (u) => {
  if (!u) return null;
  let savedAddress = null;
  if (u.saved_address) {
    try {
      savedAddress = typeof u.saved_address === 'string' ? JSON.parse(u.saved_address) : u.saved_address;
    } catch {}
  }
  return {
    id: u.id,
    name: u.name,
    mobile: u.mobile,
    phone: u.mobile,
    email: u.email,
    role: u.role,
    savedAddress,
    mustChangePassword: !!u.must_change_password,
    totpEnabled: !!u.totp_enabled,
    twoFactorEnabled: !!(u.totp_enabled || u.two_factor_enabled),
    timeoutMinutes: getAdminTimeoutMinutes(),
    lastActiveAt: u.last_active_at || u.created_at,
    createdAt: u.created_at
  };
};

// Attaches req.user when a valid token is present (does not reject).
export function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const tokenStr = header.startsWith('Bearer ') ? header.slice(7) : (req.query?.token || null);
  const data = tokenStr ? readToken(tokenStr) : null;
  if (data) {
    const u = db.get('SELECT * FROM users WHERE id = ?', data.uid);
    if (u && !u.blocked) {
      req.user = u;
      // Inactivity check for admin
      if (u.role === 'admin' && u.last_active_at) {
        const timeoutMs = getAdminTimeoutMinutes() * 60 * 1000;
        const lastActiveTime = new Date(u.last_active_at + (u.last_active_at.endsWith('Z') ? '' : 'Z')).getTime();
        if (Date.now() - lastActiveTime > timeoutMs) {
          req.adminSessionExpired = true;
        }
      }
    }
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'لطفاً ابتدا وارد حساب کاربری شوید.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'لطفاً ابتدا وارد شوید.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'دسترسی مدیر لازم است.' });
  if (req.adminSessionExpired) {
    return res.status(401).json({ 
      error: 'نشست مدیریتی شما به دلیل عدم فعالیت منقضی شده است. لطفاً مجدداً وارد شوید.',
      code: 'ADMIN_SESSION_EXPIRED'
    });
  }
  // Keep alive: update last_active_at on each authenticated admin action
  try {
    db.run("UPDATE users SET last_active_at = datetime('now') WHERE id = ?", req.user.id);
  } catch {}
  next();
}

// Creates the first admin account on a fresh database.
export function ensureAdmin() {
  if (db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1")) return;
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(6).toString('base64url');
  const email = process.env.ADMIN_EMAIL || 'admin@techtink.ir';
  db.run(
    "INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (?, ?, ?, 'admin', 1)",
    'مدیر سایت', email, hashPassword(password)
  );
  console.log('\n==============================================');
  console.log(' Default admin account created');
  console.log(`   login:    ${email}`);
  console.log(`   password: ${password}`);
  console.log(' You will be asked to change it on first login.');
  console.log('==============================================\n');
}

// Iranian mobile (09xxxxxxxxx) normalisation, also accepts Persian digits and +98.
export function normalizeMobile(input) {
  if (!input) return null;
  let s = String(input).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
  if (s.startsWith('98')) s = '0' + s.slice(2);
  if (s.length === 10 && s.startsWith('9')) s = '0' + s;
  return /^09\d{9}$/.test(s) ? s : null;
}
