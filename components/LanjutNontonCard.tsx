'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Clock, ChevronRight, Trash2, Zap, Sparkles } from 'lucide-react';
import { WatchHistoryItem, AnimeListItem } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';
import { deleteWatchHistoryItem } from '@/lib/storage';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';

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

  if (!historyItem && !fallbackAnime) return null;

  const isRealHistory = Boolean(historyItem);
  const title = historyItem?.animeTitle || fallbackAnime?.title || 'Anime';
  const episodeText = historyItem?.episodeTitle || `Episode ${fallbackAnime?.episodes || 1} Sub Indo`;
  const episodeId = historyItem?.episodeId || (fallbackAnime ? `episode-${fallbackAnime.animeId}-1` : '');
  const poster = historyItem?.poster || fallbackAnime?.poster || '';
  const progressPercent = historyItem?.progressPercent || 72;
  const lastSecondsFormatted = historyItem?.lastSeconds
    ? `${Math.floor(historyItem.lastSeconds / 60)}:${String(historyItem.lastSeconds % 60).padStart(2, '0')}`
    : null;
  const progressLabel = lastSecondsFormatted
    ? `Terhenti di ${lastSecondsFormatted} • ${progressPercent}% selesai`
    : historyItem?.currentEpisodeNumber
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
    <div className="relative w-full rounded-[32px] p-5 sm:p-6 liquid-glass-surface shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden group animate-fade-in-up">
      {/* 1.5px Specular Highlight at Top */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Ambient Radial Glow */}
      <div
        className="ambient-glow -top-12 -right-12 w-72 h-72 opacity-25"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header Row */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
          <span className="text-[11px] font-black tracking-widest uppercase text-white flex items-center gap-1.5 font-cinematic">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Lanjut Nonton
          </span>
          {isRealHistory ? (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-bold uppercase tracking-wider border border-cyan-500/30">
              Riwayat
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase tracking-wider border border-amber-500/30">
              Rekomendasi
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isRealHistory && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full bg-white/[0.04] hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-colors spring-press"
              title="Hapus dari Riwayat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Link
            href="/history"
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-0.5 spring-press ml-1"
          >
            Semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        {/* Left: Thumbnail & Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {episodeId ? (
            <Link
              href={`/watch?id=${episodeId}`}
              className="relative w-18 h-24 sm:w-22 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-[#040408] border border-white/15 shadow-xl group/thumb spring-press block"
            >
              <SmartImage
                src={poster}
                title={title}
                alt={title}
                type="anime"
                className="w-full h-full object-cover group-hover/thumb:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="relative w-18 h-24 sm:w-22 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-[#040408] border border-white/15">
              <SmartImage
                src={poster}
                title={title}
                alt={title}
                type="anime"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details & Neon Progress */}
          <div className="flex-1 min-w-0 space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
              {isRealHistory ? 'Terakhir Ditonton' : 'Rekomendasi Lanjutan'}
            </span>
            <h3 className="font-cinematic font-black text-base sm:text-lg text-white truncate group-hover:text-cyan-200 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-zinc-400 truncate">
              {episodeText}
            </p>

            {/* Neon Progress Bar */}
            <div className="space-y-1 pt-1 max-w-sm">
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-[1px]">
                <div
                  className="h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(0,240,255,0.7)]"
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, #00f0ff, #38bdf8, #ffffff)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                <span>{progressLabel}</span>
                <span className="font-bold text-white">{progressPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Capsule Action Button */}
        <div className="w-full sm:w-auto flex items-center gap-2 sm:justify-end shrink-0 pt-2 sm:pt-0">
          {episodeId && (
            <Link
              href={`/watch?id=${episodeId}`}
              className="flex-1 sm:flex-initial px-7 py-3 rounded-full bg-white text-black font-black text-xs sm:text-sm hover:bg-zinc-200 shadow-[0_0_25px_rgba(255,255,255,0.35)] spring-press flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Lanjut Nonton</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
