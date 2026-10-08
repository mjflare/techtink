import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, CheckCircle, AlertTriangle, Download, Headphones, FileText, Settings } from 'lucide-react';

export default function SupportSection() {
  const [faqs, setFaqs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('knowledgebase');
  
  // Warranty State
  const [serialNumber, setSerialNumber] = useState('');
  const [warrantyResult, setWarrantyResult] = useState(null);
  const [warrantyLoading, setWarrantyLoading] = useState(false);

  // Ticket State
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', issue: '' });
  const [ticketResult, setTicketResult] = useState(null);

  useEffect(() => {
    fetch('/api/support/faqs').then(res => res.json()).then(setFaqs);
    fetch('/api/support/drivers').then(res => res.json()).then(setDrivers);
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

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>پشتیبانی <span className="gradient-text">تک‌تینک</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>امروز چطور می‌توانیم به شما کمک کنیم؟</p>
      </div>

      <div className="flex" style={{ justifyContent: 'center', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { id: 'knowledgebase', label: 'پایگاه دانش', icon: FileText },
          { id: 'warranty', label: 'بررسی گارانتی', icon: ShieldCheckIcon },
          { id: 'drivers', label: 'درایورها و فرم‌ور', icon: Download },
          { id: 'contact', label: 'تماس با ما', icon: Headphones }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn glass-panel"
            style={{ 
              padding: '16px 24px', 
              background: activeTab === tab.id ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
              borderColor: activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
              flexGrow: 1, maxWidth: '250px'
            }}
          >
            <tab.icon size={20} color={activeTab === tab.id ? "hsl(var(--accent-cyan))" : "var(--text-secondary)"} />
            <span style={{ color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)" }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'knowledgebase' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
          <div style={{ position: 'relative', marginBottom: '40px' }}>
            <Search size={24} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="جستجو برای رفع مشکل، کدهای خطا، یا راهنماها..." style={{ padding: '16px 50px 16px 16px', fontSize: '1.125rem', borderRadius: '12px' }} />
          </div>

          <div className="grid" style={{ gap: '32px' }}>
            {faqs.map((cat, idx) => (
              <div key={idx}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'hsl(var(--accent-cyan))' }}>{cat.category}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {cat.items.map((item, i) => (
                    <details key={i} className="glass-panel" style={{ padding: '16px 24px', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.02)', marginBottom: '8px' }}>
                      <summary style={{ fontSize: '1.125rem' }}>{item.q}</summary>
                      <div style={{ paddingTop: '16px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
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

      {activeTab === 'warranty' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>بررسی وضعیت گارانتی</h2>
          <form onSubmit={checkWarranty} className="flex" style={{ flexDirection: 'column', gap: '16px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>شماره سریال را وارد کنید (مثال: TT-9082-X)</label>
            <input 
              className="font-code"
              type="text" 
              value={serialNumber} 
              onChange={e => setSerialNumber(e.target.value)} 
              placeholder="TT-XXXX-X" 
              required 
              style={{ fontSize: '1.25rem', padding: '16px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', direction: 'ltr' }} 
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '16px' }} disabled={warrantyLoading}>
              {warrantyLoading ? 'در حال بررسی دیتابیس...' : 'بررسی گارانتی'}
            </button>
          </form>

          {warrantyResult && (
            <div className="animate-fade-in" style={{ marginTop: '32px', padding: '24px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-glass)' }}>
              {warrantyResult.error ? (
                <div className="flex" style={{ alignItems: 'center', gap: '12px', color: '#ff4d4f' }}>
                  <AlertTriangle size={24} />
                  <span>{warrantyResult.error}</span>
                </div>
              ) : (
                <div>
                  <div className="flex" style={{ alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    {warrantyResult.status.includes('فعال') ? (
                      <CheckCircle size={32} color="hsl(var(--accent-green))" />
                    ) : (
                      <AlertTriangle size={32} color="#ff4d4f" />
                    )}
                    <div>
                      <h3 style={{ margin: 0 }}>{warrantyResult.model}</h3>
                      <div style={{ color: warrantyResult.status.includes('فعال') ? 'hsl(var(--accent-green))' : '#ff4d4f' }}>{warrantyResult.status}</div>
                    </div>
                  </div>
                  
                  <div className="grid font-code" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>مالک ثبت‌شده</div>
                      <div style={{ fontWeight: 'bold' }}>{warrantyResult.owner}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>تاریخ خرید</div>
                      <div style={{ fontWeight: 'bold' }}>{warrantyResult.purchaseDate}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>تاریخ انقضا</div>
                      <div style={{ fontWeight: 'bold' }}>{warrantyResult.warrantyExpiry}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>پوشش Care+</div>
                      <div style={{ fontWeight: 'bold' }}>{warrantyResult.carePlus ? 'بله' : 'خیر'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="animate-fade-in">
          <div className="grid" style={{ gap: '24px' }}>
            {drivers.map(laptop => (
              <div key={laptop.modelId} className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Settings size={24} color="hsl(var(--accent-cyan))" />
                  {laptop.modelName}
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)' }}>نام فایل</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)' }}>دسته‌بندی</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)' }}>نسخه</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)' }}>تاریخ</th>
                        <th style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>حجم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laptop.files.map((file, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold' }} className="font-code" dir="ltr">{file.name}</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-glass)' }}>{file.category}</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-glass)' }} className="font-code">{file.version}</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }} className="font-code">{file.date}</td>
                          <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
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
              <h2>ارسال درخواست پشتیبانی</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>کارشناسان و هوش مصنوعی ما در کمتر از ۲ ساعت پاسخگو خواهند بود.</p>
              
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
              
              <button type="submit" className="btn btn-primary" style={{ padding: '16px' }}>ثبت تیکت</button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
const ShieldCheckIcon = ShieldCheck;
