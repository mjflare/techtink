import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Package, Cpu, BookOpen, Image, Columns, Eye, Edit3, Bold, Italic, 
  List, ListOrdered, Heading2, Heading3, Quote, Table, Link as LinkIcon, 
  Code, AlertCircle, Sparkles, Maximize2, Minimize2, Check, ThumbsUp, 
  ThumbsDown, Layers, ShieldCheck, Plus, Video, Play, Trash2, Wand2, 
  FileText, ChevronDown, ChevronUp, Monitor, HardDrive, Battery, 
  Activity, Flame, RefreshCw, Radio, Rotate3d
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import { renderMarkdownToHtml } from '../utils/markdownRenderer.js';
import AppleFlagshipShowcase from './AppleFlagshipShowcase.jsx';
import LaptopModelViewer from './LaptopModelViewer.jsx';

// Suggested tech photos for quick insertion in product reviews
const TECH_PHOTO_PRESETS = [
  { label: 'خنک‌کننده و محفظه بخار', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80' },
  { label: 'مادربرد و مدار چاپی', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
  { label: 'چیپست پردازنده (CPU/GPU)', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'لپ‌تاپ گیمینگ و کیبورد RGB', url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80' },
  { label: 'میز کار مهندسی و اولترابوک', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80' },
];

// One-Click Presets for popular Iranian stock laptops
const IRANIAN_LAPTOP_PRESETS = [
  {
    label: 'HP ZBook Fury 16 G9 (ورک‌استیشن پرچمدار)',
    data: {
      name: 'HP ZBook Fury 16 G9 Workstation',
      slug: 'hp-zbook-fury-16-g9',
      brand: 'HP',
      model: 'ZBook Fury 16 G9',
      grade: 'گرید ++A اروپایی (تمیز در حد نو)',
      category: 'ورک استیشن',
      series: 'سری ZBook',
      badge: 'ورک‌استیشن پرچمدار',
      basePrice: 74500000,
      stock: 4,
      tagline: 'قدرتمندترین ورک‌استیشن استوک بازار با پردازنده ۲۴ رشته‌ای و گرافیک رندرینگ سنگین RTX A2000',
      guarantee: 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
      cpuBrand: 'Intel',
      gpuBrand: 'NVIDIA',
      chassis: 'آلیاژ تیتانیوم و آلومینیوم',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80'
      ],
      specs: {
        cpu: 'Intel Core i7-12850HX (16 Cores / 24 Threads, up to 4.8GHz, 25MB Cache)',
        gpu: 'NVIDIA RTX A2000 8GB GDDR6 (ISV Certified)',
        ram: '32GB DDR5-4800MHz (۴ اسلات رم، قابل ارتقا تا ۱۲۸ گیگابایت)',
        storage: '1TB PCIe Gen4 NVMe M.2 SSD (پشتیبانی از ۴ هارد SSD M.2)',
        display: '16.0" WUXGA (1920x1200) IPS 16:10 Anti-Glare 400 nits 100% sRGB',
        battery: '86Wh Battery با شارژر اورجینال ۲۰۰ وات HP',
        weight: '2.39 kg',
        npuScore: '35 TOPS',
        chassis: 'آلیاژ تیتانیوم و آلومینیوم'
      },
      upgrades: {
        ram: [
          { name: '۳۲ گیگابایت DDR5 (پیش‌فرض)', price: 0 },
          { name: '۶۴ گیگابایت (۲×۳۲) DDR5 فوق‌سریع', price: 3600000 },
          { name: '۱۲۸ گیگابایت (۴×۳۲) DDR5 ماکزیمم', price: 8500000 }
        ],
        storage: [
          { name: '۱ ترابایت Gen4 NVMe SSD', price: 0 },
          { name: '۲ ترابایت Gen4 NVMe SSD سامسونگ', price: 3800000 },
          { name: '۴ ترابایت (دو درایو ۲ ترابایت RAID 0)', price: 8200000 }
        ],
        display: [
          { name: '۱۶ اینچ WUXGA IPS مات ضد انعکاس', price: 0 },
          { name: '۱۶ اینچ 4K+ DreamColor کالیبره ۱۲۰ هرتز ۵۰۰ نیت', price: 2900000 }
        ]
      },
      expertReview: {
        intro: 'ورک‌استیشن HP ZBook Fury 16 G9 بدون شک قدرتمندترین لپ‌تاپ مهندسی بازار استوک است که با ۴ اسلات رم و ۴ اسلات هارد، جایگزینی کامل برای کیس‌های گران‌قیمت رندرینگ به حساب می‌آید.',
        pros: 'مجهز به ۴ اسلات رم DDR5 و ۴ اسلات هارد M.2 با قابلیت RAID\nگواهی رسمی ISV برای سازگاری ۱۰۰٪ با نرم‌افزارهای مهندسی\nسیستم خنک‌کننده اتاق بخار (Vapor Chamber) بسیار خنک\nشاسی مستحکم تیتانیوم و آلومینیوم استاندارد نظامی MIL-STD',
        cons: 'وزن ۲.۴ کیلوگرم برای جابجایی مداوم روزمره نسبتاً سنگین است\nشارژر ۲۰۰ واتی سنگین وزن',
        verdict: 'اگر به دنبال نهایت توان پردازشی پایدار برای پروژه‌های طولانی‌مدت هستید، زدبوک فیوری ۱۶ بهترین انتخاب بازار است.'
      }
    }
  },
  {
    label: 'Dell Precision 5570 (اسلیم ورک‌استیشن لوکس)',
    data: {
      name: 'Dell Precision 5570 Slim Workstation',
      slug: 'dell-precision-5570',
      brand: 'Dell',
      model: 'Precision 5570',
      grade: 'گرید ++A اروپایی (تمیز در حد نو)',
      category: 'ورک استیشن',
      series: 'سری Precision',
      badge: 'لوکس‌ترین ورک‌استیشن',
      basePrice: 72000000,
      stock: 3,
      tagline: 'شاهکار مهندسی دل با نمایشگر بدون حاشیه 4K+، بدنه فیبر کربن و گرافیک قدرتمند RTX A2000',
      guarantee: 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
      cpuBrand: 'Intel',
      gpuBrand: 'NVIDIA',
      chassis: 'فیبر کربن و آلومینیوم تراش‌خورده CNC',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80'
      ],
      specs: {
        cpu: 'Intel Core i7-12800H (14 Cores / 20 Threads, up to 4.8GHz, 24MB Cache)',
        gpu: 'NVIDIA RTX A2000 8GB GDDR6 (ISV Certified)',
        ram: '32GB DDR5-4800MHz (دو اسلات، قابل ارتقا تا ۶۴ گیگابایت)',
        storage: '1TB PCIe Gen4 NVMe M.2 SSD',
        display: '15.6" 4K UHD+ (3840x2400) IPS 16:10 Touch 500 nits HDR400',
        battery: '86Wh Battery با شارژر اورجینال ۱۳۰ وات دل',
        weight: '1.84 kg',
        npuScore: '32 TOPS',
        chassis: 'فیبر کربن و آلومینیوم'
      },
      upgrades: {
        ram: [
          { name: '۳۲ گیگابایت DDR5 (پیش‌فرض)', price: 0 },
          { name: '۶۴ گیگابایت DDR5 دو کاناله', price: 3800000 }
        ],
        storage: [
          { name: '۱ ترابایت Gen4 SSD', price: 0 },
          { name: '۲ ترابایت Gen4 NVMe SSD سامسونگ', price: 3800000 }
        ],
        display: [
          { name: '۱۵.۶ اینچ 4K UHD+ لمسی PremierColor ۵۰۰ نیت', price: 0 }
        ]
      },
      expertReview: {
        intro: 'دل پرسیژن ۵۵۷۰ تلفیقی کم‌نظیر از ظرافت بدنه لپ‌تاپ‌های XPS و قدرت کارت گرافیک‌های صنعتی ورک‌استیشن است.',
        pros: 'نمایشگر خیره‌کننده 4K+ لمسی ۵۰۰ نیتی با حاشیه‌های تقریباً صفر\nوزن بسیار عالی ۱.۸۴ کیلوگرم برای یک لپ‌تاپ مهندسی حرفه‌ای\nبلندگوهای چهارگانه با تفکیک صوتی استودیویی\nترک‌پد شیشه‌ای فوق‌العاده بزرگ',
        cons: 'فقط دارای درگاه‌های Type-C (تاندربولت ۴)',
        verdict: 'لوکس‌ترین و خوش‌دست‌ترین ورک‌استیشن برای مهندسان معمار و طراحان صنعتی.'
      }
    }
  },
  {
    label: 'Lenovo ThinkPad T14 Gen 2 (مهندسی و برنامه‌نویسی)',
    data: {
      name: 'Lenovo ThinkPad T14 Gen 2',
      slug: 'lenovo-thinkpad-t14',
      brand: 'Lenovo',
      model: 'ThinkPad T14 Gen 2',
      grade: 'گرید ++A اروپایی (تمیز در حد نو)',
      category: 'مهندسی',
      series: 'سری ThinkPad T',
      badge: 'محبوب‌ترین اداری و مهندسی',
      basePrice: 28500000,
      stock: 8,
      tagline: 'محبوب‌ترین تینک‌پد مهندسی و برنامه‌نویسی با کیبورد افسانه‌ای و پردازنده نسل ۱۱',
      guarantee: 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
      cpuBrand: 'Intel',
      gpuBrand: 'NVIDIA',
      chassis: 'پلی‌کربنات فشرده و منیزیم',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80'
      ],
      specs: {
        cpu: 'Intel Core i7-1165G7 (4 Cores / 8 Threads, up to 4.7GHz, 12MB Cache)',
        gpu: 'NVIDIA GeForce MX450 2GB GDDR6',
        ram: '16GB DDR4-3200MHz (قابل ارتقا تا ۴۸ گیگابایت)',
        storage: '512GB PCIe NVMe M.2 SSD',
        display: '14.0" FHD (1920x1080) IPS مات 300 nits Anti-Glare',
        battery: '50Wh Battery با شارژر ۶۵ وات Type-C لنوو',
        weight: '1.47 kg',
        npuScore: '24 TOPS',
        chassis: 'پلی‌کربنات و آلیاژ منیزیم'
      },
      upgrades: {
        ram: [
          { name: '۱۶ گیگابایت DDR4 (پیش‌فرض)', price: 0 },
          { name: '۳۲ گیگابایت DDR4 مهندسی', price: 1400000 },
          { name: '۴۸ گیگابایت DDR4 حداکثر', price: 2900000 }
        ],
        storage: [
          { name: '۵۱۲ گیگابایت NVMe SSD', price: 0 },
          { name: '۱ ترابایت NVMe SSD پرسرعت', price: 1800000 }
        ],
        display: [
          { name: '۱۴ اینچ FHD IPS مات ضد انعکاس', price: 0 }
        ]
      },
      expertReview: {
        intro: 'لپ‌تاپ لنوو ThinkPad T14 نسل دوم انتخابی استاندارد برای برنامه‌نویسان، مدیران شبکه و دانشجویان است.',
        pros: 'بهترین کیبورد تایپ دنیا با کلیدهای خمیده و فیدبک عالی\nاستهلاک بسیار پایین و مقاومت فیزیکی بالا\nپورت‌های ارتباطی غنی بدون نیاز به تبدیل\nشارژدهی مناسب و وزن سبک ۱.۴۷ کیلوگرمی',
        cons: 'روشنایی صفحه ۳۰۰ نیت برای تابش مستقیم آفتاب معمولی است',
        verdict: 'دستگاهی مطمئن که سال‌ها بدون افت کارایی پاسخگوی نیازهای روزمره شما خواهد بود.'
      }
    }
  },
  {
    label: 'Apple MacBook Pro 16 M1 Max (پرچمدار اپل سیلیکون)',
    data: {
      name: 'Apple MacBook Pro 16 M1 Max',
      slug: 'apple-macbook-pro-16-m1-max',
      brand: 'Apple',
      model: 'MacBook Pro 16 M1 Max',
      grade: 'گرید ++A اوپن‌باکس با سایکل باتری زیر ۲۰',
      category: 'تولید محتوا',
      series: 'سری MacBook Pro',
      badge: 'پرچمدار اکوسیستم اپل',
      basePrice: 94500000,
      stock: 2,
      tagline: 'قدرت بی‌پایان اپل سیلیکون با ۳۲ هسته گرافیکی، ۳۲ گیگابایت حافظه یکپارچه و نمایشگر Liquid Retina XDR',
      guarantee: 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
      cpuBrand: 'Apple',
      gpuBrand: 'Apple',
      chassis: 'آلومینیوم ۱۰۰٪ Unibody اپل',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80'
      ],
      specs: {
        cpu: 'Apple M1 Max (10-Core CPU: 8 Performance + 2 Efficiency)',
        gpu: 'Apple 32-Core GPU (پهنای باند ۴۰۰ گیگابایت بر ثانیه)',
        ram: '32GB Unified Memory یکپارچه',
        storage: '1TB Apple Ultra-Fast SSD (سرعت ۷۴۰۰MB/s)',
        display: '16.2" Liquid Retina XDR Mini-LED 120Hz 1600 nits Peak',
        battery: '100Wh Battery با شارژر اورجینال ۱۴۰ وات MagSafe 3',
        weight: '2.16 kg',
        npuScore: '40 TOPS',
        chassis: 'آلومینیوم یکپارچه Unibody'
      },
      upgrades: {
        ram: [
          { name: '۳۲ گیگابایت Unified Memory یکپارچه (پیش‌فرض)', price: 0 }
        ],
        storage: [
          { name: '۱ ترابایت Apple Ultra-Fast SSD', price: 0 },
          { name: '۲ ترابایت Apple Ultra-Fast SSD', price: 5800000 }
        ],
        display: [
          { name: '۱۶.۲ اینچ Liquid Retina XDR با ۱۲۰ هرتز ProMotion', price: 0 }
        ]
      },
      expertReview: {
        intro: 'مک‌بوک پرو ۱۶ با پردازنده M1 Max یکی از انقلابی‌ترین لپ‌تاپ‌های دهه اخیر است که حتی سنگین‌ترین پروژه‌های تدوین ویدیوی 8K را بدون افت سرعت پردازش می‌کند.',
        pros: 'بهترین نمایشگر تاریخ لپ‌تاپ‌ها با روشنایی ۱۶۰۰ نیت HDR\n۳۲ هسته گرافیکی قدرتمند بدون افت بازدهی روی باتری\nسیستم صوتی استودیویی شش اسپیکره بی‌رقیب\nشارژدهی خارق‌العاده تا ۲۱ ساعت',
        cons: 'امکان ارتقای رم و حافظه داخلی بعد از خرید وجود ندارد',
        verdict: 'بی‌رقیب‌ترین ابزار کار برای تدوین‌گران، یوتیوبرها، برنامه‌نویسان ارشد و گرافیست‌ها.'
      }
    }
  }
];

// Smart regex parser to extract hardware specs from raw text
function parseRawSpecs(rawText) {
  if (!rawText || !rawText.trim()) return null;
  const t = rawText;

  // 1. Detect Brand
  let brand = '';
  if (/hp|اچ\s*پی/i.test(t)) brand = 'HP';
  else if (/dell|دل/i.test(t)) brand = 'Dell';
  else if (/lenovo|لنوو/i.test(t)) brand = 'Lenovo';
  else if (/apple|macbook|مک\s*بوک|اپل/i.test(t)) brand = 'Apple';
  else if (/asus|ایسوس/i.test(t)) brand = 'Asus';
  else if (/surface|سرفیس|مایکروسافت/i.test(t)) brand = 'Microsoft';
  else if (/acer|ایسر/i.test(t)) brand = 'Acer';
  else if (/msi|ام\s*اس\s*آی/i.test(t)) brand = 'MSI';

  // 2. Detect CPU
  let cpu = '';
  const appleCpu = t.match(/Apple\s+M[1234](?:\s+(?:Pro|Max|Ultra))?/i);
  const intelCpu = t.match(/(?:Intel\s+)?(?:Core\s+)?(i[3579][ -]?\d{4,5}[A-Z]{0,2}|Ultra\s+[579][ -]?\d{3}[A-Z]{0,2}|Xeon[ -]?\w+)/i);
  const amdCpu = t.match(/(?:AMD\s+)?(?:Ryzen\s+[579]|Ryzen\s+PRO\s+[579])[ -]?\d{4}[A-Z]{0,2}/i);
  if (appleCpu) cpu = appleCpu[0];
  else if (intelCpu) cpu = intelCpu[0];
  else if (amdCpu) cpu = amdCpu[0];

  // 3. Detect GPU
  let gpu = '';
  const rtxMatch = t.match(/(?:NVIDIA\s+)?(?:GeForce\s+)?(RTX\s+[2345]0\d0(?:\s*Ti)?(?:\s*\d+GB)?|RTX\s+A\d{3,4}(?:\s*\d+GB)?|Quadro\s+(?:RTX\s+)?\w+(?:\s*\d+GB)?|T[56]00(?:\s*\d+GB)?|GTX\s+\d{3,4}(?:\s*Ti)?|MX\d{3})/i);
  const appleGpu = t.match(/Apple\s+\d+-Core\s+GPU/i);
  const radeonMatch = t.match(/AMD\s+Radeon[\w\s\d]*/i);
  const irisMatch = t.match(/Intel\s+(?:Iris\s+Xe|UHD\s+Graphics|Arc\s+[\w\d]+)/i);
  if (rtxMatch) gpu = rtxMatch[0];
  else if (appleGpu) gpu = appleGpu[0];
  else if (radeonMatch) gpu = radeonMatch[0];
  else if (irisMatch) gpu = irisMatch[0];

  // 4. Detect RAM
  let ram = '';
  const ramMatch = t.match(/(\d+)\s*(?:GB|گیگابایت|گیگ)\s*(?:DDR[345]|LPDDR[45]x?|Unified)?/i);
  if (ramMatch) ram = ramMatch[0];

  // 5. Detect Storage
  let storage = '';
  const storageMatch = t.match(/(\d+)\s*(?:TB|GB|ترابایت|گیگابایت)\s*(?:NVMe|PCIe|SSD|M\.2|هارد)?/i);
  if (storageMatch) storage = storageMatch[0];

  // 6. Detect Display
  let display = '';
  const displayMatch = t.match(/(\d{2}(?:\.\d+)?)\s*(?:اینچ|inch|\")(?:\s*(?:4K|3\.5K|2K|QHD|FHD|WUXGA|OLED|IPS|Mini-LED|120Hz|144Hz|165Hz|300Hz|لمسی|Touch|مات))*/i);
  if (displayMatch) display = displayMatch[0];

  // 7. Detect Grade
  let grade = 'A+';
  const gradeMatch = t.match(/(?:گرید|grade)\s*([A-Za-z\+]+)/i);
  if (gradeMatch) grade = gradeMatch[1].toUpperCase();

  // 8. Detect Price
  let basePrice = 0;
  const priceMatch = t.match(/(?:قیمت|price|تومان|ت)?\s*(\d{1,3}(?:[,\.\s]\d{3}){2,3})\s*(?:تومان|ت)?/);
  if (priceMatch) {
    basePrice = Number(priceMatch[1].replace(/[,\.\s]/g, ''));
  }

  // 9. Classify Category
  let category = 'مهندسی';
  if (/RTX\s+A|Quadro|Xeon|Fury|Precision|P53|P15|P1\b/i.test(t)) category = 'ورک استیشن';
  else if (/Legion|ROG|Strix|TUF|Alienware|G15|Gaming|گیمینگ/i.test(t)) category = 'گیمینگ';
  else if (/MacBook|XPS|Studio|Creator|تولید محتوا/i.test(t)) category = 'تولید محتوا';
  else if (/Carbon|Air|Firefly|فوق سبک|Ultrabook/i.test(t)) category = 'فوق سبک';

  return { brand, cpu, gpu, ram, storage, display, grade, basePrice, category };
}

// Auto-generate Apple Flagship Storytelling from current product specs
function generateFlagshipFromSpecs(name, specs, chassisVal) {
  const c = specs?.cpu || 'پردازنده نسل جدید';
  const g = specs?.gpu || 'کارت گرافیک قدرتمند';
  const d = specs?.display || 'نمایشگر استاندارد کالیبره';
  const ch = chassisVal || specs?.chassis || 'آلیاژ مستحکم آلومینیوم و منیزیم';

  return {
    enabled: true,
    stages: [
      {
        id: 'design',
        title: `شاسی مهندسی‌شده ${ch}`,
        subtitle: 'استحکام فوق‌العاده با مقاومت در برابر ضربه و استانداردهای فیزیکی MIL-STD',
        tag: 'متریال هوافضا',
        imageIndex: 0,
        description: `بدنه تراش‌خورده و ارگونومیک ${name || 'دستگاه'} با بالاترین دقت مهندسی و متریال ${ch} برای کنترل وزن و انتقال بهینه حرارت طراحی شده است.`
      },
      {
        id: 'display',
        title: `نمایشگر حرفه‌ای ${d}`,
        subtitle: 'وضوح استثنایی با تفکیک رنگی سینمایی و روشنایی عالی برای امور طولانی‌مدت',
        tag: 'دقت رنگ ۱۰۰٪',
        imageIndex: 1,
        description: `پنل کالیبره‌شده کارخانه‌ای ${d} با پوشش طیف رنگی گسترده، مناسب ادیتورهای ویدیویی، طراحان گرافیک و مهندسان نقشه‌کشی بدون خستگی چشم.`
      },
      {
        id: 'silicon',
        title: `معماری پردازش سیلیکونی ${c}`,
        subtitle: `خنک‌کاری خنک با محفظه بخار و گرافیک ${g}`,
        tag: 'خنک‌کننده پیشرفته',
        imageIndex: 2,
        description: `هماهنگی بی‌نقص پردازنده ${c} با شتاب‌دهنده گرافیکی ${g}، حداکثر پایداری کلاک توربو بوست را حتی در رندرهای مداوم چندروزه تضمین می‌کند.`
      },
      {
        id: 'ergonomics',
        title: 'درگاه‌های ارتباطی کامل و کیبورد ارگونومیک',
        subtitle: 'ارتباطات پرسرعت بدون نیاز به تبدیل و حس بی‌نظیر تایپ',
        tag: 'پورت‌های نسل جدید',
        imageIndex: 3,
        description: 'مجهز به درگاه‌های پرسرعت Thunderbolt / Type-C، خروجی تصویری مستقیم HDMI و درگاه پرسرعت شبکه و کارت‌خوان SD بدون نیاز به حمل دانگل.'
      }
    ],
    hotspots: [
      { id: 'screen', top: '26%', left: '48%', title: 'پنل ضد انعکاس کالیبره', desc: d },
      { id: 'cooling', top: '64%', left: '28%', title: 'سیستم خنک‌کاری اتاق بخار (Vapor Chamber)', desc: 'خنک‌کاری مدار تغذیه و چیپ‌ها با هیت‌پایپ‌های مسی عریض' },
      { id: 'keyboard', top: '72%', left: '52%', title: 'کیبورد ارگونومیک', desc: 'عمق کلید بهینه با نور پس‌زمینه یکدست و تایپ کم‌صدا' },
      { id: 'ports', top: '56%', left: '80%', title: 'درگاه‌های Thunderbolt 4', desc: 'انتقال داده با سرعت ۴۰ گیگابیت بر ثانیه و اتصال به مانیتورهای 8K' }
    ],
    workloads: [
      { label: 'آماده به کار (Idle)', temp: '34°C', fanRpm: '0 RPM (کامپکت و بی‌صدا)', power: '15W', status: 'خاموشی فن‌ها و حداکثر پایداری باتری' },
      { label: 'برنامه‌نویسی و وب (Coding)', temp: '42°C', fanRpm: '1400 RPM (زمزمه ملایم)', power: '38W', status: 'دمای خنک استراحتگاه مچ دست' },
      { label: 'رندرینگ سه‌بعدی و تدوین (3D Render)', temp: '68°C', fanRpm: '2800 RPM (تهویه بهینه)', power: '95W', status: 'حداکثر بازدهی فرکانس توربو بوست' },
      { label: 'شبیه‌سازی سنگین و AI (Full Load)', temp: '76°C', fanRpm: '3900 RPM (حداکثر توربو)', power: '140W', status: 'خنک‌کاری کامل توسط محفظه بخار بدون افت فریم' }
    ]
  };
}

export default function ProductEditorModal({ 
  isOpen, 
  mode = 'add', 
  initialData, 
  onClose, 
  onSave, 
  isSaving, 
  error,
  blogPosts = []
}) {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    slug: '',
    brand: '',
    model: '',
    grade: 'گرید ++A اروپایی (تمیز در حد نو)',
    category: 'ورک استیشن',
    series: 'سری ZBook',
    basePrice: 50000000,
    stock: 5,
    tagline: '',
    badge: 'پیشنهاد ویژه',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80'
    ],
    guarantee: 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
    cpuBrand: 'Intel',
    gpuBrand: 'NVIDIA',
    chassis: 'آلیاژ تیتانیوم و آلومینیوم',
    specs: {
      cpu: 'Intel Core i7-12850HX',
      gpu: 'NVIDIA RTX A2000 8GB',
      ram: '32GB DDR5 4800MHz',
      storage: '1TB NVMe PCIe 4.0 SSD',
      display: '16.0" WUXGA IPS 16:10',
      battery: '86Wh Battery',
      weight: '2.39 kg',
      npuScore: '35 TOPS',
      chassis: 'آلیاژ تیتانیوم و آلومینیوم'
    },
    upgrades: {
      ram: [
        { name: '۳۲ گیگابایت DDR5 (پیش‌فرض)', price: 0 },
        { name: '۶۴ گیگابایت DDR5 فوق‌سریع', price: 3600000 }
      ],
      storage: [
        { name: '۱ ترابایت Gen4 NVMe SSD', price: 0 },
        { name: '۲ ترابایت Gen4 NVMe SSD', price: 3800000 }
      ],
      display: [
        { name: '۱۶ اینچ WUXGA IPS مات ضد انعکاس', price: 0 }
      ]
    },
    flagshipShowcase: null,
    model3d_url: '/models/laptop-flagship.glb',
    enable_3d_viewer: true,
    expertReview: {
      intro: '',
      pros: '',
      cons: '',
      verdict: '',
      fullReview: ''
    },
    linkedBlogId: ''
  });

  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'specs' | 'gallery' | 'upgrades' | 'flagship' | 'review'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'edit' | 'preview'
  const [previewSubTab, setPreviewSubTab] = useState('card'); // 'card' | 'flagship' | 'review'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Smart Parser Tool Drawer State
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [rawSpecsInput, setRawSpecsInput] = useState('');
  const [parseNotice, setParseNotice] = useState('');

  // Inline Photo Inserter
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // Inline Video Inserter (Aparat / YouTube)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const reviewTextareaRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      const defaultImg = initialData.image || (initialData.images && initialData.images[0]) || '';
      const imgs = Array.isArray(initialData.images) && initialData.images.length > 0 
        ? initialData.images 
        : (defaultImg ? [defaultImg] : []);

      setFormData({
        id: initialData.id ?? null,
        name: initialData.name || '',
        slug: initialData.slug || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        grade: initialData.grade || 'گرید ++A اروپایی (تمیز در حد نو)',
        category: initialData.category || 'ورک استیشن',
        series: initialData.series || '',
        basePrice: initialData.basePrice || 0,
        stock: initialData.stock || 0,
        tagline: initialData.tagline || '',
        badge: initialData.badge || '',
        image: defaultImg,
        images: imgs,
        guarantee: initialData.guarantee || 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
        cpuBrand: initialData.cpuBrand || 'Intel',
        gpuBrand: initialData.gpuBrand || 'NVIDIA',
        chassis: initialData.chassis || initialData.specs?.chassis || 'آلیاژ تیتانیوم و آلومینیوم',
        specs: {
          cpu: initialData.specs?.cpu || '',
          gpu: initialData.specs?.gpu || '',
          ram: initialData.specs?.ram || '',
          storage: initialData.specs?.storage || '',
          display: initialData.specs?.display || '',
          battery: initialData.specs?.battery || '',
          weight: initialData.specs?.weight || '',
          npuScore: initialData.specs?.npuScore || '',
          chassis: initialData.chassis || initialData.specs?.chassis || 'آلیاژ تیتانیوم و آلومینیوم'
        },
        upgrades: initialData.upgrades || { ram: [], storage: [], display: [] },
        flagshipShowcase: initialData.specs?.flagshipShowcase || initialData.flagshipShowcase || null,
        model3d_url: initialData.model3d_url || initialData.specs?.model3d_url || '/models/laptop-flagship.glb',
        enable_3d_viewer: initialData.enable_3d_viewer !== false && initialData.specs?.enable_3d_viewer !== false,
        expertReview: {
          intro: initialData.expertReview?.intro || '',
          pros: Array.isArray(initialData.expertReview?.pros) ? initialData.expertReview.pros.join('\n') : (initialData.expertReview?.pros || ''),
          cons: Array.isArray(initialData.expertReview?.cons) ? initialData.expertReview.cons.join('\n') : (initialData.expertReview?.cons || ''),
          verdict: initialData.expertReview?.verdict || '',
          fullReview: initialData.expertReview?.fullReview || initialData.expertReview?.intro || ''
        },
        linkedBlogId: initialData.linkedBlogId || ''
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Apply a standard Iranian Stock Laptop preset with one click
  const handleApplyPreset = (preset) => {
    const d = preset.data;
    setFormData(prev => ({
      ...prev,
      name: d.name,
      slug: d.slug,
      brand: d.brand,
      model: d.model,
      grade: d.grade,
      category: d.category,
      series: d.series,
      badge: d.badge,
      basePrice: d.basePrice,
      stock: d.stock,
      tagline: d.tagline,
      guarantee: d.guarantee,
      cpuBrand: d.cpuBrand,
      gpuBrand: d.gpuBrand,
      chassis: d.chassis,
      image: d.image,
      images: d.images,
      specs: { ...d.specs },
      upgrades: { ...d.upgrades },
      expertReview: { ...d.expertReview },
      flagshipShowcase: generateFlagshipFromSpecs(d.name, d.specs, d.chassis)
    }));
    setParseNotice(`✅ پیش‌تنظیم "${preset.label}" با موفقیت بر روی تمام بخش‌ها اعمال گردید!`);
    setTimeout(() => setParseNotice(''), 4000);
  };

  // Run Smart Specs Auto-Parser on user pasted text
  const handleRunSpecsParser = () => {
    if (!rawSpecsInput.trim()) return;
    const parsed = parseRawSpecs(rawSpecsInput);
    if (!parsed) return;

    setFormData(prev => {
      const brandVal = parsed.brand || prev.brand || 'Lenovo';
      const nameVal = prev.name || `${brandVal} ${parsed.cpu ? parsed.cpu.split(' ')[0] : 'Laptop'}`;
      const slugVal = prev.slug || nameVal.toLowerCase().replace(/[\s\(\)\/\+]+/g, '-').replace(/[^a-z0-9\-]/g, '');

      return {
        ...prev,
        brand: brandVal,
        category: parsed.category || prev.category,
        grade: parsed.grade ? `گرید ${parsed.grade}` : prev.grade,
        basePrice: parsed.basePrice > 0 ? parsed.basePrice : prev.basePrice,
        cpuBrand: parsed.cpu.toLowerCase().includes('amd') ? 'AMD' : parsed.cpu.toLowerCase().includes('apple') ? 'Apple' : 'Intel',
        gpuBrand: parsed.gpu.toLowerCase().includes('nvidia') || parsed.gpu.toLowerCase().includes('rtx') 
          ? 'NVIDIA' 
          : parsed.gpu.toLowerCase().includes('amd') 
            ? 'AMD' 
            : (parsed.gpu.toLowerCase().includes('apple') || parsed.cpu.toLowerCase().includes('apple'))
              ? 'Apple'
              : 'Intel',
        specs: {
          ...prev.specs,
          cpu: parsed.cpu || prev.specs.cpu,
          gpu: parsed.gpu || prev.specs.gpu,
          ram: parsed.ram || prev.specs.ram,
          storage: parsed.storage || prev.specs.storage,
          display: parsed.display || prev.specs.display
        }
      };
    });

    setParseNotice('⚡ مشخصات از متن خام استخراج شد و فیلدهای فرم به‌روزرسانی شدند!');
    setIsParserOpen(false);
    setTimeout(() => setParseNotice(''), 4500);
  };

  // Helper to insert markdown in review textarea at cursor position
  const insertAtCursor = (beforeText, afterText = '', defaultPlaceholder = '') => {
    const textarea = reviewTextareaRef.current;
    const currentReview = formData.expertReview.intro;
    if (!textarea) {
      setFormData(prev => ({
        ...prev,
        expertReview: {
          ...prev.expertReview,
          intro: currentReview + beforeText + defaultPlaceholder + afterText
        }
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentReview.substring(start, end) || defaultPlaceholder;
    const replacement = `${beforeText}${selectedText}${afterText}`;
    const newContent = currentReview.substring(0, start) + replacement + currentReview.substring(end);

    setFormData(prev => ({
      ...prev,
      expertReview: {
        ...prev.expertReview,
        intro: newContent
      }
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + beforeText.length, start + beforeText.length + selectedText.length);
    }, 50);
  };

  const handleInsertPhoto = () => {
    if (!photoUrl.trim()) return;
    const caption = photoCaption.trim() || 'تصویر سخت‌افزار';
    const markdown = `\n\n![${caption}](${photoUrl.trim()})\n\n`;
    insertAtCursor(markdown, '', '');
    setPhotoUrl('');
    setPhotoCaption('');
    setIsPhotoModalOpen(false);
  };

  const handleInsertVideo = () => {
    if (!videoUrl.trim()) return;
    const titleText = videoTitle.trim() || 'ویدیوی بررسی دستگاه';
    const markdown = `\n\n!video[${titleText}](${videoUrl.trim()})\n\n`;
    insertAtCursor(markdown, '', '');
    setVideoUrl('');
    setVideoTitle('');
    setIsVideoModalOpen(false);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const prosList = (formData.expertReview?.pros || '').split('\n').map(s => s.trim()).filter(Boolean);
    const consList = (formData.expertReview?.cons || '').split('\n').map(s => s.trim()).filter(Boolean);
    const chassisVal = formData.chassis || formData.specs?.chassis || 'آلیاژ تیتانیوم و آلومینیوم';

    // Auto-generate flagship showcase if none is set
    const finalFlagship = formData.flagshipShowcase || generateFlagshipFromSpecs(formData.name, formData.specs, chassisVal);

    const payload = {
      ...formData,
      basePrice: Number(formData.basePrice),
      stock: Number(formData.stock),
      enable_3d_viewer: formData.enable_3d_viewer !== false,
      chassis: chassisVal,
      images: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : []),
      upgrades: formData.upgrades || { ram: [], storage: [], display: [] },
      specs: {
        ...formData.specs,
        chassis: chassisVal,
        enable_3d_viewer: formData.enable_3d_viewer !== false,
        flagshipShowcase: finalFlagship
      },
      flagshipShowcase: finalFlagship,
      expertReview: {
        intro: formData.expertReview?.intro || '',
        pros: prosList,
        cons: consList,
        verdict: formData.expertReview?.verdict || '',
        fullReview: formData.expertReview?.intro || ''
      }
    };
    onSave(payload);
  };

  // Preview Product Model Object
  const previewProduct = {
    ...formData,
    images: formData.images && formData.images.length > 0 ? formData.images : [formData.image],
    shortSpecs: {
      cpu: formData.specs.cpu ? formData.specs.cpu.split('(')[0].trim() : 'Intel Core i7',
      gpu: formData.specs.gpu ? formData.specs.gpu.split('(')[0].trim() : 'NVIDIA RTX',
      ram: formData.specs.ram ? formData.specs.ram.split(' ')[0] : '16GB',
      storage: formData.specs.storage ? formData.specs.storage.split(' ')[0] + ' SSD' : '1TB SSD',
      display: formData.specs.display || '15.6" IPS Display',
      battery: formData.specs.battery || '80Wh Battery',
      chassis: formData.chassis || 'آلیاژ فلزی'
    },
    flagshipShowcase: formData.flagshipShowcase || generateFlagshipFromSpecs(formData.name, formData.specs, formData.chassis)
  };

  return (
    <div className="modal-backdrop-wrapper" style={{ zIndex: 110 }}>
      <div 
        className="glass-panel modal-card" 
        style={{ 
          maxWidth: isFullscreen ? '99vw' : '1280px', 
          width: '98vw',
          height: isFullscreen ? '98vh' : '92vh',
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Modal Top Header */}
        <div 
          className="flex" 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-glass)',
            background: 'rgba(255, 255, 255, 0.05)',
            flexShrink: 0
          }}
        >
          <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              background: 'hsla(var(--accent-cyan), 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'hsl(var(--accent-cyan))'
            }}>
              <Package size={19} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mode === 'edit' ? `ویرایشگر کالا: ${formData.name || 'بدون نام'}` : 'تولیدکننده پیشرفته صفحه محصول تک‌تینک'}
                <span className="badge" style={{ fontSize: '0.68rem', background: 'hsl(var(--accent-cyan))', color: '#fff' }}>
                  Smart Studio
                </span>
              </h2>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                مدیریت زوایای گالری، ارتقای سخت‌افزار، کاوش تعاملی پرچمدار و استخراج هوشمند مشخصات
              </div>
            </div>
          </div>

          <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
            {/* Quick Specs AI Parser Toggle */}
            <button
              type="button"
              className="btn btn-glass"
              onClick={() => setIsParserOpen(!isParserOpen)}
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'hsl(var(--accent-purple))',
                borderColor: 'hsla(var(--accent-purple), 0.4)'
              }}
              title="تجزیه و پر کردن فرم از متن خام دیجی‌کالا/ترب"
            >
              <Wand2 size={14} /> استخراج هوشمند از متن
            </button>

            {/* View Mode Switcher */}
            <div 
              className="flex" 
              style={{ 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '8px', 
                padding: '3px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <button
                type="button"
                className="btn"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'split' ? 'hsl(var(--accent-cyan))' : 'transparent',
                  color: viewMode === 'split' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={() => setViewMode('split')}
                title="تقسیم صفحه (فرم و پیش‌نمایش)"
              >
                <Columns size={13} /> تقسیم صفحه
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'edit' ? 'hsl(var(--accent-cyan))' : 'transparent',
                  color: viewMode === 'edit' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={() => setViewMode('edit')}
              >
                <Edit3 size={13} /> فقط فرم
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'preview' ? 'hsl(var(--accent-cyan))' : 'transparent',
                  color: viewMode === 'preview' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={() => setViewMode('preview')}
              >
                <Eye size={13} /> فقط پیش‌نمایش
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '8px', borderRadius: '8px' }}
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '8px', borderRadius: '50%' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Laptop Presets Bar */}
        <div 
          style={{ 
            padding: '8px 24px', 
            background: 'rgba(0, 0, 0, 0.03)', 
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={13} color="hsl(var(--accent-cyan))" /> الگوهای محبوب بازار ایران:
          </span>
          {IRANIAN_LAPTOP_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="btn btn-glass"
              style={{
                padding: '4px 10px',
                fontSize: '0.74rem',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,0.06)'
              }}
              title="بارگذاری تمام اطلاعات، عکس‌ها و مشخصات این لپ‌تاپ"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Smart AI Specs Parser Collapsible Drawer */}
        {isParserOpen && (
          <div 
            className="animate-fade-in"
            style={{ 
              padding: '16px 24px', 
              background: 'rgba(139, 92, 246, 0.06)', 
              borderBottom: '1px solid var(--border-glass)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--accent-purple))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wand2 size={16} /> تجزیه خودکار متن مشخصات (Auto-Parse Specs)
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                متن خام لپ‌تاپ را از دیجی‌کالا، ترب، رایتاپ یا تلگرام پیست کنید تا مشخصات تفکیک شوند.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
              <textarea
                value={rawSpecsInput}
                onChange={e => setRawSpecsInput(e.target.value)}
                placeholder="مثال: لپ تاپ اچ پی زدبوک HP ZBook 15 G6 پردازنده i7 9750H گرافیک Quadro T2000 رم 32 گیگابایت حافظه 512GB SSD صفحه نمایش 15.6 اینچ مات گرید ++A قیمت 38,500,000 تومان"
                rows={2}
                style={{ flexGrow: 1, fontSize: '0.8125rem', padding: '10px 14px', borderRadius: '10px' }}
              />
              <button
                type="button"
                onClick={handleRunSpecsParser}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                استخراج و اعمال در فرم
              </button>
            </div>
          </div>
        )}

        {/* Global Notification */}
        {parseNotice && (
          <div style={{ padding: '8px 24px', background: 'hsla(var(--accent-green), 0.15)', color: 'hsl(var(--accent-green))', fontSize: '0.825rem', fontWeight: 600 }}>
            {parseNotice}
          </div>
        )}

        {/* Tabs Bar & Quick Save */}
        <div 
          className="flex" 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '8px 24px',
            borderBottom: '1px solid var(--border-glass)',
            background: '#f8fafc',
            flexShrink: 0
          }}
        >
          {/* Tabs Navigation */}
          <div className="flex" style={{ gap: '6px', overflowX: 'auto' }}>
            {[
              { id: 'basic', label: 'اطلاعات عمومی و قیمت', icon: Package },
              { id: 'specs', label: 'مشخصات سخت‌افزار', icon: Cpu },
              { id: 'gallery', label: 'گالری چندزاویه‌ای', icon: Image, badge: '۴ زاویه' },
              { id: 'upgrades', label: 'ارتقای سخت‌افزاری', icon: Layers, badge: 'RAM/SSD' },
              { id: 'flagship', label: 'کاوش تعاملی پرچمدار', icon: Sparkles, badge: 'Flagship' },
              { id: 'review', label: 'نقد و بررسی زنده', icon: BookOpen, badge: 'Studio' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.825rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                  background: activeTab === tab.id ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <tab.icon size={14} color={activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'currentColor'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="badge" style={{ fontSize: '0.62rem', background: 'hsl(var(--accent-purple))', color: '#fff', padding: '1px 5px' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Save Action */}
          <div className="flex" style={{ gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              قیمت: <strong>{formatPrice(formData.basePrice)}</strong>
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSaving}
              style={{ padding: '8px 24px', fontSize: '0.875rem' }}
            >
              {isSaving ? 'در حال ذخیره...' : mode === 'edit' ? 'ذخیره تغییرات لپ‌تاپ' : 'ثبت لپ‌تاپ در فروشگاه'}
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{ padding: '8px 24px', background: 'hsla(var(--accent-red), 0.15)', color: 'hsl(var(--accent-red))', fontSize: '0.825rem' }}>
            {error}
          </div>
        )}

        {/* Main Work Area */}
        <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* LEFT: Forms & Editor Pane */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div 
              style={{ 
                flex: viewMode === 'split' ? '1 1 50%' : '1 1 100%', 
                borderLeft: viewMode === 'split' ? '1px solid var(--border-glass)' : 'none',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'rgba(0, 0, 0, 0.02)'
              }}
            >

              {/* ──────────────── TAB 1: BASIC INFO ──────────────── */}
              {activeTab === 'basic' && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px', fontWeight: 600 }}>
                        نام کامل دستگاه (Product Title) *
                      </label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="HP ZBook Fury 16 G9 Workstation" 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>برند سازنده (Brand)</label>
                      <select
                        value={formData.brand}
                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      >
                        <option value="HP">HP (اچ‌پی)</option>
                        <option value="Dell">Dell (دل)</option>
                        <option value="Lenovo">Lenovo (لنوو)</option>
                        <option value="Apple">Apple (اپل)</option>
                        <option value="Asus">Asus (ایسوس)</option>
                        <option value="Microsoft">Microsoft (سرفیس)</option>
                        <option value="Acer">Acer (ایسر)</option>
                        <option value="MSI">MSI</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مدل دقیق (Model)</label>
                      <input 
                        type="text" 
                        value={formData.model} 
                        onChange={e => setFormData({ ...formData, model: e.target.value })} 
                        placeholder="ZBook Fury 16 G9" 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>گرید وضعیت ظاهری دستگاه (Grade)</label>
                      <select
                        value={formData.grade}
                        onChange={e => setFormData({ ...formData, grade: e.target.value })}
                      >
                        <option value="گرید ++A اروپایی (تمیز در حد نو)">گرید ++A اروپایی (تمیز در حد نو)</option>
                        <option value="گرید +A تمیز بدون خط و خش">گرید +A تمیز بدون خط و خش</option>
                        <option value="گرید A بسیار تمیز">گرید A بسیار تمیز</option>
                        <option value="گرید ++A اوپن‌باکس در حد آکبند">گرید ++A اوپن‌باکس در حد آکبند</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>نامک در URL (Slug)</label>
                      <input 
                        type="text" 
                        className="font-code" 
                        value={formData.slug} 
                        onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                        placeholder="hp-zbook-fury-16-g9" 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>دسته‌بندی در فروشگاه</label>
                      <select 
                        value={formData.category} 
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="ورک استیشن">ورک استیشن مهندسی</option>
                        <option value="گیمینگ">گیمینگ و رندرینگ</option>
                        <option value="مهندسی">مهندسی و برنامه‌نویسی</option>
                        <option value="تولید محتوا">تولید محتوا و گرافیک</option>
                        <option value="فوق سبک">فوق سبک و اولترابوک</option>
                        <option value="دانشجویی">دانشجویی و عمومی</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>قیمت پایه (تومان)</label>
                      <input 
                        type="number" 
                        className="font-code" 
                        value={formData.basePrice} 
                        onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>موجودی انبار (تعداد دستگاه)</label>
                      <input 
                        type="number" 
                        className="font-code" 
                        value={formData.stock} 
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>نشان ویژه (Badge)</label>
                      <input 
                        type="text" 
                        value={formData.badge} 
                        onChange={e => setFormData({ ...formData, badge: e.target.value })} 
                        placeholder="ورک‌استیشن پرچمدار" 
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>شعار بازاریابی و عنوان برجسته</label>
                      <input 
                        type="text" 
                        value={formData.tagline} 
                        onChange={e => setFormData({ ...formData, tagline: e.target.value })} 
                        placeholder="قدرتمندترین ورک‌استیشن استوک بازار با گرافیک سنگین RTX A2000" 
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>گارانتی و خدمات پشتیبانی</label>
                      <input 
                        type="text" 
                        value={formData.guarantee} 
                        onChange={e => setFormData({ ...formData, guarantee: e.target.value })} 
                        placeholder="گارانتی ۶ ماهه طلایی استوک تک‌تینک" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 2: SPECS ──────────────── */}
              {activeTab === 'specs' && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', marginBottom: '6px', color: 'hsl(var(--accent-cyan))' }}>
                        سازنده پردازنده مرکزی (CPU Maker)
                      </label>
                      <select 
                        value={formData.cpuBrand} 
                        onChange={e => setFormData({ ...formData, cpuBrand: e.target.value })}
                        style={{ fontWeight: 'bold' }}
                      >
                        <option value="Intel">اینتل (Intel)</option>
                        <option value="AMD">ای‌ام‌دی (AMD)</option>
                        <option value="Apple">اپل (Apple Silicon)</option>
                        <option value="Other">سایر سازندگان</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', marginBottom: '6px', color: 'hsl(var(--accent-green))' }}>
                        سازنده پردازنده گرافیکی (GPU Maker)
                      </label>
                      <select 
                        value={formData.gpuBrand} 
                        onChange={e => setFormData({ ...formData, gpuBrand: e.target.value })}
                        style={{ fontWeight: 'bold' }}
                      >
                        <option value="NVIDIA">انویدیا (NVIDIA GeForce / RTX / Quadro)</option>
                        <option value="AMD">ای‌ام‌دی (AMD Radeon)</option>
                        <option value="Intel">اینتل (Intel Arc / Iris)</option>
                        <option value="Apple">اپل (Apple GPU)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مدل دقیق CPU</label>
                      <input 
                        type="text" 
                        value={formData.specs.cpu || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, cpu: e.target.value } })} 
                        placeholder="Intel Core i7-12850HX" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مدل دقیق گرافیک (GPU)</label>
                      <input 
                        type="text" 
                        value={formData.specs.gpu || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, gpu: e.target.value } })} 
                        placeholder="NVIDIA RTX A2000 8GB GDDR6" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>حافظه رم (RAM)</label>
                      <input 
                        type="text" 
                        value={formData.specs.ram || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, ram: e.target.value } })} 
                        placeholder="32GB DDR5 4800MHz" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>حافظه داخلی (SSD)</label>
                      <input 
                        type="text" 
                        value={formData.specs.storage || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, storage: e.target.value } })} 
                        placeholder="1TB NVMe PCIe 4.0 SSD" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مشخصات صفحه نمایش</label>
                      <input 
                        type="text" 
                        value={formData.specs.display || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, display: e.target.value } })} 
                        placeholder="16.0 WUXGA IPS 16:10 400nits" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>ظرفیت باتری و شارژر</label>
                      <input 
                        type="text" 
                        value={formData.specs.battery || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, battery: e.target.value } })} 
                        placeholder="86Wh با شارژر ۲۰۰ وات اورجینال" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>وزن دستگاه</label>
                      <input 
                        type="text" 
                        value={formData.specs.weight || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, weight: e.target.value } })} 
                        placeholder="2.39 kg" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>توان پردازش هوش مصنوعی (NPU)</label>
                      <input 
                        type="text" 
                        value={formData.specs.npuScore || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, npuScore: e.target.value } })} 
                        placeholder="35 TOPS" 
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>جنس بدنه و شاسی (Chassis)</label>
                      <input 
                        type="text" 
                        value={formData.chassis || ''} 
                        onChange={e => setFormData({ ...formData, chassis: e.target.value, specs: { ...formData.specs, chassis: e.target.value } })} 
                        placeholder="آلیاژ تیتانیوم و آلومینیوم با استاندارد نظامی MIL-STD" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 3: MULTI-ANGLE GALLERY ──────────────── */}
              {activeTab === 'gallery' && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>
                        زوایای چهارگانه اختصاصی گالری (Apple Multi-Angle Views)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        چهار نمای اصلی برای مرور تعاملی ۳۶۰ درجه توسط مشتریان فروشگاه
                      </p>
                    </div>

                    {/* Quick photo set pickers */}
                    <button
                      type="button"
                      className="btn btn-glass"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          images: [
                            'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
                            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
                            'https://images.unsplash.com/photo-1544731612-de292439cc67?auto=format&fit=crop&w=1200&q=80',
                            'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80'
                          ],
                          image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80'
                        }));
                      }}
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      <RefreshCw size={13} style={{ marginLeft: '4px' }} /> بارگذاری تصاویر نمونه باکیفیت
                    </button>
                  </div>

                  {/* 4 Designated View Slots */}
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {[
                      { idx: 0, label: 'زاویه ۱: نمای روبرو و کاور (Front Hero)', desc: 'تصویر اصلی نمایشگر و شاسی' },
                      { idx: 1, label: 'زاویه ۲: کیبورد و تاچ‌پد (Keyboard & Palmrest)', desc: 'جزئیات تایپ و دکمه‌ها' },
                      { idx: 2, label: 'زاویه ۳: درگاه‌ها و شاسی جانبی (Ports & Profile)', desc: 'پورت‌های تاندربولت و USB' },
                      { idx: 3, label: 'زاویه ۴: پشت شاسی و لوگو (Back & Lid)', desc: 'درب پشت و متریال بدنه' }
                    ].map(slot => {
                      const curUrl = formData.images[slot.idx] || '';
                      return (
                        <div key={slot.idx} className="glass-panel" style={{ padding: '14px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--accent-cyan))' }}>
                            {slot.label}
                          </div>
                          
                          {/* Thumbnail preview */}
                          <div style={{
                            width: '100%',
                            height: '110px',
                            borderRadius: '8px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-glass)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {curUrl ? (
                              <img src={curUrl} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>بدون تصویر</span>
                            )}
                          </div>

                          <input
                            type="text"
                            value={curUrl}
                            onChange={e => {
                              const newImgs = [...formData.images];
                              newImgs[slot.idx] = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                images: newImgs,
                                image: slot.idx === 0 ? e.target.value : prev.image
                              }));
                            }}
                            placeholder="https://images.unsplash.com/..."
                            style={{ fontSize: '0.75rem', direction: 'ltr', fontFamily: 'var(--font-code)' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 4: HARDWARE UPGRADES ──────────────── */}
              {activeTab === 'upgrades' && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>
                        پکیج‌های ارتقای سخت‌افزاری سفارشی (RAM / SSD / Display)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        مشتریان می‌توانند قبل از افزودن به سبد خرید، این گزینه‌ها را انتخاب کرده و قیمت محاسبه شود.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-glass"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          upgrades: {
                            ram: [
                              { name: '۱۶ گیگابایت DDR4 (پیش‌فرض)', price: 0 },
                              { name: '۳۲ گیگابایت DDR4 فوق‌سریع', price: 1600000 },
                              { name: '۶۴ گیگابایت DDR4 مهندسی', price: 3800000 }
                            ],
                            storage: [
                              { name: '۵۱۲ گیگابایت NVMe SSD', price: 0 },
                              { name: '۱ ترابایت Gen4 NVMe SSD', price: 1800000 },
                              { name: '۲ ترابایت Gen4 NVMe SSD سامسونگ', price: 3800000 }
                            ],
                            display: [
                              { name: 'نمایشگر استاندارد مات ضد انعکاس', price: 0 }
                            ]
                          }
                        }));
                      }}
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      <RefreshCw size={13} style={{ marginLeft: '4px' }} /> تنظیم گزینه‌های پیشنهادی استاندارد
                    </button>
                  </div>

                  {/* RAM Upgrades */}
                  <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'hsl(var(--accent-cyan))' }}>
                        گزینه‌های ارتقای حافظه رم (RAM)
                      </span>
                      <button
                        type="button"
                        className="btn btn-glass"
                        onClick={() => {
                          const list = [...(formData.upgrades?.ram || [])];
                          list.push({ name: '۳۲ گیگابایت جدید', price: 1500000 });
                          setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, ram: list } }));
                        }}
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      >
                        <Plus size={13} /> افزودن گزینه
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(formData.upgrades?.ram || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => {
                              const list = [...formData.upgrades.ram];
                              list[i].name = e.target.value;
                              setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, ram: list } }));
                            }}
                            placeholder="عنوان گزینه ارتقا"
                            style={{ flexGrow: 1, fontSize: '0.8rem' }}
                          />
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => {
                              const list = [...formData.upgrades.ram];
                              list[i].price = Number(e.target.value);
                              setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, ram: list } }));
                            }}
                            placeholder="تومان"
                            style={{ width: '130px', fontSize: '0.8rem', direction: 'ltr' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = formData.upgrades.ram.filter((_, idx) => idx !== i);
                              setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, ram: list } }));
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-red))' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Storage Upgrades */}
                  <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'hsl(var(--accent-purple))' }}>
                        گزینه‌های ارتقای حافظه اس‌اس‌دی (Storage / SSD)
                      </span>
                      <button
                        type="button"
                        className="btn btn-glass"
                        onClick={() => {
                          const list = [...(formData.upgrades?.storage || [])];
                          list.push({ name: '۱ ترابایت Gen4 SSD', price: 1800000 });
                          setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, storage: list } }));
                        }}
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      >
                        <Plus size={13} /> افزودن گزینه
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(formData.upgrades?.storage || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => {
                              const list = [...formData.upgrades.storage];
                              list[i].name = e.target.value;
                              setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, storage: list } }));
                            }}
                            placeholder="عنوان گزینه هارد"
                            style={{ flexGrow: 1, fontSize: '0.8rem' }}
                          />
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => {
                              const list = [...formData.upgrades.storage];
                              list[i].price = Number(e.target.value);
                              setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, storage: list } }));
                            }}
                            placeholder="تومان"
                            style={{ width: '130px', fontSize: '0.8rem', direction: 'ltr' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = formData.upgrades.storage.filter((_, idx) => idx !== i);
                              setFormData(prev => ({ ...prev, upgrades: { ...prev.upgrades, storage: list } }));
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-red))' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 5: APPLE FLAGSHIP SHOWCASE STUDIO ──────────────── */}
              {activeTab === 'flagship' && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="hsl(var(--accent-cyan))" />
                        استودیو پیکربندی کاوش تعاملی پرچمدار (Flagship Showcase Builder)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        فعال‌سازی کاوش تعاملی اسکرول‌محور با استانداردهای مهندسی و ارائه پرچمدار
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const generated = generateFlagshipFromSpecs(formData.name, formData.specs, formData.chassis);
                        setFormData(prev => ({ ...prev, flagshipShowcase: generated }));
                        setParseNotice('⚡ سناریوی چهار مرحله‌ای کاوش سخت‌افزار بر اساس مشخصات این لپ‌تاپ تولید شد!');
                        setTimeout(() => setParseNotice(''), 4000);
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.78rem',
                        background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))'
                      }}
                    >
                      <Sparkles size={13} style={{ marginLeft: '4px' }} /> تولید خودکار سناریو از مشخصات فنی
                    </button>
                  </div>

                  {/* 3D Model Configuration (GLB / GLTF) */}
                  <div className="glass-panel" style={{ padding: '16px 18px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--accent-cyan))' }}>
                          <Rotate3d size={16} /> نمایشگر سه‌بعدی تعاملی ۳۶۰ درجه (3D Model Viewer)
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          امکان چرخش ۳۶۰ درجه، زوم سه‌بعدی و نمایش تعاملی محصول با موتور WebGL / Three.js
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn btn-glass"
                          onClick={() => setFormData(prev => ({ ...prev, model3d_url: '/models/laptop-flagship.glb' }))}
                          style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <RefreshCw size={13} /> استفاده از مدل پیش‌فرض
                        </button>
                      </div>
                    </div>

                    {/* Apple-style Toggle for 3D Viewer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: formData.enable_3d_viewer !== false ? 'rgba(56, 189, 248, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      border: formData.enable_3d_viewer !== false ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid var(--border-glass)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: formData.enable_3d_viewer !== false ? 'hsl(var(--accent-green))' : 'var(--text-muted)',
                          boxShadow: formData.enable_3d_viewer !== false ? '0 0 8px hsl(var(--accent-green))' : 'none'
                        }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {formData.enable_3d_viewer !== false ? 'نمایشگر ۳D برای این محصول فعال است' : 'نمایشگر ۳D غیرفعال است (کاوش تعاملی پرچمدار نمایش داده می‌شود)'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                            با خاموش کردن این گزینه، دکمه و موتور سه‌بعدی برای این لپ‌تاپ بارگذاری نخواهد شد.
                          </div>
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                        <input 
                          type="checkbox"
                          checked={formData.enable_3d_viewer !== false}
                          onChange={e => setFormData(prev => ({ ...prev, enable_3d_viewer: e.target.checked }))}
                          style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--accent-cyan))' }}
                        />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {formData.enable_3d_viewer !== false ? 'فعال' : 'غیرفعال'}
                        </span>
                      </label>
                    </div>

                    <div style={{ opacity: formData.enable_3d_viewer !== false ? 1 : 0.6, pointerEvents: formData.enable_3d_viewer !== false ? 'auto' : 'none', transition: 'all 0.2s ease' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                        آدرس فایل سه‌بعدی (.glb / .gltf):
                      </label>
                      <input 
                        type="text"
                        className="font-code"
                        value={formData.model3d_url || ''}
                        onChange={e => setFormData(prev => ({ ...prev, model3d_url: e.target.value }))}
                        placeholder="مثال: /models/laptop-flagship.glb یا https://..."
                        style={{ direction: 'ltr', fontSize: '0.8rem', padding: '10px 14px', borderRadius: '10px', width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Toggle Enable/Disable */}
                  <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        وضعیت کاوش تعاملی پرچمدار برای این دستگاه
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        اگر فعال باشد، ماژول اسکرول تعاملی، چرخش پرسپکتیو و مشخصات فنی در صفحه محصول رندر می‌شود.
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                      <input 
                        type="checkbox"
                        checked={formData.flagshipShowcase?.enabled !== false}
                        onChange={e => {
                          const isEn = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            flagshipShowcase: prev.flagshipShowcase 
                              ? { ...prev.flagshipShowcase, enabled: isEn }
                              : generateFlagshipFromSpecs(prev.name, prev.specs, prev.chassis)
                          }));
                        }}
                        style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--accent-cyan))' }}
                      />
                      <span>فعال باشد</span>
                    </label>
                  </div>

                  {/* 4 Apple Stages Summary */}
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    {[
                      { step: 1, title: 'مرحله ۱: شاسی و متریال تیتانیوم/منیزیم', tag: 'متریال هوافضا', color: 'hsl(var(--accent-cyan))' },
                      { step: 2, title: 'مرحله ۲: نمایشگر کالیبره و دقت رنگ', tag: 'دقت رنگ ۱۰۰٪', color: 'hsl(var(--accent-purple))' },
                      { step: 3, title: 'مرحله ۳: معماری سیلیکون و محفظه بخار', tag: 'خنک‌کننده اتاق بخار', color: 'hsl(var(--accent-green))' },
                      { step: 4, title: 'مرحله ۴: کیبورد ارگونومیک و تاندربولت ۴', tag: 'پورت‌های نسل جدید', color: '#ea580c' }
                    ].map(st => (
                      <div key={st.step} className="glass-panel" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: `3px solid ${st.color}` }}>
                        <div style={{ fontSize: '0.72rem', color: st.color, fontWeight: 700, marginBottom: '4px' }}>
                          بخش {st.step} • {st.tag}
                        </div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700 }}>
                          {st.title}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '10px' }}>
                    💡 <strong>نکته طراحی:</strong> برای مشاهده و بررسی رفتار حرکتی این ماژول، تب پیش‌نمایش در سمت راست را بر روی <strong>«کاوش تعاملی پرچمدار»</strong> قرار دهید.
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 6: EXPERT REVIEW STUDIO ──────────────── */}
              {activeTab === 'review' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  {/* Formatting Toolbar */}
                  <div 
                    className="flex" 
                    style={{ 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '8px 20px', 
                      borderBottom: '1px solid var(--border-glass)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      flexWrap: 'wrap',
                      flexShrink: 0
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))'
                      }}
                      onClick={() => setIsPhotoModalOpen(true)}
                    >
                      <Image size={15} /> افزودن تصویر بین متن
                    </button>

                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#ec4899' }}
                      onClick={() => setIsVideoModalOpen(true)}
                    >
                      <Video size={15} /> افزودن ویدیو (آپارات / یوتیوب)
                    </button>

                    <span style={{ height: '20px', width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />

                    <button type="button" className="btn btn-glass" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => insertAtCursor('\n## ', '\n', 'سرتیتر بخش نقد')}>
                      <Heading2 size={15} /> H2
                    </button>
                    <button type="button" className="btn btn-glass" style={{ padding: '6px 10px' }} onClick={() => insertAtCursor('**', '**', 'متن درشت')}>
                      <Bold size={15} />
                    </button>
                    <button type="button" className="btn btn-glass" style={{ padding: '6px 10px' }} onClick={() => insertAtCursor('\n- ', '\n', 'ویژگی سخت‌افزاری')}>
                      <List size={15} />
                    </button>
                    <button type="button" className="btn btn-glass" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => insertAtCursor('\n| تست بنچمارک | امتیاز |\n| :--- | :--- |\n| Cinebench R23 | 24,500 |\n\n')}>
                      <Table size={15} /> جدول
                    </button>
                  </div>

                  {/* Review Textarea */}
                  <div style={{ flexGrow: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px', fontWeight: 600 }}>
                      متن کامل نقد، تحلیل مهندسی و بنچمارک‌ها (پشتیبانی از Markdown)
                    </label>
                    <textarea
                      ref={reviewTextareaRef}
                      value={formData.expertReview.intro}
                      onChange={e => setFormData({ ...formData, expertReview: { ...formData.expertReview, intro: e.target.value } })}
                      placeholder="متن نقد و بررسی فنی، تجربیات تست در لابراتوار تک‌تینک و نقاط قوت و ضعف..."
                      style={{ width: '100%', flexGrow: 1, minHeight: '220px', resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.7 }}
                    />
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '0 16px 16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px', color: 'hsl(var(--accent-green))', fontWeight: 700 }}>
                        نقاط قوت دستگاه (هر خط یک مورد)
                      </label>
                      <textarea
                        value={formData.expertReview.pros}
                        onChange={e => setFormData({ ...formData, expertReview: { ...formData.expertReview, pros: e.target.value } })}
                        rows={3}
                        placeholder="پردازنده پرقدرت&#10;شاسی مستحکم تیتانیوم&#10;باتری با سلامت بالا"
                        style={{ width: '100%', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px', color: 'hsl(var(--accent-red))', fontWeight: 700 }}>
                        نقاط ضعف دستگاه (هر خط یک مورد)
                      </label>
                      <textarea
                        value={formData.expertReview.cons}
                        onChange={e => setFormData({ ...formData, expertReview: { ...formData.expertReview, cons: e.target.value } })}
                        rows={3}
                        placeholder="وزن نسبتاً بالا&#10;گرمای شاسی زیر رندرهای سنگین"
                        style={{ width: '100%', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* RIGHT: Live Preview Pane */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div 
              style={{ 
                flex: viewMode === 'split' ? '1 1 50%' : '1 1 100%', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'rgba(255, 255, 255, 0.01)'
              }}
            >
              {/* Preview Subtabs */}
              <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', fontSize: '0.75rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'card', label: 'کارت کالا و مشخصات' },
                    { id: 'flagship', label: 'کاوش تعاملی پرچمدار' },
                    { id: 'review', label: 'نقد و بررسی زنده' }
                  ].map(pt => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setPreviewSubTab(pt.id)}
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        borderRadius: '6px',
                        background: previewSubTab === pt.id ? 'hsl(var(--accent-cyan))' : 'transparent',
                        color: previewSubTab === pt.id ? '#fff' : 'var(--text-secondary)',
                        border: 'none'
                      }}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>

                <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', fontSize: '0.68rem' }}>
                  Live Preview
                </span>
              </div>

              {/* Preview Content Area */}
              <div style={{ padding: '20px 24px', maxWidth: '820px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* 1. Card & Hardware Overview */}
                {previewSubTab === 'card' && (
                  <div className="animate-fade-in">
                    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {formData.image && (
                        <img 
                          src={formData.image} 
                          alt={formData.name} 
                          style={{ width: '140px', height: '100px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--border-glass)' }} 
                        />
                      )}
                      <div style={{ flexGrow: 1 }}>
                        <div className="flex" style={{ gap: '8px', marginBottom: '6px' }}>
                          <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#fff', fontSize: '0.7rem' }}>
                            {formData.category}
                          </span>
                          {formData.badge && (
                            <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.2)', color: 'hsl(var(--accent-purple))', fontSize: '0.7rem' }}>
                              {formData.badge}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0' }}>
                          {formData.name || 'نام لپ‌تاپ'}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {formData.brand} • {formData.grade}
                        </div>
                        <div className="gradient-text font-code" style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '6px' }}>
                          {formatPrice(formData.basePrice)}
                        </div>
                      </div>
                    </div>

                    {/* Hardware Badges */}
                    <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', fontSize: '0.75rem' }}>
                      <div><span style={{ color: 'var(--text-secondary)' }}>پردازنده:</span> <strong>{formData.specs.cpu || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>گرافیک:</span> <strong>{formData.specs.gpu || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>رم:</span> <strong>{formData.specs.ram || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>حافظه:</span> <strong>{formData.specs.storage || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>نمایشگر:</span> <strong>{formData.specs.display || '-'}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>شاسی:</span> <strong>{formData.chassis || '-'}</strong></div>
                    </div>
                  </div>
                )}

                {/* 2. Flagship Live Preview */}
                {previewSubTab === 'flagship' && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <AppleFlagshipShowcase 
                      product={previewProduct} 
                      onSelectProduct={() => {}} 
                      onAddToCart={() => {}} 
                    />
                  </div>
                )}

                {/* 3. Review Markdown Live Preview */}
                {previewSubTab === 'review' && (
                  <div className="animate-fade-in glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                    <div 
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdownToHtml(formData.expertReview.intro || 'هنوز متنی برای نقد وارد نشده است...') 
                      }} 
                    />
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

      </div>

      {/* Photo Inserter Dialog */}
      {isPhotoModalOpen && (
        <div className="modal-backdrop-wrapper" style={{ zIndex: 130 }} onClick={() => setIsPhotoModalOpen(false)}>
          <div className="glass-panel modal-card" style={{ maxWidth: '540px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>افزودن تصویر به متن نقد</h3>
              <button type="button" className="btn btn-glass" style={{ padding: '6px', borderRadius: '50%' }} onClick={() => setIsPhotoModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="آدرس تصویر (URL)" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} style={{ direction: 'ltr' }} />
              <input type="text" placeholder="عنوان زیر تصویر" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} />
              <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
                {TECH_PHOTO_PRESETS.map((p, i) => (
                  <button key={i} type="button" className="btn btn-glass" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => { setPhotoUrl(p.url); setPhotoCaption(p.label); }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-glass" onClick={() => setIsPhotoModalOpen(false)}>انصراف</button>
                <button type="button" className="btn btn-primary" onClick={handleInsertPhoto} disabled={!photoUrl.trim()}>درج در متن</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Inserter Dialog */}
      {isVideoModalOpen && (
        <div className="modal-backdrop-wrapper" style={{ zIndex: 130 }} onClick={() => setIsVideoModalOpen(false)}>
          <div className="glass-panel modal-card" style={{ maxWidth: '540px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>درج ویدیو از آپارات یا یوتیوب</h3>
              <button type="button" className="btn btn-glass" style={{ padding: '6px', borderRadius: '50%' }} onClick={() => setIsVideoModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="https://www.aparat.com/v/..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={{ direction: 'ltr' }} />
              <input type="text" placeholder="عنوان یا توضیح ویدیو" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
              <div className="flex" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-glass" onClick={() => setIsVideoModalOpen(false)}>انصراف</button>
                <button type="button" className="btn btn-primary" onClick={handleInsertVideo} disabled={!videoUrl.trim()}>درج ویدیو</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
