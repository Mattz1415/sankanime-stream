'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Flame } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';

interface AnimeStoriesBarProps {
  animeList: AnimeListItem[];
}

export default function AnimeStoriesBar({ animeList }: AnimeStoriesBarProps) {
  const stories = animeList.slice(0, 10);

  if (stories.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-cinematic">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sorotan Populer (Stories)</span>
        </div>
        <span className="text-[10px] text-zinc-500">Geser untuk melihat</span>
      </div>

      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2 px-1">
        {stories.map((anime, idx) => {
          const isFirst = idx === 0;
          return (
            <Link
              key={anime.animeId || idx}
              href={`/anime?id=${anime.animeId}`}
              className="flex flex-col items-center gap-1.5 group shrink-0 spring-press focus:outline-none"
            >
              {/* Glowing Story Ring */}
              <div
                className={`relative p-[2.5px] rounded-full transition-transform duration-300 group-hover:scale-110 shadow-lg ${
                  isFirst
                    ? 'bg-gradient-to-tr from-amber-400 via-pink-500 to-cyan-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                    : 'bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                }`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-black p-[2px]">
                  <SmartImage
                    item={anime}
                    src={anime.poster}
                    title={anime.title}
                    alt={anime.title}
                    type="anime"
                    className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Live / New Pill */}
                {isFirst ? (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-red-600 text-[8px] font-black tracking-widest text-white uppercase border border-black animate-pulse">
                    LIVE
                  </span>
                ) : (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-cyan-600 text-[8px] font-black tracking-widest text-white uppercase border border-black">
                    BARU
                  </span>
                )}
              </div>

              {/* Short Title */}
              <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white max-w-[68px] truncate text-center">
                {anime.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
