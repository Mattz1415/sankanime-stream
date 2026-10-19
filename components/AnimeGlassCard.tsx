'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Star, Clock, Sparkles } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';

interface AnimeGlassCardProps {
  anime: AnimeListItem;
  index?: number;
}

function RawAnimeGlassCard({ anime, index = 0 }: AnimeGlassCardProps) {
  const { accentColor } = useTheme();
  const animeId = anime.animeId || anime.slug || anime.href?.split('/').filter(Boolean).pop() || '';
  const staggerClass = `stagger-${(index % 12) + 1}`;

  return (
    <Link
      href={`/anime?id=${animeId}`}
      className={`group relative flex flex-col rounded-2xl glass-obsidian-card overflow-hidden border border-white/[0.08] hover:border-cyan-400/40 spring-press animate-fade-in-up ${staggerClass} shadow-xl`}
    >
      {/* 1px Specular Top Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20 pointer-events-none" />

      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#030306]">
        <SmartImage
          item={anime}
          src={anime.poster}
          title={anime.title}
          alt={anime.title}
          type="anime"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
        />

        {/* OLED Deep Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

        {/* Glass Episode Badge di Kiri Atas */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-lg">
            {anime.episodes ? `Ep ${anime.episodes}` : 'Ep Baru'}
          </span>
        </div>

        {/* Gold Rating Badge di Kanan Atas */}
        {anime.score && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-400/40 text-[10px] font-black text-amber-300 shadow-lg">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.score}
            </span>
          </div>
        )}

        {/* Floating Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.6)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 scale-90 group-hover:scale-100">
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </div>
        </div>

        {/* Release Day Badge at Bottom of Poster */}
        {anime.releaseDay && (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-white/10 text-[9px] font-medium text-zinc-300 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-cyan-400" />
            {anime.releaseDay}
          </div>
        )}
      </div>

      {/* Title & Metadata Details */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#030306]/95 border-t border-white/[0.04]">
        <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-cyan-300 line-clamp-2 leading-snug tracking-tight transition-colors">
          {anime.title}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span className="truncate text-zinc-500">
            {anime.status || (anime.episodes ? `Total ${anime.episodes} Eps` : 'Sub Indo')}
          </span>
          {anime.latestReleaseDate && (
            <span className="text-[10px] text-zinc-500 font-medium shrink-0 ml-1">
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
