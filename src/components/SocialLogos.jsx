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
