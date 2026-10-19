'use client';

import React from 'react';
import {
  Palette,
  X,
  Check,
  Moon,
  Sun,
  Sparkles,
  Zap,
  Battery,
} from 'lucide-react';
import { useTheme, THEME_LIST, ThemePalette } from '@/lib/themeContext';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeCustomizerModal({
  isOpen,
  onClose,
}: ThemeCustomizerModalProps) {
  const {
    palette,
    setPalette,
    accentColor,
    isOledBlack,
    toggleOledBlack,
    glowIntensity,
    setGlowIntensity,
  } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09090f] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.98)] p-5 sm:p-6 space-y-5 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-black font-bold shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <Palette className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-cinematic font-black text-base text-white tracking-wide">
                KUSTOMISASI TEMA OLED
              </h3>
              <p className="text-[11px] text-zinc-400">
                Pilih palet warna aksen neon dan aktifkan mode gelap pekat hemat baterai
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 min-h-[250px] no-scrollbar">
          {/* 1. True OLED Black Toggle */}
          <div className="p-4 rounded-2xl bg-black/70 border border-white/[0.08] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">
                  Ultra-Dark True OLED (100% Pitch Black)
                </h4>
              </div>
              <p className="text-[11px] text-zinc-400 max-w-xs">
                Mematikan piksel layar AMOLED/OLED pada #000000 murni untuk efisiensi baterai maksimal dan kontras sinematik tanpa batas.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleOledBlack}
              className={`w-14 h-8 rounded-full transition-colors p-1 flex items-center spring-press ${
                isOledBlack ? 'bg-cyan-500 justify-end' : 'bg-zinc-800 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-black shadow-md flex items-center justify-center text-[10px] text-white">
                {isOledBlack ? 'ON' : 'OFF'}
              </div>
            </button>
          </div>

          {/* 2. Neon Color Palettes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilihan Palet Warna Aksen</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEME_LIST.map((thm) => {
                const isSelected = palette === thm.id;
                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => setPalette(thm.id as ThemePalette)}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3 spring-press ${
                      isSelected
                        ? 'bg-white/10 border-white text-white shadow-lg'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-md flex items-center justify-center"
                      style={{ backgroundColor: thm.accent }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </span>
                    <span className="text-xs font-bold truncate">{thm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Glow Intensity */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Intensitas Kilau Cahaya (Glow Aura)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'subtle', label: 'Lembut' },
                { id: 'vivid', label: 'Vivid' },
                { id: 'neon', label: 'Neon Maksimal' },
              ].map((g) => {
                const isSelected = glowIntensity === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGlowIntensity(g.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center spring-press ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Live Card Preview */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.08] space-y-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Pratinjau Antarmuka Pengguna
            </span>
            <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-xs font-bold text-white">Nexus Luxury Ultra-Dark</span>
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded-full text-[11px] font-extrabold text-black shadow-md spring-press"
                style={{ backgroundColor: accentColor }}
              >
                Tombol Contoh
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] spring-press"
          >
            Terapkan & Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
