import React, { useState, useEffect } from 'react';
import { Flame, Clock, Sparkles, Copy, Check, ArrowLeft, Tag, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatPersianDateTime } from '../utils/jalaliDate.js';

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
    toast.success('کد تخفیف کپی شد', {
      description: config.promoCode,
      duration: 2500
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const themes = {
    fiery: {
      gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)',
      border: 'rgba(249, 115, 22, 0.28)',
      glow: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
      badgeBg: '#ea580c',
      badgeColor: '#ffffff',
      icon: Flame,
      tagBg: '#ffedd5',
      tagColor: '#c2410c'
    },
    neon: {
      gradient: 'linear-gradient(135deg, #f0f9ff 0%, #ede9fe 50%, #fae8ff 100%)',
      border: 'rgba(14, 165, 233, 0.28)',
      glow: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
      badgeBg: '#0284c7',
      badgeColor: '#ffffff',
      icon: Sparkles,
      tagBg: '#e0f2fe',
      tagColor: '#0369a1'
    },
    emerald: {
      gradient: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #ccfbf1 100%)',
      border: 'rgba(16, 185, 129, 0.28)',
      glow: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
      badgeBg: '#059669',
      badgeColor: '#ffffff',
      icon: ShieldCheck,
      tagBg: '#dcfce7',
      tagColor: '#15803d'
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
          boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.03)'
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
                    background: '#ffffff', 
                    border: '1.5px dashed rgba(2, 132, 199, 0.35)', 
                    borderRadius: '14px', 
                    padding: '5px 8px 5px 14px',
                    gap: '10px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <Tag size={15} color="#0284c7" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>کد تخفیف:</span>
                  <span className="font-code" style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '1px', color: '#0284c7' }}>
                    {config.promoCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      background: copied ? '#10b981' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: copied ? '0 2px 8px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(2, 132, 199, 0.3)'
                    }}
                    title="کپی کردن کد تخفیف"
                  >
                    {copied ? <Check size={13} color="#ffffff" /> : <Copy size={13} color="#ffffff" />}
                    <span>{copied ? 'کپی شد!' : 'کپی'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Left: Live Countdown Clock */}
          {config.expireDate && (
            <div 
              style={{ 
                background: '#ffffff',
                padding: '18px 22px', 
                borderRadius: '18px', 
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                textAlign: 'center',
                minWidth: '240px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.785rem', marginBottom: '12px', fontWeight: 600 }}>
                <Clock size={15} color="#0284c7" />
                <span>زمان باقی‌مانده تا پایان تخفیف:</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <div style={{ background: '#f8fafc', border: '1px solid rgba(0, 0, 0, 0.06)', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.seconds)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>ثانیه</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid rgba(0, 0, 0, 0.06)', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.minutes)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>دقیقه</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid rgba(0, 0, 0, 0.06)', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.hours)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>ساعت</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid rgba(0, 0, 0, 0.06)', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                  <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {toPersianNum(timeLeft.days)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>روز</div>
                </div>
              </div>

              {config.expireDate && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '10px', fontWeight: 600 }}>
                  مهلت: {formatPersianDateTime(config.expireDate)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
