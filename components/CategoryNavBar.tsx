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
    activeGradient: 'from-cyan-500/25 to-blue-500/20',
    activeBorder: 'border-cyan-400/50',
    activeGlow: 'rgba(6, 182, 212, 0.3)',
    iconColor: 'text-cyan-300',
  },
  {
    id: 'Donghua',
    label: 'Donghua',
    icon: Sparkles,
    activeGradient: 'from-emerald-500/25 to-teal-500/20',
    activeBorder: 'border-emerald-400/50',
    activeGlow: 'rgba(16, 185, 129, 0.3)',
    iconColor: 'text-emerald-300',
  },
  {
    id: 'Drakor',
    label: 'Drakor',
    icon: Heart,
    activeGradient: 'from-pink-500/25 to-rose-500/20',
    activeBorder: 'border-pink-400/50',
    activeGlow: 'rgba(236, 72, 153, 0.3)',
    iconColor: 'text-pink-300',
  },
  {
    id: 'Manhwa',
    label: 'Manhwa',
    icon: Layers,
    activeGradient: 'from-purple-500/25 to-indigo-500/20',
    activeBorder: 'border-purple-400/50',
    activeGlow: 'rgba(168, 85, 247, 0.3)',
    iconColor: 'text-purple-300',
  },
  {
    id: 'Komik',
    label: 'Komik',
    icon: BookOpen,
    activeGradient: 'from-amber-500/25 to-orange-500/20',
    activeBorder: 'border-amber-400/50',
    activeGlow: 'rgba(245, 158, 11, 0.3)',
    iconColor: 'text-amber-300',
  },
  {
    id: 'Film',
    label: 'Film',
    icon: Film,
    activeGradient: 'from-rose-500/25 to-red-500/20',
    activeBorder: 'border-rose-400/50',
    activeGlow: 'rgba(244, 63, 94, 0.3)',
    iconColor: 'text-rose-300',
  },
];

export default function CategoryNavBar({
  activeCategory,
  onSelectCategory,
}: CategoryNavBarProps) {
  const currentTab = activeCategory === 'LK21 Film' ? 'Film' : activeCategory;

  return (
    <nav
      aria-label="Kategori Media Nexus"
      className="w-full sticky top-[62px] sm:top-[66px] z-30 px-3 sm:px-6 py-2 transition-all pointer-events-none"
    >
      <div className="max-w-fit mx-auto pointer-events-auto">
        {/* =========================================================================
            CUPERTINO LIQUID GLASS SLIDING SEGMENTED CONTROL
            Convex shiny glass capsule with smooth sliding pill
           ========================================================================= */}
        <div className="h-12 p-1 rounded-full liquid-glass-convex shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex items-center gap-1 overflow-x-auto no-scrollbar">
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
                        boxShadow: `0 0 22px ${tab.activeGlow}, inset 0 1.5px 1px rgba(255,255,255,0.5)`,
                      }
                    : undefined
                }
                className={`h-9 px-3.5 sm:px-4.5 rounded-full flex items-center justify-center gap-1.5 text-[12.5px] sm:text-[13px] font-medium tracking-wide transition-all duration-300 whitespace-nowrap active:scale-95 relative select-none ${
                  isActive
                    ? `bg-gradient-to-r ${tab.activeGradient} ${tab.activeBorder} border text-white font-bold scale-[1.02]`
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? tab.iconColor : 'text-zinc-400'
                  }`}
                />
                <span>{tab.label}</span>

                {/* Subtle Liquid Highlight for Active Tab */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
