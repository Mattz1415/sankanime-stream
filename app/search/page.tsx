'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Search, Sparkles, X, Flame, ChevronLeft, RefreshCw } from 'lucide-react';
import AnimeGlassCard from '@/components/AnimeGlassCard';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import { searchAnime } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';

const POPULAR_SUGGESTIONS = [
  'Solo Leveling',
  'One Piece',
  'Jujutsu Kaisen',
  'Naruto',
  'Kimetsu no Yaiba',
  'Bleach',
  'Chainsaw Man',
  'Isekai',
  'Tensei',
];

function SearchContent() {
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
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Top Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
        Beranda
      </Link>

      {/* Search Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl glass-fluent border border-white/10 text-center space-y-4 shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wider uppercase border border-white/15">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Pencarian Instan Sanka Vollerei
        </div>

        <h1 className="font-cinematic font-black text-2xl sm:text-4xl text-white">
          Cari Ribuan Judul Anime
        </h1>

        {/* Fluent Search Input */}
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik judul anime (cth: Solo Leveling, Naruto, One Piece)..."
              className="w-full pl-12 pr-24 py-3.5 rounded-full bg-white/[0.06] border border-white/15 focus:border-white/40 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-24 p-1.5 text-zinc-400 hover:text-white"
                title="Hapus"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 px-5 py-2 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md active:scale-95"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <span className="text-xs text-zinc-400 flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Populer:
          </span>
          {POPULAR_SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="text-xs px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 transition-all active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-white" />
          <p className="text-xs">Mencari di database Sanka Vollerei...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center glass-fluent border border-red-500/30 rounded-3xl text-red-300 text-xs">
          {error}
        </div>
      ) : searched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Hasil Pencarian: <span className="text-white underline">"{query}"</span>
            </h2>
            <span className="text-xs text-zinc-400">
              {results.length} Judul Ditemukan
            </span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {results.map((anime) => (
                <AnimeGlassCard key={anime.animeId || anime.title} anime={anime} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center glass-fluent rounded-3xl space-y-3 border border-white/10">
              <Search className="w-10 h-10 mx-auto text-zinc-600" />
              <h3 className="font-cinematic font-bold text-base text-white">Tidak ada hasil ditemukan</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Coba gunakan kata kunci lain atau periksa ejaan judul anime kamu.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Memuat pencarian...
        </div>
      }
    >
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
        <SearchContent />
        <FloatingGlassDock />
      </div>
    </Suspense>
  );
}
