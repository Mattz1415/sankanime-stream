'use client';

import React, { useEffect, useState } from 'react';
import { Flame, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import { getOngoingAnime } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';

export default function OngoingPage() {
  const [list, setList] = useState<AnimeListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOngoingAnime(p);
      setList(res.animeList || []);
      setPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Gagal memuat anime ongoing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-flutter border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-neon-cyan">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Anime Ongoing</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Daftar seluruh anime yang sedang tayang saat ini (Halaman {page})
            </p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <GridSkeleton count={12} />
      ) : error ? (
        <div className="p-8 rounded-3xl glass-card border-red-500/30 text-center space-y-4 max-w-md mx-auto my-12">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => loadPage(page)}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {list.map((anime) => (
              <AnimeCard key={anime.animeId || anime.title} anime={anime} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-4 pt-6 pb-4">
            <button
              onClick={() => loadPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass-card border border-white/10 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-cyan-500/40 hover:text-white transition-all flutter-button"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>

            <span className="text-xs font-bold px-4 py-2 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 shadow-neon-cyan">
              Halaman {page}
            </span>

            <button
              onClick={() => loadPage(page + 1)}
              disabled={loading || list.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass-card border border-white/10 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-cyan-500/40 hover:text-white transition-all flutter-button"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
