---
description: Run the Nexus-Max supreme engineering and UI/UX standard for Sankanime Stream
argument-hint: "[task or feature to execute]"
---

Execute the following request under the strict, inviolable rules of the **NEXUS-MAX** standard:

$ARGUMENTS

## MANDATORY NEXUS-MAX ARCHITECTURE & GUIDELINES:

### 1. UI/UX ARCHITECTURE (Flutter UI + Monochrome Liquid Glass)
- **Flutter Widget Model**:
  - `SliverAppBar`: Translucent sticky header with bold typography and Liquid Glass search capsule (`Ctrl+K`).
  - `CupertinoSlidingSegmentedControl`: `h-11 rounded-full bg-[#121214] p-1 border border-white/10` with convex active pill (`bg-[#2C2C2E] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)] rounded-full text-white font-semibold`).
  - `PageView Carousel`: `rounded-[32px]` with floating Liquid Glass panel (`rounded-[24px]`).
  - `Flutter Squircle Photocard`: `aspect-[2/3] rounded-[24px] bg-[#121214] border border-white/10 overflow-hidden active:scale-[0.96] transition-transform duration-150` with `<SmartImage>`.
  - `DraggableScrollableSheet`: Pull-up modal sheet with drag-handle pill (`w-10 h-1.5 rounded-full bg-white/25 mx-auto my-3`), always-visible "Kembali / Tutup" button, and non-clipping resolution pills (`360p`, `480p`, `720p`, `1080p`).
  - `FloatingGlassDock`: `fixed bottom-5 inset-x-5 h-16 rounded-full max-w-lg mx-auto` with `pb-32` bottom clearance across scroll views.
- **Monochrome Liquid Glass**: Pure OLED Black (`#000000`), Layered Carbons (`#0A0A0C`, `#121214`, `#1C1C1E`, `#2C2C2E`), pure White/Silver text (`#FFFFFF`, `#A1A1AA`, `#71717A`), and inset specular border `1px solid rgba(255,255,255,0.12)`.
- **STRICT PROHIBITIONS**:
  - DILARANG KERAS warna neon/pelangi (NO cyan, fuchsia, amber, purple, neon green).
  - DILARANG KERAS `backdrop-blur-2xl` / `backdrop-blur-3xl` yang menyebabkan lag WebView (wajib 60fps dengan `backdrop-blur-md`/`lg` dan `transform-gpu`).
  - DILARANG KERAS elemen AI Slop: tanpa ikon `✨`/`⚡`, tanpa badge palsu `FLUTTER`/`LIQUID GLASS`/`30ms`/`Multi-Source Engine`, tanpa story ring bar, tanpa kartu promosi klise.

### 2. MEDIA & STREAMING ENGINE RULES
- **Multi-Source Aggregation**:
  - Anime/Donghua: Sanka Vollerei API (`/anime/*`, `/anime/donghua/*`).
  - Samehadaku: `rizalord/samehadaku-api` + direct native scraper dengan 5s timeout auto-fallback.
  - Drakor: `zeronewatch-api` (`/drakorkita/*`) + curated fallback + multi-server embeds (`vidsrc.icu`, `vidsrc.cc`, `autoembed.cc`, `multiembed.mov`).
  - Manhwa & Komik: Multi-source aggregator (`sankanime-komik`, `Kurokami`, `Komiku-Rest-Api`, `SHIRO-MANHWA-API`, dan `MangaDex` API). Daftar chapter TIDAK BOLEH 0 (wajib fallback otomatis ke MangaDex/Komiku).
- **SmartImage 4-Layer**: Semua gambar wajib `<SmartImage>` (Direct `no-referrer` -> `wsrv.nl` -> `weserv.nl` -> auto-fetch Jikan/MangaDex/TMDB).
- **Video Embed & WebView Lock**: Semua video embed wajib `<iframe>` murni tanpa atribut `sandbox`, dan redirect lock dikunci di `MainActivity.java` agar tidak pernah lari ke Chrome.

### 3. AUTO-DEPLOY PIPELINE
Setelah menyelesaikan perubahan:
1. `npm run build` (wajib 0 error TypeScript / Next.js)
2. `npx cap sync android`
3. `git add .`
4. `git commit -m "..."`
5. `git push origin main`
