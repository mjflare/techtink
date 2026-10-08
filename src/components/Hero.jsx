import React from 'react';
import { Cpu, Zap, Battery, ArrowLeft } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '48px' }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '32px', alignItems: 'center' }}>
        
        <div className="animate-fade-in" style={{ zIndex: 10 }}>
          <span className="badge badge-glow" style={{ marginBottom: '16px', display: 'inline-block' }}>مدل‌های نسل جدید ۲۰۲۶ موجود شد</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw + 0.5rem, 3.25rem)', marginBottom: '16px', lineHeight: 1.25 }}>
            <span className="gradient-text">آینده</span> پردازش را تجربه کنید.
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.125rem)', color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '520px', lineHeight: 1.7 }}>
            عملکرد در سطح دسکتاپ، موتورهای هوش مصنوعی پردازش عصبی، و عمر باتری واقعی یک روز کامل را در یک شاسی آلومینیومی با ضخامت تنها ۱۸ میلی‌متر تجربه کنید.
          </p>
          
          <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onExploreClick} style={{ flexGrow: 0 }}>
              مشاهده مدل‌ها <ArrowLeft size={18} />
            </button>
            <button className="btn btn-glass" style={{ flexGrow: 0 }}>
              تماشای رویداد رونمایی
            </button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', marginTop: '36px', gap: '16px' }}>
            <div>
              <div className="font-code" style={{ color: 'hsl(var(--accent-cyan))', fontWeight: 'bold', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>۶۸ ترافلاپس</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>توان موتور عصبی</div>
            </div>
            <div>
              <div className="font-code" style={{ color: 'hsl(var(--accent-purple))', fontWeight: 'bold', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>۱۷۵ وات</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>حداکثر توان گرافیک</div>
            </div>
            <div>
              <div className="font-code" style={{ color: 'hsl(var(--accent-green))', fontWeight: 'bold', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>۱۸ ساعت</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '2px' }}>دوام باتری</div>
            </div>
          </div>
        </div>

        <div className="glass-card animate-fade-in" style={{ padding: '16px', position: 'relative', animationDelay: '0.2s', overflow: 'hidden' }}>
          {/* Abstract Glow Behind Image */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '80%', height: '80%', background: 'radial-gradient(circle, hsla(var(--accent-cyan), 0.2) 0%, transparent 70%)',
            filter: 'blur(40px)', zIndex: 0
          }}></div>
          
          <img 
            src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80" 
            alt="لپ‌تاپ پرچمدار" 
            style={{ width: '100%', height: 'auto', borderRadius: '8px', position: 'relative', zIndex: 1, filter: 'contrast(1.1) saturate(1.2)', display: 'block' }} 
          />
          
          <div className="glass-panel" style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '10px 14px', zIndex: 2, display: 'flex', gap: '12px', direction: 'rtl', maxWidth: 'calc(100% - 24px)' }}>
            <div className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <Cpu size={18} color="hsl(var(--accent-cyan))" />
              <span className="font-code" style={{ fontSize: '11px', fontWeight: 'bold' }}>Intel Ultra</span>
            </div>
            <div className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <Zap size={18} color="hsl(var(--accent-purple))" />
              <span className="font-code" style={{ fontSize: '11px', fontWeight: 'bold' }}>RTX 5090</span>
            </div>
            <div className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <Battery size={18} color="hsl(var(--accent-green))" />
              <span className="font-code" style={{ fontSize: '11px', fontWeight: 'bold' }}>99.9Wh</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
