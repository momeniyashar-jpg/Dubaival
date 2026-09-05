# -*- coding: utf-8 -*-
"""Build the high-resolution companion gallery (web artifact) for the PDF."""

import os
import sys
import base64
import html

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content import ARTWORKS, COVER, COMPILED_BY

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(HERE, "..", "assets", "images")
OUT_PATH = os.path.join(HERE, "..", "gallery.html")


def data_uri(no):
    path = os.path.join(IMG_DIR, f"{no}.jpg")
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def esc(s):
    return html.escape(s, quote=True)


sections = []
for art in ARTWORKS:
    uri = data_uri(art["no"])
    sections.append(f"""
    <section class="plate" id="art-{art['no']}">
      <p class="kicker">PLATE {art['no']}</p>
      <blockquote class="quote">
        <p class="en">&ldquo;{esc(art['quote_en'].strip('“”'))}&rdquo;</p>
        <p class="fa">&laquo;{esc(art['quote_fa'].strip('«»'))}&raquo;</p>
      </blockquote>
      <button class="frame" aria-label="Zoom {esc(art['title'])}">
        <img id="img-{art['no']}" src="{uri}" alt="{esc(art['title'])} by {esc(art['artist'])}" loading="lazy">
        <span class="zoom-hint">تصویر را برای بزرگ‌نمایی لمس کنید ⤢</span>
      </button>
      <p class="figures">{esc(art['figures_fa'])}</p>
      <h2 class="title">{esc(art['title'])}</h2>
      <p class="meta">{esc(art['artist'])} &nbsp;&middot;&nbsp; {esc(art['date'])} &nbsp;&middot;&nbsp; {esc(art['location'])}</p>
      <a class="view-link" data-src-of="img-{art['no']}" href="#" target="_blank" rel="noopener">مشاهده تصویر با کیفیت کامل در برگه‌ی جدید ↗</a>
    </section>""")

HTML = f"""<title>مسیح در آینه‌ی هنر</title>
<meta name="description" content="گالری تصاویر با کیفیت کامل، همراه نسخه‌ی PDF مسیح در آینه‌ی هنر">
<style>
:root {{
  --ivory: #faf6ed;
  --surface: #f1ebdc;
  --ink: #2b2a26;
  --ink-soft: #5f5b4e;
  --gold: #9c7a3c;
  --gold-soft: #c9a85e;
  --hairline: #ded2b2;
  --overlay: rgba(20, 18, 12, 0.92);
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --ivory: #15130f;
    --surface: #1e1b15;
    --ink: #f2ecdd;
    --ink-soft: #b9af98;
    --gold: #d4af6a;
    --gold-soft: #8c6c36;
    --hairline: #3a3427;
    --overlay: rgba(0, 0, 0, 0.95);
  }}
}}
:root[data-theme="dark"] {{
  --ivory: #15130f;
  --surface: #1e1b15;
  --ink: #f2ecdd;
  --ink-soft: #b9af98;
  --gold: #d4af6a;
  --gold-soft: #8c6c36;
  --hairline: #3a3427;
  --overlay: rgba(0, 0, 0, 0.95);
}}

* {{ box-sizing: border-box; }}
body {{
  background: var(--ivory);
  color: var(--ink);
  font-family: 'EB Garamond', Georgia, 'Times New Roman', serif;
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
  padding: 0 20px 80px;
}}
h1, h2, .kicker, .display {{
  font-family: 'Cormorant Garamond', Georgia, serif;
}}

header.masthead {{
  max-width: 720px;
  margin: 0 auto;
  padding: 72px 0 48px;
  text-align: center;
}}
header.masthead .eyebrow {{
  font-size: 13px;
  letter-spacing: 0.28em;
  color: var(--gold);
  text-transform: uppercase;
  margin: 0 0 18px;
}}
header.masthead h1 {{
  font-size: clamp(38px, 6vw, 58px);
  font-weight: 600;
  margin: 0 0 10px;
  text-wrap: balance;
  direction: rtl;
}}
header.masthead .subtitle-fa {{
  font-size: 20px;
  color: var(--ink-soft);
  direction: rtl;
  margin: 0 0 22px;
}}
header.masthead hr {{
  width: 64px;
  border: none;
  border-top: 1px solid var(--gold-soft);
  margin: 0 auto 22px;
}}
header.masthead .subtitle-en {{
  font-style: italic;
  font-size: 19px;
  margin: 0 0 6px;
}}
header.masthead .note {{
  font-size: 15px;
  color: var(--ink-soft);
  direction: rtl;
  max-width: 560px;
  margin: 28px auto 0;
}}

main {{
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 64px;
}}

.plate {{
  text-align: center;
  padding-top: 40px;
  border-top: 1px solid var(--hairline);
  direction: rtl;
}}
.plate:first-child {{ border-top: none; padding-top: 0; }}

.kicker {{
  direction: ltr;
  font-size: 13px;
  letter-spacing: 0.3em;
  color: var(--gold);
  text-transform: uppercase;
  margin: 0 0 14px;
}}

.quote {{ margin: 0 0 22px; }}
.quote .en {{
  direction: ltr;
  font-style: italic;
  color: var(--ink-soft);
  margin: 0 0 6px;
  font-size: 17px;
}}
.quote .fa {{ color: var(--ink-soft); margin: 0; font-size: 17px; }}

.frame {{
  display: block;
  width: 100%;
  max-width: 460px;
  margin: 0 auto 16px;
  padding: 0;
  border: 1px solid var(--hairline);
  background: var(--surface);
  cursor: zoom-in;
  position: relative;
  border-radius: 2px;
}}
.frame img {{
  display: block;
  width: 100%;
  height: auto;
}}
.frame .zoom-hint {{
  display: block;
  direction: rtl;
  font-family: 'EB Garamond', serif;
  font-size: 13px;
  color: var(--ink-soft);
  padding: 8px 0 2px;
}}

.figures {{
  font-size: 14.5px;
  color: var(--ink-soft);
  max-width: 480px;
  margin: 0 auto 20px;
}}

.title {{
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 6px;
  direction: ltr;
}}
.meta {{
  direction: ltr;
  font-style: italic;
  color: var(--ink-soft);
  font-size: 15px;
  margin: 0 0 16px;
}}
.view-link {{
  display: inline-block;
  color: var(--gold);
  text-decoration: none;
  border-bottom: 1px solid var(--gold-soft);
  font-size: 15px;
  padding-bottom: 1px;
}}
.view-link:hover {{ color: var(--ink); border-color: var(--ink); }}

footer {{
  max-width: 640px;
  margin: 64px auto 0;
  text-align: center;
  border-top: 1px solid var(--hairline);
  padding-top: 28px;
  color: var(--ink-soft);
  font-style: italic;
  font-size: 15px;
}}

/* Lightbox */
#lightbox {{
  position: fixed;
  inset: 0;
  background: var(--overlay);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}}
#lightbox.open {{ display: flex; }}
#lightbox img {{
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: zoom-in;
  transition: transform 0.2s ease;
  transform-origin: center center;
}}
#lightbox img.zoomed {{
  cursor: zoom-out;
  max-width: none;
  max-height: none;
  width: auto;
  height: auto;
  transform: scale(1);
}}
#lightbox .close {{
  position: absolute;
  top: 20px;
  right: 20px;
  color: #f2ecdd;
  font-family: 'EB Garamond', serif;
  font-size: 15px;
  letter-spacing: 0.1em;
  background: none;
  border: 1px solid rgba(242,236,221,0.4);
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 2px;
}}
#lightbox .hint {{
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(242,236,221,0.7);
  font-size: 13px;
  direction: rtl;
}}

@media (max-width: 480px) {{
  body {{ font-size: 16.5px; }}
  header.masthead {{ padding: 48px 0 36px; }}
}}
</style>

<header class="masthead">
  <p class="eyebrow">Christian Art Collection</p>
  <h1>{esc(COVER['title_fa'])}</h1>
  <p class="subtitle-fa">{esc(COVER['subtitle_fa'])}</p>
  <hr>
  <p class="subtitle-en">{esc(COVER['title_en'])}</p>
  <p class="note">گالری تصاویر با کیفیت کامل و قابل‌بزرگنمایی، همراه نسخه‌ی PDF این مجموعه. روی هر تصویر ضربه بزنید تا در اندازه‌ی کامل باز شود.</p>
</header>

<main>
{''.join(sections)}
</main>

<footer>{esc(COMPILED_BY)}</footer>

<div id="lightbox" role="dialog" aria-modal="true">
  <button class="close" id="lb-close">بستن ✕</button>
  <img id="lb-img" src="" alt="">
  <p class="hint">برای بزرگ‌نمایی به اندازه‌ی واقعی، روی تصویر کلیک کنید</p>
</div>

<script>
(function() {{
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var closeBtn = document.getElementById('lb-close');

  document.querySelectorAll('.frame').forEach(function(btn) {{
    btn.addEventListener('click', function() {{
      var srcImg = btn.querySelector('img');
      lbImg.src = srcImg.src;
      lbImg.alt = srcImg.alt;
      lbImg.classList.remove('zoomed');
      lb.classList.add('open');
    }});
  }});

  document.querySelectorAll('.view-link[data-src-of]').forEach(function(a) {{
    var img = document.getElementById(a.getAttribute('data-src-of'));
    if (img) a.href = img.src;
  }});

  lbImg.addEventListener('click', function(e) {{
    e.stopPropagation();
    lbImg.classList.toggle('zoomed');
  }});

  function close() {{
    lb.classList.remove('open');
    lbImg.src = '';
    lbImg.classList.remove('zoomed');
  }}
  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', function(e) {{
    if (e.target === lb) close();
  }});
  document.addEventListener('keydown', function(e) {{
    if (e.key === 'Escape') close();
  }});
}})();
</script>
"""

with open(OUT_PATH, "w", encoding="utf-8") as f:
    f.write(HTML)

print("Built:", OUT_PATH, f"({os.path.getsize(OUT_PATH)/1024/1024:.2f} MB)")
