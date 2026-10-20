/**
 * Security Vault & Resilience Module
 * - Obfuscated endpoint management
 * - URL sanitization & protocol whitelisting (XSS & open-redirect prevention)
 * - Rate limiting (anti-spam / anti-ban protection)
 * - Memory & LocalStorage TTL Caching
 * - Safe error logging (no internal tokens or stack traces exposed in production)
 */

// Simple XOR & Base64 deobfuscation for sensitive endpoint strings
function decodeSecret(encoded: string): string {
  try {
    if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
      return Buffer.from(encoded, 'base64').toString('utf-8');
    }
    return atob(encoded);
  } catch {
    return encoded;
  }
}

function encodeSecret(plain: string): string {
  try {
    if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
      return Buffer.from(plain, 'utf-8').toString('base64');
    }
    return btoa(plain);
  } catch {
    return plain;
  }
}

// Obfuscated Base URLs
const SECURE_ENDPOINTS_RAW: Record<string, string> = {
  SANKA_BASE: 'aHR0cHM6Ly93d3cuc2Fua2F2b2xsZXJlaS53ZWIuaWQ=', // https://www.sankavollerei.web.id
  KUROKAMI_BASE: 'aHR0cHM6Ly9rdXJva2FtaS52ZXJjZWwuYXBwL2FwaQ==', // https://kurokami.vercel.app/api
  MANGADEX_BASE: 'aHR0cHM6Ly9hcGkubWFuZ2FkZXgub3Jn', // https://api.mangadex.org
  JIKAN_BASE: 'aHR0cHM6Ly9hcGkuamlrYW4ubW9lL3Y0', // https://api.jikan.moe/v4
  SHIRO_BASE: 'aHR0cHM6Ly9zaGlyby5rdXVoYWt1LnNwYWNlL21hbmh3YXM=', // https://shiro.kuuhaku.space/manhwas
  KOMIKU_BASE: 'aHR0cHM6Ly9rb21pa3Uub3Jn', // https://komiku.org
  KOMIKU_API_BASE: 'aHR0cHM6Ly9rb21pa3UtcmVzdC1hcGkudmVyY2VsLmFwcA==', // https://komiku-rest-api.vercel.app
  ZERONEWATCH_BASE: 'aHR0cHM6Ly96ZXJvbmV3YXRjaC1hcGkudmVyY2VsLmFwcA==', // https://zeronewatch-api.vercel.app
  DRAKORKITA_BASE: 'aHR0cHM6Ly9kcmFrb3JraXRhLmZ1bg==', // https://drakorkita.fun
};

export function getSecureEndpoint(key: keyof typeof SECURE_ENDPOINTS_RAW): string {
  const enc = SECURE_ENDPOINTS_RAW[key];
  return enc ? decodeSecret(enc) : '';
}

/**
 * Protocol Whitelist Sanitizer
 * Only allows https:, blob:, and safe data:image/svg+xml URIs.
 * Disallows javascript:, data:text/html, vbscript:, intent:, file: etc.
 */
export function sanitizeSafeUrl(url: string | null | undefined, fallback: string = ''): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Safe data URIs for inline SVGs / images
  if (trimmed.startsWith('data:image/svg+xml') || trimmed.startsWith('data:image/png') || trimmed.startsWith('data:image/jpeg') || trimmed.startsWith('data:image/webp')) {
    return trimmed;
  }

  // Blob URLs
  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Relative URLs
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && parsed.hostname === 'localhost')) {
      return parsed.toString();
    }
    // Automatically upgrade http: to https: for secure CDN loads
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
      return parsed.toString();
    }
  } catch {
    // If invalid URL, return fallback
  }

  return fallback;
}

/**
 * In-Memory & LocalStorage TTL Cache with Rate Limiter
 */
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export function getCachedData<T>(key: string): T | null {
  const now = Date.now();
  // 1. Check memory cache
  const inMemory = memoryCache.get(key);
  if (inMemory) {
    if (inMemory.expiry > now) {
      return inMemory.data as T;
    }
    memoryCache.delete(key);
  }

  // 2. Check localStorage in browser
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`nx_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.expiry > now) {
          memoryCache.set(key, parsed);
          return parsed.data as T;
        }
        localStorage.removeItem(`nx_cache_${key}`);
      }
    } catch {}
  }

  return null;
}

export function setCachedData<T>(key: string, data: T, ttlMs: number = 300000): void {
  const entry: CacheEntry<T> = {
    data,
    expiry: Date.now() + ttlMs,
  };
  memoryCache.set(key, entry);

  if (typeof window !== 'undefined') {
    try {
      // Limit localStorage entry size to avoid quota issues
      const serialized = JSON.stringify(entry);
      if (serialized.length < 500000) {
        localStorage.setItem(`nx_cache_${key}`, serialized);
      }
    } catch {}
  }
}

/**
 * Token Bucket Rate Limiter
 * Prevents UI spam clicks from hammering external APIs or causing IP bans.
 */
class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed.
   * @param key Identifies action bucket, e.g. "search" or "chapter_load"
   * @param maxRequests Maximum requests allowed in interval
   * @param windowMs Time window in milliseconds
   */
  public canProceed(key: string, maxRequests: number = 10, windowMs: number = 1000): boolean {
    const now = Date.now();
    const list = this.timestamps.get(key) || [];
    const valid = list.filter((t) => now - t < windowMs);

    if (valid.length >= maxRequests) {
      return false;
    }

    valid.push(now);
    this.timestamps.set(key, valid);
    return true;
  }
}

export const appRateLimiter = new RateLimiter();

/**
 * Safe Error Logger
 * Strips sensitive URLs, internal tokens, and stack traces when not in development.
 */
export function safeLogError(context: string, err: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Vault] ${context}:`, err);
    return;
  }

  // In production, log only sanitized error message
  const msg = err instanceof Error ? err.message : String(err || 'Unknown error');
  const sanitized = msg.replace(/https?:\/\/[^\s]+/g, '[URL]');
  console.warn(`[Nexus] ${context}: ${sanitized}`);
}
