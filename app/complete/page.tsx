'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';
import { GridSkeleton } from '@/components/LoadingSkeleton';
import { getCompleteAnime } from '@/lib/clientApi';
import { AnimeListItem } from '@/lib/types';

export default function CompletePage() {
  const [list, setList] = useState<AnimeListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCompleteAnime(p);
      setList(res.animeList || []);
      setPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Gagal memuat anime tamat');
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
      <div className="p-6 sm:p-8 rounded-3xl glass-flutter border border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-400 shadow-neon-purple">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Anime Tamat (Completed)</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Daftar anime yang sudah selesai tayang untuk maraton (Halaman {page})
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
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass-card border border-white/10 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-purple-500/40 hover:text-white transition-all flutter-button"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>

            <span className="text-xs font-bold px-4 py-2 rounded-2xl bg-purple-950/80 border border-purple-500/30 text-purple-300 shadow-neon-purple">
              Halaman {page}
            </span>

            <button
              onClick={() => loadPage(page + 1)}
              disabled={loading || list.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl glass-card border border-white/10 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:border-purple-500/40 hover:text-white transition-all flutter-button"
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
