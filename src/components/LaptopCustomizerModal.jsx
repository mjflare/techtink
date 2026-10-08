import React, { useState } from 'react';
import { X, Check, Cpu, HardDrive, Monitor, Plus } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice.js';

export default function LaptopCustomizerModal({ laptop, onClose, onAddToCart }) {
  if (!laptop) return null;

  const [selectedRam, setSelectedRam] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [selectedDisplay, setSelectedDisplay] = useState(0);

  const ramUpgrades = laptop.upgrades?.ram || [];
  const storageUpgrades = laptop.upgrades?.storage || [];
  const displayUpgrades = laptop.upgrades?.display || [];

  const ramPrice = ramUpgrades[selectedRam]?.price || 0;
  const storagePrice = storageUpgrades[selectedStorage]?.price || 0;
  const displayPrice = displayUpgrades[selectedDisplay]?.price || 0;

  const totalPrice = laptop.basePrice + ramPrice + storagePrice + displayPrice;

  const handleAddToCart = () => {
    onAddToCart({
      productId: laptop.id,
      laptopId: laptop.id,
      name: laptop.name,
      basePrice: laptop.basePrice,
      totalPrice,
      image: laptop.image,
      configuration: {
        ram: ramUpgrades[selectedRam]?.name || laptop.specs?.ram || 'پیش‌فرض',
        storage: storageUpgrades[selectedStorage]?.name || laptop.specs?.storage || 'پیش‌فرض',
        display: displayUpgrades[selectedDisplay]?.name || laptop.specs?.display || 'پیش‌فرض'
      },
      variantIds: [
        ramUpgrades[selectedRam]?.id,
        storageUpgrades[selectedStorage]?.id,
        displayUpgrades[selectedDisplay]?.id
      ].filter(Boolean),
      quantity: 1
    });
    onClose();
  };

  return (
    <dialog open className="glass-panel" style={{ 
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', zIndex: 1000,
      display: 'flex', flexDirection: 'column', direction: 'rtl'
    }}>
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-glass)' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>شخصی‌سازی قطعات {laptop.name}</h2>
        <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="flex" style={{ flexDirection: 'column', padding: '24px', gap: '32px' }} id="customizer-content">
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            #customizer-content { flex-direction: row !important; }
          }
        `}} />

        {/* Left Col: Image & Summary */}
        <div style={{ flex: '1' }}>
          <img src={laptop.image} alt={laptop.name} style={{ width: '100%', borderRadius: '12px', marginBottom: '24px' }} />
          
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>خلاصه قطعات انتخابی</h3>
            <ul className="font-code" style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {ramUpgrades[selectedRam] && (
                <li className="flex" style={{ gap: '12px', marginBottom: '12px' }}>
                  <Cpu size={16} color="hsl(var(--accent-cyan))" /> {ramUpgrades[selectedRam].name}
                </li>
              )}
              {storageUpgrades[selectedStorage] && (
                <li className="flex" style={{ gap: '12px', marginBottom: '12px' }}>
                  <HardDrive size={16} color="hsl(var(--accent-purple))" /> {storageUpgrades[selectedStorage].name}
                </li>
              )}
              {displayUpgrades[selectedDisplay] && (
                <li className="flex" style={{ gap: '12px' }}>
                  <Monitor size={16} color="hsl(var(--accent-green))" /> {displayUpgrades[selectedDisplay].name}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Col: Options */}
        <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* RAM */}
          {ramUpgrades.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} color="hsl(var(--accent-cyan))" /> حافظه رم (RAM)
              </h3>
              <div className="flex" style={{ flexDirection: 'column', gap: '8px' }}>
                {ramUpgrades.map((opt, idx) => (
                  <div 
                    key={idx} 
                    className="glass-card flex" 
                    style={{ 
                      padding: '16px', cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between',
                      borderColor: selectedRam === idx ? 'hsl(var(--accent-cyan))' : 'var(--border-glass)',
                      background: selectedRam === idx ? 'hsla(var(--accent-cyan), 0.05)' : ''
                    }}
                    onClick={() => setSelectedRam(idx)}
                  >
                    <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: selectedRam === idx ? 'hsl(var(--accent-cyan))' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedRam === idx && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(var(--accent-cyan))' }} />}
                      </div>
                      <span className="font-code">{opt.name}</span>
                    </div>
                    <span className="font-code" style={{ color: opt.price === 0 ? 'var(--text-secondary)' : 'hsl(var(--accent-cyan))' }}>
                      {opt.price === 0 ? 'پیش‌فرض' : `+${formatPrice(opt.price)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storage */}
          {storageUpgrades.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive size={20} color="hsl(var(--accent-purple))" /> حافظه ذخیره‌سازی (SSD)
              </h3>
              <div className="flex" style={{ flexDirection: 'column', gap: '8px' }}>
                {storageUpgrades.map((opt, idx) => (
                  <div 
                    key={idx} 
                    className="glass-card flex" 
                    style={{ 
                      padding: '16px', cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between',
                      borderColor: selectedStorage === idx ? 'hsl(var(--accent-purple))' : 'var(--border-glass)',
                      background: selectedStorage === idx ? 'hsla(var(--accent-purple), 0.05)' : ''
                    }}
                    onClick={() => setSelectedStorage(idx)}
                  >
                    <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: selectedStorage === idx ? 'hsl(var(--accent-purple))' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedStorage === idx && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(var(--accent-purple))' }} />}
                      </div>
                      <span className="font-code">{opt.name}</span>
                    </div>
                    <span className="font-code" style={{ color: opt.price === 0 ? 'var(--text-secondary)' : 'hsl(var(--accent-purple))' }}>
                      {opt.price === 0 ? 'پیش‌فرض' : `+${formatPrice(opt.price)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display */}
          {displayUpgrades.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={20} color="hsl(var(--accent-green))" /> نمایشگر
              </h3>
              <div className="flex" style={{ flexDirection: 'column', gap: '8px' }}>
                {displayUpgrades.map((opt, idx) => (
                  <div 
                    key={idx} 
                    className="glass-card flex" 
                    style={{ 
                      padding: '16px', cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between',
                      borderColor: selectedDisplay === idx ? 'hsl(var(--accent-green))' : 'var(--border-glass)',
                      background: selectedDisplay === idx ? 'hsla(var(--accent-green), 0.05)' : ''
                    }}
                    onClick={() => setSelectedDisplay(idx)}
                  >
                    <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: selectedDisplay === idx ? 'hsl(var(--accent-green))' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedDisplay === idx && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'hsl(var(--accent-green))' }} />}
                      </div>
                      <span className="font-code">{opt.name}</span>
                    </div>
                    <span className="font-code" style={{ color: opt.price === 0 ? 'var(--text-secondary)' : 'hsl(var(--accent-green))' }}>
                      {opt.price === 0 ? 'پیش‌فرض' : `+${formatPrice(opt.price)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="flex modal-footer-mobile-stack" style={{ padding: '24px', borderTop: '1px solid var(--border-glass)', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>قیمت نهایی به تومان</div>
          <div className="gradient-text font-code" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
            {formatPrice(totalPrice)}
          </div>
        </div>
        <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }} onClick={handleAddToCart}>
          <Plus size={18} /> افزودن به سبد خرید
        </button>
      </div>

    </dialog>
  );
}
