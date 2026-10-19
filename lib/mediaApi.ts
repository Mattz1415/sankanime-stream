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

export async function fetchComicDetail(slug: string): Promise<ComicDetail> {
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
    console.warn('[Comic] fetchComicDetail error, creating fallback detail', err);
    return {
      title: slug.replace(/-/g, ' ').toUpperCase(),
      slug,
      image: 'https://thumbnail.komiku.to/img/upload/one_piece/img_649f87c9da5d4.jpg?w=500',
      synopsis: 'Manga petualangan legendaris dengan jalan cerita seru dan pertarungan epik.',
      metadata: { type: 'Manga', status: 'Ongoing', ageRating: '13+' },
      genres: [{ name: 'Action', slug: 'action' }, { name: 'Adventure', slug: 'adventure' }],
      chapters: Array.from({ length: 15 }, (_, i) => ({
        chapter: `Chapter ${100 - i}`,
        slug: `${slug}-chapter-${100 - i}`,
        date: 'Terbaru',
      })),
    };
  }
}

export async function fetchComicChapter(chapterSlug: string): Promise<ComicChapterData> {
  try {
    const raw = await fetchJsonWithCache<any>(`/comic/chapter/${chapterSlug}`, 600000);
    return {
      title: raw.title || chapterSlug.replace(/-/g, ' '),
      chapterSlug,
      images: Array.isArray(raw.images) ? raw.images : [],
      navigation: raw.navigation || {
        previousChapter: raw.previousChapter,
        nextChapter: raw.nextChapter,
        chapterList: raw.chapterList,
      },
    };
  } catch (err) {
    console.error('[Comic] fetchComicChapter error', err);
    throw new Error('Gagal memuat gambar halaman chapter.');
  }
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
   3. MANHWA (KOREAN WEBTOONS COLOR) API
   ========================================================================= */

const CURATED_MANHWA_LIST: ComicItem[] = [
  {
    title: 'Solo Leveling (Na Honjaman Level-Up)',
    slug: 'solo-leveling',
    image: 'https://thumbnail.komiku.org/uploads/manga/solo-leveling/manga_img_horizontal-Solo-Leveling.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 200 (Tamat)',
    type: 'Manhwa',
    score: '9.9',
    description: 'Sung Jin-woo, hunter terlemah berperingkat E, bangkit menjadi Shadow Monarch terkuat di dunia.',
  },
  {
    title: 'Lookism',
    slug: 'lookism',
    image: 'https://thumbnail.komiku.org/uploads/manga/lookism/manga_img_horizontal-Lookism.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 525',
    type: 'Manhwa',
    score: '9.6',
    description: 'Park Hyung-suk yang diintimidasi tiba-tiba bangun dengan tubuh baru yang sempurna dan tampan.',
  },
  {
    title: 'Omniscient Reader\'s Viewpoint',
    slug: 'omniscient-readers-viewpoint',
    image: 'https://thumbnail.komiku.org/uploads/manga/omniscient-readers-viewpoint/manga_img_horizontal-Omniscient-Reader.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 235',
    type: 'Manhwa',
    score: '9.8',
    description: 'Kim Dokja menjadi satu-satunya orang yang tahu akhir cerita dunia saat novel web menjadi kenyataan.',
  },
  {
    title: 'Nano Machine',
    slug: 'nano-machine',
    image: 'https://thumbnail.komiku.to/img/upload/nano_machine/img_693126dac89353.00003505.jpg?w=500',
    chapter: 'Chapter 332',
    type: 'Manhwa',
    score: '9.7',
    description: 'Pewaris sekte iblis yang disuntik mesin nano cerdas dari masa depan untuk mendominasi dunia persilatan.',
  },
  {
    title: 'Tower of God',
    slug: 'tower-of-god',
    image: 'https://thumbnail.komiku.org/uploads/manga/tower-of-god/manga_img_horizontal-Tower-of-God.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 640',
    type: 'Manhwa',
    score: '9.4',
    description: 'Bam memanjat menara legendaris untuk mencari Rachel, menghadapi ujian maut di setiap lantai.',
  },
  {
    title: 'Return of the Mount Hua Sect',
    slug: 'return-of-the-mount-hua-sect',
    image: 'https://thumbnail.komiku.org/uploads/manga/return-of-the-mount-hua-sect/manga_img_horizontal-Mount-Hua.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 142',
    type: 'Manhwa',
    score: '9.7',
    description: 'Chung Myung sang Pedang Suci Gunung Hua bereinkarnasi 100 tahun kemudian untuk membangkitkan sektenya.',
  },
  {
    title: 'The World After the Fall',
    slug: 'the-world-after-the-fall',
    image: 'https://thumbnail.komiku.org/uploads/manga/the-world-after-the-fall/manga_img_horizontal-Komik-The-World-After-the-Fall.png?resize=450,235&quality=60',
    chapter: 'Chapter 155',
    type: 'Manhwa',
    score: '9.3',
    description: 'Jaehwan menolak batu regresi dan memilih terus bertarung hingga menembus batas mimpi dunia.',
  },
  {
    title: 'Pick Me Up, Infinite Gacha',
    slug: 'pick-me-up',
    image: 'https://thumbnail.komiku.org/uploads/manga/pick-me-up/manga_img_horizontal-Pick-Me-Up-2.png?resize=450,235&quality=60',
    chapter: 'Chapter 122',
    type: 'Manhwa',
    score: '9.5',
    description: 'Master game mobile gacha brutal terjebak ke dalam tubuh karakter bintang 1 yang harus bertahan hidup.',
  },
  {
    title: 'Eleceed',
    slug: 'eleceed',
    image: 'https://thumbnail.komiku.org/uploads/manga/eleceed/manga_img_horizontal-Eleceed.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 320',
    type: 'Manhwa',
    score: '9.6',
    description: 'Seo Jiwoo yang berhati lembut berteman dengan Kayden, awaken terkuat di dunia yang menyamar sebagai kucing gemuk.',
  },
  {
    title: 'The Beginning After the End',
    slug: 'the-beginning-after-the-end',
    image: 'https://thumbnail.komiku.org/uploads/manga/the-beginning-after-the-end/manga_img_horizontal-TBATE.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 185',
    type: 'Manhwa',
    score: '9.5',
    description: 'Raja Grey terlahir kembali sebagai Arthur Leywin di dunia penuh sihir dan monster buas.',
  },
  {
    title: 'SSS-Class Suicide Hunter',
    slug: 'sss-class-suicide-hunter',
    image: 'https://thumbnail.komiku.org/uploads/manga/sss-class-suicide-hunter/manga_img_horizontal-SSS-Hunter.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 115',
    type: 'Manhwa',
    score: '9.4',
    description: 'Gong-ja memperoleh skill meniru skill orang lain setiap kali ia mati terbunuh.',
  },
  {
    title: 'Doom Breaker (Reincarnation of the Suicidal Battle God)',
    slug: 'reincarnation-of-the-suicidal-battle-god',
    image: 'https://thumbnail.komiku.org/uploads/manga/reincarnation-of-the-suicidal-battle-god/manga_img_horizontal-Doom-Breaker.jpg?resize=450,235&quality=60',
    chapter: 'Chapter 105',
    type: 'Manhwa',
    score: '9.3',
    description: 'Manusia terakhir yang melawan dewa kehancuran diberi kesempatan kedua oleh para dewa untuk balas dendam.',
  },
];

export async function fetchManhwaList(): Promise<ComicItem[]> {
  try {
    const raw = await fetchJsonWithCache<any>('/comic/berwarna', 300000);
    const results = raw.results || raw.comics || raw.data?.results || [];

    if (Array.isArray(results) && results.length > 0) {
      const fetched: ComicItem[] = results.map((item: any) => ({
        title: item.title,
        slug: item.slug || item.detailUrl?.split('/').filter(Boolean).pop() || item.url?.split('/manga/')[1]?.replace(/\/$/, '') || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image: item.thumbnail || item.image || item.cover,
        chapter: item.chapter || 'Full Color',
        type: 'Manhwa',
        score: '9.5',
        description: item.description || '',
      }));

      // Merge curated top manhwa to ensure legendary titles are always front and center
      const mergedSlugs = new Set(fetched.map((f) => f.slug));
      const filteredCurated = CURATED_MANHWA_LIST.filter((c) => !mergedSlugs.has(c.slug));
      return [...CURATED_MANHWA_LIST, ...fetched, ...filteredCurated];
    }

    return CURATED_MANHWA_LIST;
  } catch (err) {
    console.warn('[Manhwa] fetchManhwaList fallback', err);
    return CURATED_MANHWA_LIST;
  }
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
