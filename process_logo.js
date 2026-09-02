const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const inputPath = 'C:/Users/musma/.gemini/antigravity-ide/brain/0dd0f98a-f457-4c35-bbfd-f3e1f9cb87db/.user_uploaded/media_1788348386095.jpg';
const outputDir = path.resolve('public');

const buf = fs.readFileSync(inputPath);
const img = jpeg.decode(buf, { useTArray: true });
const { width, height, data } = img;

console.log(`Processing image ${width}x${height}...`);

// 1. Flood fill from borders
const isBg = new Uint8Array(width * height);
const queue = [];

function getBrightness(idx) {
  const r = data[idx * 4];
  const g = data[idx * 4 + 1];
  const b = data[idx * 4 + 2];
  return Math.max(r, g, b);
}

const BG_THRESHOLD = 24;
const FEATHER_THRESHOLD = 50;

for (let x = 0; x < width; x++) {
  queue.push(x);
  queue.push((height - 1) * width + x);
}
for (let y = 0; y < height; y++) {
  queue.push(y * width);
  queue.push(y * width + (width - 1));
}

let head = 0;
while (head < queue.length) {
  const curr = queue[head++];
  if (isBg[curr]) continue;

  const b = getBrightness(curr);
  if (b <= BG_THRESHOLD) {
    isBg[curr] = 1;
    const x = curr % width;
    const y = Math.floor(curr / width);

    if (x > 0 && !isBg[curr - 1]) queue.push(curr - 1);
    if (x < width - 1 && !isBg[curr + 1]) queue.push(curr + 1);
    if (y > 0 && !isBg[curr - width]) queue.push(curr - width);
    if (y < height - 1 && !isBg[curr + width]) queue.push(curr + width);
  }
}

// Create output PNG with alpha
const png = new PNG({ width, height });
let minX = width, maxX = 0, minY = height, maxY = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = y * width + x;
    const p = idx * 4;

    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const bright = Math.max(r, g, b);

    if (isBg[idx]) {
      png.data[p] = 0;
      png.data[p + 1] = 0;
      png.data[p + 2] = 0;
      png.data[p + 3] = 0;
    } else {
      let nearBg = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && isBg[ny * width + nx]) {
            nearBg = true;
            break;
          }
        }
        if (nearBg) break;
      }

      if (nearBg && bright < FEATHER_THRESHOLD) {
        const alphaRatio = Math.max(0, Math.min(1, (bright - BG_THRESHOLD) / (FEATHER_THRESHOLD - BG_THRESHOLD)));
        const alpha = Math.round(alphaRatio * 255);
        if (alpha > 5) {
          const factor = 255 / Math.max(alpha, 1);
          png.data[p] = Math.min(255, Math.round(r * factor));
          png.data[p + 1] = Math.min(255, Math.round(g * factor));
          png.data[p + 2] = Math.min(255, Math.round(b * factor));
          png.data[p + 3] = alpha;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        } else {
          png.data[p] = 0;
          png.data[p + 1] = 0;
          png.data[p + 2] = 0;
          png.data[p + 3] = 0;
        }
      } else {
        png.data[p] = r;
        png.data[p + 1] = g;
        png.data[p + 2] = b;
        png.data[p + 3] = 255;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
}

// Crop to square with padding
const pad = 24;
const cropX = Math.max(0, minX - pad);
const cropY = Math.max(0, minY - pad);
const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);
const maxDim = Math.max(cropW, cropH);

const masterPng = new PNG({ width: maxDim, height: maxDim });
for (let i = 0; i < maxDim * maxDim * 4; i += 4) {
  masterPng.data[i] = 0;
  masterPng.data[i + 1] = 0;
  masterPng.data[i + 2] = 0;
  masterPng.data[i + 3] = 0;
}

const offsetX = Math.floor((maxDim - cropW) / 2);
const offsetY = Math.floor((maxDim - cropH) / 2);

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropX + x;
    const srcY = cropY + y;
    if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = ((y + offsetY) * maxDim + (x + offsetX)) * 4;

      masterPng.data[dstIdx] = png.data[srcIdx];
      masterPng.data[dstIdx + 1] = png.data[srcIdx + 1];
      masterPng.data[dstIdx + 2] = png.data[srcIdx + 2];
      masterPng.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
}

// Downsample function using high-quality area box sampling
function downsample(src, targetSize) {
  const dst = new PNG({ width: targetSize, height: targetSize });
  const scale = src.width / targetSize;

  for (let dy = 0; dy < targetSize; dy++) {
    for (let dx = 0; dx < targetSize; dx++) {
      const startX = dx * scale;
      const endX = (dx + 1) * scale;
      const startY = dy * scale;
      const endY = (dy + 1) * scale;

      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, weightSum = 0;

      const sx0 = Math.floor(startX);
      const sx1 = Math.min(src.width - 1, Math.ceil(endX));
      const sy0 = Math.floor(startY);
      const sy1 = Math.min(src.height - 1, Math.ceil(endY));

      for (let sy = sy0; sy <= sy1; sy++) {
        for (let sx = sx0; sx <= sx1; sx++) {
          const xWeight = Math.max(0, Math.min(sx + 1, endX) - Math.max(sx, startX));
          const yWeight = Math.max(0, Math.min(sy + 1, endY) - Math.max(sy, startY));
          const weight = xWeight * yWeight;

          if (weight > 0) {
            const p = (sy * src.width + sx) * 4;
            const a = src.data[p + 3] / 255;
            rSum += src.data[p] * a * weight;
            gSum += src.data[p + 1] * a * weight;
            bSum += src.data[p + 2] * a * weight;
            aSum += src.data[p + 3] * weight;
            weightSum += weight;
          }
        }
      }

      const dstP = (dy * targetSize + dx) * 4;
      if (weightSum > 0 && aSum > 0) {
        const finalA = aSum / weightSum;
        const normA = finalA / 255;
        dst.data[dstP] = Math.min(255, Math.round(rSum / (weightSum * normA)));
        dst.data[dstP + 1] = Math.min(255, Math.round(gSum / (weightSum * normA)));
        dst.data[dstP + 2] = Math.min(255, Math.round(bSum / (weightSum * normA)));
        dst.data[dstP + 3] = Math.min(255, Math.round(finalA));
      } else {
        dst.data[dstP] = 0;
        dst.data[dstP + 1] = 0;
        dst.data[dstP + 2] = 0;
        dst.data[dstP + 3] = 0;
      }
    }
  }
  return dst;
}

// 1. High-res logo
fs.writeFileSync(path.join(outputDir, 'logo.png'), PNG.sync.write(masterPng));

// 2. Icon 128x128 for chat launcher and avatar
const icon128 = downsample(masterPng, 128);
fs.writeFileSync(path.join(outputDir, 'chat-icon.png'), PNG.sync.write(icon128));

// 3. Base64 data URI for embedding directly in widget.js
const icon128Buf = PNG.sync.write(icon128);
const iconBase64 = `data:image/png;base64,${icon128Buf.toString('base64')}`;
fs.writeFileSync(path.join(outputDir, 'chat-icon-base64.txt'), iconBase64);

// 4. Favicon 48x48
const icon48 = downsample(masterPng, 48);
fs.writeFileSync(path.join(outputDir, 'favicon.png'), PNG.sync.write(icon48));

console.log('✓ All assets generated:');
console.log(`  - public/logo.png (${masterPng.width}x${masterPng.height})`);
console.log(`  - public/chat-icon.png (128x128, size: ${icon128Buf.length} bytes)`);
console.log(`  - public/favicon.png (48x48)`);
console.log(`  - public/chat-icon-base64.txt (length: ${iconBase64.length})`);
