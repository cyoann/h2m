import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicDir = resolve('public');

const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="h2m">
  <rect width="512" height="512" fill="#101214"/>
  <rect x="30" y="30" width="452" height="452" fill="none" stroke="#f1ece4" stroke-width="18"/>
  <rect x="112" y="112" width="288" height="288" fill="#e0b84f" stroke="#f1ece4" stroke-width="14"/>
  <text
    x="256"
    y="284"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Menlo, Consolas, 'Liberation Mono', monospace"
    font-size="92"
    font-weight="800"
    letter-spacing="-4"
    fill="#111111"
  >H2M</text>
</svg>
`.trim();

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="h2m favicon">
  <rect width="64" height="64" fill="#e0b84f"/>
  <rect x="3" y="3" width="58" height="58" fill="none" stroke="#111111" stroke-width="4"/>
  <path
    d="M18 18L30 32L18 46"
    fill="none"
    stroke="#111111"
    stroke-width="7"
    stroke-linecap="square"
    stroke-linejoin="miter"
  />
  <path
    d="M37 21H47M37 32H47M37 43H47"
    fill="none"
    stroke="#111111"
    stroke-width="6"
    stroke-linecap="square"
  />
</svg>
`.trim();

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, 'favicon.svg'), faviconSvg);

await sharp(Buffer.from(appIconSvg)).resize(192, 192).png().toFile(resolve(publicDir, 'pwa-192x192.png'));
await sharp(Buffer.from(appIconSvg)).resize(512, 512).png().toFile(resolve(publicDir, 'pwa-512x512.png'));
await sharp(Buffer.from(appIconSvg))
  .resize(180, 180)
  .png()
  .toFile(resolve(publicDir, 'apple-touch-icon.png'));
await sharp(Buffer.from(faviconSvg)).resize(64, 64).png().toFile(resolve(publicDir, 'favicon.png'));
