'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Sparkles, Trash2, Heart, Clock, HardDrive, Palette, Check } from 'lucide-react';
import { useTheme, ThemePalette } from '@/lib/themeContext';
import { getBookmarks, getWatchHistory } from '@/lib/storage';

const PALETTES_LIST: { id: ThemePalette; name: string; color: string }[] = [
  { id: 'cyan', name: 'Neon Cyan', color: '#00f0ff' },
  { id: 'purple', name: 'Amethyst Purple', color: '#a855f7' },
  { id: 'crimson', name: 'Crimson Rose', color: '#f43f5e' },
  { id: 'emerald', name: 'Emerald Cyber', color: '#10b981' },
  { id: 'amber', name: 'Golden Amber', color: '#f59e0b' },
];

export default function UserProfileView() {
  const { palette, setPalette, accentColor } = useTheme();
  const [historyCount, setHistoryCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    setHistoryCount(getWatchHistory().length);
    setBookmarkCount(getBookmarks().length);
  }, []);

  const handleClearCache = () => {
    if (confirm('Hapus seluruh cache data offline dan riwayat tontonan?')) {
      localStorage.clear();
      setHistoryCount(0);
      setBookmarkCount(0);
      alert('Cache berhasil dibersihkan!');
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Profile Header Glass Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-fluent border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Glow Border */}
          <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-white/40 via-white/10 to-transparent shadow-2xl flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-black" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-cinematic font-black text-2xl text-white">Pengguna Nexus</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                PRO PASS
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Penikmat anime garis keras dengan dukungan pemutar Sanka Vollerei multi-server tanpa batasan.
            </p>

            {/* Quick Stats Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3">
              <div className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-white">{historyCount}</span>
                <span className="text-[11px] text-zinc-400">Episode Ditonton</span>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-white">{bookmarkCount}</span>
                <span className="text-[11px] text-zinc-400">Favorit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Accent Palette Customizer */}
      <div className="p-6 rounded-3xl glass-fluent border border-white/10 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-white" />
          <div>
            <h3 className="font-cinematic font-bold text-base text-white">Palet Tema & Efek Cahaya</h3>
            <p className="text-xs text-zinc-400">Pilih warna aksen futuristik untuk seluruh antarmuka</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {PALETTES_LIST.map((p) => {
            const isSelected = palette === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 active:scale-95 ${
                  isSelected
                    ? 'bg-white/15 border-white shadow-lg'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.07]'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: p.color }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </div>
                <span className="text-xs font-bold text-white">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storage & Cache Management */}
      <div className="p-6 rounded-3xl glass-fluent border border-white/10 shadow-lg space-y-4">
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
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Cache
          </button>
        </div>
      </div>

      {/* App Information */}
      <div className="p-6 rounded-3xl glass-fluent border border-white/10 text-center space-y-2 text-xs text-zinc-400">
        <p className="font-cinematic font-bold text-sm text-zinc-200">
          NexusFLUX Stream v1.0.0
        </p>
        <p>Bertenaga Sanka Vollerei REST API • Desain Fluent Glassmorphism Gelap</p>
        <p className="text-[11px] text-zinc-500">
          Built for Android APK via Capacitor 8 & Next.js Static Export
        </p>
      </div>
    </div>
  );
}
