/**
 * Mapping and metadata for Miku Live2D Cubism expressions (.exp3.json)
 * Supports both Live2D expression files and lightweight 2D sprite fallback overlays.
 */

export type MikuExpressionKey =
  | 'Open Arms'
  | 'Fanged Smile'
  | 'Blush'
  | 'Hand on Chest Pose'
  | 'Overhead Staff Raise'
  | 'Hold Staff2'
  | 'Hold Staff (Both Hands)'
  | 'Gloom'
  | 'Crying'
  | 'Dead Eyes'
  | 'Tears'
  | 'Star'
  | 'Sweat Drop'
  | 'Yandere'
  | 'hammer'
  | 'baseball bat'
  | 'crowbar';

export interface MikuExpressionInfo {
  name: MikuExpressionKey;
  file: string;
  category: 'GREET' | 'SEARCH' | 'POINT' | 'ERROR' | 'PLAYFUL';
  label: string;
  badgeEmoji: string;
  bubbleTone: string;
  glowColor: string;
}

export const MIKU_EXPRESSIONS: Record<MikuExpressionKey, MikuExpressionInfo> = {
  'Open Arms': {
    name: 'Open Arms',
    file: 'Open Arms.exp3.json',
    category: 'GREET',
    label: 'Menyambut Hangat',
    badgeEmoji: '🤗',
    bubbleTone: 'border-cyan-400/40 shadow-cyan-500/20',
    glowColor: '#00f0ff',
  },
  'Fanged Smile': {
    name: 'Fanged Smile',
    file: 'Fanged Smile.exp3.json',
    category: 'GREET',
    label: 'Senyum Ceria',
    badgeEmoji: '😸',
    bubbleTone: 'border-emerald-400/40 shadow-emerald-500/20',
    glowColor: '#10b981',
  },
  'Blush': {
    name: 'Blush',
    file: 'Blush.exp3.json',
    category: 'GREET',
    label: 'Malu-Malu Manis',
    badgeEmoji: '😳',
    bubbleTone: 'border-pink-400/40 shadow-pink-500/20',
    glowColor: '#ec4899',
  },
  'Star': {
    name: 'Star',
    file: 'Star.exp3.json',
    category: 'GREET',
    label: 'Mata Berbinar',
    badgeEmoji: '✨',
    bubbleTone: 'border-amber-400/40 shadow-amber-500/20',
    glowColor: '#fbbf24',
  },
  'Hand on Chest Pose': {
    name: 'Hand on Chest Pose',
    file: 'Hand on Chest Pose.exp3.json',
    category: 'SEARCH',
    label: 'Sedang Berpikir / Mencari',
    badgeEmoji: '🤔',
    bubbleTone: 'border-blue-400/40 shadow-blue-500/20',
    glowColor: '#38bdf8',
  },
  'Sweat Drop': {
    name: 'Sweat Drop',
    file: 'Sweat Drop.exp3.json',
    category: 'SEARCH',
    label: 'Keringat Dingin',
    badgeEmoji: '💧',
    bubbleTone: 'border-sky-400/40 shadow-sky-500/20',
    glowColor: '#0ea5e9',
  },
  'Overhead Staff Raise': {
    name: 'Overhead Staff Raise',
    file: 'Overhead Staff Raise.exp3.json',
    category: 'POINT',
    label: 'Tongkat Mengangkat / Menunjuk Tinggi',
    badgeEmoji: '🪄',
    bubbleTone: 'border-cyan-400/50 shadow-cyan-500/30',
    glowColor: '#00f0ff',
  },
  'Hold Staff2': {
    name: 'Hold Staff2',
    file: 'Hold Staff2.exp3.json',
    category: 'POINT',
    label: 'Tongkat Menunjuk Elemen',
    badgeEmoji: '👉',
    bubbleTone: 'border-teal-400/50 shadow-teal-500/30',
    glowColor: '#14b8a6',
  },
  'Hold Staff (Both Hands)': {
    name: 'Hold Staff (Both Hands)',
    file: 'Hold Staff (Both Hands).exp3.json',
    category: 'POINT',
    label: 'Pegang Tongkat Dua Tangan',
    badgeEmoji: '✨',
    bubbleTone: 'border-indigo-400/40 shadow-indigo-500/20',
    glowColor: '#6366f1',
  },
  'Gloom': {
    name: 'Gloom',
    file: 'Gloom.exp3.json',
    category: 'ERROR',
    label: 'Murung / Sedih',
    badgeEmoji: '🌧️',
    bubbleTone: 'border-purple-400/40 shadow-purple-500/20',
    glowColor: '#a855f7',
  },
  'Crying': {
    name: 'Crying',
    file: 'Crying.exp3.json',
    category: 'ERROR',
    label: 'Menangis',
    badgeEmoji: '😭',
    bubbleTone: 'border-rose-400/40 shadow-rose-500/20',
    glowColor: '#f43f5e',
  },
  'Dead Eyes': {
    name: 'Dead Eyes',
    file: 'Dead Eyes.exp3.json',
    category: 'ERROR',
    label: 'Mata Kosong (Shock)',
    badgeEmoji: '💀',
    bubbleTone: 'border-red-500/40 shadow-red-500/20',
    glowColor: '#ef4444',
  },
  'Tears': {
    name: 'Tears',
    file: 'Tears.exp3.json',
    category: 'ERROR',
    label: 'Air Mata Meleleh',
    badgeEmoji: '🥺',
    bubbleTone: 'border-blue-400/40 shadow-blue-500/20',
    glowColor: '#60a5fa',
  },
  'hammer': {
    name: 'hammer',
    file: 'hammer.exp3.json',
    category: 'PLAYFUL',
    label: 'Palu Jahil!',
    badgeEmoji: '🔨',
    bubbleTone: 'border-amber-400/50 shadow-amber-500/30',
    glowColor: '#f59e0b',
  },
  'baseball bat': {
    name: 'baseball bat',
    file: 'baseball bat.exp3.json',
    category: 'PLAYFUL',
    label: 'Tongkat Baseball Jahil!',
    badgeEmoji: '⚾',
    bubbleTone: 'border-yellow-400/50 shadow-yellow-500/30',
    glowColor: '#eab308',
  },
  'crowbar': {
    name: 'crowbar',
    file: 'crowbar.exp3.json',
    category: 'PLAYFUL',
    label: 'Linggis Bonk!',
    badgeEmoji: '🛠️',
    bubbleTone: 'border-orange-400/50 shadow-orange-500/30',
    glowColor: '#f97316',
  },
  'Yandere': {
    name: 'Yandere',
    file: 'Yandere.exp3.json',
    category: 'PLAYFUL',
    label: 'Mode Yandere',
    badgeEmoji: '🖤',
    bubbleTone: 'border-purple-600/50 shadow-purple-600/30',
    glowColor: '#9333ea',
  },
};

/**
 * Determine best matching expression based on text emotion or action intent
 */
export function resolveMikuExpression(
  requestedExpression?: string,
  action?: string,
  text?: string
): MikuExpressionKey {
  if (requestedExpression && MIKU_EXPRESSIONS[requestedExpression as MikuExpressionKey]) {
    return requestedExpression as MikuExpressionKey;
  }

  const lower = (text || '').toLowerCase();

  // Playful words
  if (lower.includes('palu') || lower.includes('pukul') || lower.includes('bonk')) {
    return 'hammer';
  }
  if (lower.includes('baseball') || lower.includes('nakal') || lower.includes('jahil')) {
    return 'baseball bat';
  }
  if (lower.includes('yandere') || lower.includes('awas ya')) {
    return 'Yandere';
  }

  // Error / Sad words
  if (
    lower.includes('maaf') ||
    lower.includes('tidak ketemu') ||
    lower.includes('kosong') ||
    lower.includes('gagal') ||
    lower.includes('error')
  ) {
    return lower.includes('mati') ? 'Dead Eyes' : lower.includes('nangis') ? 'Crying' : 'Gloom';
  }

  // Pointing actions
  if (action === 'POINT_ELEMENT' || action === 'PLAY' || lower.includes('tonton') || lower.includes('tombol') || lower.includes('klik')) {
    return lower.includes('atas') ? 'Overhead Staff Raise' : 'Hold Staff2';
  }

  // Searching actions
  if (action === 'SEARCH' || lower.includes('cari') || lower.includes('sebentar') || lower.includes('tunggu')) {
    return 'Hand on Chest Pose';
  }

  // Greeting / Found / Excited
  if (lower.includes('halo') || lower.includes('hai') || lower.includes('senpai') || lower.includes('ketemu') || lower.includes('rekomendasi')) {
    return lower.includes('lucu') || lower.includes('suka') ? 'Blush' : 'Fanged Smile';
  }

  return 'Open Arms';
}
