'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Calendar, ChevronRight, Zap, Bell } from 'lucide-react';
import { ScheduleDay } from '@/lib/types';

interface ReleaseCountdownBannerProps {
  schedule: ScheduleDay[];
}

export default function ReleaseCountdownBanner({ schedule }: ReleaseCountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 3,
    minutes: 42,
    seconds: 18,
  });

  // Real-time ticking countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 6, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const todayAnime = schedule[0]?.animeList?.[0] || {
    title: 'Episode Baru Hari Ini',
    animeId: '',
  };

  return (
    <div className="relative w-full rounded-2xl p-4 sm:p-5 card-frosted-obsidian border border-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Background Accent Pulse */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Left: Info & Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black tracking-widest uppercase text-cyan-300">
              JADWAL RILIS HARI INI
            </span>
          </div>
          <h4 className="font-cinematic font-bold text-sm text-white">
            {todayAnime.title}
          </h4>
          <p className="text-[11px] text-zinc-400">Siap tayang dengan subtitle Indonesia kualitas 1080p</p>
        </div>
      </div>

      {/* Right: Digital Countdown Timer & CTA */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Countdown Digits */}
        <div className="flex items-center gap-1.5 font-mono text-center">
          <div className="px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/10 shadow-inner">
            <span className="text-sm sm:text-base font-black text-white">
              {timeLeft.hours.toString().padStart(2, '0')}
            </span>
            <span className="text-[8px] text-zinc-500 block uppercase">Jam</span>
          </div>
          <span className="text-zinc-600 font-bold">:</span>
          <div className="px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/10 shadow-inner">
            <span className="text-sm sm:text-base font-black text-cyan-300">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </span>
            <span className="text-[8px] text-zinc-500 block uppercase">Mnt</span>
          </div>
          <span className="text-zinc-600 font-bold">:</span>
          <div className="px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/10 shadow-inner">
            <span className="text-sm sm:text-base font-black text-amber-300">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-[8px] text-zinc-500 block uppercase">Dtk</span>
          </div>
        </div>

        {/* View Schedule Link */}
        <Link
          href="/schedule"
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all spring-press flex items-center gap-1"
        >
          <span>Jadwal</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
