/**
 * Script to generate PWA icons
 *
 * Usage: node scripts/generate-icons.js
 *
 * This script generates PNG icons from the SVG favicon.
 * Requires: sharp (npm install sharp --save-dev)
 *
 * If sharp is not available, you can generate icons manually:
 * 1. Open public/favicon.svg in a browser
 * 2. Use a tool like https://realfavicongenerator.net/
 * 3. Save as PNG in the following sizes:
 *    - icon-192.png (192x192)
 *    - icon-512.png (512x512)
 *    - icon-maskable.png (512x512, with padding for safe area)
 *    - apple-touch-icon.png (180x180)
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.log('Sharp is not installed. Installing...');
  console.log('Run: npm install sharp --save-dev');
  console.log('');
  console.log('Or generate icons manually using the SVG file at public/favicon.svg');
  console.log('Required sizes:');
  console.log('  - icon-192.png (192x192)');
  console.log('  - icon-512.png (512x512)');
  console.log('  - icon-maskable.png (512x512)');
  console.log('  - apple-touch-icon.png (180x180)');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate standard icons
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name}`);
  }

  // Generate maskable icon (with padding)
  // Maskable icons need a safe area, so we add padding
  const maskableSize = 512;
  const safeArea = Math.floor(maskableSize * 0.1); // 10% padding

  await sharp(svgBuffer)
    .resize(maskableSize - safeArea * 2, maskableSize - safeArea * 2)
    .extend({
      top: safeArea,
      bottom: safeArea,
      left: safeArea,
      right: safeArea,
      background: '#3b82f6'
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));
  console.log('Generated icon-maskable.png');

  console.log('');
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
