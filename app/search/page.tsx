'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Sparkles,
  X,
  Flame,
  ChevronLeft,
  RefreshCw,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import AnimeGlassCard from '@/components/AnimeGlassCard';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import AdvancedFilterModal, { AdvancedFilterState } from '@/components/AdvancedFilterModal';
import { searchAnime, getHomeData } from '@/lib/clientApi';
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

const INITIAL_FILTERS: AdvancedFilterState = {
  genres: [],
  status: 'all',
  year: 'Semua',
  sortBy: 'relevance',
};

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AnimeListItem[]>([]);
  const [allAnimePool, setAllAnimePool] = useState<AnimeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced Filter Modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilterState>(INITIAL_FILTERS);

  // Load initial pool from Home Data for advanced filter fallback
  useEffect(() => {
    async function loadPool() {
      try {
        const home = await getHomeData();
        const combined = [...(home.ongoing?.animeList || []), ...(home.complete?.animeList || [])];
        setAllAnimePool(combined);
      } catch {}
    }
    loadPool();
  }, []);

  const handleSearch = async (term: string, currentFilters = filters) => {
    if (!term.trim() && currentFilters.genres.length === 0 && currentFilters.status === 'all' && currentFilters.year === 'Semua') {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      let data: AnimeListItem[] = [];
      const searchQuery = term.trim() || (currentFilters.genres.length > 0 ? currentFilters.genres[0] : '');

      if (searchQuery) {
        data = await searchAnime(searchQuery);
      } else {
        data = allAnimePool;
      }

      // Apply Advanced Filter (status, year, sort)
      let filtered = [...data];

      // Status filter
      if (currentFilters.status === 'ongoing') {
        filtered = filtered.filter((a) => !/tamat|completed|selesai/i.test(a.status || ''));
      } else if (currentFilters.status === 'completed') {
        filtered = filtered.filter((a) => /tamat|completed|selesai/i.test(a.status || ''));
      }

      // Sort
      if (currentFilters.sortBy === 'score_desc') {
        filtered.sort((a, b) => parseFloat(b.score || '0') - parseFloat(a.score || '0'));
      } else if (currentFilters.sortBy === 'title_asc') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      }

      setResults(filtered);
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

  const handleApplyFilters = (newFilters: AdvancedFilterState) => {
    setFilters(newFilters);
    handleSearch(query, newFilters);
  };

  const activeFilterCount =
    filters.genres.length +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.year !== 'Semua' ? 1 : 0) +
    (filters.sortBy !== 'relevance' ? 1 : 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 animate-fade-in-up font-sans">
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-cinematic font-bold text-2xl text-white">
              Pencarian & Filter Anime
            </h1>
            <p className="text-xs text-zinc-400">
              Temukan ribuan anime subtitle Indonesia dengan filter genre, tahun, dan status
            </p>
          </div>

          {/* Advanced Filter Button Trigger */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 spring-press ${
              activeFilterCount > 0
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'card-frosted-obsidian text-zinc-300 hover:text-white border-white/10'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter Tingkat Lanjut</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-black text-cyan-300 text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <form onSubmit={onSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik judul anime, karakter, atau genre..."
            className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 focus:border-cyan-400/50 text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
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
              disabled={(!query.trim() && activeFilterCount === 0) || loading}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-40 transition-all spring-press shadow-md"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
          <p className="text-xs text-zinc-400">Menyaring database anime...</p>
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
              Hasil: {query ? `"${query}"` : 'Filter Kustom'}
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
                Anime dengan kriteria tersebut tidak ditemukan. Coba kurangi filter atau gunakan kata kunci lain.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feature 6: Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={() => handleApplyFilters(INITIAL_FILTERS)}
      />
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
