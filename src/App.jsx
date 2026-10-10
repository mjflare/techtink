import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeftRight, MapPin, Phone, Clock, ExternalLink, ShoppingCart, X } from 'lucide-react';
import { formatPrice } from './utils/formatPrice.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import AnnouncementBar from './components/AnnouncementBar.jsx';
import PromotionBanner from './components/PromotionBanner.jsx';
import ProductShowcase from './components/ProductShowcase.jsx';
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
import UserDashboard from './components/UserDashboard.jsx';
import InteractiveFloatingIsland from './components/InteractiveFloatingIsland.jsx';
import DemoNoticeModal from './components/DemoNoticeModal.jsx';
import { TelegramIcon, InstagramIcon, BaleIcon, AparatIcon } from './components/SocialLogos.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('store'); // 'store', 'product', 'compare', 'support', 'blog', 'admin'
  const [laptops, setLaptops] = useState([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  
  const [selectedLaptop, setSelectedLaptop] = useState(null); // For Quick Customizer Modal
  const [compareList, setCompareList] = useState([]); // Array of laptop IDs
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [storeAboutInfo, setStoreAboutInfo] = useState(null);
  const [homepageConfig, setHomepageConfig] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [isDemoNoticeOpen, setIsDemoNoticeOpen] = useState(false);

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

    fetch('/api/homepage')
      .then(res => res.json())
      .then(data => { if (data && !data.error) setHomepageConfig(data); })
      .catch(() => {});

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setSiteSettings(data);
          const isDemo = (data.site_mode ?? 'demo') === 'demo';
          const noticeActive = (data.demo_notice_active ?? '1') === '1';
          const dismissed = sessionStorage.getItem('techtink_demo_notice_dismissed');
          if (isDemo && noticeActive && !dismissed) {
            setIsDemoNoticeOpen(true);
          }
        }
      })
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
    } else if (path === '/account' || path === '/profile') {
      try {
        const saved = localStorage.getItem('user');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('account');
        }
      } catch {
        setActiveTab('account');
      }
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

  // Safety guard: Administrators should never stay on customer account tab
  useEffect(() => {
    if (currentUser?.role === 'admin' && activeTab === 'account') {
      setActiveTab('admin');
    }
  }, [currentUser, activeTab]);

  const handleTabChange = (tabId) => {
    let targetTab = tabId;
    // Admins have no customer account dashboard; redirect to admin portal
    if (targetTab === 'account' && currentUser?.role === 'admin') {
      targetTab = 'admin';
    }
    setActiveTab(targetTab);
    if (targetTab === 'store') {
      window.history.pushState(null, '', '/');
      fetch('/api/homepage')
        .then(res => res.json())
        .then(data => { if (data && !data.error) setHomepageConfig(data); })
        .catch(() => {});
    } else if (targetTab === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else {
      window.history.pushState(null, '', `/${targetTab}`);
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
    } else if (user?.role === 'admin') {
      handleTabChange('admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    if (activeTab === 'admin' || activeTab === 'account') {
      setActiveTab('store');
    }
  };

  return (
    <div>
      {/* 0. DYNAMIC ANNOUNCEMENT BAR */}
      <AnnouncementBar 
        config={homepageConfig?.announcement} 
        onExploreClick={() => {
          const el = document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

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
        siteSettings={siteSettings}
        onOpenDemoNotice={() => setIsDemoNoticeOpen(true)}
      />

      {/* 1. STORE VIEW */}
      {activeTab === 'store' && (
        <main>
          <Hero 
            config={homepageConfig?.hero}
            onExploreClick={() => {
              const el = document.getElementById('catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onSecondaryClick={() => handleTabChange('blog')}
          />

          <PromotionBanner 
            config={homepageConfig?.promotion}
            onExploreClick={() => {
              const el = document.getElementById('catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          <ProductShowcase 
            config={homepageConfig?.showcase}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
          />

          <LaptopCatalog 
            laptops={laptops} 
            onCustomize={setSelectedLaptop}
            onCompare={toggleCompare}
            compareList={compareList}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
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
              onAddToCart={handleAddToCart}
              onSelectProduct={handleSelectProduct}
            />
          )}
        </main>
      )}

      {/* 4. SUPPORT & BLOG VIEWS */}
      {activeTab === 'support' && <SupportSection />}
      {activeTab === 'blog' && <BlogSection onSelectProduct={handleSelectProduct} />}

      {/* 5. ADMIN PORTAL */}
      {(activeTab === 'admin' || (activeTab === 'account' && currentUser?.role === 'admin')) && (
        <main>
          <AdminDashboard 
            user={currentUser} 
            onLogout={handleLogout} 
            siteSettings={siteSettings}
            onSettingsUpdated={(updated) => setSiteSettings(prev => ({ ...prev, ...updated }))}
          />
        </main>
      )}

      {/* 6. USER ACCOUNT & ORDERS DASHBOARD (CUSTOMERS ONLY) */}
      {activeTab === 'account' && currentUser?.role !== 'admin' && (
        <main>
          {currentUser ? (
            <UserDashboard 
              user={currentUser} 
              onLogout={handleLogout} 
              onSelectProduct={handleSelectProduct} 
              onGoToStore={() => handleTabChange('store')} 
              onGoToSupport={() => handleTabChange('support')} 
              onGoToAdmin={() => handleTabChange('admin')}
              onUpdateUser={(u) => {
                setCurrentUser(u);
                try { localStorage.setItem('user', JSON.stringify(u)); } catch {}
              }} 
            />
          ) : (
            <div className="container" style={{ paddingTop: '80px', paddingBottom: '100px', textAlign: 'center' }}>
              <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 28px', borderRadius: '24px' }}>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '14px' }}>ورود به حساب کاربری</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.7' }}>
                  برای مشاهده وضعیت سفارش‌ها، پیگیری کد رهگیری مرسولات و نوبت‌های ثبت‌شده، لطفاً وارد حساب خود شوید.
                </p>
                <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => setIsAuthModalOpen(true)}>
                  ورود / ثبت‌نام در سایت
                </button>
              </div>
            </div>
          )}
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

      {/* Interactive Floating Bottom Action Island (Dynamically realigned based on browser screen size) */}
      <InteractiveFloatingIsland
        compareList={compareList}
        setCompareList={setCompareList}
        comparedLaptops={comparedLaptops}
        toggleCompare={toggleCompare}
        cartItems={cartItems}
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        onOpenCart={() => setIsCartOpen(true)}
        onGoToCompare={() => handleTabChange('compare')}
        activeTab={activeTab}
      />

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

      {/* Demo Mode Notice Modal */}
      <DemoNoticeModal
        settings={siteSettings}
        isOpen={isDemoNoticeOpen}
        onClose={() => {
          try { sessionStorage.setItem('techtink_demo_notice_dismissed', '1'); } catch {}
          setIsDemoNoticeOpen(false);
        }}
        onOpenAdmin={() => handleTabChange('admin')}
      />
    </div>
  );
}

export default App;
