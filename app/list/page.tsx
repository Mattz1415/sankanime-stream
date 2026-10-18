'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import AnimeListView from '@/components/AnimeListView';
import FloatingGlassDock from '@/components/FloatingGlassDock';

export default function ListPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6 max-w-7xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
        Beranda
      </Link>

      <AnimeListView />
      <FloatingGlassDock activeTab="list" />
    </div>
  );
}
