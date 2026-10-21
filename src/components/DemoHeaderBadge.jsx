import React from 'react';
import { Sparkles } from 'lucide-react';

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

export default DemoHeaderBadge;
