// Generates every raster brand asset (home-screen icons, favicons, iOS splash screens)
// from one vector definition, matching the Lunara icon on the Lumenari home page.  Run with:  npm run assets
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../public/', import.meta.url).pathname;
mkdirSync(OUT + 'splash', { recursive: true });

const orbit = (rx, ry) => `M${-rx} 0a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

/** The Lunara mark: a crescent moon held by three orbits, each carrying one small light. */
const glyph = (cx, cy, s) => `
  <g transform="translate(${cx} ${cy}) scale(${s})">
    <circle r="360" fill="url(#halo)"/>
    <g fill="none" stroke="#e5ccff" stroke-width="5">
      <path d="${orbit(300, 112)}" stroke-opacity=".42"/>
      <path d="${orbit(300, 112)}" transform="rotate(60)" stroke-opacity=".34"/>
      <path d="${orbit(300, 112)}" transform="rotate(120)" stroke-opacity=".26"/>
    </g>
    <g fill="#f5e9ff">
      <circle cx="300" cy="0" r="15" filter="url(#bloom)"/>
      <circle cx="-150" cy="-260" r="12" transform="rotate(0)" filter="url(#bloom)"/>
      <circle cx="-150" cy="260" r="13" filter="url(#bloom)"/>
    </g>
    <g mask="url(#bite)"><circle r="136" fill="url(#moon)" filter="url(#bloom)"/></g>
    <circle cx="168" cy="-172" r="9" fill="#fff" opacity=".85"/>
    <circle cx="-226" cy="150" r="7" fill="#fff" opacity=".7"/>
  </g>`;

const defs = `
  <defs>
    <radialGradient id="sky" cx="50%" cy="42%" r="75%">
      <stop offset="0" stop-color="#4f2a8f"/><stop offset=".55" stop-color="#1c0e3b"/><stop offset="1" stop-color="#06030f"/>
    </radialGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#d5a5ff" stop-opacity=".5"/><stop offset=".55" stop-color="#8b52d6" stop-opacity=".16"/><stop offset="1" stop-color="#8b52d6" stop-opacity="0"/></radialGradient>
    <linearGradient id="moon" x1=".15" y1=".1" x2=".85" y2=".95"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#ead2ff"/><stop offset="1" stop-color="#b48be6"/></linearGradient>
    <mask id="bite"><rect x="-200" y="-200" width="400" height="400" fill="#fff"/><circle cx="62" cy="-34" r="116" fill="#000"/></mask>
    <filter id="bloom" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;

const dust = (w, h, n, seed0) => {
  // deterministic stardust so the art is identical on every build
  let seed = seed0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: n }, () => {
    const x = rnd() * w, y = rnd() * h, r = 1.2 + rnd() * 3.2;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#e8d3ff" opacity="${(0.15 + rnd() * 0.45).toFixed(2)}"/>`;
  }).join('');
};

const iconSvg = ({ size = 1024, glyphScale = 1, rounded = false } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}
  <rect width="1024" height="1024" ${rounded ? 'rx="228"' : ''} fill="url(#sky)"/>
  ${dust(1024, 1024, 34, 7)}
  ${glyph(512, 512, 0.98 * glyphScale)}
</svg>`;

const splashSvg = (w, h) => {
  const s = (Math.min(w, h) * 0.46) / 1024 / 0.98;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${dust(w, h, 46, 13)}
  ${glyph(w / 2, h * 0.45, s)}
</svg>`;
};

const png = (svg, file, w, h) => sharp(Buffer.from(svg)).resize(w, h).flatten({ background: '#06030f' }).png({ compressionLevel: 9 }).toFile(OUT + file);

// --- icons --------------------------------------------------------------------
writeFileSync(OUT + 'favicon.svg', iconSvg({ rounded: true }).trim());
await png(iconSvg(), 'apple-touch-icon.png', 180, 180);           // iOS Home Screen (opaque, iOS rounds it)
await png(iconSvg(), 'icon-192.png', 192, 192);
await png(iconSvg(), 'icon-512.png', 512, 512);
await png(iconSvg({ glyphScale: 0.72 }), 'icon-maskable-512.png', 512, 512); // Android adaptive-icon safe zone
await png(iconSvg({ rounded: true }), 'favicon-32.png', 32, 32);

// --- iOS splash screens (portrait, device pixels) ---------------------------------
const devices = [
  [1320, 2868], [1206, 2622], [1260, 2736], [1290, 2796], [1179, 2556], [1284, 2778],
  [1170, 2532], [1125, 2436], [1242, 2688], [828, 1792], [1242, 2208], [750, 1334], [640, 1136],
];
for (const [pw, ph] of devices) await png(splashSvg(pw, ph), `splash/splash-${pw}x${ph}.png`, pw, ph);
console.log('assets written:', devices.length, 'splash screens + icons');
