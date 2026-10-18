'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePalette = 'cyan' | 'purple' | 'crimson' | 'emerald' | 'amber';

interface ThemeContextType {
  palette: ThemePalette;
  setPalette: (p: ThemePalette) => void;
  cyclePalette: () => void;
  accentColor: string;
  glowColor: string;
}

const PALETTES: ThemePalette[] = ['cyan', 'purple', 'crimson', 'emerald', 'amber'];

const THEME_DATA: Record<ThemePalette, { accent: string; glow: string; name: string }> = {
  cyan: { accent: '#00f0ff', glow: 'rgba(0, 240, 255, 0.4)', name: 'Neon Cyan' },
  purple: { accent: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', name: 'Amethyst Purple' },
  crimson: { accent: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', name: 'Crimson Rose' },
  emerald: { accent: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', name: 'Emerald Cyber' },
  amber: { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', name: 'Golden Amber' },
};

const ThemeContext = createContext<ThemeContextType>({
  palette: 'cyan',
  setPalette: () => {},
  cyclePalette: () => {},
  accentColor: '#00f0ff',
  glowColor: 'rgba(0, 240, 255, 0.4)',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<ThemePalette>('cyan');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sankanime_palette') as ThemePalette;
      if (saved && PALETTES.includes(saved)) {
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
    const currentIndex = PALETTES.indexOf(palette);
    const nextIndex = (currentIndex + 1) % PALETTES.length;
    setPalette(PALETTES[nextIndex]);
  };

  const currentTheme = THEME_DATA[palette] || THEME_DATA.cyan;

  return (
    <ThemeContext.Provider
      value={{
        palette,
        setPalette,
        cyclePalette,
        accentColor: currentTheme.accent,
        glowColor: currentTheme.glow,
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
