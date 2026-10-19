// Smart Image Helper with Hotlink Bypass Proxy (wsrv.nl) and MangaDex Cover Fallbacks

export const KNOWN_MANHWA_COVERS: Record<string, string> = {
  // Romance & Drama Hits
  'serena': 'https://uploads.mangadex.org/covers/34d8a0e8-6811-459d-87a1-2d3e81ad18fb/67177930-a1b4-4092-b9e8-b3b47322b21c.jpg.512.jpg',
  'cry, or better yet, beg': 'https://uploads.mangadex.org/covers/b6b4d89e-f97b-42f2-badd-2a7ce28d9cef/b4317e18-e8c6-46bf-aef8-9d2008fc3204.jpg.512.jpg',
  'ureo bwa, bireodo jogo': 'https://uploads.mangadex.org/covers/b6b4d89e-f97b-42f2-badd-2a7ce28d9cef/b4317e18-e8c6-46bf-aef8-9d2008fc3204.jpg.512.jpg',
  'the remarried empress': 'https://uploads.mangadex.org/covers/ac6819d8-de35-442c-82dd-3444983d4f26/6fadbf8b-1be6-4c37-9a57-4e03721674f3.png.512.jpg',
  'jaehon hwanghu': 'https://uploads.mangadex.org/covers/ac6819d8-de35-442c-82dd-3444983d4f26/6fadbf8b-1be6-4c37-9a57-4e03721674f3.png.512.jpg',
  'who made me a princess': 'https://uploads.mangadex.org/covers/722a45c0-5e55-40f2-929b-ff69b0989edb/1b24d6dc-04a2-466b-a5d7-b86dde5087d3.jpg.512.jpg',
  'operation: true love': 'https://uploads.mangadex.org/covers/f8dbced3-1eea-4547-b657-ce568fbdda0f/9135af67-a75e-4045-a91f-7a7a87080b2d.jpg.512.jpg',
  'jakjeonmyeong sunjeong': 'https://uploads.mangadex.org/covers/f8dbced3-1eea-4547-b657-ce568fbdda0f/9135af67-a75e-4045-a91f-7a7a87080b2d.jpg.512.jpg',
  'true beauty': 'https://uploads.mangadex.org/covers/51a0cd0c-3254-47f0-a7fd-4b9bb178f813/22679123-1072-4cc2-baf0-95603e0e2a1a.jpg.512.jpg',
  'yeosin-gangrim': 'https://uploads.mangadex.org/covers/51a0cd0c-3254-47f0-a7fd-4b9bb178f813/22679123-1072-4cc2-baf0-95603e0e2a1a.jpg.512.jpg',
  'under the oak tree': 'https://uploads.mangadex.org/covers/c9a891f6-9f4b-487d-8b62-7abb0e3f59c8/9ea1571b-f680-494b-9a3c-04c1949bac27.jpg.512.jpg',

  // Action & Fantasy Hits
  'solo leveling': 'https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/e90bdc47-c8b9-4df7-b2c0-17641b645ee1.jpg.512.jpg',
  'na honjaman level-up': 'https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/e90bdc47-c8b9-4df7-b2c0-17641b645ee1.jpg.512.jpg',
  'lookism': 'https://uploads.mangadex.org/covers/596191eb-69ee-4401-983e-cc07e277fa17/6df15145-f15b-43f0-b87b-22fd3694eaca.jpg.512.jpg',
  'oemo jisangjuui': 'https://uploads.mangadex.org/covers/596191eb-69ee-4401-983e-cc07e277fa17/6df15145-f15b-43f0-b87b-22fd3694eaca.jpg.512.jpg',
  'omniscient reader': 'https://uploads.mangadex.org/covers/9a414441-bbad-43f1-a3a7-dc262ca790a3/be18dc9a-7f1c-4ca5-b318-ffff2d7d58c3.jpg.512.jpg',
  "omniscient reader's viewpoint": 'https://uploads.mangadex.org/covers/9a414441-bbad-43f1-a3a7-dc262ca790a3/be18dc9a-7f1c-4ca5-b318-ffff2d7d58c3.jpg.512.jpg',
  'jeonjijeok dokja sijeom': 'https://uploads.mangadex.org/covers/9a414441-bbad-43f1-a3a7-dc262ca790a3/be18dc9a-7f1c-4ca5-b318-ffff2d7d58c3.jpg.512.jpg',
  'nano machine': 'https://uploads.mangadex.org/covers/6e4805a6-75ab-462d-883c-4ddedb8e4df6/16406b53-9224-4639-8511-9951484ad99a.jpg.512.jpg',
  'killer peter': 'https://uploads.mangadex.org/covers/a3db9212-7e87-44ea-8264-23f914671444/fde4fbe2-0a2f-47ad-b389-0d2af2ace201.jpg.512.jpg',
  'killer baedeuro': 'https://uploads.mangadex.org/covers/a3db9212-7e87-44ea-8264-23f914671444/fde4fbe2-0a2f-47ad-b389-0d2af2ace201.jpg.512.jpg',
  'eleceed': 'https://uploads.mangadex.org/covers/7e544761-7d3d-4fce-8137-719814d7d138/52cf193d-6862-43e8-9de4-1025c0e6e297.jpg.512.jpg',
  'tower of god': 'https://uploads.mangadex.org/covers/37f5c448-9e65-4ae0-a246-8803a6703edc/319ba275-2965-48b0-a8dc-ea5c4530fc1c.jpg.512.jpg',
  'sin-ui tap': 'https://uploads.mangadex.org/covers/37f5c448-9e65-4ae0-a246-8803a6703edc/319ba275-2965-48b0-a8dc-ea5c4530fc1c.jpg.512.jpg',
  'return of the mount hua sect': 'https://uploads.mangadex.org/covers/f0f62b75-5989-4f32-9b59-ab56abe35fc1/e06dc49c-60d3-41c1-8026-30e9c197c9c0.jpg.512.jpg',
  'return of the blossoming blade': 'https://uploads.mangadex.org/covers/f0f62b75-5989-4f32-9b59-ab56abe35fc1/e06dc49c-60d3-41c1-8026-30e9c197c9c0.jpg.512.jpg',
  'wind breaker': 'https://uploads.mangadex.org/covers/9eb78304-0436-484d-9a79-a925b45e2731/088f8766-147d-4347-8a0e-2eda9ef4796d.jpg.512.jpg',
  'the beginning after the end': 'https://uploads.mangadex.org/covers/e17e4f3a-2114-4fb4-b48c-772c5750d4ff/3e1a8cf2-d533-4f93-8b77-cfc8f070b4be.jpg.512.jpg',
  'pick me up': 'https://uploads.mangadex.org/covers/ef79708a-6b4d-45de-9889-11ba1f158580/5e0eb965-ea9a-4db5-9e6b-a2c6b4fc487e.jpg.512.jpg',
  'the world after the fall': 'https://uploads.mangadex.org/covers/983737ec-a430-4591-9c1c-0c84bcbeec04/d87455d3-8822-4bb3-96e0-94f31c26e107.jpg.512.jpg',
  'sss-class suicide hunter': 'https://uploads.mangadex.org/covers/4a973243-952e-44d7-a50f-883b4b7c9cc2/9adafa19-0424-4677-aab4-93a07a01a591.jpg.512.jpg',
  'reincarnation of the suicidal battle god': 'https://uploads.mangadex.org/covers/c2f8211b-c6e3-469b-980b-0dd4f697ec22/9431ff4f-2ca8-4796-abf2-95f3b7ba8232.jpg.512.jpg',
  'mercenary enrollment': 'https://uploads.mangadex.org/covers/0e5b7fb6-5a45-4b1e-b8dd-1ef824eb976d/678ba70b-d242-430c-b26a-9b4334360e23.jpg.512.jpg',
  'magic emperor': 'https://uploads.mangadex.org/covers/71239c09-a78b-4b1c-99f5-412f170ef520/19f5c400-0196-41f8-958b-0ea4fb998ae3.jpg.512.jpg',
  'martial peak': 'https://uploads.mangadex.org/covers/f78696ec-c5d0-43b9-a2e6-a367507ebba8/a73f8582-777e-4b68-bf09-2420a4b6da32.jpg.512.jpg'
};

export function createModernPosterSvg(title: string = 'Nexus'): string {
  const cleanTitle = title.replace(/[<>&"]/g, '').slice(0, 24);
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0a14"/>
        <stop offset="50%" stop-color="#141124"/>
        <stop offset="100%" stop-color="#050508"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#8b5cf6"/>
        <stop offset="50%" stop-color="#ec4899"/>
        <stop offset="100%" stop-color="#06b6d4"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="200" cy="240" r="90" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.4"/>
    <circle cx="200" cy="240" r="70" fill="#18152c" opacity="0.8"/>
    <text x="200" y="258" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">${initials || 'NX'}</text>
    <rect x="60" y="440" width="280" height="2" fill="url(#accent)" opacity="0.5"/>
    <text x="200" y="475" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#f4f4f5" text-anchor="middle">${cleanTitle}</text>
    <text x="200" y="500" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#a1a1aa" text-anchor="middle" letter-spacing="3">NEXUS STREAM HD</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Normalizes title into lookup key
 */
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Returns a guaranteed working safe URL for any poster or cover image.
 * Uses wsrv.nl CDN proxy with WebP optimization for external hotlink-protected hosts.
 */
export function getSafeImageUrl(rawUrl?: string, titleHint?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    if (titleHint) {
      const match = getCoverForTitle(titleHint);
      if (match) return match;
      return createModernPosterSvg(titleHint);
    }
    return createModernPosterSvg('Nexus Media');
  }

  const url = rawUrl.trim();

  // If already proxied or data URI, return directly
  if (url.startsWith('data:image/') || url.includes('wsrv.nl')) {
    return url;
  }

  // Check known covers lookup if available
  if (titleHint) {
    const known = getCoverForTitle(titleHint);
    if (known && (url.includes('komiku.org') || url.includes('broken') || url.includes('placeholder'))) {
      return known;
    }
  }

  // Hosts that block wsrv.nl or already have global fast CDN
  const safeCdnHosts = [
    'uploads.mangadex.org',
    'images.unsplash.com',
    'cdn.myanimelist.net',
    'image.tmdb.org',
    'm.media-amazon.com',
  ];

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Hosts that already allow direct loading with referrerPolicy="no-referrer"
    if (safeCdnHosts.some((sh) => host.includes(sh))) {
      return url;
    }

    // For known anti-hotlink domains (komiku, otakudesu, kiryuu, anichin, etc.)
    // proxy through wsrv.nl with webp output
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=500&output=webp`;
  } catch {
    // If invalid URL, return as-is or fallback
    return url;
  }
}

/**
 * Looks up verified HD cover from KNOWN_MANHWA_COVERS dictionary
 */
export function getCoverForTitle(title?: string): string | null {
  if (!title) return null;
  const key = normalizeKey(title);

  // Exact match
  if (KNOWN_MANHWA_COVERS[key]) {
    return KNOWN_MANHWA_COVERS[key];
  }

  // Partial substring match
  for (const [k, v] of Object.entries(KNOWN_MANHWA_COVERS)) {
    if (key.includes(k) || k.includes(key)) {
      return v;
    }
  }

  return null;
}

/**
 * Global smart onError handler for <img> elements:
 * Automatically swaps to verified MangaDex / Jikan cover or high-def SVG placeholder
 */
export function handleSmartImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  titleHint?: string,
  backupUrl?: string
) {
  const img = e.currentTarget;

  // Prevent infinite error loop
  if (img.getAttribute('data-error-handled') === 'true') {
    return;
  }
  img.setAttribute('data-error-handled', 'true');

  // 1. Try known cover
  if (titleHint) {
    const knownCover = getCoverForTitle(titleHint);
    if (knownCover && img.src !== knownCover) {
      img.src = knownCover;
      return;
    }
  }

  // 2. Try un-proxied or backup URL if provided
  if (backupUrl && img.src !== backupUrl) {
    img.src = backupUrl;
    return;
  }

  // 3. Dynamic background fetch to MangaDex if title exists
  if (titleHint && typeof window !== 'undefined') {
    fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(titleHint)}&includes[]=cover_art&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        const item = d.data?.[0];
        const coverRel = item?.relationships?.find((r: any) => r.type === 'cover_art');
        const coverFile = coverRel?.attributes?.fileName;
        if (coverFile && item?.id) {
          const mdCover = `https://uploads.mangadex.org/covers/${item.id}/${coverFile}.512.jpg`;
          img.src = mdCover;
          return;
        }
        img.src = createModernPosterSvg(titleHint);
      })
      .catch(() => {
        img.src = createModernPosterSvg(titleHint);
      });
    return;
  }

  // 4. Fallback to clean aesthetic SVG poster
  img.src = createModernPosterSvg(titleHint || 'Nexus Stream');
}
