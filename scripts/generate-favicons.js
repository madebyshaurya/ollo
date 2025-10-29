/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateFavicons() {
    const logoPath = path.join(__dirname, '../public/logo.png');
    const outputDir = path.join(__dirname, '../public');

    // Check if logo.png exists
    if (!fs.existsSync(logoPath)) {
        console.error('logo.png not found in public directory');
        return;
    }

    // Define favicon sizes and their output paths
    const favicons = [
        { size: 16, name: 'icon-16x16.png' },
        { size: 32, name: 'icon-32x32.png' },
        { size: 180, name: 'apple-touch-icon.png' },
        { size: 192, name: 'icon-192x192.png' },
        { size: 512, name: 'icon-512x512.png' },
    ];

    console.log('Generating rounded favicons...');

    for (const favicon of favicons) {
        const outputPath = path.join(outputDir, favicon.name);

        await sharp(logoPath)
            .resize(favicon.size, favicon.size)
            .png()
            .toFile(outputPath);

        console.log(`Generated ${favicon.name} (${favicon.size}x${favicon.size})`);
    }

    console.log('All favicons generated successfully!');
}

generateFavicons().catch(console.error);
