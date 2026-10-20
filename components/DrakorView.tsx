'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Play,
  Star,
  Search,
  Sparkles,
  RefreshCw,
  Film,
  Tv,
  Heart,
  Calendar,
  X,
  Server,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  Layers,
} from 'lucide-react';
import { DrakorItem, DrakorDetail, DrakorEpisode } from '@/lib/types';
import {
  fetchDrakorOngoing,
  fetchDrakorPopular,
  fetchDrakorCompleted,
  fetchDrakorDetail,
  searchDrakor,
  getDrakorStreamServers,
  CURATED_DRAKOR_LIST,
} from '@/lib/mediaApi';
import SmartImage from './SmartImage';

type DrakorTab = 'ongoing' | 'popular' | 'completed';

export default function DrakorView() {
  const [activeTab, setActiveTab] = useState<DrakorTab>('ongoing');
  const [items, setItems] = useState<DrakorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Detail Modal State
  const [selectedDrakor, setSelectedDrakor] = useState<DrakorItem | null>(null);
  const [detailData, setDetailData] = useState<DrakorDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Player Modal State
  const [playingDrakor, setPlayingDrakor] = useState<{
    detail: DrakorDetail;
    currentEpNumber: number;
  } | null>(null);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);

  // Load list by tab
  const loadDrakorList = async (tab: DrakorTab) => {
    try {
      setLoading(true);
      let res: DrakorItem[] = [];
      if (tab === 'ongoing') {
        res = await fetchDrakorOngoing(1);
      } else if (tab === 'popular') {
        res = await fetchDrakorPopular(1);
      } else {
        res = await fetchDrakorCompleted(1);
      }
      setItems(res && res.length > 0 ? res : CURATED_DRAKOR_LIST);
    } catch {
      setItems(CURATED_DRAKOR_LIST);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      loadDrakorList(activeTab);
    }
  }, [activeTab]);

  // Handle Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadDrakorList(activeTab);
      return;
    }
    try {
      setIsSearching(true);
      const results = await searchDrakor(searchQuery);
      setItems(results);
    } catch {
      setItems(CURATED_DRAKOR_LIST);
    } finally {
      setIsSearching(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = async (item: DrakorItem) => {
    setSelectedDrakor(item);
    setLoadingDetail(true);
    try {
      const detail = await fetchDrakorDetail(item.id || item.endpoint || item.title);
      setDetailData(detail);
    } catch {
      // Fallback detail
      setDetailData({
        id: item.id,
        title: item.title,
        alterTitle: item.alterTitle,
        thumbnail: item.thumbnail,
        synopsis: item.synopsis || 'Drama Korea sub Indo berkualitas tinggi.',
        rating: item.rating || '8.5',
        status: item.status || 'Ongoing',
        year: item.year || '2024',
        genres: item.genres || ['Romance', 'Drama'],
        totalEpisodes: 16,
        episodes: Array.from({ length: 16 }, (_, i) => ({
          episodeNumber: i + 1,
          title: `Episode ${i + 1}`,
          streamUrl: `https://vidsrc.icu/embed/tv/${item.tmdbId || '215720'}/1/${i + 1}`,
          servers: getDrakorStreamServers(item.tmdbId || '215720', 1, i + 1),
        })),
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Player Modal directly for an episode
  const handlePlayEpisode = (detail: DrakorDetail, epNumber: number) => {
    setPlayingDrakor({ detail, currentEpNumber: epNumber });
    setSelectedServerIndex(0);
  };

  // Current Server Stream URLs for active episode
  const activeEpisodeServers = useMemo(() => {
    if (!playingDrakor) return [];
    const targetTmdb = playingDrakor.detail.id.replace(/^drakor-/, '') || '215720';
    return getDrakorStreamServers(targetTmdb, 1, playingDrakor.currentEpNumber);
  }, [playingDrakor]);

  const currentStreamUrl =
    activeEpisodeServers[selectedServerIndex]?.url || activeEpisodeServers[0]?.url || '';

  // Featured Hero Item
  const heroDrakor = items[0] || CURATED_DRAKOR_LIST[0];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Hero Showcase Banner */}
      {heroDrakor && !searchQuery && (
        <div className="relative w-full rounded-3xl overflow-hidden glass-obsidian-card border border-white/[0.08] shadow-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
          {/* Glowing Ambient Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-[#050508]/90 to-[#000000] z-0 pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Poster */}
          <div className="relative z-10 w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20 group">
            <SmartImage
              src={heroDrakor.thumbnail}
              alt={heroDrakor.title}
              title={heroDrakor.title}
              type="anime"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded-full bg-pink-500/80 text-white font-black text-[10px] tracking-wide">
                HOT K-DRAMA
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-300 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                {heroDrakor.rating}
              </span>
            </div>
          </div>

          {/* Right Hero Meta */}
          <div className="relative z-10 flex-1 space-y-3.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
              <span>Drakor Subtitle Indonesia</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-cinematic text-white tracking-tight leading-tight">
              {heroDrakor.title}
            </h1>

            {heroDrakor.alterTitle && (
              <p className="text-xs sm:text-sm text-pink-200/70 font-medium">
                {heroDrakor.alterTitle}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-zinc-300">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                ★ {heroDrakor.rating} TMDB
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white font-mono">
                {heroDrakor.year}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-zinc-300">
                {heroDrakor.eps || '16 Episode'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-950/60 text-pink-300 border border-pink-500/30 font-bold">
                {heroDrakor.status}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed max-w-2xl">
              {heroDrakor.synopsis}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                type="button"
                onClick={() => handleOpenDetail(heroDrakor)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold text-xs sm:text-sm hover:opacity-95 shadow-lg shadow-pink-500/25 spring-press flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Nonton Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDetail(heroDrakor)}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 spring-press flex items-center gap-1.5"
              >
                <Info className="w-4 h-4" />
                <span>Detail & Episode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Apple Spatial Style Tab Switcher */}
        <div className="flex items-center p-1 rounded-full bg-[#09090f]/90 border border-white/[0.08] backdrop-blur-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('ongoing');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 spring-press flex items-center justify-center gap-1.5 ${
              activeTab === 'ongoing' && !searchQuery
                ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/25 border border-pink-400/40 text-pink-300 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sedang Tayang</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('popular');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 spring-press flex items-center justify-center gap-1.5 ${
              activeTab === 'popular' && !searchQuery
                ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/25 border border-pink-400/40 text-pink-300 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Terpopuler</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('completed');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 spring-press flex items-center justify-center gap-1.5 ${
              activeTab === 'completed' && !searchQuery
                ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/25 border border-pink-400/40 text-pink-300 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Tamat (Completed)</span>
          </button>
        </div>

        {/* Drakor Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Drakor (cth: Queen of Tears, Vincenzo)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-full bg-[#09090f]/90 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 backdrop-blur-md transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadDrakorList(activeTab);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Grid of Photocard Cards */}
      {loading || isSearching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl oled-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((item, index) => {
            const stagger = `stagger-${(index % 12) + 1}`;
            return (
              <div
                key={item.id || index}
                onClick={() => handleOpenDetail(item)}
                className={`group relative flex flex-col rounded-2xl glass-obsidian-card overflow-hidden border border-white/[0.08] hover:border-pink-400/40 spring-press cursor-pointer shadow-xl animate-fade-in-up ${stagger}`}
              >
                {/* 1px Specular Top Highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20 pointer-events-none" />

                {/* Poster Cover Container (Aspect 2/3) */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#030306]">
                  <SmartImage
                    src={item.thumbnail}
                    title={item.title}
                    alt={item.title}
                    type="anime"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />

                  {/* OLED Deep Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                  {/* Top-Left Episode Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-lg">
                      {item.eps || (item.status === 'Ongoing' ? 'Ongoing' : 'Full Ep')}
                    </span>
                  </div>

                  {/* Top-Right Gold Star Rating Badge */}
                  {item.rating && (
                    <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-amber-400/40 text-[10px] font-black text-amber-300 shadow-lg">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {item.rating}
                      </span>
                    </div>
                  )}

                  {/* Floating Play Button on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.8)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 scale-90 group-hover:scale-100">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Release Year Badge at Bottom */}
                  {item.year && (
                    <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-white/10 text-[9px] font-medium text-zinc-300 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-pink-400" />
                      {item.year}
                    </div>
                  )}
                </div>

                {/* Title & Metadata Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#030306]/95 border-t border-white/[0.04]">
                  <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-pink-300 line-clamp-2 leading-snug tracking-tight transition-colors">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span className="truncate text-zinc-500 text-[10px]">
                      {item.alterTitle || item.genres?.[0] || 'K-Drama Sub Indo'}
                    </span>
                    <span className="text-[10px] text-pink-400 font-bold shrink-0 ml-1">
                      {item.status || 'HD'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          DETAIL MODAL
         ========================================================================= */}
      {selectedDrakor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#08080d] border border-white/[0.1] shadow-2xl p-5 sm:p-8 space-y-6">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedDrakor(null);
                setDetailData(null);
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-all spring-press z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {loadingDetail ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
                <p className="text-sm text-zinc-400 font-medium">Memuat detail Drakor...</p>
              </div>
            ) : detailData ? (
              <>
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  <div className="w-36 sm:w-44 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                    <SmartImage
                      src={detailData.thumbnail}
                      alt={detailData.title}
                      title={detailData.title}
                      type="anime"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                      <Heart className="w-3 h-3 fill-pink-400" />
                      <span>{detailData.status}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black font-cinematic text-white leading-tight">
                      {detailData.title}
                    </h2>

                    {detailData.alterTitle && (
                      <p className="text-xs text-pink-200/60 font-medium">{detailData.alterTitle}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                        ★ {detailData.rating}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono">
                        {detailData.year}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-zinc-300">
                        Total {detailData.totalEpisodes} Episode
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                      {detailData.genres?.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 text-[10px] font-medium border border-white/[0.08]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed pt-2 line-clamp-4">
                      {detailData.synopsis}
                    </p>
                  </div>
                </div>

                {/* Episode Selector Section */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-pink-400 fill-pink-400" />
                      <span>Daftar Episode Tersedia ({detailData.episodes?.length || 0})</span>
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">Sub Indo HD</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                    {detailData.episodes?.map((ep) => (
                      <button
                        key={ep.episodeNumber}
                        type="button"
                        onClick={() => handlePlayEpisode(detailData, Number(ep.episodeNumber))}
                        className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-pink-500/20 hover:border-pink-500/50 border border-white/[0.08] text-center transition-all spring-press group"
                      >
                        <div className="text-xs font-bold text-white group-hover:text-pink-300">
                          {ep.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium">Putar HD</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* =========================================================================
          NEXUS PLAYER VIDEO STREAMING MODAL (DRAKOR)
         ========================================================================= */}
      {playingDrakor && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl animate-fade-in">
          {/* Top Player Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#07070b]/90">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                  {playingDrakor.detail.title} - Episode {playingDrakor.currentEpNumber}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {playingDrakor.detail.alterTitle || 'NEXUS Spatial Streaming Engine'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCinemaMode(!cinemaMode)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-zinc-300 border border-white/10 spring-press flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cinemaMode ? 'Terang' : 'Bioskop'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPlayingDrakor(null)}
                className="w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/40 flex items-center justify-center spring-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Player Container */}
          <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl flex items-center justify-center">
              <iframe
                key={`${currentStreamUrl}-${playingDrakor.currentEpNumber}-${selectedServerIndex}`}
                src={currentStreamUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`${playingDrakor.detail.title} - Episode ${playingDrakor.currentEpNumber}`}
              />
            </div>

            {/* Server Switcher Bar */}
            <div className="mt-4 p-4 rounded-2xl glass-obsidian-card border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-white">Ganti Sumber Server:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeEpisodeServers.map((server, idx) => {
                  const isSelected = selectedServerIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedServerIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all spring-press ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30 scale-[1.02]'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/[0.08]'
                      }`}
                    >
                      {server.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Episode Navigation & Selector */}
            <div className="mt-3 p-4 rounded-2xl glass-obsidian-card border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={playingDrakor.currentEpNumber <= 1}
                  onClick={() => {
                    if (playingDrakor.currentEpNumber > 1) {
                      setPlayingDrakor({
                        ...playingDrakor,
                        currentEpNumber: playingDrakor.currentEpNumber - 1,
                      });
                      setSelectedServerIndex(0);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 text-xs font-bold text-white border border-white/[0.08] spring-press flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Episode Sebelumnya</span>
                </button>

                <button
                  type="button"
                  disabled={
                    playingDrakor.currentEpNumber >= Number(playingDrakor.detail.totalEpisodes)
                  }
                  onClick={() => {
                    if (
                      playingDrakor.currentEpNumber < Number(playingDrakor.detail.totalEpisodes)
                    ) {
                      setPlayingDrakor({
                        ...playingDrakor,
                        currentEpNumber: playingDrakor.currentEpNumber + 1,
                      });
                      setSelectedServerIndex(0);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-xs font-bold text-pink-300 border border-pink-500/40 spring-press flex items-center gap-1"
                >
                  <span>Episode Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Jump List */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-md py-1 no-scrollbar">
                {playingDrakor.detail.episodes?.map((ep) => {
                  const isCurrent = Number(ep.episodeNumber) === playingDrakor.currentEpNumber;
                  return (
                    <button
                      key={ep.episodeNumber}
                      type="button"
                      onClick={() => {
                        setPlayingDrakor({
                          ...playingDrakor,
                          currentEpNumber: Number(ep.episodeNumber),
                        });
                        setSelectedServerIndex(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-white/[0.06] text-zinc-400 hover:text-white'
                      }`}
                    >
                      Ep {ep.episodeNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
