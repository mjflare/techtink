import React from 'react';
import { Sparkles, Eye, ShoppingCart, Award, ArrowLeft, Check, Cpu, Zap, HardDrive } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import { handleImageError } from '../utils/imageFallback.js';

export default function ProductShowcase({ config, onSelectProduct, onAddToCart }) {
  if (!config || !config.active || !config.products || config.products.length === 0) {
    return null;
  }

  const products = config.products;
  const flagship = products[0];
  const otherProducts = products.length > 1 ? products.slice(1) : [];

  return (
    <section className="container" style={{ marginBottom: '52px' }}>
      <div 
        className="glass-card animate-fade-in"
        style={{
          padding: '32px 24px',
          borderRadius: '26px',
          background: 'linear-gradient(180deg, var(--glass-bg) 0%, rgba(0, 0, 0, 0.04) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Top Glow */}
        <div style={{
          position: 'absolute', top: 0, left: '30%', right: '30%', height: '1px',
          background: 'linear-gradient(90deg, transparent, hsl(var(--accent-cyan)), transparent)',
          zIndex: 1
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-glow" style={{ fontSize: '0.725rem', padding: '3px 10px' }}>
                <Sparkles size={12} style={{ marginLeft: '4px' }} />
                {config.badge || 'ویترین ویژه'}
              </span>
              {config.bannerText && (
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-cyan))', fontWeight: 600 }}>
                  {config.bannerText}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 'clamp(1.35rem, 3vw, 2rem)', margin: 0, letterSpacing: '-0.5px' }}>
              <span className="gradient-text">{config.title || 'ویترین محصولات برگزیده'}</span>
            </h2>

            {config.subtitle && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px', marginBottom: 0, maxWidth: '620px', lineHeight: '1.6' }}>
                {config.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* 1. APPLE SPOTLIGHT FLAGSHIP SHOWCASE */}
        {flagship && (
          <div 
            className="apple-spotlight-card"
            style={{
              padding: 'clamp(20px, 4vw, 36px)',
              marginBottom: otherProducts.length > 0 ? '32px' : '0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '32px',
              alignItems: 'center'
            }}
          >
            {/* Left Content / Typography */}
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', fontSize: '0.75rem' }}>
                  {flagship.category}
                </span>
                {flagship.grade && (
                  <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.15)', color: 'hsl(var(--accent-purple))', fontSize: '0.75rem', fontWeight: 800 }}>
                    گرید {flagship.grade}
                  </span>
                )}
              </div>

              <h3 
                style={{ 
                  fontSize: 'clamp(1.4rem, 3.5vw, 2.1rem)', 
                  fontWeight: 850, 
                  lineHeight: 1.25, 
                  margin: '0 0 10px 0',
                  letterSpacing: '-0.5px',
                  cursor: 'pointer'
                }}
                onClick={() => onSelectProduct && onSelectProduct(flagship.slug)}
              >
                {flagship.name}
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.7, marginBottom: '20px', maxWidth: '520px' }}>
                {flagship.tagline || 'اوج ظرافت، قدرت سخت‌افزاری پردازش و استانداردهای پیشرو مهندسی برای کارهای سنگین و رندرینگ بدون افت سرعت.'}
              </p>

              {/* Spec Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {flagship.specs?.cpu && (
                  <span className="font-tech" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--table-stripe)', border: '1px solid var(--border-glass)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Cpu size={14} color="hsl(var(--accent-cyan))" /> {flagship.specs.cpu.split(' ').slice(0, 3).join(' ')}
                  </span>
                )}
                {flagship.specs?.gpu && (
                  <span className="font-tech" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--table-stripe)', border: '1px solid var(--border-glass)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Zap size={14} color="hsl(var(--accent-green))" /> {flagship.specs.gpu.split(' ').slice(0, 3).join(' ')}
                  </span>
                )}
                {flagship.specs?.ram && (
                  <span className="font-tech" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--table-stripe)', border: '1px solid var(--border-glass)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <HardDrive size={14} color="hsl(var(--accent-purple))" /> {flagship.specs.ram}
                  </span>
                )}
              </div>

              {/* Price & Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>قیمت نقدی ویژه:</div>
                  <div className="font-tech price-gradient-text" style={{ fontSize: '1.75rem', fontWeight: 900 }}>
                    {formatPrice(flagship.basePrice)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary"
                    style={{ padding: '12px 22px', fontSize: '0.95rem' }}
                    onClick={() => onSelectProduct && onSelectProduct(flagship.slug)}
                  >
                    بررسی تخصصی و خرید <ArrowLeft size={16} />
                  </button>
                  <button 
                    className="btn btn-glass"
                    style={{ padding: '12px 18px', fontSize: '0.95rem' }}
                    onClick={() => onAddToCart && onAddToCart(flagship)}
                  >
                    <ShoppingCart size={16} /> افزودن به سبد
                  </button>
                </div>
              </div>
            </div>

            {/* Right Hardware Visual (Apple Floating Hero Image) */}
            <div 
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '260px',
                aspectRatio: '16 / 10',
                padding: '20px',
                cursor: 'pointer'
              }}
              onClick={() => onSelectProduct && onSelectProduct(flagship.slug)}
            >
              <div 
                style={{
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                  pointerEvents: 'none'
                }} 
              />
              <img 
                src={flagship.image || (flagship.images && flagship.images[0])} 
                alt={flagship.name}
                onError={handleImageError}
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '320px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.18))',
                  transition: 'transform 260ms var(--ease-out)',
                  position: 'relative',
                  zIndex: 2
                }}
              />
            </div>
          </div>
        )}

        {/* 2. OTHER FEATURED PRODUCTS GRID */}
        {otherProducts.length > 0 && (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}
          >
            {otherProducts.map((item) => {
              const hasDiscount = item.oldPrice && item.oldPrice > item.basePrice;
              const discountPercent = hasDiscount ? Math.round(((item.oldPrice - item.basePrice) / item.oldPrice) * 100) : null;

              return (
                <div 
                  key={item.id}
                  className="glass-panel"
                  style={{
                    borderRadius: '20px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  {/* Badges on Top */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', zIndex: 2 }}>
                    <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))' }}>
                      {item.category}
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {item.grade && (
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', fontWeight: 800, background: 'hsla(var(--accent-purple), 0.2)', color: 'hsl(var(--accent-purple))' }}>
                          گرید {item.grade}
                        </span>
                      )}
                      {discountPercent && (
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#ef4444', color: '#fff', fontWeight: 800 }}>
                          {discountPercent}٪-
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div 
                    style={{
                      position: 'relative',
                      height: '160px',
                      minHeight: '160px',
                      aspectRatio: '16 / 10',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                      cursor: 'pointer'
                    }}
                    onClick={() => onSelectProduct && onSelectProduct(item.slug)}
                  >
                    <img 
                      src={item.image || (item.images && item.images[0])} 
                      alt={item.name} 
                      onError={handleImageError}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))',
                        transition: 'transform 0.3s'
                      }}
                    />
                  </div>

                  {/* Specs & Titles */}
                  <div>
                    <h3 
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        margin: '0 0 8px 0',
                        cursor: 'pointer',
                        lineHeight: '1.4'
                      }}
                      onClick={() => onSelectProduct && onSelectProduct(item.slug)}
                      title={item.name}
                    >
                      {item.name}
                    </h3>

                    {/* Quick Spec Chips */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '0.725rem' }}>
                      {item.specs?.cpu && (
                        <span className="font-code" style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          {item.specs.cpu.split(' ').slice(0, 3).join(' ')}
                        </span>
                      )}
                      {item.specs?.ram && (
                        <span className="font-code" style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          {item.specs.ram}
                        </span>
                      )}
                      {item.specs?.storage && (
                        <span className="font-code" style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          {item.specs.storage}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>قیمت نقدی:</span>
                      <div style={{ textAlign: 'left' }}>
                        {hasDiscount && (
                          <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            {formatPrice(item.oldPrice)}
                          </div>
                        )}
                        <div className="font-tech price-gradient-text" style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                          {formatPrice(item.basePrice)}
                        </div>
                      </div>
                    </div>

                    {/* Equal-sized CTA Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-glass"
                        onClick={() => onSelectProduct && onSelectProduct(item.slug)}
                        style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> مشاهده
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onAddToCart && onAddToCart(item)}
                        style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', justifyContent: 'center', gap: '4px' }}
                      >
                        <ShoppingCart size={14} /> خرید
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
