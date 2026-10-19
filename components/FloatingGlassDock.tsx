'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, LayoutGrid, Clock, MessageSquare, User } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

export type DockTab = 'jelajah' | 'list' | 'riwayat' | 'chat' | 'profil';

interface FloatingGlassDockProps {
  activeTab?: DockTab;
  onTabChange?: (tab: DockTab) => void;
}

export default function FloatingGlassDock({
  activeTab,
  onTabChange,
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

  // Resolve which tab is active based on pathname or prop
  const currentActiveTab: DockTab = activeTab || (() => {
    if (pathname === '/list' || pathname.startsWith('/ongoing') || pathname.startsWith('/complete') || pathname.startsWith('/schedule')) return 'list';
    if (pathname === '/history' || pathname === '/saved') return 'riwayat';
    if (pathname === '/chat') return 'chat';
    if (pathname === '/profile') return 'profil';
    return 'jelajah';
  })();

  return (
    <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="glass-dock px-2 sm:px-3 py-1.5 sm:py-2 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.98)] border border-white/[0.12]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;

          const content = (
            <button
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 spring-press ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/25 scale-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`${isActive ? 'inline-block' : 'hidden sm:inline-block'} text-xs font-bold`}>
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full absolute -top-0.5 right-2"
                  style={{ backgroundColor: accentColor }}
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
      </div>
    </nav>
  );
}
