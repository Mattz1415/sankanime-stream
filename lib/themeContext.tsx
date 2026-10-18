'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePalette = 'cyan' | 'crimson' | 'purple' | 'emerald' | 'white';

export interface ThemeInfo {
  id: ThemePalette;
  name: string;
  accent: string;
  glow: string;
}

export const THEME_LIST: ThemeInfo[] = [
  { id: 'cyan', name: 'Ocean Cyan', accent: '#00f0ff', glow: 'rgba(0, 240, 255, 0.45)' },
  { id: 'crimson', name: 'Crimson Red', accent: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)' },
  { id: 'purple', name: 'Amethyst Purple', accent: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)' },
  { id: 'emerald', name: 'Emerald Green', accent: '#10b981', glow: 'rgba(16, 185, 129, 0.45)' },
  { id: 'white', name: 'Cyber White', accent: '#ffffff', glow: 'rgba(255, 255, 255, 0.45)' },
];

interface ThemeContextType {
  palette: ThemePalette;
  setPalette: (p: ThemePalette) => void;
  cyclePalette: () => void;
  accentColor: string;
  glowColor: string;
  themeName: string;
}

const ThemeContext = createContext<ThemeContextType>({
  palette: 'cyan',
  setPalette: () => {},
  cyclePalette: () => {},
  accentColor: '#00f0ff',
  glowColor: 'rgba(0, 240, 255, 0.45)',
  themeName: 'Ocean Cyan',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<ThemePalette>('cyan');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sankanime_palette') as ThemePalette;
      if (saved && THEME_LIST.some((t) => t.id === saved)) {
        setPaletteState(saved);
      }
    } catch {}
  }, []);

  const setPalette = (p: ThemePalette) => {
    setPaletteState(p);
    try {
      localStorage.setItem('sankanime_palette', p);
    } catch {}
  };

  const cyclePalette = () => {
    const ids = THEME_LIST.map((t) => t.id);
    const currentIndex = ids.indexOf(palette);
    const nextIndex = (currentIndex + 1) % ids.length;
    setPalette(ids[nextIndex]);
  };

  const currentTheme = THEME_LIST.find((t) => t.id === palette) || THEME_LIST[0];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-accent', currentTheme.accent);
      document.documentElement.style.setProperty('--theme-glow', currentTheme.glow);
    }
  }, [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        palette,
        setPalette,
        cyclePalette,
        accentColor: currentTheme.accent,
        glowColor: currentTheme.glow,
        themeName: currentTheme.name,
      }}
    >
      <div data-theme={palette} className={`theme-${palette}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
