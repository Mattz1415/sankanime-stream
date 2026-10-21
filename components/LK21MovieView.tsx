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
  Calendar,
  Clock,
  Sparkles,
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
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* =========================================================================
          HERO SPOTLIGHT FILM (FLUTTER SQUIRCLE 36 + LIQUID GLASS)
         ========================================================================= */}
      {heroMovie && !searchQuery && (
        <div className="relative rounded-[36px] overflow-hidden liquid-glass-surface p-6 sm:p-10 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
          {/* 1.5px Specular Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent z-20 pointer-events-none" />

          <div className="absolute inset-0 z-0">
            <SmartImage
              item={heroMovie}
              src={heroMovie.poster}
              title={heroMovie.title}
              alt={heroMovie.title}
              type="movie"
              className="w-full h-full object-cover opacity-25 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full liquid-glass-pill text-rose-300 text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span>LK21 FILM BIOSKOP SUB INDO</span>
            </div>

            <h1 className="font-cinematic font-black text-2xl sm:text-4xl text-white tracking-wide leading-tight">
              {heroMovie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-300">
              <span className="px-3 py-1 rounded-full liquid-glass-pill text-amber-300 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-300" /> {heroMovie.rating} IMDB
              </span>
              <span className="px-3 py-1 rounded-full liquid-glass-pill text-white font-mono">
                {heroMovie.year}
              </span>
              <span className="px-3 py-1 rounded-full liquid-glass-pill text-zinc-300">
                {heroMovie.duration || '120 min'}
              </span>
              <span className="px-3 py-1 rounded-full liquid-glass-pill text-emerald-300 font-bold">
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
                className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-[0_8px_25px_rgba(244,63,94,0.4)] active:scale-95 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Nonton Film Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CUPERTINO FILTER CHIPS & SEARCH PILL
         ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar pb-1 p-1 rounded-full liquid-glass-convex">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? 'liquid-glass-pill text-white shadow-md'
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
              placeholder="Cari Deadpool, Oppenheimer..."
              className="w-full pl-10 pr-4 py-2 rounded-full liquid-glass-surface text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-rose-400/60 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Movies Grid (Flutter Material 3 Squircle Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {movieList.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleOpenMovie(movie)}
              className="group cursor-pointer rounded-[28px] overflow-hidden liquid-glass-card shadow-xl flex flex-col active:scale-95 transition-all"
            >
              {/* 1.5px Specular Top Highlight */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none" />

              <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                <SmartImage
                  item={movie}
                  src={movie.poster}
                  title={movie.title}
                  alt={movie.title}
                  type="movie"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-bold text-rose-300">
                    {movie.category}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none flex items-center gap-1 px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-mono text-amber-300 font-bold">
                  <Star className="w-3 h-3 fill-amber-300" />
                  <span>{movie.rating}</span>
                </div>

                {/* Floating Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                  <div className="w-12 h-12 rounded-full liquid-glass-convex text-rose-400 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.6)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 scale-90 group-hover:scale-100">
                    <Play className="w-5 h-5 fill-rose-400 ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1 bg-[#06060c]/90 border-t border-white/[0.06]">
                <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-rose-400 line-clamp-2 transition-colors">
                  {movie.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>{movie.year} • HD 1080p</span>
                  <span className="text-rose-400 font-extrabold flex items-center gap-1">
                    Play <Play className="w-2.5 h-2.5 fill-rose-400 inline" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          FLUTTER SHEET / PLAYER MODAL (FILM)
          Clean Canvas with Always-Visible Tutup / Kembali Button
         ========================================================================= */}
      {activeMovie && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex flex-col font-sans animate-fade-in">
          {/* Top Player Header with Prominent Close Button */}
          <div className="px-4 sm:px-6 py-3 bg-[#07070b]/95 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleCloseMovie}
                className="w-8 h-8 rounded-full liquid-glass-pill flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all shrink-0"
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
                className="px-3 py-1.5 rounded-full text-xs font-bold liquid-glass-pill text-zinc-300 hover:text-white active:scale-95 flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lightsOff ? 'Terang' : 'Bioskop'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseMovie}
                className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 flex items-center justify-center active:scale-95 transition-all"
                title="Tutup Film"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Player Canvas */}
          <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="relative w-full aspect-video rounded-[28px] overflow-hidden bg-black border border-white/[0.12] shadow-2xl flex items-center justify-center">
              <iframe
                key={currentServerUrl}
                src={currentServerUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={activeMovie.title}
              />
            </div>

            {/* Server Switcher Pill Bar */}
            <div className="mt-4 p-4 rounded-[24px] liquid-glass-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-rose-400" />
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
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30'
                          : 'liquid-glass-pill text-zinc-300 hover:text-white'
                      }`}
                    >
                      {server.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Movie Info Drawer */}
            <div className="mt-3 p-4 rounded-[24px] liquid-glass-surface space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-400 font-semibold">
                <span>
                  Genre: <strong className="text-white">{activeMovie.genre}</strong>
                </span>
                <span>•</span>
                <span>
                  Rating: <strong className="text-amber-400">★ {activeMovie.rating}</strong>
                </span>
                <span>•</span>
                <span>
                  Kualitas: <strong className="text-emerald-400">{activeMovie.quality}</strong>
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] line-clamp-3 leading-relaxed">
                {activeMovie.synopsis}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
