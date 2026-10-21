'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, LayoutGrid, Clock, MessageSquare, User } from 'lucide-react';

export type DockTab = 'jelajah' | 'list' | 'riwayat' | 'chat' | 'profil';

interface FloatingGlassDockProps {
  activeTab?: DockTab;
  onTabChange?: (tab: DockTab) => void;
  onOpenGacha?: () => void;
}

export default function FloatingGlassDock({
  activeTab,
  onTabChange,
}: FloatingGlassDockProps) {
  const pathname = usePathname();

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
      {/* Strict Flutter Monochrome Floating Dock */}
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto bg-[#141414] border border-[#262626] px-2 py-1.5 rounded-full flex items-center gap-1 shadow-[0_16px_40px_rgba(0,0,0,0.9)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;

          const content = (
            <button
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-[#2C2C2E] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-2 text-zinc-400'}`} />
              <span
                className={`${isActive ? 'inline-block' : 'hidden sm:inline-block'} text-xs font-medium`}
              >
                {tab.label}
              </span>
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
    </div>
  );
}
