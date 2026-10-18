'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Server,
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
  ToggleRight,
  Zap,
  Radio,
  Lock,
  Unlock,
  Layers,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Clock,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Timer,
  Volume2,
  Sliders,
  Ratio,
  Activity,
  Flame,
  MessageSquare
} from 'lucide-react';
import { getEpisodeDetail, resolveServerStream } from '@/lib/clientApi';
import { saveWatchHistory, getWatchHistory } from '@/lib/storage';
import { EpisodeDetail, QualityGroup, QualityServer } from '@/lib/types';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import { useTheme } from '@/lib/themeContext';
import { tunnelStream, TunnelResult } from '@/lib/streamTunnel';
import EpisodeDiscussion from '@/components/EpisodeDiscussion';

interface SceneBookmark {
  id: string;
  timestampSeconds: number;
  timeFormatted: string;
  note: string;
}

type AspectRatioMode = 'fit' | 'fill' | 'stretch';

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
  const [blobSrcDoc, setBlobSrcDoc] = useState<string>('');
  const [isDirectVideo, setIsDirectVideo] = useState(false);
  const [activeServerTitle, setActiveServerTitle] = useState<string>('Memilih Server Terbaik...');
  const [activeQuality, setActiveQuality] = useState<string>('720p');
  const [switchingServer, setSwitchingServer] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [xframeBlocked, setXframeBlocked] = useState(false);

  // Tunnel state
  const [tunnelResult, setTunnelResult] = useState<TunnelResult | null>(null);
  const [isTunneling, setIsTunneling] = useState(false);

  // Commercial Player Features
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('fit'); // 'fit' (16:9), 'fill' (ultrawide crop), 'stretch'
  const [ambilightEnabled, setAmbilightEnabled] = useState(true);
  const [serverPing, setServerPing] = useState<number>(38);

  // Sleep Timer state
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState<number | null>(null);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);

  // Scene Bookmarks
  const [bookmarks, setBookmarks] = useState<SceneBookmark[]>([]);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [showBookmarkDrawer, setShowBookmarkDrawer] = useState(false);

  // Features
  const [lightsOff, setLightsOff] = useState(false); // Mode Bioskop
  const [autoNext, setAutoNext] = useState(true);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load episode data
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

        // Load scene bookmarks
        try {
          const rawBm = localStorage.getItem(`nexus_bookmarks_${episodeId}`);
          if (rawBm) setBookmarks(JSON.parse(rawBm));
        } catch {}

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

        // Ping calculation simulation
        setServerPing(Math.floor(28 + Math.random() * 25));

        // Server selection
        await pickBestServer(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat video episode');
      } finally {
        setLoading(false);
      }
    }

    loadEpisode();
  }, [episodeId]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Auto-hide controls timer
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3800);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Sleep Timer interval countdown
  useEffect(() => {
    if (sleepSecondsLeft === null) return;
    if (sleepSecondsLeft <= 0) {
      // Pause playback & stop sleep timer
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setSleepSecondsLeft(null);
      setSleepTimerMinutes(null);
      alert('Waktu Tidur (Sleep Timer) tercapai. Video telah dijeda.');
      return;
    }

    const timer = setInterval(() => {
      setSleepSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepSecondsLeft]);

  const handleSetSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    setShowSleepTimerMenu(false);
    if (minutes === null) {
      setSleepSecondsLeft(null);
    } else {
      setSleepSecondsLeft(minutes * 60);
    }
  };

  // Toggle Native Fullscreen
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  };

  // Server selection prioritizing vidhide -> odcdn -> mega
  const pickBestServer = async (episodeData: EpisodeDetail) => {
    const qualities = episodeData.server?.qualities || [];
    const allServers: { server: QualityServer; quality: string }[] = [];

    qualities.forEach((q) => {
      q.serverList?.forEach((srv) => {
        allServers.push({ server: srv, quality: q.title });
      });
    });

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
      setActiveServerTitle('Default Server');
      await executeTunneling(defaultUrl, 'Default Server');
    } else if (allServers.length > 0) {
      await handleSelectServer(allServers[0].server, allServers[0].quality);
    }
  };

  const executeTunneling = async (targetUrl: string, serverTitle: string) => {
    setIsTunneling(true);
    setBlobSrcDoc('');

    try {
      const isTunnelCandidate =
        /desustream|ondesuhd|odstream/i.test(serverTitle) ||
        /desustream|ondesuhd|odstream/i.test(targetUrl);

      if (isTunnelCandidate) {
        const tunnel = await tunnelStream(targetUrl);
        setTunnelResult(tunnel);

        if (tunnel.mode === 'direct' && tunnel.streamUrl) {
          setStreamUrl(tunnel.streamUrl);
          setIsDirectVideo(true);
          setIframeLoaded(true);
        } else if (tunnel.mode === 'blob') {
          setStreamUrl(tunnel.blobUrl || targetUrl);
          setBlobSrcDoc(tunnel.srcDoc || '');
          setIsDirectVideo(false);
          setIframeLoaded(true);
        } else {
          setStreamUrl(targetUrl);
          setIsDirectVideo(false);
        }
      } else {
        const isDirect = targetUrl.includes('.mp4') || targetUrl.includes('.m3u8');
        setStreamUrl(targetUrl);
        setIsDirectVideo(isDirect);
        setTunnelResult({
          success: true,
          mode: isDirect ? 'direct' : 'fallback',
          layer: isDirect ? 1 : 0,
          tunnelActive: false,
          message: 'Direct Player',
        });
        if (isDirect) {
          setIframeLoaded(true);
        }
      }
    } catch (tunnelErr) {
      console.warn('[Watch] Tunnel execution error', tunnelErr);
      setStreamUrl(targetUrl);
      setIsDirectVideo(false);
    } finally {
      setIsTunneling(false);
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
        setActiveServerTitle(`${server.title} (${quality})`);
        setActiveQuality(quality);

        if (resolved.isDirectVideo) {
          setStreamUrl(resolved.url);
          setBlobSrcDoc('');
          setIsDirectVideo(true);
          setIframeLoaded(true);
          setTunnelResult({
            success: true,
            mode: 'direct',
            streamUrl: resolved.url,
            layer: 1,
            tunnelActive: true,
            message: 'Tunnel Active ⚡ (Layer 1: Direct Video)',
          });
        } else {
          await executeTunneling(resolved.url, server.title);

          if (
            /ondesuhd/i.test(server.title) ||
            /desustream/i.test(server.title) ||
            /odstream/i.test(server.title)
          ) {
            iframeTimeoutRef.current = setTimeout(() => {
              if (!iframeLoaded) {
                setXframeBlocked(true);
              }
            }, 10000);
          }
        }
      } else {
        alert('Gagal mengambil url dari server ini, silakan coba server lain.');
      }
    } catch (err) {
      alert('Server sedang sibuk, silakan pilih server alternatif di bawah.');
    } finally {
      setTimeout(() => setSwitchingServer(false), 400);
    }
  };

  // Skip Intro (+85s) & Skip -10 / +10
  const handleSkipSeconds = (deltaSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + deltaSeconds);
      resetControlsTimer();
    } else {
      // In iframe mode, display visual indication
      const msg = deltaSeconds > 0 ? `+${deltaSeconds}s` : `${deltaSeconds}s`;
      console.log(`[Player] Skip ${msg}`);
    }
  };

  // Add Timestamp Bookmark
  const handleAddBookmark = () => {
    let currentSec = 0;
    if (videoRef.current) {
      currentSec = Math.floor(videoRef.current.currentTime);
    }

    const mins = Math.floor(currentSec / 60);
    const secs = currentSec % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const newBm: SceneBookmark = {
      id: `bm_${Date.now()}`,
      timestampSeconds: currentSec,
      timeFormatted: formatted,
      note: newBookmarkNote.trim() || `Adegan favorit menit ${formatted}`,
    };

    const updated = [newBm, ...bookmarks];
    setBookmarks(updated);
    setNewBookmarkNote('');
    setShowBookmarkDrawer(true);

    try {
      localStorage.setItem(`nexus_bookmarks_${episodeId}`, JSON.stringify(updated));
    } catch {}
  };

  const handleSeekToBookmark = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    try {
      localStorage.setItem(`nexus_bookmarks_${episodeId}`, JSON.stringify(updated));
    } catch {}
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
          className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md transition-opacity duration-500 cursor-pointer pointer-events-auto"
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

      {/* Video Player Box with Ambient Glow Wrapper */}
      <div className="relative">
        {/* Dynamic Ambilight Glow Aura */}
        {ambilightEnabled && !lightsOff && (
          <div className="player-ambilight-glow" />
        )}

        {/* Master Player Container */}
        <div
          ref={playerContainerRef}
          onMouseMove={resetControlsTimer}
          onTouchStart={resetControlsTimer}
          className={`relative rounded-3xl overflow-hidden card-frosted-obsidian border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.98)] bg-black transition-all duration-500 ${
            lightsOff ? 'relative z-50 ring-2 ring-white/30 scale-[1.01]' : ''
          } ${isFullscreen ? '!rounded-none !border-0 fixed inset-0 z-50 w-screen h-screen' : ''}`}
        >
          {/* HUD Frame Top Bar (Auto-hides or stays on hover) */}
          <div
            className={`px-4 py-2.5 bg-[#030306]/90 backdrop-blur-xl border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300 transition-opacity duration-300 relative z-30 ${
              isFullscreen && !showControls && !isScreenLocked ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-cinematic font-bold text-white tracking-wide">NEXUS PLAYER</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-semibold">
                {activeServerTitle}
              </span>

              {/* Server Latency Pill */}
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {serverPing}ms
              </span>

              {/* Glowing Tunnel Active Indicator */}
              {tunnelResult?.tunnelActive && (
                <span className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Tunnel Active ⚡</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Ambilight Toggle */}
              <button
                type="button"
                onClick={() => setAmbilightEnabled(!ambilightEnabled)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 spring-press border ${
                  ambilightEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : 'bg-white/5 text-zinc-400 border-white/10'
                }`}
                title="Toggle Ambilight Glow"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Ambilight</span>
              </button>

              {/* Sleep Timer Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 spring-press border ${
                    sleepSecondsLeft !== null
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-zinc-400 border-white/10'
                  }`}
                  title="Sleep Timer"
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {sleepSecondsLeft !== null
                      ? `${Math.floor(sleepSecondsLeft / 60)}:${(sleepSecondsLeft % 60)
                          .toString()
                          .padStart(2, '0')}`
                      : 'Sleep'}
                  </span>
                </button>

                {/* Sleep Timer Dropdown */}
                {showSleepTimerMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-[#06060c] border border-white/15 p-2 shadow-2xl z-50 text-xs space-y-1">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500">
                      Waktu Tidur (Auto-Pause)
                    </div>
                    {[15, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleSetSleepTimer(m)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors ${
                          sleepTimerMinutes === m ? 'text-amber-400 font-bold bg-white/5' : 'text-zinc-300'
                        }`}
                      >
                        {m} Menit
                      </button>
                    ))}
                    {sleepTimerMinutes !== null && (
                      <button
                        onClick={() => handleSetSleepTimer(null)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10"
                      >
                        Matikan Timer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center rounded-full bg-white/5 p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setAspectMode('fit')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    aspectMode === 'fit' ? 'bg-white text-black font-black' : 'text-zinc-400'
                  }`}
                  title="16:9 Fit"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setAspectMode('fill')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    aspectMode === 'fill' ? 'bg-white text-black font-black' : 'text-zinc-400'
                  }`}
                  title="Ultrawide Fill (Zoom Crop - Tanpa Bar Hitam)"
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => setAspectMode('stretch')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    aspectMode === 'stretch' ? 'bg-white text-black font-black' : 'text-zinc-400'
                  }`}
                  title="Stretch"
                >
                  Stretch
                </button>
              </div>

              {/* Native External Link */}
              <button
                type="button"
                onClick={handlePlayNative}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 spring-press bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm"
                title="Buka tab player eksternal"
              >
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Eksternal</span>
              </button>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-full text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 spring-press border border-white/20"
                title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (Landscape Immersive)'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Video Player Canvas Container */}
          <div
            className={`relative w-full bg-black flex items-center justify-center overflow-hidden ${
              isFullscreen ? 'h-full flex-1' : 'aspect-video'
            }`}
          >
            {/* Screen Touch Lock Overlay */}
            {isScreenLocked && (
              <div
                onClick={() => setIsScreenLocked(false)}
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-center justify-center cursor-pointer pointer-events-auto"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsScreenLocked(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-black/80 border border-white/30 text-white text-xs font-bold flex items-center gap-2 shadow-2xl spring-press hover:bg-black"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>Layar Terkunci (Ketuk untuk Buka)</span>
                </button>
              </div>
            )}

            {/* Loading / Switching Screen */}
            {(switchingServer || isTunneling || (!iframeLoaded && !xframeBlocked)) && (
              <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center gap-3 text-white">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold tracking-wide">
                    {isTunneling ? 'Mempersiapkan Stream Tunnel...' : 'Menghubungkan ke Pemutar...'}
                  </p>
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
                    Server ini membatasi iframe langsung. Beralih ke server Vidhide atau jalankan tunnel kembali:
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

            {/* Stream Player Canvas: Direct HTML5 Video or Sanitized Blob/Iframe */}
            {streamUrl ? (
              isDirectVideo ? (
                <video
                  ref={videoRef}
                  src={streamUrl}
                  controls
                  autoPlay
                  playsInline
                  className={`w-full h-full bg-black transition-all duration-300 ${
                    aspectMode === 'fill'
                      ? 'video-scale-fill'
                      : aspectMode === 'stretch'
                      ? 'video-scale-stretch'
                      : 'video-scale-fit'
                  }`}
                  onEnded={() => {
                    if (autoNext && detail.hasNextEpisode && detail.nextEpisode) {
                      router.push(`/watch?id=${detail.nextEpisode.episodeId}`);
                    }
                  }}
                />
              ) : (
                <div
                  className={`w-full h-full overflow-hidden flex items-center justify-center ${
                    aspectMode === 'fill' ? 'scale-110' : ''
                  }`}
                >
                  <iframe
                    key={streamUrl + (blobSrcDoc ? '-blob' : '')}
                    src={blobSrcDoc ? undefined : streamUrl}
                    srcDoc={blobSrcDoc || undefined}
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
                </div>
              )
            ) : (
              <div className="text-center p-6 text-zinc-400 text-xs space-y-2">
                <Tv className="w-10 h-10 mx-auto text-zinc-700 mb-2" />
                <p>Tautan streaming langsung tidak tersedia.</p>
                <p className="text-[11px] text-zinc-500">Silakan pilih salah satu opsi server di bawah.</p>
              </div>
            )}

            {/* Floating Commercial Overlay Controls (Skip Intro, Screen Lock, Quick Bookmark) */}
            <div
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 flex items-center gap-2 p-1.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.95)] ${
                showControls && !isScreenLocked ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              {/* Skip Intro (+85s) Button */}
              <button
                type="button"
                onClick={() => handleSkipSeconds(85)}
                className="px-3 py-1.5 rounded-full text-xs font-black bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 spring-press flex items-center gap-1.5"
                title="Lewati Intro Anime (+85 detik)"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Lewati Intro (+85s)</span>
              </button>

              {/* Quick -10s */}
              <button
                type="button"
                onClick={() => handleSkipSeconds(-10)}
                className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 spring-press"
                title="Mundur 10 detik"
              >
                -10s
              </button>

              {/* Quick +10s */}
              <button
                type="button"
                onClick={() => handleSkipSeconds(10)}
                className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 spring-press"
                title="Maju 10 detik"
              >
                +10s
              </button>

              {/* Bookmark Scene Button */}
              <button
                type="button"
                onClick={handleAddBookmark}
                className="p-1.5 rounded-full text-zinc-300 hover:text-amber-400 bg-white/10 hover:bg-white/20 spring-press"
                title="Simpan Menit Ini (Bookmark Adegan Favorit)"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>

              {/* Lock Touch Screen Button */}
              <button
                type="button"
                onClick={() => setIsScreenLocked(true)}
                className="p-1.5 rounded-full text-zinc-300 hover:text-amber-400 bg-white/10 hover:bg-white/20 spring-press"
                title="Kunci Sentuhan Layar (Cegah Sentuhan Tidak Sengaja)"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* HUD Frame Bottom Navigation Controls */}
          <div
            className={`p-4 bg-[#030306]/95 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 ${
              isFullscreen ? 'hidden' : 'flex'
            }`}
          >
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
      </div>

      {/* Timestamp Bookmark Drawer (Adegan Favorit) */}
      {bookmarks.length > 0 && (
        <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
                Catatan Adegan Favorit ({bookmarks.length})
              </h3>
            </div>
            <button
              onClick={handleAddBookmark}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> + Tambah Menit Ini
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2 hover:border-white/15 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                      {bm.timeFormatted}
                    </span>
                    <button
                      onClick={() => handleSeekToBookmark(bm.timestampSeconds)}
                      className="text-xs text-white font-bold hover:text-cyan-400 truncate flex items-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Lompat ke adegan
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-1">{bm.note}</p>
                </div>
                <button
                  onClick={() => handleDeleteBookmark(bm.id)}
                  className="p-1 rounded text-zinc-600 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Hapus bookmark ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Quality & Multi-Server Matrix (Vidhide, Ondesuhd, Desustream, Odstream, Odcdn, Mega) */}
      {detail.server?.qualities && detail.server.qualities.length > 0 && (
        <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
                Pilihan Resolusi & Server Video
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Tunnel Ready</span>
            </div>
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
                    const isTunnelServer = /desustream|ondesuhd|odstream/i.test(srv.title);

                    return (
                      <button
                        key={srv.serverId}
                        onClick={() => handleSelectServer(srv, group.title)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold spring-press transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-white text-black font-bold shadow-md scale-105'
                            : isVidhide
                            ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : isTunnelServer
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.06]'
                        }`}
                      >
                        <span>{srv.title.toUpperCase()}</span>
                        {isVidhide && <span className="text-[10px] text-cyan-400 font-bold">★</span>}
                        {isTunnelServer && <span className="text-[10px] text-emerald-400 font-bold">⚡</span>}
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

      {/* Episode Community Discussion & Emoji Reactions Section */}
      <EpisodeDiscussion episodeId={episodeId} episodeTitle={detail.title} />
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
