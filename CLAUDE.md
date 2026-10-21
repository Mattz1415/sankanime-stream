# Sankanime Stream (Nexus Stream) - Engineering Guidelines

This repository follows the **NEXUS-MAX** supreme development standard. All modifications, features, and fixes MUST strictly comply with these rules:

## 1. UI/UX ARCHITECTURE & MONOCHROME LIQUID GLASS
- **Flutter UI Widget Model**:
  - `SliverAppBar`: Translucent sticky header with bold typography and Liquid Glass search capsule (`Ctrl+K`).
  - `CupertinoSlidingSegmentedControl`: `h-11 rounded-full bg-[#121214] p-1 border border-white/10` with convex active pill (`bg-[#2C2C2E] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)] rounded-full text-white font-semibold`).
  - `PageView Carousel`: `rounded-[32px]` with floating Liquid Glass panel (`rounded-[24px]`).
  - `Flutter Squircle Photocard`: `aspect-[2/3] rounded-[24px] bg-[#121214] border border-white/10 overflow-hidden active:scale-[0.96] transition-transform duration-150` with `<SmartImage>`.
  - `DraggableScrollableSheet`: Pull-up modal sheet with drag-handle pill (`w-10 h-1.5 rounded-full bg-white/25 mx-auto my-3`), always-visible "Kembali / Tutup" button, and non-clipping resolution pills (`360p`, `480p`, `720p`, `1080p`).
  - `FloatingGlassDock`: `fixed bottom-5 inset-x-5 h-16 rounded-full max-w-lg mx-auto` with `pb-32` bottom clearance across scroll views.
- **Monochrome Liquid Glass**:
  - Palette: Pure OLED Black (`#000000`), Layered Carbons (`#0A0A0C`, `#121214`, `#1C1C1E`, `#2C2C2E`), pure White/Silver text (`#FFFFFF`, `#A1A1AA`, `#71717A`).
  - Surface: `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.07) 100%)`.
  - Reflections: `box-shadow: inset 0 1px 0.5px rgba(255,255,255,0.3), inset 0 -1px 0.5px rgba(255,255,255,0.08)`.
  - Border: `1px solid rgba(255,255,255,0.12)`.
- **Strict Prohibitions**:
  - **NO NEON/RAINBOW**: Never use cyan, fuchsia, purple, amber, crimson, neon green, or rainbow gradient text/borders.
  - **NO HEAVY BLURS**: Never use `backdrop-blur-2xl` or `3xl` that lag Android WebView; always maintain 60fps with `backdrop-blur-md`/`lg` and `transform-gpu`.
  - **NO AI SLOP**: No `✨` or `⚡` icons, no fake badges (`FLUTTER`, `LIQUID GLASS`, `Multi-Source Engine`, `30ms`), no story ring bars, no promotional marketing cards.

## 2. MEDIA & STREAMING ENGINE RULES
- **Multi-Source Aggregation**:
  - Anime/Donghua: Sanka Vollerei API (`/anime/*`, `/anime/donghua/*`).
  - Samehadaku: `rizalord/samehadaku-api` + direct native scraper with 5s timeout fallback.
  - Drakor: `ZeroneDoo/zeronewatch-api` (`/drakorkita/*`) + curated fallback + multi-server embeds (`vidsrc.icu`, `vidsrc.cc`, `autoembed.cc`, `multiembed.mov`).
  - Manhwa & Komik: Multi-source aggregator (`sankanime-komik`, `Kurokami`, `Komiku-Rest-Api`, `SHIRO-MANHWA-API`, and `MangaDex` API). Chapter list must NEVER be empty (0 chapters); fallback automatically to MangaDex/Komiku.
  - Film / LK21: LK21 Bioskop Engine with multi-server HD embeds.
- **SmartImage 4-Layer Fallback**: Every image must use `<SmartImage>` (`no-referrer` -> `wsrv.nl` -> `weserv.nl` -> auto-fetch Jikan/MangaDex/TMDB).
- **Video Embed & WebView Lock**: All video embed streams must use pure `<iframe>` without HTML `sandbox`, with external redirects intercepted in `MainActivity.java` via `shouldOverrideUrlLoading`.

## 3. AUTO-DEPLOY PIPELINE
After finishing ANY instruction:
1. `npm run build` (ensure 0 TypeScript / Next.js errors)
2. `npx cap sync android`
3. `git add .`
4. `git commit -m "..."`
5. `git push origin main`
