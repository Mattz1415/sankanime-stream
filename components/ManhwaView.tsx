'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Star,
  RefreshCw,
  Search,
  Flame,
  ChevronRight,
  X,
  Palette,
  Heart,
  Swords,
  Crown,
  Layers,
} from 'lucide-react';
import { fetchManhwaList, searchManhwa, fetchComicDetail } from '@/lib/mediaApi';
import { ComicItem, ComicDetail } from '@/lib/types';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';
import VerticalComicReader from './VerticalComicReader';
import ErrorBoundary from './ErrorBoundary';

type GenreFilter = 'Semua' | 'Hits' | 'Romance' | 'Action' | 'Isekai';

const GENRE_TABS: { id: GenreFilter; label: string; icon: any }[] = [
  { id: 'Semua', label: 'Semua Manhwa', icon: Layers },
  { id: 'Hits', label: '🔥 Hits Terpopuler', icon: Flame },
  { id: 'Romance', label: '💖 Romance & Drama', icon: Heart },
  { id: 'Action', label: '⚔️ Action & Fantasy', icon: Swords },
  { id: 'Isekai', label: '👑 Isekai & Reinkarnasi', icon: Crown },
];

export default function ManhwaView() {
  const [manhwaList, setManhwaList] = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>('Semua');

  // Detail Modal state
  const [selectedManhwa, setSelectedManhwa] = useState<ComicItem | null>(null);
  const [detailData, setDetailData] = useState<ComicDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Active Reader state
  const [readingChapterSlug, setReadingChapterSlug] = useState<string | null>(null);
  const [readingTitle, setReadingTitle] = useState<string>('');

  // Initial load
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchManhwaList(1);
        setManhwaList(res);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Live search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchManhwa(searchQuery);
        if (res.length > 0) {
          setManhwaList(res);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResetSearch = async () => {
    setSearchQuery('');
    setPage(1);
    setLoading(true);
    try {
      const res = await fetchManhwaList(1);
      setManhwaList(res);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const more = await fetchManhwaList(nextPage);
      if (more.length === 0) {
        setHasMore(false);
      } else {
        setManhwaList((prev) => [...prev, ...more]);
        setPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpenDetail = async (item: ComicItem) => {
    setSelectedManhwa(item);
    setDetailLoading(true);
    try {
      const res = await fetchComicDetail(item.slug);
      setDetailData(res);
    } catch {
      setDetailData({
        title: item.title,
        slug: item.slug,
        image: item.image,
        synopsis: item.description || 'Webtoon Korea berwarna dengan jalan cerita intens.',
        metadata: { type: 'Manhwa / Webtoon', status: 'Ongoing', concept: 'Full Color' },
        genres: [{ name: 'Action', slug: 'action' }, { name: 'Drama', slug: 'drama' }],
        chapters: Array.from({ length: 30 }, (_, i) => ({
          chapter: `Chapter ${120 - i}`,
          slug: `${item.slug}-chapter-${120 - i}`,
          date: 'Terbaru',
        })),
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLaunchReader = (chapterSlug: string, title?: string) => {
    setReadingTitle(title || selectedManhwa?.title || 'Manhwa');
    setReadingChapterSlug(chapterSlug);
    setSelectedManhwa(null);
  };

  // Filter based on active genre tab & query
  const filteredList = manhwaList.filter((m) => {
    const text = (m.title + ' ' + (m.description || '')).toLowerCase();

    // Query filter
    if (searchQuery.trim() !== '' && !text.includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Genre filter
    if (selectedGenre === 'Semua') return true;
    if (selectedGenre === 'Hits') {
      return (
        m.score === '9.9' ||
        m.score === '9.8' ||
        text.includes('solo leveling') ||
        text.includes('serena') ||
        text.includes('lookism') ||
        text.includes('omniscient') ||
        text.includes('beg') ||
        text.includes('nano machine')
      );
    }
    if (selectedGenre === 'Romance') {
      return (
        text.includes('serena') ||
        text.includes('cry') ||
        text.includes('beg') ||
        text.includes('remarried') ||
        text.includes('princess') ||
        text.includes('true love') ||
        text.includes('true beauty') ||
        text.includes('oak tree') ||
        text.includes('cinta') ||
        text.includes('pernikahan') ||
        text.includes('romance')
      );
    }
    if (selectedGenre === 'Action') {
      return (
        text.includes('solo leveling') ||
        text.includes('lookism') ||
        text.includes('omniscient') ||
        text.includes('nano machine') ||
        text.includes('killer peter') ||
        text.includes('eleceed') ||
        text.includes('tower of god') ||
        text.includes('mount hua') ||
        text.includes('wind breaker') ||
        text.includes('hunter') ||
        text.includes('pedang') ||
        text.includes('action')
      );
    }
    if (selectedGenre === 'Isekai') {
      return (
        text.includes('reinkarnasi') ||
        text.includes('beginning after the end') ||
        text.includes('pick me up') ||
        text.includes('world after the fall') ||
        text.includes('suicide hunter') ||
        text.includes('battle god') ||
        text.includes('magic emperor') ||
        text.includes('martial peak') ||
        text.includes('isekai')
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden card-frosted-obsidian border border-purple-500/30 p-6 sm:p-10 shadow-[0_20px_50px_rgba(168,85,247,0.15)]">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>KOREAN WEBTOON & MANHWA FULL COLOR HD</span>
          </div>

          <h1 className="font-cinematic font-black text-2xl sm:text-4xl text-white tracking-wide leading-tight">
            Serena, Solo Leveling, Lookism & Webtoon Hits
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Akses ribuan judul Manhwa terlengkap mulai dari drama romansa mendalam seperti <span className="text-purple-300 font-bold">Serena</span> & <span className="text-purple-300 font-bold">Cry, or Better Yet, Beg</span> hingga aksi legendaris <span className="text-purple-300 font-bold">Solo Leveling</span> & <span className="text-purple-300 font-bold">Omniscient Reader</span> dengan Vertical Reader tanpa batas.
          </p>

          {/* Search Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Serena, Solo Leveling, Lookism, Cry Beg..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/[0.08] border border-white/[0.12] text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-purple-400/70 shadow-inner"
              />
              {isSearching && (
                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {searchQuery && (
              <button
                onClick={handleResetSearch}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-zinc-300 hover:text-white spring-press"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Genre Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {GENRE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedGenre === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedGenre(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 spring-press ${
                isActive
                  ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-[1.02]'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Manhwa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Katalog Manhwa ({filteredList.length} Judul)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-semibold hidden sm:inline">
            Full HD Color Pages • Vertical Reader
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-9 h-9 animate-spin text-purple-400 mx-auto drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
            <p className="text-xs text-zinc-400 font-semibold">Mengambil ribuan chapter Manhwa Korea...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-3 card-frosted-obsidian rounded-3xl p-8 border border-white/[0.08]">
            <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">Tidak ada judul yang sesuai dengan pencarian.</p>
            <button
              onClick={handleResetSearch}
              className="px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold spring-press"
            >
              Kembali ke Semua Manhwa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredList.map((item, idx) => (
              <div
                key={item.slug || idx}
                onClick={() => handleOpenDetail(item)}
                className="group cursor-pointer rounded-2xl overflow-hidden card-frosted-obsidian border border-white/[0.08] hover:border-purple-400/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all duration-300 spring-press flex flex-col"
              >
                <div className="relative aspect-[2/3] w-full bg-[#0a0a10] overflow-hidden">
                  <SmartImage
                    item={item}
                    src={item.image}
                    title={item.title}
                    alt={item.title}
                    type="manhwa"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                  {/* Chapter badge */}
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-purple-300 border border-purple-400/40 shadow-md">
                      {item.chapter || 'Full Color'}
                    </span>
                  </div>

                  {/* Score badge */}
                  <div className="absolute top-2 right-2 z-10 pointer-events-none">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[10px] font-mono text-amber-300 font-black border border-amber-400/40 shadow-md">
                      <Star className="w-3 h-3 fill-amber-300" />
                      {item.score || '9.6'}
                    </span>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5 bg-[#08080e]/90">
                  <h4 className="font-bold text-xs text-zinc-100 group-hover:text-purple-300 line-clamp-2 transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/[0.04]">
                    <span className="text-zinc-400">Webtoon HD</span>
                    <span className="text-purple-400 font-bold group-hover:underline flex items-center gap-0.5">
                      Baca <ChevronRight className="w-3 h-3 inline" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button for Pagination */}
        {!loading && hasMore && !searchQuery && (
          <div className="text-center pt-6 pb-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-full bg-white/[0.06] hover:bg-purple-600 border border-purple-400/30 hover:border-purple-400 text-xs font-bold text-white shadow-lg spring-press transition-all inline-flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                  <span>Memuat Lebih Banyak Manhwa...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Muat Lebih Banyak Judul Manhwa</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedManhwa && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl card-frosted-obsidian border border-purple-400/30 p-6 shadow-2xl space-y-5 my-8">
            <button
              onClick={() => setSelectedManhwa(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center spring-press z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !detailData ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                <p className="text-xs text-zinc-400">Memuat info webtoon & daftar chapter...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-5">
                  <SmartImage
                    item={detailData}
                    src={detailData.image}
                    title={detailData.title}
                    alt={detailData.title}
                    type="manhwa"
                    className="w-36 h-48 object-cover rounded-2xl shadow-xl shrink-0 mx-auto sm:mx-0 border border-white/10"
                  />
                  <div className="space-y-2 min-w-0">
                    <h3 className="font-cinematic font-black text-xl text-white leading-tight">
                      {detailData.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-400/30">
                        Manhwa (Webtoon)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-400 font-mono text-[11px] font-bold">
                        {detailData.metadata?.status || 'Ongoing'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {detailData.genres.map((g) => (
                        <span
                          key={g.slug || g.name}
                          className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-zinc-300 border border-white/[0.06]"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-3 pt-1 leading-relaxed">
                      {detailData.synopsis}
                    </p>
                  </div>
                </div>

                {/* Chapter List Section */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-cinematic font-bold text-xs uppercase tracking-wider text-zinc-300">
                      Pilih Chapter ({detailData.chapters.length})
                    </h4>
                    <span className="text-[11px] text-purple-400 font-semibold">Vertical Reader HD</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {detailData.chapters.map((ch) => (
                      <button
                        key={ch.slug}
                        type="button"
                        onClick={() => handleLaunchReader(ch.slug, detailData.title)}
                        className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-purple-500/20 border border-white/[0.08] hover:border-purple-400/40 text-xs font-bold text-zinc-200 hover:text-purple-300 text-left truncate spring-press transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{ch.chapter}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vertical Comic Reader Modal */}
      {readingChapterSlug && (
        <VerticalComicReader
          comicTitle={readingTitle}
          chapterSlug={readingChapterSlug}
          onClose={() => setReadingChapterSlug(null)}
          onNavigateChapter={(slug) => setReadingChapterSlug(slug)}
          allChapters={detailData?.chapters || []}
        />
      )}
    </div>
  );
}
