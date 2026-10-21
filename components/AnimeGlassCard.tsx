'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Clock } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';
import SmartImage from './SmartImage';

interface AnimeGlassCardProps {
  anime: AnimeListItem;
  index?: number;
}

function RawAnimeGlassCard({ anime, index = 0 }: AnimeGlassCardProps) {
  const animeId = anime.animeId || anime.slug || anime.href?.split('/').filter(Boolean).pop() || '';
  const staggerClass = `stagger-${(index % 12) + 1}`;

  return (
    <Link
      href={`/anime?id=${animeId}`}
      className={`group relative flex flex-col rounded-[28px] liquid-glass-card overflow-hidden cursor-pointer shadow-xl animate-fade-in-up ${staggerClass} active:scale-[0.96] transition-all`}
    >
      {/* 1.5px Specular Top Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none" />

      {/* Poster Image Container (Aspect 2/3) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#050508]">
        <SmartImage
          item={anime}
          src={anime.poster}
          title={anime.title}
          alt={anime.title}
          type="anime"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
        />

        {/* Liquid Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

        {/* Liquid Glass Episode Badge di Kiri Atas */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-bold text-white shadow-md">
            {anime.episodes ? `Ep ${anime.episodes}` : 'Ep Baru'}
          </span>
        </div>

        {/* Gold Rating Badge di Kanan Atas */}
        {anime.score && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-black text-amber-300 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.score}
            </span>
          </div>
        )}

        {/* Floating Water-Lens Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <div className="w-12 h-12 rounded-full liquid-glass-convex text-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.6)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 scale-90 group-hover:scale-100">
            <Play className="w-5 h-5 fill-cyan-300 ml-0.5" />
          </div>
        </div>

        {/* Release Day Badge at Bottom of Poster */}
        {anime.releaseDay && (
          <div className="absolute bottom-2 left-2 z-10 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-medium text-zinc-300 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-cyan-400" />
            {anime.releaseDay}
          </div>
        )}
      </div>

      {/* Title & Metadata Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1 bg-[#06060c]/90 border-t border-white/[0.06]">
        <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-cyan-300 line-clamp-2 leading-snug tracking-tight transition-colors">
          {anime.title}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span className="truncate text-zinc-400 text-[10px]">
            {anime.status || (anime.episodes ? `Total ${anime.episodes} Eps` : 'Sub Indo')}
          </span>
          {anime.latestReleaseDate && (
            <span className="text-[10px] text-cyan-400 font-bold shrink-0 ml-1">
              {anime.latestReleaseDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export const AnimeGlassCard = React.memo(RawAnimeGlassCard);
export default AnimeGlassCard;
