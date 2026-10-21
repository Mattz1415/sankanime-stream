'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import SmartImage from './SmartImage';
import { isAnimeBookmarked, toggleBookmark } from '@/lib/storage';

interface HeroCarouselProps {
  featuredList: AnimeListItem[];
}

export default function HeroCarousel({ featuredList }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const items = featuredList.slice(0, 6);
  const currentAnime = items[currentIndex] || items[0];

  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (currentAnime) {
      setIsSaved(isAnimeBookmarked(currentAnime.animeId));
    }
  }, [currentIndex, currentAnime]);

  const handleToggleSave = () => {
    if (!currentAnime) return;
    const newState = toggleBookmark({
      animeId: currentAnime.animeId,
      title: currentAnime.title,
      poster: currentAnime.poster,
      score: currentAnime.score,
      status: currentAnime.status,
    });
    setIsSaved(newState);
  };

  if (!items.length || !currentAnime) return null;

  const prevIndex = (currentIndex - 1 + items.length) % items.length;
  const nextIndex = (currentIndex + 1) % items.length;
  const prevAnime = items[prevIndex];
  const nextAnime = items[nextIndex];

  return (
    <div className="relative w-full overflow-hidden py-3">
      {/* Flutter PageView 3D Carousel Container */}
      <div className="relative w-full max-w-6xl mx-auto flex items-center justify-center">
        {/* Left Peeking Side Card */}
        <div
          onClick={() => setCurrentIndex(prevIndex)}
          className="hidden lg:block absolute -left-20 w-80 h-[480px] rounded-[32px] overflow-hidden opacity-30 scale-[0.88] cursor-pointer transition-all duration-300 z-0 hover:opacity-50 border border-[#262626]"
        >
          <SmartImage
            item={prevAnime}
            src={prevAnime.poster}
            title={prevAnime.title}
            alt={prevAnime.title}
            type="anime"
            className="w-full h-full object-cover filter brightness-[0.6]"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Active Center Card */}
        <div className="relative w-full h-[480px] sm:h-[520px] rounded-[32px] overflow-hidden bg-[#141414] border border-[#262626] shadow-[0_24px_60px_rgba(0,0,0,0.95)] z-10 transition-all duration-300 group">
          {/* Background Artwork */}
          <div className="relative w-full h-full overflow-hidden bg-black">
            <SmartImage
              key={currentAnime.animeId}
              item={currentAnime}
              src={currentAnime.poster}
              title={currentAnime.title}
              alt={currentAnime.title}
              type="anime"
              className="w-full h-full object-cover object-center filter brightness-[0.88]"
            />

            {/* Gradient Darkening for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-black/60 via-40% to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none" />
          </div>

          {/* Left / Right Carousel Navigation Arrows */}
          <button
            onClick={() => setCurrentIndex(prevIndex)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1C1C1E]/80 border border-[#3A3A3C] flex items-center justify-center text-white active:scale-90 transition-all z-20 shadow-md hover:bg-[#2C2C2E]"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex(nextIndex)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1C1C1E]/80 border border-[#3A3A3C] flex items-center justify-center text-white active:scale-90 transition-all z-20 shadow-md hover:bg-[#2C2C2E]"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Flutter Monochrome Info Panel */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-20 rounded-[24px] bg-[#141414]/90 border border-[#262626] p-4 sm:p-5 shadow-2xl space-y-2.5">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] text-[10px] font-bold text-white tracking-wider uppercase">
                POPULER
              </span>

              {currentAnime.score && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242426] border border-[#3A3A3C] text-[10px] font-semibold text-zinc-200">
                  <Star className="w-3 h-3 fill-white text-white" />
                  {currentAnime.score}
                </span>
              )}

              <span className="px-2.5 py-1 rounded-full bg-[#242426] border border-[#3A3A3C] text-[10px] font-medium text-zinc-300">
                HD 1080p
              </span>

              <span className="px-2.5 py-1 rounded-full bg-[#242426] border border-[#3A3A3C] text-[10px] font-medium text-zinc-300">
                {currentAnime.episodes ? `Ep ${currentAnime.episodes}` : 'Ongoing'}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-sans font-bold text-lg sm:text-2xl text-white leading-tight line-clamp-1">
              {currentAnime.title}
            </h1>

            {/* Subtitle / Day Information */}
            <p className="text-xs text-zinc-400 font-normal line-clamp-1 max-w-xl">
              {currentAnime.releaseDay
                ? `Tayang setiap ${currentAnime.releaseDay}. Update rilis ${currentAnime.latestReleaseDate || ''} Sub Indo.`
                : 'Streaming anime sub Indo tercepat dan terlengkap dengan pemutar multi-server.'}
            </p>

            {/* CTA Buttons & Indicators */}
            <div className="flex items-center justify-between pt-1 gap-3">
              <div className="flex items-center gap-2.5">
                <Link
                  id="featured-play-btn"
                  href={`/anime?id=${currentAnime.animeId}`}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 shadow-md active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Nonton Sekarang</span>
                </Link>

                <button
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border active:scale-95 transition-all ${
                    isSaved
                      ? 'bg-[#2C2C2E] border-[#3A3A3C] text-white'
                      : 'bg-[#1C1C1E] border-[#2E2E30] text-zinc-300 hover:text-white'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-white" />
                      <span className="hidden sm:inline">Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">+ Simpan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Indicators */}
              <div className="flex items-center gap-1.5">
                {items.map((_, idx) => {
                  const isActive = currentIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`transition-all duration-200 rounded-full ${
                        isActive
                          ? 'w-5 h-1.5 bg-white'
                          : 'w-1.5 h-1.5 bg-zinc-600 hover:bg-zinc-400'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Peeking Side Card */}
        <div
          onClick={() => setCurrentIndex(nextIndex)}
          className="hidden lg:block absolute -right-20 w-80 h-[480px] rounded-[32px] overflow-hidden opacity-30 scale-[0.88] cursor-pointer transition-all duration-300 z-0 hover:opacity-50 border border-[#262626]"
        >
          <SmartImage
            item={nextAnime}
            src={nextAnime.poster}
            title={nextAnime.title}
            alt={nextAnime.title}
            type="anime"
            className="w-full h-full object-cover filter brightness-[0.6]"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      </div>
    </div>
  );
}
