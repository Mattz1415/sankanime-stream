'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import AnimeGlassCard from '@/components/AnimeGlassCard';
import FloatingGlassDock from '@/components/FloatingGlassDock';
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
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6 max-w-7xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
        Beranda
      </Link>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-fluent border border-white/10 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-cinematic font-black text-xl sm:text-2xl text-white">
              Anime Tamat (Completed)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Daftar anime yang sudah selesai tayang untuk maraton langsung (Halaman {page})
            </p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-white" />
          <p className="text-xs">Memuat anime tamat...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl glass-fluent border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-12">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => loadPage(page)}
            className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {list.map((anime) => (
              <AnimeGlassCard key={anime.animeId || anime.title} anime={anime} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-4 pt-6 pb-4">
            <button
              onClick={() => loadPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full glass-fluent border border-white/15 text-xs font-semibold text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>

            <span className="text-xs font-bold px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white">
              Halaman {page}
            </span>

            <button
              onClick={() => loadPage(page + 1)}
              disabled={loading || list.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full glass-fluent border border-white/15 text-xs font-semibold text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:text-white transition-all active:scale-95"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      <FloatingGlassDock activeTab="list" />
    </div>
  );
}
