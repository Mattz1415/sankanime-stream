'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Terminal } from 'lucide-react';

interface FluentHeaderProps {
  activeCategory: 'Anime' | 'Komik' | 'Donghua';
  onSelectCategory: (cat: 'Anime' | 'Komik' | 'Donghua') => void;
  onOpenProfile?: () => void;
  onReplayIntro?: () => void;
}

export default function FluentHeader({
  activeCategory,
  onSelectCategory,
  onOpenProfile,
  onReplayIntro,
}: FluentHeaderProps) {
  const categories: Array<'Anime' | 'Komik' | 'Donghua'> = ['Anime', 'Komik', 'Donghua'];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#020205]/85 border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0 spring-press">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400/20 via-white/20 to-pink-500/20 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg group-hover:border-white/40 transition-all">
            <span className="font-cinematic font-black text-lg text-white">K</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-cinematic font-black text-base tracking-tight text-white block leading-none">
              KPanime<span className="text-cyan-400 font-sans text-xs font-semibold ml-1">Stream</span>
            </span>
            <span className="text-[10px] text-zinc-500 tracking-widest uppercase">Kaijinbo Core</span>
          </div>
        </Link>

        {/* Central Pill-Switcher: "Anime", "Komik", "Donghua" */}
        <div className="glass-pill-container p-1 rounded-full flex items-center shadow-inner border border-white/[0.06]">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 spring-press ${
                  isActive
                    ? 'bg-white text-black shadow-md shadow-white/20 scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Right Action Icons: Replay Intro, Search & Avatar */}
        <div className="flex items-center gap-2">
          {/* Replay kpanime.py Coding Onboarding */}
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="w-9 h-9 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 hover:text-white spring-press shadow-sm"
              title="Putar Ulang Intro Koding kpanime.py"
              aria-label="Replay Intro"
            >
              <Terminal className="w-4 h-4" />
            </button>
          )}

          {/* Search Button */}
          <Link
            href="/search"
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/25 flex items-center justify-center text-zinc-300 hover:text-white spring-press shadow-sm"
            title="Pencarian Anime"
            aria-label="Cari Anime"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* User Avatar Button (Kepiskepsi) */}
          <button
            onClick={onOpenProfile}
            className="relative w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-400/40 via-white/20 to-pink-500/40 hover:from-white/60 spring-press shadow-sm"
            title="Profil Pengguna (Kepiskepsi)"
            aria-label="Profil Pengguna"
          >
            <div className="w-full h-full rounded-full bg-[#08080c] overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Avatar"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online Green Pulsing Indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
          </button>
        </div>
      </div>
    </header>
  );
}
