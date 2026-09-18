// Script to generate valid PNG icons for PWA compliance
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function makePng(width, height, drawFn) {
  // RGBA buffer with 1 filter byte per line
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowLength;
    rawData[rowStart] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelStart = rowStart + 1 + x * 4;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);

    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  // CRC32 table
  function makeCrcTable() {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    return table;
  }
  const crcTable = makeCrcTable();

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw elegant Invoice Icon: Blue/Indigo rounded badge with document paper and lines
function drawInvoiceIcon(x, y, width, height, isMaskable = false) {
  const normX = x / width;
  const normY = y / height;

  // Background: Deep Blue / Slate gradient (#1e3a8a to #0284c7)
  const bgR = Math.round(30 + (2 - 30) * normY);
  const bgG = Math.round(58 + (132 - 58) * normY);
  const bgB = Math.round(138 + (199 - 138) * normY);

  if (isMaskable) {
    // Full bleed background
  }

  // Rounded rectangle bounds for non-maskable or inner icon
  const margin = isMaskable ? 0.22 : 0.08;
  const docLeft = margin;
  const docRight = 1.0 - margin;
  const docTop = margin;
  const docBottom = 1.0 - margin;

  // Check if inside document paper (white with fold or clean card)
  const paperLeft = margin + 0.12;
  const paperRight = 1.0 - margin - 0.12;
  const paperTop = margin + 0.10;
  const paperBottom = 1.0 - margin - 0.10;

  let insidePaper = normX >= paperLeft && normX <= paperRight && normY >= paperTop && normY <= paperBottom;

  // Dog-ear fold at top-right
  const foldSize = 0.15;
  const inFoldCut = (normX >= (paperRight - foldSize)) && (normY <= (paperTop + foldSize)) && ((normX - (paperRight - foldSize)) + (paperTop + foldSize - normY) > foldSize);

  if (insidePaper && !inFoldCut) {
    // Document lines / content
    const inHeader = normY >= paperTop + 0.08 && normY <= paperTop + 0.13 && normX >= paperLeft + 0.08 && normX <= paperRight - 0.22;
    const inLine1 = normY >= paperTop + 0.22 && normY <= paperTop + 0.26 && normX >= paperLeft + 0.08 && normX <= paperRight - 0.08;
    const inLine2 = normY >= paperTop + 0.32 && normY <= paperTop + 0.36 && normX >= paperLeft + 0.08 && normX <= paperRight - 0.15;
    const inLine3 = normY >= paperTop + 0.42 && normY <= paperTop + 0.46 && normX >= paperLeft + 0.08 && normX <= paperRight - 0.08;
    
    // Green stamp / checkmark / total badge at bottom of invoice
    const badgeX = paperLeft + 0.45;
    const badgeY = paperTop + 0.60;
    const inBadge = normX >= badgeX && normX <= paperRight - 0.08 && normY >= badgeY && normY <= badgeY + 0.14;

    if (inHeader) {
      return [30, 58, 138, 255]; // Deep navy header line
    }
    if (inLine1 || inLine2 || inLine3) {
      return [148, 163, 184, 255]; // Slate-400 lines
    }
    if (inBadge) {
      return [16, 185, 129, 255]; // Emerald-500 total pill
    }

    return [255, 255, 255, 255]; // White paper
  }

  // Fold triangle shadow/color
  if (normX >= (paperRight - foldSize) && normX <= paperRight && normY >= paperTop && normY <= paperTop + foldSize) {
    if (!inFoldCut) {
      return [203, 213, 225, 255]; // Slate-300
    }
  }

  // Surrounding background
  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), makePng(192, 192, (x, y, w, h) => drawInvoiceIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), makePng(512, 512, (x, y, w, h) => drawInvoiceIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), makePng(512, 512, (x, y, w, h) => drawInvoiceIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), makePng(180, 180, (x, y, w, h) => drawInvoiceIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), makePng(32, 32, (x, y, w, h) => drawInvoiceIcon(x, y, w, h, false)));

// Also create public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>
  <g filter="url(#shadow)">
    <path d="M128 88 H320 L384 152 V424 H128 Z" fill="#ffffff"/>
    <path d="M320 88 V152 H384 Z" fill="#cbd5e1"/>
    <!-- Header line -->
    <rect x="168" y="140" width="130" height="20" rx="4" fill="#1e3a8a"/>
    <!-- Items -->
    <rect x="168" y="196" width="176" height="12" rx="3" fill="#94a3b8"/>
    <rect x="168" y="232" width="144" height="12" rx="3" fill="#94a3b8"/>
    <rect x="168" y="268" width="176" height="12" rx="3" fill="#94a3b8"/>
    <!-- Total Pill -->
    <rect x="236" y="340" width="108" height="34" rx="8" fill="#10b981"/>
    <text x="290" y="363" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle" font-family="sans-serif">PAID</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('PWA icons created successfully!');
