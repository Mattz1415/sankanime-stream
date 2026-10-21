'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  ArrowUp,
  AlertCircle,
  List,
} from 'lucide-react';
import { fetchComicChapter } from '@/lib/mediaApi';
import { ComicChapterData } from '@/lib/types';
import ChapterPageImage from './ChapterPageImage';
import ErrorBoundary from './ErrorBoundary';

interface VerticalComicReaderProps {
  comicTitle: string;
  chapterSlug: string;
  onClose: () => void;
  onNavigateChapter?: (chapterSlug: string) => void;
  allChapters?: Array<{ chapter: string; slug: string }>;
}

export default function VerticalComicReader({
  comicTitle,
  chapterSlug,
  onClose,
  onNavigateChapter,
  allChapters = [],
}: VerticalComicReaderProps) {
  const [data, setData] = useState<ComicChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [readPercent, setReadPercent] = useState<number>(0);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadChapter() {
      try {
        setLoading(true);
        setError(null);
        setFailedImages({});
        const res = await fetchComicChapter(chapterSlug, comicTitle);
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat gambar halaman chapter.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadChapter();
    return () => {
      isMounted = false;
    };
  }, [chapterSlug]);

  // Handle scroll progress
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight <= clientHeight) {
      setReadPercent(100);
      return;
    }
    const percent = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setReadPercent(percent);
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRetryImage = (index: number) => {
    setFailedImages((prev) => ({ ...prev, [index]: false }));
  };

  const currentChapterName =
    allChapters.find((c) => c.slug === chapterSlug)?.chapter || chapterSlug.replace(/-/g, ' ');

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans select-none animate-fade-in">
      {/* Top Header Bar (Flutter SliverBar) */}
      <header className="px-4 py-3 bg-[#0D0D0F]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 flex items-center justify-center text-white spring-press shrink-0"
            title="Tutup Reader"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h3 className="font-sans font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-md">
              {comicTitle}
            </h3>
            <p className="text-[11px] text-zinc-400 font-semibold truncate capitalize">
              {currentChapterName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Chapter Selector Dropdown Modal Trigger */}
          {allChapters.length > 0 && (
            <button
              type="button"
              onClick={() => setShowChaptersModal(!showChaptersModal)}
              className="px-3 py-1.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 spring-press"
              title="Daftar Chapter"
            >
              <List className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Chapter</span>
            </button>
          )}

          {/* Zoom In/Out */}
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white spring-press hidden sm:flex"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white spring-press hidden sm:flex"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center spring-press"
            title="Keluar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Progress Bar Indicator (Monochrome Liquid Glass) */}
      <div className="w-full h-1 bg-white/[0.08] relative z-20">
        <div
          className="h-full bg-white transition-all duration-150 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          style={{ width: `${readPercent}%` }}
        />
      </div>

      {/* Chapter Selection Drawer (Flutter DraggableSheet Style) */}
      {showChaptersModal && (
        <div className="absolute top-14 right-4 z-40 w-72 max-h-[70vh] rounded-[24px] liquid-glass-surface p-4 shadow-2xl overflow-y-auto space-y-2 animate-fade-in-up">
          <div className="w-10 h-1.5 rounded-full bg-white/25 mx-auto my-1" />
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold text-zinc-300">
            <span>Daftar Chapter</span>
            <button
              onClick={() => setShowChaptersModal(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 pt-1 max-h-[50vh] overflow-y-auto no-scrollbar">
            {allChapters.map((ch) => {
              const isCurrent = ch.slug === chapterSlug;
              return (
                <button
                  key={ch.slug}
                  onClick={() => {
                    setShowChaptersModal(false);
                    if (onNavigateChapter) onNavigateChapter(ch.slug);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    isCurrent
                      ? 'bg-[#2C2C2E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]'
                      : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {ch.chapter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Reader Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#000000] flex flex-col items-center safe-dock-padding select-none"
      >
        {loading && (
          <div className="my-auto py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]" />
            <div className="space-y-1">
              <p className="font-cinematic font-bold text-sm text-white">Memuat Halaman Chapter...</p>
              <p className="text-xs text-zinc-500">Menyusun strip gambar vertikal resolusi tinggi</p>
            </div>
          </div>
        )}

        {error && (
          <div className="my-auto p-8 rounded-3xl card-frosted-obsidian border border-red-500/30 text-center max-w-sm space-y-3">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="font-bold text-sm text-white">Gagal Membuka Chapter</p>
            <p className="text-xs text-zinc-400">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchComicChapter(chapterSlug)
                  .then((res) => setData(res))
                  .catch((err) => setError(err.message))
                  .finally(() => setLoading(false));
              }}
              className="px-5 py-2 rounded-full bg-cyan-400 text-black font-extrabold text-xs hover:bg-cyan-300 spring-press inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba Muat Ulang
            </button>
          </div>
        )}

        {/* Empty Chapter Content */}
        {!loading && !error && data && (!data.images || data.images.length === 0) && (
          <div className="my-auto p-8 rounded-3xl card-frosted-obsidian border border-white/[0.08] text-center max-w-sm space-y-3">
            <BookOpen className="w-10 h-10 text-cyan-400 mx-auto" />
            <p className="font-bold text-sm text-white">Chapter Sedang Diproses</p>
            <p className="text-xs text-zinc-400">
              Halaman untuk chapter ini sedang disinkronkan oleh server penyedia. Silakan buka chapter sebelumnya atau coba beberapa saat lagi.
            </p>
            {allChapters && allChapters.length > 1 && onNavigateChapter && (
              <button
                onClick={() => {
                  const currentIndex = allChapters.findIndex((c) => c.slug === chapterSlug);
                  const nextCh = allChapters[currentIndex + 1] || allChapters[0];
                  if (nextCh) onNavigateChapter(nextCh.slug);
                }}
                className="px-5 py-2 rounded-full bg-cyan-400 text-black font-extrabold text-xs hover:bg-cyan-300 spring-press inline-flex items-center gap-1.5"
              >
                Pilih Chapter Lain
              </button>
            )}
          </div>
        )}

        {!loading && !error && data && data.images && data.images.length > 0 && (
          <div
            className="w-full max-w-3xl flex flex-col items-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          >
            {data.images.map((imgUrl, idx) => (
              <div key={`${chapterSlug}-${idx}`} className="w-full relative min-h-[300px] bg-[#020204] flex items-center justify-center">
                <ChapterPageImage
                  src={imgUrl}
                  pageNumber={idx + 1}
                  total={data.images.length}
                  alt={`${currentChapterName} Halaman ${idx + 1}`}
                />
              </div>
            ))}

            {/* Bottom Chapter End Navigator */}
            <div className="w-full p-8 mt-6 rounded-3xl card-frosted-obsidian border border-white/[0.08] text-center space-y-4 max-w-xl mx-auto my-12">
              <BookOpen className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="space-y-1">
                <p className="font-cinematic font-bold text-sm text-white">
                  Kamu telah menyelesaikan {currentChapterName}!
                </p>
                <p className="text-xs text-zinc-500">Lanjutkan membaca ke chapter berikutnya:</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {data.navigation?.previousChapter && onNavigateChapter && (
                  <button
                    type="button"
                    onClick={() => {
                      scrollToTop();
                      onNavigateChapter(data.navigation!.previousChapter!);
                    }}
                    className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs spring-press flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Chapter Sebelumnya
                  </button>
                )}

                {data.navigation?.nextChapter && onNavigateChapter ? (
                  <button
                    type="button"
                    onClick={() => {
                      scrollToTop();
                      onNavigateChapter(data.navigation!.nextChapter!);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-cyan-400 text-black font-extrabold text-xs hover:bg-cyan-300 shadow-lg shadow-cyan-400/20 spring-press flex items-center gap-1.5"
                  >
                    <span>Lanjut Chapter Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-xs text-emerald-400 font-bold">Ini adalah chapter paling baru!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2">
        {readPercent > 20 && (
          <button
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 flex items-center justify-center spring-press font-bold"
            title="Ke Atas"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
