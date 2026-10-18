'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Clock } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

interface AnimeGlassCardProps {
  anime: AnimeListItem;
  index?: number;
}

export default function AnimeGlassCard({ anime, index = 0 }: AnimeGlassCardProps) {
  const { accentColor } = useTheme();
  const animeId = anime.animeId || anime.slug || anime.href?.split('/').filter(Boolean).pop() || '';
  const staggerClass = `stagger-${(index % 12) + 1}`;

  return (
    <Link
      href={`/anime?id=${animeId}`}
      className={`group relative flex flex-col rounded-2xl glass-obsidian-card overflow-hidden border border-white/[0.06] hover:border-white/20 spring-press animate-fade-in-up ${staggerClass}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#05060a]">
        <img
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* OLED Deep Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-[#020205]/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

        {/* Top Badges: Score & Episode */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none z-10">
          {anime.score ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-amber-400/30 text-[10px] font-bold text-amber-300 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.score}
            </span>
          ) : (
            <span />
          )}

          {anime.episodes && (
            <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-zinc-200 shadow-md">
              Ep {anime.episodes}
            </span>
          )}
        </div>

        {/* Floating Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.4)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </div>
        </div>

        {/* Release Day Badge at Bottom of Poster */}
        {anime.releaseDay && (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {anime.releaseDay}
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#040508]/90">
        <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-zinc-200 line-clamp-2 leading-snug tracking-tight">
          {anime.title}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span className="truncate">
            {anime.status || (anime.episodes ? `Total ${anime.episodes} Eps` : 'Sub Indo')}
          </span>
          {anime.latestReleaseDate && (
            <span className="text-[10px] text-zinc-500 font-medium">
              {anime.latestReleaseDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
