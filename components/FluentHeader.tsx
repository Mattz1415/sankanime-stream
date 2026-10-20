'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Dice5 } from 'lucide-react';
import { MediaCategory } from '@/lib/types';
import { DEFAULT_AVATAR } from '@/lib/imageHelper';

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
  onOpenGacha,
}: FluentHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#000000]/95 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 pt-[max(env(safe-area-inset-top),12px)] pb-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 spring-press">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400/20 via-purple-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center shadow-lg group-hover:border-cyan-400/50 transition-all">
            <span className="font-cinematic font-black text-lg bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
              N
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-cinematic font-black text-base tracking-tight text-white block leading-none">
                NEXUS
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[9px] font-bold text-cyan-300 uppercase tracking-widest">
                OLED
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-medium">
              Streaming Hub
            </span>
          </div>
        </Link>

        {/* Right Action Controls: Search, Gacha, Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Gacha Summon Button */}
          {onOpenGacha && (
            <button
              type="button"
              onClick={onOpenGacha}
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-amber-400/20 border border-white/[0.08] hover:border-amber-400/40 flex items-center justify-center text-amber-300 spring-press shadow-sm transition-all"
              title="Acak Anime & Drakor (Gacha Summon)"
              aria-label="Acak Media"
            >
              <Dice5 className="w-4 h-4" />
            </button>
          )}

          {/* Global Search / Command Palette Trigger Button */}
          <button
            id="search-trigger"
            type="button"
            onClick={onOpenCommandPalette}
            className="h-9 px-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/25 flex items-center gap-2 text-zinc-300 hover:text-white spring-press shadow-sm transition-all"
            title="Pencarian Global (Ctrl+K)"
            aria-label="Pencarian Global"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs hidden sm:inline font-medium text-zinc-400">Pencarian...</span>
            <kbd className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* User Profile Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-400/40 via-white/20 to-pink-500/40 hover:from-cyan-400/70 spring-press shadow-sm transition-all"
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
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
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
