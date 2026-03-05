/**
 * Generates PNG icons from public/icons/icon.svg for the PWA manifest.
 * Run once with: npm run generate-icons
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const INPUT_SVG = path.join(__dirname, "../public/icons/icon.svg");
const OUTPUT_DIR = path.join(__dirname, "../public/icons");

async function generateIcons() {
  if (!fs.existsSync(INPUT_SVG)) {
    console.error("Source SVG not found:", INPUT_SVG);
    process.exit(1);
  }

  console.log("Generating PWA icons...");

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(INPUT_SVG).resize(size, size).png().toFile(outputPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  console.log("\nAll icons generated successfully in public/icons/");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
