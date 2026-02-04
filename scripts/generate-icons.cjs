/**
 * Script to generate PWA icons
 *
 * Usage: node scripts/generate-icons.js
 *
 * This script generates PNG icons from a source image.
 * Place your source image at public/icon-source.png
 *
 * Requires: sharp (npm install sharp --save-dev)
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.log('Sharp is not installed.');
  console.log('Run: npm install sharp --save-dev');
  console.log('');
  console.log('Then run this script again.');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const sourceImage = path.join(publicDir, 'icon-source.png');

async function generateIcons() {
  if (!fs.existsSync(sourceImage)) {
    console.log('Source image not found!');
    console.log('Please place your icon at: public/icon-source.png');
    console.log('');
    console.log('The image should be at least 512x512 pixels.');
    process.exit(1);
  }

  console.log('Generating icons from:', sourceImage);
  console.log('');

  // Generate standard icons
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.png', size: 32 },
  ];

  for (const { name, size } of sizes) {
    await sharp(sourceImage)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }

  // Generate maskable icon (with padding for safe area)
  const maskableSize = 512;
  const safeArea = Math.floor(maskableSize * 0.1); // 10% padding

  await sharp(sourceImage)
    .resize(maskableSize - safeArea * 2, maskableSize - safeArea * 2, { fit: 'cover' })
    .extend({
      top: safeArea,
      bottom: safeArea,
      left: safeArea,
      right: safeArea,
      background: { r: 74, g: 144, b: 226, alpha: 1 } // Blue background
    })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));
  console.log('Generated icon-maskable.png (512x512 maskable)');

  console.log('');
  console.log('All icons generated successfully!');
  console.log('');
  console.log('Generated files:');
  console.log('  - icon-192.png');
  console.log('  - icon-512.png');
  console.log('  - icon-maskable.png');
  console.log('  - apple-touch-icon.png');
  console.log('  - favicon.png');
}

generateIcons().catch(console.error);
