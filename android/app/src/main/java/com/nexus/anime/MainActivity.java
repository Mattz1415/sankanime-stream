package com.nexus.anime;

import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;

public class MainActivity extends BridgeActivity {

    private static final String[] AD_KEYWORDS = new String[]{
        "doubleclick", "googlesyndication", "popads", "popcash", "adsterra",
        "onclickads", "exoclick", "propellerads", "adx.", "adservice",
        "adnetwork", "adskeeper", "yadro.ru", "bet365", "casino", "slot88",
        "judibola", "poker", "toto", "1x-bet", "trafmag", "adbuffs",
        "adnxs", "bidswitch", "rubiconproject", "criteo", "outbrain",
        "taboola", "mgid.com", "adtrue", "directrev", "wigetmedia",
        "adkernel", "revenuehits", "yllix", "hilltopads", "clickadu",
        "a-ads.com", "monetag", "infolinks", "adcolony", "applovin",
        "unityads", "ironsrc", "vungle", "chartboost"
    };

    private boolean isAdUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        for (String keyword : AD_KEYWORDS) {
            if (lower.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private void setupAdblockAndWebViewSettings() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // 1. Remove "; wv" from User-Agent so video hosts treat it as pure Chrome Android
        String defaultUa = settings.getUserAgentString();
        if (defaultUa != null && defaultUa.contains("; wv")) {
            settings.setUserAgentString(defaultUa.replace("; wv", ""));
        }

        // 2. Enable mixed content, DOM storage, media playback without user gesture, multiple windows
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(true);

        // 3. Custom WebChromeClient to silently block pop-up windows from video ads
        webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                // Silently block new window / popup creation
                return false;
            }
        });

        // 4. Custom BridgeWebViewClient to intercept ad trackers and prevent top navigation hijack
        webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    String url = request.getUrl().toString();
                    if (isAdUrl(url)) {
                        // Silently return empty response to block ads and trackers
                        return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream("".getBytes()));
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    Uri uri = request.getUrl();
                    String host = uri.getHost();
                    String scheme = uri.getScheme();

                    // Allow local app routing on localhost
                    if (host != null && (host.equalsIgnoreCase("localhost") || host.equalsIgnoreCase("127.0.0.1"))) {
                        return false;
                    }

                    // Block external intent and market schemes from ad networks
                    if (scheme != null && (scheme.equalsIgnoreCase("intent") || scheme.equalsIgnoreCase("market"))) {
                        return true;
                    }

                    // Block ad URLs
                    if (isAdUrl(uri.toString())) {
                        return true;
                    }

                    // Block main frame external redirects to keep user on the app
                    if (request.isForMainFrame()) {
                        return true;
                    }
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupAdblockAndWebViewSettings();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupAdblockAndWebViewSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupAdblockAndWebViewSettings();
    }
}
