import { Capacitor, CapacitorHttp } from '@capacitor/core';

export interface TunnelResult {
  success: boolean;
  mode: 'direct' | 'blob' | 'fallback';
  streamUrl?: string;
  blobUrl?: string;
  srcDoc?: string;
  layer: 1 | 2 | 0;
  tunnelActive: boolean;
  message: string;
}

// Proxy fallbacks when CapacitorHttp native bridge is not active
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Native or Proxy HTTP fetch with spoofed Referer and User-Agent
 */
async function fetchTargetHtml(targetUrl: string): Promise<string> {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

  // 1. Try Native CapacitorHttp if on Android / Native
  if (isNative) {
    try {
      const response = await CapacitorHttp.get({
        url: targetUrl,
        headers: {
          'Referer': 'https://otakudesu.cloud/',
          'Origin': 'https://otakudesu.cloud',
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        connectTimeout: 10000,
        readTimeout: 10000,
      });

      if (response && response.data) {
        return typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);
      }
    } catch (nativeErr) {
      console.warn('[Tunnel] CapacitorHttp native fetch failed, trying fallbacks', nativeErr);
    }
  }

  // 2. Direct fetch attempt with credentials omit
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const directRes = await fetch(targetUrl, {
      signal: controller.signal,
      mode: 'cors',
    });
    clearTimeout(timer);
    if (directRes.ok) {
      const text = await directRes.text();
      if (text && text.length > 50) return text;
    }
  } catch {
    // Expected CORS error on web, continue to proxies
  }

  // 3. Fallback proxies for web/testing
  for (const proxyGen of CORS_PROXIES) {
    try {
      const proxyUrl = proxyGen(targetUrl);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const proxyRes = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        if (text && text.length > 50) return text;
      }
    } catch {
      // Continue to next proxy
    }
  }

  throw new Error('Gagal mengunduh halaman embed melalui HTTP Tunnel');
}

/**
 * Layer 1: Extract direct playable video streams (.mp4, .m3u8, googlevideo)
 */
function extractDirectStream(html: string): string | null {
  if (!html) return null;

  // Unpack Dean Edwards p,a,c,k,e,d if present
  let expandedHtml = html;
  const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\)\)/);
  if (packedMatch) {
    try {
      const unpacker = new Function(`
        var evalOut = "";
        var originalEval = window.eval;
        return (${packedMatch[0].replace('eval(', '(')});
      `);
      const unpacked = unpacker();
      if (typeof unpacked === 'string') {
        expandedHtml = html + '\n' + unpacked;
      }
    } catch {
      // Ignore unpack failure
    }
  }

  // Pattern 1: Plyr / JWPlayer sources [{ file: "..." }]
  const sourcesPattern = /sources\s*:\s*\[\s*\{[^}]*file\s*:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i;
  const m1 = expandedHtml.match(sourcesPattern);
  if (m1 && m1[1]) return m1[1];

  // Pattern 2: file: "https://...mp4/m3u8"
  const filePattern = /file\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/i;
  const m2 = expandedHtml.match(filePattern);
  if (m2 && m2[1]) return m2[1];

  // Pattern 3: <source src="https://...mp4/m3u8">
  const sourceTagPattern = /<source\s+[^>]*src=["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']/i;
  const m3 = expandedHtml.match(sourceTagPattern);
  if (m3 && m3[1]) return m3[1];

  // Pattern 4: Google Video / CDN stream direct links
  const gvideoPattern = /(https?:\/\/[a-z0-9\-.]+\.googlevideo\.com\/videoplayback\?[^"'\s<>]+)/i;
  const m4 = expandedHtml.match(gvideoPattern);
  if (m4 && m4[1]) return m4[1];

  // Pattern 5: Generic clean mp4/m3u8 links
  const directPattern = /["'](https?:\/\/[^"'\s<>]+\.(?:mp4|m3u8)(?:\?[^"'\s<>]*)?)["']/i;
  const m5 = expandedHtml.match(directPattern);
  if (m5 && m5[1]) return m5[1];

  return null;
}

/**
 * Layer 2: Sanitize HTML, inject <base>, and anti-popup shims
 */
function sanitizeAndPackHtml(rawHtml: string, targetUrl: string): string {
  let origin = 'https://otakudesu.cloud';
  try {
    const parsed = new URL(targetUrl);
    origin = parsed.origin;
  } catch {
    // Keep fallback origin
  }

  // 1. Remove aggressive ad scripts and banner redirects
  let sanitized = rawHtml
    .replace(/<script\b[^<]*(?:adcash|propeller|popads|syndication|histats|betting|slot|banner|monetag)[^<]*<\/script>/gi, '')
    .replace(/<meta\s+http-equiv=["']refresh["'][^>]*>/gi, '')
    .replace(/target=["']_blank["']/gi, 'target="_self"');

  // 2. Base tag to ensure relative assets (player JS, styles, fonts) resolve properly
  const baseTag = `<base href="${origin}/">`;

  // 3. Robust Anti-Popup & Anti-Redirect Shim
  const antiPopupShim = `
  <script>
    (function() {
      // 1. Suppress all window open popups
      window.open = function(url) {
        console.warn("[NexusTunnel] Blocked window.open popup:", url);
        return null;
      };
      window.alert = function() {};
      window.confirm = function() { return false; };
      window.prompt = function() { return null; };

      // 2. Prevent Frame-Busting & Top Location Hijacking
      try {
        Object.defineProperty(window, 'top', {
          get: function() { return window.self; },
          set: function() {}
        });
        Object.defineProperty(window, 'parent', {
          get: function() { return window.self; },
          set: function() {}
        });
      } catch (e) {}

      // 3. Catch and neutralize unsolicited click redirects
      document.addEventListener('click', function(e) {
        var el = e.target;
        while (el && el !== document) {
          if (el.tagName === 'A' && el.href) {
            // Check if link is outside the video host
            if (el.target === '_blank' || !el.href.startsWith(window.location.origin)) {
              e.preventDefault();
              e.stopPropagation();
              console.warn("[NexusTunnel] Neutralized popup link click:", el.href);
              return false;
            }
          }
          el = el.parentNode;
        }
      }, true);
    })();
  </script>
  `;

  // Inject into <head> or at top of HTML
  if (/<head[^>]*>/i.test(sanitized)) {
    sanitized = sanitized.replace(/<head[^>]*>/i, `$&${baseTag}${antiPopupShim}`);
  } else {
    sanitized = `<!DOCTYPE html><html><head>${baseTag}${antiPopupShim}</head><body>${sanitized}</body></html>`;
  }

  return sanitized;
}

/**
 * Main Tunnel Engine: 2-Layer Bypass
 */
export async function tunnelStream(targetUrl: string): Promise<TunnelResult> {
  if (!targetUrl) {
    return {
      success: false,
      mode: 'fallback',
      layer: 0,
      tunnelActive: false,
      message: 'URL target tidak valid',
    };
  }

  // Quick check: if already direct MP4/M3U8
  const lowerUrl = targetUrl.toLowerCase();
  if (
    lowerUrl.includes('.mp4') ||
    lowerUrl.includes('.m3u8') ||
    lowerUrl.includes('/video/mp4') ||
    lowerUrl.includes('.webm')
  ) {
    return {
      success: true,
      mode: 'direct',
      streamUrl: targetUrl,
      layer: 1,
      tunnelActive: true,
      message: 'Tunnel Active ⚡ (Layer 1: Direct Video)',
    };
  }

  try {
    // 1. Fetch raw embed HTML via Native CapacitorHttp / proxy
    const html = await fetchTargetHtml(targetUrl);

    // 2. LAYER 1: Check for direct stream
    const directStream = extractDirectStream(html);
    if (directStream) {
      return {
        success: true,
        mode: 'direct',
        streamUrl: directStream,
        layer: 1,
        tunnelActive: true,
        message: 'Tunnel Active ⚡ (Layer 1: Extracted Stream)',
      };
    }

    // 3. LAYER 2: Sanitize HTML and prepare Blob URL & srcDoc
    const sanitizedHtml = sanitizeAndPackHtml(html, targetUrl);

    let blobUrl: string | undefined;
    if (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof Blob !== 'undefined') {
      try {
        const blob = new Blob([sanitizedHtml], { type: 'text/html' });
        blobUrl = URL.createObjectURL(blob);
      } catch (blobErr) {
        console.warn('[Tunnel] Blob creation error', blobErr);
      }
    }

    return {
      success: true,
      mode: 'blob',
      blobUrl: blobUrl,
      srcDoc: sanitizedHtml,
      layer: 2,
      tunnelActive: true,
      message: 'Tunnel Active ⚡ (Layer 2: Blob Isolator)',
    };
  } catch (err: any) {
    console.error('[Tunnel] Tunnel failed', err);
    return {
      success: false,
      mode: 'fallback',
      streamUrl: targetUrl,
      layer: 0,
      tunnelActive: false,
      message: 'Tunnel Fallback (Direct Embed)',
    };
  }
}
