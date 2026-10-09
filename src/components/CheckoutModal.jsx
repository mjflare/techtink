import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, CheckCircle, MapPin, Smartphone, Building2 } from 'lucide-react';
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
];

const GATEWAYS = [
  { id: 'zarinpal', name: 'زرین‌پال', color: '#f5c518', border: 'rgba(245,197,24,0.5)' },
  { id: 'mellat', name: 'بانک ملت', color: '#e53935', border: 'rgba(229,57,53,0.5)' },
  { id: 'saman', name: 'بانک سامان', color: '#1e88e5', border: 'rgba(30,136,229,0.5)' },
  { id: 'parsian', name: 'بانک پارسیان', color: '#43a047', border: 'rgba(67,160,71,0.5)' },
];

const STEP_LABELS = ['اطلاعات ارسال', 'انتخاب درگاه پرداخت', 'تایید پرداخت'];

const SHIPPING_THRESHOLD = 50000000;
const SHIPPING_COST = 350000;
const TAX_RATE = 0.09;

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

export default function CheckoutModal({ cartItems, onClose, onClearCart, user }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [refId, setRefId] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('zarinpal');
  const [error, setError] = useState(null);

  // Shipping form state
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nationalId, setNationalId] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Price calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shippingCost;

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          total,
          userId: user?.id,
          shipping: { fullName, phone, nationalId, province, city, address, postalCode },
          gateway: selectedGateway,
        }),
      });
      const data = await response.json();

      // Show redirecting state
      setLoading(false);
      setRedirecting(true);

      // Simulate gateway redirect then auto-verify
      setTimeout(async () => {
        try {
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentToken: data.paymentToken }),
          });
          const verifyData = await verifyRes.json();
          setOrderId(verifyData.orderId);
          setRefId(verifyData.refId);
          setRedirecting(false);
          setStep(3);
        } catch (err) {
          console.error(err);
          setRedirecting(false);
          setError('خطا در تایید پرداخت. لطفاً دوباره تلاش کنید.');
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
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 1090,
        }}
        onClick={step !== 3 ? onClose : undefined}
      />

      {/* Dialog */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%',
          maxWidth: '650px',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          direction: 'rtl',
        }}
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
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} />
                اطلاعات ارسال
              </h3>

              <div className="checkout-form-grid">
                {/* Full Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>نام و نام خانوادگی</label>
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
                  <label style={labelStyle}>کد ملی</label>
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
                  <label style={labelStyle}>شهر</label>
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
                  <label style={labelStyle}>آدرس پستی</label>
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
                  <label style={labelStyle}>کد پستی</label>
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
              </div>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-start' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                  ادامه
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
              <div className="grid gateway-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {GATEWAYS.map((gw) => {
                  const isSelected = selectedGateway === gw.id;
                  return (
                    <label
                      key={gw.id}
                      className="glass-card"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: isSelected ? `2px solid ${gw.border}` : '2px solid transparent',
                        boxShadow: isSelected ? `0 0 16px ${gw.border}` : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="gateway"
                        value={gw.id}
                        checked={isSelected}
                        onChange={() => setSelectedGateway(gw.id)}
                        style={{ width: 'auto', accentColor: gw.color }}
                      />
                      <span style={{ fontWeight: 600 }}>{gw.name}</span>
                      <span
                        style={{
                          marginRight: 'auto',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: gw.color,
                          boxShadow: `0 0 8px ${gw.color}`,
                        }}
                      />
                    </label>
                  );
                })}
              </div>

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
                  {loading ? 'در حال اتصال...' : 'پرداخت'}
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
                در حال انتقال به درگاه بانکی...
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
    </>
  );
}
