import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Menu, MonitorSmartphone, User, Shield, LogOut, X, ArrowLeftRight, Sun, Moon, ArrowLeft } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  cartCount, 
  compareCount = 0,
  onCartClick, 
  user, 
  onOpenAuth, 
  onLogout,
  searchQuery = '',
  onSearchChange,
  onOpenAbout,
  theme = 'dark',
  onToggleTheme,
  laptops = [],
  onSelectProduct
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const tabs = [
    { id: 'store', label: 'فروشگاه' },
    { id: 'support', label: 'پشتیبانی' },
    { id: 'blog', label: 'وبلاگ تکنولوژی' }
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  // Real-time Search Matcher
  const searchMatches = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (laptops || []).filter(item => {
      const corpus = [
        item.name,
        item.brand,
        item.model,
        item.category,
        item.tagline,
        item.specs?.cpu,
        item.specs?.gpu,
        item.specs?.ram,
        item.specs?.storage,
        item.chassis,
        item.specs?.chassis,
        item.slug
      ].filter(Boolean).join(' ').toLowerCase();

      return terms.every(t => corpus.includes(t));
    });
  }, [laptops, searchQuery]);

  // Click outside to close desktop search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchItem = (slug) => {
    setSearchFocused(false);
    setMobileSearchFocused(false);
    setMobileMenuOpen(false);
    if (onSelectProduct) {
      onSelectProduct(slug);
    }
  };

  const handleViewAllSearch = () => {
    setSearchFocused(false);
    setMobileSearchFocused(false);
    setMobileMenuOpen(false);
    setActiveTab('store');
    setTimeout(() => {
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleViewAllSearch();
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
    }
  };

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '14px 0' }}>
      <div className="container flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo */}
        <div className="flex" style={{ alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => handleTabClick('store')}>
          <div className="badge-glow" style={{ padding: '8px', borderRadius: '10px', display: 'flex' }}>
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
          @media (min-width: 900px) {
            #desktop-nav { display: flex !important; }
            #mobile-menu-btn { display: none !important; }
          }
        `}} />

        {/* Actions Area */}
        <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
          
          {/* Desktop Search with Live Preview */}
          <div 
            ref={desktopSearchRef} 
            style={{ position: 'relative', display: 'none' }} 
            id="desktop-search"
          >
            <Search 
              size={17} 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: searchFocused ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)',
                pointerEvents: 'none',
                transition: 'color 0.2s'
              }} 
            />
            <input 
              type="text" 
              placeholder="جستجوی مدل، پردازنده، ورک‌استیشن..." 
              value={searchQuery || ''}
              onChange={e => {
                if (onSearchChange) onSearchChange(e.target.value);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              style={{ 
                paddingRight: '38px', 
                paddingLeft: searchQuery ? '32px' : '14px',
                width: searchFocused ? '260px' : '190px', 
                borderRadius: '22px', 
                fontSize: '0.8125rem',
                transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s'
              }} 
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  if (onSearchChange) onSearchChange('');
                  setSearchFocused(false);
                }}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%'
                }}
                title="پاک کردن جستجو"
              >
                <X size={14} />
              </button>
            )}

            {/* Desktop Live Search Preview Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div 
                className="glass-panel animate-fade-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '390px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  borderRadius: '18px',
                  padding: '10px',
                  zIndex: 1000,
                  boxShadow: 'var(--glass-specular), 0 24px 50px rgba(0, 0, 0, 0.45)'
                }}
              >
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 10px', borderBottom: '1px solid var(--border-glass)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span>نتایج زنده ({searchMatches.length} مورد)</span>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--accent-cyan))' }}>کلید Enter برای کاتالوگ کامل</span>
                </div>

                {searchMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {searchMatches.slice(0, 5).map(item => (
                      <div
                        key={item.id || item.slug}
                        onClick={() => handleSelectSearchItem(item.slug)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 10px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          background: 'transparent'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <img 
                          src={item.images?.[0] || '/vite.svg'} 
                          alt={item.name} 
                          style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', background: 'var(--table-stripe)', flexShrink: 0, padding: '2px', border: '1px solid var(--border-glass)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'ltr', textAlign: 'right' }}>
                            {item.specs?.cpu?.split('(')[0]?.trim()} | {item.specs?.gpu?.split('(')[0]?.trim()}
                          </div>
                          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span className="badge" style={{ padding: '1px 6px', fontSize: '0.65rem', background: 'hsla(var(--accent-cyan), 0.12)', color: 'hsl(var(--accent-cyan))' }}>
                              {item.category}
                            </span>
                            <span className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'hsl(var(--accent-cyan))' }}>
                              {formatPrice(item.basePrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {searchMatches.length > 5 && (
                      <div style={{ textAlign: 'center', padding: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        + {searchMatches.length - 5} محصول منطبق دیگر
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleViewAllSearch}
                      style={{ width: '100%', marginTop: '6px', padding: '8px 12px', fontSize: '0.8rem', borderRadius: '10px' }}
                    >
                      مشاهده همه در کاتالوگ فروشگاه <ArrowLeft size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '22px 14px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      موردی برای «{searchQuery}» پیدا نشد
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      پیشنهاد: مدل پردازنده، برند (مثل ThinkPad، Legion، Dell) یا ورک‌استیشن را جستجو کنید.
                    </p>
                  </div>
                )}
              </div>
            )}
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

          {/* iOS-Style Segmented Theme Toggle Switch */}
          {onToggleTheme && (
            <div 
              className="theme-switch-control"
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleTheme(); } }}
              title={theme === 'dark' ? 'حالت شب فعال است — کلیک برای حالت روز' : 'حالت روز فعال است — کلیک برای حالت شب'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-glass)',
                borderRadius: '24px',
                padding: '3px',
                cursor: 'pointer',
                userSelect: 'none',
                boxShadow: 'var(--glass-specular)'
              }}
            >
              {/* Sliding Active Pill */}
              <div 
                style={{
                  position: 'absolute',
                  top: '3px',
                  bottom: '3px',
                  right: theme === 'dark' ? '3px' : 'calc(50% + 1px)',
                  left: theme === 'dark' ? 'calc(50% + 1px)' : '3px',
                  borderRadius: '18px',
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
                    : '#ffffff',
                  boxShadow: theme === 'dark'
                    ? '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)'
                    : '0 2px 8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
                  transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 0
                }}
              />

              {/* Dark Option (شب) */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: theme === 'dark' ? '#f8fafc' : 'var(--text-secondary)',
                  opacity: theme === 'dark' ? 1 : 0.6,
                  transition: 'all 0.25s ease'
                }}
              >
                <Moon size={14} color={theme === 'dark' ? '#818cf8' : 'currentColor'} style={{ filter: theme === 'dark' ? 'drop-shadow(0 0 5px rgba(129, 140, 248, 0.7))' : 'none' }} />
                <span>شب</span>
              </div>

              {/* Light Option (روز) */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: theme === 'light' ? '#0f172a' : 'var(--text-secondary)',
                  opacity: theme === 'light' ? 1 : 0.6,
                  transition: 'all 0.25s ease'
                }}
              >
                <Sun size={14} color={theme === 'light' ? '#f59e0b' : 'currentColor'} style={{ filter: theme === 'light' ? 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.7))' : 'none' }} />
                <span>روز</span>
              </div>
            </div>
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
          
          {/* Mobile Search with Preview */}
          <div ref={mobileSearchRef} style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="جستجوی مدل، پردازنده، ورک‌استیشن..." 
              value={searchQuery || ''}
              onChange={e => {
                if (onSearchChange) onSearchChange(e.target.value);
                setMobileSearchFocused(true);
              }}
              onFocus={() => setMobileSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              style={{ paddingRight: '40px', paddingLeft: searchQuery ? '36px' : '14px', width: '100%', borderRadius: '14px', fontSize: '15px' }} 
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  if (onSearchChange) onSearchChange('');
                  setMobileSearchFocused(false);
                }}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={16} />
              </button>
            )}

            {/* Mobile Search Preview List */}
            {mobileSearchFocused && searchQuery.trim().length > 0 && (
              <div 
                className="glass-panel animate-fade-in"
                style={{
                  marginTop: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  borderRadius: '14px',
                  padding: '8px',
                  boxShadow: 'var(--glass-specular)'
                }}
              >
                <div style={{ padding: '4px 8px 8px', fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                  نتایج زنده ({searchMatches.length} مورد)
                </div>

                {searchMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {searchMatches.slice(0, 4).map(item => (
                      <div
                        key={item.id || item.slug}
                        onClick={() => handleSelectSearchItem(item.slug)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 8px',
                          borderRadius: '10px',
                          background: 'var(--table-stripe)'
                        }}
                      >
                        <img 
                          src={item.images?.[0] || '/vite.svg'} 
                          alt={item.name} 
                          style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{item.category}</span>
                            <span className="font-tech" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--accent-cyan))' }}>
                              {formatPrice(item.basePrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleViewAllSearch}
                      style={{ width: '100%', padding: '8px', fontSize: '0.75rem', borderRadius: '8px' }}
                    >
                      مشاهده تمام نتایج در فروشگاه
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '14px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    هیچ موردی پیدا نشد.
                  </div>
                )}
              </div>
            )}
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
