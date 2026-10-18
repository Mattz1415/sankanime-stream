'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  Star,
  Calendar,
  Clock,
  Layers,
  Bookmark,
  BookmarkCheck,
  Share2,
  ChevronLeft,
  Search,
  CheckCircle2,
  Film,
  RefreshCw
} from 'lucide-react';
import { getAnimeDetail } from '@/lib/clientApi';
import { isAnimeBookmarked, toggleBookmark, getWatchHistory } from '@/lib/storage';
import { AnimeDetail } from '@/lib/types';
import FloatingGlassDock from '@/components/FloatingGlassDock';

function AnimeDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animeId = searchParams.get('id') || '';

  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [searchEps, setSearchEps] = useState('');
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  useEffect(() => {
    if (!animeId) {
      setLoading(false);
      setError('ID anime tidak valid');
      return;
    }

    async function loadDetail() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAnimeDetail(animeId);
        setDetail(data);
        setBookmarked(isAnimeBookmarked(animeId));

        // Get watched episodes
        const history = getWatchHistory();
        const watched = history
          .filter((h) => h.animeId === animeId)
          .map((h) => h.episodeId);
        setWatchedEpisodes(watched);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail anime');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [animeId]);

  const handleBookmarkToggle = () => {
    if (!detail) return;
    const newState = toggleBookmark({
      animeId,
      title: detail.title,
      poster: detail.poster,
      score: detail.score,
      status: detail.status,
    });
    setBookmarked(newState);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: detail?.title,
        text: `Nonton anime ${detail?.title} gratis di NexusAnime`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Tautan disalin ke clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <div className="w-full h-80 rounded-3xl skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-64 rounded-2xl skeleton-shimmer" />
          <div className="md:col-span-3 space-y-4">
            <div className="h-8 w-3/4 rounded-xl skeleton-shimmer" />
            <div className="h-20 w-full rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-3xl glass-fluent border border-red-500/30 text-center space-y-4 max-w-md mx-auto my-16">
        <h2 className="font-cinematic font-bold text-lg text-white">Detail Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-400">{error || 'Data anime tidak dapat diambil'}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-md"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Filter episodes
  const filteredEpisodes = (detail.episodeList || []).filter((ep) =>
    ep.title.toLowerCase().includes(searchEps.toLowerCase()) ||
    String(ep.eps).includes(searchEps)
  );

  const firstEpisode = detail.episodeList?.[detail.episodeList.length - 1];
  const latestEpisode = detail.episodeList?.[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
        Beranda
      </Link>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl glass-fluent border border-white/15 overflow-hidden shadow-2xl p-6 sm:p-10">
        {/* Background poster blur */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={detail.poster}
            alt={detail.title}
            className="w-full h-full object-cover filter blur-3xl opacity-20 scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06080e] via-[#06080e]/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Poster Image */}
          <div className="relative w-44 sm:w-56 aspect-[3/4] flex-shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden border border-white/20 shadow-2xl group">
            <img
              src={detail.poster}
              alt={detail.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {detail.score && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/30 text-amber-300 font-bold text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {detail.score}
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h1 className="font-cinematic font-black text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
                {detail.title}
              </h1>
              {detail.japanese && (
                <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                  {detail.japanese}
                </p>
              )}
            </div>

            {/* Quick Meta Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              {detail.status && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-white">
                  {detail.status}
                </span>
              )}
              {detail.type && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-zinc-300">
                  {detail.type}
                </span>
              )}
              {detail.duration && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {detail.duration}
                </span>
              )}
              {detail.studios && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-300 flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  {detail.studios}
                </span>
              )}
              {detail.aired && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {detail.aired}
                </span>
              )}
            </div>

            {/* Genre Chips */}
            {detail.genreList && detail.genreList.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
                {detail.genreList.map((genre) => (
                  <span
                    key={genre.genreId || genre.title}
                    className="text-xs px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300"
                  >
                    {genre.title}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons: Watch Latest, Bookmark, Share */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              {latestEpisode && (
                <Link
                  href={`/watch?id=${latestEpisode.episodeId}`}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black font-extrabold text-xs sm:text-sm hover:bg-zinc-200 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.35)] active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Tonton Episode Terbaru
                </Link>
              )}

              {firstEpisode && firstEpisode !== latestEpisode && (
                <Link
                  href={`/watch?id=${firstEpisode.episodeId}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs sm:text-sm font-semibold transition-all active:scale-95"
                >
                  Episode 1
                </Link>
              )}

              <button
                onClick={handleBookmarkToggle}
                className={`px-5 py-3 rounded-full border transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold ${
                  bookmarked
                    ? 'bg-white/20 border-white/40 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>+ Simpan</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95"
                title="Bagikan"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Synopsis Section */}
        {detail.synopsis?.paragraphs && detail.synopsis.paragraphs.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Sinopsis
            </h3>
            <div
              className={`text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2 transition-all ${
                !showFullSynopsis && detail.synopsis.paragraphs.length > 2
                  ? 'line-clamp-3'
                  : ''
              }`}
            >
              {detail.synopsis.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {detail.synopsis.paragraphs.length > 2 && (
              <button
                onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                className="text-xs text-white font-bold underline pt-1 block"
              >
                {showFullSynopsis ? 'Tutup Sebagian' : 'Baca Selengkapnya...'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Episode List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-cinematic font-bold text-lg text-white">Daftar Episode</h2>
              <p className="text-xs text-zinc-400">
                Total {detail.episodeList?.length || 0} Episode Tersedia
              </p>
            </div>
          </div>

          {/* Search Episode Filter */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchEps}
              onChange={(e) => setSearchEps(e.target.value)}
              placeholder="Cari episode (cth: 1, 12)..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white/[0.05] border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-500 outline-none"
            />
          </div>
        </div>

        {/* Episode Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredEpisodes.map((ep) => {
            const isWatched = watchedEpisodes.includes(ep.episodeId);

            return (
              <Link
                key={ep.episodeId}
                href={`/watch?id=${ep.episodeId}`}
                className={`p-4 rounded-2xl glass-fluent-card flex items-center justify-between gap-3 group transition-all ${
                  isWatched ? 'border-emerald-500/30' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                      EPS {ep.eps}
                    </span>
                    {isWatched && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Ditonton
                      </span>
                    )}
                  </div>
                  <h4 className="font-cinematic font-bold text-xs text-white group-hover:text-zinc-200 truncate mt-1">
                    {ep.title}
                  </h4>
                  {ep.date && (
                    <span className="text-[10px] text-zinc-400 block">{ep.date}</span>
                  )}
                </div>

                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        {filteredEpisodes.length === 0 && (
          <div className="p-8 text-center glass-fluent rounded-3xl text-zinc-400 text-xs">
            Tidak ada episode yang cocok dengan pencarian "{searchEps}"
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnimePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Memuat seri anime...
        </div>
      }
    >
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
        <AnimeDetailContent />
        <FloatingGlassDock />
      </div>
    </Suspense>
  );
}
