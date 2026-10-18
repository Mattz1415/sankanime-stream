'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import AnimeAiChat from '@/components/AnimeAiChat';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import RezeAiCompanionModal from '@/components/RezeAiCompanionModal';

export default function ChatPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6 max-w-4xl mx-auto animate-fade-in-up">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold spring-press"
      >
        <ChevronLeft className="w-4 h-4" />
        Beranda
      </Link>

      <AnimeAiChat />
      <RezeAiCompanionModal />
      <FloatingGlassDock activeTab="chat" />
    </div>
  );
}
