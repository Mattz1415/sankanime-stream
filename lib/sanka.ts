const SANKA_BASE_URL = 'https://www.sankavollerei.web.id/anime';

// Simple in-memory cache to prevent hitting rate limit (45 req/min)
const cache = new Map<string, { data: any; expiry: number }>();

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://www.sankavollerei.web.id/',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
};

export async function fetchSanka<T = any>(
  path: string,
  cacheTtlSeconds: number = 180
): Promise<T> {
  const url = `${SANKA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const now = Date.now();

  const cached = cache.get(url);
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      next: { revalidate: cacheTtlSeconds },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Sanka API Error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    if (json.status === 'Plana AI Detector') {
      throw new Error(json.message || 'Blocked by upstream provider');
    }

    // Cache the response
    cache.set(url, {
      data: json.data || json,
      expiry: now + cacheTtlSeconds * 1000,
    });

    return (json.data || json) as T;
  } catch (error: any) {
    console.error(`Failed to fetch from Sanka API [${url}]:`, error.message);
    // If cache exists even if expired, return stale data as fallback
    if (cached) {
      console.warn(`Returning stale cached data for: ${url}`);
      return cached.data as T;
    }
    throw error;
  }
}
