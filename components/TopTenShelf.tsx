'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Star, Play, Crown, Flame, ChevronRight } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';

interface TopTenShelfProps {
  animeList: AnimeListItem[];
}

export default function TopTenShelf({ animeList }: TopTenShelfProps) {
  const top10 = animeList.slice(0, 10);

  if (top10.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-black shadow-lg shadow-amber-400/25">
            <Trophy className="w-4 h-4 fill-black" />
          </div>
          <div>
            <h2 className="font-cinematic font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <span>Top 10 Anime Minggu Ini</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase">
                Trending
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Peringkat anime terpopuler dengan jumlah penonton terbanyak</p>
          </div>
        </div>

        <span className="text-xs text-zinc-500 hidden sm:inline font-mono">Diperbarui Realtime</span>
      </div>

      {/* Horizontal Top 10 Shelf */}
      <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-4 px-2">
        {top10.map((anime, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;

          return (
            <Link
              key={anime.animeId || idx}
              href={`/anime?id=${anime.animeId}`}
              className="relative flex items-end shrink-0 group spring-press focus:outline-none"
            >
              {/* Giant Translucent Outline Number Layered Behind */}
              <div
                className={`top-ranking-number text-8xl sm:text-9xl -mr-6 sm:-mr-8 select-none z-0 pointer-events-none transition-all duration-300 group-hover:scale-105 ${
                  rank === 1
                    ? 'text-amber-400/20 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : rank === 2
                    ? 'text-zinc-300/20'
                    : rank === 3
                    ? 'text-amber-700/20'
                    : 'text-white/10'
                }`}
              >
                {rank}
              </div>

              {/* Poster Card Floating Over the Number */}
              <div className="relative w-32 sm:w-36 h-48 sm:h-52 rounded-[28px] overflow-hidden liquid-glass-card border border-white/20 z-10 shadow-2xl flex flex-col justify-between group-hover:border-cyan-400/50 active:scale-[0.96] transition-all">
                <SmartImage
                  item={anime}
                  src={anime.poster}
                  title={anime.title}
                  alt={anime.title}
                  type="anime"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                {/* Rank Badge at Top */}
                <div className="absolute top-2 left-2 z-10">
                  {isTop3 ? (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-lg ${
                        rank === 1
                          ? 'bg-amber-400 text-black shadow-amber-400/40'
                          : rank === 2
                          ? 'bg-zinc-200 text-black'
                          : 'bg-amber-700 text-white'
                      }`}
                    >
                      <Crown className="w-3 h-3 fill-current" />
                      #{rank}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Star Rating Top Right */}
                {anime.score && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-400/30">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {anime.score}
                    </span>
                  </div>
                )}

                {/* Bottom Title Overlay */}
                <div className="relative z-10 p-2.5 space-y-0.5">
                  <h4 className="font-cinematic font-bold text-xs text-white group-hover:text-cyan-300 truncate">
                    {anime.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {anime.episodes ? `Episode ${anime.episodes}` : 'Ongoing'}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
