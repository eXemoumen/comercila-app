const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceImage = 'appicontopfresh-removebg-preview.png';

// Android icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Foreground icon sizes (for adaptive icons, slightly larger)
const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const androidResPath = 'android/app/src/main/res';

async function generateIcons() {
  console.log('Generating Android icons from:', sourceImage);

  for (const [folder, size] of Object.entries(iconSizes)) {
    const outputPath = path.join(androidResPath, folder);
    
    // Generate ic_launcher.png
    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputPath, 'ic_launcher.png'));
    console.log(`Created ${folder}/ic_launcher.png (${size}x${size})`);

    // Generate ic_launcher_round.png
    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputPath, 'ic_launcher_round.png'));
    console.log(`Created ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generate foreground icons for adaptive icons
  for (const [folder, size] of Object.entries(foregroundSizes)) {
    const outputPath = path.join(androidResPath, folder);
    
    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outputPath, 'ic_launcher_foreground.png'));
    console.log(`Created ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }

  console.log('\nAndroid icons generated successfully!');
}

generateIcons().catch(console.error);
