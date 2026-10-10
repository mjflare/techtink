import React from 'react';

// Telegram SVG Icon
export function TelegramIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M21.6 3.6L2.9 10.8C1.6 11.3 1.6 12.1 2.7 12.4L7.5 13.9L18.6 6.9C19.1 6.6 19.6 6.8 19.2 7.1L10.2 15.2H10.1L9.8 19.7C10.4 19.7 10.7 19.4 11 19.1L13.9 16.3L19.9 20.7C21 21.3 21.8 20.8 22.1 19.5L24 4.8C24.4 3.2 23.3 2.5 21.6 3.6Z" 
        fill={color} 
      />
    </svg>
  );
}

// Instagram SVG Icon
export function InstagramIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

// Bale (بله) Messenger SVG Icon
export function BaleIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill={color === 'currentColor' ? '#00bfa5' : color} />
      {/* Bale distinctive leaf / check / bubble motif */}
      <path 
        d="M16 6C10.477 6 6 10.477 6 16C6 18.232 6.732 20.297 7.971 21.975L6.5 26.5L11.236 25.138C12.68 25.688 14.298 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM14.2 20.8L10 16.6L11.8 14.8L14.2 17.2L20.2 11.2L22 13L14.2 20.8Z" 
        fill="#ffffff" 
      />
    </svg>
  );
}

// Aparat (آپارات) SVG Icon
export function AparatIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill={color === 'currentColor' ? '#ea1d5d' : color} />
      {/* Aparat dots and center play emblem */}
      <circle cx="16" cy="16" r="4.5" fill="#ffffff" />
      <circle cx="8" cy="16" r="2.8" fill="#ffffff" />
      <circle cx="24" cy="16" r="2.8" fill="#ffffff" />
      <circle cx="16" cy="8" r="2.8" fill="#ffffff" />
      <circle cx="16" cy="24" r="2.8" fill="#ffffff" />
    </svg>
  );
}

// Official eNamad Trust Seal Emblem (نماد اعتماد الکترونیکی)
export function EnamadLogo({ size = 56, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="enamadGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="enamadBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      
      {/* Outer Seal Ring */}
      <circle cx="50" cy="50" r="46" stroke="url(#enamadGold)" strokeWidth="3" fill="#ffffff" />
      <circle cx="50" cy="50" r="41" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
      
      {/* Stylized "e" emblem of eNamad */}
      <path 
        d="M50 20C33.43 20 20 33.43 20 50C20 66.57 33.43 80 50 80C62.45 80 73.12 72.44 77.63 61.67H64.88C61.42 67.2 55.45 70.83 50 70.83C38.5 70.83 29.17 61.5 29.17 50C29.17 38.5 38.5 29.17 50 29.17C57.65 29.17 64.3 33.31 67.88 39.58H50V47.92H79.52C79.83 46.48 80 44.99 80 43.46C80 30.5 66.57 20 50 20Z" 
        fill="url(#enamadBlue)" 
      />
      
      {/* Golden Rating Stars */}
      <polygon points="50,6 52,12 58,12 53,16 55,22 50,18 45,22 47,16 42,12 48,12" fill="url(#enamadGold)" />
      <polygon points="35,11 36.5,15.5 41,15.5 37.5,18.5 39,23 35,20 31,23 32.5,18.5 29,15.5 33.5,15.5" fill="url(#enamadGold)" />
      <polygon points="65,11 66.5,15.5 71,15.5 67.5,18.5 69,23 65,20 61,23 62.5,18.5 59,15.5 63.5,15.5" fill="url(#enamadGold)" />
    </svg>
  );
}
