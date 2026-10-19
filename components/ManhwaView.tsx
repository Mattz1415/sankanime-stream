'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Star,
  RefreshCw,
  Search,
  Flame,
  ChevronRight,
  X,
  Palette,
} from 'lucide-react';
import { fetchManhwaList, fetchComicDetail } from '@/lib/mediaApi';
import { ComicItem, ComicDetail } from '@/lib/types';
import VerticalComicReader from './VerticalComicReader';

export default function ManhwaView() {
  const [manhwaList, setManhwaList] = useState<ComicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal state
  const [selectedManhwa, setSelectedManhwa] = useState<ComicItem | null>(null);
  const [detailData, setDetailData] = useState<ComicDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Active Reader state
  const [readingChapterSlug, setReadingChapterSlug] = useState<string | null>(null);
  const [readingTitle, setReadingTitle] = useState<string>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchManhwaList();
        setManhwaList(res);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleOpenDetail = async (item: ComicItem) => {
    setSelectedManhwa(item);
    setDetailLoading(true);
    try {
      const res = await fetchComicDetail(item.slug);
      setDetailData(res);
    } catch {
      setDetailData({
        title: item.title,
        slug: item.slug,
        image: item.image,
        synopsis: item.description || 'Webtoon Korea berwarna dengan jalan cerita intens.',
        metadata: { type: 'Manhwa', status: 'Ongoing', concept: 'Full Color' },
        genres: [{ name: 'Action', slug: 'action' }, { name: 'Fantasy', slug: 'fantasy' }],
        chapters: Array.from({ length: 20 }, (_, i) => ({
          chapter: `Chapter ${200 - i}`,
          slug: `${item.slug}-chapter-${200 - i}`,
          date: 'Terbaru',
        })),
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLaunchReader = (chapterSlug: string, title?: string) => {
    setReadingTitle(title || selectedManhwa?.title || 'Manhwa');
    setReadingChapterSlug(chapterSlug);
    setSelectedManhwa(null);
  };

  const filteredList = manhwaList.filter((m) =>
    searchQuery.trim() === ''
      ? true
      : m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden card-frosted-obsidian border border-white/[0.08] p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>KOREAN WEBTOON & MANHWA FULL COLOR</span>
          </div>

          <h1 className="font-cinematic font-black text-2xl sm:text-4xl text-white tracking-wide leading-tight">
            Solo Leveling, Lookism & Omniscient Reader
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Nikmati ribuan chapter manhwa dan webtoon Korea berwarna dengan pengalaman membaca vertikal berkecepatan tinggi tanpa hambatan.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Solo Leveling, Lookism, Nano Machine..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.08] border border-white/[0.12] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400/60"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 rounded-xl bg-white/10 text-xs font-bold text-zinc-400 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Manhwa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <h3 className="font-cinematic font-bold text-sm text-white uppercase tracking-wider">
              Manhwa Populer Teratas ({filteredList.length})
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-semibold hidden sm:inline">
            Full HD Color Pages
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]" />
            <p className="text-xs text-zinc-400 font-semibold">Mengambil daftar Manhwa Korea...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredList.map((item, idx) => (
              <div
                key={item.slug || idx}
                onClick={() => handleOpenDetail(item)}
                className="group cursor-pointer rounded-2xl overflow-hidden card-frosted-obsidian border border-white/[0.08] hover:border-purple-400/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300 spring-press flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-80" />

                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/80 backdrop-blur-md text-[10px] font-bold text-purple-300 border border-purple-400/30">
                      {item.chapter || 'Full Color'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-amber-300 font-bold border border-amber-400/30">
                    <Star className="w-3 h-3 fill-amber-300" />
                    <span>{item.score || '9.6'}</span>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                  <h4 className="font-bold text-xs text-zinc-200 group-hover:text-purple-300 line-clamp-2 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                    <span>Webtoon Korea</span>
                    <span className="text-purple-400 font-semibold group-hover:underline">Baca ▶</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedManhwa && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl card-frosted-obsidian border border-white/[0.12] p-6 shadow-2xl space-y-5 my-8">
            <button
              onClick={() => setSelectedManhwa(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center spring-press z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !detailData ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                <p className="text-xs text-zinc-400">Memuat info webtoon & daftar chapter...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-5">
                  <img
                    src={detailData.image}
                    alt={detailData.title}
                    className="w-36 h-48 object-cover rounded-2xl shadow-xl shrink-0 mx-auto sm:mx-0 border border-white/10"
                  />
                  <div className="space-y-2 min-w-0">
                    <h3 className="font-cinematic font-black text-xl text-white leading-tight">
                      {detailData.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-400/30">
                        Manhwa (Webtoon)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-400 font-mono text-[11px] font-bold">
                        {detailData.metadata?.status || 'Ongoing'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {detailData.genres.map((g) => (
                        <span
                          key={g.slug || g.name}
                          className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-zinc-300 border border-white/[0.06]"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-3 pt-1 leading-relaxed">
                      {detailData.synopsis}
                    </p>
                  </div>
                </div>

                {/* Chapter List Section */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-cinematic font-bold text-xs uppercase tracking-wider text-zinc-300">
                      Pilih Chapter ({detailData.chapters.length})
                    </h4>
                    <span className="text-[11px] text-purple-400 font-semibold">Vertical Webtoon</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {detailData.chapters.map((ch) => (
                      <button
                        key={ch.slug}
                        type="button"
                        onClick={() => handleLaunchReader(ch.slug, detailData.title)}
                        className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-purple-500/20 border border-white/[0.08] hover:border-purple-400/40 text-xs font-bold text-zinc-200 hover:text-purple-300 text-left truncate spring-press transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{ch.chapter}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vertical Comic Reader Modal */}
      {readingChapterSlug && (
        <VerticalComicReader
          comicTitle={readingTitle}
          chapterSlug={readingChapterSlug}
          onClose={() => setReadingChapterSlug(null)}
          onNavigateChapter={(slug) => setReadingChapterSlug(slug)}
          allChapters={detailData?.chapters || []}
        />
      )}
    </div>
  );
}
