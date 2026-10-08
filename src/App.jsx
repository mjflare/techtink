import React, { useState, useEffect } from 'react';
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

function App() {
  const [activeTab, setActiveTab] = useState('store'); // 'store', 'product', 'compare', 'support', 'blog', 'admin'
  const [laptops, setLaptops] = useState([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  
  const [selectedLaptop, setSelectedLaptop] = useState(null); // For Quick Customizer Modal
  const [compareList, setCompareList] = useState([]); // Array of laptop IDs
  
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

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load & URL routing
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setLaptops)
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

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
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
        onCartClick={() => setIsCartOpen(true)}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
      {activeTab === 'blog' && <BlogSection />}

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
        onCheckoutClick={() => setIsCheckoutOpen(true)}
      />

      {/* Iranian Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal 
          cartItems={cartItems}
          onClose={() => setIsCheckoutOpen(false)}
          onClearCart={() => setCartItems([])}
          user={currentUser}
        />
      )}

      {/* Customer Login & Registration Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLoginSuccess}
      />

      {/* Global Footer */}
      <footer className="glass-panel" style={{ borderRadius: 0, borderBottom: 'none', borderLeft: 'none', borderRight: 'none', padding: '60px 0', marginTop: 'auto' }}>
        <div className="container grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <h2 className="gradient-text" style={{ marginBottom: '16px' }}>تک‌تینک</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.8' }}>
              پیشرو در عرضه لپ‌تاپ‌های مهندسی و گیمینگ با معماری هوش مصنوعی، قیمت‌گذاری شفاف به تومان و پشتیبانی از درگاه‌های عضو شتاب و موتور جستجوی ترب (Torob).
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>فروشگاه و دسته‌ها</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('store')}>لپ‌تاپ‌های گیمینگ</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('store')}>لپ‌تاپ‌های تولید محتوا</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('store')}>ورک‌استیشن‌های هوش مصنوعی</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('compare')}>ابزار مقایسه مشخصات</li>
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.125rem' }}>خدمات مشتریان</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('support')}>استعلام شماره سریال و گارانتی</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('support')}>دانلود درایورها و فرم‌ور</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('support')}>ثبت تیکت پشتیبانی فنی</li>
              <li style={{ cursor: 'pointer' }} onClick={() => handleTabChange('blog')}>وبلاگ و راهنمای خرید</li>
            </ul>
          </div>
        </div>
        <div className="container" style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
          تمامی حقوق مادی و معنوی برای فروشگاه تخصصی لپ‌تاپ تک‌تینک محفوظ است. © ۱۴۰۵
        </div>
      </footer>
    </div>
  );
}

export default App;
