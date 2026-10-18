---
name: stream-tunnel-engineer
description: Expert in CORS bypass, X-Frame-Options evasion, Referer spoofing, JWPlayer/Plyr direct stream extraction, and sanitized blob/srcDoc rendering for video streaming embeds.
---

# Stream Tunnel Engineer Skill

## Mission
Provide seamless video stream playback from third-party anime embed providers (desustream, ondesuhd, odstream, vidhide, odcdn, mega) without encountering `X-Frame-Options`, `CORS`, or unwanted redirect popups.

## Core Architectures & Techniques

### 1. Capacitor Native HTTP Bridge
- Leverage `@capacitor/core` `CapacitorHttp` with `CapacitorHttp: { enabled: true }`.
- When running in native Android WebView, `CapacitorHttp.get(...)` bypasses browser CORS and X-Frame-Options entirely by issuing native Android Java/OkHttp network requests.
- Inject custom Spoofed Headers:
  - `Referer: "https://otakudesu.cloud/"`
  - `User-Agent: "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"`
  - `Origin: "https://otakudesu.cloud"`

### 2. Multi-Tier Fallback Proxy for Web/Dev
- If running on web / Capacitor native bridge unavailable:
  - Tunnel through CORS proxies (e.g. `https://api.allorigins.win/raw?url=`, `https://corsproxy.io/?`, `https://api.codetabs.com/v1/proxy?quest=`).
  - Graceful degradation with clear user feedback.

### 3. Layer 1: Direct Video Stream Extraction (Regex / AST)
- Parse HTML response to extract direct playable video streams (`.mp4`, `.m3u8`, HLS manifest, Google Video CDN, or Plyr/JWPlayer setup JSON):
  - `sources:\s*\[\s*\{\s*file:\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']`
  - `file:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)[^"']*)["']`
  - `<source\s+[^>]*src=["']([^"']+\.(?:mp4|m3u8)[^"']*)["']`
- When direct stream is located:
  - Mount custom HTML5 `<video controls autoPlay playsInline>` with modern UI controls.
  - Zero iframe overhead, zero advertising popups, full picture-in-picture & native playback speeds.

### 4. Layer 2: Sanitized Blob URL & srcDoc Isolation
- If stream source is encrypted, packed, or relies on provider JS player:
  - Extract the player HTML/DOM.
  - Inject `<base href="[provider_origin]/">` so relative assets, css, and player scripts resolve correctly.
  - Inject Anti-Redirect & Anti-Popup Shim:
    ```html
    <script>
      window.open = function() { console.warn("Blocked window.open popup"); return null; };
      window.alert = function() {};
      window.confirm = function() { return false; };
      Object.defineProperty(window, 'location', {
        configurable: false,
        writable: false
      });
    </script>
    ```
  - Strip known advertising domains, banner scripts, and malicious redirects (`adcash`, `betting`, `popads`).
  - Generate a secure Blob URL:
    ```typescript
    const blob = new Blob([sanitizedHtml], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    ```
  - Render inside `<iframe>` via `src={blobUrl}` or `srcDoc={sanitizedHtml}`. Because the origin is `blob:` or `srcdoc`, `X-Frame-Options: SAMEORIGIN` from the upstream server header is completely circumvented!

### 5. Player HUD & Diagnostics
- Always display a glowing glass status badge: `"⚡ Tunnel Active (Layer 1: Direct)"` or `"⚡ Tunnel Active (Layer 2: Blob Isolator)"`.
- Provide fallback button to switch to Vidhide / Mega or Open in External Browser if upstream host is down.
