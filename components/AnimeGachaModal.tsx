'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Dice5,
  X,
  Play,
  RotateCw,
  Star,
  Film,
  Zap,
  Flame,
  Award
} from 'lucide-react';
import { AnimeListItem } from '@/lib/types';
import { getHomeData } from '@/lib/clientApi';

interface AnimeGachaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnimeGachaModal({ isOpen, onClose }: AnimeGachaModalProps) {
  const router = useRouter();
  const [pool, setPool] = useState<AnimeListItem[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AnimeListItem | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  // Fetch anime pool on mount or open
  useEffect(() => {
    if (isOpen && pool.length === 0) {
      loadGachaPool();
    }
  }, [isOpen]);

  const loadGachaPool = async () => {
    try {
      const data = await getHomeData();
      const combined = [
        ...(data.ongoing?.animeList || []),
        ...(data.complete?.animeList || [])
      ];
      setPool(combined);
      if (combined.length > 0 && !selectedAnime) {
        // Pick initial
        const randomIndex = Math.floor(Math.random() * combined.length);
        setSelectedAnime(combined[randomIndex]);
      }
    } catch (e) {
      console.error('Failed to load gacha pool', e);
    }
  };

  const spinGacha = () => {
    if (pool.length === 0 || spinning) return;

    setSpinning(true);
    setSpinCount((prev) => prev + 1);

    let speed = 60;
    let iterations = 0;
    const maxIterations = 24;

    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * pool.length);
      setSelectedAnime(pool[randIdx]);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, speed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-3xl animate-fade-in-up">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-[#050508]/95 border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.98),inset_0_1px_0_0_rgba(255,255,255,0.12)] overflow-hidden p-6 space-y-6 text-center">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Dice5 className="w-5 h-5 animate-spin-slow" />
            </span>
            <div className="text-left">
              <h3 className="font-cinematic font-bold text-base text-white">
                Acak Anime (Surprise Me)
              </h3>
              <p className="text-[11px] text-zinc-400">Bingung mau nonton apa? Putar gacha rekomendasi!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 spring-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Anime Showcase Card */}
        {selectedAnime ? (
          <div
            className={`relative rounded-2xl overflow-hidden card-frosted-obsidian border p-4 space-y-3 transition-all duration-300 ${
              spinning
                ? 'border-cyan-500/60 shadow-[0_0_30px_rgba(0,240,255,0.4)] scale-98'
                : 'border-white/20 shadow-2xl'
            }`}
          >
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-black">
              <img
                src={selectedAnime.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80'}
                alt={selectedAnime.title}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  spinning ? 'blur-xs scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              {/* Badges on poster */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-cyan-400" />
                  Rekomendasi
                </span>
              </div>
            </div>

            {/* Title & info */}
            <div className="space-y-1">
              <h4 className="font-cinematic font-bold text-base text-white truncate">
                {selectedAnime.title}
              </h4>
              <p className="text-xs text-zinc-400">
                {selectedAnime.episodes ? `${selectedAnime.episodes} Eps` : selectedAnime.status || 'Episode Lengkap Sub Indo'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 card-frosted-obsidian rounded-2xl">
            <RotateCw className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
            <p className="text-xs text-zinc-400 mt-2">Menyiapkan kartu gacha...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={spinGacha}
            disabled={spinning || pool.length === 0}
            className={`w-full py-3 rounded-full text-xs font-black tracking-wider uppercase transition-all spring-press flex items-center justify-center gap-2 shadow-lg ${
              spinning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black shadow-amber-400/25 hover:shadow-amber-400/40 hover:scale-[1.02]'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-black" />
            {spinning ? 'Memutar Keberuntungan...' : '🎰 Putar Acak Anime Lagi'}
          </button>

          {selectedAnime && (
            <button
              onClick={() => {
                if (selectedAnime.animeId) {
                  router.push(`/anime?id=${selectedAnime.animeId}`);
                  onClose();
                }
              }}
              disabled={spinning}
              className="w-full py-2.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all spring-press flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              Tonton Anime Terpilih Ini
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
