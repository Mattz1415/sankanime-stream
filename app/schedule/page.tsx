'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, Play, RefreshCw } from 'lucide-react';
import { getSchedule } from '@/lib/clientApi';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import SmartImage from '@/components/SmartImage';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';

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

        // Auto select current day in Indonesia
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = days[new Date().getDay()];
        const todayIndex = data.findIndex(
          (d: any) => d.day?.toLowerCase() === todayName.toLowerCase()
        );
        if (todayIndex !== -1) {
          setSelectedDayIndex(todayIndex);
        }
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
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold spring-press"
      >
        <ChevronLeft className="w-4 h-4" />
        Beranda
      </Link>

      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl glass-obsidian border border-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.95)] relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white">
            <CalendarDays className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="font-cinematic font-black text-xl sm:text-2xl text-white">
              Jadwal Rilis Anime
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Waktu penayangan episode baru setiap minggunya (WIB)
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-white" />
          <p className="text-xs">Memuat jadwal rilis...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl glass-obsidian border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-12">
          <p className="text-sm text-red-300">{error}</p>
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
                  className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 spring-press ${
                    isActive
                      ? 'bg-white text-black shadow-lg scale-105'
                      : 'glass-obsidian text-zinc-400 hover:text-white border-white/[0.08]'
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
              <h2 className="font-cinematic font-bold text-base text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Hari {currentSchedule.day}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(currentSchedule.anime_list || currentSchedule.animeList || []).map(
                  (anime: any, i: number) => {
                    const slug = anime.slug || anime.animeId || anime.url?.replace('/anime/anime/', '') || '';
                    return (
                      <Link
                        key={slug || i}
                        href={`/anime?id=${slug}`}
                        className={`flex items-center justify-between p-3.5 rounded-2xl glass-obsidian-card group spring-press border border-white/[0.06] animate-fade-in-up stagger-${(i % 12) + 1}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <SmartImage
                            item={anime}
                            src={anime.poster}
                            title={anime.title}
                            alt={anime.title}
                            type="anime"
                            className="w-12 h-14 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="font-cinematic font-bold text-xs text-white group-hover:text-zinc-200 truncate">
                              {anime.title}
                            </h3>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              Rilis Tiap {currentSchedule.day}
                            </span>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
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

      <FloatingGlassDock activeTab="list" />
    </div>
  );
}
