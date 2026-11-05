// Renders Play Store screenshots with a headline above the real app screen.
// usage: node scripts/captioned-screenshots/render.mjs                 (all locales/shots from captions.json)
//        node scripts/captioned-screenshots/render.mjs <locale> [shot] (one locale, or one shot)
// Output: store/google-play/assets/captioned/<locale>/<shot>.png (1080x1920)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const captions = JSON.parse(fs.readFileSync(path.join(here, 'captions.json'), 'utf8'));
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// Nunito Sans has no glyphs for these scripts; fall back to the matching Noto face.
const scriptFont = {
  'ja-JP': 'Noto Sans JP', 'ko-KR': 'Noto Sans KR', 'zh-CN': 'Noto Sans SC',
  th: 'Noto Sans Thai', 'hi-IN': 'Noto Sans Devanagari', 'bn-BD': 'Noto Sans Bengali',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function render(locale, shot, title, subtitle) {
  const src = path.join(root, 'store/google-play/assets/phone', locale, `${shot}.jpg`);
  const outDir = path.join(root, 'store/google-play/assets/captioned', locale);
  fs.mkdirSync(outDir, { recursive: true });
  const fallback = scriptFont[locale];
  const fontQuery = 'family=Nunito+Sans:opsz,wght@6..12,600;6..12,800'
    + (fallback ? `&family=${fallback.replace(/ /g, '+')}:wght@600;800` : '');
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?${fontQuery}&display=block" rel="stylesheet">
<style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
  body{background:radial-gradient(900px 700px at 50% 0%, #1B2A3D 0%, #080B10 70%);
    font-family:'Nunito Sans',${fallback ? `'${fallback}',` : ''}sans-serif;color:#F2F5F8}
  .text{position:absolute;top:120px;left:80px;right:80px;text-align:center;word-break:keep-all;overflow-wrap:anywhere}
  h1{font-weight:800;font-size:92px;line-height:1.12;letter-spacing:-1.5px;margin:0 0 28px}
  p{font-weight:600;font-size:42px;line-height:1.35;color:#A6B0BD;margin:0}
  .phone{position:absolute;left:50%;transform:translateX(-50%);top:560px;width:760px;height:1460px;
    border-radius:64px;overflow:hidden;border:10px solid #1E2733;box-shadow:0 40px 120px rgba(0,0,0,.6), 0 0 0 2px #2E3A4A}
  .phone img{width:100%;display:block}
</style></head><body>
<div class="text"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
<div class="phone"><img src="${pathToFileURL(src)}"></div>
<script>
  // Long translations would run into the phone frame; shrink the headline until the text fits above it.
  document.fonts.ready.then(() => {
    const text = document.querySelector('.text'), h1 = document.querySelector('h1');
    for (let size = 92; text.getBoundingClientRect().bottom > 520 && size > 56; size -= 4) h1.style.fontSize = size + 'px';
  });
</script>
</body></html>`;

  const htmlFile = path.join(work, 'page.html');
  fs.writeFileSync(htmlFile, html);
  await send('Page.navigate', { url: pathToFileURL(htmlFile).href });
  await sleep(2500);
  const out = path.join(outDir, `${shot}.png`);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  console.log(out);
}

const [onlyLocale, onlyShot] = process.argv.slice(2);
const jobs = Object.entries(captions)
  .filter(([locale]) => !onlyLocale || locale === onlyLocale)
  .flatMap(([locale, shots]) => Object.entries(shots)
    .filter(([shot]) => !onlyShot || shot === onlyShot)
    .map(([shot, [title, subtitle]]) => () => render(locale, shot, title, subtitle)));

// Over DevTools, not `--screenshot`: that flag exits 0 without writing anything
// on this machine. Temp dir, not the repo: a profile there crashes Metro's watcher.
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-caption-'));
const port = 9334;
const browser = spawn(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${path.join(work, 'profile')}`, '--allow-file-access-from-files', 'about:blank']);
let send;
try {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    try {
      page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((p) => p.type === 'page');
    } catch {}
    if (!page) await sleep(200);
  }
  if (!page) throw new Error('Edge DevTools did not come up');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id);
  };
  send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  for (const job of jobs) await job();
  ws.close();
} finally {
  browser.kill();
  await sleep(1500);
  try { fs.rmSync(work, { recursive: true, force: true }); } catch {}
}
