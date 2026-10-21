import React, { useState } from 'react';
import { Sparkles, Cpu, Zap, Battery, ArrowLeft, ShieldCheck, CheckCircle2, Award, Laptop } from 'lucide-react';
import { handleImageError } from '../utils/imageFallback.js';

export default function FlagshipHero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const [imageLoaded, setImageLoaded] = useState(false);

  const title = c.title || 'آینده پردازش را تجربه کنید.';
  const highlightWord = c.highlightWord || 'آینده';
  const badge = c.badge || 'مدل‌های نسل جدید وارداتی با گارانتی ۶ ماهه';
  const subtitle = c.subtitle || 'عملکرد در سطح دسکتاپ، موتورهای هوش مصنوعی پردازش عصبی، و سلامت سخت‌افزاری تضمین‌شده در مجهزترین مرجع لپ‌تاپ‌های مهندسی و استوک اروپا و آمریکا.';
  const primaryBtnText = c.primaryBtnText || 'مشاهده مدل‌ها و خرید';
  const secondaryBtnText = c.secondaryBtnText || 'تماشای بررسی ویدیویی';
  const imageUrl = c.imageUrl || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80';

  const stats = (c.stats && c.stats.length > 0) ? c.stats : [
    { val: '۶۸ ترافلاپس', label: 'توان موتور عصبی (NPU)' },
    { val: '۱۷۵ وات', label: 'حداکثر توان گرافیک (TGP)' },
    { val: '۱۸ ساعت', label: 'دوام شارژ باتری' }
  ];

  const chips = (c.chips && c.chips.length > 0) ? c.chips : [
    { icon: 'Cpu', label: 'Intel Ultra / Ryzen AI' },
    { icon: 'Zap', label: 'RTX 4090 / 5090' },
    { icon: 'Battery', label: '۹۹.۹ وات‌ساعت' }
  ];

  // Render title with highlight word
  const renderTitle = () => {
    if (!highlightWord || !title.includes(highlightWord)) {
      return title;
    }
    const parts = title.split(highlightWord);
    return (
      <>
        {parts[0]}
        <span className="gradient-text">{highlightWord}</span>
        {parts.slice(1).join(highlightWord)}
      </>
    );
  };

  const getChipIcon = (name) => {
    switch (name) {
      case 'Cpu': return <Cpu size={14} className="text-cyan-600" />;
      case 'Zap': return <Zap size={14} className="text-purple-600" />;
      case 'Battery': return <Battery size={14} className="text-emerald-600" />;
      default: return <Sparkles size={14} className="text-cyan-600" />;
    }
  };

  return (
    <section className="container" style={{ paddingTop: '28px', marginBottom: '44px' }}>
      <div 
        className="glass-card"
        style={{
          padding: 'clamp(24px, 4vw, 44px)',
          borderRadius: '26px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 245, 244, 0.7) 100%)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Background Flare */}
        <div 
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />

        {/* 2-Column Responsive Layout */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
            gap: 'clamp(24px, 4vw, 48px)',
            alignItems: 'center'
          }}
        >
          {/* Right Column: Hero Headline & Value Proposition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Top Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
              <span 
                className="badge badge-glow"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: '20px'
                }}
              >
                <Sparkles size={13} />
                {badge}
              </span>
            </div>

            {/* Big Headline */}
            <h1 
              style={{
                fontSize: 'clamp(1.85rem, 3.6vw, 3.1rem)',
                fontWeight: 900,
                lineHeight: 1.25,
                margin: 0,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px'
              }}
            >
              {renderTitle()}
            </h1>

            {/* Subtitle */}
            <p 
              style={{
                fontSize: 'clamp(0.92rem, 1.4vw, 1.05rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                margin: 0,
                maxWidth: '560px'
              }}
            >
              {subtitle}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onExploreClick}
                className="btn btn-primary"
                style={{
                  padding: '12px 26px',
                  borderRadius: '14px',
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  gap: '8px'
                }}
              >
                <span>{primaryBtnText}</span>
                <ArrowLeft size={16} />
              </button>

              <button
                type="button"
                onClick={onSecondaryClick}
                className="btn btn-glass"
                style={{
                  padding: '12px 22px',
                  borderRadius: '14px',
                  fontSize: '0.90rem',
                  fontWeight: 700
                }}
              >
                {secondaryBtnText}
              </button>
            </div>

            {/* Hardware Stats Bar */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginTop: '12px',
                padding: '16px 18px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              {stats.map((s, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div 
                    className="font-tech"
                    style={{
                      fontSize: 'clamp(0.95rem, 1.8vw, 1.25rem)',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      direction: 'ltr'
                    }}
                  >
                    {s.val}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left Column: Flagship Hardware Visual Showcase */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{
                position: 'relative',
                borderRadius: '22px',
                overflow: 'hidden',
                background: '#0d1816',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.12)',
                aspectRatio: '16 / 10'
              }}
            >
              {/* Flagship Image */}
              <img 
                src={imageUrl} 
                alt="Flagship Laptop Workstation"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  handleImageError(e);
                  setImageLoaded(true);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  opacity: imageLoaded ? 1 : 0.4,
                  transition: 'opacity 0.4s ease'
                }} 
              />

              {/* Gloss Gradient Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(13, 24, 22, 0.85) 0%, rgba(13, 24, 22, 0.1) 60%, transparent 100%)',
                  pointerEvents: 'none'
                }} 
              />

              {/* Hardware Feature Chips Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  left: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {chips.map((chip, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        color: '#0f172a',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {getChipIcon(chip.icon)}
                      <span>{chip.label}</span>
                    </span>
                  ))}
                </div>

                <div 
                  style={{
                    background: 'rgba(5, 150, 105, 0.9)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>تضمین اصالت و سلامت</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
