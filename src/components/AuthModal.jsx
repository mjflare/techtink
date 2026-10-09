import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, notice = null }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const resetForms = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setError('');
    setShowPassword(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setShowPassword(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginEmail, email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'خطا در ورود به حساب کاربری');
      }

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      resetForms();
      onLogin(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        throw new Error(data.error || data.message || 'خطا در ثبت‌نام');
      }

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      resetForms();
      onLogin(data.user);
      onClose();
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
    <div className="modal-backdrop-wrapper" onClick={onClose}>
      {/* Modal */}
      <div
        className="glass-panel modal-card"
        style={{
          maxWidth: '460px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-glass)',
          }}
        >
          <h2 className="gradient-text" style={{ fontSize: '1.4rem', margin: 0 }}>
            حساب کاربری
          </h2>
          <button
            className="btn btn-glass"
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Auth Notice banner if redirected from checkout */}
        {notice && (
          <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: 'hsla(var(--accent-cyan), 0.1)', border: '1px solid hsla(var(--accent-cyan), 0.3)', borderRadius: '10px', fontSize: '0.875rem', color: 'hsl(var(--accent-cyan))', lineHeight: '1.6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogIn size={18} style={{ flexShrink: 0 }} />
            <span>{notice}</span>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex"
          style={{
            padding: '16px 24px 0',
            gap: '8px',
          }}
        >
          <button
            onClick={() => switchTab('login')}
            className="flex"
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
              background:
                activeTab === 'login'
                  ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))'
                  : 'var(--btn-glass-bg, rgba(255, 255, 255, 0.05))',
              color: activeTab === 'login' ? 'white' : 'var(--text-secondary)',
              boxShadow:
                activeTab === 'login' ? '0 4px 15px rgba(0, 191, 255, 0.3)' : 'none',
            }}
          >
            <LogIn size={16} />
            ورود
          </button>
          <button
            onClick={() => switchTab('register')}
            className="flex"
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)',
              background:
                activeTab === 'register'
                  ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))'
                  : 'var(--btn-glass-bg, rgba(255, 255, 255, 0.05))',
              color: activeTab === 'register' ? 'white' : 'var(--text-secondary)',
              boxShadow:
                activeTab === 'register' ? '0 4px 15px rgba(0, 191, 255, 0.3)' : 'none',
            }}
          >
            <UserPlus size={16} />
            ثبت‌نام
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'hsla(var(--accent-red), 0.1)',
              border: '1px solid hsla(var(--accent-red), 0.3)',
              color: 'hsl(var(--accent-red))',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Form Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="animate-fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>ایمیل</label>
                  <div style={inputWrapperStyle}>
                    <Mail size={16} style={inputIconStyle} />
                    <input
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>رمز عبور</label>
                  <div style={{ ...inputWrapperStyle }}>
                    <Lock size={16} style={inputIconStyle} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="رمز عبور خود را وارد کنید"
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
              </div>

              {/* Demo credentials hint */}
              <div
                style={{
                  marginTop: '20px',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'hsla(var(--accent-cyan), 0.06)',
                  border: '1px solid hsla(var(--accent-cyan), 0.15)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'hsl(var(--accent-cyan))',
                    marginBottom: '8px',
                  }}
                >
                  اطلاعات ورود آزمایشی:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>مشتری: </span>
                    <span className="font-code" style={{ direction: 'ltr', display: 'inline' }}>
                      ali@example.com / user123
                    </span>
                  </p>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>مدیر: </span>
                    <span className="font-code" style={{ direction: 'ltr', display: 'inline' }}>
                      admin@techtink.ir / admin123
                    </span>
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Register Form */}
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
                  <label style={labelStyle}>ایمیل</label>
                  <div style={inputWrapperStyle}>
                    <Mail size={16} style={inputIconStyle} />
                    <input
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      style={{ paddingRight: '38px', direction: 'ltr', textAlign: 'right' }}
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
                  <label style={labelStyle}>رمز عبور</label>
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
    </div>
  );
}
