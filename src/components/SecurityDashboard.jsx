import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, KeyRound, Lock, Unlock, Clock, 
  UserCheck, UserX, Users, RefreshCw, Search, Copy, Check, 
  AlertTriangle, LogOut, Eye, Filter, Sparkles, Terminal,
  CheckCircle2, AlertCircle, X, QrCode
} from 'lucide-react';
import { toPersianDigits } from '../utils/formatPrice.js';

export default function SecurityDashboard({ 
  authToken, 
  onOpenTotpSetup, 
  totpStatus, 
  adminTimeoutMinutes, 
  onSaveTimeout 
}) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetAutoGenerate, setResetAutoGenerate] = useState(true);
  const [resetForceChange, setResetForceChange] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [resetCopied, setResetCopied] = useState(false);

  // Terminate / Block / 2FA action loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/security/dashboard-stats', { headers: authHeaders }),
        fetch('/api/admin/security/users', { headers: authHeaders })
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        throw new Error('خطا در برقراری ارتباط با سرویس امنیت سرور');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData);
      setLogs(statsData.recentLogs || []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'خطای بارگذاری داده‌های امنیت');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(interval);
  }, [authToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // 1. Password Reset Handler
  const handleOpenResetModal = (user) => {
    setResetModalUser(user);
    const generated = 'TT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setResetPasswordValue(generated);
    setResetAutoGenerate(true);
    setResetForceChange(true);
    setResetResult(null);
    setResetCopied(false);
  };

  const handleSubmitResetPassword = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!resetModalUser) return;

    setResetLoading(true);
    try {
      const res = await fetch(`/api/admin/security/users/${resetModalUser.id}/reset-password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          newPassword: resetPasswordValue,
          autoGenerate: resetAutoGenerate,
          forceChangeOnLogin: resetForceChange
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بازنشانی رمز عبور');

      setResetResult({
        password: data.newPassword,
        mustChange: data.mustChangePassword
      });

      // Update local state
      setUsers(prev => prev.map(u => u.id === resetModalUser.id ? { ...u, mustChangePassword: !!data.mustChangePassword } : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  // 2. Toggle Block User
  const handleToggleBlock = async (user) => {
    const actionText = user.blocked ? 'رفع مسدودی' : 'مسدودسازی';
    if (!window.confirm(`آیا از ${actionText} حساب «${user.name || user.email || user.mobile}» اطمینان دارید؟`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/security/users/${user.id}/toggle-block`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `خطا در ${actionText}`);

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, blocked: data.blocked, status: data.blocked ? 'blocked' : 'inactive' } : u));
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Reset 2FA for User
  const handleReset2FA = async (user) => {
    if (!window.confirm(`آیا از حذف و بازنشانی ورود دومرحله‌ای Google Authenticator برای «${user.name || user.email}» اطمینان دارید؟ (کاربر پس از این می‌تواند بدون ۲FA وارد شود)`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/security/users/${user.id}/reset-2fa`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ریست ۲FA');

      alert(data.message || 'احراز هویت دو مرحله‌ای کاربر غیرفعال شد.');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, totpEnabled: false, twoFactorEnabled: false } : u));
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Force Terminate Session
  const handleTerminateSession = async (user) => {
    if (!window.confirm(`آیا از خروج اضطراری و پایان نشست کاربر «${user.name || user.email}» اطمینان دارید؟`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/security/users/${user.id}/terminate-session`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در پایان نشست');

      alert(data.message || 'نشست کاربر با موفقیت پایان یافت.');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'inactive' } : u));
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === 'online' && u.status !== 'online') return false;
    if (statusFilter === '2fa' && !u.totpEnabled) return false;
    if (statusFilter === 'blocked' && !u.blocked) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.mobile && u.mobile.includes(q))
    );
  });

  const formatPersianTime = (isoString) => {
    if (!isoString) return 'نامشخص';
    try {
      const date = new Date(isoString.replace(' ', 'T') + 'Z');
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / 60000);

      if (diffMinutes < 1) return 'چند لحظه پیش';
      if (diffMinutes < 15) return `${toPersianDigits(diffMinutes)} دقیقه پیش (آنلاین)`;
      if (diffMinutes < 60) return `${toPersianDigits(diffMinutes)} دقیقه پیش`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${toPersianDigits(diffDays)} روز پیش`;
      return toPersianDigits(isoString.substring(0, 16));
    } catch {
      return toPersianDigits(isoString);
    }
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'login_success':
        return { label: 'ورود موفق', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'login_fail':
        return { label: 'ورود ناموفق', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case '2fa_verify':
      case '2fa_verify_success':
        return { label: 'تایید ۲FA', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case '2fa_verify_fail':
        return { label: 'خطای ۲FA', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'admin_reset_password':
        return { label: 'ریست رمز توسط ادمین', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'account_blocked':
        return { label: 'مسدودسازی حساب', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'account_unblocked':
        return { label: 'رفع مسدودی', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'session_refresh':
        return { label: 'تمدید نشست', bg: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', border: 'rgba(129, 140, 248, 0.3)' };
      default:
        return { label: type, bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', border: 'var(--border-glass)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Banner */}
      <div className="glass-card" style={{
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 10px 40px rgba(56, 189, 248, 0.08)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #38bdf8, #818cf8, #10b981)'
        }} />

        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <ShieldCheck size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  مرکز امنیت، نشست‌ها و کنترل دسترسی (Security Center)
                </h2>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  مدیریت فعال انقضای نشست بر اساس استاندارد OWASP ASVS، احراز هویت RFC 6238 TOTP و دسترسی کاربران
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-glass"
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی وضعیت'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Bento KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Active Admin Sessions */}
        <div className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>نشست‌های فعال مدیران</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
            {toPersianDigits(stats?.stats?.adminCount || 1)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>حساب فعال</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            مهلت عدم فعالیت: <strong>{toPersianDigits(adminTimeoutMinutes || 15)} دقیقه (OWASP)</strong>
          </div>
        </div>

        {/* Card 2: 2FA Coverage */}
        <div className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>پوشش Google Authenticator</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <KeyRound size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
            {toPersianDigits(stats?.stats?.totpEnabledCount || 0)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>حساب مجهز</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            وضعیت حساب شما: <strong>{totpStatus?.enabled ? 'فعال و ایمن ✓' : 'نیازمند راه‌اندازی'}</strong>
          </div>
        </div>

        {/* Card 3: Active Users 24h */}
        <div className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>کاربران فعال ۲۴ ساعت اخیر</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(129, 140, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8', marginBottom: '4px' }}>
            {toPersianDigits(stats?.stats?.activeUsers24h || 0)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>از {toPersianDigits(stats?.stats?.totalUsers || 0)}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            مبتنی بر ردیابی تعاملی حرکات و لمس صفحه
          </div>
        </div>

        {/* Card 4: Blocked / Flagged */}
        <div className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>حساب‌های مسدود شده</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <UserX size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats?.stats?.blockedCount > 0 ? '#ef4444' : 'var(--text-primary)', marginBottom: '4px' }}>
            {toPersianDigits(stats?.stats?.blockedCount || 0)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>مورد</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            دسترسی به سبد و سفارشات سلب گردیده
          </div>
        </div>

      </div>

      {/* 3. Global Inactivity Timeout & Google Authenticator Direct Controls */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>پیکربندی انقضای خودکار نشست (Inactivity Timeout Controls)</h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(56, 189, 248, 0.08)', padding: '4px 10px', borderRadius: '8px' }}>
            الزام استاندارد امنیتی OWASP ASVS v4.0.3 و PCI-DSS 4.0
          </span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          {/* Timeout Options */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '10px', fontWeight: 600 }}>
              مدت زمان مجاز بی‌حرکتی ماوس یا عدم لمس روی صفحه مدیر:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { mins: 15, label: '۱۵ دقیقه', desc: 'پیش‌فرض OWASP' },
                { mins: 30, label: '۳۰ دقیقه', desc: 'متعادل' },
                { mins: 60, label: '۶۰ دقیقه', desc: 'حداکثر اداری' }
              ].map(opt => {
                const active = adminTimeoutMinutes === opt.mins;
                return (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => onSaveTimeout(opt.mins)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '12px',
                      border: active ? '2px solid #38bdf8' : '1px solid var(--border-glass)',
                      background: active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      alignItems: 'center',
                      minHeight: '48px'
                    }}
                  >
                    <span style={{ fontSize: '0.875rem' }}>{opt.label}</span>
                    <span style={{ fontSize: '0.675rem', opacity: 0.8 }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2FA Status Shortcut */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>وضعیت Google Authenticator مدیر جاری</span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: totpStatus?.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: totpStatus?.enabled ? '#10b981' : '#f59e0b',
                  fontWeight: 700
                }}>
                  {totpStatus?.enabled ? 'فعال ✓' : 'غیرفعال'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                {totpStatus?.enabled 
                  ? `کدهای پشتیبان اضطراری باقیمانده: ${totpStatus?.backupCodesRemaining ?? 8} عدد`
                  : 'جهت جلوگیری از نفوذ در صورت لو رفتن رمز عبور، فعال‌سازی تایید دومرحله‌ای توصیه می‌شود.'}
              </p>
            </div>

            <button
              type="button"
              className={totpStatus?.enabled ? 'btn btn-glass' : 'btn btn-primary'}
              onClick={onOpenTotpSetup}
              style={{
                width: '100%',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.825rem',
                minHeight: '44px'
              }}
            >
              <QrCode size={16} />
              {totpStatus?.enabled ? 'مدیریت و مشاهده کلیدها' : 'راه‌اندازی فوری Google Authenticator'}
            </button>
          </div>

        </div>
      </div>

      {/* 4. User Access, Security & Activity Management Section */}
      <div className="glass-card" style={{ padding: '24px' }}>
        
        {/* Section Header with Search & Filters */}
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={22} color="#818cf8" />
              مدیریت دسترسی کاربران، فعالیت‌ها و ریست رمز عبور
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              مشاهده وضعیت آنلاین/آفلاین، آخرین زمان فعالیت، بازنشانی رمز و مدیریت ورود دومرحله‌ای
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="جستجوی کاربر، ایمیل، موبایل..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '9px 38px 9px 12px',
                  borderRadius: '12px',
                  fontSize: '0.825rem',
                  width: '220px'
                }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '12px', fontSize: '0.825rem' }}
            >
              <option value="">همه نقش‌ها</option>
              <option value="admin">مدیران (Admin)</option>
              <option value="customer">مشتریان (Customer)</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '12px', fontSize: '0.825rem' }}
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="online">آنلاین (Online)</option>
              <option value="2fa">دارای ۲FA فعال</option>
              <option value="blocked">مسدود شده</option>
            </select>
          </div>
        </div>

        {/* Users Table / Mobile Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <div>در حال بارگذاری لیست کاربران و وضعیت نشست‌ها...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            کاربری با مشخصات جستجو شده یافت نشد.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.map(user => {
              const isActionLoading = actionLoadingId === user.id;

              return (
                <div
                  key={user.id}
                  style={{
                    background: user.blocked ? 'rgba(239, 68, 68, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                    border: user.blocked ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* User Profile & Role */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: user.role === 'admin' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: user.role === 'admin' ? '#818cf8' : '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      border: user.role === 'admin' ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      {user.name ? user.name[0] : (user.role === 'admin' ? 'A' : 'U')}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user.name || 'کاربر بدون نام'}</span>
                        
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: user.role === 'admin' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          color: user.role === 'admin' ? '#818cf8' : 'var(--text-secondary)',
                          border: user.role === 'admin' ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid var(--border-glass)',
                          fontWeight: 700
                        }}>
                          {user.role === 'admin' ? 'مدیر سیستم' : 'مشتری'}
                        </span>

                        {user.blocked && (
                          <span style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 700 }}>
                            مسدود
                          </span>
                        )}

                        {user.mustChangePassword && (
                          <span style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 700 }}>
                            الزام تغییر رمز
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>ایمیل: <strong className="font-code" style={{ direction: 'ltr', display: 'inline-block' }}>{user.email || 'ثبت نشده'}</strong></span>
                        <span>موبایل: <strong className="font-code" style={{ direction: 'ltr', display: 'inline-block' }}>{user.mobile || 'ثبت نشده'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Activity & 2FA Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                    
                    {/* Activity Pulse */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>آخرین فعالیت / نشست:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: user.status === 'online' ? '#10b981' : user.status === 'recent' ? '#38bdf8' : '#94a3b8',
                          boxShadow: user.status === 'online' ? '0 0 8px #10b981' : 'none'
                        }} />
                        <span>{formatPersianTime(user.lastActiveAt)}</span>
                      </div>
                    </div>

                    {/* 2FA Status Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>تایید دومرحله‌ای:</span>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: user.totpEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        color: user.totpEnabled ? '#10b981' : 'var(--text-secondary)',
                        border: user.totpEnabled ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-glass)'
                      }}>
                        <KeyRound size={12} />
                        {user.totpEnabled ? 'Google 2FA فعال' : 'غیرفعال'}
                      </div>
                    </div>

                  </div>

                  {/* Actions (Thumb-friendly >= 44px targets) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    
                    {/* Reset Password Button */}
                    <button
                      type="button"
                      className="btn btn-glass"
                      onClick={() => handleOpenResetModal(user)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: '44px'
                      }}
                      title="بازنشانی رمز عبور کاربر"
                    >
                      <KeyRound size={15} color="#38bdf8" />
                      <span>ریست پسورد</span>
                    </button>

                    {/* Reset 2FA (if enabled) */}
                    {user.totpEnabled && (
                      <button
                        type="button"
                        className="btn btn-glass"
                        disabled={isActionLoading}
                        onClick={() => handleReset2FA(user)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          minHeight: '44px',
                          color: '#f59e0b',
                          borderColor: 'rgba(245, 158, 11, 0.3)'
                        }}
                        title="حذف ورود دو مرحله‌ای کاربر (در صورت مفقودی گوشی)"
                      >
                        <Unlock size={14} />
                        <span>حذف ۲FA</span>
                      </button>
                    )}

                    {/* Terminate Session */}
                    <button
                      type="button"
                      className="btn btn-glass"
                      disabled={isActionLoading}
                      onClick={() => handleTerminateSession(user)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: '44px'
                      }}
                      title="خاتمه دادن اجباری به نشست جاری"
                    >
                      <LogOut size={14} />
                      <span>بستن نشست</span>
                    </button>

                    {/* Block / Unblock Toggle */}
                    <button
                      type="button"
                      className="btn btn-glass"
                      disabled={isActionLoading}
                      onClick={() => handleToggleBlock(user)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: '44px',
                        color: user.blocked ? '#10b981' : '#ef4444',
                        borderColor: user.blocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      {user.blocked ? <UserCheck size={15} /> : <UserX size={15} />}
                      <span>{user.blocked ? 'رفع مسدودی' : 'مسدود'}</span>
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 5. Live Security Audit Logs Trail */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={20} color="#38bdf8" />
              لاگ‌های زنده رخدادهای امنیتی (Security Audit Trail)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              ثبت بی‌درنگ تلاش‌های ورود، چالش‌های ۲FA، تغییرات رمز و خاتمه نشست‌ها
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
            آخرین ۲۵ رخداد ثبت‌شده در سرور
          </span>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            هنوز رخداد امنیتی جدیدی ثبت نشده است.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px' }}>شناسه و زمان</th>
                  <th style={{ padding: '10px 12px' }}>نوع رویداد</th>
                  <th style={{ padding: '10px 12px' }}>کاربر / شناسه</th>
                  <th style={{ padding: '10px 12px' }}>آدرس IP</th>
                  <th style={{ padding: '10px 12px' }}>شرح رخداد</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const badge = getEventBadge(log.event_type);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span className="font-code" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatPersianTime(log.created_at)}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span className="font-code" style={{ direction: 'ltr', display: 'inline-block', fontWeight: 600 }}>
                          {log.user_identifier || (log.user_id ? `User #${log.user_id}` : 'سیستم')}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span className="font-code" style={{ direction: 'ltr', display: 'inline-block', color: 'var(--text-secondary)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 6. Modal: Admin Password Reset Wizard */}
      {resetModalUser && (
        <div
          className="modal-backdrop-wrapper animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setResetModalUser(null);
              setResetResult(null);
            }
          }}
        >
          <div
            className="glass-card animate-scale-up"
            style={{
              width: '100%',
              maxWidth: '460px',
              borderRadius: '24px',
              padding: '28px 24px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              direction: 'rtl'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setResetModalUser(null);
                setResetResult(null);
              }}
              style={{
                position: 'absolute',
                top: '18px',
                left: '18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <KeyRound size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                بازنشانی رمز عبور کاربر
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                حساب: <strong style={{ color: 'var(--text-primary)' }}>{resetModalUser.name || resetModalUser.email || resetModalUser.mobile}</strong>
              </p>
            </div>

            {resetResult ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '16px',
                  borderRadius: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem', marginBottom: '8px' }}>
                    رمز عبور جدید با موفقیت اعمال گردید ✓
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    رمز جدید را کپی کرده و به کاربر ارائه دهید:
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)'
                  }}>
                    <span className="font-code" style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '2px', color: '#38bdf8', direction: 'ltr' }}>
                      {resetResult.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetResult.password);
                        setResetCopied(true);
                        setTimeout(() => setResetCopied(false), 2500);
                      }}
                      className="btn btn-glass"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Copy size={13} />
                      {resetCopied ? 'کپی شد' : 'کپی رمز'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setResetModalUser(null);
                    setResetResult(null);
                  }}
                  style={{ width: '100%', padding: '12px', minHeight: '44px' }}
                >
                  بستن پنجره
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>کلمه عبور جدید:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = 'TT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                        setResetPasswordValue(generated);
                        setResetAutoGenerate(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sparkles size={12} />
                      تولید رمز تصادفی امن
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={resetPasswordValue}
                    onChange={e => {
                      setResetPasswordValue(e.target.value);
                      setResetAutoGenerate(false);
                    }}
                    style={{
                      direction: 'ltr',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      letterSpacing: '1px',
                      padding: '12px',
                      minHeight: '48px'
                    }}
                  />
                </div>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <input
                    type="checkbox"
                    checked={resetForceChange}
                    onChange={e => setResetForceChange(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>الزام کاربر به تغییر رمز عبور بلافاصله پس از ورود (Force Change Password)</span>
                </label>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetLoading || !resetPasswordValue}
                  style={{
                    padding: '13px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {resetLoading ? 'در حال اعمال...' : 'تایید و ذخیره رمز جدید'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
