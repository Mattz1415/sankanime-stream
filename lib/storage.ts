import { BookmarkItem, WatchHistoryItem } from './types';

const HISTORY_KEY = 'nexus_anime_history_v1';
const BOOKMARK_KEY = 'nexus_anime_bookmarks_v1';

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchHistory(item: Omit<WatchHistoryItem, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  try {
    const current = getWatchHistory();
    // Remove if exists
    const filtered = current.filter((h) => h.episodeId !== item.episodeId);
    const updated: WatchHistoryItem[] = [
      { ...item, timestamp: Date.now() },
      ...filtered,
    ].slice(0, 30); // keep last 30
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save watch history:', err);
  }
}

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

export function toggleBookmark(item: Omit<BookmarkItem, 'addedAt'>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const bookmarks = getBookmarks();
    const exists = bookmarks.some((b) => b.animeId === item.animeId);
    let updated: BookmarkItem[];
    if (exists) {
      updated = bookmarks.filter((b) => b.animeId !== item.animeId);
    } else {
      updated = [{ ...item, addedAt: Date.now() }, ...bookmarks];
    }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}
