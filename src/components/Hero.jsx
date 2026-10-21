import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Cpu } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const heroRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const rafRef = useRef(null);

  // Scroll-driven parallax
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / (vh * 0.65)));
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse-follow parallax
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setMouse({ x, y }));
  }, []);

  const handleScrollDown = () => {
    const el = document.getElementById('shopping-center') || document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Parallax offsets from mouse (centered at 0.5)
  const mx = (mouse.x - 0.5) * 2;  // -1 to 1
  const my = (mouse.y - 0.5) * 2;

  const contentOpacity = 1 - scrollProgress * 2;
  const contentScale = 1 - scrollProgress * 0.12;
  const contentY = scrollProgress * -50;

  return (
    <div ref={heroRef} className="tt-hero" onMouseMove={handleMouseMove}>
      <div
        className="tt-hero-stage"
        style={{
          opacity: Math.max(0, contentOpacity),
          transform: `scale(${contentScale}) translateY(${contentY}px)`,
        }}
      >
        {/* Deep dark background */}
        <div className="tt-hero-bg" />

        {/* Interactive mouse glow */}
        <div className="tt-hero-glow" style={{
          left: `${mouse.x * 100}%`,
          top: `${mouse.y * 100}%`,
        }} />

        {/* Subtle grid */}
        <div className="tt-hero-grid" />

        {/* ANIMATED SCENE: The Story */}
        <div className="tt-hero-scene" style={{
          transform: `translate(${mx * -6}px, ${my * -4}px)`,
        }}>
          <svg viewBox="0 0 800 500" className="tt-scene-svg" aria-hidden="true">
            <defs>
              {/* Gradients */}
              <linearGradient id="hg-hoodie" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--accent-cyan))" />
                <stop offset="100%" stopColor="hsl(var(--accent-purple))" />
              </linearGradient>
              <linearGradient id="hg-screen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="hg-lid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="hg-desk" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
              </linearGradient>
              <linearGradient id="hg-box" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="hg-screen-light" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="hsla(var(--accent-cyan), 0.35)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              <filter id="hg-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" />
              </filter>
              <filter id="hg-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feComposite in="SourceGraphic" in2="b" operator="over" />
              </filter>
            </defs>

            {/* ====== LAYER 0: AMBIENT LIGHT FROM SCREEN ====== */}
            <ellipse cx="420" cy="290" rx="160" ry="120"
              fill="hsla(var(--accent-cyan), 0.08)" filter="url(#hg-blur)" className="tt-ambient-pulse" />

            {/* Screen light cone on person */}
            <polygon points="460,245 300,200 310,320 420,340"
              fill="hsla(var(--accent-cyan), 0.06)" />

            {/* ====== LAYER 1: DESK ====== */}
            <path d="M 120 390 L 680 390" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <rect x="130" y="391" width="540" height="6" rx="3" fill="url(#hg-desk)" />

            {/* ====== LAYER 2: OPENED DELIVERY BOX (on the left) ====== */}
            <g className="tt-box-group" transform="translate(155, 310)">
              {/* Box body */}
              <rect x="0" y="20" width="65" height="50" rx="4" fill="url(#hg-box)" opacity="0.85" />
              {/* Box flap open left */}
              <path d="M 0 20 L -10 8 L 20 8 L 20 20 Z" fill="#b45309" opacity="0.9" />
              {/* Box flap open right */}
              <path d="M 65 20 L 75 6 L 45 6 L 45 20 Z" fill="#b45309" opacity="0.9" />
              {/* TT label on box */}
              <text x="32" y="50" textAnchor="middle" fill="rgba(255,255,255,0.6)"
                fontSize="10" fontWeight="800" fontFamily="var(--font-tech, monospace)" letterSpacing="1">TT</text>
              {/* Packing tissue sticking out */}
              <path d="M 20 15 Q 28 2 36 12 Q 44 0 48 14" fill="none"
                stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* ====== LAYER 3: COFFEE MUG ====== */}
            <g className="tt-coffee" transform="translate(600, 335)">
              <rect x="0" y="16" width="26" height="34" rx="5" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              <path d="M 26 22 C 35 22 35 40 26 40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.8" />
              {/* Steam */}
              <path className="tt-steam-a" d="M 8 10 Q 6 2 10 -4" fill="none"
                stroke="hsla(var(--accent-cyan), 0.4)" strokeWidth="1.5" strokeLinecap="round" />
              <path className="tt-steam-b" d="M 14 12 Q 18 4 14 -2" fill="none"
                stroke="hsla(var(--accent-cyan), 0.3)" strokeWidth="1.5" strokeLinecap="round" />
              <path className="tt-steam-c" d="M 20 10 Q 22 2 18 -4" fill="none"
                stroke="hsla(var(--accent-cyan), 0.25)" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* ====== LAYER 4: THE PERSON ====== */}
            <g className="tt-person">
              {/* Body / Hoodie */}
              <path d="M 270 390 C 268 330 280 275 310 258
                       C 330 248 365 252 375 295
                       C 380 315 380 390 380 390 Z"
                fill="url(#hg-hoodie)" />

              {/* Left arm reaching to laptop */}
              <path d="M 300 290 Q 340 318 390 330 Q 420 338 445 340"
                fill="none" stroke="url(#hg-hoodie)" strokeWidth="18"
                strokeLinecap="round" strokeLinejoin="round" />

              {/* Hand typing */}
              <g className="tt-hand-type" transform="translate(440, 335)">
                <ellipse cx="6" cy="3" rx="7" ry="5" fill="#fed7aa" />
                <path d="M 5 5 Q 11 3 15 6" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 3 8 Q 9 7 13 10" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* Head group (breathing/bob) */}
              <g className="tt-head-bob">
                {/* Neck */}
                <rect x="318" y="228" width="14" height="22" rx="4" fill="#fed7aa" />
                {/* Head */}
                <ellipse cx="325" cy="210" rx="24" ry="28" fill="#fed7aa" />

                {/* Happy closed-eye smile */}
                <path d="M 332 213 Q 340 222 347 213" fill="none" stroke="#c2410c" strokeWidth="2.2" strokeLinecap="round" />
                {/* Blush */}
                <circle cx="340" cy="216" r="4.5" fill="#f43f5e" opacity="0.3" />
                {/* Happy squinting eye */}
                <path d="M 334 204 Q 340 199 346 204" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />

                {/* Hair */}
                <path d="M 303 212 C 299 185 318 175 342 180 C 355 183 358 200 350 208 C 344 196 332 192 315 196 Z" fill="#0f172a" />
                <circle cx="307" cy="192" r="11" fill="#0f172a" />

                {/* Headphones */}
                <path d="M 310 198 C 310 178 340 178 340 196" fill="none"
                  stroke="hsl(var(--accent-cyan))" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                <ellipse cx="311" cy="207" rx="4" ry="7" fill="hsl(var(--accent-cyan))" opacity="0.85" />
              </g>
            </g>

            {/* ====== LAYER 5: THE LAPTOP ====== */}
            <g className="tt-laptop" transform="translate(380, 245)">
              {/* Base */}
              <polygon points="0,100 150,100 165,115 -15,115" fill="url(#hg-lid)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              {/* Trackpad */}
              <rect x="55" y="104" width="38" height="8" rx="2" fill="rgba(255,255,255,0.2)" />
              {/* Keyboard glow */}
              <polygon points="12,101 138,101 132,108 18,108" fill="#0f172a" opacity="0.9" />
              <path d="M 22 103 L 128 103 M 20 106 L 130 106" stroke="hsl(var(--accent-cyan))"
                strokeWidth="0.8" opacity="0.5" strokeDasharray="4 3" />

              {/* Screen bezel */}
              <polygon points="52,8 162,8 150,100 40,100" fill="#0f172a" />
              {/* Screen display */}
              <polygon points="56,12 158,12 147,96 46,96" fill="url(#hg-screen)" />

              {/* Code/UI lines on screen */}
              <g opacity="0.8">
                <circle cx="62" cy="18" r="1.8" fill="#f43f5e" />
                <circle cx="68" cy="18" r="1.8" fill="#f59e0b" />
                <circle cx="74" cy="18" r="1.8" fill="#10b981" />

                <line x1="62" y1="28" x2="125" y2="28" stroke="hsl(var(--accent-cyan))" strokeWidth="2.5" strokeLinecap="round" className="tt-code-1" />
                <line x1="65" y1="36" x2="105" y2="36" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" className="tt-code-2" />
                <line x1="65" y1="44" x2="135" y2="44" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" className="tt-code-3" />
                <line x1="60" y1="52" x2="95" y2="52" stroke="#10b981" strokeWidth="2" strokeLinecap="round" className="tt-code-4" />
                <line x1="60" y1="60" x2="118" y2="60" stroke="hsl(var(--accent-cyan))" strokeWidth="2" strokeLinecap="round" className="tt-code-5" />

                {/* Mini performance graph */}
                <path d="M 55 82 Q 72 70 90 78 T 125 68 T 145 76"
                  fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="2.5" strokeLinecap="round" className="tt-wave" />
              </g>

              {/* Screen glow halo */}
              <ellipse cx="105" cy="55" r="20" fill="hsl(var(--accent-cyan))" opacity="0.08" filter="url(#hg-glow)" />
            </g>

            {/* ====== LAYER 6: FLOATING STORY ELEMENTS ====== */}

            {/* 🎁 Delivered package checkmark (story: it arrived!) */}
            <g className="tt-float-1" opacity="0.9">
              <circle cx="0" cy="0" r="22" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M -7 0 L -2 5 L 8 -5" fill="none" stroke="hsl(var(--accent-green))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <text y="11" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="5" fontFamily="var(--font-tech, monospace)">DELIVERED</text>
            </g>

            {/* ⭐ 5-star rating (story: they love it!) */}
            <g className="tt-float-2" opacity="0.9">
              <circle cx="0" cy="0" r="20" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              {/* 5 tiny stars */}
              <g transform="translate(-12, -3)">
                {[0, 6, 12, 18, 24].map((offset, i) => (
                  <polygon key={i} points={`${offset+3},0 ${offset+3.8},-2 ${offset+6},-2 ${offset+4.2},-0.5 ${offset+4.8},2 ${offset+3},0.8 ${offset+1.2},2 ${offset+1.8},-0.5 ${offset},−2 ${offset+2.2},-2`}
                    fill="#fbbf24" />
                ))}
              </g>
            </g>

            {/* 💜 Heart of satisfaction */}
            <g className="tt-float-3" opacity="0.9">
              <circle cx="0" cy="0" r="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 0 6 C 0 6 -8 1 -8 -3 C -8 -5.5 -6 -7 -4 -7 C -2 -7 -1 -6 0 -4.5 C 1 -6 2 -7 4 -7 C 6 -7 8 -5.5 8 -3 C 8 1 0 6 0 6 Z"
                fill="#f43f5e" />
            </g>

            {/* ⚡ Performance spark */}
            <g className="tt-float-4" opacity="0.9">
              <circle cx="0" cy="0" r="17" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 2 -8 L -3 0 L 1 0 L -2 8 L 5 -1 L 1 -1 Z" fill="#fbbf24" />
            </g>

            {/* 🚀 Rocket (story: fast delivery/performance) */}
            <g className="tt-float-5" opacity="0.9">
              <circle cx="0" cy="0" r="19" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M -2 7 L 0 2 L 4 -2 C 6 -4 8 -3 8 -1 L 5 3 L 1 5 Z" fill="hsl(var(--accent-cyan))" />
              <path d="M -5 9 Q -2 7 -3 5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* ====== LAYER 7: SPARKLE PARTICLES ====== */}
            <circle className="tt-spark-1" cx="250" cy="180" r="1.5" fill="hsl(var(--accent-cyan))" />
            <circle className="tt-spark-2" cx="550" cy="200" r="1.2" fill="#a855f7" />
            <circle className="tt-spark-3" cx="480" cy="160" r="1" fill="#fbbf24" />
            <circle className="tt-spark-4" cx="200" cy="250" r="1.3" fill="hsl(var(--accent-green))" />
            <circle className="tt-spark-5" cx="620" cy="280" r="1" fill="hsl(var(--accent-cyan))" />
            <circle className="tt-spark-6" cx="350" cy="140" r="0.8" fill="#f43f5e" />
            <circle className="tt-spark-7" cx="170" cy="350" r="1" fill="#a855f7" />
            <circle className="tt-spark-8" cx="660" cy="170" r="1.2" fill="hsl(var(--accent-cyan))" />
          </svg>
        </div>

        {/* ====== FLOATING STORY ELEMENTS (HTML layer with stronger parallax) ====== */}
        <div className="tt-hero-floaters" style={{
          transform: `translate(${mx * -20}px, ${my * -15}px)`,
        }} />

        {/* ====== TEXT CONTENT OVERLAY ====== */}
        <div className="tt-hero-content">
          {/* Top bar */}
          <div className="tt-hero-topbar" dir="ltr">
            <div className="tt-hero-brand">
              <div className="tt-hero-brand-icon"><Cpu size={18} color="#fff" /></div>
              <div>
                <span className="tt-hero-brand-name font-tech">TECHTINK</span>
                <span className="tt-hero-brand-sub">ISFAHAN · IRAN</span>
              </div>
            </div>
            <div className="tt-hero-status">
              <span className="tt-hero-dot" />
              <span className="font-tech" style={{ fontSize: '0.68rem', color: '#475569', letterSpacing: '1px' }}>ONLINE</span>
            </div>
          </div>

          {/* Bottom: Title + scroll CTA */}
          <div className="tt-hero-bottom">
            <div className="tt-hero-text">
              <h1 className="tt-hero-title">
                <span className="tt-hero-line1">لذت کار با لپ‌تاپی که</span>
                <span className="tt-hero-line2 gradient-text">همیشه همراهتونه</span>
              </h1>
              <p className="tt-hero-sub">تست‌شده · گارانتی طلایی · ارسال سراسر ایران</p>

              <div className="tt-hero-badges" dir="ltr">
                <div className="tt-badge-item">
                  <span className="tt-badge-num font-tech">99.4%</span>
                  <span className="tt-badge-label">رضایت خریداران</span>
                </div>
                <div className="tt-badge-sep" />
                <div className="tt-badge-item">
                  <span className="tt-badge-num font-tech" style={{ color: 'hsl(var(--accent-cyan))' }}>7 DAY</span>
                  <span className="tt-badge-label">تست بی‌قید و شرط</span>
                </div>
                <div className="tt-badge-sep" />
                <div className="tt-badge-item">
                  <span className="tt-badge-num font-tech" style={{ color: 'hsl(var(--accent-green))' }}>24 MO</span>
                  <span className="tt-badge-label">ضمانت تعویض</span>
                </div>
              </div>
            </div>

            <div className="tt-hero-scroll" onClick={handleScrollDown}>
              <span className="tt-scroll-text">
                ورود به فروشگاه
                <span className="font-tech tt-scroll-tag">SCROLL</span>
              </span>
              <div className="tt-mouse-icon">
                <div className="tt-mouse-wheel" />
              </div>
              <ChevronDown size={16} className="tt-chevron-bounce" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll transition overlay */}
      <div className="tt-hero-overlay" style={{ opacity: scrollProgress * 0.7 }} />

      <style dangerouslySetInnerHTML={{__html: `
        .tt-hero {
          position: relative;
          height: 100svh;
          min-height: 600px;
          overflow: hidden;
        }
        .tt-hero-stage {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100svh;
          min-height: 600px;
          will-change: transform, opacity;
          transform-origin: center center;
        }
        .tt-hero-bg {
          position: absolute;
          inset: 0;
          background: #06080e;
        }
        .tt-hero-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, hsla(var(--accent-cyan), 0.15) 0%, hsla(var(--accent-purple), 0.08) 40%, transparent 70%);
          filter: blur(90px);
          pointer-events: none;
          z-index: 1;
          transform: translate(-50%, -50%);
          transition: left 0.4s ease-out, top 0.4s ease-out;
        }
        .tt-hero-grid {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 100%);
        }

        /* ====== ANIMATED SCENE ====== */
        .tt-hero-scene {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease-out;
          pointer-events: none;
        }
        .tt-scene-svg {
          width: min(90%, 750px);
          height: auto;
          max-height: 70vh;
        }

        /* Character animations */
        .tt-head-bob {
          animation: headBob 3.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          transform-origin: 325px 230px;
        }
        .tt-hand-type {
          animation: handType 0.8s ease-in-out infinite;
        }

        /* Steam */
        .tt-steam-a { animation: steamRise 2.4s ease-out infinite; }
        .tt-steam-b { animation: steamRise 2.4s ease-out infinite 0.6s; }
        .tt-steam-c { animation: steamRise 2.4s ease-out infinite 1.2s; }

        /* Box subtle sway */
        .tt-box-group {
          animation: boxWiggle 4s ease-in-out infinite;
          transform-origin: 188px 350px;
        }

        /* Ambient screen pulse */
        .tt-ambient-pulse {
          animation: ambientPulse 4s ease-in-out infinite;
        }

        /* Code line shimmer */
        .tt-code-1 { animation: codeShimmer 3s ease-in-out infinite; }
        .tt-code-2 { animation: codeShimmer 3s ease-in-out infinite 0.3s; }
        .tt-code-3 { animation: codeShimmer 3s ease-in-out infinite 0.6s; }
        .tt-code-4 { animation: codeShimmer 3s ease-in-out infinite 0.9s; }
        .tt-code-5 { animation: codeShimmer 3s ease-in-out infinite 1.2s; }

        /* Wave graph animation */
        .tt-wave {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: waveDraw 2.5s ease-out 0.5s forwards, wavePulse 3s ease-in-out 3s infinite;
        }

        /* Floating story badges */
        .tt-float-1 { transform: translate(185px, 165px); animation: floatA 5s ease-in-out infinite; }
        .tt-float-2 { transform: translate(600px, 165px); animation: floatB 5.5s ease-in-out infinite 0.5s; }
        .tt-float-3 { transform: translate(160px, 260px); animation: floatC 4.5s ease-in-out infinite 1s; }
        .tt-float-4 { transform: translate(640px, 290px); animation: floatD 5s ease-in-out infinite 0.8s; }
        .tt-float-5 { transform: translate(550px, 140px); animation: floatE 4.8s ease-in-out infinite 1.3s; }

        /* Sparkle particles */
        .tt-spark-1 { animation: sparkle 2.5s ease-in-out infinite; }
        .tt-spark-2 { animation: sparkle 3s ease-in-out infinite 0.5s; }
        .tt-spark-3 { animation: sparkle 2.8s ease-in-out infinite 1s; }
        .tt-spark-4 { animation: sparkle 3.2s ease-in-out infinite 0.3s; }
        .tt-spark-5 { animation: sparkle 2.6s ease-in-out infinite 0.8s; }
        .tt-spark-6 { animation: sparkle 3.5s ease-in-out infinite 1.5s; }
        .tt-spark-7 { animation: sparkle 2.9s ease-in-out infinite 0.7s; }
        .tt-spark-8 { animation: sparkle 3.1s ease-in-out infinite 1.2s; }

        /* ====== KEYFRAMES ====== */
        @keyframes headBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(1.5deg); }
        }
        @keyframes handType {
          0%, 100% { transform: translate(440px, 335px) translateY(0); }
          30% { transform: translate(440px, 335px) translateY(-2.5px); }
          70% { transform: translate(440px, 335px) translateY(1px); }
        }
        @keyframes steamRise {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          30% { opacity: 0.6; }
          100% { transform: translateY(-14px) scale(1.2); opacity: 0; }
        }
        @keyframes boxWiggle {
          0%, 100% { transform: translate(155px, 310px) rotate(0deg); }
          25% { transform: translate(155px, 310px) rotate(-1deg); }
          75% { transform: translate(155px, 310px) rotate(0.5deg); }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.14; transform: scale(1.05); }
        }
        @keyframes codeShimmer {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        @keyframes waveDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes wavePulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.5; }
        }
        @keyframes floatA {
          0%, 100% { transform: translate(185px, 165px) translateY(0); }
          50% { transform: translate(185px, 165px) translateY(-12px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(600px, 165px) translateY(0) rotate(0deg); }
          50% { transform: translate(600px, 165px) translateY(-10px) rotate(5deg); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(160px, 260px) translateY(0) scale(1); }
          50% { transform: translate(160px, 260px) translateY(-8px) scale(1.08); }
        }
        @keyframes floatD {
          0%, 100% { transform: translate(640px, 290px) translateY(0) rotate(0deg); }
          50% { transform: translate(640px, 290px) translateY(-11px) rotate(-6deg); }
        }
        @keyframes floatE {
          0%, 100% { transform: translate(550px, 140px) translateY(0); }
          50% { transform: translate(550px, 140px) translateY(-9px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }

        /* ====== TEXT CONTENT ====== */
        .tt-hero-content {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 28px;
          color: #fff;
          direction: rtl;
          pointer-events: none;
        }
        .tt-hero-content > * { pointer-events: auto; }

        .tt-hero-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: fadeUp 0.8s cubic-bezier(0.23,1,0.32,1) 0.1s both;
        }
        .tt-hero-brand { display: flex; align-items: center; gap: 10px; }
        .tt-hero-brand-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)));
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px hsla(var(--accent-cyan), 0.4);
        }
        .tt-hero-brand-name { display: block; font-size: 0.88rem; font-weight: 900; letter-spacing: 2.5px; color: #fff; }
        .tt-hero-brand-sub { display: block; font-size: 0.6rem; color: #475569; letter-spacing: 1.5px; }
        .tt-hero-status { display: flex; align-items: center; gap: 6px; }
        .tt-hero-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: hsl(var(--accent-green));
          box-shadow: 0 0 8px hsl(var(--accent-green));
          animation: dotPulse 2s ease-in-out infinite;
        }

        .tt-hero-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
        }
        .tt-hero-text {
          animation: fadeUp 0.8s cubic-bezier(0.23,1,0.32,1) 0.3s both;
        }
        .tt-hero-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tt-hero-line1 {
          font-size: clamp(1.1rem, 3vw, 1.8rem);
          font-weight: 500;
          color: #94a3b8;
        }
        .tt-hero-line2 {
          font-size: clamp(1.8rem, 5vw, 3.5rem);
          font-weight: 900;
          letter-spacing: -1px;
          line-height: 1.1;
        }
        .tt-hero-sub {
          margin-top: 10px;
          font-size: clamp(0.72rem, 1.4vw, 0.85rem);
          color: #475569;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        .tt-hero-badges {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          margin-top: 16px;
          padding: 10px 18px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .tt-badge-item { text-align: center; }
        .tt-badge-num {
          display: block;
          font-size: clamp(0.85rem, 1.8vw, 1.1rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
        }
        .tt-badge-label {
          display: block;
          font-size: 0.6rem;
          color: #64748b;
          margin-top: 1px;
          direction: rtl;
        }
        .tt-badge-sep {
          width: 1px;
          height: 24px;
          background: rgba(255,255,255,0.08);
        }

        .tt-hero-scroll {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
          animation: fadeUp 0.8s cubic-bezier(0.23,1,0.32,1) 0.6s both;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .tt-hero-scroll:hover { transform: translateY(-2px); }
        .tt-scroll-text {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .tt-scroll-tag {
          font-size: 0.6rem;
          color: hsl(var(--accent-cyan));
          letter-spacing: 1.5px;
        }
        .tt-mouse-icon {
          width: 18px; height: 28px;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.12);
          display: flex; justify-content: center;
          padding-top: 5px;
        }
        .tt-mouse-wheel {
          width: 2.5px; height: 5px;
          border-radius: 2px;
          background: hsl(var(--accent-cyan));
          animation: mouseWheel 1.8s ease-in-out infinite;
        }
        .tt-chevron-bounce {
          color: hsl(var(--accent-cyan));
          animation: chevBounce 1.8s ease-in-out infinite;
        }

        .tt-hero-overlay {
          position: absolute;
          inset: 0;
          background: var(--bg-main, #fff);
          pointer-events: none;
          z-index: 20;
        }

        /* ====== UTILITY KEYFRAMES ====== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes mouseWheel {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(10px); opacity: 0; }
        }
        @keyframes chevBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        /* ====== MOBILE ====== */
        @media (max-width: 700px) {
          .tt-hero-content { padding: 18px 16px; }
          .tt-scene-svg { width: 95%; max-height: 55vh; margin-top: 20px; }
          .tt-hero-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }
          .tt-hero-scroll {
            align-self: center;
          }
          .tt-hero-badges { gap: 10px; padding: 8px 12px; }
          .tt-badge-label { font-size: 0.55rem; }
          .tt-float-1, .tt-float-2, .tt-float-3, .tt-float-4, .tt-float-5 {
            opacity: 0.6;
          }
        }

        /* ====== REDUCED MOTION ====== */
        @media (prefers-reduced-motion: reduce) {
          .tt-head-bob, .tt-hand-type, .tt-steam-a, .tt-steam-b, .tt-steam-c,
          .tt-box-group, .tt-ambient-pulse, .tt-float-1, .tt-float-2, .tt-float-3,
          .tt-float-4, .tt-float-5, .tt-spark-1, .tt-spark-2, .tt-spark-3,
          .tt-spark-4, .tt-spark-5, .tt-spark-6, .tt-spark-7, .tt-spark-8,
          .tt-code-1, .tt-code-2, .tt-code-3, .tt-code-4, .tt-code-5,
          .tt-wave, .tt-mouse-wheel, .tt-chevron-bounce, .tt-hero-dot {
            animation: none !important;
          }
          .tt-hero-topbar, .tt-hero-text, .tt-hero-scroll {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}} />
    </div>
  );
}
