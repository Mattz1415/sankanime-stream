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
    <header className="sticky top-0 z-40 w-full bg-[#000000] border-b border-[#262626] px-3 sm:px-6 lg:px-8 pt-[max(env(safe-area-inset-top),12px)] pb-3 transition-all pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
        {/* Logo & Category Title */}
        <Link href="/" className="flex items-center gap-3 group shrink-0 active:scale-95 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center shadow-sm group-hover:border-[#3A3A3C] transition-all">
            <span className="font-cinematic font-black text-xl text-white">
              N
            </span>
          </div>

          <div>
            <span className="font-cinematic font-black text-lg sm:text-xl tracking-tight text-white block leading-none">
              Nexus
            </span>
            <span className="text-[11px] text-zinc-400 tracking-wide font-medium">
              {currentCategoryTitle}
            </span>
          </div>
        </Link>

        {/* Dynamic Island Search & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Search Pill */}
          <button
            id="search-trigger"
            type="button"
            onClick={onOpenCommandPalette}
            className="h-10 px-3.5 sm:px-4 rounded-full bg-[#141414] hover:bg-[#1C1C1E] border border-[#262626] hover:border-[#3A3A3C] flex items-center gap-2 text-zinc-300 hover:text-white active:scale-95 transition-all"
            title="Pencarian Global (Ctrl+K)"
            aria-label="Pencarian Global"
          >
            <Search className="w-4 h-4 text-zinc-400" />
            <span className="text-xs hidden sm:inline font-medium text-zinc-300">
              Pencarian Cepat...
            </span>
            <kbd className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded-full bg-[#2C2C2E] text-zinc-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* User Profile Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="relative w-10 h-10 rounded-full p-[2px] bg-[#141414] border border-[#262626] active:scale-95 transition-all overflow-hidden"
            title="Profil Pengguna"
            aria-label="Profil Pengguna"
          >
            <div className="w-full h-full rounded-full bg-[#0D0D0D] overflow-hidden flex items-center justify-center">
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
          </button>
        </div>
      </div>
    </header>
  );
}
