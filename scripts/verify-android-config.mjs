import { readFileSync } from 'node:fs';

const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const expo = app.expo ?? {};
const android = expo.android ?? {};
const blocked = [
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.SYSTEM_ALERT_WINDOW',
];
const audio = (expo.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-audio');
const errors = [];
if ('_orientationNote' in expo) errors.push('unsupported expo._orientationNote');
if (android.allowBackup !== false) errors.push('android.allowBackup must be false');
for (const permission of blocked) {
  if (!android.blockedPermissions?.includes(permission)) errors.push(`missing ${permission}`);
}
if (!audio || audio[1]?.recordAudioAndroid !== false || audio[1]?.microphonePermission !== false) {
  errors.push('expo-audio recording and microphone must be disabled');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Android release configuration is explicit and privacy-safe.');
