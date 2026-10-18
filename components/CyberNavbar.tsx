'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bookmark, Zap, Sparkles, Tv } from 'lucide-react';

export default function CyberNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full glass-flutter border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 p-[1.5px] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-neon-cyan">
            <div className="w-full h-full bg-[#090d14] rounded-[10px] flex items-center justify-center">
              <Tv className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500 bg-clip-text text-transparent">
                NEXUS<span className="text-white">STREAM</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Sanka API
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Futuristic Anime Streaming Experience
            </p>
          </div>
        </Link>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#101623]/80 p-1.5 rounded-full border border-white/10">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname === '/'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/ongoing"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname === '/ongoing'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Ongoing
          </Link>
          <Link
            href="/complete"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname === '/complete'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Tamat
          </Link>
          <Link
            href="/schedule"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname === '/schedule'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Jadwal Rilis
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            aria-label="Cari Anime"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#121824] hover:bg-[#1a2233] border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs transition-all flutter-button"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Cari Anime...</span>
          </Link>

          <Link
            href="/saved"
            aria-label="Tersimpan & Riwayat"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#121824] hover:bg-[#1a2233] border border-white/10 hover:border-purple-500/40 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all flutter-button"
          >
            <Bookmark className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Koleksi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
