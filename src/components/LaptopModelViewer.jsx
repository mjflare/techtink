import React, { useState, useEffect, useRef } from 'react';
import { 
  Rotate3d, Sparkles, Eye, Maximize2, Minimize2, RefreshCw, 
  Layers, Cpu, Zap, Monitor, HardDrive, Smartphone, Info, Check, Play, Pause
} from 'lucide-react';

export default function LaptopModelViewer({ 
  modelUrl = '/models/laptop-flagship.glb', 
  productName = 'لپ‌تاپ تخصصی',
  specs = {},
  onAddToCart = null
}) {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePreset, setActivePreset] = useState('hero');
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [hasError, setHasError] = useState(false);

  // Lazy-load @google/model-viewer only in browser environment
  useEffect(() => {
    let isMounted = true;
    import('@google/model-viewer')
      .then(() => {
        if (isMounted) setIsLoaded(true);
      })
      .catch((err) => {
        console.warn('Failed to load @google/model-viewer:', err);
        if (isMounted) setHasError(true);
      });
    return () => { isMounted = false; };
  }, []);

  // Listen to model-viewer loading progress
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleProgress = (e) => {
      const p = Math.round((e.detail?.totalProgress || 0) * 100);
      setLoadProgress(p);
    };

    const handleError = () => {
      setHasError(true);
    };

    viewer.addEventListener('progress', handleProgress);
    viewer.addEventListener('error', handleError);

    return () => {
      viewer.removeEventListener('progress', handleProgress);
      viewer.removeEventListener('error', handleError);
    };
  }, [isLoaded]);

  // Camera presets
  const presets = [
    { id: 'hero', label: 'نمای ایزومتریک اصلی', orbit: '45deg 68deg 6.2m', icon: Rotate3d },
    { id: 'keyboard', label: 'کیبورد و تاچ‌پد', orbit: '0deg 28deg 4.8m', icon: Layers },
    { id: 'screen', label: 'روبرو و نمایشگر', orbit: '0deg 75deg 5.5m', icon: Monitor },
    { id: 'ports', label: 'درگاه‌های جانبی', orbit: '-88deg 85deg 5.2m', icon: HardDrive },
    { id: 'back', label: 'پشت شاسی و لوگو', orbit: '180deg 75deg 5.8m', icon: Sparkles }
  ];

  const handleApplyPreset = (preset) => {
    setActivePreset(preset.id);
    if (viewerRef.current) {
      viewerRef.current.cameraOrbit = preset.orbit;
      viewerRef.current.fieldOfView = '30deg';
    }
  };

  const handleResetCamera = () => {
    handleApplyPreset(presets[0]);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Hotspots info
  const hotspots = [
    {
      slot: 'hotspot-screen',
      position: '0 1.3 -0.6',
      normal: '0 0.3 0.95',
      title: 'پنل OLED / IPS کالیبره',
      desc: specs.display || 'پوشش ۱۰۰٪ فضای رنگی DCI-P3 با روشنایی بالا و نرخ نوسازی روان',
      icon: Monitor,
      color: 'hsl(var(--accent-cyan))'
    },
    {
      slot: 'hotspot-keyboard',
      position: '0 0.28 -0.3',
      normal: '0 1 0',
      title: 'کیبورد ارگونومیک با بکلایت',
      desc: 'عمق کلید بهینه با سوییچ‌های نرم جهت کار طولانی‌مدت مهندسی و برنامه‌نویسی',
      icon: Layers,
      color: 'hsl(var(--accent-purple))'
    },
    {
      slot: 'hotspot-cooling',
      position: '-0.95 0.1 -1.2',
      normal: '0 0 -1',
      title: 'سیستم خنک‌کاری اتاق بخار (Vapor Chamber)',
      desc: 'انتقال حرارت فوق‌سریع با تیغه‌های مسی بدون افت فریم پردازنده در رندرهای طولانی',
      icon: Zap,
      color: 'hsl(var(--accent-green))'
    },
    {
      slot: 'hotspot-ports',
      position: '-1.8 0.1 -0.3',
      normal: '-1 0 0',
      title: 'درگاه‌های فوق‌سریع Thunderbolt 4',
      desc: 'پهنای باند ۴۰ گیگابیت بر ثانیه با پشتیبانی از مانیتورهای خارجی و داک‌های مهندسی',
      icon: HardDrive,
      color: '#ea580c'
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="glass-panel"
      style={{
        position: 'relative',
        borderRadius: isFullscreen ? '0' : '24px',
        overflow: 'hidden',
        border: '1px solid var(--border-glass)',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(14, 165, 233, 0.08) 0%, rgba(10, 15, 26, 0.96) 85%)',
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : '580px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        zIndex: isFullscreen ? 9999 : 'auto'
      }}
    >
      {/* ── Top Bar with Controls ── */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(16px)',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px hsla(var(--accent-cyan), 0.4)'
            }}
          >
            <Rotate3d size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                نمای سه‌بعدی تعاملی ۳۶۰ درجه
              </span>
              <span 
                className="badge font-code" 
                style={{ 
                  background: 'rgba(56, 189, 248, 0.15)', 
                  color: 'hsl(var(--accent-cyan))', 
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.7rem',
                  padding: '2px 8px'
                }}
              >
                PBR WebGL 2.0
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              با ماوس یا لمس دست، دستگاه را ۳۶۰ درجه بچرخانید و بزرگ‌نمایی کنید
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Auto-Rotate Toggle */}
          <button
            type="button"
            className="btn btn-glass"
            style={{
              padding: '7px 12px',
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: autoRotate ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'
            }}
            onClick={() => setAutoRotate(!autoRotate)}
            title="چرخش خودکار"
          >
            {autoRotate ? <Pause size={14} /> : <Play size={14} />}
            <span>{autoRotate ? 'توقف چرخش' : 'چرخش خودکار'}</span>
          </button>

          {/* Reset Camera Button */}
          <button
            type="button"
            className="btn btn-glass"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            onClick={handleResetCamera}
            title="بازنشانی زاویه دید"
          >
            <RefreshCw size={14} />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            className="btn btn-glass"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'خروج از تمام‌صفحه' : 'نمایش تمام‌صفحه'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ── 3D Canvas / Model-Viewer Element ── */}
      <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: '340px' }}>
        
        {/* Loading Bar */}
        {loadProgress < 100 && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10, 15, 26, 0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 5
            }}
          >
            <Rotate3d size={40} className="animate-spin-slow" color="hsl(var(--accent-cyan))" />
            <span style={{ marginTop: '14px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              در حال بارگذاری مدل سه‌بعدی PBR...
            </span>
            <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${loadProgress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                  transition: 'width 200ms ease-out'
                }} 
              />
            </div>
            <span className="font-code" style={{ fontSize: '0.72rem', color: 'hsl(var(--accent-cyan))', marginTop: '6px' }}>
              {loadProgress}%
            </span>
          </div>
        )}

        {/* The 3D Web Component */}
        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          alt={`مدل ۳ بعدی ${productName}`}
          auto-rotate={autoRotate ? "" : undefined}
          auto-rotate-delay="1000"
          rotation-per-second="18deg"
          camera-controls=""
          touch-action="pan-y"
          camera-orbit="45deg 68deg 6.2m"
          field-of-view="30deg"
          min-field-of-view="15deg"
          max-field-of-view="45deg"
          shadow-intensity="1.6"
          shadow-softness="0.9"
          exposure="1.15"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          style={{
            width: '100%',
            height: '100%',
            outline: 'none',
            cursor: 'grab'
          }}
        >
          {/* Interactive 3D Hotspot Pins */}
          {hotspots.map((hs) => (
            <button
              key={hs.slot}
              slot={hs.slot}
              data-position={hs.position}
              data-normal={hs.normal}
              onClick={() => setActiveHotspot(activeHotspot?.slot === hs.slot ? null : hs)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: hs.color,
                border: '2px solid #fff',
                color: '#fff',
                boxShadow: `0 0 16px ${hs.color}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                outline: 'none',
                transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title={hs.title}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
            </button>
          ))}
        </model-viewer>

        {/* Active Hotspot Detail Card Popup */}
        {activeHotspot && (
          <div 
            className="glass-card animate-fade-in"
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '24px',
              maxWidth: '320px',
              padding: '16px',
              borderRadius: '16px',
              border: `1px solid ${activeHotspot.color}`,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.4)',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: activeHotspot.color }}>
                <activeHotspot.icon size={18} />
                <strong style={{ fontSize: '0.875rem' }}>{activeHotspot.title}</strong>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveHotspot(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
              >
                ×
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {activeHotspot.desc}
            </p>
          </div>
        )}

        {/* Interaction Hint Overlay */}
        <div 
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '20px',
            pointerEvents: 'none',
            fontSize: '0.72rem',
            color: 'rgba(255, 255, 255, 0.55)',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px 10px',
            borderRadius: '20px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Rotate3d size={13} />
          <span>چرخش با درگ ماوس • بزرگنمایی با اسکرول</span>
        </div>
      </div>

      {/* ── Bottom Camera Presets Bar ── */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-glass)',
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(16px)',
          overflowX: 'auto',
          zIndex: 10
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '6px', whiteSpace: 'nowrap' }}>
          زاویه دید:
        </span>
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className="btn"
              onClick={() => handleApplyPreset(p)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isActive ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: isActive ? 'none' : '1px solid var(--border-glass)',
                whiteSpace: 'nowrap',
                transition: 'all 180ms ease'
              }}
            >
              <p.icon size={13} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
