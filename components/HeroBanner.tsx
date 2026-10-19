'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Sparkles, Flame, ChevronRight, Star } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';

interface HeroBannerProps {
  featuredList: AnimeListItem[];
}

export default function HeroBanner({ featuredList }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!featuredList || featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(featuredList.length, 5));
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredList]);

  if (!featuredList || featuredList.length === 0) return null;

  const current = featuredList[currentIndex] || featuredList[0];
  const animeId = current.animeId || current.href?.replace('/anime/anime/', '') || '';

  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-flutter border border-cyan-500/20 shadow-2xl mb-8">
      {/* Background Image with Blur & Darkening */}
      <div className="absolute inset-0">
        <SmartImage
          item={current}
          src={current.poster}
          title={current.title}
          alt={current.title}
          type="anime"
          className="w-full h-full object-cover object-center filter blur-md scale-110 opacity-30 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/70 to-transparent" />
      </div>

      {/* Grid Pattern overlay for futuristic cyber look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Info Column */}
        <div className="flex-1 max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold tracking-wider uppercase shadow-neon-cyan">
              <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Anime Sedang Hangat
            </span>
            {current.episodes && (
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-semibold">
                Episode {current.episodes}
              </span>
            )}
            {current.releaseDay && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs">
                Rilis Tiap {current.releaseDay}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2">
            {current.title}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 max-w-xl">
            Saksikan kelanjutan serial anime pilihan terpopuler musim ini gratis dengan kualitas terbaik melalui SankaVollerei REST API.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/anime/${animeId}`}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-bold text-sm shadow-neon-cyan transition-all duration-300 flutter-button hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              Nonton Sekarang
            </Link>

            <Link
              href={`/anime/${animeId}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#121824]/90 hover:bg-[#1c2538] border border-white/10 hover:border-cyan-500/40 text-slate-200 text-sm font-semibold transition-all flutter-button"
            >
              Lihat Detail
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </Link>
          </div>

          {/* Carousel indicators */}
          <div className="flex items-center gap-2 pt-4">
            {featuredList.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-8 bg-cyan-400 shadow-neon-cyan'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Poster Highlight */}
        <div className="relative w-44 sm:w-56 md:w-64 aspect-[3/4] flex-shrink-0 rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-neon-cyan hidden sm:block transform hover:rotate-1 hover:scale-105 transition-transform duration-500">
          <SmartImage
            item={current}
            src={current.poster}
            title={current.title}
            alt={current.title}
            type="anime"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Full HD Multi-Server</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
