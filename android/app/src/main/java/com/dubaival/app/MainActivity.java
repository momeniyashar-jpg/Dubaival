package com.dubaival.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // MUST keep this — without it, WebView ignores <meta viewport> and uses 980px default
        settings.setUseWideViewPort(true);

        // Do NOT use setLoadWithOverviewMode — it shrinks content to fit (desktop-site behavior)
        // Do NOT use TEXT_AUTOSIZING — it auto-enlarges text, pushing elements beyond viewport

        webView.setScrollBarStyle(WebView.SCROLLBARS_INSIDE_OVERLAY);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
            Insets sys = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(sys.left, 0, sys.right, 0);
            return WindowInsetsCompat.CONSUMED;
        });

        webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
            if (scrollX != 0) {
                webView.scrollTo(0, scrollY);
            }
        });
    }
}
