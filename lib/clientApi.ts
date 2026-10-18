import { HomeData, AnimeListItem, AnimeDetail, EpisodeDetail, ScheduleDay } from './types';

export async function getHomeData(): Promise<HomeData> {
  const res = await fetch('/api/home');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load home data');
  return json.data;
}

export async function getOngoingAnime(page: number = 1): Promise<{ animeList: AnimeListItem[] }> {
  const res = await fetch(`/api/ongoing?page=${page}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load ongoing anime');
  return json.data;
}

export async function getCompleteAnime(page: number = 1): Promise<{ animeList: AnimeListItem[] }> {
  const res = await fetch(`/api/complete?page=${page}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load completed anime');
  return json.data;
}

export async function getSchedule(): Promise<ScheduleDay[]> {
  const res = await fetch('/api/schedule');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load schedule');
  return json.data;
}

export async function getAnimeDetail(animeId: string): Promise<AnimeDetail> {
  const res = await fetch(`/api/anime/${animeId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load anime detail');
  return json.data;
}

export async function getEpisodeDetail(episodeId: string): Promise<EpisodeDetail> {
  const res = await fetch(`/api/episode/${episodeId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load episode stream');
  return json.data;
}

export async function getServerStreamUrl(serverId: string): Promise<string> {
  const res = await fetch(`/api/server/${serverId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to switch server');
  return json.data.url;
}

export async function searchAnime(query: string): Promise<AnimeListItem[]> {
  if (!query.trim()) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to search anime');
  return json.data.animeList || [];
}
