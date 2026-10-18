package com.nexus.anime;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyOledDisplayCutoutAndImmersive();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyOledDisplayCutoutAndImmersive();
        configureWebViewSettings();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyOledDisplayCutoutAndImmersive();
        }
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyOledDisplayCutoutAndImmersive();
    }

    /**
     * Eliminates grey bars completely:
     * - Forces status bar & nav bar to pure Color.BLACK
     * - Sets decor view background to pure Color.BLACK
     * - Configures LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES to fill notch/camera area
     * - Sets Immersive Sticky Mode via WindowInsetsControllerCompat
     */
    private void applyOledDisplayCutoutAndImmersive() {
        try {
            Window window = getWindow();
            if (window == null) return;

            // 1. Force Pure Pitch Black colors on system bars & window decor
            window.setStatusBarColor(Color.BLACK);
            window.setNavigationBarColor(Color.BLACK);
            if (window.getDecorView() != null) {
                window.getDecorView().setBackgroundColor(Color.BLACK);
            }

            // 2. Display cutout mode: extend content into notch/ear areas (eliminates grey/white bars in landscape)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams layoutParams = window.getAttributes();
                layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(layoutParams);
            }

            // 3. Android Immersive Sticky Mode: hide bars and show transiently on swipe
            WindowCompat.setDecorFitsSystemWindows(window, false);
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
            if (insetsController != null) {
                insetsController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                // Hide status & navigation bars for seamless immersive viewing
                insetsController.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error applying cutout/immersive mode", e);
        }
    }

    private void configureWebViewSettings() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                
                // Set WebView background to pitch black to prevent any white/grey flash
                webView.setBackgroundColor(Color.BLACK);

                WebSettings settings = webView.getSettings();

                // 1. Popup & redirect suppression while keeping Bridge intact
                settings.setSupportMultipleWindows(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(false);

                // 2. Storage & media playback configurations
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

                // 3. Remove "; wv" from User-Agent so video hosts treat it as pure Chrome Android
                String defaultUa = settings.getUserAgentString();
                if (defaultUa != null && defaultUa.contains("; wv")) {
                    settings.setUserAgentString(defaultUa.replace("; wv", ""));
                }

                // 4. Accept third-party cookies for embedded iframes (odstream, desustream, ondesuhd)
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error configuring WebSettings", e);
        }
    }
}
