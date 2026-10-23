import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSessionTimeout: Industry-standard inactivity session manager (OWASP ASVS / PCI-DSS)
 * - Admin standard: 15 minutes of inactivity (configurable to 30 or 60 min).
 * - Customer standard: Extended idle threshold with activity tracking.
 * - Shows countdown modal 60 seconds before expiry.
 */
export function useSessionTimeout({
  user,
  onTimeout,
  defaultAdminTimeout = 15, // OWASP 15-minute standard for admin roles
  defaultUserTimeout = 1440 // 24 hours for standard customers
}) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const isTimedOutRef = useRef(false);

  // Determine timeout duration based on user role and saved preferences
  const timeoutMinutes = user?.role === 'admin'
    ? (user?.timeoutMinutes || defaultAdminTimeout)
    : defaultUserTimeout;
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningWindowMs = 60 * 1000; // 60 seconds warning window

  // Reset timer on genuine user activity
  const handleUserActivity = useCallback(() => {
    if (!user || isTimedOutRef.current) return;
    
    // If warning modal is open, do not silently dismiss on faint mouse movements;
    // require an explicit click on the "extend session" button for deliberate intent.
    if (isWarningOpen) return;

    const now = Date.now();
    // Throttle activity updates to once every 5 seconds for smooth performance
    if (now - lastThrottleRef.current > 5000) {
      lastThrottleRef.current = now;
      lastActivityRef.current = now;
    }
  }, [user, isWarningOpen]);

  // Extend session: updates client and backend keep-alive
  const extendSession = useCallback(async () => {
    lastActivityRef.current = Date.now();
    lastThrottleRef.current = Date.now();
    setIsWarningOpen(false);
    setRemainingSeconds(60);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });
      } catch {}
    }
  }, []);

  // Immediate logout
  const logoutNow = useCallback(() => {
    isTimedOutRef.current = true;
    setIsWarningOpen(false);
    if (onTimeout) onTimeout();
  }, [onTimeout]);

  // Attach activity listeners
  useEffect(() => {
    if (!user) {
      setIsWarningOpen(false);
      return;
    }

    isTimedOutRef.current = false;
    lastActivityRef.current = Date.now();
    lastThrottleRef.current = Date.now();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const listener = () => handleUserActivity();

    events.forEach(event => {
      window.addEventListener(event, listener, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, listener);
      });
    };
  }, [user, handleUserActivity]);

  // Interval check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (isTimedOutRef.current) return;

      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const warningStart = timeoutMs - warningWindowMs;

      if (idleTime >= timeoutMs) {
        // Session expired
        isTimedOutRef.current = true;
        setIsWarningOpen(false);
        if (onTimeout) onTimeout();
      } else if (idleTime >= warningStart) {
        // Warning threshold reached (60 seconds countdown)
        const leftSec = Math.max(1, Math.ceil((timeoutMs - idleTime) / 1000));
        setRemainingSeconds(leftSec);
        setIsWarningOpen(true);
      } else {
        if (isWarningOpen) setIsWarningOpen(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, timeoutMs, warningWindowMs, isWarningOpen, onTimeout]);

  return {
    isWarningOpen,
    remainingSeconds,
    extendSession,
    logoutNow,
    timeoutMinutes
  };
}
