import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Shield, Plus, Search, RefreshCw, Copy, Check, 
  Trash2, Edit3, Eye, Printer, Award, Calendar, User, Phone, 
  AlertCircle, CheckCircle, FileText, X, Sparkles, QrCode
} from 'lucide-react';

export default function WarrantyManager({ authToken, products = [] }) {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [cardModalWarranty, setCardModalWarranty] = useState(null);
  const [copiedSerial, setCopiedSerial] = useState(null);

  // Form state
  const [form, setForm] = useState({
    serial: '',
    model: '',
    owner: '',
    phone: '',
    purchaseDate: '',
    warrantyExpiry: '',
    status: 'فعال (گارانتی ۶ ماهه طلایی تک‌تینک)',
    carePlus: true,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  const loadWarranties = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(searchQuery.trim());
      const res = await fetch(`/api/admin/warranties?q=${q}&status=${statusFilter}`, { headers: authHeaders });
      if (!res.ok) throw new Error('خطا در دریافت لیست کارت‌های گارانتی');
      const data = await res.json();
      setWarranties(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarranties();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadWarranties();
  };

  // Helper to get today's Persian date string
  const getTodayPersian = () => {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch {
      return '۱۴۰۴/۰۱/۱۵';
    }
  };

  // Auto-generate serial: TT-<4-digits>-<LETTER>
  const generateSerial = () => {
    const letters = ['A', 'B', 'S', 'X', 'P', 'T', 'M', 'G'];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `TT-${num}-${letter}`;
  };

  const openAddModal = () => {
    setEditingSerial(null);
    const today = getTodayPersian();
    setForm({
      serial: generateSerial(),
      model: products[0]?.name || 'Lenovo ThinkPad T14 Gen 1',
      owner: '',
      phone: '',
      purchaseDate: today,
      warrantyExpiry: '۱۴۰۴/۰۸/۱۵',
      status: 'فعال (گارانتی ۶ ماهه طلایی تک‌تینک)',
      carePlus: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (w) => {
    setEditingSerial(w.serial);
    setForm({
      serial: w.serial,
      model: w.model,
      owner: w.owner || '',
      phone: w.phone || '',
      purchaseDate: w.purchaseDate || '',
      warrantyExpiry: w.warrantyExpiry || '',
      status: w.status || 'فعال (گارانتی ۶ ماهه طلایی تک‌تینک)',
      carePlus: !!w.carePlus,
      notes: w.notes || ''
    });
    setIsModalOpen(true);
  };

  const handlePeriodQuickSelect = (months, label) => {
    setForm(prev => ({
      ...prev,
      status: `فعال (${label})`
    }));
  };

  const handleSaveWarranty = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editingSerial 
        ? `/api/admin/warranties/${encodeURIComponent(editingSerial)}` 
        : '/api/admin/warranties';
      const method = editingSerial ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره اطلاعات گارانتی');

      setIsModalOpen(false);
      setSuccessNotice(editingSerial ? 'کارت گارانتی با موفقیت ویرایش شد.' : 'کارت گارانتی جدید با موفقیت صادر گردید.');
      setTimeout(() => setSuccessNotice(null), 3500);
      loadWarranties();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serial) => {
    if (!window.confirm(`آیا از حذف کارت گارانتی شماره سریال «${serial}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/admin/warranties/${encodeURIComponent(serial)}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('خطا در حذف کارت گارانتی');
      setWarranties(prev => prev.filter(w => w.serial !== serial));
      setSuccessNotice(`کارت گارانتی ${serial} با موفقیت حذف شد.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedSerial(text);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  // Stats calculation
  const totalCount = warranties.length;
  const activeCount = warranties.filter(w => w.status?.includes('فعال')).length;
  const carePlusCount = warranties.filter(w => w.carePlus).length;
  const expiredCount = warranties.filter(w => w.status?.includes('منقضی') || w.status?.includes('ابطال')).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner & Action */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'hsla(var(--accent-cyan), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="hsl(var(--accent-cyan))" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>مدیریت کارت‌های گارانتی، اصالت و سریال کالا</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              صدور کارت گارانتی، رهگیری سریال اصالت، استعلام وضعیت پوشش سخت‌افزاری و بسته Care+
            </span>
          </div>
        </div>

        <button 
          type="button" 
          className="btn btn-primary"
          onClick={openAddModal}
          style={{ padding: '10px 20px', fontSize: '0.875rem', gap: '8px' }}
        >
          <Plus size={16} /> صدور کارت گارانتی جدید
        </button>
      </div>

      {successNotice && (
        <div className="animate-fade-in" style={{ padding: '12px 18px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
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

      {/* Stats Summary Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsla(var(--accent-cyan), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="hsl(var(--accent-cyan))" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>کل کارت‌های گارانتی</div>
            <div className="font-tech" style={{ fontSize: '1.4rem', fontWeight: 900 }}>{totalCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>گارانتی‌های فعال</div>
            <div className="font-tech" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>{activeCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsla(var(--accent-purple), 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} color="hsl(var(--accent-purple))" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>پوشش Care Plus طلایی</div>
            <div className="font-tech" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'hsl(var(--accent-purple))' }}>{carePlusCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>منقضی یا باطل شده</div>
            <div className="font-tech" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444' }}>{expiredCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '18px 22px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: '1 1 320px', maxWidth: '480px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="جستجو با شماره سریال، مدل لپ‌تاپ، نام خریدار یا شماره تماس..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingRight: '36px', borderRadius: '12px', fontSize: '0.85rem' }}
            />
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-glass" style={{ padding: '8px 14px', fontSize: '0.825rem' }}>
            جستجو
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            className="input" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ borderRadius: '12px', fontSize: '0.825rem', padding: '8px 12px' }}
          >
            <option value="all">تمام وضعیت‌ها</option>
            <option value="active">فقط گارانتی‌های فعال</option>
            <option value="care_plus">فقط گارانتی‌های Care Plus</option>
            <option value="expired">فقط منقضی شده</option>
          </select>

          <button 
            type="button" 
            className="btn btn-glass" 
            onClick={loadWarranties}
            title="به‌روزرسانی جدول"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '22px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '12px 10px' }}>کد سریال گارانتی</th>
                <th style={{ padding: '12px 10px' }}>مدل دستگاه</th>
                <th style={{ padding: '12px 10px' }}>نام خریدار</th>
                <th style={{ padding: '12px 10px' }}>تاریخ صدور</th>
                <th style={{ padding: '12px 10px' }}>تاریخ انقضا</th>
                <th style={{ padding: '12px 10px' }}>وضعیت پوشش</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>Care+</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {warranties.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    هیچ کارت گارانتی با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const isActive = w.status?.includes('فعال');
                  return (
                    <tr key={w.serial} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="font-code" style={{ fontWeight: 800, color: 'hsl(var(--accent-cyan))', letterSpacing: '0.5px' }}>
                            {w.serial}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(w.serial)}
                            className="btn btn-glass"
                            style={{ padding: '2px 5px', height: '22px', border: 'none' }}
                            title="کپی شماره سریال"
                          >
                            {copiedSerial === w.serial ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                        {w.model}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <div>{w.owner || '—'}</div>
                        {w.phone && <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{w.phone}</div>}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        {w.purchaseDate || '—'}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        {w.warrantyExpiry || '—'}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <span 
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#10b981' : '#ef4444'
                          }}
                        >
                          {w.status}
                        </span>
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        {w.carePlus ? (
                          <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'hsla(var(--accent-purple), 0.25)', color: 'hsl(var(--accent-purple))', fontWeight: 800 }}>
                            طلایی
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>عادی</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-glass"
                            onClick={() => setCardModalWarranty(w)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                            title="مشاهده کارت گارانتی و چاپ"
                          >
                            <QrCode size={13} color="hsl(var(--accent-cyan))" /> کارت
                          </button>
                          <button
                            type="button"
                            className="btn btn-glass"
                            onClick={() => openEditModal(w)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="ویرایش"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-glass"
                            onClick={() => handleDelete(w.serial)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT WARRANTY MODAL */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div 
          style={{ 
            position: 'fixed', inset: 0, zIndex: 1200, 
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' 
          }}
        >
          <div 
            className="glass-card animate-fade-in"
            style={{ 
              width: '100%', maxWidth: '580px', borderRadius: '24px', 
              padding: '28px', maxHeight: '90vh', overflowY: 'auto' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="hsl(var(--accent-cyan))" />
                {editingSerial ? 'ویرایش کارت گارانتی' : 'صدور کارت گارانتی جدید'}
              </h3>
              <button 
                type="button" 
                className="btn btn-glass" 
                onClick={() => setIsModalOpen(false)} 
                style={{ padding: '6px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveWarranty} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Serial number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                  شماره سریال گارانتی (Serial Number) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text"
                    required
                    disabled={!!editingSerial}
                    value={form.serial}
                    onChange={(e) => setForm({ ...form, serial: e.target.value.toUpperCase() })}
                    placeholder="مثال: TT-9082-X"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', letterSpacing: '1px', direction: 'ltr', textAlign: 'left' }}
                    className="input font-code"
                  />
                  {!editingSerial && (
                    <button
                      type="button"
                      className="btn btn-glass"
                      onClick={() => setForm({ ...form, serial: generateSerial() })}
                      style={{ padding: '8px 12px', fontSize: '0.75rem', gap: '4px' }}
                      title="تولید سریال جدید تصادفی"
                    >
                      <Sparkles size={14} /> سریال تصادفی
                    </button>
                  )}
                </div>
              </div>

              {/* Model */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                  مدل لپ‌تاپ / دستگاه <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  list="products-datalist"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="مثال: Lenovo ThinkPad T14 Gen 1"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                  className="input"
                />
                <datalist id="products-datalist">
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.brand} - {p.model}</option>
                  ))}
                </datalist>
              </div>

              {/* Owner and Phone */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                    نام خریدار / تحویل‌گیرنده
                  </label>
                  <input 
                    type="text"
                    value={form.owner}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                    placeholder="مثال: رضا محمدی"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                    شماره موبایل خریدار
                  </label>
                  <input 
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="مثال: 09121234567"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', direction: 'ltr', textAlign: 'left' }}
                    className="input font-code"
                  />
                </div>
              </div>

              {/* Quick Warranty Period Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                  انتخاب سریع دوره گارانتی استوک:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-glass"
                    onClick={() => handlePeriodQuickSelect(3, 'گارانتی ۳ ماهه تک‌تینک')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    ۳ ماهه
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-glass"
                    onClick={() => handlePeriodQuickSelect(6, 'گارانتی ۶ ماهه طلایی تک‌تینک')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'hsl(var(--accent-cyan))' }}
                  >
                    ۶ ماهه طلایی (استاندارد)
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-glass"
                    onClick={() => handlePeriodQuickSelect(12, 'گارانتی ۱۲ ماهه VIP تک‌تینک')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    ۱۲ ماهه (۱ ساله)
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                    تاریخ خرید / صدور
                  </label>
                  <input 
                    type="text"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    placeholder="مثال: ۱۴۰۴/۰۱/۱۵"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', direction: 'ltr', textAlign: 'left' }}
                    className="input font-code"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                    تاریخ پایان اعتبار گارانتی
                  </label>
                  <input 
                    type="text"
                    value={form.warrantyExpiry}
                    onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                    placeholder="مثال: ۱۴۰۴/۰۷/۱۵"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', direction: 'ltr', textAlign: 'left' }}
                    className="input font-code"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                  وضعیت و عنوان گارانتی
                </label>
                <input 
                  type="text"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  placeholder="مثال: فعال (گارانتی ۶ ماهه طلایی تک‌تینک)"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px' }}
                  className="input"
                />
              </div>

              {/* Care Plus Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 14px', borderRadius: '12px', background: 'rgba(0,0,0,0.06)' }}>
                <input 
                  type="checkbox"
                  checked={form.carePlus}
                  onChange={(e) => setForm({ ...form, carePlus: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--accent-purple))' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>پوشش ویژه تک‌تینک Care Plus</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>شامل تعویض قطعه معیوب و پشتیبانی نرم‌افزاری رایگان</div>
                </div>
              </label>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', marginBottom: '6px', fontWeight: 600 }}>
                  یادداشت‌های داخلی (اختیاری)
                </label>
                <textarea 
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="شماره فاکتور، توضیحات سلامت قطعات یا قطعات ارتقا یافته..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', resize: 'vertical' }}
                  className="input"
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '0.9rem', justifyContent: 'center' }}
                >
                  {saving ? 'در حال ذخیره‌سازی...' : editingSerial ? 'ثبت تغییرات کارت گارانتی' : 'صدور قطعی کارت گارانتی'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-glass"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '12px 20px' }}
                >
                  انصراف
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DIGITAL WARRANTY CERTIFICATE CARD PREVIEW MODAL */}
      {/* ======================================================== */}
      {cardModalWarranty && (
        <div 
          style={{ 
            position: 'fixed', inset: 0, zIndex: 1200, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' 
          }}
        >
          <div 
            className="glass-card animate-fade-in"
            style={{ 
              width: '100%', maxWidth: '520px', borderRadius: '26px', 
              padding: '32px', position: 'relative', border: '1px solid hsla(var(--accent-cyan), 0.4)',
              background: 'linear-gradient(135deg, rgba(14, 20, 32, 0.95) 0%, rgba(8, 12, 20, 0.98) 100%)'
            }}
          >
            <button 
              type="button" 
              onClick={() => setCardModalWarranty(null)}
              style={{ position: 'absolute', left: '16px', top: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {/* Certificate Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '16px', background: 'hsla(var(--accent-cyan), 0.15)', marginBottom: '10px' }}>
                <ShieldCheck size={32} color="hsl(var(--accent-cyan))" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '-0.5px' }} className="gradient-text">
                کارت اصالت و گارانتی طلایی تک‌تینک
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                مرکز ارزیابی مهندسی و ضمانت سلامت سخت‌افزار لپ‌تاپ‌های استوک
              </span>
            </div>

            {/* Serial Barcode box */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--border-glass)', borderRadius: '14px', padding: '12px 16px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>شناسه یکتای اصالت دستگاه (Serial Number):</span>
              <div className="font-code" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'hsl(var(--accent-cyan))', letterSpacing: '2px', marginTop: '4px' }}>
                {cardModalWarranty.serial}
              </div>
            </div>

            {/* Certificate specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>مدل دستگاه:</span>
                <span style={{ fontWeight: 700 }}>{cardModalWarranty.model}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>مالک / خریدار:</span>
                <span style={{ fontWeight: 700 }}>{cardModalWarranty.owner || 'مشتری گرامی'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>تاریخ شروع:</span>
                <span className="font-code">{cardModalWarranty.purchaseDate || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>تاریخ انقضا:</span>
                <span className="font-code" style={{ color: '#10b981', fontWeight: 700 }}>{cardModalWarranty.warrantyExpiry || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>سطح پوشش:</span>
                <span style={{ fontWeight: 600 }}>{cardModalWarranty.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>خدمات VIP Care+:</span>
                <span>{cardModalWarranty.carePlus ? '✅ فعال (تعویض قطعه و سرویس دوره‌ای)' : 'عادی'}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={16} /> چاپ / ذخیره کارت (PDF)
              </button>
              <button 
                type="button" 
                className="btn btn-glass"
                onClick={() => setCardModalWarranty(null)}
                style={{ padding: '10px 18px' }}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
