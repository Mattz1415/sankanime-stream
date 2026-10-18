package com.nexus.anime;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                WebSettings settings = webView.getSettings();

                // 1. Remove "; wv" from User-Agent so video hosts treat it as pure Chrome Android
                String defaultUa = settings.getUserAgentString();
                if (defaultUa != null && defaultUa.contains("; wv")) {
                    settings.setUserAgentString(defaultUa.replace("; wv", ""));
                }

                // 2. Enable DOM storage, media playback without gesture, and mixed content
                settings.setDomStorageEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
        } catch (Exception e) {
            // Safe fallback to prevent force close
        }
    }
}
