const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('  ' + path.relative(ROOT, dest));
  }
}

console.log('Building www/ for Capacitor...\n');

ensureDir(WWW);
ensureDir(path.join(WWW, 'js'));

copyFile(path.join(ROOT, 'index.html'), path.join(WWW, 'index.html'));

let html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');

// Viewport: add viewport-fit for notch/punch-hole, disable zoom for app feel
html = html.replace(
  'width=device-width, initial-scale=1.0',
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
);

// Native app CSS overrides — fixes scroll, safe areas, touch, keyboard
html = html.replace(
  '</head>',
  `<style id="cap-native-css">
/* --- Capacitor Native App Overrides --- */

/* Global box-sizing + prevent horizontal overflow */
*,*::before,*::after{box-sizing:border-box!important}
html{height:auto!important;overflow-x:hidden!important;max-width:100%!important}
body{height:auto!important;min-height:100vh!important;
  overflow-y:auto!important;overflow-x:hidden!important;max-width:100%!important;
  overscroll-behavior-x:none!important;overscroll-behavior-y:auto!important;
  -webkit-overflow-scrolling:touch!important;
  -webkit-text-size-adjust:100%!important;
  padding-top:0!important;
  padding-bottom:0!important;
}

/* Prevent drag but allow scroll — do NOT block touch-callout globally */
img,a{-webkit-user-drag:none}

/* App container: allow content to flow and scroll */
#app{overflow-y:visible!important;overflow-x:hidden!important;
  max-width:100%!important;min-height:100vh!important;height:auto!important}

/* Layout: let content grow beyond viewport — body scrolls, but NEVER horizontally */
.dv-layout{min-height:100vh!important;overflow-y:visible!important;overflow-x:hidden!important;height:auto!important;max-width:100%!important;width:100%!important}
.dv-main{min-height:auto!important;height:auto!important;
  overflow-y:visible!important;overflow-x:hidden!important;max-width:100%!important;width:100%!important;
  padding-bottom:env(safe-area-inset-bottom)!important}

/* Content div: disable internal scroll container, let body scroll */
.dv-content{overflow-y:visible!important;overflow-x:hidden!important;flex:none!important;height:auto!important;
  min-height:auto!important;-webkit-overflow-scrolling:auto!important;max-width:100%!important;width:100%!important}

/* Flex/grid children: allow shrinking below content size */
.dv-layout>*,.dv-main>*{min-width:0!important;max-width:100%!important}
/* Hero card decorations: clip within parent */
.dv-hero-cards-container,.dv-hero-grid{overflow:hidden!important}
/* Allow horizontal scroll in sub-tabs and scroll containers */
.dv-subtabs{overflow-x:auto!important;max-width:100%!important}
[style*="overflow-x: auto"],[style*="overflow-x:auto"],[style*="overflowX"]{overflow-x:auto!important}

/* Bottom tabs: account for safe area on notch phones */
.dv-bottom-tabs{
  bottom:calc(8px + env(safe-area-inset-bottom))!important;
  height:64px!important;
}
/* Extra padding on main when bottom tabs are visible (mobile) */
@media(max-width:768px){
  .dv-main{padding-bottom:calc(88px + env(safe-area-inset-bottom))!important}
}

/* Keyboard open: prevent layout jump */
body.keyboard-open .dv-bottom-tabs{display:none!important}
body.keyboard-open .dv-main{padding-bottom:0!important}

/* Fixed elements: respect safe areas */
.dv-sidebar{top:env(safe-area-inset-top)!important}

/* Smooth momentum scrolling for all scrollable areas */
[style*="overflow"],[style*="overflow-y"],[style*="overflow-x"],
.dv-subtabs{-webkit-overflow-scrolling:touch!important}

/* Prevent text selection on nav elements (app feel) */
.dv-sidebar-item,.dv-pill,.dv-bottom-tab,button{
  -webkit-user-select:none!important;user-select:none!important}

/* Tap highlight */
a,button,.dv-sidebar-item,.dv-pill,.dv-bottom-tab,.dv-tool-btn{
  -webkit-tap-highlight-color:rgba(212,175,55,0.15)!important}

/* Force multi-column grids to wrap on narrow screens */
@media(max-width:500px){
  .dv-subtabs{grid-template-columns:unset!important}
}

/* Status bar space (Android with overlay) */
.dv-native-statusbar-pad{height:env(safe-area-inset-top);background:#070B14;position:fixed;top:0;left:0;right:0;z-index:9999}
</style>
</head>`
);

// Replace render() block with Capacitor-aware bootstrap.
// BUG FIXED 2026-07-12: the old pattern (/\n?<script>[^]*?<\/script>\n<\/body>/)
// matched from the FIRST bare <script> tag in the document (the Google
// Analytics setup block, well before the app-module <script src> tags) all
// the way to the LAST </script>\n</body> — since lazy `[^]*?` still expands
// until SOME match succeeds, and the only `</script>\n</body>` sequence in
// the whole file is at the very end. That silently deleted everything in
// between: <div id="app">, the service-worker registration script, and
// all ~21 <script defer src="js/..."> module tags — meaning www/index.html
// (and the Android app built from it) has been shipping without its own
// app container or any of its module scripts. Never caught because the
// Android APK requires an SDK not available in any session so far, so
// nobody actually loaded the built app to notice. Anchored precisely now
// on the literal bootstrap script's own distinctive content instead of a
// generic tag, so it only replaces the two trailing render/Capacitor-init
// script blocks it was actually meant to replace.
html = html.replace(
  /<script>\nwindow\.onerror=[^]*?<\/script>\n<\/body>/,
  `<script>
(function(){
  var isNative=typeof window.Capacitor!=='undefined'&&window.Capacitor.isNativePlatform();
  window.IS_NATIVE_APP=isNative;
  if(!isNative){
    // App modules load with 'defer' now (2026-07-12, faster first paint) —
    // they may not have executed yet if this inline script is reached
    // before parsing finishes, same reasoning as the capBoot() path below,
    // which already had this guard.
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){render();});}
    else{render();}
    return;
  }

  function capBoot(){
    var P=window.Capacitor.Plugins;

    // Hard fallback: hide splash after 3s no matter what (prevents stuck splash on JS error)
    if(P.SplashScreen){
      setTimeout(function(){P.SplashScreen.hide().catch(function(){});},3000);
    }

    try{

    // StatusBar
    if(P.StatusBar){
      P.StatusBar.setBackgroundColor({color:'#070B14'}).catch(function(){});
      P.StatusBar.setStyle({style:'DARK'}).catch(function(){});
      P.StatusBar.setOverlaysWebView({overlay:false}).catch(function(){});
    }

    // Keyboard: detect open/close to adjust layout
    if(P.Keyboard){
      P.Keyboard.setResizeMode({mode:'ionic'}).catch(function(){});
      P.Keyboard.addListener('keyboardWillShow',function(){
        document.body.classList.add('keyboard-open');
      });
      P.Keyboard.addListener('keyboardWillHide',function(){
        document.body.classList.remove('keyboard-open');
        window.scrollTo(0,window.scrollY);
      });
    }

    // SplashScreen: hide after render (normal path, faster than fallback)
    if(P.SplashScreen){
      setTimeout(function(){P.SplashScreen.hide().catch(function(){});},600);
    }

    // window.open() for external URLs (WhatsApp/Telegram/Twitter/LinkedIn share,
    // mailto, "view original article" links, etc. — used in dozens of places
    // across the app) silently does nothing in a native WebView, since those
    // origins aren't in capacitor.config.json's allowNavigation. Route http(s)
    // targets through the Browser plugin (in-app tab, which itself hands off
    // to the WhatsApp/Telegram app via the OS if installed) and non-http
    // schemes (mailto/tel/sms) through a same-window navigation, which the
    // WebView hands to the OS to resolve.
    if(P.Browser){
      var _nativeWindowOpen=window.open;
      window.open=function(url,target,features){
        if(!url)return _nativeWindowOpen.call(window,url,target,features);
        if(/^(mailto|tel|sms):/i.test(url)){
          window.location.href=url;
          return null;
        }
        if(/^https?:\\/\\//i.test(url)){
          P.Browser.open({url:url}).catch(function(){});
          return null;
        }
        return _nativeWindowOpen.call(window,url,target,features);
      };
    }

    // Share: expose native share
    if(P.Share){
      window.nativeShare=function(o){
        P.Share.share({
          title:o.title||'DubAIVal',
          text:o.text||'',
          url:o.url||'https://www.dubaival.com',
          dialogTitle:'Share via'
        }).catch(function(){});
      };
    }

    // Haptics: expose for UI feedback
    if(P.Haptics){
      window.nativeHaptic=function(type){
        var t=type||'Medium';
        P.Haptics.impact({style:t}).catch(function(){});
      };
    }

    // Back button: use History API (matches web SPA behavior).
    // window.history.length is unreliable here — it only ever grows during a
    // WebView session and almost never returns to 1 once the user has changed
    // tabs even once, so checking it alone would make the "exit app" branch
    // essentially unreachable and leave back-press feeling stuck on the Home
    // screen. Ask the SPA's own logical state instead: if we're not on the
    // root Home tab, step back one screen; if we are, exit like a normal
    // Android app does on its home/root screen.
    if(P.App){
      P.App.addListener('backButton',function(ev){
        if(typeof currentSection!=='undefined'&&currentSection!=='Home'){
          window.history.back();
        }else{
          P.App.exitApp();
        }
      });
    }

    // Deep link handling
    if(P.App){
      P.App.addListener('appUrlOpen',function(data){
        if(data.url){
          var hash=data.url.split('#')[1];
          if(hash){window.location.hash='#'+hash;render();}
        }
      });
    }

    render();

    // Fix viewport overflow: clamp elements + fix grids
    setTimeout(function(){
      var vw=document.documentElement.clientWidth;
      document.querySelectorAll('*').forEach(function(el){
        if(el.scrollWidth>vw){
          el.style.maxWidth='100%';
          el.style.overflowX='hidden';
        }
        var cs=window.getComputedStyle(el);
        if((cs.display==='grid'||cs.display==='inline-grid')&&el.scrollWidth>vw){
          el.style.gridTemplateColumns='repeat(auto-fit,minmax(min(140px,100%),1fr))';
        }
      });
      window.scrollTo(0,window.scrollY);
    },300);

    // Lock horizontal scroll
    document.addEventListener('scroll',function(){
      if(window.scrollX!==0)window.scrollTo(0,window.scrollY);
    },{passive:true});

    }catch(e){
      // If any plugin init fails, app still runs — splash hides via the 3s fallback above
      console.error('capBoot error:',e);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',capBoot);
  }else{
    capBoot();
  }
})();
</script>
</body>`
);

// Remove service worker registration for native app (Capacitor handles caching)
html = html.replace(
  "if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}",
  "if(!window.IS_NATIVE_APP&&'serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}"
);

fs.writeFileSync(path.join(WWW, 'index.html'), html);
console.log('  ✓ Capacitor modifications applied to index.html');

copyFile(path.join(ROOT, 'manifest.json'), path.join(WWW, 'manifest.json'));
copyFile(path.join(ROOT, 'sw.js'), path.join(WWW, 'sw.js'));

const jsDir = path.join(ROOT, 'js');
fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).forEach(f => {
  copyFile(path.join(jsDir, f), path.join(WWW, 'js', f));
});

if (fs.existsSync(path.join(ROOT, 'logo.png'))) {
  copyFile(path.join(ROOT, 'logo.png'), path.join(WWW, 'logo.png'));
}

// Copy icons if they exist
['icon-192.png', 'icon-512.png'].forEach(function(icon) {
  if (fs.existsSync(path.join(ROOT, icon))) {
    copyFile(path.join(ROOT, icon), path.join(WWW, icon));
  } else if (fs.existsSync(path.join(WWW, icon))) {
    console.log('  ' + icon + ' (already in www/)');
  }
});

console.log('\n✅ Build complete — ' + fs.readdirSync(path.join(WWW, 'js')).length + ' JS files copied');

// Auto-sync to Android project if it exists
const androidDir = path.join(ROOT, 'android');
if (fs.existsSync(androidDir)) {
  // Auto-increment versionCode so APK installs over previous without uninstall
  const versionFile = path.join(androidDir, 'app', 'version.properties');
  let vCode = 1;
  if (fs.existsSync(versionFile)) {
    const m = fs.readFileSync(versionFile, 'utf8').match(/VERSION_CODE=(\d+)/);
    if (m) vCode = parseInt(m[1]);
  }
  vCode++;
  fs.writeFileSync(versionFile, 'VERSION_CODE=' + vCode + '\n');
  console.log('\n📱 Syncing to Android project (versionCode=' + vCode + ')...');
  try {
    execSync('npx cap sync android', { cwd: ROOT, stdio: 'inherit' });
    console.log('✅ Android sync complete — versionCode ' + vCode + ', install over previous APK without uninstall');
  } catch (e) {
    console.error('⚠️  cap sync failed:', e.message);
    console.log('Run manually: npx cap sync android');
  }

  // Ensure launchAutoHide=true so splash never gets stuck
  const assetsConfig = path.join(androidDir, 'app', 'src', 'main', 'assets', 'capacitor.config.json');
  if (fs.existsSync(assetsConfig)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(assetsConfig, 'utf8'));
      cfg.server.url = 'https://www.dubaival.com'; // always load from live site for auto-updates
      if (!cfg.plugins) cfg.plugins = {};
      if (!cfg.plugins.SplashScreen) cfg.plugins.SplashScreen = {};
      cfg.plugins.SplashScreen.launchAutoHide = true;
      fs.writeFileSync(assetsConfig, JSON.stringify(cfg, null, '\t'));
      console.log('✅ Patched assets config: launchAutoHide=true, server.url=https://www.dubaival.com');
    } catch (e) {
      console.error('⚠️  Failed to patch assets config:', e.message);
    }
  }
}
