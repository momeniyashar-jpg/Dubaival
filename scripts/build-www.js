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

/* Prevent any child from exceeding viewport width */
#app,#app>div,#app>div>div,.dv-content,.dv-content>div,.dv-content>div>div,.dv-content>div>div>div{
  max-width:100%!important;overflow-x:hidden!important;word-break:break-word!important}
/* Force ALL elements to never exceed screen width */
*{box-sizing:border-box!important}
html,body,#app,.dv-layout,.dv-main,.dv-content{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
/* Flex/grid children: allow shrinking below content size */
.dv-layout>*,.dv-main>*,.dv-content>*,.dv-content>div>*{min-width:0!important;max-width:100%!important}
/* Hero card decorations: clip within parent */
.dv-hero-cards-container,.dv-hero-grid,[style*="overflow: hidden"],[style*="overflow:hidden"]{overflow:hidden!important}

/* Bottom tabs: account for safe area on notch phones */
.dv-bottom-tabs{
  height:calc(56px + env(safe-area-inset-bottom))!important;
  padding-bottom:env(safe-area-inset-bottom)!important;
}
/* Extra padding on main when bottom tabs are visible (mobile) */
@media(max-width:768px){
  .dv-main{padding-bottom:calc(64px + env(safe-area-inset-bottom))!important}
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
  [style*="grid-template-columns"]{
    grid-template-columns:repeat(auto-fit,minmax(min(140px,100%),1fr))!important;
  }
  .dv-subtabs{grid-template-columns:unset!important}
}

/* Absolutely prevent ANY element from exceeding viewport */
*{max-width:100%!important}
html,body,#app,.dv-layout,.dv-main,.dv-content,
#app>div,#app>div>div,.dv-content>div{
  max-width:100%!important;overflow-x:hidden!important;
}

/* Status bar space (Android with overlay) */
.dv-native-statusbar-pad{height:env(safe-area-inset-top);background:#070B14;position:fixed;top:0;left:0;right:0;z-index:9999}
</style>
</head>`
);

// Replace render() with Capacitor-aware bootstrap
html = html.replace(
  '<script>render();</script>\n</body>',
  `<script>
(function(){
  var isNative=typeof window.Capacitor!=='undefined'&&window.Capacitor.isNativePlatform();
  window.IS_NATIVE_APP=isNative;
  if(!isNative){render();return;}

  function capBoot(){
    var P=window.Capacitor.Plugins;

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

    // SplashScreen: hide after render
    if(P.SplashScreen){
      setTimeout(function(){P.SplashScreen.hide().catch(function(){});},500);
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

    // Back button: use History API (matches web SPA behavior)
    if(P.App){
      P.App.addListener('backButton',function(ev){
        if(window.history.length>1){
          window.history.back();
        }else{
          if(ev.canGoBack===false){
            P.App.exitApp();
          }
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

    // DEBUG: Show viewport info as floating banner (TEMPORARY — remove after diagnosis)
    setTimeout(function(){
      var vw=document.documentElement.clientWidth;
      var sw=document.documentElement.scrollWidth;
      var bsw=document.body.scrollWidth;
      var iw=window.innerWidth;
      var dpr=window.devicePixelRatio;
      var scw=screen.width;
      var overflowEls=0;
      document.querySelectorAll('*').forEach(function(el){
        var r=el.getBoundingClientRect();
        if(r.right>vw+2&&r.width>0&&el.offsetParent!==null){
          var p=el.parentElement,c=false;
          while(p&&p!==document.body){
            if(getComputedStyle(p).overflowX==='hidden'&&p.getBoundingClientRect().right<=vw+2){c=true;break;}
            p=p.parentElement;
          }
          if(!c)overflowEls++;
        }
      });
      var dbg=document.createElement('div');
      dbg.style.cssText='position:fixed;top:60px;left:4px;z-index:999999;background:rgba(0,0,0,0.9);color:#0f0;font:bold 11px monospace;padding:8px;border-radius:8px;border:1px solid #0f0;pointer-events:none;';
      dbg.innerHTML='VW:'+vw+' SW:'+sw+' BSW:'+bsw+'<br>innerW:'+iw+' DPR:'+dpr+' screen:'+scw+'<br>overflow:'+overflowEls+(sw>vw?' ❌OVERFLOW':'  ✅OK');
      document.body.appendChild(dbg);
    },2000);

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
  console.log('\n📱 Syncing to Android project...');
  try {
    execSync('npx cap sync android', { cwd: ROOT, stdio: 'inherit' });
    console.log('✅ Android sync complete — APK will use the latest files');
  } catch (e) {
    console.error('⚠️  cap sync failed:', e.message);
    console.log('Run manually: npx cap sync android');
  }
}
