import React, { useState, useEffect } from 'react';
import { 
  Ticket, Tag, Plus, Search, RefreshCw, Copy, Check, 
  Trash2, Edit3, Sparkles, Percent, HelpCircle, 
  Calendar, CheckCircle, AlertCircle, X, Flame, Shield, ArrowLeft, ExternalLink
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function CouponManager({ authToken }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form state
  const defaultForm = {
    code: '',
    title: '',
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: 10,
    minOrderValue: 20000000,
    maxDiscount: 3000000,
    usageLimit: 100,
    validUntil: '۱۴۰۵/۱۲/۲۹',
    isActive: true,
    isPromoted: false
  };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(searchQuery.trim());
      const res = await fetch(`/api/admin/coupons?q=${q}&status=${statusFilter}`, { headers: authHeaders });
      if (!res.ok) throw new Error('خطا در دریافت لیست کدهای تخفیف');
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCoupons();
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateRandomCode = () => {
    const prefixes = ['TINK', 'DEAL', 'SAVE', 'VIP', 'LAPTOP', 'PRO'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    return `${p}-${num}`;
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...defaultForm,
      code: generateRandomCode()
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      title: c.title,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue,
      maxDiscount: c.maxDiscount,
      usageLimit: c.usageLimit,
      validUntil: c.validUntil,
      isActive: c.isActive,
      isPromoted: c.isPromoted
    });
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت کد تخفیف');

      setIsModalOpen(false);
      setSuccessNotice(editingId ? 'کد تخفیف با موفقیت به‌روزرسانی شد.' : 'کد تخفیف جدید با موفقیت ایجاد گردید.');
      setTimeout(() => setSuccessNotice(null), 3500);
      loadCoupons();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePromote = async (coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}/promote`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error('خطا در تغییر وضعیت تبلیغ کوپن');

      setSuccessNotice(
        data.isPromoted 
          ? `کد تخفیف «${coupon.code}» بلافاصله در بنر تبلیغاتی صفحه اصلی فعال و تبلیغ شد!`
          : `تبلیغ کد «${coupon.code}» در بنر صفحه اصلی غیرفعال شد.`
      );
      setTimeout(() => setSuccessNotice(null), 4000);
      loadCoupons();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`آیا از حذف کد تخفیف «${coupon.code}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('خطا در حذف کد تخفیف');
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      setSuccessNotice(`کد تخفیف ${coupon.code} حذف شد.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Stats
  const totalCount = coupons.length;
  const activeCount = coupons.filter(c => c.isActive).length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const promotedCoupon = coupons.find(c => c.isPromoted && c.isActive);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner & Header */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '24px 28px', 
          borderRadius: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px',
          background: 'linear-gradient(135deg, hsla(var(--accent-purple), 0.12), hsla(var(--accent-cyan), 0.08))',
          border: '1px solid hsla(var(--accent-purple), 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '14px', 
            background: 'linear-gradient(135deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px hsla(var(--accent-purple), 0.3)'
          }}>
            <Ticket size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>مدیریت کدهای تخفیف، جشنواره‌ها و کوپن‌های فروشگاه</h2>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              تعریف کدهای درصدی و مبلغ ثابت، سقف خرید، و تبلیغ فوری در بنر صفحه اصلی
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-glass"
            onClick={() => setIsGuideOpen(true)}
            style={{ padding: '9px 16px', fontSize: '0.85rem', gap: '6px' }}
          >
            <HelpCircle size={16} color="hsl(var(--accent-cyan))" />
            راهنمای تبلیغ کوپن
          </button>

          <button 
            type="button" 
            className="btn btn-primary"
            onClick={openAddModal}
            style={{ padding: '10px 20px', fontSize: '0.875rem', gap: '8px' }}
          >
            <Plus size={16} /> ایجاد کد تخفیف جدید
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="animate-fade-in" style={{ padding: '12px 18px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
          <CheckCircle size={16} />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="animate-fade-in" style={{ padding: '12px 18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'hsla(var(--accent-purple), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={22} color="hsl(var(--accent-purple))" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>کل کدهای تخفیف</div>
            <div className="font-tech" style={{ fontSize: '1.45rem', fontWeight: 900 }}>{totalCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>کوپن‌های فعال</div>
            <div className="font-tech" style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10b981' }}>{activeCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'hsla(var(--accent-cyan), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Percent size={22} color="hsl(var(--accent-cyan))" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>دفعات استفاده شده</div>
            <div className="font-tech" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'hsl(var(--accent-cyan))' }}>{totalUsages} بار</div>
          </div>
        </div>

        {/* Promoted on Homepage Card */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '18px 20px', 
            borderRadius: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            background: promotedCoupon ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(245, 158, 11, 0.1))' : undefined,
            border: promotedCoupon ? '1px solid rgba(249, 115, 22, 0.4)' : undefined
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={22} color="#f97316" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 700 }}>کوپن تبلیغاتی بنر صفحه اصلی</div>
            {promotedCoupon ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span className="font-tech" style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {promotedCoupon.code}
                </span>
                <span className="badge" style={{ background: '#f97316', color: '#fff', fontSize: '0.7rem', padding: '2px 6px' }}>
                  {promotedCoupon.discountType === 'percentage' ? `${promotedCoupon.discountValue}٪` : formatPrice(promotedCoupon.discountValue)}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>هیچ کوپنی در بنر ست نشده</div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: '1 1 280px', maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="جستجو با کد تخفیف یا عنوان کمپین..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingRight: '36px', fontSize: '0.85rem' }} 
            />
          </div>
          <button type="submit" className="btn btn-glass" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            جستجو
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فقط کوپن‌های فعال</option>
            <option value="inactive">کوپن‌های غیرفعال</option>
            <option value="promoted">کوپن‌های ویژه بنر صفحه اصلی</option>
          </select>

          <button 
            type="button" 
            className="btn btn-glass" 
            onClick={loadCoupons} 
            disabled={loading}
            title="به‌روزرسانی جدول"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>در حال بارگذاری لیست کدهای تخفیف...</div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <Ticket size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 8px 0' }}>هیچ کد تخفیفی یافت نشد</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem' }}>برای راه‌اندازی جشنواره فروش، اولین کد تخفیف را تعریف کنید.</p>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} /> ایجاد اولین کد تخفیف
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px' }}>کد تخفیف</th>
                  <th style={{ padding: '12px' }}>عنوان کمپین / پروموشن</th>
                  <th style={{ padding: '12px' }}>میزان تخفیف</th>
                  <th style={{ padding: '12px' }}>شرایط (حداقل / سقف)</th>
                  <th style={{ padding: '12px' }}>دفعات استفاده</th>
                  <th style={{ padding: '12px' }}>مهلت اعتبار</th>
                  <th style={{ padding: '12px' }}>وضعیت</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>تبلیغ در بنر</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, idx) => {
                  const isExpired = c.validUntil && new Date(c.validUntil).getTime() < Date.now();
                  const isUsageFull = c.usageLimit > 0 && c.usageCount >= c.usageLimit;
                  const isCopying = copiedCode === c.code;

                  return (
                    <tr 
                      key={c.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-glass)',
                        background: c.isPromoted ? 'rgba(249, 115, 22, 0.05)' : (idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent')
                      }}
                    >
                      {/* Code */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            className="font-tech" 
                            style={{ 
                              padding: '4px 10px', 
                              borderRadius: '8px', 
                              background: 'hsla(var(--accent-purple), 0.15)', 
                              border: '1px solid hsla(var(--accent-purple), 0.3)',
                              color: 'hsl(var(--accent-purple))',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              letterSpacing: '1px'
                            }}
                          >
                            {c.code}
                          </span>
                          <button
                            type="button"
                            className="btn btn-glass"
                            onClick={() => handleCopy(c.code)}
                            title="کپی کد"
                            style={{ padding: '4px 6px', fontSize: '0.75rem', lineHeight: 1 }}
                          >
                            {isCopying ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Title */}
                      <td style={{ padding: '12px', fontWeight: 600 }}>
                        {c.title}
                      </td>

                      {/* Discount Value */}
                      <td style={{ padding: '12px' }}>
                        {c.discountType === 'percentage' ? (
                          <span className="badge font-tech" style={{ background: 'hsla(var(--accent-cyan), 0.18)', color: 'hsl(var(--accent-cyan))', fontWeight: 800 }}>
                            {c.discountValue}٪ تخفیف
                          </span>
                        ) : (
                          <span className="badge font-tech" style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', fontWeight: 800 }}>
                            {formatPrice(c.discountValue)} کسر از فاکتور
                          </span>
                        )}
                      </td>

                      {/* Terms */}
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <div>حداقل: {c.minOrderValue > 0 ? formatPrice(c.minOrderValue) : 'بدون شرط'}</div>
                        {c.discountType === 'percentage' && c.maxDiscount > 0 && (
                          <div style={{ color: 'hsl(var(--accent-purple))' }}>سقف: {formatPrice(c.maxDiscount)}</div>
                        )}
                      </td>

                      {/* Usage */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
                          <span className="font-tech" style={{ fontSize: '0.78rem' }}>
                            {c.usageCount} {c.usageLimit > 0 ? `از ${c.usageLimit}` : 'بار (نامحدود)'}
                          </span>
                          {c.usageLimit > 0 && (
                            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${Math.min(100, Math.round((c.usageCount / c.usageLimit) * 100))}%`, 
                                height: '100%', 
                                background: isUsageFull ? '#ef4444' : 'hsl(var(--accent-cyan))' 
                              }} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td style={{ padding: '12px', color: isExpired ? '#ef4444' : 'var(--text-secondary)' }} className="font-tech">
                        {c.validUntil || 'نامحدود'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px' }}>
                        {isExpired ? (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>منقضی شده</span>
                        ) : isUsageFull ? (
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>تکمیل سقف</span>
                        ) : c.isActive ? (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>فعال</span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(150, 150, 150, 0.15)', color: '#888' }}>غیرفعال</span>
                        )}
                      </td>

                      {/* Promote Action Button */}
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleTogglePromote(c)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            borderRadius: '10px',
                            gap: '6px',
                            background: c.isPromoted 
                              ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                              : 'rgba(255, 255, 255, 0.05)',
                            color: c.isPromoted ? '#ffffff' : 'var(--text-secondary)',
                            border: c.isPromoted ? 'none' : '1px solid var(--border-glass)',
                            boxShadow: c.isPromoted ? '0 0 12px rgba(249, 115, 22, 0.4)' : 'none',
                            cursor: 'pointer'
                          }}
                          title={c.isPromoted ? 'کلیک کنید تا از بنر برداشته شود' : 'انتشار در بنر صفحه اصلی'}
                        >
                          <Flame size={13} color={c.isPromoted ? '#fff' : '#f97316'} />
                          <span>{c.isPromoted ? 'در حال تبلیغ' : 'تبلیغ در بنر'}</span>
                        </button>
                      </td>

                      {/* Edit & Delete */}
                      <td style={{ padding: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-glass"
                            onClick={() => openEditModal(c)}
                            title="ویرایش کوپن"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-glass"
                            onClick={() => handleDelete(c)}
                            title="حذف کوپن"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="modal-backdrop-wrapper" onClick={() => setIsModalOpen(false)}>
          <div className="glass-panel modal-card" style={{ maxWidth: '640px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={22} color="hsl(var(--accent-purple))" />
                {editingId ? 'ویرایش اطلاعات کد تخفیف' : 'تعریف کد تخفیف و پروموشن جدید'}
              </h3>
              <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                
                {/* Code */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>کد تخفیف (لاتین) *</label>
                    <button 
                      type="button" 
                      onClick={() => setForm(f => ({ ...f, code: generateRandomCode() }))}
                      style={{ background: 'none', border: 'none', color: 'hsl(var(--accent-cyan))', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                    >
                      تولید کد تصادفی
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    className="font-tech"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="TINK-2026"
                    style={{ textTransform: 'uppercase', direction: 'ltr', width: '100%' }}
                  />
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>عنوان پروموشن / مناسبت *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: جشنواره آغاز سال نو تک‌تینک"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>نوع تخفیف</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="percentage">درصدی (Percentage)</option>
                    <option value="fixed">مبلغ ثابت به تومان (Fixed Amount)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
                    {form.discountType === 'percentage' ? 'درصد تخفیف (مثال: ۱۵)' : 'مبلغ تخفیف به تومان (مثال: ۱۰۰۰۰۰۰)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Min Order Value */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>حداقل مبلغ سفارش (تومان)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderValue}
                    onChange={e => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                    placeholder="۰ = بدون حداقل"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Max Discount Cap (for percentage) */}
                {form.discountType === 'percentage' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>سقف تخفیف درصدی (تومان)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.maxDiscount}
                      onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                      placeholder="۰ = بدون سقف"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {/* Usage Limit */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>سقف تعداد کل استفاده</label>
                  <input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    placeholder="۰ = نامحدود"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Valid Until */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>تاریخ مهلت انقضا</label>
                  <input
                    type="text"
                    value={form.validUntil}
                    onChange={e => setForm({ ...form, validUntil: e.target.value })}
                    placeholder="۱۴۰۵/۱۲/۲۹"
                    style={{ width: '100%' }}
                  />
                </div>

              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span>کد تخفیف فعال باشد و توسط خریداران قابل استفاده باشد</span>
                </label>

                {/* The Promote on Homepage toggle */}
                <div 
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(245, 158, 11, 0.08))',
                    border: '1px solid rgba(249, 115, 22, 0.35)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <input
                    type="checkbox"
                    id="promoteCheckbox"
                    checked={form.isPromoted}
                    onChange={e => setForm({ ...form, isPromoted: e.target.checked })}
                    style={{ marginTop: '3px' }}
                  />
                  <label htmlFor="promoteCheckbox" style={{ cursor: 'pointer', flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#f97316', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Flame size={16} />
                      تبلیغ و نمایش فوری در بنر شگفت‌انگیز صفحه اصلی (Promote on Homepage)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>
                      با انتخاب این گزینه، این کوپن جایگزین کد قبلی شده و همراه با تایمر معکوس و امکان کپی در بنر بالای صفحه اصلی قرار می‌گیرد.
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-glass" onClick={() => setIsModalOpen(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'در حال ذخیره‌سازی...' : (editingId ? 'ذخیره تغییرات' : 'ثبت و انتشار کوپن')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Guide Modal: How to make and promote coupons */}
      {isGuideOpen && (
        <div className="modal-backdrop-wrapper" onClick={() => setIsGuideOpen(false)}>
          <div className="glass-panel modal-card" style={{ maxWidth: '600px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={22} color="hsl(var(--accent-cyan))" />
                راهنمای ایجاد و تبلیغ کدهای تخفیف در تک‌تینک
              </h3>
              <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setIsGuideOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.875rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
              
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'hsl(var(--accent-cyan))', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>۱</span>
                  مرحله اول: تعریف کد و شرایط تخفیف
                </div>
                <div>
                  روی دکمه «ایجاد کد تخفیف جدید» کلیک کنید. کد دلخواه خود (یا تولید کد تصادفی)، درصد تخفیف، سقف تخفیف، حداقل مبلغ خرید و تاریخ انقضا را مشخص نمایید.
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(249, 115, 22, 0.35)' }}>
                <div style={{ fontWeight: 800, color: '#f97316', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>۲</span>
                  مرحله دوم: تبلیغ در بنر صفحه اصلی (Promote Coupon)
                </div>
                <div>
                  برای معرفی جشنواره، کافیست دکمه نارنجی <strong>«تبلیغ در بنر»</strong> کنار هر کوپن را بزنید. این کوپن بلافاصله در بنر شگفت‌انگیز صفحه اصلی جای‌گذاری می‌شود و تایمر معکوس برای آن فعال خواهد شد.
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>۳</span>
                  مرحله سوم: استفاده و اعمال خودکار توسط خریدار
                </div>
                <div>
                  مشتریان در صفحه اصلی با یک کلیک کد را کپی می‌کنند. سپس در مرحله تسویه حساب (Checkout) کد را وارد کرده و تخفیف بلافاصله از مبلغ کل فاکتور کسر می‌گردد.
                </div>
              </div>

            </div>

            <div style={{ marginTop: '24px', textAlign: 'left' }}>
              <button className="btn btn-primary" onClick={() => setIsGuideOpen(false)}>
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
