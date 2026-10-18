'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Bookmark,
  Play,
  Trash2,
  Filter,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import {
  getWatchHistory,
  getBookmarks,
  clearWatchHistory,
  deleteWatchHistoryItem,
  deleteBookmark,
  updateBookmarkCategory
} from '@/lib/storage';
import { WatchHistoryItem, BookmarkItem, WatchlistCategory } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

const WATCHLIST_CATEGORIES: ('Semua' | WatchlistCategory)[] = [
  'Semua',
  'Sedang Ditonton',
  'Ingin Ditonton',
  'Selesai',
  'Favorit',
];

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Baru saja';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoryBookmarksView() {
  const [subtab, setSubtab] = useState<'history' | 'bookmarks'>('history');
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | WatchlistCategory>('Semua');
  const { accentColor } = useTheme();

  const loadData = () => {
    setHistory(getWatchHistory());
    setBookmarks(getBookmarks());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearHistory = () => {
    if (confirm('Hapus seluruh riwayat tontonan Anda?')) {
      clearWatchHistory();
      setHistory([]);
    }
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, episodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = deleteWatchHistoryItem(episodeId);
    setHistory(updated);
  };

  const handleDeleteBookmark = (e: React.MouseEvent, animeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = deleteBookmark(animeId);
    setBookmarks(updated);
  };

  const handleUpdateCategory = (animeId: string, newCat: WatchlistCategory) => {
    const updated = updateBookmarkCategory(animeId, newCat);
    setBookmarks(updated);
  };

  // Filter bookmarks by category
  const filteredBookmarks = bookmarks.filter((b) => {
    if (selectedCategory === 'Semua') return true;
    return (b.category || 'Favorit') === selectedCategory;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Subtab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="glass-pill-container p-1 rounded-full inline-flex items-center shadow-lg border border-white/[0.08]">
          <button
            onClick={() => setSubtab('history')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all spring-press ${
              subtab === 'history'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Riwayat Tontonan ({history.length})
          </button>
          <button
            onClick={() => setSubtab('bookmarks')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all spring-press ${
              subtab === 'bookmarks'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Watchlist ({bookmarks.length})
          </button>
        </div>

        {subtab === 'history' && history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-colors flex items-center gap-1.5 spring-press border border-red-500/20 w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Seluruh Riwayat
          </button>
        )}
      </div>

      {/* Tab 1: Riwayat Tontonan */}
      {subtab === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="p-12 text-center rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-3">
              <Clock className="w-10 h-10 mx-auto text-zinc-600" />
              <h3 className="font-cinematic font-bold text-base text-white">Belum Ada Riwayat</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Tonton episode anime favoritmu dan riwayat tontonan serta waktu tonton akan tersimpan otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.map((item, i) => (
                <div
                  key={item.episodeId}
                  className={`relative flex items-center gap-3.5 p-3.5 rounded-2xl card-frosted-obsidian group spring-press border border-white/[0.08] hover:border-white/20 animate-fade-in-up stagger-${(i % 12) + 1}`}
                >
                  {/* Thumbnail Poster */}
                  <Link
                    href={`/watch?id=${item.episodeId}`}
                    className="relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#040408] border border-white/[0.08]"
                  >
                    <img
                      src={item.poster}
                      alt={item.animeTitle}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 fill-white text-white" />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.timestamp)}
                      </span>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(e, item.episodeId)}
                        className="p-1 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Hapus item ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Link href={`/watch?id=${item.episodeId}`} className="block">
                      <h4 className="font-cinematic font-bold text-sm text-white group-hover:text-zinc-100 truncate">
                        {item.animeTitle}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">
                        {item.episodeTitle}
                      </p>
                    </Link>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.progressPercent || 70}%`,
                          backgroundColor: accentColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Watchlist Koleksi dengan Kategori */}
      {subtab === 'bookmarks' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {WATCHLIST_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all spring-press ${
                    isSelected
                      ? 'bg-white text-black shadow-md'
                      : 'card-frosted-obsidian text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {filteredBookmarks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-3">
              <Bookmark className="w-10 h-10 mx-auto text-zinc-600" />
              <h3 className="font-cinematic font-bold text-base text-white">
                Belum Ada Anime di Kategori Ini
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Buka halaman anime yang kamu sukai, klik tombol "+ Watchlist", dan pilih kategorinya!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredBookmarks.map((item, i) => (
                <div
                  key={item.animeId}
                  className={`group relative flex flex-col rounded-2xl card-frosted-obsidian overflow-hidden border border-white/[0.08] hover:border-white/20 spring-press animate-fade-in-up stagger-${(i % 12) + 1}`}
                >
                  <Link href={`/anime?id=${item.animeId}`} className="block relative aspect-[3/4] w-full overflow-hidden bg-[#040408]">
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-transparent opacity-80" />

                    {/* Category Tag on Poster */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-bold text-cyan-300">
                      {item.category || 'Favorit'}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteBookmark(e, item.animeId)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-red-500/80 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                      title="Hapus dari Watchlist"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  <div className="p-3 space-y-1">
                    <Link href={`/anime?id=${item.animeId}`} className="block">
                      <h4 className="font-cinematic font-bold text-xs text-white line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </Link>

                    {/* Quick Category Switcher */}
                    <select
                      value={item.category || 'Favorit'}
                      onChange={(e) => handleUpdateCategory(item.animeId, e.target.value as WatchlistCategory)}
                      className="w-full text-[10px] bg-white/[0.05] border border-white/10 rounded-lg px-1.5 py-1 text-zinc-300 outline-none"
                    >
                      <option value="Sedang Ditonton" className="bg-[#08080c] text-white">Sedang Ditonton</option>
                      <option value="Ingin Ditonton" className="bg-[#08080c] text-white">Ingin Ditonton</option>
                      <option value="Selesai" className="bg-[#08080c] text-white">Selesai</option>
                      <option value="Favorit" className="bg-[#08080c] text-white">Favorit</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
