'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  Star,
  Calendar,
  Clock,
  Layers,
  Tv,
  Bookmark,
  BookmarkCheck,
  Share2,
  ChevronLeft,
  Search,
  CheckCircle2,
  Film
} from 'lucide-react';
import { getAnimeDetail } from '@/lib/clientApi';
import { isAnimeBookmarked, toggleBookmark, getWatchHistory } from '@/lib/storage';
import { AnimeDetail, WatchHistoryItem } from '@/lib/types';

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const animeId = params?.id as string;

  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [searchEps, setSearchEps] = useState('');
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  useEffect(() => {
    if (!animeId) return;

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
      <div className="space-y-6">
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
      <div className="p-8 rounded-3xl glass-card border-red-500/30 text-center space-y-4 max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-white">Detail Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400">{error || 'Data anime tidak dapat diambil'}</p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Filter episodes
  const filteredEpisodes = (detail.episodeList || []).filter((ep) =>
    ep.title.toLowerCase().includes(searchEps.toLowerCase()) ||
    String(ep.eps).includes(searchEps)
  );

  // First & Latest episode
  const firstEpisode = detail.episodeList?.[detail.episodeList.length - 1];
  const latestEpisode = detail.episodeList?.[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-colors flutter-button"
      >
        <ChevronLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl glass-flutter border border-cyan-500/20 overflow-hidden shadow-2xl p-6 sm:p-8 md:p-10">
        {/* Background poster blur */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={detail.poster}
            alt={detail.title}
            className="w-full h-full object-cover filter blur-2xl opacity-20 scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Poster Image */}
          <div className="relative w-44 sm:w-56 aspect-[3/4] flex-shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-neon-cyan group">
            <img
              src={detail.poster}
              alt={detail.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {detail.score && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-amber-500/40 text-amber-300 font-bold text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {detail.score}
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                {detail.title}
              </h1>
              {detail.japanese && (
                <p className="text-xs sm:text-sm text-cyan-400 font-medium mt-1">
                  {detail.japanese}
                </p>
              )}
            </div>

            {/* Quick Meta Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              {detail.status && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  {detail.status}
                </span>
              )}
              {detail.type && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300">
                  {detail.type}
                </span>
              )}
              {detail.duration && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {detail.duration}
                </span>
              )}
              {detail.studios && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300 flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  {detail.studios}
                </span>
              )}
              {detail.aired && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300 flex items-center gap-1">
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
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#151c2a] border border-white/10 text-slate-300"
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
                  href={`/watch/${latestEpisode.episodeId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-bold text-xs sm:text-sm shadow-neon-cyan transition-all flutter-button hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Tonton Episode Terbaru
                </Link>
              )}

              {firstEpisode && firstEpisode !== latestEpisode && (
                <Link
                  href={`/watch/${firstEpisode.episodeId}`}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl glass-card border border-white/10 hover:border-cyan-500/40 text-slate-200 text-xs sm:text-sm font-semibold transition-all flutter-button"
                >
                  Episode 1
                </Link>
              )}

              <button
                onClick={handleBookmarkToggle}
                className={`p-3 rounded-2xl border transition-all flutter-button flex items-center gap-1.5 text-xs font-semibold ${
                  bookmarked
                    ? 'bg-purple-600/20 border-purple-400 text-purple-300 shadow-neon-purple'
                    : 'glass-card border-white/10 text-slate-300 hover:text-white hover:border-purple-400/50'
                }`}
                title={bookmarked ? 'Hapus dari Koleksi' : 'Tambah ke Koleksi'}
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-purple-400" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Favorit</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs transition-all flutter-button"
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
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-cyan-400" />
              Sinopsis
            </h3>
            <div
              className={`text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2 transition-all ${
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
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold pt-1"
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
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-neon-cyan">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Daftar Episode</h2>
              <p className="text-xs text-slate-400">
                Total {detail.episodeList?.length || 0} Episode Tersedia
              </p>
            </div>
          </div>

          {/* Search Episode Filter */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchEps}
              onChange={(e) => setSearchEps(e.target.value)}
              placeholder="Cari episode (cth: 1, 12)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121824] border border-white/10 focus:border-cyan-500 text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Episode List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredEpisodes.map((ep) => {
            const isWatched = watchedEpisodes.includes(ep.episodeId);

            return (
              <Link
                key={ep.episodeId}
                href={`/watch/${ep.episodeId}`}
                className={`p-3.5 rounded-2xl glass-card flex items-center justify-between gap-3 group transition-all flutter-button ${
                  isWatched
                    ? 'border-cyan-500/40 bg-cyan-950/20'
                    : 'hover:border-cyan-500/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      EPS {ep.eps}
                    </span>
                    {isWatched && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Ditonton
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate mt-1">
                    {ep.title}
                  </h4>
                  {ep.date && (
                    <span className="text-[10px] text-slate-400">{ep.date}</span>
                  )}
                </div>

                <div className="w-8 h-8 rounded-full bg-cyan-500/10 group-hover:bg-gradient-to-tr group-hover:from-cyan-500 group-hover:to-fuchsia-500 text-cyan-400 group-hover:text-white flex items-center justify-center flex-shrink-0 transition-all shadow-sm">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        {filteredEpisodes.length === 0 && (
          <div className="p-8 text-center glass-card rounded-2xl text-slate-400 text-xs">
            Tidak ada episode yang cocok dengan pencarian "{searchEps}"
          </div>
        )}
      </div>
    </div>
  );
}
