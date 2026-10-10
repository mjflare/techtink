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
  saved_address TEXT,
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
  chassis TEXT,
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
  published INTEGER NOT NULL DEFAULT 1,
  product_slug TEXT
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
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  tracking_code TEXT UNIQUE,
  type TEXT NOT NULL,
  product_slug TEXT,
  product_name TEXT,
  device_model TEXT,
  services TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  preferred_date TEXT,
  preferred_time TEXT,
  delivery_method TEXT DEFAULT 'in_person',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS inventory_shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_number TEXT,
  type TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL,
  unit_cost INTEGER DEFAULT 0,
  batch_code TEXT,
  supplier_or_dest TEXT,
  courier TEXT,
  shelf_location TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_product ON comments(product_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_shipments(product_id);
`;

export const DEFAULT_SETTINGS = {
  store_name: 'تک‌تینک',
  site_url: 'http://localhost:3000',
  banner_text: 'ارسال رایگان برای همه سفارش‌ها',
  shipping_fee: '0',
  zarinpal_merchant_id: '00000000-0000-0000-0000-000000000000',
  zarinpal_sandbox: '1',
  // Payment Gateways & Methods
  gateway_zarinpal_active: '1',
  gateway_mellat_active: '1',
  gateway_saman_active: '1',
  gateway_parsian_active: '1',
  gateway_card_active: '1',
  gateway_cod_active: '1',
  card_number: '۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸',
  card_holder: 'فروشگاه تک‌تینک (شرکت فناوری اطلاعات)',
  torob_token: '',
  low_stock_threshold: '5',
  // Location & Contact Info
  store_address: 'تهران، خیابان ولیعصر، تقاطع طالقانی، مجتمع نور تهران، طبقه همکف سوم، واحد ۸۰۲۴',
  store_phone: '۰۲۱-۸۸۹۴۲۱۷۵',
  store_mobile: '۰۹۱۲-۳۴۵۶۷۸۹',
  store_hours: 'شنبه تا چهارشنبه ۱۰:۰۰ الی ۱۹:۳۰ | پنج‌شنبه‌ها ۱۰:۰۰ الی ۱۵:۰۰',
  store_map_link: 'https://neshan.org/maps',
  store_about: 'فروشگاه تخصصی تک‌تینک، مرجع مستقیم واردات و ارزیابی مهندسی لپ‌تاپ‌های استوک صنعتی، اداری و گیمینگ اروپا و آمریکا با ضمانت سلامت سخت‌افزاری و تست ۳۰ روزه در ایران.',
  // Social Media Channels
  telegram_url: 'https://t.me/techtink',
  instagram_url: 'https://instagram.com/techtink',
  bale_url: 'https://ble.ir/techtink',
  aparat_url: 'https://aparat.com/techtink'
};

// USD seed prices -> Toman, or direct Toman prices >= 10000
const toToman = (val) => (val >= 10000 ? val : Math.round((val * 65000) / 100000) * 100000);

function migrate() {
  db.exec(SCHEMA);
  try { db.exec("ALTER TABLE users ADD COLUMN saved_address TEXT;"); } catch {}
  try { db.exec("ALTER TABLE appointments ADD COLUMN user_id INTEGER;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN expert_review TEXT DEFAULT '{}';"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN cpu_brand TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN gpu_brand TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN chassis TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN brand TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN model TEXT;"); } catch {}
  try { db.exec("ALTER TABLE products ADD COLUMN grade TEXT;"); } catch {}
  try { db.exec("ALTER TABLE drivers ADD COLUMN download_url TEXT;"); } catch {}
  try { db.exec("ALTER TABLE blog_posts ADD COLUMN product_slug TEXT;"); } catch {}
  
  // Sync clean Iranian stock laptop inventory & clean Persian chassis
  try {
    const hasStock = db.get("SELECT id FROM products WHERE slug = 'lenovo-thinkpad-t14'");
    if (!hasStock) {
      console.log('[db] Migrating catalog to Iranian stock laptops from raitop.ir...');
      db.tx(() => {
        // Remove old demo products
        db.run("DELETE FROM products WHERE slug IN ('tink-blade-16', 'tink-book-pro-14', 'aeroslim-x13', 'neuralcraft-18', 'tink-blade-14', 'tink-student-15')");
        // Insert new stock laptops
        for (const l of LAPTOPS) {
          const base = toToman(l.basePrice);
          const old = l.oldPrice ? toToman(l.oldPrice) : Math.round(base * 1.08 / 100000) * 100000;
          const { lastId } = db.run(
            `INSERT INTO products (slug, name, brand, model, grade, tagline, category, series, badge, base_price, old_price, stock, image, specs, highlights, guarantee, chassis, cpu_brand, gpu_brand)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            l.id, l.name, l.brand, l.model, l.grade, l.tagline, l.category, l.series, l.badge, base, old,
            l.stockCount, l.image, JSON.stringify(l.specs), JSON.stringify(l.highlights || []), 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
            l.chassis || l.specs?.chassis, l.cpuBrand, l.gpuBrand
          );
          for (const type of ['ram', 'storage', 'display']) {
            (l.upgrades?.[type] || []).forEach((v, i) =>
              db.run('INSERT INTO product_variants (product_id, type, name, price, sort) VALUES (?, ?, ?, ?, ?)', lastId, type, v.name, toToman(v.price), i)
            );
          }
          db.run('INSERT INTO product_images (product_id, url, sort) VALUES (?, ?, 0)', lastId, l.image);
        }
      });
    } else {
      for (const l of LAPTOPS) {
        db.run(
          "UPDATE products SET name = ?, brand = ?, model = ?, grade = ?, tagline = ?, category = ?, series = ?, badge = ?, base_price = ?, old_price = ?, specs = ?, highlights = ?, chassis = ?, cpu_brand = ?, gpu_brand = ? WHERE slug = ?",
          l.name, l.brand, l.model, l.grade, l.tagline, l.category, l.series, l.badge, toToman(l.basePrice), l.oldPrice ? toToman(l.oldPrice) : null,
          JSON.stringify(l.specs), JSON.stringify(l.highlights || []), l.chassis || l.specs?.chassis, l.cpuBrand, l.gpuBrand, l.id
        );
      }
    }
  } catch (e) {
    console.error("Migration specs sync error:", e);
  }

  // Update drivers and warranties if needed
  try {
    const hasNewDriver = db.get("SELECT id FROM drivers WHERE product_slug = 'lenovo-thinkpad-t14'");
    if (!hasNewDriver) {
      db.tx(() => {
        db.run("DELETE FROM drivers WHERE product_slug IN ('tink-blade-16', 'tink-book-pro-14', 'aeroslim-x13')");
        for (const d of DRIVER_DOWNLOADS) {
          for (const f of d.files) {
            db.run('INSERT INTO drivers (product_slug, model_name, name, date, size, version, category) VALUES (?, ?, ?, ?, ?, ?, ?)', d.modelId, d.modelName, f.name, f.date, f.size, f.version, f.category);
          }
        }
      });
    }
    for (const w of Object.values(WARRANTY_DATABASE)) {
      db.run('INSERT OR REPLACE INTO warranties VALUES (?, ?, ?, ?, ?, ?, ?)', w.serialNumber, w.model, w.purchaseDate, w.warrantyExpiry, w.status, w.carePlus ? 1 : 0, w.owner);
    }
  } catch (e) {
    console.error("Migration drivers/warranties sync error:", e);
  }

  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', k, v);
  }
  if (!db.get("SELECT value FROM settings WHERE key = 'token_secret'")) {
    db.run("INSERT INTO settings (key, value) VALUES ('token_secret', ?)", crypto.randomBytes(32).toString('hex'));
  }
}

function seed() {
  if (db.get('SELECT COUNT(*) AS c FROM products').c > 0) return;
  db.tx(() => {
    for (const l of LAPTOPS) {
      const base = toToman(l.basePrice);
      const old = l.oldPrice ? toToman(l.oldPrice) : Math.round(base * 1.08 / 100000) * 100000;
      const { lastId } = db.run(
        `INSERT INTO products (slug, name, tagline, category, series, badge, base_price, old_price, stock, image, specs, highlights, guarantee, chassis, cpu_brand, gpu_brand)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        l.id, l.name, l.tagline, l.category, l.series, l.badge, base, old,
        l.stockCount, l.image, JSON.stringify(l.specs), JSON.stringify(l.highlights || []), 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
        l.chassis || l.specs?.chassis, l.cpuBrand, l.gpuBrand
      );
      for (const type of ['ram', 'storage', 'display']) {
        (l.upgrades?.[type] || []).forEach((v, i) =>
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
