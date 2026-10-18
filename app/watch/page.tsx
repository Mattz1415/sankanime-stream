'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  SkipBack,
  SkipForward,
  Server,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Tv,
  List,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { getEpisodeDetail, getServerStreamUrl } from '@/lib/clientApi';
import { saveWatchHistory } from '@/lib/storage';
import { EpisodeDetail, QualityGroup, QualityServer } from '@/lib/types';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import { useTheme } from '@/lib/themeContext';

function WatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('id') || '';
  const { accentColor } = useTheme();

  const [detail, setDetail] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [activeServerTitle, setActiveServerTitle] = useState<string>('Default Server');
  const [switchingServer, setSwitchingServer] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  useEffect(() => {
    if (!episodeId) {
      setLoading(false);
      setError('ID episode tidak ditemukan');
      return;
    }

    async function loadEpisode() {
      try {
        setLoading(true);
        setError(null);
        const data = await getEpisodeDetail(episodeId);
        setDetail(data);
        setStreamUrl(data.defaultStreamingUrl || '');
        setActiveServerTitle('Default Server');

        // Save to watch history
        if (data) {
          saveWatchHistory({
            animeId: data.animeId || '',
            episodeId: episodeId,
            animeTitle: data.info?.title || data.title.split(' Episode')[0] || data.title,
            episodeTitle: data.title,
            poster: data.info?.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
            progressPercent: 75,
            currentEpisodeNumber: data.title.match(/Episode\s*(\d+)/i)?.[1] || 1,
            totalEpisodes: data.info?.episodeList?.length || 12,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat video episode');
      } finally {
        setLoading(false);
      }
    }

    loadEpisode();
  }, [episodeId]);

  const handleSelectServer = async (server: QualityServer, quality: string) => {
    try {
      setSwitchingServer(true);
      const url = await getServerStreamUrl(server.serverId);
      if (url) {
        setStreamUrl(url);
        setActiveServerTitle(`${server.title} (${quality})`);
      }
    } catch (err) {
      alert('Server ini sedang tidak dapat dijangkau, mencoba server lain...');
    } finally {
      setSwitchingServer(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto py-8">
        <div className="aspect-video w-full rounded-3xl skeleton-shimmer" />
        <div className="h-8 w-2/3 rounded-xl skeleton-shimmer" />
        <div className="h-24 w-full rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-3xl glass-fluent border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-16">
        <h2 className="font-cinematic font-bold text-lg text-white">Gagal Memutar Episode</h2>
        <p className="text-xs text-zinc-400">{error || 'Episode tidak ditemukan'}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${theaterMode ? 'max-w-none' : 'max-w-5xl'} mx-auto pb-24`}>
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {detail.animeId ? (
            <Link
              href={`/anime?id=${detail.animeId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Seri
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Beranda
            </Link>
          )}

          <span className="hidden sm:inline-block text-xs text-zinc-500">|</span>
          <span className="text-xs text-zinc-300 font-cinematic font-bold truncate max-w-xs sm:max-w-md">
            {detail.title}
          </span>
        </div>

        {/* Theater mode toggle */}
        <button
          onClick={() => setTheaterMode(!theaterMode)}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-fluent border border-white/10 text-xs text-zinc-300 hover:text-white transition-all active:scale-95"
          title="Toggle Mode Bioskop"
        >
          {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{theaterMode ? 'Normal' : 'Bioskop'}</span>
        </button>
      </div>

      {/* Video Player Box with Glassmorphism Frame */}
      <div className="relative rounded-3xl overflow-hidden glass-fluent border border-white/15 shadow-2xl bg-black">
        {/* HUD Frame Top Bar */}
        <div className="px-4 py-3 bg-[#0a0d14] border-b border-white/10 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-cinematic font-bold text-white">NEXUS PLAYER</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-semibold">
              {activeServerTitle}
            </span>
          </div>

          {streamUrl && (
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Buka Tab Baru <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Video Iframe Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {switchingServer ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <RefreshCw className="w-8 h-8 animate-spin text-white" />
              <p className="text-xs font-semibold">Menghubungkan ke Server...</p>
            </div>
          ) : streamUrl ? (
            <iframe
              src={streamUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={detail.title}
            />
          ) : (
            <div className="text-center p-6 text-zinc-400 text-xs space-y-2">
              <Tv className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <p>Tautan streaming langsung tidak tersedia.</p>
              <p className="text-[11px] text-zinc-500">Silakan pilih salah satu opsi server di bawah.</p>
            </div>
          )}
        </div>

        {/* HUD Frame Bottom Navigation Controls */}
        <div className="p-4 bg-[#0a0d14] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {detail.hasPrevEpisode && detail.prevEpisode ? (
            <Link
              href={`/watch?id=${detail.prevEpisode.episodeId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all active:scale-95"
            >
              <SkipBack className="w-4 h-4" />
              Episode Sebelumnya
            </Link>
          ) : (
            <div />
          )}

          {detail.hasNextEpisode && detail.nextEpisode && (
            <Link
              href={`/watch?id=${detail.nextEpisode.episodeId}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 shadow-lg transition-all active:scale-95"
            >
              Episode Selanjutnya
              <SkipForward className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Multi-Quality & Multi-Server Matrix */}
      {detail.server?.qualities && detail.server.qualities.length > 0 && (
        <div className="p-6 rounded-3xl glass-fluent border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-white" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Pilihan Server & Resolusi Video
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Jika video mengalami kendala atau buffering, ganti resolusi dan server penyedia di bawah ini:
          </p>

          <div className="space-y-3 pt-1">
            {detail.server.qualities.map((group: QualityGroup, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 w-fit">
                  {group.title}
                </span>

                <div className="flex flex-wrap gap-2">
                  {group.serverList.map((srv: QualityServer) => {
                    const isSelected = activeServerTitle.includes(srv.title) && activeServerTitle.includes(group.title);
                    return (
                      <button
                        key={srv.serverId}
                        onClick={() => handleSelectServer(srv, group.title)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-white text-black font-bold shadow-md'
                            : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10'
                        }`}
                      >
                        {srv.title.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Episode Drawer from Same Anime */}
      {detail.info?.episodeList && detail.info.episodeList.length > 0 && (
        <div className="p-6 rounded-3xl glass-fluent border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-white" />
              <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
                Daftar Episode Seri
              </h3>
            </div>
            {detail.animeId && (
              <Link
                href={`/anime?id=${detail.animeId}`}
                className="text-xs text-zinc-300 hover:text-white font-semibold underline"
              >
                Halaman Seri
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {detail.info.episodeList.map((ep) => {
              const isCurrent = ep.episodeId === episodeId;
              return (
                <Link
                  key={ep.episodeId}
                  href={`/watch?id=${ep.episodeId}`}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all active:scale-95 ${
                    isCurrent
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border border-white/5'
                  }`}
                >
                  Ep {ep.eps}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Memuat pemutar video...
        </div>
      }
    >
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
        <WatchContent />
        <FloatingGlassDock />
      </div>
    </Suspense>
  );
}
