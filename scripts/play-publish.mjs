/**
 * Push the store listings and graphics to Google Play.
 *
 * The repo already holds the copy for 21 languages and the graphics; entering
 * them by hand means 21 forms, and every later wording fix means 21 again.
 * This makes `store/google-play/` the source of truth and the Console a
 * rendering of it.
 *
 * Runs on the Play Developer API with no dependencies: a service-account JWT
 * signed with node:crypto, then plain fetch. Everything happens inside one
 * "edit" — Play's transaction — so a failure part-way leaves the live listing
 * untouched.
 *
 * DRY_RUN=1 (the default) deletes the edit instead of committing it, which
 * still exercises authentication, locale validation and every upload. Only
 * DRY_RUN=0 publishes.
 *
 * Env: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, optionally PACKAGE_NAME, DRY_RUN.
 */

import { createSign } from 'node:crypto';
import { request as httpsRequest } from 'node:https';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const STORE = join(ROOT, 'store/google-play');
const PACKAGE = process.env.PACKAGE_NAME || 'com.dehbkoclugu.neurosound';
const DRY_RUN = process.env.DRY_RUN !== '0';
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3';

// Play's own field limits. Exceeding them is rejected at commit, i.e. after
// every upload has already run, so they are checked up front instead.
const LIMITS = { title: 30, shortDescription: 80, fullDescription: 4000 };

function serviceAccount() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set');
  const key = JSON.parse(raw);
  if (!key.client_email || !key.private_key) {
    throw new Error('service account JSON is missing client_email or private_key');
  }
  return key;
}

/** Service-account JWT grant. No googleapis dependency for four lines of crypto. */
async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const claim = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign('RSA-SHA256').update(claim).end()
    .sign(key.private_key, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${claim}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`token request failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function call(token, method, url, { json, body, contentType } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(json ? { 'content-type': 'application/json' } : {}),
      ...(contentType ? { 'content-type': contentType } : {}),
    },
    body: json ? JSON.stringify(json) : body,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${method} ${url.replace(API, '').replace(UPLOAD, '')} → ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

/** `## Short description` / `## Kısa açıklama` and the full-description body. */
function parseListing(markdown) {
  const short = markdown.match(/## (?:Kısa açıklama|Short description)\r?\n([^\r\n]+)/)?.[1]?.trim();
  const full = markdown.match(/## (?:Tam açıklama|Full description)\r?\n([\s\S]+)/)?.[1]?.trim();
  const title = markdown.match(/## (?:Uygulama adı|App name)\r?\n([^\r\n]+)/)?.[1]?.trim();
  return { title, shortDescription: short, fullDescription: full };
}

function collectLocales() {
  return readdirSync(STORE, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(STORE, e.name, 'listing.md')))
    .map((e) => e.name)
    .sort();
}

function screenshotsFor(locale) {
  const dir = join(STORE, 'assets/phone', locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()
    .map((f) => join(dir, f));
}

/**
 * Clear an image set before re-uploading it, tolerating the 404 Play returns
 * when the set does not exist yet.
 *
 * The delete exists so a second run replaces the screenshots instead of
 * appending to them — Play caps a locale at eight, and four per run would hit
 * that on the third. But a listing that has never had images answers 404, and
 * treating that as a failure stopped the very first upload before it started.
 */
/**
 * Upload one image.
 *
 * Google documents media uploads on the `/upload/` host, but that path answers
 * "Could not find handler for this request" here, so the plain API host is
 * tried as well. Whichever answers is remembered for the rest of the run —
 * eighty-four images should not each pay for the same discovery.
 */
/**
 * Upload one image.
 *
 * Two things this endpoint insists on, and getting either wrong returns 404
 * "Could not find handler for this request" — which reads as a wrong path and
 * sent several rounds looking for the wrong host.
 *
 * No `?uploadType=media`, despite Google's general media-upload convention
 * saying to add it.
 *
 * And an explicit Content-Length. Through fetch, a real image body goes out
 * chunked and draws that same 404, while an empty body — which fetch sends
 * with a length — reaches the handler and is properly rejected as "No file
 * found in request". That contradiction is what gave it away: the path was
 * never wrong, only the framing. node:https is here purely to set the length.
 */
function uploadImage(token, editId, locale, type, path) {
  const body = readFileSync(path);
  const url = new URL(
    `${UPLOAD}/applications/${PACKAGE}/edits/${editId}/images/${locale}/${type}`
  );
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': path.endsWith('.png') ? 'image/png' : 'image/jpeg',
          'content-length': body.length,
        },
      },
      (res) => {
        let text = '';
        res.on('data', (c) => (text += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(text ? JSON.parse(text) : {});
            return;
          }
          const err = new Error(
            `POST images/${locale}/${type} → ${res.statusCode}: ${text.slice(0, 200).replace(/\s+/g, ' ')}`
          );
          err.status = res.statusCode;
          reject(err);
        });
      }
    );
    req.on('error', reject);
    req.end(body);
  });
}

async function clearImages(token, editId, locale, type) {
  try {
    await call(token, 'DELETE',
      `${API}/applications/${PACKAGE}/edits/${editId}/images/${locale}/${type}`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
}

async function main() {
  const locales = collectLocales();
  console.log(`package ${PACKAGE}`);
  console.log(`${locales.length} listings: ${locales.join(' ')}`);
  console.log(DRY_RUN ? 'DRY RUN — the edit is discarded, nothing is published\n'
                      : 'PUBLISHING — the edit will be committed\n');

  // Validate before touching the API: a length overrun is only reported at
  // commit, long after every image has been uploaded.
  const listings = {};
  let invalid = false;
  for (const locale of locales) {
    const parsed = parseListing(readFileSync(join(STORE, locale, 'listing.md'), 'utf8'));
    for (const [field, max] of Object.entries(LIMITS)) {
      const value = parsed[field];
      if (!value) { console.error(`  ${locale}: ${field} is missing`); invalid = true; continue; }
      if (value.length > max) {
        console.error(`  ${locale}: ${field} is ${value.length} chars, limit ${max}`);
        invalid = true;
      }
    }
    listings[locale] = parsed;
  }
  if (invalid) throw new Error('listing content failed validation; nothing was sent');

  const key = serviceAccount();
  // Printed because a 403 here is always about which account was granted what,
  // and the answer is otherwise locked inside a write-only secret.
  console.log(`service account ${key.client_email}`);
  console.log(`project ${key.project_id ?? '(unknown)'}\n`);

  const token = await accessToken(key);
  let edit;
  try {
    edit = await call(token, 'POST', `${API}/applications/${PACKAGE}/edits`, { json: {} });
  } catch (e) {
    if (e.status === 403 || e.status === 401) {
      // "The caller does not have permission" covers two very different
      // problems with the same words. A read that needs app access but no
      // edit separates them: if it succeeds the grant is fine and only edits
      // are barred, which is Play refusing an app that has never had a binary
      // uploaded through the Console.
      let canRead = false;
      try {
        await call(token, 'GET', `${API}/applications/${PACKAGE}/reviews?maxResults=1`);
        canRead = true;
      } catch { /* stays false */ }

      console.error(`\nAuthentication worked — a token was issued and the API answered.`);
      if (canRead) {
        console.error(`This account CAN read ${PACKAGE}, so the grant is in place. Play is
refusing to open an edit, which is what it does for an app that has never had
a binary uploaded through the Console: the first release cannot go through the
API.

  → Upload the AAB to Internal testing in the Play Console once, then run
    this workflow again. Every release after that can use the API.`);
      } else {
        console.error(`This account cannot read ${PACKAGE} either, so it has no access to the app.

  1. Play Console → Users and permissions → invite ${key.client_email}
     and grant it access to ${PACKAGE}. "Edit store listing" is enough;
     this script never touches releases.
  2. Check the invitation was accepted and applies to this app, not only to
     the developer account.

A grant can take a few minutes to take effect.`);
      }
    }
    throw e;
  }
  console.log(`edit ${edit.id} opened\n`);

  const failures = [];
  const imageFailures = [];
  try {
    for (const locale of locales) {
      try {
        await call(token, 'PUT',
          `${API}/applications/${PACKAGE}/edits/${edit.id}/listings/${locale}`,
          { json: { language: locale, ...listings[locale] } });
        console.log(`  ${locale.padEnd(6)} listing ok`);
      } catch (e) {
        failures.push(`${locale} listing: ${e.message}`);
        console.error(`  ${locale.padEnd(6)} listing FAILED`);
        continue;
      }

      const shots = screenshotsFor(locale);
      if (!shots.length) continue;
      // Images are worth having but not worth losing the text over: the
      // listings are the part that cannot be pasted into the Console in any
      // reasonable time, and an image endpoint that will not answer should not
      // take twenty-one translations down with it.
      try {
        // Replace rather than append: re-running must not stack duplicates.
        await clearImages(token, edit.id, locale, 'phoneScreenshots');
        for (const path of shots) {
          await uploadImage(token, edit.id, locale, 'phoneScreenshots', path);
        }
        console.log(`  ${locale.padEnd(6)} ${shots.length} screenshots ok`);
      } catch (e) {
        imageFailures.push(`${locale}: ${e.message.split('\n')[0]}`);
        console.error(`  ${locale.padEnd(6)} screenshots SKIPPED`);
      }
    }

    // The feature graphic is per-locale but Play falls back to the default
    // listing, so one upload covers every language.
    const feature = join(STORE, 'assets/feature-graphic.png');
    if (existsSync(feature) && locales.includes('en-US')) {
      try {
        await clearImages(token, edit.id, 'en-US', 'featureGraphic');
        await uploadImage(token, edit.id, 'en-US', 'featureGraphic', feature);
        console.log(`  en-US  feature graphic ok (${(statSync(feature).size / 1024).toFixed(0)}KB)`);
      } catch (e) {
        imageFailures.push(`featureGraphic: ${e.message.split('\n')[0]}`);
        console.error('  en-US  feature graphic SKIPPED');
      }
    }

    if (imageFailures.length) {
      console.error(`
${imageFailures.length} image upload(s) skipped:`);
      for (const f of imageFailures) console.error(`  - ${f}`);
      console.error(`Listings still go up. Screenshots and the feature graphic
have to be added in the Console for now; they live in
store/google-play/assets/.`);
    }

    if (failures.length) throw new Error(`${failures.length} listing(s) failed`);

    if (DRY_RUN) {
      await call(token, 'DELETE', `${API}/applications/${PACKAGE}/edits/${edit.id}`);
      console.log('\ndry run complete — edit discarded, Play unchanged');
    } else {
      const done = await call(token, 'POST', `${API}/applications/${PACKAGE}/edits/${edit.id}:commit`);
      console.log(`\ncommitted edit ${done.id}`);
    }
  } catch (e) {
    await call(token, 'DELETE', `${API}/applications/${PACKAGE}/edits/${edit.id}`).catch(() => {});
    for (const f of failures) console.error(`  - ${f}`);
    throw e;
  }
}

main().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
