'use client';

import React, { useState } from 'react';
import {
  Film,
  Play,
  Star,
  Search,
  Server,
  X,
  Maximize2,
  ArrowLeft,
} from 'lucide-react';
import { LK21_MOVIES, getLK21Movies, getMovieServers } from '@/lib/mediaApi';
import { MovieItem } from '@/lib/types';
import SmartImage from './SmartImage';

export default function LK21MovieView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Movie Player Modal state
  const [activeMovie, setActiveMovie] = useState<MovieItem | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
  const [lightsOff, setLightsOff] = useState<boolean>(false);

  const categories = ['Semua', 'Box Office', 'Marvel', 'Action', 'Horror', 'Anime Movie', 'K-Drama'];

  const movieList = getLK21Movies(selectedCategory, searchQuery);
  const heroMovie = movieList[0] || LK21_MOVIES[0];

  // 100% synchronous instant opening - ZERO blank screen
  const handleOpenMovie = (movie: MovieItem) => {
    setActiveMovie(movie);
    setSelectedServerIndex(0);
  };

  const handleCloseMovie = () => {
    setActiveMovie(null);
    if (typeof window !== 'undefined') {
      document.querySelectorAll('audio, video').forEach((el) => {
        try {
          (el as HTMLMediaElement).pause();
        } catch {}
      });
    }
  };

  const currentServers = activeMovie ? getMovieServers(activeMovie.id) : [];
  const currentServerUrl = currentServers[selectedServerIndex]?.url || '';

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Hero Spotlight Film */}
      {heroMovie && !searchQuery && (
        <div className="relative rounded-[28px] overflow-hidden bg-[#141414] border border-[#262626] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          <div className="absolute inset-0 z-0">
            <SmartImage
              item={heroMovie}
              src={heroMovie.poster}
              title={heroMovie.title}
              alt={heroMovie.title}
              type="movie"
              className="w-full h-full object-cover opacity-20 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] text-zinc-200 text-xs font-semibold">
              <Film className="w-3.5 h-3.5 text-white" />
              <span>LK21 FILM BIOSKOP SUB INDO</span>
            </div>

            <h1 className="font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              {heroMovie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-300">
              <span className="px-3 py-1 rounded-full bg-[#1C1C1E] border border-[#2E2E30] text-zinc-200 font-semibold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-white text-white" /> {heroMovie.rating} IMDB
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1C1C1E] border border-[#2E2E30] text-zinc-300 font-mono">
                {heroMovie.year}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1C1C1E] border border-[#2E2E30] text-zinc-400">
                {heroMovie.duration || '120 min'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1C1C1E] border border-[#2E2E30] text-zinc-200">
                HD 1080p
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed">
              {heroMovie.synopsis}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenMovie(heroMovie)}
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm hover:bg-zinc-200 shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Nonton Film Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Chips & Search Pill */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar pb-1 p-1 rounded-full bg-[#141414] border border-[#262626]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-[#2C2C2E] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input Pill */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari film bioskop..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[#141414] border border-[#262626] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-all"
            />
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {movieList.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleOpenMovie(movie)}
              className="group cursor-pointer rounded-[22px] overflow-hidden bg-[#141414] border border-[#262626] hover:border-[#3A3A3C] shadow-lg flex flex-col active:scale-95 transition-all"
            >
              <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                <SmartImage
                  item={movie}
                  src={movie.poster}
                  title={movie.title}
                  alt={movie.title}
                  type="movie"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/30 to-transparent opacity-80" />

                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] text-[10px] font-medium text-zinc-200">
                    {movie.category}
                  </span>
                </div>

                <div className="absolute top-2 right-2 z-10 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1C1C1E] border border-[#2E2E30] text-[10px] font-mono text-zinc-200 font-medium">
                  <Star className="w-3 h-3 fill-white text-white" />
                  <span>{movie.rating}</span>
                </div>

                {/* Floating Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                  <div className="w-11 h-11 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200 scale-95 group-hover:scale-100">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#141414]">
                <h4 className="font-medium text-xs sm:text-sm text-zinc-100 group-hover:text-white line-clamp-2 transition-colors">
                  {movie.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>{movie.year} • HD</span>
                  <span className="text-zinc-300 font-semibold flex items-center gap-1">
                    Play <Play className="w-2.5 h-2.5 fill-white inline" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Modal */}
      {activeMovie && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col font-sans animate-fade-in">
          {/* Top Player Header */}
          <div className="px-4 sm:px-6 py-3 bg-[#141414] border-b border-[#262626] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleCloseMovie}
                className="w-8 h-8 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all shrink-0"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                  {activeMovie.title}
                </h3>
                <span className="text-[10px] text-zinc-400">
                  {activeMovie.year} • {activeMovie.duration || '120 min'} • {activeMovie.genre}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLightsOff(!lightsOff)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#2C2C2E] border border-[#3A3A3C] text-zinc-300 hover:text-white active:scale-95 flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lightsOff ? 'Terang' : 'Bioskop'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseMovie}
                className="w-8 h-8 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-zinc-200 border border-[#3A3A3C] flex items-center justify-center active:scale-95 transition-all"
                title="Tutup Film"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Player Canvas */}
          <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-black border border-[#262626] shadow-2xl flex items-center justify-center">
              <iframe
                key={currentServerUrl}
                src={currentServerUrl}
                className="w-full h-full border-0"
                referrerPolicy="no-referrer"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={activeMovie.title}
              />
            </div>

            {/* Server Switcher Pill Bar */}
            <div className="mt-4 p-3.5 rounded-[20px] bg-[#141414] border border-[#262626] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-white">Server Film HD:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentServers.map((server, idx) => {
                  const isSelected = selectedServerIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedServerIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C] shadow-sm'
                          : 'bg-[#1C1C1E] text-zinc-400 hover:text-white border border-[#262626]'
                      }`}
                    >
                      {server.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Movie Info Drawer */}
            <div className="mt-3 p-4 rounded-[20px] bg-[#141414] border border-[#262626] space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-400 font-normal">
                <span>
                  Genre: <strong className="text-white font-medium">{activeMovie.genre}</strong>
                </span>
                <span>•</span>
                <span>
                  Rating: <strong className="text-zinc-200 font-medium">★ {activeMovie.rating}</strong>
                </span>
                <span>•</span>
                <span>
                  Kualitas: <strong className="text-zinc-200 font-medium">{activeMovie.quality}</strong>
                </span>
              </div>
              <p className="text-zinc-400 text-[11px] line-clamp-3 leading-relaxed">
                {activeMovie.synopsis}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
