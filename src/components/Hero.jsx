import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Cpu } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // Scroll-driven parallax: as user scrolls, the hero content fades and scales away
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 = hero fully visible, 1 = hero scrolled fully past
      const progress = Math.max(0, Math.min(1, -rect.top / (vh * 0.7)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse-follow for interactive glow orb
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setMousePos({ x, y });
    });
  }, []);

  // Scroll down handler
  const handleScrollDown = () => {
    const el = document.getElementById('shopping-center') || document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Compute parallax transforms from scroll
  const contentOpacity = 1 - scrollProgress * 1.8;
  const contentScale = 1 - scrollProgress * 0.15;
  const contentTranslateY = scrollProgress * -60;
  const overlayOpacity = scrollProgress * 0.6;

  return (
    <div
      ref={heroRef}
      className="tt-immersive-hero"
      onMouseMove={handleMouseMove}
    >
      {/* Fixed background that stays while content scrolls over */}
      <div
        className="tt-hero-fixed-layer"
        style={{
          opacity: Math.max(0, contentOpacity),
          transform: `scale(${contentScale}) translateY(${contentTranslateY}px)`,
        }}
      >
        {/* Deep dark cinematic background */}
        <div className="tt-hero-bg" />

        {/* Interactive mouse-follow glow orb */}
        <div
          className="tt-hero-orb"
          style={{
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
          }}
        />

        {/* Subtle animated grid lines */}
        <div className="tt-hero-grid" />

        {/* Main content */}
        <div ref={contentRef} className="tt-hero-content">
          {/* Top branding bar */}
          <div className="tt-hero-topbar" dir="ltr">
            <div className="tt-hero-brand">
              <div className="tt-hero-brand-icon">
                <Cpu size={18} color="#ffffff" />
              </div>
              <div>
                <span className="tt-hero-brand-name font-tech">TECHTINK</span>
                <span className="tt-hero-brand-sub">ISFAHAN · IRAN</span>
              </div>
            </div>
            <div className="tt-hero-status">
              <span className="tt-hero-status-dot" />
              <span className="font-tech" style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '1px' }}>ONLINE</span>
            </div>
          </div>

          {/* Center: Big dramatic title */}
          <div className="tt-hero-center">
            {/* Massive watermark */}
            <div className="tt-hero-watermark font-tech">TT</div>

            <h1 className="tt-hero-title">
              <span className="tt-hero-title-line1">لذت کار با لپ‌تاپی که</span>
              <span className="tt-hero-title-line2 gradient-text">همیشه همراهتونه</span>
            </h1>

            <p className="tt-hero-subtitle">
              تست‌شده · گارانتی طلایی · ارسال سراسر ایران
            </p>

            {/* Trust badges row */}
            <div className="tt-hero-badges" dir="ltr">
              <div className="tt-hero-badge">
                <span className="tt-hero-badge-num font-tech">99.4%</span>
                <span className="tt-hero-badge-label">رضایت خریداران</span>
              </div>
              <div className="tt-hero-badge-divider" />
              <div className="tt-hero-badge">
                <span className="tt-hero-badge-num font-tech" style={{ color: 'hsl(var(--accent-cyan))' }}>7 DAY</span>
                <span className="tt-hero-badge-label">تست بی‌قید و شرط</span>
              </div>
              <div className="tt-hero-badge-divider" />
              <div className="tt-hero-badge">
                <span className="tt-hero-badge-num font-tech" style={{ color: 'hsl(var(--accent-green))' }}>24 MO</span>
                <span className="tt-hero-badge-label">ضمانت تعویض قطعات</span>
              </div>
            </div>
          </div>

          {/* Bottom: Scroll indicator */}
          <div className="tt-hero-scroll-cta" onClick={handleScrollDown}>
            <span className="tt-hero-scroll-label">
              ورود به فروشگاه
              <span className="font-tech tt-hero-scroll-tag">SCROLL</span>
            </span>
            <div className="tt-hero-mouse">
              <div className="tt-hero-mouse-dot" />
            </div>
            <ChevronDown size={18} className="tt-hero-chevron" />
          </div>
        </div>
      </div>

      {/* Dark overlay that fades in as you scroll (helps transition) */}
      <div
        className="tt-hero-scroll-overlay"
        style={{ opacity: overlayOpacity }}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .tt-immersive-hero {
          position: relative;
          height: 100svh;
          min-height: 600px;
          overflow: hidden;
        }

        .tt-hero-fixed-layer {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100svh;
          min-height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          will-change: transform, opacity;
          transform-origin: center center;
        }

        .tt-hero-bg {
          position: absolute;
          inset: 0;
          background: #06080e;
          z-index: 0;
        }

        .tt-hero-orb {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            hsla(var(--accent-cyan), 0.2) 0%,
            hsla(var(--accent-purple), 0.12) 40%,
            transparent 70%
          );
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
          transform: translate(-50%, -50%);
          transition: left 0.3s ease-out, top 0.3s ease-out;
        }

        .tt-hero-grid {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 100%);
        }

        .tt-hero-content {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 28px;
          color: #ffffff;
          direction: rtl;
        }

        /* Top bar */
        .tt-hero-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tt-hero-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tt-hero-brand-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px hsla(var(--accent-cyan), 0.5);
        }

        .tt-hero-brand-name {
          display: block;
          font-size: 0.9rem;
          font-weight: 900;
          letter-spacing: 2.5px;
          color: #ffffff;
        }

        .tt-hero-brand-sub {
          display: block;
          font-size: 0.62rem;
          color: #475569;
          letter-spacing: 1.5px;
        }

        .tt-hero-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tt-hero-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: hsl(var(--accent-green));
          box-shadow: 0 0 8px hsl(var(--accent-green));
          animation: statusPulse 2s ease-in-out infinite;
        }

        /* Center hero */
        .tt-hero-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          flex: 1;
          position: relative;
        }

        .tt-hero-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: clamp(8rem, 30vw, 22rem);
          font-weight: 900;
          color: rgba(255, 255, 255, 0.02);
          user-select: none;
          pointer-events: none;
          letter-spacing: -8px;
          line-height: 1;
        }

        .tt-hero-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: heroFadeUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.1s both;
        }

        .tt-hero-title-line1 {
          font-size: clamp(1.4rem, 4vw, 2.4rem);
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: -0.3px;
        }

        .tt-hero-title-line2 {
          font-size: clamp(2.2rem, 6.5vw, 4.5rem);
          font-weight: 900;
          letter-spacing: -1px;
          line-height: 1.1;
        }

        .tt-hero-subtitle {
          margin-top: 20px;
          font-size: clamp(0.82rem, 1.6vw, 0.95rem);
          color: #475569;
          letter-spacing: 1px;
          font-weight: 500;
          animation: heroFadeUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.3s both;
        }

        /* Trust badges */
        .tt-hero-badges {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 32px;
          padding: 14px 24px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: heroFadeUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.5s both;
        }

        .tt-hero-badge {
          text-align: center;
        }

        .tt-hero-badge-num {
          display: block;
          font-size: clamp(1rem, 2.2vw, 1.3rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
        }

        .tt-hero-badge-label {
          display: block;
          font-size: 0.68rem;
          color: #64748b;
          margin-top: 2px;
          direction: rtl;
        }

        .tt-hero-badge-divider {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Scroll CTA */
        .tt-hero-scroll-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          animation: heroFadeUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.7s both;
          transition: transform 0.2s ease;
        }

        .tt-hero-scroll-cta:hover {
          transform: translateY(-2px);
        }

        .tt-hero-scroll-cta:active {
          transform: translateY(1px);
        }

        .tt-hero-scroll-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .tt-hero-scroll-tag {
          font-size: 0.65rem;
          color: hsl(var(--accent-cyan));
          letter-spacing: 1.5px;
          opacity: 0.9;
        }

        .tt-hero-mouse {
          width: 20px;
          height: 32px;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          display: flex;
          justify-content: center;
          padding-top: 6px;
        }

        .tt-hero-mouse-dot {
          width: 3px;
          height: 6px;
          border-radius: 3px;
          background: hsl(var(--accent-cyan));
          animation: mouseScrollDot 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        .tt-hero-chevron {
          color: hsl(var(--accent-cyan));
          animation: bounceChevron 1.8s ease-in-out infinite;
        }

        /* Dark overlay for scroll transition */
        .tt-hero-scroll-overlay {
          position: absolute;
          inset: 0;
          background: var(--bg-main, #ffffff);
          pointer-events: none;
          z-index: 20;
        }

        /* Animations */
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes mouseScrollDot {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(12px); opacity: 0; }
        }

        @keyframes bounceChevron {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }

        @media (max-width: 640px) {
          .tt-hero-content {
            padding: 20px 16px;
          }

          .tt-hero-badges {
            gap: 10px;
            padding: 12px 14px;
          }

          .tt-hero-badge-label {
            font-size: 0.6rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tt-hero-mouse-dot,
          .tt-hero-chevron,
          .tt-hero-status-dot {
            animation: none !important;
          }
          .tt-hero-title,
          .tt-hero-subtitle,
          .tt-hero-badges,
          .tt-hero-scroll-cta {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}} />
    </div>
  );
}
