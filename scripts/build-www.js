const fs = require('fs');
const path = require('path');

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

copyFile(path.join(ROOT, 'index-6.html'), path.join(WWW, 'index.html'));

// Apply Capacitor-specific modifications to index.html
let html = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');

// Viewport: add viewport-fit for notch devices
html = html.replace(
  'width=device-width, initial-scale=1.0',
  'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no'
);

// Add native app CSS fixes
html = html.replace(
  '</head>',
  `<style>
html,body{overflow-x:hidden!important;overscroll-behavior:none!important;touch-action:pan-y!important;-webkit-text-size-adjust:100%!important;}
*{-webkit-user-drag:none;-webkit-touch-callout:none;}
#app{overflow-x:hidden!important;max-width:100vw!important;}
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
  document.addEventListener('DOMContentLoaded',function(){
    document.body.style.paddingTop='env(safe-area-inset-top)';
    document.body.style.paddingBottom='env(safe-area-inset-bottom)';
    if(window.Capacitor.Plugins.StatusBar){
      var SB=window.Capacitor.Plugins.StatusBar;
      SB.setBackgroundColor({color:'#070B14'}).catch(function(){});
      SB.setStyle({style:'DARK'}).catch(function(){});
      SB.setOverlaysWebView({overlay:false}).catch(function(){});
    }
    if(window.Capacitor.Plugins.Keyboard){
      window.Capacitor.Plugins.Keyboard.setResizeMode({mode:'body'}).catch(function(){});
    }
    if(window.Capacitor.Plugins.SplashScreen){
      window.Capacitor.Plugins.SplashScreen.hide().catch(function(){});
    }
    if(window.Capacitor.Plugins.Share){
      window.nativeShare=function(o){
        window.Capacitor.Plugins.Share.share({title:o.title||'DubAIVal',text:o.text||'',url:o.url||'https://www.dubaival.com',dialogTitle:'Share via'}).catch(function(){});
      };
    }
    document.addEventListener('backbutton',function(e){
      e.preventDefault();
      if(typeof handleBackButton==='function')handleBackButton();
      else if(window.history.length>1)window.history.back();
    });
    render();
  });
})();
</script>
</body>`
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

console.log('\n✅ Build complete — ' + fs.readdirSync(path.join(WWW, 'js')).length + ' JS files copied');
