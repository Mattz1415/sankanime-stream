'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, Flame } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import { searchAnime } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';

const POPULAR_SUGGESTIONS = [
  'One Piece',
  'Solo Leveling',
  'Jujutsu Kaisen',
  'Bleach',
  'Naruto',
  'Kimetsu no Yaiba',
  'Hunter x Hunter',
  'Black Clover',
  'Chainsaw Man',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      const data = await searchAnime(term);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Pencarian gagal');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    handleSearch(tag);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-flutter border border-cyan-500/20 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase shadow-neon-cyan">
          <Sparkles className="w-3.5 h-3.5" />
          Pencarian Cepat Sanka API
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Cari Anime Favoritmu
        </h1>

        {/* Futuristic Search Form */}
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-cyan-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik judul anime (cth: Solo Leveling, Naruto, One Piece)..."
              className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-[#0e131d] border border-cyan-500/30 focus:border-cyan-400 focus:shadow-neon-cyan text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-20 p-1.5 text-slate-400 hover:text-white"
                title="Hapus"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-neon-cyan transition-all flutter-button"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-pink-500" />
            Populer:
          </span>
          {POPULAR_SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="text-xs px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all flutter-button"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-40 rounded skeleton-shimmer" />
          <GridSkeleton count={8} />
        </div>
      ) : error ? (
        <div className="p-8 text-center glass-card rounded-2xl text-red-400 text-xs">
          {error}
        </div>
      ) : searched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Hasil Pencarian: <span className="text-cyan-400">"{query}"</span>
            </h2>
            <span className="text-xs text-slate-400">
              {results.length} Judul Ditemukan
            </span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {results.map((anime) => (
                <AnimeCard key={anime.animeId || anime.title} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center glass-card rounded-3xl space-y-3">
              <Search className="w-10 h-10 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-slate-200">Tidak ada hasil ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Coba gunakan kata kunci lain atau periksa ejaan judul anime kamu.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
