'use client';

import React, { useState } from 'react';
import {
  Film,
  Play,
  Star,
  Search,
  Sparkles,
  Server,
  X,
  Sun,
  Moon,
  Tv,
  Clock,
  Layers,
} from 'lucide-react';
import { LK21_MOVIES, getLK21Movies, getMovieServers } from '@/lib/mediaApi';
import { MovieItem } from '@/lib/types';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';

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
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Hero Featured Movie */}
      {heroMovie && (
        <div className="relative rounded-3xl overflow-hidden card-frosted-obsidian border border-white/[0.08] p-6 sm:p-10 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src={getSafeImageUrl(heroMovie.poster, heroMovie.title)}
              alt={heroMovie.title}
              referrerPolicy="no-referrer"
              onError={(e) => handleSmartImageError(e, heroMovie.title)}
              className="w-full h-full object-cover opacity-25 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <Film className="w-3.5 h-3.5 text-red-400" />
              <span>LK21 FILM BIOSKOP SUB INDO</span>
            </div>

            <h1 className="font-cinematic font-black text-2xl sm:text-4xl text-white tracking-wide leading-tight">
              {heroMovie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-300">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                ★ {heroMovie.rating} IMDB
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono">
                {heroMovie.year}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-zinc-300">
                {heroMovie.duration || '120 min'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-bold">
                HD 1080p
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
              {heroMovie.synopsis}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenMovie(heroMovie)}
                className="px-6 py-3 rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-zinc-200 shadow-lg shadow-white/20 spring-press flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Nonton Film Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Chips & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all spring-press ${
                  selectedCategory === cat
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                    : 'card-frosted-obsidian text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Deadpool, Oppenheimer..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400/60"
            />
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movieList.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleOpenMovie(movie)}
              className="group cursor-pointer rounded-2xl overflow-hidden card-frosted-obsidian border border-white/[0.08] hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] transition-all duration-300 spring-press flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                <img
                  src={getSafeImageUrl(movie.poster, movie.title)}
                  alt={movie.title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleSmartImageError(e, movie.title)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-80" />

                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-red-400 border border-red-500/30">
                    {movie.category}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-amber-300 font-bold border border-amber-400/30">
                  <Star className="w-3 h-3 fill-amber-300" />
                  <span>{movie.rating}</span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                <h4 className="font-bold text-xs text-zinc-200 group-hover:text-red-400 line-clamp-2 transition-colors">
                  {movie.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>{movie.year} • HD 1080p</span>
                  <span className="text-red-400 font-semibold group-hover:underline">Play ▶</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEXUS FILM PLAYER MODAL */}
      {activeMovie && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col font-sans animate-fade-in">
          {/* Top Player Header */}
          <div className="px-4 py-3 bg-[#050508]/98 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="font-cinematic font-bold text-white text-xs sm:text-sm shrink-0">
                LK21 CINEMA PLAYER
              </span>
              <span className="text-[11px] text-zinc-400 truncate max-w-[180px] sm:max-w-md">
                {activeMovie.title} ({activeMovie.year})
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLightsOff(!lightsOff)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all spring-press flex items-center gap-1.5 ${
                  lightsOff
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-white/10 text-zinc-300 hover:text-white border-white/10'
                }`}
              >
                {lightsOff ? <Sun className="w-3.5 h-3.5 fill-black" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{lightsOff ? 'Terang' : 'Bioskop'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseMovie}
                className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 flex items-center justify-center spring-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Player Canvas */}
          <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center p-2 sm:p-4">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl flex items-center justify-center">
              <iframe
                key={currentServerUrl}
                src={currentServerUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={activeMovie.title}
              />
            </div>

            {/* Server 1-4 Selector */}
            <div className="mt-4 p-4 rounded-2xl card-frosted-obsidian border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-white">Pilih Server Film HD:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentServers.map((server, idx) => {
                  const isSelected = selectedServerIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedServerIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all spring-press ${
                        isSelected
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/30 scale-[1.02]'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08]'
                      }`}
                    >
                      {server.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Movie Info Drawer */}
            <div className="mt-3 p-4 rounded-2xl card-frosted-obsidian border border-white/[0.08] space-y-1 text-xs">
              <div className="flex items-center gap-2 text-zinc-400 font-semibold">
                <span>Genre: <strong className="text-white">{activeMovie.genre}</strong></span>
                <span>•</span>
                <span>Rating: <strong className="text-amber-400">★ {activeMovie.rating}</strong></span>
                <span>•</span>
                <span>Durasi: <strong className="text-white">{activeMovie.duration || '120 min'}</strong></span>
              </div>
              <p className="text-zinc-300 text-[11px] line-clamp-2">{activeMovie.synopsis}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
