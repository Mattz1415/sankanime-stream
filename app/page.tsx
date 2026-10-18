'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, CheckCircle, ChevronRight, RefreshCw, Play, Clock, Sparkles } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';
import AnimeCard from '@/components/AnimeCard';
import { GridSkeleton, HeroSkeleton } from '@/components/LoadingSkeleton';
import { getHomeData } from '@/lib/clientApi';
import { getWatchHistory } from '@/lib/storage';
import { HomeData, WatchHistoryItem } from '@/lib/types';

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getHomeData();
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data dari server SankaVollerei');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setHistory(getWatchHistory());
  }, []);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Loading State */}
      {loading && (
        <div>
          <HeroSkeleton />
          <div className="space-y-4 mb-8">
            <div className="h-6 w-48 rounded-lg skeleton-shimmer" />
            <GridSkeleton count={6} />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-48 rounded-lg skeleton-shimmer" />
            <GridSkeleton count={6} />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-8 rounded-3xl glass-card border-red-500/30 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white">Gagal Menghubungkan ke API</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-neon-cyan transition-all flutter-button"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && data && (
        <>
          {/* Futuristic Hero Banner */}
          {data.ongoing?.animeList?.length > 0 && (
            <HeroBanner featuredList={data.ongoing.animeList} />
          )}

          {/* Resume Watching ("Lanjut Nonton") Section if history exists */}
          {history.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Lanjut Nonton</h2>
                    <p className="text-[11px] text-slate-400">Episode terakhir yang kamu tonton</p>
                  </div>
                </div>
                <Link
                  href="/saved"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
                >
                  Semua Riwayat <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {history.slice(0, 3).map((item) => (
                  <Link
                    key={item.episodeId}
                    href={`/watch/${item.episodeId}`}
                    className="flex items-center gap-3 p-3 rounded-2xl glass-card hover:border-pink-500/40 transition-all flutter-button group"
                  >
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900">
                      <img
                        src={item.poster}
                        alt={item.animeTitle}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider">
                        Terakhir Diputar
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{item.animeTitle}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.episodeTitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Section: Ongoing Anime */}
          {data.ongoing?.animeList?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-neon-cyan">
                    <Flame className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                      Anime Sedang Tayang
                    </h2>
                    <p className="text-xs text-slate-400">Episode baru rilis minggu ini</p>
                  </div>
                </div>

                <Link
                  href="/ongoing"
                  className="px-3.5 py-1.5 rounded-full bg-[#121824] hover:bg-[#1a2335] border border-white/10 hover:border-cyan-500/40 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all flutter-button"
                >
                  Lihat Semua
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {data.ongoing.animeList.slice(0, 12).map((anime) => (
                  <AnimeCard
                    key={anime.animeId || anime.title}
                    anime={anime}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section: Completed Anime */}
          {data.complete?.animeList?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-400 shadow-neon-purple">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                      Anime Tamat (Complete)
                    </h2>
                    <p className="text-xs text-slate-400">Siap maraton dari episode pertama hingga akhir</p>
                  </div>
                </div>

                <Link
                  href="/complete"
                  className="px-3.5 py-1.5 rounded-full bg-[#121824] hover:bg-[#1a2335] border border-white/10 hover:border-purple-500/40 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-all flutter-button"
                >
                  Lihat Semua
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {data.complete.animeList.slice(0, 12).map((anime) => (
                  <AnimeCard
                    key={anime.animeId || anime.title}
                    anime={anime}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
