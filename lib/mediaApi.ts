import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  DonghuaItem,
  DonghuaDetail,
  DonghuaEpisodeStream,
  ComicItem,
  ComicDetail,
  ComicChapterData,
  MovieItem,
} from './types';
import {
  safeLogError,
  sanitizeSafeUrl,
  getSecureEndpoint,
  appRateLimiter,
  getCachedData,
  setCachedData,
} from './securityVault';

const API_BASE_URLS = [
  'https://www.sankavollerei.web.id',
  'https://sankavollerei.web.id',
  'https://www.sankavollerei.com',
];

const cacheMap = new Map<string, { data: any; expiry: number }>();

/**
 * Enhanced fetch with AbortController timeout (default 8s)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Direct Native HTTP Scraper using CapacitorHttp on Android / iOS
 * Bypasses CORS completely at native layer. Falls back to fetch & CORS proxies on web.
 */
export async function nativeFetchText(url: string, timeoutMs: number = 8000): Promise<string> {
  const safeUrl = sanitizeSafeUrl(url);
  const cacheKey = `html_${safeUrl}`;
  const cached = getCachedData<string>(cacheKey);
  if (cached) return cached;

  // 1. Native CapacitorHttp on Android/iOS
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const resp = await CapacitorHttp.get({
        url: safeUrl,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
          Referer: safeUrl.includes('komiku') ? 'https://komiku.org/' : safeUrl,
        },
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      if (resp.status === 200 && typeof resp.data === 'string') {
        setCachedData(cacheKey, resp.data, 300000);
        return resp.data;
      }
    } catch (e) {
      safeLogError('CapacitorHttp native request failed, trying browser fallback', e);
    }
  }

  // 2. Direct browser fetch
  try {
    const res = await fetchWithTimeout(
      safeUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
      },
      timeoutMs
    );
    if (res.ok) {
      const text = await res.text();
      setCachedData(cacheKey, text, 300000);
      return text;
    }
  } catch {}

  // 3. CORS Proxies
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(safeUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(safeUrl)}`,
  ];
  for (const proxyUrl of proxies) {
    try {
      const res = await fetchWithTimeout(proxyUrl, {}, timeoutMs);
      if (res.ok) {
        const text = await res.text();
        setCachedData(cacheKey, text, 300000);
        return text;
      }
    } catch {}
  }

  throw new Error(`Failed to fetch text from ${safeUrl}`);
}

async function fetchJsonWithCache<T>(path: string, ttlMs: number = 300000): Promise<T> {
  const now = Date.now();
  const cached = cacheMap.get(path);
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`nexus_media_${path}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiry > now) {
          cacheMap.set(path, parsed);
          return parsed.data as T;
        }
      }
    } catch {}
  }

  let lastError: any = null;

  for (const baseUrl of API_BASE_URLS) {
    const fullUrl = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    try {
      const res = await fetchWithTimeout(
        fullUrl,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (NexusAnime Stream Engine)',
          },
        },
        8000
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      const payload = json.data !== undefined ? json.data : json;

      const cacheEntry = { data: payload, expiry: now + ttlMs };
      cacheMap.set(path, cacheEntry);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`nexus_media_${path}`, JSON.stringify(cacheEntry));
        } catch {}
      }

      return payload as T;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (cached) return cached.data as T;
  throw new Error(lastError?.message || `Gagal mengambil data dari endpoint ${path}`);
}

/**
 * Universal Title Normalization Helper for Deduplicating Across 6 APIs
 */
export function normalizeTitle(t: string): string {
  return (t || '')
    .toLowerCase()
    .replace(/^baca\s+(komik|manga|manhwa|manhua)?\s*/i, '')
    .replace(/^komik\s+/i, '')
    .replace(/\s*(chapter|ch|eps|episode|\(colored\)|\(berwarna\)).*$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/* =========================================================================
   1. DONGHUA API (Chinese Animation)
   ========================================================================= */

const CURATED_DONGHUA_FALLBACK: DonghuaItem[] = [
  {
    title: 'Spare Me, Great Lord! Season 3 Subtitle Indonesia',
    slug: 'spare-me-great-lord-season-3-episode-03-subtitle-indonesia',
    poster: 'https://anichin.moe/wp-content/uploads/2026/10/Spare-Me-Great-Lord-Season-3.webp',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 03',
    rating: '8.8',
  },
  {
    title: 'The Eternal Supreme: Li Yunxiao Subtitle Indonesia',
    slug: 'the-eternal-supreme-li-yunxiao-episode-28-subtitle-indonesia',
    poster: 'https://anichin.moe/wp-content/uploads/2026/07/The-Eternal-Supreme-Li-Yunxiao.webp',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 28',
    rating: '9.0',
  },
  {
    title: 'Battle Through The Heavens Season 5 (BTTH)',
    slug: 'battle-through-the-heavens-season-5',
    poster: 'https://anichin.moe/wp-content/uploads/2022/07/Battle-Through-The-Heavens-Season-5.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 118',
    rating: '9.4',
  },
  {
    title: 'Soul Land 2: The Peerless Tang Clan',
    slug: 'soul-land-2-the-peerless-tang-clan',
    poster: 'https://anichin.moe/wp-content/uploads/2023/06/Soul-Land-2-The-Peerless-Tang-Clan.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 70',
    rating: '9.2',
  },
  {
    title: 'Perfect World (Wanmei Shijie)',
    slug: 'perfect-world',
    poster: 'https://anichin.moe/wp-content/uploads/2021/04/Wanmei-Shijie.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 184',
    rating: '9.3',
  },
  {
    title: 'Swallowed Star Season 4',
    slug: 'swallowed-star-season-4',
    poster: 'https://anichin.moe/wp-content/uploads/2023/10/Swallowed-Star-Season-4.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 134',
    rating: '9.1',
  },
  {
    title: 'Renegade Immortal (Xian Ni)',
    slug: 'renegade-immortal',
    poster: 'https://anichin.moe/wp-content/uploads/2023/09/Xian-Ni.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 58',
    rating: '9.5',
  },
  {
    title: 'Shrouding the Heavens (Zhe Tian)',
    slug: 'shrouding-the-heavens',
    poster: 'https://anichin.moe/wp-content/uploads/2023/05/Zhe-Tian.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 76',
    rating: '8.9',
  },
  {
    title: 'A Will Eternal Season 3 (Yi Nian Yong Heng)',
    slug: 'a-will-eternal-season-3',
    poster: 'https://anichin.moe/wp-content/uploads/2024/07/A-Will-Eternal-Season-3.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 12',
    rating: '9.2',
  },
  {
    title: 'The Demon Hunter (Shen Yin Wangzuo)',
    slug: 'the-demon-hunter',
    poster: 'https://anichin.moe/wp-content/uploads/2023/06/Shen-Yin-Wangzuo.jpg',
    status: 'Ongoing',
    type: 'Donghua',
    currentEpisode: 'Ep 62',
    rating: '9.0',
  },
];

export async function fetchDonghuaHome(): Promise<{ latest: DonghuaItem[]; completed: DonghuaItem[] }> {
  try {
    const raw = await fetchJsonWithCache<any>('/anime/donghua/home', 300000);
    const latestRaw = raw.latest || raw.results || raw.donghua || [];
    const completedRaw = raw.completed || [];

    const latest = latestRaw.map((d: any) => ({
      title: d.title,
      slug: d.slug || d.href?.split('/').filter(Boolean).pop() || d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      poster: d.poster || d.cover || d.image || '',
      status: d.status || 'Ongoing',
      type: 'Donghua',
      currentEpisode: d.episode || d.current_episode || 'Ongoing',
      rating: d.rating || '8.8',
    }));

    const completed = completedRaw.map((d: any) => ({
      title: d.title,
      slug: d.slug || d.href?.split('/').filter(Boolean).pop() || d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      poster: d.poster || d.cover || d.image || '',
      status: 'Completed',
      type: 'Donghua',
      currentEpisode: d.episode || 'Tamat',
      rating: d.rating || '8.9',
    }));

    return {
      latest: latest.length > 0 ? latest : CURATED_DONGHUA_FALLBACK,
      completed: completed.length > 0 ? completed : CURATED_DONGHUA_FALLBACK.slice(5),
    };
  } catch (err) {
    safeLogError('fetchDonghuaHome fallback', err);
    return {
      latest: CURATED_DONGHUA_FALLBACK,
      completed: CURATED_DONGHUA_FALLBACK.slice(5),
    };
  }
}

export async function fetchDonghuaDetail(slug: string): Promise<DonghuaDetail> {
  try {
    const raw = await fetchJsonWithCache<any>(`/anime/donghua/detail/${slug}`, 600000);
    return {
      title: raw.title || slug.replace(/-/g, ' '),
      alterTitle: raw.alter_title || '',
      poster: raw.poster || raw.cover || '',
      rating: raw.rating || '8.5',
      status: raw.status || 'Ongoing',
      studio: raw.studio || '',
      network: raw.network || 'Bilibili / Tencent',
      released: raw.released || '',
      episodesCount: raw.episodes_count || raw.episodes_list?.length || 12,
      synopsis:
        typeof raw.synopsis === 'string'
          ? raw.synopsis
          : Array.isArray(raw.synopsis)
          ? raw.synopsis.join('\n')
          : 'Kisah petualangan kultivasi donghua yang memukau.',
      genres: Array.isArray(raw.genres)
        ? raw.genres.map((g: any) => (typeof g === 'string' ? g : g.name || g.title))
        : ['Action', 'Fantasy', 'Cultivation', 'Donghua'],
      episodesList: Array.isArray(raw.episodes_list)
        ? raw.episodes_list.map((ep: any, index: number) => ({
            title: ep.title || `Episode ${index + 1}`,
            slug: ep.slug || ep.href?.split('/').filter(Boolean).pop() || `${slug}-episode-${index + 1}`,
            episodeNumber: ep.episode_number || ep.eps || index + 1,
          }))
        : Array.from({ length: 12 }, (_, i) => ({
            title: `Episode ${i + 1}`,
            slug: `${slug}-episode-${i + 1}`,
            episodeNumber: i + 1,
          })),
    };
  } catch (err) {
    safeLogError('fetchDonghuaDetail fallback', err);
    return {
      title: slug.replace(/-/g, ' ').toUpperCase(),
      poster: 'https://anichin.moe/wp-content/uploads/2026/10/Spare-Me-Great-Lord-Season-3.webp',
      rating: '8.8',
      status: 'Ongoing',
      studio: 'Foch Film',
      network: 'Tencent Video',
      synopsis: 'Donghua aksi kultivasi dunia persilatan dengan grafis animasi 3D spektakuler.',
      genres: ['Action', 'Fantasy', 'Cultivation', 'Donghua'],
      episodesList: Array.from({ length: 12 }, (_, i) => ({
        title: `Episode ${i + 1}`,
        slug: `${slug}-episode-${i + 1}`,
        episodeNumber: i + 1,
      })),
    };
  }
}

export async function fetchDonghuaEpisode(slug: string): Promise<DonghuaEpisodeStream> {
  try {
    const raw = await fetchJsonWithCache<any>(`/anime/donghua/episode/${slug}`, 600000);
    const streaming = raw.streaming || {};
    const mainUrl = streaming.main_url?.url || '';
    const rawServers = streaming.servers || [];

    const servers = rawServers
      .map((s: any) => ({
        name: s.name || 'Server HD',
        url: s.url || '',
      }))
      .filter((s: any) => Boolean(s.url));

    if (mainUrl && !servers.some((s: any) => s.url === mainUrl)) {
      servers.unshift({ name: streaming.main_url?.name || 'Utama (Okru)', url: mainUrl });
    }

    return {
      episodeTitle: raw.episode || slug.replace(/-/g, ' '),
      mainUrl: mainUrl || (servers[0]?.url ?? ''),
      servers,
    };
  } catch (err) {
    safeLogError('fetchDonghuaEpisode error, trying fallback embed', err);
    return {
      episodeTitle: slug.replace(/-/g, ' '),
      mainUrl: `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ`,
      servers: [
        { name: 'Server Cadangan 1 (Vidhide)', url: 'https://vidhide.com/v/fallback' },
        { name: 'Server Cadangan 2 (Mega)', url: 'https://mega.nz/embed/fallback' },
      ],
    };
  }
}

export async function searchDonghua(query: string): Promise<DonghuaItem[]> {
  if (!query || !query.trim()) return [];
  try {
    const raw = await fetchJsonWithCache<any>(`/anime/donghua/search/${encodeURIComponent(query.trim())}`, 180000);
    const list = raw.results || raw.donghua || raw.data || [];
    return list.map((d: any) => ({
      title: d.title,
      slug: d.slug || d.href?.split('/').filter(Boolean).pop() || d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      poster: d.poster || d.cover || d.image || '',
      status: d.status || 'Ongoing',
      type: 'Donghua',
      currentEpisode: d.episode || 'Ongoing',
      rating: d.rating || '8.5',
    }));
  } catch (err) {
    safeLogError('searchDonghua fallback', err);
    const q = query.toLowerCase();
    return CURATED_DONGHUA_FALLBACK.filter((d) => d.title.toLowerCase().includes(q));
  }
}

/* =========================================================================
   2. SHIRO-MANHWA-API (sireeshdevaraj/SHIRO-MANHWA-API)
   ========================================================================= */

export const SHIRO_API_BASE = 'https://shiro.kuuhaku.space/manhwas';

export async function fetchShiroRecommendations(category?: string): Promise<ComicItem[]> {
  const items: ComicItem[] = [];
  try {
    const url =
      category && category !== 'all'
        ? `${SHIRO_API_BASE}?category=${encodeURIComponent(category)}`
        : SHIRO_API_BASE;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 8000);
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : json?.name ? [json] : [];
      for (const item of list) {
        const name = (item.name || '').trim();
        if (name) {
          items.push({
            title: name,
            slug: `shiro_${item.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            image: '',
            chapter: 'Rekomendasi Shiro',
            type: 'Manhwa',
            score: '9.6',
            description: item.Category?.name ? `Genre: ${item.Category.name}` : 'Rekomendasi Manhwa Shiro',
          });
        }
      }
    }
  } catch (e) {
    safeLogError('fetchShiroRecommendations error', e);
  }
  return items;
}

export async function fetchShiroRandom(): Promise<ComicItem | null> {
  try {
    const res = await fetchWithTimeout(SHIRO_API_BASE, { headers: { Accept: 'application/json' } }, 8000);
    if (res.ok) {
      const item = await res.json();
      if (item && item.name) {
        return {
          title: item.name,
          slug: `shiro_${item.id || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          image: '',
          chapter: 'Rekomendasi Shiro',
          type: 'Manhwa',
          score: '9.7',
          description: item.Category?.name ? `Genre: ${item.Category.name}` : 'Rekomendasi Manhwa Shiro Acak',
        };
      }
    }
  } catch (e) {
    safeLogError('fetchShiroRandom error', e);
  }
  return null;
}

/* =========================================================================
   3. KOMIKU REST API & DIRECT NATIVE SCRAPER (VernSG/Komiku-Rest-Api)
   ========================================================================= */

export const KOMIKU_BASE = 'https://komiku.org';
export const KOMIKU_API_BASE = 'https://api.komiku.org';
export const KOMIKU_REST_API = 'https://komiku-rest-api.vercel.app';

function parseKomikuCardsFromHtml(html: string, defaultType: string = 'Manga'): ComicItem[] {
  const items: ComicItem[] = [];
  const seen = new Set<string>();

  // Regex matching .bge cards from api.komiku.org / pustaka
  const bgeRegex =
    /<div class="bge">[\s\S]*?<a href="(?:\/manga\/|https:\/\/komiku\.org\/manga\/)([^"'/]+)\/?"[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"[\s\S]*?<h3>\s*([^<]+)\s*<\/h3>[\s\S]*?(?:<span class="judul2">\s*([^<]+)\s*<\/span>)?[\s\S]*?(?:<p>\s*([^<]+)\s*<\/p>)?[\s\S]*?(?:<div class="new1">[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<span>(Chapter[^<]+)<\/span>)?[\s\S]*?<\/div>\s*<\/div>/gi;

  let m;
  while ((m = bgeRegex.exec(html)) !== null) {
    const slug = m[1]?.trim();
    const image = m[2]?.trim();
    const rawTitle = m[3]?.trim();
    const subtitle = m[4]?.trim() || '';
    const synopsis = m[5]?.trim() || '';
    const latestChapter = m[7]?.trim() || 'Terbaru';

    if (slug && rawTitle && !seen.has(slug)) {
      seen.add(slug);
      const isManhwa = subtitle.toLowerCase().includes('manhwa') || defaultType === 'Manhwa';
      items.push({
        title: rawTitle.replace(/^baca\s+komik\s+/i, '').replace(/^komik\s+/i, '').trim(),
        slug: `km_${slug}`,
        image: image ? sanitizeSafeUrl(image) : '',
        chapter: latestChapter,
        type: isManhwa ? 'Manhwa' : 'Manga',
        score: '9.3',
        description: synopsis || subtitle || 'Komik Populer Komiku',
      });
    }
  }

  // Regex matching general front page cards
  if (items.length === 0) {
    const cardRegex =
      /<a[^>]+href="(?:\/manga\/|https:\/\/komiku\.org\/manga\/)([^"'/]+)\/?"[^>]*title="([^"]*)"[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)="([^"]+)"/gi;
    let m2;
    while ((m2 = cardRegex.exec(html)) !== null) {
      const slug = m2[1]?.trim();
      const title = m2[2]?.replace(/^baca\s+komik\s+/i, '').replace(/^komik\s+/i, '').trim();
      const image = m2[3]?.trim();
      if (slug && title && !seen.has(slug)) {
        seen.add(slug);
        items.push({
          title,
          slug: `km_${slug}`,
          image: image ? sanitizeSafeUrl(image) : '',
          chapter: 'Terbaru',
          type: (defaultType as any) || 'Manga',
          score: '9.1',
          description: 'Rilisan Komiku',
        });
      }
    }
  }

  return items;
}

export async function fetchKomikuTerbaru(): Promise<ComicItem[]> {
  // 1. Try public Komiku Rest API
  try {
    const res = await fetchWithTimeout(`${KOMIKU_REST_API}/terbaru`, {}, 6000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          title: item.title,
          slug: item.mangaSlug || item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          image: item.thumbnail || item.image,
          chapter: item.latestChapterTitle || 'Terbaru',
          type: (item.type || 'Manga') as any,
          score: '9.1',
          description: item.genre ? `Genre: ${item.genre}` : 'Update terbaru di Komiku',
        }));
      }
    }
  } catch {}

  // 2. Direct Scraper from komiku.org
  try {
    const html = await nativeFetchText(`${KOMIKU_BASE}/`, 8000);
    const items = parseKomikuCardsFromHtml(html, 'Manga');
    if (items.length > 0) return items;
  } catch (e) {
    safeLogError('fetchKomikuTerbaru direct scraper error', e);
  }

  return [];
}

export async function fetchKomikuPopuler(type: 'manga' | 'manhwa' | 'manhua' = 'manhwa'): Promise<ComicItem[]> {
  // 1. Try api.komiku.org hx-get endpoint
  try {
    const html = await nativeFetchText(`${KOMIKU_API_BASE}/manga/?tipe=${type}`, 8000);
    const items = parseKomikuCardsFromHtml(html, type === 'manhwa' ? 'Manhwa' : 'Manga');
    if (items.length > 0) return items;
  } catch {}

  // 2. Try REST API endpoint
  try {
    const res = await fetchWithTimeout(`${KOMIKU_REST_API}/komik-populer/${type}`, {}, 6000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          title: item.title,
          slug: item.mangaSlug || item.slug,
          image: item.thumbnail || item.image,
          chapter: item.latestChapterTitle || 'Populer',
          type: type === 'manhwa' ? 'Manhwa' : 'Manga',
          score: '9.4',
          description: item.synopsis || 'Komik Populer',
        }));
      }
    }
  } catch {}

  return [];
}

export async function fetchKomikuDetail(slug: string): Promise<ComicDetail | null> {
  const cleanSlug = slug.replace(/^km_/, '').replace(/^komik-/, '').replace(/-indo$/, '');
  try {
    const html = await nativeFetchText(`${KOMIKU_BASE}/manga/${cleanSlug}/`, 8000);
    const titleMatch =
      html.match(/<h1[^>]*>[\s\S]*?<span[^>]*itemprop="name"[^>]*>([^<]+)<\/span>/i) ||
      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch
      ? titleMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/^baca\s+komik\s+/i, '')
          .replace(/^komik\s+/i, '')
          .trim()
      : cleanSlug.replace(/-/g, ' ');

    const imgMatch =
      html.match(/<section id="Informasi"[\s\S]*?<img[^>]+src="([^"]+)"/i) ||
      html.match(/<meta property="og:image" content="([^"]+)"/i);
    const image = imgMatch ? sanitizeSafeUrl(imgMatch[1]) : '';

    const synMatch = html.match(/<section id="Sinopsis"[\s\S]*?<p>([\s\S]*?)<\/p>/i);
    const synopsis = synMatch ? synMatch[1].replace(/<[^>]+>/g, '').trim() : 'Komik seru di Komiku.';

    const chapters: Array<{ chapter: string; slug: string; date: string; link: string }> = [];
    const chRegex =
      /<a[^>]+href="(?:\/|https:\/\/komiku\.org\/)([^"'/]+-chapter-[^"'/]+)\/?"[^>]*title="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([^<]*Chapter[^<]*)<\/span>/gi;
    let chMatch;
    while ((chMatch = chRegex.exec(html)) !== null) {
      const chSlug = chMatch[1];
      const chTitle = chMatch[3] || chMatch[2] || 'Chapter';
      chapters.push({
        chapter: chTitle.trim(),
        slug: chSlug.trim(),
        date: 'Terbaru',
        link: `/chapter/${chSlug.trim()}`,
      });
    }

    if (chapters.length > 0 || image) {
      return {
        title,
        slug,
        image,
        synopsis,
        metadata: {
          type: 'Manga / Manhwa',
          status: 'Ongoing',
        },
        genres: [{ name: 'Action', slug: 'action' }, { name: 'Fantasy', slug: 'fantasy' }],
        chapters,
      };
    }
  } catch (e) {
    safeLogError('fetchKomikuDetail error', e);
  }
  return null;
}

export async function fetchKomikuChapterImages(slug: string, chapter: string): Promise<string[]> {
  const cleanSlug = slug.replace(/^km_/, '').replace(/^komik-/, '').replace(/-indo$/, '');
  const cleanChapter = chapter.replace(/[^0-9.-]/g, '');

  const candidateUrls = [
    `https://komiku.org/${cleanSlug}-chapter-${cleanChapter}/`,
    `https://komiku.org/${cleanSlug}-chapter-${cleanChapter.padStart(2, '0')}/`,
    `https://komiku.org/komik-${cleanSlug}-chapter-${cleanChapter}/`,
    `https://komiku.org/${cleanSlug}-chapter-${cleanChapter}-indo/`,
  ];

  for (const url of candidateUrls) {
    try {
      const html = await nativeFetchText(url, 8000);
      const matches: string[] = [];
      const imgRegex =
        /<img[^>]+(?:src|data-src|data-lazy-src)="([^"]*(?:komiku\.(?:org|to)\/upload|upload[0-9]*\/)[^"]*)"[^>]*>/gi;
      let m;
      while ((m = imgRegex.exec(html)) !== null) {
        const src = m[1]?.trim();
        if (src && !matches.includes(src)) {
          matches.push(sanitizeSafeUrl(src));
        }
      }
      if (matches.length > 0) {
        return matches;
      }
    } catch {}
  }
  return [];
}

export async function searchKomiku(query: string): Promise<ComicItem[]> {
  if (!query || !query.trim()) return [];
  try {
    const html = await nativeFetchText(
      `${KOMIKU_API_BASE}/manga/?s=${encodeURIComponent(query.trim())}`,
      8000
    );
    const items = parseKomikuCardsFromHtml(html);
    if (items.length > 0) return items;
  } catch {}

  try {
    const html = await nativeFetchText(
      `${KOMIKU_BASE}/?post_type=manga&s=${encodeURIComponent(query.trim())}`,
      8000
    );
    return parseKomikuCardsFromHtml(html);
  } catch {}

  return [];
}

/* =========================================================================
   4. KUROKAMI MANHWA API (Gungcakra/kurokami-manhwa-api)
   ========================================================================= */

export const KUROKAMI_API_BASE = 'https://kurokami.vercel.app/api';

export async function fetchKurokamiPopular(): Promise<any[]> {
  try {
    const res = await fetchWithTimeout(`${KUROKAMI_API_BASE}/manhwa-popular`, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiNew(): Promise<any[]> {
  try {
    const res = await fetchWithTimeout(`${KUROKAMI_API_BASE}/manhwa-new`, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiOngoing(): Promise<any[]> {
  try {
    const res = await fetchWithTimeout(`${KUROKAMI_API_BASE}/manhwa-ongoing`, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiTop(): Promise<any[]> {
  try {
    const res = await fetchWithTimeout(`${KUROKAMI_API_BASE}/manhwa-top`, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiRecommendation(): Promise<any[]> {
  try {
    const res = await fetchWithTimeout(`${KUROKAMI_API_BASE}/manhwa-recommendation`, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiDetail(manhwaId: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(
      `${KUROKAMI_API_BASE}/manhwa-detail/${encodeURIComponent(manhwaId)}`,
      {},
      8000
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchKurokamiChapter(chapterId: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(
      `${KUROKAMI_API_BASE}/chapter/${encodeURIComponent(chapterId)}`,
      {},
      8000
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchKurokamiSearch(query: string, page: number = 1): Promise<any[]> {
  try {
    const endpoint =
      page > 1
        ? `${KUROKAMI_API_BASE}/search/${encodeURIComponent(query)}/page/${page}`
        : `${KUROKAMI_API_BASE}/search/${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(endpoint, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.seriesList || [];
    }
  } catch {}
  return [];
}

/* =========================================================================
   5. CURATED MANHWA & MANGA HITS (MangaDex & Local Catalog)
   ========================================================================= */

export const MANHWA_MANGADEX_ID_MAP: Record<string, string> = {
  serena: 'f239fcd4-9f7f-4296-9e52-ee5a66a7e938',
  'cry-or-better-yet-beg': 'd6bc762b-1159-47f0-a625-feb9f81e4ddd',
  ulgehasoseo: 'd6bc762b-1159-47f0-a625-feb9f81e4ddd',
  'the-remarried-empress': 'ac6819d8-de35-442c-82dd-3444983d4f26',
  'who-made-me-a-princess': '722a45c0-5e55-40f2-929b-ff69b0989edb',
  'operation-true-love': 'f8dbced3-1eea-4547-b657-ce568fbdda0f',
  'true-beauty': '51a0cd0c-3254-47f0-a7fd-4b9bb178f813',
  'under-the-oak-tree': 'c9a891f6-9f4b-487d-8b62-7abb0e3f59c8',
  'solo-leveling': 'ade0306c-f4b6-4890-9edb-1ddf04df2039',
  lookism: '596191eb-69ee-4401-983e-cc07e277fa17',
  'omniscient-reader': '9a414441-bbad-43f1-a3a7-dc262ca790a3',
  'omniscient-readers-viewpoint': '9a414441-bbad-43f1-a3a7-dc262ca790a3',
  'nano-machine': '6e4805a6-75ab-462d-883c-4ddedb8e4df6',
  'killer-peter': 'a3db9212-7e87-44ea-8264-23f914671444',
  eleceed: '7e544761-7d3d-4fce-8137-719814d7d138',
  'tower-of-god': '37f5c448-9e65-4ae0-a246-8803a6703edc',
  'return-of-the-mount-hua-sect': 'f0f62b75-5989-4f32-9b59-ab56abe35fc1',
  'wind-breaker': '9eb78304-0436-484d-9a79-a925b45e2731',
  'the-beginning-after-the-end': 'e17e4f3a-2114-4fb4-b48c-772c5750d4ff',
  'pick-me-up': 'ef79708a-6b4d-45de-9889-11ba1f158580',
  'the-world-after-the-fall': '983737ec-a430-4591-9c1c-0c84bcbeec04',
  'sss-class-suicide-hunter': '4a973243-952e-44d7-a50f-883b4b7c9cc2',
  'reincarnation-of-the-suicidal-battle-god': 'c2f8211b-c6e3-469b-980b-0dd4f697ec22',
  'mercenary-enrollment': '0e5b7fb6-5a45-4b1e-b8dd-1ef824eb976d',
  'magic-emperor': '71239c09-a78b-4b1c-99f5-412f170ef520',
  'martial-peak': 'f78696ec-c5d0-43b9-a2e6-a367507ebba8',
};

export const CURATED_COMIC_FALLBACK: ComicItem[] = [
  {
    title: 'One Piece',
    slug: 'one-piece',
    image: 'https://thumbnail.komiku.to/img/upload/one_piece/img_649f87c8da5d4.jpg?w=500',
    chapter: 'Chapter 1145',
    type: 'Manga',
    score: '9.8',
    description: 'Petualangan Monkey D. Luffy mengarungi lautan Grand Line untuk menjadi Raja Bajak Laut.',
  },
  {
    title: 'Jujutsu Kaisen',
    slug: 'jujutsu-kaisen',
    image: 'https://thumbnail.komiku.to/img/upload/jujutsu_kaisen/img_649f87cada5d4.jpg?w=500',
    chapter: 'Chapter 271 (Tamat)',
    type: 'Manga',
    score: '9.4',
    description: 'Yuji Itadori menelan jari Sukuna dan bergabung dengan SMK Jujutsu Tokyo demi melindungi umat manusia.',
  },
  {
    title: 'Chainsaw Man',
    slug: 'chainsaw-man',
    image: 'https://thumbnail.komiku.to/img/upload/chainsaw_man/img_649f87cbda5d4.jpg?w=500',
    chapter: 'Chapter 188',
    type: 'Manga',
    score: '9.3',
    description: 'Denji hidup sebagai pemburu iblis bersama Pochita demi melunasi hutang ayahnya.',
  },
  {
    title: 'Sousou no Frieren',
    slug: 'sousou-no-frieren',
    image: 'https://thumbnail.komiku.to/img/upload/sousou_no_frieren/img_649f87ccda5d4.jpg?w=500',
    chapter: 'Chapter 138',
    type: 'Manga',
    score: '9.5',
    description: 'Perjalanan panjang elf Frieren memahami arti perasaan manusia setelah pahlawan tiada.',
  },
  {
    title: 'Bleach: Thousand-Year Blood War',
    slug: 'bleach',
    image: 'https://thumbnail.komiku.to/img/upload/bleach/img_649f87cfda5d4.jpg?w=500',
    chapter: 'Chapter 686 (Tamat)',
    type: 'Manga',
    score: '8.9',
    description: 'Perang akbar para Shinigami Soul Society menghadapi bangsa Quincy Yhwach.',
  },
  {
    title: 'Black Clover',
    slug: 'black-clover',
    image: 'https://thumbnail.komiku.to/img/upload/black_clover/img_649f87d0da5d4.jpg?w=500',
    chapter: 'Chapter 378',
    type: 'Manga',
    score: '8.8',
    description: 'Asta yang lahir tanpa sihir bertekad menjadi Kaisar Sihir nomor satu di Kerajaan Clover.',
  },
  {
    title: 'Boku no Hero Academia',
    slug: 'boku-no-hero-academia',
    image: 'https://thumbnail.komiku.to/img/upload/my_hero_academia/img_649f87d1da5d4.jpg?w=500',
    chapter: 'Chapter 430 (Tamat)',
    type: 'Manga',
    score: '9.0',
    description: 'Kisah Deku mewarisi One For All demi menjadi simbol perdamaian dunia pahlawan.',
  },
  {
    title: 'Spy x Family',
    slug: 'spy-x-family',
    image: 'https://thumbnail.komiku.to/img/upload/spy_family/img_649f87d2da5d4.jpg?w=500',
    chapter: 'Chapter 109',
    type: 'Manga',
    score: '9.3',
    description: 'Keluarga palsu beranggotakan agen rahasia, pembunuh bayaran, dan putri cenayang.',
  },
];

export const CURATED_MANHWA_LIST: ComicItem[] = [
  {
    title: 'Serena',
    slug: 'serena',
    image: 'https://uploads.mangadex.org/covers/34d8a0e8-6811-459d-87a1-2d3e81ad18fb/67177930-a1b4-4092-b9e8-b3b47322b21c.jpg.512.jpg',
    chapter: 'Chapter 112',
    type: 'Manhwa',
    score: '9.8',
    description: 'Serena Serenity, pewaris tunggal Hotel Serenity yang terancam bangkrut, terjebak pernikahan kontrak penuh intrik dan gairah bersama Eiser.',
  },
  {
    title: 'Cry, or Better Yet, Beg (Ulgehasoseo)',
    slug: 'cry-or-better-yet-beg',
    image: 'https://uploads.mangadex.org/covers/b6b4d89e-f97b-42f2-badd-2a7ce28d9cef/b4317e18-e8c6-46bf-aef8-9d2008fc3204.jpg.512.jpg',
    chapter: 'Chapter 45',
    type: 'Manhwa',
    score: '9.7',
    description: 'Layla Llewellyn, gadis yatim piatu yang bermimpi menjadi guru, menarik perhatian Duke Herhardt yang dingin dan obsesif.',
  },
  {
    title: 'Solo Leveling (Na Honjaman Level-Up)',
    slug: 'solo-leveling',
    image: 'https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/e90bdc47-c8b9-4df7-b2c0-17641b645ee1.jpg.512.jpg',
    chapter: 'Chapter 200 (Tamat)',
    type: 'Manhwa',
    score: '9.9',
    description: 'Sung Jin-woo, Hunter Rank E terlemah umat manusia, mendapatkan quest rahasia misterius yang menjadikannya Player nomor satu dunia.',
  },
  {
    title: 'Lookism (Oemo Jisangjuui)',
    slug: 'lookism',
    image: 'https://uploads.mangadex.org/covers/596191eb-69ee-4401-983e-cc07e277fa17/6df15145-f15b-43f0-b87b-22fd3694eaca.jpg.512.jpg',
    chapter: 'Chapter 525',
    type: 'Manhwa',
    score: '9.8',
    description: 'Park Hyung Suk yang menjadi korban perundungan parah terbangun di dalam tubuh seorang pemuda rupawan dan atletis berkekuatan luar biasa.',
  },
  {
    title: "Omniscient Reader's Viewpoint",
    slug: 'omniscient-readers-viewpoint',
    image: 'https://uploads.mangadex.org/covers/9a414441-bbad-43f1-a3a7-dc262ca790a3/be18dc9a-7f1c-4ca5-b318-ffff2d7d58c3.jpg.512.jpg',
    chapter: 'Chapter 235',
    type: 'Manhwa',
    score: '9.9',
    description: 'Kim Dokja menjadi satu-satunya pembaca setia yang mengetahui seluruh skenario akhir novel web saat monster dan rintangan fiksi menjadi kenyataan.',
  },
  {
    title: 'Nano Machine',
    slug: 'nano-machine',
    image: 'https://uploads.mangadex.org/covers/6e4805a6-75ab-462d-883c-4ddedb8e4df6/16406b53-9224-4639-8511-9951484ad99a.jpg.512.jpg',
    chapter: 'Chapter 332',
    type: 'Manhwa',
    score: '9.7',
    description: 'Cheon Yeo-woon, anak haram sekte iblis yang terbuang, disuntikkan jutaan mesin nano canggih oleh keturunannya dari masa depan.',
  },
  {
    title: 'Killer Peter',
    slug: 'killer-peter',
    image: 'https://uploads.mangadex.org/covers/a3db9212-7e87-44ea-8264-23f914671444/fde4fbe2-0a2f-47ad-b389-0d2af2ace201.jpg.512.jpg',
    chapter: 'Chapter 60',
    type: 'Manhwa',
    score: '9.8',
    description: 'Peter, pembunuh legendaris tua dari organisasi Gloria yang dikhianati, mendadak kembali ke tubuhnya saat berusia 19 tahun dengan seluruh pengalaman tempur veterannya.',
  },
  {
    title: 'Eleceed',
    slug: 'eleceed',
    image: 'https://uploads.mangadex.org/covers/7e544761-7d3d-4fce-8137-719814d7d138/52cf193d-6862-43e8-9de4-1025c0e6e297.jpg.512.jpg',
    chapter: 'Chapter 320',
    type: 'Manhwa',
    score: '9.7',
    description: 'Seo Jiwoo yang berhati hangat menyelamatkan kucing gemuk oranye yang terluka, yang ternyata adalah Kayden—penyihir awaken terkuat dunia yang bersembunyi.',
  },
  {
    title: 'Tower of God (Sin-ui Tap)',
    slug: 'tower-of-god',
    image: 'https://uploads.mangadex.org/covers/37f5c448-9e65-4ae0-a246-8803a6703edc/319ba275-2965-48b0-a8dc-ea5c4530fc1c.jpg.512.jpg',
    chapter: 'Chapter 640',
    type: 'Manhwa',
    score: '9.6',
    description: 'Bam Memanjat Menara Misterius untuk mengejar Rachel, menghadapi pertarungan hidup-mati di setiap lantai di bawah pengawasan para Administrator dan Ranker.',
  },
  {
    title: 'Return of the Mount Hua Sect',
    slug: 'return-of-the-mount-hua-sect',
    image: 'https://uploads.mangadex.org/covers/f0f62b75-5989-4f32-9b59-ab56abe35fc1/e06dc49c-60d3-41c1-8026-30e9c197c9c0.jpg.512.jpg',
    chapter: 'Chapter 142',
    type: 'Manhwa',
    score: '9.8',
    description: 'Chung Myung, Pedang Suci Bunga Plum ke-13 yang membunuh Pemimpin Sekte Iblis Chun Ma, bangkit 100 tahun kemudian dan terkejut mendapati Sekte Gunung Hua telah hancur.',
  },
  {
    title: 'Wind Breaker',
    slug: 'wind-breaker',
    image: 'https://uploads.mangadex.org/covers/9eb78304-0436-484d-9a79-a925b45e2731/088f8766-147d-4347-8a0e-2eda9ef4796d.jpg.512.jpg',
    chapter: 'Chapter 515',
    type: 'Manhwa',
    score: '9.7',
    description: 'Jay Jo, siswa teladan berkacamata yang dingin, diajak bergabung ke kru sepeda jalanan Hummingbird untuk berlaga di turnamen balap jalanan ekstrem League of Street.',
  },
  {
    title: 'The Beginning After the End',
    slug: 'the-beginning-after-the-end',
    image: 'https://uploads.mangadex.org/covers/e17e4f3a-2114-4fb4-b48c-772c5750d4ff/3e1a8cf2-d533-4f93-8b77-cfc8f070b4be.jpg.512.jpg',
    chapter: 'Chapter 185',
    type: 'Manhwa',
    score: '9.6',
    description: 'Raja Grey terlahir kembali sebagai Arthur Leywin di benua Dicathen, menguasai ilmu mana dan sihir untuk melindungi orang-orang yang disayanginya.',
  },
  {
    title: 'Pick Me Up, Infinite Gacha',
    slug: 'pick-me-up',
    image: 'https://uploads.mangadex.org/covers/ef79708a-6b4d-45de-9889-11ba1f158580/5e0eb965-ea9a-4db5-9e6b-a2c6b4fc487e.jpg.512.jpg',
    chapter: 'Chapter 122',
    type: 'Manhwa',
    score: '9.7',
    description: 'Pemain peringkat nomor 1 di dunia game seluler gacha ekstrem Pick Me Up kehilangan kesadaran dan tersadar sebagai hero bintang 1 di lantai paling bawah.',
  },
  {
    title: 'The World After the Fall',
    slug: 'the-world-after-the-fall',
    image: 'https://uploads.mangadex.org/covers/983737ec-a430-4591-9c1c-0c84bcbeec04/d87455d3-8822-4bb3-96e0-94f31c26e107.jpg.512.jpg',
    chapter: 'Chapter 155',
    type: 'Manhwa',
    score: '9.5',
    description: 'Dari pencipta Omniscient Reader: Jaehwan menolak Batu Regresi dan menusuk langit dengan satu-satunya ilmu tusukan yang diasahnya jutaan kali.',
  },
  {
    title: 'SSS-Class Suicide Hunter',
    slug: 'sss-class-suicide-hunter',
    image: 'https://uploads.mangadex.org/covers/4a973243-952e-44d7-a50f-883b4b7c9cc2/9adafa19-0424-4677-aab4-93a07a01a591.jpg.512.jpg',
    chapter: 'Chapter 115',
    type: 'Manhwa',
    score: '9.6',
    description: 'Kim Gong-ja memperoleh skill pasif aneh: setiap kali ia dibunuh oleh hunter lain, ia bisa meniru salah satu skill dari orang yang membunuhnya.',
  },
  {
    title: 'Doom Breaker (Suicidal Battle God)',
    slug: 'reincarnation-of-the-suicidal-battle-god',
    image: 'https://uploads.mangadex.org/covers/c2f8211b-c6e3-469b-980b-0dd4f697ec22/9431ff4f-2ca8-4796-abf2-95f3b7ba8232.jpg.512.jpg',
    chapter: 'Chapter 105',
    type: 'Manhwa',
    score: '9.5',
    description: 'Zephyr, manusia terakhir yang tersisa, bertarung sampai nafas terakhir melawan Dewa Kehancuran Tartaros dan dikirim kembali ke masa lalu oleh para dewa penonton.',
  },
  {
    title: 'Mercenary Enrollment (Teenage Mercenary)',
    slug: 'mercenary-enrollment',
    image: 'https://uploads.mangadex.org/covers/0e5b7fb6-5a45-4b1e-b8dd-1ef824eb976d/678ba70b-d242-430c-b26a-9b4334360e23.jpg.512.jpg',
    chapter: 'Chapter 205',
    type: 'Manhwa',
    score: '9.6',
    description: 'Yu Ijin, mantan tentara bayaran elit yang bertahan hidup 10 tahun di medan perang brutal, kembali ke Korea untuk hidup normal bersama kakek dan adiknya di SMA.',
  },
  {
    title: 'Magic Emperor (Demonic Emperor)',
    slug: 'magic-emperor',
    image: 'https://uploads.mangadex.org/covers/71239c09-a78b-4b1c-99f5-412f170ef520/19f5c400-0196-41f8-958b-0ea4fb998ae3.jpg.512.jpg',
    chapter: 'Chapter 590',
    type: 'Manhwa',
    score: '9.5',
    description: 'Zhuo Yifan, Kaisar Iblis terhebat yang dikhianati muridnya, bereinkarnasi ke dalam tubuh pelayan lemah bernama Zhuo Fan dari klan Luo yang terancam punah.',
  },
  {
    title: 'Martial Peak',
    slug: 'martial-peak',
    image: 'https://uploads.mangadex.org/covers/f78696ec-c5d0-43b9-a2e6-a367507ebba8/a73f8582-777e-4b68-bf09-2420a4b6da32.jpg.512.jpg',
    chapter: 'Chapter 3862 (Tamat)',
    type: 'Manhwa',
    score: '9.4',
    description: 'Perjalanan kultivasi Yang Kai dari sekte Lingxiao hingga mencapai puncak langit semesta dengan Buku Hitam Tanpa Kata.',
  },
];

/* =========================================================================
   6. MULTI-SOURCE AGGREGATOR (6 APIS: Sanka, Kurokami, MangaDex, Jikan, Shiro, Komiku)
   ========================================================================= */

export async function fetchManhwaList(page: number = 1): Promise<ComicItem[]> {
  const limit = 24;
  const offset = (page - 1) * limit;

  // 6 APIs aggregation with Promise.allSettled and AbortController timeout (8s)
  const [mdSettled, sankaSettled, kuroSettled, komikuSettled, shiroSettled] = await Promise.allSettled([
    // 1. MangaDex Korean hits
    fetchWithTimeout(
      `https://api.mangadex.org/manga?originalLanguage[]=ko&order[followedCount]=desc&limit=${limit}&offset=${offset}&includes[]=cover_art`,
      {},
      8000
    )
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] })),

    // 2. Sanka /comic/berwarna (on page 1)
    page === 1
      ? fetchJsonWithCache<any>('/comic/berwarna', 300000).catch(() => ({ results: [] }))
      : Promise.resolve({ results: [] }),

    // 3. Kurokami Manhwa API
    page === 1 ? fetchKurokamiPopular().catch(() => []) : Promise.resolve([]),

    // 4. Komiku Populer Manhwa
    page === 1 ? fetchKomikuPopuler('manhwa').catch(() => []) : Promise.resolve([]),

    // 5. SHIRO-MANHWA-API Recommendations
    page === 1 ? fetchShiroRecommendations('action').catch(() => []) : Promise.resolve([]),
  ]);

  const mdData = mdSettled.status === 'fulfilled' ? mdSettled.value?.data || [] : [];
  const mdItems: ComicItem[] = mdData.map((m: any) => {
    const title = m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Manhwa';
    const coverRel = m.relationships?.find((r: any) => r.type === 'cover_art');
    const coverFile = coverRel?.attributes?.fileName;
    const cover = coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.512.jpg` : '';
    const desc = m.attributes?.description?.en || Object.values(m.attributes?.description || {})[0] || '';

    return {
      title,
      slug: `md_${m.id}`,
      image: cover,
      chapter: 'Full Color HD',
      type: 'Manhwa' as const,
      score: '9.6',
      description: desc,
    };
  });

  const sankaData =
    sankaSettled.status === 'fulfilled'
      ? sankaSettled.value?.results || sankaSettled.value?.comics || sankaSettled.value?.data?.results || []
      : [];
  const sankaItems: ComicItem[] = sankaData.map((item: any) => ({
    title: item.title,
    slug:
      item.slug ||
      item.detailUrl?.split('/').filter(Boolean).pop() ||
      item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: item.thumbnail || item.image || item.cover,
    chapter: item.chapter || 'Full Color',
    type: 'Manhwa' as const,
    score: '9.4',
    description: item.description || '',
  }));

  const kuroData = kuroSettled.status === 'fulfilled' ? kuroSettled.value || [] : [];
  const kuroItems: ComicItem[] = kuroData.map((item: any) => ({
    title: item.title,
    slug: item.link?.split('/manga/')[1]?.replace(/\/$/, '') || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: item.imageSrc || item.image,
    chapter: item.chapter || item.chapters?.[0]?.chapterTitle || 'Terbaru',
    type: 'Manhwa' as const,
    score: item.rating || '9.5',
    description: 'Kurokami Manhwa Indo',
  }));

  const komikuItems: ComicItem[] = komikuSettled.status === 'fulfilled' ? komikuSettled.value || [] : [];
  const shiroItems: ComicItem[] = shiroSettled.status === 'fulfilled' ? shiroSettled.value || [] : [];

  // Deduplicate and merge results
  const seen = new Set<string>();
  const combined: ComicItem[] = [];

  // 1. Curated hits first
  for (const item of CURATED_MANHWA_LIST) {
    const key = normalizeTitle(item.title);
    seen.add(key);
    combined.push(item);
  }

  // 2. Add from MangaDex, Komiku, Kurokami, Sanka, Shiro
  for (const list of [mdItems, komikuItems, kuroItems, sankaItems, shiroItems]) {
    for (const item of list) {
      const key = normalizeTitle(item.title);
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }
  }

  return combined;
}

export async function fetchComicPopular(): Promise<ComicItem[]> {
  const [sankaSettled, komikuSettled, kuroSettled] = await Promise.allSettled([
    fetchJsonWithCache<any>('/comic/populer', 300000).catch(() => ({ comics: [] })),
    fetchKomikuPopuler('manga').catch(() => []),
    fetchKurokamiTop().catch(() => []),
  ]);

  const sankaComics =
    sankaSettled.status === 'fulfilled'
      ? sankaSettled.value?.comics || sankaSettled.value?.results || []
      : [];
  const sankaItems: ComicItem[] = sankaComics.map((c: any) => ({
    title: c.title,
    slug: c.slug || c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: c.image || c.thumbnail,
    chapter: c.chapter || 'Populer',
    type: 'Manga' as const,
    score: '9.2',
    description: c.description || '',
  }));

  const komikuItems: ComicItem[] = komikuSettled.status === 'fulfilled' ? komikuSettled.value || [] : [];
  const kuroData = kuroSettled.status === 'fulfilled' ? kuroSettled.value || [] : [];
  const kuroItems: ComicItem[] = kuroData.map((c: any) => ({
    title: c.title,
    slug: c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: c.imageSrc || c.image,
    chapter: c.chapter || 'Top Rank',
    type: 'Manga' as const,
    score: '9.4',
    description: 'Kurokami Manga',
  }));

  const seen = new Set<string>();
  const combined: ComicItem[] = [];

  for (const item of CURATED_COMIC_FALLBACK) {
    seen.add(normalizeTitle(item.title));
    combined.push(item);
  }

  for (const list of [sankaItems, komikuItems, kuroItems]) {
    for (const item of list) {
      const key = normalizeTitle(item.title);
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }
  }

  return combined;
}

export async function fetchComicLatest(): Promise<ComicItem[]> {
  const [sankaSettled, komikuSettled, kuroSettled] = await Promise.allSettled([
    fetchJsonWithCache<any>('/comic/terbaru', 300000).catch(() => ({ comics: [] })),
    fetchKomikuTerbaru().catch(() => []),
    fetchKurokamiNew().catch(() => []),
  ]);

  const sankaComics =
    sankaSettled.status === 'fulfilled'
      ? sankaSettled.value?.comics || sankaSettled.value?.results || []
      : [];
  const sankaItems: ComicItem[] = sankaComics.map((c: any) => ({
    title: c.title,
    slug: c.slug || c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: c.image || c.thumbnail,
    chapter: c.chapter || 'Update Baru',
    type: 'Manga' as const,
    score: '9.0',
    description: c.description || '',
  }));

  const komikuItems: ComicItem[] = komikuSettled.status === 'fulfilled' ? komikuSettled.value || [] : [];
  const kuroData = kuroSettled.status === 'fulfilled' ? kuroSettled.value || [] : [];
  const kuroItems: ComicItem[] = kuroData.map((c: any) => ({
    title: c.title,
    slug: c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: c.imageSrc || c.image,
    chapter: c.chapter || 'Rilis Baru',
    type: 'Manga' as const,
    score: '9.1',
    description: 'Kurokami Rilis Baru',
  }));

  const seen = new Set<string>();
  const combined: ComicItem[] = [];

  for (const item of CURATED_COMIC_FALLBACK) {
    seen.add(normalizeTitle(item.title));
    combined.push(item);
  }

  for (const list of [komikuItems, sankaItems, kuroItems]) {
    for (const item of list) {
      const key = normalizeTitle(item.title);
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }
  }

  return combined;
}

export async function fetchComicDetail(slug: string): Promise<ComicDetail> {
  // 1. If it's a Komiku slug (starts with km_ or komik-)
  if (slug.startsWith('km_')) {
    const kmDetail = await fetchKomikuDetail(slug);
    if (kmDetail) return kmDetail;
  }

  // 2. Try MangaDex mapped or dynamic
  let mangaDexId = slug.startsWith('md_') ? slug.replace(/^md_/, '') : MANHWA_MANGADEX_ID_MAP[slug];

  if (!mangaDexId) {
    const clean = slug.replace(/-(chapter|ch)-.*$/i, '').replace(/-/g, ' ');
    try {
      const sRes = await fetchWithTimeout(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(clean)}&limit=5&includes[]=cover_art`,
        {},
        8000
      ).then((r) => r.json());
      for (const m of sRes.data || []) {
        const feedCheck = await fetchWithTimeout(
          `https://api.mangadex.org/manga/${m.id}/feed?limit=5`,
          {},
          8000
        ).then((r) => r.json());
        if (feedCheck.total > 0) {
          mangaDexId = m.id;
          break;
        }
      }
    } catch {}
  }

  if (mangaDexId) {
    try {
      const [mangaRes, feedRes] = await Promise.all([
        fetchWithTimeout(`https://api.mangadex.org/manga/${mangaDexId}?includes[]=cover_art`, {}, 8000)
          .then((r) => r.json())
          .catch(() => ({})),
        fetchWithTimeout(
          `https://api.mangadex.org/manga/${mangaDexId}/feed?order[chapter]=desc&limit=100`,
          {},
          8000
        )
          .then((r) => r.json())
          .catch(() => ({})),
      ]);

      const m = mangaRes.data;
      const title = m?.attributes?.title?.en || Object.values(m?.attributes?.title || {})[0] || slug.replace(/-/g, ' ');
      const desc =
        m?.attributes?.description?.en ||
        Object.values(m?.attributes?.description || {})[0] ||
        'Webtoon Korea berwarna resolusi tinggi.';
      const coverRel = m?.relationships?.find((r: any) => r.type === 'cover_art');
      const coverFile = coverRel?.attributes?.fileName;
      const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${mangaDexId}/${coverFile}.512.jpg` : '';

      const chaptersRaw = feedRes?.data || [];
      const chapters = chaptersRaw.map((ch: any) => ({
        chapter: ch.attributes?.chapter ? `Chapter ${ch.attributes.chapter}` : ch.attributes?.title || 'Chapter',
        slug: `md_${ch.id}`,
        date: ch.attributes?.publishAt ? ch.attributes.publishAt.split('T')[0] : 'Terbaru',
        link: `/chapter/${ch.id}`,
      }));

      if (chapters.length > 0) {
        return {
          title,
          slug,
          image: coverUrl,
          synopsis: desc,
          metadata: {
            type: 'Manhwa / Webtoon',
            status: m?.attributes?.status || 'Ongoing',
            year: m?.attributes?.year ? String(m.attributes.year) : '2024',
          },
          genres: (m?.attributes?.tags || []).slice(0, 5).map((t: any) => ({
            name: t.attributes?.name?.en || 'Webtoon',
            slug: t.attributes?.name?.en?.toLowerCase().replace(/\s+/g, '-') || 'webtoon',
          })),
          chapters,
        };
      }
    } catch (e) {
      safeLogError('MangaDex fetchComicDetail fallback', e);
    }
  }

  // 3. Try Kurokami Detail
  try {
    const kuroDetail = await fetchKurokamiDetail(slug);
    if (kuroDetail && (kuroDetail.title || kuroDetail.chapters)) {
      return {
        title: kuroDetail.title || slug.replace(/-/g, ' '),
        slug,
        image: kuroDetail.image || kuroDetail.cover || '',
        synopsis: kuroDetail.synopsis || 'Manhwa populer di Kurokami.',
        metadata: {
          type: 'Manhwa',
          status: kuroDetail.status || 'Ongoing',
        },
        genres: (kuroDetail.genres || []).map((g: any) => ({
          name: typeof g === 'string' ? g : g.name,
          slug: (typeof g === 'string' ? g : g.slug || g.name).toLowerCase(),
        })),
        chapters: (kuroDetail.chapters || []).map((ch: any) => ({
          chapter: ch.chapterTitle || ch.title || 'Chapter',
          slug: ch.chapterSlug || ch.slug || ch.link?.split('/chapter/')[1]?.replace(/\/$/, '') || '',
          date: ch.date || 'Terbaru',
          link: `/chapter/${ch.chapterSlug || ch.slug}`,
        })),
      };
    }
  } catch {}

  // 4. Try Sanka Vollerei
  try {
    const raw = await fetchJsonWithCache<any>(`/comic/comic/${slug}`, 600000);
    return {
      title: raw.title || slug.replace(/-/g, ' '),
      titleIndonesian: raw.title_indonesian || raw.title,
      slug: raw.slug || slug,
      image: raw.image || '',
      synopsis: raw.synopsis || raw.synopsis_full || raw.summary || 'Sinopsis komik belum tersedia.',
      metadata: raw.metadata || {},
      genres: Array.isArray(raw.genres)
        ? raw.genres.map((g: any) => ({ name: g.name || g.title, slug: g.slug || '' }))
        : [{ name: 'Action', slug: 'action' }, { name: 'Fantasy', slug: 'fantasy' }],
      chapters: Array.isArray(raw.chapters)
        ? raw.chapters.map((ch: any) => ({
            chapter: ch.chapter,
            slug: ch.slug || ch.link?.replace(/^\/|\/$/g, '') || '',
            date: ch.date || '',
            link: ch.link || '',
          }))
        : [],
    };
  } catch (err) {
    safeLogError('fetchComicDetail fallback to Komiku/Local for ' + slug, err);
    // 5. Try Komiku fallback
    const kmDetail = await fetchKomikuDetail(slug);
    if (kmDetail) return kmDetail;

    return {
      title: slug.replace(/-/g, ' ').toUpperCase(),
      slug,
      image: 'https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/e90bdc47-c8b9-4df7-b2c0-17641b645ee1.jpg.512.jpg',
      synopsis: 'Manhwa / Webtoon Korea berwarna dengan jalan cerita menarik dan chapter lengkap.',
      metadata: { type: 'Manhwa', status: 'Ongoing', ageRating: '13+' },
      genres: [{ name: 'Action', slug: 'action' }, { name: 'Drama', slug: 'drama' }, { name: 'Fantasy', slug: 'fantasy' }],
      chapters: [],
    };
  }
}

/**
 * Chained Auto-Failover Chapter Reader Engine:
 * Komiku -> Shiro -> Kurokami -> Sanka -> MangaDex at-home/server
 * Never exposes errors to user; returns live page images smoothly.
 */
export async function fetchComicChapter(chapterSlug: string, titleHint?: string): Promise<ComicChapterData> {
  const chapterMatch =
    chapterSlug.match(/(?:chapter|ch|eps|episode)-([0-9]+(?:[.-][0-9]+)*)/i) ||
    chapterSlug.match(/\/([0-9]+)$/) ||
    chapterSlug.match(/-([0-9]+)$/);
  const chapterNumber = chapterMatch ? chapterMatch[1] : '1';
  const rawMangaSlug = chapterSlug
    .replace(/^km_/, '')
    .replace(/-(?:chapter|ch|eps|episode)-.*$/i, '')
    .replace(/\/.*$/, '');
  const searchTitle = titleHint || rawMangaSlug.replace(/-/g, ' ');

  // 1. Try Komiku Chapter Scraper (Komiku-Rest-Api & Direct Native Scraper)
  try {
    const komikuImages = await fetchKomikuChapterImages(rawMangaSlug, chapterNumber);
    if (komikuImages.length > 0) {
      return {
        title: `${searchTitle} Chapter ${chapterNumber}`,
        chapterSlug,
        images: komikuImages,
        navigation: {},
      };
    }
  } catch (e) {
    safeLogError('Chapter Failover Step 1 (Komiku) failed', e);
  }

  // 2. Try Kurokami API Chapter Endpoint
  try {
    const kuroRes = await fetchWithTimeout(
      `https://kurokami.vercel.app/api/chapter/${encodeURIComponent(chapterSlug)}`,
      {},
      8000
    );
    if (kuroRes.ok) {
      const kuroData = await kuroRes.json();
      const imgs = kuroData.images || kuroData.sources?.[0]?.images || [];
      if (Array.isArray(imgs) && imgs.length > 0) {
        return {
          title: kuroData.title || chapterSlug.replace(/-/g, ' '),
          chapterSlug,
          images: imgs.map((u: any) => sanitizeSafeUrl(u)),
          navigation: {
            previousChapter: kuroData.prevChapter,
            nextChapter: kuroData.nextChapter,
          },
        };
      }
    }
  } catch (e) {
    safeLogError('Chapter Failover Step 2 (Kurokami) failed', e);
  }

  // 3. Try Sanka Kiryuu API
  try {
    const sankaRes = await fetchWithTimeout(
      `https://www.sankavollerei.web.id/comic/kiryuu/chapter/${encodeURIComponent(chapterSlug)}`,
      {},
      8000
    );
    if (sankaRes.ok) {
      const sankaData = await sankaRes.json();
      const imgs = sankaData.images || sankaData.chapterImages || [];
      if (Array.isArray(imgs) && imgs.length > 0) {
        return {
          title: sankaData.title || chapterSlug.replace(/-/g, ' '),
          chapterSlug,
          images: imgs.map((u: any) => sanitizeSafeUrl(u)),
          navigation: {},
        };
      }
    }
  } catch (e) {
    safeLogError('Chapter Failover Step 3 (Sanka Kiryuu) failed', e);
  }

  // 4. Try Sanka Default Comic API
  try {
    const raw = await fetchJsonWithCache<any>(`/comic/chapter/${chapterSlug}`, 600000);
    if (Array.isArray(raw?.images) && raw.images.length > 0) {
      return {
        title: raw.title || chapterSlug.replace(/-/g, ' '),
        chapterSlug,
        images: raw.images.map((u: any) => sanitizeSafeUrl(u)),
        navigation: raw.navigation || {},
      };
    }
  } catch (e) {
    safeLogError('Chapter Failover Step 4 (Sanka Default) failed', e);
  }

  // 5. Try MangaDex At-Home Server (Direct UUID)
  if (chapterSlug.startsWith('md_') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterSlug)) {
    const chapterId = chapterSlug.replace(/^md_/, '');
    try {
      const res = await fetchWithTimeout(`https://api.mangadex.org/at-home/server/${chapterId}`, {}, 8000);
      if (res.ok) {
        const d = await res.json();
        const baseUrl = d.baseUrl;
        const hash = d.chapter?.hash;
        const files: string[] = d.chapter?.dataSaver?.length ? d.chapter.dataSaver : d.chapter?.data || [];
        if (baseUrl && hash && files.length > 0) {
          const subPath = d.chapter?.dataSaver?.length ? 'data-saver' : 'data';
          return {
            title: `Chapter ${chapterNumber}`,
            chapterSlug,
            images: files.map((f) => `${baseUrl}/${subPath}/${hash}/${f}`),
            navigation: {},
          };
        }
      }
    } catch (e) {
      safeLogError('Chapter Failover Step 5 (MangaDex Direct) failed', e);
    }
  }

  // 6. Dynamic MangaDex title lookup fallback
  if (searchTitle) {
    try {
      const sRes = await fetchWithTimeout(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(searchTitle)}&limit=5`,
        {},
        8000
      ).then((r) => r.json());
      for (const m of sRes.data || []) {
        const feedRes = await fetchWithTimeout(
          `https://api.mangadex.org/manga/${m.id}/feed?limit=25&order[chapter]=desc`,
          {},
          8000
        ).then((r) => r.json());
        if (feedRes.data && feedRes.data.length > 0) {
          const matchedCh =
            feedRes.data.find((ch: any) => ch.attributes?.chapter === chapterNumber) || feedRes.data[0];
          if (matchedCh?.id) {
            const atHomeRes = await fetchWithTimeout(
              `https://api.mangadex.org/at-home/server/${matchedCh.id}`,
              {},
              8000
            ).then((r) => r.json());
            if (atHomeRes.baseUrl && atHomeRes.chapter?.hash) {
              const baseUrl = atHomeRes.baseUrl;
              const hash = atHomeRes.chapter.hash;
              const files: string[] = atHomeRes.chapter.dataSaver?.length
                ? atHomeRes.chapter.dataSaver
                : atHomeRes.chapter.data || [];
              const subPath = atHomeRes.chapter.dataSaver?.length ? 'data-saver' : 'data';
              return {
                title: `${searchTitle} Chapter ${matchedCh.attributes?.chapter || chapterNumber}`,
                chapterSlug,
                images: files.map((f) => `${baseUrl}/${subPath}/${hash}/${f}`),
                navigation: {},
              };
            }
          }
        }
      }
    } catch (e) {
      safeLogError('Chapter Failover Step 6 (MangaDex Title Match) failed', e);
    }
  }

  // Return clean empty images without crashing or throwing
  return {
    title: `${searchTitle} Chapter ${chapterNumber}`,
    chapterSlug,
    images: [],
    navigation: {},
  };
}

export async function searchComic(query: string): Promise<ComicItem[]> {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  const [sankaSettled, komikuSettled, kuroSettled, mdSettled] = await Promise.allSettled([
    // Sanka Comic Search
    fetchJsonWithCache<any>(`/comic/search?q=${encodeURIComponent(q)}`, 180000).catch(() => ({ comics: [] })),
    // Komiku Search
    searchKomiku(q).catch(() => []),
    // Kurokami Search
    fetchKurokamiSearch(q).catch(() => []),
    // MangaDex Search
    fetchWithTimeout(`https://api.mangadex.org/manga?title=${encodeURIComponent(q)}&limit=10&includes[]=cover_art`, {}, 8000)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] })),
  ]);

  const sankaComics =
    sankaSettled.status === 'fulfilled'
      ? sankaSettled.value?.comics || sankaSettled.value?.results || []
      : [];
  const sankaItems: ComicItem[] = sankaComics.map((c: any) => ({
    title: c.title,
    slug: c.slug || c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: c.image || c.thumbnail,
    chapter: c.chapter || 'Chapter',
    type: 'Manga' as const,
    score: '9.0',
    description: c.description || 'Sanka Manga',
  }));

  const komikuItems: ComicItem[] = komikuSettled.status === 'fulfilled' ? komikuSettled.value || [] : [];

  const kuroData = kuroSettled.status === 'fulfilled' ? kuroSettled.value || [] : [];
  const kuroItems: ComicItem[] = kuroData.map((c: any) => ({
    title: c.title,
    slug: c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: c.imageSrc || c.image,
    chapter: c.chapter || 'Chapter',
    type: 'Manga' as const,
    score: '9.2',
    description: 'Kurokami Manga',
  }));

  const mdData = mdSettled.status === 'fulfilled' ? mdSettled.value?.data || [] : [];
  const mdItems: ComicItem[] = mdData.map((m: any) => {
    const title = m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Manga';
    const coverRel = m.relationships?.find((r: any) => r.type === 'cover_art');
    const coverFile = coverRel?.attributes?.fileName;
    const cover = coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.512.jpg` : '';
    return {
      title,
      slug: `md_${m.id}`,
      image: cover,
      chapter: 'MangaDex',
      type: 'Manga' as const,
      score: '9.3',
      description: m.attributes?.description?.en || '',
    };
  });

  const seen = new Set<string>();
  const results: ComicItem[] = [];

  for (const list of [komikuItems, sankaItems, kuroItems, mdItems]) {
    for (const item of list) {
      const key = normalizeTitle(item.title);
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push(item);
      }
    }
  }

  return results;
}

export async function searchManhwa(query: string): Promise<ComicItem[]> {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  // 1. Local curated
  const localMatches = CURATED_MANHWA_LIST.filter(
    (m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
  );

  // 2. Multi-source search with Promise.allSettled
  const [mdSettled, sankaSettled, kuroSettled, komikuSettled] = await Promise.allSettled([
    // MangaDex Korean Search
    fetchWithTimeout(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(query.trim())}&originalLanguage[]=ko&includes[]=cover_art&limit=20`,
      {},
      8000
    )
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] })),

    // Sanka Kiryuu Search
    fetchWithTimeout(
      `https://www.sankavollerei.web.id/comic/kiryuu/search/${encodeURIComponent(query.trim())}`,
      {},
      8000
    )
      .then((r) => (r.ok ? r.json() : { seriesList: [] }))
      .catch(() => ({ seriesList: [] })),

    // Kurokami Search
    fetchKurokamiSearch(query.trim()),

    // Komiku Search
    searchKomiku(query.trim()),
  ]);

  const mdData = mdSettled.status === 'fulfilled' ? mdSettled.value?.data || [] : [];
  const mdMatches: ComicItem[] = mdData.map((m: any) => {
    const title = m.attributes?.title?.en || Object.values(m.attributes?.title || {})[0] || 'Manhwa';
    const coverRel = m.relationships?.find((r: any) => r.type === 'cover_art');
    const coverFile = coverRel?.attributes?.fileName;
    const cover = coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.512.jpg` : '';
    const desc = m.attributes?.description?.en || Object.values(m.attributes?.description || {})[0] || '';

    return {
      title,
      slug: `md_${m.id}`,
      image: cover,
      chapter: 'Webtoon',
      type: 'Manhwa' as const,
      score: '9.6',
      description: desc,
    };
  });

  const sankaData = sankaSettled.status === 'fulfilled' ? sankaSettled.value?.seriesList || [] : [];
  const sankaMatches: ComicItem[] = sankaData.map((item: any) => ({
    title: item.title,
    slug: item.slug,
    image: item.image,
    chapter: item.latestChapter || 'Chapter',
    type: 'Manhwa' as const,
    score: item.rating || '9.0',
    description: 'Kiryuu Indo comic',
  }));

  const kuroData = kuroSettled.status === 'fulfilled' ? kuroSettled.value || [] : [];
  const kuroMatches: ComicItem[] = kuroData.map((item: any) => ({
    title: item.title,
    slug: item.link?.split('/manga/')[1]?.replace(/\/$/, '') || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: item.imageSrc || item.image,
    chapter: item.chapter || item.latestChapter || 'Chapter',
    type: 'Manhwa' as const,
    score: item.rating || '9.2',
    description: 'Kurokami Manhwa',
  }));

  const komikuMatches: ComicItem[] = komikuSettled.status === 'fulfilled' ? komikuSettled.value || [] : [];

  const seen = new Set<string>();
  const results: ComicItem[] = [];

  for (const item of [...localMatches, ...komikuMatches, ...mdMatches, ...kuroMatches, ...sankaMatches]) {
    const norm = normalizeTitle(item.title);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      results.push(item);
    }
  }

  return results;
}

/* =========================================================================
   7. LK21 FILM BIOSKOP GRATIS SUB INDO & MULTI-SERVER HD STREAMING
   ========================================================================= */

export const LK21_MOVIES: MovieItem[] = [
  {
    id: 'tt6263850',
    title: 'Deadpool & Wolverine',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BNzRiMjg0MzUtNTQ1Mi00Y2Q5LWEwM2MtMzUwZDU5NmVjN2NkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.2',
    genre: 'Action, Comedy, Marvel',
    duration: '128 min',
    quality: 'HD 1080p',
    category: 'Marvel',
    synopsis: 'Wade Wilson yang pensiun dipanggil oleh TVA untuk menyelamatkan multisemesta bersama Wolverine yang enggan.',
  },
  {
    id: 'tt15239678',
    title: 'Dune: Part Two',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtODhmNDI1NmY5YzAwXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.7',
    genre: 'Action, Adventure, Sci-Fi',
    duration: '166 min',
    quality: 'HD 1080p',
    category: 'Box Office',
    synopsis: 'Paul Atreides bersatu dengan Chani dan kaum Fremen untuk membalas dendam terhadap konspirator pembunuh keluarganya di planet Arrakis.',
  },
  {
    id: 'tt15398776',
    title: 'Oppenheimer',
    year: '2023',
    poster: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.9',
    genre: 'Biography, Drama, History',
    duration: '180 min',
    quality: 'HD 1080p',
    category: 'Box Office',
    synopsis: 'Kisah bapak bom atom J. Robert Oppenheimer memimpin Proyek Manhattan yang mengubah peradaban manusia selamanya.',
  },
  {
    id: 'tt9362722',
    title: 'Spider-Man: Across the Spider-Verse',
    year: '2023',
    poster: 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA3CGExOTU2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.8',
    genre: 'Animation, Action, Marvel',
    duration: '140 min',
    quality: 'HD 1080p',
    category: 'Marvel',
    synopsis: 'Miles Morales melintasi multisemesta Spider-Society bersama Gwen Stacy untuk mendefinisikan kembali takdir seorang pahlawan.',
  },
  {
    id: 'tt14539740',
    title: 'Godzilla x Kong: The New Empire',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BYWI2ODliOTctNjcxOC00NTBhLThkMGEtYjQ5NTU2M2RhNjBhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '7.8',
    genre: 'Action, Sci-Fi, Monster',
    duration: '115 min',
    quality: 'HD 1080p',
    category: 'Action',
    synopsis: 'Godzilla dan Kong terpaksa bersatu melawan ancaman raksasa Skar King yang bangkit dari kedalaman Hollow Earth.',
  },
  {
    id: 'tt10638522',
    title: 'Haikyu!! The Dumpster Battle',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BYjFmY2YxM2YtMThmNy00OGFlLTg5NjItNmUzNTRhNWFkOTI5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.5',
    genre: 'Animation, Sports, Anime Movie',
    duration: '85 min',
    quality: 'HD 1080p',
    category: 'Anime Movie',
    synopsis: 'Pertarungan takdir penentuan antara SMA Karasuno vs SMA Nekoma dalam turnamen nasional bola voli musim semi.',
  },
  {
    id: 'tt14331144',
    title: 'Jujutsu Kaisen 0',
    year: '2021',
    poster: 'https://m.media-amazon.com/images/M/MV5BODM3MmI1NmUtY2U3YS00OWJjLTg5OWMtYTRmMDFkZGI3YTE1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.6',
    genre: 'Animation, Action, Anime Movie',
    duration: '105 min',
    quality: 'HD 1080p',
    category: 'Anime Movie',
    synopsis: 'Yuta Okkotsu yang dihantui roh kutukan Rika Orimoto bergabung ke SMA Jujutsu di bawah bimbingan Satoru Gojo.',
  },
  {
    id: 'tt11032374',
    title: 'Demon Slayer: Kimetsu no Yaiba - Mugen Train',
    year: '2020',
    poster: 'https://m.media-amazon.com/images/M/MV5BODI2NjdlYWItMTE1ZC00YzI2LTlhZGQtNzE3NzA4MWM0ODYzXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.7',
    genre: 'Animation, Action, Anime Movie',
    duration: '117 min',
    quality: 'HD 1080p',
    category: 'Anime Movie',
    synopsis: 'Tanjiro dan Hashira Api Kyojuro Rengoku memburu iblis Enmu dan Akaza di atas kereta api Mugen.',
  },
  {
    id: 'tt16428256',
    title: 'Suzume (Suzume no Tojimari)',
    year: '2022',
    poster: 'https://m.media-amazon.com/images/M/MV5BNmNmNGExNDctM2Y3MS00YWFjLWE5OGQtNTBlOGY0MmRhYzg3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.4',
    genre: 'Animation, Fantasy, Anime Movie',
    duration: '122 min',
    quality: 'HD 1080p',
    category: 'Anime Movie',
    synopsis: 'Suzume berkeliling Jepang bersama pemuda penutup pintu bencana demi menghentikan gempa bumi malapetaka.',
  },
  {
    id: 'tt27819200',
    title: 'Exhuma (Pamyo)',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BMDFkOTc2YTYtOGFjOC00MWFlLWJlYjAtYWE4YTYzOWIxYjI5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.3',
    genre: 'Horror, Mystery, K-Drama',
    duration: '134 min',
    quality: 'HD 1080p',
    category: 'Horror',
    synopsis: 'Dua dukun muda, ahli geomansi, dan petugas pemakaman membongkar makam leluhur terkutuk yang memicu teror arwah mengerikan.',
  },
  {
    id: 'tt5700672',
    title: 'Train to Busan',
    year: '2016',
    poster: 'https://m.media-amazon.com/images/M/MV5BMTkwOTQ4OTg0OV5BMl5BanBnXkFtZTgwMzQyOTM0OTE@._V1_FMjpg_UX1000_.jpg',
    rating: '8.5',
    genre: 'Action, Horror, K-Drama',
    duration: '118 min',
    quality: 'HD 1080p',
    category: 'K-Drama',
    synopsis: 'Para penumpang kereta berkecepatan tinggi menuju Busan berjuang bertahan hidup dari wabah zombie brutal yang melanda Korea Selatan.',
  },
  {
    id: 'tt6751668',
    title: 'Parasite (Gisaengchung)',
    year: '2019',
    poster: 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.9',
    genre: 'Drama, Thriller, K-Drama',
    duration: '132 min',
    quality: 'HD 1080p',
    category: 'K-Drama',
    synopsis: 'Keluarga miskin Ki-taek menyusup satu per satu ke dalam rumah keluarga kaya raya hingga terjadi tragedi mengerikan.',
  },
  {
    id: 'tt10366206',
    title: 'John Wick: Chapter 4',
    year: '2023',
    poster: 'https://m.media-amazon.com/images/M/MV5BMDExZGMyOTMtMDgyYi00NGIwLWJhMTEtOTdkZGFjNmZiMTEwXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.4',
    genre: 'Action, Crime, Thriller',
    duration: '169 min',
    quality: 'HD 1080p',
    category: 'Action',
    synopsis: 'John Wick menantang High Table dalam duel maut dari Osaka, Berlin, hingga tangga Sacré-Cœur di Paris.',
  },
  {
    id: 'tt18412256',
    title: 'Alien: Romulus',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BMDU2ZmM2OTYtNzIxMS00YzM4LTg2NTMtMGI5MmE4ZmE0NjgwXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.1',
    genre: 'Horror, Sci-Fi',
    duration: '119 min',
    quality: 'HD 1080p',
    category: 'Horror',
    synopsis: 'Sekelompok kolonis muda menjelajahi stasiun luar angkasa terlantar dan berhadapan langsung dengan Xenomorph mematikan.',
  },
  {
    id: 'tt16366836',
    title: 'Venom: The Last Dance',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BNzg0YTkxODMtOTVjOS00MDkzLTljYjQtYjVlOTUzMzkwMzBlXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '7.9',
    genre: 'Action, Sci-Fi, Marvel',
    duration: '109 min',
    quality: 'HD 1080p',
    category: 'Marvel',
    synopsis: 'Eddie Brock dan Venom menjadi buronan dari dua dunia dan harus mengambil keputusan pamungkas yang menyayat hati.',
  },
  {
    id: 'tt13433802',
    title: 'A Quiet Place: Day One',
    year: '2024',
    poster: 'https://m.media-amazon.com/images/M/MV5BNWE3OGViNWUtMTM1MS00ODU5LWE5OTgtNDAyMzY1NmE5ZDUzXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '7.8',
    genre: 'Drama, Horror, Sci-Fi',
    duration: '99 min',
    quality: 'HD 1080p',
    category: 'Horror',
    synopsis: 'Hari pertama ketika monster berkebisingan peka suara menginvasi kota metropolitan New York.',
  },
  {
    id: 'tt1630029',
    title: 'Avatar: The Way of Water',
    year: '2022',
    poster: 'https://m.media-amazon.com/images/M/MV5BYjhiNjBlODctY2ZiOC00YjVlLWFlNzAtNTVhNzM1YjI1NzMxXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.3',
    genre: 'Action, Adventure, Fantasy',
    duration: '192 min',
    quality: 'HD 1080p',
    category: 'Box Office',
    synopsis: 'Jake Sully dan Neytiri melarikan diri ke suku laut Metkayina untuk melindungi anak-anak mereka dari ancaman bangsa langit.',
  },
  {
    id: 'tt4154796',
    title: 'Avengers: Endgame',
    year: '2019',
    poster: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_FMjpg_UX1000_.jpg',
    rating: '8.9',
    genre: 'Action, Adventure, Marvel',
    duration: '181 min',
    quality: 'HD 1080p',
    category: 'Marvel',
    synopsis: 'Setelah separuh alam semesta musnah oleh jentikan Thanos, para Avengers bersatu melakukan penjelajahan waktu pamungkas.',
  },
  {
    id: 'tt0816692',
    title: 'Interstellar',
    year: '2014',
    poster: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
    rating: '8.9',
    genre: 'Adventure, Drama, Sci-Fi',
    duration: '169 min',
    quality: 'HD 1080p',
    category: 'Box Office',
    synopsis: 'Perjalanan sekelompok astronot menembus lubang cacing di dekat Saturnus demi mencari rumah baru bagi umat manusia.',
  },
];

export function getLK21Movies(category?: string, query?: string): MovieItem[] {
  let list = LK21_MOVIES;
  if (category && category !== 'Semua') {
    list = list.filter((m) => m.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genre.toLowerCase().includes(q) ||
        m.synopsis.toLowerCase().includes(q) ||
        m.year.includes(q)
    );
  }
  return list;
}

export function getMovieServers(movieId: string): Array<{ name: string; url: string }> {
  const cleanId = movieId.trim();
  return [
    {
      name: 'Server 1 (VidSrc ICU HD)',
      url: `https://vidsrc.icu/embed/movie/${cleanId}`,
    },
    {
      name: 'Server 2 (VidSrc CC HD)',
      url: `https://vidsrc.cc/v2/embed/movie/${cleanId}`,
    },
    {
      name: 'Server 3 (AutoEmbed CC)',
      url: `https://autoembed.cc/embed/player.php?id=${cleanId}`,
    },
    {
      name: 'Server 4 (MultiEmbed MOV)',
      url: `https://multiembed.mov/?video_id=${cleanId}`,
    },
  ];
}
