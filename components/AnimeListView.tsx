'use client';

import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle, Calendar, RefreshCw } from 'lucide-react';
import AnimeGlassCard from './AnimeGlassCard';
import { getOngoingAnime, getCompleteAnime, getSchedule } from '@/lib/clientApi';
import { AnimeListItem, ScheduleDay } from '@/lib/types';

export default function AnimeListView() {
  const [activeSubtab, setActiveSubtab] = useState<'ongoing' | 'complete' | 'schedule'>('ongoing');
  const [ongoingList, setOngoingList] = useState<AnimeListItem[]>([]);
  const [completeList, setCompleteList] = useState<AnimeListItem[]>([]);
  const [scheduleList, setScheduleList] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubtabData() {
      setLoading(true);
      setError(null);
      try {
        if (activeSubtab === 'ongoing' && ongoingList.length === 0) {
          const res = await getOngoingAnime(1);
          setOngoingList(res.animeList);
        } else if (activeSubtab === 'complete' && completeList.length === 0) {
          const res = await getCompleteAnime(1);
          setCompleteList(res.animeList);
        } else if (activeSubtab === 'schedule' && scheduleList.length === 0) {
          const res = await getSchedule();
          setScheduleList(res);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    }

    loadSubtabData();
  }, [activeSubtab]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Subtab Pill Navigation */}
      <div className="flex items-center justify-center">
        <div className="glass-pill-container p-1 rounded-full inline-flex items-center shadow-lg">
          <button
            onClick={() => setActiveSubtab('ongoing')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeSubtab === 'ongoing'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sedang Tayang
          </button>
          <button
            onClick={() => setActiveSubtab('complete')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeSubtab === 'complete'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Anime Tamat
          </button>
          <button
            onClick={() => setActiveSubtab('schedule')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeSubtab === 'schedule'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Jadwal Rilis
          </button>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-white" />
          <p className="text-xs">Memuat katalog dari Sanka Vollerei...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-6 rounded-3xl glass-fluent border-red-500/30 text-center max-w-md mx-auto space-y-2">
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={() => setActiveSubtab(activeSubtab)}
            className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Ongoing Anime List */}
      {!loading && activeSubtab === 'ongoing' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {ongoingList.map((anime) => (
            <AnimeGlassCard key={anime.animeId || anime.title} anime={anime} />
          ))}
        </div>
      )}

      {/* Completed Anime List */}
      {!loading && activeSubtab === 'complete' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {completeList.map((anime) => (
            <AnimeGlassCard key={anime.animeId || anime.title} anime={anime} />
          ))}
        </div>
      )}

      {/* Schedule List */}
      {!loading && activeSubtab === 'schedule' && (
        <div className="space-y-6">
          {scheduleList.map((dayItem, idx) => (
            <div key={idx} className="p-5 sm:p-6 rounded-3xl glass-fluent border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white" />
                <h3 className="font-cinematic font-bold text-base sm:text-lg text-white">
                  Hari {dayItem.day}
                </h3>
                <span className="text-xs text-zinc-400">
                  ({dayItem.animeList?.length || 0} Judul)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(dayItem.animeList || []).map((anime, aIdx) => (
                  <AnimeGlassCard
                    key={aIdx}
                    anime={{
                      title: anime.title,
                      animeId: anime.animeId,
                      poster: anime.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
                      releaseDay: dayItem.day,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
