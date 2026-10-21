import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Users, TrendingUp, Settings, BarChart3, 
  Edit, Save, X, Check, Database, MessageSquare, Download, RefreshCw, 
  Plus, AlertTriangle, Shield, CheckCircle, ExternalLink, Copy, Search, Trash2,
  Sparkles, FileText, BookOpen, ThumbsUp, ThumbsDown, Cpu, Layers, HardDrive, Wrench,
  Calendar, Truck, Barcode as BarcodeIcon, MapPin, Phone, Clock, ArrowRight,
  ArrowDownLeft, ArrowUpRight, QrCode, Filter, Eye, CreditCard,
  Upload, Terminal, Server, AlertOctagon, Layout, ShieldCheck,
  Megaphone, Ticket, Globe, Mail, Activity
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import { getHardwareBadges } from '../utils/shortSpecs.js';
import BlogEditorModal from './BlogEditorModal.jsx';
import ProductEditorModal from './ProductEditorModal.jsx';
import BarcodeGeneratorModal from './BarcodeGeneratorModal.jsx';
import HomeCustomizer from './HomeCustomizer.jsx';
import WarrantyManager from './WarrantyManager.jsx';
import CouponManager from './CouponManager.jsx';
import DemoNoticeModal from './DemoNoticeModal.jsx';
import ViewerAnalytics from './ViewerAnalytics.jsx';
import AdminWebmail from './AdminWebmail.jsx';
import ResourceMonitor from './ResourceMonitor.jsx';
import { TelegramIcon, InstagramIcon, BaleIcon, AparatIcon, EnamadLogo } from './SocialLogos.jsx';

export default function AdminDashboard({ user, onLogout, siteSettings, onSettingsUpdated }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token') || '');
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);
  const [latestEmailToast, setLatestEmailToast] = useState(null);
  const [lastKnownEmailId, setLastKnownEmailId] = useState(null);

  // Admin login fallback if not authenticated as admin
  const [adminEmail, setAdminEmail] = useState('');
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
  const [trackingInputs, setTrackingInputs] = useState({});
  const [savingTrackingId, setSavingTrackingId] = useState(null);

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
  const [dbInfo, setDbInfo] = useState(null);
  const [dbBackups, setDbBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [importingDb, setImportingDb] = useState(false);
  const [importDbError, setImportDbError] = useState(null);
  const [importDbSuccess, setImportDbSuccess] = useState(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [showVpsGuide, setShowVpsGuide] = useState(false);

  // Settings
  const [settings, setSettings] = useState(() => siteSettings || null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState(() => siteSettings || {});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [torobCopied, setTorobCopied] = useState(false);
  const [previewDemoModalOpen, setPreviewDemoModalOpen] = useState(false);
  const [modeSwitchLoading, setModeSwitchLoading] = useState(false);

  useEffect(() => {
    if (siteSettings && (!settings || Object.keys(settingsForm).length === 0)) {
      setSettings(siteSettings);
      setSettingsForm(siteSettings);
    }
  }, [siteSettings]);

  // Blog Management
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogError, setBlogError] = useState('');
  const [blogSearch, setBlogSearch] = useState('');

  const defaultBlogForm = {
    id: '',
    title: '',
    excerpt: '',
    category: 'راهنمای خرید',
    author: user?.name || 'تیم تحریریه تک‌تینک',
    author_role: 'کارشناس سخت‌افزار',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    date: '۱۲ مهر ۱۴۰۵',
    read_time: '۵ دقیقه',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    content: '',
    product_slug: '',
    published: 1,
  };
  const [blogForm, setBlogForm] = useState(defaultBlogForm);

  // Barcode Modal
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  // Appointments Management
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // Inventory & Logistics Management
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [stockLog, setStockLog] = useState([]);
  const [stockLogLoading, setStockLogLoading] = useState(false);
  const [inventorySubTab, setInventorySubTab] = useState('inbound'); // 'inbound' | 'outbound' | 'history'
  const [inboundForm, setInboundForm] = useState({
    product_id: '',
    quantity: 1,
    supplier_name: '',
    batch_code: '',
    unit_cost: '',
    shelf_location: 'قفسه A-1',
    notes: ''
  });
  const [outboundForm, setOutboundForm] = useState({
    product_id: '',
    quantity: 1,
    courier: 'تیپاکس (Tipax)',
    tracking_number: '',
    destination: 'اصفهان',
    recipient_name: '',
    notes: ''
  });
  const [submittingShipment, setSubmittingShipment] = useState(false);
  const [shipmentMessage, setShipmentMessage] = useState(null);

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
      loadDbInfo();
      loadDbBackups();
    }
    if (activeSection === 'blog') {
      loadBlogPosts();
    }
    if (activeSection === 'appointments') {
      loadAppointments();
    }
    if (activeSection === 'inventory') {
      loadInventory();
      if (products.length === 0) {
        fetch('/api/admin/products', { headers: authHeaders })
          .then(res => res.json())
          .then(data => setProducts(Array.isArray(data) ? data : []))
          .catch(() => {});
      }
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

    // Check mail server & unread emails count
    fetch('/api/admin/emails/status', { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (typeof data.unreadEmails === 'number') setUnreadEmailCount(data.unreadEmails);
        if (data.lastEmail?.id) setLastKnownEmailId(data.lastEmail.id);
      })
      .catch(() => {});
  }, [activeSection, authToken]);

  // Dedicated background polling for incoming corporate emails & sound notifications
  useEffect(() => {
    if (!authToken) return;

    let mounted = true;
    const pollEmailStatus = async () => {
      try {
        const res = await fetch('/api/admin/emails/status', { headers: authHeaders });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        if (typeof data.unreadEmails === 'number') {
          setUnreadEmailCount(data.unreadEmails);
        }

        if (data.lastEmail && data.lastEmail.id) {
          const currentId = data.lastEmail.id;
          setLastKnownEmailId((prevId) => {
            if (prevId !== null && currentId > prevId) {
              setLatestEmailToast(data.lastEmail);
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
              } catch {}
            }
            return currentId;
          });
        }
      } catch {}
    };

    pollEmailStatus();
    const interval = setInterval(pollEmailStatus, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [authToken]);

  const loadAppointments = () => {
    setAppointmentsLoading(true);
    fetch('/api/admin/appointments', { headers: authHeaders })
      .then(res => res.json())
      .then(data => { setAppointments(Array.isArray(data) ? data : []); setAppointmentsLoading(false); })
      .catch(() => setAppointmentsLoading(false));
  };

  const updateAppointmentStatus = async (id, status, notes = null) => {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, ...(notes !== null ? { notes } : {}) } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('آیا از حذف این نوبت اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadInventory = () => {
    setShipmentsLoading(true);
    fetch('/api/admin/inventory/shipments', { headers: authHeaders })
      .then(res => res.json())
      .then(data => { setShipments(Array.isArray(data) ? data : []); setShipmentsLoading(false); })
      .catch(() => setShipmentsLoading(false));

    setStockLogLoading(true);
    fetch('/api/admin/inventory/stock-log', { headers: authHeaders })
      .then(res => res.json())
      .then(data => { setStockLog(Array.isArray(data) ? data : []); setStockLogLoading(false); })
      .catch(() => setStockLogLoading(false));
  };

  const handleInboundSubmit = async (e) => {
    e.preventDefault();
    if (!inboundForm.product_id) return;
    setSubmittingShipment(true);
    setShipmentMessage(null);
    try {
      const res = await fetch('/api/admin/inventory/shipments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'inbound',
          product_id: parseInt(inboundForm.product_id),
          quantity: parseInt(inboundForm.quantity) || 1,
          supplier_name: inboundForm.supplier_name,
          batch_code: inboundForm.batch_code,
          unit_cost: inboundForm.unit_cost ? parseInt(inboundForm.unit_cost) : null,
          shelf_location: inboundForm.shelf_location,
          notes: inboundForm.notes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShipmentMessage({ type: 'success', text: `رسید ورود بار جدید با کد ${data.shipment?.tracking_number} با موفقیت ثبت و به موجودی انبار اضافه گردید.` });
        setInboundForm({ product_id: '', quantity: 1, supplier_name: '', batch_code: '', unit_cost: '', shelf_location: 'قفسه A-1', notes: '' });
        loadInventory();
        fetch('/api/admin/products', { headers: authHeaders })
          .then(res => res.json())
          .then(data => setProducts(Array.isArray(data) ? data : []));
      } else {
        setShipmentMessage({ type: 'error', text: data.error || 'خطا در ثبت ورود کالا' });
      }
    } catch (err) {
      setShipmentMessage({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' });
    }
    setSubmittingShipment(false);
  };

  const handleOutboundSubmit = async (e) => {
    e.preventDefault();
    if (!outboundForm.product_id) return;
    setSubmittingShipment(true);
    setShipmentMessage(null);
    try {
      const res = await fetch('/api/admin/inventory/shipments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'outbound',
          product_id: parseInt(outboundForm.product_id),
          quantity: parseInt(outboundForm.quantity) || 1,
          courier: outboundForm.courier,
          tracking_number: outboundForm.tracking_number,
          destination: outboundForm.destination,
          recipient_name: outboundForm.recipient_name,
          notes: outboundForm.notes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShipmentMessage({ type: 'success', text: `حواله خروج و ارسال مرسوله با موفقیت ثبت و از موجودی انبار کسر گردید.` });
        setOutboundForm({ product_id: '', quantity: 1, courier: 'تیپاکس (Tipax)', tracking_number: '', destination: 'اصفهان', recipient_name: '', notes: '' });
        loadInventory();
        fetch('/api/admin/products', { headers: authHeaders })
          .then(res => res.json())
          .then(data => setProducts(Array.isArray(data) ? data : []));
      } else {
        setShipmentMessage({ type: 'error', text: data.error || 'خطا در ثبت خروج کالا' });
      }
    } catch (err) {
      setShipmentMessage({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' });
    }
    setSubmittingShipment(false);
  };

  const handleOpenBarcode = (prod = null) => {
    setBarcodeProduct(prod);
    setBarcodeModalOpen(true);
  };

  const loadBlogPosts = () => {
    setBlogLoading(true);
    fetch('/api/admin/blog', { headers: authHeaders })
      .then(res => res.json())
      .then(data => { setBlogPosts(Array.isArray(data) ? data : []); setBlogLoading(false); })
      .catch(() => setBlogLoading(false));
  };

  const handleOpenAddBlogPost = () => {
    if (products.length === 0) {
      fetch('/api/admin/products', { headers: authHeaders })
        .then(res => res.json())
        .then(data => setProducts(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
    const today = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date());
    setBlogForm({
      ...defaultBlogForm,
      product_slug: '',
      date: today
    });
    setBlogError('');
    setIsBlogModalOpen(true);
  };

  const handleOpenEditBlogPost = (post) => {
    if (products.length === 0) {
      fetch('/api/admin/products', { headers: authHeaders })
        .then(res => res.json())
        .then(data => setProducts(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
    setBlogForm({
      id: post.id || '',
      title: post.title || '',
      excerpt: post.excerpt || '',
      category: post.category || 'راهنمای خرید',
      author: post.author || '',
      author_role: post.author_role || post.authorRole || '',
      author_avatar: post.author_avatar || post.authorAvatar || '',
      date: post.date || '',
      read_time: post.read_time || post.readTime || '۵ دقیقه',
      image: post.image || '',
      content: post.content || '',
      product_slug: post.product_slug || post.productSlug || '',
      published: post.published === 0 || post.published === false ? 0 : 1,
    });
    setBlogError('');
    setIsBlogModalOpen(true);
  };

  const handleSaveBlogPost = async (customData) => {
    if (customData && customData.preventDefault) customData.preventDefault();
    const dataToSave = (customData && !customData.preventDefault && customData.title) ? customData : blogForm;
    if (!dataToSave.title) {
      setBlogError('عنوان مقاله الزامی است.');
      return;
    }
    setBlogSaving(true);
    setBlogError('');
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(dataToSave)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره مقاله');
      setIsBlogModalOpen(false);
      loadBlogPosts();
    } catch (err) {
      setBlogError(err.message);
    }
    setBlogSaving(false);
  };

  const handleDeleteBlogPost = async (id, title) => {
    if (!window.confirm(`آیا از حذف مقاله "${title}" اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        loadBlogPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const loadDbInfo = () => {
    fetch('/api/admin/db/info', { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (d && !d.error) setDbInfo(d); })
      .catch(() => {});
  };

  const loadDbBackups = () => {
    setLoadingBackups(true);
    fetch('/api/admin/db/backups', { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        setDbBackups(Array.isArray(data) ? data : []);
        setLoadingBackups(false);
      })
      .catch(() => setLoadingBackups(false));
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setDbMessage(null);
    try {
      const res = await fetch('/api/admin/db/backups', { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setDbMessage(`نسخه پشتیبان جدید با نام ${data.name} در پوشه سرور ایجاد شد.`);
        loadDbBackups();
        loadDbInfo();
      } else {
        setDbMessage(data.error || 'خطا در ایجاد نسخه پشتیبان');
      }
    } catch {
      setDbMessage('خطا در برقراری ارتباط با سرور');
    }
    setCreatingBackup(false);
  };

  const handleExportLiveDb = () => {
    const url = `/api/admin/db/download?token=${encodeURIComponent(authToken)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `techtink_${new Date().toISOString().slice(0, 10)}.db`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRestoreBackup = async (name) => {
    if (!window.confirm(`آیا از بازگردانی نسخه پشتیبان «${name}» اطمینان دارید؟ تمام داده‌های فعلی با این فایل جایگزین خواهند شد.`)) return;
    setDbMessage(null);
    try {
      const res = await fetch(`/api/admin/db/backups/${encodeURIComponent(name)}/restore`, { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setDbMessage(data.message || 'بازیابی با موفقیت انجام شد.');
        loadDbTables();
        loadDbInfo();
        loadDbBackups();
        fetchStats();
        fetchProducts();
      } else {
        setDbMessage(data.error || 'خطا در بازیابی نسخه پشتیبان');
      }
    } catch {
      setDbMessage('خطا در بازیابی');
    }
  };

  const handleDeleteBackup = async (name) => {
    if (!window.confirm(`آیا از حذف نسخه پشتیبان «${name}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/admin/db/backups/${encodeURIComponent(name)}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) {
        loadDbBackups();
        loadDbInfo();
      }
    } catch {}
  };

  const handleImportDbFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
      setImportDbError('لطفاً یک فایل پایگاه داده با پسوند .db یا .sqlite انتخاب نمایید.');
      e.target.value = '';
      return;
    }

    const confirmMsg = `هشدار مهم:\nشما در حال وارد کردن فایل «${file.name}» (${(file.size / (1024 * 1024)).toFixed(2)} مگابایت) هستید.\nاین عملیات کل دیتابیس فعلی وب‌سایت را با این فایل جایگزین می‌کند!\n(یک نسخه پشتیبان خودکار قبل از اعمال ایجاد خواهد شد).\n\nآیا تایید می‌کنید؟`;
    if (!window.confirm(confirmMsg)) {
      e.target.value = '';
      return;
    }

    setImportingDb(true);
    setImportDbError(null);
    setImportDbSuccess(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch('/api/admin/db/upload', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/octet-stream'
        },
        body: arrayBuffer
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در آپلود و اعمال دیتابیس');
      }
      setImportDbSuccess(data.message || 'دیتابیس جدید با موفقیت وارد و فعال شد.');
      loadDbTables();
      loadDbInfo();
      loadDbBackups();
      fetchStats();
      fetchProducts();
    } catch (err) {
      setImportDbError(err.message || 'خطا در بارگذاری فایل دیتابیس');
    } finally {
      setImportingDb(false);
      e.target.value = '';
    }
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
    if (blogPosts.length === 0) loadBlogPosts();
    setProductModalMode('add');
    setProductModalTab('basic');
    setProductModalError('');
    setProductForm({ ...defaultProductForm });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    if (blogPosts.length === 0) loadBlogPosts();
    setProductModalMode('edit');
    setProductModalTab('basic');
    setProductModalError('');
    setProductForm({
      id: p.id,
      name: p.name || '',
      slug: p.slug || '',
      brand: p.brand || p.specs?.brand || '',
      model: p.model || p.specs?.model || '',
      grade: p.grade || p.specs?.grade || 'گرید ++A اروپایی (تمیز در حد نو)',
      category: p.category || 'ورک استیشن',
      series: p.series || '',
      basePrice: p.basePrice || 0,
      stock: p.stock || 0,
      tagline: p.tagline || '',
      badge: p.badge || '',
      image: p.image || '',
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
      upgrades: p.upgrades || { ram: [], storage: [], display: [] },
      flagshipShowcase: p.specs?.flagshipShowcase || p.flagshipShowcase || null,
      model3d_url: p.model3d_url || p.specs?.model3d_url || '/models/laptop-flagship.glb',
      guarantee: p.guarantee || 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
      cpuBrand: p.cpuBrand || 'Intel',
      gpuBrand: p.gpuBrand || 'NVIDIA',
      chassis: p.chassis || p.specs?.chassis || 'آلیاژ تیتانیوم و آلومینیوم',
      specs: {
        cpu: p.specs?.cpu || '',
        gpu: p.specs?.gpu || '',
        ram: p.specs?.ram || '',
        storage: p.specs?.storage || '',
        display: p.specs?.display || '',
        battery: p.specs?.battery || '',
        weight: p.specs?.weight || '',
        npuScore: p.specs?.npuScore || '',
        chassis: p.chassis || p.specs?.chassis || 'آلیاژ تیتانیوم و آلومینیوم',
        flagshipShowcase: p.specs?.flagshipShowcase || p.flagshipShowcase || null
      },
      expertReview: {
        intro: p.expertReview?.intro || '',
        pros: Array.isArray(p.expertReview?.pros) ? p.expertReview.pros.join('\n') : (p.expertReview?.pros || ''),
        cons: Array.isArray(p.expertReview?.cons) ? p.expertReview.cons.join('\n') : (p.expertReview?.cons || ''),
        verdict: p.expertReview?.verdict || '',
        fullReview: p.expertReview?.fullReview || p.expertReview?.intro || ''
      }
    });
    setProductModalOpen(true);
  };

  const handleSaveProductForm = async (customPayload) => {
    if (customPayload && customPayload.preventDefault) customPayload.preventDefault();
    const dataToSave = (customPayload && !customPayload.preventDefault && customPayload.name) ? customPayload : productForm;
    setSavingProduct(true);
    setProductModalError('');

    const prosList = Array.isArray(dataToSave.expertReview?.pros)
      ? dataToSave.expertReview.pros
      : (dataToSave.expertReview?.pros || '').split('\n').map(s => s.trim()).filter(Boolean);

    const consList = Array.isArray(dataToSave.expertReview?.cons)
      ? dataToSave.expertReview.cons
      : (dataToSave.expertReview?.cons || '').split('\n').map(s => s.trim()).filter(Boolean);

    const chassisVal = dataToSave.chassis || dataToSave.specs?.chassis || 'آلیاژ تیتانیوم و آلومینیوم';

    const payload = {
      name: dataToSave.name,
      slug: dataToSave.slug || dataToSave.name.toLowerCase().replace(/[\s]+/g, '-'),
      brand: dataToSave.brand,
      model: dataToSave.model,
      grade: dataToSave.grade,
      category: dataToSave.category,
      series: dataToSave.series,
      basePrice: Number(dataToSave.basePrice),
      stock: Number(dataToSave.stock),
      tagline: dataToSave.tagline,
      badge: dataToSave.badge,
      image: dataToSave.image,
      guarantee: dataToSave.guarantee,
      cpuBrand: dataToSave.cpuBrand,
      gpuBrand: dataToSave.gpuBrand,
      chassis: chassisVal,
      specs: { 
        ...dataToSave.specs, 
        chassis: chassisVal,
        flagshipShowcase: dataToSave.flagshipShowcase || dataToSave.specs?.flagshipShowcase || null
      },
      flagshipShowcase: dataToSave.flagshipShowcase || dataToSave.specs?.flagshipShowcase || null,
      model3d_url: dataToSave.model3d_url || dataToSave.specs?.model3d_url || null,
      images: Array.isArray(dataToSave.images) && dataToSave.images.length > 0 ? dataToSave.images : (dataToSave.image ? [dataToSave.image] : []),
      upgrades: dataToSave.upgrades || null,
      expertReview: {
        intro: dataToSave.expertReview?.intro || '',
        pros: prosList,
        cons: consList,
        verdict: dataToSave.expertReview?.verdict || '',
        fullReview: dataToSave.expertReview?.fullReview || dataToSave.expertReview?.intro || ''
      }
    };

    try {
      const isEdit = productModalMode === 'edit' && dataToSave.id;
      const url = isEdit ? `/api/admin/products/${dataToSave.id}` : '/api/admin/products';
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
        setProducts(prev => prev.map(p => p.id === dataToSave.id ? { ...p, ...data, stockCount: data.stock } : p));
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

  const saveOrderTracking = async (orderId) => {
    const code = trackingInputs[orderId] !== undefined 
      ? trackingInputs[orderId] 
      : (orders.find(o => o.id === orderId)?.trackingCode || '');
    setSavingTrackingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ trackingCode: code })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, trackingCode: code } : o));
      }
    } catch (err) {
      console.error(err);
    }
    setSavingTrackingId(null);
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

  const handleSwitchSiteMode = async (targetMode) => {
    setModeSwitchLoading(true);
    try {
      const payload = {
        ...settingsForm,
        site_mode: targetMode
      };
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSettingsForm(updated);
        onSettingsUpdated?.(updated);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModeSwitchLoading(false);
    }
  };

  const saveSettings = async (e) => {
    if (e?.preventDefault) e.preventDefault();
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
        setSettingsForm(updated);
        onSettingsUpdated?.(updated);
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

  const ADMIN_CATEGORIES = [
    {
      id: 'analytics',
      title: 'داشبورد و آمار تحلیلی',
      enTitle: 'Analytics & Overview',
      desc: 'شاخص‌های فروش، درآمد و وضعیت کل سیستم',
      icon: BarChart3,
      tabs: [
        { id: 'dashboard', label: 'شاخص‌های کلیدی و فروش', icon: BarChart3, badge: 'فروش' },
        { id: 'viewer_analytics', label: 'آمار بازدیدکنندگان و ترافیک گوگل', icon: Eye, badge: 'آنالیتیکس' }
      ]
    },
    {
      id: 'marketing',
      title: 'مارکتینگ و کمپین‌های فروش',
      enTitle: 'Marketing & Promotions',
      desc: 'کدهای تخفیف، جشنواره‌ها، بنرهای تبلیغاتی و ویترین فروشگاه',
      icon: Megaphone,
      tabs: [
        { id: 'coupons', label: 'کدهای تخفیف و کوپن‌ها', icon: Ticket, badge: 'کوپن' },
        { id: 'home_customizer', label: 'بنرها و ویترین صفحه اصلی', icon: Sparkles, badge: 'ویترین' }
      ]
    },
    {
      id: 'logistics',
      title: 'لجستیک و مدیریت انبار',
      enTitle: 'Logistics & Supply',
      desc: 'ورود و خروج کالا، سفارشات و نوبت‌های حضوری',
      icon: Truck,
      tabs: [
        { id: 'inventory', label: 'انبارداری و ورود/خروج بار', icon: Truck, badge: 'حواله‌ها' },
        { id: 'products', label: 'محصولات و موجودی انبار', icon: Package, badge: products.length > 0 ? `${products.length} کالا` : null },
        { id: 'orders', label: 'سفارشات مشتریان', icon: ShoppingCart, badge: orders.length > 0 ? `${orders.length}` : null },
        { id: 'warranties', label: 'کارت‌های گارانتی و اصالت کالا', icon: ShieldCheck, badge: 'گارانتی' },
        { id: 'appointments', label: 'نوبت‌های تست شوروم و ارتقا', icon: Calendar, badge: appointments.length > 0 ? `${appointments.length}` : null }
      ]
    },
    {
      id: 'reviews_blog',
      title: 'نقد، بررسی و مقالات',
      enTitle: 'Reviews & Blog',
      desc: 'وبلاگ تخصصی، ویدیوهای آپارات/یوتیوب و نظرات',
      icon: BookOpen,
      tabs: [
        { id: 'blog', label: 'وبلاگ و نقد‌های ویدیویی', icon: BookOpen, badge: blogPosts.length > 0 ? `${blogPosts.length} مقاله` : null },
        { id: 'comments', label: 'دیدگاه‌ها و نظرات خریداران', icon: MessageSquare, badge: comments.filter(c => c.status === 'pending').length > 0 ? `${comments.filter(c => c.status === 'pending').length} در انتظار` : null }
      ]
    },
    {
      id: 'corporate_email',
      title: 'صندوق ایمیل و وب‌میل سازمانی',
      enTitle: 'Corporate Webmail & Inbox',
      desc: 'مدیریت ایمیل‌های دریافتی و ارسالی info@techtink.ir و مکاتبات',
      icon: Mail,
      badge: unreadEmailCount > 0 ? `${unreadEmailCount} پیام جدید` : null,
      badgeColor: '#ef4444',
      tabs: [
        { id: 'webmail', label: 'صندوق وب‌میل (info@techtink.ir)', icon: Mail, badge: unreadEmailCount > 0 ? `${unreadEmailCount} جدید` : null }
      ]
    },
    {
      id: 'developers',
      title: 'منابع سرور، دیتابیس و سیستم',
      enTitle: 'VPS Health, Database & System',
      desc: 'پایش بی‌درنگ CPU، حافظه RAM، دیسک، سرویس‌های سرور و پایگاه داده',
      icon: Activity,
      tabs: [
        { id: 'resource_monitor', label: 'منابع و سلامت سرور (VPS Health)', icon: Activity, badge: 'زنده' },
        { id: 'dbtools', label: 'پایگاه داده (SQLite Console)', icon: Database, badge: 'SQL' },
        { id: 'settings', label: 'تنظیمات، وب‌سرویس ترب و نشانی', icon: Settings, badge: 'API' }
      ]
    }
  ];

  // Derive active category from current activeSection
  const activeCategoryObj = ADMIN_CATEGORIES.find(c => c.tabs.some(t => t.id === activeSection)) || ADMIN_CATEGORIES[0];
  const activeCategoryId = activeCategoryObj.id;

  const handleSelectCategory = (cat) => {
    if (!cat.tabs.some(t => t.id === activeSection)) {
      setActiveSection(cat.tabs[0].id);
    }
  };

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
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', position: 'relative' }}>
      
      {/* Floating Incoming Email Notification Toast */}
      {latestEmailToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '560px',
          width: '90%'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Mail size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem' }}>ایمیل جدید دریافت شد! 📬</span>
              {latestEmailToast.verificationCode && (
                <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  کد: {latestEmailToast.verificationCode}
                </span>
              )}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              از: {latestEmailToast.from} | موضوع: {latestEmailToast.subject || '(بدون عنوان)'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveSection('webmail');
                setLatestEmailToast(null);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              مشاهده پیام
            </button>
            <button
              type="button"
              onClick={() => setLatestEmailToast(null)}
              className="btn btn-glass"
              style={{ padding: '8px 10px', borderRadius: '10px', fontSize: '0.8rem' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            پنل مدیریت <span className="gradient-text">تک‌تینک</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            مدیریت موجودی انبار، قیمت‌گذاری به تومان، وبلاگ، سفارش‌ها، دیتابیس و اتصال به ترب
          </p>
        </div>

        <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
          {/* Quick Webmail Notification Pill */}
          <button 
            type="button"
            onClick={() => setActiveSection('webmail')}
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.825rem',
              fontWeight: '600',
              borderColor: unreadEmailCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-glass)',
              background: unreadEmailCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: unreadEmailCount > 0 ? '#ef4444' : 'var(--text-secondary)'
            }}
            title="مشاهده صندوق ایمیل و وب‌میل سازمانی"
          >
            <Mail size={16} />
            <span>وب‌میل سازمانی</span>
            {unreadEmailCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                padding: '2px 7px',
                borderRadius: '8px',
                fontSize: '0.725rem',
                fontWeight: 800
              }}>
                {unreadEmailCount} جدید
              </span>
            )}
          </button>

          {/* Quick VPS Resource Monitor Button */}
          <button 
            type="button"
            onClick={() => setActiveSection('resource_monitor')}
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.825rem',
              fontWeight: '600',
              borderColor: activeSection === 'resource_monitor' ? 'hsl(var(--accent-cyan))' : 'rgba(14, 165, 233, 0.4)',
              background: activeSection === 'resource_monitor' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(14, 165, 233, 0.1)',
              color: activeSection === 'resource_monitor' ? '#ffffff' : 'hsl(var(--accent-cyan))',
              boxShadow: activeSection === 'resource_monitor' ? '0 0 16px hsla(var(--accent-cyan), 0.4)' : 'none'
            }}
            title="پایش سلامت سرور، پردازنده، رم و سرویس‌های فعال VPS"
          >
            <Activity size={16} />
            <span>سلامت سرور (VPS Health)</span>
          </button>

          {/* Quick Site Mode Indicator Button */}
          <button 
            type="button"
            onClick={() => setActiveSection('settings')}
            className="btn btn-glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.825rem',
              fontWeight: '600',
              borderColor: (settingsForm.site_mode ?? 'demo') === 'demo' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)',
              background: (settingsForm.site_mode ?? 'demo') === 'demo' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: (settingsForm.site_mode ?? 'demo') === 'demo' ? '#f59e0b' : '#10b981'
            }}
            title="برای مشاهده و تغییر وضعیت استقرار سایت کلیک کنید"
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: (settingsForm.site_mode ?? 'demo') === 'demo' ? '#f59e0b' : '#10b981',
              boxShadow: (settingsForm.site_mode ?? 'demo') === 'demo' ? '0 0 8px #f59e0b' : '0 0 8px #10b981'
            }} />
            <span>وضعیت: {(settingsForm.site_mode ?? 'demo') === 'demo' ? 'آزمایشی (Demo)' : 'عملیاتی (Live)'}</span>
          </button>

          {activeSection === 'blog' ? (
            <button className="btn btn-primary" onClick={handleOpenAddBlogPost}>
              <Plus size={18} /> افزودن مقاله جدید
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleOpenAddProduct}>
              <Plus size={18} /> افزودن محصول جدید
            </button>
          )}
        </div>
      </div>

      {/* 1. Categorized Admin Navigation Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {ADMIN_CATEGORIES.map(cat => {
          const isCatActive = cat.id === activeCategoryId;
          const IconComp = cat.icon;
          return (
            <div
              key={cat.id}
              className="glass-panel"
              onClick={() => handleSelectCategory(cat)}
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                background: isCatActive 
                  ? 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%)' 
                  : '#ffffff',
                borderColor: isCatActive ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                borderWidth: isCatActive ? '2px' : '1px',
                borderStyle: 'solid',
                boxShadow: isCatActive 
                  ? '0 8px 24px -4px rgba(2, 132, 199, 0.18), 0 0 0 1px rgba(2, 132, 199, 0.1)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.03)',
                transform: isCatActive ? 'translateY(-2px)' : 'none'
              }}
            >
              <div 
                style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: isCatActive 
                    ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' 
                    : '#f8fafc',
                  border: isCatActive ? 'none' : '1px solid var(--border-glass)',
                  color: isCatActive ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: isCatActive ? '0 4px 14px hsla(var(--accent-cyan), 0.35)' : 'none',
                  flexShrink: 0
                }}
              >
                <IconComp size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isCatActive ? 'hsl(var(--accent-cyan))' : 'var(--text-primary)' }}>
                    {cat.title}
                  </h3>
                  {cat.badge ? (
                    <span style={{
                      fontSize: '0.7rem',
                      background: cat.badgeColor || '#ef4444',
                      color: '#ffffff',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)'
                    }}>
                      {cat.badge}
                    </span>
                  ) : (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      color: isCatActive ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)', 
                      fontWeight: 700,
                      background: isCatActive ? 'rgba(2, 132, 199, 0.12)' : '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      border: isCatActive ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid var(--border-glass)'
                    }}>
                      {cat.tabs.length} بخش
                    </span>
                  )}
                </div>
                <div style={{ 
                  fontSize: '0.725rem', 
                  color: isCatActive ? '#0284c7' : 'var(--text-secondary)', 
                  fontWeight: isCatActive ? 600 : 400,
                  marginTop: '3px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {cat.enTitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Sub-Tabs Bar for Selected Category */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '10px 14px', 
          marginBottom: '32px', 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          alignItems: 'center',
          borderRadius: '14px',
          background: '#ffffff',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Layers size={14} color="hsl(var(--accent-cyan))" />
          بخش‌های {activeCategoryObj.title}:
        </span>

        {activeCategoryObj.tabs.map(tab => {
          const isTabActive = activeSection === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className="btn"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: isTabActive ? 700 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                background: isTabActive ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : '#f8fafc',
                color: isTabActive ? '#ffffff' : 'var(--text-secondary)',
                border: isTabActive ? 'none' : '1px solid var(--border-glass)',
                boxShadow: isTabActive ? '0 0 14px hsla(var(--accent-cyan), 0.3)' : 'none',
                cursor: 'pointer'
              }}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isTabActive ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                  color: isTabActive ? '#ffffff' : '#475569',
                  fontWeight: 700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. DASHBOARD & RICH ANALYTICS OVERVIEW */}
      {activeSection === 'dashboard' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {statsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>در حال بارگذاری شاخص‌های تحلیلی...</div>
          ) : stats ? (
            <>
              {/* Primary Financial & Operational KPIs */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '80px', height: '80px', background: 'radial-gradient(circle, hsla(var(--accent-cyan), 0.2), transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '8px' }}>درآمد کل حاصل از فروش (تومان)</div>
                  <div className="font-code gradient-text" style={{ fontSize: '1.85rem', fontWeight: 900 }}>
                    {formatPrice(stats.totalRevenue || stats.revenue || 0)}
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'hsl(var(--accent-green))', marginTop: '4px', display: 'block' }}>
                    تراکنش‌های عضو شبکه شتاب و زرین‌پال
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '8px' }}>تعداد کل سفارشات ثبت‌شده</div>
                  <div className="font-code" style={{ fontSize: '1.85rem', fontWeight: 900, color: 'hsl(var(--accent-cyan))' }}>
                    {(stats.totalOrders || stats.ordersTotal || 0).toLocaleString('fa-IR')}
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    {(stats.ordersPaid || stats.paidOrdersCount || 0).toLocaleString('fa-IR')} سفارش پرداخت‌شده
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '8px' }}>محصولات فعال در ویترین</div>
                  <div className="font-code" style={{ fontSize: '1.85rem', fontWeight: 900, color: 'hsl(var(--accent-purple))' }}>
                    {(stats.totalProducts || 0).toLocaleString('fa-IR')}
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    با مشخصات کامل و تست آزمایشگاهی
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '8px' }}>موجودی کل لپ‌تاپ‌های انبار</div>
                  <div className="font-code" style={{ fontSize: '1.85rem', fontWeight: 900, color: 'hsl(var(--accent-green))' }}>
                    {(stats.totalStock || 0).toLocaleString('fa-IR')} عدد
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    آماده تحویل فوری و ارسال با تیپاکس
                  </span>
                </div>
              </div>

              {/* Order Fulfillment Pipeline Status */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={18} color="hsl(var(--accent-cyan))" />
                  جریان پردازش و تحویل سفارشات مشتریان (Orders Fulfillment)
                </h3>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-green))', fontWeight: 600 }}>پرداخت شده (Paid)</div>
                    <div className="font-code" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                      {(stats.statusBreakdown?.paid || 0).toLocaleString('fa-IR')}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-cyan))', fontWeight: 600 }}>در حال آماده‌سازی</div>
                    <div className="font-code" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                      {(stats.statusBreakdown?.processing || 0).toLocaleString('fa-IR')}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-purple))', fontWeight: 600 }}>تحویل به پست/تیپاکس</div>
                    <div className="font-code" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                      {(stats.statusBreakdown?.shipped || 0).toLocaleString('fa-IR')}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>تحویل داده شده</div>
                    <div className="font-code" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                      {(stats.statusBreakdown?.delivered || 0).toLocaleString('fa-IR')}
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 600 }}>در انتظار پرداخت</div>
                    <div className="font-code" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                      {(stats.statusBreakdown?.pending || 0).toLocaleString('fa-IR')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Analytics: Logistics, Appointments & Reviews */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* Logistics Pulse */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={18} color="hsl(var(--accent-cyan))" /> لجستیک و انبارداری
                    </h3>
                    <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveSection('inventory')}>
                      مدیریت انبار ←
                    </button>
                  </div>
                  <div className="flex" style={{ flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>رسیدهای ورود بار جدید:</span>
                      <strong className="font-code">{(stats.inboundShipments || 0).toLocaleString('fa-IR')} بارنامه</strong>
                    </div>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>حواله‌های خروج و ارسال مرسوله:</span>
                      <strong className="font-code">{(stats.outboundShipments || 0).toLocaleString('fa-IR')} مرسوله</strong>
                    </div>
                  </div>
                </div>

                {/* Showroom & Service Appointments Pulse */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={18} color="hsl(var(--accent-purple))" /> نوبت‌های تست شوروم و خدمات
                    </h3>
                    <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveSection('appointments')}>
                      مشاهده نوبت‌ها ←
                    </button>
                  </div>
                  <div className="flex" style={{ flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>کل نوبت‌های رزرو شده:</span>
                      <strong className="font-code">{(stats.appointmentsTotal || 0).toLocaleString('fa-IR')} نوبت</strong>
                    </div>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>در انتظار بررسی و هماهنگی:</span>
                      <strong className="font-code" style={{ color: '#f59e0b' }}>{(stats.pendingAppointments || 0).toLocaleString('fa-IR')} نوبت</strong>
                    </div>
                  </div>
                </div>

                {/* Content & Community Pulse */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="#ec4899" /> نقد، مقالات و دیدگاه‌ها
                    </h3>
                    <button className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveSection('blog')}>
                      مدیریت مقالات ←
                    </button>
                  </div>
                  <div className="flex" style={{ flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>مقالات و بررسی‌های ویدیویی:</span>
                      <strong className="font-code">{(stats.totalBlogPosts || 0).toLocaleString('fa-IR')} مقاله</strong>
                    </div>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>دیدگاه‌های کاربران در انتظار تایید:</span>
                      <strong className="font-code" style={{ color: stats.pendingComments > 0 ? '#ef4444' : 'hsl(var(--accent-green))' }}>
                        {(stats.pendingComments || 0).toLocaleString('fa-IR')} دیدگاه
                      </strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Low stock alerts */}
              {stats.lowStock && stats.lowStock.length > 0 && (
                <div className="glass-card" style={{ padding: '24px', borderColor: 'hsla(var(--accent-red), 0.3)' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.125rem', margin: 0, color: 'hsl(var(--accent-red))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={20} /> هشدارهای موجودی انبار (رو به اتمام - کمتر از ۵ دستگاه)
                    </h3>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem' }} onClick={() => setActiveSection('inventory')}>
                      ثبت ورود بار جدید به انبار
                    </button>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {stats.lowStock.map(ls => (
                      <div key={ls.id} className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ls.name}</span>
                        <span className="badge" style={{ background: 'hsla(var(--accent-red), 0.15)', color: 'hsl(var(--accent-red))' }}>
                          تنها {ls.stock} عدد موجود
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Action Shortcuts */}
              <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ⚡ دسترسی‌های سریع و عملیات پرکاربرد مدیریت:
                </span>
                <div className="flex" style={{ gap: '10px', flexWrap: 'wrap' }}>
                  <button className="btn btn-glass" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => setActiveSection('inventory')}>
                    <ArrowDownLeft size={15} color="hsl(var(--accent-green))" /> ورود بار جدید
                  </button>
                  <button className="btn btn-glass" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => handleOpenBarcode(null)}>
                    <BarcodeIcon size={15} color="hsl(var(--accent-purple))" /> چاپ لیبل بارکد
                  </button>
                  <button className="btn btn-glass" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={handleOpenAddProduct}>
                    <Plus size={15} color="hsl(var(--accent-cyan))" /> افزودن لپ‌تاپ جدید
                  </button>
                  <button className="btn btn-glass" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={handleOpenAddBlogPost}>
                    <BookOpen size={15} color="#ec4899" /> مقاله نقد و بررسی
                  </button>
                </div>
              </div>

            </>
          ) : null}
        </div>
      )}

      {/* 1.1 VIEWER ANALYTICS & GOOGLE TRAFFIC VIEW */}
      {activeSection === 'viewer_analytics' && (
        <ViewerAnalytics 
          authToken={authToken} 
          onGoToSeoSettings={() => setActiveSection('settings')} 
        />
      )}

      {/* MARKETING: COUPONS & DISCOUNT MANAGEMENT */}
      {activeSection === 'coupons' && (
        <CouponManager authToken={authToken} />
      )}

      {/* HOME PAGE CUSTOMIZER */}
      {activeSection === 'home_customizer' && (
        <HomeCustomizer authToken={authToken} />
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
                        {(() => {
                          const { cpuBadge, gpuBadge } = getHardwareBadges(p);
                          return (
                            <div className="flex" style={{ gap: '6px', marginTop: '4px' }}>
                              <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)' }}>
                                CPU: {cpuBadge}
                              </span>
                              <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)' }}>
                                GPU: {gpuBadge}
                              </span>
                            </div>
                          );
                        })()}
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
                            style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px', borderColor: 'hsla(var(--accent-purple), 0.3)' }}
                            onClick={() => handleOpenBarcode(p)}
                            title="چاپ بارکد و لیبل حرارتی کالا"
                          >
                            <BarcodeIcon size={13} color="hsl(var(--accent-purple))" /> بارکد
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

      {/* 2.2. INVENTORY & LOGISTICS MANAGEMENT */}
      {activeSection === 'inventory' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Bar with Barcode Trigger */}
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={24} color="hsl(var(--accent-cyan))" />
                مدیریت زنجیره تامین، انبارداری و لجستیک تک‌تینک
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
                ثبت ورود کالای جدید، حواله خروج و ارسال تیپاکس/پست، ردگیری موجودی و چاپ بارکد حرارتی
              </p>
            </div>

            <div className="flex" style={{ gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' }}
                onClick={() => handleOpenBarcode(null)}
              >
                <BarcodeIcon size={18} /> سازنده و چاپ بارکد کالا (Barcode Hub)
              </button>
            </div>
          </div>

          {shipmentMessage && (
            <div style={{ 
              padding: '14px 18px', 
              borderRadius: '12px', 
              background: shipmentMessage.type === 'success' ? 'hsla(var(--accent-green), 0.15)' : 'rgba(239, 68, 68, 0.15)', 
              color: shipmentMessage.type === 'success' ? 'hsl(var(--accent-green))' : '#ef4444', 
              border: `1px solid ${shipmentMessage.type === 'success' ? 'hsla(var(--accent-green), 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              {shipmentMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>{shipmentMessage.text}</span>
            </div>
          )}

          {/* Sub Navigation */}
          <div className="flex" style={{ gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <button
              type="button"
              className="btn btn-glass"
              style={{
                background: inventorySubTab === 'inbound' ? 'hsla(var(--accent-green), 0.15)' : 'transparent',
                borderColor: inventorySubTab === 'inbound' ? 'hsl(var(--accent-green))' : 'var(--border-glass)',
                color: inventorySubTab === 'inbound' ? 'hsl(var(--accent-green))' : 'var(--text-secondary)',
                fontWeight: inventorySubTab === 'inbound' ? 700 : 500
              }}
              onClick={() => setInventorySubTab('inbound')}
            >
              <ArrowDownLeft size={16} /> ثبت ورود بار جدید (خرید و شارژ انبار)
            </button>

            <button
              type="button"
              className="btn btn-glass"
              style={{
                background: inventorySubTab === 'outbound' ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
                borderColor: inventorySubTab === 'outbound' ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                color: inventorySubTab === 'outbound' ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)',
                fontWeight: inventorySubTab === 'outbound' ? 700 : 500
              }}
              onClick={() => setInventorySubTab('outbound')}
            >
              <ArrowUpRight size={16} /> ثبت حواله خروج و ارسال مرسوله (تیپاکس/پست)
            </button>

            <button
              type="button"
              className="btn btn-glass"
              style={{
                background: inventorySubTab === 'history' ? 'hsla(var(--accent-purple), 0.15)' : 'transparent',
                borderColor: inventorySubTab === 'history' ? 'hsl(var(--accent-purple))' : 'var(--border-glass)',
                color: inventorySubTab === 'history' ? 'hsl(var(--accent-purple))' : 'var(--text-secondary)',
                fontWeight: inventorySubTab === 'history' ? 700 : 500
              }}
              onClick={() => setInventorySubTab('history')}
            >
              <FileText size={16} /> تاریخچه حواله‌ها و گردش کالا ({stockLog.length})
            </button>
          </div>

          {/* INBOUND SHIPMENT FORM */}
          {inventorySubTab === 'inbound' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <div className="flex" style={{ alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownLeft size={20} color="hsl(var(--accent-green))" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>رسید ورود بار جدید به انبار تک‌تینک</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>تعداد وارد شده مستقیماً به موجودی فعال سایت اضافه خواهد شد</span>
                </div>
              </div>

              <form onSubmit={handleInboundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      انتخاب کالا <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      required
                      value={inboundForm.product_id}
                      onChange={e => setInboundForm({ ...inboundForm, product_id: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- انتخاب دستگاه از انبار --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.brand} {p.model} (موجودی فعلی: {p.stock} عدد)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      تعداد دستگاه دریافتی <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={inboundForm.quantity}
                      onChange={e => setInboundForm({ ...inboundForm, quantity: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      نام تامین‌کننده / بازرگانی
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: بازرگانی پارس آریا دبی"
                      value={inboundForm.supplier_name}
                      onChange={e => setInboundForm({ ...inboundForm, supplier_name: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      کد بچ یا شماره کوتاژ گمرکی
                    </label>
                    <input
                      type="text"
                      placeholder="BATCH-2026-X1"
                      className="font-code"
                      value={inboundForm.batch_code}
                      onChange={e => setInboundForm({ ...inboundForm, batch_code: e.target.value })}
                      style={{ width: '100%', direction: 'ltr' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      بهای تمام‌شده هر واحد (تومان)
                    </label>
                    <input
                      type="number"
                      placeholder="مثال: 45000000"
                      value={inboundForm.unit_cost}
                      onChange={e => setInboundForm({ ...inboundForm, unit_cost: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      موقعیت و شماره قفسه در انبار
                    </label>
                    <input
                      type="text"
                      placeholder="قفسه A-3 ردیف ۲"
                      value={inboundForm.shelf_location}
                      onChange={e => setInboundForm({ ...inboundForm, shelf_location: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    توضیحات و گزارش سلامت فیزیکی بار
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: کارتن‌ها پلمپ، بدون آسیب، پارت نامبر اروپا"
                    value={inboundForm.notes}
                    onChange={e => setInboundForm({ ...inboundForm, notes: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={submittingShipment}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', background: 'hsl(var(--accent-green))', color: '#000', fontWeight: 700 }}
                  >
                    <ArrowDownLeft size={16} /> {submittingShipment ? 'در حال ثبت...' : 'ثبت قطعی ورود کالا و افزایش موجودی'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* OUTBOUND SHIPMENT FORM */}
          {inventorySubTab === 'outbound' && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <div className="flex" style={{ alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={20} color="hsl(var(--accent-cyan))" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>صدور حواله خروج و ارسال سفارش (Logistics Dispatch)</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>تعداد خارج شده بلافاصله از موجودی سیستم کسر خواهد شد</span>
                </div>
              </div>

              <form onSubmit={handleOutboundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      انتخاب کالا <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      required
                      value={outboundForm.product_id}
                      onChange={e => setOutboundForm({ ...outboundForm, product_id: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- انتخاب دستگاه --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.brand} {p.model} (موجودی فعلی: {p.stock} عدد)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      تعداد ارسال <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={outboundForm.quantity}
                      onChange={e => setOutboundForm({ ...outboundForm, quantity: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      شرکت حمل و روش ارسال
                    </label>
                    <select
                      value={outboundForm.courier}
                      onChange={e => setOutboundForm({ ...outboundForm, courier: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="تیپاکس (Tipax)">تیپاکس (Tipax)</option>
                      <option value="پست پیشتاز">پست پیشتاز</option>
                      <option value="چاپار (Chapar)">چاپار (Chapar)</option>
                      <option value="پیک موتوری ویژه اصفهان">پیک موتوری ویژه اصفهان</option>
                      <option value="تحویل حضوری در شوروم">تحویل حضوری در شوروم</option>
                      <option value="باربری هوایی / اتوبوسی">باربری هوایی / اتوبوسی</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      کد رهگیری / بارنامه (Waybill)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: TPX-98402187"
                      className="font-code"
                      value={outboundForm.tracking_number}
                      onChange={e => setOutboundForm({ ...outboundForm, tracking_number: e.target.value })}
                      style={{ width: '100%', direction: 'ltr' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      نام تحویل‌گیرنده / مشتری
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: مهندس رادمهر"
                      value={outboundForm.recipient_name}
                      onChange={e => setOutboundForm({ ...outboundForm, recipient_name: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                      شهر و استان مقصد
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: اصفهان"
                      value={outboundForm.destination}
                      onChange={e => setOutboundForm({ ...outboundForm, destination: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                    شماره فاکتور یا توضیحات مرسوله
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: سفارش اینترنتی #۱۰۴۲ - بسته‌بندی ضد ضربه حبابدار"
                    value={outboundForm.notes}
                    onChange={e => setOutboundForm({ ...outboundForm, notes: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={submittingShipment}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' }}
                  >
                    <ArrowUpRight size={16} /> {submittingShipment ? 'در حال ثبت...' : 'صدور حواله خروج و کسر از انبار'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* HISTORY & AUDIT LOG */}
          {inventorySubTab === 'history' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>
                دفتر کل گردش موجودی انبار (Stock Movement Audit Trail)
              </h3>

              {stockLogLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>در حال بارگذاری لاگ انبار...</div>
              ) : stockLog.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  هنوز هیچ رکورد گردشی ثبت نشده است.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                        <th style={{ padding: '10px' }}>زمان</th>
                        <th style={{ padding: '10px' }}>محصول</th>
                        <th style={{ padding: '10px' }}>نوع عملیات</th>
                        <th style={{ padding: '10px' }}>تغییر موجودی</th>
                        <th style={{ padding: '10px' }}>موجودی قبل / بعد</th>
                        <th style={{ padding: '10px' }}>شرح و مرجع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockLog.map((log, idx) => (
                        <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }} className="font-code">{log.timestamp}</td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>{log.product_name || `محصول #${log.product_id}`}</td>
                          <td style={{ padding: '10px' }}>
                            <span className="badge" style={{
                              background: log.change_amount > 0 ? 'hsla(var(--accent-green), 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: log.change_amount > 0 ? 'hsl(var(--accent-green))' : '#ef4444'
                            }}>
                              {log.change_amount > 0 ? 'ورود به انبار' : 'خروج از انبار'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontWeight: 800 }} className="font-code">
                            {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount} عدد
                          </td>
                          <td style={{ padding: '10px' }} className="font-code">
                            {log.old_stock} ← <strong>{log.new_stock}</strong>
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                            {log.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 2.3. APPOINTMENTS & SERVICES MANAGEMENT */}
      {activeSection === 'appointments' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={24} color="hsl(var(--accent-purple))" />
                مدیریت نوبت‌ها، تست حضوری و خدمات ارتقا
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0' }}>
                بررسی درخواست‌های بازدید در شوروم، ارتقای سخت‌افزاری و پذیرش گارانتی
              </p>
            </div>

            <div className="flex" style={{ gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="جستجو با نام، موبایل یا کد RES..."
                  value={appointmentSearch}
                  onChange={e => setAppointmentSearch(e.target.value)}
                  style={{ paddingRight: '36px', width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={appointmentFilter}
                onChange={e => setAppointmentFilter(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">همه دسته‌ها</option>
                <option value="showcase">تست حضوری لپ‌تاپ</option>
                <option value="upgrade">ارتقا و سرویس سیستم</option>
                <option value="warranty">پذیرش گارانتی</option>
              </select>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            {appointmentsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>در حال بارگذاری نوبت‌ها...</div>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                هیچ نوبت یا درخواست خدماتی ثبت نشده است.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                      <th style={{ padding: '12px 10px' }}>کد رهگیری</th>
                      <th style={{ padding: '12px 10px' }}>مشتری</th>
                      <th style={{ padding: '12px 10px' }}>شماره تماس</th>
                      <th style={{ padding: '12px 10px' }}>نوع خدمت</th>
                      <th style={{ padding: '12px 10px' }}>زمان رزرو</th>
                      <th style={{ padding: '12px 10px' }}>دستگاه / توضیحات</th>
                      <th style={{ padding: '12px 10px' }}>وضعیت</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments
                      .filter(a => {
                        if (appointmentFilter !== 'all' && a.appointment_type !== appointmentFilter) return false;
                        if (appointmentSearch.trim()) {
                          const q = appointmentSearch.toLowerCase();
                          return (
                            a.tracking_code?.toLowerCase().includes(q) ||
                            a.customer_name?.toLowerCase().includes(q) ||
                            a.customer_phone?.includes(q) ||
                            a.product_name?.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((a, idx) => (
                        <tr key={a.id || idx} style={{ borderBottom: '1px solid var(--border-glass)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong className="font-code" style={{ color: 'hsl(var(--accent-cyan))' }}>{a.tracking_code}</strong>
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: 700 }}>{a.customer_name}</td>
                          <td style={{ padding: '12px 10px' }} className="font-code" dir="ltr">{a.customer_phone}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className="badge" style={{
                              background: a.appointment_type === 'showcase' ? 'hsla(var(--accent-cyan), 0.15)' : a.appointment_type === 'upgrade' ? 'hsla(var(--accent-purple), 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: a.appointment_type === 'showcase' ? 'hsl(var(--accent-cyan))' : a.appointment_type === 'upgrade' ? 'hsl(var(--accent-purple))' : '#ef4444'
                            }}>
                              {a.appointment_type === 'showcase' ? 'تست حضوری' : a.appointment_type === 'upgrade' ? 'ارتقای سیستم' : 'گارانتی'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{a.preferred_date}</div>
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{a.preferred_time}</span>
                          </td>
                          <td style={{ padding: '12px 10px', maxWidth: '240px' }}>
                            {a.product_name && <div style={{ fontWeight: 600, color: 'hsl(var(--accent-cyan))' }}>{a.product_name}</div>}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.notes || '—'}</span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={a.status}
                              onChange={e => updateAppointmentStatus(a.id, e.target.value)}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.75rem', 
                                borderRadius: '6px',
                                background: a.status === 'confirmed' ? 'hsla(var(--accent-green), 0.2)' : a.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.2)'
                              }}
                            >
                              <option value="pending">در انتظار بررسی</option>
                              <option value="confirmed">تایید شده</option>
                              <option value="in_progress">در حال سرویس</option>
                              <option value="completed">تکمیل و تحویل داده شد</option>
                              <option value="cancelled">لغو شده</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'left' }}>
                            <button
                              type="button"
                              className="btn btn-glass"
                              style={{ padding: '4px 8px', color: 'hsl(var(--accent-red))' }}
                              onClick={() => deleteAppointment(a.id)}
                              title="حذف رکورد نوبت"
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

        </div>
      )}

      {/* 2.5. BLOG MANAGEMENT */}
      {activeSection === 'blog' && (
        <div className="animate-fade-in">
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="جستجو در عنوان یا دسته..."
                  value={blogSearch}
                  onChange={e => setBlogSearch(e.target.value)}
                  style={{ paddingRight: '36px', width: '100%' }}
                />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {blogPosts.length} مقاله ثبت شده
              </span>
            </div>

            <button className="btn btn-primary" onClick={handleOpenAddBlogPost}>
              <Plus size={18} /> افزودن مقاله جدید
            </button>
          </div>

          {blogLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              در حال بارگذاری مقالات...
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <BookOpen size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3>هنوز مقاله‌ای در وبلاگ ثبت نشده است</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                با نوشتن مقالات تخصصی و راهنمای خرید، سئو و ترافیک فروشگاه تک‌تینک را افزایش دهید.
              </p>
              <button className="btn btn-primary" onClick={handleOpenAddBlogPost}>
                <Plus size={18} /> اولین مقاله را بنویسید
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {blogPosts
                .filter(p => !blogSearch || p.title?.toLowerCase().includes(blogSearch.toLowerCase()) || p.category?.toLowerCase().includes(blogSearch.toLowerCase()))
                .map(post => (
                  <div key={post.id} className="glass-card flex" style={{ flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden' }}>
                      <img
                        src={post.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span className="badge" style={{ position: 'absolute', top: '10px', right: '10px', background: 'hsl(var(--accent-cyan))', color: '#fff' }}>
                        {post.category || 'تکنولوژی'}
                      </span>
                      <span className="badge" style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: (post.published !== 0 && post.published !== false) ? 'hsla(var(--accent-green), 0.2)' : 'rgba(100,100,100,0.5)',
                        color: (post.published !== 0 && post.published !== false) ? 'hsl(var(--accent-green))' : '#ccc',
                        border: '1px solid currentColor'
                      }}>
                        {(post.published !== 0 && post.published !== false) ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </div>

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div className="flex" style={{ gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.read_time || post.readTime || '۵ دقیقه'}</span>
                        <span>•</span>
                        <span>{post.author || 'تک‌تینک'}</span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', lineHeight: '1.5' }}>
                        {post.title}
                      </h3>

                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                        marginBottom: '16px',
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {post.excerpt || 'بدون خلاصه'}
                      </p>

                      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
                        <button
                          className="btn btn-glass"
                          style={{ padding: '6px 14px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleOpenEditBlogPost(post)}
                        >
                          <Edit size={14} /> ویرایش
                        </button>
                        <button
                          className="btn btn-glass"
                          style={{ padding: '6px 12px', fontSize: '0.8125rem', color: 'hsl(var(--accent-red))' }}
                          onClick={() => handleDeleteBlogPost(post.id, post.title)}
                          title="حذف مقاله"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
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
                  <th style={{ padding: '12px' }}>کد رهگیری پستی (پست / تیپاکس)</th>
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
                        background: o.status === 'paid' ? 'hsla(var(--accent-green), 0.15)' : o.status === 'shipped' ? 'hsla(var(--accent-purple), 0.15)' : 'hsla(var(--accent-cyan), 0.15)',
                        color: o.status === 'paid' ? 'hsl(var(--accent-green))' : o.status === 'shipped' ? 'hsl(var(--accent-purple))' : 'hsl(var(--accent-cyan))'
                      }}>
                        {o.status === 'paid' ? 'پرداخت شده' : o.status === 'shipped' ? 'ارسال شده به پست' : o.status === 'delivered' ? 'تحویل شده' : o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }} className="font-code">{o.payment?.refId || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="کد ۲۴ رقمی پست"
                          value={trackingInputs[o.id] !== undefined ? trackingInputs[o.id] : (o.trackingCode || '')}
                          onChange={e => setTrackingInputs({ ...trackingInputs, [o.id]: e.target.value })}
                          className="font-code"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', width: '145px', direction: 'ltr' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => saveOrderTracking(o.id)}
                          disabled={savingTrackingId === o.id}
                          style={{ padding: '5px 8px', fontSize: '0.75rem', lineHeight: 1 }}
                          title="ذخیره کد رهگیری پستی"
                        >
                          <Save size={13} />
                        </button>
                      </div>
                    </td>
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

      {/* 3.1. WARRANTIES & CERTIFICATE ISSUANCE */}
      {activeSection === 'warranties' && (
        <WarrantyManager authToken={authToken} products={products} />
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
          
          {/* Main SQLite Export & Import Panel */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', border: '1px solid hsla(var(--accent-cyan), 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database size={24} color="hsl(var(--accent-cyan))" />
                  مدیریت و انتقال پایگاه‌داده SQLite (خروجی و ورود کامل techtink.db)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0 0' }}>
                  پشتیبان‌گیری، دانلود فایل خام دیتابیس، جایگزینی (Import) و راهنمای انتقال مستقیم روی سرور (VPS)
                </p>
              </div>

              {dbInfo && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', padding: '6px 12px' }}>
                    حجم فعلی: {dbInfo.sizeFormatted}
                  </span>
                  <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.15)', color: 'hsl(var(--accent-purple))', padding: '6px 12px' }}>
                    موتور: {dbInfo.driver}
                  </span>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px 12px' }}>
                    {dbInfo.tablesCount} جدول • {dbInfo.totalRecords} رکورد
                  </span>
                </div>
              )}
            </div>

            {/* Notifications */}
            {importDbSuccess && (
              <div className="animate-fade-in" style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} />
                <span>{importDbSuccess}</span>
              </div>
            )}

            {importDbError && (
              <div className="animate-fade-in" style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertOctagon size={20} />
                <span>{importDbError}</span>
              </div>
            )}

            {dbMessage && (
              <div className="animate-fade-in" style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsla(var(--accent-cyan), 0.1)', color: 'hsl(var(--accent-cyan))', marginBottom: '18px', fontWeight: 'bold' }}>
                {dbMessage}
              </div>
            )}

            {/* Action Cards: 1. Export, 2. Import */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              {/* Box 1: Export DB */}
              <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'hsla(var(--accent-cyan), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Download size={20} color="hsl(var(--accent-cyan))" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem' }}>خروجی و دانلود فایل دیتابیس (Export .db)</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>دانلود نسخه کامل techtink.db با تمام جداول و داده‌ها</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.835rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                    یک فایل استاندارد SQLite با فرمت <code className="font-code">.db</code> به صورت ایزوله و کامل (با اعمال VACUUM و ثبت تمام تراکنش‌ها) ایجاد و مستقیماً روی رایانه شما دانلود می‌شود.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleExportLiveDb}
                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.875rem', gap: '8px', justifyContent: 'center' }}
                  >
                    <Download size={16} /> دانلود مستقیم فایل techtink.db
                  </button>
                  <button
                    type="button"
                    className="btn btn-glass"
                    onClick={handleCreateBackup}
                    disabled={creatingBackup}
                    style={{ padding: '10px 14px', fontSize: '0.85rem', gap: '6px' }}
                    title="ایجاد نسخه پشتیبان در پوشه سرور"
                  >
                    <Save size={15} /> {creatingBackup ? 'در حال ذخیره...' : 'پشتیبان در سرور'}
                  </button>
                </div>
              </div>

              {/* Box 2: Import DB */}
              <div className="glass-panel" style={{ padding: '22px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={20} color="#f59e0b" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem' }}>ورود و جایگزینی فایل دیتابیس (Import .db)</h4>
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>بارگذاری دیتابیس جدید و فعال‌سازی فوری</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.835rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                    فایل دیتابیس SQLite پشتیبان خود را انتخاب کنید. سیستم ابتدا یک نسخه پشتیبان ایمن از وضعیت فعلی ذخیره کرده و سپس دیتابیس جدید را فعال می‌نماید.
                  </p>
                </div>

                <div>
                  <label 
                    className={`btn ${importingDb ? 'btn-glass' : 'btn-primary'}`}
                    style={{ 
                      width: '100%', 
                      padding: '10px 16px', 
                      fontSize: '0.875rem', 
                      gap: '8px', 
                      justifyContent: 'center',
                      background: importingDb ? undefined : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                      cursor: importingDb ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Upload size={16} />
                    <span>{importingDb ? 'در حال آپلود و اعتبارسنجی دیتابیس...' : 'انتخاب و آپلود فایل .db'}</span>
                    <input 
                      type="file" 
                      accept=".db,.sqlite,.sqlite3" 
                      onChange={handleImportDbFile}
                      disabled={importingDb}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Quick Maintenance & CSV Export Bar */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>نگهداری و گزارش‌گیری:</span>
              <button className="btn btn-glass" onClick={() => triggerDbMaintenance('vacuum')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <RefreshCw size={14} /> فشرده‌سازی و بهینه‌سازی (VACUUM)
              </button>
              <button className="btn btn-glass" onClick={() => triggerDbMaintenance('integrity')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <Shield size={14} /> تست سلامت ساختار (Integrity Check)
              </button>
              <a href={`/api/admin/db/export/products?format=csv&token=${encodeURIComponent(authToken)}`} download className="btn btn-glass" style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none' }}>
                <Download size={14} /> اکسل کاتالوگ محصولات (CSV)
              </a>
              <a href={`/api/admin/db/export/orders?format=csv&token=${encodeURIComponent(authToken)}`} download className="btn btn-glass" style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none' }}>
                <Download size={14} /> اکسل لیست سفارشات (CSV)
              </a>
              <button 
                type="button" 
                className="btn btn-glass"
                onClick={() => setShowVpsGuide(prev => !prev)}
                style={{ marginRight: 'auto', fontSize: '0.8rem', padding: '6px 12px', color: 'hsl(var(--accent-cyan))', gap: '6px' }}
              >
                <Terminal size={14} /> {showVpsGuide ? 'بستن راهنمای VPS' : 'دستورات ترمینال سرور (VPS Guide)'}
              </button>
            </div>

            {/* VPS Terminal Helper Guide */}
            {showVpsGuide && (
              <div className="animate-fade-in" style={{ marginTop: '20px', padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '1px solid var(--border-glass)' }}>
                <h4 style={{ fontSize: '0.95rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} color="hsl(var(--accent-cyan))" />
                  راهنمای مدیریت مستقیم فایل پایگاه‌داده روی سرور لینوکس (VPS / Ubuntu)
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.825rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>مسیر ذخیره‌سازی فایل اصلی دیتابیس روی سرور:</span>
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '8px', direction: 'ltr', textAlign: 'left', fontFamily: 'var(--font-code)', marginTop: '4px' }}>
                      {dbInfo?.dbPath || '/var/www/techtink/data/techtink.db'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>۱. تهیه نسخه پشتیبان سریع در ترمینال سرور:</span>
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '8px', direction: 'ltr', textAlign: 'left', fontFamily: 'var(--font-code)', marginTop: '4px' }}>
                      sqlite3 data/techtink.db &quot;.backup data/backups/manual_backup.db&quot;
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>۲. ارسال فایل دیتابیس از کامپیوتر شخصی به سرور VPS با SCP:</span>
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '8px', direction: 'ltr', textAlign: 'left', fontFamily: 'var(--font-code)', marginTop: '4px' }}>
                      scp ./techtink.db root@YOUR_VPS_IP:/path/to/techtink/data/techtink.db
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>۳. ساخت یا بازیابی حساب مدیر (Admin) در سرور:</span>
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '8px', direction: 'ltr', textAlign: 'left', fontFamily: 'var(--font-code)', marginTop: '4px' }}>
                      bun scripts/create-admin.js --email admin@techtink.ir --password mySecretPass123
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>۴. ری‌استارت سرویس تک‌تینک در صورت نیاز:</span>
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '8px', direction: 'ltr', textAlign: 'left', fontFamily: 'var(--font-code)', marginTop: '4px' }}>
                      systemctl restart techtink.service
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Server Backups Archive */}
          {dbBackups.length > 0 && (
            <div className="glass-card animate-fade-in" style={{ padding: '24px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={18} color="hsl(var(--accent-purple))" />
                  آرشیو نسخه‌های پشتیبان موجود روی سرور ({dbBackups.length} نسخه)
                </h3>
                <button type="button" className="btn btn-glass" onClick={loadDbBackups} style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}>
                  <RefreshCw size={12} className={loadingBackups ? 'spin' : ''} /> به‌روزرسانی لیست
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                      <th style={{ padding: '10px' }}>نام فایل نسخه پشتیبان</th>
                      <th style={{ padding: '10px' }}>حجم فایل</th>
                      <th style={{ padding: '10px' }}>تاریخ ایجاد</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbBackups.map((b) => (
                      <tr key={b.name} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '10px' }} className="font-code">{b.name}</td>
                        <td style={{ padding: '10px' }} className="font-code">{(b.size / (1024 * 1024)).toFixed(2)} MB</td>
                        <td style={{ padding: '10px' }}>{new Date(b.createdAt).toLocaleString('fa-IR')}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            <a 
                              href={`/api/admin/db/backups/${encodeURIComponent(b.name)}?token=${encodeURIComponent(authToken)}`} 
                              download 
                              className="btn btn-glass"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px', textDecoration: 'none' }}
                              title="دانلود این نسخه"
                            >
                              <Download size={13} /> دانلود
                            </a>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleRestoreBackup(b.name)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                              title="بازیابی این فایل به عنوان دیتابیس فعال"
                            >
                              <RefreshCw size={13} /> بازیابی
                            </button>
                            <button
                              type="button"
                              className="btn btn-glass"
                              onClick={() => handleDeleteBackup(b.name)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                              title="حذف نسخه پشتیبان"
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
                    background: selectedTable === t.name ? 'rgba(2, 132, 199, 0.12)' : '#ffffff',
                    borderColor: selectedTable === t.name ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                    color: selectedTable === t.name ? '#0284c7' : 'var(--text-secondary)',
                    fontWeight: selectedTable === t.name ? 700 : 500,
                    boxShadow: selectedTable === t.name ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
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
          
          {/* Site Status & Demo Mode Management Card */}
          <div className="glass-card" style={{ 
            padding: '32px', 
            position: 'relative',
            overflow: 'hidden',
            border: (settingsForm.site_mode ?? 'demo') === 'demo'
              ? '1px solid rgba(245, 158, 11, 0.45)'
              : '1px solid rgba(16, 185, 129, 0.45)',
            boxShadow: (settingsForm.site_mode ?? 'demo') === 'demo'
              ? '0 10px 40px rgba(245, 158, 11, 0.12)'
              : '0 10px 40px rgba(16, 185, 129, 0.12)'
          }}>
            {/* Ambient accent top bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: (settingsForm.site_mode ?? 'demo') === 'demo'
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #10b981, #06b6d4)'
            }} />

            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <ShieldCheck size={26} color={(settingsForm.site_mode ?? 'demo') === 'demo' ? '#f59e0b' : '#10b981'} />
                  <h2 style={{ fontSize: '1.45rem', margin: 0 }}>وضعیت استقرار و فاز اجرایی سایت</h2>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    background: (settingsForm.site_mode ?? 'demo') === 'demo' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                    color: (settingsForm.site_mode ?? 'demo') === 'demo' ? '#f59e0b' : '#10b981',
                    border: (settingsForm.site_mode ?? 'demo') === 'demo' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)'
                  }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: (settingsForm.site_mode ?? 'demo') === 'demo' ? '#f59e0b' : '#10b981',
                      boxShadow: (settingsForm.site_mode ?? 'demo') === 'demo' ? '0 0 8px #f59e0b' : '0 0 8px #10b981'
                    }} />
                    {(settingsForm.site_mode ?? 'demo') === 'demo' ? 'حالت آزمایشی فعال (Demo Mode)' : 'حالت عملیاتی و زنده (Operational Mode)'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  از این بخش می‌توانید تعیین کنید سایت به عنوان نسخه آزمایشی به همراه پیام هشدار پاپ‌آپ برای کاربران نمایش داده شود یا به عنوان فروشگاه زنده و عملیاتی فعال باشد.
                </p>
              </div>

              {/* Fast Switch Button */}
              <button 
                type="button"
                className="btn btn-glass"
                disabled={modeSwitchLoading}
                onClick={() => handleSwitchSiteMode((settingsForm.site_mode ?? 'demo') === 'demo' ? 'operational' : 'demo')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                <RefreshCw size={16} className={modeSwitchLoading ? 'spin' : ''} />
                {(settingsForm.site_mode ?? 'demo') === 'demo' ? 'تغییر فوری به حالت عملیاتی (Live)' : 'تغییر فوری به حالت آزمایشی (Demo)'}
              </button>
            </div>

            {/* 2 Big Mode Option Cards */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* Option A: Demo Mode */}
              <div 
                onClick={() => setSettingsForm(prev => ({ ...prev, site_mode: 'demo' }))}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: (settingsForm.site_mode ?? 'demo') === 'demo' ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
                  background: (settingsForm.site_mode ?? 'demo') === 'demo' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f59e0b'
                    }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: (settingsForm.site_mode ?? 'demo') === 'demo' ? '#f59e0b' : 'var(--text-primary)' }}>
                        حالت آزمایشی (Demo Mode)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>تست قابلیت‌ها و پیش‌نمایش</div>
                    </div>
                  </div>
                  {(settingsForm.site_mode ?? 'demo') === 'demo' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '8px' }}>
                      انتخاب شده ✓
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  در این حالت، پاپ‌آپ اطلاع‌رسانی مدرن با ورود کاربر ظاهر می‌شود، نشان آزمایشی در هدر قرار می‌گیرد و کاربران از تستی بودن سفارش‌ها و قیمت‌ها مطلع خواهند شد.
                </p>
              </div>

              {/* Option B: Operational Mode */}
              <div 
                onClick={() => setSettingsForm(prev => ({ ...prev, site_mode: 'operational' }))}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: (settingsForm.site_mode ?? 'demo') === 'operational' ? '2px solid #10b981' : '1px solid var(--border-glass)',
                  background: (settingsForm.site_mode ?? 'demo') === 'operational' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981'
                    }}>
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: (settingsForm.site_mode ?? 'demo') === 'operational' ? '#10b981' : 'var(--text-primary)' }}>
                        حالت عملیاتی و زنده (Operational)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>فروشگاه رسمی و خریدهای واقعی</div>
                    </div>
                  </div>
                  {(settingsForm.site_mode ?? 'demo') === 'operational' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '8px' }}>
                      انتخاب شده ✓
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  سایت آماده فروش رسمی می‌شود. تمامی پیام‌ها و پاپ‌آپ‌های حالت دمو پنهان می‌شوند و درگاه پرداخت و تسویه‌حساب به شکل زنده در خدمت خریداران خواهد بود.
                </p>
              </div>

            </div>

            {/* Demo Notice Configuration Panel */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} color="hsl(var(--accent-cyan))" />
                  شخصی‌سازی متن و ظاهر پاپ‌آپ آزمایشی (Demo Notice Modal)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox"
                      checked={(settingsForm.demo_notice_active ?? '1') === '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, demo_notice_active: e.target.checked ? '1' : '0' })}
                    />
                    نمایش پاپ‌آپ هنگام ورود به سایت
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox"
                      checked={(settingsForm.demo_notice_badge_header ?? '1') === '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, demo_notice_badge_header: e.target.checked ? '1' : '0' })}
                    />
                    نشان وضعیت در نوار بالای سایت (Header)
                  </label>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    عنوان پاپ‌آپ
                  </label>
                  <input 
                    type="text"
                    value={settingsForm.demo_notice_title ?? ''}
                    placeholder="نسخه آزمایشی وب‌سایت تک‌تینک (Demo Mode)"
                    onChange={e => setSettingsForm({ ...settingsForm, demo_notice_title: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    برچسب نشان بالای پاپ‌آپ
                  </label>
                  <input 
                    type="text"
                    value={settingsForm.demo_notice_badge ?? ''}
                    placeholder="حالت آزمایشی / در حال تست"
                    onChange={e => setSettingsForm({ ...settingsForm, demo_notice_badge: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    متن دکمه تأیید و ورود
                  </label>
                  <input 
                    type="text"
                    value={settingsForm.demo_notice_btn ?? ''}
                    placeholder="متوجه شدم، ورود به وب‌سایت"
                    onChange={e => setSettingsForm({ ...settingsForm, demo_notice_btn: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  متن کامل توضیحات پاپ‌آپ برای مراجعین
                </label>
                <textarea 
                  rows={3}
                  value={settingsForm.demo_notice_body ?? ''}
                  placeholder="به فروشگاه تخصصی لپ‌تاپ تک‌تینک خوش آمدید!..."
                  onChange={e => setSettingsForm({ ...settingsForm, demo_notice_body: e.target.value })}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Bottom Actions for Site Status */}
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => setPreviewDemoModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Eye size={16} />
                مشاهده پیش‌نمایش پاپ‌آپ آزمایشی
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={savingSettings}
                onClick={saveSettings}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
              >
                <Save size={16} />
                {savingSettings ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات وضعیت سایت'}
              </button>
            </div>

          </div>

          {/* Google Search Console, XML Sitemap & SEO Card */}
          <div className="glass-card" style={{ padding: '32px', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                <Globe size={26} color="#f59e0b" />
                <div>
                  <h2 style={{ fontSize: '1.45rem', margin: 0 }}>تنظیمات سئو گوگل و سرچ کنسول (Google Search Console & SEO)</h2>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    مدیریت نقشه سایت، اعتبارسنجی مالکیت در گوگل، فایل robots.txt و ابزار‌های ایندکسینگ
                  </span>
                </div>
              </div>

              <div className="flex" style={{ gap: '10px' }}>
                <a 
                  href="https://search.google.com/search-console" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-glass"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> ورود به Google Search Console
                </a>
                <a 
                  href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'https://techtink.ir')}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-glass"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', textDecoration: 'none' }}
                >
                  <Sparkles size={14} /> تست ریچ اسنیپت (Rich Results)
                </a>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.7' }}>
              وب‌سایت تک‌تینک به نقشه سایت داینامیک استاندارد XML مجهز است که به صورت خودکار تمام صفحات لپ‌تاپ‌ها، عکس‌ها و مقالات وبلاگ را برای خزنده‌های گوگل و موتورهای جستجو فهرست می‌کند.
            </p>

            {/* Sitemap & Robots.txt Links */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>آدرس نقشه سایت (XML Sitemap):</div>
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <code className="font-code" style={{ direction: 'ltr', fontSize: '0.85rem', color: '#f59e0b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : '/sitemap.xml'}
                  </code>
                  <a 
                    href="/sitemap.xml" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-glass" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    مشاهده
                  </a>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>آدرس فایل دستورات خزنده‌ها (Robots.txt):</div>
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <code className="font-code" style={{ direction: 'ltr', fontSize: '0.85rem', color: 'hsl(var(--accent-cyan))', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/robots.txt` : '/robots.txt'}
                  </code>
                  <a 
                    href="/robots.txt" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-glass" 
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    مشاهده
                  </a>
                </div>
              </div>
            </div>

            {/* Google Search Console & SEO Fields Form */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  کد تایید مالکیت سرچ کنسول (google-site-verification)
                </label>
                <input 
                  type="text"
                  className="font-code"
                  placeholder="مثال: AbCdEf123456GhiJkLmNoPqRsTuVwXyZ"
                  value={settingsForm.google_site_verification || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, google_site_verification: e.target.value })}
                  style={{ direction: 'ltr' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  کد دریافت‌شده از بخش HTML Tag در پنل Google Search Console
                </span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  شناسه گوگل آنالیتیکس ۴ (Google Analytics 4 Measurement ID)
                </label>
                <input 
                  type="text"
                  className="font-code"
                  placeholder="مثال: G-XXXXXXXXXX"
                  value={settingsForm.google_analytics_id || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, google_analytics_id: e.target.value })}
                  style={{ direction: 'ltr' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  کد ترکیتگ GA4 جهت ارسال خودکار رویدادها به داشبورد گوگل
                </span>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>
                  عنوان صفحه اصلی برای نتایج گوگل (SEO Title)
                </label>
                <input 
                  type="text"
                  placeholder="تک‌تینک | فروشگاه تخصصی لپ‌تاپ‌های گیمینگ و مهندسی"
                  value={settingsForm.seo_meta_title || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, seo_meta_title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>
                  کلمات کلیدی اصلی سئو (Meta Keywords)
                </label>
                <input 
                  type="text"
                  placeholder="خرید لپ تاپ, لپ تاپ استوک, قیمت لپ تاپ گیمینگ..."
                  value={settingsForm.seo_meta_keywords || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, seo_meta_keywords: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>
                توضیحات متای صفحه اصلی برای نمایش در گوگل (Meta Description)
              </label>
              <textarea 
                rows={2}
                placeholder="مرجع تخصصی خرید انواع لپ‌تاپ‌های مهندسی، گیمینگ و رندرینگ با تست ۳۰ روزه و گارانتی طلایی..."
                value={settingsForm.seo_meta_description || ''}
                onChange={e => setSettingsForm({ ...settingsForm, seo_meta_description: e.target.value })}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div className="flex" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingSettings}
                onClick={saveSettings}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
              >
                <Save size={16} />
                {savingSettings ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات سئو و گوگل'}
              </button>
            </div>
          </div>
          
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

              {/* Payment Methods & Gateways Activation */}
              <div style={{ marginTop: '16px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="hsl(var(--accent-purple))" />
                  مدیریت درگاه‌ها و روش‌های فعال پرداخت (فعال‌سازی / غیرفعال‌سازی)
                </h3>
                
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>درگاه پرداخت زرین‌پال</label>
                    <select
                      value={settingsForm.gateway_zarinpal_active ?? '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, gateway_zarinpal_active: e.target.value })}
                    >
                      <option value="1">فعال (نمایش در فرم پرداخت مشتری)</option>
                      <option value="0">غیرفعال</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>درگاه به‌پرداخت بانک ملت</label>
                    <select
                      value={settingsForm.gateway_mellat_active ?? '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, gateway_mellat_active: e.target.value })}
                    >
                      <option value="1">فعال (نمایش در فرم پرداخت مشتری)</option>
                      <option value="0">غیرفعال</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>درگاه سامان‌کیش بانک سامان</label>
                    <select
                      value={settingsForm.gateway_saman_active ?? '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, gateway_saman_active: e.target.value })}
                    >
                      <option value="1">فعال (نمایش در فرم پرداخت مشتری)</option>
                      <option value="0">غیرفعال</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>درگاه تجارت الکترونیک پارسیان</label>
                    <select
                      value={settingsForm.gateway_parsian_active ?? '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, gateway_parsian_active: e.target.value })}
                    >
                      <option value="1">فعال (نمایش در فرم پرداخت مشتری)</option>
                      <option value="0">غیرفعال</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>روش پرداخت کارت‌به‌کارت</label>
                    <select
                      value={settingsForm.gateway_card_active ?? '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, gateway_card_active: e.target.value })}
                    >
                      <option value="1">فعال (نمایش در فرم پرداخت مشتری)</option>
                      <option value="0">غیرفعال</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>روش پرداخت در محل (COD)</label>
                    <select
                      value={settingsForm.gateway_cod_active ?? '1'}
                      onChange={e => setSettingsForm({ ...settingsForm, gateway_cod_active: e.target.value })}
                    >
                      <option value="1">فعال (نمایش در فرم پرداخت مشتری)</option>
                      <option value="0">غیرفعال</option>
                    </select>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>شماره کارت شتاب فروشگاه (جهت کارت‌به‌کارت)</label>
                    <input 
                      type="text" 
                      value={settingsForm.card_number || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, card_number: e.target.value })} 
                      placeholder="۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸"
                      style={{ direction: 'ltr' }}
                      className="font-code"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>نام صاحب حساب / فروشگاه</label>
                    <input 
                      type="text" 
                      value={settingsForm.card_holder || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, card_holder: e.target.value })} 
                      placeholder="فروشگاه تک‌تینک (شرکت فناوری اطلاعات)"
                    />
                  </div>
                </div>
              </div>

              {/* Showroom & Business Location Settings */}
              <div style={{ marginTop: '16px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="hsl(var(--accent-cyan))" />
                  اطلاعات نشانی، ساعات کاری و موقعیت مکانی شوروم
                </h3>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>نشانی کامل شوروم و دفتر مرکزی</label>
                    <input 
                      type="text" 
                      value={settingsForm.store_address || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, store_address: e.target.value })} 
                      placeholder="اصفهان، خیابان حکیم نظامی، چهارراه شریعتی..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>تلفن ثابت فروشگاه</label>
                    <input 
                      type="text" 
                      value={settingsForm.store_phone || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, store_phone: e.target.value })} 
                      placeholder="۰۳۱-۳۶۲۸۲۱۷۵"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>شماره همراه و مشاوره واتس‌اپ</label>
                    <input 
                      type="text" 
                      value={settingsForm.store_mobile || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, store_mobile: e.target.value })} 
                      placeholder="۰۹۱۲-۳۴۵۶۷۸۹"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>ساعات پاسخگویی و پذیرش حضوری</label>
                    <input 
                      type="text" 
                      value={settingsForm.store_hours || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, store_hours: e.target.value })} 
                      placeholder="شنبه تا چهارشنبه ۱۰:۰۰ الی ۲۰:۰۰ | پنج‌شنبه‌ها ۱۰:۰۰ الی ۱۶:۰۰"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>لینک مسیریابی در نقشه (گوگل مپ / نشان / بلد)</label>
                    <input 
                      type="text" 
                      className="font-code"
                      value={settingsForm.store_map_link || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, store_map_link: e.target.value })} 
                      placeholder="https://maps.google.com/?q=..."
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>متن معرفی و درباره فروشگاه (نمایش در مودال درباره ما)</label>
                    <textarea 
                      rows="3"
                      value={settingsForm.store_about || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, store_about: e.target.value })} 
                      placeholder="تک‌تینک نخستین مرجع تخصصی بررسی سخت‌افزاری..."
                    />
                  </div>
                </div>
              </div>

              {/* Official Social Media Channels */}
              <div style={{ marginTop: '16px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExternalLink size={18} color="hsl(var(--accent-purple))" />
                  کانال‌ها و شبکه‌های اجتماعی رسمی تک‌تینک (فوتر و درباره ما)
                </h3>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <TelegramIcon size={16} color="#29a9ea" /> لینک کانال تلگرام (Telegram)
                    </label>
                    <input 
                      type="text" 
                      className="font-code"
                      value={settingsForm.telegram_url || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, telegram_url: e.target.value })} 
                      placeholder="https://t.me/techtink"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <InstagramIcon size={16} color="#e1306c" /> لینک پیج اینستاگرام (Instagram)
                    </label>
                    <input 
                      type="text" 
                      className="font-code"
                      value={settingsForm.instagram_url || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })} 
                      placeholder="https://instagram.com/techtink"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <BaleIcon size={16} /> لینک کانال پیام‌رسان بله (Bale)
                    </label>
                    <input 
                      type="text" 
                      className="font-code"
                      value={settingsForm.bale_url || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, bale_url: e.target.value })} 
                      placeholder="https://ble.ir/techtink"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <AparatIcon size={16} /> لینک کانال ویدیوهای آپارات (Aparat)
                    </label>
                    <input 
                      type="text" 
                      className="font-code"
                      value={settingsForm.aparat_url || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, aparat_url: e.target.value })} 
                      placeholder="https://www.aparat.com/techtink"
                      style={{ direction: 'ltr' }}
                    />
                  </div>
                </div>
              </div>

              {/* eNamad Trust Seal Settings */}
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <EnamadLogo size={30} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>نماد اعتماد الکترونیکی (اینماد - eNamad)</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      تنظیمات نمایش لوگو و لینک گواهی تایید صلاحیت کسب‌وکار در فوتر وب‌سایت
                    </p>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={settingsForm.enamad_active === '1' || settingsForm.enamad_active === 1 || settingsForm.enamad_active === true}
                        onChange={e => setSettingsForm({ ...settingsForm, enamad_active: e.target.checked ? '1' : '0' })}
                      />
                      <span style={{ fontWeight: 600 }}>نمایش نشان اینماد در فوتر سایت</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      با فعال بودن این گزینه، کادر نشان اینماد در انتهای تمامی صفحات فروشگاه نمایش داده می‌شود.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                      لینک اختصاصی پروفایل اینماد (URL):
                    </label>
                    <input
                      type="text"
                      className="font-code"
                      value={settingsForm.enamad_url || ''}
                      onChange={e => setSettingsForm({ ...settingsForm, enamad_url: e.target.value })}
                      placeholder="https://trustseal.enamad.ir/?id=24125751"
                      style={{ direction: 'ltr', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      لینک اعتبارسنجی ارائه‌شده توسط سامانه اینماد (با کلیک کاربر، صفحه تاییدیه اینماد باز می‌شود).
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                  {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات فروشگاه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. INBOX & CORPORATE WEBMAIL (info@techtink.ir & eNamad Verification) */}
      {activeSection === 'webmail' && (
        <AdminWebmail
          authHeaders={authHeaders}
          onUnreadCountChange={setUnreadEmailCount}
        />
      )}

      {/* 8. VPS RESOURCE MONITOR & MULTI-SERVICES HEALTH */}
      {activeSection === 'resource_monitor' && (
        <ResourceMonitor
          authHeaders={authHeaders}
        />
      )}

      {/* 1. Modal: Comprehensive Product Editor & Expert Review with Live Split View */}
      <ProductEditorModal
        isOpen={productModalOpen}
        mode={productModalMode}
        initialData={productForm}
        onClose={() => setProductModalOpen(false)}
        onSave={handleSaveProductForm}
        isSaving={savingProduct}
        error={productModalError}
        blogPosts={blogPosts}
      />

      {/* 2. Modal: Model-Specific Drivers & Support Management */}
      {driverModalProduct && (
        <div className="modal-backdrop-wrapper" onClick={() => setDriverModalProduct(null)}>
          <div className="glass-panel modal-card" style={{ maxWidth: '820px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            
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

      {/* 3. Modal: Sophisticated Blog Post Editor with Live View & Inline Photo Inserter */}
      <BlogEditorModal
        isOpen={isBlogModalOpen}
        initialData={blogForm}
        onClose={() => setIsBlogModalOpen(false)}
        onSave={handleSaveBlogPost}
        isSaving={blogSaving}
        error={blogError}
        products={products}
      />

      {/* 4. Modal: Vector Code 128 & QR Barcode Label Generator */}
      <BarcodeGeneratorModal
        isOpen={barcodeModalOpen}
        onClose={() => { setBarcodeModalOpen(false); setBarcodeProduct(null); }}
        product={barcodeProduct}
        allProducts={products}
      />

      {/* 5. Modal Preview: Demo Mode Notice Modal (Admin Live Preview) */}
      <DemoNoticeModal
        settings={settingsForm}
        isOpen={previewDemoModalOpen}
        onClose={() => setPreviewDemoModalOpen(false)}
        onOpenAdmin={() => setPreviewDemoModalOpen(false)}
      />

    </div>
  );
}
