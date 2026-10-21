import React, { useState } from 'react';
import { 
  Cpu, Zap, Battery, ArrowLeft, Play, Shield, Award, 
  Sparkles, Fan, CheckCircle, MapPin, 
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
      subtitle: 'اجرای روان و سریع مدل‌های هوش مصنوعی، رندر پیوسته پروژه‌های سه‌بعدی و پردازش سنگین با پهنای باند حافظه رم DDR5 بالا بدون افت فریم.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { val: '۱۲۸ TOPS', label: 'توان موتور عصبی NPU' },
        { val: '۶۴ گیگابایت', label: 'حافظه رم پرسرعت DDR5' },
        { val: 'Gen5 NVMe', label: 'سرعت ۷,۴۰۰MB/s' }
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
      badge: 'تایید شده برای نرم‌افزارهای مهندسی و نقشه‌کشی',
      headline: 'ورک‌استیشن‌های مهندسی با پایداری کامل',
      highlightWord: 'پایداری کامل',
      subtitle: 'طراحی شده برای سالیدورکز، کتیا، انسیس و رویت با شاسی مقاوم استاندارد نظامی و سیستم تهویه بهینه برای ساعت‌ها کار مداوم بدون داغ شدن.',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { val: '۱۰۰٪ ISV', label: 'سازگاری کامل مهندسی' },
        { val: '4K DreamColor', label: 'دقت رنگ ۱۰۰٪ کالیبره' },
        { val: '۲۴ ماه', label: 'ضمانت تعویض تک‌تینک' }
      ],
      chips: [
        { icon: 'Shield', label: 'MIL-STD-810H Certified' },
        { icon: 'Cpu', label: 'NVIDIA RTX A-Series' },
        { icon: 'Battery', label: 'ECC Memory Support' }
      ],
      sticker: { text: 'گرید ++A اروپایی · استاندارد ISV', color: 'hsl(var(--accent-green))' }
    },
    {
      id: 'dev',
      label: 'برنامه‌نویسی و بیزینس',
      icon: Code2,
      badge: 'شارژدهی واقعی ۲۰ ساعته در بدنه‌ای سبک',
      headline: 'سرعت کامپایل آنی در شاسی سبک و باریک',
      highlightWord: 'کامپایل آنی',
      subtitle: 'اولترابوک‌های فیبر کربن و منیزیم با کیبورد ارگونومیک، درگاه‌های تاندربولت ۴ دوگانه و نمایشگر ضد انعکاس برای برنامه‌نویسان و مدیران.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      stats: [
        { val: '۲۰ ساعت', label: 'شارژدهی واقعی باتری' },
        { val: '۱.۳ کیلوگرم', label: 'شاسی سبک و باریک' },
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
      label: 'بی‌صدا',
      wattage: '35W',
      rpm: '0 RPM',
      temp: '34°C',
      noise: '< 20 dB',
      status: 'خاموشی فن‌ها و حداکثر دوام باتری',
      spinDuration: '0s',
      color: 'hsl(var(--accent-green))',
      barPercent: '20%'
    },
    balanced: {
      label: 'معمولی',
      wattage: '85W',
      rpm: '2,100 RPM',
      temp: '52°C',
      noise: '32 dB',
      status: 'جریان هوای ملایم برای کارهای روزمره',
      spinDuration: '1.2s',
      color: 'hsl(var(--accent-cyan))',
      barPercent: '55%'
    },
    turbo: {
      label: 'حداکثر توان',
      wattage: '230W Max',
      rpm: '4,900 RPM',
      temp: '72°C',
      noise: '46 dB',
      status: 'خنک‌کاری حداکثری برای سنگین‌ترین پروژه‌ها',
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
      case 'Cpu': return <Cpu size={15} color="hsl(var(--accent-cyan))" />;
      case 'Zap': return <Zap size={15} color="hsl(var(--accent-purple))" />;
      case 'Battery': return <Battery size={15} color="hsl(var(--accent-green))" />;
      case 'Shield': return <Shield size={15} color="hsl(var(--accent-cyan))" />;
      case 'Award': return <Award size={15} color="hsl(var(--accent-purple))" />;
      default: return <Cpu size={15} color="hsl(var(--accent-cyan))" />;
    }
  };

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '36px', position: 'relative', overflowX: 'clip' }}>
      
      {/* 1. TACTILE PERSONA SELECTOR - Smooth Touch-Scroll on Mobile, Centered on Desktop */}
      <div className="tt-hero-persona-wrapper">
        <div 
          className="glass-panel"
          style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: '100px',
            gap: '4px',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            whiteSpace: 'nowrap',
            flexShrink: 0
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
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <IconComp size={14} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN HERO GRID - Clean 1-column on mobile, 2-column on desktop */}
      <div className="tt-hero-grid">
        
        {/* Left Column: Headlines & Morphing Persona Content */}
        <div className="animate-fade-in" style={{ zIndex: 5, width: '100%', minWidth: 0 }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', padding: '4px 10px' }}>
              <Sparkles size={12} />
              {badge}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', marginBottom: '14px', lineHeight: 1.25, letterSpacing: '-0.4px', wordBreak: 'break-word' }}>
            {renderTitle()}
          </h1>

          <p style={{ fontSize: 'clamp(0.88rem, 2vw, 1.05rem)', color: 'var(--text-secondary)', marginBottom: '22px', maxWidth: '520px', lineHeight: 1.7, wordBreak: 'break-word' }}>
            {subtitle}
          </p>
          
          <div className="flex" style={{ gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={onExploreClick} 
              style={{ padding: '11px 20px', fontSize: '0.88rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
            >
              {primaryBtnText} <ArrowLeft size={16} />
            </button>
            <button 
              className="btn btn-glass" 
              style={{ padding: '11px 18px', fontSize: '0.88rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              onClick={onSecondaryClick}
            >
              <Play size={14} style={{ marginLeft: '2px' }} />
              {secondaryBtnText}
            </button>
          </div>

          {/* Persona Live Benchmark Stats */}
          <div className="tt-hero-stats-grid">
            {stats.map((st, i) => (
              <div 
                key={i}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  minWidth: 0
                }}
              >
                <div className="font-tech" style={{ color: statColors[i % statColors.length], fontWeight: 800, fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', whiteSpace: 'nowrap' }}>
                  {st.val}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', marginTop: '2px', lineHeight: 1.3 }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof Trust Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: 'hsl(var(--accent-green))', fontSize: '0.76rem', fontWeight: 700, gap: '6px', lineHeight: 1.4 }}>
              <CheckCircle size={14} style={{ flexShrink: 0 }} />
              <span>بیش از ۱,۴۵۰ لپ‌تاپ تحویل موفق در استان اصفهان و سراسر کشور</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Showcase & Floating Tactile Badges */}
        <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
          
          {/* FLOATING TACTILE STICKERS - Desktop Only, Never Overflows */}
          <div className="tt-floating-stickers-wrap">
            {/* Sticker 1: Top Right Tech Badge */}
            <div 
              className="floating-sticker sticker-float-1"
              style={{
                position: 'absolute',
                top: '-12px',
                right: '4px',
                zIndex: 12,
                background: 'var(--glass-card-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: '7px 12px',
                borderRadius: '100px',
                border: `1.5px solid ${persona.sticker.color}`,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transform: 'rotate(2deg)'
              }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: persona.sticker.color, boxShadow: `0 0 6px ${persona.sticker.color}` }} />
              <span className="font-tech" style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {persona.sticker.text}
              </span>
            </div>

            {/* Sticker 2: Top Left Gold Warranty Seal */}
            <div 
              className="floating-sticker sticker-float-2"
              style={{
                position: 'absolute',
                top: '36px',
                left: '-4px',
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
                transform: 'rotate(-3deg)'
              }}
            >
              <Shield size={13} color="hsl(var(--accent-green))" />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                گارانتی ۲۴ ماهه تک‌تینک
              </span>
            </div>
          </div>

          {/* Main Hardware Showcase Card */}
          <div 
            className="glass-card animate-fade-in" 
            style={{ 
              padding: '12px', 
              position: 'relative', 
              borderRadius: '20px', 
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)',
              width: '100%'
            }}
          >
            {/* Ambient Refraction Glow */}
            <div style={{
              position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '80%', height: '80%', background: `radial-gradient(circle, ${currentFan.color}25 0%, transparent 70%)`,
              filter: 'blur(40px)', zIndex: 0, transition: 'background 0.4s ease', pointerEvents: 'none'
            }} />
            
            {/* Featured Laptop Product Image */}
            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', zIndex: 1 }}>
              <img 
                src={imageUrl} 
                alt={title} 
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  aspectRatio: '16/10',
                  maxHeight: '300px',
                  objectFit: 'cover',
                  display: 'block',
                  filter: 'contrast(1.08) saturate(1.15)'
                }} 
              />

              {/* Chips Overlay */}
              <div 
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px', 
                  padding: '6px 10px', 
                  zIndex: 2, 
                  display: 'flex', 
                  gap: '8px', 
                  direction: 'rtl',
                  borderRadius: '10px'
                }}
              >
                {chips.map((chip, idx) => (
                  <div key={idx} className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    {getChipIcon(chip.icon)}
                    <span className="font-tech" style={{ fontSize: '9.5px', fontWeight: 700 }}>{chip.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. INTERACTIVE TURBO FAN & POWER DIAL WIDGET */}
            <div 
              style={{ 
                marginTop: '12px', 
                padding: '12px 14px', 
                borderRadius: '14px', 
                background: 'rgba(0, 0, 0, 0.03)', 
                border: '1px solid var(--border-glass)',
                position: 'relative',
                zIndex: 2
              }}
            >
              {/* Dial Header & Mode Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Fan 
                    size={15} 
                    className="animated-fan-blade"
                    style={{ 
                      color: currentFan.color,
                      animationDuration: currentFan.spinDuration
                    }} 
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    شبیه‌ساز قدرت و خنک‌کننده دستگاه
                  </span>
                </div>

                {/* 3 Interactive Buttons */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'silent', label: 'بی‌صدا' },
                    { id: 'balanced', label: 'معمولی' },
                    { id: 'turbo', label: 'توربو' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setFanMode(b.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
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
              <div style={{ height: '5px', borderRadius: '100px', background: 'rgba(0, 0, 0, 0.08)', overflow: 'hidden', marginBottom: '8px' }}>
                <div 
                  style={{
                    height: '100%',
                    width: currentFan.barPercent,
                    background: `linear-gradient(90deg, hsl(var(--accent-cyan)), ${currentFan.color})`,
                    borderRadius: '100px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              {/* Live Gauges Readout - 2x2 on mobile, 4-in-a-row on desktop */}
              <div className="tt-hero-gauges">
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>توان مصرفی</div>
                  <div className="font-tech" style={{ fontSize: '0.78rem', fontWeight: 800, color: currentFan.color, marginTop: '1px' }}>
                    {currentFan.wattage}
                  </div>
                </div>

                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>سرعت فن</div>
                  <div className="font-tech" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {currentFan.rpm}
                  </div>
                </div>

                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>دمای چیپست</div>
                  <div className="font-tech" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {currentFan.temp}
                  </div>
                </div>

                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>نویز صدا</div>
                  <div className="font-tech" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {currentFan.noise}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Embedded Mobile-First Responsive CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .tt-hero-persona-wrapper {
          display: flex;
          justify-content: flex-start;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 4px 0 16px;
          margin-bottom: 12px;
          width: 100%;
          max-width: 100%;
        }
        .tt-hero-persona-wrapper::-webkit-scrollbar {
          display: none;
        }

        .tt-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: center;
          width: 100%;
        }

        .tt-hero-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 24px;
          width: 100%;
        }

        .tt-hero-gauges {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          text-align: center;
        }

        .tt-floating-stickers-wrap {
          display: none;
        }

        @keyframes fanSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animated-fan-blade {
          animation: fanSpin linear infinite;
        }

        @media (min-width: 640px) {
          .tt-hero-gauges {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 768px) {
          .tt-hero-persona-wrapper {
            justify-content: center;
          }
        }

        @media (min-width: 960px) {
          .tt-hero-grid {
            grid-template-columns: 1.15fr 0.85fr;
            gap: 36px;
          }
          .tt-floating-stickers-wrap {
            display: block;
          }
        }
      `}} />
    </div>
  );
}
