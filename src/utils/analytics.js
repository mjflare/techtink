/**
 * TechTink Viewer Analytics & Tracking Utility
 * Lightweight, privacy-respecting client analytics tracker.
 */

let lastTrackedPath = null;
let lastTrackedTime = 0;

function detectDevice() {
  if (typeof window === 'undefined') return { deviceType: 'desktop', browser: 'Other', os: 'Other' };

  const ua = navigator.userAgent || '';
  const width = window.innerWidth || 1200;

  // Device Type
  let deviceType = 'desktop';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua) || width < 768) {
    deviceType = 'mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua) || (width >= 768 && width < 1024)) {
    deviceType = 'tablet';
  }

  // Browser Name
  let browser = 'Other';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

  // Operating System
  let os = 'Other';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua) && !/iphone|ipad/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { deviceType, browser, os };
}

export function trackPageView(path = window.location.pathname, title = document.title) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  // Prevent duplicate pageview triggers on rapid state updates (within 2 seconds on same path)
  if (lastTrackedPath === path && now - lastTrackedTime < 2000) {
    return;
  }

  lastTrackedPath = path;
  lastTrackedTime = now;

  const { deviceType, browser, os } = detectDevice();
  const referrer = document.referrer || '';

  const payload = {
    path,
    title: title || 'تک‌تینک | فروشگاه تخصصی لپ‌تاپ',
    referrer,
    deviceType,
    browser,
    os
  };

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/pageview', blob);
    } else {
      fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Fail silently without disrupting user interaction
  }
}
