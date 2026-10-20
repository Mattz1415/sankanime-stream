'use client';

import React from 'react';
import { Tv, Sparkles, Heart, Layers, BookOpen, Film } from 'lucide-react';
import { MediaCategory } from '@/lib/types';

interface CategoryNavBarProps {
  activeCategory: MediaCategory;
  onSelectCategory: (cat: MediaCategory) => void;
}

interface NavTabItem {
  id: MediaCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeGradient: string;
  activeBorder: string;
  activeGlow: string;
  iconColor: string;
}

const CATEGORY_TABS: NavTabItem[] = [
  {
    id: 'Anime',
    label: 'Anime',
    icon: Tv,
    activeGradient: 'from-cyan-500/20 to-blue-500/20',
    activeBorder: 'border-cyan-400/40',
    activeGlow: 'rgba(6, 182, 212, 0.25)',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'Donghua',
    label: 'Donghua',
    icon: Sparkles,
    activeGradient: 'from-emerald-500/20 to-teal-500/20',
    activeBorder: 'border-emerald-400/40',
    activeGlow: 'rgba(16, 185, 129, 0.25)',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'Drakor',
    label: 'Drakor',
    icon: Heart,
    activeGradient: 'from-pink-500/20 to-rose-500/20',
    activeBorder: 'border-pink-400/40',
    activeGlow: 'rgba(236, 72, 153, 0.25)',
    iconColor: 'text-pink-400',
  },
  {
    id: 'Manhwa',
    label: 'Manhwa',
    icon: Layers,
    activeGradient: 'from-purple-500/20 to-indigo-500/20',
    activeBorder: 'border-purple-400/40',
    activeGlow: 'rgba(168, 85, 247, 0.25)',
    iconColor: 'text-purple-400',
  },
  {
    id: 'Komik',
    label: 'Komik',
    icon: BookOpen,
    activeGradient: 'from-amber-500/20 to-orange-500/20',
    activeBorder: 'border-amber-400/40',
    activeGlow: 'rgba(245, 158, 11, 0.25)',
    iconColor: 'text-amber-400',
  },
  {
    id: 'Film',
    label: 'Film',
    icon: Film,
    activeGradient: 'from-rose-500/20 to-red-500/20',
    activeBorder: 'border-rose-400/40',
    activeGlow: 'rgba(244, 63, 94, 0.25)',
    iconColor: 'text-rose-400',
  },
];

export default function CategoryNavBar({
  activeCategory,
  onSelectCategory,
}: CategoryNavBarProps) {
  // Normalize LK21 Film to Film if active
  const currentTab = activeCategory === 'LK21 Film' ? 'Film' : activeCategory;

  return (
    <nav
      aria-label="Kategori Media Nexus"
      className="w-full sticky top-[57px] sm:top-[61px] z-30 px-3 sm:px-6 py-2 transition-all pointer-events-none"
    >
      <div className="max-w-fit mx-auto pointer-events-auto">
        {/* Apple TV+ Spatial Segmented Pill Bar */}
        <div className="h-11 px-1.5 rounded-full bg-[#09090f]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex items-center gap-1 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id)}
                style={
                  isActive
                    ? {
                        boxShadow: `0 0 20px ${tab.activeGlow}`,
                      }
                    : undefined
                }
                className={`h-8 sm:h-8.5 px-3 sm:px-4 rounded-full flex items-center justify-center gap-1.5 text-[12px] sm:text-[13px] font-medium tracking-wide transition-all duration-300 whitespace-nowrap spring-press relative select-none ${
                  isActive
                    ? `bg-gradient-to-r ${tab.activeGradient} ${tab.activeBorder} border text-white font-semibold scale-[1.02]`
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? tab.iconColor : 'text-zinc-400 group-hover:text-white'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
