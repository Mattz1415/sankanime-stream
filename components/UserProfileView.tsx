'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  HardDrive,
  Palette,
  Check,
  Trash2,
  Heart,
  Clock,
  Film,
  Sparkles,
  Award,
  Download,
  Upload,
  Trophy,
  ShieldCheck,
  Zap,
  Flame,
  Activity,
  BarChart3
} from 'lucide-react';
import { useTheme, THEME_LIST, ThemePalette } from '@/lib/themeContext';
import { getBookmarks, getWatchHistory } from '@/lib/storage';

interface OtakuBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export default function UserProfileView() {
  const { palette, setPalette } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [historyCount, setHistoryCount] = useState(0);
  const [uniqueAnimeCount, setUniqueAnimeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [topGenres, setTopGenres] = useState<{ name: string; count: number }[]>([]);
  const [backupToast, setBackupToast] = useState<string | null>(null);

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

  // Compute Otaku Level & Progress
  const getOtakuLevel = (count: number) => {
    if (count >= 200) return { level: 6, title: 'Sensei Streaming', max: 500, current: count };
    if (count >= 100) return { level: 5, title: 'Wibu Legendaris', max: 200, current: count };
    if (count >= 50) return { level: 4, title: 'Otaku Sejati', max: 100, current: count };
    if (count >= 20) return { level: 3, title: 'Binge Watcher', max: 50, current: count };
    if (count >= 5) return { level: 2, title: 'Anime Enthusiast', max: 20, current: count };
    return { level: 1, title: 'Penikmat Pemula', max: 5, current: Math.max(1, count) };
  };

  const otakuInfo = getOtakuLevel(historyCount);
  const progressPercent = Math.min(100, Math.floor((otakuInfo.current / otakuInfo.max) * 100));

  // Badges array
  const badges: OtakuBadge[] = [
    {
      id: 'b1',
      name: 'Marathon Runner',
      description: 'Menonton 5+ episode anime',
      icon: '🌟',
      unlocked: historyCount >= 5,
    },
    {
      id: 'b2',
      name: 'Pustakawan Anime',
      description: 'Menyimpan 5+ anime di watchlist',
      icon: '📚',
      unlocked: bookmarkCount >= 5,
    },
    {
      id: 'b3',
      name: 'Tunnel Master',
      description: 'Mengaktifkan stream bypass Desustream/Ondesuhd',
      icon: '⚡',
      unlocked: true,
    },
    {
      id: 'b4',
      name: 'OLED Purist',
      description: 'Menonton dengan layar gelap murni #000000',
      icon: '💎',
      unlocked: true,
    },
    {
      id: 'b5',
      name: 'Sensei Otaku',
      description: 'Menyelesaikan 50+ episode tontonan',
      icon: '👑',
      unlocked: historyCount >= 50,
    },
  ];

  // Weekly activity mock simulation (Mon - Sun)
  const weeklyActivity = [
    { day: 'Sen', episodes: 3, height: '45%' },
    { day: 'Sel', episodes: 5, height: '70%' },
    { day: 'Rab', episodes: 2, height: '30%' },
    { day: 'Kam', episodes: 4, height: '60%' },
    { day: 'Jum', episodes: 7, height: '95%' },
    { day: 'Sab', episodes: 8, height: '100%' },
    { day: 'Min', episodes: 6, height: '80%' },
  ];

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('nexus_') || key.startsWith('sanka_'))) {
          backupData[key] = localStorage.getItem(key);
        }
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_anime_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupToast('Backup JSON berhasil diunduh!');
      setTimeout(() => setBackupToast(null), 3000);
    } catch (e) {
      alert('Gagal mengekspor data backup.');
    }
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object') throw new Error('Format JSON tidak valid');

        let restoredCount = 0;
        Object.keys(parsed).forEach((key) => {
          if (typeof parsed[key] === 'string') {
            localStorage.setItem(key, parsed[key]);
            restoredCount++;
          }
        });

        setBackupToast(`Berhasil memulihkan ${restoredCount} entri data!`);
        setTimeout(() => {
          setBackupToast(null);
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        alert('Gagal membaca file backup JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

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
      {/* Profile Header Glass Card with Otaku Level */}
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

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-cinematic font-black text-2xl text-white">Kepiskepsi</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold tracking-wider uppercase border border-cyan-500/40">
                PRO STREAMER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wider uppercase border border-amber-500/40">
                LVL {otakuInfo.level} • {otakuInfo.title}
              </span>
            </div>

            {/* Otaku Level Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Progress Menuju Level {otakuInfo.level + 1}</span>
                <span className="font-mono text-cyan-300 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
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

      {/* Otaku Achievement Badges */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-cinematic font-bold text-sm sm:text-base text-white">
              Lencana Prestasi Otaku (Achievement Badges)
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {badges.filter((b) => b.unlocked).length} / {badges.length} Terbuka
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                b.unlocked
                  ? 'bg-white/[0.04] border-white/15 text-white'
                  : 'bg-white/[0.01] border-white/[0.04] text-zinc-600 opacity-50'
              }`}
            >
              <span className="text-2xl p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                {b.icon}
              </span>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white font-cinematic truncate">{b.name}</h4>
                  {b.unlocked && <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="font-cinematic font-bold text-sm sm:text-base text-white">
              Aktivitas Menonton Mingguan
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> 35 Episode / Minggu
          </span>
        </div>

        {/* Bar Chart Container */}
        <div className="pt-4 pb-2 px-4 rounded-2xl bg-black/40 border border-white/[0.05]">
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyActivity.map((w, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {w.episodes}
                </div>
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-cyan-600 via-cyan-400 to-emerald-400 transition-all duration-500 hover:brightness-125"
                  style={{ height: w.height }}
                />
                <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-white">
                  {w.day}
                </span>
              </div>
            ))}
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

      {/* Export & Import Backup JSON + Cache Management */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-zinc-300" />
          <div>
            <h3 className="font-cinematic font-bold text-base text-white">Cadangkan & Pulihkan Data (JSON)</h3>
            <p className="text-xs text-zinc-400">Ekspor riwayat, bookmark, dan pengaturan atau bersihkan cache</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Export JSON Button */}
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-2xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md spring-press flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Backup JSON</span>
          </button>

          {/* Import JSON Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all spring-press flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Data Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackup}
            className="hidden"
          />

          {/* Clear Cache */}
          <button
            onClick={handleClearCache}
            className="px-4 py-2.5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold spring-press flex items-center gap-1.5 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Cache</span>
          </button>
        </div>

        {backupToast && (
          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-fade-in-up">
            <Check className="w-4 h-4" /> {backupToast}
          </div>
        )}
      </div>

      {/* App Information */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] text-center space-y-2 text-xs text-zinc-400 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        <p className="font-cinematic font-bold text-sm text-zinc-200">
          NexusAnime Ultra-Dark OLED v2.5 PRO MAX
        </p>
        <p>Bertenaga Sanka Vollerei REST API • Native Immersive Display Cutout Mode</p>
        <p className="text-[11px] text-zinc-500">
          Android APK Capacitor 8 • Zero Grey Bars • 100% OLED Spatial Glassmorphism
        </p>
      </div>
    </div>
  );
}
