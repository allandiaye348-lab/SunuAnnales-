import { inject } from '@vercel/analytics';

// Safely initialize Vercel Analytics if available
try {
  inject();
} catch (_e) {
  // Silent fallback when offline or in non-Vercel environment
}

const VID_KEY = 'sunu_vid';
const SID_KEY = 'sunu_sid';
const LAST_TRACK_KEY = 'sunu_last_track';

/**
 * Returns a persistent anonymous visitor ID (without any personal data)
 */
function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VID_KEY);
    if (!vid) {
      vid = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(VID_KEY, vid);
    }
    return vid;
  } catch {
    return `v_anon_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Returns or creates a session ID valid for the current browser tab session
 */
function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return `s_anon_${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Detects device category accurately
 */
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 640 && width <= 1024 && 'ontouchstart' in window)) {
    return 'tablet';
  }
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua) || width < 640) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Detects browser name
 */
function getBrowser(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Navigateur';
}

/**
 * Detects operating system
 */
function getOS(): string {
  if (typeof navigator === 'undefined') return 'Système';
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Autre';
}

// In-memory cache to prevent tracking duplicate page views within 15 seconds on simple refresh
const recentTracks: Record<string, number> = {};

export interface TrackEventOptions {
  path?: string;
  annaleId?: string;
  annaleTitle?: string;
  searchQuery?: string;
  force?: boolean;
}

/**
 * Professional, privacy-respecting pageview & event tracker
 */
export async function trackPageView(options: TrackEventOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;

  const currentPath = options.path || window.location.pathname || '/';
  const now = Date.now();

  // Deduplication check: if the exact same page was tracked in the last 15 seconds, avoid double counting
  if (!options.force && recentTracks[currentPath] && (now - recentTracks[currentPath] < 15000)) {
    return;
  }
  recentTracks[currentPath] = now;

  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const deviceType = getDeviceType();
  const browser = getBrowser();
  const os = getOS();
  const referrer = document.referrer ? new URL(document.referrer, window.location.origin).hostname : 'direct';

  const payload = {
    visitor_id: visitorId,
    session_id: sessionId,
    path: currentPath,
    referrer: referrer || 'direct',
    device_type: deviceType,
    browser,
    os,
    annale_id: options.annaleId,
    annale_title: options.annaleTitle,
    search_query: options.searchQuery,
  };

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    // Silent fail in dev or static environments so user experience is never degraded
  }
}

/**
 * Setup automatic visibility and heartbeat listener for real-time live visitor tracking
 */
export function initAnalyticsTracking(onPathChange?: (path: string) => void) {
  if (typeof window === 'undefined') return () => {};

  // Track initial load
  trackPageView({ path: window.location.pathname });

  // Periodic heartbeat every 60 seconds while tab is active
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      trackPageView({ path: window.location.pathname, force: true });
    }
  }, 60000);

  return () => {
    clearInterval(interval);
  };
}
