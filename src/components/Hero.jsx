import React from 'react';
import { Cpu, Zap, Battery, ArrowLeft, Play, Shield, Award } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const badge = c.badge || 'مدل‌های نسل جدید ۲۰۲۶ موجود شد';
  const title = c.title || 'آینده پردازش را تجربه کنید.';
  const highlightWord = c.highlightWord || 'آینده';
  const subtitle = c.subtitle || 'عملکرد در سطح دسکتاپ، موتورهای هوش مصنوعی پردازش عصبی، و عمر باتری واقعی یک روز کامل را در یک شاسی آلومینیومی با ضخامت تنها ۱۸ میلی‌متر تجربه کنید.';
  const primaryBtnText = c.primaryBtnText || 'مشاهده مدل‌ها';
  const secondaryBtnText = c.secondaryBtnText || 'تماشای رویداد رونمایی';
  const imageUrl = c.imageUrl || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80';
  
  const stats = c.stats && c.stats.length === 3 ? c.stats : [
    { val: '۶۸ ترافلاپس', label: 'توان موتور عصبی' },
    { val: '۱۷۵ وات', label: 'حداکثر توان گرافیک' },
    { val: '۱۸ ساعت', label: 'دوام باتری' }
  ];

  const chips = c.chips && c.chips.length === 3 ? c.chips : [
    { icon: 'Cpu', label: 'Intel Ultra' },
    { icon: 'Zap', label: 'RTX 5090' },
    { icon: 'Battery', label: '99.9Wh' }
  ];

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

  const statColors = ['hsl(var(--accent-cyan))', 'hsl(var(--accent-purple))', 'hsl(var(--accent-green))'];

  const getChipIcon = (iconName) => {
    switch (iconName) {
      case 'Cpu': return <Cpu size={18} color="hsl(var(--accent-cyan))" />;
      case 'Zap': return <Zap size={18} color="hsl(var(--accent-purple))" />;
      case 'Battery': return <Battery size={18} color="hsl(var(--accent-green))" />;
      case 'Shield': return <Shield size={18} color="hsl(var(--accent-cyan))" />;
      case 'Award': return <Award size={18} color="hsl(var(--accent-purple))" />;
      default: return <Cpu size={18} color="hsl(var(--accent-cyan))" />;
    }
  };

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '48px' }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '32px', alignItems: 'center' }}>
        
        <div className="animate-fade-in" style={{ zIndex: 10 }}>
          <span className="badge badge-glow" style={{ marginBottom: '16px', display: 'inline-block' }}>
            {badge}
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw + 0.5rem, 3.25rem)', marginBottom: '16px', lineHeight: 1.25 }}>
            {renderTitle()}
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.125rem)', color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '520px', lineHeight: 1.7 }}>
            {subtitle}
          </p>
          
          <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onExploreClick} style={{ flexGrow: 0 }}>
              {primaryBtnText} <ArrowLeft size={18} />
            </button>
            <button 
              className="btn btn-glass" 
              style={{ flexGrow: 0 }}
              onClick={onSecondaryClick}
            >
              <Play size={15} style={{ marginLeft: '4px' }} />
              {secondaryBtnText}
            </button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', marginTop: '36px', gap: '16px' }}>
            {stats.map((st, i) => (
              <div key={i}>
                <div className="font-tech" style={{ color: statColors[i % statColors.length], fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>
                  {st.val}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card animate-fade-in" style={{ padding: '16px', position: 'relative', animationDelay: '0.2s', overflow: 'hidden' }}>
          {/* Abstract Glow Behind Image */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '80%', height: '80%', background: 'radial-gradient(circle, hsla(var(--accent-cyan), 0.2) 0%, transparent 70%)',
            filter: 'blur(40px)', zIndex: 0
          }}></div>
          
          <img 
            src={imageUrl} 
            alt="لپ‌تاپ پرچمدار" 
            style={{ width: '100%', height: 'auto', borderRadius: '8px', position: 'relative', zIndex: 1, filter: 'contrast(1.1) saturate(1.2)', display: 'block' }} 
          />
          
          <div className="glass-panel" style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '10px 14px', zIndex: 2, display: 'flex', gap: '12px', direction: 'rtl', maxWidth: 'calc(100% - 24px)' }}>
            {chips.map((chip, idx) => (
              <div key={idx} className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                {getChipIcon(chip.icon)}
                <span className="font-tech" style={{ fontSize: '11px', fontWeight: 700 }}>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
