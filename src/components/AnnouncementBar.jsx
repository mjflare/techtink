import React, { useState } from 'react';
import { Megaphone, ArrowLeft, X, Sparkles, Flame, CheckCircle } from 'lucide-react';

export default function AnnouncementBar({ config, onExploreClick }) {
  const [dismissed, setDismissed] = useState(false);

  if (!config || !config.active || dismissed) return null;

  const styleMap = {
    cyan: {
      bg: 'linear-gradient(90deg, hsla(var(--accent-cyan), 0.15) 0%, hsla(var(--accent-purple), 0.15) 100%)',
      border: 'hsla(var(--accent-cyan), 0.3)',
      badgeBg: 'hsl(var(--accent-cyan))',
      badgeColor: '#000',
      icon: Sparkles
    },
    orange: {
      bg: 'linear-gradient(90deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
      border: 'rgba(249, 115, 22, 0.35)',
      badgeBg: '#f97316',
      badgeColor: '#fff',
      icon: Flame
    },
    purple: {
      bg: 'linear-gradient(90deg, hsla(var(--accent-purple), 0.18) 0%, hsla(var(--accent-pink), 0.15) 100%)',
      border: 'hsla(var(--accent-purple), 0.35)',
      badgeBg: 'hsl(var(--accent-purple))',
      badgeColor: '#fff',
      icon: Sparkles
    },
    green: {
      bg: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
      border: 'rgba(16, 185, 129, 0.35)',
      badgeBg: '#10b981',
      badgeColor: '#000',
      icon: CheckCircle
    }
  };

  const currentStyle = styleMap[config.style] || styleMap.cyan;
  const IconComp = currentStyle.icon;

  const handleLinkClick = (e) => {
    if (config.linkUrl === '#catalog' && onExploreClick) {
      e.preventDefault();
      onExploreClick();
    }
  };

  return (
    <div 
      className="animate-fade-in"
      style={{
        background: currentStyle.bg,
        borderBottom: `1px solid ${currentStyle.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '8px 16px',
        position: 'relative',
        zIndex: 110,
        fontSize: '0.825rem',
        color: 'var(--text-primary)'
      }}
    >
      <div 
        className="container flex" 
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px', 
          flexWrap: 'wrap',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span 
            className="badge" 
            style={{ 
              background: currentStyle.badgeBg, 
              color: currentStyle.badgeColor, 
              fontWeight: 800, 
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <IconComp size={12} />
            {config.badge || 'خبر ویژه'}
          </span>
          <span style={{ fontWeight: 600 }}>{config.text}</span>
        </div>

        {config.linkText && (
          <a
            href={config.linkUrl || '#catalog'}
            onClick={handleLinkClick}
            className="btn btn-glass"
            style={{
              padding: '2px 10px',
              fontSize: '0.75rem',
              height: '24px',
              borderRadius: '8px',
              borderColor: currentStyle.border,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none'
            }}
          >
            <span>{config.linkText}</span>
            <ArrowLeft size={12} />
          </a>
        )}

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute',
            left: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          title="بستن اعلان"
          aria-label="بستن اعلان"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
