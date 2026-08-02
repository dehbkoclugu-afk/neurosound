import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const apk = read('.github/workflows/android-apk.yml');
const eas = read('.github/workflows/eas-build.yml');
const errors = [];
const need = (source, text, message) => { if (!source.includes(text)) errors.push(message); };
need(apk, 'set -euo pipefail', 'APK smoke must use strict shell');
need(apk, 'adb shell pidof com.neurosound.app', 'APK smoke must check process');
need(apk, 'FATAL EXCEPTION', 'APK smoke must inspect Java crashes');
need(apk, 'Fatal signal', 'APK smoke must inspect native crashes');
need(eas, 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', 'missing Play service-account secret');
need(eas, 'jq -e', 'service-account JSON must be validated');
need(eas, 'chmod 600 play-service-account.json', 'credential permissions missing');
need(eas, 'if: always()', 'credential cleanup must always run');
need(eas, 'rm -f play-service-account.json', 'credential cleanup missing');
need(eas, '--profile production', 'submit must use production profile');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('GitHub release workflows have explicit failure and credential gates.');
