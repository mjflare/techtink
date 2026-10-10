import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, ShoppingCart, X, Trash2, ChevronUp } from 'lucide-react';
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

  // Re-align dynamically based on actual screen size reported by browser
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
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

  // Hide if no items or if on admin panel
  const hasCompare = compareList.length > 0 && activeTab !== 'compare';
  const hasCart = cartCount > 0;

  if ((!hasCompare && !hasCart) || activeTab === 'admin') {
    return null;
  }

  // Calculate dynamic responsive positioning based on windowWidth
  const mobileContainerStyle = {
    position: 'fixed',
    bottom: '16px',
    left: '12px',
    right: '12px',
    maxWidth: '440px',
    margin: '0 auto',
    width: 'calc(100% - 24px)',
    zIndex: 1020,
    boxSizing: 'border-box'
  };

  const desktopContainerStyle = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'max-content',
    maxWidth: 'calc(100vw - 32px)',
    zIndex: 1020,
    boxSizing: 'border-box'
  };

  const popoverPositionStyle = isMobile ? {
    position: 'fixed',
    bottom: '76px',
    left: '12px',
    right: '12px',
    maxWidth: '440px',
    margin: '0 auto',
    width: 'calc(100% - 24px)',
    zIndex: 1025,
    boxSizing: 'border-box'
  } : {
    position: 'fixed',
    bottom: '82px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '380px',
    maxWidth: 'calc(100vw - 32px)',
    zIndex: 1025,
    boxSizing: 'border-box'
  };

  return (
    <>
      {/* Mobile Backdrop to allow 1-tap dismiss */}
      {isMobile && activePopover && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1015,
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }}
          onClick={() => setActivePopover(null)}
        />
      )}

      {/* 1. INTERACTIVE FLYOUT POPOVER (Positioned directly in viewport, NEVER in transformed container) */}
      {activePopover === 'compare' && hasCompare && (
        <div 
          ref={popoverRef}
          className="floating-island-popover animate-fade-in"
          style={{
            ...popoverPositionStyle,
            background: 'var(--glass-card-bg)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--glass-specular), 0 24px 60px rgba(0, 0, 0, 0.38)',
            borderRadius: '22px',
            padding: isMobile ? '14px' : '18px',
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
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                لیست مقایسه ({comparedLaptops.length} از ۳ مدل)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => { setCompareList([]); setActivePopover(null); }} 
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px' }}
                title="حذف تمام موارد"
              >
                حذف همه
              </button>
              <button 
                type="button" 
                onClick={() => setActivePopover(null)} 
                className="btn btn-glass" 
                style={{ padding: '4px', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="بستن پنجره"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List of Laptops */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto', marginBottom: '12px', paddingLeft: '4px' }}>
            {comparedLaptops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                موردی برای مقایسه انتخاب نشده است.
              </div>
            ) : (
              comparedLaptops.map(item => (
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
                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,0,0,0.05)' }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.brand ? `${item.brand} ${item.model}` : item.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--accent-cyan))', fontWeight: 700, marginTop: '2px' }}>
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
                    style={{ padding: '4px', borderRadius: '50%', width: '26px', height: '26px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                    title="حذف از مقایسه"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Primary Action Button */}
          <button 
            type="button" 
            className="btn" 
            style={{ 
              width: '100%', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '11px', 
              borderRadius: '14px', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.42)',
              cursor: 'pointer'
            }}
            onClick={() => {
              setActivePopover(null);
              if (onGoToCompare) onGoToCompare();
            }}
          >
            <ArrowLeftRight size={15} /> مشاهده جدول مقایسه کامل
          </button>
        </div>
      )}

      {/* FLYOUT POPOVER: Cart Items */}
      {activePopover === 'cart' && hasCart && (
        <div 
          ref={popoverRef}
          className="floating-island-popover animate-fade-in"
          style={{
            ...popoverPositionStyle,
            background: 'var(--glass-card-bg)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--glass-specular), 0 24px 60px rgba(0, 0, 0, 0.38)',
            borderRadius: '22px',
            padding: isMobile ? '14px' : '18px',
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
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                سبد خرید شما ({cartCount} کالا)
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setActivePopover(null)} 
              className="btn btn-glass" 
              style={{ padding: '4px', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="بستن پنجره"
            >
              <X size={13} />
            </button>
          </div>

          {/* Cart Item List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto', marginBottom: '12px', paddingLeft: '4px' }}>
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
                  style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,0,0,0.05)' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>تعداد: {item.quantity}</span>
                    <span style={{ color: 'hsl(var(--accent-cyan))', fontWeight: 700 }}>
                      {formatPrice((item.totalPrice || item.basePrice || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal & Primary CTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border-glass)', marginBottom: '12px', fontSize: '0.875rem', fontWeight: 700 }}>
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
              padding: '11px', 
              borderRadius: '14px', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              boxShadow: '0 4px 16px hsla(var(--accent-purple), 0.42)',
              cursor: 'pointer'
            }}
            onClick={() => {
              setActivePopover(null);
              if (onOpenCart) onOpenCart();
            }}
          >
            <ShoppingCart size={15} /> مشاهده سبد و تکمیل سفارش
          </button>
        </div>
      )}

      {/* 2. THE FLOATING BOTTOM ACTION ISLAND (Realigned dynamically based on browser screen width) */}
      <div 
        ref={islandRef}
        className="floating-action-island animate-fade-in"
        style={{
          ...(isMobile ? mobileContainerStyle : desktopContainerStyle),
          background: 'var(--glass-card-bg)',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--glass-specular), 0 16px 45px rgba(0, 0, 0, 0.22)',
          borderRadius: isMobile ? '24px' : '34px',
          padding: isMobile ? '5px 8px' : '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'center',
          gap: isMobile ? '6px' : '10px'
        }}
        onMouseLeave={() => {
          if (!isMobile) setActivePopover(null);
        }}
      >
        {/* Compare Capsule */}
        {hasCompare && (
          <div 
            className="floating-island-capsule"
            style={{
              flex: isMobile ? 1 : 'initial',
              justifyContent: isMobile ? 'center' : 'flex-start',
              background: activePopover === 'compare' ? 'var(--glass-bg-hover)' : 'transparent'
            }}
            onMouseEnter={() => {
              if (!isMobile) setActivePopover('compare');
            }}
            onClick={() => setActivePopover(prev => prev === 'compare' ? null : 'compare')}
            title="مشاهده موارد مقایسه"
          >
            <span style={{ 
              background: '#ef4444', 
              color: 'white', 
              borderRadius: '50%', 
              width: '20px', 
              height: '20px', 
              minWidth: '20px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
            }}>
              {compareList.length}
            </span>

            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              whiteSpace: 'nowrap'
            }}>
              {isMobile ? 'مقایسه' : `${compareList.length} مدل در مقایسه`}
            </span>

            <button 
              type="button"
              className="btn island-action-btn" 
              style={{ 
                background: '#ef4444', 
                color: 'white',
                border: 'none',
                padding: '4px 10px', 
                fontSize: '0.75rem', 
                borderRadius: '16px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onGoToCompare) onGoToCompare();
              }}
              title="مشاهده مقایسه"
            >
              <ArrowLeftRight size={12} />
              {!isMobile && <span>مشاهده</span>}
            </button>

            <button 
              type="button"
              className="btn btn-glass island-clear-btn" 
              style={{ 
                padding: '2px', 
                borderRadius: '50%', 
                width: '22px', 
                height: '22px', 
                minHeight: '22px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer' 
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCompareList([]);
                setActivePopover(null);
              }}
              title="پاک کردن مقایسه‌ها"
              aria-label="پاک کردن مقایسه‌ها"
            >
              <X size={11} />
            </button>
          </div>
        )}

        {/* Divider between Compare and Cart if both exist */}
        {hasCompare && hasCart && (
          <div 
            style={{ 
              width: '1px', 
              height: isMobile ? '18px' : '22px', 
              background: 'var(--border-glass)', 
              flexShrink: 0,
              margin: '0 2px'
            }} 
          />
        )}

        {/* Cart Capsule */}
        {hasCart && (
          <div 
            className="floating-island-capsule"
            style={{
              flex: isMobile ? 1 : 'initial',
              justifyContent: isMobile ? 'center' : 'flex-start',
              background: activePopover === 'cart' ? 'var(--glass-bg-hover)' : 'transparent'
            }}
            onMouseEnter={() => {
              if (!isMobile) setActivePopover('cart');
            }}
            onClick={() => setActivePopover(prev => prev === 'cart' ? null : 'cart')}
            title="مشاهده سبد خرید"
          >
            <span style={{ 
              background: 'hsl(var(--accent-purple))', 
              color: 'white', 
              borderRadius: '50%', 
              width: '20px', 
              height: '20px', 
              minWidth: '20px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              boxShadow: '0 0 10px hsla(var(--accent-purple), 0.5)'
            }}>
              {cartCount}
            </span>

            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              whiteSpace: 'nowrap'
            }}>
              {isMobile ? 'سبد خرید' : `سبد (${formatPrice(cartSubtotal)})`}
            </span>

            <button 
              type="button"
              className="btn island-action-btn" 
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))', 
                color: 'white',
                border: 'none',
                padding: '4px 10px', 
                fontSize: '0.75rem', 
                borderRadius: '16px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                boxShadow: '0 0 10px hsla(var(--accent-purple), 0.35)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenCart) onOpenCart();
              }}
              title="مشاهده سبد خرید"
            >
              <ShoppingCart size={12} />
              {!isMobile && <span>مشاهده</span>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
