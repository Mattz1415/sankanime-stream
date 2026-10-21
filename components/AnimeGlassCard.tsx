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
      className={`group relative flex flex-col aspect-[2/3] rounded-[24px] bg-[#121214] border border-white/10 overflow-hidden cursor-pointer shadow-xl animate-fade-in-up ${staggerClass} active:scale-[0.96] transition-transform duration-150`}
    >
      {/* 1.5px Specular Top Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20 pointer-events-none" />

      {/* Poster Image Container */}
      <div className="relative w-full h-full overflow-hidden bg-[#0A0A0C]">
        <SmartImage
          item={anime}
          src={anime.poster}
          title={anime.title}
          alt={anime.title}
          type="anime"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Liquid Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity pointer-events-none" />

        {/* Liquid Glass Episode Badge di Kiri Atas */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-bold text-white shadow-md">
            {anime.episodes ? `Ep ${anime.episodes}` : 'Ep Baru'}
          </span>
        </div>

        {/* Rating Badge di Kanan Atas (Monochrome) */}
        {anime.score && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-bold text-white shadow-md">
              <Star className="w-3 h-3 fill-white text-white" />
              {anime.score}
            </span>
          </div>
        )}

        {/* Floating Water-Lens Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <div className="w-12 h-12 rounded-full liquid-glass-convex text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.8)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 scale-90 group-hover:scale-100">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Release Day Badge at Bottom of Poster */}
        {anime.releaseDay && (
          <div className="absolute bottom-16 left-2.5 z-10 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-medium text-zinc-300 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-zinc-400" />
            {anime.releaseDay}
          </div>
        )}

        {/* Bottom Title & Metadata Inside Card Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3 z-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col justify-end space-y-1">
          <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-zinc-200 line-clamp-1 leading-snug tracking-tight transition-colors">
            {anime.title}
          </h4>

          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="truncate text-zinc-400">
              {anime.status || (anime.episodes ? `Total ${anime.episodes} Eps` : 'Sub Indo')}
            </span>
            {anime.latestReleaseDate && (
              <span className="text-zinc-300 font-bold shrink-0 ml-1">
                {anime.latestReleaseDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export const AnimeGlassCard = React.memo(RawAnimeGlassCard);
export default AnimeGlassCard;
