import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeftRight, MapPin, Phone, Clock, ExternalLink, ShoppingCart, X } from 'lucide-react';
import { formatPrice } from './utils/formatPrice.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import LaptopCatalog from './components/LaptopCatalog.jsx';
import LaptopCustomizerModal from './components/LaptopCustomizerModal.jsx';
import SpecCompareModal from './components/SpecCompareModal.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import SupportSection from './components/SupportSection.jsx';
import BlogSection from './components/BlogSection.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AuthModal from './components/AuthModal.jsx';
import ProductPage from './components/ProductPage.jsx';
import AboutUsModal from './components/AboutUsModal.jsx';
import { TelegramIcon, InstagramIcon, BaleIcon, AparatIcon } from './components/SocialLogos.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('store'); // 'store', 'product', 'compare', 'support', 'blog', 'admin'
  const [laptops, setLaptops] = useState([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  
  const [selectedLaptop, setSelectedLaptop] = useState(null); // For Quick Customizer Modal
  const [compareList, setCompareList] = useState([]); // Array of laptop IDs
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [storeAboutInfo, setStoreAboutInfo] = useState(null);

  // Floating Island Interactive Flyout Popover ('compare' | 'cart' | null)
  const [activeIslandPopover, setActiveIslandPopover] = useState(null);
  const islandRef = useRef(null);

  // Outside click / ESC listener to close floating island popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (islandRef.current && !islandRef.current.contains(e.target)) {
        setActiveIslandPopover(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveIslandPopover(null);
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

  // Compute compared laptop objects
  const comparedLaptops = useMemo(() => {
    return (laptops || []).filter(l => compareList.includes(l.id));
  }, [laptops, compareList]);
  
  // Persistent Cart
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + ((item.totalPrice || item.basePrice || 0) * (item.quantity || 1)), 0);

  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  // Theme State ('light' by default, switchable to 'dark')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('techtink_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('techtink_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load & URL routing
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setLaptops)
      .catch(() => {});

    fetch('/api/about')
      .then(res => res.json())
      .then(data => { if (data && !data.error) setStoreAboutInfo(data); })
      .catch(() => {});

    // Parse URL on first load
    const path = window.location.pathname;
    if (path.startsWith('/product/')) {
      const slug = path.replace('/product/', '').replace(/\/$/, '');
      if (slug) {
        setSelectedProductSlug(slug);
        setActiveTab('product');
      }
    } else if (path === '/admin') {
      setActiveTab('admin');
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleAddToCart = (item) => {
    setCartItems(prev => {
      // Check if identical item (same id and same configuration) exists
      const configKey = JSON.stringify(item.configuration || {});
      const existingIdx = prev.findIndex(p => p.productId === item.productId && JSON.stringify(p.configuration || {}) === configKey);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity || 1;
        return updated;
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const toggleCompare = (id) => {
    setCompareList(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id]; // Max 3 items
      return [...prev, id];
    });
  };

  const handleSelectProduct = (slug) => {
    setSelectedProductSlug(slug);
    setActiveTab('product');
    window.history.pushState(null, '', `/product/${slug}`);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'store') {
      window.history.pushState(null, '', '/');
    } else if (tabId === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else {
      window.history.pushState(null, '', `/${tabId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequireAuthForCheckout = () => {
    setAuthNotice('برای تکمیل سفارش و پرداخت، لطفاً ابتدا وارد حساب کاربری خود شوید یا حساب بسازید.');
    setPendingCheckout(true);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setAuthNotice(null);
    if (pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('store');
    }
  };

  return (
    <div>
      <Header 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        cartCount={cartCount}
        compareCount={compareList.length}
        onCartClick={() => setIsCartOpen(true)}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAbout={() => setIsAboutUsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        laptops={laptops}
        onSelectProduct={handleSelectProduct}
      />

      {/* 1. STORE VIEW */}
      {activeTab === 'store' && (
        <main>
          <Hero onExploreClick={() => {
            const el = document.getElementById('catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }} />
          <LaptopCatalog 
            laptops={laptops} 
            onCustomize={setSelectedLaptop}
            onCompare={toggleCompare}
            compareList={compareList}
            onSelectProduct={handleSelectProduct}
            searchQuery={searchQuery}
          />
        </main>
      )}

      {/* 2. DEDICATED PRODUCT PAGE */}
      {activeTab === 'product' && selectedProductSlug && (
        <main>
          <ProductPage 
            productSlug={selectedProductSlug}
            onBack={() => handleTabChange('store')}
            onAddToCart={handleAddToCart}
            onCompare={toggleCompare}
            compareList={compareList}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSelectProduct={handleSelectProduct}
          />
        </main>
      )}

      {/* 3. COMPARE VIEW */}
      {activeTab === 'compare' && (
        <main className="container" style={{ paddingTop: '60px', paddingBottom: '80px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '24px' }}>مقایسه <span className="gradient-text">مشخصات فنی</span></h1>
          {compareList.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 24px', maxWidth: '600px', margin: '0 auto' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                شما هنوز هیچ لپ‌تاپی برای مقایسه انتخاب نکرده‌اید. برای افزودن به بخش فروشگاه بروید.
              </p>
              <button className="btn btn-primary" onClick={() => handleTabChange('store')}>
                مشاهده محصولات فروشگاه
              </button>
            </div>
          ) : (
            <SpecCompareModal 
              compareList={compareList} 
              laptops={laptops} 
              onClose={() => handleTabChange('store')} 
            />
          )}
        </main>
      )}

      {/* 4. SUPPORT & BLOG VIEWS */}
      {activeTab === 'support' && <SupportSection />}
      {activeTab === 'blog' && <BlogSection onSelectProduct={handleSelectProduct} />}

      {/* 5. ADMIN PORTAL */}
      {activeTab === 'admin' && (
        <main>
          <AdminDashboard user={currentUser} onLogout={handleLogout} />
        </main>
      )}

      {/* MODALS & OVERLAYS */}
      {/* Quick Customizer Modal */}
      {selectedLaptop && (
        <LaptopCustomizerModal 
          laptop={selectedLaptop} 
          onClose={() => setSelectedLaptop(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        setCartItems={setCartItems}
        user={currentUser}
        onOpenAuth={handleRequireAuthForCheckout}
        onCheckoutClick={() => {
          if (!currentUser) {
            handleRequireAuthForCheckout();
          } else {
            setIsCheckoutOpen(true);
          }
        }}
      />

      {/* Iranian Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal 
          cartItems={cartItems}
          onClose={() => setIsCheckoutOpen(false)}
          onClearCart={() => setCartItems([])}
          user={currentUser}
          onOpenAuth={handleRequireAuthForCheckout}
        />
      )}

      {/* Customer Login & Registration Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthNotice(null);
          setPendingCheckout(false);
        }}
        onLogin={handleLoginSuccess}
        notice={authNotice}
      />

      {/* Interactive Floating Bottom Action Island */}
      {(compareList.length > 0 || cartCount > 0) && activeTab !== 'admin' && (
        <div 
          ref={islandRef}
          className="floating-action-island animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'var(--glass-card-bg)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--glass-specular), 0 16px 45px rgba(0, 0, 0, 0.22)',
            borderRadius: '34px',
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: 'calc(100vw - 20px)',
            boxSizing: 'border-box'
          }}
          onMouseLeave={() => setActiveIslandPopover(null)}
        >
          {/* FLYOUT POPOVER: Compare Items */}
          {activeIslandPopover === 'compare' && compareList.length > 0 && (
            <div 
              className="floating-island-popover animate-fade-in"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(350px, calc(100vw - 24px))',
                background: 'var(--glass-card-bg)',
                backdropFilter: 'blur(28px) saturate(190%)',
                WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                border: '1px solid var(--border-glass)',
                boxShadow: 'var(--glass-specular), 0 24px 55px rgba(0, 0, 0, 0.35)',
                borderRadius: '20px',
                padding: '16px',
                zIndex: 1005,
                boxSizing: 'border-box',
                color: 'var(--text-primary)',
                direction: 'rtl',
                textAlign: 'right'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popover Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeftRight size={14} color="#ef4444" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>لیست مقایسه ({comparedLaptops.length} مدل)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => { setCompareList([]); setActiveIslandPopover(null); }} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', padding: '3px 6px', borderRadius: '6px' }}
                    title="حذف همه مدل‌ها"
                  >
                    حذف همه
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setActiveIslandPopover(null)} 
                    className="btn btn-glass" 
                    style={{ padding: '3px', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="بستن پنجره"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Laptop List */}
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
                      title="حذف این مورد از مقایسه"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Button */}
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
                  setActiveIslandPopover(null);
                  handleTabChange('compare');
                }}
              >
                <ArrowLeftRight size={14} /> مشاهده جدول مقایسه کامل
              </button>
            </div>
          )}

          {/* FLYOUT POPOVER: Cart Items */}
          {activeIslandPopover === 'cart' && cartCount > 0 && (
            <div 
              className="floating-island-popover animate-fade-in"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(350px, calc(100vw - 24px))',
                background: 'var(--glass-card-bg)',
                backdropFilter: 'blur(28px) saturate(190%)',
                WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                border: '1px solid var(--border-glass)',
                boxShadow: 'var(--glass-specular), 0 24px 55px rgba(0, 0, 0, 0.35)',
                borderRadius: '20px',
                padding: '16px',
                zIndex: 1005,
                boxSizing: 'border-box',
                color: 'var(--text-primary)',
                direction: 'rtl',
                textAlign: 'right'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popover Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'hsla(var(--accent-purple), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={14} color="hsl(var(--accent-purple))" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>سبد خرید شما ({cartCount} کالا)</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveIslandPopover(null)} 
                  className="btn btn-glass" 
                  style={{ padding: '3px', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="بستن پنجره"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Items List */}
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

              {/* Total & Action Button */}
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
                  setActiveIslandPopover(null);
                  setIsCartOpen(true);
                }}
              >
                <ShoppingCart size={14} /> مشاهده سبد و تکمیل سفارش
              </button>
            </div>
          )}

          {/* Compare Capsule in Bottom Dock */}
          {compareList.length > 0 && activeTab !== 'compare' && (
            <div 
              className="floating-island-capsule"
              onMouseEnter={() => setActiveIslandPopover('compare')}
              onClick={() => setActiveIslandPopover(prev => prev === 'compare' ? null : 'compare')}
              title="کلیک یا هاور برای مشاهده اقلام مقایسه"
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
              <span className="floating-island-desktop-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                مدل در مقایسه
              </span>
              <button 
                type="button"
                className="btn island-action-btn" 
                style={{ 
                  background: '#ef4444', 
                  color: 'white',
                  border: 'none',
                  padding: '5px 12px', 
                  fontSize: '0.78rem', 
                  borderRadius: '18px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.35)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTabChange('compare');
                }}
                title="مشاهده جدول مقایسه کامل"
              >
                <ArrowLeftRight size={13} /> <span className="island-btn-text">مقایسه</span>
              </button>
              <button 
                type="button"
                className="btn btn-glass island-clear-btn" 
                style={{ padding: '3px', borderRadius: '50%', width: '24px', height: '24px', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCompareList([]);
                  setActiveIslandPopover(null);
                }}
                title="پاک کردن مقایسه‌ها"
                aria-label="پاک کردن مقایسه‌ها"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Divider between Compare and Cart if both exist */}
          {compareList.length > 0 && activeTab !== 'compare' && cartCount > 0 && (
            <div className="island-divider" style={{ width: '1px', height: '20px', background: 'var(--border-glass)', flexShrink: 0 }} />
          )}

          {/* Cart Capsule in Bottom Dock */}
          {cartCount > 0 && (
            <div 
              className="floating-island-capsule"
              onMouseEnter={() => setActiveIslandPopover('cart')}
              onClick={() => setActiveIslandPopover(prev => prev === 'cart' ? null : 'cart')}
              title="کلیک یا هاور برای مشاهده اقلام سبد خرید"
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
              <span className="floating-island-desktop-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                سبد خرید ({formatPrice(cartSubtotal)})
              </span>
              <button 
                type="button"
                className="btn island-action-btn" 
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))', 
                  color: 'white',
                  border: 'none',
                  padding: '5px 12px', 
                  fontSize: '0.78rem', 
                  borderRadius: '18px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  boxShadow: '0 0 12px hsla(var(--accent-purple), 0.35)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCartOpen(true);
                }}
                title="مشاهده سبد خرید و تسویه حساب"
              >
                <ShoppingCart size={13} /> <span className="island-btn-text">سبد</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Footer */}
      <footer className="glass-panel" style={{ borderRadius: 0, borderBottom: 'none', borderLeft: 'none', borderRight: 'none', padding: '60px 0 40px', marginTop: 'auto' }}>
        <div className="container grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
          
          {/* Column 1: Store & Location */}
          <div>
            <h2 className="gradient-text" style={{ marginBottom: '16px' }}>تک‌تینک</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.8', marginBottom: '16px' }}>
              نخستین مرجع مهندسی بررسی سخت‌افزاری، تست بنچمارک و عرضه تخصصی لپ‌تاپ‌های گیمینگ و ورک‌استیشن در ایران.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div className="flex" style={{ gap: '8px', alignItems: 'flex-start' }}>
                <MapPin size={16} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{storeAboutInfo?.store_address || 'تهران، مجتمع تجاری نور، واحد ۸۰۲۴'}</span>
              </div>
              <div className="flex" style={{ gap: '8px', alignItems: 'center' }}>
                <Phone size={16} color="hsl(var(--accent-green))" style={{ flexShrink: 0 }} />
                <span style={{ direction: 'ltr' }}>{storeAboutInfo?.store_phone || '۰۲۱-۸۸۲۲۶۶۰۰'}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-glass" 
              style={{ marginTop: '16px', fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px' }}
              onClick={() => setIsAboutUsOpen(true)}
            >
              مشاهده اطلاعات کامل و نقشه شوروم 📍
            </button>
          </div>

          {/* Column 2: Products */}
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>فروشگاه و دسته‌ها</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('store')}>لپ‌تاپ‌های گیمینگ</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('store')}>لپ‌تاپ‌های مهندسی و معماری</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('store')}>لپ‌تاپ‌های ورک‌استیشن هوش مصنوعی</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('compare')}>ابزار مقایسه مشخصات فنی</li>
            </ul>
          </div>

          {/* Column 3: Customer Services */}
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>خدمات، رزرو و گارانتی</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('support')}>رزرو وقت تست حضوری در شوروم</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('support')}>ثبت درخواست ارتقای سیستم و فن</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('support')}>استعلام شماره سریال و گارانتی طلایی</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('support')}>دانلود درایورها و فرم‌ور اختصاصی</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('blog')}>وبلاگ نقد و بررسی تخصصی</li>
            </ul>
          </div>

          {/* Column 4: Official Social Channels */}
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>شبکه‌های رسمی تک‌تینک</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '14px', lineHeight: 1.6 }}>
              برای تماشای ویدیوهای بررسی، آنباکسینگ‌ها و اطلاعیه‌های روزانه:
            </p>
            <div className="flex" style={{ gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              <a 
                href={storeAboutInfo?.telegram_url || 'https://t.me/techtink'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-glass social-icon-btn"
                style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                title="کانال رسمی تلگرام تک‌تینک"
                aria-label="تلگرام"
              >
                <TelegramIcon size={22} color="#29a9ea" />
              </a>

              <a 
                href={storeAboutInfo?.instagram_url || 'https://instagram.com/techtink'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-glass social-icon-btn"
                style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                title="صفحه اینستاگرام تک‌تینک"
                aria-label="اینستاگرام"
              >
                <InstagramIcon size={22} color="#e1306c" />
              </a>

              <a 
                href={storeAboutInfo?.bale_url || 'https://ble.ir/techtink'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-glass social-icon-btn"
                style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                title="کانال پیام‌رسان بله تک‌تینک"
                aria-label="پیام‌رسان بله"
              >
                <BaleIcon size={22} />
              </a>

              <a 
                href={storeAboutInfo?.aparat_url || 'https://www.aparat.com/techtink'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-glass social-icon-btn"
                style={{ width: '44px', height: '44px', borderRadius: '12px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                title="کانال ویدیوهای آپارات تک‌تینک"
                aria-label="آپارات"
              >
                <AparatIcon size={22} />
              </a>

            </div>
          </div>

        </div>

        <div className="container flex" style={{ 
          marginTop: '40px', 
          paddingTop: '24px', 
          borderTop: '1px solid var(--border-glass)', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '14px',
          color: 'var(--text-secondary)', 
          fontSize: '0.8125rem' 
        }}>
          <div>تمامی حقوق مادی و معنوی برای فروشگاه تخصصی لپ‌تاپ تک‌تینک محفوظ است. © ۱۴۰۵</div>

          {/* Discreet Theme Switcher in Footer for Night Mode Seekers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>تنظیمات تم صفحه:</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-glass"
              style={{
                padding: '5px 14px',
                borderRadius: '18px',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid var(--border-glass)'
              }}
              title="تغییر وضعیت به حالت شب یا روز"
            >
              {theme === 'dark' ? '🌙 حالت شب فعال است (تغییر به روز)' : '☀️ حالت روز فعال است (تغییر به شب)'}
            </button>
          </div>
        </div>
      </footer>

      {/* About Us & Showroom Location Modal */}
      <AboutUsModal
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
        onOpenSupport={() => handleTabChange('support')}
      />
    </div>
  );
}

export default App;
