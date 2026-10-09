import React, { useState, useMemo } from 'react';
import { 
  Filter, Star, CheckCircle, SlidersHorizontal, Scale, Eye, Wrench, 
  Cpu, HardDrive, Monitor, X, RotateCcw, Zap, Sparkles 
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function LaptopCatalog({ 
  laptops, 
  onCustomize, 
  onCompare, 
  compareList = [],
  onSelectProduct,
  searchQuery = ''
}) {
  const [activeCategory, setActiveCategory] = useState('همه');
  const [priceSort, setPriceSort] = useState('default');
  
  // Faceted Filters
  const [cpuMaker, setCpuMaker] = useState('all'); // 'all', 'Intel', 'AMD'
  const [gpuMaker, setGpuMaker] = useState('all'); // 'all', 'NVIDIA', 'AMD', 'Intel'
  const [ramFilter, setRamFilter] = useState('all'); // 'all', '16', '32', '64+'
  const [screenFilter, setScreenFilter] = useState('all'); // 'all', '13-14', '15-16'
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const categories = ['همه', 'گیمینگ', 'تولید محتوا', 'فوق سبک', 'ایستگاه کاری', 'اقتصادی'];

  const filteredLaptops = useMemo(() => {
    let result = laptops || [];
    
    // Category filter
    if (activeCategory !== 'همه') {
      result = result.filter(l => l.category === activeCategory);
    }

    // CPU Maker filter
    if (cpuMaker !== 'all') {
      result = result.filter(l => {
        const brand = l.cpuBrand || (l.specs?.cpu?.toLowerCase().includes('amd') ? 'AMD' : 'Intel');
        return brand.toLowerCase() === cpuMaker.toLowerCase();
      });
    }

    // GPU Maker filter
    if (gpuMaker !== 'all') {
      result = result.filter(l => {
        const brand = l.gpuBrand || (l.specs?.gpu?.toLowerCase().includes('amd') ? 'AMD' : l.specs?.gpu?.toLowerCase().includes('intel') ? 'Intel' : 'NVIDIA');
        return brand.toLowerCase() === gpuMaker.toLowerCase();
      });
    }

    // RAM filter
    if (ramFilter !== 'all') {
      result = result.filter(l => {
        const ramStr = l.specs?.ram || '';
        if (ramFilter === '16') return ramStr.includes('۱۶') || ramStr.includes('16');
        if (ramFilter === '32') return ramStr.includes('۳۲') || ramStr.includes('32');
        if (ramFilter === '64+') return ramStr.includes('۶۴') || ramStr.includes('64') || ramStr.includes('۹۶') || ramStr.includes('96');
        return true;
      });
    }

    // Screen filter
    if (screenFilter !== 'all') {
      result = result.filter(l => {
        const disp = l.specs?.display || '';
        if (screenFilter === '13-14') return disp.includes('۱۳') || disp.includes('۱۴') || disp.includes('13') || disp.includes('14');
        if (screenFilter === '15-16') return disp.includes('۱۵') || disp.includes('۱۶') || disp.includes('15') || disp.includes('16');
        return true;
      });
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(l => 
        l.name?.toLowerCase().includes(q) || 
        l.tagline?.toLowerCase().includes(q) ||
        l.specs?.cpu?.toLowerCase().includes(q) ||
        l.specs?.gpu?.toLowerCase().includes(q)
      );
    }

    // Price sort
    if (priceSort === 'low-high') {
      result = [...result].sort((a, b) => a.basePrice - b.basePrice);
    } else if (priceSort === 'high-low') {
      result = [...result].sort((a, b) => b.basePrice - a.basePrice);
    }
    return result;
  }, [laptops, activeCategory, cpuMaker, gpuMaker, ramFilter, screenFilter, priceSort, searchQuery]);

  const activeFiltersCount = (cpuMaker !== 'all' ? 1 : 0) + (gpuMaker !== 'all' ? 1 : 0) + (ramFilter !== 'all' ? 1 : 0) + (screenFilter !== 'all' ? 1 : 0);

  const resetAllFilters = () => {
    setActiveCategory('همه');
    setCpuMaker('all');
    setGpuMaker('all');
    setRamFilter('all');
    setScreenFilter('all');
    setPriceSort('default');
  };

  return (
    <div className="container" id="catalog" style={{ paddingBottom: '80px' }}>
      
      {/* Mobile-first embedded styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .catalog-filters-panel {
            display: ${showFiltersMobile ? 'block' : 'none'} !important;
            padding: 16px !important;
            margin-bottom: 20px !important;
          }
          .catalog-header-title {
            font-size: 1.6rem !important;
          }
          .catalog-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .catalog-card-body {
            padding: 16px !important;
          }
          .catalog-card-img {
            height: 190px !important;
          }
        }
      `}} />

      {/* Section Header */}
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="catalog-header-title" style={{ fontSize: '2.25rem', marginBottom: '4px' }}>
            جستجو و انتخاب <span className="gradient-text">لپ‌تاپ تخصصی</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            فیلتر پیشرفته بر اساس سازنده پردازنده، گرافیک و مقایسه چارت عملکرد سخت‌افزار
          </p>
        </div>
        
        {/* Sort & Mobile filter trigger */}
        <div className="flex" style={{ gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
          <button 
            className="btn btn-glass"
            onClick={() => setShowFiltersMobile(prev => !prev)}
            style={{ 
              padding: '8px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '0.8125rem',
              borderColor: showFiltersMobile || activeFiltersCount > 0 ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
              background: showFiltersMobile ? 'hsla(var(--accent-cyan), 0.1)' : 'transparent'
            }}
          >
            <SlidersHorizontal size={16} color={showFiltersMobile || activeFiltersCount > 0 ? 'hsl(var(--accent-cyan))' : 'currentColor'} />
            <span>{showFiltersMobile ? 'بستن فیلترها' : 'فیلترهای پیشرفته'} {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          <div className="glass-panel flex" style={{ padding: '6px 12px', borderRadius: '12px', alignItems: 'center', gap: '8px' }}>
            <select 
              value={priceSort} 
              onChange={(e) => setPriceSort(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0', fontSize: '13px', width: 'auto', outline: 'none' }}
            >
              <option value="default">مرتب‌سازی: برگزیده‌ها</option>
              <option value="low-high">قیمت: ارزان‌ترین به گران‌ترین</option>
              <option value="high-low">قیمت: گران‌ترین به ارزان‌ترین</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="touch-scroll-x" style={{ gap: '8px', marginBottom: '18px', paddingBottom: '4px' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className="btn"
            style={{
              background: activeCategory === cat ? 'hsl(var(--accent-cyan))' : 'rgba(0, 0, 0, 0.04)',
              color: activeCategory === cat ? 'white' : 'var(--text-primary)',
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '13px', 
              fontWeight: activeCategory === cat ? 'bold' : 'normal',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Advanced Faceted Filter Panel (Like BestBuy / NotebookCheck / Digikala) */}
      <div className="glass-card animate-fade-in catalog-filters-panel" style={{ padding: '20px 24px', marginBottom: '32px' }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'start' }}>
          
          {/* CPU Maker */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              <Cpu size={16} color="hsl(var(--accent-cyan))" />
              <span>سازنده پردازنده (CPU):</span>
            </div>
            <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'همه' },
                { id: 'Intel', label: 'Intel Core / Ultra' },
                { id: 'AMD', label: 'AMD Ryzen' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setCpuMaker(item.id)}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: cpuMaker === item.id ? 'hsla(var(--accent-cyan), 0.2)' : 'rgba(0,0,0,0.03)',
                    borderColor: cpuMaker === item.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                    color: cpuMaker === item.id ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* GPU Maker */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              <Zap size={16} color="hsl(var(--accent-green))" />
              <span>سازنده کارت گرافیک (GPU):</span>
            </div>
            <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'همه' },
                { id: 'NVIDIA', label: 'NVIDIA GeForce RTX' },
                { id: 'AMD', label: 'AMD Radeon' },
                { id: 'Intel', label: 'Intel Arc' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setGpuMaker(item.id)}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: gpuMaker === item.id ? 'hsla(var(--accent-green), 0.2)' : 'rgba(0,0,0,0.03)',
                    borderColor: gpuMaker === item.id ? 'hsl(var(--accent-green))' : 'var(--border-glass)',
                    color: gpuMaker === item.id ? 'hsl(var(--accent-green))' : 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* RAM Size */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              <HardDrive size={16} color="hsl(var(--accent-purple))" />
              <span>ظرفیت حافظه رم:</span>
            </div>
            <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'همه' },
                { id: '16', label: '۱۶ گیگابایت' },
                { id: '32', label: '۳۲ گیگابایت' },
                { id: '64+', label: '۶۴ گیگ به بالا' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setRamFilter(item.id)}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: ramFilter === item.id ? 'hsla(var(--accent-purple), 0.2)' : 'rgba(0,0,0,0.03)',
                    borderColor: ramFilter === item.id ? 'hsl(var(--accent-purple))' : 'var(--border-glass)',
                    color: ramFilter === item.id ? 'hsl(var(--accent-purple))' : 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Screen Size */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              <Monitor size={16} color="hsl(var(--accent-cyan))" />
              <span>اندازه صفحه نمایش:</span>
            </div>
            <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'همه سایزها' },
                { id: '13-14', label: '۱۳ تا ۱۴ اینچ (سبک)' },
                { id: '15-16', label: '۱۵ تا ۱۶ اینچ (استاندارد)' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setScreenFilter(item.id)}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: screenFilter === item.id ? 'hsla(var(--accent-cyan), 0.2)' : 'rgba(0,0,0,0.03)',
                    borderColor: screenFilter === item.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                    color: screenFilter === item.id ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Clear Filters bar */}
        {activeFiltersCount > 0 && (
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              نمایش <strong>{filteredLaptops.length}</strong> لپ‌تاپ مطابق با مشخصات انتخابی
            </span>
            <button className="btn btn-glass" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={resetAllFilters}>
              <RotateCcw size={12} /> بازنشانی تمام فیلترها
            </button>
          </div>
        )}
      </div>

      {/* Laptops Grid */}
      <div className="grid catalog-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '24px' }}>
        {filteredLaptops.map(laptop => {
          const isComparing = compareList.includes(laptop.id);
          const handleProductClick = () => {
            if (onSelectProduct) {
              onSelectProduct(laptop.slug || laptop.id);
            } else if (onCustomize) {
              onCustomize(laptop);
            }
          };

          const bm = laptop.benchmarks || { cpuScore: 90, gamingScore: 85, displayScore: 92 };

          return (
            <div key={laptop.id} className="glass-card flex animate-fade-in" style={{ flexDirection: 'column', overflow: 'hidden' }}>
              <div 
                style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                onClick={handleProductClick}
              >
                <img 
                  src={laptop.image} 
                  alt={laptop.name} 
                  className="catalog-card-img"
                  style={{ width: '100%', height: '220px', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                  {laptop.badge && <span className="badge badge-glow">{laptop.badge}</span>}
                </div>

                {/* Brand badges on card */}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)', fontSize: '0.7rem' }}>
                    {laptop.cpuBrand || 'Intel'}
                  </span>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)', fontSize: '0.7rem' }}>
                    {laptop.gpuBrand || 'NVIDIA'}
                  </span>
                </div>
              </div>
              
              <div className="flex catalog-card-body" style={{ flexDirection: 'column', padding: '24px', flexGrow: 1 }}>
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 
                    style={{ fontSize: '1.25rem', marginBottom: '4px', cursor: 'pointer', flexGrow: 1, minWidth: '160px' }}
                    onClick={handleProductClick}
                  >
                    {laptop.name}
                  </h3>
                  <div className="font-tech gradient-text" style={{ fontWeight: 700, fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
                    {formatPrice(laptop.basePrice)}
                  </div>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>{laptop.tagline}</p>
                
                {/* Rating & Stock */}
                <div className="flex font-tech" style={{ gap: '16px', marginBottom: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div className="flex" style={{ alignItems: 'center', gap: '4px' }}>
                    <Star size={16} color="hsl(var(--accent-cyan))" fill="hsl(var(--accent-cyan))" />
                    <span>{laptop.rating || '۵.۰'} ({laptop.reviewsCount || 0})</span>
                  </div>
                  {laptop.inStock ? (
                    <div className="flex" style={{ alignItems: 'center', gap: '4px', color: 'hsl(var(--accent-green))' }}>
                      <CheckCircle size={16} />
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem' }}>موجود در انبار ({laptop.stock || 10})</span>
                    </div>
                  ) : (
                    <div className="flex" style={{ alignItems: 'center', gap: '4px', color: 'hsl(var(--accent-red))' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem' }}>ناموجود</span>
                    </div>
                  )}
                </div>

                {/* Sophisticated Hardware Specs Presentation */}
                <div style={{ 
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.015) 0%, rgba(0,0,0,0.035) 100%)', 
                  border: '1px solid var(--border-glass)', 
                  padding: '12px 14px', 
                  borderRadius: '12px', 
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'hsla(var(--accent-cyan), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Cpu size={13} color="hsl(var(--accent-cyan))" />
                      </div>
                      <span className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr' }}>
                        {laptop.specs?.cpu}
                      </span>
                    </div>
                    <span className="badge" style={{ fontSize: '0.6875rem', padding: '2px 6px', background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {laptop.cpuBrand || 'CPU'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'hsla(var(--accent-green), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Zap size={13} color="hsl(var(--accent-green))" />
                      </div>
                      <span className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr' }}>
                        {laptop.specs?.gpu}
                      </span>
                    </div>
                    <span className="badge" style={{ fontSize: '0.6875rem', padding: '2px 6px', background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {laptop.gpuBrand || 'GPU'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'hsla(var(--accent-purple), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HardDrive size={13} color="hsl(var(--accent-purple))" />
                    </div>
                    <span className="font-tech" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', direction: 'ltr' }}>
                      <strong style={{ fontWeight: 600 }}>{laptop.specs?.ram}</strong> RAM • <span style={{ color: 'var(--text-secondary)' }}>{laptop.specs?.storage}</span>
                    </span>
                  </div>

                  {laptop.specs?.display && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Monitor size={13} color="var(--text-secondary)" />
                      </div>
                      <span className="font-tech" style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr' }}>
                        {laptop.specs?.display}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mini Benchmark Performance Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78125rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={13} color="hsl(var(--accent-cyan))" />
                      شاخص راندمان سخت‌افزار
                    </span>
                    <span className="font-tech" style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'hsl(var(--accent-cyan))' }}>
                      {bm.cpuScore} <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ ۱۰۰</span>
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${bm.cpuScore}%`, 
                      background: 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex" style={{ marginTop: 'auto', gap: '8px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ flexGrow: 1, padding: '10px 14px', fontSize: '0.875rem' }} 
                    onClick={handleProductClick}
                  >
                    <Eye size={16} /> مشاهده کامل و خرید
                  </button>
                  <button 
                    className="btn btn-glass" 
                    onClick={() => onCustomize(laptop)}
                    style={{ padding: '10px' }}
                    title="شخصی‌سازی سریع قطعات"
                  >
                    <Wrench size={18} color="hsl(var(--accent-cyan))" />
                  </button>
                  <button 
                    className="btn btn-glass" 
                    onClick={() => onCompare(laptop.id)}
                    style={{ padding: '10px', background: isComparing ? 'hsla(var(--accent-purple), 0.15)' : '' }}
                    title={isComparing ? "حذف از مقایسه" : "افزودن به مقایسه"}
                  >
                    <Scale size={18} color={isComparing ? "hsl(var(--accent-purple))" : "var(--text-secondary)"} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredLaptops.length === 0 && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', marginTop: '20px' }}>
          <h3>هیچ لپ‌تاپی با مشخصات انتخابی یافت نشد.</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            می‌توانید فیلترهای بالا را تغییر دهید یا دکمه بازنشانی را بزنید.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={resetAllFilters}>
            بازنشانی فیلترها
          </button>
        </div>
      )}

    </div>
  );
}
