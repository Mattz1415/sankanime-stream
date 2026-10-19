'use client';

import React from 'react';
import { MediaCategory } from '@/lib/types';

interface CategoryNavBarProps {
  activeCategory: MediaCategory;
  onSelectCategory: (cat: MediaCategory) => void;
}

interface CategoryConfig {
  id: MediaCategory;
  name: string;
  emoji: string;
  badge: string;
  glowColor: string;
  neonText: string;
  activeBg: string;
  activeBorder: string;
  badgeBg: string;
  badgeText: string;
  neonBarBg: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'Anime',
    name: 'Anime',
    emoji: '🎬',
    badge: '1000+',
    glowColor: 'rgba(6,182,212,0.35)',
    neonText: 'text-cyan-300',
    activeBg: 'bg-cyan-500/15',
    activeBorder: 'border-cyan-400/60',
    badgeBg: 'bg-cyan-400/20 border-cyan-400/30',
    badgeText: 'text-cyan-300',
    neonBarBg: 'bg-cyan-400',
  },
  {
    id: 'Donghua',
    name: 'Donghua',
    emoji: '🐉',
    badge: '3D HD',
    glowColor: 'rgba(16,185,129,0.35)',
    neonText: 'text-emerald-300',
    activeBg: 'bg-emerald-500/15',
    activeBorder: 'border-emerald-400/60',
    badgeBg: 'bg-emerald-400/20 border-emerald-400/30',
    badgeText: 'text-emerald-300',
    neonBarBg: 'bg-emerald-400',
  },
  {
    id: 'Komik',
    name: 'Komik',
    emoji: '📖',
    badge: 'Manga',
    glowColor: 'rgba(245,158,11,0.35)',
    neonText: 'text-amber-300',
    activeBg: 'bg-amber-500/15',
    activeBorder: 'border-amber-400/60',
    badgeBg: 'bg-amber-400/20 border-amber-400/30',
    badgeText: 'text-amber-300',
    neonBarBg: 'bg-amber-400',
  },
  {
    id: 'Manhwa',
    name: 'Manhwa',
    emoji: '🇰🇷',
    badge: 'Color Hits',
    glowColor: 'rgba(168,85,247,0.45)',
    neonText: 'text-purple-300',
    activeBg: 'bg-purple-500/15',
    activeBorder: 'border-purple-400/60',
    badgeBg: 'bg-purple-400/20 border-purple-400/30',
    badgeText: 'text-purple-300',
    neonBarBg: 'bg-purple-400',
  },
  {
    id: 'LK21 Film',
    name: 'LK21 Film',
    emoji: '🍿',
    badge: 'Free HD',
    glowColor: 'rgba(244,63,94,0.35)',
    neonText: 'text-rose-300',
    activeBg: 'bg-rose-500/15',
    activeBorder: 'border-rose-400/60',
    badgeBg: 'bg-rose-400/20 border-rose-400/30',
    badgeText: 'text-rose-300',
    neonBarBg: 'bg-rose-400',
  },
];

export default function CategoryNavBar({
  activeCategory,
  onSelectCategory,
}: CategoryNavBarProps) {
  return (
    <nav
      aria-label="Kategori Utama Nexus"
      className="w-full bg-[#050508]/95 backdrop-blur-md border-b border-white/[0.08] sticky top-[57px] sm:top-[61px] z-30 px-2 sm:px-6 lg:px-8 py-2 transition-all"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-5 gap-1 sm:gap-2.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                style={
                  isActive
                    ? {
                        boxShadow: `0 0 20px ${cat.glowColor}`,
                      }
                    : undefined
                }
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2.5 rounded-2xl border transition-all duration-300 spring-press ${
                  isActive
                    ? `${cat.activeBg} ${cat.activeBorder} ${cat.neonText} font-black scale-[1.02]`
                    : 'bg-white/[0.02] border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10 font-bold'
                }`}
              >
                {/* Emoji & Title */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  <span className="text-sm sm:text-base leading-none select-none">{cat.emoji}</span>
                  <span className="text-[11px] sm:text-xs tracking-tight whitespace-nowrap">
                    {cat.name}
                  </span>
                </div>

                {/* Content Badge */}
                <span
                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold border transition-all select-none leading-none ${
                    isActive
                      ? `${cat.badgeBg} ${cat.badgeText}`
                      : 'bg-white/[0.05] border-white/10 text-zinc-500'
                  }`}
                >
                  {cat.badge}
                </span>

                {/* Glowing Active Neon Bar */}
                {isActive && (
                  <span
                    className={`absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-8 sm:w-14 h-[3px] rounded-full ${cat.neonBarBg} shadow-[0_0_12px_currentColor]`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
