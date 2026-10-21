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
    try { raw.close(); } catch {}
    if (withFile) {
      fs.copyFileSync(withFile, DB_PATH);
      try { if (fs.existsSync(DB_PATH + '-wal')) fs.unlinkSync(DB_PATH + '-wal'); } catch {}
      try { if (fs.existsSync(DB_PATH + '-shm')) fs.unlinkSync(DB_PATH + '-shm'); } catch {}
    }
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
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value REAL NOT NULL,
  min_order_value REAL DEFAULT 0,
  max_discount REAL DEFAULT 0,
  usage_limit INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  valid_from TEXT,
  valid_until TEXT,
  is_active INTEGER DEFAULT 1,
  is_promoted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_product ON comments(product_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_shipments(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  referrer_domain TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT DEFAULT 'Other',
  os TEXT DEFAULT 'Other',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(path);
CREATE INDEX IF NOT EXISTS idx_pageviews_ip_hash ON pageviews(ip_hash);
CREATE INDEX IF NOT EXISTS idx_pageviews_device ON pageviews(device_type);
CREATE TABLE IF NOT EXISTS inbox_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  raw_message TEXT,
  verification_code TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inbox_emails_to ON inbox_emails(to_address);
CREATE INDEX IF NOT EXISTS idx_inbox_emails_read ON inbox_emails(is_read);
CREATE INDEX IF NOT EXISTS idx_inbox_emails_created ON inbox_emails(created_at);
CREATE TABLE IF NOT EXISTS sent_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sent_emails_to ON sent_emails(to_address);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_created ON sent_emails(created_at);
CREATE TABLE IF NOT EXISTS verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  type TEXT NOT NULL,
  code TEXT NOT NULL,
  token TEXT,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_verif_target ON verification_tokens(target, type);
CREATE INDEX IF NOT EXISTS idx_verif_token ON verification_tokens(token);
CREATE TABLE IF NOT EXISTS sms_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  provider TEXT,
  template TEXT,
  message TEXT,
  status TEXT DEFAULT 'sent',
  message_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sms_logs_mobile ON sms_logs(mobile);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at);
`;

export const DEFAULT_SETTINGS = {
  store_name: 'تک‌تینک',
  site_url: 'https://techtink.ir',
  banner_text: 'ارسال رایگان برای همه سفارش‌ها',
  shipping_fee: '0',
  zarinpal_merchant_id: '00000000-0000-0000-0000-000000000000',
  zarinpal_sandbox: '1',
  // Site Status & Demo Mode
  site_mode: 'operational', // 'demo' | 'operational'
  demo_notice_active: '0', // '1' | '0'
  demo_notice_title: 'نسخه آزمایشی وب‌سایت تک‌تینک (Demo Mode)',
  demo_notice_badge: 'حالت آزمایشی / در حال تست',
  demo_notice_body: 'به فروشگاه تخصصی لپ‌تاپ تک‌تینک خوش آمدید! وب‌سایت در حال حاضر در فاز آزمایشی و ارزیابی عملکرد (Demo Mode) قرار دارد. تمامی مشخصات فنی، مقایسه سخت‌افزاری و تست مراحل ثبت سفارش فعال بوده و تراکنش‌ها جنبه آزمایشی دارند.',
  demo_notice_btn: 'متوجه شدم، ورود به وب‌سایت',
  demo_notice_badge_header: '0',
  // SMS Gateway & 2FA / OTP Configuration (Iran Providers: Kavenegar, FarazSMS, Ghasedak, Mock)
  sms_provider: 'kavenegar', // 'kavenegar' | 'farazsms' | 'ghasedak' | 'mock'
  sms_api_key: '',
  sms_template_otp: 'techtink-verify',
  sms_sender_line: '',
  sms_2fa_enabled: '0',
  admin_2fa_enforced: '0',
  // Outbound SMTP Mail Server for Password Resets
  smtp_host: 'localhost',
  smtp_port: '25',
  smtp_user: '',
  smtp_pass: '',
  smtp_from: 'تک‌تینک <info@techtink.ir>',
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
  store_address: 'اصفهان، خیابان حکیم نظامی، چهارراه شریعتی',
  store_phone: '۰۳۱-۳۶۲۸۲۱۷۵',
  store_mobile: '۰۹۱۲-۳۴۵۶۷۸۹',
  store_hours: 'شنبه تا چهارشنبه ۱۰:۰۰ الی ۲۰:۰۰ | پنج‌شنبه‌ها ۱۰:۰۰ الی ۱۶:۰۰',
  store_map_link: 'https://neshan.org/maps/@32.6368,51.6562,17z',
  store_about: 'فروشگاه تخصصی تک‌تینک در اصفهان، مرجع مستقیم واردات و ارزیابی مهندسی لپ‌تاپ‌های استوک صنعتی، اداری و گیمینگ اروپا و آمریکا با ضمانت سلامت سخت‌افزاری و تست ۳۰ روزه در اصفهان.',
  // Social Media Channels
  telegram_url: 'https://t.me/techtink',
  instagram_url: 'https://instagram.com/techtink',
  bale_url: 'https://ble.ir/techtink',
  aparat_url: 'https://aparat.com/techtink',
  // Official eNamad Trust Seal
  enamad_active: '1',
  enamad_url: 'https://trustseal.enamad.ir/?id=24125751',
  enamad_code: '24125751',
  // Google Search Console & SEO Optimization
  google_site_verification: '',
  google_analytics_id: '',
  seo_meta_title: 'تک‌تینک | فروشگاه تخصصی لپ‌تاپ‌های مهندسی و گیمینگ در اصفهان',
  seo_meta_description: 'خرید تخصصی آنلاین و حضوری انواع لپ‌تاپ گیمینگ، رندرینگ و مهندسی در اصفهان (خیابان حکیم نظامی، چهارراه شریعتی) با گارانتی طلایی، تست ۲۴ ساعته سخت‌افزار، تضمین اصالت قطعات و بهترین قیمت بازار در فروشگاه تخصصی تک‌تینک.',
  seo_meta_keywords: 'خرید لپ تاپ در اصفهان, قیمت لپ تاپ گیمینگ اصفهان, لپ تاپ مهندسی اصفهان, مقایسه سخت افزار, لپ تاپ استوک اصفهان, خرید لپ تاپ حکیم نظامی اصفهان, فروشگاه تک تینک, techtink isfahan',
  // Homepage Customizer Defaults
  homepage_announcement: JSON.stringify({
    active: true,
    badge: 'خبر ویژه',
    text: 'تخفیف ویژه آغاز فصل و سفارش‌های مهندسی - ارسال رایگان با پست پیشتاز به سراسر کشور',
    linkText: 'مشاهده لپ‌تاپ‌ها',
    linkUrl: '#catalog',
    style: 'cyan'
  }),
  homepage_hero: JSON.stringify({
    active: true,
    badge: 'مدل‌های نسل جدید وارداتی با گارانتی ۶ ماهه',
    title: 'آینده پردازش را تجربه کنید.',
    highlightWord: 'آینده',
    subtitle: 'عملکرد در سطح دسکتاپ، موتورهای هوش مصنوعی پردازش عصبی، و سلامت سخت‌افزاری تضمین‌شده در مجهزترین مرجع لپ‌تاپ‌های مهندسی و استوک اروپا و آمریکا.',
    primaryBtnText: 'مشاهده مدل‌ها و خرید',
    primaryBtnLink: '#catalog',
    secondaryBtnText: 'تماشای بررسی ویدیویی',
    secondaryBtnLink: '/blog',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80',
    stats: [
      { val: '۶۸ ترافلاپس', label: 'توان موتور عصبی (NPU)' },
      { val: '۱۷۵ وات', label: 'حداکثر توان گرافیک (TGP)' },
      { val: '۱۸ ساعت', label: 'دوام شارژ باتری' }
    ],
    chips: [
      { icon: 'Cpu', label: 'Intel Ultra' },
      { icon: 'Zap', label: 'RTX 5090' },
      { icon: 'Battery', label: '99.9Wh' }
    ]
  }),
  homepage_promotion: JSON.stringify({
    active: true,
    badge: 'کمپین تخفیف شگفت‌انگیز',
    title: 'جشنواره ورک‌استیشن‌های رندرینگ و طراحی مهندسی',
    subtitle: 'تا ۱۵٪ تخفیف ویژه برای لپ‌تاپ‌های برگزیده سری ThinkPad و Precision همراه با تست ۳۰ روزه',
    promoCode: 'TECHTINK2026',
    discountPercent: '۱۵٪',
    expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    btnText: 'مشاهده محصولات جشنواره',
    btnLink: '#catalog',
    theme: 'fiery'
  }),
  homepage_showcase: JSON.stringify({
    active: true,
    title: 'ویترین محصولات برگزیده و پیشنهادات ویژه',
    subtitle: 'دستچین تخصصی کارشناسان سخت‌افزار با بالاترین امتیاز عملکرد و سلامت قطعات',
    badge: 'پیشنهاد کارشناسان',
    bannerText: 'تحویل اکسپرس در اصفهان و ارسال سریع به سراسر کشور با بیمه کامل مرسوله',
    productSlugs: ['hp-zbook-fury-16-g9', 'dell-precision-5570', 'lenovo-thinkpad-p1-gen5', 'lenovo-thinkpad-t14']
  })
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
  try { db.exec("ALTER TABLE products ADD COLUMN model3d_url TEXT;"); } catch {}
  try { db.exec("ALTER TABLE drivers ADD COLUMN download_url TEXT;"); } catch {}
  try { db.exec("ALTER TABLE blog_posts ADD COLUMN product_slug TEXT;"); } catch {}
  try { db.exec("ALTER TABLE warranties ADD COLUMN phone TEXT;"); } catch {}
  try { db.exec("ALTER TABLE warranties ADD COLUMN notes TEXT;"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;"); } catch {}

  // Purge any synthetic mock data from analytics to ensure 100% genuine live metrics
  try {
    db.run("DELETE FROM pageviews WHERE user_agent = 'Mozilla/5.0 TechTinkAnalytics/1.0'");
  } catch {}

  // Ensure promo banner expire date is refreshed to a future date if expired
  try {
    const pStr = db.get("SELECT value FROM settings WHERE key = 'homepage_promotion'")?.value;
    if (pStr) {
      const p = JSON.parse(pStr);
      if (p.expireDate && new Date(p.expireDate).getTime() < Date.now()) {
        p.expireDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        db.run("UPDATE settings SET value = ? WHERE key = 'homepage_promotion'", JSON.stringify(p));
      }
    }
  } catch {}
  try { db.exec("ALTER TABLE orders ADD COLUMN discount INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE orders ADD COLUMN coupon_code TEXT;"); } catch {}

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        discount_type TEXT NOT NULL DEFAULT 'percentage',
        discount_value REAL NOT NULL,
        min_order_value REAL DEFAULT 0,
        max_discount REAL DEFAULT 0,
        usage_limit INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        valid_from TEXT,
        valid_until TEXT,
        is_active INTEGER DEFAULT 1,
        is_promoted INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    `);
  } catch {}

  // 3D Models and Media Assets Storage Table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        mime_type TEXT,
        source TEXT DEFAULT 'upload',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(type);
      CREATE INDEX IF NOT EXISTS idx_media_assets_path ON media_assets(path);
    `);

    // Ensure core 3D flagship model is registered
    db.run(
      `INSERT OR IGNORE INTO media_assets (name, path, type, size, mime_type, source) VALUES (?, ?, ?, ?, ?, ?)`,
      'laptop-flagship.glb', '/models/laptop-flagship.glb', 'model', 177828, 'model/gltf-binary', 'system'
    );
  } catch {}

  // Seed default coupons if table is empty
  try {
    const couponCount = db.get("SELECT COUNT(*) AS c FROM coupons")?.c || 0;
    if (couponCount === 0) {
      db.tx(() => {
        db.run(
          `INSERT INTO coupons (code, title, discount_type, discount_value, min_order_value, max_discount, usage_limit, usage_count, valid_until, is_active, is_promoted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          'TECHTINK2026', 'جشنواره ورک‌استیشن‌های رندرینگ و طراحی مهندسی', 'percentage', 15, 30000000, 5000000, 100, 8, '۱۴۰۵/۱۲/۲۹', 1, 1
        );
        db.run(
          `INSERT INTO coupons (code, title, discount_type, discount_value, min_order_value, max_discount, usage_limit, usage_count, valid_until, is_active, is_promoted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          'TINK-SPRING', 'تخفیف بهاره ویژه لپ‌تاپ‌های گیمینگ', 'percentage', 10, 25000000, 3000000, 200, 15, '۱۴۰۵/۰۳/۳۱', 1, 0
        );
        db.run(
          `INSERT INTO coupons (code, title, discount_type, discount_value, min_order_value, max_discount, usage_limit, usage_count, valid_until, is_active, is_promoted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          'WELCOME', 'هدیه اولین خرید کاربران جدید تک‌تینک', 'fixed', 500000, 15000000, 0, 0, 24, '۱۴۰۶/۰۱/۰۱', 1, 0
        );
        db.run(
          `INSERT INTO coupons (code, title, discount_type, discount_value, min_order_value, max_discount, usage_limit, usage_count, valid_until, is_active, is_promoted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          'VIP-PRO', 'تخفیف ویژه مهندسان و سازمان‌ها', 'fixed', 2000000, 60000000, 0, 50, 4, '۱۴۰۵/۱۱/۳۰', 1, 0
        );
      });
    }
  } catch {}
  
  // Sync clean Iranian stock laptop inventory, multi-angle images & variants
  try {
    console.log('[db] Synchronizing Iranian market stock catalog, images and upgrade variants...');
    db.tx(() => {
      // Safely archive or remove legacy demo slugs only if not referenced in customer orders
      const legacySlugs = ['tink-blade-16', 'tink-book-pro-14', 'aeroslim-x13', 'neuralcraft-18', 'tink-blade-14', 'tink-student-15'];
      for (const slug of legacySlugs) {
        const item = db.get("SELECT id FROM products WHERE slug = ?", slug);
        if (item) {
          const hasOrders = (db.get("SELECT COUNT(*) AS c FROM order_items WHERE product_id = ?", item.id)?.c || 0) > 0;
          if (hasOrders) {
            db.run("UPDATE products SET active = 0 WHERE id = ?", item.id);
          } else {
            db.run("DELETE FROM products WHERE id = ?", item.id);
          }
        }
      }

      for (const l of LAPTOPS) {
        const base = toToman(l.basePrice);
        const old = l.oldPrice ? toToman(l.oldPrice) : Math.round(base * 1.08 / 100000) * 100000;
        let p = db.get("SELECT id, stock, active, base_price FROM products WHERE slug = ?", l.id);
        let prodId;

        if (!p) {
          const res = db.run(
            `INSERT INTO products (slug, name, brand, model, grade, tagline, category, series, badge, base_price, old_price, stock, image, specs, highlights, guarantee, chassis, cpu_brand, gpu_brand, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            l.id, l.name, l.brand, l.model, l.grade, l.tagline, l.category, l.series, l.badge, base, old,
            l.stockCount, l.image, JSON.stringify(l.specs), JSON.stringify(l.highlights || []), 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
            l.chassis || l.specs?.chassis, l.cpuBrand, l.gpuBrand
          );
          prodId = res.lastId;
        } else {
          prodId = p.id;
          // Non-destructive update: preserve current stock, active status, and custom price if set
          db.run(
            `UPDATE products SET name = ?, brand = ?, model = ?, grade = ?, tagline = ?, category = ?, series = ?, badge = ?, image = ?, specs = ?, highlights = ?, chassis = ?, cpu_brand = ?, gpu_brand = ? WHERE id = ?`,
            l.name, l.brand, l.model, l.grade, l.tagline, l.category, l.series, l.badge, l.image, JSON.stringify(l.specs), JSON.stringify(l.highlights || []), l.chassis || l.specs?.chassis, l.cpuBrand, l.gpuBrand, prodId
          );
        }

        // Sync product_variants (upgrades: RAM, Storage, Display)
        if (l.upgrades) {
          db.run("DELETE FROM product_variants WHERE product_id = ?", prodId);
          for (const type of ['ram', 'storage', 'display']) {
            (l.upgrades[type] || []).forEach((v, i) =>
              db.run('INSERT INTO product_variants (product_id, type, name, price, sort) VALUES (?, ?, ?, ?, ?)', prodId, type, v.name, toToman(v.price), i)
            );
          }
        }

        // Sync product_images (Multi-angle Apple gallery views)
        const imgList = (l.images && l.images.length > 0) ? l.images : [l.image];
        db.run("DELETE FROM product_images WHERE product_id = ?", prodId);
        imgList.forEach((url, i) => {
          db.run('INSERT INTO product_images (product_id, url, sort) VALUES (?, ?, ?)', prodId, url, i);
        });
      }
    });
  } catch (e) {
    console.error("Migration specs sync error:", e);
  }

  // Update drivers and warranties
  try {
    db.tx(() => {
      db.run("DELETE FROM drivers WHERE 1=1");
      for (const d of DRIVER_DOWNLOADS) {
        for (const f of d.files) {
          db.run('INSERT INTO drivers (product_slug, model_name, name, date, size, version, category) VALUES (?, ?, ?, ?, ?, ?, ?)', d.modelId, d.modelName, f.name, f.date, f.size, f.version, f.category);
        }
      }
      for (const w of Object.values(WARRANTY_DATABASE)) {
        db.run('INSERT OR REPLACE INTO warranties (serial, model, purchase_date, expiry, status, care_plus, owner) VALUES (?, ?, ?, ?, ?, ?, ?)', w.serialNumber, w.model, w.purchaseDate, w.warrantyExpiry, w.status, w.carePlus ? 1 : 0, w.owner);
      }
    });
  } catch (e) {
    console.error("Migration drivers/warranties sync error:", e);
  }

  // Ensure homepage_showcase points to real Iranian workstations
  try {
    const curShowcase = db.get("SELECT value FROM settings WHERE key = 'homepage_showcase'");
    if (curShowcase) {
      const parsed = JSON.parse(curShowcase.value);
      if (parsed.productSlugs?.some(s => ['dell-precision-7530', 'hp-zbook-15-g6', 'tink-blade-16'].includes(s))) {
        parsed.productSlugs = ['hp-zbook-fury-16-g9', 'dell-precision-5570', 'lenovo-thinkpad-p1-gen5', 'lenovo-thinkpad-t14'];
        db.run("UPDATE settings SET value = ? WHERE key = 'homepage_showcase'", JSON.stringify(parsed));
      }
    }
  } catch {}

  // Ensure location and local SEO are updated to Isfahan
  try {
    const curAddr = db.get("SELECT value FROM settings WHERE key = 'store_address'");
    if (curAddr && (curAddr.value.includes('تهران') || curAddr.value.includes('طالقانی') || curAddr.value.includes('ولیعصر'))) {
      db.run("UPDATE settings SET value = ? WHERE key = 'store_address'", 'اصفهان، خیابان حکیم نظامی، چهارراه شریعتی');
    }
    const curPh = db.get("SELECT value FROM settings WHERE key = 'store_phone'");
    if (curPh && (curPh.value.includes('۰۲۱') || curPh.value.includes('021') || curPh.value.includes('8894') || curPh.value.includes('8822'))) {
      db.run("UPDATE settings SET value = ? WHERE key = 'store_phone'", '۰۳۱-۳۶۲۸۲۱۷۵');
    }
    const curMap = db.get("SELECT value FROM settings WHERE key = 'store_map_link'");
    if (curMap && (curMap.value.includes('Tehran') || curMap.value === 'https://neshan.org/maps')) {
      db.run("UPDATE settings SET value = ? WHERE key = 'store_map_link'", 'https://neshan.org/maps/@32.6368,51.6562,17z');
    }
    const curSeoT = db.get("SELECT value FROM settings WHERE key = 'seo_meta_title'");
    if (curSeoT && !curSeoT.value.includes('اصفهان')) {
      db.run("UPDATE settings SET value = ? WHERE key = 'seo_meta_title'", 'تک‌تینک | فروشگاه تخصصی لپ‌تاپ‌های مهندسی و گیمینگ در اصفهان');
    }
    const curSeoD = db.get("SELECT value FROM settings WHERE key = 'seo_meta_description'");
    if (curSeoD && !curSeoD.value.includes('اصفهان')) {
      db.run("UPDATE settings SET value = ? WHERE key = 'seo_meta_description'", 'خرید تخصصی آنلاین و حضوری انواع لپ‌تاپ گیمینگ و مهندسی در اصفهان (خیابان حکیم نظامی، چهارراه شریعتی) با گارانتی طلایی، تست ۲۴ ساعته سخت‌افزار، تضمین اصالت قطعات و بهترین قیمت بازار در فروشگاه تخصصی تک‌تینک.');
    }
    const curSeoK = db.get("SELECT value FROM settings WHERE key = 'seo_meta_keywords'");
    if (curSeoK && !curSeoK.value.includes('اصفهان')) {
      db.run("UPDATE settings SET value = ? WHERE key = 'seo_meta_keywords'", 'خرید لپ تاپ در اصفهان, قیمت لپ تاپ گیمینگ اصفهان, لپ تاپ مهندسی اصفهان, مقایسه سخت افزار, لپ تاپ استوک اصفهان, خرید لپ تاپ حکیم نظامی اصفهان, فروشگاه تک تینک, techtink isfahan');
    }
    const curAbout = db.get("SELECT value FROM settings WHERE key = 'store_about'");
    if (curAbout && !curAbout.value.includes('اصفهان')) {
      db.run("UPDATE settings SET value = ? WHERE key = 'store_about'", 'فروشگاه تخصصی تک‌تینک در اصفهان، مرجع مستقیم واردات و ارزیابی مهندسی لپ‌تاپ‌های استوک صنعتی، اداری و گیمینگ اروپا و آمریکا با ضمانت سلامت سخت‌افزاری و تست ۳۰ روزه در اصفهان.');
    }
  } catch (e) {
    console.error("Migration location settings update error:", e);
  }

  // Ensure default 3D GLB model is assigned to products
  try {
    db.run("UPDATE products SET model3d_url = '/models/laptop-flagship.glb' WHERE model3d_url IS NULL OR model3d_url = ''");
  } catch {}

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
export const getSettings = () => {
  const fromDb = Object.fromEntries(db.all('SELECT key, value FROM settings').map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...fromDb };
};
export const setSetting = (key, value) => db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, String(value ?? ''));
