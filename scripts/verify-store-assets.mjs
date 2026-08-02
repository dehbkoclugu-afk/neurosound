import { readFileSync } from 'node:fs';

function dimensions(path) {
  const png = readFileSync(new URL(`../${path}`, import.meta.url));
  if (png.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${path} is not PNG`);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}
const expected = [['store/google-play/assets/feature-graphic.png', 1024, 500]];
for (const locale of ['tr-TR', 'en-US']) {
  for (const name of ['01-home', '02-explore', '03-player', '04-mixer', '05-settings']) {
    expected.push([`store/google-play/assets/phone/${locale}/${name}.png`, 1080, 1920]);
  }
}
const errors = [];
for (const [path, width, height] of expected) {
  try {
    const [actualWidth, actualHeight] = dimensions(path);
    if (actualWidth !== width || actualHeight !== height) errors.push(`${path}: ${actualWidth}x${actualHeight}`);
  } catch (error) {
    errors.push(error.message);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Google Play feature graphic and localized phone screenshots are dimension-valid.');
