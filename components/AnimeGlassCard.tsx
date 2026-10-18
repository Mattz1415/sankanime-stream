'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Calendar, Clock } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

interface AnimeGlassCardProps {
  anime: AnimeListItem;
}

export default function AnimeGlassCard({ anime }: AnimeGlassCardProps) {
  const { accentColor } = useTheme();
  const animeId = anime.animeId || anime.slug || anime.href?.split('/').filter(Boolean).pop() || '';

  return (
    <Link
      href={`/anime?id=${animeId}`}
      className="group relative flex flex-col rounded-2xl glass-fluent-card overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-300"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        <img
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges: Score & Episode */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {anime.score ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-amber-400/30 text-[10px] font-bold text-amber-300">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.score}
            </span>
          ) : (
            <span />
          )}

          {anime.episodes && (
            <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-zinc-200">
              Ep {anime.episodes}
            </span>
          )}
        </div>

        {/* Floating Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-black shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
            style={{ backgroundColor: '#ffffff' }}
          >
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Release Day Badge at Bottom of Poster */}
        {anime.releaseDay && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {anime.releaseDay}
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
        <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-zinc-200 line-clamp-2 leading-snug">
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
