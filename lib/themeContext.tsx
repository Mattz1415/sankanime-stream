'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePalette = 'cyan' | 'crimson' | 'purple' | 'emerald' | 'amber' | 'pink' | 'white';

export interface ThemeInfo {
  id: ThemePalette;
  name: string;
  accent: string;
  glow: string;
}

export const THEME_LIST: ThemeInfo[] = [
  { id: 'cyan', name: 'Neon Cyan', accent: '#00f0ff', glow: 'rgba(0, 240, 255, 0.45)' },
  { id: 'purple', name: 'Electric Purple', accent: '#a855f7', glow: 'rgba(168, 85, 247, 0.45)' },
  { id: 'crimson', name: 'Crimson Red', accent: '#ef4444', glow: 'rgba(239, 68, 68, 0.45)' },
  { id: 'emerald', name: 'Emerald Green', accent: '#10b981', glow: 'rgba(16, 185, 129, 0.45)' },
  { id: 'amber', name: 'Amber Gold', accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' },
  { id: 'pink', name: 'Cyber Pink', accent: '#ec4899', glow: 'rgba(236, 72, 153, 0.45)' },
  { id: 'white', name: 'Pure White', accent: '#ffffff', glow: 'rgba(255, 255, 255, 0.45)' },
];

interface ThemeContextType {
  palette: ThemePalette;
  setPalette: (p: ThemePalette) => void;
  cyclePalette: () => void;
  accentColor: string;
  glowColor: string;
  themeName: string;
  isOledBlack: boolean;
  toggleOledBlack: () => void;
  glowIntensity: 'subtle' | 'vivid' | 'neon';
  setGlowIntensity: (g: 'subtle' | 'vivid' | 'neon') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  palette: 'cyan',
  setPalette: () => {},
  cyclePalette: () => {},
  accentColor: '#00f0ff',
  glowColor: 'rgba(0, 240, 255, 0.45)',
  themeName: 'Neon Cyan',
  isOledBlack: true,
  toggleOledBlack: () => {},
  glowIntensity: 'vivid',
  setGlowIntensity: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<ThemePalette>('cyan');
  const [isOledBlack, setIsOledBlackState] = useState<boolean>(true);
  const [glowIntensity, setGlowIntensityState] = useState<'subtle' | 'vivid' | 'neon'>('vivid');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sankanime_palette') as ThemePalette;
      if (saved && THEME_LIST.some((t) => t.id === saved)) {
        setPaletteState(saved);
      }
      const savedOled = localStorage.getItem('sankanime_oled');
      if (savedOled !== null) {
        setIsOledBlackState(savedOled === 'true');
      }
      const savedGlow = localStorage.getItem('sankanime_glow') as 'subtle' | 'vivid' | 'neon';
      if (savedGlow) {
        setGlowIntensityState(savedGlow);
      }
    } catch {}
  }, []);

  const setPalette = (p: ThemePalette) => {
    setPaletteState(p);
    try {
      localStorage.setItem('sankanime_palette', p);
    } catch {}
  };

  const toggleOledBlack = () => {
    setIsOledBlackState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sankanime_oled', String(next));
      } catch {}
      return next;
    });
  };

  const setGlowIntensity = (g: 'subtle' | 'vivid' | 'neon') => {
    setGlowIntensityState(g);
    try {
      localStorage.setItem('sankanime_glow', g);
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
      if (isOledBlack) {
        document.body.classList.add('oled-pitch-black');
        document.body.style.backgroundColor = '#000000';
      } else {
        document.body.classList.remove('oled-pitch-black');
        document.body.style.backgroundColor = '#07070b';
      }
    }
  }, [currentTheme, isOledBlack]);

  return (
    <ThemeContext.Provider
      value={{
        palette,
        setPalette,
        cyclePalette,
        accentColor: currentTheme.accent,
        glowColor: currentTheme.glow,
        themeName: currentTheme.name,
        isOledBlack,
        toggleOledBlack,
        glowIntensity,
        setGlowIntensity,
      }}
    >
      <div data-theme={palette} className={`theme-${palette} ${isOledBlack ? 'bg-black' : 'bg-[#07070b]'}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
export default useTheme;
