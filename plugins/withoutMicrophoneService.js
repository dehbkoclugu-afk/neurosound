/**
 * Drop expo-audio's recording service from the merged manifest.
 *
 * expo-audio ships two foreground services and its own config plugin only
 * ever touches permissions (`recordAudioAndroid: false` strips RECORD_AUDIO
 * and stops there — see node_modules/expo-audio/plugin/build/withAudio.js).
 * So `AudioRecordingService`, declared with
 * `android:foregroundServiceType="microphone"`, survives into the release
 * manifest of an app that blocks the microphone permission outright and never
 * records anything.
 *
 * It could never start. The cost is not runtime, it is submission: Play reads
 * the declared foreground-service types out of the manifest and asks for a
 * written justification of each one, and there is no honest justification for
 * microphone use here. Removing the declaration leaves exactly the one type
 * this app actually uses, mediaPlayback.
 *
 * Verify with `gradlew :app:processReleaseManifest` and grep the result in
 * android/app/build/intermediates/merged_manifest/ for foregroundServiceType.
 */

const { withAndroidManifest } = require('expo/config-plugins');

const SERVICE = 'expo.modules.audio.service.AudioRecordingService';
const TOOLS_NS = 'http://schemas.android.com/tools';

module.exports = function withoutMicrophoneService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // `tools:node` is inert without the namespace, and the merger keeps the
    // service instead of removing it — silently, which is the bad failure.
    manifest.$ = manifest.$ ?? {};
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] ?? TOOLS_NS;

    const application = manifest.application?.[0];
    if (!application) return config;

    application.service = application.service ?? [];
    const existing = application.service.find(
      (service) => service.$?.['android:name'] === SERVICE
    );

    if (existing) {
      existing.$['tools:node'] = 'remove';
    } else {
      // The library's manifest is merged after this runs, so the removal marker
      // normally has nothing to attach to yet and has to be added on its own.
      application.service.push({ $: { 'android:name': SERVICE, 'tools:node': 'remove' } });
    }

    return config;
  });
};
