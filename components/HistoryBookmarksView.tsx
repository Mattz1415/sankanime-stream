'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Bookmark, Play, Trash2 } from 'lucide-react';
import { getWatchHistory, getBookmarks } from '@/lib/storage';
import { WatchHistoryItem, BookmarkItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

export default function HistoryBookmarksView() {
  const [subtab, setSubtab] = useState<'history' | 'bookmarks'>('history');
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const { accentColor } = useTheme();

  useEffect(() => {
    setHistory(getWatchHistory());
    setBookmarks(getBookmarks());
  }, []);

  const clearHistory = () => {
    if (confirm('Hapus seluruh riwayat tontonan?')) {
      localStorage.removeItem('nexus_anime_history_v1');
      setHistory([]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Subtab Selector */}
      <div className="flex items-center justify-between">
        <div className="glass-pill-container p-1 rounded-full inline-flex items-center shadow-lg border border-white/[0.06]">
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
            Koleksi Favorit ({bookmarks.length})
          </button>
        </div>

        {subtab === 'history' && history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 text-xs transition-colors flex items-center gap-1.5 spring-press border border-white/[0.06]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Riwayat
          </button>
        )}
      </div>

      {/* History Grid */}
      {subtab === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-obsidian border border-white/[0.06] space-y-3">
              <Clock className="w-10 h-10 mx-auto text-zinc-600" />
              <h3 className="font-cinematic font-bold text-base text-white">Belum Ada Riwayat</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Tonton episode anime favoritmu dan riwayat tontonan akan tersimpan otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {history.map((item, i) => (
                <Link
                  key={item.episodeId}
                  href={`/watch?id=${item.episodeId}`}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl glass-obsidian-card group spring-press border border-white/[0.06] animate-fade-in-up stagger-${(i % 12) + 1}`}
                >
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#05060a] border border-white/[0.08]">
                    <img
                      src={item.poster}
                      alt={item.animeTitle}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 fill-white text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Terakhir Diputar
                    </span>
                    <h4 className="font-cinematic font-bold text-sm text-white truncate group-hover:text-zinc-200">
                      {item.animeTitle}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate">{item.episodeTitle}</p>
                    <span className="text-[10px] text-zinc-500 block">
                      {new Date(item.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Bookmarks Grid */}
      {subtab === 'bookmarks' && (
        <>
          {bookmarks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-obsidian border border-white/[0.06] space-y-3">
              <Bookmark className="w-10 h-10 mx-auto text-zinc-600" />
              <h3 className="font-cinematic font-bold text-base text-white">Belum Ada Favorit Tersimpan</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Klik tombol "+ Simpan" di banner utama atau halaman detail anime untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {bookmarks.map((b, i) => (
                <Link
                  key={b.animeId}
                  href={`/anime?id=${b.animeId}`}
                  className={`rounded-2xl glass-obsidian-card overflow-hidden group flex flex-col spring-press border border-white/[0.06] animate-fade-in-up stagger-${(i % 12) + 1}`}
                >
                  <div className="relative aspect-[3/4] w-full bg-[#05060a] overflow-hidden">
                    <img
                      src={b.poster}
                      alt={b.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 fill-white text-white" />
                    </div>
                  </div>
                  <div className="p-3 bg-[#040508]/90">
                    <h4 className="font-cinematic font-bold text-xs text-white truncate">
                      {b.title}
                    </h4>
                    <span className="text-[10px] text-zinc-400">{b.status || 'Tersimpan'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
