import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Cpu, Zap, Battery, Layers, Monitor, HardDrive, 
  ShieldCheck, Eye, ChevronRight, Activity, Thermometer, Wind, Check,
  Radio, Play, Pause, Flame, RefreshCw
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function AppleFlagshipShowcase({ product, onSelectProduct, onAddToCart }) {
  if (!product) return null;

  const customConfig = product.specs?.flagshipShowcase || product.flagshipShowcase;
  if (customConfig && customConfig.enabled === false) {
    return null;
  }

  const [activeStage, setActiveStage] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [workloadLevel, setWorkloadLevel] = useState(2); // 0: Idle, 1: Code, 2: 3D Render, 3: Full AI Load
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isXrayMode, setIsXrayMode] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const cardRef = useRef(null);
  const containerRef = useRef(null);

  const images = (product.images && product.images.length > 0) ? product.images : [product.image];

  // 4 Apple Storytelling Stages (Customizable by admin or auto-derived from hardware)
  const defaultStages = [
    {
      id: 'design',
      title: 'شاسی آلیاژی تیتانیوم و منیزیم',
      subtitle: 'استحکام فوق‌العاده در کلاسی متفاوت با مقاومت فیزیکی نظامی MIL-STD',
      tag: 'متریال هوافضا',
      icon: Layers,
      color: 'hsl(var(--accent-cyan))',
      imageIndex: 0,
      description: `شاسی مهندسی‌شده ${product.name} از ترکیب آلیاژ آلومینیوم تراش‌خورده CNC و منیزیم فشرده ساخته شده که وزن دستگاه را کنترل کرده و انتقال حرارت را به حداکثر می‌رساند.`
    },
    {
      id: 'display',
      title: 'نمایشگر فوق‌شفاف کالیبره‌شده',
      subtitle: 'وضوح استثنایی با پوشش ۱۰۰٪ فضای رنگی سینمایی و روشنایی عالی',
      tag: 'دقت رنگ ۱۰۰٪',
      icon: Monitor,
      color: 'hsl(var(--accent-purple))',
      imageIndex: (images.length > 1 ? 1 : 0),
      description: 'کالیبراسیون دقیق کارخانه‌ای برای طراحان گرافیک، ادیتورهای ویدیویی و مهندسان نقشه‌کشی؛ ضد بازتاب نور مستقیم و زاویه دید عریض ۱۷۸ درجه.'
    },
    {
      id: 'silicon',
      title: 'معماری سیلیکون و خنک‌کاری پیشرفته',
      subtitle: 'محفظه بخار مسی برای پایداری ۱۰۰٪ توان پردازشی بدون افت فرکانس',
      tag: 'خنک‌کننده Vapor Chamber',
      icon: Zap,
      color: 'hsl(var(--accent-green))',
      imageIndex: (images.length > 2 ? 2 : 0),
      description: `پردازنده ${product.shortSpecs?.cpu || 'نسل جدید'} در هماهنگی کامل با گرافیک ${product.shortSpecs?.gpu || 'اختصاصی'}، حتی در رندرهای مداوم شبانه‌روزی با دمای کنترل‌شده عمل می‌کند.`
    },
    {
      id: 'ergonomics',
      title: 'کیبورد ارگونومیک و ارتباطات همه‌جانبه',
      subtitle: 'درگاه‌های پرسرعت Thunderbolt 4 و حس بی‌نظیر تایپ',
      tag: 'پورت‌های نسل جدید',
      icon: HardDrive,
      color: '#ea580c',
      imageIndex: (images.length > 3 ? 3 : (images.length - 1)),
      description: 'مجموعه پورت‌های استاندارد بدون نیاز به دانگل اضافی شامل تاندربولت ۴، خروجی تصویری مستقیم HDMI و درگاه پرسرعت شبکه و کارت‌خوان SD.'
    }
  ];

  const stages = (customConfig?.stages && customConfig.stages.length >= 4)
    ? customConfig.stages.map((st, i) => ({
        ...st,
        icon: [Layers, Monitor, Zap, HardDrive][i % 4],
        color: ['hsl(var(--accent-cyan))', 'hsl(var(--accent-purple))', 'hsl(var(--accent-green))', '#ea580c'][i % 4]
      }))
    : defaultStages;

  // Interactive Hardware Hotspots
  const defaultHotspots = [
    { id: 'screen', top: '26%', left: '48%', title: 'پنل ضد انعکاس کالیبره', desc: `${product.shortSpecs?.display || 'نمایشگر استاندارد با زاویه دید عریض و تفکیک رنگ سینمایی'}` },
    { id: 'cooling', top: '64%', left: '28%', title: 'محفظه خنک‌کاری اتاق بخار (Vapor Chamber)', desc: 'خنک‌کاری مدار تغذیه و پردازنده با هیت‌پایپ‌های عریض مسی' },
    { id: 'keyboard', top: '72%', left: '52%', title: 'کیبورد ارگونومیک با نور پس‌زمینه', desc: 'عمق کلید بهینه با مکانیزم قیچی نرم و تایپ طولانی بدون خستگی' },
    { id: 'ports', top: '56%', left: '80%', title: 'درگاه‌های Thunderbolt 4', desc: 'انتقال داده با سرعت ۴۰ گیگابیت بر ثانیه و اتصال به مانیتورهای 8K' }
  ];

  const hotspots = (customConfig?.hotspots && customConfig.hotspots.length > 0)
    ? customConfig.hotspots
    : defaultHotspots;

  // Workload Simulation metrics
  const defaultWorkloads = [
    { label: 'آماده به کار (Idle)', temp: '34°C', fanRpm: '0 RPM (کامپکت و بی‌صدا)', power: '15W', status: 'خاموشی فن‌ها و حداکثر پایداری باتری' },
    { label: 'برنامه‌نویسی و وب (Coding)', temp: '42°C', fanRpm: '1400 RPM (زمزمه ملایم)', power: '38W', status: 'دمای خنک استراحتگاه مچ دست' },
    { label: 'رندرینگ سه‌بعدی و تدوین (3D Render)', temp: '68°C', fanRpm: '2800 RPM (تهویه بهینه)', power: '95W', status: 'حداکثر بازدهی فرکانس توربو بوست' },
    { label: 'شبیه‌سازی سنگین و AI (Full Load)', temp: '76°C', fanRpm: '3900 RPM (حداکثر توربو)', power: '140W', status: 'خنک‌کاری کامل توسط محفظه بخار بدون افت فریم' }
  ];

  const workloads = (customConfig?.workloads && customConfig.workloads.length === 4)
    ? customConfig.workloads
    : defaultWorkloads;

  // Direct manipulation 3D perspective tilt
  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -8,
      y: (x / (rect.width / 2)) * 8
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Auto-play timer for presentation mode
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStage(prev => (prev + 1) % stages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlaying, stages.length]);

  const currentStage = stages[activeStage] || stages[0];
  const activeImg = images[currentStage.imageIndex] || images[0] || product.image;
  const currentWorkload = workloads[workloadLevel] || workloads[0];

  return (
    <section 
      ref={containerRef}
      className="apple-showcase-container" 
      style={{ margin: '48px 0 64px', position: 'relative' }}
    >
      {/* Top Banner Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="badge badge-glow" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
            <Sparkles size={13} style={{ marginLeft: '5px' }} />
            کاوش تعاملی پرچمدار اپل‌استایل
          </span>
          {customConfig?.enabled && (
            <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.15)', color: 'hsl(var(--accent-purple))', fontSize: '0.72rem' }}>
              اختصاصی مدیر
            </span>
          )}
        </div>

        <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          مهندسی بی‌نقص، <span className="gradient-text">{product.name}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '640px', margin: '0 auto', lineHeight: '1.7' }}>
          برای آشنایی عمیق با معماری سخت‌افزار، لایه‌ها را ورق بزنید، اشعه ایکس سیستم خنک‌کاری را روشن کنید یا نقاط بررسی را لمس نمایید.
        </p>
      </div>

      {/* Main Interactive Stage Box */}
      <div 
        className="glass-card"
        style={{
          borderRadius: '28px',
          padding: 'clamp(20px, 3.5vw, 40px)',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, var(--glass-card-bg) 0%, rgba(248, 250, 252, 0.8) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Stages Navigation Bar with Auto-Play & Scroller */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingBottom: '14px', marginBottom: '28px', borderBottom: '1px solid var(--border-glass)' }}>
          {/* Stage Buttons */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexGrow: 1 }}>
            {stages.map((st, idx) => {
              const Icon = st.icon;
              const isActive = activeStage === idx;
              return (
                <button
                  key={st.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveStage(idx);
                    setActiveHotspot(null);
                  }}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-glass'}`}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '12px',
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 700 : 500,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                    transition: 'transform 140ms ease'
                  }}
                >
                  <Icon size={15} color={isActive ? '#fff' : st.color} />
                  <span>{st.title}</span>
                  <span className="badge" style={{ 
                    background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.06)', 
                    color: isActive ? '#fff' : 'var(--text-secondary)', 
                    fontSize: '0.675rem',
                    padding: '1px 6px'
                  }}>
                    {st.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Interactive Toggles (Auto-Play & X-Ray Mode) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {/* X-Ray Vision Mode */}
            <button
              type="button"
              onClick={() => setIsXrayMode(!isXrayMode)}
              className="btn btn-glass"
              style={{
                padding: '8px 14px',
                fontSize: '0.78rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: isXrayMode ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                background: isXrayMode ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
                color: isXrayMode ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'
              }}
              title="مشاهده شبیه‌سازی ساختار داخلی و مدار خنک‌کننده"
            >
              <Flame size={14} color={isXrayMode ? 'hsl(var(--accent-cyan))' : 'currentColor'} />
              <span>{isXrayMode ? 'نمای اشعه ایکس: فعال' : 'نمای اشعه ایکس'}</span>
            </button>

            {/* Auto Play Presentation */}
            <button
              type="button"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="btn btn-glass"
              style={{
                padding: '8px 12px',
                fontSize: '0.78rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isAutoPlaying ? 'hsl(var(--accent-purple))' : 'var(--text-secondary)'
              }}
              title={isAutoPlaying ? 'توقف نمایش خودکار' : 'پخش خودکار مراحل اپل'}
            >
              {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isAutoPlaying ? 'توقف' : 'پخش خودکار'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Left Visual Card + Right Interactive Inspector */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '36px', alignItems: 'center' }}>
          
          {/* Visual Showcase with 3D Tilt & Hotspots */}
          <div 
            ref={cardRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={handlePointerLeave}
            style={{
              position: 'relative',
              borderRadius: '20px',
              padding: '28px 20px',
              background: isXrayMode
                ? 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.22) 0%, rgba(15, 23, 42, 0.95) 80%)'
                : 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 80%)',
              border: isXrayMode ? '1px solid hsl(var(--accent-cyan))' : '1px solid var(--border-glass)',
              transform: isHovered 
                ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
                : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: isHovered ? 'transform 80ms ease-out' : 'transform 400ms var(--ease-out)',
              cursor: 'crosshair',
              overflow: 'hidden'
            }}
          >
            {/* Ambient Shimmer Line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: `linear-gradient(90deg, transparent, ${currentStage.color}, transparent)`
            }} />

            {/* Laptop Image (Normal or X-Ray internal filter) */}
            <div style={{ position: 'relative', width: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={activeImg} 
                alt={product.name}
                style={{
                  width: '100%',
                  maxHeight: '340px',
                  aspectRatio: '16/10',
                  objectFit: 'contain',
                  display: 'block',
                  filter: isXrayMode 
                    ? 'invert(0.9) hue-rotate(185deg) contrast(1.4) drop-shadow(0 0 25px rgba(56, 189, 248, 0.8))'
                    : 'drop-shadow(0 20px 30px rgba(0,0,0,0.14))',
                  transition: 'filter 350ms ease, opacity 240ms ease-out'
                }}
              />

              {/* X-Ray Heat Dissipation Overlay Graphics */}
              {isXrayMode && (
                <div 
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '60%',
                    height: '35%',
                    border: '1.5px dashed hsl(var(--accent-cyan))',
                    borderRadius: '12px',
                    background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.3) 0%, rgba(56, 189, 248, 0.1) 70%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 0 30px rgba(56, 189, 248, 0.5)'
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>
                      ⚡ VAPOR CHAMBER COOLING MATRIX
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--accent-cyan))', marginTop: '2px' }}>
                      دمای چیپ: {currentWorkload.temp} | چرخش فن: {currentWorkload.fanRpm}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Hotspot Dots */}
            {hotspots.map((h) => {
              const isSelected = activeHotspot === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setActiveHotspot(isSelected ? null : h.id)}
                  style={{
                    position: 'absolute',
                    top: h.top,
                    left: h.left,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isSelected ? 'hsl(var(--accent-cyan))' : 'rgba(255, 255, 255, 0.92)',
                    border: '2px solid hsl(var(--accent-cyan))',
                    boxShadow: '0 0 16px rgba(56, 189, 248, 0.75)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 4,
                    transition: 'transform 180ms ease'
                  }}
                  title={h.title}
                >
                  {/* Radar Ripple Animation Ring */}
                  <span style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: '1.5px solid hsl(var(--accent-cyan))',
                    opacity: 0.7,
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }} />
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: isSelected ? '#fff' : 'hsl(var(--accent-cyan))' 
                  }} />
                </button>
              );
            })}

            {/* Active Hotspot Bubble Pill */}
            {activeHotspot && (() => {
              const h = hotspots.find(item => item.id === activeHotspot);
              if (!h) return null;
              return (
                <div 
                  className="glass-panel animate-fade-in"
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid hsl(var(--accent-cyan))',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                    zIndex: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Radio size={14} color="hsl(var(--accent-cyan))" />
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'hsl(var(--accent-cyan))' }}>
                        {h.title}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveHotspot(null)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '2px 6px' }}
                    >
                      ✕ بستن
                    </button>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {h.desc}
                  </div>
                </div>
              );
            })()}

            {/* Mode Indicator Badges */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px' }}>
              <span className="badge" style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.7rem' }}>
                نمای ۳D تعاملی
              </span>
              {isXrayMode && (
                <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#fff', fontSize: '0.7rem' }}>
                  X-Ray Circuit
                </span>
              )}
            </div>
          </div>

          {/* Right Inspector Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))' }}>
                بخش {activeStage + 1} از {stages.length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {currentStage.tag}
              </span>
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 850, margin: '0 0 10px', letterSpacing: '-0.4px' }}>
              {currentStage.title}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '20px' }}>
              {currentStage.description}
            </p>

            {/* Hardware Specs Micro Bento */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  پردازنده سیلیکونی
                </div>
                <div className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 700, direction: 'ltr', textAlign: 'left' }}>
                  {product.shortSpecs?.cpu || 'Core i7'}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  گرافیک رندرینگ
                </div>
                <div className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 700, direction: 'ltr', textAlign: 'left' }}>
                  {product.shortSpecs?.gpu || 'NVIDIA RTX'}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  حافظه و ذخیره‌سازی
                </div>
                <div className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 700, direction: 'ltr', textAlign: 'left' }}>
                  {product.shortSpecs?.ram} | {product.shortSpecs?.storage}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  متریال شاسی
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {product.shortSpecs?.chassis || 'آلیاژ فلزی'}
                </div>
              </div>
            </div>

            {/* Live Silicon & Thermal Load Simulator */}
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700 }}>
                  <Activity size={15} color="hsl(var(--accent-purple))" />
                  <span>شبیه‌ساز بار پردازشی و دمای کاری:</span>
                </div>
                <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.15)', color: 'hsl(var(--accent-purple))', fontSize: '0.72rem' }}>
                  {currentWorkload.label}
                </span>
              </div>

              {/* Slider Input */}
              <input 
                type="range"
                min="0"
                max="3"
                step="1"
                value={workloadLevel}
                onChange={(e) => setWorkloadLevel(Number(e.target.value))}
                style={{ width: '100%', marginBottom: '12px', accentColor: 'hsl(var(--accent-purple))', cursor: 'pointer' }}
                aria-label="شبیه‌ساز بار پردازشی"
              />

              {/* Real-time Simulated Gauges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Thermometer size={14} color="#ea580c" />
                  <span>دما:</span>
                  <strong className="font-tech" style={{ color: '#ea580c' }}>{currentWorkload.temp}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wind size={14} color="hsl(var(--accent-cyan))" />
                  <span>فن:</span>
                  <strong className="font-tech" style={{ color: 'hsl(var(--accent-cyan))' }}>{currentWorkload.fanRpm}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={14} color="hsl(var(--accent-green))" />
                  <span>توان:</span>
                  <strong className="font-tech" style={{ color: 'hsl(var(--accent-green))' }}>{currentWorkload.power}</strong>
                </div>
              </div>

              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {currentWorkload.status}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onAddToCart && onAddToCart(product)}
                style={{ flexGrow: 1, padding: '12px 20px', fontSize: '0.925rem' }}
              >
                خرید لپ‌تاپ ({formatPrice(product.basePrice)})
              </button>

              <button
                type="button"
                className="btn btn-glass"
                onClick={() => onSelectProduct && onSelectProduct(product.slug)}
                style={{ padding: '12px 18px', fontSize: '0.875rem' }}
              >
                مشاهده صفحه کامل <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
