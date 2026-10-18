'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
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
  Sun,
  Moon,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { getEpisodeDetail, resolveServerStream, ResolvedStream } from '@/lib/clientApi';
import { saveWatchHistory, getWatchHistory } from '@/lib/storage';
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

  // Player state
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isDirectVideo, setIsDirectVideo] = useState(false);
  const [activeServerTitle, setActiveServerTitle] = useState<string>('Memilih Server Terbaik...');
  const [activeQuality, setActiveQuality] = useState<string>('720p');
  const [switchingServer, setSwitchingServer] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [xframeBlocked, setXframeBlocked] = useState(false);

  // Features
  const [lightsOff, setLightsOff] = useState(false); // Mode Bioskop (Lights Off)
  const [autoNext, setAutoNext] = useState(true);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        setXframeBlocked(false);
        setIframeLoaded(false);

        const data = await getEpisodeDetail(episodeId);
        setDetail(data);

        // Fetch watch history to mark watched episodes
        const history = getWatchHistory();
        setWatchedEpisodes(history.map((h) => h.episodeId));

        // Save to watch history
        saveWatchHistory({
          animeId: data.animeId || '',
          episodeId: episodeId,
          animeTitle: data.info?.title || data.title.split(' Episode')[0] || data.title,
          episodeTitle: data.title,
          poster: data.info?.poster || '',
          progressPercent: 85,
          currentEpisodeNumber: data.title.match(/Episode\s*(\d+)/i)?.[1] || 1,
          totalEpisodes: data.info?.episodeList?.length || 12,
        });

        // 1. Prioritize vidhide, odcdn, mega over desustream/ondesuhd
        await pickBestServer(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat video episode');
      } finally {
        setLoading(false);
      }
    }

    loadEpisode();
  }, [episodeId]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    };
  }, []);

  // Server selection prioritizing vidhide (720p/480p) -> odcdn -> mega
  const pickBestServer = async (episodeData: EpisodeDetail) => {
    const qualities = episodeData.server?.qualities || [];
    const allServers: { server: QualityServer; quality: string }[] = [];

    qualities.forEach((q) => {
      q.serverList?.forEach((srv) => {
        allServers.push({ server: srv, quality: q.title });
      });
    });

    // Check if defaultStreamingUrl exists and is NOT desustream / ondesuhd
    const defaultUrl = (episodeData.defaultStreamingUrl || '').trim();
    const isProblematicDefault =
      !defaultUrl ||
      /desustream/i.test(defaultUrl) ||
      /ondesuhd/i.test(defaultUrl) ||
      /odstream/i.test(defaultUrl);

    let chosenServer = allServers.find(
      (s) => /vidhide/i.test(s.server.title) && /720/i.test(s.quality)
    );

    if (!chosenServer) {
      chosenServer = allServers.find(
        (s) => /vidhide/i.test(s.server.title) && /480/i.test(s.quality)
      );
    }
    if (!chosenServer) {
      chosenServer = allServers.find((s) => /vidhide/i.test(s.server.title));
    }
    if (!chosenServer) {
      chosenServer = allServers.find((s) => /odcdn/i.test(s.server.title));
    }
    if (!chosenServer) {
      chosenServer = allServers.find((s) => /mega/i.test(s.server.title));
    }
    if (!chosenServer && allServers.length > 0) {
      chosenServer = allServers[0];
    }

    if (chosenServer) {
      await handleSelectServer(chosenServer.server, chosenServer.quality);
    } else if (!isProblematicDefault && defaultUrl) {
      setStreamUrl(defaultUrl);
      setIsDirectVideo(
        defaultUrl.includes('.mp4') || defaultUrl.includes('.m3u8')
      );
      setActiveServerTitle('Default Server');
      setIframeLoaded(true);
    } else if (allServers.length > 0) {
      await handleSelectServer(allServers[0].server, allServers[0].quality);
    }
  };

  const handleSelectServer = async (server: QualityServer, quality: string) => {
    try {
      setSwitchingServer(true);
      setXframeBlocked(false);
      setIframeLoaded(false);

      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);

      const resolved = await resolveServerStream(server.serverId);
      if (resolved && resolved.url) {
        setStreamUrl(resolved.url);
        setIsDirectVideo(resolved.isDirectVideo);
        setActiveServerTitle(`${server.title} (${quality})`);
        setActiveQuality(quality);

        // If direct video, loading is ready immediately
        if (resolved.isDirectVideo) {
          setIframeLoaded(true);
          setSwitchingServer(false);
        } else {
          // Detect possible X-Frame blocking timeout after 8s for problematic hosts
          if (
            /ondesuhd/i.test(server.title) ||
            /desustream/i.test(server.title) ||
            /odstream/i.test(server.title)
          ) {
            iframeTimeoutRef.current = setTimeout(() => {
              setXframeBlocked(true);
            }, 8000);
          }
        }
      } else {
        alert('Gagal mengambil url dari server ini, mencoba server lain...');
      }
    } catch (err) {
      alert('Server sedang sibuk, silakan pilih server alternatif di bawah.');
    } finally {
      // Keep switching spinner until iframe or video loaded
      setTimeout(() => setSwitchingServer(false), 500);
    }
  };

  const handleSwitchToVidhide = () => {
    if (!detail?.server?.qualities) return;
    const allServers: { server: QualityServer; quality: string }[] = [];
    detail.server.qualities.forEach((q) => {
      q.serverList?.forEach((srv) => {
        allServers.push({ server: srv, quality: q.title });
      });
    });

    const vidhide = allServers.find((s) => /vidhide/i.test(s.server.title));
    if (vidhide) {
      handleSelectServer(vidhide.server, vidhide.quality);
    } else {
      alert('Server Vidhide tidak tersedia untuk episode ini.');
    }
  };

  const handlePlayNative = () => {
    if (!streamUrl) return;
    window.open(streamUrl, '_blank');
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
      <div className="p-8 rounded-3xl card-frosted-obsidian border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-16 animate-fade-in-up">
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
    <div className="space-y-6 max-w-5xl mx-auto pb-24 animate-fade-in-up relative">
      {/* Lights Off Cinema Dimmer Overlay */}
      {lightsOff && (
        <div
          onClick={() => setLightsOff(false)}
          className="fixed inset-0 z-40 bg-black/92 backdrop-blur-md transition-opacity duration-500 cursor-pointer pointer-events-auto"
          title="Klik di mana saja untuk menyalakan lampu bioskop"
        />
      )}

      {/* Top Breadcrumb Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-50">
        <div className="flex items-center gap-2">
          {detail.animeId ? (
            <Link
              href={`/anime?id=${detail.animeId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full card-frosted-obsidian hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold spring-press"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Seri
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full card-frosted-obsidian hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold spring-press"
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

        {/* Action Controls: Mode Bioskop & Auto-Next */}
        <div className="flex items-center gap-2">
          {/* Auto-Next Toggle */}
          <button
            onClick={() => setAutoNext(!autoNext)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all spring-press ${
              autoNext
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'card-frosted-obsidian text-zinc-400 hover:text-white'
            }`}
            title="Auto-Next Episode"
          >
            {autoNext ? <ToggleRight className="w-4 h-4 text-cyan-400" /> : <ToggleLeft className="w-4 h-4 text-zinc-500" />}
            <span>Auto-Next</span>
          </button>

          {/* Mode Bioskop (Lights Off) Toggle */}
          <button
            onClick={() => setLightsOff(!lightsOff)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all spring-press ${
              lightsOff
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                : 'card-frosted-obsidian text-zinc-300 hover:text-white'
            }`}
            title="Mode Bioskop: Padamkan lampu di sekitar video"
          >
            {lightsOff ? <Sun className="w-3.5 h-3.5 fill-black" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{lightsOff ? 'Nyalakan Lampu' : 'Mode Bioskop'}</span>
          </button>
        </div>
      </div>

      {/* Video Player Box with Frosted Obsidian Frame */}
      <div
        className={`relative rounded-3xl overflow-hidden card-frosted-obsidian border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.98)] bg-black transition-all duration-500 ${
          lightsOff ? 'relative z-50 ring-2 ring-white/30 scale-[1.01]' : ''
        }`}
      >
        {/* HUD Frame Top Bar */}
        <div className="px-4 py-3 bg-[#040408] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-cinematic font-bold text-white tracking-wide">NEXUS PLAYER</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-semibold">
              {activeServerTitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePlayNative}
              className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 spring-press bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm"
              title="Putar langsung di browser/player native"
            >
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Putar Eksternal</span>
            </button>

            {streamUrl && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 spring-press px-2.5 py-1 rounded-lg hover:bg-white/5"
              >
                Tab Baru <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Video Player Canvas Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Loading / Switching Screen with Neon Spinner */}
          {(switchingServer || (!iframeLoaded && !xframeBlocked)) && (
            <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center gap-3 text-white">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold tracking-wide">Menghubungkan ke Pemutar...</p>
                <p className="text-[11px] text-zinc-500 font-medium">{activeServerTitle}</p>
              </div>
            </div>
          )}

          {/* X-Frame Blocked Warning Overlay */}
          {xframeBlocked && (
            <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 animate-fade-in-up">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-cinematic font-bold text-base text-white">
                  Server Membatasi Pemutaran Tersemat
                </h3>
                <p className="text-xs text-zinc-400">
                  Server ini membatasi iframe langsung. Beralih ke server Vidhide atau putar di tab baru:
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleSwitchToVidhide}
                  className="px-5 py-2 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 shadow-md spring-press flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Ganti ke Server Vidhide (Rekomendasi)
                </button>

                <button
                  onClick={handlePlayNative}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs spring-press flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Tab Baru
                </button>
              </div>
            </div>
          )}

          {/* Stream Player: Direct HTML5 Video or Hidden Iframe until onLoad */}
          {streamUrl ? (
            isDirectVideo ? (
              <video
                ref={videoRef}
                src={streamUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
                onEnded={() => {
                  if (autoNext && detail.hasNextEpisode && detail.nextEpisode) {
                    router.push(`/watch?id=${detail.nextEpisode.episodeId}`);
                  }
                }}
              />
            ) : (
              <iframe
                key={streamUrl}
                src={streamUrl}
                className={`w-full h-full border-0 transition-opacity duration-500 ${
                  iframeLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onLoad={() => {
                  setIframeLoaded(true);
                  setSwitchingServer(false);
                }}
                onError={() => {
                  setXframeBlocked(true);
                }}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={detail.title}
              />
            )
          ) : (
            <div className="text-center p-6 text-zinc-400 text-xs space-y-2">
              <Tv className="w-10 h-10 mx-auto text-zinc-700 mb-2" />
              <p>Tautan streaming langsung tidak tersedia.</p>
              <p className="text-[11px] text-zinc-500">Silakan pilih salah satu opsi server di bawah.</p>
            </div>
          )}
        </div>

        {/* HUD Frame Bottom Navigation Controls */}
        <div className="p-4 bg-[#040408] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          {detail.hasPrevEpisode && detail.prevEpisode ? (
            <Link
              href={`/watch?id=${detail.prevEpisode.episodeId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full card-frosted-obsidian hover:border-white/20 text-xs font-semibold text-zinc-200 hover:text-white spring-press"
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

      {/* Multi-Quality & Multi-Server Matrix (360p, 480p, 720p, 1080p) */}
      {detail.server?.qualities && detail.server.qualities.length > 0 && (
        <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Pilihan Resolusi & Server Video (Vidhide, Ondesuhd, Desustream, Odstream, Odcdn, Mega)
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Pilih resolusi dan penyedia server cadangan di bawah jika mengalami kendala pemutaran:
          </p>

          <div className="space-y-3 pt-1">
            {detail.server.qualities.map((group: QualityGroup, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-black px-3.5 py-1 rounded-full bg-white/10 text-white border border-white/20 w-fit">
                  {group.title}
                </span>

                <div className="flex flex-wrap gap-2">
                  {group.serverList.map((srv: QualityServer) => {
                    const isSelected =
                      activeServerTitle.includes(srv.title) &&
                      activeServerTitle.includes(group.title);
                    const isVidhide = /vidhide/i.test(srv.title);

                    return (
                      <button
                        key={srv.serverId}
                        onClick={() => handleSelectServer(srv, group.title)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold spring-press transition-all ${
                          isSelected
                            ? 'bg-white text-black font-bold shadow-md scale-105'
                            : isVidhide
                            ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.06]'
                        }`}
                      >
                        {srv.title.toUpperCase()}
                        {isVidhide && <span className="ml-1 text-[10px] text-cyan-400 font-bold">★</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Episode Drawer Directly Below Player */}
      {detail.info?.episodeList && detail.info.episodeList.length > 0 && (
        <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-white" />
              <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
                Daftar Episode Seri ({detail.info.episodeList.length} Episode)
              </h3>
            </div>
            {detail.animeId && (
              <Link
                href={`/anime?id=${detail.animeId}`}
                className="text-xs text-zinc-300 hover:text-white font-semibold underline spring-press"
              >
                Halaman Detail Seri
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {detail.info.episodeList.map((ep, epIdx) => {
              const isCurrent = ep.episodeId === episodeId;
              const isWatched = watchedEpisodes.includes(ep.episodeId);

              return (
                <Link
                  key={ep.episodeId}
                  href={`/watch?id=${ep.episodeId}`}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold spring-press transition-all flex flex-col items-center justify-center gap-1 ${
                    isCurrent
                      ? 'bg-white text-black shadow-lg scale-105'
                      : isWatched
                      ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30'
                      : 'bg-white/[0.04] hover:bg-white/[0.09] text-zinc-300 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <span className="truncate w-full">Ep {ep.eps}</span>
                  {isWatched && !isCurrent && (
                    <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Ditonton
                    </span>
                  )}
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
          <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
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
