'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, RefreshCw, Search, ChevronRight, Layers, Flame, CheckCircle } from 'lucide-react';
import AnimeGlassCard from './AnimeGlassCard';
import { getOngoingAnime, getCompleteAnime, getSchedule } from '@/lib/clientApi';
import { AnimeListItem, ScheduleDay } from '@/lib/types';

export default function AnimeListView() {
  const [activeSubtab, setActiveSubtab] = useState<'ongoing' | 'complete' | 'schedule'>('ongoing');
  const [ongoingList, setOngoingList] = useState<AnimeListItem[]>([]);
  const [completeList, setCompleteList] = useState<AnimeListItem[]>([]);
  const [scheduleList, setScheduleList] = useState<ScheduleDay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('Semua');
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

  // Filter current list based on search query
  const displayedOngoing = ongoingList.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedComplete = completeList.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const daysList = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const displayedSchedule = scheduleList
    .filter((s) => selectedDay === 'Semua' || s.day.toLowerCase() === selectedDay.toLowerCase())
    .map((s) => ({
      ...s,
      animeList: (s.animeList || []).filter((a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header with Subtabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Subtab Pill Navigation */}
        <div className="glass-pill-container p-1 rounded-full inline-flex items-center shadow-lg border border-white/[0.08]">
          <button
            onClick={() => setActiveSubtab('ongoing')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all spring-press flex items-center gap-1.5 ${
              activeSubtab === 'ongoing'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Sedang Tayang</span>
          </button>
          <button
            onClick={() => setActiveSubtab('complete')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all spring-press flex items-center gap-1.5 ${
              activeSubtab === 'complete'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Anime Tamat</span>
          </button>
          <button
            onClick={() => setActiveSubtab('schedule')}
            className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all spring-press flex items-center gap-1.5 ${
              activeSubtab === 'schedule'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jadwal Rilis</span>
          </button>
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam katalog..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/[0.05] border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-500 outline-none"
          />
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs">Memuat katalog dari Sanka Vollerei...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-6 rounded-3xl card-frosted-obsidian border-red-500/30 text-center max-w-md mx-auto space-y-2">
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={() => setActiveSubtab(activeSubtab)}
            className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs spring-press"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Subtab 1: Ongoing Anime */}
      {!loading && activeSubtab === 'ongoing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {displayedOngoing.map((anime, i) => (
              <AnimeGlassCard key={anime.animeId || anime.title} anime={anime} index={i} />
            ))}
          </div>

          {displayedOngoing.length === 0 && (
            <div className="p-12 text-center card-frosted-obsidian rounded-3xl text-zinc-400 text-xs">
              Tidak ada judul anime yang cocok dengan "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Complete Anime */}
      {!loading && activeSubtab === 'complete' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {displayedComplete.map((anime, i) => (
              <AnimeGlassCard key={anime.animeId || anime.title} anime={anime} index={i} />
            ))}
          </div>

          {displayedComplete.length === 0 && (
            <div className="p-12 text-center card-frosted-obsidian rounded-3xl text-zinc-400 text-xs">
              Tidak ada anime tamat yang cocok dengan "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Schedule with Day Pills */}
      {!loading && activeSubtab === 'schedule' && (
        <div className="space-y-6">
          {/* Day Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {daysList.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all spring-press ${
                  selectedDay === day
                    ? 'bg-white text-black shadow-md'
                    : 'card-frosted-obsidian text-zinc-400 hover:text-white'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {displayedSchedule.map((group) => {
              if (!group.animeList || group.animeList.length === 0) return null;
              return (
                <div key={group.day} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h3 className="font-cinematic font-bold text-base text-white">
                      Hari {group.day}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {group.animeList.map((item, idx) => (
                      <Link
                        key={`${item.animeId}-${idx}`}
                        href={`/anime?id=${item.animeId}`}
                        className="p-3.5 rounded-2xl card-frosted-obsidian hover:border-white/20 transition-all spring-press flex flex-col justify-between space-y-2 group"
                      >
                        <h4 className="font-cinematic font-bold text-xs text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-0.5">
                          Buka Seri <ChevronRight className="w-3 h-3" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
