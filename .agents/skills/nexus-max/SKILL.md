---
name: nexus-max
description: Mandatory development standard for Sankanime Stream (Nexus Stream). Enforces Flutter UI widget architecture, Monochrome Liquid Glass design (#000000, #121214, #1C1C1E, #2C2C2E, #FFFFFF), multi-source streaming APIs (Sanka, rizalord Samehadaku, zeronewatch Drakor, Kurokami/Komiku/MangaDex Manhwa), 4-layer SmartImage fallback, pure iframe playback locked in MainActivity.java, and strict zero-error auto-deploy pipeline (build, cap sync, git push).
argument-hint: "[task or feature]"
license: MIT
metadata:
  author: Mattz1415
  version: "1.0.0"
---

# NEXUS-MAX: Supreme Architecture & Engineering Standard

`nexus-max` is the supreme, inviolable engineering directive for **Sankanime Stream (Nexus Stream)**. Any feature, screen, component, or bug fix authored or modified in this codebase MUST strictly adhere to the three foundational pillars defined below.

---

## PILLAR 1: UI/UX ARCHITECTURE & MONOCHROME LIQUID GLASS

### 1. Flutter UI Widget Architecture
All UI components must faithfully implement the ergonomics, physics, and layout models inspired by [Flutter UI](https://docs.flutter.dev/ui):
- **SliverAppBar**: Sticky translucent header with bold typography (`font-black`), specular bottom border, Liquid Glass search capsule (`Ctrl+K`), and user profile avatar.
- **CupertinoSlidingSegmentedControl**: Capsule switcher (`h-11 rounded-full bg-[#121214] p-1 border border-white/10 overflow-x-auto no-scrollbar`) with convex active glass pill (`bg-[#2C2C2E] text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)] rounded-full text-xs font-semibold`).
- **PageView Carousel**: Aspect ratio hero banners (`rounded-[32px]`) paired with floating Liquid Glass information panels (`rounded-[24px]`).
- **Flutter Squircle Photocard**: Aspect ratio `aspect-[2/3]` with smooth continuous corners (`rounded-[24px] bg-[#121214] border border-white/10 overflow-hidden active:scale-[0.96] transition-transform duration-150`).
- **DraggableScrollableSheet / Modal BottomSheet**: Pull-up sheets featuring an authentic Flutter drag-handle pill (`w-10 h-1.5 rounded-full bg-white/25 mx-auto my-3`), always-visible "Kembali / Tutup" buttons, and non-clipping resolution pills (`360p`, `480p`, `720p`, `1080p`).
- **FloatingGlassDock**: Fixed capsule bottom navigation (`fixed bottom-5 inset-x-5 h-16 rounded-full max-w-lg mx-auto`) with Extended Floating Action Button (FAB). All scrollable views MUST maintain `pb-32` clearance to avoid dock overlap.

### 2. Monochrome Liquid Glass Material Design
The visual aesthetic is strictly 100% OLED Monochrome Liquid Glass:
- **Color Palette**:
  - Pure OLED Black: `#000000`
  - Deep Layered Carbons: `#0A0A0C`, `#121214`, `#1C1C1E`, `#2C2C2E`
  - Typography & Accents: Pure White `#FFFFFF`, Silver `#A1A1AA`, Slate `#71717A`
- **Liquid Glass Surface Spec**:
  - Surface gradient: `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.07) 100%)`
  - Internal specular reflections: `box-shadow: inset 0 1px 0.5px rgba(255,255,255,0.3), inset 0 -1px 0.5px rgba(255,255,255,0.08)`
  - Edge specular border: `border: 1px solid rgba(255,255,255,0.12)`
  - Backdrop filter: `backdrop-blur-md` or `backdrop-blur-lg` (`blur(16px)` to `blur(20px)`).

### 3. Strict Prohibitions (Zero Lag & Zero AI Slop)
- **NO NEON / RAINBOW COLORS**: Strictly prohibited to use cyan, fuchsia, purple, amber, crimson, neon green, or rainbow gradient text/borders. All accents and active states must be pure monochrome white or silver.
- **NO WEBVIEW LAG BLURS**: Strictly prohibited to use `backdrop-blur-2xl` or `backdrop-blur-3xl` or multi-layered stacked heavy blurs that drop FPS in Android WebView. Maintain 60fps hardware acceleration with `transform-gpu` and `will-change: transform`.
- **NO AI SLOP**:
  - NO decorative sparkles (`✨`) or lightning bolts (`⚡`). Use clean semantic Lucide icons (`Play`, `Tv`, `Film`, `BookOpen`, `Star`).
  - NO fake technical badges (`FLUTTER`, `LIQUID GLASS`, `Multi-Source Engine`, `30ms`, `Spatial Audio`).
  - NO fake stories ring bars (`AnimeStoriesBar`).
  - NO promotional marketing cards (e.g., "NEXUS FLUTTER HUB").

---

## PILLAR 2: MEDIA & STREAMING ENGINE RULES

### 1. Multi-Source API Aggregation
- **Anime & Donghua**: Primary source is Sanka Vollerei API (`https://www.sankavollerei.com/anime/*`, `/anime/donghua/*`).
- **Samehadaku**: Direct native scraper + `rizalord/samehadaku-api` (`https://samehadaku-api-eight.vercel.app/*`) via `CapacitorHttp` with 5-second timeout and instant fallback to alternative servers.
- **Drakor (K-Drama Sub Indo)**: `ZeroneDoo/zeronewatch-api` (`https://zeronewatch-api.vercel.app/drakorkita/*`) with curated offline fallback and multi-server embeds (`vidsrc.icu`, `vidsrc.cc`, `autoembed.cc`, `multiembed.mov`).
- **Manhwa & Komik**: Multi-source aggregator (`sankanime-komik`, `Kurokami`, `Komiku-Rest-Api`, `SHIRO-MANHWA-API`, and `MangaDex` API).
  - **Inviolable Rule**: Chapter lists must NEVER be empty (0 chapters). If the primary source returns 0 chapters for any title (e.g., *Serena*, *Solo Leveling*), immediately trigger automatic fallback to MangaDex API (`https://api.mangadex.org/manga?title={query}`) or Komiku-Rest-Api to provide full chapters.
- **Film / LK21**: LK21 Bioskop Engine with multi-server HD embeds.

### 2. 4-Layer SmartImage Fallback Pipeline
Every single image/poster in the application MUST be rendered via `<SmartImage>` with a 4-layer fallback pipeline:
1. **Layer 1**: Direct source URL with `referrerPolicy="no-referrer"`.
2. **Layer 2**: WebP Proxy CDN 1 (`https://wsrv.nl/?url={encodeURIComponent(src)}&w=500&output=webp`).
3. **Layer 3**: WebP Proxy CDN 2 (`https://images.weserv.nl/?url={encodeURIComponent(src)}&w=500&output=webp`).
4. **Layer 4**: Contextual metadata auto-fetch (Jikan API for Anime, MangaDex for Manga/Manhwa, TMDB API for Drakor/Film), followed by local fallback SVG.

### 3. Video Embed & Android WebView Security
- All video embed streams (`ondesuhd`, `desustream`, `odstream`, `vidhide`, `mega`, `pixeldrain`, `vidsrc`, `autoembed`) MUST be rendered in pure `<iframe>` without the HTML `sandbox` attribute (to allow native HTML5 video controls, full-screen, and legitimate player functionality).
- **Anti-Redirect WebView Lock**: Navigation hijacking, external Chrome intents, and popunder tabs MUST be intercepted and suppressed at the native Java layer in `android/app/src/main/java/com/sanka/anime/stream/MainActivity.java` via `shouldOverrideUrlLoading`, keeping playback uninterrupted inside the app.

---

## PILLAR 3: AUTO-DEPLOY WORKFLOW PIPELINE

Every time any modification, task, or feature implementation is concluded, the agent MUST automatically execute the complete build, sync, and deploy pipeline:

```bash
# Step 1: Run production build and ensure ZERO TypeScript / Next.js errors
npm run build

# Step 2: Sync web assets to Android Capacitor runtime
npx cap sync android

# Step 3: Stage all modified and added files
git add .

# Step 4: Create a descriptive conventional commit
git commit -m "..."

# Step 5: Push commit cleanly to remote GitHub main branch
git push origin main
```

**Quality Guarantee**: Never leave uncommitted changes, never push with compilation errors, and never degrade mobile 60fps responsiveness.
