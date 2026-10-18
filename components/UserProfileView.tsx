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
  BarChart3,
  QrCode,
  CreditCard,
  Cpu,
  Compass
} from 'lucide-react';
import { useTheme, THEME_LIST, ThemePalette } from '@/lib/themeContext';
import { getBookmarks, getWatchHistory } from '@/lib/storage';

interface OtakuBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  tier: 'Gold' | 'Silver' | 'Platinum' | 'Mythic';
}

export default function UserProfileView() {
  const { palette, setPalette, accentColor } = useTheme();
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
      .slice(0, 5);

    setTopGenres(
      sortedGenres.length > 0
        ? sortedGenres
        : [
            { name: 'Action', count: 18 },
            { name: 'Fantasy', count: 14 },
            { name: 'Isekai', count: 11 },
            { name: 'Comedy', count: 8 },
            { name: 'Sci-Fi', count: 6 },
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
      description: 'Menonton 5+ episode anime berturut-turut',
      icon: '🌟',
      unlocked: historyCount >= 5,
      tier: 'Gold',
    },
    {
      id: 'b2',
      name: 'Pustakawan Anime',
      description: 'Menyimpan 5+ judul di watchlist',
      icon: '📚',
      unlocked: bookmarkCount >= 5,
      tier: 'Silver',
    },
    {
      id: 'b3',
      name: 'Tunnel Master',
      description: 'Mengaktifkan stream bypass Desustream/Ondesuhd',
      icon: '⚡',
      unlocked: true,
      tier: 'Platinum',
    },
    {
      id: 'b4',
      name: 'OLED Purist',
      description: 'Menonton dengan rasio Fill dan layar pitch black',
      icon: '💎',
      unlocked: true,
      tier: 'Mythic',
    },
    {
      id: 'b5',
      name: 'Sensei Otaku',
      description: 'Menyelesaikan 50+ episode tontonan',
      icon: '👑',
      unlocked: historyCount >= 50,
      tier: 'Mythic',
    },
    {
      id: 'b6',
      name: 'Gacha Summoner',
      description: 'Menguji keberuntungan dengan roulette anime',
      icon: '🎰',
      unlocked: true,
      tier: 'Gold',
    },
  ];

  // Weekly activity data
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

      setBackupToast('Backup JSON berhasil diekspor!');
      setTimeout(() => setBackupToast(null), 3000);
    } catch {
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
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* ========================================================================= */}
      {/* 1. DIGITAL HOLOGRAPHIC ID CARD (Kartu Identitas Otaku) */}
      {/* ========================================================================= */}
      <div className="relative w-full rounded-3xl p-1 bg-gradient-to-tr from-cyan-500/30 via-purple-500/20 to-amber-500/30 shadow-[0_24px_70px_rgba(0,0,0,0.98)] overflow-hidden">
        <div className="holographic-foil-card rounded-[22px] bg-[#050508] p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Top Row: Chip Icon & Branding */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="font-cinematic font-black text-sm text-white tracking-widest uppercase block">
                  Nexus Digital ID
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">UID: NX-8849-OLED</span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black text-[10px] tracking-wider uppercase shadow-md shadow-amber-400/25">
              PRO STREAMER
            </span>
          </div>

          {/* Center Info: Avatar, Name & Level */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden p-[2px] bg-gradient-to-tr from-cyan-400 via-white to-purple-500 shadow-2xl shrink-0 spring-press">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Avatar"
                className="w-full h-full object-cover rounded-[14px]"
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black" />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="font-cinematic font-black text-2xl sm:text-3xl text-white">Kepiskepsi</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-bold border border-white/20">
                  LVL {otakuInfo.level} • {otakuInfo.title}
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-md">
                Streamer anime aktif dengan sistem akselerasi hardware native dan tunnel bypass.
              </p>

              {/* Level XP Progress Bar */}
              <div className="space-y-1 pt-1 max-w-md">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                  <span>Progres Menuju Level {otakuInfo.level + 1}</span>
                  <span className="font-mono text-cyan-300 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Strip: Stats Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.08] relative z-10">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center sm:text-left">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Judul Ditonton</span>
              <span className="text-base font-black text-white">{uniqueAnimeCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center sm:text-left">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total Episode</span>
              <span className="text-base font-black text-cyan-300">{historyCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center sm:text-left">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">Watchlist</span>
              <span className="text-base font-black text-amber-300">{bookmarkCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GENRE RADAR DISTRIBUTION & WEEKLY CHART */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genre Visual Distribution Polygon */}
        <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h3 className="font-cinematic font-bold text-sm sm:text-base text-white">
              Radar Distribusi Genre Favorit
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {topGenres.map((g, idx) => {
              const maxCount = topGenres[0]?.count || 20;
              const barPercent = Math.min(100, Math.floor((g.count / maxCount) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">{g.name}</span>
                    <span className="text-zinc-500 font-mono">{g.count} Anime</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="font-cinematic font-bold text-sm sm:text-base text-white">
                Aktivitas Tontonan
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> 35 Ep/Minggu
            </span>
          </div>

          <div className="pt-4 pb-2 px-3 rounded-2xl bg-black/40 border border-white/[0.05]">
            <div className="flex items-end justify-between h-32 gap-2">
              {weeklyActivity.map((w, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {w.episodes}
                  </div>
                  <div
                    className="w-full max-w-[26px] rounded-t-lg bg-gradient-to-t from-cyan-600 via-cyan-400 to-emerald-400 transition-all duration-500 hover:brightness-125"
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
      </div>

      {/* ========================================================================= */}
      {/* 3. GLOWING ACHIEVEMENT TROPHIES GRID */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinematic font-bold text-sm sm:text-base text-white">
              Koleksi Trofi Prestasi Otaku
            </h3>
          </div>
          <span className="text-xs text-amber-300 font-mono font-bold">
            {badges.filter((b) => b.unlocked).length} / {badges.length} Terkumpul
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                b.unlocked
                  ? 'bg-white/[0.04] border-white/15 text-white hover:border-amber-400/40 shadow-lg'
                  : 'bg-white/[0.01] border-white/[0.04] text-zinc-600 opacity-50'
              }`}
            >
              <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                {b.icon}
              </span>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white font-cinematic truncate">{b.name}</h4>
                  {b.unlocked && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">{b.description}</p>
                <span className="inline-block text-[9px] font-bold text-amber-400/80 uppercase">
                  {b.tier}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THEME CUSTOMIZER & BACKUP MANAGEMENT */}
      {/* ========================================================================= */}
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

      {/* Backup JSON & Storage Maintenance */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-zinc-300" />
          <div>
            <h3 className="font-cinematic font-bold text-base text-white">Cadangkan & Pulihkan Data (JSON)</h3>
            <p className="text-xs text-zinc-400">Ekspor riwayat, bookmark, dan pengaturan atau bersihkan cache</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-2xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md spring-press flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Backup JSON</span>
          </button>

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
    </div>
  );
}
