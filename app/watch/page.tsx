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
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { getEpisodeDetail, getServerStreamUrl } from '@/lib/clientApi';
import { saveWatchHistory } from '@/lib/storage';
import { EpisodeDetail, QualityGroup, QualityServer } from '@/lib/types';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import { useTheme } from '@/lib/themeContext';

const normalizeUrl = (url: string): string => {
  if (!url) return '';
  let clean = url.trim();
  if (clean.startsWith('//')) {
    clean = `https:${clean}`;
  }
  return clean;
};

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
  const [adBlockSandbox, setAdBlockSandbox] = useState<boolean>(true);

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
        const resolvedUrl = normalizeUrl(data.defaultStreamingUrl || '');
        setStreamUrl(resolvedUrl);
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
        setStreamUrl(normalizeUrl(url));
        setActiveServerTitle(`${server.title} (${quality})`);
      }
    } catch (err) {
      alert('Server ini sedang tidak dapat dijangkau, mencoba server lain...');
    } finally {
      setSwitchingServer(false);
    }
  };

  const handlePlayNative = () => {
    if (!streamUrl) return;
    const clean = normalizeUrl(streamUrl);
    window.open(clean, '_blank');
  };

  const handleNextFallbackServer = async () => {
    if (!detail?.server?.qualities) return;
    const allServers: { server: QualityServer; quality: string }[] = [];
    for (const q of detail.server.qualities) {
      for (const srv of q.serverList) {
        allServers.push({ server: srv, quality: q.title });
      }
    }
    if (allServers.length === 0) return;

    const currentIdx = allServers.findIndex((s) => activeServerTitle.includes(s.server.title));
    const nextIdx = (currentIdx + 1) % allServers.length;
    const nextChoice = allServers[nextIdx];
    await handleSelectServer(nextChoice.server, nextChoice.quality);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8 animate-fade-in-up">
        <div className="aspect-video w-full rounded-3xl oled-shimmer" />
        <div className="h-8 w-2/3 rounded-xl oled-shimmer" />
        <div className="h-24 w-full rounded-2xl oled-shimmer" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-3xl glass-obsidian border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-16 animate-fade-in-up">
        <h2 className="font-cinematic font-bold text-lg text-white">Gagal Memutar Episode</h2>
        <p className="text-xs text-zinc-400">{error || 'Episode tidak ditemukan'}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md spring-press"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${theaterMode ? 'max-w-none' : 'max-w-5xl'} mx-auto pb-24 animate-fade-in-up`}>
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {detail.animeId ? (
            <Link
              href={`/anime?id=${detail.animeId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold spring-press"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Seri
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold spring-press"
            >
              <ChevronLeft className="w-4 h-4" />
              Beranda
            </Link>
          )}

          <span className="hidden sm:inline-block text-xs text-zinc-600">|</span>
          <span className="text-xs text-zinc-300 font-cinematic font-bold truncate max-w-xs sm:max-w-md">
            {detail.title}
          </span>
        </div>

        {/* Theater mode toggle */}
        <button
          onClick={() => setTheaterMode(!theaterMode)}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-obsidian border border-white/[0.08] text-xs text-zinc-300 hover:text-white spring-press"
          title="Toggle Mode Bioskop"
        >
          {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{theaterMode ? 'Normal' : 'Bioskop'}</span>
        </button>
      </div>

      {/* Video Player Box with Obsidian Glass Frame */}
      <div className="relative rounded-3xl overflow-hidden glass-obsidian border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.98)] bg-black">
        {/* HUD Frame Top Bar */}
        <div className="px-4 py-3 bg-[#040508] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-cinematic font-bold text-white tracking-wide">NEXUS PLAYER</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-semibold">
              {activeServerTitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Putar Mode Native */}
            <button
              type="button"
              onClick={handlePlayNative}
              className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 spring-press bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm"
              title="Putar langsung di webview native atau browser external"
            >
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Putar Mode Native</span>
            </button>

            {/* Tombol Fallback Otomatis Server */}
            <button
              type="button"
              onClick={handleNextFallbackServer}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 spring-press bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10"
              title="Ganti ke server alternatif secara otomatis"
            >
              <RefreshCw className="w-3 h-3 text-zinc-400" />
              <span className="hidden sm:inline">Ganti Server</span>
            </button>

            {streamUrl && (
              <a
                href={normalizeUrl(streamUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 spring-press px-2.5 py-1 rounded-lg hover:bg-white/5"
              >
                Buka Tab Baru <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Video Iframe Container (Vidhide, Odstream, Ondesuhd, Desustream compatible without sandbox/no-referrer) */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {switchingServer ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <RefreshCw className="w-8 h-8 animate-spin text-white" />
              <p className="text-xs font-semibold">Menghubungkan ke Server...</p>
            </div>
          ) : streamUrl ? (
            <iframe
              key={streamUrl}
              src={normalizeUrl(streamUrl)}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title={detail.title}
            />
          ) : (
            <div className="text-center p-6 text-zinc-400 text-xs space-y-2">
              <Tv className="w-10 h-10 mx-auto text-zinc-700 mb-2" />
              <p>Tautan streaming langsung tidak tersedia.</p>
              <p className="text-[11px] text-zinc-500">Silakan pilih salah satu opsi server di bawah.</p>
            </div>
          )}
        </div>

        {/* HUD Frame Bottom Navigation Controls */}
        <div className="p-4 bg-[#040508] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          {detail.hasPrevEpisode && detail.prevEpisode ? (
            <Link
              href={`/watch?id=${detail.prevEpisode.episodeId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-zinc-200 hover:text-white spring-press"
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 shadow-lg spring-press"
            >
              Episode Selanjutnya
              <SkipForward className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Multi-Quality & Multi-Server Matrix */}
      {detail.server?.qualities && detail.server.qualities.length > 0 && (
        <div className="p-6 rounded-3xl glass-obsidian border border-white/[0.06] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-white" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Pilihan Server & Resolusi Video (Vidhide, Ondesuhd, Desustream, Odstream, Odcdn, Mega)
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
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold spring-press ${
                          isSelected
                            ? 'bg-white text-black font-bold shadow-md'
                            : 'bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.06]'
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
        <div className="p-6 rounded-3xl glass-obsidian border border-white/[0.06] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
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
                className="text-xs text-zinc-300 hover:text-white font-semibold underline spring-press"
              >
                Halaman Seri
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {detail.info.episodeList.map((ep, epIdx) => {
              const isCurrent = ep.episodeId === episodeId;
              return (
                <Link
                  key={ep.episodeId}
                  href={`/watch?id=${ep.episodeId}`}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold spring-press animate-fade-in-up stagger-${(epIdx % 12) + 1} ${
                    isCurrent
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border border-white/[0.06]'
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
