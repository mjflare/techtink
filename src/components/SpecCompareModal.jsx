import React from 'react';
import { X, BarChart2, Sparkles, HelpCircle, Layers, ArrowLeftRight } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function SpecCompareModal({ compareList, laptops, onClose }) {
  if (compareList.length === 0) return null;

  const compareLaptops = (laptops || []).filter(l => compareList.includes(l.id));

  // Themed palettes for each device with solid, faint wash, borders, and tracks
  const deviceColorPalettes = [
    {
      id: 1,
      solid: 'hsl(var(--accent-cyan))',
      faint: 'hsla(var(--accent-cyan), 0.08)',
      faintHover: 'hsla(var(--accent-cyan), 0.14)',
      border: 'hsla(var(--accent-cyan), 0.26)',
      glow: '0 0 16px hsla(var(--accent-cyan), 0.18)',
      track: 'hsla(var(--accent-cyan), 0.16)',
      tagText: 'دستگاه ۱'
    },
    {
      id: 2,
      solid: 'hsl(var(--accent-purple))',
      faint: 'hsla(var(--accent-purple), 0.08)',
      faintHover: 'hsla(var(--accent-purple), 0.14)',
      border: 'hsla(var(--accent-purple), 0.26)',
      glow: '0 0 16px hsla(var(--accent-purple), 0.18)',
      track: 'hsla(var(--accent-purple), 0.16)',
      tagText: 'دستگاه ۲'
    },
    {
      id: 3,
      solid: 'hsl(var(--accent-green))',
      faint: 'hsla(var(--accent-green), 0.08)',
      faintHover: 'hsla(var(--accent-green), 0.14)',
      border: 'hsla(var(--accent-green), 0.26)',
      glow: '0 0 16px hsla(var(--accent-green), 0.18)',
      track: 'hsla(var(--accent-green), 0.16)',
      tagText: 'دستگاه ۳'
    }
  ];

  const metrics = [
    { label: 'توان پردازشی (CPU & GPU)', key: 'processingPower', desc: 'قدرت اجرای بازی‌ها، رندرینگ ۳D و کارهای سنگین مهندسی' },
    { label: 'عمر باتری و شارژدهی', key: 'batteryLife', desc: 'پایداری باتری در مرور وب، برنامه‌نویسی و کارهای روزمره' },
    { label: 'سیستم خنک‌کننده و کنترل حرارت', key: 'temperature', desc: 'عملکرد تهویه تحت لود بالا و حفظ دمای بهینه سخت‌افزار' },
    { label: 'کیفیت ساخت و متریال شاسی', key: 'buildQuality', desc: 'استحکام لولاها، فینیش فلزی شاسی و حس پرچمدار' },
    { label: 'ارگونومی و سهولت استفاده', key: 'usability', desc: 'کیفیت کیبورد، ترک‌پد، وب‌کم، اسپیکرها و زاویه دید نمایشگر' },
    { label: 'ارتقاپذیری و تعمیرپذیری', key: 'repairability', desc: 'دسترسی آسان به اسلات‌های RAM و تعویض SSD' }
  ];

  return (
    <div className="modal-backdrop-wrapper" onClick={onClose}>
      <div 
        className="glass-panel modal-card compare-modal-card" 
        style={{ maxWidth: '1200px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={24} color="hsl(var(--accent-cyan))" />
              مقایسه تخصصی و چارت عملکرد لپ‌تاپ‌ها ({compareLaptops.length} مدل)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '4px', margin: 0 }}>
              مقایسه امتیاز تک‌تینک و مشخصات فنی تفصیلی رو در رو با راهنمای رنگی اختصاصی
            </p>
          </div>
          <button 
            type="button"
            className="btn btn-glass" 
            style={{ padding: '8px', borderRadius: '50%' }} 
            onClick={onClose}
            aria-label="بستن پنجره مقایسه"
          >
            <X size={20} />
          </button>
        </div>

        <div className="compare-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* 1. TECHTINK SCORE COMPARISON CHART */}
          <div className="glass-card compare-chart-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="hsl(var(--accent-cyan))" />
                چارت مقایسه‌ای امتیاز تک‌تینک (مقیاس ۰ تا ۱۰۰)
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                * بر اساس تست‌های بنچمارک آزمایشگاه سخت‌افزار تک‌تینک
              </span>
            </div>

            {/* COLOR CODING LEGEND (راهنمای رنگ دستگاه‌ها) */}
            <div 
              className="device-color-legend"
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '22px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'var(--glass-bg-hover)',
                border: '1px solid var(--border-glass)',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                راهنمای رنگ دستگاه‌ها:
              </span>
              {compareLaptops.map((laptop, idx) => {
                const palette = deviceColorPalettes[idx % deviceColorPalettes.length];
                const displayName = laptop.brand ? `${laptop.brand} ${laptop.model}` : laptop.name;
                return (
                  <div 
                    key={laptop.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      background: palette.faint,
                      border: `1px solid ${palette.border}`,
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: palette.solid,
                      boxShadow: `0 0 8px ${palette.solid}`
                    }} />
                    <span style={{ color: palette.solid, fontWeight: 700 }}>دستگاه {idx + 1}:</span>
                    <span style={{ direction: 'ltr', color: 'var(--text-primary)' }}>{displayName}</span>
                  </div>
                );
              })}
            </div>

            {/* METRIC ROWS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {metrics.map((metric, mi) => (
                <div 
                  key={mi} 
                  className="compare-metric-box"
                  style={{ 
                    background: 'rgba(0,0,0,0.02)', 
                    padding: '16px 18px', 
                    borderRadius: '16px',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  {/* Metric Title and Explanation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{metric.label}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {metric.desc}
                    </div>
                  </div>

                  {/* Device Rows for This Metric */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {compareLaptops.map((laptop, li) => {
                      const palette = deviceColorPalettes[li % deviceColorPalettes.length];
                      const scoreObj = laptop.techTinkScore || {
                        batteryLife: 85,
                        temperature: 88,
                        processingPower: 86,
                        usability: 91,
                        buildQuality: 92,
                        repairability: 89
                      };
                      const score = scoreObj[metric.key] || 85;
                      const labelName = laptop.brand ? `${laptop.brand} ${laptop.model}` : laptop.name;

                      return (
                        <div 
                          key={laptop.id} 
                          className="compare-device-bar-card"
                          style={{
                            background: palette.faint,
                            border: `1px solid ${palette.border}`,
                            borderRadius: '12px',
                            padding: '10px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Row 1: Badge + Model Name + Score */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                              <span style={{
                                background: palette.solid,
                                color: 'white',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                flexShrink: 0,
                                boxShadow: `0 0 8px ${palette.solid}60`
                              }}>
                                دستگاه {li + 1}
                              </span>
                              <span style={{
                                fontSize: '0.825rem',
                                fontWeight: 600,
                                direction: 'ltr',
                                textAlign: 'left',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'var(--text-primary)'
                              }}>
                                {labelName}
                              </span>
                            </div>

                            <div style={{
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              fontFamily: 'var(--font-tech)',
                              color: palette.solid,
                              flexShrink: 0
                            }}>
                              {score} / ۱۰۰
                            </div>
                          </div>

                          {/* Row 2: Full-width Tinted Progress Track */}
                          <div style={{
                            width: '100%',
                            height: '9px',
                            background: palette.track,
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${score}%`, 
                              background: palette.solid, 
                              borderRadius: '6px',
                              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: `0 0 10px ${palette.solid}80`
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. SIDE-BY-SIDE SPECIFICATION TABLE */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="hsl(var(--accent-purple))" />
                جدول مقایسه قطعات و مشخصات فنی تفصیلی
              </h3>
              <span className="compare-swipe-hint" style={{ fontSize: '0.78rem', color: 'hsl(var(--accent-cyan))', fontWeight: 600 }}>
                👈 جدول را به چپ و راست بکشید
              </span>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', width: '200px', fontSize: '0.95rem' }}>
                      پارامترهای فنی
                    </th>
                    {compareLaptops.map((laptop, idx) => {
                      const palette = deviceColorPalettes[idx % deviceColorPalettes.length];
                      return (
                        <th key={laptop.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)', verticalAlign: 'top', width: `${100 / compareLaptops.length}%` }}>
                          <div 
                            className="glass-panel" 
                            style={{ 
                              padding: '14px', 
                              borderRadius: '16px',
                              background: palette.faint,
                              border: `1px solid ${palette.border}`,
                              boxShadow: palette.glow,
                              textAlign: 'right'
                            }}
                          >
                            <span className="badge" style={{ background: palette.solid, color: 'white', fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px', display: 'inline-block' }}>
                              دستگاه شماره {idx + 1}
                            </span>
                            <img src={laptop.image} alt={laptop.name} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px', background: 'rgba(0,0,0,0.05)' }} />
                            <div style={{ textAlign: 'left', direction: 'ltr', marginBottom: '6px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: palette.solid, fontFamily: 'var(--font-tech)' }}>
                                {laptop.brand || (laptop.name?.split(' ')[0] || '')}
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-tech)', color: 'var(--text-primary)' }}>
                                {laptop.model || (laptop.name?.replace(laptop.brand || '', '').trim() || laptop.name)}
                              </div>
                            </div>
                            <div className="font-tech gradient-text" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', textAlign: 'right', direction: 'rtl' }}>
                              {formatPrice(laptop.basePrice)}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'دسته‌بندی کاربری', key: 'category', isPersian: true },
                    { label: 'جنس بدنه و ساختار شاسی', key: 'chassis', fallback: 'تمام آلومینیوم' },
                    { label: 'سازنده پردازنده', key: 'cpuBrand', fallback: 'Intel' },
                    { label: 'مدل پردازنده مرکزی (CPU)', key: 'specs.cpu' },
                    { label: 'سازنده کارت گرافیک', key: 'gpuBrand', fallback: 'NVIDIA' },
                    { label: 'مدل کارت گرافیک (GPU)', key: 'specs.gpu' },
                    { label: 'موتور هوش مصنوعی (NPU)', key: 'specs.npuScore' },
                    { label: 'حافظه رم (RAM)', key: 'specs.ram' },
                    { label: 'حافظه ذخیره‌سازی (SSD)', key: 'specs.storage' },
                    { label: 'صفحه نمایش و نرخ نوسازی', key: 'specs.display' },
                    { label: 'ظرفیت باتری و شارژدهی', key: 'specs.battery' },
                    { label: 'وزن خالص دستگاه', key: 'specs.weight' },
                    { label: 'درگاه‌های ارتباطی', key: 'specs.ports' },
                    { label: 'سیستم عامل پیش‌فرض', key: 'specs.os' }
                  ].map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {row.label}
                      </td>
                      {compareLaptops.map((laptop, cIdx) => {
                        const palette = deviceColorPalettes[cIdx % deviceColorPalettes.length];
                        const keys = row.key.split('.');
                        let val = laptop;
                        for (const k of keys) val = val ? val[k] : null;
                        if (!val && row.key === 'chassis') val = laptop.specs?.chassis;
                        if (!val && row.fallback) val = row.fallback;
                        
                        return (
                          <td 
                            className={row.isPersian ? "" : "font-tech"} 
                            key={laptop.id + row.key} 
                            style={{ 
                              padding: '14px 16px', 
                              borderBottom: '1px solid var(--border-glass)', 
                              direction: row.isPersian ? 'rtl' : 'ltr', 
                              textAlign: row.isPersian ? 'right' : 'left', 
                              fontWeight: 500,
                              fontSize: '0.875rem',
                              borderLeft: `1px solid ${palette.border}`
                            }}
                          >
                            {val || '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
