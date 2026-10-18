---
name: capacitor-android-architect
description: Expert in Capacitor native Android runtime optimization, WebView settings, crash prevention, lifecycle management, and hardware acceleration.
---

# Capacitor Android Architect Skill

## Mission
Ensure the Android Capacitor application runs smoothly at 60-120fps with zero crashes, robust WebView configurations, proper lifecycle hooks, and safe third-party media playback.

## Architecture Standards

### 1. Safe MainActivity WebView Customization
- **NEVER** overwrite Capacitor's internal `BridgeWebViewClient` or `setWebChromeClient` directly with custom implementations that omit bridge routing. Doing so breaks `window.Capacitor.postMessage` and causes instant native crashes or frozen UI.
- Apply `WebSettings` safely inside `onResume()` wrapped in a `try-catch` block:
  ```java
  @Override
  public void onResume() {
      super.onResume();
      try {
          if (getBridge() != null && getBridge().getWebView() != null) {
              WebView webView = getBridge().getWebView();
              WebSettings settings = webView.getSettings();
              // Enable DOM & Database storage for modern SPAs and offline caches
              settings.setDomStorageEnabled(true);
              settings.setDatabaseEnabled(true);
              // Allow HTML5 video autoPlay without requiring physical user tap
              settings.setMediaPlaybackRequiresUserGesture(false);
              // Mixed content allowance for third-party media streams
              settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
              // Suppress unwanted popups
              settings.setSupportMultipleWindows(true);
              settings.setJavaScriptCanOpenWindowsAutomatically(false);
              // Spoof pure Chrome Mobile by stripping '; wv' identifier
              String ua = settings.getUserAgentString();
              if (ua != null && ua.contains("; wv")) {
                  settings.setUserAgentString(ua.replace("; wv", ""));
              }
              // Cookie management for cross-site video embeds
              android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
              cookieManager.setAcceptCookie(true);
              cookieManager.setAcceptThirdPartyCookies(webView, true);
          }
      } catch (Exception e) {
          android.util.Log.e("MainActivity", "Error configuring WebSettings", e);
      }
  }
  ```

### 2. Native Bridge & CapacitorHttp
- In `capacitor.config.json`, enable `plugins.CapacitorHttp.enabled = true`.
- Native network requests initiated via `CapacitorHttp` bypass web browser CORS restrictions and run over native OkHttp threads.
- Handle memory cleanup when unloading heavy media or WebViews to prevent OOM errors on lower-tier Android devices.

### 3. Smooth Hardware Acceleration
- Ensure `android:hardwareAccelerated="true"` is set in `AndroidManifest.xml` `<application>`.
- Use CSS properties that trigger GPU compositing: `transform: translate3d(0, 0, 0)`, `backface-visibility: hidden`, `will-change: transform`.
- Avoid heavy backdrop filters on deep nesting; use CSS frosted gradients and pre-blurred textures.
