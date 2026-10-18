'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Clock, Trash2, Play, ChevronRight, Tv } from 'lucide-react';
import { getBookmarks, getWatchHistory } from '@/lib/storage';
import { BookmarkItem, WatchHistoryItem } from '@/lib/types';

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setHistory(getWatchHistory());
  }, []);

  const clearHistory = () => {
    if (confirm('Apakah kamu yakin ingin menghapus seluruh riwayat tontonan?')) {
      localStorage.removeItem('nexus_anime_history_v1');
      setHistory([]);
    }
  };

  const clearBookmarks = () => {
    if (confirm('Apakah kamu yakin ingin menghapus semua anime favorit?')) {
      localStorage.removeItem('nexus_anime_bookmarks_v1');
      setBookmarks([]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-flutter border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Koleksi & Riwayat</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Daftar anime tersimpan dan episode yang kamu tonton
          </p>
        </div>

        {/* Action clear buttons */}
        {activeTab === 'bookmarks' && bookmarks.length > 0 && (
          <button
            onClick={clearBookmarks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all flutter-button w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Semua Favorit
          </button>
        )}

        {activeTab === 'history' && history.length > 0 && (
          <button
            onClick={clearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all flutter-button w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Riwayat
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-card border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all flutter-button ${
            activeTab === 'bookmarks'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-neon-purple'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Favorit ({bookmarks.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all flutter-button ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Riwayat ({history.length})
        </button>
      </div>

      {/* Bookmarks Tab Content */}
      {activeTab === 'bookmarks' && (
        <>
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {bookmarks.map((b) => (
                <Link
                  key={b.animeId}
                  href={`/anime/${b.animeId}`}
                  className="rounded-2xl glass-card overflow-hidden group transition-all flutter-button flex flex-col"
                >
                  <div className="relative aspect-[3/4] w-full bg-[#0c1017]">
                    <img
                      src={b.poster}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {b.score && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-amber-300 border border-amber-500/30">
                        ★ {b.score}
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-[#0e131d]">
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-purple-300 truncate">
                      {b.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center glass-card rounded-3xl space-y-3">
              <Bookmark className="w-12 h-12 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-white">Belum ada anime favorit</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Buka halaman anime yang kamu sukai dan tekan tombol "Favorit" untuk menyimpannya di sini.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flutter-button"
              >
                Jelajahi Beranda
              </Link>
            </div>
          )}
        </>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((h) => (
                <Link
                  key={h.episodeId}
                  href={`/watch/${h.episodeId}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl glass-card hover:border-cyan-500/40 group transition-all flutter-button"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={h.poster}
                      alt={h.animeTitle}
                      className="w-14 h-18 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                        {h.animeTitle}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {h.episodeTitle}
                      </p>
                      <span className="text-[10px] text-cyan-400 font-medium">
                        {new Date(h.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-cyan-500/10 group-hover:bg-gradient-to-tr group-hover:from-cyan-500 group-hover:to-blue-600 text-cyan-400 group-hover:text-white flex items-center justify-center flex-shrink-0 transition-all">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center glass-card rounded-3xl space-y-3">
              <Clock className="w-12 h-12 mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-white">Belum ada riwayat tontonan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Setiap episode yang kamu tonton akan otomatis tercatat di sini sehingga kamu bisa melanjutkan kapan saja.
              </p>
              <Link
                href="/ongoing"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all flutter-button"
              >
                Mulai Nonton Anime
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
