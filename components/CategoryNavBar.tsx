'use client';

import React from 'react';
import { Tv, Flame, Heart, Layers, BookOpen, Film } from 'lucide-react';
import { MediaCategory } from '@/lib/types';

interface CategoryNavBarProps {
  activeCategory: MediaCategory;
  onSelectCategory: (cat: MediaCategory) => void;
}

interface NavTabItem {
  id: MediaCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_TABS: NavTabItem[] = [
  { id: 'Anime', label: 'Anime', icon: Tv },
  { id: 'Donghua', label: 'Donghua', icon: Flame },
  { id: 'Drakor', label: 'Drakor', icon: Heart },
  { id: 'Manhwa', label: 'Manhwa', icon: Layers },
  { id: 'Komik', label: 'Komik', icon: BookOpen },
  { id: 'Film', label: 'Film', icon: Film },
];

export default function CategoryNavBar({
  activeCategory,
  onSelectCategory,
}: CategoryNavBarProps) {
  const currentTab = activeCategory === 'LK21 Film' ? 'Film' : activeCategory;

  return (
    <nav
      aria-label="Kategori Media"
      className="w-full sticky top-[62px] sm:top-[66px] z-30 px-2 sm:px-6 py-2 transition-all pointer-events-none"
    >
      <div className="w-full max-w-2xl mx-auto pointer-events-auto">
        {/* Strict Monochrome Flutter Dark: CupertinoSlidingSegmentedControl */}
        <div className="h-11 p-1 rounded-full bg-[#141414] border border-[#262626] flex items-center gap-1 overflow-x-auto no-scrollbar justify-start sm:justify-center">
          {CATEGORY_TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectCategory(tab.id)}
                className={`h-9 px-3.5 sm:px-4 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap active:scale-95 select-none shrink-0 ${
                  isActive
                    ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
