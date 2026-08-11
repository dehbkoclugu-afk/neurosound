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

function describe(track) {
  const releases = (track.releases ?? []).map((r) => {
    const codes = (r.versionCodes ?? []).join(', ') || '—';
    const share = r.userFraction != null ? ` @ ${(r.userFraction * 100).toFixed(0)}%` : '';
    return `${r.status}${share} [${codes}]`;
  });
  return `${track.track.padEnd(12)} ${releases.join(' | ') || '(empty)'}`;
}

async function main() {
  if (!['internal', 'alpha', 'beta', 'production'].includes(TRACK)) {
    throw new Error(`unknown track: ${TRACK}`);
  }
  if (!(ROLLOUT > 0 && ROLLOUT <= 100)) {
    throw new Error(`rollout must be between 1 and 100, got ${ROLLOUT}`);
  }

  const key = serviceAccount();
  const token = await accessToken(key);
  const edit = await call(token, 'POST', `${API}/applications/${PACKAGE}/edits`, {});

  try {
    const { tracks = [] } = await call(token, 'GET',
      `${API}/applications/${PACKAGE}/edits/${edit.id}/tracks`);

    console.log(`package ${PACKAGE}\ncurrent tracks:`);
    for (const t of tracks) console.log(`  ${describe(t)}`);
    console.log();

    // Default to whatever is already the highest version code Play knows
    // about, so promoting does not require looking one up by hand.
    let versionCode = process.env.VERSION_CODE ? Number(process.env.VERSION_CODE) : null;
    if (!versionCode) {
      const codes = tracks.flatMap((t) => (t.releases ?? []).flatMap((r) => r.versionCodes ?? []))
        .map(Number).filter(Number.isFinite);
      if (!codes.length) throw new Error('no version codes on any track — upload a build first');
      versionCode = Math.max(...codes);
      console.log(`no VERSION_CODE given, using the highest Play knows: ${versionCode}`);
    }

    // A completed release reaches everyone; anything less is inProgress with a
    // fraction. Sending userFraction with "completed" is rejected.
    const release = ROLLOUT >= 100
      ? { versionCodes: [String(versionCode)], status: 'completed' }
      : { versionCodes: [String(versionCode)], status: 'inProgress', userFraction: ROLLOUT / 100 };

    console.log(`${DRY_RUN ? 'would set' : 'setting'} ${TRACK} → version ${versionCode} at ${ROLLOUT}%`);

    if (DRY_RUN) {
      await call(token, 'DELETE', `${API}/applications/${PACKAGE}/edits/${edit.id}`);
      console.log('\ndry run — edit discarded, Play unchanged');
      return;
    }

    await call(token, 'PUT',
      `${API}/applications/${PACKAGE}/edits/${edit.id}/tracks/${TRACK}`,
      { track: TRACK, releases: [release] });
    const done = await call(token, 'POST', `${API}/applications/${PACKAGE}/edits/${edit.id}:commit`);
    console.log(`\ncommitted edit ${done.id} — ${TRACK} now serves ${versionCode} at ${ROLLOUT}%`);
  } catch (e) {
    await call(token, 'DELETE', `${API}/applications/${PACKAGE}/edits/${edit.id}`).catch(() => {});
    throw e;
  }
}

main().catch((e) => {
  console.error(`\n${e.message}`);
  process.exit(1);
});
