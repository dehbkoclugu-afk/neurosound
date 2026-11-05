// Remotion serves files from public/. Copies the real store screenshots and art
// in, so the video can't drift from what the app actually shows.
const { cpSync, mkdirSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const out = join(__dirname, 'public');
mkdirSync(out, { recursive: true });

for (const lang of ['tr', 'en-US']) {
  for (const shot of ['01-home', '03-player', '04-mixer']) {
    cpSync(join(root, 'store/app-store/screenshots', lang, `${shot}.png`), join(out, lang, `${shot}.png`));
  }
}
for (const intent of ['sleep', 'focus', 'relax', 'meditate']) {
  cpSync(join(root, 'assets/images/art/intents', `${intent}.jpg`), join(out, `${intent}.jpg`));
}
cpSync(join(root, 'assets/images/art/signatures/solfeggio-852.png'), join(out, 'signature.png'));
const fonts = join(root, 'node_modules/@expo-google-fonts');
cpSync(join(fonts, 'young-serif/400Regular/YoungSerif_400Regular.ttf'), join(out, 'YoungSerif.ttf'));
cpSync(join(fonts, 'schibsted-grotesk/400Regular/SchibstedGrotesk_400Regular.ttf'), join(out, 'SchibstedGrotesk.ttf'));
