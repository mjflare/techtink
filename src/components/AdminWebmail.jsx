import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Inbox, CheckCircle2, Copy, Check, RefreshCw, Trash2,
  ShieldCheck, AlertCircle, ExternalLink, Search, Key, ChevronDown,
  ChevronUp, Server, Sparkles, Clock, Eye, Code, Terminal, Send,
  CornerUpLeft, PenTool, CheckSquare, Square, X, AlertTriangle,
  ArrowRight, Shield, Layers, HelpCircle
} from 'lucide-react';

export default function AdminWebmail({ authHeaders, onUnreadCountChange }) {
  // Folder state: 'inbox' | 'sent'
  const [currentFolder, setCurrentFolder] = useState('inbox');
  
  // Emails lists
  const [inboxEmails, setInboxEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Selected email
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);

  // Multi-select for bulk delete
  const [selectedIds, setSelectedIds] = useState([]);

  // Server stats & UI state
  const [serverStatus, setServerStatus] = useState(null);
  const [viewTab, setViewTab] = useState('html'); // 'html' | 'text' | 'raw'
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Compose / Send Email Modal State
  const [composeOpen, setComposeOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showAdvancedRelay, setShowAdvancedRelay] = useState(false);
  const [composeForm, setComposeForm] = useState({
    to: '',
    from: 'info@techtink.ir',
    subject: '',
    body: '',
    isHtml: false,
    relayHost: '',
    relayPort: '587',
    relayUser: '',
    relayPass: '',
    relaySecure: false
  });

  // Polling ref
  const pollTimerRef = useRef(null);

  // Fetch status
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

  // Fetch emails based on current folder
  const fetchEmailList = async (overrideFolder = null, isBackground = false) => {
    const folder = typeof overrideFolder === 'string' ? overrideFolder : currentFolder;
    const isBg = typeof overrideFolder === 'boolean' ? overrideFolder : isBackground;

    if (!isBg) setLoading(true);
    else setRefreshing(true);

    try {
      if (folder === 'inbox') {
        const params = new URLSearchParams({
          limit: '50',
          search: search.trim(),
          unreadOnly: filterUnreadOnly ? 'true' : 'false'
        });
        const res = await fetch(`/api/admin/emails?${params.toString()}`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.items) ? data.items : [];
          setInboxEmails(items);

          if (items.length > 0) {
            setSelectedEmailId(prev => (prev && items.some(x => x.id === prev) ? prev : items[0].id));
          } else {
            setSelectedEmailId(null);
            setSelectedEmail(null);
          }
        }
      } else {
        const params = new URLSearchParams({
          limit: '50',
          search: search.trim()
        });
        const res = await fetch(`/api/admin/emails/sent?${params.toString()}`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.items) ? data.items : [];
          setSentEmails(items);

          if (items.length > 0) {
            setSelectedEmailId(prev => (prev && items.some(x => x.id === prev) ? prev : items[0].id));
          } else {
            setSelectedEmailId(null);
            setSelectedEmail(null);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch emails', e);
    } finally {
      if (!isBg) setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch full email detail
  const fetchEmailDetail = async (id) => {
    if (!id) {
      setSelectedEmail(null);
      return;
    }
    setEmailDetailLoading(true);
    try {
      const endpoint = currentFolder === 'inbox' 
        ? `/api/admin/emails/${id}` 
        : `/api/admin/emails/sent/${id}`;

      const res = await fetch(endpoint, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        // Server either returns { email: ... } or direct object
        setSelectedEmail(data.email || data || null);
        if (currentFolder === 'inbox') {
          fetchStatus();
        }
      } else {
        setSelectedEmail(null);
      }
    } catch (e) {
      console.error('Failed to load email details', e);
      setSelectedEmail(null);
    } finally {
      setEmailDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    setSelectedIds([]);
    fetchEmailList();
  }, [currentFolder, search, filterUnreadOnly]);

  useEffect(() => {
    if (selectedEmailId) {
      fetchEmailDetail(selectedEmailId);
    } else {
      setSelectedEmail(null);
    }
  }, [selectedEmailId, currentFolder]);

  // Real-time polling every 5s for inbox
  useEffect(() => {
    if (!autoRefresh || currentFolder !== 'inbox') {
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
  }, [autoRefresh, currentFolder, search, filterUnreadOnly]);

  // Copy code helper
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Delete single email
  const handleDeleteEmail = async (id, folder = currentFolder, e = null) => {
    if (e) e.stopPropagation();
    if (!window.confirm('آیا از حذف این ایمیل اطمینان دارید؟')) return;

    try {
      const endpoint = folder === 'inbox' 
        ? `/api/admin/emails/${id}` 
        : `/api/admin/emails/sent/${id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: 'ایمیل با موفقیت حذف شد.' });
        if (selectedEmailId === id) {
          setSelectedEmailId(null);
          setSelectedEmail(null);
        }
        setSelectedIds(prev => prev.filter(x => x !== id));
        fetchEmailList();
        fetchStatus();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error || 'خطا در حذف ایمیل' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`آیا از حذف ${selectedIds.length} پیام انتخاب شده اطمینان دارید؟`)) return;

    try {
      const res = await fetch('/api/admin/emails/bulk-delete', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ids: selectedIds,
          folder: currentFolder
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message || `${selectedIds.length} ایمیل با موفقیت حذف شدند.` });
        if (selectedIds.includes(selectedEmailId)) {
          setSelectedEmailId(null);
          setSelectedEmail(null);
        }
        setSelectedIds([]);
        fetchEmailList();
        fetchStatus();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'خطا در حذف گروهی' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    }
  };

  // Clear entire folder
  const handleClearFolder = async () => {
    const folderTitle = currentFolder === 'inbox' ? 'صندوق ورودی' : 'ایمیل‌های ارسالی';
    if (!window.confirm(`هشدار: آیا از پاکسازی کامل تمامی ایمیل‌های ${folderTitle} اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`)) return;

    try {
      const endpoint = currentFolder === 'inbox' 
        ? '/api/admin/emails/clear/inbox' 
        : '/api/admin/emails/clear/sent';

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: authHeaders
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message || `تمام ایمیل‌های ${folderTitle} پاک شدند.` });
        setSelectedEmailId(null);
        setSelectedEmail(null);
        setSelectedIds([]);
        fetchEmailList();
        fetchStatus();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'خطا در پاکسازی' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    }
  };

  // Send outgoing email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!composeForm.to || !composeForm.to.includes('@')) {
      alert('لطفاً آدرس ایمیل گیرنده معتبر وارد نمایید.');
      return;
    }

    setSendingEmail(true);
    setActionMessage(null);

    try {
      const payload = {
        to: composeForm.to.trim(),
        from: composeForm.from.trim() || 'info@techtink.ir',
        subject: composeForm.subject.trim(),
        bodyText: composeForm.body,
        bodyHtml: composeForm.isHtml ? composeForm.body : undefined,
        relayConfig: showAdvancedRelay && composeForm.relayHost ? {
          host: composeForm.relayHost.trim(),
          port: parseInt(composeForm.relayPort, 10) || 587,
          user: composeForm.relayUser?.trim(),
          pass: composeForm.relayPass?.trim(),
          secure: composeForm.relaySecure
        } : null
      };

      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: `ایمیل با موفقیت به ${composeForm.to} ارسال شد! ✓` });
        setComposeOpen(false);
        // Reset form
        setComposeForm({
          to: '',
          from: 'info@techtink.ir',
          subject: '',
          body: '',
          isHtml: false,
          relayHost: '',
          relayPort: '587',
          relayUser: '',
          relayPass: '',
          relaySecure: false
        });
        // Switch to Sent folder to view sent message
        setCurrentFolder('sent');
        setSelectedEmailId(data.emailId || null);
        await fetchEmailList('sent');
        fetchStatus();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'خطا در ارسال ایمیل' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'خطا در برقراری ارتباط با سرور: ' + err.message });
    } finally {
      setSendingEmail(false);
    }
  };

  // Trigger reply to selected email
  const handleReplyToEmail = () => {
    if (!selectedEmail) return;
    const recipient = selectedEmail.from_address || '';
    const subject = selectedEmail.subject ? `پاسخ: ${selectedEmail.subject.replace(/^پاسخ:\s*/, '')}` : 'پاسخ به پیام شما';
    const quote = `\n\n\n--------------------\nدر تاریخ ${formatDate(selectedEmail.created_at)} کاربر <${recipient}> نوشت:\n${selectedEmail.body_text || ''}`;

    setComposeForm(prev => ({
      ...prev,
      to: recipient,
      subject,
      body: quote
    }));
    setComposeOpen(true);
  };

  // Multi-select toggle
  const toggleSelectId = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const currentList = currentFolder === 'inbox' ? inboxEmails : sentEmails;

  const toggleSelectAll = () => {
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map(e => e.id));
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

  // Find active verification code
  const activeCode = currentFolder === 'inbox' 
    ? (selectedEmail?.verification_code || serverStatus?.lastEmail?.verificationCode)
    : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Top Bar: Server Status, Compose Button & Quick Actions */}
      <div className="glass-card" style={{ padding: '22px 26px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
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
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                  صندوق ایمیل و مکاتبات سازمانی <span className="gradient-text">info@techtink.ir</span>
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  صندوق رسمی دریافت و ارسال پیام‌ها و استعلامات سازمانی دامنه techtink.ir
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* New Compose Email Button */}
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="btn btn-primary"
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px hsla(var(--accent-cyan), 0.35)'
              }}
            >
              <Send size={16} />
              <span>ارسال ایمیل جدید</span>
            </button>

            {/* Server Port Status Pill */}
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

            {/* Manual refresh */}
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
          </div>
        </div>

        {/* Action toast */}
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

      {/* 2. Hero eNamad Verification Callout (Only in Inbox if Code Exists) */}
      {currentFolder === 'inbox' && activeCode && (
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
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-glass)', background: '#f8fafc' }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              {/* Box 1: DNS Records */}
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'hsl(var(--accent-cyan))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GlobeIcon size={16} /> ۱. رکوردهای DNS در پنل کلودفلر (Cloudflare):
                </h4>
                <ul style={{ margin: 0, paddingRight: '20px', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <li>
                    <strong>رکورد MX:</strong> Type: <code style={{ color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>MX</code> | Name: <code style={{ color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>@</code> | Mail Server: <code style={{ color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>mail.techtink.ir</code> | Priority: <code style={{ color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>10</code>
                  </li>
                  <li>
                    <strong>رکورد A ساب‌دامین mail:</strong> Type: <code style={{ color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>A</code> | Name: <code style={{ color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>mail</code> | IPv4: <code style={{ color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>62.220.120.168</code> | <strong>Proxy status: حتماً DNS Only (ابر خاکستری)</strong>
                  </li>
                  <li style={{ color: '#d97706', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ ترافیک پورت ۲۵ نباید از پروکسی نارنجی کلودفلر عبور کند، حتماً رکورد mail خاکستری (DNS Only) باشد.
                  </li>
                </ul>
              </div>

              {/* Box 2: Server Firewall */}
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'hsl(var(--accent-purple))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={16} /> ۲. باز کردن پورت ۲۵ روی سرور اوبونتو (UFW):
                </h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  جهت دریافت اتصالات ورودی اینماد روی پورت ۲۵، دستور زیر را در ترمینال سرور اجرا فرمایید:
                </p>
                <div style={{
                  background: '#0f172a',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#38bdf8'
                }}>
                  <code>sudo ufw allow 25/tcp</code>
                  <button
                    onClick={() => navigator.clipboard.writeText('sudo ufw allow 25/tcp')}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
                    title="کپی دستور"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  💡 سرور تک‌تینک علاوه بر دریافت، ایمیل‌های ارسالی را نیز مستقیماً از طریق MX مقصد یا Relay ارسال می‌کند.
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 4. Folder Tabs (Inbox vs Sent) and Bulk Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Folder Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <button
            type="button"
            onClick={() => { setCurrentFolder('inbox'); setSelectedEmailId(null); setSelectedEmail(null); setSelectedIds([]); }}
            className="btn"
            style={{
              padding: '8px 18px',
              borderRadius: '9px',
              fontSize: '0.85rem',
              fontWeight: currentFolder === 'inbox' ? 800 : 500,
              background: currentFolder === 'inbox' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'transparent',
              color: currentFolder === 'inbox' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Inbox size={16} />
            <span>صندوق دریافتی (Inbox)</span>
            {serverStatus?.unreadEmails > 0 && (
              <span style={{
                background: currentFolder === 'inbox' ? 'rgba(255,255,255,0.25)' : 'hsl(var(--accent-cyan))',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: 800
              }}>
                {serverStatus.unreadEmails}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setCurrentFolder('sent'); setSelectedEmailId(null); setSelectedEmail(null); setSelectedIds([]); }}
            className="btn"
            style={{
              padding: '8px 18px',
              borderRadius: '9px',
              fontSize: '0.85rem',
              fontWeight: currentFolder === 'sent' ? 800 : 500,
              background: currentFolder === 'sent' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'transparent',
              color: currentFolder === 'sent' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Send size={16} />
            <span>ایمیل‌های ارسالی (Sent)</span>
            {serverStatus?.totalSent > 0 && (
              <span style={{
                background: currentFolder === 'sent' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: currentFolder === 'sent' ? '#ffffff' : '#475569',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                {serverStatus.totalSent}
              </span>
            )}
          </button>
        </div>

        {/* Bulk Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="btn btn-glass"
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.825rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.4)' }}
            >
              <Trash2 size={15} />
              <span>حذف {selectedIds.length} مورد انتخابی</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearFolder}
            className="btn btn-glass"
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.825rem', color: 'var(--text-muted)' }}
            title="پاکسازی تمامی ایمیل‌های این پوشه"
          >
            <Trash2 size={14} />
            <span>پاکسازی کامل پوشه</span>
          </button>
        </div>
      </div>

      {/* 5. Split-View Webmail Interface (List on Right, Content on Left in RTL) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 390px) 1fr', gap: '20px', minHeight: '620px' }}>
        
        {/* Right Pane: Email List */}
        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={currentFolder === 'inbox' ? 'جستجو در ورودی یا کد...' : 'جستجو در گیرنده یا موضوع...'}
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

            {currentFolder === 'inbox' && (
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
            )}
          </div>

          {/* List Header with Select All */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={toggleSelectAll}>
              {currentList.length > 0 && selectedIds.length === currentList.length ? (
                <CheckSquare size={14} color="hsl(var(--accent-cyan))" />
              ) : (
                <Square size={14} />
              )}
              <span>انتخاب همه ({currentList.length})</span>
            </div>

            <span>{currentFolder === 'inbox' ? 'صندوق ورودی' : 'ارسالی‌ها'}</span>
          </div>

          {/* Email List Items */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.85rem' }}>در حال بارگذاری ایمیل‌ها...</p>
              </div>
            ) : currentList.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {currentFolder === 'inbox' ? (
                  <>
                    <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 6px' }}>صندوق ورودی خالی است</p>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
                      پیام‌های جدید ارسال‌شده به info@techtink.ir به صورت خودکار در این بخش نمایش داده می‌شوند.
                    </p>
                  </>
                ) : (
                  <>
                    <Send size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 6px' }}>هنوز ایمیلی ارسال نشده است</p>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
                      روی دکمه «ارسال ایمیل جدید» کلیک کنید تا اولین پیام خود را ارسال نمایید.
                    </p>
                    <button
                      type="button"
                      onClick={() => setComposeOpen(true)}
                      className="btn btn-primary"
                      style={{ marginTop: '16px', fontSize: '0.8rem', padding: '6px 14px' }}
                    >
                      ارسال اولین ایمیل
                    </button>
                  </>
                )}
              </div>
            ) : (
              currentList.map(item => {
                const isSelected = selectedEmailId === item.id;
                const isChecked = selectedIds.includes(item.id);
                const isUnread = currentFolder === 'inbox' && item.is_read === 0;

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
                    {/* Select Checkbox & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div onClick={(e) => toggleSelectId(item.id, e)} style={{ cursor: 'pointer' }}>
                          {isChecked ? (
                            <CheckSquare size={15} color="hsl(var(--accent-cyan))" />
                          ) : (
                            <Square size={15} color="var(--text-muted)" />
                          )}
                        </div>

                        <span style={{
                          fontSize: '0.825rem',
                          fontWeight: isUnread ? 800 : 600,
                          color: isSelected ? '#ffffff' : isUnread ? 'hsl(var(--accent-cyan))' : 'var(--text-primary)',
                          maxWidth: '180px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {currentFolder === 'inbox' 
                            ? (item.from_address || 'فرستنده ناشناس')
                            : `به: ${item.to_address || 'گیرنده'}`
                          }
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {formatDate(item.created_at)}
                        </span>

                        {/* Inline Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEmail(item.id, currentFolder, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="حذف ایمیل"
                        >
                          <Trash2 size={13} onMouseEnter={(e) => e.target.style.color = '#f43f5e'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'} />
                        </button>
                      </div>
                    </div>

                    {/* Subject line */}
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

                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Verification Code Badge (Inbox) */}
                      {currentFolder === 'inbox' && item.verification_code && (
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
                      )}

                      {/* Delivery Status Badge (Sent) */}
                      {currentFolder === 'sent' && (
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '5px',
                          background: item.status === 'sent' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: item.status === 'sent' ? '#10b981' : '#f43f5e',
                          fontWeight: 700
                        }}>
                          {item.status === 'sent' ? 'ارسال شد ✓' : 'ناموفق'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Left Pane: Email Detail & Body Reader */}
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
                یک پیام را از لیست سمت راست انتخاب کنید تا جزئیات کامل و امکان پاسخ یا حذف آن فعال گردد.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Header Bar */}
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedEmail.subject || '(بدون عنوان)'}
                    </h2>
                    {currentFolder === 'sent' && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: selectedEmail.status === 'sent' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                        color: selectedEmail.status === 'sent' ? '#10b981' : '#f43f5e',
                        fontWeight: 700
                      }}>
                        {selectedEmail.status === 'sent' ? 'تحویل موفق به سرور مقصد' : `خطا: ${selectedEmail.error_message || 'ناموفق'}`}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Reply button (for received emails) */}
                    {currentFolder === 'inbox' && (
                      <button
                        type="button"
                        onClick={handleReplyToEmail}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CornerUpLeft size={14} />
                        <span>پاسخ</span>
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEmail(selectedEmail.id, currentFolder, e)}
                      className="btn btn-glass"
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#f43f5e' }}
                      title="حذف این ایمیل"
                    >
                      <Trash2 size={14} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>

                {/* Sender/Recipient Metadata */}
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
                      {selectedEmail.to_address}
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

              {/* Dedicated Verification Code Highlight Box (if present) */}
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
                {selectedEmail.raw_message && (
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
                )}
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

      {/* 6. Compose / Send Email Modal */}
      {composeOpen && (
        <div className="modal-backdrop-wrapper" onClick={() => setComposeOpen(false)}>
          <div
            className="glass-panel modal-card"
            style={{ maxWidth: '680px', width: '92%', padding: '28px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>ارسال ایمیل سازمانی</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ارسال مستقیم از سرور تک‌تینک به مقصد مشتریان، اینماد یا سایر سرویس‌ها
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="btn btn-glass"
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* From Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>فرستنده (From):</label>
                <input
                  type="text"
                  value={composeForm.from}
                  onChange={e => setComposeForm({ ...composeForm, from: e.target.value })}
                  placeholder="info@techtink.ir"
                  required
                  style={{ direction: 'ltr', fontSize: '0.875rem' }}
                />
              </div>

              {/* To Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>گیرنده (To):</label>
                <input
                  type="email"
                  value={composeForm.to}
                  onChange={e => setComposeForm({ ...composeForm, to: e.target.value })}
                  placeholder="example@gmail.com یا noreply@enamad.ir"
                  required
                  style={{ direction: 'ltr', fontSize: '0.875rem' }}
                />
              </div>

              {/* Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>موضوع (Subject):</label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="عنوان و موضوع ایمیل..."
                  required
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              {/* Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>متن پیام:</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={composeForm.isHtml}
                      onChange={e => setComposeForm({ ...composeForm, isHtml: e.target.checked })}
                    />
                    <span>ارسال به صورت قالب HTML</span>
                  </label>
                </div>
                <textarea
                  rows={8}
                  value={composeForm.body}
                  onChange={e => setComposeForm({ ...composeForm, body: e.target.value })}
                  placeholder="متن ایمیل خود را اینجا بنویسید..."
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                    fontFamily: composeForm.isHtml ? 'monospace' : 'inherit'
                  }}
                />
              </div>

              {/* Advanced Relay Settings Accordion */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAdvancedRelay(!showAdvancedRelay)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: 0
                  }}
                >
                  <Server size={13} />
                  <span>تنظیمات سرور واسط (SMTP Relay اختیاری - جیمیل، لیارا، Brevo و...)</span>
                  {showAdvancedRelay ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showAdvancedRelay && (
                  <div style={{
                    marginTop: '10px',
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-glass)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                    fontSize: '0.8rem'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>Host:</label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com"
                        value={composeForm.relayHost}
                        onChange={e => setComposeForm({ ...composeForm, relayHost: e.target.value })}
                        style={{ width: '100%', fontSize: '0.775rem', direction: 'ltr' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>Port:</label>
                      <input
                        type="number"
                        placeholder="587"
                        value={composeForm.relayPort}
                        onChange={e => setComposeForm({ ...composeForm, relayPort: e.target.value })}
                        style={{ width: '100%', fontSize: '0.775rem', direction: 'ltr' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>Username:</label>
                      <input
                        type="text"
                        placeholder="your-email@gmail.com"
                        value={composeForm.relayUser}
                        onChange={e => setComposeForm({ ...composeForm, relayUser: e.target.value })}
                        style={{ width: '100%', fontSize: '0.775rem', direction: 'ltr' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>Password / App Pass:</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={composeForm.relayPass}
                        onChange={e => setComposeForm({ ...composeForm, relayPass: e.target.value })}
                        style={{ width: '100%', fontSize: '0.775rem', direction: 'ltr' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="btn btn-glass"
                  style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>در حال ارسال پیام...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>ارسال ایمیل</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
