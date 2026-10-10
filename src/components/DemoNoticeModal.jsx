import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, X, CheckCircle, ShieldCheck, ArrowLeft, Terminal, Cpu } from 'lucide-react';

export default function DemoNoticeModal({ settings = {}, isOpen, onClose, onOpenAdmin }) {
  if (!isOpen) return null;

  const title = settings?.demo_notice_title || 'نسخه آزمایشی وب‌سایت تک‌تینک (Demo Mode)';
  const badge = settings?.demo_notice_badge || 'حالت آزمایشی / در حال تست';
  const body = settings?.demo_notice_body || 'به فروشگاه تخصصی لپ‌تاپ تک‌تینک خوش آمدید! وب‌سایت در حال حاضر در فاز آزمایشی و ارزیابی عملکرد (Demo Mode) قرار دارد. تمامی مشخصات فنی، مقایسه سخت‌افزاری و تست مراحل ثبت سفارش فعال بوده و تراکنش‌ها جنبه آزمایشی دارند.';
  const btnText = settings?.demo_notice_btn || 'متوجه شدم، ورود به وب‌سایت';

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass-card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: '24px',
          background: '#ffffff',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.16), 0 0 30px rgba(245, 158, 11, 0.1)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top Glowing Ambient Bar */}
        <div 
          style={{
            height: '4px',
            width: '100%',
            background: 'linear-gradient(90deg, #f59e0b, #ef4444, #06b6d4, #10b981)',
          }}
        />

        {/* Modal Close Button */}
        <button 
          onClick={onClose}
          className="btn-icon"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#f1f5f9',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          title="بستن پنجره"
        >
          <X size={18} />
        </button>

        {/* Modal Body */}
        <div style={{ padding: '32px 28px 24px 28px' }}>
          
          {/* Badge & Icon Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.15))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}
            >
              <Sparkles size={22} className="spin-slow" />
            </div>

            <div>
              <div 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#f59e0b'
                }}
              >
                <span 
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 8px #f59e0b'
                  }}
                />
                {badge}
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {title}
              </h3>
            </div>
          </div>

          {/* Description Message */}
          <p 
            style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.925rem', 
              lineHeight: '1.8', 
              margin: '0 0 20px 0',
              textAlign: 'justify'
            }}
          >
            {body}
          </p>

          {/* Feature Highlights Grid */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              marginBottom: '24px'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.2)'
              }}
            >
              <Cpu size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.825rem', lineHeight: '1.5' }}>
                <strong style={{ color: '#06b6d4' }}>کاتالوگ و بنچمارک سخت‌افزاری:</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>مشخصات فنی و رادار عملکرد پردازنده/گرافیک به طور کامل در دسترس است.</span>
              </div>
            </div>

            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.825rem', lineHeight: '1.5' }}>
                <strong style={{ color: '#10b981' }}>تست فرآیند خرید و پرداخت:</strong>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>می‌توانید ثبت سفارش، کدهای تخفیف، انتخاب درگاه و آدرس تحویل را آزمایش کنید.</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={onClose}
              className="btn btn-primary"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle size={18} />
              <span>{btnText}</span>
            </button>

            {onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="btn btn-glass"
                style={{
                  padding: '12px 16px',
                  fontSize: '0.8rem',
                  borderRadius: '14px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Terminal size={14} />
                <span>ورود به پنل مدیریت</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Compact Header / Dock Indicator Badge
export function DemoHeaderBadge({ settings, onClick }) {
  const isDemo = (settings?.site_mode ?? 'demo') === 'demo';
  const showBadge = (settings?.demo_notice_badge_header ?? '1') === '1';

  if (!isDemo || !showBadge) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-glass animate-pulse"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        color: '#f59e0b',
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      title="وب‌سایت در حالت آزمایشی (Demo) است - کلیک جهت مشاهده جزئیات"
    >
      <span 
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#f59e0b',
          boxShadow: '0 0 6px #f59e0b'
        }}
      />
      <Sparkles size={12} />
      <span>نسخه آزمایشی (Demo)</span>
    </button>
  );
}
