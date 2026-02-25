# Image Optimization Script

This directory contains a script to optimize images for WebP performance and generate base64 data URIs. This is especially useful for embedding critical images (like splash screens) directly into React/Next.js components to guarantee instant loading without any network round-trip.

## Prerequisites

The script uses `sharp` for super-fast image processing. It should already be installed as a dependency in the project. If not:

```bash
npm install sharp
```

## Usage

Run the script from the root of your project using Node.js:

```bash
node scripts/optimize-image.js <input-path> [output-path] [--base64]
```

### Basic Optimization

Compress an image into a web-ready WebP file (automatically limits width to 750px and applies high-effort compression):

```bash
node scripts/optimize-image.js public/splash-bg.jpg
```

_This will create `public/splash-bg-opt.webp` next to the original file._

### Specify Output Path

To explicitly name your optimized file:

```bash
node scripts/optimize-image.js public/splash-bg.jpg public/my-custom-name.webp
```

### Base64 Generation for Instant Load / Splash Screens

To generate a text file containing the direct Data URI that you can copy and paste directly into an `<img src="...">` tag:

```bash
node scripts/optimize-image.js public/splash-bg.webp --base64
```

_This will optimize the image and also create a `public/splash-bg-base64.txt` file containing the base64 string._

## Enterprise Settings Used

- **Format**: `WebP`
- **Quality**: `65` (High visual quality with small footprint)
- **Effort**: `6` (Maximum compression effort for the smallest file size)
- **Max Width**: `750px` (Maintains aspect ratio, prevents massive files on devices while remaining Retina-ready for mobile).
