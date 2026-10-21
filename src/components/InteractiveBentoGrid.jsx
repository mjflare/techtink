import React, { useState } from 'react';
import { 
  ShieldCheck, Cpu, HardDrive, MapPin, Clock, Award, 
  CheckCircle, ArrowLeft, Sparkles, Activity, Zap, Flame,
  Check, Phone, ChevronRight, BarChart3, Layers
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function InteractiveBentoGrid({ onExploreCatalog }) {
  // 1. Stress Test Checklist State
  const [completedTests, setCompletedTests] = useState([0, 1, 2, 3]);
  const toggleTest = (idx) => {
    setCompletedTests(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const stressTests = [
    { title: 'تست پایداری گرافیک FurMark', detail: 'لود ۱۰۰٪ به مدت ۴۵ دقیقه بدون کرش (دما زیر ۷۵°C)', icon: Flame },
    { title: 'رندر پیوسته Cinebench R23', detail: 'سنجش پایداری فرکانس بوست پردازنده در لود کامل', icon: Cpu },
    { title: 'اسکن ۴ مرحله‌ای MemTest86', detail: 'بررسی تک‌تک سلول‌های حافظه رم با صفر درصد خطا', icon: CheckCircle },
    { title: 'کالیبراسیون و سلامت باتری', detail: 'تست سلامت واقعی سلول‌های لیتیوم و جریان شارژ', icon: Zap }
  ];

  // 2. RAM & SSD Live Customizer State
  const [ramOption, setRamOption] = useState(1); // 0: 16GB, 1: 32GB, 2: 64GB
  const [ssdOption, setSsdOption] = useState(1); // 0: 512GB, 1: 1TB, 2: 2TB

  const ramLevels = [
    { label: '16GB DDR5', speed: '4800 MHz', multiScore: 78, priceDelta: 0 },
    { label: '32GB DDR5', speed: '5600 MHz', multiScore: 94, priceDelta: 2400000 },
    { label: '64GB DDR5', speed: '5600 MHz', multiScore: 99, priceDelta: 5800000 }
  ];

  const ssdLevels = [
    { label: '512GB Gen4', speed: '3,500 MB/s', bootTime: '8s', priceDelta: 0 },
    { label: '1TB Samsung NVMe', speed: '7,450 MB/s', bootTime: '4s', priceDelta: 1900000 },
    { label: '2TB PCIe Gen4 Pro', speed: '7,450 MB/s', bootTime: '3s', priceDelta: 4200000 }
  ];

  const currentRam = ramLevels[ramOption];
  const currentSsd = ssdLevels[ssdOption];
  const totalUpgradeCost = currentRam.priceDelta + currentSsd.priceDelta;

  return (
    <section className="container" style={{ marginBottom: '64px' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="badge badge-glow" style={{ fontSize: '0.8rem', padding: '4px 14px' }}>
            <Award size={14} style={{ marginLeft: '4px' }} />
            تفاوت استانداردهای مهندسی تک‌تینک
          </span>
        </div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, margin: '0 0 10px' }}>
          چرا حرفه‌ای‌ها <span className="gradient-text">تک‌تینک</span> را انتخاب می‌کنند؟
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
          در تک‌تینک هر لپ‌تاپ پیش از تحویل، تحت تست‌های طاقت‌فرسای فیزیکی و نرم‌افزاری قرار می‌گیرد تا آسودگی خاطر یک سیستم نو را با قیمتی استثنایی تجربه کنید.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '20px'
        }}
      >
        {/* CARD 1: 24h Stress Testing Lab (Col 1-7 on desktop, 12 on mobile) */}
        <div 
          className="glass-card animate-fade-in"
          style={{
            gridColumn: 'span 7',
            padding: '28px',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, hsla(var(--accent-cyan), 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--accent-cyan))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Hardware Reliability
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0' }}>
                  تست استرس ۲۴ ساعته اختصاصی قبل از بسته‌بندی
                </h3>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '100px',
                background: completedTests.length === 4 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: completedTests.length === 4 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                color: completedTests.length === 4 ? 'hsl(var(--accent-green))' : '#d97706',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <Activity size={14} className={completedTests.length === 4 ? '' : 'spin-slow'} />
                <span>{completedTests.length === 4 ? 'تاییدیه ۱۰۰٪ پاس شده' : `${completedTests.length} از ۴ مرحله تست`}</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
              هیچ دستگاهی بدون گذراندن موفقیت‌آمیز چک‌لیست ۴ مرحله‌ای پایداری حرارتی و مدار تغذیه، برچسب گارانتی طلایی دریافت نمی‌کند:
            </p>

            {/* Interactive Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stressTests.map((t, idx) => {
                const isPassed = completedTests.includes(idx);
                const IconComp = t.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => toggleTest(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: isPassed ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                      border: isPassed ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: isPassed ? 'linear-gradient(135deg, hsla(var(--accent-cyan), 0.2), hsla(var(--accent-purple), 0.2))' : 'rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isPassed ? 'hsl(var(--accent-cyan))' : 'var(--text-muted)'
                      }}>
                        <IconComp size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {t.detail}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: isPassed ? 'hsl(var(--accent-green))' : 'transparent',
                      border: isPassed ? 'none' : '2px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      transition: 'all 0.2s ease'
                    }}>
                      {isPassed && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              همراه با گزارش مکتوب حرارتی و تست سلامت قطعات داخل جعبه
            </span>
            <span style={{ fontSize: '0.76rem', color: 'hsl(var(--accent-cyan))', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} /> برچسب هولوگرام اصالت تک‌تینک
            </span>
          </div>
        </div>

        {/* CARD 2: Live RAM & SSD Upgrade Customizer (Col 8-12 on desktop) */}
        <div 
          className="glass-card animate-fade-in"
          style={{
            gridColumn: 'span 5',
            padding: '28px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--accent-purple))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Instant Customization
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 8px' }}>
              ارتقای قطعات دلخواه با قطعات آکبند اصلی
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '18px' }}>
              رم و حافظه SSD را متناسب با نیاز پروژه خود تنظیم کنید تا دستگاه به صورت سفارشی آماده ارسال شود:
            </p>

            {/* RAM Switcher */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} color="hsl(var(--accent-purple))" /> ظرفیت حافظه رم (RAM):
                </span>
                <span className="font-tech" style={{ color: 'hsl(var(--accent-purple))' }}>{currentRam.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {ramLevels.map((lvl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRamOption(idx)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: ramOption === idx ? 700 : 500,
                      background: ramOption === idx ? 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))' : 'rgba(0, 0, 0, 0.04)',
                      color: ramOption === idx ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    {lvl.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* SSD Switcher */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardDrive size={14} color="hsl(var(--accent-cyan))" /> فضای ذخیره‌سازی NVMe SSD:
                </span>
                <span className="font-tech" style={{ color: 'hsl(var(--accent-cyan))' }}>{currentSsd.label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {ssdLevels.map((lvl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSsdOption(idx)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: ssdOption === idx ? 700 : 500,
                      background: ssdOption === idx ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(0, 0, 0, 0.04)',
                      color: ssdOption === idx ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    {lvl.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Performance Preview */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>سرعت خواندن SSD</div>
                <div className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'hsl(var(--accent-cyan))', marginTop: '2px' }}>
                  {currentSsd.speed}
                </div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-glass)' }} />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>امتیاز مالتی‌تسکینگ</div>
                <div className="font-tech" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'hsl(var(--accent-purple))', marginTop: '2px' }}>
                  {currentRam.multiScore} / 100
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>اختلاف قیمت ارتقا:</span>
              <div className="font-tech" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalUpgradeCost === 0 ? 'شامل پکیج پایه' : `+ ${formatPrice(totalUpgradeCost)}`}
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onExploreCatalog}
              style={{ fontSize: '0.78rem', padding: '8px 14px', borderRadius: '10px' }}
            >
              مشاهده در کاتالوگ <ArrowLeft size={14} />
            </button>
          </div>
        </div>

        {/* CARD 3: Isfahan Physical Showroom & 1-Hour Courier (Col 1-6) */}
        <div 
          className="glass-card animate-fade-in"
          style={{
            gridColumn: 'span 6',
            padding: '26px',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
                Local Presence
              </span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                شوروم حضوری و ارسال فوق‌سریع در شهر اصفهان
              </h4>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: '16px' }}>
            برای همشهریان عزیز اصفهانی، امکان مراجعه حضوری و تست فنی لپ‌تاپ قبل از تسویه حساب فراهم است. همچنین سفارش‌های آنلاین شهر اصفهان، در کمتر از ۶۰ دقیقه با پیک اختصاصی ارسال می‌شوند.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Clock size={15} color="hsl(var(--accent-cyan))" /> تحویل ۱ ساعته اصفهان
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                ارسال اکسپرس مستقیم درب منزل یا محل کار
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <ShieldCheck size={15} color="hsl(var(--accent-green))" /> پرداخت در محل اصفهان
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                تسویه پس از تست کامل و تایید فیزیکی خریدار
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Unconditional Gold Guarantee (Col 7-12) */}
        <div 
          className="glass-card animate-fade-in"
          style={{
            gridColumn: 'span 6',
            padding: '26px',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'hsl(var(--accent-green))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--accent-green))', textTransform: 'uppercase' }}>
                Worry-Free Guarantee
              </span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                ضمانت طلایی تک‌تینک و ۷ روز مهلت تست بی‌قید و شرط
              </h4>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: '16px' }}>
            تمام لپ‌تاپ‌های تک‌تینک دارای ۷ روز مهلت بازگشت وجه در صورت هرگونه مغایرت و تا ۲۴ ماه ضمانت تعویض سخت‌افزاری هستند؛ بدون سوال و به صورت تضمین‌شده.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <CheckCircle size={15} color="hsl(var(--accent-green))" /> ۷ روز بازگشت کامل وجه
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                اگر به هر دلیلی رضایت نداشتید، وجه برگشت داده می‌شود
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Award size={15} color="hsl(var(--accent-purple))" /> گارانتی تعویض قطعه
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                تامین قطعات اورجینال در دفتر مرکزی اصفهان
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Responsive Style for Bento Grid */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .glass-card[style*="grid-column: span 7"],
          .glass-card[style*="grid-column: span 5"],
          .glass-card[style*="grid-column: span 6"] {
            grid-column: span 12 !important;
          }
        }
      `}} />
    </section>
  );
}
