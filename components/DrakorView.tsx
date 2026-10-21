'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Play,
  Star,
  Search,
  Sparkles,
  Tv,
  Heart,
  Calendar,
  X,
  Server,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  SlidersHorizontal,
  Compass,
  ArrowLeft,
  Film,
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
type DetailTab = 'episodes' | 'info';

function resolveDrakorTmdbId(item: DrakorItem): string | number {
  if (item.tmdbId && !isNaN(Number(item.tmdbId))) return item.tmdbId;
  const matchNum = item.id?.match(/\d+/);
  if (matchNum && matchNum[0].length >= 4) return matchNum[0];
  const curatedMatch = CURATED_DRAKOR_LIST.find(
    (c) => c.title.toLowerCase() === item.title.toLowerCase() || c.endpoint === item.endpoint
  );
  if (curatedMatch && curatedMatch.tmdbId) return curatedMatch.tmdbId;

  const TITLE_MAP: Record<string, number> = {
    'queen of tears': 215720,
    'lovely runner': 230923,
    'when the phone rings': 253905,
    'the judge from hell': 235577,
    'marry my husband': 221851,
    'moving': 126485,
    'the glory': 136283,
    'alchemy of souls': 135157,
    'twinkling watermelon': 212204,
    'revenant': 210702,
    'vincenzo': 117376,
    'crash landing on you': 94796,
    'business proposal': 154825,
    'a shop for killers': 215072,
    'sweet home': 96648,
    'squid game': 93405,
    'hospital playlist': 96102,
    'descendants of the sun': 65143,
    'goblin': 67915,
    'itaewon class': 96162,
    'all of us are dead': 99966,
    'weak hero': 200709,
    "death's game": 218230,
    'doctor slump': 222233,
    'my demon': 218539,
    'true beauty': 112888,
  };

  const lower = item.title.toLowerCase().trim();
  for (const [key, id] of Object.entries(TITLE_MAP)) {
    if (lower.includes(key)) return id;
  }
  return 215720;
}

export default function DrakorView() {
  const [activeTab, setActiveTab] = useState<DrakorTab>('ongoing');
  const [items, setItems] = useState<DrakorItem[]>(CURATED_DRAKOR_LIST);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Detail Sheet State
  const [selectedDrakor, setSelectedDrakor] = useState<DrakorItem | null>(null);
  const [detailData, setDetailData] = useState<DrakorDetail | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('episodes');

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
      setItems(results && results.length > 0 ? results : CURATED_DRAKOR_LIST);
    } catch {
      setItems(CURATED_DRAKOR_LIST);
    } finally {
      setIsSearching(false);
    }
  };

  // INSTANT (0-second) Synchronous Detail Opening - 100% immune to dark/blank screen bugs
  const handleOpenDetail = (item: DrakorItem) => {
    const targetTmdb = resolveDrakorTmdbId(item);
    let totalEps = 16;
    if (item.eps) {
      const match = item.eps.match(/\d+/);
      if (match) totalEps = Math.max(parseInt(match[0], 10), 8);
    }

    const generatedEpisodes: DrakorEpisode[] = Array.from({ length: totalEps }, (_, i) => {
      const epNum = i + 1;
      return {
        episodeNumber: epNum,
        title: `Episode ${epNum}`,
        streamUrl: `https://vidsrc.icu/embed/tv/${targetTmdb}/1/${epNum}`,
        servers: getDrakorStreamServers(targetTmdb, 1, epNum),
      };
    });

    const immediateDetail: DrakorDetail = {
      id: String(targetTmdb),
      title: item.title,
      alterTitle: item.alterTitle || '',
      thumbnail: item.thumbnail || item.poster || '',
      synopsis:
        item.synopsis ||
        'Tonton serial drama Korea terbaik dengan takarir bahasa Indonesia kualitas jernih full HD.',
      rating: item.rating || '8.5',
      status: item.status || 'Ongoing',
      year: item.year || '2024',
      genres: item.genres && item.genres.length > 0 ? item.genres : ['Romance', 'Drama', 'K-Drama'],
      totalEpisodes: totalEps,
      episodes: generatedEpisodes,
    };

    // Synchronous immediate assignment - 0 delay
    setSelectedDrakor(item);
    setDetailData(immediateDetail);
    setActiveDetailTab('episodes');

    // Background asynchronous enrichment without blocking user
    fetchDrakorDetail(item.id || item.endpoint || item.title)
      .then((enhanced) => {
        if (enhanced && enhanced.episodes && enhanced.episodes.length > 0) {
          setDetailData((prev) =>
            prev ? { ...prev, ...enhanced, episodes: enhanced.episodes } : enhanced
          );
        }
      })
      .catch(() => {});
  };

  // Open Player Modal directly
  const handlePlayEpisode = (detail: DrakorDetail, epNumber: number) => {
    setPlayingDrakor({ detail, currentEpNumber: epNumber });
    setSelectedServerIndex(0);
  };

  // Current Server Stream URLs for active episode
  const activeEpisodeServers = useMemo(() => {
    if (!playingDrakor) return [];
    const targetTmdb = resolveDrakorTmdbId({
      id: playingDrakor.detail.id,
      title: playingDrakor.detail.title,
      endpoint: '',
      thumbnail: '',
    });
    return getDrakorStreamServers(targetTmdb, 1, playingDrakor.currentEpNumber);
  }, [playingDrakor]);

  const currentStreamUrl =
    activeEpisodeServers[selectedServerIndex]?.url || activeEpisodeServers[0]?.url || '';

  // Featured Hero Item
  const heroDrakor = items[0] || CURATED_DRAKOR_LIST[0];

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* =========================================================================
          FLUTTER HERO SPOTLIGHT CARD (LIQUID GLASS + SQUIRCLE 36)
         ========================================================================= */}
      {heroDrakor && !searchQuery && (
        <div className="relative w-full rounded-[36px] overflow-hidden liquid-glass-surface p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
          {/* Dual Specular Edge Reflection */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-0 bg-[#141414] pointer-events-none" />

          {/* Left Poster */}
          <div className="relative z-10 w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-[28px] overflow-hidden shadow-2xl border border-white/20 group">
            <SmartImage
              src={heroDrakor.thumbnail}
              alt={heroDrakor.title}
              title={heroDrakor.title}
              type="anime"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-zinc-200 font-medium text-[10px] tracking-wide">
                HOT K-DRAMA
              </span>
              <span className="flex items-center gap-1 font-bold text-white text-xs px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                {heroDrakor.rating}
              </span>
            </div>
          </div>

          {/* Right Content */}
          <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full liquid-glass-pill text-zinc-200 text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-white text-white" />
              <span>Drama Korea Sub Indo</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-cinematic text-white tracking-tight leading-tight">
              {heroDrakor.title}
            </h1>

            {heroDrakor.alterTitle && (
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                {heroDrakor.alterTitle}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-zinc-300">
              <span className="px-2.5 py-1 rounded-full liquid-glass-pill text-white font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-white text-white" /> {heroDrakor.rating} TMDB
              </span>
              <span className="px-2.5 py-1 rounded-full liquid-glass-pill text-white font-mono">
                {heroDrakor.year}
              </span>
              <span className="px-2.5 py-1 rounded-full liquid-glass-pill text-zinc-300">
                {heroDrakor.eps || '16 Episode'}
              </span>
              <span className="px-2.5 py-1 rounded-full liquid-glass-pill text-zinc-200 font-bold">
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
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm hover:bg-zinc-200 shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Nonton Episode 1</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDetail(heroDrakor)}
                className="px-5 py-2.5 rounded-full liquid-glass-pill hover:border-white/40 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Info className="w-4 h-4" />
                <span>Detail & Daftar Episode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CUPERTINO LIQUID GLASS SLIDING SEGMENTED CONTROL & SEARCH BAR
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Cupertino Sliding Segmented Control */}
        <div className="flex items-center p-1.5 rounded-full liquid-glass-convex w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('ongoing');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === 'ongoing' && !searchQuery
                ? 'bg-[#2C2C2E] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Sedang Tayang</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('popular');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === 'popular' && !searchQuery
                ? 'bg-[#2C2C2E] text-white shadow-sm'
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
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === 'completed' && !searchQuery
                ? 'bg-[#2C2C2E] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Tamat (Completed)</span>
          </button>
        </div>

        {/* Drakor Search Pill */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul Drakor (cth: Queen of Tears)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-full liquid-glass-surface text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadDrakorList(activeTab);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* =========================================================================
          FLUTTER MATERIAL 3 SQUIRCLE CARDS GRID (SQUIRCLE 28)
         ========================================================================= */}
      {loading || isSearching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-[28px] oled-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {items.map((item, index) => {
            const stagger = `stagger-${(index % 12) + 1}`;
            return (
              <div
                key={item.id || index}
                onClick={() => handleOpenDetail(item)}
                className={`group relative flex flex-col aspect-[2/3] rounded-[24px] bg-[#121214] border border-white/10 hover:border-white/20 overflow-hidden cursor-pointer shadow-xl active:scale-[0.96] transition-transform duration-150 ${stagger}`}
              >
                {/* 1.5px Specular Top Highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none" />

                {/* Poster Cover Container (Aspect 2/3) */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#050508]">
                  <SmartImage
                    src={item.thumbnail}
                    title={item.title}
                    alt={item.title}
                    type="anime"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                  />

                  {/* Deep Liquid Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                  {/* Top-Left Episode Badge (Liquid Glass Pill) */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full liquid-glass-pill text-[10px] font-bold text-white shadow-md">
                      {item.eps || (item.status === 'Ongoing' ? 'Ongoing' : 'Full Ep')}
                    </span>
                  </div>

                  {/* Top-Right Star Rating Badge */}
                  {item.rating && (
                    <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full liquid-glass-pill text-[10px] font-black text-white shadow-md">
                        <Star className="w-3 h-3 fill-white text-white" />
                        {item.rating}
                      </span>
                    </div>
                  )}

                  {/* Floating Water-Lens Play Button on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 scale-90 group-hover:scale-100">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Release Year Badge at Bottom */}
                  {item.year && (
                    <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-medium text-zinc-300 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-zinc-300" />
                      {item.year}
                    </div>
                  )}
                </div>

                {/* Title & Metadata Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-1 bg-[#06060c]/90 border-t border-white/[0.06]">
                  <h4 className="font-cinematic font-bold text-xs sm:text-sm text-white group-hover:text-white line-clamp-2 leading-snug tracking-tight transition-colors">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span className="truncate text-zinc-400 text-[10px]">
                      {item.alterTitle || item.genres?.[0] || 'K-Drama Sub Indo'}
                    </span>
                    <span className="text-[10px] text-zinc-300 font-semibold shrink-0 ml-1">
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
          FLUTTER DRAGGABLE SCROLLABLE SHEET / MODAL BOTTOMSHEET (DETAIL VIEW)
          100% Instant Display - No blank screen, always includes Close/Back button
         ========================================================================= */}
      {selectedDrakor && detailData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col flutter-sheet sm:rounded-[34px] sm:border sm:border-white/20 shadow-2xl overflow-hidden animate-slide-up">
            {/* Top Drag Handle for Flutter Sheet */}
            <div className="pt-3 pb-1 w-full flex justify-center shrink-0">
              <div className="flutter-drag-handle" />
            </div>

            {/* Top Bar with Always-Visible Tutup / Kembali Button */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedDrakor(null);
                  setDetailData(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-bold text-zinc-200 hover:text-white active:scale-95 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
                Detail Drama Korea
              </span>

              <button
                type="button"
                onClick={() => {
                  setSelectedDrakor(null);
                  setDetailData(null);
                }}
                className="w-8 h-8 rounded-full liquid-glass-pill flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              {/* Header Showcase with Poster & Meta */}
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <div className="w-36 sm:w-44 shrink-0 aspect-[2/3] rounded-[24px] overflow-hidden border border-white/20 shadow-2xl">
                  <SmartImage
                    src={detailData.thumbnail}
                    alt={detailData.title}
                    title={detailData.title}
                    type="anime"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full liquid-glass-pill text-zinc-200 text-[10px] font-bold">
                    <Heart className="w-3 h-3 fill-white" />
                    <span>{detailData.status}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black font-cinematic text-white leading-tight">
                    {detailData.title}
                  </h2>

                  {detailData.alterTitle && (
                    <p className="text-xs text-zinc-400 font-medium">{detailData.alterTitle}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-white font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white text-white" /> {detailData.rating}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-white font-mono">
                      {detailData.year}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-zinc-300">
                      Total {detailData.totalEpisodes} Episode
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                    {detailData.genres?.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-200 text-[10px] font-medium border border-white/[0.1]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Primary CTA Button: Putar Episode 1 Langsung */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handlePlayEpisode(detailData, 1)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Putar Episode 1 Sekarang</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cupertino SegmentedButton Tabs: Episodes vs Synopsis */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center p-1 rounded-full liquid-glass-convex max-w-sm mx-auto sm:mx-0">
                  <button
                    type="button"
                    onClick={() => setActiveDetailTab('episodes')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeDetailTab === 'episodes'
                        ? 'liquid-glass-pill text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Daftar Episode ({detailData.episodes?.length || detailData.totalEpisodes})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDetailTab('info')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeDetailTab === 'info'
                        ? 'liquid-glass-pill text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sinopsis Lengkap
                  </button>
                </div>

                {activeDetailTab === 'episodes' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400">
                      Pilih episode di bawah untuk langsung memutar di Nexus Player:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {detailData.episodes?.map((ep) => (
                        <button
                          key={ep.episodeNumber}
                          type="button"
                          onClick={() => handlePlayEpisode(detailData, Number(ep.episodeNumber))}
                          className="p-3 rounded-[20px] liquid-glass-surface hover:border-zinc-500 text-center transition-all active:scale-95 group shadow-sm flex flex-col items-center justify-center gap-0.5"
                        >
                          <div className="text-xs font-bold text-white group-hover:text-white">
                            {ep.title}
                          </div>
                          <div className="text-[10px] text-zinc-300 font-semibold flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>Putar HD</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-[24px] liquid-glass-surface space-y-2">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      Ringkasan Cerita
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {detailData.synopsis}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          NEXUS PLAYER VIDEO STREAMING MODAL (DRAKOR)
          Clean Unobstructed Canvas with 5 Live Active Servers
         ========================================================================= */}
      {playingDrakor && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl animate-fade-in">
          {/* Top Player Header with Always-Visible Close Button */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#07070b]/95 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlayingDrakor(null)}
                className="w-8 h-8 rounded-full liquid-glass-pill flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                  {playingDrakor.detail.title} - Episode {playingDrakor.currentEpNumber}
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {playingDrakor.detail.alterTitle || 'Streaming Player HD'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCinemaMode(!cinemaMode)}
                className="px-3 py-1.5 rounded-full text-xs font-bold liquid-glass-pill text-zinc-300 hover:text-white active:scale-95 flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cinemaMode ? 'Terang' : 'Bioskop'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPlayingDrakor(null)}
                className="w-8 h-8 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-zinc-200 border border-[#3A3A3C] flex items-center justify-center active:scale-95 transition-all"
                title="Tutup Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Player Canvas */}
          <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="relative w-full aspect-video rounded-[28px] overflow-hidden bg-black border border-white/[0.12] shadow-2xl flex items-center justify-center">
              <iframe
                key={`${currentStreamUrl}-${playingDrakor.currentEpNumber}-${selectedServerIndex}`}
                src={currentStreamUrl}
                className="w-full h-full border-0"
                referrerPolicy="no-referrer"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`${playingDrakor.detail.title} - Episode ${playingDrakor.currentEpNumber}`}
              />
            </div>

            {/* Server Switcher Pill Bar */}
            <div className="mt-4 p-4 rounded-[24px] liquid-glass-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-300" />
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
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C] shadow-sm'
                          : 'liquid-glass-pill text-zinc-300 hover:text-white'
                      }`}
                    >
                      {server.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Episode Navigation & Jump Drawer */}
            <div className="mt-3 p-4 rounded-[24px] liquid-glass-surface flex flex-wrap items-center justify-between gap-3">
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
                  className="px-3.5 py-1.5 rounded-full liquid-glass-pill disabled:opacity-40 text-xs font-bold text-white active:scale-95 transition-all flex items-center gap-1"
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
                  className="px-3.5 py-1.5 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-medium text-zinc-200 border border-[#3A3A3C] active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>Episode Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Jump Episode Bubbles */}
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
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C]'
                          : 'liquid-glass-pill text-zinc-400 hover:text-white'
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
