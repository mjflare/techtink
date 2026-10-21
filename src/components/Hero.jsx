import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cpu, ArrowDown, Volume2, VolumeX, Eye } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  // Animation Progress: 0.0 to 1.0 (Scrubbed smoothly by user scroll gestures)
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Smooth lerp refs for 60fps momentum scrubbing
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const touchStartYRef = useRef(0);

  // Studio camera tilt & mouse parallax
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  // 1. SCROLL PINNING & GESTURE INTERCEPTION (Keeps camera locked in place)
  useEffect(() => {
    if (isDismissed) return;

    // Lock background page scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Wheel listener with passive: false to keep scene pinned still
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.0011;
      targetProgressRef.current = Math.max(0, Math.min(1.05, targetProgressRef.current + delta));
    };

    // Mobile touch gestures
    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const diffY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      if (e.cancelable) e.preventDefault();
      const delta = diffY * 0.0025;
      targetProgressRef.current = Math.max(0, Math.min(1.05, targetProgressRef.current + delta));
    };

    // Keyboard navigation
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

    // 2. 60FPS CINEMATIC MOMENTUM LOOP
    const updateLoop = () => {
      // Smooth camera dampening
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.12;
      setProgress(currentProgressRef.current);

      // Once scrub finishes (>= 1.0), dissolve the studio viewfinder into the store
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

  const handleJumpToScene = (targetVal) => {
    targetProgressRef.current = targetVal;
  };

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMouse({ x, y });
  }, []);

  if (!isMounted) return null;

  const p = Math.max(0, Math.min(1, progress));

  // Clamped interpolation
  const clamp = (val, min = 0, max = 1) => Math.max(min, Math.min(max, val));
  const range = (val, start, end) => clamp((val - start) / (end - start));

  // --- CINEMATIC TIMELINE PARAMETERS ---
  // Scene 1: Unboxing luxury packaging (0.00 -> 0.35)
  const boxLidLift = range(p, 0.05, 0.24);
  const laptopRise = range(p, 0.12, 0.35);
  const packagingFade = range(p, 0.28, 0.42);

  // Scene 2: Anamorphic lid opening & screen light ignition (0.35 -> 0.68)
  const lidRotation = range(p, 0.34, 0.60); // 0 to 1
  const screenIllumination = range(p, 0.45, 0.66); // 0 to 1
  const flareIntensity = Math.sin(range(p, 0.46, 0.64) * Math.PI); // Lens flare pulse
  const characterWarmth = range(p, 0.48, 0.72); // Screen light on actor's face

  // Scene 3: Deep focus & flow typing (0.68 -> 0.92)
  const keyboardTyping = range(p, 0.64, 0.90);
  const actorConfidence = range(p, 0.66, 0.88);

  // Scene 4: Cinematic fade to store (0.92 -> 1.0)
  const filmCurtainLift = isDismissed ? 100 : range(p, 0.92, 1.0) * 100;

  // Camera parallax offsets
  const camX = (mouse.x - 0.5) * 12;
  const camY = (mouse.y - 0.5) * 8;

  // Minimal, professional scene telemetry (NO SLOGANS)
  let sceneIndex = '01';
  let sceneTag = 'SCENE 01 // UNBOXING & PRECISION CHASSIS';
  let sceneDescription = 'Matte-anodized aluminum enclosure unsealed.';

  if (p >= 0.35 && p < 0.68) {
    sceneIndex = '02';
    sceneTag = 'SCENE 02 // DISPLAY IGNITION & CALIBRATION';
    sceneDescription = 'Ultra-retina OLED panel engaged. 500 nits calibration.';
  } else if (p >= 0.68) {
    sceneIndex = '03';
    sceneTag = 'SCENE 03 // ACTIVE WORKFLOW & PERFORMANCE';
    sceneDescription = 'Vapor chamber balanced. Whisper-quiet execution.';
  }

  // Simulated timecode (e.g. 00:00:14:18)
  const totalFrames = Math.round(p * 240);
  const seconds = Math.floor(totalFrames / 24);
  const frames = totalFrames % 24;
  const timecode = `00:00:${seconds < 10 ? '0' + seconds : seconds}:${frames < 10 ? '0' + frames : frames}`;

  return (
    <div 
      className="tt-cinema-portal"
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100svh',
        zIndex: 9999,
        background: '#04060a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        userSelect: 'none',
        transform: `translateY(-${filmCurtainLift}%)`,
        opacity: isDismissed ? 0.96 : 1,
        transition: isDismissed ? 'transform 0.65s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.65s ease' : 'none',
        willChange: 'transform, opacity'
      }}
    >
      {/* 1. CINEMATIC LETTERBOXING MATTES (Top & Bottom Anamorphic Borders) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(20px, 3vh, 32px)', background: '#000000', zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'clamp(20px, 3vh, 32px)', background: '#000000', zIndex: 50, borderTop: '1px solid rgba(255,255,255,0.04)' }} />

      {/* 2. CINEMA LENS VIGNETTE & 35MM FILM GRAIN */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(2, 4, 8, 0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }} 
      />

      {/* 3. STUDIO LIGHTING: Overhead Cold Key Light & Warm Rim Light */}
      <div 
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '55vh',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.12) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 80%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 1
        }} 
      />

      {/* Anamorphic Horizontal Blue Streak Lens Flare (triggers when screen opens) */}
      {flareIntensity > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: '48%',
            left: '5%',
            right: '5%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 50%, transparent 100%)',
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.9), 0 0 8px #ffffff',
            opacity: flareIntensity,
            filter: 'blur(1px)',
            pointerEvents: 'none',
            zIndex: 15,
            transition: 'opacity 0.05s linear'
          }}
        />
      )}

      {/* Camera Viewfinder Crosshairs in 4 Corners */}
      <div style={{ position: 'absolute', top: '48px', left: '32px', width: '16px', height: '16px', borderTop: '1.5px solid rgba(255,255,255,0.2)', borderLeft: '1.5px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', top: '48px', right: '32px', width: '16px', height: '16px', borderTop: '1.5px solid rgba(255,255,255,0.2)', borderRight: '1.5px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: '48px', left: '32px', width: '16px', height: '16px', borderBottom: '1.5px solid rgba(255,255,255,0.2)', borderLeft: '1.5px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: '48px', right: '32px', width: '16px', height: '16px', borderBottom: '1.5px solid rgba(255,255,255,0.2)', borderRight: '1.5px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 20 }} />

      {/* 4. TOP VIEWFINDER HUD (Professional Film Telemetry) */}
      <div 
        style={{
          position: 'relative',
          zIndex: 30,
          padding: '42px 36px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        dir="ltr"
      >
        {/* Camera Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
            <span className="font-tech" style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1.5px', color: '#ffffff' }}>
              REC ●
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />

          <span className="font-tech" style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '1px' }}>
            {timecode}
          </span>

          <span className="font-tech" style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '1px' }}>
            4K UHD · 2.39:1 · 60 FPS
          </span>
        </div>

        {/* Scene Chapter Selectors & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {[
            { id: 1, label: '01 UNBOX', progress: 0.16 },
            { id: 2, label: '02 BOOT', progress: 0.50 },
            { id: 3, label: '03 WORKFLOW', progress: 0.80 }
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleJumpToScene(s.progress)}
              className="font-tech"
              style={{
                background: sceneIndex === `0${s.id}` ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${sceneIndex === `0${s.id}` ? 'rgba(56, 189, 248, 0.8)' : 'rgba(255, 255, 255, 0.1)'}`,
                color: sceneIndex === `0${s.id}` ? '#38bdf8' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                cursor: 'pointer',
                letterSpacing: '1px',
                transition: 'all 0.2s ease'
              }}
            >
              {s.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleSkip}
            className="font-tech"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>STORE [ESC]</span>
            <ArrowDown size={11} />
          </button>
        </div>
      </div>

      {/* 5. MAIN CINEMATIC 3D VIEWPORT STAGE */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(${camX}px, ${camY}px)`,
          transition: 'transform 0.15s ease-out'
        }}
      >
        <svg 
          viewBox="0 0 960 520" 
          style={{ 
            width: 'min(94%, 900px)', 
            height: 'auto', 
            maxHeight: '66vh',
            overflow: 'visible' 
          }}
        >
          <defs>
            {/* CNC Brushed Aluminum Gradients */}
            <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="40%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="lidBrushed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="screenPanel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Luxury Packaging Box Gradient */}
            <linearGradient id="luxuryBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>

            {/* Studio Actor Silhouette */}
            <linearGradient id="actorJacket" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            {/* Studio Rim Light Filter */}
            <filter id="cinematicGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* === CINEMATIC STUDIO TABLE WITH GLOSSY FLOOR REFLECTION === */}
          {/* Horizon Floor Grid Line */}
          <line x1="60" y1="410" x2="900" y2="410" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
          
          {/* Table Surface with Edge Specular Highlight */}
          <polygon points="100,410 860,410 890,418 70,418" fill="rgba(15, 23, 42, 0.7)" />
          <line x1="70" y1="418" x2="890" y2="418" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.8" />

          {/* Soft Shadow beneath elements */}
          <ellipse cx="490" cy="414" rx="280" ry="14" fill="#000000" opacity="0.6" filter="url(#cinematicGlow)" />

          {/* === 1. LUXURY PACKAGING BOX (Opens with mechanical precision as p scrubs 0 -> 0.35) === */}
          {packagingFade < 1 && (
            <g 
              style={{
                opacity: 1 - packagingFade,
                transform: `translate(240px, ${335 + (packagingFade * 20)}px)`,
                transition: 'opacity 0.08s linear'
              }}
            >
              {/* Box Base (Deep Matte Obsidian) */}
              <rect x="0" y="24" width="96" height="52" rx="3" fill="url(#luxuryBoxGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.2" />
              
              {/* Laser-Etched Foil Monogram */}
              <text x="48" y="54" textAnchor="middle" fill="rgba(255, 255, 255, 0.6)" fontSize="9" fontWeight="800" fontFamily="var(--font-tech)" letterSpacing="2">
                TECHTINK
              </text>
              <line x1="28" y1="62" x2="68" y2="62" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1" />

              {/* Box Lid / Flap: Precision mechanical lift (Angles 0 to 110 deg) */}
              <g style={{ transform: `rotate(${-boxLidLift * 110}deg)`, transformOrigin: '0px 24px', transition: 'transform 0.05s linear' }}>
                <polygon points="0,24 -20,6 20,6 24,24" fill="#27272a" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              </g>

              <g style={{ transform: `rotate(${boxLidLift * 110}deg)`, transformOrigin: '96px 24px', transition: 'transform 0.05s linear' }}>
                <polygon points="96,24 116,6 76,6 72,24" fill="#27272a" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              </g>

              {/* Protective micro-fiber cloth layer */}
              <path d="M 12 24 Q 48 16 84 24" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>
          )}

          {/* === 2. THE LAPTOP (Rises out of box -> lands on studio table -> lid opens -> screen illuminates) === */}
          {(() => {
            const startX = 275;
            const targetX = 460;
            const currentX = startX + (targetX - startX) * laptopRise;

            const arcY = Math.sin(laptopRise * Math.PI) * -50;
            const startY = 328;
            const targetY = 285;
            const currentY = (startY + (targetY - startY) * laptopRise) + arcY;

            return (
              <g transform={`translate(${currentX}, ${currentY})`}>
                {/* Contact Shadow under Laptop */}
                <ellipse cx="80" cy="110" rx="90" ry="8" fill="#000000" opacity={0.5 + (laptopRise * 0.3)} filter="url(#cinematicGlow)" />

                {/* Tabletop Reflection (Glossy studio table reflection) */}
                <g opacity={0.18 + (screenIllumination * 0.2)} transform="translate(0, 114) scale(1, -0.45)" filter="url(#cinematicGlow)">
                  <polygon points="0,95 160,95 175,108 -15,108" fill="url(#chassisGrad)" />
                </g>

                {/* CNC Aluminum Laptop Base / Chassis */}
                <polygon 
                  points="0,95 160,95 175,108 -15,108" 
                  fill="url(#chassisGrad)" 
                  stroke="rgba(255, 255, 255, 0.35)" 
                  strokeWidth="0.8" 
                />

                {/* Chamfered Front Edge Reflection */}
                <line x1="-15" y1="108" x2="175" y2="108" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.75" />

                {/* Precision Glass Trackpad */}
                <rect x="60" y="99" width="40" height="7" rx="1.5" fill="#1e293b" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.6" />

                {/* Milled Keyboard Deck with Individually Backlit Keys */}
                <polygon points="12,96 148,96 142,103 18,103" fill="#090d16" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
                
                {/* Dual Speaker Grilles on Sides */}
                <line x1="4" y1="97" x2="4" y2="103" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" strokeDasharray="1 1" />
                <line x1="156" y1="97" x2="156" y2="103" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" strokeDasharray="1 1" />

                {/* Keyboard Backlight Underglow (powers on with screen) */}
                <line 
                  x1="20" y1="99" x2="140" y2="99" 
                  stroke="hsl(var(--accent-cyan))" 
                  strokeWidth="1.2" 
                  opacity={0.15 + (screenIllumination * 0.75)} 
                  strokeDasharray="4 2" 
                />

                {/* VOLUMETRIC SCREEN LIGHT (Casts authentic cone across table surface & character) */}
                {screenIllumination > 0 && (
                  <polygon 
                    points="45,20 160,20 20,114 -160,114" 
                    fill="hsla(var(--accent-cyan), 0.12)" 
                    opacity={screenIllumination} 
                    filter="url(#cinematicGlow)"
                  />
                )}

                {/* SCREEN LID (Opens smoothly via 3D scale/transform perspective from 0 to 90 degrees) */}
                <g 
                  style={{
                    transformOrigin: '80px 95px',
                    transform: `scaleY(${Math.max(0.06, lidRotation)}) translateY(${(1 - Math.max(0.06, lidRotation)) * 95}px)`,
                    transition: 'transform 0.05s linear'
                  }}
                >
                  {/* Outer Bezel (Sleek Space Gray Matte Aluminum) */}
                  <polygon points="45,8 165,8 152,95 38,95" fill="#090d16" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.8" />
                  
                  {/* Razor-thin 2.5mm Display Edge */}
                  <polygon 
                    points="48,11 162,11 150,92 41,92" 
                    fill="url(#screenPanel)" 
                  />

                  {/* Top Punch-hole Web Camera */}
                  <circle cx="105" cy="13" r="1.2" fill="#38bdf8" opacity={screenIllumination} />

                  {/* ACTIVE SCREEN CONTENT (Minimal, clean studio software workspace) */}
                  {screenIllumination > 0.1 && (
                    <g opacity={screenIllumination}>
                      {/* Subtle Studio Wallpaper Wave */}
                      <path 
                        d="M 45 65 Q 85 45 115 58 T 150 48" 
                        fill="none" 
                        stroke="hsla(var(--accent-cyan), 0.4)" 
                        strokeWidth="1.5" 
                      />

                      {/* Professional Code / Terminal Lines */}
                      <line x1="56" y1="24" x2="110" y2="24" stroke="hsl(var(--accent-cyan))" strokeWidth="2" strokeLinecap="round" />
                      <line x1="60" y1="32" x2="135" y2="32" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="60" y1="40" x2="105" y2="40" stroke="#c084fc" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="54" y1="48" x2="95" y2="48" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="54" y1="56" x2="125" y2="56" stroke="hsl(var(--accent-cyan))" strokeWidth="1.6" strokeLinecap="round" />

                      {/* Live System Performance Telemetry Strip */}
                      <rect x="52" y="70" width="90" height="15" rx="2" fill="rgba(255,255,255,0.06)" />
                      <text x="56" y="81" fill="#38bdf8" fontSize="6.5" fontFamily="var(--font-tech)" letterSpacing="0.5">
                        240Hz · 0dB · 4.8GHz
                      </text>
                    </g>
                  )}

                  {/* Subtle Screen Ambient Halo */}
                  <circle cx="105" cy="52" r="14" fill="hsl(var(--accent-cyan))" opacity={screenIllumination * 0.18} filter="url(#cinematicGlow)" />
                </g>
              </g>
            );
          })()}

          {/* === 3. THE ACTOR / CHARACTER (Professional film lighting, genuine expression) === */}
          <g transform="translate(190, 10)">
            {/* Actor Silhouette / Minimal Tailored Dark Jacket */}
            <path 
              d="M 125 400 C 120 330 140 270 180 250 C 210 240 245 245 260 295 C 265 315 265 400 265 400 Z" 
              fill="url(#actorJacket)" 
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />

            {/* Rim Lighting Along Shoulder (Key studio edge light) */}
            <path 
              d="M 125 390 C 122 335 142 275 180 252" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.35)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
            />

            {/* Head & Natural Expression */}
            <g 
              style={{
                transform: `translateY(${Math.sin(p * Math.PI * 4) * -2}px) rotate(${characterWarmth * 2.5}deg)`,
                transformOrigin: '195px 210px',
                transition: 'transform 0.05s linear'
              }}
            >
              {/* Neck */}
              <rect x="186" y="218" width="16" height="22" rx="3" fill="#fed7aa" />
              
              {/* Head Profile */}
              <ellipse cx="194" cy="198" rx="22" ry="26" fill="#fed7aa" />

              {/* Cyan Volumetric Light Reflection on Actor's Face */}
              {screenIllumination > 0 && (
                <ellipse cx="200" cy="200" rx="15" ry="21" fill="hsla(var(--accent-cyan), 0.22)" opacity={screenIllumination} />
              )}

              {/* Natural, Genuine Smile of Confidence (Subtle, professional, not cartoonish) */}
              <path 
                d={characterWarmth > 0.4 ? "M 200 206 Q 209 214 217 206" : "M 201 207 Q 208 210 215 207"} 
                fill="none" 
                stroke="#9a3412" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
              />

              {/* Subtle Natural Warmth on Cheek */}
              <circle cx="208" cy="206" r="4.5" fill="#f43f5e" opacity={0.1 + (characterWarmth * 0.25)} />

              {/* Expressive, Focused Eyes Looking into Screen */}
              {characterWarmth > 0.4 ? (
                <path d="M 202 195 Q 207 190 213 195" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <circle cx="207" cy="193" r="2.2" fill="#0f172a" />
              )}

              {/* Modern Minimalist Haircut */}
              <path d="M 174 198 C 171 170 190 162 214 168 C 225 172 226 186 218 194 C 212 184 204 180 188 184 Z" fill="#0f172a" />
              <circle cx="178" cy="178" r="9" fill="#0f172a" />

              {/* Studio Monitoring Headphones with Metallic Earcups */}
              <path d="M 178 188 C 178 166 210 166 210 186" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="179" cy="195" rx="4.5" ry="8.5" fill="#0f172a" stroke="hsl(var(--accent-cyan))" strokeWidth="1" />
            </g>

            {/* Actor Arm & Natural Typing Hands */}
            {(() => {
              const armX = 165 + (keyboardTyping * 85);
              const armY = 280 + (keyboardTyping * 18);
              const handX = 225 + (keyboardTyping * 90);
              const handY = 290 + (keyboardTyping * 12);

              return (
                <g>
                  {/* Sleeve */}
                  <path 
                    d={`M 165 280 Q ${armX} ${armY} ${handX} ${handY}`} 
                    fill="none" 
                    stroke="url(#actorJacket)" 
                    strokeWidth="16" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  {/* Arm Rim Highlight */}
                  <path 
                    d={`M 165 278 Q ${armX} ${armY - 2} ${handX} ${handY - 2}`} 
                    fill="none" 
                    stroke="rgba(255, 255, 255, 0.25)" 
                    strokeWidth="1" 
                    strokeLinecap="round" 
                  />
                  
                  {/* Natural Hands Resting & Typing on Keys */}
                  <g transform={`translate(${handX}, ${handY})`}>
                    <ellipse cx="6" cy="3" rx="6.5" ry="4.5" fill="#fed7aa" />
                    <path d="M 5 5 Q 11 3 14 6" stroke="#fed7aa" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 3 8 Q 9 7 12 10" stroke="#fed7aa" strokeWidth="2.2" strokeLinecap="round" />
                  </g>
                </g>
              );
            })()}
          </g>

          {/* Minimal Ceramic Mug on Side Table */}
          <g transform="translate(710, 360)">
            <rect x="0" y="14" width="22" height="30" rx="3" fill="#18181b" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" />
            <path d="M 22 18 C 29 18 29 33 22 33" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" />
            {/* Subtle rising steam */}
            <path d="M 8 9 Q 6 3 9 -3" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 14 9 Q 16 3 13 -3" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* 6. BOTTOM TELEMETRY BAR & SCRUBBER (Zero slogans, pure cinematic HUD) */}
      <div 
        style={{
          position: 'relative',
          zIndex: 30,
          padding: '0 36px 38px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '24px'
        }}
        dir="ltr"
      >
        {/* Left: Shot Telemetry & Scene Details (Factual, cinematic, no slogans) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span 
              className="font-tech"
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: '1.5px',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              {sceneTag}
            </span>
          </div>

          <p 
            className="font-tech"
            style={{
              margin: 0,
              fontSize: '0.78rem',
              color: '#94a3b8',
              letterSpacing: '0.5px'
            }}
          >
            {sceneDescription}
          </p>
        </div>

        {/* Right: Wheel Dial & Progress */}
        <div 
          onClick={handleSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div className="font-tech" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
              {Math.round(p * 100)}%
            </div>
            <div className="font-tech" style={{ fontSize: '0.62rem', color: '#64748b', letterSpacing: '1px' }}>
              SCROLL TO SCRUB
            </div>
          </div>

          {/* Precision Mouse Wheel Indicator */}
          <div style={{
            width: '18px',
            height: '28px',
            borderRadius: '9px',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '5px'
          }}>
            <div 
              style={{
                width: '3px',
                height: '6px',
                borderRadius: '2px',
                background: '#38bdf8',
                transform: `translateY(${p * 10}px)`,
                boxShadow: '0 0 6px #38bdf8',
                transition: 'transform 0.05s linear'
              }} 
            />
          </div>
        </div>
      </div>

      {/* Thin Scrub Track at Edge */}
      <div style={{ position: 'absolute', bottom: 'clamp(20px, 3vh, 32px)', left: 0, width: '100%', height: '2px', background: 'rgba(255, 255, 255, 0.06)', zIndex: 51 }}>
        <div 
          style={{
            height: '100%',
            width: `${p * 100}%`,
            background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
            boxShadow: '0 0 8px rgba(56, 189, 248, 0.8)',
            transition: 'width 0.05s linear'
          }}
        />
      </div>
    </div>
  );
}
