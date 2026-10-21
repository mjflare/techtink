import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Cpu, Sparkles, ArrowDown, Package, Laptop, Smile, ShoppingBag } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const trackRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);

  // Scroll-Scrubbed Progress: 0.0 at top of track, 1.0 when track finishes
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!trackRef.current) return;
          const rect = trackRef.current.getBoundingClientRect();
          const totalScrollDistance = trackRef.current.offsetHeight - window.innerHeight;
          if (totalScrollDistance <= 0) return;
          
          // -rect.top is how much we have scrolled into the track
          const progress = Math.max(0, Math.min(1, -rect.top / totalScrollDistance));
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subtle Mouse Parallax
  const handleMouseMove = useCallback((e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setMouse({ x, y }));
  }, []);

  // Jump straight to store
  const handleSkipToStore = () => {
    const el = document.getElementById('shopping-center') || document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Jump to specific step in the scroll story
  const handleJumpToStep = (targetProgress) => {
    if (!trackRef.current) return;
    const trackTop = trackRef.current.offsetTop;
    const totalScrollDistance = trackRef.current.offsetHeight - window.innerHeight;
    const targetY = trackTop + (totalScrollDistance * targetProgress);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const p = scrollProgress;

  // Math helpers for smooth scrub ranges
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

  // Phase 3: High speed & pure joy (0.65 -> 0.88)
  const handType = range(p, 0.60, 0.88); // Hand on keyboard typing
  const particlesBurst = range(p, 0.65, 0.86); // Floating delight hearts, stars, sparks
  const speedMetrics = range(p, 0.68, 0.88); // High-performance specs popup

  // Phase 4: Glide into shopping center (0.88 -> 1.0)
  const sceneExitOpacity = 1 - range(p, 0.90, 1.0);
  const sceneExitScale = 1 - range(p, 0.90, 1.0) * 0.1;

  // Parallax offsets
  const mx = (mouse.x - 0.5) * 2;
  const my = (mouse.y - 0.5) * 2;

  // Story Chapters based on scroll position
  let currentStep = 1;
  let stepTag = 'مرحله ۱ / ۳: تحویل و آنباکس جعبه';
  let stepTitleLine1 = 'خرید لپ‌تاپ رویایی و';
  let stepTitleLine2 = 'آنباکس با نهایت هیجان';
  let stepSub = 'بسته اورجینال تک‌تینک به دست شما می‌رسد. اسکرول کنید تا جعبه باز شود...';
  let stepIcon = Package;

  if (p >= 0.30 && p < 0.65) {
    currentStep = 2;
    stepTag = 'مرحله ۲ / ۳: روشن شدن آنی و کیفیت تصویر';
    stepTitleLine1 = 'باز کردن در لپ‌تاپ و';
    stepTitleLine2 = 'روشنایی خیره‌کننده نمایشگر';
    stepSub = 'روشن شدن فوق‌سریع در چند ثانیه بدون کوچک‌ترین صدای مزاحم فن.';
    stepIcon = Laptop;
  } else if (p >= 0.65) {
    currentStep = 3;
    stepTag = 'مرحله ۳ / ۳: نهایت سرعت و لبخند رضایت';
    stepTitleLine1 = 'لذت کار با لپ‌تاپی که';
    stepTitleLine2 = 'همیشه همراهتونه';
    stepSub = 'اجرای روان سنگین‌ترین برنامه‌ها با نهایت آرامش خاطر و گارانتی طلایی.';
    stepIcon = Smile;
  }

  const StepIconComp = stepIcon;

  return (
    <div 
      ref={trackRef} 
      className="tt-scroll-story-track"
      style={{
        height: '300vh', // Provides a comfortable 3x viewport scroll distance to scrub through the story
        position: 'relative',
        background: '#06080e'
      }}
      onMouseMove={handleMouseMove}
    >
      {/* STICKY FULLSCREEN VIEWPORT FRAME */}
      <div 
        className="tt-scroll-story-sticky"
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100svh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: sceneExitOpacity,
          transform: `scale(${sceneExitScale})`,
          willChange: 'transform, opacity'
        }}
      >
        {/* Background Ambient Glows & Tech Grid */}
        <div style={{ position: 'absolute', inset: 0, background: '#06080e', zIndex: 0 }} />
        
        {/* Dynamic Light Cast from Screen onto entire room as lid opens */}
        <div 
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '650px',
            height: '650px',
            borderRadius: '50%',
            background: `radial-gradient(circle, hsla(var(--accent-cyan), ${0.12 * screenGlow}) 0%, hsla(var(--accent-purple), ${0.08 * screenGlow}) 45%, transparent 70%)`,
            filter: 'blur(90px)',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'background 0.1s linear'
          }} 
        />

        {/* Subtle Engineering Blueprint Grid */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
            `,
            backgroundSize: '70px 70px',
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
            alignItems: 'center',
            color: '#ffffff'
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
              boxShadow: '0 0 16px hsla(var(--accent-cyan), 0.4)'
            }}>
              <Cpu size={17} color="#ffffff" />
            </div>
            <div>
              <span className="font-tech" style={{ fontSize: '0.88rem', fontWeight: 900, letterSpacing: '2px', color: '#ffffff' }}>
                TECHTINK
              </span>
              <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', letterSpacing: '1px' }}>
                ISFAHAN · HIGH-END COMPUTING
              </span>
            </div>
          </div>

          {/* Interactive Story Scrubber Pills */}
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
                  background: currentStep === step.id ? 'hsla(var(--accent-cyan), 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${currentStep === step.id ? 'hsl(var(--accent-cyan))' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: currentStep === step.id ? '#ffffff' : '#94a3b8',
                  padding: '4px 12px',
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
              onClick={handleSkipToStore}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '5px 14px',
                borderRadius: '100px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>ورود مستقیم به فروشگاه</span>
              <ArrowDown size={13} />
            </button>
          </div>
        </div>

        {/* 2. CENTER STAGE: THE SCROLL-SCRUBBED SVG STORY SCENE */}
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
              {/* Gradients */}
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

            {/* === DESK SURFACE === */}
            <line x1="80" y1="390" x2="800" y2="390" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="90" y="391" width="700" height="6" rx="3" fill="rgba(255, 255, 255, 0.03)" />

            {/* === STAGE 1: DELIVERY BOX (Interactively Unboxes with Scroll) === */}
            {boxDissolve < 1 && (
              <g 
                style={{
                  opacity: 1 - boxDissolve,
                  transform: `translate(${230}px, ${315 + (boxDissolve * 15)}px)`,
                  transformOrigin: '275px 360px',
                  transition: 'opacity 0.1s linear'
                }}
              >
                {/* Main Box Cube */}
                <rect x="0" y="25" width="85" height="55" rx="5" fill="url(#sc-box)" stroke="#b45309" strokeWidth="1.5" />
                
                {/* Brand Stamp on Box */}
                <text x="42" y="58" textAnchor="middle" fill="rgba(255, 255, 255, 0.7)" fontSize="11" fontWeight="900" fontFamily="var(--font-tech)">
                  TECHTINK
                </text>
                <text x="42" y="70" textAnchor="middle" fill="rgba(255, 255, 255, 0.4)" fontSize="7" fontWeight="600">
                  ORIGINAL SEAL
                </text>

                {/* Left Flap: Folds outward as scrollProgress rises (0 to 110 deg) */}
                <g style={{ transform: `rotate(${-boxFlapOpen * 115}deg)`, transformOrigin: '0px 25px', transition: 'transform 0.05s linear' }}>
                  <polygon points="0,25 -22,8 18,8 20,25" fill="#f59e0b" opacity="0.95" />
                </g>

                {/* Right Flap: Folds outward as scrollProgress rises */}
                <g style={{ transform: `rotate(${boxFlapOpen * 115}deg)`, transformOrigin: '85px 25px', transition: 'transform 0.05s linear' }}>
                  <polygon points="85,25 107,8 67,8 65,25" fill="#f59e0b" opacity="0.95" />
                </g>

                {/* Protective Foam & Wrapping Cushion */}
                <path d="M 15 22 Q 42 12 70 22" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeDasharray="3 3" />
              </g>
            )}

            {/* === THE LAPTOP (Rises out of box -> lands on desk -> lid opens -> screen glows) === */}
            {/*
                Interpolated Laptop Position:
                Starts at (260, 310) inside box when laptopAscend = 0
                Lifts up to y: 220 when laptopAscend = 0.5
                Lands at desk center (430, 260) when laptopAscend = 1.0
            */}
            {(() => {
              const startX = 270;
              const targetX = 440;
              const currentX = startX + (targetX - startX) * laptopAscend;

              // Arc upward in Y
              const arcY = Math.sin(laptopAscend * Math.PI) * -55;
              const startY = 310;
              const targetY = 265;
              const currentY = (startY + (targetY - startY) * laptopAscend) + arcY;

              return (
                <g transform={`translate(${currentX}, ${currentY})`}>
                  {/* Laptop Base / Keyboard Chassis */}
                  <polygon 
                    points="0,95 150,95 165,108 -15,108" 
                    fill="url(#sc-chassis)" 
                    stroke="rgba(255, 255, 255, 0.2)" 
                    strokeWidth="1" 
                  />

                  {/* Trackpad */}
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

                  {/* SCREEN LIGHT CAST CONE (Shoots out onto character face as lid opens) */}
                  {screenGlow > 0 && (
                    <polygon 
                      points="40,25 150,25 20,110 -150,110" 
                      fill="hsla(var(--accent-cyan), 0.08)" 
                      opacity={screenGlow} 
                      filter="url(#sc-glow)"
                    />
                  )}

                  {/* SCREEN LID (Opens up via perspective scaling based on scroll lidOpen: 0 -> 1) */}
                  {/*
                      When lidOpen = 0 (flat/closed): lid rests flat on base
                      When lidOpen = 1 (upright): lid is open at 105 degrees
                  */}
                  <g 
                    style={{
                      transformOrigin: '75px 95px',
                      transform: `scaleY(${Math.max(0.08, lidOpen)}) translateY(${(1 - Math.max(0.08, lidOpen)) * 95}px)`,
                      transition: 'transform 0.05s linear'
                    }}
                  >
                    {/* Bezel Outer Frame */}
                    <polygon points="45,10 155,10 145,95 35,95" fill="#0a0e1a" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                    
                    {/* Glowing OLED Display */}
                    <polygon 
                      points="49,14 151,14 142,91 40,91" 
                      fill="url(#sc-screen)" 
                    />

                    {/* Active Desktop OS & Visualizer Lines (Illuminate as screenGlow rises) */}
                    {screenGlow > 0.1 && (
                      <g opacity={screenGlow}>
                        {/* Traffic light window controls */}
                        <circle cx="56" cy="21" r="1.8" fill="#f43f5e" />
                        <circle cx="62" cy="21" r="1.8" fill="#f59e0b" />
                        <circle cx="68" cy="21" r="1.8" fill="#10b981" />

                        {/* Animated Code Streams */}
                        <line x1="56" y1="30" x2="115" y2="30" stroke="hsl(var(--accent-cyan))" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="60" y1="38" x2="135" y2="38" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                        <line x1="60" y1="46" x2="105" y2="46" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                        <line x1="54" y1="54" x2="95" y2="54" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                        <line x1="54" y1="62" x2="120" y2="62" stroke="hsl(var(--accent-cyan))" strokeWidth="2" strokeLinecap="round" />

                        {/* Benchmark Speed Graph Wave */}
                        <path 
                          d="M 50 78 Q 70 65 88 74 T 120 66 T 140 73" 
                          fill="none" 
                          stroke="hsl(var(--accent-cyan))" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                        />
                      </g>
                    )}

                    {/* Screen Brand Watermark */}
                    <circle cx="95" cy="52" r="12" fill="hsl(var(--accent-cyan))" opacity={screenGlow * 0.15} filter="url(#sc-glow)" />
                  </g>
                </g>
              );
            })()}

            {/* === THE PERSON (Reacts with pure joy, smile, glowing headphones, typing hands) === */}
            <g transform="translate(180, 0)">
              {/* Torso / Hoodie */}
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
                {/* Neck */}
                <rect x="180" y="210" width="16" height="24" rx="4" fill="#fed7aa" />
                
                {/* Head / Face */}
                <ellipse cx="188" cy="190" rx="24" ry="28" fill="#fed7aa" />

                {/* Screen Light Reflection on Face */}
                {screenGlow > 0 && (
                  <ellipse cx="194" cy="192" rx="16" ry="22" fill="hsla(var(--accent-cyan), 0.18)" opacity={screenGlow} />
                )}

                {/* Smiling Mouth: Morphs from neutral curve to big joyous smile as smileSpread rises */}
                <path 
                  d={smileSpread > 0.4 ? "M 194 196 Q 205 208 214 196" : "M 195 198 Q 203 203 211 198"} 
                  fill="none" 
                  stroke="#c2410c" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />

                {/* Cheerful Cheek Blush */}
                <circle cx="204" cy="198" r="5" fill="#f43f5e" opacity={0.15 + (smileSpread * 0.35)} />

                {/* Confident, Joyful Eyes */}
                {smileSpread > 0.4 ? (
                  /* Happy Crinkled Squinting Eyes (Pure joy!) */
                  <path d="M 196 186 Q 202 180 208 186" fill="none" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round" />
                ) : (
                  /* Curious Alert Eye */
                  <circle cx="202" cy="184" r="2.5" fill="#0f172a" />
                )}

                {/* Stylish Hair */}
                <path d="M 166 190 C 163 162 184 152 208 158 C 220 162 222 178 214 186 C 208 174 198 170 180 174 Z" fill="#0f172a" />
                <circle cx="170" cy="170" r="11" fill="#0f172a" />

                {/* Noise-Cancelling Headphones */}
                <path d="M 172 178 C 172 156 204 156 204 176" fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="3.2" strokeLinecap="round" />
                <ellipse cx="173" cy="186" rx="5" ry="9" fill="hsl(var(--accent-cyan))" />
              </g>

              {/* Typing Hand: Moves to keyboard as handType scrub progresses */}
              {(() => {
                // When p < 0.5: hand rests comfortably at side/desk
                // When p >= 0.5: arm reaches smoothly onto keyboard
                const armExtendX = 160 + (handType * 90);
                const armExtendY = 270 + (handType * 20);
                const handX = 220 + (handType * 95);
                const handY = 280 + (handType * 15);

                return (
                  <g>
                    {/* Arm */}
                    <path 
                      d={`M 160 270 Q ${armExtendX} ${armExtendY} ${handX} ${handY}`} 
                      fill="none" 
                      stroke="url(#sc-hoodie)" 
                      strokeWidth="18" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    
                    {/* Hand & Fingers */}
                    <g transform={`translate(${handX}, ${handY})`}>
                      <ellipse cx="6" cy="3" rx="7" ry="5" fill="#fed7aa" />
                      <path d="M 5 5 Q 11 3 15 6" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 3 8 Q 9 7 13 10" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  </g>
                );
              })()}
            </g>

            {/* === STAGE 3 FLOATING DELIGHT BADGES (Burst out as scroll reaches Phase 3) === */}
            {particlesBurst > 0 && (
              <g opacity={particlesBurst}>
                {/* 1. ❤️ Satisfaction Heart */}
                <g 
                  style={{
                    transform: `translate(${210}px, ${140 - (particlesBurst * 25)}px) scale(${particlesBurst})`,
                    transformOrigin: '210px 140px',
                    transition: 'transform 0.05s linear'
                  }}
                >
                  <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.06)" stroke="hsl(var(--accent-purple))" strokeWidth="1.5" />
                  <path d="M 0 5 C 0 5 -7 1 -7 -3 C -7 -5 -5 -6.5 -3 -6.5 C -1.5 -6.5 -0.5 -5.5 0 -4 C 0.5 -5.5 1.5 -6.5 3 -6.5 C 5 -6.5 7 -5 7 -3 C 7 1 0 5 0 5 Z" fill="#f43f5e" />
                </g>

                {/* 2. ⚡ Speed Spark */}
                <g 
                  style={{
                    transform: `translate(${640}px, ${160 - (particlesBurst * 30)}px) scale(${particlesBurst})`,
                    transformOrigin: '640px 160px',
                    transition: 'transform 0.05s linear'
                  }}
                >
                  <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.06)" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" />
                  <path d="M 2 -8 L -3 0 L 1 0 L -2 8 L 5 -1 L 1 -1 Z" fill="#fbbf24" />
                </g>

                {/* 3. ⭐ 5-Star Unconditional Quality */}
                <g 
                  style={{
                    transform: `translate(${700}px, ${260 - (particlesBurst * 20)}px) scale(${particlesBurst})`,
                    transformOrigin: '700px 260px',
                    transition: 'transform 0.05s linear'
                  }}
                >
                  <circle cx="0" cy="0" r="20" fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
                  <text x="0" y="5" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="900">
                    ★★★★★
                  </text>
                </g>

                {/* 4. 🚀 Rocket Icon */}
                <g 
                  style={{
                    transform: `translate(${160}px, ${250 - (particlesBurst * 25)}px) scale(${particlesBurst})`,
                    transformOrigin: '160px 250px',
                    transition: 'transform 0.05s linear'
                  }}
                >
                  <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.06)" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" />
                  <path d="M -2 6 L 0 2 L 4 -2 C 6 -4 7 -3 7 -1 L 5 3 L 1 5 Z" fill="hsl(var(--accent-cyan))" />
                  <path d="M -4 8 Q -1 6 -2 4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                </g>
              </g>
            )}

            {/* Steaming Coffee Mug on Desk Right */}
            <g transform="translate(680, 340)">
              <rect x="0" y="15" width="24" height="32" rx="4" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
              <path d="M 24 20 C 32 20 32 36 24 36" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
              {/* Coffee Heart */}
              <circle cx="12" cy="30" r="3.5" fill="hsl(var(--accent-cyan))" opacity="0.6" />
              {/* Rising steam */}
              <path d="M 8 10 Q 6 3 10 -3" fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              <path d="M 16 10 Q 18 3 14 -3" fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            </g>
          </svg>
        </div>

        {/* 3. BOTTOM SCRUBBER CONTROLLER & STORY CAPTION */}
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
          {/* Left: Dynamic Story Caption tied to Scroll */}
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

          {/* Right: Scroll Progress Dial & Enter Store Prompt */}
          <div 
            onClick={handleSkipToStore}
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
            {/* Progress Percentage Ticker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                {Math.round(p * 100)}%
              </span>
              <span className="font-tech" style={{ fontSize: '0.68rem', color: 'hsl(var(--accent-cyan))' }}>
                [SCROLL DOWN]
              </span>
            </div>

            {/* Glowing Mouse Wheel Animation */}
            <div style={{
              width: '20px',
              height: '32px',
              borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '6px',
              position: 'relative'
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
              ورود به فروشگاه
            </span>
          </div>
        </div>

        {/* Global Progress Track Line pinned to very bottom */}
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
    </div>
  );
}
