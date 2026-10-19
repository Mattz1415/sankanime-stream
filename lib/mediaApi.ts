import {
  DonghuaItem,
  DonghuaDetail,
  DonghuaEpisodeStream,
  ComicItem,
  ComicDetail,
  ComicChapterData,
  MovieItem,
} from './types';

const API_BASE_URLS = [
  'https://www.sankavollerei.web.id',
  'https://sankavollerei.web.id',
  'https://www.sankavollerei.com',
];

const cacheMap = new Map<string, { data: any; expiry: number }>();

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
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(fullUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (NexusAnime Stream Engine)',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

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
    rating: '8.6',
  },
  {
    title: 'Battle Through the Heavens Season 5 (Fights Break Sphere)',
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
    currentEpisode: 'Ep 112',
    rating: '9.0',
  },
  {
    title: 'Martial Universe Season 4',
    slug: 'martial-universe-season-4',
    poster: 'https://anichin.moe/wp-content/uploads/2023/11/Martial-Universe-Season-4.jpg',
    status: 'Completed',
    type: 'Donghua',
    currentEpisode: 'Ep 12 (Tamat)',
    rating: '8.7',
  },
];

export async function fetchDonghuaHome(): Promise<{
  latest: DonghuaItem[];
  completed: DonghuaItem[];
}> {
  try {
    const raw = await fetchJsonWithCache<any>('/anime/donghua/home', 300000);
    const latestRaw = raw.latest_release || [];
    const completedRaw = raw.completed_donghua || [];

    const latest: DonghuaItem[] = latestRaw.map((item: any) => ({
      title: item.title,
      slug: item.slug || item.href?.split('/').filter(Boolean).pop() || '',
      poster: item.poster,
      status: item.status || 'Ongoing',
      type: 'Donghua',
      currentEpisode: item.current_episode || 'Ongoing',
      href: item.href,
      rating: '8.8',
    }));

    const completed: DonghuaItem[] = completedRaw.map((item: any) => ({
      title: item.title,
      slug: item.slug || item.href?.split('/').filter(Boolean).pop() || '',
      poster: item.poster,
      status: 'Completed',
      type: 'Donghua',
      currentEpisode: 'Tamat',
      href: item.href,
      rating: '8.6',
    }));

    return {
      latest: latest.length > 0 ? latest : CURATED_DONGHUA_FALLBACK,
      completed: completed.length > 0 ? completed : CURATED_DONGHUA_FALLBACK.slice(5),
    };
  } catch (err) {
    console.warn('[Donghua] fetchDonghuaHome fallback', err);
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
    console.warn('[Donghua] fetchDonghuaDetail fallback', err);
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

    const servers = rawServers.map((s: any) => ({
      name: s.name || 'Server HD',
      url: s.url || '',
    })).filter((s: any) => Boolean(s.url));

    if (mainUrl && !servers.some((s: any) => s.url === mainUrl)) {
      servers.unshift({ name: streaming.main_url?.name || 'Utama (Okru)', url: mainUrl });
    }

    return {
      episodeTitle: raw.episode || slug.replace(/-/g, ' '),
      mainUrl: mainUrl || (servers[0]?.url ?? ''),
      servers,
    };
  } catch (err) {
    console.warn('[Donghua] fetchDonghuaEpisode error, trying fallback embed', err);
    return {
      episodeTitle: slug.replace(/-/g, ' '),
      mainUrl: 'https://ok.ru/videoembed/16206205946546',
      servers: [
        { name: 'Okru Player', url: 'https://ok.ru/videoembed/16206205946546' },
        { name: 'D-Tube Stream', url: 'https://play.d.tube/?v=e57a15af-a7b7-4b63-97f3-ffa413d8aac4' },
      ],
    };
  }
}

/* =========================================================================
   2. KOMIK (MANGA JEPANG & KOMIK INDONESIA) API
   ========================================================================= */

const CURATED_COMIC_FALLBACK: ComicItem[] = [
  {
    title: 'One Piece',
    slug: 'one-piece',
    image: 'https://thumbnail.komiku.to/img/upload/one_piece/img_649f87c9da5d4.jpg?w=500',
    chapter: 'Chapter 1135',
    type: 'Manga',
    score: '9.8',
    description: 'Petualangan Monkey D. Luffy mengarungi Grand Line mencari harta karun One Piece.',
  },
  {
    title: 'Jujutsu Kaisen',
    slug: 'jujutsu-kaisen',
    image: 'https://thumbnail.komiku.to/img/upload/jujutsu_kaisen/img_649f87cbda5d4.jpg?w=500',
    chapter: 'Chapter 271 (Tamat)',
    type: 'Manga',
    score: '9.2',
    description: 'Pertarungan para penyihir jujutsu melawan roh kutukan demi menyelamatkan dunia.',
  },
  {
    title: 'Chainsaw Man',
    slug: 'chainsaw-man',
    image: 'https://thumbnail.komiku.to/img/upload/chainsaw_man/img_649f87ccda5d4.jpg?w=500',
    chapter: 'Chapter 188',
    type: 'Manga',
    score: '9.1',
    description: 'Denji sang manusia gergaji mesin bertarung melawan iblis pemusnah.',
  },
  {
    title: 'Sousou no Frieren (Frieren: Beyond Journey\'s End)',
    slug: 'sousou-no-frieren',
    image: 'https://thumbnail.komiku.to/img/upload/frieren/img_649f87ceda5d4.jpg?w=500',
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

export async function fetchComicPopular(): Promise<ComicItem[]> {
  try {
    const raw = await fetchJsonWithCache<any>('/comic/populer', 300000);
    const comics = raw.comics || raw.results || [];
    if (Array.isArray(comics) && comics.length > 0) {
      return comics.map((c: any) => ({
        title: c.title,
        slug: c.slug || c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: c.image || c.thumbnail,
        chapter: c.chapter || 'Chapter Terbaru',
        type: 'Manga',
        score: '9.0',
        description: c.description || '',
      }));
    }
    return CURATED_COMIC_FALLBACK;
  } catch (err) {
    console.warn('[Comic] fetchComicPopular fallback', err);
    return CURATED_COMIC_FALLBACK;
  }
}

export async function fetchComicLatest(): Promise<ComicItem[]> {
  try {
    const raw = await fetchJsonWithCache<any>('/comic/terbaru', 300000);
    const comics = raw.comics || raw.results || [];
    if (Array.isArray(comics) && comics.length > 0) {
      return comics.map((c: any) => ({
        title: c.title,
        slug: c.slug || c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: c.image || c.thumbnail,
        chapter: c.chapter || 'Update Baru',
        type: 'Manga',
        score: '8.8',
        description: c.description || '',
      }));
    }
    return CURATED_COMIC_FALLBACK;
  } catch (err) {
    console.warn('[Comic] fetchComicLatest fallback', err);
    return CURATED_COMIC_FALLBACK;
  }
}

// Kurokami Manhwa API Endpoints Integration (Gungcakra/kurokami-manhwa-api)
export const KUROKAMI_API_BASE = 'https://kurokami.vercel.app/api';

export async function fetchKurokamiPopular(): Promise<any[]> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/manhwa-popular`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiNew(): Promise<any[]> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/manhwa-new`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiOngoing(): Promise<any[]> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/manhwa-ongoing`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiTop(): Promise<any[]> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/manhwa-top`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiRecommendation(): Promise<any[]> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/manhwa-recommendation`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiDetail(manhwaId: string): Promise<any | null> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/manhwa-detail/${encodeURIComponent(manhwaId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchKurokamiChapter(chapterId: string): Promise<any | null> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/chapter/${encodeURIComponent(chapterId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchKurokamiSearch(query: string, page: number = 1): Promise<any[]> {
  try {
    const endpoint = page > 1 ? `${KUROKAMI_API_BASE}/search/${encodeURIComponent(query)}/page/${page}` : `${KUROKAMI_API_BASE}/search/${encodeURIComponent(query)}`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.seriesList || []);
    }
  } catch {}
  return [];
}

export async function fetchKurokamiGenres(): Promise<any[]> {
  try {
    const res = await fetch(`${KUROKAMI_API_BASE}/genres`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch {}
  return [];
}

export async function fetchKurokamiByGenre(genreId: string, page: number = 1): Promise<any[]> {
  try {
    const endpoint = page > 1 ? `${KUROKAMI_API_BASE}/genre/${encodeURIComponent(genreId)}/page/${page}` : `${KUROKAMI_API_BASE}/genre/${encodeURIComponent(genreId)}`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.seriesList || []);
    }
  } catch {}
  return [];
}

export const MANHWA_MANGADEX_ID_MAP: Record<string, string> = {
  'serena': 'f239fcd4-9f7f-4296-9e52-ee5a66a7e938',
  'cry-or-better-yet-beg': 'd6bc762b-1159-47f0-a625-feb9f81e4ddd',
  'ulgehasoseo': 'd6bc762b-1159-47f0-a625-feb9f81e4ddd',
  'the-remarried-empress': 'ac6819d8-de35-442c-82dd-3444983d4f26',
  'who-made-me-a-princess': '722a45c0-5e55-40f2-929b-ff69b0989edb',
  'operation-true-love': 'f8dbced3-1eea-4547-b657-ce568fbdda0f',
  'true-beauty': '51a0cd0c-3254-47f0-a7fd-4b9bb178f813',
  'under-the-oak-tree': 'c9a891f6-9f4b-487d-8b62-7abb0e3f59c8',
  'solo-leveling': 'ade0306c-f4b6-4890-9edb-1ddf04df2039',
  'lookism': '596191eb-69ee-4401-983e-cc07e277fa17',
  'omniscient-reader': '9a414441-bbad-43f1-a3a7-dc262ca790a3',
  'omniscient-readers-viewpoint': '9a414441-bbad-43f1-a3a7-dc262ca790a3',
  'nano-machine': '6e4805a6-75ab-462d-883c-4ddedb8e4df6',
  'killer-peter': 'a3db9212-7e87-44ea-8264-23f914671444',
  'eleceed': '7e544761-7d3d-4fce-8137-719814d7d138',
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

export async function fetchComicDetail(slug: string): Promise<ComicDetail> {
  let mangaDexId = slug.startsWith('md_') ? slug.replace(/^md_/, '') : MANHWA_MANGADEX_ID_MAP[slug];

  // If not mapped, dynamic search MangaDex by title to find active entry with chapters
  if (!mangaDexId) {
    const clean = slug.replace(/-(chapter|ch)-.*$/i, '').replace(/-/g, ' ');
    try {
      const sRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(clean)}&limit=5&includes[]=cover_art`).then(r => r.json());
      for (const m of (sRes.data || [])) {
        const feedCheck = await fetch(`https://api.mangadex.org/manga/${m.id}/feed?limit=5`).then(r => r.json());
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
        fetch(`https://api.mangadex.org/manga/${mangaDexId}?includes[]=cover_art`).then((r) => r.json()).catch(() => ({})),
        fetch(`https://api.mangadex.org/manga/${mangaDexId}/feed?order[chapter]=desc&limit=100`).then((r) => r.json()).catch(() => ({})),
      ]);

      const m = mangaRes.data;
      const title = m?.attributes?.title?.en || Object.values(m?.attributes?.title || {})[0] || slug.replace(/-/g, ' ');
      const desc = m?.attributes?.description?.en || Object.values(m?.attributes?.description || {})[0] || 'Webtoon Korea berwarna resolusi tinggi.';
      const coverRel = m?.relationships?.find((r: any) => r.type === 'cover_art');
      const coverFile = coverRel?.attributes?.fileName;
      const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${mangaDexId}/${coverFile}.512.jpg` : '';

      const chaptersRaw = feedRes?.data || [];
      const chapters = chaptersRaw.map((ch: any) => ({
        chapter: ch.attributes?.chapter ? `Chapter ${ch.attributes.chapter}` : (ch.attributes?.title || 'Chapter'),
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
      console.warn('[MangaDex] fetchComicDetail fallback for', slug, e);
    }
  }

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
    console.warn('[Comic] fetchComicDetail fallback to Kiryuu/Local for', slug, err);
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

export async function fetchComicChapter(chapterSlug: string): Promise<ComicChapterData> {
  // 1. If it is a MangaDex Chapter UUID
  if (chapterSlug.startsWith('md_') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterSlug)) {
    const chapterId = chapterSlug.replace(/^md_/, '');
    try {
      const res = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
      if (res.ok) {
        const d = await res.json();
        const baseUrl = d.baseUrl;
        const hash = d.chapter?.hash;
        const files: string[] = d.chapter?.dataSaver?.length ? d.chapter.dataSaver : (d.chapter?.data || []);
        if (baseUrl && hash && files.length > 0) {
          const subPath = d.chapter?.dataSaver?.length ? 'data-saver' : 'data';
          const images = files.map((f) => `${baseUrl}/${subPath}/${hash}/${f}`);
          return {
            title: `Chapter ${chapterId.slice(0, 8)}`,
            chapterSlug,
            images,
            navigation: {},
          };
        }
      }
    } catch (e) {
      console.warn('[MangaDex] fetchComicChapter error', e);
    }
  }

  // 2. Try Kurokami API chapter endpoint
  try {
    const kuroRes = await fetch(`https://kurokami.vercel.app/api/chapter/${encodeURIComponent(chapterSlug)}`);
    if (kuroRes.ok) {
      const kuroData = await kuroRes.json();
      const imgs = kuroData.images || kuroData.sources?.[0]?.images || [];
      if (Array.isArray(imgs) && imgs.length > 0) {
        return {
          title: kuroData.title || chapterSlug.replace(/-/g, ' '),
          chapterSlug,
          images: imgs,
          navigation: {
            previousChapter: kuroData.prevChapter,
            nextChapter: kuroData.nextChapter,
          },
        };
      }
    }
  } catch {}

  // 3. Try Sanka Kiryuu API
  try {
    const sankaRes = await fetch(`https://www.sankavollerei.web.id/comic/kiryuu/chapter/${encodeURIComponent(chapterSlug)}`);
    if (sankaRes.ok) {
      const sankaData = await sankaRes.json();
      const imgs = sankaData.images || sankaData.chapterImages || [];
      if (Array.isArray(imgs) && imgs.length > 0) {
        return {
          title: sankaData.title || chapterSlug.replace(/-/g, ' '),
          chapterSlug,
          images: imgs,
          navigation: {},
        };
      }
    }
  } catch {}

  // 4. Try Sanka Default Comic API
  try {
    const raw = await fetchJsonWithCache<any>(`/comic/chapter/${chapterSlug}`, 600000);
    if (Array.isArray(raw?.images) && raw.images.length > 0) {
      return {
        title: raw.title || chapterSlug.replace(/-/g, ' '),
        chapterSlug,
        images: raw.images,
        navigation: raw.navigation || {
          previousChapter: raw.previousChapter,
          nextChapter: raw.nextChapter,
          chapterList: raw.chapterList,
        },
      };
    }
  } catch {}

  // 5. Dynamic fallback for catalog / search titles: match title to MangaDex and extract chapter images
  const cleanTitle = chapterSlug.replace(/-(chapter|ch)-.*$/i, '').replace(/-/g, ' ');
  try {
    const sRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(cleanTitle)}&limit=5`).then((r) => r.json());
    for (const m of sRes.data || []) {
      const feedRes = await fetch(`https://api.mangadex.org/manga/${m.id}/feed?limit=20&order[chapter]=desc`).then((r) => r.json());
      if (feedRes.data && feedRes.data.length > 0) {
        const ch = feedRes.data[0];
        const atHomeRes = await fetch(`https://api.mangadex.org/at-home/server/${ch.id}`).then((r) => r.json());
        if (atHomeRes.baseUrl && atHomeRes.chapter?.hash) {
          const baseUrl = atHomeRes.baseUrl;
          const hash = atHomeRes.chapter.hash;
          const files: string[] = atHomeRes.chapter.dataSaver?.length ? atHomeRes.chapter.dataSaver : atHomeRes.chapter.data || [];
          const subPath = atHomeRes.chapter.dataSaver?.length ? 'data-saver' : 'data';
          return {
            title: `Chapter ${ch.attributes?.chapter || '1'}`,
            chapterSlug,
            images: files.map((f) => `${baseUrl}/${subPath}/${hash}/${f}`),
            navigation: {},
          };
        }
      }
    }
  } catch {}

  // Return clean empty images without dummy fake covers so error UI shows properly rather than broken page images
  return {
    title: chapterSlug.replace(/-/g, ' ').toUpperCase(),
    chapterSlug,
    images: [],
    navigation: {},
  };
}

export async function searchComic(query: string): Promise<ComicItem[]> {
  if (!query || !query.trim()) return [];
  try {
    const raw = await fetchJsonWithCache<any>(`/comic/search?q=${encodeURIComponent(query.trim())}`, 180000);
    const comics = raw.comics || raw.results || [];
    return (Array.isArray(comics) ? comics : []).map((c: any) => ({
      title: c.title,
      slug: c.slug || c.link?.split('/manga/')[1]?.replace(/\/$/, '') || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image: c.image || c.thumbnail,
      chapter: c.chapter || 'Chapter',
      type: 'Manga',
      score: '9.0',
      description: c.description || '',
    }));
  } catch (err) {
    console.warn('[Comic] searchComic error', err);
    return [];
  }
}

/* =========================================================================
   3. MANHWA (KOREAN WEBTOONS COLOR) API & COMPREHENSIVE HITS CATALOG
   ========================================================================= */

export const CURATED_MANHWA_LIST: ComicItem[] = [
  // --- ROMANCE & DRAMA HITS ---
  {
    title: 'Serena',
    slug: 'serena',
    image: 'https://uploads.mangadex.org/covers/34d8a0e8-6811-459d-87a1-2d3e81ad18fb/67177930-a1b4-4092-b9e8-b3b47322b21c.jpg.512.jpg',
    chapter: 'Chapter 95',
    type: 'Manhwa',
    score: '9.9',
    description: 'Serena, satu-satunya pewaris Hotel Serenity yang terancam bangkrut, terjebak dalam pernikahan bisnis dingin dengan Eiser sambil menyembunyikan kekasih rahasia Frederick.',
  },
  {
    title: 'Cry, or Better Yet, Beg',
    slug: 'cry-or-better-yet-beg',
    image: 'https://uploads.mangadex.org/covers/b6b4d89e-f97b-42f2-badd-2a7ce28d9cef/b4317e18-e8c6-46bf-aef8-9d2008fc3204.jpg.512.jpg',
    chapter: 'Chapter 48',
    type: 'Manhwa',
    score: '9.7',
    description: 'Layla Llewellyn sang anak yatim piatu di perkebunan Arvis terjerat dalam obsesi membakar Duke Matthias von Herhardt yang kejam dan tak berperasaan.',
  },
  {
    title: 'The Remarried Empress',
    slug: 'the-remarried-empress',
    image: 'https://uploads.mangadex.org/covers/ac6819d8-de35-442c-82dd-3444983d4f26/6fadbf8b-1be6-4c37-9a57-4e03721674f3.png.512.jpg',
    chapter: 'Chapter 180',
    type: 'Manhwa',
    score: '9.8',
    description: 'Navier Ellie Trovi menerima perceraian dari Kaisar Sovieshu yang selingkuh, namun seketika mengumumkan pernikahan kembali dengan Raja Heinrey dari Kerajaan Barat.',
  },
  {
    title: 'Who Made Me a Princess',
    slug: 'who-made-me-a-princess',
    image: 'https://uploads.mangadex.org/covers/722a45c0-5e55-40f2-929b-ff69b0989edb/1b24d6dc-04a2-466b-a5d7-b86dde5087d3.jpg.512.jpg',
    chapter: 'Chapter 125 (Tamat)',
    type: 'Manhwa',
    score: '9.9',
    description: 'Athanasia terlahir kembali sebagai putri malang yang ditakdirkan dibunuh oleh ayah kandungnya sendiri, Kaisar Claude yang berdarah dingin.',
  },
  {
    title: 'Operation: True Love',
    slug: 'operation-true-love',
    image: 'https://uploads.mangadex.org/covers/f8dbced3-1eea-4547-b657-ce568fbdda0f/9135af67-a75e-4045-a91f-7a7a87080b2d.jpg.512.jpg',
    chapter: 'Chapter 108',
    type: 'Manhwa',
    score: '9.6',
    description: 'Shim Soo-ae menemukan ponsel lipat misterius Jellypop yang menunjukkan poin cinta seseorang, dan ia harus mendapatkan cinta sejati agar tidak dilenyapkan.',
  },
  {
    title: 'True Beauty (The Secret of Angel)',
    slug: 'true-beauty',
    image: 'https://uploads.mangadex.org/covers/51a0cd0c-3254-47f0-a7fd-4b9bb178f813/22679123-1072-4cc2-baf0-95603e0e2a1a.jpg.512.jpg',
    chapter: 'Chapter 260 (Tamat)',
    type: 'Manhwa',
    score: '9.5',
    description: 'Jugyeong mengubah hidupnya 180 derajat setelah menguasai riasan wajah, terjebak cinta segitiga antara Suho yang dingin dan Seojun yang karismatik.',
  },
  {
    title: 'Under the Oak Tree',
    slug: 'under-the-oak-tree',
    image: 'https://uploads.mangadex.org/covers/c9a891f6-9f4b-487d-8b62-7abb0e3f59c8/9ea1571b-f680-494b-9a3c-04c1949bac27.jpg.512.jpg',
    chapter: 'Chapter 92',
    type: 'Manhwa',
    score: '9.7',
    description: 'Maximilien yang gagap dan disiksa keluarganya dinikahkan paksa dengan Riftan Calypso, ksatria miskin yang kembali sebagai pahlawan perang paling dihormati.',
  },

  // --- ACTION & FANTASY HITS ---
  {
    title: 'Solo Leveling (Na Honjaman Level-Up)',
    slug: 'solo-leveling',
    image: 'https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/e90bdc47-c8b9-4df7-b2c0-17641b645ee1.jpg.512.jpg',
    chapter: 'Chapter 200 (Tamat)',
    type: 'Manhwa',
    score: '9.9',
    description: 'Sung Jin-woo, hunter terlemah berperingkat E, bangkit menjadi Shadow Monarch terkuat di dunia setelah selamat dari Double Dungeon maut.',
  },
  {
    title: 'Lookism',
    slug: 'lookism',
    image: 'https://uploads.mangadex.org/covers/596191eb-69ee-4401-983e-cc07e277fa17/6df15145-f15b-43f0-b87b-22fd3694eaca.jpg.512.jpg',
    chapter: 'Chapter 525',
    type: 'Manhwa',
    score: '9.8',
    description: 'Park Hyung-suk yang diintimidasi secara brutal tiba-tiba memiliki dua tubuh: satu tubuh lamanya yang lemah, dan satu tubuh baru yang tampan dan atletis sempurna.',
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

export async function fetchManhwaList(page: number = 1): Promise<ComicItem[]> {
  const limit = 24;
  const offset = (page - 1) * limit;

  // 1. Fetch dynamic page from MangaDex (Korean Webtoons)
  let mdItems: ComicItem[] = [];
  try {
    const res = await fetch(
      `https://api.mangadex.org/manga?originalLanguage[]=ko&order[followedCount]=desc&limit=${limit}&offset=${offset}&includes[]=cover_art`
    );
    if (res.ok) {
      const data = await res.json();
      mdItems = (data.data || []).map((m: any) => {
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
          score: '9.5',
          description: desc,
        };
      });
    }
  } catch (e) {
    console.warn('[MangaDex] fetchManhwaList page error', e);
  }

  // 2. Try Sanka /comic/berwarna on page 1
  let sankaItems: ComicItem[] = [];
  if (page === 1) {
    try {
      const raw = await fetchJsonWithCache<any>('/comic/berwarna', 300000);
      const results = raw.results || raw.comics || raw.data?.results || [];
      if (Array.isArray(results) && results.length > 0) {
        sankaItems = results.map((item: any) => ({
          title: item.title,
          slug: item.slug || item.detailUrl?.split('/').filter(Boolean).pop() || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          image: item.thumbnail || item.image || item.cover,
          chapter: item.chapter || 'Full Color',
          type: 'Manhwa' as const,
          score: '9.4',
          description: item.description || '',
        }));
      }
    } catch {}
  }

  // 3. Try Kurokami API
  let kurokamiItems: ComicItem[] = [];
  if (page === 1) {
    try {
      const kuroPopular = await fetchKurokamiPopular();
      if (Array.isArray(kuroPopular) && kuroPopular.length > 0) {
        kurokamiItems = kuroPopular.map((item: any) => ({
          title: item.title,
          slug: item.link?.split('/manga/')[1]?.replace(/\/$/, '') || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          image: item.imageSrc,
          chapter: item.chapter || item.chapters?.[0]?.chapterTitle || 'Terbaru',
          type: 'Manhwa' as const,
          score: item.rating || '9.5',
          description: 'Kurokami Manhwa Indo',
        }));
      }
    } catch {}
  }

  // Combine and deduplicate
  if (page === 1) {
    const seenTitles = new Set<string>();
    const combined: ComicItem[] = [];

    // Prioritize curated hits (Serena, Solo Leveling, etc.)
    for (const item of CURATED_MANHWA_LIST) {
      seenTitles.add(item.title.toLowerCase());
      combined.push(item);
    }
    for (const item of mdItems) {
      const norm = item.title.toLowerCase();
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        combined.push(item);
      }
    }
    for (const item of sankaItems) {
      const norm = item.title.toLowerCase();
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        combined.push(item);
      }
    }
    for (const item of kurokamiItems) {
      const norm = item.title.toLowerCase();
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        combined.push(item);
      }
    }
    return combined;
  }

  return mdItems.length > 0 ? mdItems : [];
}

export async function searchManhwa(query: string): Promise<ComicItem[]> {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  // 1. Search in curated list
  const localMatches = CURATED_MANHWA_LIST.filter(
    (m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
  );

  // 2. Search in MangaDex
  let mdMatches: ComicItem[] = [];
  try {
    const res = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(query.trim())}&originalLanguage[]=ko&includes[]=cover_art&limit=20`
    );
    if (res.ok) {
      const data = await res.json();
      mdMatches = (data.data || []).map((m: any) => {
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
    }
  } catch (e) {
    console.warn('[MangaDex] searchManhwa error', e);
  }

  // 3. Search Sanka Kiryuu
  let sankaMatches: ComicItem[] = [];
  try {
    const res = await fetch(`https://www.sankavollerei.web.id/comic/kiryuu/search/${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      const list = data.seriesList || [];
      sankaMatches = list.map((item: any) => ({
        title: item.title,
        slug: item.slug,
        image: item.image,
        chapter: item.latestChapter || 'Chapter',
        type: 'Manhwa' as const,
        score: item.rating || '9.0',
        description: 'Kiryuu Indo comic',
      }));
    }
  } catch {}

  // 4. Search Kurokami API
  let kuroMatches: ComicItem[] = [];
  try {
    const kuroData = await fetchKurokamiSearch(query.trim());
    if (Array.isArray(kuroData) && kuroData.length > 0) {
      kuroMatches = kuroData.map((item: any) => ({
        title: item.title,
        slug: item.link?.split('/manga/')[1]?.replace(/\/$/, '') || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: item.imageSrc || item.image,
        chapter: item.chapter || item.latestChapter || 'Chapter',
        type: 'Manhwa' as const,
        score: item.rating || '9.2',
        description: 'Kurokami Manhwa',
      }));
    }
  } catch {}

  const seen = new Set<string>();
  const results: ComicItem[] = [];

  for (const item of [...localMatches, ...mdMatches, ...sankaMatches, ...kuroMatches]) {
    const norm = item.title.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      results.push(item);
    }
  }

  return results;
}

/* =========================================================================
   4. LK21 FILM BIOSKOP GRATIS SUB INDO & MULTI-SERVER HD STREAMING
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
