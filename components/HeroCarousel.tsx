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
} from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';
import SmartImage from './SmartImage';
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

  const prevIndex = (currentIndex - 1 + items.length) % items.length;
  const nextIndex = (currentIndex + 1) % items.length;
  const prevAnime = items[prevIndex];
  const nextAnime = items[nextIndex];

  return (
    <div className="relative w-full overflow-hidden py-3">
      {/* =========================================================================
          FLUTTER PAGEVIEW 3D CAROUSEL CONTAINER (VIEWPORT FRACTION)
         ========================================================================= */}
      <div className="relative w-full max-w-6xl mx-auto flex items-center justify-center">
        {/* Left Peeking Side Card (Flutter PageView Effect) */}
        <div
          onClick={() => setCurrentIndex(prevIndex)}
          className="hidden lg:block absolute -left-20 w-80 h-[480px] rounded-[32px] overflow-hidden opacity-40 scale-[0.88] cursor-pointer transition-all duration-500 z-0 hover:opacity-60"
        >
          <SmartImage
            item={prevAnime}
            src={prevAnime.poster}
            title={prevAnime.title}
            alt={prevAnime.title}
            type="anime"
            className="w-full h-full object-cover filter brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Active Center Card (Prominent Squircle 36 + 3D Shadow) */}
        <div className="relative w-full h-[500px] sm:h-[540px] rounded-[36px] overflow-hidden liquid-glass-surface shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10 transition-all duration-500 group">
          {/* 1.5px Specular Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent z-20 pointer-events-none" />

          {/* Background Artwork */}
          <div className="relative w-full h-full overflow-hidden bg-black">
            <SmartImage
              key={currentAnime.animeId}
              item={currentAnime}
              src={currentAnime.poster}
              title={currentAnime.title}
              alt={currentAnime.title}
              type="anime"
              className="w-full h-full object-cover object-center filter brightness-[0.92] animate-ken-burns"
            />

            {/* Gradient Darkening for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 via-40% to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Aurora Ambient Glow Blob */}
            <div
              className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 filter blur-[50px] pointer-events-none"
              style={{ backgroundColor: accentColor }}
            />
          </div>

          {/* Top Right Floating Controls */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
            <button
              onClick={cyclePalette}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-white text-xs font-semibold shadow-lg active:scale-95 transition-all group/palette"
              title={`Tema: ${palette}`}
            >
              <Palette
                className="w-3.5 h-3.5 transition-transform group-hover/palette:rotate-45"
                style={{ color: accentColor }}
              />
              <span className="hidden sm:inline-block capitalize text-[11px]">{palette}</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            </button>
          </div>

          {/* Left / Right Carousel Navigation Arrows */}
          <button
            onClick={() => setCurrentIndex(prevIndex)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full liquid-glass-convex flex items-center justify-center text-white active:scale-90 transition-all z-20 shadow-lg"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex(nextIndex)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full liquid-glass-convex flex items-center justify-center text-white active:scale-90 transition-all z-20 shadow-lg"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* =========================================================================
              FLOATING LIQUID GLASS INFO PANEL (D悵CKED AT BOTTOM OF CARD)
             ========================================================================= */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-20 rounded-[28px] liquid-glass-surface p-4 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-3">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-[10px] font-black text-cyan-300 tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-cyan-300 fill-cyan-300" />
                TRENDING NOW
              </span>

              {currentAnime.score && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full liquid-glass-pill text-[10px] font-bold text-amber-300">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  {currentAnime.score}
                </span>
              )}

              <span className="px-2.5 py-1 rounded-full liquid-glass-pill text-[10px] font-bold text-white">
                HD 1080p
              </span>

              <span className="px-2.5 py-1 rounded-full liquid-glass-pill text-[10px] font-semibold text-zinc-300">
                {currentAnime.episodes ? `Ep ${currentAnime.episodes}` : 'Ongoing'}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-cinematic font-black text-xl sm:text-3xl text-white leading-tight line-clamp-1 drop-shadow-md">
              {currentAnime.title}
            </h1>

            {/* Subtitle / Day Information */}
            <p className="text-xs text-zinc-300 font-medium line-clamp-1 max-w-xl">
              {currentAnime.releaseDay
                ? `Tayang setiap ${currentAnime.releaseDay}. Update rilis ${currentAnime.latestReleaseDate || ''} Sub Indo.`
                : 'Streaming anime sub Indo tercepat dan terlengkap dengan pemutar multi-server.'}
            </p>

            {/* CTA Buttons & Liquid Droplet Dots */}
            <div className="flex items-center justify-between pt-1 gap-3">
              <div className="flex items-center gap-2.5">
                <Link
                  id="featured-play-btn"
                  href={`/anime?id=${currentAnime.animeId}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-black text-xs hover:bg-zinc-200 shadow-[0_6px_20px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Nonton Sekarang</span>
                </Link>

                <button
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold active:scale-95 transition-all ${
                    isSaved
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-md'
                      : 'liquid-glass-pill text-white hover:text-white'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">+ Simpan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Liquid Droplet Carousel Indicators */}
              <div className="flex items-center gap-1.5">
                {items.map((_, idx) => {
                  const isActive = currentIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        isActive
                          ? 'w-6 h-2 bg-gradient-to-r from-cyan-400 to-pink-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                          : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Peeking Side Card (Flutter PageView Effect) */}
        <div
          onClick={() => setCurrentIndex(nextIndex)}
          className="hidden lg:block absolute -right-20 w-80 h-[480px] rounded-[32px] overflow-hidden opacity-40 scale-[0.88] cursor-pointer transition-all duration-500 z-0 hover:opacity-60"
        >
          <SmartImage
            item={nextAnime}
            src={nextAnime.poster}
            title={nextAnime.title}
            alt={nextAnime.title}
            type="anime"
            className="w-full h-full object-cover filter brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      </div>
    </div>
  );
}
