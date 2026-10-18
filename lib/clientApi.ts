import {
  HomeData,
  AnimeListItem,
  AnimeDetail,
  EpisodeDetail,
  ScheduleDay,
} from './types';

const API_BASE_URLS = [
  'https://www.sankavollerei.web.id/anime',
  'https://sankavollerei.web.id/anime',
  'https://www.sankavollerei.com/anime',
];

// In-memory cache for speed and rate-limit mitigation
const memoryCache = new Map<string, { data: any; expiry: number }>();

async function fetchWithFallback<T>(endpoint: string, ttlMs: number = 300000): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const now = Date.now();

  // 1. Check memory cache
  const cachedMem = memoryCache.get(cleanEndpoint);
  if (cachedMem && cachedMem.expiry > now) {
    return cachedMem.data as T;
  }

  // 2. Check localStorage cache if in browser
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`sanka_cache_${cleanEndpoint}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiry > now) {
          memoryCache.set(cleanEndpoint, parsed);
          return parsed.data as T;
        }
      }
    } catch {
      // Ignore localStorage error
    }
  }

  let lastError: any = null;

  // 3. Try each base URL
  for (const baseUrl of API_BASE_URLS) {
    const url = `${baseUrl}${cleanEndpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      const payload = json.data !== undefined ? json.data : json;

      // Save to cache
      const cacheObj = { data: payload, expiry: now + ttlMs };
      memoryCache.set(cleanEndpoint, cacheObj);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`sanka_cache_${cleanEndpoint}`, JSON.stringify(cacheObj));
        } catch {
          // LocalStorage full or disabled, safe to ignore
        }
      }

      return payload as T;
    } catch (err: any) {
      lastError = err;
      // Continue to next mirror/base URL
    }
  }

  // If all failed, return stale cache if available
  if (cachedMem) {
    return cachedMem.data as T;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`sanka_cache_${cleanEndpoint}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.data as T;
      }
    } catch {}
  }

  throw new Error(lastError?.message || 'Gagal memuat data dari server Sanka Vollerei');
}

export async function getHomeData(): Promise<HomeData> {
  const data = await fetchWithFallback<any>('/home', 300000);
  return {
    ongoing: {
      href: data.ongoing?.href || '',
      animeList: (data.ongoing?.animeList || []).map((item: any) => ({
        ...item,
        animeId: item.animeId || item.slug || item.href?.split('/').filter(Boolean).pop() || '',
      })),
    },
    complete: {
      href: data.complete?.href || '',
      animeList: (data.complete?.animeList || []).map((item: any) => ({
        ...item,
        animeId: item.animeId || item.slug || item.href?.split('/').filter(Boolean).pop() || '',
      })),
    },
  };
}

export async function getOngoingAnime(page: number = 1): Promise<{ animeList: AnimeListItem[] }> {
  const endpoint = page > 1 ? `/ongoing-anime/page/${page}` : '/ongoing-anime';
  const data = await fetchWithFallback<any>(endpoint, 300000);
  const list = Array.isArray(data) ? data : data.animeList || [];
  return {
    animeList: list.map((item: any) => ({
      ...item,
      animeId: item.animeId || item.slug || item.href?.split('/').filter(Boolean).pop() || '',
    })),
  };
}

export async function getCompleteAnime(page: number = 1): Promise<{ animeList: AnimeListItem[] }> {
  const endpoint = page > 1 ? `/complete-anime/page/${page}` : '/complete-anime';
  const data = await fetchWithFallback<any>(endpoint, 300000);
  const list = Array.isArray(data) ? data : data.animeList || [];
  return {
    animeList: list.map((item: any) => ({
      ...item,
      animeId: item.animeId || item.slug || item.href?.split('/').filter(Boolean).pop() || '',
    })),
  };
}

export async function getSchedule(): Promise<ScheduleDay[]> {
  const data = await fetchWithFallback<any>('/schedule', 3600000);
  const rawList = Array.isArray(data) ? data : data.scheduleList || [];
  return rawList.map((item: any) => {
    const list = item.animeList || item.anime_list || [];
    return {
      day: item.day,
      animeList: list.map((a: any) => ({
        title: a.title,
        animeId: a.animeId || a.slug || a.href?.split('/').filter(Boolean).pop() || a.url?.split('/').filter(Boolean).pop() || '',
        slug: a.slug,
        poster: a.poster,
        href: a.href || a.url,
      })),
    };
  });
}

export async function getAnimeDetail(animeId: string): Promise<AnimeDetail> {
  const data = await fetchWithFallback<any>(`/anime/${animeId}`, 600000);
  return {
    ...data,
    episodeList: (data.episodeList || []).map((ep: any) => ({
      ...ep,
      episodeId: ep.episodeId || ep.href?.split('/').filter(Boolean).pop() || '',
    })),
  };
}

export async function getEpisodeDetail(episodeId: string): Promise<EpisodeDetail> {
  const data = await fetchWithFallback<any>(`/episode/${episodeId}`, 600000);
  return data;
}

export async function getServerStreamUrl(serverId: string): Promise<string> {
  const data = await fetchWithFallback<any>(`/server/${serverId}`, 600000);
  return data.url || '';
}

export async function searchAnime(query: string): Promise<AnimeListItem[]> {
  if (!query || !query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());
  const data = await fetchWithFallback<any>(`/search/${encoded}`, 180000);
  const list = Array.isArray(data) ? data : data.animeList || [];
  return list.map((item: any) => ({
    ...item,
    animeId: item.animeId || item.slug || item.href?.split('/').filter(Boolean).pop() || '',
  }));
}
