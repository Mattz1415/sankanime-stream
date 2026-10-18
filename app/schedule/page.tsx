'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Tv, ChevronRight, Play } from 'lucide-react';
import { getSchedule } from '@/lib/clientApi';
import { ScheduleDay } from '@/lib/types';

export default function SchedulePage() {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSched() {
      try {
        setLoading(true);
        const data = await getSchedule();
        setScheduleData(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat jadwal rilis anime');
      } finally {
        setLoading(false);
      }
    }
    fetchSched();
  }, []);

  const currentSchedule = scheduleData[selectedDayIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl glass-flutter border border-cyan-500/20 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-neon-cyan">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Jadwal Rilis Anime</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Waktu tayang episode baru setiap harinya (WIB)
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-10 w-24 rounded-2xl skeleton-shimmer flex-shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl glass-card border-red-500/30 text-center space-y-4 max-w-md mx-auto my-12">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Day Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {scheduleData.map((item, idx) => {
              const isActive = selectedDayIndex === idx;
              return (
                <button
                  key={item.day || idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 flutter-button ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan border border-cyan-400/50 scale-105'
                      : 'glass-card text-slate-400 hover:text-white border-white/5 hover:border-white/20'
                  }`}
                >
                  {item.day}
                  <span className="ml-1.5 opacity-70 text-[10px]">
                    ({item.anime_list?.length || item.animeList?.length || 0})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Anime List for Selected Day */}
          {currentSchedule && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Hari {currentSchedule.day}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(currentSchedule.anime_list || currentSchedule.animeList || []).map(
                  (anime: any, i: number) => {
                    const slug = anime.slug || anime.animeId || anime.url?.replace('/anime/anime/', '') || '';
                    return (
                      <Link
                        key={slug || i}
                        href={`/anime/${slug}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl glass-card hover:border-cyan-500/40 group transition-all flutter-button"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {anime.poster && (
                            <img
                              src={anime.poster}
                              alt={anime.title}
                              className="w-12 h-14 rounded-xl object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h3 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 truncate">
                              {anime.title}
                            </h3>
                            <span className="text-[10px] text-cyan-400/80 font-medium">
                              Rilis Tiap {currentSchedule.day}
                            </span>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-300 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
