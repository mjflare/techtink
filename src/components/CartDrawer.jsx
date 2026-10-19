import React from 'react';
import { X, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../utils/formatPrice.js';

export default function CartDrawer({ isOpen, onClose, cartItems, setCartItems, onCheckoutClick, user, onOpenAuth }) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0);
  const tax = Math.round(subtotal * 0.09); // 9% Iranian VAT
  const total = subtotal + tax;

  const updateQuantity = (idx, delta) => {
    const newItems = [...cartItems];
    newItems[idx].quantity += delta;
    if (newItems[idx].quantity < 1) newItems[idx].quantity = 1;
    setCartItems(newItems);
  };

  const removeItem = (idx) => {
    const removedItem = cartItems[idx];
    const newItems = [...cartItems];
    newItems.splice(idx, 1);
    setCartItems(newItems);
    
    // Sonner toast with Emil Kowalski undo action recipe
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

  return (
    <>
      <div 
        className="cart-drawer-backdrop" 
        onClick={onClose}
        aria-label="بستن سبد خرید"
      />
      <div className="cart-drawer-panel">
        {/* iOS Native Bottom Sheet Grab Handle (Mobile Only) */}
        <div className="sheet-grab-handle" />
        
        <div className="flex" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="hsl(var(--accent-cyan))" />
            سبد خرید شما ({cartItems.length})
          </h2>
          <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }} onClick={onClose} aria-label="بستن">
            <X size={20} />
          </button>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '60px' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.35 }} />
              <p style={{ fontSize: '0.95rem' }}>سبد خرید شما در حال حاضر خالی است.</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div 
                key={idx} 
                className="flex" 
                style={{ 
                  padding: '16px', 
                  gap: '16px', 
                  position: 'relative', 
                  background: '#ffffff', 
                  borderRadius: '16px', 
                  border: '1px solid var(--border-glass)', 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  transition: 'transform 140ms var(--ease-out), border-color 140ms var(--ease-out)'
                }}
              >
                <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px' }} />
                
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem' }}>{item.name}</h4>
                  <div className="font-code" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {item.configuration?.ram} | {item.configuration?.storage}
                  </div>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="font-code gradient-text" style={{ fontWeight: 'bold', fontSize: '0.9375rem' }}>
                      {formatPrice(item.totalPrice)}
                    </div>
                    
                    <div className="flex" style={{ alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0 4px' }} 
                        onClick={() => updateQuantity(idx, -1)}
                        aria-label="کاهش تعداد"
                      >
                        -
                      </button>
                      <span className="font-code" style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0 4px' }} 
                        onClick={() => updateQuantity(idx, 1)}
                        aria-label="افزایش تعداد"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    left: '12px', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                  onClick={() => removeItem(idx)}
                  title="حذف از سبد"
                  aria-label="حذف این کالا"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-glass)', background: '#f8fafc' }}>
            <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>جمع مبلغ کالاها</span>
              <span className="font-code">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>مالیات بر ارزش افزوده (۹٪)</span>
              <span className="font-code">{formatPrice(tax)}</span>
            </div>
            <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '18px', fontSize: '1.25rem', fontWeight: 'bold' }}>
              <span>مبلغ نهایی قابل پرداخت</span>
              <span className="gradient-text font-code">{formatPrice(total)}</span>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '15px', fontSize: '1.05rem' }} 
              onClick={() => { 
                onClose(); 
                if (!user) {
                  if (onOpenAuth) onOpenAuth();
                } else {
                  onCheckoutClick();
                }
              }}
            >
              تکمیل سفارش و پرداخت <ArrowLeft size={18} />
            </button>
            {!user && (
              <div style={{ marginTop: '10px', fontSize: '0.8125rem', color: 'hsl(var(--accent-cyan))', textAlign: 'center', opacity: 0.9 }}>
                جهت نهایی‌سازی خرید، ورود به حساب کاربری الزامی است
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
