'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, LayoutGrid, Clock, MessageSquare, User, Dice5, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

export type DockTab = 'jelajah' | 'list' | 'riwayat' | 'chat' | 'profil';

interface FloatingGlassDockProps {
  activeTab?: DockTab;
  onTabChange?: (tab: DockTab) => void;
  onOpenGacha?: () => void;
}

export default function FloatingGlassDock({
  activeTab,
  onTabChange,
  onOpenGacha,
}: FloatingGlassDockProps) {
  const pathname = usePathname();
  const { accentColor } = useTheme();

  const tabs: { id: DockTab; label: string; icon: React.ElementType; href: string }[] = [
    { id: 'jelajah', label: 'Jelajah', icon: Compass, href: '/' },
    { id: 'list', label: 'Katalog', icon: LayoutGrid, href: '/list' },
    { id: 'riwayat', label: 'Riwayat', icon: Clock, href: '/history' },
    { id: 'chat', label: 'Komunitas', icon: MessageSquare, href: '/chat' },
    { id: 'profil', label: 'Profil', icon: User, href: '/profile' },
  ];

  const currentActiveTab: DockTab =
    activeTab ||
    (() => {
      if (
        pathname === '/list' ||
        pathname.startsWith('/ongoing') ||
        pathname.startsWith('/complete') ||
        pathname.startsWith('/schedule')
      )
        return 'list';
      if (pathname === '/history' || pathname === '/saved') return 'riwayat';
      if (pathname === '/chat') return 'chat';
      if (pathname === '/profile') return 'profil';
      return 'jelajah';
    })();

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center gap-2 sm:gap-3">
      {/* =========================================================================
          LIQUID GLASS FLOATING CAPSULE DOCK
         ========================================================================= */}
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto liquid-glass-convex px-2 sm:px-3 py-1.5 sm:py-2 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.95)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;

          const content = (
            <button
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 active:scale-95 ${
                isActive
                  ? 'liquid-glass-pill text-white shadow-lg scale-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span
                className={`${isActive ? 'inline-block' : 'hidden sm:inline-block'} text-xs font-bold`}
              >
                {tab.label}
              </span>

              {/* Liquid Droplet Indicator */}
              {isActive && (
                <span
                  className="w-2 h-2 rounded-full absolute -top-1 right-2.5 shadow-[0_0_10px_currentColor] animate-pulse"
                  style={{ backgroundColor: accentColor || '#06b6d4', color: accentColor || '#06b6d4' }}
                />
              )}
            </button>
          );

          if (onTabChange) {
            return <React.Fragment key={tab.id}>{content}</React.Fragment>;
          }

          return (
            <Link key={tab.id} href={tab.href}>
              {content}
            </Link>
          );
        })}
      </nav>

      {/* =========================================================================
          FLUTTER EXTENDED FAB (GACHA / REZE AI SUMMON)
         ========================================================================= */}
      {onOpenGacha && (
        <button
          type="button"
          onClick={onOpenGacha}
          className="pointer-events-auto h-11 sm:h-12 px-3.5 sm:px-4 rounded-full liquid-glass-convex hover:border-amber-400/50 flex items-center gap-2 text-xs font-extrabold text-amber-300 shadow-[0_12px_32px_rgba(251,191,36,0.35)] active:scale-90 transition-all group shrink-0"
          title="Putar Gacha Acak Anime"
        >
          <Dice5 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="hidden md:inline font-bold">Acak Anime</span>
        </button>
      )}
    </div>
  );
}
