'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import CommunityDiscussionView from '@/components/CommunityDiscussionView';
import FloatingGlassDock from '@/components/FloatingGlassDock';

export default function CommunityChatPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6 max-w-4xl mx-auto animate-fade-in-up">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full card-frosted-obsidian hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold spring-press"
      >
        <ChevronLeft className="w-4 h-4" />
        Kembali ke Beranda
      </Link>

      <CommunityDiscussionView targetId="global" targetTitle="Forum Diskusi Komunitas Anime" />
      <FloatingGlassDock activeTab="chat" />
    </div>
  );
}
