import React, { useState, useEffect } from 'react';
import { 
  Layout, Megaphone, Sparkles, Flame, Star, Save, RefreshCw, 
  Check, AlertCircle, Eye, Tag, Clock, ArrowLeft, Image, 
  Sliders, Plus, Trash2, CheckCircle2, Shield, Calendar, Ticket
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import { 
  JALALI_MONTH_NAMES, 
  getDaysInJalaliMonth, 
  isoToJalali, 
  jalaliToIso, 
  getPersianDatePresets, 
  formatPersianDateTime 
} from '../utils/jalaliDate.js';

export default function HomeCustomizer({ authToken, onNotify, onHomepageConfigUpdated }) {
  const [activeSubTab, setActiveSubTab] = useState('promotion'); // Default to promotion so admin sees promo right away
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Form states
  const [announcement, setAnnouncement] = useState({
    active: true,
    badge: 'خبر ویژه',
    text: 'تخفیف ویژه آغاز فصل و سفارش‌های مهندسی - ارسال رایگان با پست پیشتاز به سراسر کشور',
    linkText: 'مشاهده لپ‌تاپ‌ها',
    linkUrl: '#catalog',
    style: 'cyan'
  });

  const [hero, setHero] = useState({
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
  });

  const [promotion, setPromotion] = useState({
    active: true,
    badge: 'کمپین تخفیف شگفت‌انگیز',
    title: 'جشنواره ورک‌استیشن‌های رندرینگ و طراحی مهندسی',
    subtitle: 'تا ۱۵٪ تخفیف ویژه برای لپ‌تاپ‌های برگزیده سری ThinkPad و Precision همراه با تست ۳۰ روزه',
    promoCode: 'TECHTINK2026',
    discountPercent: '۱۵٪',
    expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    btnText: 'مشاهده محصولات جشنواره',
    btnLink: '#catalog',
    theme: 'fiery'
  });

  const [showcase, setShowcase] = useState({
    active: true,
    title: 'ویترین محصولات برگزیده و پیشنهادات ویژه',
    subtitle: 'دستچین تخصصی کارشناسان سخت‌افزار با بالاترین امتیاز عملکرد و سلامت قطعات',
    badge: 'پیشنهاد کارشناسان',
    bannerText: 'تحویل اکسپرس در اصفهان و ارسال سریع به سراسر کشور با بیمه کامل مرسوله',
    productSlugs: []
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/homepage', { headers: authHeaders });
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات صفحه اصلی');
      const data = await res.json();

      if (data.announcement) setAnnouncement(prev => ({ ...prev, ...data.announcement }));
      if (data.hero) setHero(prev => ({ ...prev, ...data.hero }));
      if (data.promotion) {
        setPromotion(prev => ({ ...prev, ...data.promotion, expireDate: data.promotion.expireDate || null }));
      }
      if (data.showcase) setShowcase(prev => ({ ...prev, ...data.showcase }));
      if (data.availableProducts) setAvailableProducts(data.availableProducts);

      if (data.activeCoupons && Array.isArray(data.activeCoupons)) {
        setAvailableCoupons(data.activeCoupons);
      } else {
        try {
          const cRes = await fetch('/api/admin/coupons?status=active', { headers: authHeaders });
          if (cRes.ok) {
            const cData = await cRes.json();
            setAvailableCoupons(cData);
          }
        } catch {}
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePromoActive = async (newActive) => {
    let expDate = promotion.expireDate;
    if (newActive) {
      const isPast = !expDate || new Date(expDate).getTime() <= Date.now();
      if (isPast) {
        expDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const updatedPromo = { ...promotion, active: newActive, expireDate: expDate };
    setPromotion(updatedPromo);

    try {
      await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          promotion: {
            ...updatedPromo,
            expireDate: updatedPromo.expireDate ? new Date(updatedPromo.expireDate).toISOString() : null
          }
        })
      });
      window.dispatchEvent(new CustomEvent('techtink-homepage-updated'));
      if (onHomepageConfigUpdated) onHomepageConfigUpdated();
      if (onNotify) onNotify(newActive ? 'بنر تخفیف در صفحه نخست فعال شد.' : 'بنر تخفیف از صفحه نخست برداشته شد.');
    } catch (e) {
      console.error(e);
    }
  };

  const selectedCoupon = availableCoupons.find(
    c => c.code.toUpperCase() === (promotion.promoCode || '').toUpperCase()
  );

  const handleSelectCoupon = (couponCode) => {
    const c = availableCoupons.find(x => x.code.toUpperCase() === couponCode.toUpperCase());
    if (c) {
      const disc = c.discount_type === 'percentage'
        ? `${c.discount_value}٪`
        : `${Number(c.discount_value).toLocaleString('fa-IR')} تومان`;

      setPromotion(prev => ({
        ...prev,
        promoCode: c.code,
        discountPercent: disc,
        title: (!prev.title || prev.title === 'جشنواره ورک‌استیشن‌های رندرینگ و طراحی مهندسی') ? c.title : prev.title
      }));
    } else {
      setPromotion(prev => ({ ...prev, promoCode: couponCode }));
    }
  };

  const currentJalaliInfo = isoToJalali(promotion.expireDate) || isoToJalali(new Date(Date.now() + 14 * 86400000).toISOString());
  const maxDaysInMonth = currentJalaliInfo ? getDaysInJalaliMonth(currentJalaliInfo.jy, currentJalaliInfo.jm) : 30;
  const isExpired = promotion.expireDate ? new Date(promotion.expireDate).getTime() <= Date.now() : false;

  const handleUpdateJalaliPart = (key, val) => {
    const cur = currentJalaliInfo || isoToJalali(new Date().toISOString());
    let jy = key === 'jy' ? Number(val) : cur.jy;
    let jm = key === 'jm' ? Number(val) : cur.jm;
    let jd = key === 'jd' ? Number(val) : cur.jd;
    const maxDays = getDaysInJalaliMonth(jy, jm);
    if (jd > maxDays) jd = maxDays;

    const newIso = jalaliToIso(jy, jm, jd, cur.hour, cur.minute);
    setPromotion(prev => ({ ...prev, expireDate: newIso }));
  };

  const handleUpdateJalaliTime = (hour, minute) => {
    const cur = currentJalaliInfo || isoToJalali(new Date().toISOString());
    const newIso = jalaliToIso(cur.jy, cur.jm, cur.jd, hour, minute);
    setPromotion(prev => ({ ...prev, expireDate: newIso }));
  };

  const handleSetPreset = (presetIso) => {
    setPromotion(prev => ({ ...prev, expireDate: presetIso }));
  };

  const getRemainingText = (expireDate) => {
    if (!expireDate) return '';
    const diff = new Date(expireDate).getTime() - Date.now();
    if (diff <= 0) return 'منقضی شده';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    if (days > 0) return `${days} روز و ${hours} ساعت مانده`;
    if (hours > 0) return `${hours} ساعت مانده`;
    return `${minutes} دقیقه مانده`;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      let expDate = promotion.expireDate;
      if (promotion.active && (!expDate || new Date(expDate).getTime() <= Date.now())) {
        expDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        setPromotion(prev => ({ ...prev, expireDate: expDate }));
      }

      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          announcement,
          hero,
          promotion: {
            ...promotion,
            expireDate: expDate ? new Date(expDate).toISOString() : null
          },
          showcase
        })
      });

      if (!res.ok) throw new Error('خطا در ذخیره تنظیمات');
      setSaveSuccess(true);
      window.dispatchEvent(new CustomEvent('techtink-homepage-updated'));
      if (onHomepageConfigUpdated) onHomepageConfigUpdated();
      if (onNotify) onNotify('تنظیمات ویترین و صفحه اصلی با موفقیت ذخیره شد.');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleShowcaseProduct = (slug) => {
    setShowcase(prev => {
      const exists = prev.productSlugs.includes(slug);
      const updated = exists 
        ? prev.productSlugs.filter(s => s !== slug)
        : [...prev.productSlugs, slug];
      return { ...prev, productSlugs: updated };
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'hsla(var(--accent-cyan), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layout size={22} color="hsl(var(--accent-cyan))" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>سفارشی‌ساز ویترین و صفحه اصلی (Home Customizer)</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                مدیریت زنده اخبار فوری، بنر هیرو، کمپین‌های تخفیف‌دار و انتخاب ویترین محصولات برگزیده
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-glass"
            style={{ padding: '10px 16px', fontSize: '0.85rem', gap: '6px', textDecoration: 'none' }}
          >
            <Eye size={16} /> مشاهده صفحه اصلی سایت
          </a>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ padding: '10px 22px', fontSize: '0.875rem', gap: '8px' }}
          >
            <Save size={16} />
            <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تمام تغییرات'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="animate-fade-in" style={{ padding: '14px 20px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <CheckCircle2 size={20} />
          <span>تنظیمات با موفقیت ذخیره شد و اکنون در صفحه اصلی سایت به صورت زنده نمایش داده می‌شود.</span>
        </div>
      )}

      {error && (
        <div className="animate-fade-in" style={{ padding: '14px 20px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { id: 'announcement', label: '۱. نوار اخبار و اعلان بالا', icon: Megaphone, activeState: announcement.active },
          { id: 'hero', label: '۲. بنر هیرو و معرفی اصلی', icon: Sparkles, activeState: hero.active },
          { id: 'promotion', label: '۳. کمپین تخفیف و پروموشن', icon: Flame, activeState: promotion.active },
          { id: 'showcase', label: `۴. ویترین محصولات برگزیده (${showcase.productSlugs.length})`, icon: Star, activeState: showcase.active },
        ].map(tab => {
          const IconComp = tab.icon;
          const isCurrent = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className="btn btn-glass"
              style={{
                padding: '10px 18px',
                fontSize: '0.875rem',
                gap: '8px',
                borderRadius: '14px',
                background: isCurrent ? 'hsla(var(--accent-cyan), 0.18)' : 'transparent',
                borderColor: isCurrent ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isCurrent ? 700 : 500
              }}
            >
              <IconComp size={16} color={isCurrent ? 'hsl(var(--accent-cyan))' : 'inherit'} />
              <span>{tab.label}</span>
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: tab.activeState ? '#10b981' : '#6b7280',
                  marginRight: '4px' 
                }} 
                title={tab.activeState ? 'فعال' : 'غیرفعال'}
              />
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. ANNOUNCEMENT BAR CUSTOMIZER */}
      {/* ======================================================== */}
      {activeSubTab === 'announcement' && (
        <div className="glass-card animate-fade-in" style={{ padding: '28px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} color="hsl(var(--accent-cyan))" />
                تنظیمات نوار اخبار و اعلان بالای صفحه
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                نوار شناور بالای هدر برای تخفیف‌های فوری، ارسال رایگان یا اطلاعیه‌های تعطیلات
              </span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input 
                type="checkbox" 
                checked={announcement.active} 
                onChange={(e) => setAnnouncement(prev => ({ ...prev, active: e.target.checked }))} 
                style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--accent-cyan))' }}
              />
              <span style={{ fontWeight: 600 }}>نمایش نوار در سایت</span>
            </label>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                نشان / بج اعلان (Badge)
              </label>
              <input 
                type="text" 
                className="input" 
                value={announcement.badge || ''} 
                onChange={(e) => setAnnouncement(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="مثال: خبر ویژه، تخفیف فوری، ارسال رایگان"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                تم رنگی نوار
              </label>
              <select 
                className="input"
                value={announcement.style || 'cyan'}
                onChange={(e) => setAnnouncement(prev => ({ ...prev, style: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              >
                <option value="cyan">آبی نئون (Cyan Tech)</option>
                <option value="orange">نارنجی آتشین (Fiery Orange)</option>
                <option value="purple">بنفش رویال (Royal Purple)</option>
                <option value="green">سبز موفقیت (Emerald Green)</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                متن کامل پیام یا خبر
              </label>
              <textarea 
                className="input" 
                rows={2}
                value={announcement.text || ''} 
                onChange={(e) => setAnnouncement(prev => ({ ...prev, text: e.target.value }))}
                placeholder="متن پیام اعلان را وارد کنید..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                متن دکمه لینک (اختیاری)
              </label>
              <input 
                type="text" 
                className="input" 
                value={announcement.linkText || ''} 
                onChange={(e) => setAnnouncement(prev => ({ ...prev, linkText: e.target.value }))}
                placeholder="مثال: مشاهده تخفیف‌ها"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                آدرس مقصد لینک
              </label>
              <input 
                type="text" 
                className="input" 
                value={announcement.linkUrl || ''} 
                onChange={(e) => setAnnouncement(prev => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="مثال: #catalog یا /product/lenovo-thinkpad-t14"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', direction: 'ltr', textAlign: 'left' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. HERO SECTION CUSTOMIZER */}
      {/* ======================================================== */}
      {activeSubTab === 'hero' && (
        <div className="glass-card animate-fade-in" style={{ padding: '28px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="hsl(var(--accent-purple))" />
                تنظیمات بنر هیرو و معرفی اصلی صفحه نخست
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                تیترهای بزرگ، تصویر لپ‌تاپ شاخص و شاخص‌های فنی زیر بنر
              </span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input 
                type="checkbox" 
                checked={hero.active} 
                onChange={(e) => setHero(prev => ({ ...prev, active: e.target.checked }))} 
                style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--accent-cyan))' }}
              />
              <span style={{ fontWeight: 600 }}>نمایش بخش هیرو</span>
            </label>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                نشان بالای عنوان (Top Badge)
              </label>
              <input 
                type="text" 
                className="input" 
                value={hero.badge || ''} 
                onChange={(e) => setHero(prev => ({ ...prev, badge: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                کلمه دارای گرادیانت رنگی (Highlight Word)
              </label>
              <input 
                type="text" 
                className="input" 
                value={hero.highlightWord || ''} 
                onChange={(e) => setHero(prev => ({ ...prev, highlightWord: e.target.value }))}
                placeholder="مثال: آینده"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                عنوان اصلی بزرگ (Headline)
              </label>
              <input 
                type="text" 
                className="input" 
                value={hero.title || ''} 
                onChange={(e) => setHero(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                توضیحات معرفی و پاراگراف زیر عنوان
              </label>
              <textarea 
                className="input" 
                rows={3}
                value={hero.subtitle || ''} 
                onChange={(e) => setHero(prev => ({ ...prev, subtitle: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                متن دکمه اول (Primary CTA)
              </label>
              <input 
                type="text" 
                className="input" 
                value={hero.primaryBtnText || ''} 
                onChange={(e) => setHero(prev => ({ ...prev, primaryBtnText: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                متن دکمه دوم (Secondary CTA)
              </label>
              <input 
                type="text" 
                className="input" 
                value={hero.secondaryBtnText || ''} 
                onChange={(e) => setHero(prev => ({ ...prev, secondaryBtnText: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                آدرس تصویر بزرگ شاخص (Image URL)
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="input" 
                  value={hero.imageUrl || ''} 
                  onChange={(e) => setHero(prev => ({ ...prev, imageUrl: e.target.value }))}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', direction: 'ltr', textAlign: 'left' }}
                />
                {hero.imageUrl && (
                  <img 
                    src={hero.imageUrl} 
                    alt="Preview" 
                    style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass)' }} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* 3 Stats Customizer */}
          <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'hsl(var(--accent-cyan))' }}>
              شاخص‌های فنی سه‌گانه زیر بنر هیرو:
            </h4>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {(hero.stats || []).map((st, i) => (
                <div key={i} className="glass-panel" style={{ padding: '14px', borderRadius: '14px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>مقدار شاخص {i + 1}:</label>
                  <input 
                    type="text" 
                    className="input"
                    value={st.val} 
                    onChange={(e) => {
                      const newStats = [...hero.stats];
                      newStats[i].val = e.target.value;
                      setHero(prev => ({ ...prev, stats: newStats }));
                    }}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', marginTop: '4px', marginBottom: '8px', fontWeight: 800 }}
                  />
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>عنوان شاخص {i + 1}:</label>
                  <input 
                    type="text" 
                    className="input"
                    value={st.label} 
                    onChange={(e) => {
                      const newStats = [...hero.stats];
                      newStats[i].label = e.target.value;
                      setHero(prev => ({ ...prev, stats: newStats }));
                    }}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', marginTop: '4px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PROMOTIONS & CAMPAIGN CUSTOMIZER */}
      {/* ======================================================== */}
      {activeSubTab === 'promotion' && (
        <div className="glass-card animate-fade-in" style={{ padding: '28px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="#f97316" />
                تنظیمات کمپین تبلیغاتی، تخفیف شگفت‌انگیز و شمارش معکوس
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                بنر جذاب با تایمر معکوس زنده و کد تخفیف با امکان کپی ۱ کلیکی برای مشتریان
              </span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem', background: promotion.active ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '14px', border: promotion.active ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid var(--border-glass)', transition: 'all 0.2s' }}>
              <input 
                type="checkbox" 
                checked={promotion.active} 
                onChange={(e) => handleTogglePromoActive(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: '#f97316' }}
              />
              <span style={{ fontWeight: 700, color: promotion.active ? '#f97316' : 'var(--text-secondary)' }}>
                {promotion.active ? 'نمایش بنر کمپین (فعال در سایت)' : 'نمایش بنر کمپین (غیرفعال است)'}
              </span>
            </label>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                نشان بالای کمپین (Badge)
              </label>
              <input 
                type="text" 
                className="input" 
                value={promotion.badge || ''} 
                onChange={(e) => setPromotion(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="مثال: کمپین تخفیف شگفت‌انگیز"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                تم رنگی بنر کمپین
              </label>
              <select 
                className="input"
                value={promotion.theme || 'fiery'}
                onChange={(e) => setPromotion(prev => ({ ...prev, theme: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              >
                <option value="fiery">قرمز-نارنجی آتشین (Fiery Red-Orange)</option>
                <option value="neon">سایبر نئون (Cyan & Purple)</option>
                <option value="emerald">سبز زمردی و گلد (Emerald Gold)</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                عنوان اصلی کمپین
              </label>
              <input 
                type="text" 
                className="input" 
                value={promotion.title || ''} 
                onChange={(e) => setPromotion(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: جشنواره لپ‌تاپ‌های رندرینگ و طراحی مهندسی"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                توضیحات و شرایط تخفیف کمپین
              </label>
              <textarea 
                className="input" 
                rows={2}
                value={promotion.subtitle || ''} 
                onChange={(e) => setPromotion(prev => ({ ...prev, subtitle: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', resize: 'vertical' }}
              />
            </div>

            {/* 1. ACTIVE COUPON CODE SELECTOR */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Ticket size={16} color="#f97316" />
                  انتخاب کد تخفیف فعال (تنها کدهای معتبر و تعریف‌شده قابل انتخاب هستند):
                </span>
              </label>

              {availableCoupons.length === 0 ? (
                <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#d97706', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} />
                  <span>در حال حاضر هیچ کد تخفیف فعالی در سیستم ثبت نشده است. لطفاً ابتدا در تب «کدهای تخفیف» یک کوپن فعال تعریف کنید.</span>
                </div>
              ) : (
                <div>
                  <select
                    className="input"
                    value={promotion.promoCode || ''}
                    onChange={(e) => handleSelectCoupon(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, minHeight: '46px' }}
                  >
                    <option value="">-- برای نمایش در بنر، یک کد تخفیف فعال را انتخاب کنید --</option>
                    {availableCoupons.map((c) => {
                      const discText = c.discount_type === 'percentage' 
                        ? `${c.discount_value}٪ تخفیف` 
                        : `${Number(c.discount_value).toLocaleString('fa-IR')} تومان تخفیف`;
                      return (
                        <option key={c.id} value={c.code}>
                          {c.code} ── {c.title} ({discText})
                        </option>
                      );
                    })}
                  </select>

                  {/* Selected Coupon Visual Badge Card */}
                  {selectedCoupon && (
                    <div style={{ marginTop: '10px', padding: '12px 16px', borderRadius: '14px', background: '#ffffff', border: '1.5px dashed rgba(249, 115, 22, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="font-code" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ea580c', background: '#fff7ed', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(234, 88, 12, 0.25)', letterSpacing: '1px' }}>
                          {selectedCoupon.code}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{selectedCoupon.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {selectedCoupon.discount_type === 'percentage' ? `${selectedCoupon.discount_value}٪ تخفیف` : `${Number(selectedCoupon.discount_value).toLocaleString('fa-IR')} تومان تخفیف`}
                            {selectedCoupon.min_order_value > 0 ? ` (حداقل سفارش: ${Number(selectedCoupon.min_order_value).toLocaleString('fa-IR')} تومان)` : ''}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                        ✓ کوپن فعال و آماده خرید
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                برچسب درصد یا مبلغ تخفیف (نمایش در نشان بنر)
              </label>
              <input 
                type="text" 
                className="input" 
                value={promotion.discountPercent || ''} 
                onChange={(e) => setPromotion(prev => ({ ...prev, discountPercent: e.target.value }))}
                placeholder="مثال: ۱۵٪ یا تا ۲۰٪ یا ۵۰۰,۰۰۰ تومان"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                متن دکمه کمپین (CTA Button)
              </label>
              <input 
                type="text" 
                className="input" 
                value={promotion.btnText || ''} 
                onChange={(e) => setPromotion(prev => ({ ...prev, btnText: e.target.value }))}
                placeholder="مشاهده محصولات جشنواره"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            {/* 2. IRAN CALENDAR (JALALI) END DATE PICKER */}
            <div style={{ gridColumn: '1 / -1', marginTop: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Calendar size={18} color="#0284c7" />
                    تنظیم زمان پایان تخفیف با تقویم خورشیدی ایران (تاریخ شمسی)
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    جهت محاسبه و اجرای تایمر معکوس زنده در بنر تبلیغاتی صفحه نخست
                  </span>
                </div>

                {/* Live Jalali Persian Status Badge */}
                {currentJalaliInfo && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                    border: isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
                    color: isExpired ? '#ef4444' : '#0284c7',
                    fontSize: '0.825rem',
                    fontWeight: 700
                  }}>
                    <Clock size={15} />
                    <span>پایان: {currentJalaliInfo.fullText}</span>
                    <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>
                      ({getRemainingText(promotion.expireDate)})
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Presets Pills */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  انتخاب سریع مدت زمان کمپین (با یک لمس):
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {getPersianDatePresets().map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSetPreset(preset.iso)}
                      className="btn btn-glass"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: '#ffffff',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                        minHeight: '44px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Sparkles size={13} color="#0284c7" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Persian Date Picker Selectors */}
              <div style={{ padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', fontWeight: 600 }}>
                  تنظیم دستی روز، ماه، سال و ساعت شمسی:
                </span>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {/* Day Selector */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>روز ماه شمسی:</label>
                    <select
                      value={currentJalaliInfo?.jd || 1}
                      onChange={(e) => handleUpdateJalaliPart('jd', Number(e.target.value))}
                      className="input"
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 700, minHeight: '44px' }}
                    >
                      {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d} {currentJalaliInfo?.monthName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month Selector */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ماه شمسی:</label>
                    <select
                      value={currentJalaliInfo?.jm || 1}
                      onChange={(e) => handleUpdateJalaliPart('jm', Number(e.target.value))}
                      className="input"
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 700, minHeight: '44px' }}
                    >
                      {JALALI_MONTH_NAMES.map((name, i) => (
                        <option key={i + 1} value={i + 1}>{name} (ماه {i + 1})</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Selector */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>سال شمسی:</label>
                    <select
                      value={currentJalaliInfo?.jy || 1405}
                      onChange={(e) => handleUpdateJalaliPart('jy', Number(e.target.value))}
                      className="input"
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 700, minHeight: '44px' }}
                    >
                      <option value={1405}>۱۴۰۵</option>
                      <option value={1406}>۱۴۰۶</option>
                      <option value={1407}>۱۴۰۷</option>
                    </select>
                  </div>

                  {/* Hour & Minute Selector */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ساعت پایان:</label>
                    <select
                      value={`${String(currentJalaliInfo?.hour ?? 23).padStart(2, '0')}:${String(currentJalaliInfo?.minute ?? 59).padStart(2, '0')}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':').map(Number);
                        handleUpdateJalaliTime(h, m);
                      }}
                      className="input"
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 700, minHeight: '44px' }}
                    >
                      <option value="23:59">۲۳:۵۹ (پایان شب - استاندارد)</option>
                      <option value="20:00">۲۰:۰۰ (پایان وقت اداری / شب)</option>
                      <option value="18:00">۱۸:۰۰ (عصر)</option>
                      <option value="14:00">۱۴:۰۰ (بعدازظهر)</option>
                      <option value="12:00">۱۲:۰۰ (ظهر)</option>
                      <option value="00:00">۰۰:۰۰ (بامداد)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FEATURED PRODUCT SHOWCASE CUSTOMIZER */}
      {/* ======================================================== */}
      {activeSubTab === 'showcase' && (
        <div className="glass-card animate-fade-in" style={{ padding: '28px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} color="hsl(var(--accent-cyan))" />
                تنظیمات ویترین محصولات برگزیده و پیشنهادات ویژه
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                محصولات دستچین‌شده که به صورت متمایز و برجسته در بالای کاتالوگ اصلی به خریداران نمایش داده می‌شوند
              </span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input 
                type="checkbox" 
                checked={showcase.active} 
                onChange={(e) => setShowcase(prev => ({ ...prev, active: e.target.checked }))} 
                style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--accent-cyan))' }}
              />
              <span style={{ fontWeight: 600 }}>نمایش ویترین در سایت</span>
            </label>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                نشان ویترین (Badge)
              </label>
              <input 
                type="text" 
                className="input" 
                value={showcase.badge || ''} 
                onChange={(e) => setShowcase(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="مثال: پیشنهاد کارشناسان، تخفیف هفتگی"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                پیام ارسال یا گارانتی بالای ویترین
              </label>
              <input 
                type="text" 
                className="input" 
                value={showcase.bannerText || ''} 
                onChange={(e) => setShowcase(prev => ({ ...prev, bannerText: e.target.value }))}
                placeholder="مثال: تحویل اکسپرس در اصفهان و ارسال سریع با بیمه کامل"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                عنوان اصلی ویترین
              </label>
              <input 
                type="text" 
                className="input" 
                value={showcase.title || ''} 
                onChange={(e) => setShowcase(prev => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: ویترین محصولات برگزیده و پیشنهادات ویژه"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                توضیحات کوتاه زیر عنوان
              </label>
              <textarea 
                className="input" 
                rows={2}
                value={showcase.subtitle || ''} 
                onChange={(e) => setShowcase(prev => ({ ...prev, subtitle: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Product Multi-Picker Grid */}
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.975rem' }}>
                  انتخاب لپ‌تاپ‌های موجود در ویترین ({showcase.productSlugs.length} محصول انتخاب شده):
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  روی هر محصول کلیک کنید تا به ویترین اضافه یا از آن حذف شود.
                </span>
              </div>

              {showcase.productSlugs.length > 0 && (
                <button
                  type="button"
                  className="btn btn-glass"
                  onClick={() => setShowcase(prev => ({ ...prev, productSlugs: [] }))}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444' }}
                >
                  پاک کردن انتخاب‌ها
                </button>
              )}
            </div>

            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '14px',
                maxHeight: '440px',
                overflowY: 'auto',
                padding: '4px'
              }}
            >
              {availableProducts.map(p => {
                const isSelected = showcase.productSlugs.includes(p.slug);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleShowcaseProduct(p.slug)}
                    className="glass-panel"
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid hsl(var(--accent-cyan))' : '1px solid var(--border-glass)',
                      background: isSelected ? 'hsla(var(--accent-cyan), 0.12)' : 'var(--table-stripe)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <img 
                      src={p.image || '/vite.svg'} 
                      alt={p.name} 
                      style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                        <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{p.category}</span>
                        {p.grade && (
                          <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'hsla(var(--accent-purple), 0.2)' }}>
                            {p.grade}
                          </span>
                        )}
                      </div>
                      <div className="font-tech price-gradient-text" style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '4px' }}>
                        {formatPrice(p.base_price)}
                      </div>
                    </div>

                    <div 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        border: isSelected ? 'none' : '1px solid var(--border-glass)',
                        background: isSelected ? 'hsl(var(--accent-cyan))' : 'transparent',
                        color: isSelected ? '#000' : 'transparent',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
