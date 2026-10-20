'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ImageOff } from 'lucide-react';
import { sanitizeSafeUrl } from '@/lib/securityVault';

interface ChapterPageImageProps {
  src: string;
  pageNumber: number;
  total?: number;
  alt?: string;
  onImageLoad?: () => void;
}

export default function ChapterPageImage({
  src,
  pageNumber,
  total,
  alt,
  onImageLoad,
}: ChapterPageImageProps) {
  // 0 = Direct, 1 = wsrv.nl, 2 = images.weserv.nl, 3 = corsproxy.io, 4 = Failed/Retry
  const [stage, setStage] = useState<number>(0);
  const [currentUrl, setCurrentUrl] = useState<string>(() => sanitizeSafeUrl(src));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setStage(0);
    setIsLoading(true);
    setCurrentUrl(sanitizeSafeUrl(src));
  }, [src]);

  const handleError = () => {
    setIsLoading(false);
    const cleanUrl = src.startsWith('//') ? 'https:' + src : src;

    if (stage === 0) {
      setStage(1);
      setCurrentUrl(`https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=1000&output=webp`);
      return;
    }

    if (stage === 1) {
      setStage(2);
      setCurrentUrl(`https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=1000&output=webp`);
      return;
    }

    if (stage === 2) {
      setStage(3);
      setCurrentUrl(`https://corsproxy.io/?url=${encodeURIComponent(cleanUrl)}`);
      return;
    }

    // All proxies exhausted
    setStage(4);
  };

  const handleRetry = () => {
    setStage(0);
    setIsLoading(true);
    setCurrentUrl(sanitizeSafeUrl(src) + (src.includes('?') ? '&' : '?') + 'retry=' + Date.now());
  };

  if (stage === 4) {
    return (
      <div className="w-full py-16 px-4 my-2 text-center rounded-2xl bg-black/60 border border-white/[0.08] card-frosted-obsidian space-y-3">
        <ImageOff className="w-8 h-8 text-zinc-500 mx-auto" />
        <p className="text-xs text-zinc-400">
          Halaman {pageNumber} {total ? `dari ${total}` : ''} sedang dipersiapkan oleh server
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white spring-press transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-black/40 min-h-[300px] flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={currentUrl}
        alt={alt || `Halaman ${pageNumber}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setIsLoading(false);
          if (onImageLoad) onImageLoad();
        }}
        onError={handleError}
        className="w-full h-auto block select-none pointer-events-none transition-opacity duration-300"
      />
    </div>
  );
}
