import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, 
  KeyRound, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, notice = null }) {
  // Modes: 'login' | 'otp' | 'recovery' | 'register'
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Standard Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // OTP Login & 2FA State
  const [otpMobile, setOtpMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Password Recovery State
  const [recoveryMethod, setRecoveryMethod] = useState('mobile'); // 'mobile' | 'email'
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: request, 2: verify & new password
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // Countdown timer for OTP
  useEffect(() => {
    let timer = null;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  if (!isOpen) return null;

  const resetAll = () => {
    setLoginIdentifier('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setOtpMobile('');
    setOtpCode('');
    setOtpSent(false);
    setOtpCountdown(0);
    setRecoveryIdentifier('');
    setRecoveryStep(1);
    setRecoveryCode('');
    setRecoveryToken('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  // 1. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login: loginIdentifier, 
          email: loginIdentifier, 
          mobile: loginIdentifier,
          password: loginPassword 
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ورود به حساب کاربری');
      }

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      resetAll();
      onLogin(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Register Form
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          mobile: regPhone
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ثبت‌نام');
      }

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      resetAll();
      onLogin(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Send OTP for Mobile Login
  const handleSendOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!otpMobile || otpMobile.length < 10) {
      setError('شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) را وارد کنید.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: otpMobile, purpose: 'login' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال کد اعتبارسنجی');

      setOtpSent(true);
      setOtpCountdown(60);
      setSuccessMsg(data.message || 'کد اعتبارسنجی ارسال شد.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP for Mobile Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError('کد ۵ رقمی اعتبارسنجی را وارد کنید.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: otpMobile, code: otpCode, purpose: 'login' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'کد اعتبارسنجی نادرست است');

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      resetAll();
      onLogin(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Password Recovery - Request Code
  const handleRecoveryRequest = async (e) => {
    e.preventDefault();
    if (!recoveryIdentifier) {
      setError('شماره موبایل یا ایمیل را وارد کنید.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/password/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: recoveryIdentifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت درخواست بازیابی');

      setRecoveryStep(2);
      setSuccessMsg(data.message || 'کد بازیابی ارسال شد.');
      setOtpCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Password Recovery - Confirm and Reset
  const handleRecoveryConfirm = async (e) => {
    e.preventDefault();
    if (!recoveryCode) {
      setError('کد اعتبارسنجی دریافت شده را وارد کنید.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('تکرار رمز عبور با رمز جدید همخوانی ندارد.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/password/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: recoveryIdentifier,
          code: recoveryCode,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بازنشانی رمز عبور');

      setSuccessMsg('رمز عبور با موفقیت تغییر کرد! اکنون می‌توانید وارد شوید.');
      setTimeout(() => {
        switchTab('login');
        setLoginIdentifier(recoveryIdentifier);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  };

  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputIconStyle = {
    position: 'absolute',
    right: '12px',
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          resetAll();
          onClose();
        }
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '28px 24px',
          borderRadius: '24px',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            resetAll();
            onClose();
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
            color: 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
          title="بستن"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'hsla(var(--accent-cyan), 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'hsl(var(--accent-cyan))',
            }}
          >
            {activeTab === 'login' && <LogIn size={26} />}
            {activeTab === 'otp' && <ShieldCheck size={26} />}
            {activeTab === 'recovery' && <KeyRound size={26} />}
            {activeTab === 'register' && <UserPlus size={26} />}
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            {activeTab === 'login' && 'ورود به حساب کاربری'}
            {activeTab === 'otp' && 'ورود سریع با پیامک (OTP)'}
            {activeTab === 'recovery' && 'بازیابی رمز عبور'}
            {activeTab === 'register' && 'ایجاد حساب کاربری'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
            {activeTab === 'login' && 'ایمیل یا شماره همراه خود را وارد کنید'}
            {activeTab === 'otp' && 'ورود امن بدون نیاز به حفظ رمز عبور'}
            {activeTab === 'recovery' && 'تعیین مجدد رمز عبور از طریق پیامک یا ایمیل'}
            {activeTab === 'register' && 'ثبت‌نام سریع در فروشگاه تخصصی تک‌تینک'}
          </p>
        </div>

        {/* Contextual Notice */}
        {notice && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              color: '#0284c7',
              fontSize: '0.825rem',
              lineHeight: '1.5',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            {notice}
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '20px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => switchTab('login')}
            style={{
              flex: 1,
              padding: '9px 4px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'login' ? 700 : 500,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            رمز عبور
          </button>
          <button
            type="button"
            onClick={() => switchTab('otp')}
            style={{
              flex: 1,
              padding: '9px 4px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'otp' ? '#ffffff' : 'transparent',
              color: activeTab === 'otp' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'otp' ? 700 : 500,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'otp' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            پیامک OTP
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            style={{
              flex: 1,
              padding: '9px 4px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'register' ? '#ffffff' : 'transparent',
              color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'register' ? 700 : 500,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            ثبت‌نام
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'hsla(var(--accent-red), 0.12)',
              border: '1px solid hsla(var(--accent-red), 0.3)',
              color: 'hsl(var(--accent-red))',
              fontSize: '0.825rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            className="animate-fade-in"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '0.825rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: PASSWORD LOGIN */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'login' && (
          <form onSubmit={handlePasswordLogin} className="animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>شماره موبایل یا ایمیل</label>
                <div style={inputWrapperStyle}>
                  <Mail size={16} style={inputIconStyle} />
                  <input
                    type="text"
                    placeholder="۰۹xxxxxxxxx یا ایمیل"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>
              </div>

              <div style={inputGroupStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>رمز عبور</label>
                  <button
                    type="button"
                    onClick={() => {
                      switchTab('recovery');
                      setRecoveryIdentifier(loginIdentifier);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#0284c7',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <div style={inputWrapperStyle}>
                  <Lock size={16} style={inputIconStyle} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="رمز عبور حساب"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ paddingRight: '38px', paddingLeft: '38px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '12px',
                  fontSize: '0.95rem',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'در حال ورود...' : 'ورود به حساب'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => switchTab('otp')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ورود بدون رمز با پیامک یکبارمصرف (OTP)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: MOBILE OTP LOGIN */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'otp' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>شماره موبایل جهت دریافت پیامک</label>
              <div style={inputWrapperStyle}>
                <Phone size={16} style={inputIconStyle} />
                <input
                  type="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  required
                  disabled={otpSent && otpCountdown > 0}
                  value={otpMobile}
                  onChange={(e) => setOtpMobile(e.target.value)}
                  style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={handleSendOtp}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'در حال ارسال پیامک...' : 'ارسال کد ورود یکبارمصرف'}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={inputGroupStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>کد ۵ رقمی دریافتی</label>
                    <span style={{ fontSize: '0.78rem', color: otpCountdown > 0 ? '#0284c7' : '#ef4444' }}>
                      {otpCountdown > 0 ? `${otpCountdown} ثانیه تا انقضا` : 'کد منقضی شد'}
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="— — — — —"
                    maxLength={5}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      letterSpacing: '8px',
                      direction: 'ltr',
                      padding: '10px'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.95rem',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'در حال اعتبارسنجی...' : 'تأیید کد و ورود به سایت'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    تغییر شماره موبایل
                  </button>

                  <button
                    type="button"
                    disabled={otpCountdown > 0 || loading}
                    onClick={handleSendOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: otpCountdown > 0 ? 'var(--text-secondary)' : '#0284c7',
                      fontSize: '0.78rem',
                      cursor: otpCountdown > 0 ? 'default' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    ارسال مجدد کد
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: PASSWORD RECOVERY (SMS / EMAIL) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'recovery' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recoveryStep === 1 ? (
              <form onSubmit={handleRecoveryRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>شماره موبایل یا ایمیل حساب کاربری</label>
                  <div style={inputWrapperStyle}>
                    <KeyRound size={16} style={inputIconStyle} />
                    <input
                      type="text"
                      placeholder="۰۹xxxxxxxxx یا ایمیل شما"
                      required
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    کد اعتبارسنجی به شماره موبایل پیامک شده یا به ایمیل شما ارسال خواهد شد.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.95rem',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'در حال ارسال کد...' : 'ارسال کد بازیابی رمز'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => switchTab('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    بازگشت به صفحه ورود
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRecoveryConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>کد تأیید دریافتی</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="کد پیامک یا ایمیل شده"
                    required
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', direction: 'ltr' }}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>رمز عبور جدید (حداقل ۸ کاراکتر)</label>
                  <input
                    type="password"
                    placeholder="رمز عبور جدید"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>تکرار رمز عبور جدید</label>
                  <input
                    type="password"
                    placeholder="تکرار رمز عبور جدید"
                    required
                    minLength={8}
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.95rem',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'در حال ذخیره رمز...' : 'ذخیره رمز جدید و ورود'}
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    ارسال مجدد یا تغییر شماره/ایمیل
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: REGISTER */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>نام و نام خانوادگی</label>
                <div style={inputWrapperStyle}>
                  <User size={16} style={inputIconStyle} />
                  <input
                    type="text"
                    placeholder="نام کامل خود را وارد کنید"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ paddingRight: '38px' }}
                  />
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>شماره موبایل</label>
                <div style={inputWrapperStyle}>
                  <Phone size={16} style={inputIconStyle} />
                  <input
                    type="tel"
                    placeholder="۰۹xxxxxxxxx"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>ایمیل (اختیاری جهت بازیابی)</label>
                <div style={inputWrapperStyle}>
                  <Mail size={16} style={inputIconStyle} />
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>رمز عبور (حداقل ۶ کاراکتر)</label>
                <div style={inputWrapperStyle}>
                  <Lock size={16} style={inputIconStyle} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="حداقل ۶ کاراکتر"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ paddingRight: '38px', paddingLeft: '38px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '12px',
                  fontSize: '0.95rem',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'در حال ثبت‌نام...' : 'ایجاد حساب کاربری'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
