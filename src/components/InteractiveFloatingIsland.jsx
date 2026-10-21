import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, ShoppingCart, X, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../utils/formatPrice.js';

export default function InteractiveFloatingIsland({
  compareList = [],
  setCompareList,
  comparedLaptops = [],
  toggleCompare,
  cartItems = [],
  setCartItems,
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
  const closeTimeoutRef = useRef(null);

  const cancelCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClosePopover = (delay = 280) => {
    if (windowWidth < 640) return;
    cancelCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setActivePopover(null);
    }, delay);
  };

  const handleOpenPopover = (type) => {
    cancelCloseTimeout();
    setActivePopover(type);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => cancelCloseTimeout();
  }, []);

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

  const isTouch = typeof window !== 'undefined' && (
    (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) || windowWidth < 768
  );
  const isMobile = isTouch;

  // Close popover on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        islandRef.current && 
        !islandRef.current.contains(e.target) &&
        popoverRef.current && 
        !popoverRef.current.contains(e.target)
      ) {
        cancelCloseTimeout();
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        cancelCloseTimeout();
        setActivePopover(null);
      }
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

  // Cart operations & calculations matching CartDrawer functionality
  const updateQuantity = (idx, delta) => {
    if (!setCartItems) return;
    const newItems = [...cartItems];
    if (!newItems[idx]) return;
    const currentQty = newItems[idx].quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    newItems[idx] = {
      ...newItems[idx],
      quantity: newQty
    };
    setCartItems(newItems);
  };

  const removeItem = (idx) => {
    if (!setCartItems) return;
    const removedItem = cartItems[idx];
    const newItems = [...cartItems];
    newItems.splice(idx, 1);
    setCartItems(newItems);

    toast.info('کالا از سبد خرید حذف شد', {
      description: removedItem?.name,
      action: {
        label: 'بازگردانی',
        onClick: () => {
          setCartItems(prev => {
            const restored = [...prev];
            restored.splice(idx, 0, removedItem);
            return restored;
          });
          toast.success('کالا به سبد خرید بازگردانده شد');
        }
      }
    });
  };

  const computedSubtotal = cartItems.reduce(
    (acc, item) => acc + ((item.totalPrice || item.basePrice || 0) * (item.quantity || 1)),
    0
  );
  const tax = Math.round(computedSubtotal * 0.09); // 9% Iranian VAT
  const grandTotal = computedSubtotal + tax;

  // If neither has items or if on admin panel, do not render
  if ((!hasCompare && !hasCart) || activeTab === 'admin') {
    return null;
  }

  // Popover positioning: safely anchored above the island, aligned to the left of the screen
  const popoverStyle = {
    position: 'fixed',
    bottom: isMobile ? 'calc(70px + env(safe-area-inset-bottom, 0px))' : '74px',
    left: isMobile ? '16px' : '24px',
    width: 'min(380px, calc(100vw - 32px))',
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
          onClick={() => {
            cancelCloseTimeout();
            setActivePopover(null);
          }}
        />
      )}

      {/* FLYOUT POPOVER: Compare Items */}
      {activePopover === 'compare' && hasCompare && (
        <div 
          ref={popoverRef}
          className="floating-island-popover animate-fade-in"
          onMouseEnter={cancelCloseTimeout}
          onMouseLeave={() => scheduleClosePopover(280)}
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
          {/* Invisible hover bridge extending downward to bridge gap to island */}
          <div 
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-26px',
              left: 0,
              right: 0,
              height: '30px',
              background: 'transparent',
              pointerEvents: 'auto'
            }} 
          />
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
          onMouseEnter={cancelCloseTimeout}
          onMouseLeave={() => scheduleClosePopover(280)}
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
          {/* Invisible hover bridge extending downward to bridge gap to island (desktop only) */}
          {!isTouch && (
            <div 
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '-26px',
                left: 0,
                right: 0,
                height: '30px',
                background: 'transparent',
                pointerEvents: 'auto'
              }} 
            />
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
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
              style={{ padding: '3px', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="بستن"
            >
              <X size={13} />
            </button>
          </div>

          {/* Items - Consistent with Mobile Bottom Sheet Card Design */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', marginBottom: '12px', paddingRight: '2px' }}>
            {cartItems.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 12px', 
                  borderRadius: '14px', 
                  background: '#ffffff', 
                  border: '1px solid var(--border-glass)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  position: 'relative'
                }}
              >
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,0,0,0.02)' }} 
                />
                <div style={{ flex: 1, minWidth: 0, paddingLeft: '20px' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  <div className="font-code" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: '6px' }}>
                    {item.configuration?.ram || 'پیش‌فرض'} | {item.configuration?.storage || 'پیش‌فرض'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="font-code gradient-text" style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                      {formatPrice((item.totalPrice || item.basePrice || 0) * (item.quantity || 1))}
                    </div>
                    
                    {/* Steppers (+ / -) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <button 
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 3px' }} 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(idx, -1);
                        }}
                        aria-label="کاهش تعداد"
                      >
                        -
                      </button>
                      <span className="font-code" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button 
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 3px' }} 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(idx, 1);
                        }}
                        aria-label="افزایش تعداد"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button 
                  type="button"
                  style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    left: '8px', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(idx);
                  }}
                  title="حذف از سبد"
                  aria-label="حذف این کالا"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Financial Breakdown matching CartDrawer */}
          <div style={{ padding: '10px 0', borderTop: '1px solid var(--border-glass)', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              <span>جمع مبلغ کالاها</span>
              <span className="font-code">{formatPrice(computedSubtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              <span>مالیات بر ارزش افزوده (۹٪)</span>
              <span className="font-code">{formatPrice(tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem', fontWeight: 800, marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--border-glass)' }}>
              <span>مبلغ نهایی قابل پرداخت</span>
              <span className="price-gradient-text font-tech">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '11px', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              cursor: 'pointer'
            }}
            onClick={() => {
              setActivePopover(null);
              if (onOpenCart) onOpenCart();
            }}
          >
            تکمیل سفارش و پرداخت <ArrowLeft size={16} />
          </button>
        </div>
      )}

      {/* ULTRA-COMPACT DYNAMIC ISLAND PILL (Icons Only, Hugs Content Dynamically) */}
      <div 
        ref={islandRef}
        className="floating-action-island animate-fade-in"
        onMouseEnter={cancelCloseTimeout}
        onMouseLeave={() => scheduleClosePopover(280)}
        style={{
          position: 'fixed',
          bottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : '22px',
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
      >
        {/* Invisible hover bridge extending upward toward popover (desktop pointer only) */}
        {!isTouch && (
          <div 
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-24px',
              left: 0,
              right: 0,
              height: '28px',
              background: 'transparent',
              pointerEvents: 'auto'
            }} 
          />
        )}

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
              transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={() => {
              if (!isTouch) handleOpenPopover('compare');
            }}
            onMouseLeave={() => {
              if (!isTouch) scheduleClosePopover(280);
            }}
            onClick={(e) => {
              e.stopPropagation();
              cancelCloseTimeout();
              setActivePopover(null);
              if (onGoToCompare) onGoToCompare();
            }}
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
              transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={() => {
              if (!isTouch) handleOpenPopover('cart');
            }}
            onMouseLeave={() => {
              if (!isTouch) scheduleClosePopover(280);
            }}
            onClick={(e) => {
              e.stopPropagation();
              cancelCloseTimeout();
              setActivePopover(null);
              if (onOpenCart) onOpenCart();
            }}
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
