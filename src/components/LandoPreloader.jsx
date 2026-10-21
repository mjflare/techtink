import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, ChevronDown, Cpu } from 'lucide-react';

export default function LandoPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [telemetryText, setTelemetryText] = useState('INITIALIZING PERFORMANCE HUB //');

  useEffect(() => {
    // Lock body scroll during preloading
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Fast, organic ticking percentage from 0 to 100
    let current = 0;
    const interval = setInterval(() => {
      // Accelerate towards the end like F1 / Lando Norris loader
      const step = Math.floor(Math.random() * 8) + 3;
      current = Math.min(100, current + step);
      setProgress(current);

      if (current < 35) {
        setTelemetryText('CHECKING HARDWARE CALIBRATION // 240Hz OLED');
      } else if (current < 70) {
        setTelemetryText('ISFAHAN WORKSTATION REPOSITORY // READY');
      } else if (current < 95) {
        setTelemetryText('OPTIMIZING THERMAL VAPOR CHAMBER // 100%');
      } else {
        setTelemetryText('SYSTEM READY // WELCOME TO TECHTINK');
      }

      if (current >= 100) {
        clearInterval(interval);
        // Brief pause at 100% before curtain reveal
        setTimeout(() => {
          setIsExiting(true);
          document.body.style.overflow = originalOverflow;
          setTimeout(() => {
            onComplete?.();
          }, 750); // Matches curtain slide duration
        }, 300);
      }
    }, 45);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    document.body.style.overflow = '';
    setTimeout(() => {
      onComplete?.();
    }, 400);
  };

  return (
    <div 
      className={`tt-lando-preloader ${isExiting ? 'is-exiting' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#06080e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 24px',
        overflow: 'hidden',
        pointerEvents: isExiting ? 'none' : 'all',
        direction: 'ltr' // Tech HUD typography is left-to-right
      }}
    >
      {/* Ambient Neon Aurora Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.18) 0%, rgba(168, 85, 247, 0.1) 40%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px hsla(var(--accent-cyan), 0.5)'
          }}>
            <Cpu size={18} color="#ffffff" />
          </div>
          <div>
            <span className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '2px', color: '#ffffff' }}>
              TECHTINK
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', letterSpacing: '1px' }}>
              PERFORMANCE ARCHITECTURE
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            fontSize: '0.72rem',
            padding: '6px 14px',
            borderRadius: '100px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-tech)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
        >
          SKIP [ESC]
        </button>
      </div>

      {/* Center: Massive Kinetic Counter (Lando Norris Signature) */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, margin: 'auto 0' }}>
        
        {/* Subtle Tech Monogram Watermark behind counter */}
        <div 
          className="font-tech"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(6rem, 25vw, 18rem)',
            fontWeight: 900,
            color: 'rgba(255, 255, 255, 0.02)',
            userSelect: 'none',
            pointerEvents: 'none',
            letterSpacing: '-5px'
          }}
        >
          TT
        </div>

        {/* The Big Number */}
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
          <span 
            className="font-tech tt-lando-counter"
            style={{
              fontSize: 'clamp(5rem, 18vw, 12rem)',
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: '-2px',
              background: 'linear-gradient(180deg, #ffffff 30%, #64748b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {progress < 10 ? `0${progress}` : progress}
          </span>
          <span 
            className="font-tech"
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 3rem)',
              fontWeight: 800,
              color: 'hsl(var(--accent-cyan))',
              textShadow: '0 0 20px hsla(var(--accent-cyan), 0.6)'
            }}
          >
            %
          </span>
        </div>

        {/* Telemetry Status Line */}
        <div style={{ marginTop: '16px' }}>
          <span 
            className="font-code"
            style={{
              fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)',
              letterSpacing: '1.5px',
              color: progress >= 100 ? 'hsl(var(--accent-cyan))' : '#94a3b8',
              transition: 'color 0.3s ease'
            }}
          >
            {telemetryText}
          </span>
        </div>

        {/* High-Tech Shutter Progress Line */}
        <div style={{
          maxWidth: '320px',
          width: '100%',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          margin: '20px auto 0',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div 
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))',
              borderRadius: '10px',
              boxShadow: '0 0 12px hsla(var(--accent-cyan), 0.8)',
              transition: 'width 0.08s linear'
            }}
          />
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '1px' }}>
          EST. ISFAHAN · IRAN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.68rem', color: '#64748b' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--accent-green))', boxShadow: '0 0 6px hsl(var(--accent-green))' }} />
          <span>V1.0 ENGINE</span>
        </div>
      </div>

      {/* Curtain Exit Animation Styles (Lando Norris Shutter Reveal) */}
      <style dangerouslySetInnerHTML={{__html: `
        .tt-lando-preloader {
          transition: transform 0.75s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.75s ease;
        }
        .tt-lando-preloader.is-exiting {
          transform: translateY(-100%);
          opacity: 0.95;
        }
      `}} />
    </div>
  );
}
