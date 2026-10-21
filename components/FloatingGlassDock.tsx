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
    <div className="fixed bottom-5 inset-x-5 z-50 pointer-events-none flex items-center justify-center">
      {/* Floating Liquid Glass Capsule Dock */}
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto h-16 w-full max-w-lg mx-auto rounded-full glass-dock px-3 flex items-center justify-around gap-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;

          const content = (
            <button
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-[#2C2C2E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5] text-white' : 'stroke-2 text-zinc-400'}`} />
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
