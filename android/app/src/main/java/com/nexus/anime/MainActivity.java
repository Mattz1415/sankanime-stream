package com.nexus.anime;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private CustomChromeClient customChromeClient;

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

    @Override
    public void onBackPressed() {
        if (customView != null) {
            if (customChromeClient != null) {
                customChromeClient.onHideCustomView();
            }
            return;
        }
        super.onBackPressed();
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

            window.setStatusBarColor(Color.BLACK);
            window.setNavigationBarColor(Color.BLACK);
            if (window.getDecorView() != null) {
                window.getDecorView().setBackgroundColor(Color.BLACK);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams layoutParams = window.getAttributes();
                layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(layoutParams);
            }

            WindowCompat.setDecorFitsSystemWindows(window, false);
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
            if (insetsController != null) {
                insetsController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
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
                webView.setBackgroundColor(Color.BLACK);
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

                // Set custom WebChromeClient to support native fullscreen onShowCustomView
                if (customChromeClient == null) {
                    customChromeClient = new CustomChromeClient(getBridge());
                    webView.setWebChromeClient(customChromeClient);
                }

                WebSettings settings = webView.getSettings();
                settings.setSupportMultipleWindows(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(false);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

                String defaultUa = settings.getUserAgentString();
                if (defaultUa != null && defaultUa.contains("; wv")) {
                    settings.setUserAgentString(defaultUa.replace("; wv", ""));
                }

                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error configuring WebSettings", e);
        }
    }

    /**
     * Custom WebChromeClient extending BridgeWebChromeClient to support HTML5 & IFrame Fullscreen
     */
    public class CustomChromeClient extends BridgeWebChromeClient {
        public CustomChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (customView != null) {
                callback.onCustomViewHidden();
                return;
            }

            customView = view;
            customViewCallback = callback;

            try {
                ViewGroup decor = (ViewGroup) getWindow().getDecorView();
                customView.setBackgroundColor(Color.BLACK);
                decor.addView(customView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));

                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().setVisibility(View.GONE);
                }

                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                applyOledDisplayCutoutAndImmersive();
            } catch (Exception e) {
                android.util.Log.e("MainActivity", "Error in onShowCustomView", e);
            }
        }

        @Override
        public void onHideCustomView() {
            if (customView == null) return;

            try {
                ViewGroup decor = (ViewGroup) getWindow().getDecorView();
                decor.removeView(customView);
                customView = null;

                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }

                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().setVisibility(View.VISIBLE);
                }

                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                applyOledDisplayCutoutAndImmersive();
            } catch (Exception e) {
                android.util.Log.e("MainActivity", "Error in onHideCustomView", e);
            }
        }
    }
}
