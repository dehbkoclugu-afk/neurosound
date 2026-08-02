# Google Play Release Checklist

**Owner/contact:** DEHB Koçluğu — dehbkoclugu@gmail.com

## Repository package

- [x] Package is `com.neurosound.app`; production builds an AAB.
- [x] Android cloud backup is disabled.
- [x] Recording, microphone, legacy storage, and overlay permissions are blocked.
- [x] Privacy policies identify the developer and contact.
- [x] Turkish/English listing copy and store graphics are prepared.
- [x] Unsupported healing claims are removed from all 11 locales.
- [ ] Add commercial distribution-rights evidence for every bundled intent image and sound.

## Console and build

- [ ] Publish `docs/privacy.html` at a public HTTPS URL.
- [ ] Complete App access, Ads, Data safety, Content rating, Target audience, Health apps, and foreground-service declarations.
- [ ] Add protected secrets `EXPO_TOKEN` and `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
- [ ] Build production Android AAB without submit first.
- [ ] Verify signing, version code, target SDK, 16 KB compatibility, and permissions in Play Console.
- [ ] Upload to Internal testing and install from Google Play.

## Physical Android acceptance

- [ ] Returning-user cold start does not redirect to onboarding.
- [ ] Single playback survives lock; lock-screen play/pause resumes correctly.
- [ ] Mixer exposes one media session and controls all channels together.
- [ ] Sleep timer expires while locked, fades, and stops playback.
- [ ] Audio interruption, headphone removal, and notification behavior are acceptable.
- [ ] Review pre-launch report and Android vitals before staged rollout.
