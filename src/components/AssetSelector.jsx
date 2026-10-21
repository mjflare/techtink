import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Folder, FolderOpen, Globe, Link, Rotate3d, Image as ImageIcon, 
  Check, AlertCircle, Trash2, RefreshCw, Eye, Copy, FileText, Sparkles, 
  X, ExternalLink, ChevronDown, CheckCircle2, Search
} from 'lucide-react';
import { handleImageError } from '../utils/imageFallback.js';

export default function AssetSelector({
  label = '',
  value = '',
  onChange = () => {},
  type = 'image', // 'image' | 'model'
  placeholder = '',
  helperText = '',
  compact = false,
  presets = []
}) {
  // Determine initial active mode based on value
  const initialMode = (() => {
    if (!value) return 'upload';
    if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
    return 'local';
  })();

  const [mode, setMode] = useState(initialMode);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Server directory list & scanner state
  const [serverAssets, setServerAssets] = useState([]);
  const [isLoadingServerList, setIsLoadingServerList] = useState(false);
  const [customDirInput, setCustomDirInput] = useState('');
  const [isScanningDir, setIsScanningDir] = useState(false);
  const [dirScanResult, setDirScanResult] = useState(null);

  // Preview & interactive 3D viewer toggle
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const fileInputRef = useRef(null);

  const isModel = type === 'model';
  const acceptedExtensions = isModel ? '.glb,.gltf,.bin' : 'image/*,.webp,.jpg,.jpeg,.png,.svg,.avif';

  // Load server assets when switching to 'local' mode
  const fetchServerAssets = async () => {
    setIsLoadingServerList(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('techtink_token') || '';
      const res = await fetch('/api/admin/media/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = isModel ? (data.models || []) : (data.images || []);
        setServerAssets(list);
      }
    } catch (e) {
      console.warn('Failed to fetch server media assets:', e);
    } finally {
      setIsLoadingServerList(false);
    }
  };

  useEffect(() => {
    if (mode === 'local') {
      fetchServerAssets();
    }
  }, [mode, type]);

  // Handle local file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    setIsUploading(true);
    setUploadProgress(15);

    // Validate size (max 60MB for 3D models, 20MB for images)
    const maxBytes = isModel ? 60 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`حجم فایل نباید بیش از ${isModel ? '۶۰' : '۲۰'} مگابایت باشد.`);
      setIsUploading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 60);
          setUploadProgress(Math.min(75, 15 + percent));
        }
      };

      reader.onload = async () => {
        try {
          setUploadProgress(80);
          const base64Data = reader.result;
          const token = localStorage.getItem('token') || localStorage.getItem('techtink_token') || '';

          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              filename: file.name,
              data: base64Data,
              type: isModel ? 'model' : 'image'
            })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'خطا در آپلود فایل');
          }

          setUploadProgress(100);
          setUploadSuccess(`فایل "${file.name}" با موفقیت در سرور و دیتابیس ثبت شد.`);
          onChange(data.url);
          setTimeout(() => setUploadSuccess(''), 4000);
        } catch (err) {
          setUploadError(err.message || 'خطا در ارتباط با سرور');
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setUploadError('خطا در خواندن فایل از حافظه دستگاه.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError(err.message || 'خطا در پردازش فایل');
      setIsUploading(false);
    }
  };

  // Scan custom directory on server
  const handleScanDirectory = async () => {
    if (!customDirInput.trim()) return;
    setIsScanningDir(true);
    setDirScanResult(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('techtink_token') || '';
      const res = await fetch('/api/admin/media/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ directory: customDirInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'دایرکتوری یافت نشد');
      setDirScanResult(data);
      if (data.files && data.files.length > 0) {
        fetchServerAssets();
      }
    } catch (e) {
      setDirScanResult({ error: e.message });
    } finally {
      setIsScanningDir(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className={`asset-selector-wrapper ${compact ? 'asset-selector-compact' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? '8px' : '12px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Label & Active Value Badge Header */}
      {label && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          <label style={{
            fontSize: compact ? '0.75rem' : '0.82rem',
            fontWeight: 700,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: isModel ? 'hsl(var(--accent-cyan))' : 'var(--text-primary)'
          }}>
            {isModel ? <Rotate3d size={15} /> : <ImageIcon size={15} />}
            {label}
          </label>

          {value && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.7rem',
              background: 'hsla(var(--accent-cyan), 0.1)',
              border: '1px solid hsla(var(--accent-cyan), 0.25)',
              borderRadius: '6px',
              padding: '2px 8px',
              color: 'hsl(var(--accent-cyan))'
            }}>
              <span>{value.startsWith('http') ? 'لینک اینترنتی' : value.startsWith('/uploads') ? 'آپلود سرور' : 'لوکال سرور'}</span>
              <button
                type="button"
                onClick={handleCopyUrl}
                title="کپی آدرس"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'currentColor',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {copiedNotification ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3-Mode Source Tabs (Mobile Thumb-Friendly) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        background: 'rgba(0, 0, 0, 0.15)',
        padding: '3px',
        borderRadius: '10px',
        border: '1px solid var(--border-glass)'
      }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            minHeight: '38px',
            padding: '6px 8px',
            border: 'none',
            borderRadius: '8px',
            fontSize: compact ? '0.72rem' : '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
            background: mode === 'upload' ? 'hsl(var(--accent-cyan))' : 'transparent',
            color: mode === 'upload' ? '#fff' : 'var(--text-secondary)',
            boxShadow: mode === 'upload' ? '0 2px 8px hsla(var(--accent-cyan), 0.3)' : 'none'
          }}
        >
          <Upload size={14} />
          <span>آپلود فایل</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('local')}
          style={{
            minHeight: '38px',
            padding: '6px 8px',
            border: 'none',
            borderRadius: '8px',
            fontSize: compact ? '0.72rem' : '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
            background: mode === 'local' ? 'hsl(var(--accent-cyan))' : 'transparent',
            color: mode === 'local' ? '#fff' : 'var(--text-secondary)',
            boxShadow: mode === 'local' ? '0 2px 8px hsla(var(--accent-cyan), 0.3)' : 'none'
          }}
        >
          <Folder size={14} />
          <span>مسیر / دایرکتوری</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            minHeight: '38px',
            padding: '6px 8px',
            border: 'none',
            borderRadius: '8px',
            fontSize: compact ? '0.72rem' : '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
            background: mode === 'url' ? 'hsl(var(--accent-cyan))' : 'transparent',
            color: mode === 'url' ? '#fff' : 'var(--text-secondary)',
            boxShadow: mode === 'url' ? '0 2px 8px hsla(var(--accent-cyan), 0.3)' : 'none'
          }}
        >
          <Globe size={14} />
          <span>لینک اینترنتی</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: LOCAL FILE UPLOAD ──────────────── */}
      {mode === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept={acceptedExtensions}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragOver ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)'}`,
              borderRadius: '12px',
              padding: compact ? '16px 12px' : '22px 16px',
              background: isDragOver ? 'hsla(var(--accent-cyan), 0.1)' : 'rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: compact ? '36px' : '44px',
              height: compact ? '36px' : '44px',
              borderRadius: '50%',
              background: 'hsla(var(--accent-cyan), 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--accent-cyan))'
            }}>
              {isUploading ? (
                <RefreshCw size={compact ? 18 : 22} className="spin" />
              ) : isModel ? (
                <Rotate3d size={compact ? 18 : 22} />
              ) : (
                <Upload size={compact ? 18 : 22} />
              )}
            </div>

            <div>
              <div style={{ fontSize: compact ? '0.78rem' : '0.84rem', fontWeight: 700 }}>
                {isUploading ? 'در حال ارسال و ذخیره‌سازی فایل...' : 'کلیک کنید یا فایل را اینجا بکشید'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isModel
                  ? 'پشتیبانی از فرمت‌های ۳D استاندارد: .glb / .gltf (حداکثر ۶۰ مگابایت)'
                  : 'پشتیبانی از تصاویر WebP, PNG, JPG, SVG (حداکثر ۲۰ مگابایت)'}
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div style={{ width: '80%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, hsl(var(--accent-cyan)), hsl(var(--accent-blue)))',
                  transition: 'width 0.2s ease'
                }} />
              </div>
            )}
          </div>

          {/* Messages */}
          {uploadError && (
            <div style={{
              fontSize: '0.75rem',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)'
            }}>
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div style={{
              fontSize: '0.75rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)'
            }}>
              <CheckCircle2 size={14} /> {uploadSuccess}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: LOCAL SERVER PATH & DIRECTORY ──────────────── */}
      {mode === 'local' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Quick Select from detected server assets */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                انتخاب سریع از فایل‌های موجود در سرور:
              </span>
              <button
                type="button"
                onClick={fetchServerAssets}
                disabled={isLoadingServerList}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--accent-cyan))',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px'
                }}
              >
                <RefreshCw size={11} className={isLoadingServerList ? 'spin' : ''} />
                به‌روزرسانی
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {/* Core Default Model for 3D */}
              {isModel && (
                <button
                  type="button"
                  onClick={() => onChange('/models/laptop-flagship.glb')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.73rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: value === '/models/laptop-flagship.glb' ? '1px solid hsl(var(--accent-cyan))' : '1px solid var(--border-glass)',
                    background: value === '/models/laptop-flagship.glb' ? 'hsla(var(--accent-cyan), 0.2)' : 'rgba(0,0,0,0.05)',
                    color: value === '/models/laptop-flagship.glb' ? 'hsl(var(--accent-cyan))' : 'var(--text-primary)'
                  }}
                >
                  <Sparkles size={12} />
                  <span>مدل پرچمدار پیش‌فرض (/models/laptop-flagship.glb)</span>
                </button>
              )}

              {serverAssets.map((asset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange(asset.path)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.73rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: value === asset.path ? '1px solid hsl(var(--accent-cyan))' : '1px solid var(--border-glass)',
                    background: value === asset.path ? 'hsla(var(--accent-cyan), 0.2)' : 'rgba(0,0,0,0.05)',
                    color: value === asset.path ? 'hsl(var(--accent-cyan))' : 'var(--text-primary)'
                  }}
                >
                  <FileText size={12} />
                  <span style={{ direction: 'ltr', fontFamily: 'var(--font-code)' }}>{asset.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    ({Math.round((asset.size || 0) / 1024)}KB)
                  </span>
                </button>
              ))}

              {!isModel && serverAssets.length === 0 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '6px' }}>
                  هیچ تصویری در پوشه آپلودها یافت نشد. می‌توانید از تب «آپلود فایل» عکس دلخواه را اضافه کنید.
                </div>
              )}
            </div>
          </div>

          {/* Manual Local Path Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              یا مسیر نسبی فایل در سرور را دستی وارد کنید:
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={isModel ? '/models/laptop-flagship.glb یا /uploads/models/...' : '/uploads/images/...'}
              style={{
                direction: 'ltr',
                fontFamily: 'var(--font-code)',
                fontSize: '0.78rem',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Directory Scanner Accordion */}
          <div style={{
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FolderOpen size={13} color="hsl(var(--accent-cyan))" />
              <span>اسکن دایرکتوری خاص روی سرور:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={customDirInput}
                onChange={(e) => setCustomDirInput(e.target.value)}
                placeholder="مثال: /models یا public/uploads"
                style={{
                  direction: 'ltr',
                  fontFamily: 'var(--font-code)',
                  fontSize: '0.75rem',
                  flexGrow: 1,
                  padding: '6px 10px',
                  borderRadius: '6px'
                }}
              />
              <button
                type="button"
                onClick={handleScanDirectory}
                disabled={isScanningDir || !customDirInput.trim()}
                className="btn btn-glass"
                style={{
                  fontSize: '0.72rem',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isScanningDir ? <RefreshCw size={12} className="spin" /> : <Search size={12} />}
                اسکن
              </button>
            </div>

            {dirScanResult && (
              <div style={{ marginTop: '8px', fontSize: '0.72rem' }}>
                {dirScanResult.error ? (
                  <span style={{ color: '#ef4444' }}>{dirScanResult.error}</span>
                ) : (
                  <span style={{ color: '#10b981' }}>
                    تعداد {dirScanResult.count} فایل در دایرکتوری پیدا و ثبت شد.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: REMOTE WEB URL ──────────────── */}
      {mode === 'url' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || (isModel ? 'https://example.com/model.glb' : 'https://images.unsplash.com/...')}
              style={{
                direction: 'ltr',
                fontFamily: 'var(--font-code)',
                fontSize: '0.78rem',
                flexGrow: 1,
                padding: '9px 12px',
                borderRadius: '8px'
              }}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                title="پاک‌کردن"
                className="btn btn-glass"
                style={{ padding: '0 10px', color: '#ef4444' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Preset Buttons if provided */}
          {presets.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>پیش‌فرض‌های پیشنهادی:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(p.url)}
                  className="btn btn-glass"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── PREVIEW SECTION ──────────────── */}
      {value && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.05)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              direction: 'ltr',
              fontFamily: 'var(--font-code)',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all'
            }}>
              <Check size={13} color="#10b981" />
              <span>{value}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isModel && (
                <button
                  type="button"
                  onClick={() => setShow3DPreview(!show3DPreview)}
                  className="btn btn-glass"
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: show3DPreview ? 'hsl(var(--accent-cyan))' : 'inherit'
                  }}
                >
                  <Rotate3d size={13} />
                  <span>{show3DPreview ? 'بستن پیش‌نمایش ۳D' : 'تست چرخش ۳D'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onChange('')}
                className="btn btn-glass"
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={13} />
                <span>حذف</span>
              </button>
            </div>
          </div>

          {/* Photo Preview Thumbnail */}
          {!isModel && (
            <div style={{
              width: '100%',
              maxHeight: compact ? '110px' : '180px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-glass)'
            }}>
              <img
                src={value}
                alt="Preview"
                onError={handleImageError}
                style={{
                  maxWidth: '100%',
                  maxHeight: compact ? '110px' : '180px',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}

          {/* Interactive 3D Model Test Viewer */}
          {isModel && show3DPreview && (
            <div style={{
              width: '100%',
              height: '240px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid hsla(var(--accent-cyan), 0.3)',
              position: 'relative'
            }}>
              <model-viewer
                src={value}
                alt="3D Model Preview"
                auto-rotate
                camera-controls
                shadow-intensity="1.5"
                exposure="1.0"
                style={{ width: '100%', height: '100%' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                color: '#fff'
              }}>
                مدل را با ماوس یا لمس بچرخانید
              </div>
            </div>
          )}
        </div>
      )}

      {helperText && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '-4px' }}>
          {helperText}
        </div>
      )}
    </div>
  );
}
