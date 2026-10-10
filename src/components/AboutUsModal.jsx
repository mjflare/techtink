import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Phone, Clock, ExternalLink, ShieldCheck, 
  Cpu, Award, Headphones, ArrowLeft, Navigation, Sparkles 
} from 'lucide-react';
import { TelegramIcon, InstagramIcon, BaleIcon, AparatIcon } from './SocialLogos.jsx';

export default function AboutUsModal({ isOpen, onClose, onOpenSupport }) {
  const [aboutData, setAboutData] = useState({
    store_address: 'تهران، خیابان ولیعصر، تقاطع طالقانی، مجتمع تجاری نور تهران، طبقه همکف سوم، واحد ۸۰۲۴',
    store_phone: '۰۲۱-۸۸۲۲۶۶۰۰',
    store_mobile: '۰۹۱۲-۳۴۵۶۷۸۹',
    store_hours: 'شنبه تا چهارشنبه ۱۰:۰۰ الی ۲۰:۰۰ | پنج‌شنبه‌ها ۱۰:۰۰ الی ۱۶:۰۰',
    store_map_link: 'https://maps.google.com/?q=Tehran+Valiasr+TechTink',
    store_about: 'تک‌تینک نخستین مرجع تخصصی بررسی سخت‌افزاری، بنچمارک‌های آزمایشگاهی و عرضه بی‌واسطه لپ‌تاپ‌های گیمینگ، اولترابوک‌ها و ورک‌استیشن‌ها (Workstation) در ایران است.',
    telegram_url: 'https://t.me/techtink',
    instagram_url: 'https://instagram.com/techtink',
    bale_url: 'https://ble.ir/techtink',
    aparat_url: 'https://www.aparat.com/techtink'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/about')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setAboutData(prev => ({
              ...prev,
              ...data
            }));
          }
        })
        .catch(err => console.error('Failed to load about data:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-wrapper" style={{ zIndex: 120 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .about-modal-card {
          max-width: 860px;
          width: 95%;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .about-modal-header {
          position: relative;
          padding: 28px 28px 22px;
          background: var(--modal-header-bg, var(--glass-card-bg));
          border-bottom: 1px solid var(--border-glass);
          overflow: hidden;
        }
        .about-modal-body {
          padding: 24px 28px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
          -webkit-overflow-scrolling: touch;
        }
        .about-actions-row {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .about-social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .about-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          border-top: 1px solid var(--border-glass);
          background: var(--table-stripe);
        }

        @media (max-width: 640px) {
          .about-modal-card {
            width: 100% !important;
            max-height: 95vh !important;
            border-radius: 20px !important;
          }
          .about-modal-header {
            padding: 18px 16px 16px !important;
          }
          .about-modal-body {
            padding: 16px 14px !important;
            gap: 18px !important;
          }
          .about-actions-row {
            flex-direction: column !important;
          }
          .about-actions-row > * {
            width: 100% !important;
            justify-content: center !important;
          }
          .about-social-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .about-footer {
            padding: 12px 16px !important;
            flex-direction: column !important;
            gap: 10px !important;
            text-align: center;
          }
          .about-footer button {
            width: 100% !important;
          }
        }
      `}} />

      <div 
        className="glass-panel modal-card about-modal-card" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header Banner */}
        <div className="about-modal-header">
          {/* Subtle Cyber Glows */}
          <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, hsla(var(--accent-cyan), 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40%', right: '10%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, hsla(var(--accent-purple), 0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, gap: '12px' }}>
            <div className="flex" style={{ alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 20px hsla(var(--accent-cyan), 0.35)',
                  flexShrink: 0
                }}
              >
                <Cpu size={26} color="#fff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="flex" style={{ alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 800 }}>درباره تک‌تینک</h2>
                  <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', border: '1px solid hsla(var(--accent-cyan), 0.3)', padding: '2px 8px', fontSize: '0.72rem' }}>
                    شوروم و آزمایشگاه تخصصی
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  مرکز مهندسی بررسی سخت‌افزار و عرضه مستقیم لپ‌تاپ‌های برتر
                </p>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-glass" 
              style={{ padding: '8px', borderRadius: '50%', flexShrink: 0, minHeight: '36px', minWidth: '36px' }}
              onClick={onClose}
              title="بستن"
              aria-label="بستن پنجره درباره ما"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="about-modal-body">
          
          {/* About Description */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '18px 20px', lineHeight: 1.8 }}>
            <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'hsl(var(--accent-cyan))' }}>
              <Sparkles size={18} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>داستان و رسالت ما</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
              {aboutData.store_about}
            </p>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)' }}>
              <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} color="hsl(var(--accent-green))" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>ضمانت اصالت و سلامت قطعات</span>
              </div>
              <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                <Award size={18} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>تست بنچمارک قبل از تحویل</span>
              </div>
              <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                <Headphones size={18} color="hsl(var(--accent-purple))" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>مشاوره فنی رایگان و حضوری</span>
              </div>
            </div>
          </div>

          {/* Location & Physical Presence */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MapPin size={18} color="hsl(var(--accent-cyan))" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>دفتر مرکزی، شوروم و لابراتوار فنی</h3>
            </div>

            <div style={{ background: 'var(--table-stripe)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Address */}
                <div className="flex" style={{ gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', flexShrink: 0, marginTop: '2px' }}>
                    <MapPin size={18} color="hsl(var(--accent-cyan))" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>نشانی شوروم:</span>
                    <strong style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>{aboutData.store_address}</strong>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex" style={{ gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)', flexShrink: 0, marginTop: '2px' }}>
                    <Clock size={18} color="#eab308" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>ساعات پاسخگویی و بازدید حضوری:</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{aboutData.store_hours}</span>
                  </div>
                </div>

                {/* Phones */}
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '2px' }}>
                  <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', flexShrink: 0 }}>
                      <Phone size={18} color="hsl(var(--accent-green))" />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>تلفن ثابت فروشگاه:</span>
                      <a href={`tel:${aboutData.store_phone.replace(/[^0-9]/g, '')}`} style={{ direction: 'ltr', fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {aboutData.store_phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', flexShrink: 0 }}>
                      <Phone size={18} color="hsl(var(--accent-purple))" />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>تلفن همراه و مشاوره مهندسی:</span>
                      <a href={`tel:${aboutData.store_mobile.replace(/[^0-9]/g, '')}`} style={{ direction: 'ltr', fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {aboutData.store_mobile}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Navigation Map Action Buttons */}
                <div className="about-actions-row">
                  {aboutData.store_map_link && (
                    <a 
                      href={aboutData.store_map_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary"
                      style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                    >
                      <Navigation size={15} /> مسیریابی در نقشه (Google Maps / بلد / نشان)
                    </a>
                  )}
                  {onOpenSupport && (
                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      onClick={() => {
                        onClose();
                        onOpenSupport();
                      }}
                    >
                      رزرو وقت بازدید یا تست حضوری لپ‌تاپ <ArrowLeft size={14} />
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Official Social Media Channels */}
          <div>
            <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ExternalLink size={18} color="hsl(var(--accent-purple))" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>کانال‌ها و شبکه‌های اجتماعی رسمی تک‌تینک</h3>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: 0, marginBottom: '14px' }}>
              برای تماشای آنباکسینگ‌ها، بررسی‌های ویدیویی و مشاوره‌های روزانه همراه ما باشید:
            </p>

            <div className="about-social-grid">
              
              {/* Telegram */}
              <a 
                href={aboutData.telegram_url || 'https://t.me/techtink'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="glass-panel"
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: '14px', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  border: '1px solid rgba(41, 169, 234, 0.25)',
                  background: 'rgba(41, 169, 234, 0.05)',
                  minHeight: '48px'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#29a9ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TelegramIcon size={20} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>تلگرام (Telegram)</div>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', direction: 'ltr' }}>@techtink</div>
                </div>
              </a>

              {/* Instagram */}
              <a 
                href={aboutData.instagram_url || 'https://instagram.com/techtink'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="glass-panel"
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: '14px', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  border: '1px solid rgba(225, 48, 108, 0.25)',
                  background: 'rgba(225, 48, 108, 0.05)',
                  minHeight: '48px'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <InstagramIcon size={20} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>اینستاگرام (Instagram)</div>
                  <div style={{ fontSize: '0.72rem', color: '#f472b6', direction: 'ltr' }}>@techtink</div>
                </div>
              </a>

              {/* Bale */}
              <a 
                href={aboutData.bale_url || 'https://ble.ir/techtink'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="glass-panel"
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: '14px', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  border: '1px solid rgba(0, 191, 165, 0.25)',
                  background: 'rgba(0, 191, 165, 0.05)',
                  minHeight: '48px'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BaleIcon size={38} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>پیام‌رسان بله (Bale)</div>
                  <div style={{ fontSize: '0.72rem', color: '#2dd4bf', direction: 'ltr' }}>ble.ir/techtink</div>
                </div>
              </a>

              {/* Aparat */}
              <a 
                href={aboutData.aparat_url || 'https://www.aparat.com/techtink'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="glass-panel"
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: '14px', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  border: '1px solid rgba(234, 29, 93, 0.25)',
                  background: 'rgba(234, 29, 93, 0.05)',
                  minHeight: '48px'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AparatIcon size={38} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>آپارات (Aparat)</div>
                  <div style={{ fontSize: '0.72rem', color: '#fb7185', direction: 'ltr' }}>کانال بررسی ویدیویی</div>
                </div>
              </a>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="about-footer">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            تک‌تینک — مرکز تخصصی بررسی و مقایسه سخت‌افزار
          </span>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ padding: '8px 24px', fontSize: '0.85rem' }} 
            onClick={onClose}
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
}
