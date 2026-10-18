'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Palette, Sparkles, Star } from 'lucide-react';
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

  const items = featuredList.slice(0, 5);
  const currentAnime = items[currentIndex] || items[0];

  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6500);
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
    <div className="relative w-full rounded-3xl overflow-hidden glass-obsidian border border-white/[0.06] shadow-[0_24px_70px_rgba(0,0,0,0.95)] group">
      {/* Background Poster Artwork with Ken Burns Effect */}
      <div className="relative w-full h-[420px] sm:h-[490px] lg:h-[550px] overflow-hidden bg-black">
        <img
          key={currentAnime.animeId}
          src={currentAnime.poster}
          alt={currentAnime.title}
          loading="lazy"
          className="w-full h-full object-cover object-center filter blur-[1px] brightness-[0.68] animate-ken-burns"
        />

        {/* Ultra-Dark OLED Multi-layered Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-[#020205]/75 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020205]/95 via-[#020205]/50 to-transparent pointer-events-none" />

        {/* Dynamic Theme Radial Glow Accent */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-25 filter blur-[100px] pointer-events-none transition-all duration-700"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Floating Theme Palette Button in Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <button
          onClick={cyclePalette}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-2xl border border-white/15 text-white text-xs font-semibold shadow-lg hover:border-white/30 spring-press group/palette"
          title={`Tema: ${palette} (Klik untuk ganti warna)`}
        >
          <Palette className="w-4 h-4 transition-transform group-hover/palette:rotate-45" style={{ color: accentColor }} />
          <span className="hidden sm:inline-block capitalize">{palette}</span>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        </button>
      </div>

      {/* Foreground Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-10 lg:p-12">
        <div className="max-w-2xl space-y-4">
          {/* Badge: "SEDANG POPULER" */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-extrabold text-white tracking-widest uppercase shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              SEDANG POPULER
            </span>

            {/* Episode Count & Meta */}
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-zinc-300">
              {currentAnime.episodes ? `Episode ${currentAnime.episodes} Baru` : 'Episode Terbaru'}
            </span>

            {currentAnime.score && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-[11px] font-bold text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {currentAnime.score}
              </span>
            )}

            <span className="hidden sm:inline-block text-xs text-zinc-400">
              • Subtitle Indonesia
            </span>
          </div>

          {/* Cinematic Serif Title with High Contrast */}
          <h1 className="font-cinematic font-black text-2xl sm:text-4xl lg:text-5xl text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] line-clamp-2">
            {currentAnime.title}
          </h1>

          {/* Subtitle / Day Information */}
          <p className="text-xs sm:text-sm text-zinc-300/90 font-medium line-clamp-2 max-w-xl">
            {currentAnime.releaseDay
              ? `Tayang setiap hari ${currentAnime.releaseDay}. Update rilis terkini ${currentAnime.latestReleaseDate || ''}. Nikmati kualitas HD multi-server gratis.`
              : 'Streaming gratis terlengkap tanpa iklan mengganggu, didukung pemutar video multi-server super cepat.'}
          </p>

          {/* Action Buttons: "▶ Tonton Sekarang", "+ Simpan", and Theme Palette */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {/* White Capsule Button: "▶ Tonton Sekarang" */}
            <Link
              href={`/anime?id=${currentAnime.animeId}`}
              className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-zinc-200 shadow-[0_4px_30px_rgba(255,255,255,0.35)] spring-press"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Tonton Sekarang</span>
            </Link>

            {/* Glass Button: "+ Simpan" */}
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-xl border text-xs sm:text-sm font-semibold spring-press ${
                isSaved
                  ? 'bg-white/20 border-white/40 text-white shadow-lg'
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

        {/* Carousel Bottom Indicator Dots & Arrows */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 spring-press ${
                  currentIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white spring-press"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white spring-press"
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
