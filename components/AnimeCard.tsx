'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Star, Calendar, Flame } from 'lucide-react';
import { AnimeListItem } from '@/lib/types';

interface AnimeCardProps {
  anime: AnimeListItem;
  showStatus?: boolean;
}

export default function AnimeCard({ anime, showStatus = true }: AnimeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Normalize anime ID
  const animeId = anime.animeId || anime.href?.replace('/anime/anime/', '') || '';

  return (
    <Link
      href={`/anime/${animeId}`}
      className="group relative flex flex-col rounded-2xl glass-card overflow-hidden transition-all duration-300 flutter-button"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0c1017]">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}

        <img
          src={imageError ? 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60' : anime.poster}
          alt={anime.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-black/30" />

        {/* Badges on top of poster */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {anime.episodes ? (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-sm">
              <Flame className="w-3 h-3 text-cyan-400" />
              Ep {anime.episodes}
            </span>
          ) : anime.status ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-purple-500/40 text-purple-300 shadow-sm">
              {anime.status}
            </span>
          ) : (
            <span />
          )}

          {anime.score && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-amber-500/40 text-amber-300 shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.score}
            </span>
          )}
        </div>

        {/* Floating Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center text-white shadow-neon-cyan transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom meta badge inside poster */}
        {(anime.releaseDay || anime.latestReleaseDate) && (
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center gap-1.5 text-[10px] text-slate-300 font-medium">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>
              {anime.releaseDay ? `${anime.releaseDay}` : ''}
              {anime.releaseDay && anime.latestReleaseDate ? ' • ' : ''}
              {anime.latestReleaseDate ? `${anime.latestReleaseDate}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="p-3 flex flex-col flex-grow justify-between bg-[#0e131d]/90">
        <h3
          className="text-xs sm:text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition-colors"
          title={anime.title}
        >
          {anime.title}
        </h3>

        {/* Genre Tags if available */}
        {anime.genreList && anime.genreList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {anime.genreList.slice(0, 2).map((g) => (
              <span
                key={g.genreId || g.title}
                className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5"
              >
                {g.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
