'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Dice5, Sparkles } from 'lucide-react';
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

const CATEGORY_TITLES: Record<string, string> = {
  Anime: 'Anime Series',
  Donghua: 'Donghua 3D',
  Drakor: 'K-Drama Hits',
  Manhwa: 'Manhwa Webtoon',
  Komik: 'Manga & Komik',
  Film: 'Bioskop HD',
  'LK21 Film': 'Bioskop HD',
};

export default function FluentHeader({
  activeCategory,
  onSelectCategory,
  onOpenProfile,
  onOpenCommandPalette,
  onOpenGacha,
}: FluentHeaderProps) {
  const currentCategoryTitle = CATEGORY_TITLES[activeCategory] || 'Stream';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#000000]/80 backdrop-blur-3xl px-3 sm:px-6 lg:px-8 pt-[max(env(safe-area-inset-top),14px)] pb-3 transition-all pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
        {/* =========================================================================
            FLUTTER SLIVER LARGE TITLE & WATER-LENS LOGO
           ========================================================================= */}
        <Link href="/" className="flex items-center gap-3 group shrink-0 active:scale-95 transition-all">
          {/* Water-Lens Refractive Logo Container */}
          <div className="w-10 h-10 rounded-[20px] liquid-glass-convex flex items-center justify-center shadow-lg group-hover:border-cyan-400/60 transition-all relative overflow-hidden">
            <span className="font-cinematic font-black text-xl bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
              N
            </span>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-pink-500/10 pointer-events-none" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-cinematic font-black text-lg sm:text-xl tracking-tight text-white block leading-none">
                Nexus
              </span>
              <span className="px-2 py-0.5 rounded-full liquid-glass-pill text-[9px] font-black text-cyan-300 uppercase tracking-widest">
                FLUTTER
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 tracking-wide font-medium flex items-center gap-1">
              <span>{currentCategoryTitle}</span>
              <span className="w-1 h-1 rounded-full bg-pink-400 inline-block" />
            </span>
          </div>
        </Link>

        {/* =========================================================================
            FLOATING LIQUID GLASS DYNAMIC ISLAND CONTROLS (SEARCH & ACTIONS)
           ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Gacha Summon Button (Convex Water-Lens Effect) */}
          {onOpenGacha && (
            <button
              type="button"
              onClick={onOpenGacha}
              className="w-10 h-10 rounded-full liquid-glass-convex hover:border-amber-400/50 flex items-center justify-center text-amber-300 active:scale-90 shadow-md transition-all relative group"
              title="Acak Anime & Drakor (Gacha Summon)"
              aria-label="Acak Media"
            >
              <Dice5 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
          )}

          {/* Interactive Liquid Glass Search Pill */}
          <button
            id="search-trigger"
            type="button"
            onClick={onOpenCommandPalette}
            className="h-10 px-3.5 sm:px-4 rounded-full liquid-glass-surface hover:border-white/35 flex items-center gap-2 text-zinc-300 hover:text-white active:scale-95 shadow-md transition-all"
            title="Pencarian Global (Ctrl+K)"
            aria-label="Pencarian Global"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="text-xs hidden sm:inline font-medium text-zinc-300">
              Pencarian Cepat...
            </span>
            <kbd className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* User Profile Avatar with Liquid Droplet Indicator */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative w-10 h-10 rounded-full p-[2px] liquid-glass-convex active:scale-90 shadow-md transition-all"
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
            {/* Liquid Droplet Online Glow */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </button>
        </div>
      </div>
    </header>
  );
}
