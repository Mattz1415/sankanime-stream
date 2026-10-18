'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, CheckCircle2, CalendarDays, BookmarkCheck, Search } from 'lucide-react';

export default function FlutterBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Beranda', href: '/', icon: Home },
    { label: 'Ongoing', href: '/ongoing', icon: Flame },
    { label: 'Cari', href: '/search', icon: Search, isFab: true },
    { label: 'Jadwal', href: '/schedule', icon: CalendarDays },
    { label: 'Koleksi', href: '/saved', icon: BookmarkCheck },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none md:hidden">
      <nav className="pointer-events-auto flex items-center justify-between gap-1 px-3 py-2 rounded-full glass-nav backdrop-blur-2xl border border-cyan-500/25 shadow-2xl max-w-sm w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-fuchsia-500 text-white shadow-neon-cyan border-2 border-[#07090e] flutter-button hover:scale-105"
                title={item.label}
              >
                <Icon className="w-5 h-5 animate-pulse" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-300 flutter-button ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-cyan-500/15 shadow-neon-cyan' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-cyan-400' : ''}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
