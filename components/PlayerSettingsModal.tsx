'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Type,
  Server,
  FastForward,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  Tv,
} from 'lucide-react';
import { PlayerSettings } from '@/lib/types';
import { getPlayerSettings, savePlayerSettings, DEFAULT_PLAYER_SETTINGS } from '@/lib/storage';

interface PlayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServer?: string;
  onServerChange?: (server: string) => void;
  availableServers?: { title: string; serverId: string }[];
  currentQuality?: string;
  onQualityChange?: (quality: string) => void;
}

export default function PlayerSettingsModal({
  isOpen,
  onClose,
  currentServer = 'ondesuhd',
  onServerChange,
  availableServers = [
    { title: 'OnDesuHD (Multi-Bypass)', serverId: 'ondesuhd' },
    { title: 'DesuStream (Super Cepat)', serverId: 'desustream' },
    { title: 'Odstream (Direct)', serverId: 'odstream' },
    { title: 'Google Drive HD', serverId: 'gdrive' },
    { title: 'Archive Org', serverId: 'archive' },
  ],
  currentQuality = '720p',
  onQualityChange,
}: PlayerSettingsModalProps) {
  const [settings, setSettings] = useState<PlayerSettings>(DEFAULT_PLAYER_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      setSettings(getPlayerSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<PlayerSettings>) => {
    const updated = savePlayerSettings(partial);
    setSettings(updated);
  };

  const handleReset = () => {
    const reset = savePlayerSettings(DEFAULT_PLAYER_SETTINGS);
    setSettings(reset);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09090f] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.98)] p-5 sm:p-6 space-y-5 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinematic font-black text-base text-white tracking-wide">
                PENGATURAN SUBTITLE & SERVER
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sesuaikan tampilan teks takarir subtitle dan ganti sumber server video
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
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 min-h-[260px] no-scrollbar">
          {/* 1. Live Subtitle Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pratinjau Tampilan Subtitle</span>
            </label>
            <div className="relative w-full h-24 rounded-2xl bg-black border border-white/10 flex items-end justify-center p-3 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              <p
                style={{
                  fontSize:
                    settings.subtitleSize === 'small'
                      ? '13px'
                      : settings.subtitleSize === 'large'
                      ? '19px'
                      : settings.subtitleSize === 'xlarge'
                      ? '23px'
                      : '16px',
                  color:
                    settings.subtitleColor === 'yellow'
                      ? '#fde047'
                      : settings.subtitleColor === 'cyan'
                      ? '#67e8f9'
                      : '#ffffff',
                  textShadow:
                    settings.subtitleBackground === 'shadow'
                      ? '0 2px 4px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)'
                      : 'none',
                  backgroundColor:
                    settings.subtitleBackground === 'semi-black'
                      ? 'rgba(0,0,0,0.75)'
                      : 'transparent',
                }}
                className="relative z-10 font-bold px-2 py-0.5 rounded-md transition-all text-center max-w-sm"
              >
                &quot;Watashi wa... kirei na sekai wo mitai!&quot;
              </p>
            </div>
          </div>

          {/* 2. Subtitle Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>Ukuran Teks Subtitle</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'small', label: 'Kecil' },
                { id: 'medium', label: 'Standar' },
                { id: 'large', label: 'Besar' },
                { id: 'xlarge', label: 'Ekstra' },
              ].map((s) => {
                const isSelected = settings.subtitleSize === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleUpdate({ subtitleSize: s.id as any })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center spring-press ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Subtitle Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">Warna Teks Subtitle</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'white', label: 'Putih Bersih', color: '#ffffff' },
                { id: 'yellow', label: 'Kuning Bioskop', color: '#fde047' },
                { id: 'cyan', label: 'Neon Cyan', color: '#00f0ff' },
              ].map((c) => {
                const isSelected = settings.subtitleColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleUpdate({ subtitleColor: c.id as any })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 spring-press ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/30"
                      style={{ backgroundColor: c.color }}
                    />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Subtitle Background Outline */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300">Latar Belakang / Bayangan Teks</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'shadow', label: 'Bayangan Gelap' },
                { id: 'semi-black', label: 'Kotak Transparan' },
                { id: 'none', label: 'Polos Tanpa Efek' },
              ].map((b) => {
                const isSelected = settings.subtitleBackground === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleUpdate({ subtitleBackground: b.id as any })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center spring-press ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Server Switcher */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ganti Sumber Server Video</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableServers.map((srv) => {
                const isSelected = currentServer.toLowerCase() === srv.serverId.toLowerCase();
                return (
                  <button
                    key={srv.serverId}
                    type="button"
                    onClick={() => {
                      onServerChange?.(srv.serverId);
                      handleUpdate({ preferredServer: srv.serverId });
                    }}
                    className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between spring-press ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{srv.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Skip Intro & Outro Automations */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5 text-emerald-400" />
              <span>Otomatisasi Lewati Intro & Outro</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Tombol Lewati Opening (+85s)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Tampilkan tombol cepat lewati lagu pembuka opening anime
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSkipIntro}
                  onChange={(e) => handleUpdate({ autoSkipIntro: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-400 focus:ring-0 cursor-pointer accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Tombol Lewati Ending (+90s)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Tampilkan tombol cepat lewati lagu penutup ending dan lanjut ke episode berikutnya
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSkipOutro}
                  onChange={(e) => handleUpdate({ autoSkipOutro: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-400 focus:ring-0 cursor-pointer accent-cyan-400"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] spring-press"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
