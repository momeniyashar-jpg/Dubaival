const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const BG = '#070B14';
const GOLD = '#C9A84C';

function createIconSVG(size) {
  const r = Math.round(size * 0.167);
  const fs1 = Math.round(size * 0.375);
  const fs2 = Math.round(size * 0.083);
  const cx = size / 2;
  const cy1 = Math.round(size * 0.5625);
  const cy2 = Math.round(size * 0.729);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" fill="${BG}"/>
    <rect x="${Math.round(size*0.042)}" y="${Math.round(size*0.042)}" width="${Math.round(size*0.917)}" height="${Math.round(size*0.917)}" rx="${Math.round(r*0.8)}" fill="none" stroke="${GOLD}" stroke-width="${Math.max(2,Math.round(size*0.006))}" opacity="0.3"/>
    <text x="${cx}" y="${cy1}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${fs1}" fill="${GOLD}">DV</text>
    <text x="${cx}" y="${cy2}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="${fs2}" fill="${GOLD}" opacity="0.6">AI</text>
  </svg>`;
}

function createRoundIconSVG(size) {
  const r = size / 2;
  const fs1 = Math.round(size * 0.375);
  const fs2 = Math.round(size * 0.083);
  const cy1 = Math.round(size * 0.5625);
  const cy2 = Math.round(size * 0.729);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${r}" cy="${r}" r="${r}" fill="${BG}"/>
    <circle cx="${r}" cy="${r}" r="${Math.round(r*0.92)}" fill="none" stroke="${GOLD}" stroke-width="${Math.max(2,Math.round(size*0.006))}" opacity="0.3"/>
    <text x="${r}" y="${cy1}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${fs1}" fill="${GOLD}">DV</text>
    <text x="${r}" y="${cy2}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="${fs2}" fill="${GOLD}" opacity="0.6">AI</text>
  </svg>`;
}

function createSplashSVG(w, h) {
  const iconSz = Math.min(w, h) * 0.25;
  const fs1 = Math.round(iconSz * 0.5);
  const fs2 = Math.round(iconSz * 0.15);
  const fs3 = Math.round(iconSz * 0.1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${BG}"/>
    <text x="${w/2}" y="${h/2 - iconSz*0.1}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${fs1}" fill="${GOLD}">DubAIVal</text>
    <text x="${w/2}" y="${h/2 + iconSz*0.25}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="${fs2}" fill="${GOLD}" opacity="0.6">AI Property Valuation</text>
    <text x="${w/2}" y="${h - 60}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="300" font-size="${fs3}" fill="${GOLD}" opacity="0.3">dubaival.com</text>
  </svg>`;
}

async function main() {
  const iconSizes = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
  ];

  console.log('Generating Android icons...\n');

  for (const { name, size } of iconSizes) {
    const dir = path.join(ANDROID_RES, name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(Buffer.from(createIconSVG(size)))
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));
    console.log('  ' + name + '/ic_launcher.png (' + size + 'x' + size + ')');

    await sharp(Buffer.from(createRoundIconSVG(size)))
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));
    console.log('  ' + name + '/ic_launcher_round.png');

    await sharp(Buffer.from(createIconSVG(size)))
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
    console.log('  ' + name + '/ic_launcher_foreground.png');
  }

  console.log('\nGenerating splash screens...\n');

  const splashSizes = [
    { name: 'drawable', w: 480, h: 800 },
    { name: 'drawable-land-hdpi', w: 800, h: 480 },
    { name: 'drawable-land-mdpi', w: 480, h: 320 },
    { name: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { name: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { name: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
    { name: 'drawable-port-hdpi', w: 480, h: 800 },
    { name: 'drawable-port-mdpi', w: 320, h: 480 },
    { name: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { name: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { name: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  ];

  for (const { name, w, h } of splashSizes) {
    const dir = path.join(ANDROID_RES, name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(Buffer.from(createSplashSVG(w, h)))
      .png()
      .toFile(path.join(dir, 'splash.png'));
    console.log('  ' + name + '/splash.png (' + w + 'x' + h + ')');
  }

  const wwwDir = path.join(__dirname, '..', 'www');
  await sharp(Buffer.from(createIconSVG(512)))
    .png()
    .toFile(path.join(wwwDir, 'icon-512.png'));
  console.log('\n  www/icon-512.png (for PWA)');

  await sharp(Buffer.from(createIconSVG(192)))
    .png()
    .toFile(path.join(wwwDir, 'icon-192.png'));
  console.log('  www/icon-192.png (for PWA)');

  console.log('\n✅ All icons and splash screens generated');
}

main().catch(console.error);
