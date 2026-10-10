import React, { useState, useRef, useEffect } from 'react';
import { 
  X, BookOpen, Image, Columns, Eye, Edit3, Bold, Italic, 
  List, ListOrdered, Heading1, Heading2, Heading3, Quote, 
  Table, Link as LinkIcon, Code, AlertCircle, CheckCircle2, 
  Sparkles, Clock, User, Calendar, Maximize2, Minimize2, Plus,
  Video, Play
} from 'lucide-react';
import { renderMarkdownToHtml } from '../utils/markdownRenderer.js';

// Suggested tech photos for quick insertion
const TECH_PHOTO_PRESETS = [
  { label: 'خنک‌کننده و محفظه بخار', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80' },
  { label: 'مادربرد و مدار چاپی', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
  { label: 'چیپست پردازنده (CPU/GPU)', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'لپ‌تاپ گیمینگ و کیبورد RGB', url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80' },
  { label: 'میز کار مهندسی و اولترابوک', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80' },
];

export default function BlogEditorModal({ initialData, isOpen, onClose, onSave, isSaving, error, products = [] }) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    excerpt: '',
    category: 'راهنمای خرید',
    author: 'تیم تحریریه تک‌تینک',
    author_role: 'کارشناس سخت‌افزار',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date()),
    read_time: '۵ دقیقه',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    content: '',
    published: 1,
    product_slug: '',
  });

  // Editor states
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'edit' | 'preview'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'meta'
  
  // Inline Photo Inserter Modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // Inline Video Inserter Modal (Aparat / YouTube)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        title: initialData.title || '',
        excerpt: initialData.excerpt || '',
        category: initialData.category || 'راهنمای خرید',
        author: initialData.author || 'تیم تحریریه تک‌تینک',
        author_role: initialData.author_role || initialData.authorRole || 'کارشناس سخت‌افزار',
        author_avatar: initialData.author_avatar || initialData.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        date: initialData.date || new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date()),
        read_time: initialData.read_time || initialData.readTime || '۵ دقیقه',
        image: initialData.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
        content: initialData.content || '',
        published: initialData.published === 0 || initialData.published === false ? 0 : 1,
        product_slug: initialData.product_slug || initialData.productSlug || '',
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  // Word count & Auto estimated read time
  const wordCount = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
  const charCount = formData.content.length;
  const estimatedMins = Math.max(1, Math.ceil(wordCount / 180));

  // Helper to insert markdown text at current cursor position
  const insertAtCursor = (beforeText, afterText = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData(prev => ({ ...prev, content: prev.content + beforeText + defaultPlaceholder + afterText }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = formData.content;
    const selectedText = previousContent.substring(start, end) || defaultPlaceholder;

    const replacement = `${beforeText}${selectedText}${afterText}`;
    const newContent = previousContent.substring(0, start) + replacement + previousContent.substring(end);

    setFormData(prev => ({ ...prev, content: newContent }));

    // Reset cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + beforeText.length, start + beforeText.length + selectedText.length);
    }, 50);
  };

  // Insert Inline Photo
  const handleInsertPhoto = () => {
    if (!photoUrl.trim()) return;
    const caption = photoCaption.trim() || 'تصویر';
    const imageMarkdown = `\n\n![${caption}](${photoUrl.trim()})\n\n`;
    
    insertAtCursor(imageMarkdown, '', '');
    setPhotoUrl('');
    setPhotoCaption('');
    setIsPhotoModalOpen(false);
  };

  // Insert Inline Video (Aparat / YouTube)
  const handleInsertVideo = () => {
    if (!videoUrl.trim()) return;
    const title = videoTitle.trim() || 'ویدیو';
    const videoMarkdown = `\n\n!video[${title}](${videoUrl.trim()})\n\n`;
    
    insertAtCursor(videoMarkdown, '', '');
    setVideoUrl('');
    setVideoTitle('');
    setIsVideoModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      read_time: `${estimatedMins} دقیقه`
    });
  };

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
        
        {/* Top Header Bar */}
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
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formData.id ? 'ویرایشگر پیشرفته مقاله' : 'نگارش مقاله جدید در وبلاگ تک‌تینک'}
                <span className="badge" style={{ fontSize: '0.7rem', background: 'hsl(var(--accent-purple))', color: '#fff' }}>
                  Live Preview
                </span>
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {wordCount} کلمه • {charCount} کاراکتر • زمان تقریبی مطالعه: {estimatedMins} دقیقه
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
                title="نمایش دو ستونه (کد و پیش‌نمایش زنده)"
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
                title="فقط ویرایشگر متنی"
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
                title="فقط پیش‌نمایش مقاله"
              >
                <Eye size={14} /> پیش‌نمایش
              </button>
            </div>

            {/* Fullscreen Toggle */}
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

        {/* Sub-Header: Metadata & Settings Toggle */}
        <div 
          className="flex" 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '10px 24px',
            borderBottom: '1px solid var(--border-glass)',
            background: '#f8fafc',
            flexShrink: 0,
            fontSize: '0.85rem'
          }}
        >
          <div className="flex" style={{ gap: '16px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>تنظیمات سند:</span>
            <input
              type="text"
              placeholder="عنوان اصلی مقاله..."
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ 
                width: '320px', 
                padding: '6px 12px', 
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            />
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="نقد و بررسی لپ‌تاپ">نقد و بررسی لپ‌تاپ</option>
              <option value="راهنمای خرید">راهنمای خرید</option>
              <option value="اخبار سخت‌افزار">اخبار سخت‌افزار</option>
              <option value="بررسی‌ها">بررسی‌ها</option>
              <option value="بنچمارک‌ها">بنچمارک‌ها</option>
              <option value="نگهداری و تعمیرات">نگهداری و تعمیرات</option>
            </select>

            <button
              type="button"
              className="btn btn-glass"
              style={{ 
                padding: '6px 12px', 
                fontSize: '0.8rem',
                background: activeTab === 'meta' ? 'hsla(var(--accent-purple), 0.2)' : 'transparent',
                borderColor: activeTab === 'meta' ? 'hsl(var(--accent-purple))' : 'var(--border-glass)'
              }}
              onClick={() => setActiveTab(activeTab === 'meta' ? 'content' : 'meta')}
            >
              {activeTab === 'meta' ? 'بستن تنظیمات شاخص' : 'تصویر شاخص و نویسنده ⚙️'}
            </button>
          </div>

          <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
            <label className="flex" style={{ alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={formData.published === 1}
                onChange={e => setFormData({ ...formData, published: e.target.checked ? 1 : 0 })}
                style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--accent-green))' }}
              />
              <span>منتشر شده در سایت</span>
            </label>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubmit} 
              disabled={isSaving}
              style={{ padding: '8px 22px', fontSize: '0.875rem' }}
            >
              {isSaving ? 'در حال ذخیره...' : formData.id ? 'ذخیره تغییرات' : 'انتشار مقاله'}
            </button>
          </div>
        </div>

        {/* Metadata Drawer (Collapsible) */}
        {activeTab === 'meta' && (
          <div 
            className="animate-fade-in"
            style={{ 
              padding: '16px 24px', 
              background: '#f8fafc', 
              borderBottom: '1px solid var(--border-glass)',
              flexShrink: 0
            }}
          >
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>نامک / شناسه URL</label>
                <input
                  type="text"
                  className="font-code"
                  placeholder="laptop-buying-guide-2026"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  style={{ direction: 'ltr', fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>تصویر شاخص کاور (Hero URL)</label>
                <input
                  type="text"
                  className="font-code"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  style={{ direction: 'ltr', fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>نام نویسنده</label>
                <input
                  type="text"
                  placeholder="تیم تحریریه تک‌تینک"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>سمت / نقش نویسنده</label>
                <input
                  type="text"
                  placeholder="تحلیلگر ارشد سخت‌افزار"
                  value={formData.author_role}
                  onChange={e => setFormData({ ...formData, author_role: e.target.value })}
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'hsl(var(--accent-cyan))', fontWeight: 'bold' }}>
                  لپ‌تاپ مرتبط (بررسی اختصاصی این محصول)
                </label>
                <select
                  value={formData.product_slug}
                  onChange={e => {
                    const slug = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      product_slug: slug,
                      category: slug && prev.category === 'راهنمای خرید' ? 'نقد و بررسی لپ‌تاپ' : prev.category
                    }));
                  }}
                  style={{ fontSize: '0.8rem', padding: '6px 10px', width: '100%', borderColor: formData.product_slug ? 'hsl(var(--accent-cyan))' : undefined }}
                >
                  <option value="">بدون ارتباط (مقاله عمومی وبلاگ)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>چکیده و مقدمه کوتاه (برای نمایش در کارت‌های وبلاگ)</label>
                <input
                  type="text"
                  placeholder="توضیح مختصر ۲ خطی..."
                  value={formData.excerpt}
                  onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                  style={{ fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Formatting Toolbar */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div 
            className="flex" 
            style={{ 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 24px', 
              borderBottom: '1px solid var(--border-glass)',
              background: 'rgba(255, 255, 255, 0.02)',
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
            {/* INLINE PHOTO INSERTION BUTTON - HIGHLIGHTED */}
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
                boxShadow: '0 0 12px hsla(var(--accent-cyan), 0.3)'
              }}
              onClick={() => setIsPhotoModalOpen(true)}
              title="افزودن تصویر بین متن مقاله با زیرنویس و تنظیمات"
            >
              <Image size={15} /> افزودن تصویر بین متن
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{ 
                padding: '6px 14px', 
                fontSize: '0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)'
              }}
              onClick={() => setIsVideoModalOpen(true)}
              title="افزودن ویدیوی آپارات یا یوتیوب بین متن مقاله"
            >
              <Video size={15} /> افزودن ویدیو (آپارات / یوتیوب)
            </button>

            <span style={{ height: '20px', width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />

            {/* Typography */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              onClick={() => insertAtCursor('\n## ', '\n', 'سرتیتر بخش')}
              title="تیتر بخش اصلی (H2)"
            >
              <Heading2 size={15} /> H2
            </button>
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              onClick={() => insertAtCursor('\n### ', '\n', 'زیرتیتر')}
              title="زیرتیتر (H3)"
            >
              <Heading3 size={15} /> H3
            </button>

            <span style={{ height: '20px', width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />

            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px' }}
              onClick={() => insertAtCursor('**', '**', 'متن درشت')}
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
              onClick={() => insertAtCursor('\n- ', '\n', 'مورد اول')}
              title="لیست بالت‌دار"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px' }}
              onClick={() => insertAtCursor('\n1. ', '\n', 'مورد اول')}
              title="لیست شماره‌دار"
            >
              <ListOrdered size={15} />
            </button>
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px' }}
              onClick={() => insertAtCursor('\n> ', '\n', 'متن نقل‌قول مهندسی')}
              title="نقل قول"
            >
              <Quote size={15} />
            </button>

            <span style={{ height: '20px', width: '1px', background: 'var(--border-glass)', margin: '0 4px' }} />

            {/* Table */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => insertAtCursor('\n| مشخصه سخت‌افزاری | تک‌تینک بلید ۱۶ | رقیب |\n| :--- | :--- | :--- |\n| پردازنده اصلی | Core i9-14900HX | Core i7 |\n| توان مصرفی گرافیک | 175W TGP | 140W |\n\n')}
              title="درج جدول مقایسه مشخصات"
            >
              <Table size={15} /> جدول
            </button>

            {/* Callouts */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => insertAtCursor('\n> [!TIP]\n> این یک نکته مهم برای افزایش کارایی و طول عمر لپ‌تاپ است.\n\n')}
              title="کادر نکته کاربردی"
            >
              <Sparkles size={14} /> نکته
            </button>
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => insertAtCursor('\n> [!WARNING]\n> هرگز بدون جدا کردن کابل باتری، سوکت خنک‌کننده را باز نکنید.\n\n')}
              title="کادر هشدار فنی"
            >
              <AlertCircle size={14} /> هشدار
            </button>

            {/* Code */}
            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px' }}
              onClick={() => insertAtCursor('\n```bash\n', '\n```\n', 'nvidia-smi --query-gpu=temperature.gpu --format=csv')}
              title="بلوک کد"
            >
              <Code size={15} />
            </button>

            <button
              type="button"
              className="btn btn-glass"
              style={{ padding: '6px 10px' }}
              onClick={() => insertAtCursor('[عنوان پیوند](', ')', 'https://techtink.ir')}
              title="درج لینک"
            >
              <LinkIcon size={15} />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ padding: '10px 24px', background: 'hsla(var(--accent-red), 0.15)', color: 'hsl(var(--accent-red))', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Main Work Area: Split View / Editor / Live Preview */}
        <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* LEFT: Markdown Raw Editor */}
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div 
              style={{ 
                flex: viewMode === 'split' ? '1 1 50%' : '1 1 100%', 
                borderLeft: viewMode === 'split' ? '1px solid var(--border-glass)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                background: 'rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between' }}>
                <span>ویرایشگر متنی (Markdown)</span>
                <span>پشتیبانی کامل از تصاویر درون‌متنی، جدول و تیترها</span>
              </div>
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder={"# عنوان اصلی مقاله\n\nدر این قسمت مقدمه مقاله را بنویسید...\n\n## ۱. مشخصات و بررسی فنی\nبرای افزودن عکس در این نقطه، روی دکمه «افزودن تصویر بین متن» کلیک کنید.\n\n![توضیح تصویر](https://images.unsplash.com/...)\n\n> [!TIP]\n> از محفظه بخار برای خنک‌کاری استفاده شده است."}
                style={{
                  flexGrow: 1,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  padding: '24px',
                  resize: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  lineHeight: '1.9',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* RIGHT: Live Visual Preview */}
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
                <span>پیش‌نمایش زنده (عیناً مانند آنچه کاربر در سایت می‌بیند)</span>
                <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', fontSize: '0.7rem' }}>
                  Live Rendering
                </span>
              </div>

              {/* Rendered Live Article */}
              <div style={{ padding: '32px 40px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* Hero preview in article */}
                {formData.image && (
                  <div style={{ position: 'relative', height: '280px', borderRadius: '16px', overflow: 'hidden', marginBottom: '28px', border: '1px solid var(--border-glass)' }}>
                    <img 
                      src={formData.image} 
                      alt={formData.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))' }}></div>
                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', left: '20px' }}>
                      <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#fff', marginBottom: '8px' }}>
                        {formData.category}
                      </span>
                      <h1 style={{ fontSize: '1.8rem', margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        {formData.title || 'عنوان مقاله'}
                      </h1>
                    </div>
                  </div>
                )}

                {/* Author Info Card */}
                <div className="flex" style={{ gap: '16px', alignItems: 'center', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-glass)' }}>
                  <img 
                    src={formData.author_avatar} 
                    alt={formData.author} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid hsl(var(--accent-cyan))' }} 
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{formData.author}</div>
                    <div className="font-code" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-sans)' }}>{formData.author_role}</span> • <span style={{ fontFamily: 'var(--font-sans)' }}>{formData.date}</span> • <span style={{ fontFamily: 'var(--font-sans)' }}>زمان مطالعه: {estimatedMins} دقیقه</span>
                    </div>
                  </div>
                </div>

                {/* Linked Product Banner */}
                {formData.product_slug && (
                  <div 
                    className="glass-panel flex" 
                    style={{ 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '14px 20px', 
                      borderRadius: '12px', 
                      marginBottom: '28px',
                      background: 'hsla(var(--accent-cyan), 0.08)',
                      border: '1px solid hsla(var(--accent-cyan), 0.3)',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                      <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#fff', fontSize: '0.75rem' }}>
                        نقد و بررسی اختصاصی این لپ‌تاپ
                      </span>
                      <strong style={{ fontSize: '0.95rem' }}>
                        {products.find(p => p.slug === formData.product_slug)?.name || formData.product_slug}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-cyan))' }}>
                      ✓ در برگه اختصاصی محصول ارجاع داده خواهد شد
                    </span>
                  </div>
                )}

                {/* Excerpt lead */}
                {formData.excerpt && (
                  <div style={{ 
                    padding: '16px 20px', 
                    borderRadius: '10px', 
                    background: 'hsla(var(--accent-cyan), 0.05)', 
                    borderRight: '3px solid hsl(var(--accent-cyan))',
                    marginBottom: '28px',
                    fontSize: '1.05rem',
                    lineHeight: '1.8',
                    color: 'var(--text-primary)',
                    fontStyle: 'italic'
                  }}>
                    {formData.excerpt}
                  </div>
                )}

                {/* Parsed Markdown Body */}
                <div 
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(formData.content || '*هنوز متنی تایپ نشده است. در پنل ویرایشگر شروع به نوشتن نمایید.*') }}
                />

              </div>
            </div>
          )}

        </div>

      </div>

      {/* INLINE PHOTO INSERTION MODAL */}
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
                درج تصویر بین متن مقاله
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
              تصویر مستقیماً در محل نشانگر متن درج خواهد شد و همراه با کادر و زیرنویس اختصاصی در پیش‌نمایش زنده نمایش داده می‌شود.
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
                  placeholder="مثال: سیستم خنک‌کننده محفظه بخار مسی لپ‌تاپ تک‌تینک بلید"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Quick Preset Photos */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  یا انتخاب سریع از عکس‌های پیشنهادی سخت‌افزاری:
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
                  درج در متن مقاله
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Video Inserter Dialog */}
      {isVideoModalOpen && (
        <div className="modal-backdrop-wrapper" style={{ zIndex: 125 }}>
          <div 
            className="glass-panel modal-card" 
            style={{ maxWidth: '580px', width: '92%', padding: '24px', animation: 'scaleUp 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="flex" style={{ alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={20} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>افزودن ویدیوی بررسی یا تست (آپارات / یوتیوب)</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aparat & YouTube Video Embed</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-glass" 
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setIsVideoModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              لینک ویدیوی مورد نظر خود را از آپارات (Aparat) یا یوتیوب (YouTube) وارد کنید تا به صورت پلیر واکنش‌گرا و سازگار با اینترنت ایران در متن نمایش داده شود.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  آدرس اینترنتی ویدیو (URL) <span style={{ color: '#ef4444' }}>*</span>
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
