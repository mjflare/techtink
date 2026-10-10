import React, { useState, useEffect, useMemo } from 'react';
import { X, ShieldCheck, CreditCard, CheckCircle, MapPin, Smartphone, Building2, Copy, Truck, Check } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

const PROVINCES = [
  'تهران',
  'اصفهان',
  'خراسان رضوی',
  'فارس',
  'آذربایجان شرقی',
  'خوزستان',
  'مازندران',
  'گیلان',
  'البرز',
  'قم',
  'کرمان',
  'همدان',
  'یزد',
  'مرکزی',
  'قزوین',
];

const ALL_GATEWAYS = [
  { id: 'zarinpal', name: 'زرین‌پال', color: '#f5c518', border: 'rgba(245,197,24,0.5)', subtitle: 'پرداخت امن و سریع شتاب با کلیه کارت‌های بانکی' },
  { id: 'mellat', name: 'بانک ملت', color: '#e53935', border: 'rgba(229,57,53,0.5)', subtitle: 'درگاه به‌پرداخت شاپرک بانک ملت' },
  { id: 'saman', name: 'بانک سامان', color: '#1e88e5', border: 'rgba(30,136,229,0.5)', subtitle: 'درگاه سامان‌کیش عضو شبکه شتاب' },
  { id: 'parsian', name: 'بانک پارسیان', color: '#43a047', border: 'rgba(67,160,71,0.5)', subtitle: 'درگاه تجارت الکترونیک پارسیان' },
  { id: 'card', name: 'کارت‌به‌کارت', color: '#8b5cf6', border: 'rgba(139,92,246,0.5)', subtitle: 'انتقال وجه شتابی به شماره کارت فروشگاه' },
  { id: 'cod', name: 'پرداخت در محل', color: '#10b981', border: 'rgba(16,185,129,0.5)', subtitle: 'تسویه با دستگاه کارتخوان هنگام تحویل بسته' },
];

const STEP_LABELS = ['اطلاعات ارسال', 'انتخاب روش پرداخت', 'تایید نهایی'];

const SHIPPING_THRESHOLD = 50000000;
const SHIPPING_COST = 350000;
const TAX_RATE = 0.09;

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '6px',
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

const RequiredStar = () => (
  <span style={{ color: '#ef4444', marginRight: '4px', fontWeight: 'bold' }}>*</span>
);

export default function CheckoutModal({ cartItems, onClose, onClearCart, user, onOpenAuth }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [refId, setRefId] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('zarinpal');
  const [storeSettings, setStoreSettings] = useState(null);
  const [copiedCard, setCopiedCard] = useState(false);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [hasPrefilledAddress, setHasPrefilledAddress] = useState(false);
  const [error, setError] = useState(null);

  // Shipping form state prefilled from authenticated user
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || user?.mobile || '');
  const [nationalId, setNationalId] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Fetch store settings to get active payment methods and store bank card
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setStoreSettings(data);
      })
      .catch(() => {});
  }, []);

  // Filter gateways by admin activation flags
  const availableGateways = useMemo(() => {
    if (!storeSettings) return ALL_GATEWAYS;
    return ALL_GATEWAYS.filter(gw => {
      const activeKey = `gateway_${gw.id}_active`;
      return storeSettings[activeKey] !== '0';
    });
  }, [storeSettings]);

  // Ensure selectedGateway is always valid
  useEffect(() => {
    if (availableGateways.length > 0 && !availableGateways.some(g => g.id === selectedGateway)) {
      setSelectedGateway(availableGateways[0].id);
    }
  }, [availableGateways, selectedGateway]);

  // Load saved address on mount or when user updates
  useEffect(() => {
    if (user) {
      let saved = user.savedAddress;
      if (!saved) {
        try {
          const local = localStorage.getItem('techtink_saved_address');
          if (local) saved = JSON.parse(local);
        } catch {}
      }

      if (saved) {
        if (saved.fullName) setFullName(saved.fullName);
        else if (user.name) setFullName(user.name);

        if (saved.phone) setPhone(saved.phone);
        else if (user.phone || user.mobile) setPhone(user.phone || user.mobile);

        if (saved.nationalId) setNationalId(saved.nationalId);
        if (saved.province) setProvince(saved.province);
        if (saved.city) setCity(saved.city);
        if (saved.address) setAddress(saved.address);
        if (saved.postalCode) setPostalCode(saved.postalCode);
        setHasPrefilledAddress(true);
      } else {
        if (user.name && !fullName) setFullName(user.name);
        if ((user.phone || user.mobile) && !phone) setPhone(user.phone || user.mobile);
      }
    }
  }, [user]);

  // Price calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shippingCost;

  // Enforce auth gate if user is not logged in
  if (!user) {
    return (
      <div className="modal-backdrop-wrapper" onClick={onClose}>
        <div
          className="glass-panel modal-card"
          style={{ maxWidth: '500px', textAlign: 'center', padding: '36px 28px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#ef4444'
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>
            ورود به حساب کاربری الزامی است
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '28px' }}>
            برای تکمیل سفارش، ثبت مشخصات ارسال و پرداخت امن، لطفاً ابتدا وارد حساب کاربری خود شوید یا در کمتر از ۱ دقیقه حساب جدید بسازید.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
            >
              ورود / ایجاد حساب کاربری
            </button>
            <button
              className="btn btn-glass"
              style={{ width: '100%', padding: '10px' }}
              onClick={onClose}
            >
              بازگشت به سبد خرید
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const shippingData = { fullName, phone, nationalId, province, city, address, postalCode };
    try {
      localStorage.setItem('techtink_saved_address', JSON.stringify(shippingData));
      if (saveAddressForFuture) {
        const token = localStorage.getItem('token');
        if (token) {
          fetch('/api/auth/address', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(shippingData)
          }).catch(() => {});
        }
      }
    } catch {}

    setStep(2);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('برای پرداخت، ابتدا باید وارد حساب کاربری خود شوید.');
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      }
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/checkout/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          items: cartItems,
          total,
          userId: user?.id,
          shipping: { fullName, phone, nationalId, province, city, address, postalCode },
          gateway: selectedGateway,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        setError(data.error || 'خطا در ثبت سفارش. لطفاً مجدداً بررسی فرمایید.');
        if (response.status === 401 && onOpenAuth) {
          setTimeout(() => {
            onClose();
            onOpenAuth();
          }, 1500);
        }
        return;
      }

      // Show redirecting state
      setLoading(false);
      setRedirecting(true);

      // Simulate gateway redirect then auto-verify
      setTimeout(async () => {
        try {
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ paymentToken: data.paymentToken }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            throw new Error(verifyData.error || 'خطا در تایید پرداخت');
          }
          setOrderId(verifyData.orderId);
          setRefId(verifyData.refId);
          setRedirecting(false);
          setStep(3);
        } catch (err) {
          console.error(err);
          setRedirecting(false);
          setError(err.message || 'خطا در تایید پرداخت. لطفاً دوباره تلاش کنید.');
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('خطا در اتصال به درگاه. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleFinish = () => {
    onClearCart();
    onClose();
  };

  return (
    <div className="modal-backdrop-wrapper" onClick={step !== 3 ? onClose : undefined}>
      {/* Dialog */}
      <div
        className="glass-panel modal-card"
        style={{
          maxWidth: '680px',
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
          <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={22} color="hsl(var(--accent-green))" />
            پرداخت امن
          </h2>
          {step !== 3 && (
            <button
              className="btn btn-glass"
              style={{ padding: '8px', borderRadius: '50%', lineHeight: 1 }}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '20px 24px 0 24px' }}>
          <div className="flex" style={{ gap: '8px', marginBottom: '6px' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flexGrow: 1,
                  height: '5px',
                  borderRadius: '3px',
                  background: step >= s
                    ? 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))'
                    : 'var(--border-glass)',
                  transition: 'background 0.4s ease',
                }}
              />
            ))}
          </div>
          <div
            className="flex"
            style={{
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
            }}
          >
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                style={{
                  color: step >= i + 1 ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)',
                  fontWeight: step === i + 1 ? 700 : 400,
                  transition: 'color 0.3s ease',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 24px 24px' }}>

          {/* ──────── Step 1: Shipping Info ──────── */}
          {step === 1 && (
            <form onSubmit={handleShippingSubmit} className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="hsl(var(--accent-cyan))" />
                  اطلاعات ارسال
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  (فیلدهای دارای <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span> الزامی هستند)
                </span>
              </div>

              {hasPrefilledAddress && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  color: '#10b981'
                }}>
                  <Check size={16} />
                  <span>نشانی شما از حساب کاربری بازخوانی شد. نیازی به ورود مجدد اطلاعات نیست.</span>
                </div>
              )}

              <div className="checkout-form-grid">
                {/* Full Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>
                    نام و نام خانوادگی
                    <RequiredStar />
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>
                    <span className="flex" style={{ alignItems: 'center', gap: '4px' }}>
                      <Smartphone size={14} />
                      شماره موبایل
                    </span>
                    <RequiredStar />
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="۰۹xxxxxxxxx"
                    required
                    className="font-code"
                    style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                {/* National ID */}
                <div>
                  <label style={labelStyle}>
                    کد ملی
                    <RequiredStar />
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="xxxxxxxxxx"
                    required
                    className="font-code"
                    style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                {/* Province */}
                <div>
                  <label style={labelStyle}>
                    <span className="flex" style={{ alignItems: 'center', gap: '4px' }}>
                      <Building2 size={14} />
                      استان
                    </span>
                    <RequiredStar />
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                    style={inputStyle}
                  >
                    <option value="" disabled>انتخاب استان</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label style={labelStyle}>
                    شهر
                    <RequiredStar />
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Address */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>
                    آدرس پستی
                    <RequiredStar />
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label style={labelStyle}>
                    کد پستی
                    <RequiredStar />
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="xxxxxxxxxx"
                    required
                    className="font-code"
                    style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                {/* Save Address Checkbox */}
                <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={saveAddressForFuture} 
                      onChange={e => setSaveAddressForFuture(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--accent-cyan))' }}
                    />
                    <span>ذخیره این نشانی در حساب کاربری برای خریدهای آینده</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                  ادامه و انتخاب روش پرداخت
                </button>
              </div>
            </form>
          )}

          {/* ──────── Step 2: Payment Gateway ──────── */}
          {step === 2 && !redirecting && (
            <form onSubmit={handlePayment} className="animate-fade-in">
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} />
                انتخاب درگاه پرداخت
              </h3>

              {/* Order Summary */}
              <div
                className="glass-card"
                style={{ padding: '20px', marginBottom: '24px' }}
              >
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  خلاصه سفارش
                </h4>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex"
                      style={{ justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}
                    >
                      <span style={{ flexShrink: 0, maxWidth: '60%' }}>
                        {item.name}
                        {item.quantity > 1 && (
                          <span
                            className="badge"
                            style={{
                              marginRight: '8px',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                            }}
                          >
                            ×{item.quantity}
                          </span>
                        )}
                      </span>
                      <span className="font-tech" style={{ direction: 'ltr', color: 'var(--text-secondary)' }}>
                        {formatPrice(item.totalPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  {/* Subtotal */}
                  <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>جمع مبلغ</span>
                    <span className="font-tech" style={{ direction: 'ltr' }}>{formatPrice(subtotal)}</span>
                  </div>

                  {/* Tax */}
                  <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>مالیات (۹٪)</span>
                    <span className="font-tech" style={{ direction: 'ltr' }}>{formatPrice(tax)}</span>
                  </div>

                  {/* Shipping */}
                  <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>هزینه ارسال</span>
                    <span
                      className="font-tech"
                      style={{
                        direction: 'ltr',
                        color: shippingCost === 0 ? 'hsl(var(--accent-green))' : undefined,
                        fontWeight: shippingCost === 0 ? 600 : 400,
                      }}
                    >
                      {shippingCost === 0 ? 'رایگان' : formatPrice(shippingCost)}
                    </span>
                  </div>

                  {/* Total */}
                  <div
                    className="flex"
                    style={{
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-glass)',
                      fontSize: '1.15rem',
                      fontWeight: 'bold',
                    }}
                  >
                    <span>مبلغ قابل پرداخت</span>
                    <span className="gradient-text font-tech" style={{ direction: 'ltr', fontWeight: 800 }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gateway Selection */}
              <div className="grid gateway-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {availableGateways.map((gw) => {
                  const isSelected = selectedGateway === gw.id;
                  return (
                    <div
                      key={gw.id}
                      onClick={() => setSelectedGateway(gw.id)}
                      className="glass-card"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        borderRadius: '16px',
                        border: isSelected ? `2px solid ${gw.border}` : '2px solid var(--border-glass)',
                        background: isSelected ? `linear-gradient(135deg, ${gw.border}15, var(--glass-card-bg))` : 'var(--glass-card-bg)',
                        boxShadow: isSelected ? `0 0 18px ${gw.border}` : 'none',
                        transition: 'all 0.25s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div 
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? gw.color : 'var(--border-glass)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isSelected ? gw.color : 'transparent',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {gw.name}
                          </span>
                        </div>

                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: gw.color,
                            boxShadow: `0 0 8px ${gw.color}`,
                          }}
                        />
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {gw.subtitle}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special details for Card-to-Card */}
              {selectedGateway === 'card' && (
                <div 
                  className="glass-card animate-fade-in"
                  style={{ 
                    padding: '18px 20px', 
                    borderRadius: '16px', 
                    marginBottom: '22px', 
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.05))',
                    border: '1px solid rgba(139, 92, 246, 0.35)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <CreditCard size={20} color="#8b5cf6" />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>اطلاعات حساب بانکی فروشگاه تک‌تینک جهت کارت‌به‌کارت</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(0,0,0,0.05)', padding: '12px 16px', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>شماره کارت شتاب:</div>
                      <div className="font-tech" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '2px', direction: 'ltr', color: '#8b5cf6' }}>
                        {storeSettings?.card_number || '۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                        به نام: {storeSettings?.card_holder || 'فروشگاه تک‌تینک (شرکت فناوری اطلاعات)'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-glass"
                      onClick={() => {
                        const cleanNum = (storeSettings?.card_number || '6037997512345678').replace(/[^0-9]/g, '');
                        navigator.clipboard.writeText(cleanNum);
                        setCopiedCard(true);
                        setTimeout(() => setCopiedCard(false), 2500);
                      }}
                      style={{ padding: '8px 14px', fontSize: '0.8rem', gap: '6px' }}
                    >
                      <Copy size={14} />
                      <span>{copiedCard ? 'کپی شد!' : 'کپی شماره کارت'}</span>
                    </button>
                  </div>

                  <p style={{ margin: '12px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    پس از واریز مبلغ، دکمه «ثبت سفارش» را بزنید. کارشناسان ما جهت تایید شماره تراکنش با شما تماس می‌گیرند.
                  </p>
                </div>
              )}

              {/* Special details for Cash on Delivery (COD) */}
              {selectedGateway === 'cod' && (
                <div 
                  className="glass-card animate-fade-in"
                  style={{ 
                    padding: '16px 20px', 
                    borderRadius: '16px', 
                    marginBottom: '22px', 
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <Truck size={24} color="#10b981" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    سفارش شما ثبت شده و بلافاصله آماده‌سازی می‌شود. مبلغ فاکتور هنگام تحویل سفارش درب محل با دستگاه کارتخوان سیار (پوز) تسویه خواهد شد.
                  </div>
                </div>
              )}

              {/* Security notice */}
              <div
                className="flex"
                style={{
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  marginBottom: '24px',
                }}
              >
                <ShieldCheck size={16} color="hsl(var(--accent-green))" />
                پرداخت امن و رمزنگاری شده — اطلاعات شما محافظت می‌شود
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    background: 'rgba(229,57,53,0.1)',
                    border: '1px solid rgba(229,57,53,0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: '#e53935',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex" style={{ justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn btn-glass"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  style={{ padding: '12px 24px' }}
                >
                  بازگشت
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ padding: '12px 32px' }}
                >
                  {loading 
                    ? 'در حال پردازش...' 
                    : selectedGateway === 'card'
                    ? 'ثبت سفارش با کارت‌به‌کارت'
                    : selectedGateway === 'cod'
                    ? 'ثبت نهایی سفارش (پرداخت در محل)'
                    : `پرداخت با ${availableGateways.find(g => g.id === selectedGateway)?.name || 'درگاه بانکی'}`}
                </button>
              </div>
            </form>
          )}

          {/* ──────── Redirecting State ──────── */}
          {step === 2 && redirecting && (
            <div
              className="animate-fade-in flex"
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '48px 0',
                gap: '20px',
              }}
            >
              {/* Spinner */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid var(--border-glass)',
                  borderTopColor: 'hsl(var(--accent-cyan))',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                {selectedGateway === 'card' || selectedGateway === 'cod'
                  ? 'در حال ثبت نهایی سفارش در سیستم...'
                  : 'در حال انتقال به درگاه بانکی...'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                لطفاً صبر کنید و از بستن این صفحه خودداری نمایید
              </p>
            </div>
          )}

          {/* ──────── Step 3: Confirmation ──────── */}
          {step === 3 && (
            <div
              className="animate-fade-in flex"
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '32px 0',
              }}
            >
              <CheckCircle
                size={72}
                color="hsl(var(--accent-green))"
                style={{ marginBottom: '20px' }}
              />

              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>
                سفارش شما تایید شد!
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.95rem' }}>
                از خرید شما سپاسگزاریم. اطلاعات سفارش به شماره موبایل شما ارسال خواهد شد.
              </p>

              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  width: '100%',
                  textAlign: 'right',
                  marginBottom: '32px',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>
                    شماره سفارش
                  </div>
                  <div
                    className="font-code"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      color: 'hsl(var(--accent-cyan))',
                      direction: 'ltr',
                      textAlign: 'left',
                    }}
                  >
                    {orderId}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>
                    شماره پیگیری (کد مرجع)
                  </div>
                  <div
                    className="font-code"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      color: 'hsl(var(--accent-purple))',
                      direction: 'ltr',
                      textAlign: 'left',
                    }}
                  >
                    {refId}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ padding: '14px 36px' }}
                onClick={handleFinish}
              >
                بازگشت به فروشگاه
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
