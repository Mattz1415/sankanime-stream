'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params?.id as string;

  const [detail, setDetail] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [activeServerTitle, setActiveServerTitle] = useState<string>('Default Server');
  const [switchingServer, setSwitchingServer] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  useEffect(() => {
    if (!episodeId) return;

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
      <div className="space-y-6 animate-pulse">
        <div className="aspect-video w-full rounded-3xl skeleton-shimmer" />
        <div className="h-10 w-3/4 rounded-xl skeleton-shimmer" />
        <div className="h-24 w-full rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-3xl glass-card border-red-500/30 text-center space-y-4 max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-white">Gagal Memutar Episode</h2>
        <p className="text-xs text-slate-400">{error || 'Episode tidak ditemukan'}</p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${theaterMode ? 'max-w-none' : ''}`}>
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {detail.animeId ? (
            <Link
              href={`/anime/${detail.animeId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-all flutter-button"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Seri
            </Link>
          ) : (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-all flutter-button"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
          )}

          <span className="hidden sm:inline-block text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
            {detail.title}
          </span>
        </div>

        {/* Theater mode toggle */}
        <button
          onClick={() => setTheaterMode(!theaterMode)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-white/10 text-xs text-slate-300 hover:text-white transition-all flutter-button"
          title="Toggle Mode Bioskop"
        >
          {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{theaterMode ? 'Normal' : 'Bioskop'}</span>
        </button>
      </div>

      {/* Cyber HUD Video Player Box */}
      <div className="relative rounded-3xl overflow-hidden glass-flutter border border-cyan-500/30 shadow-2xl bg-black">
        {/* HUD Frame Top Bar */}
        <div className="px-4 py-2.5 bg-[#0a0e17] border-b border-cyan-500/20 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-white">NEXUS HUD PLAYER</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {activeServerTitle}
            </span>
          </div>

          {streamUrl && (
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Buka di Tab Baru <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Video Iframe Container (16:9 Aspect Ratio) */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {switchingServer ? (
            <div className="flex flex-col items-center gap-3 text-cyan-400">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
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
            <div className="text-center p-6 text-slate-400 text-xs space-y-2">
              <Tv className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>Tautan streaming langsung tidak tersedia.</p>
              <p className="text-[11px] text-slate-500">Silakan pilih salah satu opsi server di bawah ini.</p>
            </div>
          )}
        </div>

        {/* HUD Frame Bottom Navigation Controls */}
        <div className="p-3 sm:p-4 bg-[#0d121c] border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          {/* Prev Episode */}
          {detail.hasPrevEpisode && detail.prevEpisode ? (
            <Link
              href={`/watch/${detail.prevEpisode.episodeId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-all flutter-button"
            >
              <SkipBack className="w-4 h-4" />
              Episode Sebelumnya
            </Link>
          ) : (
            <div />
          )}

          {/* Next Episode */}
          {detail.hasNextEpisode && detail.nextEpisode && (
            <Link
              href={`/watch/${detail.nextEpisode.episodeId}`}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-neon-cyan transition-all flutter-button"
            >
              Episode Selanjutnya
              <SkipForward className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Server & Quality Selection Matrix */}
      {detail.server?.qualities && detail.server.qualities.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pilihan Server & Resolusi Video
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Jika video buffering atau tidak dapat diputar, silakan ganti server/kualitas di bawah ini:
          </p>

          <div className="space-y-3">
            {detail.server.qualities.map((group: QualityGroup, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 w-fit">
                  {group.title}
                </span>

                <div className="flex flex-wrap gap-2">
                  {group.serverList.map((srv: QualityServer) => {
                    const isSelected = activeServerTitle.includes(srv.title) && activeServerTitle.includes(group.title);
                    return (
                      <button
                        key={srv.serverId}
                        onClick={() => handleSelectServer(srv, group.title)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flutter-button ${
                          isSelected
                            ? 'bg-cyan-500 text-black font-bold shadow-neon-cyan'
                            : 'bg-[#151c28] hover:bg-[#1f2838] text-slate-300 hover:text-white border border-white/5'
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

      {/* Episode Drawer / List from Same Anime */}
      {detail.info?.episodeList && detail.info.episodeList.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Episode Lainnya
              </h3>
            </div>
            {detail.animeId && (
              <Link
                href={`/anime/${detail.animeId}`}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Halaman Seri Lengkap
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {detail.info.episodeList.map((ep) => {
              const isCurrent = ep.episodeId === episodeId;
              return (
                <Link
                  key={ep.episodeId}
                  href={`/watch/${ep.episodeId}`}
                  className={`p-2.5 rounded-xl text-center text-xs font-semibold transition-all flutter-button ${
                    isCurrent
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan border border-cyan-400/50'
                      : 'bg-[#121824] hover:bg-[#1a2335] text-slate-300 hover:text-white border border-white/5'
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
