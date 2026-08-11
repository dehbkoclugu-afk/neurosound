/**
 * Check the Play graphics against Play's own limits before an upload discovers
 * them. A rejected screenshot is only reported at commit, after every other
 * image has already gone up.
 *
 * Locales are discovered from disk rather than listed here: a language added
 * to `store/google-play/assets/phone/` without touching this file would
 * otherwise ship unverified, which is exactly how the set silently drifted to
 * JPEG and to four shots while this still demanded five PNGs.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PHONE = join(ROOT, 'store/google-play/assets/phone');

// Play: each screenshot side 320–3840 px, between 2 and 8 per locale, and the
// feature graphic exactly 1024x500.
//
// Deliberately no aspect-ratio rule. Older Play docs quote 2:1, which would
// reject every shot here — these are 1080x2400, the ordinary 20:9 of a current
// phone, and Play takes them. A check that fails on all valid input is worse
// than no check: it trains you to ignore the gate.
const MIN_SIDE = 320;
const MAX_SIDE = 3840;
const MIN_SHOTS = 2;
const MAX_SHOTS = 8;

function dimensions(path) {
  const buf = readFileSync(path);
  if (buf.toString('ascii', 1, 4) === 'PNG') {
    return { format: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    // Walk the JPEG segments to the first frame header, which carries the size.
    for (let i = 2; i < buf.length - 9; ) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { format: 'jpeg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    throw new Error(`${path}: no JPEG frame header`);
  }
  throw new Error(`${path}: not PNG or JPEG`);
}

const errors = [];

const feature = join(ROOT, 'store/google-play/assets/feature-graphic.png');
try {
  const { width, height } = dimensions(feature);
  if (width !== 1024 || height !== 500) {
    errors.push(`feature-graphic.png is ${width}x${height}, Play requires exactly 1024x500`);
  }
} catch (e) {
  errors.push(e.message);
}

const icon = join(ROOT, "store/google-play/assets/icon-512.png");
try {
  const { width, height } = dimensions(icon);
  if (width !== 512 || height !== 512) {
    errors.push(`icon-512.png is ${width}x${height}, Play requires exactly 512x512`);
  }
} catch (e) {
  errors.push(e.message);
}

if (!existsSync(PHONE)) {
  errors.push('store/google-play/assets/phone is missing');
} else {
  const locales = readdirSync(PHONE, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  if (!locales.includes('tr-TR') || !locales.includes('en-US')) {
    errors.push('tr-TR and en-US screenshots are required');
  }

  for (const locale of locales) {
    const shots = readdirSync(join(PHONE, locale))
      .filter((f) => /\.(png|jpe?g)$/i.test(f))
      .sort();

    if (shots.length < MIN_SHOTS || shots.length > MAX_SHOTS) {
      errors.push(`${locale}: ${shots.length} screenshots, Play allows ${MIN_SHOTS}-${MAX_SHOTS}`);
    }

    for (const name of shots) {
      try {
        const { width, height } = dimensions(join(PHONE, locale, name));
        const [short, long] = width < height ? [width, height] : [height, width];
        if (short < MIN_SIDE || long > MAX_SIDE) {
          errors.push(`${locale}/${name}: ${width}x${height}, sides must be ${MIN_SIDE}-${MAX_SIDE}`);
        }
      } catch (e) {
        errors.push(e.message);
      }
    }
  }

  if (!errors.length) {
    console.log(`Play graphics valid: feature graphic plus screenshots for ${locales.length} locales.`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
