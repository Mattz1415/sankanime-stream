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
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  Sliders,
  Download,
  ListPlus,
  BookmarkCheck,
  Clock,
} from 'lucide-react';
import { getEpisodeDetail, resolveServerStream } from '@/lib/clientApi';
import {
  saveWatchHistory,
  getWatchHistory,
  getEpisodeResumeTime,
  saveWatchLater,
  removeWatchLater,
  isAnimeWatchLater,
} from '@/lib/storage';
import { EpisodeDetail, QualityGroup, QualityServer } from '@/lib/types';
import FloatingGlassDock from '@/components/FloatingGlassDock';
import CommunityDiscussionView from '@/components/CommunityDiscussionView';
import DownloadManagerModal from '@/components/DownloadManagerModal';
import PlayerSettingsModal from '@/components/PlayerSettingsModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  fetchSamehadakuEpisodeServers,
  resolveSamehadakuPlayerAjax,
  fetchSamehadakuEpisodeDetail,
  resolveSamehadakuServerBridge,
  resolveSamehadakuServer,
  searchSamehadaku,
  fetchSamehadakuDetail,
  resolveOtakudesuBase64Mirror,
  SamehadakuServerOption,
  SamehadakuEpisodeDetail,
} from '@/services/wibuEngine';

function isRealDirectVideoFile(url: string): boolean {
  if (!url) return false;
  try {
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.m3u8');
  } catch {
    return false;
  }
}

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

  const [detail, setDetail] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [blobSrcDoc, setBlobSrcDoc] = useState<string>('');
  const [isDirectVideo, setIsDirectVideo] = useState(false);
  const [activeServerTitle, setActiveServerTitle] = useState<string>('Memilih Server...');
  const [activeQuality, setActiveQuality] = useState<string>('720p');
  const [switchingServer, setSwitchingServer] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Visual settings & automations
  const [lightsOff, setLightsOff] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [isWatchLater, setIsWatchLater] = useState(false);

  // Modals & Prompts
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [resumePromptSec, setResumePromptSec] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Strict Monochrome Flutter Dark Provider & Resolution States
  const [activeProvider, setActiveProvider] = useState<'otakudesu' | 'samehadaku'>('otakudesu');
  const [selectedResolution, setSelectedResolution] = useState<string>('720p');
  const [samehadakuDetail, setSamehadakuDetail] = useState<SamehadakuEpisodeDetail | null>(null);
  const [samehadakuServers, setSamehadakuServers] = useState<SamehadakuServerOption[]>([]);
  const [loadingSamehadaku, setLoadingSamehadaku] = useState<boolean>(false);

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

    // Fallback to default streaming URL
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
    try {
      const direct = isRealDirectVideoFile(targetUrl);
      setStreamUrl(targetUrl);
      setIsDirectVideo(direct);
      setBlobSrcDoc('');
      setIframeLoaded(true);
    } catch (err) {
      console.warn('[Watch] Setup error', err);
      setStreamUrl(targetUrl);
      setIsDirectVideo(false);
      setIframeLoaded(true);
    }
  };

  const loadSamehadakuForCurrentEpisode = async () => {
    if (samehadakuDetail || loadingSamehadaku) return;
    setLoadingSamehadaku(true);
    try {
      let epData = await fetchSamehadakuEpisodeDetail(episodeId);
      if (!epData || !epData.qualities || epData.qualities.length === 0) {
        const cleanSlug = episodeId.replace(/-sub-indo$/i, '').replace(/^otakudesu-/i, '');
        epData = await fetchSamehadakuEpisodeDetail(cleanSlug);
      }
      if (!epData || !epData.qualities || epData.qualities.length === 0) {
        const animeTitle = detail?.info?.title || detail?.title?.split(' Episode')[0] || '';
        if (animeTitle) {
          const searchResults = await searchSamehadaku(animeTitle);
          if (searchResults.length > 0) {
            const firstMatch = searchResults[0];
            const aDetail = await fetchSamehadakuDetail(firstMatch.slug);
            if (aDetail && aDetail.episodes.length > 0) {
              const epNum = detail?.title?.match(/Episode\s*(\d+)/i)?.[1] || '1';
              const matchedEp =
                aDetail.episodes.find((e) => e.episodeNumber === epNum || e.slug.includes(epNum)) ||
                aDetail.episodes[0];
              if (matchedEp) {
                epData = await fetchSamehadakuEpisodeDetail(matchedEp.slug);
              }
            }
          }
        }
      }
      if (epData) {
        setSamehadakuDetail(epData);
        setSamehadakuServers(epData.servers || []);
      }
    } catch (e) {
      console.warn('[Watch] Error loading Samehadaku servers', e);
    } finally {
      setLoadingSamehadaku(false);
    }
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
            isDirect = isRealDirectVideoFile(resolved.url);
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

        setStreamUrl(resolvedUrl);
        setBlobSrcDoc('');
        setIsDirectVideo(isDirect);
        setIframeLoaded(true);
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

  const handleSelectSamehadakuServer = async (
    srv: { serverId?: string; post?: string; nume?: string; type?: string; title: string },
    quality: string
  ) => {
    try {
      cleanupMediaInstances();
      setSwitchingServer(true);
      setIframeLoaded(false);
      setActiveServerTitle(`Samehadaku ${srv.title} (${quality})`);
      setActiveQuality(quality);

      const resolvedUrl = await resolveSamehadakuServer(srv.serverId || '', srv.post, srv.nume, srv.type);
      if (resolvedUrl) {
        const isDirect = isRealDirectVideoFile(resolvedUrl);
        setStreamUrl(resolvedUrl);
        setBlobSrcDoc('');
        setIsDirectVideo(isDirect);
        setIframeLoaded(true);
      } else {
        showToast('Gagal memuat server Samehadaku');
      }
    } catch (e) {
      console.error('Error selecting Samehadaku server', e);
      showToast('Kendala menghubungkan server Samehadaku');
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
      showToast('Ditambahkan ke Tonton Nanti');
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
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
        <p className="text-xs text-zinc-400 font-medium">Memuat pemutar video...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-2xl bg-[#141414] border border-[#262626] text-center space-y-4 max-w-md mx-auto my-12">
        <Tv className="w-8 h-8 text-zinc-400 mx-auto" />
        <p className="text-xs font-semibold text-zinc-300">{error || 'Episode tidak ditemukan'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const allServers = [
    ...(detail.server?.qualities?.flatMap((q) =>
      q.serverList.map((s) => ({
        title: `${s.title} (${q.title}) - Otakudesu`,
        serverId: s.serverId,
      }))
    ) || []),
    ...samehadakuServers.map((s) => ({
      title: `${s.title} - Samehadaku`,
      serverId: `samehadaku-${s.post}-${s.nume}`,
    })),
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-32 font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-[#1C1C1E] border border-[#3A3A3C] text-xs text-white font-semibold flex items-center gap-2 shadow-2xl">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={detail.animeId ? `/anime?id=${detail.animeId}` : '/'}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] border border-[#262626] hover:border-[#3A3A3C] text-zinc-300 hover:text-white text-xs font-semibold active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>

        {/* Action Controls: Auto-Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoNext(!autoNext)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
              autoNext
                ? 'bg-[#2C2C2E] text-white border-[#3A3A3C]'
                : 'bg-[#141414] text-zinc-400 border-[#262626] hover:text-white'
            }`}
            title="Auto-Next Episode"
          >
            {autoNext ? <ToggleRight className="w-4 h-4 text-white" /> : <ToggleLeft className="w-4 h-4 text-zinc-500" />}
            <span className="hidden sm:inline">Auto-Next</span>
          </button>
        </div>
      </div>

      {/* Resume Playback Prompt Banner */}
      {resumePromptSec && (
        <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <p className="text-zinc-300 truncate">
              Riwayat sebelumnya berhenti di menit <strong className="text-white">{formatSeconds(resumePromptSec)}</strong>. Lanjutkan?
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResumePlayback}
              className="px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 active:scale-95"
            >
              Lanjutkan
            </button>
            <button
              type="button"
              onClick={() => setResumePromptSec(null)}
              className="px-3 py-1.5 rounded-full bg-[#2C2C2E] text-zinc-300 hover:text-white text-xs font-semibold"
            >
              Mulai Awal
            </button>
          </div>
        </div>
      )}

      {/* Video Player Box */}
      <div className="relative">
        <div
          id="nexus-player-canvas"
          className="relative rounded-2xl overflow-hidden bg-black border border-[#262626]"
        >
          {/* Top Bar */}
          <div className="px-4 py-2.5 bg-[#0D0D0D] border-b border-[#262626] flex items-center justify-between gap-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-white tracking-wide shrink-0">NEXUS PLAYER</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-zinc-300 border border-[#262626] font-medium truncate max-w-[140px] sm:max-w-none">
                {activeServerTitle}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Mode Bioskop */}
              <button
                type="button"
                onClick={() => setLightsOff(!lightsOff)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1.5 ${
                  lightsOff
                    ? 'bg-white text-black border-white'
                    : 'bg-[#141414] text-zinc-300 hover:text-white border-[#262626]'
                }`}
                title="Mode Bioskop"
              >
                {lightsOff ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{lightsOff ? 'Lampu Nyala' : 'Bioskop'}</span>
              </button>

              {/* Buka Tab Baru */}
              <button
                type="button"
                onClick={handlePlayNative}
                className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 bg-[#141414] hover:bg-[#1C1C1E] text-zinc-300 hover:text-white border border-[#262626]"
                title="Buka Tab Baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka Tab</span>
              </button>
            </div>
          </div>

          {/* 16:9 Video Canvas */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            {(switchingServer || !iframeLoaded) && (
              <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center gap-2 text-white pointer-events-none">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-400 font-medium">Menghubungkan ke Pemutar...</p>
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
                  key={streamUrl}
                  src={streamUrl}
                  className="w-full h-full border-0"
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
                <Tv className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                <p>Tautan streaming langsung tidak tersedia.</p>
                <p className="text-[11px] text-zinc-500">Silakan pilih salah satu opsi server di bawah.</p>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-3 bg-[#0D0D0D] border-t border-[#262626] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              <span className="text-xs font-semibold text-zinc-300 truncate">
                {activeServerTitle}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1C1C1E] text-zinc-400 border border-[#262626] font-mono shrink-0">
                {activeQuality}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Watch Later Toggle */}
              <button
                type="button"
                onClick={handleToggleWatchLater}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 active:scale-95 ${
                  isWatchLater
                    ? 'bg-[#2C2C2E] text-white border-[#3A3A3C]'
                    : 'bg-[#141414] hover:bg-[#1C1C1E] text-zinc-300 hover:text-white border-[#262626]'
                }`}
                title="Simpan ke Tonton Nanti"
              >
                {isWatchLater ? <BookmarkCheck className="w-3.5 h-3.5" /> : <ListPlus className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isWatchLater ? 'Tersimpan' : 'Tonton Nanti'}</span>
              </button>

              {/* Download */}
              <button
                type="button"
                onClick={() => setIsDownloadOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1C1C1E] text-zinc-300 hover:text-white border border-[#262626] text-xs font-semibold flex items-center gap-1 active:scale-95"
                title="Unduh Episode"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh</span>
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-xl bg-[#141414] hover:bg-[#1C1C1E] text-zinc-300 hover:text-white border border-[#262626] active:scale-95"
                title="Pengaturan Server"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prev / Next Episode Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#0D0D0D] border-t border-[#262626]">
            {detail.hasPrevEpisode && detail.prevEpisode ? (
              <Link
                href={`/watch?id=${detail.prevEpisode.episodeId}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1C1C1E] border border-[#262626] text-xs font-semibold text-zinc-200 hover:text-white active:scale-95 transition-all"
              >
                <SkipBack className="w-4 h-4" />
                <span>Episode Sebelumnya</span>
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-[#1C1C1E] text-xs font-semibold text-zinc-600 cursor-not-allowed"
              >
                <SkipBack className="w-4 h-4 opacity-40" />
                <span>Episode Pertama</span>
              </button>
            )}

            {detail.hasNextEpisode && detail.nextEpisode ? (
              <Link
                href={`/watch?id=${detail.nextEpisode.episodeId}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 active:scale-95 transition-all"
              >
                <span>Episode Selanjutnya</span>
                <SkipForward className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-[#1C1C1E] text-xs font-semibold text-zinc-600 cursor-not-allowed"
              >
                <span>Episode Terakhir</span>
                <CheckCircle2 className="w-4 h-4 opacity-40" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Strict Monochrome Flutter Dark: Multi-Provider & Resolution Matrix */}
      <div className="p-5 rounded-2xl bg-[#0D0D0D] border border-[#262626] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-zinc-300" />
            <h3 className="font-semibold text-xs sm:text-sm text-white uppercase tracking-wider">
              Pilihan Sumber & Resolusi Video
            </h3>
          </div>
        </div>

        {/* Flutter CupertinoSlidingSegmentedControl Provider Switcher */}
        <div className="p-1 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveProvider('otakudesu')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 ${
              activeProvider === 'otakudesu'
                ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <span>Server Utama (Otakudesu)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProvider('samehadaku');
              loadSamehadakuForCurrentEpisode();
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 ${
              activeProvider === 'samehadaku'
                ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <span>Server Samehadaku</span>
          </button>
        </div>

        {/* Resolution Pills Row - Fixed clipping bug */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0 whitespace-nowrap min-w-fit">
            RESOLUSI:
          </span>
          {['360p', '480p', '720p', '1080p'].map((res) => {
            const isResActive = selectedResolution === res;
            return (
              <button
                key={res}
                type="button"
                onClick={() => setSelectedResolution(res)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  isResActive
                    ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C]'
                    : 'bg-[#141414] text-zinc-400 border border-[#262626] hover:text-white hover:bg-[#1C1C1E]'
                }`}
              >
                {res}
              </button>
            );
          })}
        </div>

        {/* Active Provider Server Panels */}
        {activeProvider === 'otakudesu' && (
          <div className="space-y-3 pt-2 border-t border-[#262626]">
            {detail.server?.qualities && detail.server.qualities.length > 0 ? (
              detail.server.qualities.map((group: QualityGroup, idx: number) => {
                const matchesRes = group.title.toLowerCase().includes(selectedResolution.toLowerCase());
                return (
                  <div
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl transition-all ${
                      matchesRes ? 'bg-[#141414] border border-[#3A3A3C]' : ''
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border w-fit ${
                        matchesRes
                          ? 'bg-[#2C2C2E] text-white border-[#3A3A3C]'
                          : 'bg-[#141414] text-zinc-400 border-[#262626]'
                      }`}
                    >
                      {group.title}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {group.serverList.map((srv: QualityServer) => {
                        const isSelected =
                          activeServerTitle.includes(srv.title) &&
                          activeServerTitle.includes(group.title);

                        return (
                          <button
                            key={srv.serverId}
                            onClick={() => handleSelectServer(srv, group.title)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 active:scale-95 ${
                              isSelected
                                ? 'bg-white text-black font-bold'
                                : 'bg-[#1C1C1E] hover:bg-[#2C2C2E] text-zinc-300 hover:text-white border border-[#262626]'
                            }`}
                          >
                            <span>{srv.title.toUpperCase()}</span>
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
          <div className="space-y-3 pt-2 border-t border-[#262626]">
            {loadingSamehadaku ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                <span>Memuat server Samehadaku...</span>
              </div>
            ) : samehadakuDetail?.qualities && samehadakuDetail.qualities.length > 0 ? (
              <div className="space-y-3">
                {samehadakuDetail.qualities.map((group, idx) => {
                  const matchesRes = group.title.toLowerCase().includes(selectedResolution.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl transition-all ${
                        matchesRes ? 'bg-[#141414] border border-[#3A3A3C]' : ''
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border w-fit ${
                          matchesRes
                            ? 'bg-[#2C2C2E] text-white border-[#3A3A3C]'
                            : 'bg-[#141414] text-zinc-400 border-[#262626]'
                        }`}
                      >
                        {group.title}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {group.serverList.map((srv) => {
                          const isSelected = activeServerTitle.includes(srv.title);
                          return (
                            <button
                              key={srv.serverId}
                              type="button"
                              onClick={() => handleSelectSamehadakuServer(srv, group.title)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                                isSelected
                                  ? 'bg-white text-black font-bold'
                                  : 'bg-[#1C1C1E] hover:bg-[#2C2C2E] text-zinc-300 hover:text-white border border-[#262626]'
                              }`}
                            >
                              <span>{srv.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : samehadakuServers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {samehadakuServers.map((srv, idx) => {
                  const isSelected = activeServerTitle.includes(srv.title);
                  return (
                    <button
                      key={`${srv.post}-${srv.nume}-${idx}`}
                      type="button"
                      onClick={() => handleSelectSamehadakuServer(srv, selectedResolution)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-white text-black font-bold'
                          : 'bg-[#1C1C1E] hover:bg-[#2C2C2E] text-zinc-300 hover:text-white border border-[#262626]'
                      }`}
                    >
                      <span>{srv.title}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-zinc-400">Server Samehadaku belum termuat untuk episode ini.</p>
                <button
                  type="button"
                  onClick={loadSamehadakuForCurrentEpisode}
                  className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#1C1C1E] text-zinc-300 hover:text-white border border-[#262626] text-xs font-semibold active:scale-95 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Muat Ulang Server Samehadaku</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Episode Drawer */}
      {detail.info?.episodeList && detail.info.episodeList.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0D0D0D] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-zinc-300" />
              <h3 className="font-semibold text-xs sm:text-sm text-white uppercase tracking-wider">
                Daftar Episode ({detail.info.episodeList.length} Episode)
              </h3>
            </div>
            {detail.animeId && (
              <Link
                href={`/anime?id=${detail.animeId}`}
                className="text-xs text-zinc-400 hover:text-white font-medium underline"
              >
                Detail Seri
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
                  className={`p-2.5 rounded-xl text-center text-xs font-semibold transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
                    isCurrent
                      ? 'bg-white text-black font-bold'
                      : isWatched
                      ? 'bg-[#1C1C1E] text-zinc-300 border border-[#262626]'
                      : 'bg-[#141414] text-zinc-400 hover:text-white hover:bg-[#1C1C1E] border border-[#262626]'
                  }`}
                >
                  <span className="truncate w-full">Ep {ep.eps}</span>
                  {isWatched && !isCurrent && (
                    <span className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Ditonton
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Community Comments */}
      <CommunityDiscussionView
        targetId={episodeId}
        targetTitle={`${detail.info?.title || detail.title} - ${detail.title}`}
      />

      {/* Download Modal */}
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

      {/* Settings Modal */}
      <PlayerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentServer={activeServerTitle}
        availableServers={allServers}
        onServerChange={(serverId) => {
          if (serverId.startsWith('samehadaku-')) {
            const s = samehadakuServers.find((srv) => `samehadaku-${srv.post}-${srv.nume}` === serverId);
            if (s) {
              handleSelectSamehadakuServer(s, selectedResolution);
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
