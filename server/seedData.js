export const LAPTOPS = [
  {
    id: "tink-blade-16",
    name: "تک‌تینک بلید ۱۶ الترا",
    tagline: "اوج عملکرد گیمینگ و هوش مصنوعی قابل حمل",
    category: "گیمینگ",
    series: "سری بلید",
    badge: "پرچمدار",
    rating: 4.9,
    reviewsCount: 142,
    basePrice: 2899,
    inStock: true,
    stockCount: 12,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80",
    shortSpecs: {
      cpu: "Intel Core i9-14900HX",
      gpu: "NVIDIA RTX 4090 16GB",
      ram: "32GB",
      storage: "2TB SSD",
      display: '16" Mini-LED 240Hz',
      chassis: "Magnesium Alloy"
    },
    specs: {
      shortSpecs: {
        cpu: "Intel Core i9-14900HX",
        gpu: "NVIDIA RTX 4090 16GB",
        ram: "32GB",
        storage: "2TB SSD",
        display: '16" Mini-LED 240Hz',
        chassis: "Magnesium Alloy"
      },
      cpu: "Intel Core i9-14900HX (24C / 32T, up to 5.8GHz)",
      gpu: "NVIDIA GeForce RTX 4090 16GB GDDR6 (175W TGP)",
      ram: "32GB DDR5-5600MHz (Dual Channel)",
      storage: "2TB PCIe 4.0 NVMe M.2 SSD",
      display: '16" Mini-LED Dual-Mode (4K 120Hz / FHD+ 240Hz, 1100 nits)',
      chassis: "Magnesium-Aluminum Alloy CNC Unibody",
      battery: "99.9Wh (Up to 9 Hours Battery Life)",
      weight: "2.45 kg",
      os: "Windows 11 Pro",
      ports: "2x Thunderbolt 4, 3x USB 3.2 Gen 2, HDMI 2.1, 2.5G LAN, SD Reader",
      npuScore: "45 TOPS NPU AI Accelerator"
    },
    upgrades: {
      ram: [
        { name: "۳۲ گیگابایت (۲×۱۶) DDR5", price: 0 },
        { name: "۶۴ گیگابایت (۲×۳۲) DDR5", price: 180 },
        { name: "۹۶ گیگابایت (۲×۴۸) DDR5 فوق‌سریع", price: 380 }
      ],
      storage: [
        { name: "۲ ترابایت PCIe 4.0 NVMe M.2", price: 0 },
        { name: "۴ ترابایت (۲×۲ ترابایت RAID 0) NVMe", price: 240 },
        { name: "۸ ترابایت درایو دوگانه سرور NVMe", price: 590 }
      ],
      display: [
        { name: '۱۶ اینچ Mini-LED 4K/FHD+ دوگانه', price: 0 },
        { name: '۱۶ اینچ OLED 240Hz 0.2ms کالیبره', price: 150 }
      ]
    },
    highlights: [
      "سیستم خنک‌کننده محفظه بخار با فلز مایع",
      "کیبورد مکانیکی RGB با سوییچ‌های Cherry MX",
      "بدنه یکپارچه منیزیم-آلومینیوم CNC",
      "آماده برای Wi-Fi 7 و بلوتوث ۵.۴"
    ]
  },
  {
    id: "tink-book-pro-14",
    name: "تک‌بوک پرو ۱۴ استودیو",
    tagline: "قدرت بی‌چون‌وچرا برای تولیدکنندگان محتوا و برنامه‌نویسان",
    category: "تولید محتوا",
    series: "سری استودیو",
    badge: "پرفروش‌ترین",
    rating: 4.85,
    reviewsCount: 208,
    basePrice: 1999,
    inStock: true,
    stockCount: 25,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
    shortSpecs: {
      cpu: "AMD Ryzen 9 8945HS",
      gpu: "NVIDIA RTX 4070 8GB",
      ram: "32GB",
      storage: "1TB SSD",
      display: '14.5" 3.2K OLED 120Hz',
      chassis: "All-Aluminum"
    },
    specs: {
      shortSpecs: {
        cpu: "AMD Ryzen 9 8945HS",
        gpu: "NVIDIA RTX 4070 8GB",
        ram: "32GB",
        storage: "1TB SSD",
        display: '14.5" 3.2K OLED 120Hz',
        chassis: "All-Aluminum"
      },
      cpu: "AMD Ryzen 9 8945HS (8C / 16T, up to 5.2GHz with Ryzen AI)",
      gpu: "NVIDIA GeForce RTX 4070 8GB GDDR6 (115W TGP)",
      ram: "32GB LPDDR5X-7500MHz High-Speed",
      storage: "1TB PCIe 4.0 NVMe M.2 SSD",
      display: '14.5" 3.2K 120Hz OLED (100% DCI-P3, HDR 600)',
      chassis: "All-Aluminum CNC Machined Unibody",
      battery: "84Wh (Up to 14 Hours Battery Life)",
      weight: "1.52 kg",
      os: "Windows 11 Pro / Ubuntu Ready",
      ports: "1x USB4 40Gbps, 1x USB-C 3.2, 2x USB-A 3.2, HDMI 2.1",
      npuScore: "38 TOPS Neural AI Engine"
    },
    upgrades: {
      ram: [
        { name: "۳۲ گیگابایت LPDDR5X-7500", price: 0 },
        { name: "۶۴ گیگابایت LPDDR5X-7500", price: 210 }
      ],
      storage: [
        { name: "۱ ترابایت Gen4 NVMe M.2", price: 0 },
        { name: "۲ ترابایت Gen4 NVMe M.2", price: 120 },
        { name: "۴ ترابایت پرسرعت Gen4 NVMe", price: 310 }
      ],
      display: [
        { name: '۱۴.۵ اینچ 3.2K 120Hz OLED لمسی', price: 0 },
        { name: '۱۴.۵ اینچ 3.2K مات ضد تابش (غیرلمسی)', price: 50 }
      ]
    },
    highlights: [
      "کالیبراسیون رنگ کارخانه با Delta E < 1.0",
      "تاچ‌پد شیشه‌ای هپتیک با کنترل ژست‌های حرکتی",
      "چهار اسپیکر استودیویی با فناوری دالبی اتموس",
      "وب‌کم 1080p IR همراه با شاتر سخت‌افزاری"
    ]
  },
  {
    id: "aeroslim-x13",
    name: "ایرو‌اسلیم X13 فدر",
    tagline: "فوق‌سبک (زیر ۱ کیلوگرم) با ۱۸ ساعت دوام باتری",
    category: "فوق سبک",
    series: "سری ایرو",
    badge: "بسیار سبک",
    rating: 4.78,
    reviewsCount: 95,
    basePrice: 1399,
    inStock: true,
    stockCount: 18,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80",
    shortSpecs: {
      cpu: "Intel Core Ultra 7 155H",
      gpu: "Intel Arc Graphics",
      ram: "16GB",
      storage: "1TB SSD",
      display: '13.3" 2.8K OLED 90Hz',
      chassis: "Carbon Fiber"
    },
    specs: {
      shortSpecs: {
        cpu: "Intel Core Ultra 7 155H",
        gpu: "Intel Arc Graphics",
        ram: "16GB",
        storage: "1TB SSD",
        display: '13.3" 2.8K OLED 90Hz',
        chassis: "Carbon Fiber"
      },
      cpu: "Intel Core Ultra 7 155H (16C / 22T, Intel AI Boost)",
      gpu: "Intel Arc Graphics (8 Xe-Cores, 2.25GHz)",
      ram: "16GB LPDDR5X-7467MHz Dual Channel",
      storage: "1TB PCIe 4.0 NVMe M.2 SSD",
      display: '13.3" 2.8K 90Hz OLED (100% DCI-P3, 600 nits)',
      chassis: "Ultra-Light Carbon Fiber & Magnesium Alloy",
      battery: "75Wh (Up to 18.5 Hours Battery Life)",
      weight: "0.98 kg",
      os: "Windows 11 Home",
      ports: "2x Thunderbolt 4, 1x USB-A 3.2, 3.5mm Audio Jack",
      npuScore: "34 TOPS Intel AI Boost NPU"
    },
    upgrades: {
      ram: [
        { name: "۱۶ گیگابایت LPDDR5X", price: 0 },
        { name: "۳۲ گیگابایت LPDDR5X", price: 140 }
      ],
      storage: [
        { name: "۱ ترابایت NVMe M.2", price: 0 },
        { name: "۲ ترابایت NVMe M.2", price: 110 }
      ],
      display: [
        { name: '۱۳.۳ اینچ 2.8K OLED', price: 0 }
      ]
    },
    highlights: [
      "بدنه کامپوزیت فیبر کربن و آلیاژ منیزیم",
      "شارژ سریع: ۰ تا ۶۰ درصد در ۳۵ دقیقه با 65W PD",
      "سیستم خنک‌کننده فعال و بی‌صدای دو فن",
      "نمایشگر بدون حاشیه با نسبت تصویر به بدنه ۹۲٪"
    ]
  },
  {
    id: "neuralcraft-18",
    name: "نیورال‌کرفت ورک‌استیشن ۱۸",
    tagline: "جایگزین دسکتاپ برای توسعه هوش مصنوعی و CAD",
    category: "ایستگاه کاری",
    series: "سری تایتان",
    badge: "هیولای پردازشی",
    rating: 4.95,
    reviewsCount: 64,
    basePrice: 3499,
    inStock: true,
    stockCount: 7,
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80",
    shortSpecs: {
      cpu: "Intel Core i9-14950HX",
      gpu: "NVIDIA RTX 5000 16GB",
      ram: "64GB",
      storage: "4TB SSD",
      display: '18" 4K 144Hz Mini-LED',
      chassis: "All-Aluminum"
    },
    specs: {
      shortSpecs: {
        cpu: "Intel Core i9-14950HX",
        gpu: "NVIDIA RTX 5000 16GB",
        ram: "64GB",
        storage: "4TB SSD",
        display: '18" 4K 144Hz Mini-LED',
        chassis: "All-Aluminum"
      },
      cpu: "Intel Core i9-14950HX (24C / 32T, up to 6.0GHz)",
      gpu: "NVIDIA RTX 5000 Ada Generation 16GB ECC GDDR6",
      ram: "64GB DDR5-5600MHz ECC Workstation Memory",
      storage: "4TB (2x 2TB RAID 0) PCIe 4.0 NVMe SSD",
      display: '18" 4K UHD+ 144Hz Mini-LED (HDR 1000, 100% DCI-P3)',
      chassis: "All-Aluminum CNC Machined with Titanium Accents",
      battery: "99.9Wh + 330W GaN Fast Charger",
      weight: "3.10 kg",
      os: "Windows 11 Pro for Workstations / Ubuntu 24.04",
      ports: "2x Thunderbolt 4, 4x USB-A 3.2, 2.5G LAN, HDMI 2.1",
      npuScore: "68 TOPS Dual Tensor AI Workstation Engine"
    },
    upgrades: {
      ram: [
        { name: "۶۴ گیگابایت ECC DDR5", price: 0 },
        { name: "۱۲۸ گیگابایت ECC DDR5", price: 450 }
      ],
      storage: [
        { name: "۴ ترابایت RAID 0 NVMe", price: 0 },
        { name: "۸ ترابایت آرایه چهارگانه NVMe", price: 520 }
      ],
      display: [
        { name: '۱۸ اینچ 4K 144Hz Mini-LED HDR 1000', price: 0 }
      ]
    },
    highlights: [
      "دارای گواهینامه ISV برای AutoCAD, Maya, Blender, PyTorch",
      "سیستم خنک‌کننده سه فن با لوله‌های انتقال حرارت",
      "پنل LED ماتریکس پویای قابل شخصی‌سازی",
      "محافظت و تصحیح خطای حافظه (ECC)"
    ]
  },
  {
    id: "tink-blade-14",
    name: "تک‌تینک بلید ۱۴ اپکس",
    tagline: "غول پردازشی و گیمینگ ۱۴ اینچی فشرده",
    category: "گیمینگ",
    series: "سری بلید",
    badge: "محبوب",
    rating: 4.82,
    reviewsCount: 112,
    basePrice: 2199,
    inStock: true,
    stockCount: 15,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80",
    shortSpecs: {
      cpu: "AMD Ryzen 9 8945HS",
      gpu: "NVIDIA RTX 4080 12GB",
      ram: "32GB",
      storage: "1TB SSD",
      display: '14" QHD+ 240Hz',
      chassis: "All-Aluminum"
    },
    specs: {
      shortSpecs: {
        cpu: "AMD Ryzen 9 8945HS",
        gpu: "NVIDIA RTX 4080 12GB",
        ram: "32GB",
        storage: "1TB SSD",
        display: '14" QHD+ 240Hz',
        chassis: "All-Aluminum"
      },
      cpu: "AMD Ryzen 9 8945HS (8C / 16T, up to 5.2GHz)",
      gpu: "NVIDIA GeForce RTX 4080 12GB GDDR6 (140W TGP)",
      ram: "32GB DDR5-5600MHz (Dual Channel)",
      storage: "1TB PCIe 4.0 NVMe M.2 SSD",
      display: '14" QHD+ 240Hz 3ms IPS (100% DCI-P3, G-Sync)',
      chassis: "All-Aluminum CNC Machined Anodized Black",
      battery: "76Wh (Up to 10 Hours Battery Life)",
      weight: "1.78 kg",
      os: "Windows 11 Home",
      ports: "2x USB4 40Gbps, 2x USB-A 3.2, HDMI 2.1",
      npuScore: "39 TOPS Ryzen AI Engine"
    },
    upgrades: {
      ram: [
        { name: "۳۲ گیگابایت DDR5", price: 0 },
        { name: "۶۴ گیگابایت DDR5", price: 190 }
      ],
      storage: [
        { name: "۱ ترابایت NVMe M.2", price: 0 },
        { name: "۲ ترابایت NVMe M.2", price: 130 }
      ],
      display: [
        { name: '۱۴ اینچ QHD+ 240Hz 3ms G-Sync', price: 0 }
      ]
    },
    highlights: [
      "بدنه آلومینیومی ماشین‌کاری شده با رنگ مشکی آنودایز",
      "مدیریت حرارتی با محفظه بخار",
      "صدای فراگیر تنظیم شده توسط THX",
      "دوربین IR ویندوز هلو برای تشخیص چهره"
    ]
  },
  {
    id: "tink-student-15",
    name: "تک‌تینک ایر ۱۵ اقتصادی",
    tagline: "لپ‌تاپی مقرون‌به‌صرفه، مطمئن و بی‌صدا برای کارهای روزمره و دانشجویان",
    category: "اقتصادی",
    series: "سری ایر",
    badge: "ارزش خرید بالا",
    rating: 4.65,
    reviewsCount: 310,
    basePrice: 799,
    inStock: true,
    stockCount: 40,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80",
    shortSpecs: {
      cpu: "Intel Core Ultra 5 125H",
      gpu: "Intel Arc Graphics",
      ram: "16GB",
      storage: "512GB SSD",
      display: '15.6" FHD IPS',
      chassis: "Polycarbonate"
    },
    specs: {
      shortSpecs: {
        cpu: "Intel Core Ultra 5 125H",
        gpu: "Intel Arc Graphics",
        ram: "16GB",
        storage: "512GB SSD",
        display: '15.6" FHD IPS',
        chassis: "Polycarbonate"
      },
      cpu: "Intel Core Ultra 5 125H (14C / 18T, up to 4.5GHz)",
      gpu: "Intel Arc Integrated Graphics (7 Xe-Cores)",
      ram: "16GB LPDDR5-6400MHz",
      storage: "512GB PCIe NVMe M.2 SSD",
      display: '15.6" FHD (1920x1080) IPS Anti-Glare 300 nits',
      chassis: "Reinforced Polycarbonate & Recycled Aluminum Frame",
      battery: "65Wh (Up to 12 Hours Battery Life)",
      weight: "1.65 kg",
      os: "Windows 11 Home",
      ports: "1x Thunderbolt 4 / USB-C, 2x USB-A 3.2, HDMI 1.4, SD Reader",
      npuScore: "28 TOPS Intel AI NPU"
    },
    upgrades: {
      ram: [
        { name: "۱۶ گیگابایت LPDDR5", price: 0 },
        { name: "۳۲ گیگابایت LPDDR5", price: 90 }
      ],
      storage: [
        { name: "۵۱۲ گیگابایت NVMe SSD", price: 0 },
        { name: "۱ ترابایت NVMe SSD", price: 70 }
      ],
      display: [
        { name: '۱۵.۶ اینچ FHD IPS ضد انعکاس', price: 0 }
      ]
    },
    highlights: [
      "عملکرد کاملاً بی‌صدا و بدون فن (0dB)",
      "بدنه ساخته شده از پلاستیک اقیانوسی و آلومینیوم بازیافتی",
      "کیبورد ارگونومیک مقاوم در برابر نشت مایعات",
      "آداپتور تایپ‌سی ۶۵ وات با قابلیت شارژ سریع"
    ]
  }
];

export const BLOG_POSTS = [
  {
    id: "buying-guide-2026",
    title: "راهنمای جامع خرید لپ‌تاپ در سال ۲۰۲۶: رقابت هوش مصنوعی و کارت گرافیک",
    excerpt: "رمزگشایی از سخت‌افزارهای هوش مصنوعی. آیا واقعاً برای اجرای مدل‌های زبانی محلی به موتور NPU قدرتمند نیاز دارید یا گرافیک مجزا بهتر است؟",
    category: "راهنمای خرید",
    author: "النا رستووا",
    authorRole: "تحلیلگر ارشد سخت‌افزار",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    date: "۱۲ مهر ۱۴۰۵",
    readTime: "زمان مطالعه: ۷ دقیقه",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    content: `
# راهنمای جامع خرید لپ‌تاپ در سال ۲۰۲۶: رقابت هوش مصنوعی و کارت گرافیک

با تبدیل شدن پردازنده‌های موبایل به موتورهای پردازش عصبی، خرید لپ‌تاپ در سال ۲۰۲۶ بسیار متفاوت از دو سال پیش است. با تاکید تولیدکنندگان بر روی **قدرت NPU (واحد پردازش عصبی)**، خریداران معمولا می‌پرسند: *چه چیزی واقعاً برای کار من اهمیت دارد؟*

## ۱. NPU چیست و چه تفاوتی با کارت گرافیک مجزا دارد؟

NPU یک بلوک سیلیکونی تخصصی در پردازنده شما است که فقط برای اجرای مدل‌های یادگیری ماشین با توان مصرفی پایین طراحی شده است (مثل ردیابی چشم، تار کردن پس‌زمینه در تماس‌ها، ایزوله کردن صدا، پردازش آفلاین متن به گفتار و وظایف سبک هوش مصنوعی تولیدی).

- **بازدهی NPU**: مصرف انرژی بین **۵ تا ۱۵ وات** دارد. برای حفظ شارژ باتری در زمان اجرای امکانات هوش مصنوعی ویندوز بسیار ایده‌آل است.
- **قدرت کارت گرافیک (GPU)**: هیولاهای پرمصرف با هسته‌های CUDA و Tensor که توانی بین **۸۵ تا ۱۷۵ وات** دارند. برای رندر سه‌بعدی سنگین، اجرای مدل‌های بزرگ زبانی (بالای ۷ میلیارد پارامتر) و بازی‌های سنگین با رزولوشن 4K ضروری است.

## ۲. بررسی بنچمارک‌ها: به چقدر قدرت (TOPS) نیاز دارید؟

| سطح کاربری | قدرت مورد نیاز NPU | بهترین لپ‌تاپ تک‌تینک |
| :--- | :--- | :--- |
| **کاربردهای روزمره و تجاری** | ۳۰ تا ۴۵ ترافلاپس | ایرو اسلیم X13 / تک‌تینک ایر ۱۵ |
| **برنامه‌نویسی و استودیو خلاق** | ۴۵ تا ۶۰ ترافلاپس | تک‌بوک پرو ۱۴ استودیو |
| **توسعه هوش مصنوعی و گیمینگ** | بالای ۶۰ + ۱۶ گیگ حافظه ویدیویی | تک‌تینک بلید ۱۶ / نیورال‌کرفت ۱۸ |

## نتیجه‌گیری
اگر عمر باتری و وزن کم برایتان مهم است، به دنبال دستگاهی با حافظه **LPDDR5X** و پردازنده‌های سری **Intel Ultra یا AMD Ryzen AI** باشید. اما اگر به قدرت خام نیاز دارید، هیچ‌چیز جایگزین **تک‌تینک بلید ۱۶** با خنک‌کننده فلز مایع نخواهد شد!
    `
  },
  {
    id: "vapor-chamber-thermal-tech",
    title: "نگاهی به تکنولوژی خنک‌کننده تک‌تینک: چرا محفظه بخار بهتر از لوله‌های حرارتی است؟",
    excerpt: "بررسی عمیق عملکرد فلز مایع و محفظه‌های بخار میکرو که باعث می‌شود لپ‌تاپ‌های نازک با فرکانس ۶.۰ گیگاهرتز کار کنند.",
    category: "اخبار سخت‌افزار",
    author: "مارکوس ونس",
    authorRole: "مهندس ارشد سیستم‌های حرارتی",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    date: "۶ مهر ۱۴۰۵",
    readTime: "زمان مطالعه: ۵ دقیقه",
    image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80",
    content: `
# نگاهی به تکنولوژی خنک‌کننده تک‌تینک: چرا محفظه بخار بهتر از لوله‌های حرارتی است؟

حفظ فرکانس بالا در یک بدنه آلومینیومی ۱۹ میلی‌متری، یک چالش بزرگ مهندسی است. لوله‌های حرارتی مسی سنتی تنها به مساحت کمی برای تماس وابسته‌اند.

## معماری محفظه بخار

لپ‌تاپ **تک‌تینک بلید ۱۶** ما از یک محفظه بخار مهروموم شده در خلاء با پوشش کامل استفاده می‌کند که حاوی آب دیونیزه است. وقتی پردازنده گرم می‌شود:
۱. مایع بلافاصله روی نقاط داغ تبخیر می‌شود.
۲. بخار به آزادی در سراسر محفظه بزرگ حرکت می‌کند.
۳. میکرو-مش‌های مسی، بخار را دوباره به مایع تبدیل کرده و گرما را از طریق پره‌های آلومینیومی ۰.۱ میلی‌متری به بیرون می‌رانند.

> *نتیجه: کاهش دمای هسته تا ۱۵ درجه سانتی‌گراد نسبت به لوله‌های حرارتی استاندارد!*
    `
  },
  {
    id: "oled-vs-miniled-display",
    title: "نمایشگرهای OLED در برابر Mini-LED: کدام پنل برای لپ‌تاپ شما مناسب است؟",
    excerpt: "مقایسه سیاهی مطلق، روشنایی ۱۰۰۰ نیت HDR، محافظت در برابر سوختگی تصویر و دقت رنگ برای طراحان در مقابل گیمرهای حرفه‌ای.",
    category: "بررسی‌ها",
    author: "سارا لین",
    authorRole: "متخصص نمایشگر و گرافیک",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    date: "۲۴ شهریور ۱۴۰۵",
    readTime: "زمان مطالعه: ۶ دقیقه",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    content: `
# نمایشگرهای OLED در برابر Mini-LED: کدام پنل برای لپ‌تاپ شما مناسب است؟

هنگام پیکربندی لپ‌تاپ تک‌تینک خود، انتخاب بین **OLED** و **Mini-LED** تجربه بصری شما را کاملاً تعیین می‌کند.

### مزایای Mini-LED
- **روشنایی خیره‌کننده HDR**: رسیدن به روشنایی حداکثر ۱۲۰۰ نیت. بسیار عالی برای استفاده در فضای باز یا اتاق‌های روشن.
- **بدون خطر سوختگی تصویر (Burn-in)**: پیکسل‌های غیرارگانیک می‌توانند عناصر ثابت رابط کاربری را بدون هیچ‌گونه افت کیفیت تا سال‌ها نمایش دهند.

### مزایای OLED
- **نسبت کنتراست بی‌نهایت**: سیاهی مطلق (صفر نیت) واقعی با روشن شدن مستقل هر پیکسل.
- **زمان پاسخ‌دهی صاعقه‌آسا ۰.۲ میلی‌ثانیه**: حذف کامل تاری حرکت (Motion blur) برای گیمینگ رقابتی سریع.
    `
  }
];

export const FAQS = [
  {
    category: "گارانتی و پوشش خدمات",
    items: [
      {
        q: "گارانتی ۲ ساله استاندارد تک‌تینک شامل چه مواردی می‌شود؟",
        a: "تمامی لپ‌تاپ‌های تک‌تینک دارای گارانتی ۲ ساله بین‌المللی هستند که شامل خرابی قطعات سخت‌افزاری، نقص مادربرد، مشکلات پنل نمایشگر و منابع تغذیه است. هزینه ارسال برای تعمیرات تحت گارانتی بر عهده ما خواهد بود."
      },
      {
        q: "آیا ارتقاء رم و هارد SSD باعث ابطال گارانتی می‌شود؟",
        a: "خیر! تک‌تینک شما را تشویق می‌کند که سیستم خود را ارتقاء دهید. باز کردن قاب زیرین برای نصب حافظه M.2 SSD یا رم SODIMM گارانتی شما را باطل نخواهد کرد، مگر اینکه در حین انجام این کار به قطعات داخلی آسیب فیزیکی وارد شود."
      },
      {
        q: "طرح پوشش حوادث Care+ تک‌تینک چگونه کار می‌کند؟",
        a: "طرح Care+ شامل ریختن مایعات، افتادن از ارتفاع، شکستگی صفحه‌نمایش و نوسانات برق است. شما تا ۲ بار در سال می‌توانید از این سرویس با هزینه اولیه صفر استفاده کنید. تعمیرات در کمتر از ۴۸ ساعت انجام خواهد شد."
      }
    ]
  },
  {
    category: "ارسال و سفارشات",
    items: [
      {
        q: "آماده‌سازی لپ‌تاپ‌های سفارشی‌سازی شده چقدر طول می‌کشد؟",
        a: "لپ‌تاپ‌های با پیکربندی سفارشی (ارتقاء رم، هارد یا گزینه‌های خمیر حرارتی فلز مایع) در اتاق تمیز پیشرفته ما مونتاژ شده و بین ۲۴ تا ۴۸ ساعت تحت تست فشار قرار می‌گیرند و سپس با پست اکسپرس ارسال می‌شوند."
      },
      {
        q: "آیا ارسال بین‌المللی دارید؟",
        a: "بله، ما محصولاتمان را به بیش از ۶۰ کشور از طریق DHL Express و FedEx به همراه پرداخت پیشاپیش هزینه‌های گمرکی ارسال می‌کنیم."
      }
    ]
  },
  {
    category: "درایورها و پشتیبانی فنی",
    items: [
      {
        q: "از کجا می‌توانم آخرین نسخه بایوس و نرم‌افزار مدیریت تک‌تینک را دانلود کنم؟",
        a: "تمام آپدیت‌های رسمی فرم‌ور، برنامه‌های مدیریت نورپردازی RGB و نرم‌افزار پروفایل‌های حرارتی در بخش 'درایورها' (Drivers Hub) سایت ما با انتخاب مدل دستگاهتان در دسترس است."
      },
      {
        q: "فن لپ‌تاپ من حتی در زمان استفاده سبک هم با صدای بلند کار می‌کند. چه کار کنم؟",
        a: "مطمئن شوید نرم‌افزار مدیریت تک‌تینک در حالت 'Eco Mode' یا 'Balanced' تنظیم شده باشد. همچنین می‌توانید از ابزار خودکار Thermal Calibration بایوس برای ریست کردن الگوی فن‌ها استفاده کنید."
      }
    ]
  }
];

export const WARRANTY_DATABASE = {
  "TT-9082-X": {
    serialNumber: "TT-9082-X",
    model: "تک‌تینک بلید ۱۶ الترا",
    purchaseDate: "۱۴۰۴/۰۸/۲۱",
    warrantyExpiry: "۱۴۰۶/۰۸/۲۱",
    status: "فعال (گارانتی ۲ ساله استاندارد)",
    carePlus: true,
    owner: "امیر علی‌اکبری"
  },
  "TT-4112-S": {
    serialNumber: "TT-4112-S",
    model: "تک‌بوک پرو ۱۴ استودیو",
    purchaseDate: "۱۴۰۴/۱۱/۲۱",
    warrantyExpiry: "۱۴۰۶/۱۱/۲۱",
    status: "فعال (سرویس VIP تک‌تینک Care+)",
    carePlus: true,
    owner: "سارا حسینی"
  },
  "TT-1002-A": {
    serialNumber: "TT-1002-A",
    model: "ایرو‌اسلیم X13 فدر",
    purchaseDate: "۱۴۰۲/۱۰/۱۵",
    warrantyExpiry: "۱۴۰۴/۱۰/۱۵",
    status: "منقضی شده (خارج از گارانتی)",
    carePlus: false,
    owner: "علی رضایی"
  }
};

export const DRIVER_DOWNLOADS = [
  {
    modelId: "tink-blade-16",
    modelName: "تک‌تینک بلید ۱۶ الترا",
    files: [
      { name: "Tink Command Center v4.2.1", date: "۱۴۰۵/۰۶/۱۹", size: "۱۴۲ مگابایت", version: "4.2.1", category: "نرم‌افزار" },
      { name: "NVIDIA GeForce Game Ready Driver 560.81", date: "۱۴۰۵/۰۷/۰۶", size: "۶۸۰ مگابایت", version: "560.81", category: "کارت گرافیک" },
      { name: "Intel Chipset & NPU Neural Driver v12.1", date: "۱۴۰۵/۰۵/۲۴", size: "۸۵ مگابایت", version: "12.1.0", category: "چیپست" },
      { name: "System BIOS v2.04 (اصلاح محفظه بخار)", date: "۱۴۰۵/۰۶/۱۰", size: "۱۶ مگابایت", version: "2.04", category: "بایوس" }
    ]
  },
  {
    modelId: "tink-book-pro-14",
    modelName: "تک‌بوک پرو ۱۴ استودیو",
    files: [
      { name: "Tink Studio Color Manager (پروفایل ICC)", date: "۱۴۰۵/۰۵/۲۹", size: "۴۵ مگابایت", version: "1.8.0", category: "نمایشگر" },
      { name: "AMD Ryzen AI Driver Package v3.1", date: "۱۴۰۵/۰۶/۲۱", size: "۳۲۰ مگابایت", version: "3.1.2", category: "پردازنده" },
      { name: "Realtek Audio Dolby Atmos Driver", date: "۱۴۰۵/۰۴/۱۳", size: "۱۱۰ مگابایت", version: "6.0.92", category: "صدا" }
    ]
  },
  {
    modelId: "aeroslim-x13",
    modelName: "ایرو‌اسلیم X13 فدر",
    files: [
      { name: "Intel Arc Graphics Driver v31.0.101", date: "۱۴۰۵/۰۶/۳۱", size: "۶۲۰ مگابایت", version: "31.0.101", category: "کارت گرافیک" },
      { name: "Battery Saver & Power Plan v2.0", date: "۱۴۰۵/۰۳/۲۸", size: "۱۲ مگابایت", version: "2.0.1", category: "نرم‌افزار" }
    ]
  }
];
