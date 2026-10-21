import React, { useState, useMemo } from 'react';
import { 
  Filter, Star, CheckCircle, SlidersHorizontal, ArrowLeftRight, Eye, Wrench, 
  Cpu, HardDrive, Monitor, X, RotateCcw, Zap, Sparkles, Layers, Battery, ShoppingCart 
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import { getShortSpecs, getHardwareBadges } from '../utils/shortSpecs.js';
import { handleImageError } from '../utils/imageFallback.js';

export default function LaptopCatalog({ 
  laptops, 
  onCustomize, 
  onCompare, 
  compareList = [],
  onSelectProduct,
  onAddToCart,
  searchQuery = ''
}) {
  const [activeCategory, setActiveCategory] = useState('همه');
  const [priceSort, setPriceSort] = useState('default');
  
  // Faceted Filters
  const [cpuMaker, setCpuMaker] = useState('all'); // 'all', 'Intel', 'AMD'
  const [gpuMaker, setGpuMaker] = useState('all'); // 'all', 'NVIDIA', 'AMD', 'Intel'
  const [ramFilter, setRamFilter] = useState('all'); // 'all', '16', '32', '64+'
  const [screenFilter, setScreenFilter] = useState('all'); // 'all', '13-14', '15-16'
  const [chassisFilter, setChassisFilter] = useState('all'); // 'all', 'aluminum', 'magnesium', 'carbon', 'polycarbonate'
  const [gradeFilter, setGradeFilter] = useState('all'); // 'all', 'A+', 'A', 'B+', 'A++'
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const categories = ['همه', 'گیمینگ', 'تولید محتوا', 'فوق سبک', 'ورک استیشن', 'اقتصادی'];

  const filteredLaptops = useMemo(() => {
    let result = laptops || [];
    
    // Category filter
    if (activeCategory !== 'همه') {
      if (!searchQuery.trim()) {
        result = result.filter(l => l.category === activeCategory);
      } else {
        const inCat = result.filter(l => l.category === activeCategory);
        const q = searchQuery.trim().toLowerCase();
        const hasMatch = inCat.some(l => 
          l.name?.toLowerCase().includes(q) || 
          l.brand?.toLowerCase().includes(q) ||
          l.model?.toLowerCase().includes(q)
        );
        if (hasMatch) {
          result = inCat;
        }
      }
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

    // Chassis Build filter
    if (chassisFilter !== 'all') {
      result = result.filter(l => {
        const ch = ((l.chassis || l.specs?.chassis || '') + ' ' + (l.highlights?.join(' ') || '')).toLowerCase();
        if (chassisFilter === 'aluminum') return ch.includes('aluminum') || ch.includes('آلومینیوم');
        if (chassisFilter === 'magnesium') return ch.includes('magnesium') || ch.includes('منیزیم');
        if (chassisFilter === 'carbon') return ch.includes('carbon') || ch.includes('کربن');
        if (chassisFilter === 'polycarbonate') return ch.includes('polycarbonate') || ch.includes('پلی‌کربنات') || ch.includes('پلاستیک');
        return true;
      });
    }

    // Grade condition filter
    if (gradeFilter !== 'all') {
      result = result.filter(l => {
        const g = (l.grade || '').toUpperCase();
        if (gradeFilter === 'A+') return g.includes('A+') && !g.includes('A++');
        if (gradeFilter === 'A++') return g.includes('A++');
        if (gradeFilter === 'A') return g === 'A' || (g.includes('A') && !g.includes('A+') && !g.includes('A++'));
        if (gradeFilter === 'B+') return g.includes('B+') || g.includes('B');
        return true;
      });
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(l => {
        const hay = [
          l.name,
          l.brand,
          l.model,
          l.category,
          l.tagline,
          l.specs?.cpu,
          l.specs?.gpu,
          l.specs?.ram,
          l.specs?.storage,
          l.chassis,
          l.specs?.chassis,
          l.slug
        ].filter(Boolean).join(' ').toLowerCase();

        return terms.every(t => hay.includes(t));
      });
    }

    // Price sort
    if (priceSort === 'low-high') {
      result = [...result].sort((a, b) => a.basePrice - b.basePrice);
    } else if (priceSort === 'high-low') {
      result = [...result].sort((a, b) => b.basePrice - a.basePrice);
    }
    return result;
  }, [laptops, activeCategory, cpuMaker, gpuMaker, ramFilter, screenFilter, chassisFilter, gradeFilter, priceSort, searchQuery]);

  const activeFiltersCount = 
    (cpuMaker !== 'all' ? 1 : 0) + 
    (gpuMaker !== 'all' ? 1 : 0) + 
    (ramFilter !== 'all' ? 1 : 0) + 
    (screenFilter !== 'all' ? 1 : 0) +
    (chassisFilter !== 'all' ? 1 : 0) +
    (gradeFilter !== 'all' ? 1 : 0);

  const resetAllFilters = () => {
    setActiveCategory('همه');
    setCpuMaker('all');
    setGpuMaker('all');
    setRamFilter('all');
    setScreenFilter('all');
    setChassisFilter('all');
    setGradeFilter('all');
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

          {/* Chassis Build (New Filter!) */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              <Layers size={16} color="hsl(var(--accent-green))" />
              <span>جنس بدنه و شاسی:</span>
            </div>
            <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'همه' },
                { id: 'aluminum', label: 'تمام آلومینیوم' },
                { id: 'magnesium', label: 'آلیاژ منیزیم' },
                { id: 'carbon', label: 'فیبر کربن' },
                { id: 'polycarbonate', label: 'پلی‌کربنات مقاوم' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setChassisFilter(item.id)}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: chassisFilter === item.id ? 'hsla(var(--accent-green), 0.2)' : 'rgba(0,0,0,0.03)',
                    borderColor: chassisFilter === item.id ? 'hsl(var(--accent-green))' : 'var(--border-glass)',
                    color: chassisFilter === item.id ? 'hsl(var(--accent-green))' : 'var(--text-secondary)'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Condition (New Filter!) */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
              <CheckCircle size={16} color="hsl(var(--accent-cyan))" />
              <span>گرید و وضعیت ظاهری:</span>
            </div>
            <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'همه' },
                { id: 'A+', label: 'گرید A+ (در حد نو)' },
                { id: 'A', label: 'گرید A (بسیار تمیز)' },
                { id: 'B+', label: 'گرید B+ (تمیز)' },
                { id: 'A++', label: 'گرید A++ (آکبند/اوپن)' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setGradeFilter(item.id)}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: gradeFilter === item.id ? 'hsla(var(--accent-cyan), 0.22)' : 'rgba(0,0,0,0.03)',
                    borderColor: gradeFilter === item.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                    color: gradeFilter === item.id ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'
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
          const shortSpecs = getShortSpecs(laptop);
          const { cpuBadge, gpuBadge } = getHardwareBadges(laptop);
          const brand = laptop.brand || (laptop.name ? laptop.name.split(' ')[0] : '');
          const model = laptop.model || (laptop.name ? laptop.name.replace(brand, '').trim() : laptop.name);
          const overallScore = laptop.techTinkScore?.overall || bm.cpuScore || 88;

          return (
            <div key={laptop.id} className="glass-card flex animate-fade-in" style={{ flexDirection: 'column', overflow: 'hidden' }}>
              <div 
                className="catalog-card-img-wrapper"
                style={{ cursor: 'pointer' }}
                onClick={handleProductClick}
              >
                <img 
                  src={laptop.image} 
                  alt={laptop.name} 
                  className="catalog-card-img"
                  loading="lazy"
                  onError={handleImageError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {laptop.badge && <span className="badge badge-glow">{laptop.badge}</span>}
                  {laptop.grade && (
                    <span className="badge" style={{ 
                      background: 'rgba(0, 0, 0, 0.72)', 
                      color: 'hsl(var(--accent-cyan))', 
                      border: '1px solid hsla(var(--accent-cyan), 0.4)', 
                      backdropFilter: 'blur(6px)', 
                      fontSize: '0.72rem', 
                      fontWeight: 700 
                    }}>
                      {laptop.grade.startsWith('گرید') ? laptop.grade : `گرید ${laptop.grade}`}
                    </span>
                  )}
                </div>

                {/* Brand badges on card */}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)', fontSize: '0.7rem' }}>
                    {cpuBadge}
                  </span>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)', fontSize: '0.7rem' }}>
                    {gpuBadge}
                  </span>
                </div>
              </div>
              
              <div className="flex catalog-card-body" style={{ flexDirection: 'column', padding: '24px', flexGrow: 1 }}>
                {/* Product Name (Brand on top line, Model below) */}
                <div 
                  style={{ cursor: 'pointer', textAlign: 'left', direction: 'ltr', marginBottom: '8px' }}
                  onClick={handleProductClick}
                >
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    letterSpacing: '0.08em', 
                    textTransform: 'uppercase', 
                    color: 'hsl(var(--accent-cyan))', 
                    fontFamily: 'var(--font-tech)',
                    lineHeight: 1.2
                  }}>
                    {brand}
                  </div>
                  <h3 style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 700, 
                    margin: '2px 0 0', 
                    lineHeight: 1.3,
                    fontFamily: 'var(--font-tech)',
                    color: 'var(--text-primary)'
                  }}>
                    {model}
                  </h3>
                </div>

                {/* Price Under Product Name */}
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <div className="font-tech price-gradient-text" style={{ fontWeight: 800, fontSize: '1.35rem', lineHeight: 1.2 }}>
                    {formatPrice(laptop.basePrice)}
                  </div>
                  {laptop.oldPrice && laptop.oldPrice > laptop.basePrice && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                      {formatPrice(laptop.oldPrice)}
                    </span>
                  )}
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

                {/* Essential Hardware Quick Deck (Strictly One Parameter Per Row) */}
                <div style={{ 
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.015) 0%, rgba(0,0,0,0.035) 100%)', 
                  border: '1px solid var(--border-glass)', 
                  padding: '12px 14px', 
                  borderRadius: '12px', 
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                }}>
                  {/* 1. CPU */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, direction: 'ltr', textAlign: 'left' }}>
                    <Cpu size={14} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0 }} />
                    <span className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortSpecs.cpu}
                    </span>
                  </div>

                  {/* 2. GPU */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, direction: 'ltr', textAlign: 'left' }}>
                    <Zap size={14} color="hsl(var(--accent-green))" style={{ flexShrink: 0 }} />
                    <span className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortSpecs.gpu}
                    </span>
                  </div>

                  {/* 3. RAM (Dedicated Row) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, direction: 'ltr', textAlign: 'left' }}>
                    <HardDrive size={14} color="hsl(var(--accent-purple))" style={{ flexShrink: 0 }} />
                    <span className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortSpecs.ram}
                    </span>
                  </div>

                  {/* 4. Storage SSD (Dedicated Row) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, direction: 'ltr', textAlign: 'left' }}>
                    <HardDrive size={14} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0 }} />
                    <span className="font-tech" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortSpecs.storage}
                    </span>
                  </div>

                  {/* 5. Display (Dedicated Row) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, direction: 'ltr', textAlign: 'left' }}>
                    <Monitor size={14} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0 }} />
                    <span className="font-tech" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortSpecs.display}
                    </span>
                  </div>

                  {/* 6. Battery Capacity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, direction: 'ltr', textAlign: 'left' }}>
                    <Battery size={14} color="hsl(var(--accent-green))" style={{ flexShrink: 0 }} />
                    <span className="font-tech" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortSpecs.battery || '50Wh Battery'}
                    </span>
                  </div>

                  {/* 7. Chassis (Dedicated Row - LTR aligned like the other specs) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, direction: 'ltr', textAlign: 'left', paddingTop: '4px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <Layers size={14} color="hsl(var(--accent-green))" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {shortSpecs.chassis}
                    </span>
                  </div>
                </div>

                {/* TechTink Score Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78125rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Sparkles size={14} color="hsl(var(--accent-cyan))" />
                      امتیاز تک‌تینک
                    </span>
                    <span className="font-tech" style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'hsl(var(--accent-cyan))' }}>
                      {overallScore} <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ ۱۰۰</span>
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${overallScore}%`, 
                      background: 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex" style={{ marginTop: 'auto', gap: '8px' }}>
                  <button 
                    type="button"
                    className="btn btn-glass" 
                    style={{ 
                      flex: 1, 
                      minWidth: 0, 
                      padding: '10px 8px', 
                      fontSize: '0.875rem', 
                      justifyContent: 'center', 
                      gap: '6px' 
                    }} 
                    onClick={handleProductClick}
                    title="مشاهده جزئیات کامل لپ‌تاپ"
                  >
                    <Eye size={16} color="hsl(var(--accent-cyan))" />
                    <span>مشاهده</span>
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ 
                      flex: 1, 
                      minWidth: 0, 
                      padding: '10px 8px', 
                      fontSize: '0.875rem', 
                      justifyContent: 'center', 
                      gap: '6px' 
                    }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddToCart) {
                        onAddToCart({
                          productId: laptop.id,
                          laptopId: laptop.id,
                          slug: laptop.slug,
                          name: laptop.name,
                          basePrice: laptop.basePrice,
                          totalPrice: laptop.basePrice,
                          image: laptop.image,
                          configuration: {
                            ram: laptop.specs?.ram || 'پیش‌فرض',
                            storage: laptop.specs?.storage || 'پیش‌فرض',
                            display: laptop.specs?.display || 'پیش‌فرض'
                          },
                          variantIds: []
                        });
                      }
                    }}
                    title="افزودن مستقیم به سبد خرید"
                  >
                    <ShoppingCart size={16} />
                    <span>خرید</span>
                  </button>
                  <button 
                    type="button"
                    className="btn btn-glass" 
                    onClick={() => onCustomize(laptop)}
                    style={{ padding: '10px', flexShrink: 0 }}
                    title="شخصی‌سازی سریع قطعات"
                  >
                    <Wrench size={18} color="hsl(var(--accent-cyan))" />
                  </button>
                  <button 
                    type="button"
                    className={`btn btn-glass btn-compare ${isComparing ? 'is-active' : ''}`}
                    onClick={() => onCompare(laptop.id)}
                    style={{ padding: '10px', flexShrink: 0 }}
                    title={isComparing ? "حذف از مقایسه" : "افزودن به مقایسه"}
                  >
                    <ArrowLeftRight size={18} className="compare-icon" />
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
