---
name: nextjs-state-optimizer
description: Specialist in Next.js static exports, SWR data fetching, localStorage persistence, optimistic UI updates, and zero-layout-shift rendering.
---

# Next.js State Optimizer Skill

## Mission
Deliver instant page transitions, zero-layout-shift (CLS = 0), multi-tier client-side caching (Memory SWR + LocalStorage), and ultra-responsive anime streaming experiences.

## Core Best Practices

### 1. Static Export Friendly (`output: 'export'`)
- All dynamic routes for mobile app wrapper must work cleanly with Next.js client-side router and static generation.
- Dynamic route query params handled via `useSearchParams()` wrapped inside `<Suspense>` boundaries.
- No direct Node.js server dependencies in client bundles.

### 2. Multi-Tier Cache Hierarchy
- **Level 1 (Memory / SWR Cache)**: Instant revalidation, stale-while-revalidate for fast in-session tab switching.
- **Level 2 (Persistent LocalStorage)**:
  - Watch history with timestamp (`currentTime`, `duration`, `percentage`, `completed`).
  - Bookmarked anime watchlist with genre tags and episodes.
  - User settings (preferred resolution, default server vidhide/desustream, dark OLED theme palette).
  - Episode watch status tracking (color indicator for watched episodes).

### 3. Zero Layout Shift (CLS = 0)
- Explicit aspect ratio containers for anime posters (`aspect-[3/4]`, `aspect-video`).
- Animated skeleton placeholders matching the exact dimensions of incoming cards.
- Pre-allocated heights for banner carousels and player controls.

### 4. Resilient API Resilience
- Exponential backoff / retry mechanism for anime APIs (`https://www.sankavollerei.com/anime`).
- Fallback mock data or cached state if user is offline or network connection is spotty.
