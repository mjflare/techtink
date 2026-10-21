import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Cpu, Package, Laptop, Smile, ArrowDown, X, Sparkles } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  // Animation Progress: 0.0 to 1.0 (Scrubbed by user scroll gestures)
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Smooth lerp refs for 60fps momentum scrubbing
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const touchStartYRef = useRef(0);

  // Mouse coordinates for 3D parallax
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  // 1. SCROLL-LOCK & GESTURE INTERCEPTION (Keeps page 100% STILL while scrubbing)
  useEffect(() => {
    if (isDismissed) return;

    // Lock background body scroll while interactive intro is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Wheel listener with passive: false so we can prevent page jumping
    const handleWheel = (e) => {
      e.preventDefault();
      // Mouse wheel delta (fine-tuned for natural scroll feel)
      const delta = e.deltaY * 0.0012;
      targetProgressRef.current = Math.max(0, Math.min(1.05, targetProgressRef.current + delta));
    };

    // Touch listeners for mobile devices
    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const diffY = touchStartYRef.current - currentY; // positive = swipe up = scroll down
      touchStartYRef.current = currentY;

      if (e.cancelable) e.preventDefault();
      const delta = diffY * 0.0028;
      targetProgressRef.current = Math.max(0, Math.min(1.05, targetProgressRef.current + delta));
    };

    // Keyboard arrow controls
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        targetProgressRef.current = Math.min(1.05, targetProgressRef.current + 0.1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    // 2. 60FPS MOMENTUM INTERPOLATION LOOP (GSAP-style smooth inertia)
    const updateLoop = () => {
      // Lerp: smoothly move current towards target
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.14;
      setProgress(currentProgressRef.current);

      // Once progress reaches >= 1.0, user has scrubbed past the animation!
      if (currentProgressRef.current >= 0.99 && targetProgressRef.current >= 0.99) {
        setIsDismissed(true);
        document.body.style.overflow = originalOverflow;
        setTimeout(() => {
          setIsMounted(false);
          const el = document.getElementById('shopping-center') || document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 650);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      document.body.style.overflow = originalOverflow;
    };
  }, [isDismissed]);

  // Fast skip straight to shopping center
  const handleSkip = () => {
    targetProgressRef.current = 1.05;
    currentProgressRef.current = 1.0;
    setProgress(1.0);
    setIsDismissed(true);
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsMounted(false);
      const el = document.getElementById('shopping-center') || document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 550);
  };

  // Jump to specific chapter pill
  const handleJumpToStep = (targetVal) => {
    targetProgressRef.current = targetVal;
  };

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMouse({ x, y });
  }, []);

  if (!isMounted) return null;

  const p = Math.max(0, Math.min(1, progress));

  // Math helpers
  const clamp = (val, min = 0, max = 1) => Math.max(min, Math.min(max, val));
  const range = (val, start, end) => clamp((val - start) / (end - start));

  // --- STORY TIMELINE VALUES SCRUBBED BY SCROLL ---
  // Phase 1: Unboxing (0.0 -> 0.32)
  const boxFlapOpen = range(p, 0.04, 0.22); // Flaps fold open
  const laptopAscend = range(p, 0.12, 0.32); // Laptop floats up out of box & glides to desk
  const boxDissolve = range(p, 0.26, 0.40); // Box fades out once laptop is placed

  // Phase 2: Opening screen & illumination (0.32 -> 0.65)
  const lidOpen = range(p, 0.32, 0.56); // Lid opens from 0 to 90 degrees
  const screenGlow = range(p, 0.44, 0.65); // Screen turns on, casts light cone
  const smileSpread = range(p, 0.48, 0.70); // Character face lights up, smile widens

  // Phase 3: High speed & pure joy (0.65 -> 0.90)
  const handType = range(p, 0.60, 0.88); // Hand on keyboard typing
  const particlesBurst = range(p, 0.65, 0.86); // Floating delight hearts, stars, sparks

  // Curtain lift at end of story
  const curtainLift = isDismissed ? 100 : range(p, 0.92, 1.0) * 100;

  // Parallax offsets
  const mx = (mouse.x - 0.5) * 2;
  const my = (mouse.y - 0.5) * 2;

  // Story Chapters based on scrub position
  let currentStep = 1;
  let stepTag = 'مرحله ۱ : تحویل بسته و آنباکس';
  let stepTitleLine1 = 'خرید مطمئن لپ‌تاپ و';
  let stepTitleLine2 = 'آنباکس با نهایت هیجان';
  let stepSub = 'بسته اورجینال تک‌تینک به دست شما رسیده. با اسکرول ماوس جعبه را باز کنید...';
  let stepIcon = Package;

  if (p >= 0.30 && p < 0.65) {
    currentStep = 2;
    stepTag = 'مرحله ۲ : استارت سریع و روشنایی نمایشگر';
    stepTitleLine1 = 'باز کردن در دستگاه و';
    stepTitleLine2 = 'روشنایی خیره‌کننده صفحه';
    stepSub = 'روشن شدن آنی بدون معطلی و بدون صدای فن، با نور ملایم روی چهره شما.';
    stepIcon = Laptop;
  } else if (p >= 0.65) {
    currentStep = 3;
    stepTag = 'مرحله ۳ : نهایت سرعت و لبخند رضایت';
    stepTitleLine1 = 'لذت کار با لپ‌تاپی که';
    stepTitleLine2 = 'همیشه همراهتونه';
    stepSub = 'اجرای روان سنگین‌ترین کارها با اعتماد به نفس و گارانتی طلایی تک‌تینک.';
    stepIcon = Smile;
  }

  const StepIconComp = stepIcon;

  return (
    <div 
      className="tt-pinned-hero-portal"
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100svh',
        zIndex: 9999,
        background: '#06080e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        userSelect: 'none',
        transform: `translateY(-${curtainLift}%)`,
        opacity: isDismissed ? 0.95 : 1,
        transition: isDismissed ? 'transform 0.65s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.65s ease' : 'none',
        willChange: 'transform, opacity'
      }}
    >
      {/* Background Ambient Glows */}
      <div style={{ position: 'absolute', inset: 0, background: '#06080e', zIndex: 0 }} />

      {/* Screen Illumination Radial Bloom */}
      <div 
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(var(--accent-cyan), ${0.14 * screenGlow}) 0%, hsla(var(--accent-purple), ${0.08 * screenGlow}) 40%, transparent 70%)`,
          filter: 'blur(95px)',
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'background 0.08s linear'
        }} 
      />

      {/* Tech Grid Blueprint */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '75px 75px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* 1. TOP HEADER HUD */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '20px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        dir="ltr"
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px hsla(var(--accent-cyan), 0.5)'
          }}>
            <Cpu size={17} color="#ffffff" />
          </div>
          <div>
            <span className="font-tech" style={{ fontSize: '0.88rem', fontWeight: 900, letterSpacing: '2px', color: '#ffffff' }}>
              TECHTINK
            </span>
            <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', letterSpacing: '1px' }}>
              ISFAHAN · HIGH-PERFORMANCE LAB
            </span>
          </div>
        </div>

        {/* Story Scrubber Pills & Fast Skip Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { id: 1, label: 'جعبه‌گشایی', progress: 0.15 },
            { id: 2, label: 'روشن شدن', progress: 0.48 },
            { id: 3, label: 'نهایت لذت و سرعت', progress: 0.78 }
          ].map(step => (
            <button
              key={step.id}
              type="button"
              onClick={() => handleJumpToStep(step.progress)}
              style={{
                background: currentStep === step.id ? 'hsla(var(--accent-cyan), 0.18)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${currentStep === step.id ? 'hsl(var(--accent-cyan))' : 'rgba(255, 255, 255, 0.1)'}`,
                color: currentStep === step.id ? '#ffffff' : '#94a3b8',
                padding: '5px 12px',
                borderRadius: '100px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: currentStep === step.id ? 'hsl(var(--accent-cyan))' : '#64748b'
              }} />
              <span>{step.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '100px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-tech)'
            }}
          >
            <span>SKIP TO SHOP [ESC]</span>
            <ArrowDown size={13} />
          </button>
        </div>
      </div>

      {/* 2. CENTER STAGE: THE SCROLL-SCRUBBED ANIMATION */}
      <div 
        style={{
          position: 'relative',
          zIndex: 5,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(${mx * -8}px, ${my * -6}px)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        <svg 
          viewBox="0 0 880 500" 
          style={{ 
            width: 'min(92%, 840px)', 
            height: 'auto', 
            maxHeight: '62vh',
            overflow: 'visible' 
          }}
        >
          <defs>
            <linearGradient id="sc-hoodie" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent-cyan))" />
              <stop offset="100%" stopColor="hsl(var(--accent-purple))" />
            </linearGradient>

            <linearGradient id="sc-screen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a0f1d" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            <linearGradient id="sc-chassis" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="sc-box" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            <filter id="sc-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Desk Line */}
          <line x1="80" y1="390" x2="800" y2="390" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="90" y="391" width="700" height="6" rx="3" fill="rgba(255, 255, 255, 0.03)" />

          {/* STAGE 1: DELIVERY BOX (Unboxes interactively as scroll scrubs 0 -> 0.3) */}
          {boxDissolve < 1 && (
            <g 
              style={{
                opacity: 1 - boxDissolve,
                transform: `translate(${230}px, ${315 + (boxDissolve * 15)}px)`,
                transformOrigin: '275px 360px',
                transition: 'opacity 0.1s linear'
              }}
            >
              <rect x="0" y="25" width="85" height="55" rx="5" fill="url(#sc-box)" stroke="#b45309" strokeWidth="1.5" />
              
              <text x="42" y="58" textAnchor="middle" fill="rgba(255, 255, 255, 0.7)" fontSize="11" fontWeight="900" fontFamily="var(--font-tech)">
                TECHTINK
              </text>
              <text x="42" y="70" textAnchor="middle" fill="rgba(255, 255, 255, 0.4)" fontSize="7" fontWeight="600">
                ORIGINAL SEAL
              </text>

              {/* Left Flap: Folds outward based on scroll */}
              <g style={{ transform: `rotate(${-boxFlapOpen * 115}deg)`, transformOrigin: '0px 25px', transition: 'transform 0.05s linear' }}>
                <polygon points="0,25 -22,8 18,8 20,25" fill="#f59e0b" opacity="0.95" />
              </g>

              {/* Right Flap: Folds outward based on scroll */}
              <g style={{ transform: `rotate(${boxFlapOpen * 115}deg)`, transformOrigin: '85px 25px', transition: 'transform 0.05s linear' }}>
                <polygon points="85,25 107,8 67,8 65,25" fill="#f59e0b" opacity="0.95" />
              </g>

              <path d="M 15 22 Q 42 12 70 22" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeDasharray="3 3" />
            </g>
          )}

          {/* STAGE 2: THE LAPTOP (Rises out of box -> lands on desk -> lid opens -> screen glows) */}
          {(() => {
            const startX = 270;
            const targetX = 440;
            const currentX = startX + (targetX - startX) * laptopAscend;

            const arcY = Math.sin(laptopAscend * Math.PI) * -55;
            const startY = 310;
            const targetY = 265;
            const currentY = (startY + (targetY - startY) * laptopAscend) + arcY;

            return (
              <g transform={`translate(${currentX}, ${currentY})`}>
                {/* Base / Chassis */}
                <polygon 
                  points="0,95 150,95 165,108 -15,108" 
                  fill="url(#sc-chassis)" 
                  stroke="rgba(255, 255, 255, 0.2)" 
                  strokeWidth="1" 
                />

                <rect x="55" y="99" width="38" height="7" rx="2" fill="rgba(255, 255, 255, 0.25)" />

                {/* Backlit Keyboard */}
                <polygon points="12,96 138,96 132,103 18,103" fill="#0f172a" />
                <line 
                  x1="22" y1="99" x2="128" y2="99" 
                  stroke="hsl(var(--accent-cyan))" 
                  strokeWidth="1.2" 
                  opacity={0.3 + (screenGlow * 0.7)} 
                  strokeDasharray="4 2" 
                />

                {/* Light Cone on Desk & Character */}
                {screenGlow > 0 && (
                  <polygon 
                    points="40,25 150,25 20,110 -150,110" 
                    fill="hsla(var(--accent-cyan), 0.08)" 
                    opacity={screenGlow} 
                    filter="url(#sc-glow)"
                  />
                )}

                {/* SCREEN LID (Opens upright as user scrolls lidOpen: 0 -> 1) */}
                <g 
                  style={{
                    transformOrigin: '75px 95px',
                    transform: `scaleY(${Math.max(0.08, lidOpen)}) translateY(${(1 - Math.max(0.08, lidOpen)) * 95}px)`,
                    transition: 'transform 0.05s linear'
                  }}
                >
                  <polygon points="45,10 155,10 145,95 35,95" fill="#0a0e1a" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                  
                  <polygon 
                    points="49,14 151,14 142,91 40,91" 
                    fill="url(#sc-screen)" 
                  />

                  {/* Active Screen UI Lines */}
                  {screenGlow > 0.1 && (
                    <g opacity={screenGlow}>
                      <circle cx="56" cy="21" r="1.8" fill="#f43f5e" />
                      <circle cx="62" cy="21" r="1.8" fill="#f59e0b" />
                      <circle cx="68" cy="21" r="1.8" fill="#10b981" />

                      <line x1="56" y1="30" x2="115" y2="30" stroke="hsl(var(--accent-cyan))" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="60" y1="38" x2="135" y2="38" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <line x1="60" y1="46" x2="105" y2="46" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                      <line x1="54" y1="54" x2="95" y2="54" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                      <line x1="54" y1="62" x2="120" y2="62" stroke="hsl(var(--accent-cyan))" strokeWidth="2" strokeLinecap="round" />

                      <path 
                        d="M 50 78 Q 70 65 88 74 T 120 66 T 140 73" 
                        fill="none" 
                        stroke="hsl(var(--accent-cyan))" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                      />
                    </g>
                  )}

                  <circle cx="95" cy="52" r="12" fill="hsl(var(--accent-cyan))" opacity={screenGlow * 0.15} filter="url(#sc-glow)" />
                </g>
              </g>
            );
          })()}

          {/* STAGE 3: THE PERSON (Joyful smile, illuminated face, typing hands) */}
          <g transform="translate(180, 0)">
            {/* Hoodie Body */}
            <path 
              d="M 120 390 C 115 320 135 260 175 240 C 205 230 240 235 255 285 C 260 305 260 390 260 390 Z" 
              fill="url(#sc-hoodie)" 
            />

            {/* Head & Smiling Face */}
            <g 
              style={{
                transform: `translateY(${Math.sin(p * Math.PI * 4) * -3}px) rotate(${smileSpread * 3}deg)`,
                transformOrigin: '190px 200px',
                transition: 'transform 0.05s linear'
              }}
            >
              <rect x="180" y="210" width="16" height="24" rx="4" fill="#fed7aa" />
              <ellipse cx="188" cy="190" rx="24" ry="28" fill="#fed7aa" />

              {/* Cyan Screen Light Reflection on Face */}
              {screenGlow > 0 && (
                <ellipse cx="194" cy="192" rx="16" ry="22" fill="hsla(var(--accent-cyan), 0.18)" opacity={screenGlow} />
              )}

              {/* Smiling Mouth: Morphs into wide joy as smileSpread increases */}
              <path 
                d={smileSpread > 0.4 ? "M 194 196 Q 205 208 214 196" : "M 195 198 Q 203 203 211 198"} 
                fill="none" 
                stroke="#c2410c" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Cheek Blush */}
              <circle cx="204" cy="198" r="5" fill="#f43f5e" opacity={0.15 + (smileSpread * 0.35)} />

              {/* Joyful Squinting Eyes */}
              {smileSpread > 0.4 ? (
                <path d="M 196 186 Q 202 180 208 186" fill="none" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
              ) : (
                <circle cx="202" cy="184" r="2.5" fill="#0f172a" />
              )}

              {/* Hair */}
              <path d="M 166 190 C 163 162 184 152 208 158 C 220 162 222 178 214 186 C 208 174 198 170 180 174 Z" fill="#0f172a" />
              <circle cx="170" cy="170" r="11" fill="#0f172a" />

              {/* Headphones */}
              <path d="M 172 178 C 172 156 204 156 204 176" fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="3.2" strokeLinecap="round" />
              <ellipse cx="173" cy="186" rx="5" ry="9" fill="hsl(var(--accent-cyan))" />
            </g>

            {/* Arm & Typing Hand */}
            {(() => {
              const armExtendX = 160 + (handType * 90);
              const armExtendY = 270 + (handType * 20);
              const handX = 220 + (handType * 95);
              const handY = 280 + (handType * 15);

              return (
                <g>
                  <path 
                    d={`M 160 270 Q ${armExtendX} ${armExtendY} ${handX} ${handY}`} 
                    fill="none" 
                    stroke="url(#sc-hoodie)" 
                    strokeWidth="18" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  <g transform={`translate(${handX}, ${handY})`}>
                    <ellipse cx="6" cy="3" rx="7" ry="5" fill="#fed7aa" />
                    <path d="M 5 5 Q 11 3 15 6" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 3 8 Q 9 7 13 10" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                </g>
              );
            })()}
          </g>

          {/* STAGE 3 FLOATING DELIGHT BADGES (Burst as scrub reaches 65%+) */}
          {particlesBurst > 0 && (
            <g opacity={particlesBurst}>
              <g 
                style={{
                  transform: `translate(${210}px, ${140 - (particlesBurst * 25)}px) scale(${particlesBurst})`,
                  transformOrigin: '210px 140px'
                }}
              >
                <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.06)" stroke="hsl(var(--accent-purple))" strokeWidth="1.5" />
                <path d="M 0 5 C 0 5 -7 1 -7 -3 C -7 -5 -5 -6.5 -3 -6.5 C -1.5 -6.5 -0.5 -5.5 0 -4 C 0.5 -5.5 1.5 -6.5 3 -6.5 C 5 -6.5 7 -5 7 -3 C 7 1 0 5 0 5 Z" fill="#f43f5e" />
              </g>

              <g 
                style={{
                  transform: `translate(${640}px, ${160 - (particlesBurst * 30)}px) scale(${particlesBurst})`,
                  transformOrigin: '640px 160px'
                }}
              >
                <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.06)" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" />
                <path d="M 2 -8 L -3 0 L 1 0 L -2 8 L 5 -1 L 1 -1 Z" fill="#fbbf24" />
              </g>

              <g 
                style={{
                  transform: `translate(${700}px, ${260 - (particlesBurst * 20)}px) scale(${particlesBurst})`,
                  transformOrigin: '700px 260px'
                }}
              >
                <circle cx="0" cy="0" r="20" fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
                <text x="0" y="5" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="900">
                  ★★★★★
                </text>
              </g>

              <g 
                style={{
                  transform: `translate(${160}px, ${250 - (particlesBurst * 25)}px) scale(${particlesBurst})`,
                  transformOrigin: '160px 250px'
                }}
              >
                <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.06)" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" />
                <path d="M -2 6 L 0 2 L 4 -2 C 6 -4 7 -3 7 -1 L 5 3 L 1 5 Z" fill="hsl(var(--accent-cyan))" />
                <path d="M -4 8 Q -1 6 -2 4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
          )}

          {/* Steaming Coffee Mug */}
          <g transform="translate(680, 340)">
            <rect x="0" y="15" width="24" height="32" rx="4" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
            <path d="M 24 20 C 32 20 32 36 24 36" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
            <circle cx="12" cy="30" r="3.5" fill="hsl(var(--accent-cyan))" opacity="0.6" />
            <path d="M 8 10 Q 6 3 10 -3" fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M 16 10 Q 18 3 14 -3" fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </g>
        </svg>
      </div>

      {/* 3. BOTTOM CAPTION & PROGRESS TAPE */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '16px 28px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '24px'
        }}
        dir="rtl"
      >
        {/* Caption */}
        <div style={{ maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span 
              className="font-tech"
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'hsl(var(--accent-cyan))',
                background: 'hsla(var(--accent-cyan), 0.12)',
                padding: '3px 10px',
                borderRadius: '100px',
                border: '1px solid hsla(var(--accent-cyan), 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <StepIconComp size={13} />
              <span>{stepTag}</span>
            </span>
          </div>

          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.3rem, 3.2vw, 2.2rem)',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#ffffff',
            letterSpacing: '-0.3px'
          }}>
            <span>{stepTitleLine1} </span>
            <span className="gradient-text">{stepTitleLine2}</span>
          </h1>

          <p style={{
            margin: '8px 0 0',
            fontSize: 'clamp(0.8rem, 1.4vw, 0.92rem)',
            color: '#94a3b8',
            lineHeight: 1.6
          }}>
            {stepSub}
          </p>
        </div>

        {/* Scroll Indicator & Progress */}
        <div 
          onClick={handleSkip}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
              {Math.round(p * 100)}%
            </span>
            <span className="font-tech" style={{ fontSize: '0.68rem', color: 'hsl(var(--accent-cyan))' }}>
              [SCROLL TO SCRUB]
            </span>
          </div>

          <div style={{
            width: '20px',
            height: '32px',
            borderRadius: '12px',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '6px'
          }}>
            <div 
              style={{
                width: '4px',
                height: '7px',
                borderRadius: '3px',
                background: 'hsl(var(--accent-cyan))',
                transform: `translateY(${p * 12}px)`,
                boxShadow: '0 0 8px hsl(var(--accent-cyan))',
                transition: 'transform 0.05s linear'
              }} 
            />
          </div>

          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            اسکرول کنید تا انیمیشن اجرا شود
          </span>
        </div>
      </div>

      {/* Progress Bar at Bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.06)' }}>
        <div 
          style={{
            height: '100%',
            width: `${p * 100}%`,
            background: 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
            boxShadow: '0 0 10px hsla(var(--accent-cyan), 0.8)',
            transition: 'width 0.05s linear'
          }}
        />
      </div>
    </div>
  );
}
