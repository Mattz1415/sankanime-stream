'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
  Star,
  Film,
  Zap,
  Flame
} from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';
import { isAnimeBookmarked, toggleBookmark } from '@/lib/storage';

interface HeroCarouselProps {
  featuredList: AnimeListItem[];
}

export default function HeroCarousel({ featuredList }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const { palette, cyclePalette, accentColor } = useTheme();

  const items = featuredList.slice(0, 6);
  const currentAnime = items[currentIndex] || items[0];

  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (currentAnime) {
      setIsSaved(isAnimeBookmarked(currentAnime.animeId));
    }
  }, [currentIndex, currentAnime]);

  const handleToggleSave = () => {
    if (!currentAnime) return;
    const newState = toggleBookmark({
      animeId: currentAnime.animeId,
      title: currentAnime.title,
      poster: currentAnime.poster,
      score: currentAnime.score,
      status: currentAnime.status,
    });
    setIsSaved(newState);
  };

  if (!items.length || !currentAnime) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-obsidian border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.98)] group">
      {/* Full-Bleed Immersive Showcase Artwork */}
      <div className="relative w-full h-[460px] sm:h-[530px] lg:h-[580px] overflow-hidden bg-black">
        {/* Crisp Image (not muddied at top) */}
        <img
          key={currentAnime.animeId}
          src={currentAnime.poster}
          alt={currentAnime.title}
          loading="eager"
          className="w-full h-full object-cover object-center filter brightness-[0.92] animate-ken-burns"
        />

        {/* Pure OLED Pitch-Black Vignette ONLY at Bottom Text & Left Edge */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/75 via-45% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/85 via-[#000000]/30 to-transparent pointer-events-none" />

        {/* Dynamic Theme Glow Accent at Top Left */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-30 filter blur-[90px] pointer-events-none transition-all duration-700"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Floating Theme Palette Button in Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <button
          onClick={cyclePalette}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-2xl border border-white/15 text-white text-xs font-semibold shadow-lg hover:border-white/30 spring-press group/palette"
          title={`Tema: ${palette} (Klik untuk ganti warna)`}
        >
          <Palette className="w-3.5 h-3.5 transition-transform group-hover/palette:rotate-45" style={{ color: accentColor }} />
          <span className="hidden sm:inline-block capitalize text-[11px]">{palette}</span>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        </button>
      </div>

      {/* Foreground Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-8 lg:p-10">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          {/* Micro-Glass Badge Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-black text-white tracking-widest uppercase shadow-md">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              SEDANG POPULER
            </span>

            {/* Score Badge */}
            {currentAnime.score && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/40 text-[10px] font-bold text-amber-300 shadow-sm">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {currentAnime.score}
              </span>
            )}

            {/* HD 1080p Badge */}
            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-cyan-500/30 text-[10px] font-bold text-cyan-300 shadow-sm">
              HD 1080p
            </span>

            {/* Status Ongoing */}
            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-zinc-200">
              {currentAnime.status || 'Ongoing'}
            </span>

            {/* Latest Episode */}
            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-zinc-300">
              {currentAnime.episodes ? `Ep ${currentAnime.episodes} Baru` : 'Episode Terbaru'}
            </span>

            <span className="hidden sm:inline-block text-[11px] text-zinc-400 font-medium">
              • Sub Indo
            </span>
          </div>

          {/* Cinematic Serif Title with High Contrast Drop Shadow */}
          <h1 className="font-cinematic font-black text-2xl sm:text-4xl lg:text-5xl text-white leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] line-clamp-2">
            {currentAnime.title}
          </h1>

          {/* Subtitle / Day Information */}
          <p className="text-xs sm:text-sm text-zinc-300/90 font-medium line-clamp-2 max-w-xl">
            {currentAnime.releaseDay
              ? `Tayang setiap hari ${currentAnime.releaseDay}. Update rilis terkini ${currentAnime.latestReleaseDate || ''}. Nikmati kualitas HD multi-server gratis.`
              : 'Streaming gratis subtitle Indonesia terlengkap didukung pemutar multi-server super cepat.'}
          </p>

          {/* Side-by-Side Action Buttons: "▶ Tonton Sekarang" and "+ Simpan" */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/anime?id=${currentAnime.animeId}`}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.4)] spring-press animate-pulse"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Tonton Sekarang</span>
            </Link>

            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full backdrop-blur-xl border text-xs sm:text-sm font-semibold spring-press transition-all ${
                isSaved
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tersimpan</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>+ Simpan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Mini-Poster Thumbnail Strip at the Bottom */}
        <div className="flex items-center justify-between pt-5 mt-4 border-t border-white/[0.08] gap-3">
          {/* Thumbnail Strip */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
            {items.map((item, idx) => {
              const isActive = currentIndex === idx;
              return (
                <button
                  key={`${item.animeId}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-14 sm:w-16 h-10 sm:h-12 rounded-xl overflow-hidden shrink-0 transition-all duration-300 spring-press border ${
                    isActive
                      ? 'border-white ring-2 ring-white/50 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      : 'border-white/15 opacity-50 hover:opacity-90'
                  }`}
                  title={item.title}
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-white">
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white spring-press"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white spring-press"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
