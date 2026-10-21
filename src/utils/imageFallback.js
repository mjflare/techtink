/**
 * TechTink Universal Image Fallback & Layout Preservation Utility
 * Prevents Cumulative Layout Shift (CLS) and text jumping when images fail or load slowly.
 */

export const LAPTOP_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="100%" height="100%"><defs><linearGradient id="bg" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" stop-color="%23f8fafc"/><stop offset="100%25" stop-color="%23e2e8f0"/></linearGradient><linearGradient id="screen" x1="0%25" y1="0%25" x2="100%25" y2="100%25"><stop offset="0%25" stop-color="%230f172a"/><stop offset="100%25" stop-color="%231e293b"/></linearGradient></defs><rect width="640" height="400" fill="url(%23bg)"/><rect x="130" y="60" width="380" height="235" rx="14" fill="url(%23screen)" stroke="%2394a3b8" stroke-width="2"/><rect x="144" y="74" width="352" height="207" rx="6" fill="%23090d16"/><circle cx="320" cy="170" r="28" fill="%2338bdf8" opacity="0.15"/><path d="M308 178 L320 156 L332 178 Z" fill="none" stroke="%2338bdf8" stroke-width="3" stroke-linejoin="round"/><circle cx="320" cy="172" r="3" fill="%2338bdf8"/><text x="320" y="215" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="700" fill="%2364748b" text-anchor="middle" letter-spacing="1">TECHTINK HARDWARE</text><polygon points="90,300 550,300 575,320 65,320" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="1.5"/><rect x="280" y="302" width="80" height="6" rx="3" fill="%2394a3b8"/><ellipse cx="320" cy="326" rx="250" ry="8" fill="%23000000" opacity="0.08"/></svg>`;

export const AVATAR_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="50" fill="%23e2e8f0"/><circle cx="50" cy="40" r="20" fill="%2394a3b8"/><path d="M20 85 C20 65, 80 65, 80 85 Z" fill="%2394a3b8"/></svg>`;

/**
 * Universal error handler for <img> elements.
 * Replaces the source with an inline SVG placeholder and ensures object-fit is preserved
 * so surrounding text never shifts.
 */
export function handleImageError(e, fallback = LAPTOP_PLACEHOLDER_SVG) {
  if (!e || !e.currentTarget) return;
  e.currentTarget.onerror = null;
  e.currentTarget.src = fallback;
  e.currentTarget.style.objectFit = 'contain';
  e.currentTarget.style.padding = '12px';
  e.currentTarget.classList.add('img-fallback-applied');
}
