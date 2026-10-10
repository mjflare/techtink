import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, ShoppingCart, X } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function InteractiveFloatingIsland({
  compareList = [],
  setCompareList,
  comparedLaptops = [],
  toggleCompare,
  cartItems = [],
  cartCount = 0,
  cartSubtotal = 0,
  onOpenCart,
  onGoToCompare,
  activeTab
}) {
  const [activePopover, setActivePopover] = useState(null); // 'compare' | 'cart' | null
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const islandRef = useRef(null);
  const popoverRef = useRef(null);

  // Monitor screen resizing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = windowWidth < 640;

  // Close popover on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        islandRef.current && 
        !islandRef.current.contains(e.target) &&
        popoverRef.current && 
        !popoverRef.current.contains(e.target)
      ) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActivePopover(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Determine active states
  const hasCompare = compareList.length > 0 && activeTab !== 'compare';
  const hasCart = cartCount > 0;

  // If neither has items or if on admin panel, do not render
  if ((!hasCompare && !hasCart) || activeTab === 'admin') {
    return null;
  }

  // Popover positioning: safely anchored above the island, aligned to the left of the screen
  const popoverStyle = {
    position: 'fixed',
    bottom: isMobile ? '70px' : '78px',
    left: isMobile ? '16px' : '24px',
    width: 'min(350px, calc(100vw - 32px))',
    maxWidth: 'calc(100vw - 32px)',
    zIndex: 1030,
    boxSizing: 'border-box'
  };

  return (
    <>
      {/* Mobile backdrop for 1-tap dismiss */}
      {isMobile && activePopover && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1020,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }}
          onClick={() => setActivePopover(null)}
        />
      )}

      {/* FLYOUT POPOVER: Compare Items */}
      {activePopover === 'compare' && hasCompare && (
        <div 
          ref={popoverRef}
          className="floating-island-popover animate-fade-in"
          style={{
            ...popoverStyle,
            background: 'var(--glass-card-bg)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--glass-specular), 0 20px 50px rgba(0, 0, 0, 0.35)',
            borderRadius: '20px',
            padding: '16px',
            color: 'var(--text-primary)',
            direction: 'rtl',
            textAlign: 'right'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftRight size={15} color="#ef4444" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                لیست مقایسه ({comparedLaptops.length} مدل)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => { setCompareList([]); setActivePopover(null); }} 
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', padding: '3px 6px', borderRadius: '6px' }}
                title="حذف تمام مدل‌ها"
              >
                حذف همه
              </button>
              <button 
                type="button" 
                onClick={() => setActivePopover(null)} 
                className="btn btn-glass" 
                style={{ padding: '3px', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="بستن"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '12px' }}>
            {comparedLaptops.map(item => (
              <div 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '8px 10px', 
                  borderRadius: '12px', 
                  background: 'var(--glass-bg-hover)', 
                  border: '1px solid var(--border-glass)' 
                }}
              >
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,0,0,0.05)' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.brand ? `${item.brand} ${item.model}` : item.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-cyan))', fontWeight: 700, marginTop: '2px' }}>
                    {formatPrice(item.price)}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompare(item.id);
                  }}
                  className="btn btn-glass"
                  style={{ padding: '4px', borderRadius: '50%', width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                  title="حذف از مقایسه"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button 
            type="button" 
            className="btn" 
            style={{ 
              width: '100%', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '10px', 
              borderRadius: '12px', 
              fontSize: '0.825rem', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              cursor: 'pointer'
            }}
            onClick={() => {
              setActivePopover(null);
              if (onGoToCompare) onGoToCompare();
            }}
          >
            <ArrowLeftRight size={14} /> مشاهده جدول مقایسه کامل
          </button>
        </div>
      )}

      {/* FLYOUT POPOVER: Cart Items */}
      {activePopover === 'cart' && hasCart && (
        <div 
          ref={popoverRef}
          className="floating-island-popover animate-fade-in"
          style={{
            ...popoverStyle,
            background: 'var(--glass-card-bg)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--glass-specular), 0 20px 50px rgba(0, 0, 0, 0.35)',
            borderRadius: '20px',
            padding: '16px',
            color: 'var(--text-primary)',
            direction: 'rtl',
            textAlign: 'right'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'hsla(var(--accent-purple), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={15} color="hsl(var(--accent-purple))" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                سبد خرید شما ({cartCount} کالا)
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setActivePopover(null)} 
              className="btn btn-glass" 
              style={{ padding: '3px', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="بستن"
            >
              <X size={12} />
            </button>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '12px' }}>
            {cartItems.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '8px 10px', 
                  borderRadius: '12px', 
                  background: 'var(--glass-bg-hover)', 
                  border: '1px solid var(--border-glass)' 
                }}
              >
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,0,0,0.05)' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>تعداد: {item.quantity}</span>
                    <span style={{ color: 'hsl(var(--accent-cyan))', fontWeight: 700 }}>
                      {formatPrice((item.totalPrice || item.basePrice || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total & CTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border-glass)', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>مبلغ کل سبد:</span>
            <span style={{ color: 'hsl(var(--accent-cyan))' }}>{formatPrice(cartSubtotal)}</span>
          </div>

          <button 
            type="button" 
            className="btn" 
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))', 
              color: 'white', 
              border: 'none', 
              padding: '10px', 
              borderRadius: '12px', 
              fontSize: '0.825rem', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              boxShadow: '0 4px 14px hsla(var(--accent-purple), 0.4)',
              cursor: 'pointer'
            }}
            onClick={() => {
              setActivePopover(null);
              if (onOpenCart) onOpenCart();
            }}
          >
            <ShoppingCart size={14} /> مشاهده سبد و تکمیل سفارش
          </button>
        </div>
      )}

      {/* ULTRA-COMPACT DYNAMIC ISLAND PILL (Icons Only, Hugs Content Dynamically) */}
      <div 
        ref={islandRef}
        className="floating-action-island animate-fade-in"
        style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '22px',
          left: isMobile ? '16px' : '24px',
          zIndex: 1025,
          background: 'var(--glass-card-bg)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--glass-specular), 0 12px 36px rgba(0, 0, 0, 0.24)',
          borderRadius: '30px',
          padding: '4px 6px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          width: 'max-content',
          boxSizing: 'border-box',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseLeave={() => {
          if (!isMobile) setActivePopover(null);
        }}
      >
        {/* 1. Compare Icon Button */}
        {hasCompare && (
          <button
            type="button"
            className="btn-glass"
            style={{
              position: 'relative',
              width: '42px',
              height: '42px',
              padding: 0,
              borderRadius: '21px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: activePopover === 'compare' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent',
              background: activePopover === 'compare' ? 'rgba(239, 68, 68, 0.16)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={() => {
              if (!isMobile) setActivePopover('compare');
            }}
            onClick={() => setActivePopover(prev => prev === 'compare' ? null : 'compare')}
            title={`مقایسه مشخصات (${compareList.length} مدل)`}
            aria-label="مشاهده مقایسه لپ‌تاپ‌ها"
          >
            <ArrowLeftRight size={19} color="#ef4444" />
            <span style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.7)'
            }}>
              {compareList.length}
            </span>
          </button>
        )}

        {/* Divider if both exist */}
        {hasCompare && hasCart && (
          <div style={{ 
            width: '1px', 
            height: '20px', 
            background: 'var(--border-glass)', 
            margin: '0 2px', 
            flexShrink: 0 
          }} />
        )}

        {/* 2. Cart Icon Button */}
        {hasCart && (
          <button
            type="button"
            className="btn-glass"
            style={{
              position: 'relative',
              width: '42px',
              height: '42px',
              padding: 0,
              borderRadius: '21px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: activePopover === 'cart' ? '1px solid hsla(var(--accent-purple), 0.5)' : '1px solid transparent',
              background: activePopover === 'cart' ? 'hsla(var(--accent-purple), 0.16)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={() => {
              if (!isMobile) setActivePopover('cart');
            }}
            onClick={() => setActivePopover(prev => prev === 'cart' ? null : 'cart')}
            title={`سبد خرید (${cartCount} کالا)`}
            aria-label="مشاهده سبد خرید"
          >
            <ShoppingCart size={19} color="hsl(var(--accent-purple))" />
            <span style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              background: 'hsl(var(--accent-purple))',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px hsla(var(--accent-purple), 0.7)'
            }}>
              {cartCount}
            </span>
          </button>
        )}
      </div>
    </>
  );
}
