import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingCart, Users, TrendingUp, Settings, BarChart3, 
  Edit, Save, X, Check, Database, MessageSquare, Download, RefreshCw, 
  Plus, AlertTriangle, Shield, CheckCircle, ExternalLink, Copy, Search, Trash2,
  Sparkles, FileText, BookOpen, ThumbsUp, ThumbsDown, Cpu, Layers, HardDrive, Wrench,
  Calendar, Truck, Barcode as BarcodeIcon, MapPin, Phone, Clock, ArrowRight,
  ArrowDownLeft, ArrowUpRight, QrCode, Filter, Eye, CreditCard
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import BlogEditorModal from './BlogEditorModal.jsx';
import ProductEditorModal from './ProductEditorModal.jsx';
import BarcodeGeneratorModal from './BarcodeGeneratorModal.jsx';
import { TelegramIcon, InstagramIcon, BaleIcon, AparatIcon } from './SocialLogos.jsx';

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

  // Settings
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [torobCopied, setTorobCopied] = useState(false);

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
    destination: 'تهران',
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
  }, [activeSection, authToken]);

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
        setOutboundForm({ product_id: '', quantity: 1, courier: 'تیپاکس (Tipax)', tracking_number: '', destination: 'تهران', recipient_name: '', notes: '' });
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

    const chassisVal = dataToSave.chassis || dataToSave.specs?.chassis || 'All-Aluminum CNC Machined';

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
      specs: { ...dataToSave.specs, chassis: chassisVal },
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

  const ADMIN_CATEGORIES = [
    {
      id: 'analytics',
      title: 'داشبورد و آمار تحلیلی',
      enTitle: 'Analytics & Overview',
      desc: 'شاخص‌های فروش، درآمد و وضعیت کل سیستم',
      icon: BarChart3,
      tabs: [
        { id: 'dashboard', label: 'شاخص‌های کلیدی و آمار لحظه‌ای', icon: BarChart3, badge: 'زنده' }
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
      id: 'developers',
      title: 'توسعه‌دهندگان و سیستم',
      enTitle: 'Developers & System',
      desc: 'پایگاه داده SQLite، وب‌سرویس ترب و نشانی',
      icon: Database,
      tabs: [
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
            مدیریت موجودی انبار، قیمت‌گذاری به تومان، وبلاگ، سفارش‌ها، دیتابیس و اتصال به ترب
          </p>
        </div>

        <div className="flex" style={{ gap: '12px' }}>
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
                  ? 'linear-gradient(135deg, hsla(var(--accent-cyan), 0.15), hsla(var(--accent-purple), 0.12))' 
                  : 'rgba(255, 255, 255, 0.02)',
                borderColor: isCatActive ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                boxShadow: isCatActive ? '0 0 24px hsla(var(--accent-cyan), 0.25)' : 'none',
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
                    : 'rgba(255, 255, 255, 0.06)',
                  color: isCatActive ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: isCatActive ? '0 0 16px hsla(var(--accent-cyan), 0.4)' : 'none',
                  flexShrink: 0
                }}
              >
                <IconComp size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isCatActive ? '#ffffff' : 'var(--text-primary)' }}>
                    {cat.title}
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: isCatActive ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)', fontWeight: 700 }}>
                    {cat.tabs.length} بخش
                  </span>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          background: 'rgba(0,0,0,0.2)'
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
                background: isTabActive ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'rgba(255, 255, 255, 0.04)',
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
                  background: isTabActive ? 'rgba(0,0,0,0.25)' : 'rgba(255, 255, 255, 0.1)',
                  color: isTabActive ? '#ffffff' : 'var(--text-secondary)',
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
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>رسیدهای ورود بار جدید:</span>
                      <strong className="font-code">{(stats.inboundShipments || 0).toLocaleString('fa-IR')} بارنامه</strong>
                    </div>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
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
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>کل نوبت‌های رزرو شده:</span>
                      <strong className="font-code">{(stats.appointmentsTotal || 0).toLocaleString('fa-IR')} نوبت</strong>
                    </div>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
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
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>مقالات و بررسی‌های ویدیویی:</span>
                      <strong className="font-code">{(stats.totalBlogPosts || 0).toLocaleString('fa-IR')} مقاله</strong>
                    </div>
                    <div className="flex" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
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
                      <option value="پیک موتوری ویژه تهران">پیک موتوری ویژه تهران</option>
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
                      placeholder="تهران، خیابان ولیعصر، تقاطع طالقانی..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>تلفن ثابت فروشگاه</label>
                    <input 
                      type="text" 
                      value={settingsForm.store_phone || ''} 
                      onChange={e => setSettingsForm({ ...settingsForm, store_phone: e.target.value })} 
                      placeholder="۰۲۱-۸۸۲۲۶۶۰۰"
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

              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                  {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات فروشگاه'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

    </div>
  );
}
