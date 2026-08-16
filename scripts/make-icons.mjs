// Generates the PWA icons as real PNGs, with no image library involved: the
// pixels are drawn by hand and encoded with Node's built-in zlib. Run it with
// `npm run icons` after changing the artwork.

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// --- minimal PNG encoder -------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  // 10..12 stay zero: deflate, adaptive filtering, no interlace

  // One filter byte (0 = none) in front of every scanline.
  const raw = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    const src = y * width * 4
    const dst = y * (width * 4 + 1)
    raw[dst] = 0
    rgba.copy(raw, dst + 1, src, src + width * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- artwork -------------------------------------------------------------

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))

/**
 * A water balloon on a sky-blue gradient - the game in one glyph.
 * `padding` insets the artwork so a maskable icon survives being cropped
 * to a circle by the launcher.
 */
function drawIcon(size, padding = 0) {
  const px = Buffer.alloc(size * size * 4)
  const inner = size - padding * 2
  const radius = inner * 0.22 // rounded-square corner

  // Teardrop geometry, in artwork-local coordinates.
  const cx = size / 2
  const bulbY = padding + inner * 0.62
  const bulbR = inner * 0.26
  const apexY = padding + inner * 0.17

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4

      // Rounded-square mask with a soft edge.
      const lx = Math.max(padding + radius - x, x - (size - padding - radius), 0)
      const ly = Math.max(padding + radius - y, y - (size - padding - radius), 0)
      const corner = Math.hypot(lx, ly)
      const insideBox =
        x >= padding && x < size - padding && y >= padding && y < size - padding
      const bgAlpha = insideBox ? clamp01(radius + 0.5 - corner) : 0

      if (bgAlpha <= 0) continue

      // Vertical sky gradient.
      const t = (y - padding) / inner
      let r = lerp(0x6f, 0x14, t)
      let g = lerp(0xd0, 0x5e, t)
      let b = lerp(0xf5, 0xa8, t)

      // The balloon itself, antialiased against the background.
      let inDrop
      if (y >= bulbY) {
        inDrop = bulbR + 0.5 - Math.hypot(x - cx, y - bulbY)
      } else if (y >= apexY) {
        // Straight taper from the bulb up to the point. Bounded at the apex, or
        // the half-width never quite reaches zero and leaves a hairline above it.
        const k = (y - apexY) / (bulbY - apexY)
        inDrop = k * bulbR - Math.abs(x - cx)
      } else {
        inDrop = -1
      }
      const dropAlpha = clamp01(inDrop)

      if (dropAlpha > 0) {
        // Slight sheen so it reads as a droplet rather than a flat blob.
        const sheen = clamp01(1 - Math.hypot(x - (cx - bulbR * 0.3), y - (bulbY - bulbR * 0.35)) / (bulbR * 0.9))
        const dr = lerp(0xe8, 0xff, sheen)
        const dg = lerp(0xf7, 0xff, sheen)
        const db = lerp(0xff, 0xff, sheen)
        r = lerp(r, dr, dropAlpha)
        g = lerp(g, dg, dropAlpha)
        b = lerp(b, db, dropAlpha)
      }

      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = Math.round(bgAlpha * 255)
    }
  }
  return encodePng(size, size, px)
}

mkdirSync(OUT, { recursive: true })

const targets = [
  ['favicon-64.png', 64, 0],
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['apple-touch-icon.png', 180, 0],
  // Maskable icons get cropped by the launcher, so the art is inset.
  ['icon-maskable-512.png', 512, 64],
]

for (const [name, size, padding] of targets) {
  const png = drawIcon(size, padding)
  writeFileSync(join(OUT, name), png)
  console.log(`${name}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB`)
}
