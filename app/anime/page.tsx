'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  Star,
  Calendar,
  Clock,
  Layers,
  Bookmark,
  BookmarkCheck,
  Share2,
  ChevronLeft,
  Search,
  CheckCircle2,
  Film,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  Check,
  Sparkles,
  Info,
  Tv,
  MessageSquareQuote,
  Flame,
  Building2,
  Hash
} from 'lucide-react';
import { getAnimeDetail, searchAnime } from '@/lib/clientApi';
import {
  isAnimeBookmarked,
  getAnimeBookmark,
  saveBookmarkWithCategory,
  deleteBookmark,
  getWatchHistory
} from '@/lib/storage';
import { AnimeDetail, AnimeListItem, WatchlistCategory } from '@/lib/types';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import { useTheme } from '@/lib/themeContext';
import AnimeReviewSection from '@/components/AnimeReviewSection';
import AnimeGlassCard from '@/components/AnimeGlassCard';
import SmartImage from '@/components/SmartImage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';

const WATCHLIST_CATEGORIES: WatchlistCategory[] = [
  'Sedang Ditonton',
  'Ingin Ditonton',
  'Selesai',
  'Favorit',
];

type DetailTab = 'episodes' | 'info' | 'similar' | 'reviews';

function AnimeDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animeId = searchParams.get('id') || '';
  const { accentColor } = useTheme();

  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedCategory, setBookmarkedCategory] = useState<WatchlistCategory | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('episodes');

  // Episode controls
  const [searchEps, setSearchEps] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedBatchRange, setSelectedBatchRange] = useState<string>('Semua');
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  // Similar anime recommendations
  const [similarAnime, setSimilarAnime] = useState<AnimeListItem[]>([]);

  useEffect(() => {
    if (!animeId) {
      setLoading(false);
      setError('ID anime tidak valid');
      return;
    }

    async function loadDetail() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAnimeDetail(animeId);
        setDetail(data);

        const currentBm = getAnimeBookmark(animeId);
        if (currentBm) {
          setBookmarkedCategory(currentBm.category || 'Favorit');
        } else {
          setBookmarkedCategory(null);
        }

        // Get watched episodes
        const history = getWatchHistory();
        const watched = history
          .filter((h) => h.animeId === animeId)
          .map((h) => h.episodeId);
        setWatchedEpisodes(watched);

        // Fetch similar anime based on first genre
        if (data.genreList && data.genreList.length > 0) {
          const firstGenre = data.genreList[0].title;
          searchAnime(firstGenre).then((res) => {
            setSimilarAnime(res.filter((a) => a.animeId !== animeId).slice(0, 6));
          }).catch(() => {});
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail anime');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [animeId]);

  const handleSelectCategory = (cat: WatchlistCategory) => {
    if (!detail) return;
    if (bookmarkedCategory === cat) {
      deleteBookmark(animeId);
      setBookmarkedCategory(null);
    } else {
      saveBookmarkWithCategory(
        {
          animeId,
          title: detail.title,
          poster: detail.poster,
          score: detail.score,
          status: detail.status,
          genres: detail.genreList?.map((g) => g.title),
        },
        cat
      );
      setBookmarkedCategory(cat);
    }
    setShowCategoryDropdown(false);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: detail?.title,
        text: `Nonton anime ${detail?.title} gratis subtitle Indonesia di NexusAnime`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Tautan disalin ke clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8 animate-fade-in-up">
        <div className="w-full h-80 rounded-3xl oled-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-64 rounded-2xl oled-shimmer" />
          <div className="md:col-span-3 space-y-4">
            <div className="h-8 w-3/4 rounded-xl oled-shimmer" />
            <div className="h-20 w-full rounded-xl oled-shimmer" />
            <div className="h-10 w-1/2 rounded-full oled-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-3xl card-frosted-obsidian border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-16 animate-fade-in-up">
        <h2 className="font-cinematic font-bold text-lg text-white">Gagal Memuat Anime</h2>
        <p className="text-xs text-zinc-400">{error || 'Data anime tidak ditemukan'}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md spring-press"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Calculate episode batch groups (e.g., 1-25, 26-50, etc.)
  const totalEps = detail.episodeList?.length || 0;
  const batchOptions = ['Semua'];
  if (totalEps > 25) {
    const batchesCount = Math.ceil(totalEps / 25);
    for (let b = 0; b < batchesCount; b++) {
      const start = b * 25 + 1;
      const end = Math.min((b + 1) * 25, totalEps);
      batchOptions.push(`${start} - ${end}`);
    }
  }

  // Filter episodes by search and batch
  const filteredEpisodes = (detail.episodeList || [])
    .filter((ep) => {
      if (searchEps.trim() && !ep.title.toLowerCase().includes(searchEps.toLowerCase()) && !ep.eps.toString().includes(searchEps)) {
        return false;
      }
      if (selectedBatchRange !== 'Semua') {
        const [minStr, maxStr] = selectedBatchRange.split(' - ');
        const epNum = typeof ep.eps === 'number' ? ep.eps : parseInt(String(ep.eps)) || 0;
        if (epNum < parseInt(minStr) || epNum > parseInt(maxStr)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const numA = typeof a.eps === 'number' ? a.eps : parseInt(String(a.eps)) || 0;
      const numB = typeof b.eps === 'number' ? b.eps : parseInt(String(b.eps)) || 0;
      return sortOrder === 'desc' ? numB - numA : numA - numB;
    });

  const synopsisText = detail.synopsis?.paragraphs?.join('\n\n') || 'Sinopsis belum tersedia.';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-32 animate-fade-in-up relative font-sans">
      {/* Parallax Header Backdrop Poster with Deep OLED Vignette */}
      <div className="relative w-full h-[320px] sm:h-[400px] rounded-3xl overflow-hidden glass-obsidian border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.98)]">
        <SmartImage
          item={detail}
          src={detail.poster}
          title={detail.title}
          alt={detail.title}
          type="anime"
          className="w-full h-full object-cover object-center filter blur-md brightness-[0.55] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 via-transparent to-[#000000]/40" />

        {/* Back Link Top Left */}
        <div className="absolute top-4 left-4 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-zinc-300 hover:text-white text-xs font-semibold spring-press"
          >
            <ChevronLeft className="w-4 h-4" />
            Beranda
          </Link>
        </div>

        {/* Share Button Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/15 text-white spring-press shadow-lg"
            title="Bagikan Anime"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Backdrop Bottom Title Summary */}
        <div className="absolute bottom-6 left-6 right-6 z-20 hidden sm:block">
          <span className="px-2.5 py-0.5 rounded-full bg-[#2C2C2E] text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
            {detail.status || 'Ongoing'}
          </span>
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-white mt-1 drop-shadow-lg">
            {detail.title}
          </h1>
        </div>
      </div>

      {/* Main Details Grid: Left Poster Card & Right Meta/CTAs (Flutter Sheet Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-16 sm:-mt-24 relative z-30 px-2 sm:px-0">
        {/* Poster Card */}
        <div className="flex flex-col items-center sm:items-start space-y-3">
          <div className="relative w-44 sm:w-full aspect-[3/4] rounded-2xl overflow-hidden card-frosted-obsidian border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.98)] group">
            <SmartImage
              item={detail}
              src={detail.poster}
              title={detail.title}
              alt={detail.title}
              type="anime"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {detail.score && (
              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                <span className="text-xs font-black text-white">{detail.score}</span>
              </div>
            )}
          </div>
        </div>

        {/* Anime Information Header & Quick Action Buttons */}
        <div className="md:col-span-3 space-y-4">
          <div className="space-y-1">
            <h1 className="font-sans font-black text-2xl sm:text-3xl text-white block sm:hidden">
              {detail.title}
            </h1>
            {detail.japanese && (
              <p className="text-xs text-zinc-400 italic font-medium">{detail.japanese}</p>
            )}
          </div>

          {/* Quick Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            {detail.type && (
              <span className="px-3 py-1 rounded-full card-frosted-obsidian text-xs font-semibold text-zinc-300 border border-white/10">
                {detail.type}
              </span>
            )}
            {detail.duration && (
              <span className="px-3 py-1 rounded-full card-frosted-obsidian text-xs font-semibold text-zinc-300 border border-white/10 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" /> {detail.duration}
              </span>
            )}
            {detail.episodes && (
              <span className="px-3 py-1 rounded-full card-frosted-obsidian text-xs font-semibold text-zinc-300 border border-white/10 flex items-center gap-1">
                <Film className="w-3 h-3 text-zinc-400" /> {detail.episodes} Episode
              </span>
            )}
            {detail.studios && (
              <span className="px-3 py-1 rounded-full card-frosted-obsidian text-xs font-semibold text-zinc-300 border border-white/10 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-zinc-400" /> {detail.studios}
              </span>
            )}
          </div>

          {/* Genre Badges */}
          {detail.genreList && detail.genreList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {detail.genreList.map((g) => (
                <Link
                  key={g.genreId || g.title}
                  href={`/search?q=${encodeURIComponent(g.title)}`}
                  className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] hover:border-white/20 text-xs font-medium text-zinc-300 hover:text-white transition-all spring-press"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {detail.episodeList && detail.episodeList.length > 0 ? (
              <Link
                href={`/watch?id=${detail.episodeList[0].episodeId}`}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-zinc-200 shadow-[0_0_25px_rgba(255,255,255,0.35)] spring-press"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Mulai Nonton Ep 1</span>
              </Link>
            ) : null}

            {/* Watchlist Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-xl border text-xs sm:text-sm font-semibold spring-press transition-all ${
                  bookmarkedCategory
                    ? 'bg-[#2C2C2E] border-white/20 text-white shadow-lg'
                    : 'bg-[#121214] hover:bg-[#1C1C1E] border-white/10 text-white'
                }`}
              >
                {bookmarkedCategory ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-white" />
                    <span>{bookmarkedCategory}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>+ Simpan Watchlist</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </button>

              {showCategoryDropdown && (
                <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-[#121214] border border-white/15 p-2 shadow-2xl z-50 text-xs space-y-1">
                  {WATCHLIST_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                        bookmarkedCategory === cat
                          ? 'bg-[#2C2C2E] text-white font-bold shadow-sm'
                          : 'hover:bg-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span>{cat}</span>
                      {bookmarkedCategory === cat && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Information Tab Switcher (Flutter Cupertino Segmented Control Style) */}
      <div className="h-12 p-1 rounded-full bg-[#121214] border border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-lg">
        <button
          onClick={() => setActiveTab('episodes')}
          className={`flex-1 min-w-[120px] h-10 px-3 rounded-full text-xs font-semibold transition-all spring-press flex items-center justify-center gap-1.5 ${
            activeTab === 'episodes'
              ? 'bg-[#2C2C2E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Daftar Episode ({totalEps})</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 min-w-[120px] h-10 px-3 rounded-full text-xs font-semibold transition-all spring-press flex items-center justify-center gap-1.5 ${
            activeTab === 'info'
              ? 'bg-[#2C2C2E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Detail & Sinopsis</span>
        </button>

        <button
          onClick={() => setActiveTab('similar')}
          className={`flex-1 min-w-[120px] h-10 px-3 rounded-full text-xs font-semibold transition-all spring-press flex items-center justify-center gap-1.5 ${
            activeTab === 'similar'
              ? 'bg-[#2C2C2E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Anime Serupa</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 min-w-[120px] h-10 px-3 rounded-full text-xs font-semibold transition-all spring-press flex items-center justify-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-[#2C2C2E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Ulasan & Rating</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EPISODE LIST (With Batch Range & Sort) */}
      {/* ========================================================================= */}
      {activeTab === 'episodes' && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl card-frosted-obsidian border border-white/[0.06]">
            {/* Batch Filter Pills if total episodes > 25 */}
            {batchOptions.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1 shrink-0">Batch:</span>
                {batchOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedBatchRange(opt)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
                      selectedBatchRange === opt
                        ? 'bg-white text-black font-extrabold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3.5 py-2 rounded-xl card-frosted-obsidian hover:border-white/20 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 spring-press"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
              </button>

              {/* Episode Search Bar */}
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchEps}
                  onChange={(e) => setSearchEps(e.target.value)}
                  placeholder="Cari episode..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Episode Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredEpisodes.map((ep, idx) => {
              const isWatched = watchedEpisodes.includes(ep.episodeId);

              return (
                <Link
                  key={ep.episodeId}
                  href={`/watch?id=${ep.episodeId}`}
                  className={`p-4 rounded-2xl card-frosted-obsidian flex items-center justify-between gap-3 group spring-press transition-all ${
                    isWatched ? 'border-white/40 bg-white/[0.05]' : 'hover:border-white/30'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                        EPS {ep.eps}
                      </span>
                      {isWatched && (
                        <span className="flex items-center gap-0.5 text-[10px] text-white font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          Ditonton
                        </span>
                      )}
                    </div>
                    <h4 className="font-sans font-bold text-xs text-white group-hover:text-white truncate mt-1.5">
                      {ep.title}
                    </h4>
                    {ep.date && (
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{ep.date}</span>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredEpisodes.length === 0 && (
            <div className="p-8 text-center card-frosted-obsidian rounded-3xl text-zinc-400 text-xs border border-white/[0.06]">
              Tidak ada episode yang cocok.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DETAIL & SINOPSIS */}
      {/* ========================================================================= */}
      {activeTab === 'info' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Synopsis Box */}
          <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-3 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Sinopsis Cerita
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {showFullSynopsis ? synopsisText : `${synopsisText.slice(0, 360)}...`}
            </p>
            {synopsisText.length > 360 && (
              <button
                type="button"
                onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                className="text-xs text-white/80 hover:text-white underline font-semibold"
              >
                {showFullSynopsis ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya...'}
              </button>
            )}
          </div>

          {/* Technical Metadata Table */}
          <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Informasi Produksi & Rilis
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Judul Asli</span>
                <span className="text-white font-medium">{detail.japanese || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Studio</span>
                <span className="text-white font-medium">{detail.studios || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Produser</span>
                <span className="text-white font-medium">{detail.producers || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Tayang Perdana</span>
                <span className="text-white font-medium">{detail.aired || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Status</span>
                <span className="text-white font-medium">{detail.status || '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Skor Komunitas</span>
                <span className="text-white font-bold">{detail.score || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANIME SERUPA */}
      {/* ========================================================================= */}
      {activeTab === 'similar' && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-white" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Rekomendasi Anime Serupa
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {similarAnime.map((anime, i) => (
              <AnimeGlassCard key={anime.animeId || i} anime={anime} index={i} />
            ))}
          </div>

          {similarAnime.length === 0 && (
            <div className="p-8 text-center card-frosted-obsidian rounded-3xl text-zinc-400 text-xs border border-white/[0.06]">
              Memuat rekomendasi anime serupa...
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ULASAN & RATING */}
      {/* ========================================================================= */}
      {activeTab === 'reviews' && (
        <div className="animate-fade-in-up">
          <AnimeReviewSection animeId={animeId} animeTitle={detail.title} />
        </div>
      )}
    </div>
  );
}

export default function AnimePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Memuat seri anime...
        </div>
      }
    >
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary fallbackTitle="Kendala Memuat Detail Anime">
          <AnimeDetailContent />
        </ErrorBoundary>
        <FloatingGlassDock />
      </div>
    </Suspense>
  );
}
