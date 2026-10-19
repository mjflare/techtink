use sqlx::SqlitePool;

pub const SCHEMA: &str = r#"
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
  discount INTEGER DEFAULT 0,
  coupon_code TEXT,
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
  serial TEXT PRIMARY KEY, model TEXT, purchase_date TEXT, expiry TEXT, status TEXT, care_plus INTEGER DEFAULT 0, owner TEXT,
  phone TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, product_slug TEXT, model_name TEXT, name TEXT, date TEXT, size TEXT, version TEXT, category TEXT, download_url TEXT
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

CREATE INDEX IF NOT EXISTS idx_comments_product ON comments(product_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_shipments(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON pageviews(path);
CREATE INDEX IF NOT EXISTS idx_inbox_emails_to ON inbox_emails(to_address);
CREATE INDEX IF NOT EXISTS idx_inbox_emails_read ON inbox_emails(is_read);
CREATE INDEX IF NOT EXISTS idx_sent_emails_to ON sent_emails(to_address);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
"#;

pub async fn migrate(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::raw_sql(SCHEMA).execute(pool).await?;

    // Incremental column alters for backwards compatibility
    let alters = [
        "ALTER TABLE users ADD COLUMN saved_address TEXT;",
        "ALTER TABLE appointments ADD COLUMN user_id INTEGER;",
        "ALTER TABLE products ADD COLUMN expert_review TEXT DEFAULT '{}';",
        "ALTER TABLE products ADD COLUMN cpu_brand TEXT;",
        "ALTER TABLE products ADD COLUMN gpu_brand TEXT;",
        "ALTER TABLE products ADD COLUMN chassis TEXT;",
        "ALTER TABLE products ADD COLUMN brand TEXT;",
        "ALTER TABLE products ADD COLUMN model TEXT;",
        "ALTER TABLE products ADD COLUMN grade TEXT;",
        "ALTER TABLE products ADD COLUMN model3d_url TEXT;",
        "ALTER TABLE drivers ADD COLUMN download_url TEXT;",
        "ALTER TABLE blog_posts ADD COLUMN product_slug TEXT;",
        "ALTER TABLE warranties ADD COLUMN phone TEXT;",
        "ALTER TABLE warranties ADD COLUMN notes TEXT;",
        "ALTER TABLE orders ADD COLUMN discount INTEGER DEFAULT 0;",
        "ALTER TABLE orders ADD COLUMN coupon_code TEXT;",
    ];

    for alter in alters {
        let _ = sqlx::query(alter).execute(pool).await;
    }

    // Default settings map
    let default_settings = [
        ("store_name", "تک‌تینک"),
        ("site_url", "http://localhost:3000"),
        ("banner_text", "ارسال رایگان برای همه سفارش‌ها"),
        ("shipping_fee", "0"),
        ("zarinpal_merchant_id", "00000000-0000-0000-0000-000000000000"),
        ("zarinpal_sandbox", "1"),
        ("site_mode", "demo"),
        ("demo_notice_active", "1"),
        ("demo_notice_title", "نسخه آزمایشی وب‌سایت تک‌تینک (Demo Mode)"),
        ("demo_notice_badge", "حالت آزمایشی / در حال تست"),
        ("demo_notice_body", "به فروشگاه تخصصی لپ‌تاپ تک‌تینک خوش آمدید! وب‌سایت در حال حاضر در فاز آزمایشی و ارزیابی عملکرد (Demo Mode) قرار دارد. تمامی مشخصات فنی، مقایسه سخت‌افزاری و تست مراحل ثبت سفارش فعال بوده و تراکنش‌ها جنبه آزمایشی دارند."),
        ("demo_notice_btn", "متوجه شدم، ورود به وب‌سایت"),
        ("demo_notice_badge_header", "1"),
        ("gateway_zarinpal_active", "1"),
        ("gateway_mellat_active", "1"),
        ("gateway_saman_active", "1"),
        ("gateway_parsian_active", "1"),
        ("gateway_card_active", "1"),
        ("gateway_cod_active", "1"),
        ("card_number", "۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸"),
        ("card_holder", "فروشگاه تک‌تینک (شرکت فناوری اطلاعات)"),
        ("torob_token", ""),
        ("low_stock_threshold", "5"),
        ("store_address", "اصفهان، خیابان حکیم نظامی، چهارراه شریعتی"),
        ("store_phone", "۰۳۱-۳۶۲۸۲۱۷۵"),
        ("store_mobile", "۰۹۱۲-۳۴۵۶۷۸۹"),
        ("store_hours", "شنبه تا چهارشنبه ۱۰:۰۰ الی ۲۰:۰۰ | پنج‌شنبه‌ها ۱۰:۰۰ الی ۱۶:۰۰"),
        ("store_map_link", "https://neshan.org/maps/@32.6368,51.6562,17z"),
        ("store_about", "فروشگاه تخصصی تک‌تینک در اصفهان، مرجع مستقیم واردات و ارزیابی مهندسی لپ‌تاپ‌های استوک صنعتی، اداری و گیمینگ اروپا و آمریکا با ضمانت سلامت سخت‌افزاری و تست ۳۰ روزه در اصفهان."),
        ("telegram_url", "https://t.me/techtink"),
        ("instagram_url", "https://instagram.com/techtink"),
        ("bale_url", "https://ble.ir/techtink"),
        ("aparat_url", "https://aparat.com/techtink"),
        ("enamad_active", "1"),
        ("enamad_url", "https://trustseal.enamad.ir/?id=24125751"),
        ("enamad_code", "24125751"),
        ("google_site_verification", ""),
        ("google_analytics_id", ""),
        ("seo_meta_title", "تک‌تینک | فروشگاه تخصصی لپ‌تاپ‌های مهندسی و گیمینگ در اصفهان"),
        ("seo_meta_description", "خرید تخصصی آنلاین و حضوری انواع لپ‌تاپ گیمینگ، رندرینگ و مهندسی در اصفهان (خیابان حکیم نظامی، چهارراه شریعتی) با گارانتی طلایی، تست ۲۴ ساعته سخت‌افزار، تضمین اصالت قطعات و بهترین قیمت بازار در فروشگاه تخصصی تک‌تینک."),
        ("seo_meta_keywords", "خرید لپ تاپ در اصفهان, قیمت لپ تاپ گیمینگ اصفهان, لپ تاپ مهندسی اصفهان, مقایسه سخت افزار, لپ تاپ استوک اصفهان, خرید لپ تاپ حکیم نظامی اصفهان, فروشگاه تک تینک, techtink isfahan"),
    ];

    for (k, v) in default_settings {
        sqlx::query("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
            .bind(k)
            .bind(v)
            .execute(pool)
            .await?;
    }

    // Default 3D model migration
    let _ = sqlx::query("UPDATE products SET model3d_url = '/models/laptop-flagship.glb' WHERE model3d_url IS NULL OR model3d_url = ''")
        .execute(pool)
        .await;

    Ok(())
}
