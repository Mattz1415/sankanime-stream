'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
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
  ChevronLeft,
  FastForward,
  Rewind,
  Sliders,
  Download,
  ListPlus,
  BookmarkCheck,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { getEpisodeDetail, resolveServerStream } from '@/lib/clientApi';
import {
  saveWatchHistory,
  getWatchHistory,
  getEpisodeResumeTime,
  saveWatchLater,
  removeWatchLater,
  isAnimeWatchLater,
  getPlayerSettings,
} from '@/lib/storage';
import { EpisodeDetail, QualityGroup, QualityServer, PlayerSettings } from '@/lib/types';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import { useTheme } from '@/lib/themeContext';
import { tunnelStream, TunnelResult } from '@/lib/streamTunnel';
import CommunityDiscussionView from '@/components/CommunityDiscussionView';
import DownloadManagerModal from '@/components/DownloadManagerModal';
import PlayerSettingsModal from '@/components/PlayerSettingsModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  fetchSamehadakuEpisodeServers,
  resolveSamehadakuPlayerAjax,
  fetchSamehadakuEpisodeDetail,
  resolveSamehadakuServerBridge,
  searchSamehadaku,
  fetchSamehadakuDetail,
  resolveOtakudesuBase64Mirror,
  generateVipStreams,
  SamehadakuServerOption,
  VipStreamOption,
} from '@/services/wibuEngine';

function formatSeconds(sec?: number): string {
  if (!sec || sec <= 0) return '00:00';
  const mins = Math.floor(sec / 60);
  const remSec = Math.floor(sec % 60);
  return `${mins}:${remSec.toString().padStart(2, '0')}`;
}

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

  // Tunnel state
  const [tunnelResult, setTunnelResult] = useState<TunnelResult | null>(null);
  const [isTunneling, setIsTunneling] = useState(false);

  // Visual settings & automations
  const [serverPing, setServerPing] = useState<number>(36);
  const [lightsOff, setLightsOff] = useState(false); // Mode Bioskop
  const [autoNext, setAutoNext] = useState(true);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [isWatchLater, setIsWatchLater] = useState(false);

  // Modals & Prompts
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [resumePromptSec, setResumePromptSec] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Flutter UI + Apple Liquid Glass Provider Switcher & Resolution States
  const [activeProvider, setActiveProvider] = useState<'otakudesu' | 'samehadaku' | 'kurama'>('otakudesu');
  const [selectedResolution, setSelectedResolution] = useState<string>('720p');
  const [samehadakuServers, setSamehadakuServers] = useState<SamehadakuServerOption[]>([]);
  const [loadingSamehadaku, setLoadingSamehadaku] = useState<boolean>(false);
  const [vipServers, setVipServers] = useState<VipStreamOption[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Instance cleanup for video/audio elements to prevent background sound leaks
  const cleanupMediaInstances = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch {}
    }
    if (typeof window !== 'undefined') {
      try {
        document.querySelectorAll('audio, video').forEach((el) => {
          try {
            (el as HTMLMediaElement).pause();
          } catch {}
        });
      } catch {}
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  // Load episode data & history resume point
  useEffect(() => {
    if (!episodeId) {
      setLoading(false);
      setError('ID episode tidak ditemukan');
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const data = await getEpisodeDetail(episodeId);
        setDetail(data);

        // Fetch watch history to mark watched episodes
        const history = getWatchHistory();
        setWatchedEpisodes(history.map((h) => h.episodeId));

        // Check Watch Later status
        if (data.animeId) {
          setIsWatchLater(isAnimeWatchLater(data.animeId));
        }

        // Check resume timestamp
        const resumeSec = getEpisodeResumeTime(episodeId);
        if (resumeSec > 20) {
          setResumePromptSec(resumeSec);
        }

        // Save initial entry to history
        saveWatchHistory({
          animeId: data.animeId || '',
          episodeId: episodeId,
          animeTitle: data.info?.title || data.title.split(' Episode')[0] || data.title,
          episodeTitle: data.title,
          poster: data.info?.poster || '',
          lastSeconds: resumeSec || 0,
          currentEpisodeNumber: data.title.match(/Episode\s*(\d+)/i)?.[1] || 1,
          totalEpisodes: data.info?.episodeList?.length || 12,
        });

        // Ping calculation simulation
        setServerPing(Math.floor(25 + Math.random() * 20));

        // Pre-populate VIP streams
        const epNum = data.title.match(/Episode\s*(\d+)/i)?.[1] || 1;
        const animeTitle = data.info?.title || data.title.split(' Episode')[0] || data.title;
        setVipServers(generateVipStreams(animeTitle, epNum));

        // Server selection
        await pickBestServer(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat video episode');
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [episodeId]);

  const pickBestServer = async (data: EpisodeDetail) => {
    const qualities = data.server?.qualities || [];
    let defaultUrl = data.defaultStreamingUrl || '';

    // Priority 1: High quality 720p or 480p server
    const targetGroup =
      qualities.find((q) => q.title.includes('720p')) ||
      qualities.find((q) => q.title.includes('480p')) ||
      qualities[0];

    if (targetGroup && targetGroup.serverList.length > 0) {
      const preferred =
        targetGroup.serverList.find((s) => /vidhide/i.test(s.title)) ||
        targetGroup.serverList.find((s) => /mega/i.test(s.title)) ||
        targetGroup.serverList.find((s) => /ondesuhd/i.test(s.title)) ||
        targetGroup.serverList.find((s) => /desustream/i.test(s.title)) ||
        targetGroup.serverList[0];

      if (preferred) {
        await handleSelectServer(preferred, targetGroup.title);
        return;
      }
    }

    // Fallback to default streaming URL with tunnel
    let cleanUrl = defaultUrl;
    if (cleanUrl.startsWith('//')) {
      cleanUrl = 'https:' + cleanUrl;
    }

    if (cleanUrl) {
      setActiveServerTitle('Default Server');
      await executeTunneling(cleanUrl, 'Default Server');
    } else {
      setError('Tidak ada server streaming yang tersedia.');
    }
  };

  const executeTunneling = async (targetUrl: string, serverName: string) => {
    setIsTunneling(true);
    try {
      const isTunnelCandidate =
        /desustream|ondesuhd|odstream|default/i.test(serverName) ||
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

  const loadSamehadakuForCurrentEpisode = async () => {
    if (samehadakuServers.length > 0 || loadingSamehadaku) return;
    setLoadingSamehadaku(true);
    try {
      // 1. Try episodeId directly
      let epData = await fetchSamehadakuEpisodeDetail(episodeId);
      if (!epData || !epData.servers || epData.servers.length === 0) {
        // 2. Try normalized slug
        const cleanSlug = episodeId.replace(/-sub-indo$/i, '').replace(/^otakudesu-/i, '');
        epData = await fetchSamehadakuEpisodeDetail(cleanSlug);
      }
      if (!epData || !epData.servers || epData.servers.length === 0) {
        // 3. Search anime on Samehadaku and find episode
        const animeTitle = detail?.info?.title || detail?.title?.split(' Episode')[0] || '';
        if (animeTitle) {
          const searchResults = await searchSamehadaku(animeTitle);
          if (searchResults.length > 0) {
            const firstMatch = searchResults[0];
            const animeDetail = await fetchSamehadakuDetail(firstMatch.slug);
            if (animeDetail && animeDetail.episodes.length > 0) {
              const epNum = detail?.title?.match(/Episode\s*(\d+)/i)?.[1] || '1';
              const matchedEp =
                animeDetail.episodes.find((e) => e.episodeNumber === epNum || e.slug.includes(epNum)) ||
                animeDetail.episodes[0];
              if (matchedEp) {
                epData = await fetchSamehadakuEpisodeDetail(matchedEp.slug);
              }
            }
          }
        }
      }
      if (epData && epData.servers && epData.servers.length > 0) {
        setSamehadakuServers(epData.servers);
      }
    } catch (e) {
      console.warn('[Watch] Error loading Samehadaku servers', e);
    } finally {
      setLoadingSamehadaku(false);
    }
  };

  const loadVipStreamsForEpisode = () => {
    const animeTitle = detail?.info?.title || detail?.title?.split(' Episode')[0] || 'Anime';
    const epNum = detail?.title?.match(/Episode\s*(\d+)/i)?.[1] || '1';
    const vips = generateVipStreams(animeTitle, epNum);
    setVipServers(vips);
  };

  const handleSelectServer = async (server: QualityServer, quality: string) => {
    try {
      cleanupMediaInstances();
      setSwitchingServer(true);
      setIframeLoaded(false);

      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);

      let resolvedUrl: string | null = null;
      let isDirect = false;

      // Check Otakudesu 2-step Base64 Nonce Decoder
      if (server.serverId && (server.serverId.startsWith('b64_') || server.serverId.includes('='))) {
        try {
          const cleanB64 = server.serverId.replace(/^b64_/, '');
          resolvedUrl = await resolveOtakudesuBase64Mirror(cleanB64);
        } catch {}
      }

      if (!resolvedUrl) {
        try {
          const resolved = await resolveServerStream(server.serverId);
          if (resolved && resolved.url) {
            resolvedUrl = resolved.url;
            isDirect = !!resolved.isDirectVideo;
          }
        } catch {}
      }

      if (!resolvedUrl && server.serverId) {
        try {
          resolvedUrl = await resolveOtakudesuBase64Mirror(server.serverId);
        } catch {}
      }

      if (resolvedUrl) {
        setActiveServerTitle(`${server.title} (${quality})`);
        setActiveQuality(quality);

        if (isDirect) {
          setStreamUrl(resolvedUrl);
          setBlobSrcDoc('');
          setIsDirectVideo(true);
          setIframeLoaded(true);
          setTunnelResult({
            success: true,
            mode: 'direct',
            streamUrl: resolvedUrl,
            layer: 1,
            tunnelActive: true,
            message: 'Tunnel Active ⚡ (Layer 1: Direct Video)',
          });
        } else {
          await executeTunneling(resolvedUrl, server.title);
        }
      } else {
        await executeTunneling(detail?.defaultStreamingUrl || '', 'Fallback Default');
      }
    } catch (err: any) {
      console.error('[Watch] Switch server error', err);
      setError('Gagal beralih server video');
    } finally {
      setSwitchingServer(false);
    }
  };

  const handleSelectSamehadakuServer = async (srv: SamehadakuServerOption) => {
    try {
      cleanupMediaInstances();
      setSwitchingServer(true);
      setIframeLoaded(false);
      setActiveServerTitle(`Samehadaku ${srv.title} (${selectedResolution})`);
      setActiveQuality(selectedResolution);

      let resolvedUrl: string | null = null;
      if (srv.post && srv.nume) {
        resolvedUrl = await resolveSamehadakuPlayerAjax(srv.post, srv.nume, srv.type || 'east_player');
      }
      if (!resolvedUrl && srv.serverUrl) {
        resolvedUrl = srv.serverUrl;
      }
      if (!resolvedUrl && srv.post) {
        resolvedUrl = await resolveSamehadakuServerBridge(srv.post);
      }

      if (resolvedUrl) {
        await executeTunneling(resolvedUrl, `Samehadaku ${srv.title}`);
      } else {
        showToast('Gagal memuat stream Samehadaku');
      }
    } catch (e) {
      console.error('Error selecting Samehadaku server', e);
      showToast('Kendala menghubungkan server Samehadaku');
    } finally {
      setSwitchingServer(false);
    }
  };

  const handleSelectVipServer = async (vip: VipStreamOption) => {
    try {
      cleanupMediaInstances();
      setSwitchingServer(true);
      setIframeLoaded(false);
      setActiveServerTitle(`${vip.serverName} (${vip.quality})`);
      setActiveQuality(vip.quality);
      await executeTunneling(vip.url, vip.serverName);
    } catch (e) {
      console.error('Error selecting VIP server', e);
      showToast('Kendala menghubungkan server VIP');
    } finally {
      setSwitchingServer(false);
    }
  };

  // Video Time Update: Save current playback second to Watch History continuously
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !detail) return;
    const current = Math.floor(videoRef.current.currentTime);
    const duration = Math.floor(videoRef.current.duration || 1440);

    if (current > 0 && current % 4 === 0) {
      saveWatchHistory({
        animeId: detail.animeId || '',
        episodeId,
        animeTitle: detail.info?.title || detail.title.split(' Episode')[0] || detail.title,
        episodeTitle: detail.title,
        poster: detail.info?.poster || '',
        lastSeconds: current,
        durationSeconds: duration,
        progressPercent: Math.min(100, Math.round((current / duration) * 100)),
        currentEpisodeNumber: detail.title.match(/Episode\s*(\d+)/i)?.[1] || 1,
        totalEpisodes: detail.info?.episodeList?.length || 12,
      });
    }
  };

  // Resume playback from saved seconds
  const handleResumePlayback = () => {
    if (resumePromptSec && videoRef.current) {
      videoRef.current.currentTime = resumePromptSec;
      showToast(`Melanjutkan dari menit ${formatSeconds(resumePromptSec)}`);
    }
    setResumePromptSec(null);
  };

  // Toggle Watch Later playlist
  const handleToggleWatchLater = () => {
    if (!detail) return;
    const animeId = detail.animeId || episodeId;
    if (isWatchLater) {
      removeWatchLater(animeId);
      setIsWatchLater(false);
      showToast('Dihapus dari Tonton Nanti');
    } else {
      saveWatchLater({
        animeId,
        title: detail.info?.title || detail.title.split(' Episode')[0] || detail.title,
        poster: detail.info?.poster || '',
        episodes: detail.info?.episodeList?.length || '12',
        score: detail.info?.score || '8.5',
      });
      setIsWatchLater(true);
      showToast('📌 Ditambahkan ke Tonton Nanti');
    }
  };

  const handlePlayNative = () => {
    if (streamUrl) {
      window.open(streamUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin mx-auto text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
        <div className="space-y-1">
          <p className="font-cinematic font-bold text-sm text-white">Memuat Pemutar Video Nexus</p>
          <p className="text-xs text-zinc-500">Mengkoneksikan multi-tunnel streaming...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-3xl card-frosted-obsidian border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-12">
        <Tv className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-sm font-bold text-red-300">{error || 'Episode tidak ditemukan'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all spring-press"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Flatten server list for settings modal
  const allServers = [
    ...(detail.server?.qualities?.flatMap((q) =>
      q.serverList.map((s) => ({
        title: `${s.title} (${q.title}) - Otakudesu`,
        serverId: s.serverId,
      }))
    ) || []),
    ...samehadakuServers.map((s) => ({
      title: `${s.title} - Samehadaku Pro`,
      serverId: `samehadaku-${s.post}-${s.nume}`,
    })),
    ...vipServers.map((v) => ({
      title: `${v.serverName} (${v.quality})`,
      serverId: `vip-${v.serverName}`,
    })),
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-28 animate-fade-in-up font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-black/90 border border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.4)] text-xs text-white font-extrabold animate-fade-in-up flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={detail.animeId ? `/anime?id=${detail.animeId}` : '/'}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full card-frosted-obsidian hover:border-white/20 text-zinc-300 hover:text-white text-xs font-semibold spring-press"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>

        {/* Action Controls: Auto-Next & Latency */}
        <div className="flex items-center gap-2">
          {/* Server Latency Pill */}
          <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
            {serverPing}ms
          </span>

          {/* Auto-Next Toggle */}
          <button
            onClick={() => setAutoNext(!autoNext)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all spring-press ${
              autoNext
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'card-frosted-obsidian text-zinc-400 hover:text-white'
            }`}
            title="Auto-Next Episode"
          >
            {autoNext ? <ToggleRight className="w-4 h-4 text-cyan-400" /> : <ToggleLeft className="w-4 h-4 text-zinc-500" />}
            <span className="hidden sm:inline">Auto-Next</span>
          </button>
        </div>
      </div>

      {/* Resume Playback Prompt Banner (Feature 1: Watch History) */}
      {resumePromptSec && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-between gap-3 text-xs animate-fade-in shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-zinc-200 truncate">
              Riwayat sebelumnya berhenti di menit <strong className="text-cyan-300">{formatSeconds(resumePromptSec)}</strong>. Lanjutkan?
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResumePlayback}
              className="px-3.5 py-1.5 rounded-full bg-cyan-400 text-black font-black text-xs hover:bg-cyan-300 spring-press shadow-md"
            >
              ▶ Lanjutkan
            </button>
            <button
              type="button"
              onClick={() => setResumePromptSec(null)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold"
            >
              Mulai Awal
            </button>
          </div>
        </div>
      )}

      {/* Video Player Box with Ambient Glow */}
      <div className="relative">
        {!lightsOff && (
          <div className="player-ambilight-glow pointer-events-none" />
        )}

        {/* Master Player Box */}
        <div
          id="nexus-player-canvas"
          className={`relative rounded-3xl overflow-hidden card-frosted-obsidian border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.98)] bg-black transition-all duration-500 ${
            lightsOff ? 'relative z-50 ring-2 ring-white/30 scale-[1.01]' : ''
          }`}
        >
          {/* HUD Frame Top Bar */}
          <div className="px-4 py-3 bg-[#030306]/95 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between gap-2 text-xs text-zinc-300 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-cinematic font-bold text-white tracking-wide shrink-0">NEXUS PLAYER</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-semibold truncate max-w-[140px] sm:max-w-none">
                {activeServerTitle}
              </span>

              {tunnelResult?.tunnelActive && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Tunnel ⚡</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Mode Bioskop */}
              <button
                type="button"
                onClick={() => setLightsOff(!lightsOff)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all spring-press flex items-center gap-1.5 ${
                  lightsOff
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30 border-amber-300'
                    : 'card-frosted-obsidian text-zinc-300 hover:text-white border-white/10'
                }`}
                title="Mode Bioskop"
              >
                {lightsOff ? <Sun className="w-3.5 h-3.5 fill-black" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{lightsOff ? 'Lampu Nyala' : 'Bioskop'}</span>
              </button>

              {/* Buka Tab Baru */}
              <button
                type="button"
                onClick={handlePlayNative}
                className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 spring-press bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm"
                title="Buka Tab Baru"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Buka Tab</span>
              </button>
            </div>
          </div>

          {/* Clean 16:9 Video Player Canvas */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            {(switchingServer || isTunneling || !iframeLoaded) && (
              <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center gap-3 text-white pointer-events-none">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold tracking-wide">
                    {isTunneling ? 'Mempersiapkan Stream Tunnel...' : 'Menghubungkan ke Pemutar...'}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium">{activeServerTitle}</p>
                </div>
              </div>
            )}

            {streamUrl ? (
              isDirectVideo ? (
                <video
                  ref={videoRef}
                  src={streamUrl}
                  controls
                  autoPlay
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="w-full h-full bg-black object-contain"
                  onEnded={() => {
                    if (autoNext && detail.hasNextEpisode && detail.nextEpisode) {
                      router.push(`/watch?id=${detail.nextEpisode.episodeId}`);
                    }
                  }}
                />
              ) : (
                <iframe
                  key={streamUrl + (blobSrcDoc ? '-blob' : '')}
                  src={blobSrcDoc ? undefined : streamUrl}
                  srcDoc={blobSrcDoc || undefined}
                  className={`w-full h-full border-0 transition-opacity duration-300 ${
                    iframeLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => {
                    setIframeLoaded(true);
                    setSwitchingServer(false);
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

          {/* Quick Utility Action Bar: Server Indicator, Watch Later, Download, Subtitle Settings */}
          <div className="p-3 bg-[#050508]/98 border-t border-white/[0.08] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping shrink-0" />
              <span className="text-[11px] font-bold text-zinc-300 truncate">
                {activeServerTitle}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-400 border border-white/[0.08] font-mono shrink-0">
                {activeQuality}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Watch Later Toggle (Feature 3) */}
              <button
                type="button"
                onClick={handleToggleWatchLater}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 spring-press ${
                  isWatchLater
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
                }`}
                title="Simpan ke Tonton Nanti"
              >
                {isWatchLater ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <ListPlus className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isWatchLater ? 'Tersimpan' : 'Tonton Nanti'}</span>
              </button>

              {/* Download Episode Trigger (Feature 4) */}
              <button
                type="button"
                onClick={() => setIsDownloadOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-[11px] font-bold flex items-center gap-1 spring-press"
                title="Unduh Episode untuk Ditonton Offline"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Unduh</span>
              </button>

              {/* Subtitle & Server Settings Trigger (Feature 7) */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] spring-press"
                title="Pengaturan Subtitle & Server"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Prev / Next Episode Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-[#030306]/95 border-t border-white/[0.08]">
            {detail.hasPrevEpisode && detail.prevEpisode ? (
              <Link
                href={`/watch?id=${detail.prevEpisode.episodeId}`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-zinc-200 hover:text-white spring-press transition-all"
              >
                <SkipBack className="w-4 h-4" />
                <span>Episode Sebelumnya</span>
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs font-bold text-zinc-600 cursor-not-allowed"
              >
                <SkipBack className="w-4 h-4 opacity-40" />
                <span>Episode Pertama</span>
              </button>
            )}

            {detail.hasNextEpisode && detail.nextEpisode ? (
              <Link
                href={`/watch?id=${detail.nextEpisode.episodeId}`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 shadow-lg shadow-white/10 spring-press transition-all"
              >
                <span>Episode Selanjutnya</span>
                <SkipForward className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs font-bold text-zinc-600 cursor-not-allowed"
              >
                <span>Episode Terakhir</span>
                <CheckCircle2 className="w-4 h-4 opacity-40 text-emerald-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Flutter UI + Apple Liquid Glass: Multi-Provider & Resolution Matrix */}
      <div className="p-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Pilihan Provider & Resolusi Video
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold font-mono">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Multi-Source Engine</span>
            </span>
          </div>
        </div>

        {/* Flutter CupertinoSlidingSegmentedControl Liquid Glass Provider Switcher */}
        <div className="p-1.5 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-inner flex flex-col sm:flex-row items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveProvider('otakudesu')}
            className={`w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 spring-press ${
              activeProvider === 'otakudesu'
                ? 'liquid-glass-convex bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-white border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.35)] scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeProvider === 'otakudesu' ? 'text-cyan-400' : 'text-zinc-500'}`} />
            <span>Server Utama / Otakudesu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProvider('samehadaku');
              loadSamehadakuForCurrentEpisode();
            }}
            className={`w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 spring-press ${
              activeProvider === 'samehadaku'
                ? 'liquid-glass-convex bg-gradient-to-r from-emerald-500/30 to-teal-600/30 text-white border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeProvider === 'samehadaku' ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>Samehadaku Pro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProvider('kurama');
              loadVipStreamsForEpisode();
            }}
            className={`w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 spring-press ${
              activeProvider === 'kurama'
                ? 'liquid-glass-convex bg-gradient-to-r from-purple-500/30 to-pink-600/30 text-white border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.01]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${activeProvider === 'kurama' ? 'text-purple-400' : 'text-zinc-500'}`} />
            <span>Kurama / Multi-VIP</span>
          </button>
        </div>

        {/* Apple Liquid Glass Resolution Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
            Resolusi:
          </span>
          {['360p', '480p', '720p', '1080p FHD'].map((res) => {
            const isResActive = selectedResolution === res;
            return (
              <button
                key={res}
                type="button"
                onClick={() => setSelectedResolution(res)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all spring-press ${
                  isResActive
                    ? 'liquid-glass-pill bg-cyan-400 text-black border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.6)] scale-105'
                    : 'bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:text-white hover:bg-white/[0.1]'
                }`}
              >
                {res}
              </button>
            );
          })}
        </div>

        {/* Active Provider Server Panels */}
        {activeProvider === 'otakudesu' && (
          <div className="space-y-3 pt-1 border-t border-white/[0.06]">
            {detail.server?.qualities && detail.server.qualities.length > 0 ? (
              detail.server.qualities.map((group: QualityGroup, idx: number) => {
                const matchesRes = group.title.toLowerCase().includes(selectedResolution.toLowerCase().replace(' fhd', ''));
                return (
                  <div key={idx} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-2xl transition-all ${matchesRes ? 'bg-white/[0.03] border border-cyan-500/20' : ''}`}>
                    <span className={`text-xs font-black px-3.5 py-1 rounded-full border w-fit ${
                      matchesRes ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-sm' : 'bg-white/10 text-white border-white/20'
                    }`}>
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
                );
              })
            ) : (
              <p className="text-xs text-zinc-400">Tidak ada server Otakudesu tambahan. Default stream aktif.</p>
            )}
          </div>
        )}

        {activeProvider === 'samehadaku' && (
          <div className="space-y-3 pt-1 border-t border-white/[0.06]">
            {loadingSamehadaku ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-emerald-400">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Menghubungkan ke Samehadaku Pro via AJAX Nonce...</span>
              </div>
            ) : samehadakuServers.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Server Samehadaku (player_ajax POST ready):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {samehadakuServers.map((srv, idx) => {
                    const isSelected = activeServerTitle.includes(srv.title);
                    return (
                      <button
                        key={`${srv.post}-${srv.nume}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSamehadakuServer(srv)}
                        className={`px-4 py-2 rounded-full text-xs font-bold spring-press transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/30 scale-105'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>{srv.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-zinc-400">Server Samehadaku belum termuat untuk episode ini.</p>
                <button
                  type="button"
                  onClick={loadSamehadakuForCurrentEpisode}
                  className="px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold spring-press inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Muat Ulang Server Samehadaku</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeProvider === 'kurama' && (
          <div className="space-y-3 pt-1 border-t border-white/[0.06]">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-purple-400" />
              <span>Multi-VIP & Kuramanime High-Speed Streams:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {vipServers.map((vip, idx) => {
                const isSelected = activeServerTitle.includes(vip.serverName);
                const matchesRes = vip.quality.toLowerCase().includes(selectedResolution.toLowerCase().replace(' fhd', ''));
                return (
                  <button
                    key={`${vip.serverName}-${idx}`}
                    type="button"
                    onClick={() => handleSelectVipServer(vip)}
                    className={`px-4 py-2 rounded-full text-xs font-bold spring-press transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-400 text-black shadow-lg shadow-purple-400/30 scale-105'
                        : matchesRes
                        ? 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-400/50'
                        : 'bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    <Play className="w-3 h-3 text-purple-400 fill-purple-400" />
                    <span>{vip.serverName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-purple-300 font-mono">
                      {vip.quality}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Episode Drawer */}
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
            {detail.info.episodeList.map((ep) => {
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

      {/* Feature 10: Community Comments & Discussion with Spoiler Tags */}
      <CommunityDiscussionView
        targetId={episodeId}
        targetTitle={`${detail.info?.title || detail.title} - ${detail.title}`}
      />

      {/* Feature 4: Download Manager Modal */}
      <DownloadManagerModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        initialDownload={
          isDownloadOpen
            ? {
                animeId: detail.animeId || '',
                episodeId: episodeId,
                animeTitle: detail.info?.title || detail.title.split(' Episode')[0] || detail.title,
                episodeTitle: detail.title,
                poster: detail.info?.poster || '',
                quality: activeQuality,
                serverName: activeServerTitle,
                downloadUrl: streamUrl,
              }
            : undefined
        }
      />

      {/* Feature 7: Subtitle & Server Switcher Modal */}
      <PlayerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentServer={activeServerTitle}
        availableServers={allServers}
        onServerChange={(serverId) => {
          if (serverId.startsWith('samehadaku-')) {
            const s = samehadakuServers.find((srv) => `samehadaku-${srv.post}-${srv.nume}` === serverId);
            if (s) {
              handleSelectSamehadakuServer(s);
              return;
            }
          }
          if (serverId.startsWith('vip-')) {
            const v = vipServers.find((vip) => `vip-${vip.serverName}` === serverId);
            if (v) {
              handleSelectVipServer(v);
              return;
            }
          }
          const matched = detail.server?.qualities
            ?.flatMap((q) => q.serverList.map((s) => ({ s, qTitle: q.title })))
            .find((item) => item.s.serverId === serverId);
          if (matched) {
            handleSelectServer(matched.s, matched.qTitle);
          }
        }}
      />
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
        <ErrorBoundary fallbackTitle="Kendala Memuat Pemutar Video">
          <WatchContent />
        </ErrorBoundary>
        <FloatingGlassDock />
      </div>
    </Suspense>
  );
}
