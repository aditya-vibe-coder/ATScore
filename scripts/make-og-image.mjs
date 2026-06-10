import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('public/og-image.svg');
await sharp(svg, { density: 72 })
  .resize(1200, 630, { fit: 'cover' })
  .png({ compressionLevel: 9, quality: 90 })
  .toFile('public/og-image.png');

const out = await sharp('public/og-image.png').metadata();
const stat = await import('fs').then(m => m.statSync('public/og-image.png'));
console.log('Output PNG:', out.width, 'x', out.height, `(${(stat.size/1024).toFixed(0)} KB)`);
