'use client';

import React, { useState, useEffect } from 'react';
import { User, HardDrive, Palette, Check, Trash2, Heart, Clock, Film, Sparkles, Award } from 'lucide-react';
import { useTheme, THEME_LIST, ThemePalette } from '@/lib/themeContext';
import { getBookmarks, getWatchHistory } from '@/lib/storage';

export default function UserProfileView() {
  const { palette, setPalette } = useTheme();
  const [historyCount, setHistoryCount] = useState(0);
  const [uniqueAnimeCount, setUniqueAnimeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [topGenres, setTopGenres] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const history = getWatchHistory();
    const bookmarks = getBookmarks();

    setHistoryCount(history.length);
    const uniqueAnimes = new Set(history.map((h) => h.animeId));
    setUniqueAnimeCount(uniqueAnimes.size);
    setBookmarkCount(bookmarks.length);

    // Calculate favorite genres from bookmarks
    const genreMap: Record<string, number> = {};
    bookmarks.forEach((b) => {
      (b.genres || []).forEach((g) => {
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    });

    const sortedGenres = Object.entries(genreMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    setTopGenres(
      sortedGenres.length > 0
        ? sortedGenres
        : [
            { name: 'Action', count: 12 },
            { name: 'Fantasy', count: 9 },
            { name: 'Isekai', count: 7 },
          ]
    );
  }, []);

  const handleClearCache = () => {
    if (confirm('Hapus seluruh cache data offline, riwayat tontonan, dan preferensi lokal?')) {
      localStorage.clear();
      setHistoryCount(0);
      setUniqueAnimeCount(0);
      setBookmarkCount(0);
      alert('Cache berhasil dibersihkan!');
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Profile Header Glass Card */}
      <div className="p-6 sm:p-8 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Glow Border */}
          <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-white/30 via-white/10 to-transparent shadow-2xl flex-shrink-0 spring-press">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
              alt="Avatar"
              loading="lazy"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-black" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-cinematic font-black text-2xl text-white">Kepiskepsi</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold tracking-wider uppercase border border-cyan-500/40">
                PRO STREAMER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                OLED PASS
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Penikmat anime subtitle Indonesia dengan pemutar multi-server Sanka Vollerei ultra-cepat.
            </p>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5">
                <Film className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-sm font-bold text-white block leading-none">{uniqueAnimeCount}</span>
                  <span className="text-[10px] text-zinc-400">Total Judul</span>
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-sm font-bold text-white block leading-none">{historyCount}</span>
                  <span className="text-[10px] text-zinc-400">Episode Ditonton</span>
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <Heart className="w-4 h-4 text-pink-400" />
                <div>
                  <span className="text-sm font-bold text-white block leading-none">{bookmarkCount}</span>
                  <span className="text-[10px] text-zinc-400">Watchlist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Favorite Genres */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="font-cinematic font-bold text-sm sm:text-base text-white">
            Genre Favorit Kamu
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {topGenres.map((g, idx) => (
            <span
              key={idx}
              className="px-3.5 py-1.5 rounded-full card-frosted-obsidian text-xs font-semibold text-zinc-200 border border-white/10 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>{g.name}</span>
              <span className="text-[10px] text-zinc-500">({g.count} anime)</span>
            </span>
          ))}
        </div>
      </div>

      {/* Theme Accent Palette Customizer */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-white" />
          <div>
            <h3 className="font-cinematic font-bold text-base text-white">Theme Engine & Efek Cahaya</h3>
            <p className="text-xs text-zinc-400">Pilih palet aksen futuristik untuk seluruh antarmuka aplikasi</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {THEME_LIST.map((p) => {
            const isSelected = palette === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 spring-press ${
                  isSelected
                    ? 'bg-white/15 border-white shadow-lg'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shadow-md border border-white/20"
                  style={{ backgroundColor: p.accent }}
                >
                  {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                </div>
                <span className="text-xs font-bold text-white text-center">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storage & Cache Management */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-zinc-300" />
            <div>
              <h3 className="font-cinematic font-bold text-base text-white">Manajemen Penyimpanan & Cache</h3>
              <p className="text-xs text-zinc-400">Hapus cache lokal untuk memuat data anime paling segar</p>
            </div>
          </div>

          <button
            onClick={handleClearCache}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold spring-press flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Cache
          </button>
        </div>
      </div>

      {/* App Information */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] text-center space-y-2 text-xs text-zinc-400 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        <p className="font-cinematic font-bold text-sm text-zinc-200">
          NexusAnime Ultra-Dark OLED v2.0
        </p>
        <p>Bertenaga Sanka Vollerei REST API • Multi-Server Fast Streaming</p>
        <p className="text-[11px] text-zinc-500">
          Built for Android APK via Capacitor 8 & Next.js Static Export
        </p>
      </div>
    </div>
  );
}
