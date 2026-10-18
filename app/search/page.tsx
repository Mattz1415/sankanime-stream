'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Sparkles, X, Flame, ChevronLeft, RefreshCw } from 'lucide-react';
import AnimeGlassCard from '@/components/AnimeGlassCard';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import { searchAnime } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';

const POPULAR_SUGGESTIONS = [
  'Solo Leveling',
  'One Piece',
  'Jujutsu Kaisen',
  'Bleach',
  'Chainsaw Man',
  'Isekai',
  'Tensei',
  'Action',
  'Romance',
  'Fantasy',
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
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

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

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
    <div className="space-y-6 max-w-5xl mx-auto pb-24 animate-fade-in-up">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full card-frosted-obsidian hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold spring-press"
      >
        <ChevronLeft className="w-4 h-4" />
        Beranda
      </Link>

      {/* Search Header Form */}
      <div className="p-6 sm:p-8 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.95)] space-y-4">
        <div>
          <h1 className="font-cinematic font-bold text-2xl text-white">
            Pencarian Anime
          </h1>
          <p className="text-xs text-zinc-400">
            Temukan ribuan anime subtitle Indonesia dari database Sanka Vollerei
          </p>
        </div>

        <form onSubmit={onSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik judul anime, karakter, atau genre..."
            className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-white/30 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
            autoFocus
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-40 transition-all spring-press shadow-md"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-[11px] font-bold text-zinc-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Populer:
          </span>
          {POPULAR_SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="text-[11px] px-3 py-1 rounded-full card-frosted-obsidian hover:border-white/20 text-zinc-300 hover:text-white transition-all spring-press"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
          <p className="text-xs text-zinc-400">Mencari anime di Sanka Vollerei...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 rounded-3xl card-frosted-obsidian border-red-500/30 text-center text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Results grid */}
      {!loading && searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cinematic font-bold text-base text-white">
              Hasil Pencarian: "{query}"
            </h2>
            <span className="text-xs text-zinc-400">{results.length} Judul Ditemukan</span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {results.map((anime, i) => (
                <AnimeGlassCard key={anime.animeId || anime.title} anime={anime} index={i} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-2">
              <Flame className="w-8 h-8 mx-auto text-zinc-600" />
              <h3 className="font-cinematic font-bold text-sm text-white">Tidak Ada Hasil</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Judul anime "{query}" tidak ditemukan. Coba gunakan kata kunci yang lebih pendek atau cek ejaan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
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
