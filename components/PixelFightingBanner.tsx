'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sword, Moon, X, Flame, ShieldAlert, Award } from 'lucide-react';

interface DamageNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  isCrit: boolean;
}

export default function PixelFightingBanner() {
  const [isManualMode, setIsManualMode] = useState(false);
  const [kepongHp, setKepongHp] = useState(10000);
  const [zabuzaHp, setZabuzaHp] = useState(10000);
  const [kepongX, setKepongX] = useState(25); // percentage
  const [zabuzaX, setZabuzaX] = useState(75); // percentage
  const [kepongY, setKepongY] = useState(0); // jump offset px
  const [isJumping, setIsJumping] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [activeSlash, setActiveSlash] = useState<{ x: number; y: number } | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [koState, setKoState] = useState<{ winner: string; countdown: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fight animation loop when NOT in manual mode
  useEffect(() => {
    if (isManualMode || koState) return;

    const interval = setInterval(() => {
      // Small automated battle dances
      const isPlayerTurn = Math.random() > 0.45;
      if (isPlayerTurn) {
        // Kepong attacks Zabuza
        triggerSlashEffect(70, 50, false);
        const dmg = Math.floor(Math.random() * 800) + 1200;
        setZabuzaHp((prev) => {
          const next = Math.max(0, prev - dmg);
          if (next === 0) triggerKO('KEPONG');
          return next;
        });
      } else {
        // Zabuza strikes Kepong
        const dmg = Math.floor(Math.random() * 600) + 900;
        setKepongHp((prev) => {
          const next = Math.max(0, prev - dmg);
          if (next === 0) triggerKO('ZABUZA');
          return next;
        });
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isManualMode, koState]);

  // Handle K.O. countdown
  useEffect(() => {
    if (!koState) return;

    if (koState.countdown > 0) {
      const timer = setTimeout(() => {
        setKoState((prev) => (prev ? { ...prev, countdown: prev.countdown - 1 } : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Reset match
      setKepongHp(10000);
      setZabuzaHp(10000);
      setKepongX(25);
      setZabuzaX(75);
      setKoState(null);
    }
  }, [koState]);

  const triggerKO = (winner: string) => {
    setKoState({ winner, countdown: 3 });
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const triggerSlashEffect = (x: number, y: number, isCrit: boolean) => {
    setActiveSlash({ x, y });
    setIsShaking(true);

    const dmgValues = isCrit
      ? ['-3,149 CRITICAL!', '-2,847 CRITICAL!', '-4,520 ULTRA!']
      : ['-2,847', '-1,980', '-2,150', '-2,400'];
    const chosenDmg = dmgValues[Math.floor(Math.random() * dmgValues.length)];

    const newDmgId = Date.now() + Math.random();
    setDamageNumbers((prev) => [
      ...prev.slice(-6),
      {
        id: newDmgId,
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        text: chosenDmg,
        isCrit,
      },
    ]);

    setTimeout(() => setActiveSlash(null), 300);
    setTimeout(() => setIsShaking(false), 200);

    // Remove damage text after animation
    setTimeout(() => {
      setDamageNumbers((prev) => prev.filter((d) => d.id !== newDmgId));
    }, 1200);
  };

  // Screen tap handler for default mode
  const handleBannerTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (koState) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tapX = ((e.clientX - rect.left) / rect.width) * 100;
    const tapY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked the Red Moon in center top
    if (tapX >= 40 && tapX <= 60 && tapY <= 38) {
      setIsManualMode(true);
      return;
    }

    // Default tap: execute violent player slash attack
    triggerSlashEffect(zabuzaX, 50, Math.random() > 0.5);
    setZabuzaHp((prev) => {
      const next = Math.max(0, prev - 1800);
      if (next === 0) triggerKO('KEPONG');
      return next;
    });
  };

  // Manual Control: Move Left
  const handleMoveLeft = () => {
    setKepongX((prev) => Math.max(10, prev - 8));
  };

  // Manual Control: Move Right
  const handleMoveRight = () => {
    setKepongX((prev) => Math.min(zabuzaX - 10, prev + 8));
  };

  // Manual Control: Jump
  const handleJump = () => {
    if (isJumping) return;
    setIsJumping(true);
    setKepongY(55);
    setTimeout(() => {
      setKepongY(0);
      setIsJumping(false);
    }, 450);
  };

  // Manual Control: Attack
  const handleManualAttack = () => {
    if (isAttacking || koState) return;
    setIsAttacking(true);

    const hit = Math.abs(kepongX - zabuzaX) < 25;
    if (hit) {
      triggerSlashEffect(zabuzaX, 45, true);
      setZabuzaHp((prev) => {
        const next = Math.max(0, prev - 2400);
        if (next === 0) triggerKO('KEPONG');
        return next;
      });
    } else {
      triggerSlashEffect(kepongX + 15, 50, false);
    }

    setTimeout(() => setIsAttacking(false), 350);
  };

  return (
    <div
      ref={containerRef}
      onClick={!isManualMode ? handleBannerTap : undefined}
      className={`relative w-full rounded-3xl overflow-hidden glass-obsidian border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.95)] transition-all select-none ${
        isManualMode ? 'h-[360px] sm:h-[400px]' : 'h-[200px] sm:h-[240px] cursor-pointer'
      } ${isShaking ? 'translate-x-1 -translate-y-1' : ''}`}
    >
      {/* 2D Pixel Night Sky Background with Stars & Red Moon */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06040f] via-[#09071a] to-[#020205] overflow-hidden pointer-events-none">
        {/* Distant Mountains Silhouette */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-[#04030a] opacity-80" />

        {/* Twinkling Pixel Stars */}
        <div className="absolute top-4 left-10 w-1 h-1 bg-white opacity-80" />
        <div className="absolute top-8 left-1/4 w-1 h-1 bg-cyan-300 opacity-60" />
        <div className="absolute top-12 right-1/4 w-1.5 h-1.5 bg-pink-300 opacity-70" />
        <div className="absolute top-6 right-16 w-1 h-1 bg-white opacity-90" />
        <div className="absolute top-16 left-1/3 w-1 h-1 bg-yellow-200 opacity-50" />

        {/* Center Glowing Red Moon ("Bulan Merah") */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsManualMode((prev) => !prev);
          }}
          className="absolute top-3 left-1/2 -translate-x-1/2 cursor-pointer pointer-events-auto group z-20"
          title="Bulan Merah: Ketuk untuk Mode Kontrol Manual"
        >
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 shadow-[0_0_35px_rgba(239,68,68,0.85)] flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-red-300/40 flex items-center justify-center">
              <Moon className="w-5 h-5 text-white fill-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Top HP HUD: "ZABUZA VS KEPONG" */}
      <div className="relative z-20 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 pointer-events-none">
        {/* Kepong HP Bar (Player) */}
        <div className="flex-1 max-w-[200px] sm:max-w-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black text-cyan-400">
            <span className="flex items-center gap-1">
              <Sword className="w-3.5 h-3.5" />
              KEPONG
            </span>
            <span className="font-mono">{kepongHp} / 10000</span>
          </div>
          <div className="w-full h-3 rounded-full bg-black/80 border border-cyan-500/40 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.7)]"
              style={{ width: `${(kepongHp / 10000) * 100}%` }}
            />
          </div>
        </div>

        {/* Center VS Label */}
        <div className="text-center">
          <span className="font-cinematic font-black text-xs sm:text-sm tracking-wider text-red-400 uppercase drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]">
            VS
          </span>
        </div>

        {/* Zabuza HP Bar (Boss) */}
        <div className="flex-1 max-w-[200px] sm:max-w-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black text-red-400">
            <span className="font-mono">{zabuzaHp} / 10000</span>
            <span className="flex items-center gap-1">
              ZABUZA
              <Flame className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-black/80 border border-red-500/40 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-red-600 to-rose-500 transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.7)]"
              style={{ width: `${(zabuzaHp / 10000) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Floating Damage Numbers */}
      {damageNumbers.map((dmg) => (
        <div
          key={dmg.id}
          className={`absolute z-30 font-black font-mono text-sm sm:text-base pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] animate-fade-in-up ${
            dmg.isCrit ? 'text-amber-300 scale-125' : 'text-cyan-300'
          }`}
          style={{ left: `${dmg.x}%`, top: `${dmg.y}%` }}
        >
          {dmg.text}
        </div>
      ))}

      {/* Blue Slash Effect Arc */}
      {activeSlash && (
        <div
          className="absolute z-20 pointer-events-none transition-all duration-200"
          style={{ left: `${activeSlash.x - 10}%`, top: `${activeSlash.y - 15}%` }}
        >
          <svg viewBox="0 0 100 100" className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.9)]">
            <path
              d="M10,80 Q50,20 90,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="animate-pulse"
            />
            <path
              d="M20,90 Q55,30 95,20"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Battle Stage: Pixel Sprites */}
      <div className="absolute inset-x-0 bottom-6 sm:bottom-8 h-28 pointer-events-none flex items-end">
        {/* Ground Line */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500/30 via-white/20 to-red-500/30 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />

        {/* Kepong Pixel Hero Sprite */}
        <div
          className="absolute transition-all duration-150 flex flex-col items-center"
          style={{
            left: `${kepongX}%`,
            bottom: `${kepongY}px`,
            transform: isAttacking ? 'scale(1.2) translateX(15px)' : 'scale(1)',
          }}
        >
          {/* Sprite Box */}
          <div className="relative w-14 h-16 flex items-center justify-center">
            {/* Retro Pixel Art Character (SVG) */}
            <svg viewBox="0 0 24 24" className="w-12 h-14 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">
              {/* Head & Headband */}
              <rect x="9" y="2" width="6" height="5" fill="#38bdf8" />
              <rect x="8" y="4" width="8" height="2" fill="#0284c7" />
              {/* Eyes */}
              <rect x="10" y="5" width="2" height="1" fill="#ffffff" />
              <rect x="13" y="5" width="2" height="1" fill="#ffffff" />
              {/* Body Outfit */}
              <rect x="7" y="7" width="10" height="8" fill="#0f172a" />
              <rect x="9" y="7" width="6" height="6" fill="#0284c7" />
              {/* Katana Blade */}
              <rect x="17" y="4" width="2" height="12" fill="#e0f2fe" transform="rotate(30 17 4)" />
              {/* Legs */}
              <rect x="8" y="15" width="3" height="6" fill="#0284c7" />
              <rect x="13" y="15" width="3" height="6" fill="#0284c7" />
            </svg>
            <span className="absolute -top-3 text-[9px] font-mono font-bold text-cyan-300">KEPONG</span>
          </div>
        </div>

        {/* Zabuza Pixel Boss Sprite */}
        <div
          className="absolute transition-all duration-300 flex flex-col items-center"
          style={{ right: `${100 - zabuzaX}%` }}
        >
          {/* Sprite Box */}
          <div className="relative w-16 h-18 flex items-center justify-center">
            {/* Retro Pixel Art Zabuza (SVG) */}
            <svg viewBox="0 0 24 24" className="w-14 h-16 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]">
              {/* Bandaged Head */}
              <rect x="8" y="2" width="8" height="6" fill="#1e1b4b" />
              <rect x="9" y="5" width="6" height="3" fill="#e2e8f0" />
              {/* Eyes */}
              <rect x="10" y="4" width="2" height="1" fill="#ef4444" />
              <rect x="13" y="4" width="2" height="1" fill="#ef4444" />
              {/* Body */}
              <rect x="6" y="8" width="12" height="8" fill="#020617" />
              {/* Kubikiribocho Giant Blade */}
              <rect x="18" y="1" width="4" height="16" fill="#94a3b8" />
              <circle cx="20" cy="5" r="1.5" fill="#020617" />
              {/* Legs */}
              <rect x="8" y="16" width="3" height="6" fill="#1e1b4b" />
              <rect x="13" y="16" width="3" height="6" fill="#1e1b4b" />
            </svg>
            <span className="absolute -top-3 text-[9px] font-mono font-bold text-red-400">ZABUZA</span>
          </div>
        </div>
      </div>

      {/* Default Overlay Hint: "KETUK = SERANG • BULAN = KONTROL" */}
      {!isManualMode && !koState && (
        <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center pointer-events-none">
          <div className="px-4 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-zinc-300 animate-pulse tracking-wide flex items-center gap-2">
            <span>KETUK = SERANG</span>
            <span className="text-red-400">•</span>
            <span className="text-red-400">BULAN = KONTROL</span>
          </div>
        </div>
      )}

      {/* Manual Control Mode UI Overlay */}
      {isManualMode && !koState && (
        <div className="absolute inset-0 z-30 pointer-events-auto flex flex-col justify-between p-3 sm:p-4 bg-black/35 backdrop-blur-[2px]">
          {/* Top Bar with Mode Title & Exit Button */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 shadow-sm">
              <Sword className="w-3.5 h-3.5" />
              MODE KONTROL: KEPONG
            </span>

            <button
              onClick={() => setIsManualMode(false)}
              className="px-3 py-1 rounded-full bg-red-500/30 hover:bg-red-500/50 border border-red-400/40 text-red-200 text-xs font-black flex items-center gap-1 spring-press"
            >
              <X className="w-3.5 h-3.5" />
              <span>KELUAR</span>
            </button>
          </div>

          {/* Bottom Controls: Virtual Joystick & Action Buttons */}
          <div className="flex items-end justify-between gap-4 pt-12">
            {/* Virtual Joystick (Left & Right Buttons) */}
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/15 shadow-xl">
              <button
                onClick={handleMoveLeft}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 active:bg-cyan-500/40 border border-white/20 text-white font-black text-sm flex items-center justify-center spring-press"
              >
                ◀
              </button>
              <button
                onClick={handleMoveRight}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 active:bg-cyan-500/40 border border-white/20 text-white font-black text-sm flex items-center justify-center spring-press"
              >
                ▶
              </button>
            </div>

            {/* Action Buttons: "LOMPAT" & "SERANG" */}
            <div className="flex items-center gap-3">
              {/* Tombol LOMPAT */}
              <button
                onClick={handleJump}
                disabled={isJumping}
                className="w-14 h-14 rounded-full bg-blue-600/80 hover:bg-blue-500 active:bg-blue-400 border-2 border-blue-300/60 shadow-[0_0_15px_rgba(59,130,246,0.6)] text-white font-black text-xs flex items-center justify-center spring-press disabled:opacity-50"
              >
                LOMPAT
              </button>

              {/* Tombol SERANG */}
              <button
                onClick={handleManualAttack}
                disabled={isAttacking}
                className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-500 active:bg-red-400 border-2 border-red-300/70 shadow-[0_0_20px_rgba(239,68,68,0.8)] text-white font-black text-xs flex items-center justify-center spring-press"
              >
                SERANG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* K.O. Victory/Defeat Banner with Countdown */}
      {koState && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.8)]">
            <Award className="w-8 h-8 text-black" />
          </div>

          <h2 className="font-cinematic font-black text-3xl sm:text-4xl text-white tracking-wider drop-shadow-[0_4px_16px_rgba(239,68,68,0.9)]">
            K.O.!
          </h2>

          <p className="text-xs sm:text-sm font-bold text-amber-300">
            {koState.winner === 'KEPONG' ? '👑 KEPONG MENANG TELAK!' : '💀 ZABUZA MEMENANGKAN RONDE!'}
          </p>

          {/* Countdown: "HIDUP LAGI DALAM 3..2..1" */}
          <div className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-extrabold text-white">
            HIDUP LAGI DALAM {koState.countdown}...
          </div>
        </div>
      )}
    </div>
  );
}
