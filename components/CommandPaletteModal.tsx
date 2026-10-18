'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  Film,
  Star,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import { searchAnime } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRE_FILTERS = [
  'Semua',
  'Action',
  'Adventure',
  'Fantasy',
  'Comedy',
  'Romance',
  'Sci-Fi',
  'Isekai',
  'Supernatural',
  'Slice of Life'
];

const STATUS_FILTERS = ['Semua', 'Ongoing', 'Completed'];
const SORT_OPTIONS = ['Populer', 'Terbaru', 'Rating'];

export default function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedSort, setSelectedSort] = useState('Populer');

  const [results, setResults] = useState<AnimeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Load initial suggestions if query is empty
      if (!query.trim()) {
        loadSuggestions();
      }
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const data = await searchAnime('naruto'); // Fallback high-cardinality seed
      setResults(data.slice(0, 8));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchAnime(query.trim());
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Command search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Filter and sort results
  const filteredResults = results
    .filter((anime) => {
      // Genre filter
      if (selectedGenre !== 'Semua') {
        const rawGenres = anime.genres || [];
        const genreListTitles = (anime.genreList || []).map((g) => g.title);
        const combinedGenres = [...rawGenres, ...genreListTitles];
        const matchGenre = combinedGenres.some((g) =>
          g.toLowerCase().includes(selectedGenre.toLowerCase())
        );
        if (!matchGenre && !anime.title.toLowerCase().includes(selectedGenre.toLowerCase())) {
          return false;
        }
      }
      // Status filter
      if (selectedStatus !== 'Semua') {
        const isOngoing = anime.status?.toLowerCase().includes('ongoing');
        if (selectedStatus === 'Ongoing' && !isOngoing) return false;
        if (selectedStatus === 'Completed' && isOngoing) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (selectedSort === 'Terbaru') {
        return (b.animeId || '').localeCompare(a.animeId || '');
      }
      if (selectedSort === 'Rating') {
        const scoreA = parseFloat(a.score || '0') || 0;
        const scoreB = parseFloat(b.score || '0') || 0;
        return scoreB - scoreA;
      }
      return 0; // Default order
    });

  // Handle arrow key navigation in list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected && selected.animeId) {
        router.push(`/anime?id=${selected.animeId}`);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-black/85 backdrop-blur-2xl animate-fade-in-up">
      {/* Backdrop tap to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Command Palette Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#050508]/95 border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.98),inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Cari judul anime, genre, atau karakter... (Ctrl+K)"
            className="flex-1 bg-transparent border-0 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 spring-press"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-mono"
          >
            ESC
          </button>
        </div>

        {/* Multi-Filter Pills */}
        <div className="p-3 px-4 border-b border-white/[0.06] bg-black/40 space-y-2 text-xs">
          {/* Genre Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1 shrink-0">Genre:</span>
            {GENRE_FILTERS.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all spring-press ${
                  selectedGenre === genre
                    ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Status & Sort Options */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Status:</span>
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                    selectedStatus === status
                      ? 'bg-white/20 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Urutan:</span>
              {SORT_OPTIONS.map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSelectedSort(sort)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                    selectedSort === sort
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400 space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p>Mencari anime berkecepatan tinggi...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((anime, index) => {
              const isSelected = index === selectedIndex;
              return (
                <Link
                  key={anime.animeId || index}
                  href={`/anime?id=${anime.animeId}`}
                  onClick={onClose}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 group spring-press ${
                    isSelected
                      ? 'bg-white/10 border border-white/20 shadow-lg'
                      : 'hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  {/* Poster Thumbnail */}
                  <div className="w-12 h-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                    <img
                      src={anime.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80'}
                      alt={anime.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 truncate font-cinematic">
                      {anime.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400">
                      {anime.status && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10">
                          {anime.status}
                        </span>
                      )}
                      {anime.episodes && (
                        <span>{anime.episodes} Eps</span>
                      )}
                      {anime.score && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-2.5 h-2.5 fill-amber-400" /> {anime.score}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ${
                    isSelected ? 'text-cyan-400 translate-x-1' : ''
                  }`} />
                </Link>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
              <Film className="w-10 h-10 mx-auto text-zinc-700 mb-2" />
              <p className="text-zinc-400 font-semibold">Tidak ditemukan anime yang cocok</p>
              <p className="text-[11px]">Coba gunakan kata kunci berbeda atau ganti filter genre di atas.</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-3 px-5 bg-black/60 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px]">↓</kbd> Navigasi</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px]">Enter</kbd> Pilih</span>
          </div>
          <span className="text-cyan-400 font-semibold text-[10px]">Live Instant Search</span>
        </div>
      </div>
    </div>
  );
}
