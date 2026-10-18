'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, CheckCircle, ChevronRight, RefreshCw, BookOpen, Film } from 'lucide-react';
import FluentHeader from '@/components/FluentHeader';
import HeroCarousel from '@/components/HeroCarousel';
import LanjutNontonCard from '@/components/LanjutNontonCard';
import AnimeGlassCard from '@/components/AnimeGlassCard';
import FloatingGlassDock, { DockTab } from '@/components/FloatingGlassDock';
import AnimeListView from '@/components/AnimeListView';
import HistoryBookmarksView from '@/components/HistoryBookmarksView';
import AnimeAiChat from '@/components/AnimeAiChat';
import UserProfileView from '@/components/UserProfileView';
import PixelFightingBanner from '@/components/PixelFightingBanner';
import CodingOnboardingModal from '@/components/CodingOnboardingModal';
import RezeAiCompanionModal from '@/components/RezeAiCompanionModal';
import { getHomeData } from '@/lib/clientApi';
import { getWatchHistory } from '@/lib/storage';
import { HomeData, WatchHistoryItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'Anime' | 'Komik' | 'Donghua'>('Anime');
  const [activeTab, setActiveTab] = useState<DockTab>('jelajah');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { accentColor } = useTheme();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getHomeData();
      setData(res);
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

    // Check if onboarding was previously shown
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('kpanime_onboarding_done');
      if (!seen) {
        setShowOnboarding(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#020205] text-zinc-100 selection:bg-white selection:text-black">
      {/* Top Header with Pill Switcher, Replay Intro, Search & Avatar */}
      <FluentHeader
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        onOpenProfile={() => setActiveTab('profil')}
        onReplayIntro={() => setShowOnboarding(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 safe-dock-padding space-y-8">
        {/* If Active Category is not Anime (e.g. Komik or Donghua), show contextual banner */}
        {activeCategory !== 'Anime' && (
          <div className="p-8 rounded-3xl glass-obsidian border border-white/[0.06] text-center space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)] animate-fade-in-up">
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
            {/* Pixel-Art Fighting Minigame Banner (Zabuza vs Kepong) */}
            <PixelFightingBanner />

            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                <div className="w-full h-[420px] sm:h-[490px] rounded-3xl oled-shimmer" />
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
              <div className="p-8 rounded-3xl glass-obsidian border border-red-500/30 text-center space-y-4 max-w-lg mx-auto my-12 animate-fade-in-up">
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

            {/* Content */}
            {!loading && data && (
              <>
                {/* Hero Carousel Besar Bergradasi Gelap */}
                {data.ongoing?.animeList?.length > 0 && (
                  <HeroCarousel featuredList={data.ongoing.animeList} />
                )}

                {/* Komponen Kartu Kaca Transparan "LANJUT NONTON" */}
                <LanjutNontonCard
                  historyItem={history.length > 0 ? history[0] : null}
                  fallbackAnime={data.ongoing?.animeList?.[0] || null}
                />

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
                        Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                      {data.ongoing.animeList.slice(0, 12).map((anime, i) => (
                        <AnimeGlassCard
                          key={anime.animeId || anime.title}
                          anime={anime}
                          index={i}
                        />
                      ))}
                    </div>
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
                        Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                      {data.complete.animeList.slice(0, 12).map((anime, i) => (
                        <AnimeGlassCard
                          key={anime.animeId || anime.title}
                          anime={anime}
                          index={i}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: LIST (Directory) */}
        {activeTab === 'list' && <AnimeListView />}

        {/* Tab 3: RIWAYAT (History & Bookmarks) */}
        {activeTab === 'riwayat' && <HistoryBookmarksView />}

        {/* Tab 4: CHAT (Global Chat Room & Nexus AI) */}
        {activeTab === 'chat' && <AnimeAiChat />}

        {/* Tab 5: PROFIL (User Profile - Kepiskepsi) */}
        {activeTab === 'profil' && <UserProfileView />}
      </main>

      {/* Floating Reze AI Companion Modal (Bottom-Left) */}
      <RezeAiCompanionModal />

      {/* Floating Glass Dock (Bottom Navigation: Jelajah, List, Riwayat, Chat, Profil) */}
      <FloatingGlassDock
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Interactive Coding Onboarding Modal (kpanime.py) */}
      <CodingOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
