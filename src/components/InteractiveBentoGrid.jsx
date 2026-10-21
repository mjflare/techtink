import React, { useState } from 'react';
import { 
  ShieldCheck, Cpu, HardDrive, MapPin, Clock, Award, 
  CheckCircle, ArrowLeft, Sparkles, Activity, Zap, Flame,
  Check
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
    { title: 'تست پایداری گرافیک FurMark', detail: 'لود ۱۰۰٪ بدون کرش (دما زیر ۷۵°C)', icon: Flame },
    { title: 'رندر پیوسته Cinebench R23', detail: 'تست عملکرد پردازنده در فشارهای سنگین', icon: Cpu },
    { title: 'اسکن ۴ مرحله‌ای MemTest86', detail: 'بررسی سلامت تک‌تک اسلات‌های حافظه رم', icon: CheckCircle },
    { title: 'تست سلامت و شارژدهی باتری', detail: 'تست سلامت واقعی سلول‌های باتری و مدار شارژ', icon: Zap }
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
    <section className="container" style={{ marginBottom: '48px', overflow: 'hidden' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-glow" style={{ fontSize: '0.78rem', padding: '4px 12px' }}>
            <Award size={13} style={{ marginLeft: '4px' }} />
            چرا خرید از تک‌تینک؟
          </span>
        </div>
        <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
          خیال راحت با استانداردهای <span className="gradient-text">تک‌تینک</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', maxWidth: '620px', margin: '0 auto', lineHeight: 1.65 }}>
          در تک‌تینک تمام لپ‌تاپ‌ها قبل از ارسال، تست فنی کامل می‌شوند تا دستگاهی کاملاً سالم، تمیز و با ضمانت معتبر تحویل بگیرید.
        </p>
      </div>

      {/* Bento Grid Layout - Fully responsive via dedicated CSS classes */}
      <div className="tt-bento-grid">
        
        {/* CARD 1: 24h Stress Testing Lab */}
        <div className="glass-card animate-fade-in tt-bento-card tt-bento-card-7">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--accent-cyan))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Hardware Reliability
                </span>
                <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', fontWeight: 800, margin: '4px 0 0' }}>
                  تست استرس ۲۴ ساعته قبل از بسته‌بندی
                </h3>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '100px',
                background: completedTests.length === 4 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: completedTests.length === 4 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                color: completedTests.length === 4 ? 'hsl(var(--accent-green))' : '#d97706',
                fontSize: '0.76rem',
                fontWeight: 700
              }}>
                <Activity size={13} className={completedTests.length === 4 ? '' : 'spin-slow'} />
                <span>{completedTests.length === 4 ? 'تاییدیه ۱۰۰٪ پاس شده' : `${completedTests.length} از ۴ تست`}</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '16px' }}>
              تمام دستگاه‌ها باید این ۴ تست اصلی را با موفقیت پشت سر بگذارند تا تایید نهایی شوند:
            </p>

            {/* Interactive Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isPassed ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                      border: isPassed ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: isPassed ? 'linear-gradient(135deg, hsla(var(--accent-cyan), 0.2), hsla(var(--accent-purple), 0.2))' : 'rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isPassed ? 'hsl(var(--accent-cyan))' : 'var(--text-muted)',
                        flexShrink: 0
                      }}>
                        <IconComp size={15} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                          {t.detail}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isPassed ? 'hsl(var(--accent-green))' : 'transparent',
                      border: isPassed ? 'none' : '2px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {isPassed && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              همراه با برگه نتایج تست سلامت داخل جعبه
            </span>
            <span style={{ fontSize: '0.74rem', color: 'hsl(var(--accent-cyan))', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} /> برچسب اصالت تک‌تینک
            </span>
          </div>
        </div>

        {/* CARD 2: Live RAM & SSD Upgrade Customizer */}
        <div className="glass-card animate-fade-in tt-bento-card tt-bento-card-5">
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--accent-purple))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Instant Customization
            </span>
            <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', fontWeight: 800, margin: '4px 0 6px' }}>
              ارتقای قطعات دلخواه با قطعات اصلی
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5, marginBottom: '14px' }}>
              رم و حافظه را متناسب با نیاز خود تغییر دهید تا دستگاه اختصاصی آماده ارسال شود:
            </p>

            {/* RAM Switcher */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} color="hsl(var(--accent-purple))" /> حافظه رم (RAM):
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
                      padding: '8px 4px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: ramOption === idx ? 700 : 500,
                      background: ramOption === idx ? 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))' : 'rgba(0, 0, 0, 0.04)',
                      color: ramOption === idx ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {lvl.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* SSD Switcher */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardDrive size={14} color="hsl(var(--accent-cyan))" /> فضای ذخیره‌سازی SSD:
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
                      padding: '8px 4px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: ssdOption === idx ? 700 : 500,
                      background: ssdOption === idx ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(0, 0, 0, 0.04)',
                      color: ssdOption === idx ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border-glass)',
                      cursor: 'pointer',
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
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>سرعت خواندن SSD</div>
                <div className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'hsl(var(--accent-cyan))', marginTop: '1px' }}>
                  {currentSsd.speed}
                </div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-glass)' }} />
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>امتیاز عملکردی</div>
                <div className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'hsl(var(--accent-purple))', marginTop: '1px' }}>
                  {currentRam.multiScore} / 100
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>اختلاف قیمت:</span>
              <div className="font-tech" style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalUpgradeCost === 0 ? 'بدون هزینه اضافی' : `+ ${formatPrice(totalUpgradeCost)}`}
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onExploreCatalog}
              style={{ fontSize: '0.76rem', padding: '7px 12px', borderRadius: '8px' }}
            >
              مشاهده محصولات <ArrowLeft size={13} />
            </button>
          </div>
        </div>

        {/* CARD 3: Isfahan Physical Showroom & 1-Hour Courier */}
        <div className="glass-card animate-fade-in tt-bento-card tt-bento-card-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
                Local Presence
              </span>
              <h4 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', fontWeight: 800, margin: 0 }}>
                شوروم حضوری و ارسال سریع در شهر اصفهان
              </h4>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '14px' }}>
            امکان مراجعه حضوری و تست فنی لپ‌تاپ قبل از تسویه حساب در شهر اصفهان. همچنین سفارش‌های آنلاین اصفهان در کمتر از ۶۰ دقیقه با پیک اختصاصی ارسال می‌شوند.
          </p>

          <div className="tt-bento-subgrid-2">
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Clock size={14} color="hsl(var(--accent-cyan))" /> تحویل ۱ ساعته اصفهان
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                ارسال اکسپرس مستقیم با هماهنگی تلفنی
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <ShieldCheck size={14} color="hsl(var(--accent-green))" /> پرداخت در محل اصفهان
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                تسویه پس از تست کامل و تایید خریدار
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Unconditional Gold Guarantee */}
        <div className="glass-card animate-fade-in tt-bento-card tt-bento-card-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'hsl(var(--accent-green))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--accent-green))', textTransform: 'uppercase' }}>
                Worry-Free Guarantee
              </span>
              <h4 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', fontWeight: 800, margin: 0 }}>
                ضمانت طلایی تک‌تینک و ۷ روز مهلت تست
              </h4>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '14px' }}>
            تمام دستگاه‌های تک‌تینک دارای ۷ روز مهلت بازگشت وجه در صورت هرگونه نارضایتی و تا ۲۴ ماه ضمانت تعویض سخت‌افزاری هستند.
          </p>

          <div className="tt-bento-subgrid-2">
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <CheckCircle size={14} color="hsl(var(--accent-green))" /> ۷ روز بازگشت وجه
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                در صورت هرگونه عدم رضایت، بدون شرط
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Award size={14} color="hsl(var(--accent-purple))" /> گارانتی تعویض قطعات
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                تامین قطعات اصلی در دفتر مرکزی اصفهان
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Robust Mobile-First Styles for Bento Grid */}
      <style dangerouslySetInnerHTML={{__html: `
        .tt-bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          width: 100%;
        }
        .tt-bento-card {
          padding: 20px 16px;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
        }
        .tt-bento-subgrid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 640px) {
          .tt-bento-card {
            padding: 24px 20px;
            border-radius: 22px;
          }
          .tt-bento-subgrid-2 {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }

        @media (min-width: 960px) {
          .tt-bento-grid {
            grid-template-columns: repeat(12, 1fr);
            gap: 20px;
          }
          .tt-bento-card-7 {
            grid-column: span 7;
          }
          .tt-bento-card-5 {
            grid-column: span 5;
          }
          .tt-bento-card-6 {
            grid-column: span 6;
          }
        }
      `}} />
    </section>
  );
}
