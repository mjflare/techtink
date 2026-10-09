import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
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

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('techtink_theme') || 'dark';
    } catch {
      return 'dark';
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
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
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

      {/* Floating Bottom Comparison Dock */}
      {compareList.length > 0 && activeTab !== 'compare' && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15), 0 0 20px rgba(239, 68, 68, 0.25)',
          borderRadius: '50px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '92vw',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ 
              background: '#ef4444', 
              color: 'white', 
              borderRadius: '50%', 
              width: '24px', 
              height: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
            }}>
              {compareList.length}
            </span>
            <span>دستگاه برای مقایسه انتخاب شده</span>
          </div>
          <button 
            className="btn" 
            style={{ 
              background: '#ef4444', 
              color: 'white',
              border: 'none',
              padding: '6px 16px', 
              fontSize: '0.8125rem', 
              borderRadius: '30px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              boxShadow: '0 0 14px rgba(239, 68, 68, 0.4)'
            }}
            onClick={() => handleTabChange('compare')}
          >
            <ArrowLeftRight size={14} /> مشاهده مقایسه
          </button>
          <button 
            className="btn btn-glass" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '30px' }}
            onClick={() => setCompareList([])}
          >
            پاک کردن
          </button>
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
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('store')}>ایستگاه‌های کاری هوش مصنوعی</li>
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

        <div className="container" style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
          تمامی حقوق مادی و معنوی برای فروشگاه تخصصی لپ‌تاپ تک‌تینک محفوظ است. © ۱۴۰۵
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
