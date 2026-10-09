import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Users, TrendingUp, Settings, BarChart3, 
  Edit, Save, X, Check, Database, MessageSquare, Download, RefreshCw, 
  Plus, AlertTriangle, Shield, CheckCircle, ExternalLink, Copy, Search, Trash2,
  Sparkles, FileText, BookOpen, ThumbsUp, ThumbsDown, Cpu, Layers, HardDrive, Wrench
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token') || '');

  // Admin login fallback if not authenticated as admin
  const [adminEmail, setAdminEmail] = useState('admin@techtink.ir');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Product Full Modal (Add / Edit)
  const defaultProductForm = {
    id: null,
    name: '',
    slug: '',
    category: 'گیمینگ',
    series: 'سری بلید',
    basePrice: 50000000,
    stock: 10,
    tagline: '',
    badge: 'جدید',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80',
    guarantee: 'گارانتی ۲ ساله طلایی تک‌تینک',
    cpuBrand: 'Intel',
    gpuBrand: 'NVIDIA',
    chassis: 'All-Aluminum CNC Machined',
    specs: {
      cpu: 'Intel Core i7-14700HX',
      gpu: 'NVIDIA GeForce RTX 4060 (8GB)',
      ram: '16GB DDR5 5600MHz',
      storage: '1TB NVMe PCIe 4.0 SSD',
      display: '15.6" QHD 165Hz IPS',
      battery: '80Wh (شارژ سریع 230W)',
      weight: '2.1 kg',
      npuScore: '30 TOPS',
      chassis: 'All-Aluminum CNC Machined'
    },
    expertReview: {
      intro: '',
      pros: '',
      cons: '',
      verdict: ''
    }
  };

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState('add'); // 'add' | 'edit'
  const [productModalTab, setProductModalTab] = useState('basic'); // 'basic' | 'specs' | 'review'
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productModalError, setProductModalError] = useState('');

  // Driver and Support Modal
  const [driverModalProduct, setDriverModalProduct] = useState(null);
  const [productDrivers, setProductDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [addingDriver, setAddingDriver] = useState(false);
  const [driverMessage, setDriverMessage] = useState('');
  const [driverForm, setDriverForm] = useState({
    name: '',
    category: 'کارت گرافیک',
    version: '1.0.0',
    size: '150 MB',
    date: '۱۴۰۴/۱۲',
    downloadUrl: '#'
  });

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Database Tools
  const [dbTables, setDbTables] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('products');
  const [tableData, setTableData] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const [dbMessage, setDbMessage] = useState(null);

  // Settings
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [torobCopied, setTorobCopied] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: adminEmail, password: adminPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ورود ناموفق بود');
      if (data.user?.role !== 'admin') throw new Error('این حساب کاربری دسترسی مدیریت ندارد.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthToken(data.token);
      window.location.reload();
    } catch (err) {
      setAuthError(err.message);
    }
    setAuthLoading(false);
  };

  // Fetch section data
  useEffect(() => {
    if (activeSection === 'dashboard') {
      setStatsLoading(true);
      fetch('/api/admin/stats', { headers: authHeaders })
        .then(res => res.json())
        .then(data => { setStats(data); setStatsLoading(false); })
        .catch(() => setStatsLoading(false));
    }
    if (activeSection === 'products') {
      setProductsLoading(true);
      fetch('/api/admin/products', { headers: authHeaders })
        .then(res => res.json())
        .then(data => { setProducts(Array.isArray(data) ? data : []); setProductsLoading(false); })
        .catch(() => setProductsLoading(false));
    }
    if (activeSection === 'orders') {
      setOrdersLoading(true);
      fetch('/api/admin/orders', { headers: authHeaders })
        .then(res => res.json())
        .then(data => { setOrders(Array.isArray(data) ? data : []); setOrdersLoading(false); })
        .catch(() => setOrdersLoading(false));
    }
    if (activeSection === 'comments') {
      setCommentsLoading(true);
      fetch('/api/admin/comments?status=all', { headers: authHeaders })
        .then(res => res.json())
        .then(data => { setComments(Array.isArray(data) ? data : []); setCommentsLoading(false); })
        .catch(() => setCommentsLoading(false));
    }
    if (activeSection === 'dbtools') {
      loadDbTables();
    }
    if (activeSection === 'settings') {
      setSettingsLoading(true);
      fetch('/api/admin/settings', { headers: authHeaders })
        .then(res => res.json())
        .then(data => { 
          setSettings(data); 
          setSettingsForm(data); 
          setSettingsLoading(false); 
        })
        .catch(() => setSettingsLoading(false));
    }
  }, [activeSection, authToken]);

  const loadDbTables = () => {
    setDbLoading(true);
    fetch('/api/admin/db/tables', { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        setDbTables(data.tables || []);
        setDbLoading(false);
        if (data.tables?.length) {
          loadTableRows(selectedTable, 1);
        }
      })
      .catch(() => setDbLoading(false));
  };

  const loadTableRows = (tableName, page = 1) => {
    setSelectedTable(tableName);
    setTablePage(page);
    fetch(`/api/admin/db/tables/${tableName}?page=${page}&limit=25`, { headers: authHeaders })
      .then(res => res.json())
      .then(setTableData)
      .catch(() => {});
  };

  // Stock quick adjustment
  const handleQuickStock = async (productId, delta) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ mode: 'add', value: delta, reason: `تنظیم سریع (${delta > 0 ? '+' : ''}${delta})` })
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: data.stock, stockCount: data.stock, inStock: data.stock > 0 } : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddProduct = () => {
    setProductModalMode('add');
    setProductModalTab('basic');
    setProductModalError('');
    setProductForm({ ...defaultProductForm });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    setProductModalMode('edit');
    setProductModalTab('basic');
    setProductModalError('');
    setProductForm({
      id: p.id,
      name: p.name || '',
      slug: p.slug || '',
      category: p.category || 'گیمینگ',
      series: p.series || '',
      basePrice: p.basePrice || 0,
      stock: p.stock || 0,
      tagline: p.tagline || '',
      badge: p.badge || '',
      image: p.image || '',
      guarantee: p.guarantee || 'گارانتی ۲ ساله طلایی تک‌تینک',
      cpuBrand: p.cpuBrand || 'Intel',
      gpuBrand: p.gpuBrand || 'NVIDIA',
      chassis: p.chassis || p.specs?.chassis || 'All-Aluminum CNC Machined',
      specs: {
        cpu: p.specs?.cpu || '',
        gpu: p.specs?.gpu || '',
        ram: p.specs?.ram || '',
        storage: p.specs?.storage || '',
        display: p.specs?.display || '',
        battery: p.specs?.battery || '',
        weight: p.specs?.weight || '',
        npuScore: p.specs?.npuScore || '',
        chassis: p.chassis || p.specs?.chassis || 'All-Aluminum CNC Machined'
      },
      expertReview: {
        intro: p.expertReview?.intro || '',
        pros: Array.isArray(p.expertReview?.pros) ? p.expertReview.pros.join('\n') : (p.expertReview?.pros || ''),
        cons: Array.isArray(p.expertReview?.cons) ? p.expertReview.cons.join('\n') : (p.expertReview?.cons || ''),
        verdict: p.expertReview?.verdict || ''
      }
    });
    setProductModalOpen(true);
  };

  const handleSaveProductForm = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    setProductModalError('');

    const prosList = (productForm.expertReview?.pros || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const consList = (productForm.expertReview?.cons || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const chassisVal = productForm.chassis || productForm.specs?.chassis || 'All-Aluminum CNC Machined';

    const payload = {
      name: productForm.name,
      slug: productForm.slug || productForm.name.toLowerCase().replace(/[\s]+/g, '-'),
      category: productForm.category,
      series: productForm.series,
      basePrice: Number(productForm.basePrice),
      stock: Number(productForm.stock),
      tagline: productForm.tagline,
      badge: productForm.badge,
      image: productForm.image,
      guarantee: productForm.guarantee,
      cpuBrand: productForm.cpuBrand,
      gpuBrand: productForm.gpuBrand,
      chassis: chassisVal,
      specs: { ...productForm.specs, chassis: chassisVal },
      expertReview: {
        intro: productForm.expertReview?.intro || '',
        pros: prosList,
        cons: consList,
        verdict: productForm.expertReview?.verdict || ''
      }
    };

    try {
      const isEdit = productModalMode === 'edit' && productForm.id;
      const url = isEdit ? `/api/admin/products/${productForm.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ذخیره‌سازی اطلاعات محصول');
      }

      if (isEdit) {
        setProducts(prev => prev.map(p => p.id === productForm.id ? { ...p, ...data, stockCount: data.stock } : p));
      } else {
        setProducts(prev => [data, ...prev]);
      }
      setProductModalOpen(false);
    } catch (err) {
      setProductModalError(err.message);
    }
    setSavingProduct(false);
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`آیا از حذف یا غیرفعال‌سازی لپ‌تاپ «${productName}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Driver modal handlers
  const handleOpenDrivers = (product) => {
    setDriverModalProduct(product);
    setDriverMessage('');
    loadProductDrivers(product.slug);
  };

  const loadProductDrivers = async (slug) => {
    setDriversLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${slug}/drivers`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setProductDrivers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
    setDriversLoading(false);
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!driverModalProduct || !driverForm.name.trim()) return;
    setAddingDriver(true);
    setDriverMessage('');
    try {
      const res = await fetch(`/api/admin/products/${driverModalProduct.slug}/drivers`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...driverForm,
          modelName: driverModalProduct.name
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDriverMessage('درایور با موفقیت به بخش پشتیبانی محصول افزوده شد.');
        setDriverForm({
          name: '',
          category: 'کارت گرافیک',
          version: '1.0.0',
          size: '150 MB',
          date: '۱۴۰۴/۱۲',
          downloadUrl: '#'
        });
        loadProductDrivers(driverModalProduct.slug);
      } else {
        setDriverMessage(data.error || 'خطا در ثبت درایور');
      }
    } catch (e) {
      setDriverMessage('خطا در ارتباط با سرور');
    }
    setAddingDriver(false);
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('آیا از حذف این فایل پشتیبانی اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok && driverModalProduct) {
        loadProductDrivers(driverModalProduct.slug);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error(err);
    }
    setUpdatingOrderId(null);
  };

  const updateCommentStatus = async (commentId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (error) {
      console.error(error);
    }
    setSavingSettings(false);
  };

  const triggerDbMaintenance = async (op) => {
    setDbMessage(null);
    try {
      const res = await fetch(`/api/admin/db/maintenance/${op}`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      setDbMessage(data.result || 'عملیات با موفقیت انجام شد.');
      loadDbTables();
    } catch (err) {
      setDbMessage('خطا در اجرای عملیات');
    }
  };

  const copyTorobUrl = () => {
    const url = `${window.location.origin}/api/torob/products`;
    navigator.clipboard.writeText(url);
    setTorobCopied(true);
    setTimeout(() => setTorobCopied(false), 3000);
  };

  const tabs = [
    { id: 'dashboard', label: 'داشبورد و آمار', icon: BarChart3 },
    { id: 'products', label: 'مدیریت موجودی و محصولات', icon: Package },
    { id: 'orders', label: 'سفارشات مشتریان', icon: ShoppingCart },
    { id: 'comments', label: 'مدیریت نظرات', icon: MessageSquare },
    { id: 'dbtools', label: 'ابزارهای پایگاه داده (SQLite)', icon: Database },
    { id: 'settings', label: 'تنظیمات و درگاه ترب (Torob)', icon: Settings }
  ];

  // If user is not admin, show admin login screen
  const isAdmin = user?.role === 'admin' || (authToken && !authError);
  if (!isAdmin && !authToken) {
    return (
      <div className="container" style={{ padding: '80px 24px', maxWidth: '480px' }}>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Shield size={48} color="hsl(var(--accent-cyan))" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: '8px' }}>ورود به پنل مدیریت تک‌تینک</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
            برای دسترسی به کنترل انبار و تنظیمات سایت، لطفاً وارد شوید.
          </p>

          {authError && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'hsla(var(--accent-red), 0.15)', color: 'hsl(var(--accent-red))', marginBottom: '16px', fontSize: '0.875rem' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="ایمیل یا موبایل مدیر" 
              value={adminEmail} 
              onChange={e => setAdminEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="رمز عبور مدیر" 
              value={adminPassword} 
              onChange={e => setAdminPassword(e.target.value)} 
              required 
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '14px' }} disabled={authLoading}>
              {authLoading ? 'در حال ورود...' : 'ورود به پنل مدیریت'}
            </button>
          </form>
          <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            نام کاربری پیش‌فرض: admin@techtink.ir
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            پنل مدیریت <span className="gradient-text">تک‌تینک</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            مدیریت موجودی انبار، قیمت‌گذاری به تومان، سفارش‌ها، دیتابیس و اتصال به ترب
          </p>
        </div>

        <div className="flex" style={{ gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleOpenAddProduct}>
            <Plus size={18} /> افزودن محصول جدید
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className="btn glass-panel"
            style={{
              padding: '12px 20px',
              background: activeSection === tab.id ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
              borderColor: activeSection === tab.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={18} color={activeSection === tab.id ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'} />
            <span style={{ color: activeSection === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD OVERVIEW */}
      {activeSection === 'dashboard' && (
        <div className="animate-fade-in">
          {statsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>در حال بارگذاری آمار...</div>
          ) : stats ? (
            <>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>درآمد کل حاصل از فروش</div>
                  <div className="font-code gradient-text" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                    {formatPrice(stats.totalRevenue || stats.revenue || 0)}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>تعداد کل سفارشات</div>
                  <div className="font-code" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'hsl(var(--accent-cyan))' }}>
                    {(stats.totalOrders || stats.ordersTotal || 0).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>کل محصولات فعال</div>
                  <div className="font-code" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'hsl(var(--accent-purple))' }}>
                    {(stats.totalProducts || 0).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>موجودی کل انبار</div>
                  <div className="font-code" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'hsl(var(--accent-green))' }}>
                    {(stats.totalStock || 0).toLocaleString('fa-IR')} عدد
                  </div>
                </div>
              </div>

              {/* Low stock alerts */}
              {stats.lowStock && stats.lowStock.length > 0 && (
                <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', borderColor: 'hsla(var(--accent-red), 0.3)' }}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', color: 'hsl(var(--accent-red))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} /> هشدارهای موجودی رو به اتمام (کمتر از ۵ عدد)
                  </h3>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {stats.lowStock.map(ls => (
                      <div key={ls.id} className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>{ls.name}</span>
                        <span className="badge" style={{ background: 'hsla(var(--accent-red), 0.15)', color: 'hsl(var(--accent-red))' }}>
                          تنها {ls.stock} عدد
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* 2. PRODUCTS & STOCK MANAGEMENT */}
      {activeSection === 'products' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Package size={22} color="hsl(var(--accent-cyan))" />
                مدیریت محصولات، انبار، نقد تخصصی و درایورها
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                افزودن و ویرایش مشخصات لپ‌تاپ، نقد و بررسی و معرفی اجمالی، و فایل‌های پشتیبانی و درایورها
              </p>
            </div>
            
            <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text"
                  placeholder="جستجوی مدل، CPU یا GPU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ paddingRight: '36px', width: '220px', fontSize: '0.8125rem' }}
                />
              </div>
              <button className="btn btn-primary" onClick={handleOpenAddProduct}>
                <Plus size={16} /> افزودن لپ‌تاپ جدید
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px' }}>تصویر</th>
                  <th style={{ padding: '12px' }}>نام لپ‌تاپ و سازندگان</th>
                  <th style={{ padding: '12px' }}>دسته‌بندی</th>
                  <th style={{ padding: '12px' }}>قیمت پایه (تومان)</th>
                  <th style={{ padding: '12px' }}>موجودی</th>
                  <th style={{ padding: '12px' }}>شارژ سریع</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>بخش‌های تخصصی و عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter(p => {
                    if (!productSearch) return true;
                    const q = productSearch.toLowerCase();
                    return (
                      p.name?.toLowerCase().includes(q) ||
                      p.category?.toLowerCase().includes(q) ||
                      p.specs?.cpu?.toLowerCase().includes(q) ||
                      p.specs?.gpu?.toLowerCase().includes(q) ||
                      p.cpuBrand?.toLowerCase().includes(q) ||
                      p.gpuBrand?.toLowerCase().includes(q)
                    );
                  })
                  .map((p, idx) => (
                    <tr key={p.id} style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent', borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '12px' }}>
                        <img src={p.image} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{p.name}</span>
                          {p.badge && <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.1)', color: 'hsl(var(--accent-cyan))', fontSize: '0.65rem' }}>{p.badge}</span>}
                        </div>
                        <div className="flex" style={{ gap: '6px', marginTop: '4px' }}>
                          <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)' }}>
                            CPU: {p.cpuBrand || 'Intel'}
                          </span>
                          <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)' }}>
                            GPU: {p.gpuBrand || 'NVIDIA'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{p.category}</td>
                      <td style={{ padding: '12px' }} className="font-code">
                        {formatPrice(p.basePrice)}
                      </td>
                      <td style={{ padding: '12px' }} className="font-code">
                        <span style={{ fontWeight: 'bold', color: p.stock > 0 ? 'hsl(var(--accent-green))' : 'hsl(var(--accent-red))' }}>
                          {p.stock} عدد
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div className="flex" style={{ gap: '6px' }}>
                          <button className="btn btn-glass" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleQuickStock(p.id, 5)}>
                            +۵
                          </button>
                          <button className="btn btn-glass" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleQuickStock(p.id, 10)}>
                            +۱۰
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div className="flex" style={{ gap: '6px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                            onClick={() => handleOpenEditProduct(p)}
                            title="ویرایش مشخصات فنی و نقد و بررسی"
                          >
                            <Edit size={13} /> نقد و مشخصات
                          </button>
                          <button 
                            className="btn btn-glass" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px', borderColor: 'hsla(var(--accent-cyan), 0.3)' }}
                            onClick={() => handleOpenDrivers(p)}
                            title="مدیریت درایورها و فایل‌های بایوس"
                          >
                            <Download size={13} color="hsl(var(--accent-cyan))" /> درایورها
                          </button>
                          <button 
                            className="btn btn-glass" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'hsl(var(--accent-red))' }}
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="حذف یا غیرفعال‌سازی کالا"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ORDERS MANAGEMENT */}
      {activeSection === 'orders' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={22} color="hsl(var(--accent-green))" />
            سفارشات ثبت‌شده مشتریان ({orders.length})
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px' }}>شماره</th>
                  <th style={{ padding: '12px' }}>مشتری</th>
                  <th style={{ padding: '12px' }}>موبایل</th>
                  <th style={{ padding: '12px' }}>مبلغ کل</th>
                  <th style={{ padding: '12px' }}>وضعیت سفارش</th>
                  <th style={{ padding: '12px' }}>کد پیگیری درگاه</th>
                  <th style={{ padding: '12px' }}>تغییر وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o.id} style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent', borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '12px' }} className="font-code">#{o.id}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{o.customer || o.shippingInfo?.fullName || 'مشتری'}</td>
                    <td style={{ padding: '12px' }} className="font-code">{o.customerMobile || o.shippingInfo?.mobile || o.shippingInfo?.phone || '—'}</td>
                    <td style={{ padding: '12px' }} className="font-code">{formatPrice(o.total)}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={{
                        background: o.status === 'paid' ? 'hsla(var(--accent-green), 0.15)' : 'hsla(var(--accent-cyan), 0.15)',
                        color: o.status === 'paid' ? 'hsl(var(--accent-green))' : 'hsl(var(--accent-cyan))'
                      }}>
                        {o.status === 'paid' ? 'پرداخت شده' : o.status === 'shipped' ? 'ارسال شده' : o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }} className="font-code">{o.payment?.refId || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <select 
                        value={o.status} 
                        onChange={e => updateOrderStatus(o.id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                      >
                        <option value="pending_payment">در انتظار پرداخت</option>
                        <option value="paid">پرداخت شده</option>
                        <option value="processing">در حال آماده‌سازی</option>
                        <option value="shipped">تحویل به پست</option>
                        <option value="delivered">تحویل داده شده</option>
                        <option value="canceled">لغو شده</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. COMMENTS MODERATION */}
      {activeSection === 'comments' && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={22} color="hsl(var(--accent-purple))" />
            مدیریت و تایید دیدگاه‌های خریداران ({comments.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.map(c => (
              <div key={c.id} className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 'bold' }}>{c.author}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>برای محصول: <strong>{c.product}</strong></span>
                    <span className="badge" style={{
                      background: c.status === 'approved' ? 'hsla(var(--accent-green), 0.15)' : 'hsla(var(--accent-cyan), 0.15)',
                      color: c.status === 'approved' ? 'hsl(var(--accent-green))' : 'hsl(var(--accent-cyan))'
                    }}>
                      {c.status === 'approved' ? 'تایید شده' : c.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                    </span>
                  </div>

                  <div className="flex" style={{ gap: '8px' }}>
                    {c.status !== 'approved' && (
                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => updateCommentStatus(c.id, 'approved')}>
                        <Check size={14} /> تایید و نمایش
                      </button>
                    )}
                    {c.status !== 'rejected' && (
                      <button className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => updateCommentStatus(c.id, 'rejected')}>
                        <X size={14} /> رد دیدگاه
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DATABASE TOOLS (SQLITE) */}
      {activeSection === 'dbtools' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Actions & Maintenance */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="hsl(var(--accent-cyan))" />
              ابزارهای مدیریت پایگاه داده SQLite
            </h3>

            {dbMessage && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'hsla(var(--accent-cyan), 0.1)', color: 'hsl(var(--accent-cyan))', marginBottom: '16px', fontWeight: 'bold' }}>
                {dbMessage}
              </div>
            )}

            <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => triggerDbMaintenance('vacuum')}>
                <RefreshCw size={16} /> اجرای یکپارچه‌سازی (VACUUM)
              </button>
              <button className="btn btn-glass" onClick={() => triggerDbMaintenance('integrity')}>
                <Shield size={16} /> بررسی سلامت دیتابیس (Integrity Check)
              </button>
              <a href="/api/admin/db/export/products?format=csv" download className="btn btn-glass">
                <Download size={16} /> خروجی اکسل محصولات (CSV)
              </a>
              <a href="/api/admin/db/export/orders?format=csv" download className="btn btn-glass">
                <Download size={16} /> خروجی اکسل سفارشات (CSV)
              </a>
            </div>
          </div>

          {/* Tables browser */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div className="flex" style={{ gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {dbTables.map(t => (
                <button
                  key={t.name}
                  onClick={() => loadTableRows(t.name, 1)}
                  className="btn btn-glass"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8125rem',
                    background: selectedTable === t.name ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
                    borderColor: selectedTable === t.name ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)'
                  }}
                >
                  {t.name} ({t.rows} رکورد)
                </button>
              ))}
            </div>

            {tableData && tableData.rows && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                      {Object.keys(tableData.rows[0] || {}).map(k => (
                        <th key={k} style={{ padding: '10px' }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent', borderBottom: '1px solid var(--border-glass)' }}>
                        {Object.values(r).map((val, vi) => (
                          <td key={vi} style={{ padding: '10px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="font-code">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SETTINGS & TOROB API */}
      {activeSection === 'settings' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Torob API Integration Card */}
          <div className="glass-card" style={{ padding: '32px', borderColor: 'hsla(var(--accent-cyan), 0.3)' }}>
            <div className="flex" style={{ alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Sparkles size={24} color="hsl(var(--accent-cyan))" />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>اتصال به موتور جستجوی ترب (Torob.com)</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '20px' }}>
              وب‌سایت تک‌تینک مجهز به وب‌سرویس استاندارد تجمیع محصولات برای موتور ترب است. خزنده‌های ترب قیمت‌های به‌روز به تومان و موجودی لحظه‌ای را از این آدرس استخراج می‌کنند.
            </p>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>آدرس فید وب‌سرویس ترب:</div>
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <code className="font-code" style={{ direction: 'ltr', fontSize: '0.875rem', color: 'hsl(var(--accent-cyan))' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/torob/products` : '/api/torob/products'}
                </code>
                <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8125rem' }} onClick={copyTorobUrl}>
                  {torobCopied ? <Check size={14} /> : <Copy size={14} />}
                  {torobCopied ? 'کپی شد!' : 'کپی آدرس'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              این آدرس را در پنل فروشندگان ترب (قسمت تنظیمات اتصال وب‌سرویس محصولات) قرار دهید.
            </div>
          </div>

          {/* General Store & Payment Settings */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>تنظیمات عمومی و درگاه پرداخت ایرانی</h2>

            {settingsSaved && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'hsla(var(--accent-green), 0.15)', color: 'hsl(var(--accent-green))', marginBottom: '20px', fontWeight: 'bold' }}>
                تنظیمات با موفقیت ذخیره شدند!
              </div>
            )}

            <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>نام فروشگاه</label>
                  <input 
                    type="text" 
                    value={settingsForm.store_name || ''} 
                    onChange={e => setSettingsForm({ ...settingsForm, store_name: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>متن بنر بالای سایت</label>
                  <input 
                    type="text" 
                    value={settingsForm.banner_text || ''} 
                    onChange={e => setSettingsForm({ ...settingsForm, banner_text: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>کد مرچنت زرین‌پال (Merchant ID)</label>
                  <input 
                    className="font-code"
                    type="text" 
                    value={settingsForm.zarinpal_merchant_id || ''} 
                    onChange={e => setSettingsForm({ ...settingsForm, zarinpal_merchant_id: e.target.value })} 
                    style={{ direction: 'ltr' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>حالت آزمایشی زرین‌پال (Sandbox)</label>
                  <select 
                    value={settingsForm.zarinpal_sandbox || '1'} 
                    onChange={e => setSettingsForm({ ...settingsForm, zarinpal_sandbox: e.target.value })}
                  >
                    <option value="1">فعال (Sandbox Mode برای تست)</option>
                    <option value="0">غیرفعال (اتصال به درگاه واقعی شتاب)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                  {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات فروشگاه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Modal: Comprehensive Product Editor & Expert Review */}
      {productModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
            
            {/* Modal Header */}
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={22} color="hsl(var(--accent-cyan))" />
                  {productModalMode === 'edit' ? `ویرایش و نقد تخصصی: ${productForm.name}` : 'افزودن لپ‌تاپ جدید به انبار'}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  تنظیم مشخصات فنی، سازندگان قطعات، نقد و بررسی و معرفی اجمالی
                </p>
              </div>
              <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setProductModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex" style={{ gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              {[
                { id: 'basic', label: 'اطلاعات عمومی و قیمت', icon: Package },
                { id: 'specs', label: 'سخت‌افزار و برندها', icon: Cpu },
                { id: 'review', label: 'نقد، معرفی و بررسی تخصصی', icon: BookOpen }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProductModalTab(tab.id)}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    background: productModalTab === tab.id ? 'hsl(var(--accent-cyan))' : 'rgba(0,0,0,0.04)',
                    color: productModalTab === tab.id ? 'white' : 'var(--text-primary)',
                    fontWeight: productModalTab === tab.id ? 'bold' : 'normal'
                  }}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            {productModalError && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'hsla(var(--accent-red), 0.15)', color: 'hsl(var(--accent-red))', marginBottom: '16px', fontSize: '0.875rem' }}>
                {productModalError}
              </div>
            )}

            <form onSubmit={handleSaveProductForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* TAB 1: BASIC INFO */}
              {productModalTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>نام کامل لپ‌تاپ *</label>
                      <input 
                        type="text" 
                        required 
                        value={productForm.name} 
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })} 
                        placeholder="مثال: تک‌تینک پرو ۱۶ (نسخه OLED)" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>نامک لاتین یکتا (Slug) *</label>
                      <input 
                        type="text" 
                        className="font-code" 
                        required 
                        value={productForm.slug} 
                        onChange={e => setProductForm({ ...productForm, slug: e.target.value })} 
                        placeholder="tink-pro-16-oled" 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>قیمت پایه کالا (تومان) *</label>
                      <input 
                        type="number" 
                        required 
                        value={productForm.basePrice} 
                        onChange={e => setProductForm({ ...productForm, basePrice: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>موجودی فیزیکی در انبار (عدد) *</label>
                      <input 
                        type="number" 
                        required 
                        value={productForm.stock} 
                        onChange={e => setProductForm({ ...productForm, stock: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>دسته‌بندی اصلی</label>
                      <select 
                        value={productForm.category} 
                        onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      >
                        <option value="گیمینگ">گیمینگ (Gaming)</option>
                        <option value="تولید محتوا">تولید محتوا و طراحی (Creator)</option>
                        <option value="فوق سبک">فوق سبک و باریک (Ultrabook)</option>
                        <option value="ایستگاه کاری">ایستگاه کاری مهندسی (Workstation)</option>
                        <option value="اقتصادی">اقتصادی و دانشجویی (Budget)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>سری ساخت / خانواده محصول</label>
                      <input 
                        type="text" 
                        value={productForm.series} 
                        onChange={e => setProductForm({ ...productForm, series: e.target.value })} 
                        placeholder="مثال: سری بلید یا سری استودیو" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>برچسب ویژه (نشان کالا)</label>
                      <input 
                        type="text" 
                        value={productForm.badge} 
                        onChange={e => setProductForm({ ...productForm, badge: e.target.value })} 
                        placeholder="مثلاً: پرچمدار، جدید، ۲۰۲۴" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>شرایط گارانتی و ضمانت</label>
                      <input 
                        type="text" 
                        value={productForm.guarantee} 
                        onChange={e => setProductForm({ ...productForm, guarantee: e.target.value })} 
                        placeholder="گارانتی ۲ ساله طلایی تک‌تینک" 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>لینک تصویر شاخص محصول (URL)</label>
                    <input 
                      type="text" 
                      className="font-code" 
                      value={productForm.image} 
                      onChange={e => setProductForm({ ...productForm, image: e.target.value })} 
                      style={{ direction: 'ltr' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>شعار تبلیغاتی و عنوان بازاریابی</label>
                    <input 
                      type="text" 
                      value={productForm.tagline} 
                      onChange={e => setProductForm({ ...productForm, tagline: e.target.value })} 
                      placeholder="لپ‌تاپ فوق حرفه‌ای برای هوش مصنوعی و گیمینگ سطح بالا" 
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: HARDWARE & SPECS */}
              {productModalTab === 'specs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                  
                  {/* Brand categorization pills */}
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', marginBottom: '6px', color: 'hsl(var(--accent-cyan))' }}>
                        سازنده پردازنده مرکزی (CPU Maker)
                      </label>
                      <select 
                        value={productForm.cpuBrand} 
                        onChange={e => setProductForm({ ...productForm, cpuBrand: e.target.value })}
                        style={{ fontWeight: 'bold' }}
                      >
                        <option value="Intel">اینتل (Intel)</option>
                        <option value="AMD">ای‌ام‌دی (AMD)</option>
                        <option value="Apple">اپل (Apple Silicon)</option>
                        <option value="Other">سایر سازندگان</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', marginBottom: '6px', color: 'hsl(var(--accent-green))' }}>
                        سازنده پردازنده گرافیکی (GPU Maker)
                      </label>
                      <select 
                        value={productForm.gpuBrand} 
                        onChange={e => setProductForm({ ...productForm, gpuBrand: e.target.value })}
                        style={{ fontWeight: 'bold' }}
                      >
                        <option value="NVIDIA">انویدیا (NVIDIA GeForce)</option>
                        <option value="AMD">ای‌ام‌دی (AMD Radeon)</option>
                        <option value="Intel">اینتل (Intel Arc)</option>
                        <option value="Apple">اپل (Apple GPU)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مدل دقیق CPU</label>
                      <input 
                        type="text" 
                        value={productForm.specs.cpu || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, cpu: e.target.value } })} 
                        placeholder="Intel Core i9-14900HX" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مدل دقیق گرافیک (GPU)</label>
                      <input 
                        type="text" 
                        value={productForm.specs.gpu || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, gpu: e.target.value } })} 
                        placeholder="NVIDIA GeForce RTX 4080 (12GB GDDR6)" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>توان هوش مصنوعی (NPU)</label>
                      <input 
                        type="text" 
                        value={productForm.specs.npuScore || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, npuScore: e.target.value } })} 
                        placeholder="45 TOPS" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>حافظه رم (RAM)</label>
                      <input 
                        type="text" 
                        value={productForm.specs.ram || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, ram: e.target.value } })} 
                        placeholder="32GB DDR5 5600MHz" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>حافظه داخلی (SSD)</label>
                      <input 
                        type="text" 
                        value={productForm.specs.storage || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, storage: e.target.value } })} 
                        placeholder="1TB NVMe PCIe 4.0 SSD" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>صفحه نمایش (Display)</label>
                      <input 
                        type="text" 
                        value={productForm.specs.display || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, display: e.target.value } })} 
                        placeholder="16 QHD+ 240Hz 100% DCI-P3" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>باتری و آداپتور شارژ</label>
                      <input 
                        type="text" 
                        value={productForm.specs.battery || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, battery: e.target.value } })} 
                        placeholder="90Wh (شارژ فوق سریع 280W)" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>وزن خالص دستگاه</label>
                      <input 
                        type="text" 
                        value={productForm.specs.weight || ''} 
                        onChange={e => setProductForm({ ...productForm, specs: { ...productForm.specs, weight: e.target.value } })} 
                        placeholder="2.2 kg" 
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>جنس بدنه و ساختار شاسی (Chassis Build & Material)</label>
                      <input 
                        type="text" 
                        value={productForm.specs?.chassis || productForm.chassis || ''} 
                        onChange={e => setProductForm({ ...productForm, chassis: e.target.value, specs: { ...productForm.specs, chassis: e.target.value } })} 
                        placeholder="All-Aluminum CNC Machined Unibody" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EXPERT REVIEW & BRIEF INTRO */}
              {productModalTab === 'review' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '6px' }}>
                      معرفی اجمالی لپ‌تاپ (Product Overview & Brief Introduction)
                    </label>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 8px 0' }}>
                      متن معرفی کالا که در بالای صفحه محصول و در ابتدای برگه نقد و بررسی تخصصی نمایش داده می‌شود.
                    </p>
                    <textarea 
                      rows={3} 
                      value={productForm.expertReview.intro} 
                      onChange={e => setProductForm({ ...productForm, expertReview: { ...productForm.expertReview, intro: e.target.value } })} 
                      placeholder="این لپ‌تاپ با طراحی باریک، سیستم خنک‌کننده محفظه بخار و پردازش پرشتاب گرافیکی، یکی از قدرتمندترین ابزارهای بازار برای گیمرها و طراحان ۳ بعدی است..."
                      style={{ width: '100%', padding: '12px', lineHeight: '1.7' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '6px' }}>
                      جمع‌بندی کارشناسی (Expert Verdict)
                    </label>
                    <textarea 
                      rows={2} 
                      value={productForm.expertReview.verdict} 
                      onChange={e => setProductForm({ ...productForm, expertReview: { ...productForm.expertReview, verdict: e.target.value } })} 
                      placeholder="اگر به دنبال نهایت پایداری در نرخ فریم بازی‌ها و پردازش بدون افت هستید، این لپ‌تاپ انتخابی بی‌نظیر با ارزش خرید بسیار بالا است."
                      style={{ width: '100%', padding: '12px', lineHeight: '1.7' }}
                    />
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: 'hsl(var(--accent-green))', marginBottom: '6px' }}>
                        نقاط قوت کلیدی (هر مورد در یک خط)
                      </label>
                      <textarea 
                        rows={4} 
                        value={productForm.expertReview.pros} 
                        onChange={e => setProductForm({ ...productForm, expertReview: { ...productForm.expertReview, pros: e.target.value } })} 
                        placeholder="پردازنده مرکزی قدرتمند با توان توربو&#10;صفحه نمایش پرسرعت و دقیق کالیبره&#10;خنک‌کنندگی ساکت و کم‌صدا&#10;کیفیت شاسی تمام آلومینیومی"
                        style={{ width: '100%', padding: '12px', lineHeight: '1.7' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: 'hsl(var(--accent-red))', marginBottom: '6px' }}>
                        نقاط ضعف و ملاحظات (هر مورد در یک خط)
                      </label>
                      <textarea 
                        rows={4} 
                        value={productForm.expertReview.cons} 
                        onChange={e => setProductForm({ ...productForm, expertReview: { ...productForm.expertReview, cons: e.target.value } })} 
                        placeholder="قیمت در رده پریمیوم&#10;آداپتور برق نسبتاً سنگین برای حمل"
                        style={{ width: '100%', padding: '12px', lineHeight: '1.7' }}
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Modal Actions */}
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                <button type="button" className="btn btn-glass" onClick={() => setProductModalOpen(false)}>
                  انصراف
                </button>
                <div className="flex" style={{ gap: '12px' }}>
                  {productModalTab !== 'review' && (
                    <button 
                      type="button" 
                      className="btn btn-glass" 
                      onClick={() => setProductModalTab(productModalTab === 'basic' ? 'specs' : 'review')}
                    >
                      مرحله بعدی
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                    {savingProduct ? 'در حال ثبت...' : (productModalMode === 'edit' ? 'ذخیره تغییرات لپ‌تاپ' : 'ثبت لپ‌تاپ در انبار')}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Model-Specific Drivers & Support Management */}
      {driverModalProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
            
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={22} color="hsl(var(--accent-cyan))" />
                  مدیریت درایورها و پشتیبانی: {driverModalProduct.name}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <code className="font-code" style={{ color: 'hsl(var(--accent-cyan))', direction: 'ltr', fontSize: '0.8125rem' }}>
                    slug: {driverModalProduct.slug}
                  </code>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    • فایل‌های بایوس، فریم‌ور و درایورهای رسمی اختصاصی
                  </span>
                </div>
              </div>
              <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setDriverModalProduct(null)}>
                <X size={18} />
              </button>
            </div>

            {driverMessage && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'hsla(var(--accent-green), 0.15)', color: 'hsl(var(--accent-green))', marginBottom: '20px', fontWeight: 'bold' }}>
                {driverMessage}
              </div>
            )}

            {/* List of current drivers */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive size={18} color="hsl(var(--accent-cyan))" />
                فایل‌های پشتیبانی ثبت‌شده ({productDrivers.length})
              </h3>

              {driversLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>در حال دریافت لیست درایورها...</div>
              ) : productDrivers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                  هنوز هیچ فایل پشتیبانی یا درایوری برای این مدل ثبت نشده است. از فرم زیر اضافه کنید.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                        <th style={{ padding: '10px' }}>عنوان درایور / فایل</th>
                        <th style={{ padding: '10px' }}>دسته‌بندی</th>
                        <th style={{ padding: '10px' }}>نسخه</th>
                        <th style={{ padding: '10px' }}>حجم</th>
                        <th style={{ padding: '10px' }}>تاریخ انتشار</th>
                        <th style={{ padding: '10px' }}>لینک مستقیم</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productDrivers.map((d, i) => (
                        <tr key={d.id || i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{d.name}</td>
                          <td style={{ padding: '10px' }}>
                            <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.1)', color: 'hsl(var(--accent-cyan))', fontSize: '0.7rem' }}>
                              {d.category || 'نرم‌افزار'}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }} className="font-code">{d.version || '۱.۰'}</td>
                          <td style={{ padding: '10px' }} className="font-code">{d.size || '—'}</td>
                          <td style={{ padding: '10px' }}>{d.date || '—'}</td>
                          <td style={{ padding: '10px' }}>
                            <a href={d.download_url || '#'} target="_blank" rel="noreferrer" className="btn btn-glass" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                              دانلود
                            </a>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'left' }}>
                            <button 
                              className="btn btn-glass" 
                              style={{ padding: '4px 8px', color: 'hsl(var(--accent-red))' }}
                              onClick={() => handleDeleteDriver(d.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add new driver form */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="hsl(var(--accent-green))" />
                افزودن درایور یا پچ جدید برای این مدل لپ‌تاپ
              </h3>

              <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '4px' }}>نام فایل / عنوان درایور *</label>
                    <input 
                      type="text" 
                      required 
                      value={driverForm.name} 
                      onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} 
                      placeholder="مثال: درایور کارت گرافیک NVIDIA Game Ready" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '4px' }}>دسته‌بندی درایور</label>
                    <select 
                      value={driverForm.category} 
                      onChange={e => setDriverForm({ ...driverForm, category: e.target.value })}
                    >
                      <option value="کارت گرافیک">کارت گرافیک (GPU Driver)</option>
                      <option value="چیپست و پردازنده">چیپست و پردازنده (Chipset)</option>
                      <option value="بایوس و فریم‌ور">بایوس و فریم‌ور (BIOS / EC)</option>
                      <option value="شبکه و Wi-Fi">شبکه و بلوتوث (Wi-Fi / BT)</option>
                      <option value="صدا و مالتی‌مدیا">کارت صدا (Realtek / THX)</option>
                      <option value="ابزارهای کنترلی تک‌تینک">نرم‌افزار کنترل فن و نورپردازی تک‌تینک</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '4px' }}>شماره نسخه (Version)</label>
                    <input 
                      type="text" 
                      className="font-code" 
                      value={driverForm.version} 
                      onChange={e => setDriverForm({ ...driverForm, version: e.target.value })} 
                      placeholder="552.12" 
                      style={{ direction: 'ltr' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '4px' }}>حجم فایل</label>
                    <input 
                      type="text" 
                      value={driverForm.size} 
                      onChange={e => setDriverForm({ ...driverForm, size: e.target.value })} 
                      placeholder="650 MB" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '4px' }}>تاریخ انتشار</label>
                    <input 
                      type="text" 
                      value={driverForm.date} 
                      onChange={e => setDriverForm({ ...driverForm, date: e.target.value })} 
                      placeholder="۱۴۰۴/۱۲/۱۵" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '4px' }}>لینک دانلود مستقیم (URL)</label>
                    <input 
                      type="text" 
                      className="font-code" 
                      value={driverForm.downloadUrl} 
                      onChange={e => setDriverForm({ ...driverForm, downloadUrl: e.target.value })} 
                      placeholder="https://drivers.techtink.ir/blade16/nvidia.exe" 
                      style={{ direction: 'ltr' }} 
                    />
                  </div>
                </div>

                <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" disabled={addingDriver}>
                    {addingDriver ? 'در حال ثبت فایل...' : 'ثبت و انتشار درایور'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
