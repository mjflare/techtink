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

r.get('/homepage', (_req, res) => {
  const getJson = (key, fallback) => {
    try {
      const v = getSetting(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  };

  const announcement = getJson('homepage_announcement', { active: false });
  const hero = getJson('homepage_hero', { active: true });
  const promotion = getJson('homepage_promotion', { active: false });
  const showcase = getJson('homepage_showcase', { active: false, productSlugs: [] });

  let showcaseProducts = [];
  if (showcase.productSlugs && Array.isArray(showcase.productSlugs) && showcase.productSlugs.length > 0) {
    const placeholders = showcase.productSlugs.map(() => '?').join(',');
    const rows = db.all(`SELECT * FROM products WHERE slug IN (${placeholders}) AND active = 1`, ...showcase.productSlugs);
    showcaseProducts = rows.map((p) => serializeProduct(p));
  }

  res.json({
    announcement,
    hero,
    promotion,
    showcase: {
      ...showcase,
      products: showcaseProducts
    }
  });
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

const mapPost = (p) => {
  let linkedProduct = null;
  if (p.product_slug) {
    const prod = db.get('SELECT id, name, slug, image, base_price, category FROM products WHERE slug = ?', p.product_slug);
    if (prod) {
      linkedProduct = {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        image: prod.image,
        basePrice: prod.base_price,
        category: prod.category
      };
    }
  }
  return {
    id: p.id, title: p.title, excerpt: p.excerpt, category: p.category, author: p.author, authorRole: p.author_role,
    authorAvatar: p.author_avatar, date: p.date, readTime: p.read_time, image: p.image, content: p.content,
    productSlug: p.product_slug,
    linkedProduct
  };
};
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

r.get('/about', (_req, res) => {
  res.json({
    name: getSetting('store_name') || 'تک‌تینک',
    address: getSetting('store_address'),
    phone: getSetting('store_phone'),
    mobile: getSetting('store_mobile'),
    hours: getSetting('store_hours'),
    mapLink: getSetting('store_map_link'),
    about: getSetting('store_about'),
    socials: {
      telegram: getSetting('telegram_url'),
      instagram: getSetting('instagram_url'),
      bale: getSetting('bale_url'),
      aparat: getSetting('aparat_url'),
    }
  });
});

r.post('/support/appointment', (req, res) => {
  const {
    type,
    productSlug,
    productName,
    deviceModel,
    services,
    customerName,
    customerPhone,
    customerEmail,
    preferredDate,
    preferredTime,
    deliveryMethod,
    notes
  } = req.body || {};

  if (!customerName || !customerPhone || !type) {
    return res.status(400).json({ error: 'نام و شماره تماس و نوع خدمت الزامی است.' });
  }

  const code = 'RES-' + crypto.randomInt(100000, 999999);
  const servicesJson = typeof services === 'object' ? JSON.stringify(services) : (services || '[]');
  const userId = req.user?.id || null;

  db.run(
    `INSERT INTO appointments (
      user_id, tracking_code, type, product_slug, product_name, device_model, services,
      customer_name, customer_phone, customer_email, preferred_date, preferred_time,
      delivery_method, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    userId,
    code,
    type,
    productSlug || null,
    productName || null,
    deviceModel || null,
    servicesJson,
    customerName,
    customerPhone,
    customerEmail || null,
    preferredDate || null,
    preferredTime || null,
    deliveryMethod || 'in_person',
    notes || null
  );

  res.json({
    success: true,
    trackingCode: code,
    message: 'درخواست نوبت شما با موفقیت ثبت شد. کارشناسان تک‌تینک جهت هماهنگی با شما تماس خواهند گرفت.'
  });
});

r.get('/support/appointment/:code', (req, res) => {
  const appt = db.get('SELECT * FROM appointments WHERE tracking_code = ?', req.params.code.toUpperCase());
  if (!appt) return res.status(404).json({ error: 'نوبتی با این کد رهگیری یافت نشد.' });
  res.json({
    id: appt.id,
    trackingCode: appt.tracking_code,
    type: appt.type,
    productName: appt.product_name,
    deviceModel: appt.device_model,
    services: JSON.parse(appt.services || '[]'),
    customerName: appt.customer_name,
    customerPhone: appt.customer_phone,
    preferredDate: appt.preferred_date,
    preferredTime: appt.preferred_time,
    deliveryMethod: appt.delivery_method,
    status: appt.status,
    notes: appt.notes,
    adminNotes: appt.admin_notes,
    createdAt: appt.created_at
  });
});

// ---------- Coupons (Public Validation) ----------
r.post('/coupons/validate', (req, res) => {
  const { code, subtotal = 0 } = req.body || {};
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode) return res.status(400).json({ valid: false, error: 'لطفاً کد تخفیف را وارد کنید.' });

  const coupon = db.get('SELECT * FROM coupons WHERE UPPER(code) = ?', cleanCode);
  if (!coupon) {
    return res.status(404).json({ valid: false, error: 'کد تخفیف وارد شده معتبر نمی‌باشد.' });
  }

  if (!coupon.is_active) {
    return res.status(400).json({ valid: false, error: 'این کد تخفیف در حال حاضر غیرفعال است.' });
  }

  if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
    return res.status(400).json({ valid: false, error: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است.' });
  }

  const numSubtotal = Number(subtotal) || 0;
  if (coupon.min_order_value > 0 && numSubtotal < coupon.min_order_value) {
    return res.status(400).json({ 
      valid: false, 
      error: `حداقل مبلغ سفارش برای استفاده از این کوپن ${coupon.min_order_value.toLocaleString('fa-IR')} تومان است.` 
    });
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = Math.round(numSubtotal * (coupon.discount_value / 100));
    if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount;
    }
  } else {
    discountAmount = Math.min(coupon.discount_value, numSubtotal);
  }

  res.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      minOrderValue: coupon.min_order_value,
      maxDiscount: coupon.max_discount
    }
  });
});

r.get('/coupons/promoted', (_req, res) => {
  const promoted = db.get('SELECT * FROM coupons WHERE is_promoted = 1 AND is_active = 1 LIMIT 1');
  if (!promoted) return res.json({ coupon: null });
  res.json({
    coupon: {
      code: promoted.code,
      title: promoted.title,
      discountType: promoted.discount_type,
      discountValue: promoted.discount_value,
      validUntil: promoted.valid_until
    }
  });
});

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------- Google SEO & XML Sitemap Generators ----------
export function generateSitemapXml(customBaseUrl) {
  let baseUrl = (customBaseUrl || getSetting('site_url') || 'https://techtink.ir').replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  const now = new Date().toISOString().slice(0, 10);

  // Core high-priority routes
  const staticRoutes = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/catalog`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/compare`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/blog`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/support`, priority: '0.7', changefreq: 'monthly' }
  ];

  // Dynamic active products
  const products = db.all('SELECT slug, updated_at, image, name FROM products WHERE active = 1 ORDER BY id DESC');
  const productRoutes = products.map(p => ({
    loc: `${baseUrl}/product/${p.slug}`,
    priority: '0.9',
    changefreq: 'daily',
    lastmod: p.updated_at ? p.updated_at.slice(0, 10) : now,
    image: p.image,
    title: p.name
  }));

  const allUrls = [...staticRoutes, ...productRoutes];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const item of allUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    xml += `    <lastmod>${escapeXml(item.lastmod || now)}</lastmod>\n`;
    xml += `    <changefreq>${escapeXml(item.changefreq || 'weekly')}</changefreq>\n`;
    xml += `    <priority>${escapeXml(item.priority || '0.7')}</priority>\n`;
    if (item.image) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(item.image)}</image:loc>\n`;
      if (item.title) {
        xml += `      <image:title><![CDATA[${item.title.replace(/]]>/g, ']]&gt;')}]]></image:title>\n`;
      }
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

export function generateRobotsTxt(customBaseUrl) {
  let baseUrl = (customBaseUrl || getSetting('site_url') || 'https://techtink.ir').replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  return `# TechTink Robots.txt for Googlebot, Bingbot & Search Engine Crawlers
User-agent: *
Allow: /
Allow: /catalog
Allow: /product/
Allow: /compare
Allow: /blog
Allow: /support
Disallow: /api/admin/
Disallow: /api/torob/
Disallow: /account
Disallow: /cart

# Crawl Delay
Crawl-delay: 1

# XML Sitemap Location
Sitemap: ${baseUrl}/sitemap.xml
`;
}

r.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const dynamicBase = host ? `${proto}://${host}` : null;
  res.send(generateSitemapXml(dynamicBase));
});

r.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const dynamicBase = host ? `${proto}://${host}` : null;
  res.send(generateRobotsTxt(dynamicBase));
});

r.get('/seo/info', (_req, res) => {
  const baseUrl = (getSetting('site_url') || 'https://techtink.ir').replace(/\/+$/, '');
  res.json({
    siteUrl: baseUrl,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    robotsUrl: `${baseUrl}/robots.txt`,
    googleSiteVerification: getSetting('google_site_verification') || '',
    googleAnalyticsId: getSetting('google_analytics_id') || '',
    metaTitle: getSetting('seo_meta_title') || '',
    metaDescription: getSetting('seo_meta_description') || '',
    metaKeywords: getSetting('seo_meta_keywords') || '',
    productsCount: db.get('SELECT COUNT(*) AS c FROM products WHERE active = 1').c
  });
});

// ---------- Viewer Analytics Tracking ----------
r.post('/analytics/pageview', (req, res) => {
  try {
    const { path = '/', title = '', referrer = '', deviceType = 'desktop', browser = 'Other', os = 'Other' } = req.body || {};
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    // Anonymized daily hash for unique visitors (GDPR and privacy safe)
    const today = new Date().toISOString().slice(0, 10);
    const ipHash = crypto.createHash('sha256').update(`${ip}-${today}`).digest('hex').slice(0, 16);

    let referrerDomain = 'مستقیم (Direct)';
    if (referrer) {
      try {
        const u = new URL(referrer);
        const host = u.hostname.replace(/^www\./, '');
        if (host.includes('google')) referrerDomain = 'Google Search';
        else if (host.includes('torob')) referrerDomain = 'موتور ترب (Torob)';
        else if (host.includes('instagram')) referrerDomain = 'اینستاگرام';
        else if (host.includes('t.me') || host.includes('telegram')) referrerDomain = 'تلگرام';
        else if (host.includes('emalls')) referrerDomain = 'ایمالز (Emalls)';
        else referrerDomain = host;
      } catch {}
    }

    db.run(
      `INSERT INTO pageviews (path, title, referrer, referrer_domain, ip_hash, user_agent, device_type, browser, os)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      String(path).slice(0, 255),
      String(title).slice(0, 255),
      String(referrer).slice(0, 500),
      referrerDomain,
      ipHash,
      String(userAgent).slice(0, 255),
      String(deviceType).slice(0, 30),
      String(browser).slice(0, 50),
      String(os).slice(0, 50)
    );

    res.json({ ok: true });
  } catch {
    res.status(200).json({ ok: false });
  }
});

export default r;

