'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Calendar,
  Layers,
} from 'lucide-react';

export const GENRE_OPTIONS = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Isekai',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Seinen',
  'Shoujo',
  'Shounen',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

export const STATUS_OPTIONS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'ongoing', label: 'Sedang Tayang (Ongoing)' },
  { id: 'completed', label: 'Tamat (Completed)' },
];

export const YEAR_OPTIONS = [
  'Semua',
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  'Klasik (Pre-2020)',
];

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Paling Relevan' },
  { id: 'score_desc', label: 'Skor Tertinggi' },
  { id: 'latest', label: 'Rilis Terbaru' },
  { id: 'title_asc', label: 'Abjad (A - Z)' },
];

export interface AdvancedFilterState {
  genres: string[];
  status: string;
  year: string;
  sortBy: string;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilterState;
  onApply: (filters: AdvancedFilterState) => void;
  onReset: () => void;
}

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}: AdvancedFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilterState>(filters);

  if (!isOpen) return null;

  const toggleGenre = (genre: string) => {
    setLocalFilters((prev) => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
      };
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleResetLocal = () => {
    const empty: AdvancedFilterState = {
      genres: [],
      status: 'all',
      year: 'Semua',
      sortBy: 'relevance',
    };
    setLocalFilters(empty);
    onReset();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#09090f] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.98)] p-5 sm:p-6 space-y-5 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinematic font-black text-base text-white tracking-wide">
                FILTER TINGKAT LANJUT
              </h3>
              <p className="text-[11px] text-zinc-400">
                Saring anime berdasarkan genre, status tayang, dan tahun rilis
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

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 min-h-[250px] no-scrollbar">
          {/* 1. Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Status Penayangan</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = localFilters.status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLocalFilters({ ...localFilters, status: opt.id })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center spring-press ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {opt.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tahun Rilis */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Tahun Rilis</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {YEAR_OPTIONS.map((year) => {
                const isSelected = localFilters.year === year;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setLocalFilters({ ...localFilters, year })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all spring-press ${
                      isSelected
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Urutkan Berdasarkan */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Urutan Tampilan</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((sort) => {
                const isSelected = localFilters.sortBy === sort.id;
                return (
                  <button
                    key={sort.id}
                    type="button"
                    onClick={() => setLocalFilters({ ...localFilters, sortBy: sort.id })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left spring-press ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {sort.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Genre Multi-Select Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Pilih Genre ({localFilters.genres.length} Dipilih)</span>
              </label>
              {localFilters.genres.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, genres: [] })}
                  className="text-[10px] text-zinc-500 hover:text-red-400"
                >
                  Reset Genre
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 max-h-44 overflow-y-auto pr-1">
              {GENRE_OPTIONS.map((genre) => {
                const isSelected = localFilters.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all spring-press flex items-center gap-1 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetLocal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 px-6 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] spring-press text-center"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}
