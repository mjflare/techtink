// Shared product serialisation + server-side cart pricing.
import { db } from './db.js';

const parse = (s, fallback) => {
  try { return JSON.parse(s); } catch { return fallback; }
};

export function serializeProduct(p, { full = false } = {}) {
  const rating = db.get("SELECT AVG(rating) AS avg, COUNT(*) AS c FROM comments WHERE product_id = ? AND status = 'approved'", p.id);
  const specs = parse(p.specs, {});

  // Determine CPU/GPU Brand
  const cpuStr = (specs.cpu || '').toLowerCase();
  const gpuStr = (specs.gpu || '').toLowerCase();
  const cpuBrand = p.cpu_brand || specs.cpuBrand || (cpuStr.includes('intel') ? 'Intel' : cpuStr.includes('amd') ? 'AMD' : 'Intel');
  const gpuBrand = p.gpu_brand || specs.gpuBrand || (gpuStr.includes('nvidia') || gpuStr.includes('rtx') ? 'NVIDIA' : gpuStr.includes('amd') || gpuStr.includes('radeon') ? 'AMD' : 'Intel');

  // TechTink Score (0-100 scale across the 6 key parameters)
  const defaultOverall = (cpuStr.includes('i9') || cpuStr.includes('ryzen 9')) ? 92 : (cpuStr.includes('i7') || cpuStr.includes('ryzen 7')) ? 89 : 86;
  const techTinkScore = specs.techTinkScore || {
    overall: defaultOverall,
    batteryLife: (specs.battery?.includes('۹') || specs.battery?.includes('9') || specs.battery?.includes('80Wh')) ? 88 : 82,
    temperature: 87,
    processingPower: (cpuStr.includes('i7') || cpuStr.includes('ryzen 7') || gpuStr.includes('3060') || gpuStr.includes('quadro')) ? 91 : 80,
    usability: 91,
    buildQuality: 92,
    repairability: 89
  };

  // Determine Brand, Model, and Grade
  const rawName = p.name || '';
  const firstWord = rawName.split(' ')[0] || '';
  const brand = p.brand || specs.brand || (['Lenovo', 'HP', 'Dell', 'Asus', 'Apple', 'Acer', 'MSI'].includes(firstWord) ? firstWord : 'TechTink');
  const model = p.model || specs.model || (rawName.startsWith(brand) ? rawName.slice(brand.length).trim() : rawName);
  const grade = p.grade || specs.grade || 'گرید ++A اروپایی (تمیز در حد نو)';

  // Benchmark scores (0-100 scale for charts, kept for compatibility)
  const benchmarks = specs.benchmarks || {
    cpuScore: (cpuStr.includes('i9') || cpuStr.includes('ryzen 9')) ? 96 : (cpuStr.includes('i7') || cpuStr.includes('ryzen 7') || cpuStr.includes('ultra 7')) ? 89 : 78,
    gamingScore: gpuStr.includes('4090') ? 99 : gpuStr.includes('4080') ? 94 : gpuStr.includes('4070') ? 86 : gpuStr.includes('4060') ? 78 : gpuStr.includes('4050') ? 68 : 50,
    displayScore: (specs.display?.includes('OLED') || specs.display?.includes('Mini-LED')) ? 96 : 88,
    batteryScore: (specs.battery?.includes('۱۸') || specs.battery?.includes('۱۴')) ? 94 : (specs.battery?.includes('۱۰') || specs.battery?.includes('۹')) ? 82 : 72,
    coolingScore: 90,
    aiScore: parseInt(String(specs.npuScore || '75').replace(/\D/g, ''), 10) || 80
  };

  // Expert review & intro
  const rawRev = parse(p.expert_review, null);
  const expertReview = {
    intro: rawRev?.intro || `${p.name} با تکیه بر معماری روز، پردازش پرشتاب هوش مصنوعی و طراحی شیک ارگونومیک، انتخابی ایده‌آل در دسته‌بندی ${p.category || 'لپ‌تاپ'} است.`,
    pros: (Array.isArray(rawRev?.pros) && rawRev.pros.length > 0) ? rawRev.pros : [
      `پردازنده پرقدرت ${specs.cpu || 'نسل جدید'}`,
      `پردازش گرافیکی فوق‌العاده با ${specs.gpu || 'کارت گرافیک اختصاصی'}`,
      `کیفیت ساخت درجه‌یک با شاسی مستحکم و سبک`,
      `نمایشگر استاندارد کالیبره با زاویه دید عریض`
    ],
    cons: (Array.isArray(rawRev?.cons) && rawRev.cons.length > 0) ? rawRev.cons : [
      'قیمت متناسب با رده حرفه‌ای',
      'گرمای بدنه در رندرهای طولانی‌مدت سنگین'
    ],
    verdict: rawRev?.verdict || `اگر به دنبال دستگاهی با قابلیت اطمینان، سرعت پردازش پایدار و عملکرد بدون افت در پروژه‌های روزانه و گیمینگ هستید، ${p.name} یکی از ارزنده‌ترین گزینه‌های بازار است.`
  };

  const out = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand,
    model,
    grade,
    tagline: p.tagline,
    category: p.category,
    series: p.series,
    badge: p.badge,
    basePrice: p.base_price,
    oldPrice: p.old_price,
    stock: p.stock,
    stockCount: p.stock,
    inStock: p.stock > 0,
    active: !!p.active,
    image: p.image,
    guarantee: p.guarantee,
    chassis: p.chassis || specs.chassis || 'All-Aluminum CNC Machined',
    specs,
    shortSpecs: specs.shortSpecs || {
      cpu: (specs.cpu ? specs.cpu.split('(')[0].trim() : (cpuBrand || 'Processor')),
      gpu: (specs.gpu ? specs.gpu.split('(')[0].replace(/GeForce\s*/i, '').replace(/GDDR\d+/i, '').replace(/ECC/i, '').replace(/Integrated\s*/i, '').trim() : (gpuBrand || 'Graphics')),
      ram: (specs.ram ? (specs.ram.match(/(\d+\s*GB)/i)?.[1]?.toUpperCase() || specs.ram.split(' ')[0]) : '16GB'),
      storage: (specs.storage ? (specs.storage.match(/(\d+\s*(?:TB|GB))/i)?.[1]?.toUpperCase() + ' SSD' || specs.storage.split(' ')[0] + ' SSD') : '1TB SSD'),
      display: (specs.display ? specs.display.split('(')[0].replace(/\b(?:Dual-Mode|Anti-Glare|\d+ms)\b/gi, '').replace(/\s+/g, ' ').trim() : 'Display'),
      battery: (specs.battery ? (specs.battery.match(/(\d+\s*Wh)/i)?.[1]?.toUpperCase() + ' Battery' || '50Wh Battery') : '50Wh Battery'),
      chassis: (/carbon|کربن/i.test(p.chassis || specs.chassis || '') ? 'فیبر کربن' : /magnesium|منیزیم/i.test(p.chassis || specs.chassis || '') ? 'آلیاژ منیزیم' : /polycarbonate|پلی‌کربنات/i.test(p.chassis || specs.chassis || '') ? 'پلی‌کربنات مقاوم' : 'تمام آلومینیوم')
    },
    cpuBrand,
    gpuBrand,
    techTinkScore,
    benchmarks,
    expertReview,
    rating: rating.c ? Math.round(rating.avg * 10) / 10 : null,
    reviewsCount: rating.c,
    model3d_url: p.model3d_url || specs.model3d_url || null,
    updatedAt: p.updated_at,
    createdAt: p.created_at,
  };

  const variants = db.all('SELECT id, type, name, price FROM product_variants WHERE product_id = ? ORDER BY type, sort, id', p.id);
  out.upgrades = { ram: [], storage: [], display: [] };
  for (const v of variants) (out.upgrades[v.type] ||= []).push({ id: v.id, name: v.name, price: v.price });

  // Associated blog reviews
  const linkedReviews = db.all("SELECT id, title, excerpt, date, read_time, image, author, author_role, category FROM blog_posts WHERE product_slug = ? AND published = 1 ORDER BY rowid DESC", p.slug);
  out.blogReviews = linkedReviews.map(r => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    date: r.date,
    readTime: r.read_time,
    image: r.image,
    author: r.author,
    authorRole: r.author_role,
    category: r.category
  }));
  out.blogReview = out.blogReviews[0] || null;
  
  out.images = db.all('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort, id', p.id).map((r) => r.url);
  if (!out.images.length && p.image) out.images = [p.image];
  
  if (full) {
    out.description = p.description;
    out.highlights = parse(p.highlights, []);
  }
  return out;
}

/**
 * Recalculates a cart from the DB. Never trust client prices.
 * items: [{ productId, variantIds: number[], qty }]
 */
export function priceCart(items) {
  if (!Array.isArray(items) || !items.length) throw new Error('سبد خرید خالی است.');
  const lines = [];
  const needed = new Map();
  for (const it of items) {
    const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
    const p = db.get('SELECT * FROM products WHERE id = ? AND active = 1', it.productId);
    if (!p) throw new Error('یکی از محصولات سبد خرید دیگر در دسترس نیست.');
    const ids = (it.variantIds || []).map(Number).filter(Boolean);
    const variants = ids.length
      ? db.all(`SELECT * FROM product_variants WHERE product_id = ? AND id IN (${ids.map(() => '?').join(',')})`, p.id, ...ids)
      : [];
    if (variants.length !== ids.length) throw new Error(`پیکربندی انتخاب‌شده برای «${p.name}» نامعتبر است.`);
    const unit = p.base_price + variants.reduce((s, v) => s + v.price, 0);
    needed.set(p.id, (needed.get(p.id) || 0) + qty);
    if (needed.get(p.id) > p.stock) throw new Error(`موجودی «${p.name}» کافی نیست (موجودی: ${p.stock}).`);
    lines.push({ productId: p.id, name: p.name, config: variants.map((v) => ({ type: v.type, name: v.name, price: v.price })), unitPrice: unit, qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  return { lines, subtotal };
}
