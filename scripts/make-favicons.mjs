import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('public/favicon.svg');
await sharp(svg, { density: 300 })
  .resize(180, 180, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .png({ compressionLevel: 9 })
  .toFile('public/apple-touch-icon.png');

await sharp(svg, { density: 300 })
  .resize(32, 32, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .png({ compressionLevel: 9 })
  .toFile('public/favicon-32x32.png');

await sharp(svg, { density: 300 })
  .resize(16, 16, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .png({ compressionLevel: 9 })
  .toFile('public/favicon-16x16.png');

const a = await sharp('public/apple-touch-icon.png').metadata();
const b = await sharp('public/favicon-32x32.png').metadata();
const c = await sharp('public/favicon-16x16.png').metadata();
console.log('apple-touch-icon.png:', a.width, 'x', a.height);
console.log('favicon-32x32.png:', b.width, 'x', b.height);
console.log('favicon-16x16.png:', c.width, 'x', c.height);
