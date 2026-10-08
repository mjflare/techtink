// Runtime-agnostic SQLite layer: uses bun:sqlite under Bun and node:sqlite under Node.js (v22.5+).
// Only positional (?) parameters are used so both drivers behave identically.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { LAPTOPS, BLOG_POSTS, FAQS, WARRANTY_DATABASE, DRIVER_DOWNLOADS } from './seedData.js';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
export const DB_PATH = path.join(DATA_DIR, 'techtink.db');
const isBun = typeof globalThis.Bun !== 'undefined';

fs.mkdirSync(DATA_DIR, { recursive: true });

let raw = null;
let DriverCtor = null;

async function loadDriver() {
  if (isBun) {
    const mod = await import('bun:sqlite');
    DriverCtor = (p) => new mod.Database(p, { create: true });
  } else {
    const mod = await import('node:sqlite');
    DriverCtor = (p) => new mod.DatabaseSync(p);
  }
}

function openRaw() {
  raw = DriverCtor(DB_PATH);
  raw.exec('PRAGMA foreign_keys = ON;');
}

// Convert undefined/booleans into values both drivers accept.
const clean = (params) => params.map((v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v));

export const db = {
  all: (sql, ...p) => raw.prepare(sql).all(...clean(p)),
  get: (sql, ...p) => raw.prepare(sql).get(...clean(p)) ?? null,
  run: (sql, ...p) => {
    const r = raw.prepare(sql).run(...clean(p));
    return { changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
  },
  exec: (sql) => raw.exec(sql),
  tx(fn) {
    raw.exec('BEGIN');
    try {
      const out = fn();
      raw.exec('COMMIT');
      return out;
    } catch (e) {
      raw.exec('ROLLBACK');
      throw e;
    }
  },
  // Used by DB tools to restore a backup file.
  reopen(withFile) {
    raw.close();
    if (withFile) fs.copyFileSync(withFile, DB_PATH);
    openRaw();
    migrate();
  },
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  blocked INTEGER NOT NULL DEFAULT 0,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  category TEXT,
  series TEXT,
  badge TEXT,
  description TEXT,
  base_price INTEGER NOT NULL DEFAULT 0,
  old_price INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  guarantee TEXT,
  image TEXT,
  specs TEXT NOT NULL DEFAULT '{}',
  highlights TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 5,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending_payment',
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  shipping_info TEXT NOT NULL DEFAULT '{}',
  tracking_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '[]',
  unit_price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL,
  authority TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated',
  ref_id TEXT,
  card_pan TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS stock_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL, excerpt TEXT, category TEXT, author TEXT, author_role TEXT,
  author_avatar TEXT, date TEXT, read_time TEXT, image TEXT, content TEXT,
  published INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT NOT NULL, q TEXT NOT NULL, a TEXT NOT NULL, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS warranties (
  serial TEXT PRIMARY KEY, model TEXT, purchase_date TEXT, expiry TEXT, status TEXT, care_plus INTEGER DEFAULT 0, owner TEXT
);
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_slug TEXT, model_name TEXT, name TEXT, date TEXT, size TEXT, version TEXT, category TEXT
);
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, user_id INTEGER, name TEXT, email TEXT, issue TEXT,
  status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_product ON comments(product_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
`;

export const DEFAULT_SETTINGS = {
  store_name: 'تک‌تینک',
  site_url: 'http://localhost:3000',
  banner_text: 'ارسال رایگان برای همه سفارش‌ها',
  shipping_fee: '0',
  zarinpal_merchant_id: '00000000-0000-0000-0000-000000000000',
  zarinpal_sandbox: '1',
  torob_token: '',
  low_stock_threshold: '5',
};

function migrate() {
  db.exec(SCHEMA);
  try { db.exec("ALTER TABLE products ADD COLUMN expert_review TEXT DEFAULT '{}';"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN cpu_brand TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN gpu_brand TEXT;"); } catch {}
  try { db.exec("ALTER TABLE drivers ADD COLUMN download_url TEXT;"); } catch {}
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', k, v);
  }
  if (!db.get("SELECT value FROM settings WHERE key = 'token_secret'")) {
    db.run("INSERT INTO settings (key, value) VALUES ('token_secret', ?)", crypto.randomBytes(32).toString('hex'));
  }
}

// USD seed prices -> Toman, rounded to 100,000.
const toToman = (usd) => Math.round((usd * 65000) / 100000) * 100000;

function seed() {
  if (db.get('SELECT COUNT(*) AS c FROM products').c > 0) return;
  db.tx(() => {
    for (const l of LAPTOPS) {
      const base = toToman(l.basePrice);
      const { lastId } = db.run(
        `INSERT INTO products (slug, name, tagline, category, series, badge, base_price, old_price, stock, image, specs, highlights, guarantee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        l.id, l.name, l.tagline, l.category, l.series, l.badge, base, Math.round(base * 1.08 / 100000) * 100000,
        l.stockCount, l.image, JSON.stringify(l.specs), JSON.stringify(l.highlights), 'گارانتی ۲ ساله تک‌تینک'
      );
      for (const type of ['ram', 'storage', 'display']) {
        (l.upgrades[type] || []).forEach((v, i) =>
          db.run('INSERT INTO product_variants (product_id, type, name, price, sort) VALUES (?, ?, ?, ?, ?)', lastId, type, v.name, toToman(v.price), i)
        );
      }
      db.run('INSERT INTO product_images (product_id, url, sort) VALUES (?, ?, 0)', lastId, l.image);
    }
    for (const p of BLOG_POSTS) {
      db.run(
        `INSERT INTO blog_posts (id, title, excerpt, category, author, author_role, author_avatar, date, read_time, image, content)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id, p.title, p.excerpt, p.category, p.author, p.authorRole, p.authorAvatar, p.date, p.readTime, p.image, p.content
      );
    }
    FAQS.forEach((cat) => cat.items.forEach((it, i) => db.run('INSERT INTO faqs (category, q, a, sort) VALUES (?, ?, ?, ?)', cat.category, it.q, it.a, i)));
    for (const w of Object.values(WARRANTY_DATABASE)) {
      db.run('INSERT INTO warranties VALUES (?, ?, ?, ?, ?, ?, ?)', w.serialNumber, w.model, w.purchaseDate, w.warrantyExpiry, w.status, w.carePlus ? 1 : 0, w.owner);
    }
    for (const d of DRIVER_DOWNLOADS) {
      for (const f of d.files) {
        db.run('INSERT INTO drivers (product_slug, model_name, name, date, size, version, category) VALUES (?, ?, ?, ?, ?, ?, ?)', d.modelId, d.modelName, f.name, f.date, f.size, f.version, f.category);
      }
    }
  });
  console.log('[db] Seeded initial catalog data.');
}

export async function initDb() {
  await loadDriver();
  openRaw();
  migrate();
  seed();
  console.log(`[db] SQLite ready at ${DB_PATH} (${isBun ? 'bun:sqlite' : 'node:sqlite'})`);
}

export const getSetting = (key) => db.get('SELECT value FROM settings WHERE key = ?', key)?.value ?? DEFAULT_SETTINGS[key] ?? null;
export const getSettings = () => Object.fromEntries(db.all('SELECT key, value FROM settings').map((r) => [r.key, r.value]));
export const setSetting = (key, value) => db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, String(value ?? ''));
