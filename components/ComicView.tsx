'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  RefreshCw,
  Star,
  ChevronRight,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { fetchComicPopular, fetchComicLatest, fetchComicDetail, searchComic } from '@/lib/mediaApi';
import { ComicItem, ComicDetail } from '@/lib/types';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';
import VerticalComicReader from './VerticalComicReader';
import ErrorBoundary from './ErrorBoundary';

export default function ComicView() {
  const [popularList, setPopularList] = useState<ComicItem[]>([]);
  const [latestList, setLatestList] = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'popular' | 'latest'>('popular');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ComicItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Detail Modal state
  const [selectedComic, setSelectedComic] = useState<ComicItem | null>(null);
  const [detailData, setDetailData] = useState<ComicDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Active Reader state
  const [readingChapterSlug, setReadingChapterSlug] = useState<string | null>(null);
  const [readingComicTitle, setReadingComicTitle] = useState<string>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pop, lat] = await Promise.all([
          fetchComicPopular().catch(() => []),
          fetchComicLatest().catch(() => []),
        ]);
        setPopularList(pop);
        setLatestList(lat);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchComic(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenDetail = async (item: ComicItem) => {
    setSelectedComic(item);
    setDetailLoading(true);
    try {
      const res = await fetchComicDetail(item.slug);
      setDetailData(res);
    } catch {
      setDetailData({
        title: item.title,
        slug: item.slug,
        image: item.image,
        synopsis: item.description || 'Sinopsis komik sedang disinkronkan.',
        genres: [{ name: 'Action', slug: 'action' }, { name: 'Fantasy', slug: 'fantasy' }],
        chapters: Array.from({ length: 15 }, (_, i) => ({
          chapter: `Chapter ${100 - i}`,
          slug: `${item.slug}-chapter-${100 - i}`,
          date: 'Terbaru',
        })),
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLaunchReader = (chapterSlug: string, title?: string) => {
    setReadingComicTitle(title || selectedComic?.title || 'Komik');
    setReadingChapterSlug(chapterSlug);
    setSelectedComic(null);
  };

  const displayList = searchResults !== null
    ? searchResults
    : activeTab === 'popular'
    ? popularList
    : latestList;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden card-frosted-obsidian border border-white/[0.08] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>KATALOG KOMIK & MANGA JEPANG</span>
          </div>
          <h2 className="font-cinematic font-black text-2xl sm:text-3xl text-white tracking-wide">
            Baca Ribuan Chapter Manga Tanpa Iklan
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Dilengkapi fitur <strong>Vertical Comic Reader</strong> interaktif, resolusi gambar tajam, dan update rilis chapter berkala.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full md:w-80 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari One Piece, Jujutsu..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-cyan-400 text-black font-extrabold text-xs hover:bg-cyan-300 spring-press"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Cari'}
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          {searchResults !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-300">
                Hasil Pencarian &ldquo;{searchQuery}&rdquo; ({searchResults.length})
              </span>
              <button
                onClick={() => {
                  setSearchResults(null);
                  setSearchQuery('');
                }}
                className="text-xs text-zinc-500 hover:text-white underline"
              >
                Reset
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('popular')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all spring-press ${
                  activeTab === 'popular'
                    ? 'bg-white text-black shadow-md shadow-white/20'
                    : 'card-frosted-obsidian text-zinc-400 hover:text-white'
                }`}
              >
                🔥 Manga Terpopuler ({popularList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('latest')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all spring-press ${
                  activeTab === 'latest'
                    ? 'bg-white text-black shadow-md shadow-white/20'
                    : 'card-frosted-obsidian text-zinc-400 hover:text-white'
                }`}
              >
                ⚡ Update Chapter Terbaru ({latestList.length})
              </button>
            </>
          )}
        </div>

        <span className="text-xs text-zinc-500 hidden sm:inline font-mono">
          Vertical Scroll Mode
        </span>
      </div>

      {/* Comic Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />
          <p className="text-xs text-zinc-400 font-semibold">Mengambil katalog komik...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-20 text-center space-y-2 text-zinc-500 text-xs">
          <BookOpen className="w-10 h-10 mx-auto text-zinc-700" />
          <p>Komik tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayList.map((item, idx) => (
            <div
              key={item.slug || idx}
              onClick={() => handleOpenDetail(item)}
              className="group cursor-pointer rounded-2xl overflow-hidden card-frosted-obsidian border border-white/[0.08] hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all duration-300 spring-press flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                <SmartImage
                  item={item}
                  src={item.image}
                  title={item.title}
                  alt={item.title}
                  type="comic"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-400/30">
                    {item.chapter || 'Chapter Baru'}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[10px] font-mono text-amber-300 font-bold border border-amber-400/30">
                  <Star className="w-3 h-3 fill-amber-300" />
                  <span>{item.score || '9.0'}</span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                <h4 className="font-bold text-xs text-zinc-200 group-hover:text-cyan-300 line-clamp-2 transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>Manga Sub Indo</span>
                  <span className="text-cyan-400 font-semibold group-hover:underline">Baca 📖</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comic Detail Modal */}
      {selectedComic && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl card-frosted-obsidian border border-white/[0.12] p-6 shadow-2xl space-y-5 my-8">
            <button
              onClick={() => setSelectedComic(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center spring-press z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !detailData ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-zinc-400">Memuat info komik & daftar chapter...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-5">
                  <SmartImage
                    item={detailData}
                    src={detailData.image}
                    title={detailData.title}
                    alt={detailData.title}
                    type="comic"
                    className="w-36 h-48 object-cover rounded-2xl shadow-xl shrink-0 mx-auto sm:mx-0 border border-white/10"
                  />
                  <div className="space-y-2 min-w-0">
                    <h3 className="font-cinematic font-black text-xl text-white leading-tight">
                      {detailData.title}
                    </h3>
                    {detailData.titleIndonesian && detailData.titleIndonesian !== detailData.title && (
                      <p className="text-xs text-zinc-400 italic">{detailData.titleIndonesian}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-400 font-mono text-[11px] font-bold">
                        {detailData.metadata?.status || 'Ongoing'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[11px] font-semibold">
                        {detailData.metadata?.type || 'Manga'}
                      </span>
                      {detailData.metadata?.author && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 text-[11px] border border-cyan-500/30">
                          {detailData.metadata.author}
                        </span>
                      )}
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
                      Daftar Chapter ({detailData.chapters.length})
                    </h4>
                    <span className="text-[11px] text-cyan-400 font-semibold">Bahasa Indonesia</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {detailData.chapters.map((ch) => (
                      <button
                        key={ch.slug}
                        type="button"
                        onClick={() => handleLaunchReader(ch.slug, detailData.title)}
                        className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-400/40 text-xs font-bold text-zinc-200 hover:text-cyan-300 text-left truncate spring-press transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{ch.chapter}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
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
          comicTitle={readingComicTitle}
          chapterSlug={readingChapterSlug}
          onClose={() => setReadingChapterSlug(null)}
          onNavigateChapter={(slug) => setReadingChapterSlug(slug)}
          allChapters={detailData?.chapters || []}
        />
      )}
    </div>
  );
}
