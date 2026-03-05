/**
 * generate-icons.js
 * Generates PWA icons in all required sizes from an SVG template.
 * Run: node scripts/generate-icons.js
 * Requires: sharp  (npm install --save-dev sharp)
 */

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "icons");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

/**
 * Builds an SVG icon at the given size.
 * Colours match the app theme: background #0f172a, accent #3b82f6.
 */
function buildSvg(size) {
  const padding = Math.round(size * 0.15);
  const fontSize = Math.round(size * 0.32);
  const radius = Math.round(size * 0.18);

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#0f172a" rx="${radius}" ry="${radius}"/>
  <!-- Accent bar top-left -->
  <rect x="${padding}" y="${padding}" width="${Math.round(size * 0.08)}" height="${Math.round(size * 0.45)}" fill="#3b82f6" rx="3"/>
  <!-- "PI" text -->
  <text
    x="${size / 2 + Math.round(size * 0.04)}"
    y="${size / 2 + Math.round(fontSize * 0.36)}"
    font-family="'Segoe UI', Arial, sans-serif"
    font-weight="700"
    font-size="${fontSize}"
    fill="#f1f5f9"
    text-anchor="middle"
  >PI</text>
</svg>
  `);
}

let generated = 0;
for (const size of SIZES) {
  const outPath = join(OUT_DIR, `icon-${size}x${size}.png`);
  await sharp(buildSvg(size), { density: 144 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`  ✔  icon-${size}x${size}.png`);
  generated++;
}

console.log(`\nGenerated ${generated} icons → public/icons/`);
