import React, { useState, useEffect } from 'react';
import { Flame, Clock, Sparkles, Copy, Check, ArrowLeft, Tag, ShieldCheck } from 'lucide-react';

export default function PromotionBanner({ config, onExploreClick }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!config?.expireDate) return;

    const calculateTime = () => {
      const difference = new Date(config.expireDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config?.expireDate]);

  if (!config || !config.active) return null;

  const handleCopyCode = () => {
    if (!config.promoCode) return;
    navigator.clipboard.writeText(config.promoCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const themes = {
    fiery: {
      gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.22) 50%, rgba(245, 158, 11, 0.15) 100%)',
      border: 'rgba(249, 115, 22, 0.45)',
      glow: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)',
      badgeBg: '#f97316',
      badgeColor: '#fff',
      icon: Flame,
      tagBg: 'rgba(249, 115, 22, 0.15)',
      tagColor: '#fb923c'
    },
    neon: {
      gradient: 'linear-gradient(135deg, hsla(var(--accent-cyan), 0.18) 0%, hsla(var(--accent-purple), 0.25) 50%, hsla(var(--accent-pink), 0.15) 100%)',
      border: 'hsla(var(--accent-cyan), 0.4)',
      glow: 'radial-gradient(circle, hsla(var(--accent-cyan), 0.25) 0%, transparent 70%)',
      badgeBg: 'hsl(var(--accent-cyan))',
      badgeColor: '#000',
      icon: Sparkles,
      tagBg: 'hsla(var(--accent-cyan), 0.15)',
      tagColor: 'hsl(var(--accent-cyan))'
    },
    emerald: {
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.22) 50%, rgba(20, 184, 166, 0.15) 100%)',
      border: 'rgba(16, 185, 129, 0.45)',
      glow: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
      badgeBg: '#10b981',
      badgeColor: '#000',
      icon: ShieldCheck,
      tagBg: 'rgba(16, 185, 129, 0.15)',
      tagColor: '#34d399'
    }
  };

  const currentTheme = themes[config.theme] || themes.fiery;
  const IconComponent = currentTheme.icon;

  const toPersianNum = (n) => String(n).padStart(2, '0').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

  return (
    <div className="container" style={{ marginBottom: '44px' }}>
      <div 
        className="glass-card animate-fade-in"
        style={{
          position: 'relative',
          padding: '28px 24px',
          borderRadius: '24px',
          background: currentTheme.gradient,
          borderColor: currentTheme.border,
          overflow: 'hidden',
          boxShadow: 'var(--glass-specular), 0 20px 40px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Ambient Back Glow */}
        <div style={{
          position: 'absolute', top: '-40%', right: '-20%', width: '380px', height: '380px',
          background: currentTheme.glow, filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0
        }} />

        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 1 }}>
          
          {/* Right Info Section */}
          <div style={{ flex: '1 1 340px', minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span 
                className="badge" 
                style={{ 
                  background: currentTheme.badgeBg, 
                  color: currentTheme.badgeColor, 
                  fontWeight: 800, 
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <IconComponent size={14} />
                {config.badge || 'کمپین تخفیف شگفت‌انگیز'}
              </span>

              {config.discountPercent && (
                <span 
                  className="font-tech"
                  style={{ 
                    background: currentTheme.tagBg, 
                    color: currentTheme.tagColor, 
                    fontWeight: 900, 
                    fontSize: '0.85rem',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`
                  }}
                >
                  {config.discountPercent}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)', margin: '0 0 10px 0', lineHeight: '1.3' }}>
              {config.title || 'جشنواره لپ‌تاپ‌های مهندسی و رندرینگ'}
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.65', margin: '0 0 18px 0', maxWidth: '580px' }}>
              {config.subtitle || 'تخفیف ویژه برای لپ‌تاپ‌های برگزیده استوک با تست ۳۰ روزه سلامت سخت‌افزار.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={onExploreClick}
                style={{ padding: '10px 18px', fontSize: '0.875rem', gap: '8px' }}
              >
                <span>{config.btnText || 'مشاهده لپ‌تاپ‌های جشنواره'}</span>
                <ArrowLeft size={16} />
              </button>

              {config.promoCode && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px dashed var(--border-glass)', 
                    borderRadius: '12px', 
                    padding: '4px 8px 4px 12px',
                    gap: '8px'
                  }}
                >
                  <Tag size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>کد تخفیف:</span>
                  <span className="font-code" style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '1px', color: 'hsl(var(--accent-cyan))' }}>
                    {config.promoCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="btn btn-glass"
                    style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', height: '28px' }}
                    title="کپی کردن کد تخفیف"
                  >
                    {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copied ? 'کپی شد!' : 'کپی'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Left: Live Countdown Clock */}
          {config.expireDate && (
            <div 
              className="glass-panel" 
              style={{ 
                padding: '16px 20px', 
                borderRadius: '18px', 
                border: `1px solid ${currentTheme.border}`,
                textAlign: 'center',
                minWidth: '240px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.785rem', marginBottom: '10px' }}>
                <Clock size={14} />
                <span>زمان باقی‌مانده تا پایان تخفیف:</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 10px', borderRadius: '10px', minWidth: '46px' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.seconds)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>ثانیه</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 10px', borderRadius: '10px', minWidth: '46px' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.minutes)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>دقیقه</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 10px', borderRadius: '10px', minWidth: '46px' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.hours)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>ساعت</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.18)', padding: '8px 10px', borderRadius: '10px', minWidth: '46px' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.days)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>روز</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
