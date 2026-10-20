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
import android.net.Uri;
import android.os.Message;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
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
import com.getcapacitor.BridgeWebViewClient;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private CustomChromeClient customChromeClient;
    private CustomWebViewClient customWebViewClient;

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

                // Set custom WebChromeClient to support native fullscreen and swallow popups
                if (customChromeClient == null) {
                    customChromeClient = new CustomChromeClient(getBridge());
                    webView.setWebChromeClient(customChromeClient);
                }

                // Set custom WebViewClient to block external Chrome / intent redirects
                if (customWebViewClient == null) {
                    customWebViewClient = new CustomWebViewClient(getBridge());
                    webView.setWebViewClient(customWebViewClient);
                }

                WebSettings settings = webView.getSettings();
                settings.setSupportMultipleWindows(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(false);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setBlockNetworkImage(false);
                settings.setLoadsImagesAutomatically(true);

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
     * Custom WebChromeClient extending BridgeWebChromeClient to support HTML5 Fullscreen & swallow popups
     */
    public class CustomChromeClient extends BridgeWebChromeClient {
        public CustomChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            // Telan semua popup window.open dari script iklan/vidhide agar tidak membuka tab baru atau Chrome
            return false;
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

    /**
     * Custom BridgeWebViewClient to lock application inside WebView and prevent jumping to Chrome
     */
    public class CustomWebViewClient extends BridgeWebViewClient {
        public CustomWebViewClient(Bridge bridge) {
            super(bridge);
        }

        private boolean isInternalUrl(Uri uri) {
            if (uri == null) return false;
            String scheme = uri.getScheme();
            if (scheme == null) return false;
            String host = uri.getHost();

            if ("capacitor".equalsIgnoreCase(scheme) ||
                "file".equalsIgnoreCase(scheme) ||
                ("http".equalsIgnoreCase(scheme) && "localhost".equalsIgnoreCase(host)) ||
                ("https".equalsIgnoreCase(scheme) && "localhost".equalsIgnoreCase(host))) {
                return true;
            }
            return false;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request == null || request.getUrl() == null) return true;
            Uri uri = request.getUrl();
            if (isInternalUrl(uri)) {
                return false;
            }
            // Blokir semua navigasi keluar domain lokal / intent / iklan agar tidak mental ke Chrome
            return true;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            if (url == null) return true;
            try {
                Uri uri = Uri.parse(url);
                if (isInternalUrl(uri)) {
                    return false;
                }
            } catch (Exception ignored) {}
            return true;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request != null && request.getUrl() != null) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                String path = uri.getPath();
                if (host != null) {
                    String hostLower = host.toLowerCase();
                    boolean isImage = (path != null && (path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".png") || path.endsWith(".webp") || path.endsWith(".gif") || path.endsWith(".svg")))
                        || (request.getRequestHeaders() != null && request.getRequestHeaders().containsKey("Accept") && request.getRequestHeaders().get("Accept") != null && request.getRequestHeaders().get("Accept").contains("image"));

                    boolean isHotlinkedHost = hostLower.contains("komiku") ||
                                              hostLower.contains("kiryuu") ||
                                              hostLower.contains("komikstation") ||
                                              hostLower.contains("mangadex") ||
                                              hostLower.contains("bacakomik") ||
                                              hostLower.contains("komikindo") ||
                                              hostLower.contains("samehadaku") ||
                                              hostLower.contains("otakudesu") ||
                                              hostLower.contains("anoboy") ||
                                              hostLower.contains("desustream") ||
                                              hostLower.contains("myanimelist") ||
                                              hostLower.contains("kuuhaku") ||
                                              hostLower.contains("shiro");

                    if (isImage || isHotlinkedHost) {
                        try {
                            URL url = new URL(uri.toString());
                            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("GET");
                            conn.setConnectTimeout(8000);
                            conn.setReadTimeout(12000);
                            conn.setInstanceFollowRedirects(true);
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");

                            if (hostLower.contains("kiryuu")) {
                                conn.setRequestProperty("Referer", "https://v7.kiryuu.to/");
                            } else if (hostLower.contains("komikstation")) {
                                conn.setRequestProperty("Referer", "https://komikstation.co/");
                            } else if (hostLower.contains("komiku")) {
                                conn.setRequestProperty("Referer", "https://komiku.org/");
                            } else if (hostLower.contains("mangadex")) {
                                conn.setRequestProperty("Referer", "https://mangadex.org/");
                            } else if (hostLower.contains("myanimelist")) {
                                conn.setRequestProperty("Referer", "https://myanimelist.net/");
                            } else if (hostLower.contains("shiro") || hostLower.contains("kuuhaku")) {
                                conn.setRequestProperty("Referer", "https://shiro.kuuhaku.space/");
                            } else {
                                conn.setRequestProperty("Referer", uri.getScheme() + "://" + host + "/");
                            }

                            int responseCode = conn.getResponseCode();
                            if (responseCode == HttpURLConnection.HTTP_OK) {
                                String contentType = conn.getContentType();
                                if (contentType == null) contentType = "image/jpeg";
                                String mimeType = contentType.split(";")[0].trim();
                                String encoding = conn.getContentEncoding();
                                if (encoding == null) encoding = "UTF-8";

                                return new WebResourceResponse(mimeType, encoding, conn.getInputStream());
                            }
                        } catch (Exception ignored) {
                            // Fall back to default handling
                        }
                    }
                }
            }
            return super.shouldInterceptRequest(view, request);
        }
    }
}
