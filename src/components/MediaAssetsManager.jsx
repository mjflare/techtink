import React, { useState, useEffect } from 'react';
import { 
  Rotate3d, Image as ImageIcon, Upload, Search, Trash2, Copy, Check, 
  RefreshCw, Folder, FolderOpen, ExternalLink, Sparkles, AlertCircle, 
  CheckCircle2, FileText, Eye, X, Shield, HardDrive, Info
} from 'lucide-react';
import { handleImageError } from '../utils/imageFallback.js';

export default function MediaAssetsManager({ token }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'model' | 'image'
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState([]);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 3D Model Inspector state
  const [inspectingModel, setInspectingModel] = useState(null);
  // Image Inspector modal state
  const [inspectingImage, setInspectingImage] = useState(null);

  // Copy notification
  const [copiedPath, setCopiedPath] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadType, setUploadType] = useState('model'); // 'model' | 'image'

  // Directory Scanner
  const [scanDirInput, setScanDirInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const authToken = token || localStorage.getItem('token') || localStorage.getItem('techtink_token') || '';

  const fetchMedia = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/media/list', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت لیست رسانه‌ها');
      const data = await res.json();
      setModels(data.models || []);
      setImages(data.images || []);
    } catch (err) {
      setError(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCopy = (path) => {
    navigator.clipboard?.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(''), 2500);
  };

  const handleDelete = async (assetPath) => {
    if (!window.confirm(`آیا از حذف فایل "${assetPath}" مطمئن هستید؟`)) return;
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ path: assetPath })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در حذف فایل');
      if (inspectingModel?.path === assetPath) setInspectingModel(null);
      if (inspectingImage?.path === assetPath) setInspectingImage(null);
      fetchMedia();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setUploadError('');
    setUploadSuccess('');
    setIsUploading(true);
    setUploadProgress(20);

    const isGlb = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
    const assetType = isGlb ? 'model' : 'image';

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 60) + 20);
      }
    };

    reader.onload = async () => {
      try {
        setUploadProgress(85);
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            filename: file.name,
            data: reader.result,
            type: assetType
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطا در آپلود');

        setUploadProgress(100);
        setUploadSuccess(`فایل "${data.filename}" با موفقیت ذخیره شد. مسیر: ${data.url}`);
        fetchMedia();
        setTimeout(() => setUploadSuccess(''), 5000);
      } catch (err) {
        setUploadError(err.message || 'خطا در آپلود');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('خطا در خواندن فایل از حافظه.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleScanDirectory = async () => {
    if (!scanDirInput.trim()) return;
    setIsScanning(true);
    setScanMessage('');
    try {
      const res = await fetch('/api/admin/media/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ directory: scanDirInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در اسکن');
      setScanMessage(`دایرکتوری با موفقیت اسکن شد. ${data.count} فایل یافت و در دیتابیس ثبت گردید.`);
      fetchMedia();
    } catch (err) {
      setScanMessage(`خطا: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Combine and filter list
  const allAssets = [
    ...models.map(m => ({ ...m, type: 'model' })),
    ...images.map(img => ({ ...img, type: 'image' }))
  ];

  const filteredAssets = allAssets.filter(item => {
    if (activeFilter === 'model' && item.type !== 'model') return false;
    if (activeFilter === 'image' && item.type !== 'image') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (item.name || '').toLowerCase().includes(q) || (item.path || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalBytes = allAssets.reduce((sum, a) => sum + (a.size || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      {/* Header & Overview Stats */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        borderRadius: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <h2 style={{
            margin: '0 0 6px 0',
            fontSize: '1.25rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'hsl(var(--accent-cyan))'
          }}>
            <Rotate3d size={22} />
            مدیریت فایل‌ها، عکس‌ها و مدل‌های ۳D سرور
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            امکان انتخاب ۳ روش برای مدل‌ها و عکس‌ها: ذخیره محلی در دیتابیس، مشخص کردن دایرکتوری، یا درج لینک اینترنتی
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{
            background: 'hsla(var(--accent-cyan), 0.1)',
            border: '1px solid hsla(var(--accent-cyan), 0.3)',
            borderRadius: '10px',
            padding: '8px 14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>مدل‌های ۳D</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--accent-cyan))' }}>
              {models.length}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            padding: '8px 14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>تصاویر و عکس‌ها</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {images.length}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            padding: '8px 14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>حجم کل مصرفی</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--accent-green))' }}>
              {totalMB} MB
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMedia}
            disabled={isLoading}
            className="btn btn-glass"
            style={{ minHeight: '44px', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* Direct File Upload & Directory Scanner Row */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Box 1: Direct File Uploader (Dropzone) */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} color="hsl(var(--accent-cyan))" />
            <span>روش ۱: آپلود مستقیم فایل لوکال به سرور و دیتابیس</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            فایل مدل ۳D (.glb/.gltf) یا تصویر لپ‌تاپ را انتخاب کنید تا مستقیماً در سرور ذخیره و مسیر آن آماده استفاده شود:
          </p>

          <label style={{
            border: '2px dashed var(--border-glass)',
            borderRadius: '12px',
            padding: '24px 16px',
            background: 'rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="file"
              accept=".glb,.gltf,.bin,image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'hsla(var(--accent-cyan), 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--accent-cyan))'
            }}>
              {isUploading ? <RefreshCw size={20} className="spin" /> : <Upload size={20} />}
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                {isUploading ? 'در حال آپلود و ذخیره‌سازی در دیتابیس...' : 'انتخاب یا رها کردن فایل در اینجا'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                پشتیبانی از مدل‌های سه‌بعدی GLB / GLTF تا ۶۰MB و تصاویر تا ۲۰MB
              </div>
            </div>

            {isUploading && (
              <div style={{ width: '80%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-blue)))',
                  transition: 'width 0.2s ease'
                }} />
              </div>
            )}
          </label>

          {uploadError && (
            <div style={{
              fontSize: '0.78rem',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)'
            }}>
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div style={{
              fontSize: '0.78rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)'
            }}>
              <CheckCircle2 size={14} /> {uploadSuccess}
            </div>
          )}
        </div>

        {/* Box 2: Directory Scanner */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={16} color="hsl(var(--accent-cyan))" />
            <span>روش ۲: اسکن و شناسایی خودکار دایرکتوری محلی سرور</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            اگر فایل‌ها را از طریق FTP، SSH یا اسکریپت در پوشه‌ای از سرور ریخته‌اید، نام پوشه را وارد کنید تا همه مدل‌ها و تصاویر ثبت شوند:
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={scanDirInput}
              onChange={(e) => setScanDirInput(e.target.value)}
              placeholder="مثال: /models یا public/models یا uploads"
              style={{
                direction: 'ltr',
                fontFamily: 'var(--font-code)',
                fontSize: '0.8rem',
                flexGrow: 1,
                padding: '10px 14px',
                borderRadius: '10px'
              }}
            />
            <button
              type="button"
              onClick={handleScanDirectory}
              disabled={isScanning || !scanDirInput.trim()}
              className="btn btn-primary"
              style={{
                minHeight: '44px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
            >
              {isScanning ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
              <span>اسکن دایرکتوری</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>پوشه‌های پیشنهادی:</span>
            {['/models', 'public/models', '/uploads/models', '/uploads/images'].map((dir, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScanDirInput(dir)}
                className="btn btn-glass"
                style={{ fontSize: '0.7rem', padding: '3px 8px', fontFamily: 'var(--font-code)' }}
              >
                {dir}
              </button>
            ))}
          </div>

          {scanMessage && (
            <div style={{
              fontSize: '0.78rem',
              color: scanMessage.startsWith('خطا') ? '#ef4444' : '#10b981',
              padding: '8px 12px',
              borderRadius: '8px',
              background: scanMessage.startsWith('خطا') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'
            }}>
              {scanMessage}
            </div>
          )}

          <div style={{
            marginTop: 'auto',
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.03)',
            borderRadius: '8px',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Info size={14} color="hsl(var(--accent-cyan))" />
            <span>مسیرها به صورت استاندارد در دیتابیس با آدرس وب (مثل <code>/models/...</code>) ثبت می‌شوند.</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        borderRadius: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `همه رسانه‌ها (${allAssets.length})` },
            { id: 'model', label: `مدل‌های ۳D (${models.length})`, icon: Rotate3d },
            { id: 'image', label: `تصاویر و گالری (${images.length})`, icon: ImageIcon }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                minHeight: '38px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeFilter === tab.id ? 'hsl(var(--accent-cyan))' : 'rgba(0,0,0,0.06)',
                color: activeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon && <tab.icon size={14} />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', minWidth: '240px', flexGrow: 1, maxWidth: '360px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام فایل یا مسیر..."
            style={{
              padding: '8px 34px 8px 12px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          <Search size={15} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                left: '8px',
                top: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Asset Cards Grid */}
      {filteredAssets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
          <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>هیچ فایلی یافت نشد</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            می‌توانید از بخش بالای صفحه، فایل‌های مدل ۳D یا عکس را مستقیماً آپلود یا دایرکتوری را اسکن کنید.
          </div>
        </div>
      ) : (
        <div className="grid" style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filteredAssets.map((asset, idx) => {
            const isModelAsset = asset.type === 'model';
            const sizeKB = Math.round((asset.size || 0) / 1024);
            const sizeMB = (asset.size / (1024 * 1024)).toFixed(2);
            const displaySize = sizeKB > 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
            const isProtected = asset.path === '/models/laptop-flagship.glb';
            const isCopied = copiedPath === asset.path;

            return (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  border: isModelAsset ? '1px solid hsla(var(--accent-cyan), 0.25)' : '1px solid var(--border-glass)',
                  position: 'relative'
                }}
              >
                {/* Media Thumbnail or 3D Icon Box */}
                <div style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '10px',
                  background: isModelAsset
                    ? 'radial-gradient(circle at center, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)'
                    : 'rgba(0, 0, 0, 0.15)',
                  border: '1px solid var(--border-glass)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  cursor: isModelAsset ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (isModelAsset) setInspectingModel(asset);
                  else setInspectingImage(asset);
                }}
                >
                  {isModelAsset ? (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <Rotate3d size={42} color="hsl(var(--accent-cyan))" />
                      <span style={{ fontSize: '0.72rem', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '6px' }}>
                        کلیک برای چرخش و تست ۳D
                      </span>
                    </div>
                  ) : (
                    <img
                      src={asset.path}
                      alt={asset.name}
                      onError={handleImageError}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}

                  {/* Top-Right Badge: Type */}
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isModelAsset ? 'hsl(var(--accent-cyan))' : 'rgba(0, 0, 0, 0.6)',
                    color: '#fff'
                  }}>
                    {isModelAsset ? 'مدل ۳D (.glb)' : 'تصویر'}
                  </span>

                  {/* Protected System Badge */}
                  {isProtected && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'hsla(var(--accent-purple), 0.8)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Shield size={10} /> هسته اصلی
                    </span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    direction: 'ltr',
                    fontFamily: 'var(--font-code)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {asset.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    marginTop: '4px'
                  }}>
                    <span>حجم: {displaySize}</span>
                    <span style={{ direction: 'ltr', fontFamily: 'var(--font-code)' }}>{asset.directory}</span>
                  </div>
                </div>

                {/* Path Display & 1-Click Copy */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0, 0, 0, 0.08)',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem'
                }}>
                  <span style={{
                    direction: 'ltr',
                    fontFamily: 'var(--font-code)',
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)'
                  }}>
                    {asset.path}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(asset.path)}
                    title="کپی آدرس مسیر جهت درج در محصول"
                    className="btn btn-glass"
                    style={{
                      padding: '3px 6px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{isCopied ? 'کپی شد' : 'کپی'}</span>
                  </button>
                </div>

                {/* Actions Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-glass)'
                }}>
                  {isModelAsset ? (
                    <button
                      type="button"
                      onClick={() => setInspectingModel(asset)}
                      className="btn btn-glass"
                      style={{
                        fontSize: '0.72rem',
                        padding: '5px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'hsl(var(--accent-cyan))'
                      }}
                    >
                      <Rotate3d size={13} />
                      <span>تست و چرخش ۳D</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInspectingImage(asset)}
                      className="btn btn-glass"
                      style={{
                        fontSize: '0.72rem',
                        padding: '5px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={13} />
                      <span>مشاهده در اندازه واقعی</span>
                    </button>
                  )}

                  {!isProtected && (
                    <button
                      type="button"
                      onClick={() => handleDelete(asset.path)}
                      title="حذف این فایل از سرور"
                      className="btn btn-glass"
                      style={{
                        fontSize: '0.72rem',
                        padding: '5px 8px',
                        color: '#ef4444'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ──────────────── 3D MODEL INSPECTION MODAL ──────────────── */}
      {inspectingModel && (
        <div className="modal-backdrop-wrapper" style={{ zIndex: 120 }}>
          <div className="glass-panel modal-card" style={{ maxWidth: '780px', width: '95%', padding: '0', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--accent-cyan))' }}>
                  <Rotate3d size={18} />
                  کاوش و بررسی زنده مدل سه‌بعدی
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', direction: 'ltr', fontFamily: 'var(--font-code)' }}>
                  {inspectingModel.path}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingModel(null)}
                className="btn btn-glass"
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Interactive 3D Model Viewer Canvas */}
            <div style={{
              width: '100%',
              height: '380px',
              background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.98) 100%)',
              position: 'relative'
            }}>
              <model-viewer
                src={inspectingModel.path}
                alt={inspectingModel.name}
                auto-rotate
                camera-controls
                shadow-intensity="1.5"
                exposure="1.0"
                style={{ width: '100%', height: '100%' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                color: '#fff'
              }}>
                با لمس یا کشیدن ماوس مدل را ۳۶۰ درجه بچرخانید
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                حجم فایل: {Math.round((inspectingModel.size || 0) / 1024)} کیلوبایت
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(inspectingModel.path)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Copy size={14} />
                  <span>کپی آدرس مسیر برای استفاده در لپ‌تاپ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingModel(null)}
                  className="btn btn-glass"
                  style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── IMAGE INSPECTION MODAL ──────────────── */}
      {inspectingImage && (
        <div className="modal-backdrop-wrapper" style={{ zIndex: 120 }}>
          <div className="glass-panel modal-card" style={{ maxWidth: '640px', width: '95%', padding: '0', overflow: 'hidden' }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', direction: 'ltr', fontFamily: 'var(--font-code)' }}>
                {inspectingImage.name}
              </div>
              <button
                type="button"
                onClick={() => setInspectingImage(null)}
                className="btn btn-glass"
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <img
                src={inspectingImage.path}
                alt={inspectingImage.name}
                onError={handleImageError}
                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>

            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.75rem', direction: 'ltr', fontFamily: 'var(--font-code)' }}>
                {inspectingImage.path}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(inspectingImage.path)}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Copy size={13} />
                <span>کپی آدرس تصویر</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
