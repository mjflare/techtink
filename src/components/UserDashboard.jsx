import React, { useState, useEffect } from 'react';
import { 
  Package, Calendar, MapPin, User, LogOut, CheckCircle, Truck, 
  Clock, AlertCircle, Copy, ExternalLink, Wrench, Shield, Edit3, 
  Save, Phone, Mail, ArrowRight, ChevronLeft, ShoppingBag, Check,
  CreditCard, RefreshCw, Sparkles, Building2, Smartphone
} from 'lucide-react';
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
  'قزوین'
];

const ORDER_STATUS_MAP = {
  pending_payment: { label: 'در انتظار پرداخت', color: '#f59e0b', step: 1 },
  paid: { label: 'پرداخت شده و تایید سفارش', color: '#10b981', step: 2 },
  processing: { label: 'در حال بسته‌بندی و کنترل کیفیت', color: '#06b6d4', step: 2 },
  shipped: { label: 'تحویل به شرکت پست / ارسال شده', color: '#8b5cf6', step: 3 },
  delivered: { label: 'تحویل داده شده به مشتری', color: '#10b981', step: 4 },
  canceled: { label: 'لغو شده', color: '#ef4444', step: 0 },
  refunded: { label: 'مسترد شده', color: '#6b7280', step: 0 }
};

const APPOINTMENT_STATUS_MAP = {
  pending: { label: 'در انتظار تایید کارشناس', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  confirmed: { label: 'تایید شده (رزرو قطعی)', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  in_progress: { label: 'در حال انجام در آزمایشگاه', bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' },
  completed: { label: 'انجام شده و آماده تحویل', bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' },
  canceled: { label: 'لغو شده', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
};

export default function UserDashboard({ 
  user, 
  onLogout, 
  onSelectProduct, 
  onGoToStore, 
  onGoToSupport,
  onGoToAdmin,
  onUpdateUser,
  initialTab = 'orders'
}) {
  // Safety guard: Administrators should never use the customer account panel
  if (user?.role === 'admin') {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '80px', paddingBottom: '100px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 24px', borderRadius: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'hsla(var(--accent-cyan), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={30} color="hsl(var(--accent-cyan))" />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>دسترسی اختصاصی مدیریت</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.7', marginBottom: '24px' }}>
            شما با حساب <strong>مدیر فروشگاه</strong> وارد شده‌اید. پنل کاربری عادی و پیگیری سفارشات مختص خریداران و مشتریان است.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {onGoToAdmin ? (
              <button className="btn btn-primary" onClick={onGoToAdmin} style={{ padding: '10px 18px', gap: '8px' }}>
                <Shield size={16} /> ورود به پنل مدیریت
              </button>
            ) : (
              <a href="/admin" className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} /> ورود به پنل مدیریت
              </a>
            )}
            <button className="btn btn-glass" onClick={onLogout} style={{ padding: '10px 16px' }}>
              خروج از حساب
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState(initialTab); // 'orders' | 'appointments' | 'address' | 'profile'
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState(null);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    fullName: user?.savedAddress?.fullName || user?.name || '',
    phone: user?.savedAddress?.phone || user?.phone || user?.mobile || '',
    nationalId: user?.savedAddress?.nationalId || '',
    province: user?.savedAddress?.province || 'تهران',
    city: user?.savedAddress?.city || '',
    address: user?.savedAddress?.address || '',
    postalCode: user?.savedAddress?.postalCode || ''
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSavedNotice, setAddressSavedNotice] = useState(false);
  const [addressError, setAddressError] = useState(null);

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || user?.phone || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  // Sync user saved address when prop updates
  useEffect(() => {
    if (user?.savedAddress) {
      setAddressForm({
        fullName: user.savedAddress.fullName || user.name || '',
        phone: user.savedAddress.phone || user.phone || user.mobile || '',
        nationalId: user.savedAddress.nationalId || '',
        province: user.savedAddress.province || 'تهران',
        city: user.savedAddress.city || '',
        address: user.savedAddress.address || '',
        postalCode: user.savedAddress.postalCode || ''
      });
    }
  }, [user]);

  // Fetch orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const res = await fetch('/api/appointments/my', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data || []);
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAppointments();
  }, []);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTracking(id);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  // Save address handler
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressError(null);
    setAddressSavedNotice(false);

    if (!addressForm.fullName || !addressForm.phone || !addressForm.province || !addressForm.city || !addressForm.address) {
      setAddressError('لطفاً تمامی فیلدهای الزامی نشانی را تکمیل نمایید.');
      setSavingAddress(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/address', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(addressForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ذخیره نشانی');
      }

      // Update in localStorage as well
      localStorage.setItem('techtink_saved_address', JSON.stringify(addressForm));
      if (data.user && onUpdateUser) {
        onUpdateUser(data.user);
      }
      setAddressSavedNotice(true);
      setTimeout(() => setAddressSavedNotice(false), 4000);
    } catch (err) {
      setAddressError(err.message || 'خطا در ثبت نشانی');
    } finally {
      setSavingAddress(false);
    }
  };

  // Save profile handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name: profileName, mobile: profileMobile, email: profileEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در به‌روزرسانی مشخصات');
      if (data.user && onUpdateUser) onUpdateUser(data.user);
      setProfileNotice({ type: 'success', text: 'اطلاعات پروفایل شما با موفقیت به‌روزرسانی شد.' });
      setTimeout(() => setProfileNotice(null), 4000);
    } catch (err) {
      setProfileNotice({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordNotice(null);
    if (!currentPassword || !newPassword) {
      setPasswordNotice({ type: 'error', text: 'لطفاً رمز فعلی و جدید را وارد کنید.' });
      return;
    }
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ current: currentPassword, next: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تغییر رمز عبور');
      setCurrentPassword('');
      setNewPassword('');
      setPasswordNotice({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد.' });
      setTimeout(() => setPasswordNotice(null), 4000);
    } catch (err) {
      setPasswordNotice({ type: 'error', text: err.message });
    }
  };

  const pendingShipments = orders.filter(o => o.status === 'processing' || o.status === 'shipped').length;
  const activeApptsCount = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed' || a.status === 'in_progress').length;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      
      {/* 1. Header Banner & Profile Snapshot */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px 28px', 
          borderRadius: '24px', 
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.4rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px hsla(var(--accent-cyan), 0.35)'
            }}
          >
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800 }}>
                خوش آمدید، {user?.name || 'کاربر گرامی'}
              </h1>
              <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', padding: '3px 10px', fontSize: '0.75rem' }}>
                {user?.role === 'admin' ? 'مدیر فروشگاه' : 'مشتری تک‌تینک'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px', flexWrap: 'wrap' }}>
              {user?.mobile && <span>📱 {user.mobile}</span>}
              {user?.email && <span>✉️ {user.email}</span>}
            </div>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div 
            className="glass-card" 
            style={{ 
              padding: '10px 16px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('orders')}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={17} color="#06b6d4" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>کل سفارش‌ها</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-tech)' }}>{orders.length}</div>
            </div>
          </div>

          <div 
            className="glass-card" 
            style={{ 
              padding: '10px 16px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('orders')}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={17} color="#8b5cf6" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>در حال ارسال</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-tech)' }}>{pendingShipments}</div>
            </div>
          </div>

          <div 
            className="glass-card" 
            style={{ 
              padding: '10px 16px', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('appointments')}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={17} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>نوبت‌های فعال</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-tech)' }}>{activeApptsCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px', 
          overflowX: 'auto', 
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setActiveTab('orders')}
          style={{ padding: '10px 18px', fontSize: '0.9rem', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <Package size={17} />
          <span>سفارش‌ها و وضعیت ارسال ({orders.length})</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setActiveTab('appointments')}
          style={{ padding: '10px 18px', fontSize: '0.9rem', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <Calendar size={17} />
          <span>نوبت‌ها و خدمات من ({appointments.length})</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'address' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setActiveTab('address')}
          style={{ padding: '10px 18px', fontSize: '0.9rem', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <MapPin size={17} />
          <span>نشانی‌های ذخیره‌شده</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setActiveTab('profile')}
          style={{ padding: '10px 18px', fontSize: '0.9rem', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <User size={17} />
          <span>اطلاعات حساب و امنیت</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* ────── TAB 1: ORDERS & SHIPPING STATUS ────── */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={22} color="hsl(var(--accent-cyan))" />
              سفارش‌ها و رهگیری آنلاین مرسولات
            </h2>
            <button 
              type="button"
              className="btn btn-glass"
              onClick={fetchOrders}
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
              title="به‌روزرسانی وضعیت"
            >
              <RefreshCw size={13} className={loadingOrders ? 'spin' : ''} />
              <span>به‌روزرسانی</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              در حال بارگذاری لیست سفارش‌ها...
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--text-secondary)' }}>
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>شما هنوز هیچ سفارشی ثبت نکرده‌اید</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                می‌توانید لپ‌تاپ‌های استوک اروپایی و آمریکایی ما را با گارانتی طلایی بررسی و با خیال راحت سفارش دهید.
              </p>
              <button className="btn btn-primary" onClick={onGoToStore}>
                مشاهده فروشگاه لپ‌تاپ
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const statusMeta = ORDER_STATUS_MAP[order.status] || { label: order.status, color: '#06b6d4', step: 1 };
              const shipping = order.shippingInfo || {};
              const orderDate = new Date(order.createdAt).toLocaleDateString('fa-IR');

              return (
                <div 
                  key={order.id} 
                  className="glass-card"
                  style={{ 
                    padding: '24px', 
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                  }}
                >
                  {/* Order Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <span className="font-tech" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        سفارش #{order.id}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                        📅 ثبت شده در {orderDate}
                      </span>
                      {order.payment?.gateway && (
                        <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.75rem' }}>
                          روش پرداخت: {order.payment.gateway === 'card' ? 'کارت‌به‌کارت' : order.payment.gateway === 'cod' ? 'پرداخت در محل' : 'درگاه آنلاین'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span 
                        className="badge" 
                        style={{ 
                          background: `${statusMeta.color}20`, 
                          color: statusMeta.color, 
                          border: `1px solid ${statusMeta.color}50`,
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          padding: '4px 12px'
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* VISUAL SHIPPING STEPPER */}
                  {order.status !== 'canceled' && order.status !== 'refunded' && (
                    <div style={{ padding: '10px 4px', background: 'rgba(0,0,0,0.02)', borderRadius: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '8px' }}>
                        {[
                          { title: 'ثبت سفارش', step: 1 },
                          { title: 'آماده‌سازی در انبار', step: 2 },
                          { title: 'تحویل به پست / تیپاکس', step: 3 },
                          { title: 'تحویل نهایی', step: 4 }
                        ].map((st, si) => {
                          const isPassed = statusMeta.step >= st.step;
                          const isCurrent = statusMeta.step === st.step;
                          return (
                            <div 
                              key={si} 
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                flex: 1, 
                                textAlign: 'center',
                                position: 'relative',
                                zIndex: 2
                              }}
                            >
                              <div 
                                style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  borderRadius: '50%', 
                                  background: isPassed ? 'hsl(var(--accent-cyan))' : 'var(--glass-card-bg)',
                                  border: `2px solid ${isPassed ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isPassed ? '#fff' : 'var(--text-secondary)',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  marginBottom: '6px',
                                  boxShadow: isCurrent ? '0 0 12px hsl(var(--accent-cyan))' : 'none',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {isPassed ? <Check size={14} /> : st.step}
                              </div>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: isCurrent ? 700 : 500,
                                color: isPassed ? 'var(--text-primary)' : 'var(--text-secondary)'
                              }}>
                                {st.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* POSTAL TRACKING CODE HIGHLIGHT BOX */}
                  {order.trackingCode ? (
                    <div 
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(139, 92, 246, 0.08))', 
                        border: '1px solid rgba(6, 182, 212, 0.3)', 
                        borderRadius: '16px', 
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'hsl(var(--accent-cyan))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Truck size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>کد رهگیری مرسوله پستی / تیپاکس:</div>
                          <div className="font-tech" style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '1px', color: 'hsl(var(--accent-cyan))' }}>
                            {order.trackingCode}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-glass"
                          onClick={() => copyToClipboard(order.trackingCode, order.id)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
                        >
                          <Copy size={14} />
                          <span>{copiedTracking === order.id ? 'کپی شد!' : 'کپی کد'}</span>
                        </button>
                        <a 
                          href={`https://tracking.post.ir/?id=${order.trackingCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px', textDecoration: 'none' }}
                        >
                          <ExternalLink size={14} />
                          <span>پیگیری در سامانه پست</span>
                        </a>
                      </div>
                    </div>
                  ) : order.status === 'processing' || order.status === 'paid' ? (
                    <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.35)', borderRadius: '14px', padding: '12px 16px', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Clock size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <span>
                        مرسوله در انبار مرکزی تک‌تینک در حال بازرسی و بسته‌بندی ضدضربه است. به محض تحویل بسته به مامور پست، کد رهگیری ۲۴ رقمی در این قسمت قرار خواهد گرفت.
                      </span>
                    </div>
                  ) : null}

                  {/* Ordered Items Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      کالاهای سفارش ({order.items?.length || 0} مورد):
                    </div>
                    {order.items?.map((it, ii) => (
                      <div 
                        key={ii} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '10px 14px',
                          background: 'rgba(0,0,0,0.02)',
                          borderRadius: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--glass-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={16} color="hsl(var(--accent-purple))" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {it.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              تعداد: {it.qty} عدد
                              {it.config && typeof it.config === 'object' && Object.keys(it.config).length > 0 && (
                                <span> • {Object.values(it.config).join(' / ')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="font-tech" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', flexShrink: 0 }}>
                          {formatPrice(it.unitPrice * it.qty)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address & Bottom Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '480px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        📍 نشانی ارسال:
                      </div>
                      <div>
                        {shipping.fullName} • {shipping.phone || shipping.mobile}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        {shipping.province}، {shipping.city}، {shipping.address}
                        {shipping.postalCode && ` (کد پستی: ${shipping.postalCode})`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'left', direction: 'rtl' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>مبلغ کل پرداختی:</div>
                      <div className="price-gradient-text font-tech" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                        {formatPrice(order.total)}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
          )}

        </div>
      )}

      {/* ────── TAB 2: APPOINTMENTS & SERVICES ────── */}
      {activeTab === 'appointments' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={22} color="hsl(var(--accent-purple))" />
                درخواست‌ها، رزرواسیون و خدمات فنی
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: '4px 0 0 0' }}>
                پیگیری نوبت‌های مشاوره، ارتقای سخت‌افزار، سرویس دوره‌ای و تست بنچمارک در دفتر تک‌تینک
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onGoToSupport}
              style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}
            >
              <Wrench size={15} />
              <span>رزرو نوبت جدید</span>
            </button>
          </div>

          {loadingAppointments ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              در حال بارگذاری لیست نوبت‌ها...
            </div>
          ) : appointments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--text-secondary)' }}>
                <Calendar size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>شما هیچ نوبت ثبت‌شده‌ای ندارید</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                اگر لپ‌تاپ شما نیاز به سرویس خنک‌کننده، ارتقای RAM و SSD یا مشاوره حضوری قبل از خرید دارد، می‌توانید نوبت رزرو کنید.
              </p>
              <button className="btn btn-primary" onClick={onGoToSupport}>
                ثبت درخواست و نوبت رزرو
              </button>
            </div>
          ) : (
            appointments.map((appt) => {
              const statusMeta = APPOINTMENT_STATUS_MAP[appt.status] || { label: appt.status, bg: 'rgba(0,0,0,0.05)', color: '#06b6d4' };
              const dateStr = appt.preferred_date || 'هماهنگی تلفنی';
              const timeStr = appt.preferred_time || '';

              return (
                <div 
                  key={appt.id}
                  className="glass-card"
                  style={{ 
                    padding: '22px', 
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge" style={{ background: statusMeta.bg, color: statusMeta.color, fontWeight: 700, padding: '4px 12px' }}>
                        {statusMeta.label}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        {appt.product_name || appt.device_model || 'خدمات فنی و پشتیبانی'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>کد پیگیری:</span>
                      <span className="font-tech" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'hsl(var(--accent-cyan))' }}>
                        {appt.trackingCode || appt.tracking_code}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.825rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>نوع خدمت: </span>
                      <strong>{appt.type || 'مشاوره و ارزیابی'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>تاریخ و زمان نوبت: </span>
                      <strong>{dateStr} {timeStr ? `(ساعت ${timeStr})` : ''}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>شیوه تحویل: </span>
                      <strong>{appt.delivery_method === 'in_person' ? 'مراجعه حضوری به شوروم' : 'ارسال با پیک اختصاصی'}</strong>
                    </div>
                  </div>

                  {/* Services tags */}
                  {Array.isArray(appt.services) && appt.services.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>خدمات درخواستی:</span>
                      {appt.services.map((s, si) => (
                        <span key={si} className="badge" style={{ background: 'var(--glass-bg-hover)', fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Customer Notes & Admin Notes */}
                  {appt.notes && (
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>یادداشت شما:</strong> {appt.notes}
                    </div>
                  )}

                  {appt.admin_notes && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                      <strong style={{ color: '#10b981' }}>پاسخ کارشناس فنی تک‌تینک:</strong> {appt.admin_notes}
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>
      )}

      {/* ────── TAB 3: SAVED ADDRESSES ────── */}
      {activeTab === 'address' && (
        <div className="animate-fade-in" style={{ maxWidth: '780px', margin: '0 auto' }}>
          
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={22} color="hsl(var(--accent-cyan))" />
                نشانی پیش‌فرض جهت ارسال سفارش‌ها
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px', lineHeight: '1.6' }}>
                نشانی ثبت‌شده در این قسمت به‌صورت خودکار در صفحه پرداخت بارگذاری می‌شود و نیاز به ورود مجدد آن در هر خرید نخواهید داشت.
              </p>
            </div>

            {addressSavedNotice && (
              <div 
                className="animate-fade-in"
                style={{ 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}
              >
                <CheckCircle size={18} />
                <span>نشانی شما با موفقیت ذخیره شد و در خریدهای بعدی به‌صورت خودکار استفاده خواهد شد.</span>
              </div>
            )}

            {addressError && (
              <div 
                className="animate-fade-in"
                style={{ 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px'
                }}
              >
                <AlertCircle size={18} />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    نام و نام خانوادگی تحویل‌گیرنده <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="مثال: رضا محمدی"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    شماره تلفن همراه <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                    style={{ direction: 'ltr' }}
                    required
                  />
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    کد ملی (جهت صدور فاکتور رسمی)
                  </label>
                  <input
                    type="text"
                    value={addressForm.nationalId}
                    onChange={e => setAddressForm({ ...addressForm, nationalId: e.target.value })}
                    placeholder="۱۰ رقم بدون خط تیره"
                    style={{ direction: 'ltr' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    استان <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={addressForm.province}
                    onChange={e => setAddressForm({ ...addressForm, province: e.target.value })}
                    required
                  >
                    {PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    شهر <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="مثال: تهران"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  نشانی کامل پستی (خیابان، کوچه، پلاک، واحد) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={addressForm.address}
                  onChange={e => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="خیابان ولیعصر، تقاطع طالقانی، مجتمع تجاری نور، طبقه همکف سوم، واحد ۸۰۲۴"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  کد پستی ۱۰ رقمی <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={addressForm.postalCode}
                  onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value.replace(/\D/g, '') })}
                  placeholder="۱۲۳۴۵۶۷۸۹۰"
                  style={{ direction: 'ltr', maxWidth: '300px' }}
                  required
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAddress}
                  style={{ padding: '12px 28px', fontSize: '0.95rem', gap: '8px' }}
                >
                  <Save size={16} />
                  <span>{savingAddress ? 'در حال ذخیره...' : 'ذخیره نشانی در حساب کاربری'}</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* ────── TAB 4: PROFILE & SECURITY ────── */}
      {activeTab === 'profile' && (
        <div className="animate-fade-in" style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile info form */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={22} color="hsl(var(--accent-cyan))" />
              اطلاعات حساب کاربری
            </h2>

            {profileNotice && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', background: profileNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: profileNotice.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>
                {profileNotice.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>نام و نام خانوادگی</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>شماره همراه</label>
                  <input
                    type="tel"
                    value={profileMobile}
                    onChange={e => setProfileMobile(e.target.value)}
                    style={{ direction: 'ltr' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>آدرس ایمیل</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  style={{ direction: 'ltr' }}
                />
              </div>

              <div style={{ marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ padding: '10px 24px' }}>
                  {savingProfile ? 'در حال ثبت...' : 'ذخیره تغییرات مشخصات'}
                </button>
              </div>
            </form>
          </div>

          {/* Change password form */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={22} color="hsl(var(--accent-purple))" />
              تغییر رمز عبور
            </h2>

            {passwordNotice && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', background: passwordNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: passwordNotice.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>
                {passwordNotice.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>رمز عبور فعلی</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>رمز عبور جدید (حداقل ۸ کاراکتر)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  تغییر رمز عبور
                </button>
                <button 
                  type="button" 
                  onClick={onLogout} 
                  className="btn btn-glass"
                  style={{ color: '#ef4444', padding: '10px 20px', gap: '6px' }}
                >
                  <LogOut size={16} /> خروج از حساب
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
