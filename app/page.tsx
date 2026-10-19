'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Film,
  Calendar,
  Compass,
  Sparkles,
  ChevronDown,
  Dice5,
  Search,
  Zap,
  Star,
  Trophy,
  Crown,
  Layers
} from 'lucide-react';
import FluentHeader from '@/components/FluentHeader';
import HeroCarousel from '@/components/HeroCarousel';
import LanjutNontonCard from '@/components/LanjutNontonCard';
import AnimeGlassCard from '@/components/AnimeGlassCard';
import FloatingGlassDock, { DockTab } from '@/components/FloatingGlassDock';
import AnimeListView from '@/components/AnimeListView';
import HistoryBookmarksView from '@/components/HistoryBookmarksView';
import AnimeAiChat from '@/components/AnimeAiChat';
import UserProfileView from '@/components/UserProfileView';
import CommandPaletteModal from '@/components/CommandPaletteModal';
import AnimeGachaModal from '@/components/AnimeGachaModal';
import AnimeStoriesBar from '@/components/AnimeStoriesBar';
import TopTenShelf from '@/components/TopTenShelf';
import ReleaseCountdownBanner from '@/components/ReleaseCountdownBanner';
import { getHomeData, getSchedule } from '@/lib/clientApi';
import { getWatchHistory } from '@/lib/storage';
import { HomeData, ScheduleDay, WatchHistoryItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

const GENRE_LIST = [
  { name: 'Action', color: '#ef4444' },
  { name: 'Adventure', color: '#f59e0b' },
  { name: 'Comedy', color: '#10b981' },
  { name: 'Fantasy', color: '#a855f7' },
  { name: 'Isekai', color: '#00f0ff' },
  { name: 'Romance', color: '#f43f5e' },
  { name: 'Sci-Fi', color: '#38bdf8' },
  { name: 'Slice of Life', color: '#34d399' },
  { name: 'Supernatural', color: '#c084fc' },
  { name: 'Mystery', color: '#6366f1' },
  { name: 'Drama', color: '#fb923c' },
  { name: 'Shounen', color: '#facc15' },
];

const DAYS = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'Anime' | 'Komik' | 'Donghua'>('Anime');
  const [activeTab, setActiveTab] = useState<DockTab>('jelajah');
  const [selectedDay, setSelectedDay] = useState<string>('Semua');
  const [ongoingCount, setOngoingCount] = useState(12);
  const [completedCount, setCompletedCount] = useState(12);

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGachaOpen, setIsGachaOpen] = useState(false);

  const { accentColor } = useTheme();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resHome, resSchedule] = await Promise.all([
        getHomeData(),
        getSchedule().catch(() => []),
      ]);
      setData(resHome);
      setSchedule(resSchedule);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memuat data dari server Sanka Vollerei');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setHistory(getWatchHistory());
  }, []);

  const refreshHistory = () => {
    setHistory(getWatchHistory());
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-nexus-tab', activeTab);
    }
  }, [activeTab]);

  // Filter schedule based on selected day
  const filteredScheduleList = React.useMemo(() => {
    if (!schedule.length) return [];
    if (selectedDay === 'Semua') {
      return schedule.flatMap((s) =>
        (s.animeList || []).map((a) => ({ ...a, day: s.day }))
      ).slice(0, 12);
    }
    const dayData = schedule.find((s) => s.day.toLowerCase() === selectedDay.toLowerCase());
    return (dayData?.animeList || []).map((a) => ({ ...a, day: dayData?.day }));
  }, [schedule, selectedDay]);

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-zinc-100 selection:bg-white selection:text-black">
      {/* Sticky Glass Header */}
      <FluentHeader
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        onOpenProfile={() => setActiveTab('profil')}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 safe-dock-padding space-y-8">
        {/* If Active Category is not Anime (e.g. Komik or Donghua), show contextual banner */}
        {activeCategory !== 'Anime' && (
          <div className="p-8 rounded-3xl card-frosted-obsidian border border-white/[0.08] text-center space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)] animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white">
              {activeCategory === 'Komik' ? <BookOpen className="w-7 h-7" /> : <Film className="w-7 h-7" />}
            </div>
            <h2 className="font-cinematic font-bold text-xl text-white">
              Katalog {activeCategory} Segera Hadir
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Fitur integrasi pembaca {activeCategory} sedang dikembangkan. Nikmati ribuan judul anime subtitle Indonesia melalui tab Anime!
            </p>
            <button
              onClick={() => setActiveCategory('Anime')}
              className="px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md spring-press"
            >
              Kembali ke Anime
            </button>
          </div>
        )}

        {/* Tab 1: JELAJAH (Main Home Feed) */}
        {activeTab === 'jelajah' && activeCategory === 'Anime' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Anime Stories / Quick Preview Circles */}
            {data?.ongoing?.animeList && data.ongoing.animeList.length > 0 && (
              <AnimeStoriesBar animeList={data.ongoing.animeList} />
            )}

            {/* Nexus Holographic Bento Hub */}
            <div className="holographic-bento-hub p-4 sm:p-5 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.98)]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                {/* Left: Hologram Branding & Sparkles */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-white shadow-lg">
                      <Sparkles className="w-4 h-4 fill-white" />
                    </span>
                    <h3 className="font-cinematic font-black text-sm sm:text-base text-white tracking-wide uppercase">
                      Nexus Holographic Hub
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 uppercase">
                      PRO OLED
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-md">
                    Putar takdir anime acak dengan animasi gacha slot 3D atau telusuri instan dengan filter genre.
                  </p>
                </div>

                {/* Right: Gacha Summon & Command Palette CTAs */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Holographic Gacha Summon Button */}
                  <button
                    id="gacha-summon-btn"
                    type="button"
                    onClick={() => setIsGachaOpen(true)}
                    className="flex-1 md:flex-initial px-5 py-2.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:shadow-[0_0_35px_rgba(251,191,36,0.8)] transition-all spring-press flex items-center justify-center gap-2"
                  >
                    <Dice5 className="w-4 h-4 fill-black" />
                    <span>Acak Anime (Gacha Summon)</span>
                  </button>

                  {/* Command Palette Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all spring-press flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Filter Cepat (Ctrl+K)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State with OLED Shimmer */}
            {loading && (
              <div className="space-y-6">
                <div className="w-full h-[460px] sm:h-[530px] rounded-3xl oled-shimmer" />
                <div className="w-full h-32 rounded-3xl oled-shimmer" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl oled-shimmer" />
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 rounded-3xl card-frosted-obsidian border border-red-500/30 text-center space-y-4 max-w-lg mx-auto my-12 animate-fade-in-up">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <h2 className="font-cinematic font-bold text-lg text-white">
                  Gagal Menghubungkan ke API Sanka Vollerei
                </h2>
                <p className="text-xs text-zinc-400">{error}</p>
                <button
                  onClick={loadData}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 shadow-md spring-press"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Content Feed */}
            {!loading && data && (
              <>
                {/* Hero Carousel Besar Full-Bleed Showcase */}
                {data.ongoing?.animeList?.length > 0 && (
                  <HeroCarousel featuredList={data.ongoing.animeList} />
                )}

                {/* Top 10 Anime Minggu Ini (Giant Metal Numbers) */}
                {data.ongoing?.animeList?.length > 0 && (
                  <TopTenShelf animeList={data.ongoing.animeList} />
                )}

                {/* Komponen Kartu Kaca Transparan "LANJUT NONTON" 3D */}
                {(history.length > 0 || data.ongoing?.animeList?.[0]) && (
                  <LanjutNontonCard
                    historyItem={history.length > 0 ? history[0] : null}
                    fallbackAnime={data.ongoing?.animeList?.[0] || null}
                    onItemDeleted={refreshHistory}
                  />
                )}

                {/* Live Countdown Jadwal Rilis Hari Ini */}
                {schedule.length > 0 && (
                  <ReleaseCountdownBanner schedule={schedule} />
                )}

                {/* Eksplorasi Genre Interaktif */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-white" />
                    <h3 className="font-cinematic font-bold text-sm sm:text-base text-white tracking-wider uppercase">
                      Eksplorasi Genre Favorit
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {GENRE_LIST.map((genre) => (
                      <Link
                        key={genre.name}
                        href={`/search?q=${encodeURIComponent(genre.name)}`}
                        className="px-4 py-2 rounded-2xl card-frosted-obsidian hover:border-white/20 text-xs font-semibold text-zinc-300 hover:text-white flex-shrink-0 flex items-center gap-2 spring-press group"
                      >
                        <span
                          className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                          style={{ backgroundColor: genre.color }}
                        />
                        <span>{genre.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* Seksi: Jadwal Rilis Mingguan dengan Filter Hari */}
                {schedule.length > 0 && (
                  <section className="p-5 sm:p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/10 text-white">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <h2 className="font-cinematic font-bold text-base sm:text-lg text-white">
                            Jadwal Rilis Mingguan
                          </h2>
                          <p className="text-xs text-zinc-400">Jadwal episode baru anime subtitle Indonesia</p>
                        </div>
                      </div>

                      {/* Day Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {DAYS.map((day) => {
                          const isSelected = selectedDay === day;
                          return (
                            <button
                              key={day}
                              onClick={() => setSelectedDay(day)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all spring-press ${
                                isSelected
                                  ? 'bg-white text-black shadow-md'
                                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Schedule Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {filteredScheduleList.map((item: any, idx: number) => (
                        <Link
                          key={`${item.animeId}-${idx}`}
                          href={`/anime?id=${item.animeId}`}
                          className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/20 transition-all spring-press flex flex-col justify-between space-y-2 group"
                        >
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-1.5 inline-block">
                              {item.day || 'Tayang'}
                            </span>
                            <h4 className="font-cinematic font-bold text-xs text-zinc-200 group-hover:text-white line-clamp-2 leading-tight">
                              {item.title}
                            </h4>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 group-hover:text-cyan-400">
                            Lihat Jadwal <ChevronRight className="w-3 h-3" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section: Anime Sedang Tayang (Ongoing) */}
                {data.ongoing?.animeList?.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-white">
                          <Flame className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <h2 className="font-cinematic font-bold text-lg sm:text-xl text-white">
                            Anime Sedang Tayang
                          </h2>
                          <p className="text-xs text-zinc-400">Rilis episode mingguan terhangat</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('list')}
                        className="px-4 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white spring-press flex items-center gap-1"
                      >
                        Katalog Lengkap <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                      {data.ongoing.animeList.slice(0, ongoingCount).map((anime, i) => (
                        <AnimeGlassCard
                          key={anime.animeId || anime.title}
                          anime={anime}
                          index={i}
                        />
                      ))}
                    </div>

                    {/* Tombol Muat Lebih Banyak */}
                    {ongoingCount < data.ongoing.animeList.length && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setOngoingCount((prev) => prev + 6)}
                          className="px-6 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-white transition-all spring-press inline-flex items-center gap-1.5"
                        >
                          <span>Muat Lebih Banyak Anime Tayang (+6)</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* Section: Anime Tamat (Completed) */}
                {data.complete?.animeList?.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-white">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <h2 className="font-cinematic font-bold text-lg sm:text-xl text-white">
                            Anime Tamat (Completed)
                          </h2>
                          <p className="text-xs text-zinc-400">Siap maraton langsung tanpa menunggu</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('list')}
                        className="px-4 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white spring-press flex items-center gap-1"
                      >
                        Katalog Lengkap <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                      {data.complete.animeList.slice(0, completedCount).map((anime, i) => (
                        <AnimeGlassCard
                          key={anime.animeId || anime.title}
                          anime={anime}
                          index={i}
                        />
                      ))}
                    </div>

                    {/* Tombol Muat Lebih Banyak */}
                    {completedCount < data.complete.animeList.length && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setCompletedCount((prev) => prev + 6)}
                          className="px-6 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-white transition-all spring-press inline-flex items-center gap-1.5"
                        >
                          <span>Muat Lebih Banyak Anime Tamat (+6)</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: LIST (Directory) */}
        {activeTab === 'list' && <AnimeListView />}

        {/* Tab 3: RIWAYAT (History & Watchlist) */}
        {activeTab === 'riwayat' && <HistoryBookmarksView />}

        {/* Tab 4: CHAT (Community & AI) */}
        {activeTab === 'chat' && <AnimeAiChat />}

        {/* Tab 5: PROFIL (User Profile) */}
        {activeTab === 'profil' && <UserProfileView />}
      </main>

      {/* Floating Glass Dock (Bottom Navigation) */}
      <FloatingGlassDock
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Cinematic 3-Stage Anime Gacha Summon Modal */}
      <AnimeGachaModal
        isOpen={isGachaOpen}
        onClose={() => setIsGachaOpen(false)}
        initialPool={[...(data?.ongoing?.animeList || []), ...(data?.complete?.animeList || [])]}
      />
    </div>
  );
}
