'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Dice5,
  X,
  Play,
  RotateCw,
  Star,
  Zap,
  Bookmark,
  BookmarkCheck,
  Crown
} from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { getHomeData } from '@/lib/clientApi';
import { isAnimeBookmarked, toggleBookmark } from '@/lib/storage';
import { getSafeImageUrl, handleSmartImageError } from '@/lib/imageHelper';
import SmartImage from './SmartImage';

interface AnimeGachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPool?: AnimeListItem[];
}

type SummonStage = 'idle' | 'spinning' | 'burst' | 'revealed';
type RarityTier = 'SSR MYTHIC' | 'SR EPIC' | 'RARE';

export default function AnimeGachaModal({ isOpen, onClose, initialPool }: AnimeGachaModalProps) {
  const router = useRouter();
  const [pool, setPool] = useState<AnimeListItem[]>([]);
  const [stage, setStage] = useState<SummonStage>('idle');
  const [selectedAnime, setSelectedAnime] = useState<AnimeListItem | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [shake, setShake] = useState(false);

  // 30 items strip for roulette
  const [rouletteList, setRouletteList] = useState<AnimeListItem[]>([]);
  const [winningIndex, setWinningIndex] = useState(24);
  const [translateStyle, setTranslateStyle] = useState<string>('translate3d(0, 0, 0)');
  const [transitionStyle, setTransitionStyle] = useState<string>('none');

  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startRafRef = useRef<number | null>(null);

  // Handle open / close
  useEffect(() => {
    if (isOpen) {
      if (initialPool && initialPool.length > 0) {
        setPool(initialPool);
        setupAndStartRoll(initialPool);
      } else {
        loadGachaPool();
      }
    } else {
      setStage('idle');
      setShake(false);
      clearAllTimers();
    }

    return () => {
      clearAllTimers();
    };
  }, [isOpen, initialPool]);

  const clearAllTimers = () => {
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    if (startRafRef.current) cancelAnimationFrame(startRafRef.current);
  };

  const loadGachaPool = async () => {
    try {
      const data = await getHomeData();
      const combined = [
        ...(data.ongoing?.animeList || []),
        ...(data.complete?.animeList || []),
      ];
      if (combined.length > 0) {
        setPool(combined);
        setupAndStartRoll(combined);
      }
    } catch (e) {
      console.error('Failed to load gacha pool', e);
    }
  };

  const calculateRarity = (anime: AnimeListItem): { tier: RarityTier; color: string; border: string; glow: string } => {
    const rawScore = parseFloat(anime.score || '0');
    if (rawScore >= 8.2 || anime.title.toLowerCase().includes('piece') || anime.title.toLowerCase().includes('jujutsu')) {
      return {
        tier: 'SSR MYTHIC',
        color: 'from-amber-300 via-yellow-200 to-amber-500',
        border: 'border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.6)]',
        glow: 'rgba(251,191,36,0.6)',
      };
    }
    if (rawScore >= 7.5 || rawScore === 0) {
      return {
        tier: 'SR EPIC',
        color: 'from-purple-300 via-pink-300 to-indigo-400',
        border: 'border-purple-400 shadow-[0_0_35px_rgba(168,85,247,0.6)]',
        glow: 'rgba(168,85,247,0.6)',
      };
    }
    return {
      tier: 'RARE',
      color: 'from-cyan-300 via-teal-200 to-cyan-500',
      border: 'border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.6)]',
      glow: 'rgba(6,182,212,0.6)',
    };
  };

  /**
   * Generates a 30-card strip, positions the chosen winner at index 24,
   * and runs a smooth 3.5s slot spin with cubic-bezier(0.12, 0.8, 0.18, 1) landing dead-center.
   */
  const setupAndStartRoll = (sourcePool: AnimeListItem[]) => {
    if (!sourcePool || sourcePool.length === 0) return;

    clearAllTimers();

    // Pick winner randomly
    const winnerIndex = Math.floor(Math.random() * sourcePool.length);
    const winner = sourcePool[winnerIndex];
    const targetIdx = 24; // Lands at index 24 out of 30 cards

    // Generate 30 items
    const strip: AnimeListItem[] = [];
    for (let i = 0; i < 30; i++) {
      if (i === targetIdx) {
        strip.push(winner);
      } else {
        const randItem = sourcePool[Math.floor(Math.random() * sourcePool.length)];
        strip.push(randItem);
      }
    }

    setRouletteList(strip);
    setWinningIndex(targetIdx);
    setSelectedAnime(winner);
    setShake(false);

    // Reset track position to 0 with no transition
    setTransitionStyle('none');
    setTranslateStyle('translate3d(0px, 0, 0)');
    setStage('spinning');

    // Launch animation in next tick
    startRafRef.current = requestAnimationFrame(() => {
      // Step: 120px card width + 12px gap = 132px. Center offset: 60px
      const targetOffset = targetIdx * 132 + 60;
      setTransitionStyle('transform 3500ms cubic-bezier(0.12, 0.8, 0.18, 1)');
      setTranslateStyle(`translate3d(calc(50% - ${targetOffset}px), 0, 0)`);

      // After 3500ms, trigger burst
      spinTimeoutRef.current = setTimeout(() => {
        setStage('burst');
        setShake(true);

        // After 600ms burst, reveal card
        burstTimeoutRef.current = setTimeout(() => {
          setShake(false);
          setStage('revealed');
          if (winner) {
            setIsSaved(isAnimeBookmarked(winner.animeId));
          }
        }, 600);
      }, 3500);
    });
  };

  const handleToggleSave = () => {
    if (!selectedAnime) return;
    const newState = toggleBookmark({
      animeId: selectedAnime.animeId,
      title: selectedAnime.title,
      poster: selectedAnime.poster,
      score: selectedAnime.score,
      status: selectedAnime.status,
    });
    setIsSaved(newState);
  };

  if (!isOpen) return null;

  const rarity = selectedAnime ? calculateRarity(selectedAnime) : null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 overflow-y-auto animate-fade-in-up ${
        shake ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Radial Background Particle Flare */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-amber-500/10 rounded-full opacity-50" />
      </div>

      {/* Close Button Top Right */}
      <button
        onClick={onClose}
        className="fixed top-5 right-5 z-50 p-2.5 rounded-full bg-black/60 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/15 spring-press shadow-2xl"
        title="Tutup Modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Summon Stage Box */}
      <div className="relative w-full max-w-xl my-auto rounded-3xl bg-[#040407]/95 border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.98),inset_0_1px_0_0_rgba(255,255,255,0.15)] overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5 text-left">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-black shadow-lg shadow-amber-400/30">
              <Sparkles className="w-5 h-5 fill-black" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinematic font-black text-lg text-white tracking-wider uppercase">
                  Nexus Anime Summon
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                  GACHA ROULETTE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Putaran pita 30 kartu berkecepatan tinggi dengan sistem akurasi laser dead-center!
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAHAP 1 & 2: HIGH-SPEED ROULETTE CAROUSEL & BURST */}
        {/* ========================================================================= */}
        {(stage === 'spinning' || stage === 'burst') && (
          <div className="relative py-8 space-y-6 overflow-hidden">
            {/* Center Neon Target Laser Line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-cyan-400 via-white to-cyan-400 z-30 shadow-[0_0_18px_#00f0ff] pointer-events-none">
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-5 rounded-full bg-cyan-400/40 border border-white shadow-[0_0_15px_#00f0ff] animate-ping" />
            </div>

            {/* Stage Indicator */}
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-black tracking-widest uppercase border border-cyan-500/30 animate-pulse">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                {stage === 'spinning' ? 'MEMUTAR SLOT KARTU ANIME (3.5s)...' : 'BURST! MENGUNCI TARGET...'}
              </span>
            </div>

            {/* Horizontal Sliding Carousel Strip */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-black/80 p-3 border border-white/10 shadow-inner">
              <div
                className="flex items-center gap-3 will-change-transform"
                style={{
                  transform: translateStyle,
                  transition: transitionStyle,
                  filter: stage === 'spinning' ? 'blur(1.2px)' : 'none',
                }}
              >
                {rouletteList.map((item, idx) => (
                  <div
                    key={`${item.animeId}-${idx}`}
                    className={`relative w-[120px] h-44 rounded-xl overflow-hidden shrink-0 border transition-all duration-300 ${
                      idx === winningIndex && stage === 'burst'
                        ? 'border-amber-400 scale-105 shadow-[0_0_30px_rgba(251,191,36,0.9)] z-20'
                        : 'border-white/10 opacity-75'
                    }`}
                  >
                    <SmartImage
                      src={item.poster}
                      title={item.title}
                      alt={item.title}
                      type="anime"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white truncate text-center drop-shadow-md">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shockwave Burst Ring in Center */}
            {stage === 'burst' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="w-56 h-56 rounded-full border-4 border-amber-400 animate-shockwave" />
                <div className="w-36 h-36 rounded-full bg-white/50 filter blur-md animate-ping" />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAHAP 3: REVEALED HOLOGRAPHIC FOIL CARD & RARITY TIER */}
        {/* ========================================================================= */}
        {stage === 'revealed' && selectedAnime && rarity && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Holographic Card Showcase */}
            <div
              className={`relative mx-auto max-w-sm rounded-3xl overflow-hidden p-1 bg-gradient-to-tr ${rarity.color} ${rarity.border} transition-all duration-500`}
            >
              <div className="holographic-foil-card rounded-[22px] bg-[#06060c] p-4 text-left space-y-4">
                {/* Poster Container with Rarity Badge */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
                  <SmartImage
                    src={selectedAnime.poster}
                    title={selectedAnime.title}
                    alt={selectedAnime.title}
                    type="anime"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                  {/* Rarity Pill Top Left */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-xl">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span className={`bg-gradient-to-r ${rarity.color} bg-clip-text text-transparent`}>
                        {rarity.tier}
                      </span>
                    </span>
                  </div>

                  {/* Rating Top Right */}
                  {selectedAnime.score && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/40 text-xs font-bold text-amber-300 shadow-xl">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {selectedAnime.score}
                      </span>
                    </div>
                  )}

                  {/* Release Info Bottom Left */}
                  <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-zinc-300">
                    <span className="font-semibold px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10">
                      {selectedAnime.episodes ? `${selectedAnime.episodes} Episode` : 'Tamat / Ongoing'}
                    </span>
                    <span className="text-zinc-400">Subtitle Indonesia</span>
                  </div>
                </div>

                {/* Anime Meta Details */}
                <div className="space-y-1.5">
                  <h4 className="font-cinematic font-black text-xl text-white leading-tight">
                    {selectedAnime.title}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    Anime terpilih secara otomatis melalui algoritma Gacha Roulette. Nikmati kualitas streaming HD tanpa jeda dengan sistem multi-server.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Tonton Sekarang, Summon Lagi (Reroll), Simpan */}
            <div className="space-y-2.5 pt-2">
              <Link
                href={`/anime?id=${selectedAnime.animeId}`}
                onClick={onClose}
                className="w-full py-3.5 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-zinc-100 to-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] spring-press flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>▶ Tonton Sekarang</span>
              </Link>

              <div className="flex items-center gap-2">
                {/* Reroll Gacha Button */}
                <button
                  type="button"
                  onClick={() => setupAndStartRoll(pool)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all spring-press flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🎲 Putar Lagi</span>
                </button>

                {/* Save Bookmark Button */}
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all spring-press flex items-center gap-1.5 ${
                    isSaved
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-white/10 hover:bg-white/15 text-zinc-300 border-white/15 hover:text-white'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Simpan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
