import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Inbox, CheckCircle2, Copy, Check, RefreshCw, Trash2,
  ShieldCheck, AlertCircle, ExternalLink, Search, Key, ChevronDown,
  ChevronUp, Server, Sparkles, Clock, Eye, Code, Terminal, Send
} from 'lucide-react';

export default function AdminWebmail({ authHeaders, onUnreadCountChange }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [viewTab, setViewTab] = useState('html'); // 'html' | 'text' | 'raw'
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Auto-polling interval
  const pollTimerRef = useRef(null);

  // Fetch status and email list
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/emails/status', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
        if (onUnreadCountChange && typeof data.unreadEmails === 'number') {
          onUnreadCountChange(data.unreadEmails);
        }
      }
    } catch (e) {
      console.error('Failed to fetch mail server status', e);
    }
  };

  const fetchEmailList = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams({
        limit: '50',
        search: search.trim(),
        unreadOnly: filterUnreadOnly ? 'true' : 'false'
      });
      const res = await fetch(`/api/admin/emails?${params.toString()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        setEmails(items);

        // Auto select first email if none selected or if previously selected got deleted
        if (items.length > 0 && !selectedEmailId) {
          setSelectedEmailId(items[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch emails', e);
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch full email details
  const fetchEmailDetail = async (id) => {
    if (!id) return;
    setEmailDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/${id}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSelectedEmail(data.email || null);
        // Refresh status unread counter
        fetchStatus();
      }
    } catch (e) {
      console.error('Failed to load email details', e);
    } finally {
      setEmailDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchEmailList();
  }, [search, filterUnreadOnly]);

  useEffect(() => {
    if (selectedEmailId) {
      fetchEmailDetail(selectedEmailId);
    } else {
      setSelectedEmail(null);
    }
  }, [selectedEmailId]);

  // Real-time polling every 5 seconds for eNamad instant reception
  useEffect(() => {
    if (!autoRefresh) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(() => {
      fetchEmailList(true);
      fetchStatus();
    }, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh, search, filterUnreadOnly]);

  // Copy code helper
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Simulate eNamad email test
  const handleSimulateEmail = async () => {
    setSimulating(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/emails/simulate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          from: 'noreply@enamad.ir',
          to: 'info@techtink.ir',
          code: '24125751'
        })
      });
      const data = await res.json();
      if (res.ok && data.email) {
        setActionMessage({
          type: 'success',
          text: `ایمیل آزمایشی اینماد با موفقیت به صندوق تزریق شد (کد تایید: ${data.email.verification_code})`
        });
        await fetchEmailList();
        setSelectedEmailId(data.email.id);
        fetchStatus();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'خطا در شبیه‌سازی ایمیل' });
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setSimulating(false);
    }
  };

  // Delete email
  const handleDeleteEmail = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('آیا از حذف این ایمیل اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/admin/emails/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'ایمیل با موفقیت حذف شد.' });
        if (selectedEmailId === id) {
          setSelectedEmailId(null);
          setSelectedEmail(null);
        }
        fetchEmailList();
        fetchStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z'));
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Find active eNamad code (from selected email or newest email)
  const activeCode = selectedEmail?.verification_code || serverStatus?.lastEmail?.verificationCode;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header & Live Server Status Bar */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 16px hsla(var(--accent-cyan), 0.35)'
              }}>
                <Mail size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                  صندوق ایمیل سازمانی <span className="gradient-text">info@techtink.ir</span>
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  سرور SMTP داخلی وب‌سایت جهت دریافت خودکار کدهای تایید اینماد (eNamad)، ترب و مکاتبات رسمی
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Live Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Status indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '12px',
              background: serverStatus?.isListening ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${serverStatus?.isListening ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              color: serverStatus?.isListening ? '#10b981' : '#f59e0b',
              fontSize: '0.825rem',
              fontWeight: 700
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: serverStatus?.isListening ? '#10b981' : '#f59e0b',
                boxShadow: serverStatus?.isListening ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
              }} />
              <span>پورت {serverStatus?.port || 25}: {serverStatus?.isListening ? 'در حال شنود و آماده' : 'در انتظار اتصال'}</span>
            </div>

            {/* Auto refresh toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="btn btn-glass"
              style={{
                padding: '8px 12px',
                fontSize: '0.8rem',
                borderRadius: '10px',
                color: autoRefresh ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'
              }}
              title="بروزرسانی خودکار هر ۵ ثانیه"
            >
              <Clock size={14} />
              <span>{autoRefresh ? 'بروزرسانی خودکار فعال' : 'بروزرسانی خودکار خاموش'}</span>
            </button>

            {/* Manual refresh button */}
            <button
              type="button"
              onClick={() => { fetchEmailList(); fetchStatus(); }}
              className="btn btn-glass"
              disabled={refreshing}
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem' }}
              title="بارگذاری مجدد صندوق"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              <span>بروزرسانی</span>
            </button>

            {/* Simulate test email */}
            <button
              type="button"
              onClick={handleSimulateEmail}
              disabled={simulating}
              className="btn btn-glass"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                borderColor: 'rgba(234, 179, 8, 0.4)',
                background: 'rgba(234, 179, 8, 0.08)',
                color: '#eab308'
              }}
              title="ایجاد ایمیل تست حاوی کد ۲۴۱۲۵۷۵۱"
            >
              <Sparkles size={15} />
              <span>{simulating ? 'در حال ایجاد...' : 'شبیه‌سازی ایمیل اینماد'}</span>
            </button>
          </div>
        </div>

        {/* Action notification toast */}
        {actionMessage && (
          <div style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            color: actionMessage.type === 'success' ? '#10b981' : '#f43f5e',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 2. Hero eNamad Verification Callout (Highlights extracted OTP code) */}
      {activeCode && (
        <div className="glass-card" style={{
          padding: '24px 28px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.1))',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#10b981', color: '#000' }}>
                  تاییدیه اینماد (eNamad)
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  کد یکبارمصرف تایید آدرس ایمیل دامنه techtink.ir
                </span>
              </div>
              <h3 style={{ margin: '6px 0 2px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                کد تاییدیه اینماد استخراج شد:
              </h3>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                کد زیر را کپی کرده و در کادر مربوطه در پنل اینماد قرار دهید و روی «تایید کد» کلیک کنید.
              </p>
            </div>
          </div>

          {/* Verification Code Box with 1-click Copy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '10px 24px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '2px dashed #10b981',
              fontFamily: 'monospace',
              fontSize: '1.75rem',
              fontWeight: 900,
              letterSpacing: '4px',
              color: '#10b981',
              textShadow: '0 0 12px rgba(16, 185, 129, 0.5)'
            }}>
              {activeCode}
            </div>

            <button
              type="button"
              onClick={() => handleCopyCode(activeCode)}
              className="btn btn-primary"
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: copiedCode ? '#10b981' : 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {copiedCode ? <Check size={18} /> : <Copy size={18} />}
              <span>{copiedCode ? 'کپی شد! ✓' : 'کپی کد تایید'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Collapsible DNS & Firewall Setup Guide Drawer */}
      <div className="glass-card" style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <div
          onClick={() => setShowDnsGuide(!showDnsGuide)}
          style={{
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.02)',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="hsl(var(--accent-cyan))" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              راهنمای اتصال DNS دامنه (Cloudflare / ایرنیک) و باز کردن پورت ۲۵
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '6px' }}>
              تنظیمات ضروری برای دریافت ایمیل از خارج سرور
            </span>
          </div>
          {showDnsGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {showDnsGuide && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              {/* Box 1: DNS Records */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'hsl(var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GlobeIcon size={16} /> ۱. رکوردهای DNS در پنل کلودفلر (Cloudflare):
                </h4>
                <ul style={{ margin: 0, paddingRight: '20px', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <li>
                    <strong>رکورد MX:</strong> Type: <code style={{ color: '#10b981' }}>MX</code> | Name: <code style={{ color: '#10b981' }}>@</code> | Mail Server: <code style={{ color: '#10b981' }}>mail.techtink.ir</code> | Priority: <code style={{ color: '#10b981' }}>10</code>
                  </li>
                  <li>
                    <strong>رکورد A ساب‌دامین mail:</strong> Type: <code style={{ color: '#10b981' }}>A</code> | Name: <code style={{ color: '#10b981' }}>mail</code> | IPv4: <code style={{ color: '#10b981' }}>IP سرور شما</code> | <strong>Proxy status: حتماً DNS Only (ابر خاکستری)</strong>
                  </li>
                  <li style={{ color: '#f59e0b', marginTop: '4px' }}>
                    ⚠️ ترافیک پورت ۲۵ نباید از پروکسی نارنجی کلودفلر عبور کند، حتماً رکورد mail خاکستری (DNS Only) باشد.
                  </li>
                </ul>
              </div>

              {/* Box 2: Server Firewall */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'hsl(var(--accent-purple))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={16} /> ۲. باز کردن پورت ۲۵ روی سرور اوبونتو (UFW):
                </h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  جهت دریافت اتصالات ورودی اینماد روی پورت ۲۵، دستور زیر را در ترمینال سرور اجرا فرمایید:
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <code>sudo ufw allow 25/tcp</code>
                  <button
                    onClick={() => navigator.clipboard.writeText('sudo ufw allow 25/tcp')}
                    style={{ background: 'none', border: 'none', color: 'hsl(var(--accent-cyan))', cursor: 'pointer' }}
                    title="کپی دستور"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  💡 سرور SMTP تک‌تینک در صورت محدود بودن پورت ۲۵، به عنوان پشتیبان روی پورت ۲۵۲۵ نیز شنود می‌کند.
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 4. Split-View Webmail Interface (List on Right, Content on Left in RTL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '20px', minHeight: '620px' }}>
        
        {/* Right Pane: Email List */}
        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="جستجو در ایمیل‌ها یا کد..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 36px 8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.825rem'
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              className="btn btn-glass"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.775rem',
                whiteSpace: 'nowrap',
                background: filterUnreadOnly ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                borderColor: filterUnreadOnly ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                color: filterUnreadOnly ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              خوانده نشده
            </button>
          </div>

          {/* Email Count Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 4px' }}>
            <span>تعداد پیام‌ها: {emails.length} مورد</span>
            {serverStatus?.unreadEmails > 0 && (
              <span style={{ color: 'hsl(var(--accent-cyan))', fontWeight: 700 }}>
                {serverStatus.unreadEmails} پیام خوانده‌نشده
              </span>
            )}
          </div>

          {/* Email List Items */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.85rem' }}>در حال بارگذاری ایمیل‌ها...</p>
              </div>
            ) : emails.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 6px' }}>صندوق خالی است</p>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
                  هنگامی که اینماد کد تایید را ارسال کند، پیام به صورت زنده اینجا ظاهر خواهد شد.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateEmail}
                  className="btn btn-glass"
                  style={{ marginTop: '16px', fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  تست دریافت ایمیل اینماد
                </button>
              </div>
            ) : (
              emails.map(item => {
                const isSelected = selectedEmailId === item.id;
                const isUnread = item.is_read === 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEmailId(item.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isSelected
                        ? '1px solid hsl(var(--accent-cyan))'
                        : isUnread
                          ? '1px solid rgba(14, 165, 233, 0.35)'
                          : '1px solid var(--border-glass)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(139, 92, 246, 0.12))'
                        : isUnread
                          ? 'rgba(14, 165, 233, 0.05)'
                          : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'hsl(var(--accent-cyan))',
                        boxShadow: '0 0 8px hsl(var(--accent-cyan))'
                      }} />
                    )}

                    {/* Sender and Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.825rem',
                        fontWeight: isUnread ? 800 : 600,
                        color: isSelected ? '#ffffff' : isUnread ? 'hsl(var(--accent-cyan))' : 'var(--text-primary)',
                        maxWidth: '180px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.from_address || 'فرستنده ناشناس'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* Subject */}
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: isUnread ? 700 : 500,
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.subject || '(بدون عنوان)'}
                    </div>

                    {/* Verification Code Badge (if extracted) */}
                    {item.verification_code && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <span style={{
                          fontSize: '0.725rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          fontWeight: 800,
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          fontFamily: 'monospace'
                        }}>
                          کد: {item.verification_code}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Left Pane: Email Detail & Body Viewer */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          {emailDetailLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
              <RefreshCw size={28} className="animate-spin" color="hsl(var(--accent-cyan))" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>در حال فراخوانی محتوای پیام...</p>
            </div>
          ) : !selectedEmail ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)', padding: '60px 20px', textAlign: 'center' }}>
              <Mail size={56} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                هیچ پیامی انتخاب نشده است
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
                یک پیام را از لیست سمت راست انتخاب کنید تا جزئیات کامل، کدهای تاییدیه و محتوای آن نمایش داده شود.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Header Bar */}
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedEmail.subject || '(بدون عنوان)'}
                  </h2>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEmail(selectedEmail.id, e)}
                      className="btn btn-glass"
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#f43f5e' }}
                      title="حذف ایمیل"
                    >
                      <Trash2 size={14} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>

                {/* Sender Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', width: '60px' }}>فرستنده:</span>
                    <span style={{ color: 'hsl(var(--accent-cyan))', fontWeight: 700, direction: 'ltr' }}>
                      {selectedEmail.from_address}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', width: '60px' }}>گیرنده:</span>
                    <span style={{ color: 'var(--text-secondary)', direction: 'ltr' }}>
                      {selectedEmail.to_address || 'info@techtink.ir'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', width: '60px' }}>زمان:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(selectedEmail.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dedicated Verification Code Highlight Box for this email */}
              {selectedEmail.verification_code && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Key size={20} color="#10b981" />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800 }}>
                        کد تایید شناسایی‌شده در متن پیام:
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff', letterSpacing: '2px' }}>
                        {selectedEmail.verification_code}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(selectedEmail.verification_code)}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.825rem',
                      borderRadius: '8px',
                      background: copiedCode ? '#10b981' : 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))'
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'کپی شد' : 'کپی کد'}</span>
                  </button>
                </div>
              )}

              {/* View Switcher Tabs (HTML vs Plain Text vs Raw) */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setViewTab('html')}
                  className="btn btn-glass"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: viewTab === 'html' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                    borderColor: viewTab === 'html' ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                    color: viewTab === 'html' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <Eye size={14} /> پیش‌نمایش گرافیکی
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('text')}
                  className="btn btn-glass"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: viewTab === 'text' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                    borderColor: viewTab === 'text' ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                    color: viewTab === 'text' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  متن پیام (Plain Text)
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('raw')}
                  className="btn btn-glass"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: viewTab === 'raw' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                    borderColor: viewTab === 'raw' ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                    color: viewTab === 'raw' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <Code size={14} /> داده‌های خام SMTP
                </button>
              </div>

              {/* Message Body Content Pane */}
              <div style={{
                flex: 1,
                minHeight: '380px',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)',
                background: viewTab === 'html' ? '#ffffff' : 'rgba(0, 0, 0, 0.3)',
                color: viewTab === 'html' ? '#111827' : 'var(--text-primary)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {viewTab === 'html' ? (
                  selectedEmail.body_html ? (
                    <iframe
                      title="Email Content"
                      srcDoc={`
                        <!DOCTYPE html>
                        <html dir="rtl" lang="fa">
                        <head>
                          <meta charset="utf-8">
                          <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1f2937; line-height: 1.6; }
                            a { color: #0284c7; }
                          </style>
                        </head>
                        <body>
                          ${selectedEmail.body_html}
                        </body>
                        </html>
                      `}
                      sandbox="allow-same-origin"
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '380px',
                        border: 'none',
                        background: '#ffffff'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '24px', whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#1f2937' }}>
                      {selectedEmail.body_text || '(محتوای متنی وجود ندارد)'}
                    </div>
                  )
                ) : viewTab === 'text' ? (
                  <div style={{
                    padding: '20px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.8,
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    overflowY: 'auto',
                    height: '100%',
                    direction: 'auto'
                  }}>
                    {selectedEmail.body_text || selectedEmail.body_html?.replace(/<[^>]+>/g, '') || '(محتوای متنی یافت نشد)'}
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    fontSize: '0.775rem',
                    fontFamily: 'monospace',
                    overflowY: 'auto',
                    height: '100%',
                    color: '#94a3b8',
                    direction: 'ltr'
                  }}>
                    {selectedEmail.raw_message || '(داده‌های خام ثبت نشده است)'}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// Mini Globe Icon helper
function GlobeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
