import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicDir = resolve('public');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#151515"/>
  <rect x="48" y="48" width="416" height="416" rx="80" fill="#f7f4ee"/>
  <text
    x="256"
    y="292"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="132"
    font-weight="600"
    letter-spacing="-10"
    fill="#151515"
  >h2m</text>
  <path
    d="M154 342H358"
    stroke="#2f4f46"
    stroke-width="18"
    stroke-linecap="round"
  />
</svg>
`.trim();

await mkdir(publicDir, { recursive: true });

await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(resolve(publicDir, 'pwa-192x192.png'));

await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(resolve(publicDir, 'pwa-512x512.png'));

await sharp(Buffer.from(svg))
  .resize(180, 180)
  .png()
  .toFile(resolve(publicDir, 'apple-touch-icon.png'));

await sharp(Buffer.from(svg)).resize(64, 64).png().toFile(resolve(publicDir, 'favicon.png'));
