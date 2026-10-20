'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getCoverForTitle, createModernPosterSvg } from '@/lib/imageHelper';
import { sanitizeSafeUrl } from '@/lib/securityVault';

export interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  item?: any;
  title?: string;
  alt?: string;
  type?: 'anime' | 'manga' | 'comic' | 'manhwa' | 'movie' | 'donghua' | 'auto';
  className?: string;
}

// In-memory poster cache to prevent repeated remote API calls across cards and re-renders
const memoryPosterCache = new Map<string, string>();

/**
 * Extracts any valid image URL from diverse API response schemas across 6 APIs:
 * poster, thumb, thumbnail, image, cover, img, gambar, etc.
 */
export function extractImageUrl(src?: string | null, item?: any): string {
  if (src && typeof src === 'string' && src.trim().length > 0) {
    return src.trim();
  }
  if (!item) return '';

  const extracted =
    item.poster ||
    item.thumb ||
    item.thumbnail ||
    item.image ||
    item.imageSrc ||
    item.cover ||
    item.img ||
    item.gambar ||
    item.src ||
    item.photo ||
    item.images?.webp?.large_image_url ||
    item.images?.jpg?.large_image_url ||
    item.images?.webp?.image_url ||
    item.images?.jpg?.image_url ||
    item.posterUrl ||
    item.banner ||
    item.picture ||
    item.artworkUrl100?.replace('100x100bb', '600x900bb') ||
    '';

  return typeof extracted === 'string' ? extracted.trim() : '';
}

export default function SmartImage({
  src,
  item,
  title,
  alt = 'Poster',
  type = 'auto',
  className = '',
  onError,
  ...rest
}: SmartImageProps) {
  const initialRaw = extractImageUrl(src, item);
  const cleanTitle = (title || item?.title || item?.name || item?.series || alt || '').trim();
  const cacheKey = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    if (cacheKey && memoryPosterCache.has(cacheKey)) {
      return memoryPosterCache.get(cacheKey)!;
    }
    if (cleanTitle) {
      const known = getCoverForTitle(cleanTitle);
      if (known) return known;
    }
    if (initialRaw.startsWith('//')) {
      return 'https:' + initialRaw;
    }
    return initialRaw ? sanitizeSafeUrl(initialRaw) : '';
  });

  // Stages:
  // 0 = Direct URL
  // 1 = Proxy 1 (wsrv.nl)
  // 2 = Proxy 2 (images.weserv.nl)
  // 3 = Proxy 3 (corsproxy.io)
  // 4 = Auto-Fetch real cover from Jikan / MangaDex / Kitsu
  // 5 = SVG Fallback (modern glowing cinema poster, zero raw initials)
  const [stage, setStage] = useState<number>(() => (initialRaw ? 0 : 4));
  const [isFetchingApi, setIsFetchingApi] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check localStorage cache on mount
  useEffect(() => {
    if (cacheKey && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('smart_poster_' + cacheKey);
        if (cached && cached !== currentSrc) {
          memoryPosterCache.set(cacheKey, cached);
          setCurrentSrc(cached);
          setStage(0);
          return;
        }
      } catch {}
    }

    const raw = extractImageUrl(src, item);
    if (raw) {
      let resolved = raw.startsWith('//') ? 'https:' + raw : raw;
      setCurrentSrc(sanitizeSafeUrl(resolved));
      setStage(0);
    } else {
      setStage(4);
    }
  }, [src, item, cacheKey]);

  // Stage 4 Handler: Auto-fetch real poster from Jikan / Kitsu / MangaDex / iTunes
  useEffect(() => {
    if (stage !== 4 || !cleanTitle || isFetchingApi) return;

    let isCancelled = false;

    async function fetchRealPoster() {
      setIsFetchingApi(true);

      // Check known covers first
      const known = getCoverForTitle(cleanTitle);
      if (known) {
        if (!isCancelled && isMountedRef.current) {
          memoryPosterCache.set(cacheKey, known);
          try {
            localStorage.setItem('smart_poster_' + cacheKey, known);
          } catch {}
          setCurrentSrc(known);
          setIsFetchingApi(false);
        }
        return;
      }

      // 1. Movie / LK21 -> iTunes Search API (fast, high-resolution 600x900 covers)
      const isMovie =
        type === 'movie' ||
        item?.type === 'Movie' ||
        item?.quality ||
        item?.slug?.startsWith('film-');

      if (isMovie) {
        try {
          const itunesRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=movie&limit=1`
          );
          if (itunesRes.ok) {
            const data = await itunesRes.json();
            const artwork = data.results?.[0]?.artworkUrl100?.replace('100x100bb', '600x900bb');
            if (artwork && !isCancelled && isMountedRef.current) {
              const safeArt = sanitizeSafeUrl(artwork);
              memoryPosterCache.set(cacheKey, safeArt);
              try {
                localStorage.setItem('smart_poster_' + cacheKey, safeArt);
              } catch {}
              setCurrentSrc(safeArt);
              setIsFetchingApi(false);
              return;
            }
          }
        } catch {}
      }

      // 2. Comic / Manga / Manhwa -> MangaDex API or Kitsu Manga API
      const isComicOrManhwa =
        type === 'comic' ||
        type === 'manhwa' ||
        type === 'manga' ||
        item?.type === 'Manhwa' ||
        item?.type === 'Manga' ||
        item?.type === 'Komik';

      if (isComicOrManhwa) {
        try {
          const mdRes = await fetch(
            `https://api.mangadex.org/manga?title=${encodeURIComponent(cleanTitle)}&limit=1&includes[]=cover_art`
          );
          if (mdRes.ok) {
            const mdData = await mdRes.json();
            const m = mdData.data?.[0];
            const coverRel = m?.relationships?.find((r: any) => r.type === 'cover_art');
            const coverFile = coverRel?.attributes?.fileName;
            if (m?.id && coverFile) {
              const coverUrl = `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.512.jpg`;
              if (!isCancelled && isMountedRef.current) {
                const safeCover = sanitizeSafeUrl(coverUrl);
                memoryPosterCache.set(cacheKey, safeCover);
                try {
                  localStorage.setItem('smart_poster_' + cacheKey, safeCover);
                } catch {}
                setCurrentSrc(safeCover);
                setIsFetchingApi(false);
                return;
              }
            }
          }
        } catch {}

        try {
          const kitsuRes = await fetch(
            `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=1`
          );
          if (kitsuRes.ok) {
            const kitsuData = await kitsuRes.json();
            const poster =
              kitsuData.data?.[0]?.attributes?.posterImage?.large ||
              kitsuData.data?.[0]?.attributes?.posterImage?.original;
            if (poster && !isCancelled && isMountedRef.current) {
              const safePoster = sanitizeSafeUrl(poster);
              memoryPosterCache.set(cacheKey, safePoster);
              try {
                localStorage.setItem('smart_poster_' + cacheKey, safePoster);
              } catch {}
              setCurrentSrc(safePoster);
              setIsFetchingApi(false);
              return;
            }
          }
        } catch {}
      }

      // 3. Anime / Donghua / Default -> Kitsu API (super fast CDN) then Jikan Moe
      try {
        const kitsuRes = await fetch(
          `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=1`
        );
        if (kitsuRes.ok) {
          const kitsuData = await kitsuRes.json();
          const poster =
            kitsuData.data?.[0]?.attributes?.posterImage?.large ||
            kitsuData.data?.[0]?.attributes?.posterImage?.original;
          if (poster && !isCancelled && isMountedRef.current) {
            const safePoster = sanitizeSafeUrl(poster);
            memoryPosterCache.set(cacheKey, safePoster);
            try {
              localStorage.setItem('smart_poster_' + cacheKey, safePoster);
            } catch {}
            setCurrentSrc(safePoster);
            setIsFetchingApi(false);
            return;
          }
        }
      } catch {}

      try {
        const jikanRes = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`
        );
        if (jikanRes.ok) {
          const jikanData = await jikanRes.json();
          const poster =
            jikanData.data?.[0]?.images?.webp?.large_image_url ||
            jikanData.data?.[0]?.images?.jpg?.large_image_url;
          if (poster && !isCancelled && isMountedRef.current) {
            const safePoster = sanitizeSafeUrl(poster);
            memoryPosterCache.set(cacheKey, safePoster);
            try {
              localStorage.setItem('smart_poster_' + cacheKey, safePoster);
            } catch {}
            setCurrentSrc(safePoster);
            setIsFetchingApi(false);
            return;
          }
        }
      } catch {}

      // If all APIs fail, set modern clean SVG placeholder (no raw initials)
      if (!isCancelled && isMountedRef.current) {
        setCurrentSrc(createModernPosterSvg(cleanTitle));
        setIsFetchingApi(false);
        setStage(5);
      }
    }

    fetchRealPoster();

    return () => {
      isCancelled = true;
    };
  }, [stage, cleanTitle, cacheKey, type, item, isFetchingApi]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const raw = extractImageUrl(src, item);
    const cleanRaw = raw.startsWith('//') ? 'https:' + raw : raw;

    if (stage === 0) {
      // Stage 0 failed -> Try Stage 1 (wsrv.nl proxy)
      if (cleanRaw && !cleanRaw.includes('wsrv.nl')) {
        setStage(1);
        setCurrentSrc(`https://wsrv.nl/?url=${encodeURIComponent(cleanRaw)}&w=500&output=webp`);
        return;
      }
      setStage(4);
      return;
    }

    if (stage === 1) {
      // Stage 1 failed -> Try Stage 2 (images.weserv.nl proxy)
      if (cleanRaw && !cleanRaw.includes('images.weserv.nl')) {
        setStage(2);
        setCurrentSrc(`https://images.weserv.nl/?url=${encodeURIComponent(cleanRaw)}&w=500&output=webp`);
        return;
      }
      setStage(2);
      return;
    }

    if (stage === 2) {
      // Stage 2 failed -> Try Stage 3 (corsproxy.io)
      if (cleanRaw) {
        setStage(3);
        setCurrentSrc(`https://corsproxy.io/?url=${encodeURIComponent(cleanRaw)}`);
        return;
      }
      setStage(4);
      return;
    }

    if (stage === 3) {
      // Stage 3 failed -> Trigger Stage 4 (Real API auto-fetch)
      setStage(4);
      return;
    }

    // Stage 4 or 5 failed -> Modern SVG poster
    setCurrentSrc(createModernPosterSvg(cleanTitle || 'Nexus Stream'));
    setStage(5);

    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      src={currentSrc || createModernPosterSvg(cleanTitle || 'Nexus Media')}
      alt={alt || cleanTitle}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={`${className} ${isFetchingApi ? 'animate-pulse' : ''}`}
      {...rest}
    />
  );
}
