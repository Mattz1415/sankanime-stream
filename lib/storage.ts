import {
  BookmarkItem,
  WatchHistoryItem,
  WatchlistCategory,
  WatchLaterItem,
  DownloadEpisodeItem,
  CommunityComment,
  PlayerSettings,
} from './types';

const HISTORY_KEY = 'nexus_anime_history_v1';
const BOOKMARK_KEY = 'nexus_anime_bookmarks_v1';
const WATCH_LATER_KEY = 'nexus_watch_later_v1';
const DOWNLOADS_KEY = 'nexus_downloads_v1';
const COMMENTS_KEY = 'nexus_community_comments_v1';
const PLAYER_SETTINGS_KEY = 'nexus_player_settings_v1';

/* =========================================================================
   1. WATCH HISTORY (Menyimpan riwayat dan detik terakhir tontonan)
   ========================================================================= */

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getEpisodeResumeTime(episodeId: string): number {
  const history = getWatchHistory();
  const match = history.find((h) => h.episodeId === episodeId);
  return match?.lastSeconds || 0;
}

export function saveWatchHistory(item: Omit<WatchHistoryItem, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getWatchHistory();
    const existing = current.find((h) => h.episodeId === item.episodeId);

    // Calculate progress percent if seconds and duration provided
    let progressPercent = item.progressPercent;
    if (item.lastSeconds && item.durationSeconds && item.durationSeconds > 0) {
      progressPercent = Math.min(100, Math.round((item.lastSeconds / item.durationSeconds) * 100));
    } else if (existing?.progressPercent && !progressPercent) {
      progressPercent = existing.progressPercent;
    }

    const filtered = current.filter((h) => h.episodeId !== item.episodeId);
    const updated: WatchHistoryItem[] = [
      {
        ...item,
        lastSeconds: item.lastSeconds !== undefined ? item.lastSeconds : existing?.lastSeconds || 0,
        durationSeconds: item.durationSeconds !== undefined ? item.durationSeconds : existing?.durationSeconds || 0,
        progressPercent: progressPercent !== undefined ? progressPercent : 0,
        timestamp: Date.now(),
      },
      ...filtered,
    ].slice(0, 100); // keep last 100 episodes

    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save watch history:', err);
  }
}

export function deleteWatchHistoryItem(episodeId: string): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getWatchHistory();
    const updated = current.filter((h) => h.episodeId !== episodeId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearWatchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

/* =========================================================================
   3. WATCH LATER (Playlist daftar tontonan personal)
   ========================================================================= */

export function getWatchLater(): WatchLaterItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WATCH_LATER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isAnimeWatchLater(animeId: string): boolean {
  const list = getWatchLater();
  return list.some((item) => item.animeId === animeId);
}

export function saveWatchLater(item: Omit<WatchLaterItem, 'addedAt'>): WatchLaterItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getWatchLater();
    const filtered = list.filter((i) => i.animeId !== item.animeId);
    const updated: WatchLaterItem[] = [{ ...item, addedAt: Date.now() }, ...filtered];
    localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeWatchLater(animeId: string): WatchLaterItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getWatchLater();
    const updated = list.filter((i) => i.animeId !== animeId);
    localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function toggleWatchLater(item: Omit<WatchLaterItem, 'addedAt'>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getWatchLater();
    const exists = list.some((i) => i.animeId === item.animeId);
    if (exists) {
      removeWatchLater(item.animeId);
      return false;
    } else {
      saveWatchLater(item);
      return true;
    }
  } catch {
    return false;
  }
}

/* =========================================================================
   4. DOWNLOAD MANAGER (Unduh episode untuk tontonan offline)
   ========================================================================= */

export function getDownloads(): DownloadEpisodeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDownload(item: DownloadEpisodeItem): DownloadEpisodeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getDownloads();
    const filtered = list.filter((d) => d.id !== item.id);
    const updated = [item, ...filtered];
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function updateDownloadProgress(
  id: string,
  progress: number,
  status: DownloadEpisodeItem['status'] = 'downloading'
): DownloadEpisodeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getDownloads();
    const updated = list.map((d) => (d.id === id ? { ...d, progress, status } : d));
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function removeDownload(id: string): DownloadEpisodeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getDownloads();
    const updated = list.filter((d) => d.id !== id);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearDownloads(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DOWNLOADS_KEY);
  } catch {}
}

/* =========================================================================
   7. SUBTITLE & PLAYER SETTINGS (Pengaturan Teks & Player)
   ========================================================================= */

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  subtitleSize: 'medium',
  subtitleColor: 'white',
  subtitleBackground: 'shadow',
  autoSkipIntro: true,
  autoSkipOutro: true,
  defaultQuality: '720p',
  preferredServer: 'ondesuhd',
};

export function getPlayerSettings(): PlayerSettings {
  if (typeof window === 'undefined') return DEFAULT_PLAYER_SETTINGS;
  try {
    const raw = localStorage.getItem(PLAYER_SETTINGS_KEY);
    if (!raw) return DEFAULT_PLAYER_SETTINGS;
    return { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLAYER_SETTINGS;
  }
}

export function savePlayerSettings(partial: Partial<PlayerSettings>): PlayerSettings {
  if (typeof window === 'undefined') return DEFAULT_PLAYER_SETTINGS;
  try {
    const current = getPlayerSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_PLAYER_SETTINGS;
  }
}

/* =========================================================================
   10. COMMUNITY COMMENTS & SPOILER SENSOR
   ========================================================================= */

const DEFAULT_COMMENTS: CommunityComment[] = [
  {
    id: 'comm-1',
    targetId: 'global',
    targetTitle: 'Nexus Anime Community',
    user: {
      name: 'SenpaiOtaku',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      badge: 'VIP',
    },
    content: 'Musim ini animasinya gila-gilaan parah! Jangan lupa tonton Chainsaw Man Movie dan Frieren! ||Plot twist di ending beneran bikin nangis kejer||',
    hasSpoiler: true,
    createdAt: Date.now() - 3600000 * 2,
    likes: 24,
    userLiked: false,
  },
  {
    id: 'comm-2',
    targetId: 'global',
    targetTitle: 'Nexus Anime Community',
    user: {
      name: 'RikuNight',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
      badge: 'TOP_CONTRIBUTOR',
    },
    content: 'Fitur skip intro 85 detik ngebantu banget maraton 24 episode tanpa ribet! Server OnDesuHD juga lancar 1080p!',
    hasSpoiler: false,
    createdAt: Date.now() - 3600000 * 5,
    likes: 18,
    userLiked: true,
  },
  {
    id: 'comm-3',
    targetId: 'global',
    targetTitle: 'Nexus Anime Community',
    user: {
      name: 'AoiKaze',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
      badge: 'MEMBER',
    },
    content: 'Buat yang baru nonton episode 12: ||Karakter antagonisnya ternyata saudara kandung si MC sendiri!|| Sensor spoiler ini aman banget gak bakal kena spoiler sembarangan.',
    hasSpoiler: true,
    createdAt: Date.now() - 3600000 * 12,
    likes: 31,
    userLiked: false,
  },
];

export function getCommunityComments(targetId?: string): CommunityComment[] {
  if (typeof window === 'undefined') return DEFAULT_COMMENTS;
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    const list: CommunityComment[] = raw ? JSON.parse(raw) : DEFAULT_COMMENTS;
    if (!targetId || targetId === 'all') return list;
    return list.filter((c) => c.targetId === targetId || c.targetId === 'global');
  } catch {
    return DEFAULT_COMMENTS;
  }
}

export function saveCommunityComment(comment: CommunityComment): CommunityComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getCommunityComments('all');
    const updated = [comment, ...list];
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function likeCommunityComment(commentId: string): CommunityComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = getCommunityComments('all');
    const updated = list.map((c) => {
      if (c.id === commentId) {
        const nextLiked = !c.userLiked;
        return {
          ...c,
          userLiked: nextLiked,
          likes: nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
        };
      }
      return c;
    });
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/* =========================================================================
   STANDARD BOOKMARKS & FAVORITES
   ========================================================================= */

export function getBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isAnimeBookmarked(animeId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.animeId === animeId);
}

export function getAnimeBookmark(animeId: string): BookmarkItem | undefined {
  const bookmarks = getBookmarks();
  return bookmarks.find((b) => b.animeId === animeId);
}

export function saveBookmarkWithCategory(
  item: Omit<BookmarkItem, 'addedAt'>,
  category: WatchlistCategory = 'Ingin Ditonton'
): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter((b) => b.animeId !== item.animeId);
    const updated: BookmarkItem[] = [
      { ...item, category, addedAt: Date.now() },
      ...filtered,
    ];
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function updateBookmarkCategory(animeId: string, category: WatchlistCategory): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const bookmarks = getBookmarks();
    const updated = bookmarks.map((b) =>
      b.animeId === animeId ? { ...b, category } : b
    );
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteBookmark(animeId: string): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const bookmarks = getBookmarks();
    const updated = bookmarks.filter((b) => b.animeId !== animeId);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function toggleBookmark(
  item: Omit<BookmarkItem, 'addedAt'>,
  defaultCategory: WatchlistCategory = 'Favorit'
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const bookmarks = getBookmarks();
    const exists = bookmarks.some((b) => b.animeId === item.animeId);
    let updated: BookmarkItem[];
    if (exists) {
      updated = bookmarks.filter((b) => b.animeId !== item.animeId);
    } else {
      updated = [{ ...item, category: defaultCategory, addedAt: Date.now() }, ...bookmarks];
    }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}
