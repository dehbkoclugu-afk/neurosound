// App Store screenshots (iPhone 6.9", 1320x2868) from the running web build.
// usage: npx expo start --web --port 8091   (in another terminal)
//        node scripts/app-store-screenshots/capture.mjs [http://localhost:8091]
// Output: store/app-store/screenshots/<locale>/<shot>.png
// With --play: bare 1080x2400 screens for all 21 Play locales, written to
// store/google-play/assets/phone/<locale>/<shot>.jpg; run
// scripts/captioned-screenshots/render.mjs afterwards to caption them.
//
// The Play set was cut from Android captures (status bar, old design), which
// App Review rejects under 2.3.3/2.3.10. The web build renders the same React
// tree with no OS chrome at all, so it is captured at iPhone size instead.
// Drives Edge over the DevTools protocol with Node's built-in WebSocket.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const play = process.argv.includes('--play');
const origin = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:8091';
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const captions = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/captioned-screenshots/captions.json'), 'utf8'),
);

// App Store folder ← app language ← captions.json key
const LOCALES = [
  { dir: 'en-US', lang: 'en', captions: 'en-US' },
  { dir: 'tr', lang: 'tr', captions: 'tr-TR' },
];
const W = 1320;
const H = 2868;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Home leads with the sound for the hour; screenshots should show the night
// (Sleep) card whatever time the script runs, so pick a zone where it is 23:00.
function nightZone() {
  let offset = 23 - new Date().getUTCHours();
  if (offset > 14) offset -= 24;
  if (offset < -12) offset += 24;
  return offset === 0 ? 'Etc/GMT' : `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
}

async function connect(port) {
  for (let i = 0; i < 50; i++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = pages.find((p) => p.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));
        let id = 0;
        const pending = new Map();
        ws.onmessage = (e) => {
          const m = JSON.parse(e.data);
          if (m.id && pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id);
        };
        const send = (method, params = {}) =>
          new Promise((res, rej) => {
            const n = ++id;
            pending.set(n, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
            ws.send(JSON.stringify({ id: n, method, params }));
          });
        return { send, close: () => ws.close() };
      }
    } catch {}
    await sleep(200);
  }
  throw new Error('Edge DevTools did not come up');
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function captionHtml(lang, title, subtitle, img) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,600;6..12,800&display=block" rel="stylesheet">
<style>
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
  body{background:radial-gradient(1100px 860px at 50% 0%, #2A2140 0%, #0B0A10 72%);font-family:'Nunito Sans',sans-serif;color:#F4F1EA}
  .text{position:absolute;top:170px;left:100px;right:100px;text-align:center}
  h1{font-weight:800;font-size:112px;line-height:1.1;letter-spacing:-2px;margin:0 0 36px}
  p{font-weight:600;font-size:52px;line-height:1.35;color:#B4ADC2;margin:0}
  .phone{position:absolute;left:50%;transform:translateX(-50%);top:760px;width:1000px;height:2172px;
    border-radius:110px;overflow:hidden;border:14px solid #221D2C;box-shadow:0 50px 140px rgba(0,0,0,.65),0 0 0 3px #3A3248}
  .phone img{width:100%;display:block}
</style></head><body>
<div class="text"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
<div class="phone"><img src="${pathToFileURL(img)}"></div>
<script>document.fonts.ready.then(()=>{const t=document.querySelector('.text'),h=document.querySelector('h1');
for(let s=112;t.getBoundingClientRect().bottom>700&&s>64;s-=4)h.style.fontSize=s+'px';});</script>
</body></html>`;
}

const SHOTS = [
  { shot: '01-home', route: '/' },
  { shot: '02-explore', route: '/explore' },
  { shot: '03-player', route: '/player/noise-rain' },
  // One tap on the first ready-made mix, so the shot shows a mix playing.
  { shot: '04-mixer', route: '/mixer', act: `[...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label').includes(' + '))?.click()` },
];

const port = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-shots-'));
const browser = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, '--autoplay-policy=no-user-gesture-required',
  '--allow-file-access-from-files', 'about:blank',
]);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-raw-'));
try {
  const { send, close } = await connect(port);
  await send('Page.enable');
  await send('Emulation.setTimezoneOverride', { timezoneId: nightZone() });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  const shoot = async (file) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
  };
  const playPhone = path.join(root, 'store/google-play/assets/phone');
  const locales = play
    ? fs.readdirSync(playPhone).map((dir) => ({ dir, lang: dir.split('-')[0] }))
    : LOCALES;
  for (const loc of locales) {
    if (play) {
      await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 3, mobile: true });
      await send('Page.navigate', { url: origin });
      await sleep(4000);
      const settings = {
        state: { hasSeenOnboarding: true, hasSeenEpilepsyWarning: true, hasSeenHeadphoneWarning: true, language: loc.lang },
        version: 2,
      };
      await send('Runtime.evaluate', {
        expression: `localStorage.clear(); localStorage.setItem('neurosound-settings', ${JSON.stringify(JSON.stringify(settings))})`,
      });
      for (const s of SHOTS) {
        await send('Page.navigate', { url: origin + s.route });
        await sleep(5000);
        if (s.act) {
          await send('Runtime.evaluate', { expression: s.act });
          await sleep(2500);
        }
        const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
        fs.writeFileSync(path.join(playPhone, loc.dir, `${s.shot}.jpg`), Buffer.from(data, 'base64'));
      }
      console.log(loc.dir);
      continue;
    }
    const outDir = path.join(root, 'store/app-store/screenshots', loc.dir);
    fs.mkdirSync(outDir, { recursive: true });
    await send('Emulation.setDeviceMetricsOverride', { width: W / 3, height: H / 3, deviceScaleFactor: 3, mobile: true });
    await send('Page.navigate', { url: origin });
    await sleep(4000);
    const settings = {
      state: { hasSeenOnboarding: true, hasSeenEpilepsyWarning: true, hasSeenHeadphoneWarning: true, language: loc.lang },
      version: 2,
    };
    await send('Runtime.evaluate', {
      expression: `localStorage.clear(); localStorage.setItem('neurosound-settings', ${JSON.stringify(JSON.stringify(settings))})`,
    });
    for (const s of SHOTS) {
      await send('Emulation.setDeviceMetricsOverride', { width: W / 3, height: H / 3, deviceScaleFactor: 3, mobile: true });
      await send('Page.navigate', { url: origin + s.route });
      await sleep(6000);
      if (s.act) {
        await send('Runtime.evaluate', { expression: s.act });
        await sleep(3000);
      }
      const raw = path.join(tmp, `${loc.dir}-${s.shot}.png`);
      await shoot(raw);

      const [title, subtitle] = captions[loc.captions][s.shot];
      const html = path.join(tmp, `${loc.dir}-${s.shot}.html`);
      fs.writeFileSync(html, captionHtml(loc.lang, title, subtitle, raw));
      await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: pathToFileURL(html).href });
      await sleep(3000);
      const out = path.join(outDir, `${s.shot}.png`);
      await shoot(out);
      console.log(out);
    }
  }
  close();
} finally {
  browser.kill();
  await sleep(1500);
  // Edge can hold its profile files a moment after exit; a leftover temp dir
  // is not worth failing a finished run over.
  for (const dir of [profile, tmp]) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}
