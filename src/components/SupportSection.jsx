import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronDown, CheckCircle, AlertTriangle, Download, 
  Headphones, FileText, Calendar, Clock, Laptop, Wrench, 
  ShieldCheck, ArrowRight, Truck, CheckCircle2, AlertCircle, 
  Copy, Check, Sparkles, User, Phone, Mail, FileCheck
} from 'lucide-react';

export default function SupportSection() {
  const [faqs, setFaqs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('appointment'); // default to appointment & services
  const [laptops, setLaptops] = useState([]);
  
  // Warranty State
  const [serialNumber, setSerialNumber] = useState('');
  const [warrantyResult, setWarrantyResult] = useState(null);
  const [warrantyLoading, setWarrantyLoading] = useState(false);

  // Ticket State
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', issue: '' });
  const [ticketResult, setTicketResult] = useState(null);

  // Appointment & Services State
  const [serviceType, setServiceType] = useState('showcase'); // 'showcase' | 'upgrade' | 'warranty' | 'track'
  const [appointmentForm, setAppointmentForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    preferred_date: '',
    preferred_time: '۱۰:۰۰ الی ۱۲:۰۰',
    product_id: '',
    product_name: '',
    delivery_method: 'in_person',
    notes: '',
    // specific options
    custom_request_text: '',
    upgrade_items: [],
    device_model: '',
    device_serial: ''
  });
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState(null);
  const [appointmentError, setAppointmentError] = useState(null);

  // Tracking Code State
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetch('/api/support/faqs').then(res => res.json()).then(setFaqs).catch(() => {});
    fetch('/api/support/drivers').then(res => res.json()).then(setDrivers).catch(() => {});
    fetch('/api/products').then(res => res.json()).then(setLaptops).catch(() => {});
  }, []);

  const checkWarranty = async (e) => {
    e.preventDefault();
    setWarrantyLoading(true);
    setWarrantyResult(null);
    try {
      const res = await fetch(`/api/support/warranty/${serialNumber}`);
      const data = await res.json();
      setWarrantyResult(res.ok ? data : { error: 'شماره سریال یافت نشد یا نامعتبر است' });
    } catch (error) {
      setWarrantyResult({ error: 'خطا در اتصال به سرور گارانتی.' });
    }
    setWarrantyLoading(false);
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm)
      });
      const data = await res.json();
      if (res.ok) {
        setTicketResult({ ...data, message: 'تیکت پشتیبانی شما با موفقیت ثبت شد.' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpgradeToggle = (item) => {
    setAppointmentForm(prev => {
      const exists = prev.upgrade_items.includes(item);
      const nextItems = exists ? prev.upgrade_items.filter(x => x !== item) : [...prev.upgrade_items, item];
      return { ...prev, upgrade_items: nextItems };
    });
  };

  const submitAppointment = async (e) => {
    e.preventDefault();
    setAppointmentLoading(true);
    setAppointmentError(null);

    // Compose rich notes
    let fullNotes = appointmentForm.notes || '';
    if (serviceType === 'upgrade') {
      const upgradesText = appointmentForm.custom_request_text 
        ? `خدمات درخواستی ارتقا: ${appointmentForm.custom_request_text}` 
        : '';
      const deviceText = appointmentForm.device_model ? `مدل دستگاه: ${appointmentForm.device_model}` : '';
      fullNotes = [deviceText, upgradesText, fullNotes].filter(Boolean).join(' | ');
    } else if (serviceType === 'warranty') {
      const serialText = appointmentForm.device_serial ? `شماره سریال دستگاه: ${appointmentForm.device_serial}` : '';
      const modelText = appointmentForm.device_model ? `مدل دستگاه: ${appointmentForm.device_model}` : '';
      const issueText = appointmentForm.custom_request_text ? `شرح ایراد/درخواست: ${appointmentForm.custom_request_text}` : '';
      fullNotes = [modelText, serialText, issueText, fullNotes].filter(Boolean).join(' | ');
    } else if (serviceType === 'showcase') {
      const showcaseNotes = appointmentForm.custom_request_text ? `توضیحات آزمون یا درخواست: ${appointmentForm.custom_request_text}` : '';
      fullNotes = [showcaseNotes, fullNotes].filter(Boolean).join(' | ');
    }

    try {
      const payload = {
        appointment_type: serviceType,
        customer_name: appointmentForm.customer_name,
        customer_phone: appointmentForm.customer_phone,
        customer_email: appointmentForm.customer_email,
        preferred_date: appointmentForm.preferred_date || new Intl.DateTimeFormat('fa-IR').format(new Date()),
        preferred_time: appointmentForm.preferred_time,
        product_id: appointmentForm.product_id || null,
        product_name: appointmentForm.product_name || null,
        delivery_method: appointmentForm.delivery_method,
        notes: fullNotes
      };

      const res = await fetch('/api/support/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setAppointmentResult(data);
      } else {
        setAppointmentError(data.error || 'خطا در ثبت نوبت. لطفاً ورودی‌ها را بررسی کنید.');
      }
    } catch (err) {
      setAppointmentError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleTrackAppointment = async (e) => {
    e?.preventDefault();
    if (!trackCode.trim()) return;
    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await fetch(`/api/support/appointment/${encodeURIComponent(trackCode.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setTrackResult(data);
      } else {
        setTrackError(data.error || 'نوبتی با این کد رهگیری یافت نشد.');
      }
    } catch (err) {
      setTrackError('خطا در استعلام نوبت.');
    } finally {
      setTrackLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return { text: 'تایید شده', color: 'hsl(var(--accent-green))', bg: 'hsla(var(--accent-green), 0.15)' };
      case 'in_progress': return { text: 'در حال انجام / سرویس', color: 'hsl(var(--accent-cyan))', bg: 'hsla(var(--accent-cyan), 0.15)' };
      case 'completed': return { text: 'تکمیل شده و تحویل داده شد', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'cancelled': return { text: 'لغو شده', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      default: return { text: 'در انتظار بررسی کارشناس', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    }
  };

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <h1 style={{ fontSize: '2.8rem', marginBottom: '14px', fontWeight: 800 }}>
          مرکز خدمات، رزرو و پشتیبانی <span className="gradient-text">تک‌تینک</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto' }}>
          رزرو وقت تست و بررسی حضوری لپ‌تاپ در شوروم، ارتقای سخت‌افزاری با قطعات اصلی، پیگیری گارانتی و دانلود درایورها
        </p>
      </div>

      {/* Main Tabs */}
      <div className="touch-scroll-x" style={{ justifyContent: 'center', marginBottom: '32px', gap: '10px', paddingBottom: '6px' }}>
        {[
          { id: 'appointment', label: 'رزرو نوبت و خدمات', icon: Calendar, badge: 'جدید' },
          { id: 'warranty', label: 'استعلام گارانتی', icon: ShieldCheck },
          { id: 'drivers', label: 'درایورها و فرم‌ور', icon: Download },
          { id: 'knowledgebase', label: 'پایگاه دانش', icon: FileText },
          { id: 'contact', label: 'تیکت پشتیبانی', icon: Headphones }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn glass-panel"
            style={{ 
              padding: '12px 18px', 
              background: activeTab === tab.id ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
              borderColor: activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '12px',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <tab.icon size={18} color={activeTab === tab.id ? "hsl(var(--accent-cyan))" : "var(--text-secondary)"} />
            <span style={{ color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: activeTab === tab.id ? 700 : 500, whiteSpace: 'nowrap' }}>
              {tab.label}
            </span>
            {tab.badge && (
              <span style={{ fontSize: '0.65rem', background: 'hsl(var(--accent-cyan))', color: '#000', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* APPOINTMENT & SERVICES TAB */}
      {activeTab === 'appointment' && (
        <div className="glass-card animate-fade-in" style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '960px', margin: '0 auto' }}>
          
          {/* Sub-modes navigation */}
          <div className="touch-scroll-x" style={{ gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <button
              type="button"
              className="btn"
              style={{
                background: serviceType === 'showcase' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(255,255,255,0.05)',
                color: serviceType === 'showcase' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-glass)',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
              onClick={() => { setServiceType('showcase'); setAppointmentResult(null); }}
            >
              <Laptop size={17} /> تست حضوری دستگاه (Showcase)
            </button>

            <button
              type="button"
              className="btn"
              style={{
                background: serviceType === 'upgrade' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(255,255,255,0.05)',
                color: serviceType === 'upgrade' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-glass)',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
              onClick={() => { setServiceType('upgrade'); setAppointmentResult(null); }}
            >
              <Wrench size={17} /> ارتقا و سرویس سیستم
            </button>

            <button
              type="button"
              className="btn"
              style={{
                background: serviceType === 'warranty' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(255,255,255,0.05)',
                color: serviceType === 'warranty' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-glass)',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
              onClick={() => { setServiceType('warranty'); setAppointmentResult(null); }}
            >
              <ShieldCheck size={17} /> پذیرش گارانتی و تعمیرات
            </button>

            <button
              type="button"
              className="btn"
              style={{
                background: serviceType === 'track' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'rgba(255,255,255,0.05)',
                color: serviceType === 'track' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-glass)',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
              onClick={() => { setServiceType('track'); }}
            >
              <FileCheck size={17} /> پیگیری وضعیت نوبت (کد RES)
            </button>
          </div>

          {/* SUCCESS MESSAGE STATE */}
          {appointmentResult ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', animation: 'scaleUp 0.3s ease-out' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={44} color="hsl(var(--accent-green))" />
              </div>
              
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
                نوبت شما با موفقیت در سیستم ثبت گردید!
              </h2>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.7 }}>
                پیامک تایید حاوی اطلاعات رزرو به شماره تماس شما ارسال خواهد شد. برای پیگیری وضعیت نوبت می‌توانید از کد رهگیری زیر استفاده کنید:
              </p>

              {/* Tracking Code Box */}
              <div 
                className="glass-panel" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '16px 28px', 
                  borderRadius: '14px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid hsla(var(--accent-cyan), 0.4)',
                  boxShadow: '0 0 20px hsla(var(--accent-cyan), 0.2)'
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>کد پیگیری اختصاصی:</span>
                  <span className="font-code" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--accent-cyan))', letterSpacing: '1px' }}>
                    {appointmentResult.tracking_code}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-glass"
                  style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => copyToClipboard(appointmentResult.tracking_code)}
                >
                  {copiedCode ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                  {copiedCode ? 'کپی شد' : 'کپی کد'}
                </button>
              </div>

              <div className="flex" style={{ justifyContent: 'center', gap: '14px', marginTop: '32px' }}>
                <button
                  type="button"
                  className="btn btn-glass"
                  onClick={() => {
                    setTrackCode(appointmentResult.tracking_code);
                    setServiceType('track');
                    handleTrackAppointment();
                  }}
                >
                  مشاهده برگه وضعیت نوبت
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setAppointmentResult(null);
                    setAppointmentForm({
                      customer_name: '',
                      customer_phone: '',
                      customer_email: '',
                      preferred_date: '',
                      preferred_time: '۱۰:۰۰ الی ۱۲:۰۰',
                      product_id: '',
                      product_name: '',
                      delivery_method: 'in_person',
                      notes: '',
                      custom_request_text: '',
                      upgrade_items: [],
                      device_model: '',
                      device_serial: ''
                    });
                  }}
                >
                  ثبت رزرو جدید
                </button>
              </div>
            </div>
          ) : serviceType === 'track' ? (
            /* TRACK APPOINTMENT MODE */
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
                استعلام و پیگیری نوبت یا خدمات
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
                کد پیگیری که هنگام ثبت نوبت دریافت کرده‌اید (مثال: RES-A8B9C2) را وارد نمایید.
              </p>

              <form onSubmit={handleTrackAppointment} className="flex" style={{ gap: '12px', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="RES-XXXXXX"
                  value={trackCode}
                  onChange={e => setTrackCode(e.target.value.toUpperCase())}
                  className="font-code"
                  style={{ direction: 'ltr', fontSize: '1.1rem', fontWeight: 700, padding: '12px 16px', flex: 1 }}
                  required
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Search size={16} /> {trackLoading ? 'در حال استعلام...' : 'رهگیری'}
                </button>
              </form>

              {trackError && (
                <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                  <AlertCircle size={18} /> {trackError}
                </div>
              )}

              {trackResult && (
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', animation: 'scaleUp 0.2s ease-out' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>کد پیگیری نوبت:</span>
                      <strong className="font-code" style={{ fontSize: '1.25rem', color: 'hsl(var(--accent-cyan))' }}>{trackResult.tracking_code}</strong>
                    </div>
                    {(() => {
                      const st = getStatusLabel(trackResult.status);
                      return (
                        <span style={{ padding: '4px 12px', borderRadius: '20px', background: st.bg, color: st.color, fontSize: '0.85rem', fontWeight: 700 }}>
                          {st.text}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>نوع خدمت:</span>
                      <strong>{trackResult.appointment_type === 'showcase' ? 'تست و بررسی حضوری لپ‌تاپ' : trackResult.appointment_type === 'upgrade' ? 'ارتقای سخت‌افزاری' : 'تعمیرات و گارانتی'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>نام متقاضی:</span>
                      <strong>{trackResult.customer_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>تاریخ رزرو شده:</span>
                      <strong>{trackResult.preferred_date}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>بازه زمانی:</span>
                      <strong>{trackResult.preferred_time}</strong>
                    </div>
                    {trackResult.product_name && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block' }}>دستگاه انتخابی برای تست:</span>
                        <strong style={{ color: 'hsl(var(--accent-cyan))' }}>{trackResult.product_name}</strong>
                      </div>
                    )}
                    {trackResult.notes && (
                      <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>جزئیات و یادداشت کارشناسی:</span>
                        <p style={{ margin: 0, lineHeight: 1.6 }}>{trackResult.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* BOOKING FORMS */
            <form onSubmit={submitAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Introduction Banner based on serviceType */}
              <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Sparkles size={24} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {serviceType === 'showcase' && (
                    <span>
                      با انتخاب لپ‌تاپ دلخواهتان، دستگاه در لابراتوار تک‌تینک از قبل آماده می‌شود تا در ساعت مقرر به صورت حضوری بنچمارک، تست کیبورد، نمایشگر و سلامت باتری آن را شخصاً بررسی فرمایید.
                    </span>
                  )}
                  {serviceType === 'upgrade' && (
                    <span>
                      ارتقای تخصصی رم، اس‌اس‌دی‌های NVMe Gen4، تعویض خمیر سیلیکون و پد حرارتی با مواد پریمیوم و تمیزکاری حرفه‌ای هیت‌سینک در حضور مشتری یا به صورت ارسالی.
                    </span>
                  )}
                  {serviceType === 'warranty' && (
                    <span>
                      ثبت درخواست استفاده از خدمات گارانتی طلایی تک‌تینک. در صورت بروز هرگونه مشکل فنی، دستگاه پذیرش شده و ظرف ۲۴ الی ۴۸ ساعت تعیین وضعیت می‌گردد.
                    </span>
                  )}
                </div>
              </div>

              {appointmentError && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem' }}>
                  {appointmentError}
                </div>
              )}

              {/* Specific Options based on serviceType */}
              {serviceType === 'showcase' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    انتخاب لپ‌تاپ برای تست حضوری در شوروم <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={appointmentForm.product_id}
                    onChange={e => {
                      const selId = e.target.value;
                      const selProd = laptops.find(p => String(p.id) === String(selId));
                      setAppointmentForm(prev => ({
                        ...prev,
                        product_id: selId,
                        product_name: selProd ? `${selProd.brand} ${selProd.model}` : ''
                      }));
                    }}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem', borderRadius: '10px' }}
                  >
                    <option value="">-- لطفاً دستگاه مورد نظر خود را انتخاب نمایید --</option>
                    {laptops.map(lap => (
                      <option key={lap.id} value={lap.id}>
                        {lap.brand} {lap.model} ({lap.grade ? `گرید ${lap.grade} - ` : ''}{lap.price?.toLocaleString('fa-IR')} تومان)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {serviceType === 'upgrade' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        مدل و برند دستگاه فعلی شما <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: Lenovo Legion 5 Pro یا Asus ROG G15"
                        value={appointmentForm.device_model}
                        onChange={e => setAppointmentForm({ ...appointmentForm, device_model: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        شیوه ارائه دستگاه به لابراتوار
                      </label>
                      <select
                        value={appointmentForm.delivery_method}
                        onChange={e => setAppointmentForm({ ...appointmentForm, delivery_method: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="in_person">مراجعه حضوری به شوروم و تحویل در محل</option>
                        <option value="courier">ارسال از طریق پیک موتوری / تیپاکس به آدرس شرکت</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                      شرح خدمات یا ارتقای مورد نظر شما <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      rows="3"
                      required
                      placeholder="خدمات یا قطعات مورد نظر خود را بنویسید (مثلاً: ارتقای رم به ۳۲ یا ۶۴ گیگ، افزایش حافظه SSD، سرویس دوره‌ای فن‌ها و تعویض خمیر حرارتی سیلیکون، نصب ویندوز یا رفع ایراد خاص)..."
                      value={appointmentForm.custom_request_text}
                      onChange={e => setAppointmentForm({ ...appointmentForm, custom_request_text: e.target.value })}
                      style={{ width: '100%', borderRadius: '10px', padding: '12px 14px', fontSize: '0.9rem', lineHeight: 1.6 }}
                    />
                  </div>
                </div>
              )}

              {serviceType === 'warranty' && (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      شماره سریال یا کد فاکتور خرید <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="SN: TT-XXXX یا شماره فاکتور"
                      value={appointmentForm.device_serial}
                      onChange={e => setAppointmentForm({ ...appointmentForm, device_serial: e.target.value })}
                      className="font-code"
                      style={{ direction: 'ltr', width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                      مدل دقیق لپ‌تاپ
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: Dell XPS 15 9530"
                      value={appointmentForm.device_model}
                      onChange={e => setAppointmentForm({ ...appointmentForm, device_model: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Customer Contact Details */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    نام و نام خانوادگی <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رضا محمدی"
                    value={appointmentForm.customer_name}
                    onChange={e => setAppointmentForm({ ...appointmentForm, customer_name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    شماره موبایل جهت هماهنگی و پیامک <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={appointmentForm.customer_phone}
                    onChange={e => setAppointmentForm({ ...appointmentForm, customer_phone: e.target.value })}
                    style={{ width: '100%', direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    آدرس ایمیل (اختیاری)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={appointmentForm.customer_email}
                    onChange={e => setAppointmentForm({ ...appointmentForm, customer_email: e.target.value })}
                    style={{ width: '100%', direction: 'ltr' }}
                  />
                </div>
              </div>

              {/* Date and Time Slot Picker */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    تاریخ مراجعه یا تحویل دستگاه <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شنبه ۱۴۰۵/۰۱/۲۵"
                    value={appointmentForm.preferred_date}
                    onChange={e => setAppointmentForm({ ...appointmentForm, preferred_date: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    بازه زمانی مناسب برای حضور
                  </label>
                  <select
                    value={appointmentForm.preferred_time}
                    onChange={e => setAppointmentForm({ ...appointmentForm, preferred_time: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="۱۰:۰۰ الی ۱۲:۰۰ (صبح)">۱۰:۰۰ الی ۱۲:۰۰ (صبح)</option>
                    <option value="۱۲:۰۰ الی ۱۴:۰۰ (ظهر)">۱۲:۰۰ الی ۱۴:۰۰ (ظهر)</option>
                    <option value="۱۵:۰۰ الی ۱۷:۰۰ (عصر)">۱۵:۰۰ الی ۱۷:۰۰ (عصر)</option>
                    <option value="۱۷:۰۰ الی ۱۹:۰۰ (غروب)">۱۷:۰۰ الی ۱۹:۰۰ (غروب)</option>
                  </select>
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  توضیحات تکمیلی یا سوالات پیش از حضور
                </label>
                <textarea
                  rows="3"
                  placeholder="در صورت نیاز به اجرای نرم‌افزار یا بازی خاص برای تست، یا اعلام جزئیات دقیق ایراد دستگاه در این بخش یادداشت فرمایید..."
                  value={appointmentForm.notes}
                  onChange={e => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={appointmentLoading}
                  className="btn btn-primary"
                  style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Calendar size={18} />
                  {appointmentLoading ? 'در حال ثبت نوبت...' : 'تایید نهایی و ثبت رزرو نوبت'}
                </button>
              </div>

            </form>
          )}

        </div>
      )}

      {/* WARRANTY CHECK TAB */}
      {activeTab === 'warranty' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <ShieldCheck size={48} color="hsl(var(--accent-cyan))" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>استعلام اصالت و گارانتی طلایی تک‌تینک</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              شماره سریال دستگاه خود را (درج شده در زیر لپ‌تاپ یا برچسب جعبه) وارد نمایید:
            </p>
          </div>

          <form onSubmit={checkWarranty} className="flex" style={{ gap: '12px', marginBottom: '24px' }}>
            <input 
              type="text" 
              placeholder="مثال: TT-LEGION-994" 
              required
              value={serialNumber} 
              onChange={e => setSerialNumber(e.target.value)}
              className="font-code"
              style={{ flex: 1, direction: 'ltr', fontSize: '1.1rem', padding: '12px 16px' }} 
            />
            <button type="submit" className="btn btn-primary" disabled={warrantyLoading} style={{ padding: '12px 24px' }}>
              {warrantyLoading ? 'در حال بررسی...' : 'استعلام'}
            </button>
          </form>

          {warrantyResult && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-glass)', animation: 'scaleUp 0.2s ease-out' }}>
              {warrantyResult.error ? (
                <div className="flex" style={{ alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                  <AlertTriangle size={24} />
                  <span>{warrantyResult.error}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="flex" style={{ alignItems: 'center', gap: '8px', color: 'hsl(var(--accent-green))' }}>
                    <CheckCircle size={22} />
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>گارانتی طلایی فعال است</h3>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.875rem', marginTop: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>مدل دستگاه:</span>
                      <strong>{warrantyResult.model}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>نوع گارانتی:</span>
                      <strong>{warrantyResult.warrantyType || 'پایه‌ساز و سخت‌افزاری'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>تاریخ خرید:</span>
                      <strong>{warrantyResult.purchaseDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block' }}>اعتبار تا تاریخ:</span>
                      <strong style={{ color: 'hsl(var(--accent-cyan))' }}>{warrantyResult.expiryDate}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DRIVERS & FIRMWARE TAB */}
      {activeTab === 'drivers' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '24px' }}>دانلود درایورها، بایوس و نرم‌افزارهای کالیبراسیون</h2>
          <div className="grid" style={{ gap: '24px' }}>
            {drivers.map(dev => (
              <div key={dev.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'hsl(var(--accent-cyan))' }}>{dev.device}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                        <th style={{ padding: '12px' }}>عنوان درایور</th>
                        <th style={{ padding: '12px' }}>دسته‌بندی</th>
                        <th style={{ padding: '12px' }}>نسخه</th>
                        <th style={{ padding: '12px' }}>تاریخ انتشار</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>دریافت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dev.files?.map((file, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                          <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold' }} className="font-code" dir="ltr">{file.name}</td>
                          <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-glass)' }}>{file.category}</td>
                          <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-glass)' }} className="font-code">{file.version}</td>
                          <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }} className="font-code">{file.date}</td>
                          <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                            <button className="btn btn-glass font-code" style={{ padding: '6px 12px', fontSize: '0.75rem', flexDirection: 'row-reverse' }}>
                              <Download size={14} /> {file.size}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KNOWLEDGEBASE TAB */}
      {activeTab === 'knowledgebase' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <Search size={22} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="جستجو برای رفع مشکل، کدهای خطا، یا راهنماها..." style={{ padding: '14px 48px 14px 16px', fontSize: '1rem', borderRadius: '12px', width: '100%' }} />
          </div>

          <div className="grid" style={{ gap: '24px' }}>
            {faqs.map((cat, idx) => (
              <div key={idx}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '14px', color: 'hsl(var(--accent-cyan))' }}>{cat.category}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cat.items?.map((item, i) => (
                    <details key={i} className="glass-panel" style={{ padding: '14px 20px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.02)' }}>
                      <summary style={{ fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>{item.q}</summary>
                      <div style={{ paddingTop: '14px', color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.9rem' }}>
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTACT TICKET TAB */}
      {activeTab === 'contact' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
          {ticketResult ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle size={64} color="hsl(var(--accent-green))" style={{ margin: '0 auto 24px' }} />
              <h2>{ticketResult.message}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>کد پیگیری شما: <strong className="font-code" style={{ color: 'var(--text-primary)' }}>{ticketResult.ticketId}</strong></p>
              <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => setTicketResult(null)}>ارسال تیکت جدید</button>
            </div>
          ) : (
            <form onSubmit={submitTicket} className="flex" style={{ flexDirection: 'column', gap: '20px' }}>
              <h2>ارسال تیکت پشتیبانی مهندسی</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>کارشناسان فنی تک‌تینک در سریع‌ترین زمان ممکن پاسخگوی شما خواهند بود.</p>
              
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input 
                  type="text" placeholder="نام و نام خانوادگی" required 
                  value={ticketForm.name} onChange={e => setTicketForm({...ticketForm, name: e.target.value})} 
                />
                <input 
                  type="email" placeholder="آدرس ایمیل" required 
                  value={ticketForm.email} onChange={e => setTicketForm({...ticketForm, email: e.target.value})} 
                />
              </div>
              <textarea 
                placeholder="مشکل خود را با جزئیات شرح دهید..." required rows="6"
                value={ticketForm.issue} onChange={e => setTicketForm({...ticketForm, issue: e.target.value})}
              ></textarea>
              
              <button type="submit" className="btn btn-primary" style={{ padding: '14px' }}>ثبت و ارسال تیکت</button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
