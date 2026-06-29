package com.dubaival.app;

import android.os.Bundle;
import android.view.View;
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

        // CRITICAL: Tell Android the app handles its own insets —
        // prevents edge-to-edge from extending WebView behind system bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        WebView webView = getBridge().getWebView();

        // Force exactly 100% zoom — no viewport expansion
        webView.setInitialScale(100);

        // Scrollbars render as overlay — don't consume layout width
        webView.setScrollBarStyle(WebView.SCROLLBARS_INSIDE_OVERLAY);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        // Apply system bar insets as padding so content never goes behind side bars
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
            Insets sys = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(sys.left, 0, sys.right, 0);
            return WindowInsetsCompat.CONSUMED;
        });

        // Hard lock: kill any horizontal scroll
        webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
            if (scrollX != 0) {
                webView.scrollTo(0, scrollY);
            }
        });
    }
}
