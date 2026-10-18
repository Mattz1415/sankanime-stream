'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, X, Play, Sparkles, CheckCircle2 } from 'lucide-react';

interface CodingOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CodeLine {
  text: string;
  targetNav?: 'jelajah' | 'list' | 'riwayat' | 'chat' | 'profil';
  laserColor?: string;
  knightDialog: string;
  isCutscene?: boolean;
}

const CODE_STEPS: CodeLine[] = [
  {
    text: 'import kaijinbo',
    knightDialog: '⚔️ Memanggil modul Kaijinbo Engine!',
  },
  {
    text: 'app = KPanime(user="Kepiskepsi")',
    knightDialog: '👑 Halo Kepiskepsi! Selamat datang di KPanime.',
  },
  {
    text: 'app.nav.tambah("jelajah")',
    targetNav: 'jelajah',
    laserColor: '#00f0ff',
    knightDialog: '⚡ Slash! Mengaktifkan portal Jelajah Anime!',
  },
  {
    text: 'app.nav.tambah("list")',
    targetNav: 'list',
    laserColor: '#a855f7',
    knightDialog: '✨ Tebasan kedua! Katalog List Anime terbuka!',
    isCutscene: true,
  },
  {
    text: 'app.nav.tambah("riwayat")',
    targetNav: 'riwayat',
    laserColor: '#f59e0b',
    knightDialog: '⏳ Simpan memori! Tab Riwayat & Bookmark aktif!',
  },
  {
    text: 'app.nav.tambah("chat")',
    targetNav: 'chat',
    laserColor: '#10b981',
    knightDialog: '💬 Menghubungkan frekuensi Chat Global!',
  },
  {
    text: 'app.nav.tambah("profil")',
    targetNav: 'profil',
    laserColor: '#f43f5e',
    knightDialog: '🛡️ Memuat data profil petualang Kepiskepsi!',
  },
  {
    text: 'app.jalankan()',
    knightDialog: '🚀 Sistem KPanime Selesai Dikompilasi! BERSENANG-SENANGLAH!',
  },
];

export default function CodingOnboardingModal({ isOpen, onClose }: CodingOnboardingModalProps) {
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [activeLaser, setActiveLaser] = useState<{ color: string; label: string } | null>(null);
  const [knightPose, setKnightPose] = useState<'idle' | 'slash' | 'cheer'>('idle');
  const [showPortalPink, setShowPortalPink] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Reset or initialize when opened
  useEffect(() => {
    if (!isOpen) return;
    setCurrentLineIdx(0);
    setTypedLines([]);
    setCurrentCharIdx(0);
    setActiveLaser(null);
    setKnightPose('idle');
    setShowPortalPink(false);
    setIsDone(false);
  }, [isOpen]);

  // Typing effect engine
  useEffect(() => {
    if (!isOpen || isDone) return;

    if (currentLineIdx >= CODE_STEPS.length) {
      setIsDone(true);
      setKnightPose('cheer');
      const timer = setTimeout(() => {
        handleSkip();
      }, 2500);
      return () => clearTimeout(timer);
    }

    const currentLine = CODE_STEPS[currentLineIdx];
    const fullText = currentLine.text;

    if (currentCharIdx < fullText.length) {
      const typeSpeed = 25;
      const timeout = setTimeout(() => {
        setCurrentCharIdx((prev) => prev + 1);
      }, typeSpeed);
      return () => clearTimeout(timeout);
    } else {
      // Current line completed
      setTypedLines((prev) => [...prev, fullText]);
      setCurrentCharIdx(0);

      // Trigger Knight slash & laser
      if (currentLine.targetNav && currentLine.laserColor) {
        setKnightPose('slash');
        setActiveLaser({ color: currentLine.laserColor, label: currentLine.targetNav });
      }

      // Check for pink cutscene on "list" step
      if (currentLine.isCutscene) {
        setShowPortalPink(true);
      }

      const pauseDuration = currentLine.isCutscene ? 2200 : 900;
      const nextLineTimer = setTimeout(() => {
        setShowPortalPink(false);
        setKnightPose('idle');
        setActiveLaser(null);
        setCurrentLineIdx((prev) => prev + 1);
      }, pauseDuration);

      return () => clearTimeout(nextLineTimer);
    }
  }, [isOpen, currentLineIdx, currentCharIdx, isDone]);

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kpanime_onboarding_done', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentStep = CODE_STEPS[Math.min(currentLineIdx, CODE_STEPS.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in-up">
      {/* Dynamic Laser Beam to Bottom Dock */}
      {activeLaser && (
        <div
          className="fixed inset-x-0 bottom-0 top-1/2 pointer-events-none z-30 transition-all duration-500 animate-pulse"
          style={{
            background: `radial-gradient(circle at 50% 100%, ${activeLaser.color}55 0%, transparent 70%)`,
          }}
        >
          {/* Focused Laser Streak */}
          <div
            className="w-1.5 h-full mx-auto animate-bounce opacity-90 shadow-[0_0_25px_currentColor]"
            style={{ backgroundColor: activeLaser.color, color: activeLaser.color }}
          />
        </div>
      )}

      {/* Main Container */}
      <div className="relative w-full max-w-2xl rounded-3xl glass-obsidian border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.98)] overflow-hidden flex flex-col">
        {/* macOS Style Window Title Bar */}
        <div className="px-5 py-3.5 bg-[#07090e] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="ml-3 text-xs font-mono text-zinc-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              kpanime.py — Kaijinbo Kernel v2.0
            </span>
          </div>

          {/* Tombol LEWATI (Skip) Selalu Ada */}
          <button
            onClick={handleSkip}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 spring-press shadow-md"
            title="Lewati Onboarding"
          >
            <span>LEWATI</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Code Editor Body */}
        <div className="p-5 sm:p-6 bg-[#030407] font-mono text-xs sm:text-sm min-h-[260px] sm:min-h-[290px] overflow-hidden flex flex-col justify-between">
          <div className="space-y-1.5">
            {typedLines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-zinc-600 w-5 text-right select-none text-[11px] font-semibold">{idx + 1}</span>
                <span className="text-cyan-300 font-medium">
                  {line.startsWith('import') ? (
                    <>
                      <span className="text-purple-400 font-bold">import</span>{' '}
                      <span className="text-emerald-400">{line.replace('import ', '')}</span>
                    </>
                  ) : line.includes('=') ? (
                    <>
                      <span className="text-amber-400">{line.split('=')[0]}</span>=
                      <span className="text-cyan-400">{line.split('=')[1]}</span>
                    </>
                  ) : line.includes('tambah') ? (
                    <>
                      <span className="text-zinc-300">app.nav.</span>
                      <span className="text-blue-400 font-semibold">tambah</span>
                      <span className="text-emerald-300">{line.match(/\(.*\)/)?.[0]}</span>
                    </>
                  ) : (
                    <span className="text-emerald-400 font-bold">{line}</span>
                  )}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto opacity-75" />
              </div>
            ))}

            {/* Currently typing line */}
            {!isDone && currentLineIdx < CODE_STEPS.length && (
              <div className="flex items-center gap-3 animate-fade-in-up">
                <span className="text-zinc-600 w-5 text-right select-none text-[11px] font-semibold">
                  {typedLines.length + 1}
                </span>
                <span className="text-white font-semibold">
                  {currentStep.text.substring(0, currentCharIdx)}
                  <span className="inline-block w-2 h-4 ml-0.5 bg-cyan-400 animate-pulse align-middle" />
                </span>
              </div>
            )}
          </div>

          {/* Laser Target Badge */}
          {activeLaser && (
            <div className="mt-4 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between animate-fade-in-up">
              <span className="text-[11px] text-zinc-400">Target Navigasi Aktif:</span>
              <span
                className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: activeLaser.color, color: '#000' }}
              >
                {activeLaser.label}
              </span>
            </div>
          )}
        </div>

        {/* Pixel-Art Knight & Cutscene Stage */}
        <div className="p-4 sm:p-5 bg-[#06080d] border-t border-white/10 flex items-center justify-between gap-4">
          {/* Knight Sprite & Speech Bubble */}
          <div className="flex items-center gap-3 flex-1">
            {/* Pixel Knight Sprite (Canvas/SVG Retro) */}
            <div
              className={`relative w-12 h-12 rounded-2xl bg-black border border-cyan-400/30 flex items-center justify-center shadow-lg transition-transform duration-200 ${
                knightPose === 'slash' ? 'scale-110 -rotate-12 bg-cyan-950/40 border-cyan-400' : 'scale-100'
              }`}
            >
              {/* Retro Pixel Knight SVG */}
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">
                {/* Helmet & Plume */}
                <rect x="9" y="3" width="6" height="3" fill="#00f0ff" />
                <rect x="8" y="6" width="8" height="6" fill="#7dd3fc" />
                <rect x="9" y="8" width="6" height="2" fill="#020617" />
                <rect x="10" y="8" width="2" height="2" fill="#38bdf8" />
                {/* Armor Body */}
                <rect x="7" y="12" width="10" height="7" fill="#38bdf8" />
                <rect x="11" y="12" width="2" height="7" fill="#00f0ff" />
                {/* Katana Blade */}
                <rect
                  x={knightPose === 'slash' ? '18' : '17'}
                  y={knightPose === 'slash' ? '8' : '10'}
                  width="2"
                  height="10"
                  fill="#f8fafc"
                  transform={knightPose === 'slash' ? 'rotate(45 18 8)' : ''}
                />
                <rect x="16" y="13" width="4" height="2" fill="#f59e0b" />
              </svg>

              {/* Slash Aura Effect */}
              {knightPose === 'slash' && (
                <span className="absolute -inset-1 rounded-2xl border-2 border-cyan-400 animate-ping pointer-events-none" />
              )}
            </div>

            {/* Speech Bubble */}
            <div className="flex-1 bg-white/[0.08] border border-white/15 rounded-2xl p-3 text-xs text-zinc-100 shadow-md">
              <span className="text-[10px] text-cyan-400 font-bold block mb-0.5">Pixel Knight • Kaijinbo</span>
              <p className="font-medium text-xs leading-snug">{currentStep.knightDialog}</p>
            </div>
          </div>

          {/* Pink Character Blue Portal Cutscene */}
          {showPortalPink && (
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-blue-950/60 border border-blue-400/40 animate-fade-in-up">
              {/* Swirling Blue Portal */}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-600 animate-spin p-1 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
                </div>
              </div>

              {/* Pink Character Sprite & Speech */}
              <div className="max-w-[170px] bg-pink-500/20 border border-pink-400/30 rounded-xl p-2 text-[11px] text-pink-200">
                <span className="font-bold text-pink-300 block text-[10px]">🌸 Pinky Chibi:</span>
                "Ehh Kepiskepsi! Mau maraton apa nih? Dah ah lanjut dlu!"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
