import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Menu, MonitorSmartphone, User, Shield, LogOut, X, ArrowLeftRight, Sun, Moon, ArrowLeft, ChevronDown } from 'lucide-react';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const userMenuRef = useRef(null);

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

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
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
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '12px 0' }}>
      <div className="container flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo */}
        <div className="flex" style={{ alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => handleTabClick('store')}>
          <div className="badge-glow" style={{ padding: '7px', borderRadius: '10px', display: 'flex' }}>
            <MonitorSmartphone size={22} />
          </div>
          <h2 style={{ margin: 0, letterSpacing: '-0.5px', fontSize: '1.35rem' }} className="gradient-text">تک‌تینک</h2>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="flex" style={{ gap: '6px', display: 'none' }} id="desktop-nav">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="btn btn-glass"
              style={{
                background: activeTab === tab.id ? 'var(--glass-bg-hover)' : 'transparent',
                borderColor: activeTab === tab.id ? 'hsla(var(--accent-cyan), 0.5)' : 'transparent',
                boxShadow: activeTab === tab.id ? '0 0 10px hsla(var(--accent-cyan), 0.2)' : 'none',
                padding: '8px 16px',
                fontSize: '0.875rem'
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
                borderColor: 'transparent',
                padding: '8px 16px',
                fontSize: '0.875rem'
              }}
            >
              درباره ما
            </button>
          )}
        </nav>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 960px) {
            #desktop-nav { display: flex !important; }
            #mobile-menu-btn { display: none !important; }
          }
        `}} />

        {/* Unified Glass Dock (Dynamic Action Island) */}
        <div className="unified-glass-dock">
          
          {/* 1. Expandable Search Tool */}
          <div 
            ref={desktopSearchRef} 
            className="dock-search-wrapper"
            style={{ display: 'none' }}
            id="desktop-search"
          >
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: searchFocused ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)',
                pointerEvents: 'none',
                transition: 'color 0.2s'
              }} 
            />
            <input 
              type="text" 
              placeholder="جستجو..." 
              value={searchQuery || ''}
              onChange={e => {
                if (onSearchChange) onSearchChange(e.target.value);
                setSearchFocused(true);
              }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              className={`dock-search-input ${searchQuery ? 'has-value' : ''}`}
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
                  left: '8px',
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
                title="پاک کردن"
              >
                <X size={13} />
              </button>
            )}

            {/* Live Search Preview Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div 
                className="glass-panel animate-fade-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 'min(380px, calc(100vw - 28px))',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  borderRadius: '18px',
                  padding: '10px',
                  zIndex: 1050,
                  boxShadow: 'var(--glass-specular), 0 24px 50px rgba(0, 0, 0, 0.45)'
                }}
              >
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px 10px', borderBottom: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>نتایج زنده ({searchMatches.length} مورد)</span>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--accent-cyan))' }}>Enter برای مشاهده کاتالوگ</span>
                </div>

                {searchMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {searchMatches.slice(0, 5).map(item => (
                      <div
                        key={item.id || item.slug}
                        onClick={() => handleSelectSearchItem(item.slug)}
                        className="search-preview-item"
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
                      >
                        <img 
                          src={item.images?.[0] || '/vite.svg'} 
                          alt={item.name} 
                          style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', background: 'var(--table-stripe)', flexShrink: 0, padding: '2px', border: '1px solid var(--border-glass)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div className="font-tech" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'ltr', textAlign: 'right' }}>
                            {item.specs?.cpu?.split('(')[0]?.trim()} | {item.specs?.gpu?.split('(')[0]?.trim()}
                          </div>
                          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span className="badge" style={{ padding: '1px 6px', fontSize: '0.62rem', background: 'hsla(var(--accent-cyan), 0.12)', color: 'hsl(var(--accent-cyan))' }}>
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
                        + {searchMatches.length - 5} محصول دیگر
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleViewAllSearch}
                      style={{ width: '100%', marginTop: '6px', padding: '8px 12px', fontSize: '0.8rem', borderRadius: '10px' }}
                    >
                      مشاهده در کاتالوگ فروشگاه <ArrowLeft size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      موردی برای «{searchQuery}» پیدا نشد
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      پیشنهاد: مدل پردازنده یا ورک‌استیشن را جستجو کنید.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 1024px) {
              #desktop-search { display: flex !important; }
            }
          `}} />

          {/* Divider */}
          <div className="dock-divider" style={{ display: 'none' }} id="desktop-search-divider" />
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 1024px) {
              #desktop-search-divider { display: block !important; }
            }
          `}} />

          {/* 2. Compare Button */}
          <button 
            className={`dock-btn ${compareCount > 0 ? 'is-active' : ''}`}
            onClick={() => handleTabClick('compare')} 
            aria-label="مقایسه مشخصات لپ‌تاپ‌ها"
            title="مقایسه مشخصات لپ‌تاپ‌ها"
          >
            <ArrowLeftRight size={17} color={compareCount > 0 ? '#ef4444' : 'currentColor'} />
            {compareCount > 0 && (
              <span style={{
                position: 'absolute', top: '1px', right: '1px',
                background: '#ef4444', color: 'white',
                fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.7)'
              }}>
                {compareCount}
              </span>
            )}
          </button>

          {/* 3. Cart Button */}
          <button 
            className="dock-btn" 
            onClick={onCartClick} 
            aria-label="سبد خرید"
            title="سبد خرید"
          >
            <ShoppingCart size={17} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: '1px', right: '1px',
                background: 'hsl(var(--accent-purple))', color: 'white',
                fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="dock-divider" />

          {/* 4. Compact iOS Theme Toggle */}
          {onToggleTheme && (
            <div 
              className="dock-theme-switch"
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              title={theme === 'dark' ? 'حالت شب فعال است — کلیک برای حالت روز' : 'حالت روز فعال است — کلیک برای حالت شب'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-glass)',
                borderRadius: '16px',
                padding: '2px',
                cursor: 'pointer',
                width: '54px',
                height: '30px',
                boxSizing: 'border-box',
                userSelect: 'none'
              }}
            >
              {/* Sliding Pill Knob */}
              <div 
                style={{
                  position: 'absolute',
                  top: '2px',
                  bottom: '2px',
                  right: theme === 'dark' ? '2px' : 'calc(50% + 1px)',
                  left: theme === 'dark' ? 'calc(50% + 1px)' : '2px',
                  borderRadius: '13px',
                  background: theme === 'dark' ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))' : '#ffffff',
                  boxShadow: theme === 'dark' ? '0 1px 4px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.18)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 0
                }}
              />

              {/* Moon Icon */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Moon size={13} color={theme === 'dark' ? '#818cf8' : 'var(--text-secondary)'} style={{ filter: theme === 'dark' ? 'drop-shadow(0 0 4px rgba(129, 140, 248, 0.6))' : 'none', opacity: theme === 'dark' ? 1 : 0.45 }} />
              </div>

              {/* Sun Icon */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Sun size={13} color={theme === 'light' ? '#f59e0b' : 'var(--text-secondary)'} style={{ filter: theme === 'light' ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' : 'none', opacity: theme === 'light' ? 1 : 0.45 }} />
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="dock-divider" />

          {/* 5. User Profile with Elegant Dropdown */}
          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button 
                type="button"
                className="btn btn-glass"
                onClick={() => setUserMenuOpen(prev => !prev)}
                style={{ 
                  padding: '4px 8px', 
                  borderRadius: '18px', 
                  fontSize: '0.8rem', 
                  gap: '5px',
                  height: '32px',
                  border: '1px solid var(--border-glass)',
                  background: userMenuOpen ? 'var(--glass-bg-hover)' : 'transparent'
                }}
                title={user.name}
              >
                <User size={15} color="hsl(var(--accent-cyan))" />
                <span style={{ fontWeight: 600, maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={12} style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }} />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div 
                  className="glass-panel animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: 0,
                    width: '230px',
                    borderRadius: '18px',
                    padding: '12px',
                    zIndex: 1050,
                    boxShadow: 'var(--glass-specular), 0 20px 45px rgba(0, 0, 0, 0.35)',
                    direction: 'rtl'
                  }}
                >
                  <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{user.email || user.mobile}</div>
                    <div style={{ marginTop: '6px' }}>
                      <span className="badge" style={{ background: user.role === 'admin' ? 'hsl(var(--accent-cyan))' : 'hsla(var(--accent-cyan), 0.15)', color: user.role === 'admin' ? '#fff' : 'hsl(var(--accent-cyan))', padding: '2px 8px', fontSize: '0.68rem' }}>
                        {user.role === 'admin' ? 'مدیر فروشگاه' : 'حساب کاربری'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {user.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveTab('admin');
                        }}
                        className="btn btn-glass"
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.8rem', borderRadius: '10px', gap: '8px' }}
                      >
                        <Shield size={16} color="hsl(var(--accent-cyan))" /> پنل مدیریت فروشگاه
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="btn btn-glass"
                      style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.8rem', borderRadius: '10px', color: 'hsl(var(--accent-red))', gap: '8px' }}
                    >
                      <LogOut size={16} /> خروج از حساب
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="btn btn-glass" 
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '16px', height: '32px' }} 
              onClick={onOpenAuth}
            >
              <User size={15} /> <span>ورود</span>
            </button>
          )}

          {/* 6. Mobile Menu Toggle Button */}
          <button 
            className="dock-btn" 
            id="mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="منوی سایت"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
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
