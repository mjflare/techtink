import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, Cpu, Zap, Layers, Monitor, HardDrive, 
  ShieldCheck, ChevronRight, ChevronLeft, ShoppingBag, 
  ArrowDown, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function AppleFlagshipShowcase({ product, onSelectProduct, onAddToCart }) {
  if (!product) return null;

  const customConfig = product.specs?.flagshipShowcase || product.flagshipShowcase;
  if (customConfig && customConfig.enabled === false) {
    return null;
  }

  const trackRef = useRef(null);
  const cardRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const isJumpingRef = useRef(false);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : ['/assets/laptop-placeholder.png']);

  // 4 Pristine Apple Storytelling Chapters
  const defaultStages = [
    {
      id: 'chassis',
      number: '۰۱',
      title: 'شاسی آلیاژی تیتانیوم و منیزیم',
      subtitle: 'استحکام مهندسی با استاندارد نظامی MIL-STD 810H در نهایت ظرافت',
      tag: 'متریال هوافضا',
      icon: Layers,
      color: 'hsl(var(--accent-cyan))',
      imageIndex: 0,
      description: `بدنه مهندسی‌شده ${product.name} از ترکیب آلیاژ آلومینیوم تراش‌خورده CNC و منیزیم فشرده طراحی شده است؛ ترکیبی که ضمن تضمین استحکام فوق‌العاده در برابر ضربه و خمش، انتقال حرارت را به بالاترین سطح می‌رساند.`,
      callouts: [
        {
          title: 'آلیاژ مستحکم CNC',
          desc: 'ماشین‌کاری فوق‌دقیق با مقاومت ساختاری MIL-STD',
          align: 'top-right'
        },
        {
          title: 'پوشش مات آنودایز',
          desc: 'مقاومت پایدار در برابر جذب چربی دست و خط و خش',
          align: 'bottom-left'
        }
      ]
    },
    {
      id: 'display',
      number: '۰۲',
      title: 'نمایشگر فوق‌شفاف کالیبره‌شده',
      subtitle: 'تفکیک رنگ سینمایی ۱۰۰٪ با روشنایی فوق‌العاده و وضوح کریستالی',
      tag: 'دقت رنگ ۱۰۰٪',
      icon: Monitor,
      color: 'hsl(var(--accent-purple))',
      imageIndex: (images.length > 1 ? 1 : 0),
      description: `پنل کالیبره‌شده کارخانه‌ای با زاویه دید عریض ۱۷۸ درجه، پوشش کامل طیف رنگی سینمایی و روشنایی عالی برای ادیتورهای ویدیویی حرفه‌ای، طراحان گرافیک و کدنویسی طولانی‌مدت بدون ایجاد خستگی چشم.`,
      callouts: [
        {
          title: 'کالیبراسیون دقیق ۱۰۰٪ DCI-P3',
          desc: 'رنگ‌های زنده با استاندارد صنعتی فیلم و تصویر',
          align: 'top-left'
        },
        {
          title: 'پوشش ضد بازتاب پیشرفته',
          desc: 'وضوح بی‌نقص حتی در تابش مستقیم نور طبیعی',
          align: 'bottom-right'
        }
      ]
    },
    {
      id: 'silicon',
      number: '۰۳',
      title: 'معماری سیلیکونی و توان پیوسته',
      subtitle: 'پایداری ۱۰۰٪ فرکانس توربو بوست بدون افت فریم در سنگین‌ترین پردازش‌ها',
      tag: 'معماری سیلیکون',
      icon: Zap,
      color: 'hsl(var(--accent-green))',
      imageIndex: (images.length > 2 ? 2 : 0),
      description: `هماهنگی یکپارچه پردازنده ${product.shortSpecs?.cpu || 'نسل جدید'} در کنار پردازشگر گرافیکی ${product.shortSpecs?.gpu || 'پیشرفته'}، حداکثر بازدهی را حتی در خروجی‌های سنگین و پردازش‌های شبانه‌روزی تضمین می‌کند.`,
      callouts: [
        {
          title: 'پایداری ۱۰۰٪ فرکانس بوست',
          desc: 'حفظ اوج عملکرد پردازنده در رندرهای چندساعته',
          align: 'top-right'
        },
        {
          title: 'شتاب‌دهنده سخت‌افزاری AI',
          desc: 'پاسخ‌دهی آنی به بارهای کاری نسل جدید',
          align: 'bottom-left'
        }
      ]
    },
    {
      id: 'connectivity',
      number: '۰۴',
      title: 'درگاه‌های مدرن و کیبورد ارگونومیک',
      subtitle: 'سرعت اتصال Thunderbolt 4 بدون نیاز به حمل دانگل و حس بی‌نظیر تایپ',
      tag: 'ارتباطات و ارگونومی',
      icon: HardDrive,
      color: '#ea580c',
      imageIndex: (images.length > 3 ? 3 : (images.length - 1)),
      description: 'مجموعه کاملی از درگاه‌های نسل جدید تاندربولت ۴، خروجی تصویری مستقیم با کیفیت 8K و شیار کارت‌خوان در کنار کیبورد کم‌صدا با نور پس‌زمینه یکدست و حس تایپ استثنایی.',
      callouts: [
        {
          title: 'درگاه‌های Thunderbolt 4 پرسرعت',
          desc: 'انتقال سریع ۴۰ گیگابیت بر ثانیه و اتصال مستقیم مانیتور',
          align: 'top-left'
        },
        {
          title: 'کیبورد ارگونومیک کم‌صدا',
          desc: 'عمق کلید بهینه با بازخورد لمسی دقیق و دلنشین',
          align: 'bottom-right'
        }
      ]
    }
  ];

  // Merge admin stages if present
  const stages = (customConfig?.stages && customConfig.stages.length >= 4)
    ? customConfig.stages.map((st, i) => ({
        ...st,
        number: `۰${i + 1}`,
        icon: [Layers, Monitor, Zap, HardDrive][i % 4],
        color: ['hsl(var(--accent-cyan))', 'hsl(var(--accent-purple))', 'hsl(var(--accent-green))', '#ea580c'][i % 4],
        callouts: defaultStages[i % 4].callouts
      }))
    : defaultStages;

  // Visual 3D perspective choreography for each chapter
  const stageTransforms = [
    { scale: 1.02, rotateY: -10, rotateX: 6, translateY: -6, glow: 'rgba(56, 189, 248, 0.16)' },
    { scale: 1.06, rotateY: 0, rotateX: 2, translateY: -12, glow: 'rgba(168, 85, 247, 0.20)' },
    { scale: 1.03, rotateY: 12, rotateX: 6, translateY: -6, glow: 'rgba(16, 185, 129, 0.20)' },
    { scale: 1.0, rotateY: -6, rotateX: 12, translateY: 0, glow: 'rgba(234, 88, 12, 0.16)' }
  ];

  // Scroll Tracking Engine
  useEffect(() => {
    let animationFrameId;

    const onScrollOrResize = () => {
      if (isJumpingRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalScrollable = rect.height - viewportHeight;

      if (totalScrollable > 50) {
        // When top of track hits 80px from top of viewport, progress starts
        const startOffset = 80;
        const scrolled = -(rect.top - startOffset);
        const rawProgress = scrolled / totalScrollable;
        const clamped = Math.max(0, Math.min(1, rawProgress));
        targetProgressRef.current = clamped;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    onScrollOrResize();

    // Silky lerp loop for smooth scrub interpolation
    const tick = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0006) {
        currentProgressRef.current += diff * 0.14;
        const p = currentProgressRef.current;
        setScrollProgress(p);

        // Derive active stage
        const nextStage = Math.min(stages.length - 1, Math.max(0, Math.floor(p * stages.length)));
        setActiveStage(nextStage);
      }
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [stages.length]);

  // Jump to specific chapter smoothly
  const handleJumpToStage = useCallback((index) => {
    isJumpingRef.current = true;
    setActiveStage(index);
    const targetP = (index + 0.5) / stages.length;
    targetProgressRef.current = targetP;
    currentProgressRef.current = targetP;
    setScrollProgress(targetP);

    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalScrollable = rect.height - viewportHeight;
      if (totalScrollable > 50) {
        const targetScrollY = window.scrollY + rect.top - 80 + (targetP * totalScrollable);
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    }

    setTimeout(() => {
      isJumpingRef.current = false;
    }, 600);
  }, [stages.length]);

  // Tactile Mouse Parallax
  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -5,
      y: (x / (rect.width / 2)) * 6
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Mobile Touch Swiping
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0 && activeStage < stages.length - 1) {
        handleJumpToStage(activeStage + 1);
      } else if (deltaX > 0 && activeStage > 0) {
        handleJumpToStage(activeStage - 1);
      }
    }
    setTouchStartX(null);
  };

  const currentStage = stages[activeStage] || stages[0];
  const activeTransform = stageTransforms[activeStage] || stageTransforms[0];
  const activeImg = images[currentStage.imageIndex] || images[0] || product.image;

  return (
    <div 
      ref={trackRef}
      className="apple-showcase-track"
      style={{
        position: 'relative',
        minHeight: '260vh',
        margin: '24px 0 60px'
      }}
    >
      {/* Sticky Stage Viewport */}
      <div 
        className="apple-showcase-sticky"
        style={{
          position: 'sticky',
          top: '76px',
          height: 'calc(100vh - 90px)',
          minHeight: '620px',
          maxHeight: '940px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: '28px',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 249, 252, 0.94) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          boxShadow: '0 30px 70px -20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          padding: 'clamp(18px, 2.5vw, 32px)',
          zIndex: 10,
          contain: 'layout style'
        }}
      >
        {/* Top Header & Chapter Pill Controller */}
        <div>
          {/* Top Title Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-glow" style={{ fontSize: '0.78rem', padding: '4px 12px', fontWeight: 700 }}>
                <Sparkles size={13} style={{ marginLeft: '5px' }} />
                شوکیس بازاریابی پرچمدار اپل‌استایل
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                فصل {currentStage.number} از ۰۴
              </span>
            </div>

            {/* Next/Prev Chapter Step Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleJumpToStage(Math.max(0, activeStage - 1))}
                disabled={activeStage === 0}
                className="btn btn-glass"
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  opacity: activeStage === 0 ? 0.4 : 1,
                  cursor: activeStage === 0 ? 'not-allowed' : 'pointer'
                }}
                title="فصل قبلی"
              >
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleJumpToStage(Math.min(stages.length - 1, activeStage + 1))}
                disabled={activeStage === stages.length - 1}
                className="btn btn-glass"
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  opacity: activeStage === stages.length - 1 ? 0.4 : 1,
                  cursor: activeStage === stages.length - 1 ? 'not-allowed' : 'pointer'
                }}
                title="فصل بعدی"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          </div>

          {/* Chapter Scrubber Segmented Bar */}
          <div 
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.03)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid var(--border-glass)',
              overflowX: 'auto',
              position: 'relative'
            }}
          >
            {stages.map((st, idx) => {
              const Icon = st.icon;
              const isActive = activeStage === idx;
              return (
                <button
                  key={st.id || idx}
                  type="button"
                  onClick={() => handleJumpToStage(idx)}
                  style={{
                    flex: '1 1 0',
                    minWidth: '120px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? '#ffffff' : 'transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 800 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 200ms ease'
                  }}
                >
                  <Icon size={14} color={isActive ? st.color : 'currentColor'} />
                  <span>{st.number}. {st.title.split(' ')[0]} {st.title.split(' ')[1] || ''}</span>
                </button>
              );
            })}
          </div>

          {/* Hairline Scroll Progress Bar */}
          <div style={{ height: '3px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
            <div 
              style={{
                height: '100%',
                width: `${Math.round(scrollProgress * 100)}%`,
                background: `linear-gradient(90deg, hsl(var(--accent-cyan)), ${currentStage.color})`,
                transition: 'width 80ms ease-out'
              }}
            />
          </div>
        </div>

        {/* Center Stage: 2-Column Responsive Grid */}
        <div 
          style={{
            flex: '1 1 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'clamp(20px, 3.5vw, 48px)',
            alignItems: 'center',
            margin: '12px 0',
            overflow: 'hidden'
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left Column: Visual Hardware Showcase with 3D Perspective */}
          <div
            ref={cardRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={handlePointerLeave}
            style={{
              position: 'relative',
              borderRadius: '24px',
              padding: 'clamp(20px, 4vw, 40px)',
              background: `radial-gradient(ellipse at 50% 50%, ${activeTransform.glow} 0%, rgba(248, 250, 252, 0) 75%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '280px',
              maxHeight: '440px',
              userSelect: 'none'
            }}
          >
            {/* The Hardware Product Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '460px',
                transform: isHovered
                  ? `perspective(1000px) rotateX(${activeTransform.rotateX + tilt.x}deg) rotateY(${activeTransform.rotateY + tilt.y}deg) translateY(${activeTransform.translateY}px) scale3d(${activeTransform.scale * 1.02}, ${activeTransform.scale * 1.02}, 1.02)`
                  : `perspective(1000px) rotateX(${activeTransform.rotateX}deg) rotateY(${activeTransform.rotateY}deg) translateY(${activeTransform.translateY}px) scale3d(${activeTransform.scale}, ${activeTransform.scale}, 1)`,
                transition: isHovered ? 'transform 90ms ease-out' : 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={activeImg}
                alt={product.name}
                style={{
                  width: '100%',
                  maxHeight: '360px',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.14))',
                  transition: 'opacity 250ms ease-out'
                }}
              />
            </div>

            {/* Pristine Floating Feature Callouts */}
            {currentStage.callouts && currentStage.callouts.map((callout, cIdx) => {
              const isTop = callout.align.includes('top');
              const isRight = callout.align.includes('right');
              return (
                <div
                  key={cIdx}
                  className="apple-showcase-callout animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: isTop ? '12%' : 'auto',
                    bottom: !isTop ? '12%' : 'auto',
                    right: isRight ? '4%' : 'auto',
                    left: !isRight ? '4%' : 'auto',
                    maxWidth: '240px',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.94)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    zIndex: 4,
                    pointerEvents: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span 
                      style={{ 
                        width: '7px', 
                        height: '7px', 
                        borderRadius: '50%', 
                        background: currentStage.color,
                        boxShadow: `0 0 8px ${currentStage.color}` 
                      }} 
                    />
                    <strong style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {callout.title}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {callout.desc}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Pristine Marketing Storytelling & Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Stage Badge & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span 
                className="badge" 
                style={{ 
                  background: `hsla(var(--accent-cyan), 0.12)`, 
                  color: currentStage.color,
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}
              >
                {currentStage.tag}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                استاندارد کلاس پرچمدار
              </span>
            </div>

            <h3 
              style={{ 
                fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)', 
                fontWeight: 900, 
                lineHeight: 1.3, 
                margin: '0 0 10px',
                letterSpacing: '-0.3px',
                color: 'var(--text-primary)'
              }}
            >
              {currentStage.title}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', margin: '0 0 20px' }}>
              {currentStage.description}
            </p>

            {/* Pristine Hardware Bento Specs Grid */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                marginBottom: '22px'
              }}
            >
              {/* CPU Box */}
              <div 
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={13} color="hsl(var(--accent-cyan))" />
                  <span>پردازنده سیلیکونی</span>
                </div>
                <div className="font-tech" style={{ fontSize: '0.875rem', fontWeight: 800, direction: 'ltr', textAlign: 'left', color: 'var(--text-primary)' }}>
                  {product.shortSpecs?.cpu || 'Core i7 / Ultra 7'}
                </div>
              </div>

              {/* GPU Box */}
              <div 
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={13} color="hsl(var(--accent-green))" />
                  <span>پردازشگر گرافیکی</span>
                </div>
                <div className="font-tech" style={{ fontSize: '0.875rem', fontWeight: 800, direction: 'ltr', textAlign: 'left', color: 'var(--text-primary)' }}>
                  {product.shortSpecs?.gpu || 'NVIDIA RTX'}
                </div>
              </div>

              {/* Memory / Storage Box */}
              <div 
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HardDrive size={13} color="#ea580c" />
                  <span>حافظه و ذخیره‌سازی</span>
                </div>
                <div className="font-tech" style={{ fontSize: '0.875rem', fontWeight: 800, direction: 'ltr', textAlign: 'left', color: 'var(--text-primary)' }}>
                  {product.shortSpecs?.ram || '16GB'} | {product.shortSpecs?.storage || '512GB SSD'}
                </div>
              </div>

              {/* Chassis / Material Box */}
              <div 
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} color="hsl(var(--accent-purple))" />
                  <span>متریال و شاسی</span>
                </div>
                <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {product.shortSpecs?.chassis || 'آلیاژ منیزیم و آلومینیوم'}
                </div>
              </div>
            </div>

            {/* Direct Action CTAs */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onAddToCart && onAddToCart(product)}
                style={{
                  flexGrow: 1,
                  padding: '12px 20px',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ShoppingBag size={17} />
                <span>سفارش لپ‌تاپ ({formatPrice(product.basePrice)})</span>
              </button>

              <button
                type="button"
                className="btn btn-glass"
                onClick={() => onSelectProduct && onSelectProduct(product.slug)}
                style={{
                  padding: '12px 18px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>مشاهده مشخصات کامل</span>
                <ChevronLeft size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Helper Bar: Scroll Indicator Tip */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-glass)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowDown size={13} color="hsl(var(--accent-cyan))" />
            <span>با اسکرول کردن به پایین، فصل‌های بعدی مهندسی پرچمدار نمایش داده می‌شوند.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} color="hsl(var(--accent-green))" />
            <span>تضمین اصالت ۱۰۰٪ فابریک تک‌تینک</span>
          </div>
        </div>
      </div>
    </div>
  );
}
