'use client';

import React, { useEffect, useState } from 'react';
import {
  Play,
  Film,
  Sparkles,
  RefreshCw,
  Clock,
  Star,
  CheckCircle2,
  Tv,
  X,
  Server,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { fetchDonghuaHome, fetchDonghuaDetail, fetchDonghuaEpisode } from '@/lib/mediaApi';
import { DonghuaItem, DonghuaDetail, DonghuaEpisodeStream } from '@/lib/types';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';
import { useTheme } from '@/lib/themeContext';

export default function DonghuaView() {
  const [latestList, setLatestList] = useState<DonghuaItem[]>([]);
  const [completedList, setCompletedList] = useState<DonghuaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');

  // Detail Modal
  const [selectedDonghua, setSelectedDonghua] = useState<DonghuaItem | null>(null);
  const [detailData, setDetailData] = useState<DonghuaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Player Modal
  const [activeEpisodeSlug, setActiveEpisodeSlug] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<DonghuaEpisodeStream | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [currentServerUrl, setCurrentServerUrl] = useState<string>('');
  const [lightsOff, setLightsOff] = useState(false);

  const { accentColor } = useTheme();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchDonghuaHome();
        setLatestList(res.latest);
        setCompletedList(res.completed);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleOpenDetail = async (item: DonghuaItem) => {
    setSelectedDonghua(item);
    setDetailLoading(true);
    try {
      const res = await fetchDonghuaDetail(item.slug);
      setDetailData(res);
    } catch {
      // Fallback detail
      setDetailData({
        title: item.title,
        poster: item.poster,
        rating: item.rating || '8.8',
        status: item.status || 'Ongoing',
        synopsis: 'Donghua animasi 3D spektakuler dengan kisah kultivasi dunia persilatan.',
        genres: ['Action', 'Fantasy', 'Cultivation', 'Donghua'],
        episodesList: Array.from({ length: 12 }, (_, i) => ({
          title: `Episode ${i + 1}`,
          slug: `${item.slug}-episode-${i + 1}`,
        })),
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePlayEpisode = async (episodeSlug: string) => {
    setActiveEpisodeSlug(episodeSlug);
    setStreamLoading(true);
    try {
      const res = await fetchDonghuaEpisode(episodeSlug);
      setStreamData(res);
      setCurrentServerUrl(res.mainUrl || res.servers[0]?.url || '');
    } catch {
      setStreamData({
        episodeTitle: episodeSlug.replace(/-/g, ' '),
        mainUrl: 'https://ok.ru/videoembed/16206205946546',
        servers: [{ name: 'Okru Player', url: 'https://ok.ru/videoembed/16206205946546' }],
      });
      setCurrentServerUrl('https://ok.ru/videoembed/16206205946546');
    } finally {
      setStreamLoading(false);
    }
  };

  const handleClosePlayer = () => {
    setActiveEpisodeSlug(null);
    setStreamData(null);
    setCurrentServerUrl('');
    // Cleanup any media elements
    if (typeof window !== 'undefined') {
      document.querySelectorAll('audio, video').forEach((el) => {
        try {
          (el as HTMLMediaElement).pause();
        } catch {}
      });
    }
  };

  const currentList = activeTab === 'ongoing' ? latestList : completedList;
  const heroItem = latestList[0];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Hero Featured Donghua */}
      {heroItem && (
        <div className="relative rounded-3xl overflow-hidden card-frosted-obsidian border border-white/[0.08] p-6 sm:p-10 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <SmartImage
              item={heroItem}
              src={heroItem.poster}
              title={heroItem.title}
              alt={heroItem.title}
              type="donghua"
              className="w-full h-full object-cover opacity-20 blur-md scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] text-zinc-200 text-xs font-medium">
              <Tv className="w-3.5 h-3.5 text-white" />
              <span>DONGHUA SPOTLIGHT POPULER</span>
            </div>

            <h1 className="font-cinematic font-black text-2xl sm:text-4xl text-white tracking-wide leading-tight">
              {heroItem.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-300">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-400 font-mono">
                ★ {heroItem.rating || '9.4'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white">
                {heroItem.currentEpisode || 'Episode Baru'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#1C1C1E] text-zinc-300 border border-[#2E2E30]">
                Sub Indo HD
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
              Saksikan aksi pertarungan animasi 3D spektakuler kultivasi persilatan dengan grafis memukau tanpa iklan.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenDetail(heroItem)}
                className="px-6 py-3 rounded-2xl bg-cyan-400 text-black font-extrabold text-xs sm:text-sm hover:bg-cyan-300 shadow-lg shadow-cyan-400/30 spring-press flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Nonton Donghua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Switcher: Ongoing vs Completed */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ongoing')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all spring-press ${
              activeTab === 'ongoing'
                ? 'bg-white text-black shadow-md shadow-white/20'
                : 'card-frosted-obsidian text-zinc-400 hover:text-white'
            }`}
          >
            🔥 Rilis Terbaru ({latestList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all spring-press ${
              activeTab === 'completed'
                ? 'bg-white text-black shadow-md shadow-white/20'
                : 'card-frosted-obsidian text-zinc-400 hover:text-white'
            }`}
          >
            🏆 Donghua Tamat ({completedList.length})
          </button>
        </div>

        <div className="text-xs text-zinc-400 hidden sm:flex items-center gap-1.5 font-medium">
          <Tv className="w-4 h-4 text-zinc-400" />
          <span>Multi-Server Player</span>
        </div>
      </div>

      {/* Grid of Donghua Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-zinc-400 mx-auto drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />
          <p className="text-xs text-zinc-400 font-semibold">Mengambil daftar Donghua dari server...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {currentList.map((item, idx) => (
            <div
              key={item.slug || idx}
              onClick={() => handleOpenDetail(item)}
              className="group cursor-pointer rounded-[28px] overflow-hidden liquid-glass-card shadow-xl active:scale-[0.96] transition-all flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                <SmartImage
                  item={item}
                  src={item.poster}
                  title={item.title}
                  alt={item.title}
                  type="donghua"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-bold text-zinc-200">
                    {item.currentEpisode || (item.status === 'Completed' ? 'Tamat' : 'Ongoing')}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none flex items-center gap-1 px-2.5 py-0.5 rounded-full liquid-glass-pill text-[10px] font-mono text-amber-300 font-bold">
                  <Star className="w-3 h-3 fill-amber-300" />
                  <span>{item.rating || '8.8'}</span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                <h4 className="font-bold text-xs text-zinc-200 group-hover:text-zinc-200 line-clamp-2 transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>Donghua 3D</span>
                  <span className="text-zinc-400 font-semibold group-hover:underline">Putar ▶</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Donghua Detail Modal */}
      {selectedDonghua && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl card-frosted-obsidian border border-white/[0.12] p-6 shadow-2xl space-y-5 my-8">
            <button
              onClick={() => setSelectedDonghua(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center spring-press z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !detailData ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-400">Memuat detail & daftar episode...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-5">
                  <SmartImage
                    item={detailData}
                    src={detailData.poster}
                    title={detailData.title}
                    alt={detailData.title}
                    type="donghua"
                    className="w-36 h-48 object-cover rounded-2xl shadow-xl shrink-0 mx-auto sm:mx-0 border border-white/10"
                  />
                  <div className="space-y-2 min-w-0">
                    <h3 className="font-cinematic font-black text-xl text-white leading-tight">
                      {detailData.title}
                    </h3>
                    {detailData.alterTitle && (
                      <p className="text-xs text-zinc-400 italic">{detailData.alterTitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-400/30">
                        ★ {detailData.rating}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[11px] font-semibold">
                        {detailData.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#1C1C1E] text-zinc-300 text-[11px] border border-[#2E2E30]">
                        {detailData.network || 'Tencent / Bilibili'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {detailData.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-zinc-300 border border-white/[0.06]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-3 pt-1 leading-relaxed">
                      {detailData.synopsis}
                    </p>
                  </div>
                </div>

                {/* Episode List Section */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-cinematic font-bold text-xs uppercase tracking-wider text-zinc-300">
                      Pilih Episode ({detailData.episodesList.length})
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-semibold">Sub Indo Ready</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                    {detailData.episodesList.map((ep) => (
                      <button
                        key={ep.slug}
                        type="button"
                        onClick={() => {
                          setSelectedDonghua(null);
                          handlePlayEpisode(ep.slug);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-400/40 text-xs font-bold text-zinc-200 hover:text-zinc-200 text-left truncate spring-press transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{ep.title}</span>
                        <Play className="w-3 h-3 text-zinc-400 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dedicated Nexus Donghua Player Modal */}
      {activeEpisodeSlug && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col font-sans animate-fade-in">
          {/* Top Player Header */}
          <div className="px-4 py-3 bg-[#050508]/98 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              <span className="font-cinematic font-bold text-white text-xs sm:text-sm truncate">
                NEXUS DONGHUA PLAYER
              </span>
              <span className="text-[11px] text-zinc-400 truncate max-w-[150px] sm:max-w-md">
                {streamData?.episodeTitle || activeEpisodeSlug.replace(/-/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLightsOff(!lightsOff)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all spring-press flex items-center gap-1.5 ${
                  lightsOff
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-white/10 text-zinc-300 hover:text-white border-white/10'
                }`}
              >
                {lightsOff ? <Sun className="w-3.5 h-3.5 fill-black" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{lightsOff ? 'Terang' : 'Bioskop'}</span>
              </button>

              <button
                type="button"
                onClick={handleClosePlayer}
                className="w-8 h-8 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-zinc-300 border border-[#3A3A3C] flex items-center justify-center spring-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Player Canvas */}
          <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center p-2 sm:p-4">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl flex items-center justify-center">
              {streamLoading || !currentServerUrl ? (
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-400 font-semibold">Menghubungkan ke Server Streaming...</p>
                </div>
              ) : (
                <iframe
                  key={currentServerUrl}
                  src={currentServerUrl}
                  className="w-full h-full border-0"
                  referrerPolicy="no-referrer"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title="Nexus Donghua Stream"
                />
              )}
            </div>

            {/* Server Switcher */}
            {streamData && streamData.servers && streamData.servers.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl card-frosted-obsidian border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold text-white">Ganti Sumber Server:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {streamData.servers.map((s, idx) => {
                    const isSelected = currentServerUrl === s.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentServerUrl(s.url)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all spring-press ${
                          isSelected
                            ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C]'
                            : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08]'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
