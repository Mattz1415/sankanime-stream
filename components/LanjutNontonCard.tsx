'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Clock, ChevronRight, X, Trash2 } from 'lucide-react';
import { WatchHistoryItem, AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';
import { deleteWatchHistoryItem } from '@/lib/storage';

interface LanjutNontonProps {
  historyItem?: WatchHistoryItem | null;
  fallbackAnime?: AnimeListItem | null;
  onItemDeleted?: () => void;
}

export default function LanjutNontonCard({
  historyItem,
  fallbackAnime,
  onItemDeleted,
}: LanjutNontonProps) {
  const { accentColor } = useTheme();

  // If no history item and no fallback, return null
  if (!historyItem && !fallbackAnime) return null;

  const isRealHistory = Boolean(historyItem);
  const title = historyItem?.animeTitle || fallbackAnime?.title || 'Anime';
  const episodeText = historyItem?.episodeTitle || `Episode ${fallbackAnime?.episodes || 1} Sub Indo`;
  const episodeId = historyItem?.episodeId || (fallbackAnime ? `episode-${fallbackAnime.animeId}-1` : '');
  const poster = historyItem?.poster || fallbackAnime?.poster || '';
  const progressPercent = historyItem?.progressPercent || 65;
  const progressLabel = historyItem?.currentEpisodeNumber
    ? `Episode ${historyItem.currentEpisodeNumber} / ${historyItem.totalEpisodes || '12'} • ${progressPercent}% selesai`
    : `Episode Terkini • ${progressPercent}% ditonton`;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (historyItem) {
      deleteWatchHistoryItem(historyItem.episodeId);
      if (onItemDeleted) onItemDeleted();
    }
  };

  return (
    <div className="relative w-full rounded-3xl p-4 sm:p-6 card-frosted-obsidian shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden group animate-fade-in-up">
      {/* Background soft ambient blur */}
      <div
        className="ambient-glow -top-12 -right-12 w-64 h-64 opacity-20"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
          <span className="text-[11px] font-extrabold tracking-widest uppercase text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            LANJUT NONTON
          </span>
          {isRealHistory && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-bold uppercase tracking-wider">
              Tersimpan
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRealHistory && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full bg-white/[0.04] hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-colors spring-press"
              title="Hapus dari Lanjut Nonton"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Link
            href="/history"
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-0.5 spring-press ml-1"
          >
            Riwayat <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Thumbnail & Title & Progress */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Thumbnail Poster */}
          {episodeId ? (
            <Link
              href={`/watch?id=${episodeId}`}
              className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-[#040408] border border-white/[0.08] shadow-lg group-hover:border-white/30 spring-press block"
            >
              <img
                src={poster}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-[#040408] border border-white/[0.08]">
              <img src={poster} alt={title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Info & Progress */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <span className="inline-block text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
              {isRealHistory ? 'Terakhir Ditonton' : 'Rekomendasi Lanjutan'}
            </span>
            <h3 className="font-cinematic font-bold text-base sm:text-lg text-white truncate group-hover:text-zinc-100 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-zinc-400 truncate">
              {episodeText}
            </p>

            {/* Progress Bar Component */}
            <div className="space-y-1 pt-1 max-w-sm">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${accentColor}, #ffffff)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                <span>{progressLabel}</span>
                <span>{progressPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Capsule Button "Lanjut" & Delete Button */}
        <div className="w-full sm:w-auto flex items-center gap-2 sm:justify-end flex-shrink-0 pt-2 sm:pt-0">
          {episodeId && (
            <Link
              href={`/watch?id=${episodeId}`}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-zinc-200 shadow-[0_4px_20px_rgba(255,255,255,0.25)] spring-press flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              Lanjut
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
