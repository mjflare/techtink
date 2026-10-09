import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, MonitorSmartphone, User, Shield, LogOut, X, ArrowLeftRight } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  cartCount, 
  compareCount = 0,
  onCartClick, 
  user, 
  onOpenAuth, 
  onLogout,
  searchQuery,
  onSearchChange,
  onOpenAbout
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'store', label: 'فروشگاه' },
    { id: 'compare', label: 'مقایسه مشخصات' },
    { id: 'support', label: 'پشتیبانی' },
    { id: 'blog', label: 'وبلاگ تکنولوژی' }
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '16px 0' }}>
      <div className="container flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo */}
        <div className="flex" style={{ alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => handleTabClick('store')}>
          <div className="badge-glow" style={{ padding: '8px', borderRadius: '8px', display: 'flex' }}>
            <MonitorSmartphone size={24} />
          </div>
          <h2 style={{ margin: 0, letterSpacing: '-0.5px' }} className="gradient-text">تک‌تینک</h2>
        </div>

        {/* Navigation */}
        <nav className="flex" style={{ gap: '8px', display: 'none' }} id="desktop-nav">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="btn btn-glass"
              style={{
                background: activeTab === tab.id ? 'var(--glass-bg-hover)' : 'transparent',
                borderColor: activeTab === tab.id ? 'hsla(var(--accent-cyan), 0.5)' : 'transparent',
                boxShadow: activeTab === tab.id ? '0 0 10px hsla(var(--accent-cyan), 0.2)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
          {onOpenAbout && (
            <button 
              onClick={onOpenAbout}
              className="btn btn-glass"
              style={{
                background: 'transparent',
                borderColor: 'transparent'
              }}
            >
              درباره ما
            </button>
          )}
          {user?.role === 'admin' && (
            <button 
              onClick={() => handleTabClick('admin')}
              className="btn"
              style={{
                background: activeTab === 'admin' ? 'hsl(var(--accent-cyan))' : 'hsla(var(--accent-cyan), 0.15)',
                color: activeTab === 'admin' ? 'white' : 'hsl(var(--accent-cyan))',
                borderColor: 'hsl(var(--accent-cyan))',
                boxShadow: '0 0 10px hsla(var(--accent-cyan), 0.2)'
              }}
            >
              <Shield size={16} /> پنل مدیریت
            </button>
          )}
        </nav>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 860px) {
            #desktop-nav { display: flex !important; }
            #mobile-menu-btn { display: none !important; }
          }
        `}} />

        {/* Actions */}
        <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', display: 'none' }} id="desktop-search">
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="جستجوی لپ‌تاپ..." 
              value={searchQuery || ''}
              onChange={e => onSearchChange && onSearchChange(e.target.value)}
              style={{ paddingRight: '40px', width: '180px', borderRadius: '20px', fontSize: '0.8125rem' }} 
            />
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 1024px) {
              #desktop-search { display: block !important; }
            }
          `}} />

          {/* User Auth Portal Button */}
          {user ? (
            <div className="flex" style={{ alignItems: 'center', gap: '6px' }}>
              <div 
                className="glass-panel flex" 
                style={{ alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', fontSize: '0.8125rem' }}
              >
                <User size={16} color="hsl(var(--accent-cyan))" />
                <span style={{ fontWeight: 'bold', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                {user.role === 'admin' && (
                  <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: 'white', padding: '2px 6px', fontSize: '0.65rem' }}>
                    مدیر
                  </span>
                )}
              </div>
              <button 
                className="btn btn-glass" 
                onClick={onLogout}
                title="خروج از حساب"
                style={{ padding: '8px', borderRadius: '50%' }}
              >
                <LogOut size={16} color="hsl(var(--accent-red))" />
              </button>
            </div>
          ) : (
            <button className="btn btn-glass" style={{ padding: '8px 12px', fontSize: '0.8125rem' }} onClick={onOpenAuth}>
              <User size={16} /> <span>ورود</span>
            </button>
          )}

          {/* Compare Button */}
          <button 
            className={`btn btn-glass btn-compare ${compareCount > 0 ? 'is-active' : ''}`}
            style={{ position: 'relative', padding: '10px' }} 
            onClick={() => handleTabClick('compare')} 
            aria-label="مقایسه مشخصات لپ‌تاپ‌ها"
            title="مقایسه مشخصات لپ‌تاپ‌ها"
          >
            <ArrowLeftRight size={20} className="compare-icon" />
            {compareCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: '#ef4444', color: 'white',
                fontSize: '11px', fontWeight: 'bold', width: '18px', height: '18px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)'
              }}>
                {compareCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button className="btn btn-glass" style={{ position: 'relative', padding: '10px' }} onClick={onCartClick} aria-label="سبد خرید">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                background: 'hsl(var(--accent-purple))', color: 'white',
                fontSize: '11px', fontWeight: 'bold', width: '18px', height: '18px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </button>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="btn btn-glass" 
            id="mobile-menu-btn" 
            style={{ padding: '10px' }}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="منوی سایت"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '12px', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
          {/* Mobile Search in Drawer */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="جستجوی مدل یا مشخصات لپ‌تاپ..." 
              value={searchQuery || ''}
              onChange={e => onSearchChange && onSearchChange(e.target.value)}
              style={{ paddingRight: '40px', width: '100%', borderRadius: '12px', fontSize: '15px' }} 
            />
          </div>

          <div className="flex" style={{ flexDirection: 'column', gap: '8px' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="btn btn-glass"
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '12px 16px', 
                  width: '100%',
                  background: activeTab === tab.id ? 'hsla(var(--accent-cyan), 0.12)' : 'transparent',
                  borderColor: activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                }}
              >
                {tab.label}
              </button>
            ))}
            {onOpenAbout && (
              <button 
                onClick={() => { setMobileMenuOpen(false); onOpenAbout(); }}
                className="btn btn-glass"
                style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%' }}
              >
                درباره ما و نشانی شوروم
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                onClick={() => handleTabClick('admin')}
                className="btn btn-primary"
                style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%' }}
              >
                <Shield size={18} /> پنل مدیریت فروشگاه
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
