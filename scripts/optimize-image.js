#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 1) {
    console.error('Usage: node scripts/optimize-image.js <input-path> [output-path] [--base64]');
    console.error('Example: node scripts/optimize-image.js public/splash-bg.webp --base64');
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
let outputPath = args[1] && !args[1].startsWith('--') 
    ? path.resolve(args[1]) 
    : path.resolve(path.dirname(inputPath), path.parse(inputPath).name + '-opt.webp');

const generateBase64 = args.includes('--base64');

if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found at ${inputPath}`);
    process.exit(1);
}

async function optimizeImage() {
    try {
        console.log(`Optimizing: ${inputPath}`);
        
        const originalSize = fs.statSync(inputPath).size;
        
        // This process maintains aspect ratio and limits width to 750px (Retina mobile width)
        const optimized = await sharp(inputPath)
            .resize({ width: 750, withoutEnlargement: true })
            .webp({ quality: 65, effort: 6 })
            .toFile(outputPath);
            
        console.log(`\n✅ Successfully optimized image!`);
        console.log(`- Original Size: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`- New Size: ${(optimized.size / 1024).toFixed(2)} KB`);
        console.log(`- Saved to: ${outputPath}`);

        if (generateBase64) {
            const b64 = fs.readFileSync(outputPath).toString('base64');
            const dataUri = `data:image/webp;base64,${b64}`;
            
            const b64Path = outputPath.replace('.webp', '-base64.txt');
            fs.writeFileSync(b64Path, dataUri, 'utf8');
            console.log(`- Base64 String saved to: ${b64Path}\n`);
        }
        
    } catch (error) {
        console.error('❌ Optimization failed:', error);
        process.exit(1);
    }
}

optimizeImage();
