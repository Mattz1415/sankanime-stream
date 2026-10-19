'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  X,
  Play,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Pause,
  ArrowDownToLine,
  RefreshCw,
  Film,
} from 'lucide-react';
import { DownloadEpisodeItem } from '@/lib/types';
import {
  getDownloads,
  saveDownload,
  removeDownload,
  updateDownloadProgress,
  clearDownloads,
} from '@/lib/storage';

interface DownloadManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDownload?: Omit<DownloadEpisodeItem, 'id' | 'status' | 'progress' | 'downloadedAt'>;
}

export default function DownloadManagerModal({
  isOpen,
  onClose,
  initialDownload,
}: DownloadManagerModalProps) {
  const [downloads, setDownloads] = useState<DownloadEpisodeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'active'>('all');

  // Load downloads from storage
  useEffect(() => {
    if (isOpen) {
      setDownloads(getDownloads());
    }
  }, [isOpen]);

  // If initialDownload passed, trigger download immediately
  useEffect(() => {
    if (isOpen && initialDownload) {
      startNewDownload(initialDownload);
    }
  }, [isOpen, initialDownload]);

  const startNewDownload = (data: Omit<DownloadEpisodeItem, 'id' | 'status' | 'progress' | 'downloadedAt'>) => {
    const newId = `dl-${Date.now()}`;
    const newItem: DownloadEpisodeItem = {
      ...data,
      id: newId,
      status: 'downloading',
      progress: 5,
      downloadedAt: Date.now(),
      fileSize: data.quality === '1080p' ? '280 MB' : data.quality === '720p' ? '160 MB' : '85 MB',
    };

    const updated = saveDownload(newItem);
    setDownloads(updated);

    // Trigger browser download via anchor tag if direct link
    if (data.downloadUrl && typeof window !== 'undefined') {
      try {
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = `${data.animeTitle} - ${data.episodeTitle}.mp4`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.warn('Direct download link trigger:', err);
      }
    }

    // Simulate progress animation for visual offline feedback
    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setDownloads(updateDownloadProgress(newId, 100, 'completed'));
      } else {
        setDownloads(updateDownloadProgress(newId, currentProgress, 'downloading'));
      }
    }, 600);
  };

  const handleDelete = (id: string) => {
    const updated = removeDownload(id);
    setDownloads(updated);
  };

  const handleClearAll = () => {
    if (confirm('Hapus semua daftar riwayat unduhan?')) {
      clearDownloads();
      setDownloads([]);
    }
  };

  if (!isOpen) return null;

  const completedCount = downloads.filter((d) => d.status === 'completed').length;
  const activeCount = downloads.filter((d) => d.status === 'downloading').length;

  const filtered = downloads.filter((d) => {
    if (activeTab === 'completed') return d.status === 'completed';
    if (activeTab === 'active') return d.status === 'downloading';
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#09090f] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.98)] p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinematic font-black text-base text-white tracking-wide">
                DOWNLOAD MANAGER
              </h3>
              <p className="text-[11px] text-zinc-400">
                Unduh episode untuk ditonton offline kapan saja tanpa kuota internet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Summary & Tab Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Tersimpan: <strong>{completedCount} Episode</strong> ({completedCount * 140} MB)</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'all' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({downloads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'active' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'completed' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Selesai ({completedCount})
            </button>
          </div>
        </div>

        {/* Download Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 text-zinc-500">
              <ArrowDownToLine className="w-10 h-10 opacity-40" />
              <p className="text-xs font-semibold">Belum ada episode dalam antrean unduhan.</p>
              <p className="text-[11px] text-zinc-600 max-w-xs">
                Buka halaman episode dan tekan tombol &quot;Unduh Episode&quot; untuk menyimpan video offline.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] hover:border-white/15 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.animeTitle}
                      className="w-12 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                      <Film className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 text-[9px] font-bold uppercase">
                        {item.quality || '720p'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md bg-white/[0.06] text-zinc-400 text-[9px] font-medium">
                        {item.serverName || 'DesuStream'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {item.fileSize || '140 MB'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-white truncate">
                      {item.animeTitle}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {item.episodeTitle}
                    </p>

                    {/* Progress Bar for Active Downloads */}
                    {item.status === 'downloading' ? (
                      <div className="space-y-1 pt-1">
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-cyan-300 font-bold">
                          Mengunduh... {item.progress}%
                        </span>
                      </div>
                    ) : item.status === 'completed' ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Siap Tonton Offline
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Tertunda
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'completed' && (
                    <Link
                      href={`/watch?id=${item.episodeId}`}
                      onClick={onClose}
                      className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 spring-press shadow-sm"
                      title="Putar Offline Sekarang"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                    title="Hapus Unduhan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {downloads.length > 0 && (
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-zinc-500 hover:text-red-400 transition-colors"
            >
              Hapus Semua Riwayat
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
