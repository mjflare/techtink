import React, { useState } from 'react';
import { 
  Cpu, Zap, Battery, ArrowLeft, Play, Shield, Award, 
  Sparkles, Fan, Flame, Activity, CheckCircle, MapPin, 
  Gamepad2, Brain, Compass, Code2
} from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  // 1. PERSONAS (Happybase Inspiration: Tactile Persona Selector)
  const personas = [
    {
      id: 'gaming',
      label: 'گیمینگ و استریم',
      icon: Gamepad2,
      badge: 'نسل جدید گرافیک‌های RTX 50 با فریم‌ریت ۲۴۰+',
      headline: 'نهایت قدرت گرافیکی برای گیمرهای حرفه‌ای',
      highlightWord: 'نهایت قدرت',
      subtitle: 'ترکیب پردازنده‌های ۲۴ هسته‌ای نسل جدید و پردازنده‌های گرافیکی RTX 5090 با توان ۱۷۵ وات برای اجرای روان سنگین‌ترین بازی‌های روز در پنل‌های OLED با پاسخ‌دهی ۰.۰۳ میلی‌ثانیه.',
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { val: '۲۴۰ FPS', label: 'فریم‌ریت در 2K Ultra' },
        { val: '۱۷۵ وات', label: 'حداکثر توان گرافیک TGP' },
        { val: '۰.۰۳ms', label: 'زمان پاسخ‌دهی پیکسل OLED' }
      ],
      chips: [
        { icon: 'Zap', label: 'RTX 5090 175W' },
        { icon: 'Cpu', label: 'i9-14900HX 24-Core' },
        { icon: 'Battery', label: 'OLED 240Hz G-Sync' }
      ],
      sticker: { text: 'RTX 5090 175W Max-TGP', color: 'hsl(var(--accent-purple))' }
    },
    {
      id: 'ai',
      label: 'هوش مصنوعی و ۳D',
      icon: Brain,
      badge: 'موتورهای عصبی NPU با توان ۱۲۸ ترافلاپس',
      headline: 'ایستگاه کاری یادگیری عمیق و رندرینگ ۳D',
      highlightWord: 'یادگیری عمیق',
      subtitle: 'اجرای لوکال و بدون محدودیت مدل‌های زبانی بزرگ (LLM)، رندر پیوسته در بلندر و مکس، و پردازش تنسور با پهنای باند حافظه رم DDR5 بالا بدون افت فریم.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { val: '۱۲۸ TOPS', label: 'توان پردازش موتور عصبی NPU' },
        { val: '۶۴ گیگابایت', label: 'حافظه رم پرسرعت DDR5' },
        { val: 'Gen5 NVMe', label: 'سرعت خواندن ۷,۴۰۰MB/s' }
      ],
      chips: [
        { icon: 'Cpu', label: 'NPU AI Tensor Engine' },
        { icon: 'Zap', label: 'CUDA & PyTorch Native' },
        { icon: 'Battery', label: 'Vapor Chamber 3D' }
      ],
      sticker: { text: '128 TOPS NPU · PyTorch Ready', color: 'hsl(var(--accent-cyan))' }
    },
    {
      id: 'engineering',
      label: 'مهندسی و CAD',
      icon: Compass,
      badge: 'دارای سرتیفیکیت رسمی ISV برای نرم‌افزارهای مهندسی',
      headline: 'ورک‌استیشن‌های مهندسی با پایداری مطلق',
      highlightWord: 'پایداری مطلق',
      subtitle: 'طراحی شده برای سالیدورکز، کتیا، انسیس و رویت؛ بدون کوچک‌ترین خطا، با شاسی مقاوم آلومینیوم-منیزیم استاندارد نظامی و سیستم تهویه بهینه برای لودهای ۲۴ ساعته.',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { val: '۱۰۰٪ ISV', label: 'سازگاری رسمی SolidWorks' },
        { val: '4K DreamColor', label: 'پوشش ۱۰۰٪ DCI-P3 کالیبره' },
        { val: '۲۴ ماه', label: 'ضمانت تعویض قطعات تک‌تینک' }
      ],
      chips: [
        { icon: 'Shield', label: 'MIL-STD-810H Certified' },
        { icon: 'Cpu', label: 'NVIDIA RTX A-Series' },
        { icon: 'Battery', label: 'ECC Memory Support' }
      ],
      sticker: { text: 'گرید ++A اروپایی · گواهی ISV', color: 'hsl(var(--accent-green))' }
    },
    {
      id: 'dev',
      label: 'برنامه‌نویسی و بیزینس',
      icon: Code2,
      badge: 'شارژدهی واقعی ۲۰ ساعته در بدنه‌ای سبک',
      headline: 'سرعت کامپایل آنی در بدنه‌ای سبک و باریک',
      highlightWord: 'کامپایل آنی',
      subtitle: 'اولترابوک‌های فیبر کربن و منیزیم با کیبورد ارگونومیک افسانه‌ای، درگاه‌های تاندربولت ۴ دوگانه و نمایشگرهای ضد انعکاس برای برنامه‌نویسان و مدیران کسب‌وکار.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { val: '۲۰ ساعت', label: 'شارژدهی واقعی باتری' },
        { val: '۱.۳ کیلوگرم', label: 'شاسی اولترا اسلیم کربن' },
        { val: '۰ دسی‌بل', label: 'عملکرد کاملاً بی‌صدا' }
      ],
      chips: [
        { icon: 'Battery', label: 'All-Day Battery 99Wh' },
        { icon: 'Cpu', label: 'Dual Thunderbolt 4' },
        { icon: 'Shield', label: 'ارسال فوری ۱ ساعته' }
      ],
      sticker: { text: '۱.۳kg فیبر کربن · باتری ۲۰ ساعته', color: '#f59e0b' }
    }
  ];

  const [activePersonaIdx, setActivePersonaIdx] = useState(0);
  const persona = personas[activePersonaIdx];

  // 2. HARDWARE TURBO FAN & PERFORMANCE DIAL WIDGET
  const [fanMode, setFanMode] = useState('turbo'); // 'silent', 'balanced', 'turbo'

  const fanSettings = {
    silent: {
      label: 'سایلنت (Silent)',
      wattage: '35W',
      rpm: '0 RPM',
      temp: '34°C',
      noise: '< 20 dB',
      status: 'خاموشی کامل فن‌ها و حداکثر دوام باتری',
      spinDuration: '0s',
      color: 'hsl(var(--accent-green))',
      barPercent: '20%'
    },
    balanced: {
      label: 'متعادل (Balanced)',
      wattage: '85W',
      rpm: '2,100 RPM',
      temp: '52°C',
      noise: '32 dB',
      status: 'جریان هوای نرم و بهینه برای کارهای چندوظیفگی',
      spinDuration: '1.2s',
      color: 'hsl(var(--accent-cyan))',
      barPercent: '55%'
    },
    turbo: {
      label: 'توربو اکستریم (Turbo 230W)',
      wattage: '230W Max',
      rpm: '4,900 RPM',
      temp: '72°C',
      noise: '46 dB',
      status: 'فعالسازی حداکثر محفظه بخار سه‌بعدی و توربو کلاک',
      spinDuration: '0.35s',
      color: 'hsl(var(--accent-purple))',
      barPercent: '100%'
    }
  };

  const currentFan = fanSettings[fanMode];

  // Text values (support dynamic persona morphing, fallback to config if user specified)
  const title = c.title ? c.title : persona.headline;
  const highlightWord = c.highlightWord ? c.highlightWord : persona.highlightWord;
  const badge = c.badge ? c.badge : persona.badge;
  const subtitle = c.subtitle ? c.subtitle : persona.subtitle;
  const imageUrl = c.imageUrl ? c.imageUrl : persona.image;
  const primaryBtnText = c.primaryBtnText || 'مشاهده لپ‌تاپ‌های برگزیده';
  const secondaryBtnText = c.secondaryBtnText || 'نقد و بررسی مهندسی';
  const stats = c.stats && c.stats.length === 3 ? c.stats : persona.stats;
  const chips = c.chips && c.chips.length === 3 ? c.chips : persona.chips;

  const statColors = ['hsl(var(--accent-cyan))', 'hsl(var(--accent-purple))', 'hsl(var(--accent-green))'];

  const renderTitle = () => {
    if (!highlightWord || !title.includes(highlightWord)) {
      return title;
    }
    const parts = title.split(highlightWord);
    return (
      <>
        {parts[0]}
        <span className="gradient-text">{highlightWord}</span>
        {parts.slice(1).join(highlightWord)}
      </>
    );
  };

  const getChipIcon = (iconName) => {
    switch (iconName) {
      case 'Cpu': return <Cpu size={16} color="hsl(var(--accent-cyan))" />;
      case 'Zap': return <Zap size={16} color="hsl(var(--accent-purple))" />;
      case 'Battery': return <Battery size={16} color="hsl(var(--accent-green))" />;
      case 'Shield': return <Shield size={16} color="hsl(var(--accent-cyan))" />;
      case 'Award': return <Award size={16} color="hsl(var(--accent-purple))" />;
      default: return <Cpu size={16} color="hsl(var(--accent-cyan))" />;
    }
  };

  return (
    <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px', position: 'relative' }}>
      
      {/* 1. TACTILE PERSONA SELECTOR (Happybase Style) */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}
      >
        <div 
          className="glass-panel"
          style={{
            display: 'inline-flex',
            padding: '5px',
            borderRadius: '100px',
            gap: '4px',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
          }}
        >
          {personas.map((p, idx) => {
            const IconComp = p.icon;
            const isActive = activePersonaIdx === idx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePersonaIdx(idx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '100px',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                  boxShadow: isActive ? '0 4px 14px hsla(var(--accent-cyan), 0.35)' : 'none'
                }}
              >
                <IconComp size={15} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN HERO GRID */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '36px', alignItems: 'center' }}>
        
        {/* Left Column: Headlines & Morphing Persona Content */}
        <div className="animate-fade-in" style={{ zIndex: 10 }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="badge badge-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '4px 12px' }}>
              <Sparkles size={13} />
              {badge}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.1rem, 4.5vw + 0.5rem, 3.4rem)', marginBottom: '16px', lineHeight: 1.22, letterSpacing: '-0.5px' }}>
            {renderTitle()}
          </h1>

          <p style={{ fontSize: 'clamp(0.92rem, 1.8vw, 1.05rem)', color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '530px', lineHeight: 1.75 }}>
            {subtitle}
          </p>
          
          <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={onExploreClick} 
              style={{ flexGrow: 0, padding: '12px 24px', fontSize: '0.92rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {primaryBtnText} <ArrowLeft size={18} />
            </button>
            <button 
              className="btn btn-glass" 
              style={{ flexGrow: 0, padding: '12px 20px', fontSize: '0.92rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={onSecondaryClick}
            >
              <Play size={15} style={{ marginLeft: '4px' }} />
              {secondaryBtnText}
            </button>
          </div>

          {/* Persona Live Benchmark Stats */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', marginTop: '36px', gap: '16px' }}>
            {stats.map((st, i) => (
              <div 
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="font-tech" style={{ color: statColors[i % statColors.length], fontWeight: 800, fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)' }}>
                  {st.val}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px', lineHeight: 1.4 }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof Trust Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: 'hsl(var(--accent-green))', fontSize: '0.8rem', fontWeight: 700, gap: '6px' }}>
              <CheckCircle size={15} />
              <span>بیش از ۱,۴۵۰ لپ‌تاپ تحویل موفق در استان اصفهان و سراسر کشور</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Hardware Visual & Floating Tactile Badges */}
        <div style={{ position: 'relative' }}>
          
          {/* FLOATING TACTILE STICKERS (Happybase Signature) */}
          
          {/* Sticker 1: Top Right Tech Badge */}
          <div 
            className="floating-sticker sticker-float-1"
            style={{
              position: 'absolute',
              top: '-14px',
              right: '-10px',
              zIndex: 12,
              background: 'var(--glass-card-bg)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '8px 14px',
              borderRadius: '100px',
              border: `1.5px solid ${persona.sticker.color}`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transform: 'rotate(2deg)'
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: persona.sticker.color, boxShadow: `0 0 8px ${persona.sticker.color}` }} />
            <span className="font-tech" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {persona.sticker.text}
            </span>
          </div>

          {/* Sticker 2: Top Left Gold Warranty Seal */}
          <div 
            className="floating-sticker sticker-float-2"
            style={{
              position: 'absolute',
              top: '40px',
              left: '-16px',
              zIndex: 12,
              background: 'var(--glass-card-bg)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '6px 12px',
              borderRadius: '100px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transform: 'rotate(-4deg)'
            }}
          >
            <Shield size={14} color="hsl(var(--accent-green))" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              گارانتی ۲۴ ماهه تک‌تینک
            </span>
          </div>

          {/* Sticker 3: Bottom Left Isfahan 1-Hour Courier */}
          <div 
            className="floating-sticker sticker-float-3"
            style={{
              position: 'absolute',
              bottom: '160px',
              left: '-12px',
              zIndex: 12,
              background: 'var(--glass-card-bg)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '6px 12px',
              borderRadius: '100px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transform: 'rotate(3deg)'
            }}
          >
            <MapPin size={14} color="#ef4444" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ارسال ۱ ساعته پیک در اصفهان
            </span>
          </div>

          {/* Main Hardware Showcase Card */}
          <div 
            className="glass-card animate-fade-in" 
            style={{ 
              padding: '16px', 
              position: 'relative', 
              borderRadius: '24px', 
              overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Ambient Radial Refraction Glow */}
            <div style={{
              position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '85%', height: '85%', background: `radial-gradient(circle, ${currentFan.color}25 0%, transparent 70%)`,
              filter: 'blur(50px)', zIndex: 0, transition: 'background 0.4s ease'
            }}></div>
            
            {/* Featured Laptop Product Image */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', zIndex: 1, maxHeight: '310px' }}>
              <img 
                src={imageUrl} 
                alt={title} 
                style={{ 
                  width: '100%', 
                  height: '310px',
                  objectFit: 'cover',
                  display: 'block',
                  filter: 'contrast(1.08) saturate(1.15)',
                  transition: 'transform 0.4s ease'
                }} 
              />

              {/* Chips Overlay */}
              <div 
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  right: '12px', 
                  padding: '8px 12px', 
                  zIndex: 2, 
                  display: 'flex', 
                  gap: '10px', 
                  direction: 'rtl',
                  borderRadius: '12px'
                }}
              >
                {chips.map((chip, idx) => (
                  <div key={idx} className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    {getChipIcon(chip.icon)}
                    <span className="font-tech" style={{ fontSize: '10.5px', fontWeight: 700 }}>{chip.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. INTERACTIVE TURBO FAN & BENCHMARK DIAL WIDGET */}
            <div 
              style={{ 
                marginTop: '14px', 
                padding: '14px 16px', 
                borderRadius: '16px', 
                background: 'rgba(0, 0, 0, 0.03)', 
                border: '1px solid var(--border-glass)',
                position: 'relative',
                zIndex: 2
              }}
            >
              {/* Dial Header & Mode Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Fan 
                    size={16} 
                    className="animated-fan-blade"
                    style={{ 
                      color: currentFan.color,
                      animationDuration: currentFan.spinDuration
                    }} 
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    شبیه‌ساز قدرت و خنک‌کننده دستگاه
                  </span>
                </div>

                {/* 3 Interactive Buttons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'silent', label: 'سایلنت' },
                    { id: 'balanced', label: 'بهینه' },
                    { id: 'turbo', label: 'توربو ۲۳۰W' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setFanMode(b.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: fanMode === b.id ? 700 : 500,
                        background: fanMode === b.id ? currentFan.color : 'rgba(0, 0, 0, 0.04)',
                        color: fanMode === b.id ? '#fff' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reactive Wattage Bar */}
              <div style={{ height: '6px', borderRadius: '100px', background: 'rgba(0, 0, 0, 0.08)', overflow: 'hidden', marginBottom: '10px' }}>
                <div 
                  style={{
                    height: '100%',
                    width: currentFan.barPercent,
                    background: `linear-gradient(90deg, hsl(var(--accent-cyan)), ${currentFan.color})`,
                    borderRadius: '100px',
                    transition: 'width 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                />
              </div>

              {/* Live Gauges Readout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>توان مصرفی</div>
                  <div className="font-tech" style={{ fontSize: '0.8rem', fontWeight: 800, color: currentFan.color, marginTop: '1px' }}>
                    {currentFan.wattage}
                  </div>
                </div>

                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>سرعت فن</div>
                  <div className="font-tech" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {currentFan.rpm}
                  </div>
                </div>

                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>دمای چیپست</div>
                  <div className="font-tech" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {currentFan.temp}
                  </div>
                </div>

                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>نویز صدا</div>
                  <div className="font-tech" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {currentFan.noise}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Embedded CSS for Happybase-Style Floating Animations & Fan Blade */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatOrganic1 {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-8px) rotate(0deg); }
        }
        @keyframes floatOrganic2 {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes floatOrganic3 {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-7px) rotate(5deg); }
        }
        @keyframes fanSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sticker-float-1 {
          animation: floatOrganic1 4s ease-in-out infinite;
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .sticker-float-1:hover {
          transform: scale(1.08) translateY(-6px) rotate(0deg) !important;
        }

        .sticker-float-2 {
          animation: floatOrganic2 4.5s ease-in-out infinite;
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .sticker-float-2:hover {
          transform: scale(1.08) translateY(-6px) rotate(0deg) !important;
        }

        .sticker-float-3 {
          animation: floatOrganic3 5s ease-in-out infinite;
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .sticker-float-3:hover {
          transform: scale(1.08) translateY(-6px) rotate(0deg) !important;
        }

        .animated-fan-blade {
          animation: fanSpin linear infinite;
        }

        @media (max-width: 768px) {
          .floating-sticker {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
