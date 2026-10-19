'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Sparkles, Palette, Download, Dice5 } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

import { MediaCategory } from '@/lib/types';

interface FluentHeaderProps {
  activeCategory: MediaCategory;
  onSelectCategory: (cat: MediaCategory) => void;
  onOpenProfile?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenTheme?: () => void;
  onOpenDownloads?: () => void;
  onOpenGacha?: () => void;
}

export default function FluentHeader({
  activeCategory,
  onSelectCategory,
  onOpenProfile,
  onOpenCommandPalette,
  onOpenTheme,
  onOpenDownloads,
  onOpenGacha,
}: FluentHeaderProps) {
  const categories: MediaCategory[] = ['Anime', 'Donghua', 'Komik', 'Manhwa', 'LK21 Film'];
  const { accentColor } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#000000]/95 border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0 spring-press">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-white/20 to-white/5 border border-white/20 flex items-center justify-center shadow-lg group-hover:border-white/40 transition-transform">
            <span className="font-cinematic font-black text-lg text-white">N</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-cinematic font-black text-base tracking-tight text-white block leading-none">
              Nexus<span className="text-zinc-400 font-sans text-xs font-semibold ml-1">OLED</span>
            </span>
            <span className="text-[10px] text-zinc-500 tracking-widest uppercase">Stream</span>
          </div>
        </Link>

        {/* Right Action Icons: Gacha, Downloads, Theme, Search & Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Random Anime Picker (Gacha Roulette) Button */}
          {onOpenGacha && (
            <button
              type="button"
              onClick={onOpenGacha}
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-amber-400/20 border border-white/[0.08] hover:border-amber-400/40 flex items-center justify-center text-amber-300 spring-press shadow-sm transition-all"
              title="Acak Anime (Random Anime Picker)"
              aria-label="Acak Anime"
            >
              <Dice5 className="w-4 h-4" />
            </button>
          )}

          {/* Download Manager Trigger Button */}
          {onOpenDownloads && (
            <button
              type="button"
              onClick={onOpenDownloads}
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-400/40 flex items-center justify-center text-cyan-300 spring-press shadow-sm transition-all"
              title="Download Manager (Offline Episodes)"
              aria-label="Download Manager"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* OLED Theme Customizer Trigger Button */}
          {onOpenTheme && (
            <button
              type="button"
              onClick={onOpenTheme}
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/25 flex items-center justify-center text-zinc-300 hover:text-white spring-press shadow-sm transition-all"
              title="Kustomisasi Tema OLED"
              aria-label="Kustomisasi Tema"
            >
              <Palette className="w-4 h-4" style={{ color: accentColor }} />
            </button>
          )}

          {/* Command Palette Trigger Button */}
          <button
            id="search-trigger"
            type="button"
            onClick={onOpenCommandPalette}
            className="h-9 px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/25 flex items-center gap-2 text-zinc-300 hover:text-white spring-press shadow-sm"
            title="Cari Anime (Ctrl+K)"
            aria-label="Cari Anime"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs hidden md:inline font-medium text-zinc-400">Cari...</span>
            <kbd className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* User Avatar Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-white/30 via-white/10 to-transparent hover:from-white/50 spring-press shadow-sm"
            title="Profil Pengguna"
            aria-label="Profil Pengguna"
          >
            <div className="w-full h-full rounded-full bg-[#08080c] overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Avatar"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
}
