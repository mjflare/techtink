import React from 'react';
import { X, Check, BarChart2, Zap, Cpu, Sparkles } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function SpecCompareModal({ compareList, laptops, onClose }) {
  if (compareList.length === 0) return null;

  const compareLaptops = (laptops || []).filter(l => compareList.includes(l.id));

  // Colors for each compared laptop
  const laptopColors = [
    'hsl(var(--accent-cyan))',
    'hsl(var(--accent-purple))',
    'hsl(var(--accent-green))'
  ];

  return (
    <div className="modal-backdrop-wrapper" onClick={onClose}>
      <div 
        className="glass-panel modal-card" 
        style={{ maxWidth: '1200px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-glass)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={24} color="hsl(var(--accent-cyan))" />
            مقایسه تخصصی و چارت عملکرد لپ‌تاپ‌ها ({compareLaptops.length} مدل)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            مقایسه امتیاز تک‌تینک و مشخصات فنی تفصیلی رو در رو
          </p>
        </div>
        <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* 1. TECHTINK SCORE COMPARISON CHART */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="hsl(var(--accent-cyan))" />
            چارت مقایسه‌ای امتیاز تک‌تینک (مقیاس ۰ تا ۱۰۰)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'عمر باتری', key: 'batteryLife' },
              { label: 'دما', key: 'temperature' },
              { label: 'توان پردازشی', key: 'processingPower' },
              { label: 'سهولت استفاده', key: 'usability' },
              { label: 'کیفیت ساخت و حس دستگاه', key: 'buildQuality' },
              { label: 'ارتقا پذیری و تعمیر پذیری', key: 'repairability' }
            ].map((metric, mi) => (
              <div key={mi} style={{ background: 'rgba(0,0,0,0.02)', padding: '16px 20px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9375rem', marginBottom: '12px' }}>
                  {metric.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {compareLaptops.map((laptop, li) => {
                    const scoreObj = laptop.techTinkScore || {
                      batteryLife: 85,
                      temperature: 88,
                      processingPower: 86,
                      usability: 91,
                      buildQuality: 92,
                      repairability: 89
                    };
                    const score = scoreObj[metric.key] || 85;
                    const color = laptopColors[li % laptopColors.length];
                    const labelName = laptop.brand ? `${laptop.brand} ${laptop.model}` : laptop.name;

                    return (
                      <div key={laptop.id} className="benchmark-row">
                        <span className="benchmark-row-name" style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'var(--font-tech)', fontWeight: 600 }}>
                          {labelName}
                        </span>
                        <div className="benchmark-row-track">
                          <div style={{ flexGrow: 1, height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${score}%`, 
                              background: color,
                              borderRadius: '6px',
                              transition: 'width 0.6s ease'
                            }}></div>
                          </div>
                          <span className="font-tech" style={{ width: '50px', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem', color, flexShrink: 0 }}>
                            {score} / ۱۰۰
                          </span>
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', width: '220px', fontSize: '1rem' }}>
                  پارامترهای فنی
                </th>
                {compareLaptops.map((laptop, idx) => (
                  <th key={laptop.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', verticalAlign: 'top' }}>
                    <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px' }}>
                      <img src={laptop.image} alt={laptop.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
                      <div style={{ textAlign: 'left', direction: 'ltr', marginBottom: '6px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(var(--accent-cyan))', fontFamily: 'var(--font-tech)' }}>
                          {laptop.brand || (laptop.name?.split(' ')[0] || '')}
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-tech)', color: 'var(--text-primary)' }}>
                          {laptop.model || (laptop.name?.replace(laptop.brand || '', '').trim() || laptop.name)}
                        </div>
                      </div>
                      <div className="font-tech gradient-text" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', textAlign: 'right', direction: 'rtl' }}>
                        {formatPrice(laptop.basePrice)}
                      </div>
                      <span className="badge" style={{ background: laptopColors[idx % laptopColors.length], color: 'white', fontSize: '0.75rem' }}>
                        دستگاه شماره {idx + 1}
                      </span>
                    </div>
                  </th>
                ))}
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
              ].map((row, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {row.label}
                  </td>
                  {compareLaptops.map(laptop => {
                    const keys = row.key.split('.');
                    let val = laptop;
                    for (const k of keys) val = val ? val[k] : null;
                    if (!val && row.key === 'chassis') val = laptop.specs?.chassis;
                    if (!val && row.fallback) val = row.fallback;
                    
                    return (
                      <td className={row.isPersian ? "" : "font-tech"} key={laptop.id + row.key} style={{ 
                        padding: '16px', 
                        borderBottom: '1px solid var(--border-glass)', 
                        direction: row.isPersian ? 'rtl' : 'ltr', 
                        textAlign: row.isPersian ? 'right' : 'left', 
                        fontWeight: 500 
                      }}>
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
  );
}
