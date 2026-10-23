import React, { useEffect } from 'react';
import { Clock, ShieldAlert, RefreshCw, LogOut } from 'lucide-react';
import { toPersianDigits } from '../utils/formatPrice.js';

export default function SessionTimeoutModal({ 
  isOpen, 
  remainingSeconds = 60, 
  onExtend, 
  onLogout,
  role = 'admin'
}) {
  if (!isOpen) return null;

  const isCritical = remainingSeconds <= 20;

  return (
    <div 
      className="modal-backdrop-wrapper animate-fade-in" 
      style={{ 
        zIndex: 100000, 
        backdropFilter: 'blur(8px)',
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="glass-card animate-scale-up" 
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '24px',
          padding: '28px 24px',
          border: isCritical ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: isCritical 
            ? '0 20px 60px rgba(239, 68, 68, 0.25)' 
            : '0 20px 60px rgba(245, 158, 11, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          direction: 'rtl'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Glow Accent Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: isCritical 
            ? 'linear-gradient(90deg, #ef4444, #f59e0b)' 
            : 'linear-gradient(90deg, #f59e0b, hsl(var(--accent-cyan)))'
        }} />

        {/* Pulsing Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          margin: '0 auto 16px',
          background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: isCritical ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
          animation: 'pulse 1.5s infinite'
        }}>
          {isCritical ? (
            <ShieldAlert size={32} color="#ef4444" />
          ) : (
            <Clock size={32} color="#f59e0b" />
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          {role === 'admin' ? 'هشدار انقضای نشست مدیریت' : 'هشدار انقضای نشست کاربری'}
        </h3>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 20px' }}>
          به دلیل عدم فعالیت، نشست شما جهت حفظ امنیت تا چند لحظه دیگر به صورت خودکار بسته خواهد شد.
        </p>

        {/* Live Countdown Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '16px',
          background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          border: isCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
          color: isCritical ? '#ef4444' : '#f59e0b',
          fontWeight: 800,
          fontSize: '1.15rem',
          marginBottom: '24px'
        }}>
          <Clock size={20} />
          <span>{toPersianDigits(remainingSeconds)} ثانیه تا خروج خودکار</span>
        </div>

        {/* Action Buttons with Ergonomic Touch Targets (>= 46px) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onExtend}
            style={{
              minHeight: '48px',
              fontSize: '0.95rem',
              fontWeight: 700,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={18} /> تمدید نشست و ادامه فعالیت
          </button>

          <button
            type="button"
            className="btn btn-glass"
            onClick={onLogout}
            style={{
              minHeight: '44px',
              fontSize: '0.875rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-secondary)'
            }}
          >
            <LogOut size={16} /> خروج از حساب کاربری
          </button>
        </div>
      </div>
    </div>
  );
}
