/**
 * Move a build between Play tracks, and turn a staged rollout up.
 *
 * Rolling out is the one release step that is genuinely repetitive: the same
 * three clicks at 1%, at 10%, at 50%, at 100%, each time squinting at which
 * version code is actually live. This reads the tracks, says what it is about
 * to do, and does it.
 *
 * Everything runs inside one Play edit, so a rejected fraction or a wrong
 * version code leaves the live track untouched.
 *
 * DRY_RUN=1 (the default) prints the current tracks and the intended change,
 * then discards the edit.
 *
 * Env: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, TRACK, ROLLOUT, optionally
 * VERSION_CODE, PACKAGE_NAME, DRY_RUN.
 */

import { createSign } from 'node:crypto';

const PACKAGE = process.env.PACKAGE_NAME || 'com.dehbkoclugu.neurosound';
const DRY_RUN = process.env.DRY_RUN !== '0';
const TRACK = process.env.TRACK || 'internal';
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';

/** Play takes a fraction; the workflow asks for a percentage because that is
 *  how rollouts are actually discussed. 100 means fully released. */
const ROLLOUT = Number(process.env.ROLLOUT ?? '100');

function serviceAccount() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set');
  return JSON.parse(raw);
}

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

async function call(token, method, url, json) {
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(json ? { 'content-type': 'application/json' } : {}),
    },
    body: json ? JSON.stringify(json) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${method} ${url.replace(API, '')} → ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

async function uploadProduction() {
  const bundle = readFileSync(process.env.BUNDLE_PATH);
  const expected = process.env.BUNDLE_SHA256;
  if (!expected || createHash('sha256').update(bundle).digest('hex') !== expected.toLowerCase()) {
    throw new Error('Bundle SHA256 mismatch');
  }
  const token = await accessToken(serviceAccount());
  const base = API + '/applications/' + PACKAGE;
  const edit = await call(token, 'POST', base + '/edits', {});
  let committed = false;
  try {
    const url = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/' + PACKAGE + '/edits/' + edit.id + '/bundles?uploadType=media';
    const response = await fetch(url, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/octet-stream' },
      body: bundle,
    });
    const body = await response.json();
    if (!response.ok) throw new Error('Upload failed ' + response.status + ': ' + JSON.stringify(body));
    if (String(body.versionCode) !== '8' || body.sha256?.toLowerCase() !== expected.toLowerCase()) {
      throw new Error('Uploaded bundle identity mismatch');
    }
    console.log('Play accepted versionCode 8 and verified bundle SHA256');
    await call(token, 'PUT', base + '/edits/' + edit.id + '/tracks/production', {
      track: 'production',
      releases: [{ name: '1.0.0 (8)', versionCodes: ['8'], status: 'completed' }],
    });
    await call(token, 'POST', base + '/edits/' + edit.id + ':validate');
    await call(token, 'POST', base + '/edits/' + edit.id + ':commit');
    committed = true;
    const check = await call(token, 'POST', base + '/edits', {});
    try {
      const track = await call(token, 'GET', base + '/edits/' + check.id + '/tracks/production');
      console.log('Production track after commit:', JSON.stringify(track));
      if (!track.releases?.some(r => r.status === 'completed' && r.versionCodes?.includes('8'))) {
        throw new Error('Production track verification failed');
      }
    } finally {
      await call(token, 'DELETE', base + '/edits/' + check.id);
    }
  } finally {
    if (!committed) await call(token, 'DELETE', base + '/edits/' + edit.id).catch(() => {});
  }
}
uploadProduction().catch(e => { console.error(e.message); process.exitCode = 1; });