import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, Zap, Layers, Monitor, HardDrive, 
  ChevronRight, ChevronLeft, ShoppingBag, 
  ArrowDown, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import { getHardwareBadges, getShortSpecs } from '../utils/shortSpecs.js';
import { handleImageError } from '../utils/imageFallback.js';

export default function AppleFlagshipShowcase({ product, onSelectProduct, onAddToCart }) {
  if (!product) return null;

  const customConfig = product.specs?.flagshipShowcase || product.flagshipShowcase;
  if (customConfig && customConfig.enabled === false) {
    return null;
  }

  const trackRef = useRef(null);
  const stageRef = useRef(null);
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

  const hardwareBadges = getHardwareBadges(product);
  const derivedShortSpecs = getShortSpecs(product);
  const cpuDisplay = derivedShortSpecs.cpu || product.shortSpecs?.cpu || hardwareBadges.cpuBadge;
  const gpuDisplay = derivedShortSpecs.gpu || product.shortSpecs?.gpu || hardwareBadges.gpuBadge;

  // 4 Pristine Apple Storytelling Chapters with Focused Hero Stats
  const defaultStages = [
    {
      id: 'chassis',
      number: '۰۱',
      category: 'شاسی و متریال',
      shortTitle: 'شاسی و متریال',
      title: 'شاسی تمام‌آلیاژی؛ تلفیق ظرافت و استحکام نظامی',
      tag: 'متریال هوافضا',
      icon: Layers,
      color: '#0284c7',
      glow: 'rgba(56, 189, 248, 0.22)',
      ambientShadow: 'rgba(56, 189, 248, 0.16)',
      imageIndex: 0,
      heroStat: {
        value: 'MIL-STD 810H',
        label: 'مقاومت ساختاری منطبق بر استاندارد نظامی',
        sublabel: 'آلیاژ ماشین‌کاری CNC با پوشش مات آنودایز ضدلک و چربی'
      },
      description: `بدنه مهندسی‌شده ${product.name} از آلیاژ آلومینیوم و منیزیم فشرده تراش خورده است؛ ترکیبی که ضمن تضمین استحکام فوق‌العاده در برابر ضربه و خمش، انتقال حرارت را به بالاترین سطح رسانده و حس لمس بی‌نظیری دارد.`,
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
      category: 'نمایشگر کریستالی',
      shortTitle: 'نمایشگر کریستالی',
      title: 'نمایشگر فوق‌شفاف؛ عمق رنگ سینمایی و وضوح کریستالی',
      tag: 'دقت رنگ ۱۰۰٪',
      icon: Monitor,
      color: '#9333ea',
      glow: 'rgba(168, 85, 247, 0.24)',
      ambientShadow: 'rgba(168, 85, 247, 0.16)',
      imageIndex: (images.length > 1 ? 1 : 0),
      heroStat: {
        value: '100% DCI-P3',
        label: 'کالیبراسیون صنعتی با تفکیک دقیق ۱ میلیارد رنگ',
        sublabel: 'پنل کالیبره کارخانه‌ای با زاویه دید ۱۷۸ درجه و پوشش ضدبازتاب'
      },
      description: `پنل کالیبره‌شده کارخانه‌ای با پوشش کامل طیف رنگی سینمایی و روشنایی عالی؛ طراحی‌شده برای ادیتورهای ویدیویی حرفه‌ای، طراحان گرافیک و برنامه‌نویسان جهت کار مداوم بدون خستگی چشم.`,
      callouts: [
        {
          title: 'کالیبراسیون ۱۰۰٪ DCI-P3',
          desc: 'تفکیک دقیق رنگ‌های زنده بر اساس استانداردهای سینمایی',
          align: 'top-left'
        },
        {
          title: 'پوشش ضد بازتاب نوری',
          desc: 'وضوح کریستالی بدون ایجاد خستگی چشم در محیط‌های پرنور',
          align: 'bottom-right'
        }
      ]
    },
    {
      id: 'silicon',
      number: '۰۳',
      category: 'توان پردازشی',
      shortTitle: 'توان پردازشی',
      title: 'معماری سیلیکونی نسل جدید؛ پایداری اوج کلاک',
      tag: 'توان پیوسته توربو',
      icon: Zap,
      color: '#059669',
      glow: 'rgba(16, 185, 129, 0.24)',
      ambientShadow: 'rgba(16, 185, 129, 0.16)',
      imageIndex: (images.length > 2 ? 2 : 0),
      heroStat: {
        value: '100% Turbo',
        label: 'پایداری پیوسته فرکانس کاری تحت سنگین‌ترین بارها',
        sublabel: `${cpuDisplay} در کنار پردازشگر گرافیکی ${gpuDisplay}`
      },
      description: `هماهنگی یکپارچه پردازنده اختصاصی و هسته‌های گرافیکی قدرتمند، عملکردی خیره‌کننده و کم‌مصرف را در رندرهای سه‌بعدی، مدل‌های هوش مصنوعی و اجرای نرم‌افزارهای سنگین تضمین می‌کند.`,
      callouts: [
        {
          title: 'پایداری ۱۰۰٪ فرکانس بوست',
          desc: 'حفظ اوج عملکرد پردازنده در رندرهای چندساعته بدون افت کلاک',
          align: 'top-right'
        },
        {
          title: 'شتاب‌دهنده سخت‌افزاری AI',
          desc: 'پاسخ‌دهی آنی به پردازش بارهای کاری نسل جدید هوش مصنوعی',
          align: 'bottom-left'
        }
      ]
    },
    {
      id: 'connectivity',
      number: '۰۴',
      category: 'درگاه‌ها و کیبورد',
      shortTitle: 'درگاه‌ها و کیبورد',
      title: 'درگاه‌های مدرن و کیبورد ارگونومیک بی‌صدا',
      tag: 'ارتباطات نسل ۴',
      icon: HardDrive,
      color: '#ea580c',
      glow: 'rgba(234, 88, 12, 0.22)',
      ambientShadow: 'rgba(234, 88, 12, 0.16)',
      imageIndex: (images.length > 3 ? 3 : (images.length - 1)),
      heroStat: {
        value: '40 Gbps',
        label: 'پهنای باند دوطرفه درگاه پرسرعت Thunderbolt 4',
        sublabel: 'انتقال سریع فایل‌های حجیم، خروجی مستقیم 8K و شارژ سریع PD'
      },
      description: `مجموعه کاملی از درگاه‌های نسل جدید تاندربولت ۴، خروجی تصویر مستقیم 8K و شیار کارت حافظه؛ در کنار کیبورد مهندسی‌شده با صدای کلیک بسیار کم و نور پس‌زمینه یکدست برای لذت واقعی تایپ.`,
      callouts: [
        {
          title: 'تاندربولت ۴ پرسرعت (۴۰Gbps)',
          desc: 'انتقال فوق‌سریع داده‌ها و اتصال مستقیم مانیتورهای وضوح بالا',
          align: 'top-left'
        },
        {
          title: 'کیبورد ارگونومیک کم‌صدا',
          desc: 'عمق حرکت بهینه کلیدها با بازخورد لمسی دقیق و دلنشین',
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
        category: defaultStages[i % 4].category,
        shortTitle: defaultStages[i % 4].shortTitle,
        icon: [Layers, Monitor, Zap, HardDrive][i % 4],
        color: ['#0284c7', '#9333ea', '#059669', '#ea580c'][i % 4],
        glow: ['rgba(56, 189, 248, 0.22)', 'rgba(168, 85, 247, 0.24)', 'rgba(16, 185, 129, 0.24)', 'rgba(234, 88, 12, 0.22)'][i % 4],
        ambientShadow: ['rgba(56, 189, 248, 0.16)', 'rgba(168, 85, 247, 0.16)', 'rgba(16, 185, 129, 0.16)', 'rgba(234, 88, 12, 0.16)'][i % 4],
        heroStat: defaultStages[i % 4].heroStat,
        callouts: defaultStages[i % 4].callouts
      }))
    : defaultStages;

  // Visual 3D perspective choreography for each chapter
  const stageTransforms = [
    { scale: 1.02, rotateY: -8, rotateX: 5, translateY: -4 },
    { scale: 1.05, rotateY: 0, rotateX: 2, translateY: -10 },
    { scale: 1.03, rotateY: 8, rotateX: 4, translateY: -6 },
    { scale: 1.01, rotateY: -5, rotateX: 8, translateY: 0 }
  ];

  // Scroll Tracking Engine
  useEffect(() => {
    let animationFrameId;

    const onScrollOrResize = () => {
      if (isJumpingRef.current || !trackRef.current || !stageRef.current) return;
      const stageEl = stageRef.current;
      const trackEl = trackRef.current;

      const stageRect = stageEl.getBoundingClientRect();
      const trackRect = trackEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // The vertical center position where the stage sticks
      const stickyTop = Math.max(16, (viewportHeight - stageRect.height) / 2);
      const scrolled = stickyTop - trackRect.top;
      const maxScroll = trackRect.height - stageRect.height;

      if (maxScroll > 50) {
        const rawProgress = scrolled / maxScroll;
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
      if (Math.abs(diff) > 0.0005) {
        currentProgressRef.current += diff * 0.15;
        const p = currentProgressRef.current;
        setScrollProgress(p);

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

    if (trackRef.current && stageRef.current) {
      const stageRect = stageRef.current.getBoundingClientRect();
      const trackRect = trackRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const stickyTop = Math.max(16, (viewportHeight - stageRect.height) / 2);
      const maxScroll = trackRect.height - stageRect.height;

      if (maxScroll > 50) {
        const targetScrollY = window.scrollY + (trackRect.top - stickyTop) + (targetP * maxScroll);
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    }

    setTimeout(() => {
      isJumpingRef.current = false;
    }, 600);
  }, [stages.length]);

  // Center lock wheel listener: smoothly advances chapters while user is over the showcase
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const handleWheel = (e) => {
      const p = currentProgressRef.current;
      const delta = e.deltaY;

      // Scrolling down and animation is not yet complete:
      if (delta > 0 && p < 0.97) {
        e.preventDefault();
        const step = (delta / 420) * 0.12;
        targetProgressRef.current = Math.min(1.0, targetProgressRef.current + Math.max(0.018, step));
        window.scrollBy({ top: Math.min(100, Math.max(25, delta * 0.6)), behavior: 'auto' });
      }
      // Scrolling up and animation is not at the start:
      else if (delta < 0 && p > 0.03) {
        e.preventDefault();
        const step = (Math.abs(delta) / 420) * 0.12;
        targetProgressRef.current = Math.max(0.0, targetProgressRef.current - Math.max(0.018, step));
        window.scrollBy({ top: -Math.min(100, Math.max(25, Math.abs(delta) * 0.6)), behavior: 'auto' });
      }
    };

    stageEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      stageEl.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Instant skip past the showcase
  const handleSkipShowcase = useCallback(() => {
    targetProgressRef.current = 1.0;
    currentProgressRef.current = 1.0;
    setScrollProgress(1.0);
    setActiveStage(stages.length - 1);
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const targetScrollY = window.scrollY + trackRect.bottom - 40;
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }
  }, [stages.length]);

  // Smooth scroll to full specs table below
  const handleScrollToSpecs = useCallback(() => {
    const specsEl = document.getElementById('product-specs-section');
    if (specsEl) {
      specsEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleSkipShowcase();
    }
  }, [handleSkipShowcase]);

  // Tactile Mouse Parallax
  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -4,
      y: (x / (rect.width / 2)) * 5
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
        minHeight: '250vh',
        margin: '20px 0 50px'
      }}
    >
      {/* Sticky Stage Viewport - Centered in viewport */}
      <div 
        ref={stageRef}
        className="apple-showcase-sticky"
        style={{
          position: 'sticky',
          top: 'max(16px, calc(50vh - 340px))',
          height: 'calc(100vh - 90px)',
          minHeight: '580px',
          maxHeight: '880px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: '26px',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: `0 24px 60px -15px ${currentStage.ambientShadow}, 0 0 0 1px rgba(255, 255, 255, 0.6) inset`,
          overflow: 'hidden',
          padding: 'clamp(16px, 2.2vw, 28px)',
          zIndex: 10
        }}
      >
        {/* Floating Top Bar: Streamlined Header & Chapter Pill Controller */}
        <div>
          {/* Top Info Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {/* Active Chapter Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: currentStage.color,
                  boxShadow: `0 0 10px ${currentStage.color}`,
                  display: 'inline-block'
                }} 
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                فصل {currentStage.number} از ۰۴
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.6 }}>•</span>
              <span style={{ fontSize: '0.8rem', color: currentStage.color, fontWeight: 700 }}>
                {currentStage.shortTitle}
              </span>
            </div>

            {/* Quick Actions: Skip link & Next/Prev chevrons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {scrollProgress < 0.95 && (
                <button
                  type="button"
                  onClick={handleSkipShowcase}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    transition: 'all 150ms ease'
                  }}
                  title="رد شدن از شوکیس انیمیشنی"
                >
                  رد شدن از انیمیشن ↓
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleJumpToStage(Math.max(0, activeStage - 1))}
                  disabled={activeStage === 0}
                  className="apple-showcase-pill-btn btn-glass"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '9px',
                    fontSize: '0.75rem',
                    border: '1px solid var(--border-glass)',
                    opacity: activeStage === 0 ? 0.35 : 1,
                    cursor: activeStage === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="فصل قبلی"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToStage(Math.min(stages.length - 1, activeStage + 1))}
                  disabled={activeStage === stages.length - 1}
                  className="apple-showcase-pill-btn btn-glass"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '9px',
                    fontSize: '0.75rem',
                    border: '1px solid var(--border-glass)',
                    opacity: activeStage === stages.length - 1 ? 0.35 : 1,
                    cursor: activeStage === stages.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="فصل بعدی"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Minimal Floating Chapter Pill Scrubber */}
          <div 
            style={{
              position: 'relative',
              background: 'rgba(0, 0, 0, 0.03)',
              padding: '3px',
              borderRadius: '14px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                display: 'flex',
                gap: '4px',
                overflowX: 'auto',
                scrollbarWidth: 'none'
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
                    className="apple-showcase-pill-btn"
                    style={{
                      flex: '1 1 0',
                      minWidth: '105px',
                      padding: '7px 10px',
                      borderRadius: '11px',
                      border: 'none',
                      background: isActive ? '#ffffff' : 'transparent',
                      boxShadow: isActive ? '0 3px 12px rgba(0, 0, 0, 0.07)' : 'none',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 800 : 500,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Icon size={13} color={isActive ? st.color : 'currentColor'} />
                    <span>{st.number}. {st.shortTitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Embedded Hairline Progress Bar */}
            <div style={{ height: '2px', background: 'rgba(0,0,0,0.05)', marginTop: '3px', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{
                  height: '100%',
                  width: `${Math.round(scrollProgress * 100)}%`,
                  background: `linear-gradient(90deg, #0284c7, ${currentStage.color})`,
                  transition: 'width 80ms ease-out'
                }}
              />
            </div>
          </div>
        </div>

        {/* Center Stage: Hero Visual Canvas & Storytelling */}
        <div 
          style={{
            flex: '1 1 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'clamp(18px, 3vw, 40px)',
            alignItems: 'center',
            margin: '8px 0',
            overflow: 'hidden'
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left Column: Visual Hardware Showcase with 3D Depth & Pedestal */}
          <div
            ref={cardRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={handlePointerLeave}
            style={{
              position: 'relative',
              borderRadius: '20px',
              padding: 'clamp(16px, 3.5vw, 36px)',
              background: `radial-gradient(ellipse at 50% 55%, ${currentStage.glow} 0%, rgba(248, 250, 252, 0) 72%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '260px',
              maxHeight: '430px',
              userSelect: 'none',
              transition: 'background 500ms ease'
            }}
          >
            {/* The Hardware Product Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                aspectRatio: '16 / 10',
                minHeight: '240px',
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
                onError={handleImageError}
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.12))',
                  transition: 'opacity 250ms ease-out'
                }}
              />
            </div>

            {/* Studio Pedestal Floor Reflection Shadow */}
            <div 
              style={{
                width: '70%',
                height: '12px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0) 75%)',
                filter: 'blur(4px)',
                marginTop: '-6px',
                opacity: 0.85
              }}
            />

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
                    top: isTop ? '10%' : 'auto',
                    bottom: !isTop ? '10%' : 'auto',
                    right: isRight ? '3%' : 'auto',
                    left: !isRight ? '3%' : 'auto',
                    maxWidth: '220px',
                    padding: '8px 12px',
                    borderRadius: '13px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 22px rgba(0, 0, 0, 0.07)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    zIndex: 4,
                    pointerEvents: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span 
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: currentStage.color,
                        boxShadow: `0 0 8px ${currentStage.color}` 
                      }} 
                    />
                    <strong style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {callout.title}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {callout.desc}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Hero Headline, Big Punchline Stat & Direct CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Stage Pill Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span 
                className="badge" 
                style={{ 
                  background: `${currentStage.color}15`, 
                  color: currentStage.color,
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  border: `1px solid ${currentStage.color}30`
                }}
              >
                {currentStage.tag}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                استاندارد مهندسی پرچمدار
              </span>
            </div>

            {/* High-Impact Cinematic Headline */}
            <h3 
              style={{ 
                fontSize: 'clamp(1.25rem, 2.4vw, 1.7rem)', 
                fontWeight: 900, 
                lineHeight: 1.35, 
                margin: '0 0 10px',
                letterSpacing: '-0.3px',
                color: 'var(--text-primary)'
              }}
            >
              {currentStage.title}
            </h3>

            {/* Concise Evocative Copy */}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.68', margin: '0 0 16px' }}>
              {currentStage.description}
            </p>

            {/* Apple-Style Hero Punchline Stat Card (Simpler & More Engaging) */}
            <div 
              style={{
                position: 'relative',
                padding: '14px 18px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 10px 25px -10px rgba(0, 0, 0, 0.05)',
                marginBottom: '18px',
                overflow: 'hidden'
              }}
            >
              {/* Subtle Ambient Accent Glow on Left Edge */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '4px',
                  background: currentStage.color,
                  borderRadius: '4px 0 0 4px'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span 
                  className="font-tech" 
                  style={{ 
                    fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', 
                    fontWeight: 900, 
                    color: currentStage.color,
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1
                  }}
                >
                  {currentStage.heroStat.value}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentStage.heroStat.label}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {currentStage.heroStat.sublabel}
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
                  padding: '11px 18px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ShoppingBag size={16} />
                <span>سفارش سریع ({formatPrice(product.basePrice)})</span>
              </button>

              <button
                type="button"
                className="btn btn-glass"
                onClick={handleScrollToSpecs}
                style={{
                  padding: '11px 16px',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>مشاهده مشخصات کامل</span>
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Bottom Bar: Interactive Scroll Cue & Guarantee */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid rgba(226, 232, 240, 0.7)',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)'
          }}
        >
          {/* Scroll Progress Hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {scrollProgress < 0.95 ? (
              <>
                <ArrowDown size={12} color={currentStage.color} className="animate-bounce" />
                <span>
                  برای ورق زدن فصل‌های سخت‌افزار اسکرول کنید ({currentStage.number} از ۰۴)
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} color="#059669" />
                <span style={{ color: '#059669', fontWeight: 700 }}>
                  کاوش ۴ فصل به پایان رسید — اسکرول برای مشاهده جدول مشخصات
                </span>
              </>
            )}
          </div>

          {/* Trust Seal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} color="#059669" />
            <span>ضمانت اصالت ۱۰۰٪ فابریک تک‌تینک</span>
          </div>
        </div>
      </div>
    </div>
  );
}