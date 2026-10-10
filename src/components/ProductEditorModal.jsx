import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Package, Cpu, BookOpen, Image, Columns, Eye, Edit3, Bold, Italic, 
  List, ListOrdered, Heading2, Heading3, Quote, Table, Link as LinkIcon, 
  Code, AlertCircle, Sparkles, Maximize2, Minimize2, Check, ThumbsUp, 
  ThumbsDown, Layers, ShieldCheck, Plus, Video, Play
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';
import { renderMarkdownToHtml } from '../utils/markdownRenderer.js';

// Suggested tech photos for quick insertion in product reviews
const TECH_PHOTO_PRESETS = [
  { label: 'خنک‌کننده و محفظه بخار', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80' },
  { label: 'مادربرد و مدار چاپی', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
  { label: 'چیپست پردازنده (CPU/GPU)', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'لپ‌تاپ گیمینگ و کیبورد RGB', url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80' },
  { label: 'میز کار مهندسی و اولترابوک', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80' },
];

export default function ProductEditorModal({ 
  isOpen, 
  mode = 'add', 
  initialData, 
  onClose, 
  onSave, 
  isSaving, 
  error,
  blogPosts = []
}) {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    slug: '',
    brand: '',
    model: '',
    grade: 'A+',
    category: 'گیمینگ',
    series: 'سری بلید',
    basePrice: 50000000,
    stock: 10,
    tagline: '',
    badge: 'جدید',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80',
    guarantee: 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
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
      verdict: '',
      fullReview: ''
    },
    linkedBlogId: ''
  });

  const [activeTab, setActiveTab] = useState('review'); // 'basic' | 'specs' | 'review'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'edit' | 'preview'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inline Photo Inserter
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // Inline Video Inserter (Aparat / YouTube)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const reviewTextareaRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id ?? null,
        name: initialData.name || '',
        slug: initialData.slug || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        grade: initialData.grade || 'A+',
        category: initialData.category || 'گیمینگ',
        series: initialData.series || '',
        basePrice: initialData.basePrice || 0,
        stock: initialData.stock || 0,
        tagline: initialData.tagline || '',
        badge: initialData.badge || '',
        image: initialData.image || '',
        guarantee: initialData.guarantee || 'گارانتی ۶ ماهه طلایی استوک تک‌تینک',
        cpuBrand: initialData.cpuBrand || 'Intel',
        gpuBrand: initialData.gpuBrand || 'NVIDIA',
        chassis: initialData.chassis || initialData.specs?.chassis || 'All-Aluminum CNC Machined',
        specs: {
          cpu: initialData.specs?.cpu || '',
          gpu: initialData.specs?.gpu || '',
          ram: initialData.specs?.ram || '',
          storage: initialData.specs?.storage || '',
          display: initialData.specs?.display || '',
          battery: initialData.specs?.battery || '',
          weight: initialData.specs?.weight || '',
          npuScore: initialData.specs?.npuScore || '',
          chassis: initialData.chassis || initialData.specs?.chassis || 'All-Aluminum CNC Machined'
        },
        expertReview: {
          intro: initialData.expertReview?.intro || '',
          pros: Array.isArray(initialData.expertReview?.pros) ? initialData.expertReview.pros.join('\n') : (initialData.expertReview?.pros || ''),
          cons: Array.isArray(initialData.expertReview?.cons) ? initialData.expertReview.cons.join('\n') : (initialData.expertReview?.cons || ''),
          verdict: initialData.expertReview?.verdict || '',
          fullReview: initialData.expertReview?.fullReview || initialData.expertReview?.intro || ''
        },
        linkedBlogId: initialData.linkedBlogId || ''
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Helper to insert markdown in review textarea at cursor position
  const insertAtCursor = (beforeText, afterText = '', defaultPlaceholder = '') => {
    const textarea = reviewTextareaRef.current;
    const currentReview = formData.expertReview.intro;
    if (!textarea) {
      setFormData(prev => ({
        ...prev,
        expertReview: {
          ...prev.expertReview,
          intro: currentReview + beforeText + defaultPlaceholder + afterText
        }
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentReview.substring(start, end) || defaultPlaceholder;
    const replacement = `${beforeText}${selectedText}${afterText}`;
    const newContent = currentReview.substring(0, start) + replacement + currentReview.substring(end);

    setFormData(prev => ({
      ...prev,
      expertReview: {
        ...prev.expertReview,
        intro: newContent
      }
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + beforeText.length, start + beforeText.length + selectedText.length);
    }, 50);
  };

  const handleInsertPhoto = () => {
    if (!photoUrl.trim()) return;
    const caption = photoCaption.trim() || 'تصویر سخت‌افزار';
    const markdown = `\n\n![${caption}](${photoUrl.trim()})\n\n`;
    insertAtCursor(markdown, '', '');
    setPhotoUrl('');
    setPhotoCaption('');
    setIsPhotoModalOpen(false);
  };

  const handleInsertVideo = () => {
    if (!videoUrl.trim()) return;
    const titleText = videoTitle.trim() || 'ویدیوی بررسی دستگاه';
    const markdown = `\n\n!video[${titleText}](${videoUrl.trim()})\n\n`;
    insertAtCursor(markdown, '', '');
    setVideoUrl('');
    setVideoTitle('');
    setIsVideoModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const prosList = (formData.expertReview?.pros || '').split('\n').map(s => s.trim()).filter(Boolean);
    const consList = (formData.expertReview?.cons || '').split('\n').map(s => s.trim()).filter(Boolean);
    const chassisVal = formData.chassis || formData.specs?.chassis || 'All-Aluminum CNC Machined';

    const payload = {
      ...formData,
      basePrice: Number(formData.basePrice),
      stock: Number(formData.stock),
      chassis: chassisVal,
      specs: {
        ...formData.specs,
        chassis: chassisVal
      },
      expertReview: {
        intro: formData.expertReview?.intro || '',
        pros: prosList,
        cons: consList,
        verdict: formData.expertReview?.verdict || '',
        fullReview: formData.expertReview?.intro || ''
      }
    };
    onSave(payload);
  };

  const prosArray = (formData.expertReview?.pros || '').split('\n').map(s => s.trim()).filter(Boolean);
  const consArray = (formData.expertReview?.cons || '').split('\n').map(s => s.trim()).filter(Boolean);

  // Only show actual product review articles in the dropdown
  const reviewPosts = blogPosts.filter(b => 
    Boolean(b.product_slug || b.productSlug) ||
    b.category === 'بررسی‌ها' ||
    b.category === 'بررسی اختصاصی' ||
    b.category === 'نقد و بررسی لپ‌تاپ' ||
    (b.category && b.category.includes('بررسی')) ||
    (b.title && b.title.includes('بررسی'))
  );

  // Find linked blog post if any
  const linkedBlog = reviewPosts.find(b => b.product_slug === formData.slug || b.productSlug === formData.slug || b.id === formData.linkedBlogId);

  return (
    <div className="modal-backdrop-wrapper" style={{ zIndex: 110 }}>
      <div 
        className="glass-panel modal-card" 
        style={{ 
          maxWidth: isFullscreen ? '98vw' : '1240px', 
          width: '96vw',
          height: isFullscreen ? '96vh' : '90vh',
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* Modal Top Header */}
        <div 
          className="flex" 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-glass)',
            background: 'rgba(255, 255, 255, 0.04)',
            flexShrink: 0
          }}
        >
          <div className="flex" style={{ alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              background: 'hsla(var(--accent-cyan), 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'hsl(var(--accent-cyan))'
            }}>
              <Package size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mode === 'edit' ? `ویرایشگر پیشرفته کالا: ${formData.name || 'بدون نام'}` : 'افزودن لپ‌تاپ جدید با بررسی زنده'}
                <span className="badge" style={{ fontSize: '0.7rem', background: 'hsl(var(--accent-cyan))', color: '#fff' }}>
                  Live Studio
                </span>
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                طراحی بصری صفحه محصول، نقد و بررسی با پیش‌نمایش زنده و درج تصاویر درون‌متنی
              </div>
            </div>
          </div>

          <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
            {/* View Mode Switcher */}
            <div 
              className="flex" 
              style={{ 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '8px', 
                padding: '3px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <button
                type="button"
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'split' ? 'hsl(var(--accent-cyan))' : 'transparent',
                  color: viewMode === 'split' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setViewMode('split')}
                title="نمایش دو ستونه (ویرایشگر و پیش‌نمایش زنده)"
              >
                <Columns size={14} /> تقسیم صفحه
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'edit' ? 'hsl(var(--accent-cyan))' : 'transparent',
                  color: viewMode === 'edit' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setViewMode('edit')}
                title="فقط فرم‌ها و ویرایشگر"
              >
                <Edit3 size={14} /> ویرایشگر
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'preview' ? 'hsl(var(--accent-cyan))' : 'transparent',
                  color: viewMode === 'preview' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setViewMode('preview')}
                title="فقط پیش‌نمایش زنده کالا"
              >
                <Eye size={14} /> پیش‌نمایش
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '8px', borderRadius: '8px' }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '8px', borderRadius: '50%' }}
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Save Bar */}
        <div 
          className="flex" 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '10px 24px',
            borderBottom: '1px solid var(--border-glass)',
            background: '#f8fafc',
            flexShrink: 0
          }}
        >
          {/* Tabs */}
          <div className="flex" style={{ gap: '8px' }}>
            {[
              { id: 'review', label: 'نقد، معرفی و بررسی زنده', icon: BookOpen, badge: 'Live Editor' },
              { id: 'basic', label: 'اطلاعات عمومی و قیمت', icon: Package },
              { id: 'specs', label: 'مشخصات سخت‌افزار و برندها', icon: Cpu }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="btn"
                style={{
                  padding: '7px 16px',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                  background: activeTab === tab.id ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <tab.icon size={15} color={activeTab === tab.id ? 'hsl(var(--accent-cyan))' : 'currentColor'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="badge" style={{ fontSize: '0.65rem', background: 'hsl(var(--accent-purple))', color: '#fff', padding: '1px 6px' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Save */}
          <div className="flex" style={{ gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              قیمت: <strong>{formatPrice(formData.basePrice)}</strong>
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSaving}
              style={{ padding: '8px 24px', fontSize: '0.875rem' }}
            >
              {isSaving ? 'در حال ذخیره...' : mode === 'edit' ? 'ذخیره تغییرات لپ‌تاپ' : 'ثبت لپ‌تاپ در فروشگاه'}
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{ padding: '10px 24px', background: 'hsla(var(--accent-red), 0.15)', color: 'hsl(var(--accent-red))', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Work Area */}
        <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* LEFT: Forms & Editor Pane */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div 
              style={{ 
                flex: viewMode === 'split' ? '1 1 50%' : '1 1 100%', 
                borderLeft: viewMode === 'split' ? '1px solid var(--border-glass)' : 'none',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'rgba(0, 0, 0, 0.12)'
              }}
            >

              {/* ──────────────── TAB 1: REVIEW & LIVE STUDIO ──────────────── */}
              {activeTab === 'review' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  {/* Formatting Toolbar (Like Blog Editor) */}
                  <div 
                    className="flex" 
                    style={{ 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '8px 20px', 
                      borderBottom: '1px solid var(--border-glass)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      flexWrap: 'wrap',
                      flexShrink: 0
                    }}
                  >
                    {/* INLINE PHOTO BUTTON */}
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        background: 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))',
                        boxShadow: '0 0 10px hsla(var(--accent-cyan), 0.3)'
                      }}
                      onClick={() => setIsPhotoModalOpen(true)}
                      title="افزودن تصویر بین متن نقد و بررسی"
                    >
                      <Image size={15} /> افزودن تصویر بین متن
                    </button>

                    {/* INLINE VIDEO BUTTON */}
                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: '#ec4899',
                        borderColor: 'hsla(330, 80%, 60%, 0.4)'
                      }}
                      onClick={() => setIsVideoModalOpen(true)}
                      title="درج ویدیو از آپارات یا یوتیوب در میان متن"
                    >
                      <Video size={15} /> افزودن ویدیو (آپارات / یوتیوب)
                    </button>

                    <span style={{ height: '20px', width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />

                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      onClick={() => insertAtCursor('\n## ', '\n', 'سرتیتر بخش نقد و بررسی')}
                      title="تیتر بخش اصلی (H2)"
                    >
                      <Heading2 size={15} /> H2
                    </button>
                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      onClick={() => insertAtCursor('\n### ', '\n', 'زیرتیتر مشخصات')}
                      title="زیرتیتر (H3)"
                    >
                      <Heading3 size={15} /> H3
                    </button>

                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px' }}
                      onClick={() => insertAtCursor('**', '**', 'متن برجسته')}
                      title="درشت (Bold)"
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px' }}
                      onClick={() => insertAtCursor('*', '*', 'متن کج')}
                      title="ایتالیک (Italic)"
                    >
                      <Italic size={15} />
                    </button>

                    <span style={{ height: '20px', width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />

                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px' }}
                      onClick={() => insertAtCursor('\n- ', '\n', 'ویژگی سخت‌افزاری')}
                      title="لیست بالت‌دار"
                    >
                      <List size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px' }}
                      onClick={() => insertAtCursor('\n1. ', '\n', 'گام اول')}
                      title="لیست عددی"
                    >
                      <ListOrdered size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px' }}
                      onClick={() => insertAtCursor('\n> ', '\n', 'تست بنچمارک در آزمایشگاه تک‌تینک')}
                      title="نقل‌قول مهندسی"
                    >
                      <Quote size={15} />
                    </button>

                    <span style={{ height: '20px', width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />

                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => insertAtCursor('\n| بنچمارک | Cinebench R23 | Time Spy |\n| :--- | :--- | :--- |\n| امتیاز پردازنده | 28,450 | 16,800 |\n\n')}
                      title="درج جدول بنچمارک"
                    >
                      <Table size={15} /> جدول بنچمارک
                    </button>

                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => insertAtCursor('\n> [!TIP]\n> سیستم خنک‌کننده در این مدل قادر به کنترل دما در زیر ۷۵ درجه سانتی‌گراد است.\n\n')}
                      title="کادر نکته کاربردی"
                    >
                      <Sparkles size={14} /> نکته
                    </button>
                    <button
                      type="button"
                      className="btn btn-glass"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => insertAtCursor('\n> [!WARNING]\n> برای دستیابی به حداکثر توان گرافیک، از آداپتور شارژ اورجینال همراه دستگاه استفاده کنید.\n\n')}
                      title="کادر هشدار"
                    >
                      <AlertCircle size={14} /> هشدار
                    </button>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                    
                    {/* Link to Blog Review Article */}
                    <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'hsla(var(--accent-purple), 0.05)', borderColor: 'hsla(var(--accent-purple), 0.3)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--accent-purple))', marginBottom: '8px' }}>
                        <BookOpen size={16} />
                        اتصال به مقاله نقد و بررسی وبلاگ (اختیاری)
                      </label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                        در صورت انتخاب یک مقاله وبلاگ، یک بنر ویژه و دکمه مطالعه نقد جامع در صفحه محصول به کاربران پیشنهاد داده می‌شود.
                      </p>
                      <select
                        value={formData.linkedBlogId || (linkedBlog ? linkedBlog.id : '')}
                        onChange={e => setFormData({ ...formData, linkedBlogId: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="">-- بدون پیوند به مقاله وبلاگ (یا خودکار بر اساس شناسه محصول) --</option>
                        {reviewPosts.length === 0 ? (
                          <option value="" disabled>هیچ مقاله بررسی تخصصی ثبت نشده است (در بخش وبلاگ ایجاد کنید)</option>
                        ) : (
                          reviewPosts.map(b => (
                            <option key={b.id} value={b.id}>
                              نقد و بررسی: {b.title} {b.product_slug === formData.slug ? '✓ (متصل به همین کالا)' : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Markdown Overview & Review Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '260px' }}>
                      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          متن معرفی و نقد تخصصی (پشتیبانی از Markdown و تصاویر درون‌متنی)
                        </label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formData.expertReview.intro.length} کاراکتر
                        </span>
                      </div>
                      <textarea
                        ref={reviewTextareaRef}
                        rows={10}
                        value={formData.expertReview.intro}
                        onChange={e => setFormData({
                          ...formData,
                          expertReview: { ...formData.expertReview, intro: e.target.value, fullReview: e.target.value }
                        })}
                        placeholder={"# بررسی تخصصی این لپ‌تاپ\n\nاین دستگاه با شاسی آلومینیومی و سخت‌افزار مدرن خود عملکردی فوق‌العاده در پردازش‌های سنگین ارائه می‌دهد.\n\n## تست سیستم خنک‌کننده\nدر این بخش عکس خنک‌کننده را با دکمه بالا اضافه کنید:\n\n![خنک‌کننده محفظه بخار](https://images.unsplash.com/...)\n\n> [!TIP]\n> دمای پردازنده در رندرهای طولانی کاملاً پایدار باقی می‌ماند."}
                        style={{
                          width: '100%',
                          flexGrow: 1,
                          padding: '16px',
                          fontFamily: 'var(--font-sans)',
                          lineHeight: '1.8',
                          fontSize: '0.9rem',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Pros & Cons */}
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', color: 'hsl(var(--accent-green))', marginBottom: '6px' }}>
                          نقاط قوت کلیدی (هر مورد در یک خط)
                        </label>
                        <textarea
                          rows={4}
                          value={formData.expertReview.pros}
                          onChange={e => setFormData({
                            ...formData,
                            expertReview: { ...formData.expertReview, pros: e.target.value }
                          })}
                          placeholder="عملکرد فوق‌العاده پردازنده&#10;نمایشگر کالیبره با کنتراست عالی&#10;شاسی محکم و خوش‌ساخت"
                          style={{ width: '100%', padding: '10px', fontSize: '0.85rem', lineHeight: '1.6' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', color: 'hsl(var(--accent-red))', marginBottom: '6px' }}>
                          نقاط ضعف و ملاحظات (هر مورد در یک خط)
                        </label>
                        <textarea
                          rows={4}
                          value={formData.expertReview.cons}
                          onChange={e => setFormData({
                            ...formData,
                            expertReview: { ...formData.expertReview, cons: e.target.value }
                          })}
                          placeholder="وزن نسبتاً بالا&#10;صدای فن در دور حداکثری"
                          style={{ width: '100%', padding: '10px', fontSize: '0.85rem', lineHeight: '1.6' }}
                        />
                      </div>
                    </div>

                    {/* Verdict */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', color: 'hsl(var(--accent-cyan))', marginBottom: '6px' }}>
                        جمع‌بندی کارشناسی (Expert Verdict)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.expertReview.verdict}
                        onChange={e => setFormData({
                          ...formData,
                          expertReview: { ...formData.expertReview, verdict: e.target.value }
                        })}
                        placeholder="در نهایت، این دستگاه یکی از ارزشمندترین انتخاب‌ها برای مهندسان و گیمرهای حرفه‌ای به شمار می‌رود."
                        style={{ width: '100%', padding: '10px', fontSize: '0.85rem', lineHeight: '1.6' }}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* ──────────────── TAB 2: BASIC INFO & PRICING ──────────────── */}
              {activeTab === 'basic' && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>
                        نام کامل لپ‌تاپ (انگلیسی یا فارسی) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="Lenovo ThinkPad T14 Gen 2" 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>برند اصلی (Brand)</label>
                      <input 
                        type="text" 
                        value={formData.brand} 
                        onChange={e => setFormData({ ...formData, brand: e.target.value })} 
                        placeholder="Lenovo" 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مدل دقیق (Model)</label>
                      <input 
                        type="text" 
                        value={formData.model} 
                        onChange={e => setFormData({ ...formData, model: e.target.value })} 
                        placeholder="ThinkPad T14 Gen 2" 
                      />
                    </div>

                    <div>
                      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.8125rem' }}>گرید وضعیت ظاهری دستگاه (Grade)</label>
                        <span style={{ fontSize: '0.72rem', color: 'hsl(var(--accent-cyan))' }}>گزینه‌های استاندارد:</span>
                      </div>

                      {/* Fixed Grade Presets */}
                      <div className="flex" style={{ gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'A+', label: 'A+', desc: 'در حد نو' },
                          { id: 'A', label: 'A', desc: 'بسیار تمیز' },
                          { id: 'B+', label: 'B+', desc: 'تمیز با خط جزئی' },
                          { id: 'A++', label: 'A++', desc: 'در حد آکبند' }
                        ].map(g => {
                          const isSelected = formData.grade === g.id || formData.grade === `گرید ${g.id}`;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, grade: g.id })}
                              className="btn"
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                fontWeight: isSelected ? 700 : 500,
                                background: isSelected ? 'hsla(var(--accent-cyan), 0.22)' : 'rgba(255,255,255,0.04)',
                                borderColor: isSelected ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                                color: isSelected ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)'
                              }}
                            >
                              {g.label} ({g.desc})
                            </button>
                          );
                        })}
                      </div>

                      <input 
                        type="text" 
                        value={formData.grade} 
                        onChange={e => setFormData({ ...formData, grade: e.target.value })} 
                        placeholder="A+ یا گرید دلخواه" 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>نامک در آدرس URL (Slug)</label>
                      <input 
                        type="text" 
                        className="font-code" 
                        value={formData.slug} 
                        onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                        placeholder="lenovo-thinkpad-t14" 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>دسته‌بندی فروشگاه</label>
                      <select 
                        value={formData.category} 
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="گیمینگ">گیمینگ و رندرینگ</option>
                        <option value="مهندسی">مهندسی و برنامه‌نویسی</option>
                        <option value="تولید محتوا">تولید محتوا و گرافیک</option>
                        <option value="ورک‌استیشن">ورک‌استیشن اداری</option>
                        <option value="دانشجویی">دانشجویی و عمومی</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>قیمت پایه (تومان)</label>
                      <input 
                        type="number" 
                        className="font-code" 
                        value={formData.basePrice} 
                        onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>موجودی انبار (تعداد دستگاه)</label>
                      <input 
                        type="number" 
                        className="font-code" 
                        value={formData.stock} 
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>نشان ویژه (Badge)</label>
                      <input 
                        type="text" 
                        value={formData.badge} 
                        onChange={e => setFormData({ ...formData, badge: e.target.value })} 
                        placeholder="پیشنهاد ویژه" 
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>آدرس تصویر کاور اصلی (Image URL)</label>
                      <input 
                        type="text" 
                        className="font-code" 
                        value={formData.image} 
                        onChange={e => setFormData({ ...formData, image: e.target.value })} 
                        placeholder="https://..." 
                        style={{ direction: 'ltr' }} 
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>شعار تبلیغاتی و عنوان بازاریابی</label>
                      <input 
                        type="text" 
                        value={formData.tagline} 
                        onChange={e => setFormData({ ...formData, tagline: e.target.value })} 
                        placeholder="لپ‌تاپ فوق حرفه‌ای برای هوش مصنوعی و گیمینگ سطح بالا" 
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>گارانتی و خدمات پس از فروش</label>
                      <input 
                        type="text" 
                        value={formData.guarantee} 
                        onChange={e => setFormData({ ...formData, guarantee: e.target.value })} 
                        placeholder="گارانتی ۶ ماهه طلایی استوک تک‌تینک" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 3: HARDWARE & SPECS ──────────────── */}
              {activeTab === 'specs' && (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                  
                  {/* Brand categorization pills */}
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 'bold', marginBottom: '6px', color: 'hsl(var(--accent-cyan))' }}>
                        سازنده پردازنده مرکزی (CPU Maker)
                      </label>
                      <select 
                        value={formData.cpuBrand} 
                        onChange={e => setFormData({ ...formData, cpuBrand: e.target.value })}
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
                        value={formData.gpuBrand} 
                        onChange={e => setFormData({ ...formData, gpuBrand: e.target.value })}
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
                        value={formData.specs.cpu || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, cpu: e.target.value } })} 
                        placeholder="Intel Core i9-14900HX" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مدل دقیق گرافیک (GPU)</label>
                      <input 
                        type="text" 
                        value={formData.specs.gpu || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, gpu: e.target.value } })} 
                        placeholder="NVIDIA GeForce RTX 4080 (12GB GDDR6)" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>حافظه رم (RAM)</label>
                      <input 
                        type="text" 
                        value={formData.specs.ram || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, ram: e.target.value } })} 
                        placeholder="32GB DDR5 5600MHz" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>حافظه داخلی (SSD)</label>
                      <input 
                        type="text" 
                        value={formData.specs.storage || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, storage: e.target.value } })} 
                        placeholder="1TB NVMe PCIe 4.0 SSD" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>مشخصات صفحه نمایش</label>
                      <input 
                        type="text" 
                        value={formData.specs.display || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, display: e.target.value } })} 
                        placeholder="15.6 QHD 165Hz IPS" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>ظرفیت باتری و شارژر</label>
                      <input 
                        type="text" 
                        value={formData.specs.battery || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, battery: e.target.value } })} 
                        placeholder="80Wh (شارژ سریع 230W)" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>وزن دستگاه</label>
                      <input 
                        type="text" 
                        value={formData.specs.weight || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, weight: e.target.value } })} 
                        placeholder="2.1 kg" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>توان هوش مصنوعی (NPU)</label>
                      <input 
                        type="text" 
                        value={formData.specs.npuScore || ''} 
                        onChange={e => setFormData({ ...formData, specs: { ...formData.specs, npuScore: e.target.value } })} 
                        placeholder="35 TOPS" 
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '6px' }}>جنس بدنه و شاسی (Chassis)</label>
                      <input 
                        type="text" 
                        value={formData.chassis || ''} 
                        onChange={e => setFormData({ ...formData, chassis: e.target.value, specs: { ...formData.specs, chassis: e.target.value } })} 
                        placeholder="All-Aluminum CNC Machined Unibody" 
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* RIGHT: Live Product & Review Preview Pane */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div 
              style={{ 
                flex: viewMode === 'split' ? '1 1 50%' : '1 1 100%', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'rgba(255, 255, 255, 0.01)'
              }}
            >
              <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'hsl(var(--accent-cyan))', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>پیش‌نمایش زنده صفحه کالا و برگه نقد و بررسی</span>
                <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', fontSize: '0.7rem' }}>
                  Live Preview
                </span>
              </div>

              {/* Product Page Preview Content */}
              <div style={{ padding: '24px 32px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* Hero preview */}
                <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {formData.image && (
                    <img 
                      src={formData.image} 
                      alt={formData.name} 
                      style={{ width: '140px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-glass)' }} 
                    />
                  )}
                  <div style={{ flexGrow: 1 }}>
                    <div className="flex" style={{ gap: '8px', marginBottom: '6px' }}>
                      <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#fff', fontSize: '0.7rem' }}>
                        {formData.category}
                      </span>
                      {formData.badge && (
                        <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.2)', color: 'hsl(var(--accent-purple))', fontSize: '0.7rem' }}>
                          {formData.badge}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0' }}>
                      {formData.name || 'نام لپ‌تاپ'}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {formData.model} • {formData.grade}
                    </div>
                    <div className="gradient-text font-code" style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '6px' }}>
                      {formatPrice(formData.basePrice)}
                    </div>
                  </div>
                </div>

                {/* Hardware Spec Badges */}
                <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '0.75rem' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>پردازنده:</span> <strong>{formData.specs.cpu || '-'}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>گرافیک:</span> <strong>{formData.specs.gpu || '-'}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>رم:</span> <strong>{formData.specs.ram || '-'}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>حافظه:</span> <strong>{formData.specs.storage || '-'}</strong></div>
                </div>

                {/* Linked Blog Review Banner */}
                {(linkedBlog || formData.linkedBlogId) && (
                  <div 
                    className="glass-panel" 
                    style={{ 
                      padding: '16px 20px', 
                      borderRadius: '14px', 
                      marginBottom: '24px',
                      background: 'linear-gradient(135deg, hsla(var(--accent-cyan), 0.1), hsla(var(--accent-purple), 0.1))',
                      border: '1px solid hsla(var(--accent-cyan), 0.35)',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center'
                    }}
                  >
                    <BookOpen size={24} color="hsl(var(--accent-cyan))" style={{ flexShrink: 0 }} />
                    <div style={{ flexGrow: 1 }}>
                      <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#fff', fontSize: '0.7rem', marginBottom: '4px' }}>
                        مقاله نقد و بررسی وبلاگ
                      </span>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {linkedBlog ? linkedBlog.title : 'مقاله بررسی مرتبط انتخاب شده است'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        کاربران در صفحه محصول می‌توانند این نقد و بررسی کامل را مطالعه کنند.
                      </div>
                    </div>
                  </div>
                )}

                {/* Rendered Live Markdown Review */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <BookOpen size={18} color="hsl(var(--accent-cyan))" />
                    نقد و بررسی کارشناسی
                  </h4>

                  <div 
                    className="article-content"
                    style={{ lineHeight: '1.8', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '24px' }}
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdownToHtml(formData.expertReview.intro || '*هنوز متنی برای نقد و بررسی ثبت نشده است.*') 
                    }}
                  />

                  {/* Pros & Cons Preview */}
                  {(prosArray.length > 0 || consArray.length > 0) && (
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      {prosArray.length > 0 && (
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '10px', borderColor: 'hsla(var(--accent-green), 0.3)' }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'hsl(var(--accent-green))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ThumbsUp size={16} /> نقاط قوت
                          </h5>
                          <ul style={{ paddingRight: '18px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                            {prosArray.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}

                      {consArray.length > 0 && (
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '10px', borderColor: 'hsla(var(--accent-red), 0.3)' }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'hsl(var(--accent-red))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ThumbsDown size={16} /> نقاط ضعف
                          </h5>
                          <ul style={{ paddingRight: '18px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                            {consArray.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verdict Preview */}
                  {formData.expertReview.verdict && (
                    <div className="glass-panel" style={{ padding: '16px', borderRadius: '10px', background: 'hsla(var(--accent-cyan), 0.05)', borderColor: 'hsl(var(--accent-cyan))' }}>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'hsl(var(--accent-cyan))' }}>
                        جمع‌بندی نهایی کارشناس:
                      </h5>
                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.7' }}>
                        {formData.expertReview.verdict}
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* INLINE PHOTO MODAL */}
      {isPhotoModalOpen && (
        <div 
          className="modal-backdrop-wrapper" 
          style={{ zIndex: 120 }}
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div 
            className="glass-panel modal-card" 
            style={{ maxWidth: '620px', padding: '28px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={22} color="hsl(var(--accent-cyan))" />
                درج تصویر در متن نقد و بررسی محصول
              </h3>
              <button 
                type="button"
                className="btn btn-glass" 
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setIsPhotoModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              تصویر مستقیماً در محل نشانگر ماوس در متن نقد و بررسی محصول درج خواهد شد.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                  آدرس اینترنتی تصویر (Image URL) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="font-code"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  style={{ direction: 'ltr', width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                  توضیح یا زیرنویس تصویر (Caption / Alt Text)
                </label>
                <input
                  type="text"
                  placeholder="مثال: نمای داخلی و فن‌های دوقلوی خنک‌کننده"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  یا انتخاب سریع از عکس‌های پیشنهادی:
                </label>
                <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                  {TECH_PHOTO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-glass"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.75rem',
                        borderColor: photoUrl === p.url ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                        background: photoUrl === p.url ? 'hsla(var(--accent-cyan), 0.15)' : 'transparent'
                      }}
                      onClick={() => {
                        setPhotoUrl(p.url);
                        if (!photoCaption) setPhotoCaption(p.label);
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Live Preview Box */}
              {photoUrl && (
                <div style={{ 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-glass)',
                  background: '#f8fafc',
                  textAlign: 'center',
                  padding: '12px'
                }}>
                  <img 
                    src={photoUrl} 
                    alt="پیش‌نمایش" 
                    style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  {photoCaption && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      📷 {photoCaption}
                    </div>
                  )}
                </div>
              )}

              <div className="flex" style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-glass" 
                  onClick={() => setIsPhotoModalOpen(false)}
                >
                  انصراف
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleInsertPhoto}
                  disabled={!photoUrl.trim()}
                  style={{ padding: '10px 24px' }}
                >
                  درج در متن نقد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Inserter Dialog (Aparat / YouTube) */}
      {isVideoModalOpen && (
        <div className="modal-backdrop-wrapper" style={{ zIndex: 130 }} onClick={() => setIsVideoModalOpen(false)}>
          <div 
            className="glass-panel modal-card" 
            style={{ maxWidth: '580px', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="flex" style={{ alignItems: 'center', gap: '8px' }}>
                <Video size={20} color="#ec4899" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>درج ویدیو در نقد و بررسی (آپارات / YouTube)</h3>
              </div>
              <button 
                type="button" 
                className="btn btn-glass" 
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setIsVideoModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.6 }}>
              لینک ویدیوی مورد نظر خود را از آپارات (Aparat) یا یوتیوب (YouTube) وارد کنید تا به صورت پلیر واکنش‌گرا و سازگار با اینترنت ایران در متن نمایش داده شود.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  آدرس اینترنتی ویدیو (URL) *
                </label>
                <input
                  type="text"
                  placeholder="https://www.aparat.com/v/abc1234 یا https://youtu.be/..."
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  style={{ width: '100%', direction: 'ltr', fontFamily: 'var(--font-code)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  عنوان یا توضیح کوتاه زیر ویدیو (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="مثال: تست بنچمارک گیمینگ Cyberpunk 2077 در لابراتوار تک‌تینک"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  نمونه‌های آماده برای تست:
                </span>
                <div className="flex" style={{ gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-glass"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => {
                      setVideoUrl('https://www.aparat.com/v/y76846u');
                      setVideoTitle('بررسی ویدیویی عملکرد لپ‌تاپ در بازی‌ها (آپارات)');
                    }}
                  >
                    نمونه ویدیو آپارات
                  </button>
                  <button
                    type="button"
                    className="btn btn-glass"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => {
                      setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                      setVideoTitle('تیزر و آنباکسینگ اختصاصی (YouTube)');
                    }}
                  >
                    نمونه ویدیو یوتیوب
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              {videoUrl && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={14} color="#ec4899" />
                  <span>
                    پلتفرم تشخیص‌داده‌شده: {videoUrl.includes('aparat.com') ? <strong style={{ color: '#ea1d5d' }}>آپارات (Aparat)</strong> : videoUrl.includes('youtu') ? <strong style={{ color: '#ff0000' }}>یوتیوب (YouTube)</strong> : 'لینک استاندارد'}
                  </span>
                </div>
              )}

              <div className="flex" style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-glass" 
                  onClick={() => setIsVideoModalOpen(false)}
                >
                  انصراف
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleInsertVideo}
                  disabled={!videoUrl.trim()}
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
                >
                  درج ویدیو در متن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
