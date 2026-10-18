---
name: ui-ux-pro-max
description: Specialist in Ultra-Dark OLED design, spatial glassmorphism, cinematic typography, 60fps micro-interactions, and fluid transitions for premium streaming applications.
---

# UI/UX Pro Max: Ultra-Dark OLED & Spatial Glassmorphism Architecture

## 1. Core Visual Principles
- **Pure OLED Black Foundation**: Primary canvas must be `#020204` with subtle radial dot-matrix background pattern for depth without light bleeding.
- **Spatial Multi-Layer Glassmorphism**:
  - Base layer: `bg-white/[0.02]` to `bg-white/[0.04]`
  - Backing filter: `backdrop-blur-24px` to `backdrop-blur-32px`
  - Crisp boundary: `1px solid rgba(255, 255, 255, 0.08)`
  - Ambient elevation: `shadow-[0_20px_50px_rgba(0,0,0,0.95)]`
- **Ambient Dynamic Glow**:
  - Radiate contextual neon color halos matching the active media poster or selected theme palette.
  - Smooth 700ms easing transitions during media or theme switching.

## 2. Typography & Hierarchy
- **Cinematic Serif Display**: Use `font-cinematic` (Georgia, Playfair, Merriweather) for epic titles, headers, and hero captions.
- **High-Legibility Sans Meta**: Use clean geometric sans-serif for episode numbers, timestamps, badges, and server pills.
- **Information Contrast Ratio**: All critical text must exceed WCAG AAA standards on OLED pitch black (text-white `100%`, text-zinc-300 `80%`, text-zinc-500 `50%`).

## 3. Micro-Interactions & 60fps Motion
- **Spring-Press Feel**: Elements scale to `scale-[0.96]` on touch/active with rapid cubic-bezier return (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Staggered Entrance Animation**: Grid cards animate into view with staggered delay (`stagger-1` to `stagger-12`).
- **Sliding Pill Indicator**: Active tabs utilize a sliding capsule highlight with backdrop glow.
- **Cinematic Ken Burns Effect**: Slow scale zoom (`scale-100` to `scale-110` over 20 seconds) on backdrop hero banners.
- **Zero Green Robot / Broken Frame**: All embedded players must maintain opacity transition with dark shimmer spinner until frames are 100% ready.
