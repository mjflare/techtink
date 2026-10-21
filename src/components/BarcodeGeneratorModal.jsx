import React, { useState, useRef } from 'react';
import { 
  X, Printer, Barcode as BarcodeIcon, QrCode, Tag, 
  Copy, Check, Layers, Sliders, Eye, Sparkles 
} from 'lucide-react';
import { formatPrice, cleanGrade } from '../utils/formatPrice.js';

// Code 128 Subtype B Patterns (107 patterns, each 11 modules wide, stop is 13 modules)
const CODE128_B_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (104: Start B, 106: Stop)
];

// Generate SVG Code 128-B bars string
function generateCode128SvgBars(text, height = 50, barWidth = 2) {
  const safeText = (text || 'TT-000000').toUpperCase();
  const codes = [104]; // Start B
  let checkSum = 104;

  for (let i = 0; i < safeText.length; i++) {
    const charCode = safeText.charCodeAt(i);
    const codeVal = charCode - 32;
    if (codeVal >= 0 && codeVal <= 95) {
      codes.push(codeVal);
      checkSum += codeVal * (i + 1);
    }
  }

  const checkDigit = checkSum % 103;
  codes.push(checkDigit);
  codes.push(106); // Stop

  let modules = '';
  for (const c of codes) {
    const pattern = CODE128_B_PATTERNS[c] || CODE128_B_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      modules += (isBar ? '1' : '0').repeat(width);
      isBar = !isBar;
    }
  }

  // Convert binary modules into SVG rect elements
  const rects = [];
  let currentX = 10;
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === '1') {
      rects.push(
        <rect 
          key={i} 
          x={currentX} 
          y={0} 
          width={barWidth} 
          height={height} 
          fill="#000000" 
        />
      );
    }
    currentX += barWidth;
  }

  const totalWidth = currentX + 10;
  return (
    <svg 
      viewBox={`0 0 ${totalWidth} ${height}`} 
      style={{ width: '100%', height: `${height}px`, display: 'block', margin: '0 auto' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {rects}
    </svg>
  );
}

export default function BarcodeGeneratorModal({ isOpen, onClose, product = null, allProducts = [] }) {
  const [selectedProduct, setSelectedProduct] = useState(product || (allProducts[0] || null));
  const [barcodeText, setBarcodeText] = useState(
    product ? (product.sku || `TT-${product.id?.toString().padStart(6, '0')}`) : 'TT-894021'
  );
  const [labelSize, setLabelSize] = useState('50x30'); // '50x30' | '70x50' | '100x60'
  const [showPrice, setShowPrice] = useState(true);
  const [showSpecs, setShowSpecs] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  const printAreaRef = useRef(null);

  // Sync when product changes
  React.useEffect(() => {
    if (product) {
      setSelectedProduct(product);
      setBarcodeText(product.sku || `TT-${product.id?.toString().padStart(6, '0')}`);
    } else if (allProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(allProducts[0]);
      setBarcodeText(allProducts[0].sku || `TT-${allProducts[0].id?.toString().padStart(6, '0')}`);
    }
  }, [product, allProducts]);

  if (!isOpen) return null;

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    const p = allProducts.find(x => String(x.id) === String(pId));
    if (p) {
      setSelectedProduct(p);
      setBarcodeText(p.sku || `TT-${p.id?.toString().padStart(6, '0')}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(barcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = selectedProduct?.slug 
    ? `https://techtink.ir/product/${selectedProduct.slug}` 
    : `https://techtink.ir/sku/${barcodeText}`;

  // Dimensions in mm and px
  const sizeConfig = {
    '50x30': { width: '50mm', height: '30mm', barH: 34, fontSize: '9px', qrSize: 44 },
    '70x50': { width: '70mm', height: '50mm', barH: 48, fontSize: '11px', qrSize: 64 },
    '100x60': { width: '100mm', height: '60mm', barH: 60, fontSize: '13px', qrSize: 80 }
  }[labelSize];

  return (
    <div className="modal-backdrop-wrapper" style={{ zIndex: 125 }}>
      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-label-sheet, #printable-label-sheet * {
            visibility: visible !important;
          }
          #printable-label-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 2mm !important;
          }
          .barcode-label-tag {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}} />

      <div 
        className="glass-panel modal-card" 
        style={{ 
          maxWidth: '920px', 
          width: '95%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          className="flex" 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px 24px', 
            borderBottom: '1px solid var(--border-glass)',
            background: '#f8fafc'
          }}
        >
          <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsla(var(--accent-cyan), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarcodeIcon size={22} color="hsl(var(--accent-cyan))" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>سازنده و چاپگر بارکد حرارتی و لیبل کالا</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logistics & Thermal Barcode 128 / QR Hub</span>
            </div>
          </div>

          <div className="flex" style={{ gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px' }}
              onClick={handlePrint}
            >
              <Printer size={16} /> چاپ لیبل‌ها (Print Labels)
            </button>
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

        {/* Modal Body */}
        <div className="grid" style={{ gridTemplateColumns: '320px 1fr', flex: 1, overflowY: 'auto' }}>
          
          {/* Controls Sidebar */}
          <div style={{ padding: '24px', borderLeft: '1px solid var(--border-glass)', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Select Product */}
            {allProducts.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  انتخاب کالا از موجودی انبار:
                </label>
                <select 
                  value={selectedProduct?.id || ''} 
                  onChange={handleProductSelect}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.brand} {p.model} ({p.sku || `TT-${p.id}`})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Barcode / SKU Text */}
            <div>
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>کد بارکد / شناسه کالا (Code 128):</label>
                <button 
                  type="button" 
                  className="btn btn-glass" 
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                  onClick={handleCopyCode}
                >
                  {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                  {copied ? 'کپی شد' : 'کپی'}
                </button>
              </div>
              <input 
                type="text" 
                value={barcodeText} 
                onChange={e => setBarcodeText(e.target.value.toUpperCase())}
                className="font-code"
                style={{ width: '100%', direction: 'ltr', fontWeight: 700, letterSpacing: '1px' }}
              />
            </div>

            {/* Label Size Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                ابعاد رول لیبل پرینتر حرارتی:
              </label>
              <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
                {[
                  { id: '50x30', label: '۵۰ × ۳۰ میلی‌متر (تیپاکس و جعبه استاندارد)' },
                  { id: '70x50', label: '۷۰ × ۵۰ میلی‌متر (شلف انبار و مشخصات کامل)' },
                  { id: '100x60', label: '۱۰۰ × ۶۰ میلی‌متر (کارتن مادر و خروجی پست)' }
                ].map(sz => (
                  <label 
                    key={sz.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 12px', 
                      borderRadius: '8px',
                      background: labelSize === sz.id ? 'hsla(var(--accent-cyan), 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${labelSize === sz.id ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)'}`,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="labelSize" 
                      checked={labelSize === sz.id} 
                      onChange={() => setLabelSize(sz.id)} 
                      style={{ accentColor: 'hsl(var(--accent-cyan))' }}
                    />
                    <span>{sz.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Visible Elements Toggles */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px' }}>
                اطلاعات چاپی روی برچسب:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
                <label className="flex" style={{ alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={showPrice} 
                    onChange={e => setShowPrice(e.target.checked)} 
                    style={{ accentColor: 'hsl(var(--accent-cyan))' }}
                  />
                  <span>نمایش قیمت فروش مصوب (میلیون تومان)</span>
                </label>
                <label className="flex" style={{ alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={showSpecs} 
                    onChange={e => setShowSpecs(e.target.checked)} 
                    style={{ accentColor: 'hsl(var(--accent-cyan))' }}
                  />
                  <span>نمایش خلاصه کانفیگ سخت‌افزاری (CPU/RAM/SSD)</span>
                </label>
                <label className="flex" style={{ alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={showQr} 
                    onChange={e => setShowQr(e.target.checked)} 
                    style={{ accentColor: 'hsl(var(--accent-cyan))' }}
                  />
                  <span>نمایش QR Code اختصاصی صفحه محصول</span>
                </label>
              </div>
            </div>

            {/* Print Quantity */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                تعداد برچسب برای چاپ در برگه:
              </label>
              <input 
                type="number" 
                min="1" 
                max="50" 
                value={quantity} 
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '100%' }}
              />
            </div>

          </div>

          {/* Interactive Preview Canvas */}
          <div style={{ padding: '32px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <Eye size={16} /> پیش‌نمایش برچسب چاپ (ابعاد متناسب با رول پرینتر):
            </div>

            {/* Printable Label Sheet */}
            <div 
              id="printable-label-sheet"
              ref={printAreaRef}
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '16px', 
                justifyContent: 'center',
                maxWidth: '100%'
              }}
            >
              {Array.from({ length: quantity }).map((_, idx) => (
                <div 
                  key={idx}
                  className="barcode-label-tag"
                  style={{
                    width: sizeConfig.width,
                    minHeight: sizeConfig.height,
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Label Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '4px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '-0.3px' }}>فروشگاه تک‌تینک (TechTink)</div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#333' }}>
                        {selectedProduct ? `${selectedProduct.brand} ${selectedProduct.model}` : 'لپ‌تاپ مهندسی / گیمینگ'}
                      </div>
                    </div>
                    {selectedProduct?.grade && (
                      <div style={{ border: '1px solid #000', padding: '1px 4px', fontSize: '8px', fontWeight: 800, borderRadius: '2px' }}>
                        Grade {cleanGrade(selectedProduct.grade)}
                      </div>
                    )}
                  </div>

                  {/* Middle: Hardware Specs & QR */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', margin: '3px 0' }}>
                    <div style={{ flex: 1, fontSize: sizeConfig.fontSize, lineHeight: 1.4, color: '#111' }}>
                      {showSpecs && selectedProduct?.specs && (
                        <div>
                          {selectedProduct.specs.cpu && <div><strong>CPU:</strong> {selectedProduct.specs.cpu}</div>}
                          {selectedProduct.specs.ram && <div><strong>RAM:</strong> {selectedProduct.specs.ram}</div>}
                          {selectedProduct.specs.storage && <div><strong>SSD:</strong> {selectedProduct.specs.storage}</div>}
                          {selectedProduct.specs.gpu && <div><strong>GPU:</strong> {selectedProduct.specs.gpu}</div>}
                        </div>
                      )}
                      {showPrice && selectedProduct?.price && (
                        <div style={{ marginTop: '2px', fontWeight: 900, fontSize: '10px' }}>
                          قیمت: {formatPrice(selectedProduct.price)}
                        </div>
                      )}
                    </div>

                    {showQr && (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=${sizeConfig.qrSize}x${sizeConfig.qrSize}&data=${encodeURIComponent(qrUrl)}`}
                          alt="QR"
                          style={{ width: `${sizeConfig.qrSize}px`, height: `${sizeConfig.qrSize}px`, display: 'block', borderRadius: '2px' }}
                        />
                        <span style={{ fontSize: '6px', color: '#666', display: 'block', marginTop: '1px' }}>اسکن استعلام</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Vector Code 128 Barcode & SKU text */}
                  <div style={{ marginTop: 'auto', paddingTop: '4px', textAlign: 'center' }}>
                    {generateCode128SvgBars(barcodeText, sizeConfig.barH, 1.5)}
                    <div style={{ fontSize: '8.5px', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '2px', marginTop: '2px' }}>
                      *{barcodeText}*
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div 
          className="flex" 
          style={{ 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border-glass)',
            background: 'rgba(0,0,0,0.1)'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            سازگار با پرینترهای حرارتی زبرا (Zebra)، بیکسولون (Bixolon) و اکس‌پرینتر (Xprinter)
          </span>

          <div className="flex" style={{ gap: '10px' }}>
            <button type="button" className="btn btn-glass" onClick={onClose}>
              بستن
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} /> چاپ فوری لیبل
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
