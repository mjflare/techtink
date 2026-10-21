import React, { useState, useEffect } from 'react';
import { 
  Star, CheckCircle, AlertTriangle, ShieldCheck, Truck, RotateCcw, 
  Cpu, HardDrive, Monitor, ArrowLeftRight, Plus, ShoppingCart, MessageSquare, 
  Send, User, ArrowRight, ArrowLeft, Check, Sparkles, Download, Eye,
  ThumbsUp, ThumbsDown, BookOpen, Layers, BarChart2, Zap, FileText, Battery, X, Rotate3d
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../utils/formatPrice.js';
import { getShortSpecs } from '../utils/shortSpecs.js';
import { renderMarkdownToHtml } from '../utils/markdownRenderer.js';
import AppleFlagshipShowcase from './AppleFlagshipShowcase.jsx';
import LaptopModelViewer from './LaptopModelViewer.jsx';

function ProductPageLoadingAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'دریافت اطلاعات پردازنده و کارت گرافیک...',
    'بررسی سرعت قطعات و نتایج تست‌ها...',
    'آماده‌سازی مدل سه‌بعدی و مشخصات لپ‌تاپ...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container" style={{ padding: '48px 16px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Central Glass Card */}
      <div 
        className="glass-card animate-fade-in"
        style={{
          padding: '36px 20px',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.07)',
          border: '1px solid var(--border-glass)'
        }}
      >
        {/* Ambient Neon Atmosphere */}
        <div style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '240px', height: '240px',
          background: 'radial-gradient(circle, hsla(var(--accent-cyan), 0.22) 0%, transparent 70%)',
          filter: 'blur(45px)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', right: '15%',
          width: '180px', height: '180px',
          background: 'radial-gradient(circle, hsla(var(--accent-purple), 0.18) 0%, transparent 70%)',
          filter: 'blur(45px)', pointerEvents: 'none'
        }} />

        {/* Holographic Chipset Emblem with Dual Laser Rings */}
        <div style={{ position: 'relative', width: '84px', height: '84px', margin: '0 auto 18px' }}>
          {/* Outer Laser Ring */}
          <div 
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'hsl(var(--accent-cyan))',
              borderRightColor: 'hsl(var(--accent-purple))',
              animation: 'spinLoaderFast 1.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite'
            }} 
          />
          {/* Counter Dashed Tracer Ring */}
          <div 
            style={{
              position: 'absolute', inset: '5px', borderRadius: '50%',
              border: '1.5px dashed hsla(var(--accent-cyan), 0.4)',
              animation: 'spinLoaderReverse 3s linear infinite'
            }} 
          />
          {/* Inner Chip Core with Breathing Glow */}
          <div 
            style={{
              position: 'absolute', inset: '11px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 249, 255, 0.75))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(12px)',
              animation: 'chipPulse 2.2s ease-in-out infinite'
            }}
          >
            <Cpu size={30} style={{ color: 'hsl(var(--accent-cyan))', filter: 'drop-shadow(0 0 10px hsla(var(--accent-cyan), 0.5))' }} />
          </div>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
          <span className="gradient-text">در حال بارگذاری مشخصات دستگاه...</span>
        </h3>

        {/* Dynamic Telemetry Status Ticker */}
        <div style={{ minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
          <span 
            key={activeStep} 
            className="animate-fade-in"
            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={13} style={{ color: 'hsl(var(--accent-purple))', flexShrink: 0 }} />
            {steps[activeStep]}
          </span>
        </div>

        {/* Fluid Shimmer Progress Track */}
        <div style={{
          width: '100%', height: '4px', borderRadius: '100px',
          background: 'rgba(0, 0, 0, 0.06)', overflow: 'hidden', position: 'relative'
        }}>
          <div 
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '45%',
              background: 'linear-gradient(90deg, transparent, hsl(var(--accent-cyan)), hsl(var(--accent-purple)), transparent)',
              borderRadius: '100px',
              animation: 'shimmerSlide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite'
            }} 
          />
        </div>

        {/* Micro Telemetry Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
          {[
            { label: 'دمای خنک‌کننده', color: 'hsl(var(--accent-cyan))' },
            { label: 'سلامت قطعات', color: 'hsl(var(--accent-green))' },
            { label: 'مدل سه‌بعدی', color: 'hsl(var(--accent-purple))' }
          ].map((pill, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '100px',
                background: 'rgba(0, 0, 0, 0.03)',
                border: '1px solid var(--border-glass)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-secondary)'
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: pill.color, boxShadow: `0 0 6px ${pill.color}` }} />
              {pill.label}
            </span>
          ))}
        </div>
      </div>

      {/* Skeleton Ghost Wireframe Preview - Desktop Only */}
      <div 
        className="tt-loader-desktop-skeleton"
        style={{
          marginTop: '28px',
          maxWidth: '860px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          opacity: 0.35,
          pointerEvents: 'none'
        }}
      >
        <div style={{ height: '220px', borderRadius: '20px', background: 'rgba(0,0,0,0.03)', border: '1px dashed var(--border-glass)', animation: 'skeletonGlow 2s ease-in-out infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <div style={{ height: '26px', width: '65%', borderRadius: '10px', background: 'rgba(0,0,0,0.04)', animation: 'skeletonGlow 2s ease-in-out infinite 0.2s' }} />
          <div style={{ height: '16px', width: '85%', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', animation: 'skeletonGlow 2s ease-in-out infinite 0.4s' }} />
          <div style={{ height: '36px', width: '45%', borderRadius: '10px', background: 'rgba(0,0,0,0.04)', marginTop: '6px', animation: 'skeletonGlow 2s ease-in-out infinite 0.6s' }} />
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .tt-loader-desktop-skeleton {
          display: none;
        }
        @keyframes spinLoaderFast {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinLoaderReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes chipPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px hsla(var(--accent-cyan), 0.3)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 16px hsla(var(--accent-cyan), 0.6)); }
        }
        @keyframes shimmerSlide {
          0% { left: -45%; }
          100% { left: 100%; }
        }
        @keyframes skeletonGlow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @media (min-width: 768px) {
          .tt-loader-desktop-skeleton {
            display: grid;
          }
        }
      `}} />
    </div>
  );
}

export default function ProductPage({ 
  productSlug, 
  onBack, 
  onAddToCart, 
  onCompare, 
  compareList = [], 
  currentUser, 
  onOpenAuth,
  onSelectProduct
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab navigation inside product page
  const [activeTab, setActiveTab] = useState('specs'); // 'specs', 'review', 'drivers', 'comments'
  const [showcaseMode, setShowcaseMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'story';
    }
    return '3d';
  });

  // Selected upgrades
  const [selectedRam, setSelectedRam] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [selectedDisplay, setSelectedDisplay] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentRating, setCommentRating] = useState(5);
  const [commentBody, setCommentBody] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentNotice, setCommentNotice] = useState(null);

  // Apple-grade Sticky Buy Bar & Perspective Switcher
  const [showStickyBuyBar, setShowStickyBuyBar] = useState(false);
  const angleLabels = ['نمای روبرو', 'کیبورد و تاچ‌پد', 'درگاه‌های جانبی', 'پشت شاسی'];

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBuyBar(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Drivers state
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Linked Blog Post Reader Modal
  const [activeBlogReview, setActiveBlogReview] = useState(null);
  const [loadingBlogReview, setLoadingBlogReview] = useState(false);

  const handleOpenBlogReview = async (blogId) => {
    setLoadingBlogReview(true);
    try {
      const res = await fetch(`/api/blog/${blogId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveBlogReview(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingBlogReview(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setError(null);

    // Fetch product details
    fetch(`/api/products/${productSlug}`)
      .then(res => {
        if (!res.ok) throw new Error('محصول مورد نظر یافت نشد.');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        const canUse3d = data.enable_3d_viewer !== false && 
                         data.specs?.enable_3d_viewer !== false && 
                         Boolean(data.model3d_url || data.specs?.model3d_url);
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        setShowcaseMode(canUse3d && !isMobile ? '3d' : 'story');
        setSelectedRam(0);
        setSelectedStorage(0);
        setSelectedDisplay(0);
        setQuantity(1);
        setActiveImage(0);
        setLoading(false);

        // Fetch drivers for this product
        setDriversLoading(true);
        fetch(`/api/products/${data.slug}/drivers`)
          .then(r => r.json())
          .then(list => {
            setDrivers(Array.isArray(list) ? list : []);
            setDriversLoading(false);
          })
          .catch(() => setDriversLoading(false));

        // Fetch related products
        fetch('/api/products')
          .then(r => r.json())
          .then(all => {
            const related = all.filter(p => p.id !== data.id && p.category === data.category);
            setRelatedProducts(related.slice(0, 3));
          })
          .catch(() => {});
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    // Fetch approved comments
    fetch(`/api/products/${productSlug}/comments`)
      .then(res => res.json())
      .then(setComments)
      .catch(() => {});
  }, [productSlug]);

  // Dynamic Google Product JSON-LD Schema for Rich Snippets
  useEffect(() => {
    if (!product) return;

    const scriptId = 'google-product-schema';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [product.image],
      "description": product.tagline || `خرید و قیمت لپ‌تاپ ${product.name} با مشخصات پردازنده ${product.specs?.cpu || ''} و گرافیک ${product.specs?.gpu || ''}`,
      "sku": product.slug,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "TechTink"
      },
      "offers": {
        "@type": "Offer",
        "url": typeof window !== 'undefined' ? window.location.href : `https://techtink.ir/product/${product.slug}`,
        "priceCurrency": "IRR",
        "price": product.basePrice,
        "itemCondition": "https://schema.org/UsedCondition",
        "availability": (product.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "تک‌تینک"
        }
      }
    };

    script.textContent = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [product]);

  if (loading) {
    return <ProductPageLoadingAnimation />;
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <AlertTriangle size={64} color="hsl(var(--accent-red))" style={{ margin: '0 auto 24px' }} />
        <h2>{error || 'محصول پیدا نشد.'}</h2>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={onBack}>
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  // Calculate dynamic price
  const ramPrice = product.upgrades?.ram?.[selectedRam]?.price || 0;
  const storagePrice = product.upgrades?.storage?.[selectedStorage]?.price || 0;
  const displayPrice = product.upgrades?.display?.[selectedDisplay]?.price || 0;
  const unitPrice = product.basePrice + ramPrice + storagePrice + displayPrice;
  const totalPrice = unitPrice * quantity;

  const isComparing = compareList.includes(product.id);
  const has3DViewer = Boolean(
    product &&
    product.enable_3d_viewer !== false &&
    product.specs?.enable_3d_viewer !== false &&
    (product.model3d_url || product.specs?.model3d_url)
  );
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const bm = product.benchmarks || { cpuScore: 95, gamingScore: 92, displayScore: 94, batteryScore: 80, coolingScore: 90, aiScore: 85 };
  const review = product.expertReview || {};
  const shortSpecs = getShortSpecs(product);

  const handleAddToCart = () => {
    onAddToCart({
      productId: product.id,
      laptopId: product.id,
      slug: product.slug,
      name: product.name,
      basePrice: product.basePrice,
      totalPrice: unitPrice,
      image: product.image,
      configuration: {
        ram: product.upgrades?.ram?.[selectedRam]?.name || product.specs?.ram || 'استاندارد',
        storage: product.upgrades?.storage?.[selectedStorage]?.name || product.specs?.storage || 'استاندارد',
        display: product.upgrades?.display?.[selectedDisplay]?.name || product.specs?.display || 'استاندارد'
      },
      variantIds: [
        product.upgrades?.ram?.[selectedRam]?.id,
        product.upgrades?.storage?.[selectedStorage]?.id,
        product.upgrades?.display?.[selectedDisplay]?.id
      ].filter(Boolean),
      quantity
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setCommentSubmitting(true);
    setCommentNotice(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${product.slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          rating: commentRating,
          body: commentBody
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCommentNotice({ type: 'success', text: data.message || 'نظر شما با موفقیت ثبت شد و پس از بررسی تایید می‌شود.' });
        setCommentBody('');
        toast.success(data.message || 'نظر شما با موفقیت ثبت شد!');
      } else {
        setCommentNotice({ type: 'error', text: data.error || 'خطا در ثبت نظر' });
        toast.error(data.error || 'خطا در ثبت نظر');
      }
    } catch {
      setCommentNotice({ type: 'error', text: 'خطا در ارتباط با سرور' });
      toast.error('خطا در برقراری ارتباط با سرور');
    }
    setCommentSubmitting(false);
  };

  return (
    <>
      {/* 0. APPLE STICKY BUY BAR (Floats into view on scroll past hero) */}
      <div className={`apple-sticky-buy-bar ${showStickyBuyBar ? 'is-visible' : ''}`} role="region" aria-label="نوار خرید سریع">
        <div className="apple-sticky-buy-bar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <img 
              src={images[activeImage] || product.image || '/vite.svg'} 
              alt={product.name} 
              style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '10px', background: '#f8fafc', padding: '2px', border: '1px solid var(--border-glass)', flexShrink: 0 }} 
            />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product.name}
              </div>
              <div className="font-tech gradient-text" style={{ fontSize: '0.825rem', fontWeight: 800 }}>
                {formatPrice(totalPrice)}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '8px 18px', fontSize: '0.875rem', borderRadius: '10px' }}
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart size={15} /> افزودن به سبد
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
      
      {/* Embedded mobile styles for product page */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .product-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            margin-bottom: 32px !important;
          }
          .product-main-img {
            max-height: 290px !important;
            aspect-ratio: 16/10 !important;
          }
          .product-cta-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .product-cta-bar .btn-primary {
            width: 100% !important;
            padding: 14px 20px !important;
            font-size: 1rem !important;
          }
          .product-specs-table td {
            padding: 10px 12px !important;
            font-size: 0.85rem !important;
          }
        }
      `}} />

      {/* Breadcrumb & Back */}
      <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="flex" style={{ alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={onBack}>فروشگاه</span>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{product.name}</span>
        </div>

        <button className="btn btn-glass" style={{ padding: '6px 14px', fontSize: '0.8125rem' }} onClick={onBack}>
          <ArrowRight size={16} /> بازگشت به لیست
        </button>
      </div>

      {/* Main Product Hero Grid */}
      <div className="grid product-hero-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '36px', alignItems: 'start', marginBottom: '40px' }}>
        
        {/* Right column: Gallery */}
        <div>
          <div className="glass-card" style={{ padding: '16px', overflow: 'hidden', position: 'relative', marginBottom: '14px', background: 'radial-gradient(circle at 50% 60%, rgba(56, 189, 248, 0.08) 0%, var(--glass-card-bg) 75%)' }}>
            <img 
              src={images[activeImage] || product.image} 
              alt={product.name} 
              className="product-main-img"
              style={{ width: '100%', height: 'auto', maxHeight: '420px', aspectRatio: '16/10', objectFit: 'contain', borderRadius: '12px', display: 'block', filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.14))', transition: 'transform 260ms var(--ease-out)' }}
            />
            {product.badge && (
              <span className="badge badge-glow" style={{ position: 'absolute', top: '20px', right: '20px' }}>
                {product.badge}
              </span>
            )}
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', gap: '8px' }}>
              <span className="badge" style={{ background: 'rgba(0,0,0,0.65)', color: 'white', backdropFilter: 'blur(4px)' }}>
                {product.cpuBrand || 'Intel'}
              </span>
              <span className="badge" style={{ background: 'rgba(0,0,0,0.65)', color: 'white', backdropFilter: 'blur(4px)' }}>
                {product.gpuBrand || 'NVIDIA'}
              </span>
            </div>
          </div>

          {/* Angle / Perspective Selector Pills (Apple Style) */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`angle-pill ${activeImage === idx ? 'active' : ''}`}
                  type="button"
                >
                  <Eye size={13} />
                  {angleLabels[idx] || `زاویه ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Thumbnails if multiple images */}
          {images.length > 1 && (
            <div className="flex" style={{ gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    border: activeImage === idx ? '2px solid hsl(var(--accent-cyan))' : '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '4px',
                    background: 'transparent',
                    cursor: 'pointer',
                    width: '80px',
                    height: '80px',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="glass-panel grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px', marginTop: '24px' }}>
            <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={24} color="hsl(var(--accent-cyan))" />
              <div style={{ fontSize: '0.8125rem' }}>
                <div style={{ fontWeight: 'bold' }}>ضمانت ۲ ساله رسمی</div>
                <div style={{ color: 'var(--text-secondary)' }}>تک‌تینک سرویس</div>
              </div>
            </div>
            <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
              <Truck size={24} color="hsl(var(--accent-green))" />
              <div style={{ fontSize: '0.8125rem' }}>
                <div style={{ fontWeight: 'bold' }}>ارسال اکسپرس</div>
                <div style={{ color: 'var(--text-secondary)' }}>بسته‌بندی ایمن و فوری</div>
              </div>
            </div>
            <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
              <RotateCcw size={24} color="hsl(var(--accent-purple))" />
              <div style={{ fontSize: '0.8125rem' }}>
                <div style={{ fontWeight: 'bold' }}>مهلت تست ۷ روزه</div>
                <div style={{ color: 'var(--text-secondary)' }}>تضمین سلامت فنی</div>
              </div>
            </div>
            <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={24} color="hsl(var(--accent-cyan))" />
              <div style={{ fontSize: '0.8125rem' }}>
                <div style={{ fontWeight: 'bold' }}>تضمین اصالت و سلامت</div>
                <div style={{ color: 'var(--text-secondary)' }}>تست فنی کامل سخت‌افزار</div>
              </div>
            </div>
          </div>
        </div>

        {/* Left column: Info, Configurator & Purchase */}
        <div>
          <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))' }}>
              {product.category}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {product.series}
            </span>
            {/* Grade Badge - ONLY on product selection page */}
            <span className="badge badge-glow" style={{ 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', 
              color: 'hsl(var(--accent-green))',
              borderColor: 'hsl(var(--accent-green))',
              fontWeight: 700,
              fontSize: '0.8125rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle size={13} />
              {product.grade ? (product.grade.startsWith('گرید') ? product.grade : `گرید ${product.grade}`) : 'گرید A+ (در حد نو)'}
            </span>
          </div>

          {/* Two-Line Title Layout: Brand on top line, Model on line below */}
          <div style={{ marginBottom: '12px', textAlign: 'left', direction: 'ltr' }}>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 800, 
              letterSpacing: '0.12em', 
              textTransform: 'uppercase', 
              color: 'hsl(var(--accent-cyan))', 
              fontFamily: 'var(--font-tech)',
              marginBottom: '2px'
            }}>
              {product.brand || (product.name?.split(' ')[0] || '')}
            </div>
            <h1 style={{ 
              fontSize: '2.4rem', 
              fontWeight: 800, 
              margin: 0, 
              lineHeight: 1.25,
              fontFamily: 'var(--font-tech)',
              color: 'var(--text-primary)'
            }}>
              {product.model || (product.name?.replace(product.brand || '', '').trim() || product.name)}
            </h1>
          </div>

          {/* Price Under Product Name */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
            <div className="font-tech price-gradient-text" style={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1.2 }}>
              {formatPrice(unitPrice)}
            </div>
            {product.oldPrice && product.oldPrice > product.basePrice && (
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '20px' }}>
            {product.tagline}
          </p>

          {/* Rating & Stock row */}
          <div className="flex" style={{ alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="flex font-tech" style={{ alignItems: 'center', gap: '6px' }}>
              <Star size={18} color="hsl(var(--accent-cyan))" fill="hsl(var(--accent-cyan))" />
              <span style={{ fontWeight: 700 }}>{product.rating || '۵.۰'}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                ({product.reviewsCount || comments.length} دیدگاه خریداران)
              </span>
            </div>

            <div className="flex" style={{ alignItems: 'center', gap: '6px' }}>
              {product.inStock ? (
                <>
                  <CheckCircle size={18} color="hsl(var(--accent-green))" />
                  <span style={{ color: 'hsl(var(--accent-green))', fontWeight: 600, fontSize: '0.875rem' }}>
                    موجود در انبار ({product.stock} عدد)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} color="hsl(var(--accent-red))" />
                  <span style={{ color: 'hsl(var(--accent-red))', fontWeight: 600, fontSize: '0.875rem' }}>
                    ناموجود
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Key Hardware Highlights Deck */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Cpu size={13} color="hsl(var(--accent-cyan))" /> پردازنده
              </div>
              <div className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortSpecs.cpu}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Zap size={13} color="hsl(var(--accent-green))" /> کارت گرافیک
              </div>
              <div className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortSpecs.gpu}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <HardDrive size={13} color="hsl(var(--accent-purple))" /> حافظه رم (RAM)
              </div>
              <div className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortSpecs.ram}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <HardDrive size={13} color="hsl(var(--accent-cyan))" /> حافظه داخلی (SSD)
              </div>
              <div className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortSpecs.storage}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Monitor size={13} color="hsl(var(--accent-cyan))" /> نمایشگر
              </div>
              <div className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortSpecs.display}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Battery size={13} color="hsl(var(--accent-green))" /> ظرفیت باتری
              </div>
              <div className="font-tech" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortSpecs.battery || '50Wh Battery'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '10px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                <Layers size={13} color="hsl(var(--accent-green))" /> جنس بدنه و شاسی
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortSpecs.chassis}
              </div>
            </div>
          </div>

          {/* Price Box */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '4px' }}>
                  قیمت نهایی قابل پرداخت:
                </div>
                {product.oldPrice && product.oldPrice > unitPrice && (
                  <div className="font-tech" style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    {formatPrice(product.oldPrice)}
                  </div>
                )}
                <div className="price-gradient-text font-tech" style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {formatPrice(unitPrice)}
                </div>
              </div>

              {product.oldPrice && product.oldPrice > unitPrice && (
                <span className="badge" style={{ background: 'hsl(var(--accent-red))', color: 'white', padding: '6px 12px', fontSize: '0.875rem' }}>
                  تخفیف ویژه
                </span>
              )}
            </div>
          </div>

          {/* Hardware Configurator */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>پیکربندی قطعات سفارشی:</h3>

            {/* RAM Options */}
            {product.upgrades?.ram && product.upgrades.ram.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  <Cpu size={16} color="hsl(var(--accent-cyan))" />
                  <span>حافظه رم (RAM):</span>
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {product.upgrades.ram.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedRam(idx)}
                      className="glass-card"
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        cursor: 'pointer',
                        borderColor: selectedRam === idx ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                        background: selectedRam === idx ? 'hsla(var(--accent-cyan), 0.08)' : 'var(--glass-bg)'
                      }}
                    >
                      <div className="font-tech" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                        {opt.name}
                      </div>
                      <div className="font-tech" style={{ fontSize: '0.75rem', color: opt.price === 0 ? 'var(--text-secondary)' : 'hsl(var(--accent-cyan))' }}>
                        {opt.price === 0 ? 'پیش‌فرض' : `+${formatPrice(opt.price)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage Options */}
            {product.upgrades?.storage && product.upgrades.storage.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  <HardDrive size={16} color="hsl(var(--accent-purple))" />
                  <span>حافظه ذخیره‌سازی (SSD):</span>
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {product.upgrades.storage.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedStorage(idx)}
                      className="glass-card"
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        cursor: 'pointer',
                        borderColor: selectedStorage === idx ? 'hsl(var(--accent-purple))' : 'var(--border-glass)',
                        background: selectedStorage === idx ? 'hsla(var(--accent-purple), 0.08)' : 'var(--glass-bg)'
                      }}
                    >
                      <div className="font-tech" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                        {opt.name}
                      </div>
                      <div className="font-tech" style={{ fontSize: '0.75rem', color: opt.price === 0 ? 'var(--text-secondary)' : 'hsl(var(--accent-purple))' }}>
                        {opt.price === 0 ? 'پیش‌فرض' : `+${formatPrice(opt.price)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Display Options */}
            {product.upgrades?.display && product.upgrades.display.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  <Monitor size={16} color="hsl(var(--accent-green))" />
                  <span>صفحه نمایش:</span>
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {product.upgrades.display.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDisplay(idx)}
                      className="glass-card"
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        cursor: 'pointer',
                        borderColor: selectedDisplay === idx ? 'hsl(var(--accent-green))' : 'var(--border-glass)',
                        background: selectedDisplay === idx ? 'hsla(var(--accent-green), 0.08)' : 'var(--glass-bg)'
                      }}
                    >
                      <div className="font-tech" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                        {opt.name}
                      </div>
                      <div className="font-tech" style={{ fontSize: '0.75rem', color: opt.price === 0 ? 'var(--text-secondary)' : 'hsl(var(--accent-green))' }}>
                        {opt.price === 0 ? 'پیش‌فرض' : `+${formatPrice(opt.price)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity & CTA */}
          <div className="flex product-cta-bar" style={{ gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="flex" style={{ alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.04)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', justifyContent: 'center' }}>
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px 8px' }}
                aria-label="کاهش تعداد"
              >
                -
              </button>
              <span className="font-code" style={{ fontWeight: 'bold', fontSize: '1.125rem', minWidth: '24px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button 
                onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px 8px' }}
                aria-label="افزایش تعداد"
              >
                +
              </button>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ flexGrow: 1, padding: '14px 24px', fontSize: '1.05rem' }}
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart size={18} /> افزودن به سبد خرید ({formatPrice(totalPrice)})
            </button>

            <button 
              className={`btn btn-glass btn-compare ${isComparing ? 'is-active' : ''}`}
              style={{ padding: '14px', flexShrink: 0 }}
              onClick={() => onCompare(product.id)}
              title={isComparing ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
            >
              <ArrowLeftRight size={20} className="compare-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          APPLE-GRADE BENTO GRID: HARDWARE HIGHLIGHTS AT A GLANCE
          ========================================================= */}
      <section style={{ marginBottom: '44px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-glow" style={{ fontSize: '0.725rem', padding: '3px 10px', marginBottom: '8px', display: 'inline-block' }}>
            نوآوری و مهندسی
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            ویژگی‌های برجسته در یک نگاه
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            معماری قدرتمند سخت‌افزاری مهندسی‌شده برای پروژه‌های سنگین، رندرینگ حرفه‌ای و کاربری بدون افت عملکرد
          </p>
        </div>

        <div className="apple-bento-grid">
          {/* Card 1: Display (Wide 7 cols) */}
          <div className="bento-card bento-col-7" style={{ minHeight: '220px', background: 'radial-gradient(circle at top right, hsla(var(--accent-cyan), 0.08) 0%, var(--glass-card-bg) 70%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', marginBottom: '6px' }}>
                  نمایشگر و تصویر
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  نمایشگر شفاف با تفکیک رنگی استثنایی
                </h3>
              </div>
              <Monitor size={28} color="hsl(var(--accent-cyan))" style={{ opacity: 0.9 }} />
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              {shortSpecs.display ? `مجهز به پنل ${shortSpecs.display} با عمق رنگ سینمایی و زاویه دید گسترده جهت امور گرافیکی و تماشای محتوا با بالاترین دقت.` : 'دقت رنگی بالا، روشنایی فوق‌العاده و پوشش کامل طیف رنگی حرفه‌ای.'}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)' }}>
                ۱۰۰٪ sRGB / DCI-P3
              </span>
              <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)' }}>
                روشنایی بالا ضد بازتاب
              </span>
              <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)' }}>
                زاویه دید ۱۷۸ درجه
              </span>
            </div>
          </div>

          {/* Card 2: Processor Silicon (5 cols) */}
          <div className="bento-card bento-col-5" style={{ minHeight: '220px', background: 'radial-gradient(circle at top left, hsla(var(--accent-purple), 0.08) 0%, var(--glass-card-bg) 70%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.15)', color: 'hsl(var(--accent-purple))', marginBottom: '6px' }}>
                  پردازنده مرکزی (CPU)
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  موتور پردازش بدون وقفه
                </h3>
              </div>
              <Cpu size={28} color="hsl(var(--accent-purple))" style={{ opacity: 0.9 }} />
            </div>

            <div className="font-tech" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', marginBottom: '10px' }}>
              {shortSpecs.cpu}
            </div>

            <div style={{ marginTop: 'auto', background: 'var(--table-stripe)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>شاخص قدرت پردازشی تک‌تینک</span>
                <span className="font-tech" style={{ color: 'hsl(var(--accent-purple))' }}>{(product.techTinkScore?.processingPower || product.scores?.processingPower) ? `${product.techTinkScore?.processingPower || product.scores?.processingPower}/۱۰۰` : '۹۲/۱۰۰'}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${product.techTinkScore?.processingPower || product.scores?.processingPower || 92}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--accent-purple)), hsl(var(--accent-cyan)))', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Card 3: Graphics (4 cols) */}
          <div className="bento-card bento-col-4" style={{ minHeight: '190px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: 'hsla(var(--accent-green), 0.15)', color: 'hsl(var(--accent-green))' }}>
                گرافیک و AI
              </span>
              <Zap size={22} color="hsl(var(--accent-green))" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              رندرینگ و شتاب‌دهی گرافیک
            </h4>
            <div className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', marginBottom: '8px' }}>
              {shortSpecs.gpu}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>
              بهینه‌سازی شده برای اجرای روان نرم‌افزارهای مهندسی، معماری، مدل‌های هوش مصنوعی و تدوین 4K.
            </p>
          </div>

          {/* Card 4: Battery & Efficiency (4 cols) */}
          <div className="bento-card bento-col-4" style={{ minHeight: '190px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c' }}>
                پایداری باتری
              </span>
              <Battery size={22} color="#ea580c" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              شارژدهی طولانی و مصرف بهینه
            </h4>
            <div className="font-tech" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', direction: 'ltr', textAlign: 'left', marginBottom: '8px' }}>
              {shortSpecs.battery || 'باتری لیتیومی بادوام'}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>
              فناوری مدیریت هوشمند توان جهت بازدهی پایدار باتری در ساعات طولانی کار و جابجایی.
            </p>
          </div>

          {/* Card 5: Chassis & Build (4 cols) */}
          <div className="bento-card bento-col-4" style={{ minHeight: '190px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))' }}>
                شاسی و بدنه
              </span>
              <Layers size={22} color="hsl(var(--accent-cyan))" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              مهندسی متریال و ارگونومی
            </h4>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {shortSpecs.chassis || 'آلیاژ مستحکم فلزی'}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>
              طراحی ارگونومیک با انتقال حرارت بهینه و مقاومت فیزیکی بالا در برابر ضربه و استفاده روزمره.
            </p>
          </div>
        </div>
      </section>
      
      {/* 2.5 APPLE-GRADE INTERACTIVE SCROLL & 3D HARDWARE SHOWCASE */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', border: '1px solid hsla(var(--accent-cyan), 0.3)', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                بررسی تعاملی سخت‌افزار
              </span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                معرفی تعاملی و داستان مهندسی پرچمدار
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              کاوش پیوسته سخت‌افزار با اسکرول، بررسی متریال شاسی، شفافیت نمایشگر و توان پردازشی با سبک پرچمدار اپل
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          {has3DViewer ? (
            <div 
              style={{
                display: 'inline-flex',
                padding: '4px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                gap: '4px'
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={() => setShowcaseMode('3d')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: showcaseMode === '3d' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'transparent',
                  color: showcaseMode === '3d' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: showcaseMode === '3d' ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
              >
                <Rotate3d size={14} />
                <span>مدل سه‌بعدی ۳۶۰°</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowcaseMode('story')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: showcaseMode === 'story' ? 'linear-gradient(135deg, hsl(var(--accent-cyan)), hsl(var(--accent-purple)))' : 'transparent',
                  color: showcaseMode === 'story' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: showcaseMode === 'story' ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
              >
                <Sparkles size={14} />
                <span>شوکیس استوری اپل</span>
              </button>
            </div>
          ) : (
            <div className="badge badge-glow" style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} />
              <span>شوکیس اختصاصی پرچمدار</span>
            </div>
          )}
        </div>

        {has3DViewer && showcaseMode === '3d' ? (
          <LaptopModelViewer 
            modelUrl={product.model3d_url || product.specs?.model3d_url || '/models/laptop-flagship.glb'} 
            productName={product.name}
            specs={product.shortSpecs || {}}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <AppleFlagshipShowcase 
            product={product} 
            onSelectProduct={onSelectProduct} 
            onAddToCart={handleAddToCart} 
          />
        )}
      </section>

      {/* Navigation Tabs for Detailed Sections */}
      <div className="touch-scroll-x" style={{ gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        {[
          { id: 'specs', label: 'مشخصات فنی و امتیاز تک‌تینک', icon: BarChart2 },
          { id: 'review', label: 'نقد و بررسی تخصصی', icon: BookOpen },
          { id: 'drivers', label: `درایورها (${drivers.length})`, icon: Download },
          { id: 'comments', label: `دیدگاه‌ها (${comments.length})`, icon: MessageSquare }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="btn"
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: activeTab === t.id ? 'hsl(var(--accent-cyan))' : 'rgba(0,0,0,0.03)',
              color: activeTab === t.id ? 'white' : 'var(--text-primary)',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              fontWeight: activeTab === t.id ? 'bold' : 'normal',
              flexShrink: 0
            }}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* 1. SPECS & TECHTINK SCORE TAB */}
      {activeTab === 'specs' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* TechTink Score (امتیاز تک‌تینک) */}
          {(() => {
            const score = product.techTinkScore || {
              overall: 88,
              batteryLife: 84,
              temperature: 88,
              processingPower: 86,
              usability: 92,
              buildQuality: 92,
              repairability: 89
            };

            const scoreItems = [
              { label: 'عمر باتری', key: 'batteryLife', val: score.batteryLife, color: 'hsl(var(--accent-green))' },
              { label: 'دما', key: 'temperature', val: score.temperature, color: 'hsl(var(--accent-cyan))' },
              { label: 'توان پردازشی', key: 'processingPower', val: score.processingPower, color: 'hsl(var(--accent-purple))' },
              { label: 'سهولت استفاده', key: 'usability', val: score.usability, color: 'hsl(var(--accent-cyan))' },
              { label: 'کیفیت ساخت و حس دستگاه', key: 'buildQuality', val: score.buildQuality, color: 'hsl(var(--accent-green))' },
              { label: 'ارتقا پذیری و تعمیر پذیری', key: 'repairability', val: score.repairability, color: 'hsl(var(--accent-purple))' }
            ];

            return (
              <div className="glass-card" style={{ padding: '36px' }}>
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                      <Sparkles size={24} color="hsl(var(--accent-cyan))" />
                      امتیاز تک‌تینک
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
                      ارزیابی کارشناسی ۶ پارامتر حیاتی سلامت، دوام و کارایی دستگاه (مقیاس ۰ تا ۱۰۰)
                    </p>
                  </div>

                  {/* Overall Score Badge */}
                  <div className="glass-panel flex" style={{ alignItems: 'center', gap: '14px', padding: '10px 18px', borderRadius: '14px', background: 'linear-gradient(135deg, hsla(var(--accent-cyan), 0.1) 0%, hsla(var(--accent-purple), 0.1) 100%)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>امتیاز کلی تک‌تینک</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-green))', fontWeight: 700 }}>تایید فنی کارشناسان</div>
                    </div>
                    <div className="font-tech gradient-text" style={{ fontSize: '2.25rem', fontWeight: 900, lineHeight: 1 }}>
                      {score.overall}
                    </div>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {scoreItems.map((item, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
                      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                        <span className="font-tech" style={{ fontWeight: 700, fontSize: '0.9375rem', color: item.color }}>
                          {item.val} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ ۱۰۰</span>
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${item.val}%`, 
                          background: item.color,
                          borderRadius: '6px',
                          transition: 'width 0.8s ease'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Detailed Categorized Specifications (Apple / ROG Style) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                  <Layers size={22} color="hsl(var(--accent-cyan))" />
                  مشخصات کامل قطعات دستگاه
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                  اطلاعات دقیق پردازنده، کارت گرافیک، حافظه رم، حافظه SSD، نمایشگر و اتصالات
                </p>
              </div>
            </div>

            <div className="spec-card-grid">
              {/* 1. Processor & Core */}
              <div className="spec-section-card">
                <div className="spec-section-header">
                  <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsla(var(--accent-cyan), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={18} color="hsl(var(--accent-cyan))" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>پردازنده و چیپست اصلی</span>
                  </div>
                  <span className="badge" style={{ background: 'hsla(var(--accent-cyan), 0.15)', color: 'hsl(var(--accent-cyan))', fontSize: '0.75rem' }}>
                    {product.cpuBrand || 'Intel'}
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">سازنده پردازنده</span>
                  <span className="spec-row-value">{product.cpuBrand || 'Intel'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">مدل دقیق CPU</span>
                  <span className="spec-row-value">{product.specs?.cpu || '—'}</span>
                </div>
                {product.specs?.npuScore && (
                  <div className="spec-row">
                    <span className="spec-row-label">پردازش عصبی (NPU AI)</span>
                    <span className="spec-row-value">{product.specs.npuScore}</span>
                  </div>
                )}
              </div>

              {/* 2. Graphics & GPU */}
              <div className="spec-section-card">
                <div className="spec-section-header">
                  <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsla(var(--accent-green), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={18} color="hsl(var(--accent-green))" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>گرافیک و پردازش تصویر</span>
                  </div>
                  <span className="badge" style={{ background: 'hsla(var(--accent-green), 0.15)', color: 'hsl(var(--accent-green))', fontSize: '0.75rem' }}>
                    {product.gpuBrand || 'NVIDIA'}
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">سازنده گرافیک</span>
                  <span className="spec-row-value">{product.gpuBrand || 'NVIDIA'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">مدل کارت گرافیک</span>
                  <span className="spec-row-value">{product.specs?.gpu || '—'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">توان پردازش گرافیکی</span>
                  <span className="spec-row-value">{bm.gamingScore > 80 ? 'Dedicated High-TGP' : 'Optimized Mobile GPU'}</span>
                </div>
              </div>

              {/* 3. Memory & Storage */}
              <div className="spec-section-card">
                <div className="spec-section-header">
                  <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsla(var(--accent-purple), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HardDrive size={18} color="hsl(var(--accent-purple))" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>حافظه رم و ذخیره‌سازی</span>
                  </div>
                  <span className="badge" style={{ background: 'hsla(var(--accent-purple), 0.15)', color: 'hsl(var(--accent-purple))', fontSize: '0.75rem' }}>
                    High-Speed NVMe
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">حافظه رم (RAM)</span>
                  <span className="spec-row-value">{product.specs?.ram || '—'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">حافظه ذخیره‌سازی داخلی</span>
                  <span className="spec-row-value">{product.specs?.storage || '—'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">قابلیت ارتقا قطعات</span>
                  <span className="spec-row-value" style={{ color: 'hsl(var(--accent-green))' }}>امکان ارتقا آنلاین در سبد</span>
                </div>
              </div>

              {/* 4. Display & Visuals */}
              <div className="spec-section-card">
                <div className="spec-section-header">
                  <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsla(var(--accent-cyan), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Monitor size={18} color="hsl(var(--accent-cyan))" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>صفحه نمایش و کیفیت تصویر</span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Display
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">مشخصات صفحه نمایش</span>
                  <span className="spec-row-value">{product.specs?.display || '—'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">دقت رنگ و استاندارد</span>
                  <span className="spec-row-value">۱۰۰٪ sRGB / DCI-P3 Certified</span>
                </div>
                <div className="spec-row">
                  <span className="spec-row-label">امتیاز کیفی نمایشگر</span>
                  <span className="spec-row-value" style={{ color: 'hsl(var(--accent-cyan))' }}>{bm.displayScore} / ۱۰۰</span>
                </div>
              </div>

              {/* 5. Battery, Ports & Build */}
              <div className="spec-section-card" style={{ gridColumn: '1 / -1' }}>
                <div className="spec-section-header">
                  <div className="flex" style={{ alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsla(var(--accent-green), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={18} color="hsl(var(--accent-green))" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>باتری، درگاه‌ها، اتصالات و بدنه</span>
                  </div>
                  <span className="badge" style={{ background: 'hsla(var(--accent-green), 0.15)', color: 'hsl(var(--accent-green))', fontSize: '0.75rem' }}>
                    Build & I/O
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  <div className="spec-row">
                    <span className="spec-row-label">جنس و ساختار شاسی</span>
                    <span className="spec-row-value">{product.chassis || product.specs?.chassis || 'All-Aluminum CNC Machined'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-row-label">ظرفیت باتری</span>
                    <span className="spec-row-value">{product.specs?.battery || '—'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-row-label">وزن خالص دستگاه</span>
                    <span className="spec-row-value">{product.specs?.weight || '—'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-row-label">سیستم عامل پیش‌فرض</span>
                    <span className="spec-row-value">{product.specs?.os || 'Windows 11 Home / Pro'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-row-label">پورت‌ها و خروجی‌ها</span>
                    <span className="spec-row-value">{product.specs?.ports || 'Thunderbolt / USB-C / HDMI'}</span>
                  </div>
                  <div className="spec-row" style={{ gridColumn: '1 / -1' }}>
                    <span className="spec-row-label">شرایط ضمانت و پشتیبانی</span>
                    <span className="spec-row-value" style={{ color: 'hsl(var(--accent-cyan))', direction: 'rtl', textAlign: 'left' }}>
                      {product.guarantee || 'گارانتی ۱۸ ماهه طلایی تک‌تینک با پوشش تعویض قطعات'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EXPERT REVIEW & PROS/CONS TAB */}
      {activeTab === 'review' && (
        <div className="animate-fade-in glass-card" style={{ padding: '36px' }}>
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={24} color="hsl(var(--accent-cyan))" />
                نقد و بررسی تخصصی کارشناسان تک‌تینک
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
                ارزیابی فنی، بنچمارک‌ها، کیفیت ساخت و تجربه کاربری تست‌شده در لابراتوار
              </p>
            </div>
          </div>

          {/* Linked Blog Review Banner if available */}
          {product.blogReview && (
            <div 
              className="glass-panel" 
              style={{ 
                marginBottom: '28px', 
                padding: '24px', 
                borderRadius: '16px', 
                background: 'linear-gradient(135deg, hsla(var(--accent-cyan), 0.08) 0%, hsla(var(--accent-purple), 0.08) 100%)', 
                border: '1px solid hsla(var(--accent-cyan), 0.3)',
                display: 'flex',
                gap: '24px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              {product.blogReview.image && (
                <img 
                  src={product.blogReview.image} 
                  alt={product.blogReview.title} 
                  style={{ width: '200px', height: '125px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div className="flex" style={{ alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#000', fontWeight: 'bold' }}>
                    بررسی تخصصی کامل در وبلاگ
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {product.blogReview.date} • مطالعه: {product.blogReview.readTime}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {product.blogReview.title}
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {product.blogReview.excerpt}
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '8px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => handleOpenBlogReview(product.blogReview.id)}
                  disabled={loadingBlogReview}
                >
                  <BookOpen size={16} /> 
                  {loadingBlogReview ? 'در حال بارگذاری...' : 'مطالعه بررسی جامع این محصول'}
                </button>
              </div>
            </div>
          )}

          <div 
            className="blog-article-content"
            style={{ lineHeight: '1.9', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '36px', background: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '12px', borderRight: '4px solid hsl(var(--accent-cyan))' }}
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdownToHtml(review.fullReview || review.intro || product.description || `${product.name} یک محصول رده‌بالا با کارایی ممتاز است.`) 
            }}
          />

          {/* Pros & Cons Columns */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', marginBottom: '36px' }}>
            
            {/* Pros */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', borderColor: 'hsla(var(--accent-green), 0.3)' }}>
              <h3 style={{ fontSize: '1.125rem', color: 'hsl(var(--accent-green))', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ThumbsUp size={20} /> نقاط قوت کلیدی
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(review.pros && review.pros.length > 0 ? review.pros : ['عملکرد پردازشی بسیار سریع', 'صفحه نمایش باکیفیت و شفاف', 'کیفیت ساخت ممتاز']).map((pro, idx) => (
                  <div key={idx} className="flex" style={{ alignItems: 'flex-start', gap: '10px' }}>
                    <Check size={18} color="hsl(var(--accent-green))" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '0.9375rem' }}>{pro}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', borderColor: 'hsla(var(--accent-red), 0.3)' }}>
              <h3 style={{ fontSize: '1.125rem', color: 'hsl(var(--accent-red))', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ThumbsDown size={20} /> نقاط ضعف و ملاحظات
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(review.cons && review.cons.length > 0 ? review.cons : ['قیمت متناسب با رده حرفه‌ای', 'عدم وجود درگاه کارت‌خوان در برخی نسخه‌ها']).map((con, idx) => (
                  <div key={idx} className="flex" style={{ alignItems: 'flex-start', gap: '10px' }}>
                    <X size={18} color="hsl(var(--accent-red))" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '0.9375rem' }}>{con}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Verdict Box */}
          {review.verdict && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', background: 'hsla(var(--accent-cyan), 0.05)', borderColor: 'hsl(var(--accent-cyan))' }}>
              <h3 style={{ fontSize: '1.125rem', color: 'hsl(var(--accent-cyan))', marginBottom: '8px' }}>
                جمع‌بندی و نتیجه‌گیری نهایی:
              </h3>
              <p style={{ margin: 0, lineHeight: '1.8', fontSize: '0.9375rem' }}>
                {review.verdict}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. PRODUCT DRIVERS & SUPPORT SECTION TAB */}
      {activeTab === 'drivers' && (
        <div className="animate-fade-in glass-card" style={{ padding: '36px' }}>
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Download size={22} color="hsl(var(--accent-green))" />
                دانلود درایورها و نرم‌افزارهای اختصاصی {product.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                به‌روزترین درایورهای رسمی و آپدیت‌های بایوس منتشر شده توسط تیم فنی
              </p>
            </div>
            <span className="badge" style={{ background: 'hsla(var(--accent-green), 0.15)', color: 'hsl(var(--accent-green))' }}>
              تایید سلامت و اصالت فایل‌ها
            </span>
          </div>

          {driversLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>در حال بارگذاری فایل‌های درایور...</div>
          ) : drivers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              در حال حاضر درایور اختصاصی برای این مدل بارگذاری نشده است. برای دریافت درایور با پشتیبانی تماس بگیرید.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '12px' }}>عنوان درایور / نرم‌افزار</th>
                    <th style={{ padding: '12px' }}>دسته‌بندی</th>
                    <th style={{ padding: '12px' }}>نسخه</th>
                    <th style={{ padding: '12px' }}>تاریخ انتشار</th>
                    <th style={{ padding: '12px' }}>حجم فایل</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>دریافت</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d, idx) => (
                    <tr key={d.id || idx} style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent', borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 'bold' }}>
                        <div className="flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="hsl(var(--accent-cyan))" />
                          <span>{d.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.75rem' }}>
                          {d.category || 'درایور سیستم'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px' }} className="font-code">{d.version || '1.0'}</td>
                      <td style={{ padding: '14px 12px' }} className="font-code">{d.date || '۱۴۰۴/۱۲'}</td>
                      <td style={{ padding: '14px 12px' }} className="font-code">{d.size || '120 MB'}</td>
                      <td style={{ padding: '14px 12px', textAlign: 'left' }}>
                        <a 
                          href={d.downloadUrl || d.download_url || '#'} 
                          download 
                          className="btn btn-primary" 
                          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                        >
                          <Download size={14} /> دانلود مستقیم
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. COMMENTS & REVIEWS TAB */}
      {activeTab === 'comments' && (
        <div className="animate-fade-in glass-card" style={{ padding: '36px' }}>
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={24} color="hsl(var(--accent-purple))" />
                دیدگاه‌ها و تجربیات خریداران ({comments.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                نظرات ثبت‌شده توسط خریداران تاییدشده {product.name}
              </p>
            </div>

            <div className="flex font-code" style={{ alignItems: 'center', gap: '8px' }}>
              <Star size={24} color="hsl(var(--accent-cyan))" fill="hsl(var(--accent-cyan))" />
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{product.rating || '۵.۰'}</span>
              <span style={{ color: 'var(--text-secondary)' }}>از ۵</span>
            </div>
          </div>

          {/* Existing Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                هنوز نظری برای این لپ‌تاپ ثبت نشده است. اولین نفری باشید که نظر خود را به اشتراک می‌گذارد!
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div className="flex" style={{ alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsla(var(--accent-cyan), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} color="hsl(var(--accent-cyan))" />
                      </div>
                      <span style={{ fontWeight: 'bold' }}>{c.author}</span>
                    </div>

                    <div className="flex" style={{ alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(st => (
                        <Star 
                          key={st} 
                          size={14} 
                          color="hsl(var(--accent-cyan))" 
                          fill={st <= c.rating ? 'hsl(var(--accent-cyan))' : 'none'} 
                        />
                      ))}
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', fontSize: '0.9375rem', margin: 0 }}>
                    {c.body}
                  </p>

                  {c.createdAt && (
                    <div className="font-code" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'left' }}>
                      {c.createdAt}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form or Login Prompt */}
          <div className="glass-panel" style={{ padding: '28px', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>ثبت دیدگاه جدید</h3>

            {currentUser ? (
              <form onSubmit={handleCommentSubmit}>
                {commentNotice && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: commentNotice.type === 'success' ? 'hsla(var(--accent-green), 0.15)' : 'hsla(var(--accent-red), 0.15)',
                    color: commentNotice.type === 'success' ? 'hsl(var(--accent-green))' : 'hsl(var(--accent-red))',
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}>
                    {commentNotice.text}
                  </div>
                )}

                {/* Rating stars selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    امتیاز شما به این محصول:
                  </label>
                  <div className="flex" style={{ gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setCommentRating(st)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      >
                        <Star 
                          size={28} 
                          color="hsl(var(--accent-cyan))" 
                          fill={st <= commentRating ? 'hsl(var(--accent-cyan))' : 'none'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div style={{ marginBottom: '16px' }}>
                  <textarea 
                    rows="4" 
                    placeholder="تجربه خود از کار با این لپ‌تاپ را برای دیگران بنویسید..." 
                    value={commentBody}
                    onChange={e => setCommentBody(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px' }}
                  />
                </div>

                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    دیدگاه‌ها پس از تأیید تیم مدیریت منتشر خواهند شد.
                  </span>
                  <button type="submit" className="btn btn-primary" disabled={commentSubmitting}>
                    <Send size={16} /> {commentSubmitting ? 'در حال ثبت...' : 'ارسال دیدگاه'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  برای ثبت دیدگاه و امتیاز به این لپ‌تاپ، لطفاً وارد حساب کاربری خود شوید.
                </p>
                <button className="btn btn-primary" onClick={onOpenAuth}>
                  ورود یا ثبت‌نام در سایت
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '24px' }}>
            مدل‌های مرتبط در دسته‌بندی {product.category}
          </h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {relatedProducts.map(rel => (
              <div 
                key={rel.id} 
                className="glass-card flex" 
                style={{ flexDirection: 'column', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => onSelectProduct && onSelectProduct(rel.slug)}
              >
                <img src={rel.image} alt={rel.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>{rel.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '16px' }}>{rel.tagline}</p>
                  <div className="flex" style={{ marginTop: 'auto', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-code" style={{ fontWeight: 'bold', color: 'hsl(var(--accent-cyan))' }}>
                      {formatPrice(rel.basePrice)}
                    </span>
                    <button className="btn btn-glass" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                      مشاهده
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Blog Review Article Reader Modal */}
      {activeBlogReview && (
        <div className="modal-backdrop-wrapper" onClick={() => setActiveBlogReview(null)} style={{ zIndex: 120 }}>
          <div 
            className="glass-panel modal-card" 
            style={{ maxWidth: '980px', maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: '20px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative', height: '320px' }}>
              <img src={activeBlogReview.image} alt={activeBlogReview.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.85))' }}></div>
              <button 
                className="btn btn-glass" 
                style={{ position: 'absolute', top: '20px', left: '20px', padding: '10px', borderRadius: '50%', zIndex: 10, background: 'rgba(255,255,255,0.7)', color: 'black' }} 
                onClick={() => setActiveBlogReview(null)}
              >
                <X size={20} />
              </button>
              <div style={{ position: 'absolute', bottom: '28px', left: '28px', right: '28px' }}>
                <span className="badge" style={{ background: 'hsl(var(--accent-cyan))', color: '#000', fontWeight: 'bold', marginBottom: '12px' }}>
                  {activeBlogReview.category || 'نقد و بررسی تخصصی'}
                </span>
                <h1 style={{ fontSize: '2.1rem', margin: 0, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                  {activeBlogReview.title}
                </h1>
              </div>
            </div>

            <div style={{ padding: '36px', maxWidth: '820px', margin: '0 auto', width: '100%' }}>
              <div className="flex" style={{ gap: '16px', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--border-glass)' }}>
                {activeBlogReview.authorAvatar && (
                  <img src={activeBlogReview.authorAvatar} alt={activeBlogReview.author} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{activeBlogReview.author}</div>
                  <div className="font-code" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span>{activeBlogReview.authorRole}</span> • <span>{activeBlogReview.date}</span> • <span>زمان مطالعه: {activeBlogReview.readTime}</span>
                  </div>
                </div>
              </div>

              <div 
                className="blog-article-content"
                style={{ lineHeight: 2 }}
                dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(activeBlogReview.content) }} 
              />
              
              <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)', textAlign: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '10px 24px' }} onClick={() => setActiveBlogReview(null)}>
                  بازگشت به مشخصات و خرید {product.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
