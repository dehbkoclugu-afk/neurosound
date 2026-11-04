# App Review notes

App Store Connect › App Review Information › Notes alanına aşağıdaki İngilizce metni olduğu gibi yapıştır. "Sign-in required" kutusunu **işaretleme**; uygulamada hesap yok.

---

852Hz is an offline sound player for sleep, focus, and relaxation: ambient sounds (rain, ocean, fan, noise colours), binaural beats, and single-frequency tones, plus a four-channel mixer and a sleep timer.

No account or sign-in. All content is bundled in the app; it makes no network requests except StoreKit.

How to review the main features:
1. Launch → onboarding (3 short pages) → "Skip" or "Get started".
2. Home: tap "Start … min session" on the top card — a sound starts with a sleep timer already set.
3. Explore tab: browse sounds; items with a lock icon are Premium.
4. Mixer tab: tap one of the ready-made mixes (e.g. "Rain + Brown Noise + Delta") to hear layered playback, or "Add sound".
5. Player: tap the timer icon and pick 15 minutes, then lock the device — audio keeps playing in the background (UIBackgroundModes: audio) with lock-screen controls, and fades out and stops when the timer ends. Background audio is the app's core function: users fall asleep with the screen off.

In-app purchases (Premium unlocks the locked binaural beats and Solfeggio tones):
- premium_monthly — auto-renewable, 1 month
- premium_yearly — auto-renewable, 1 year (with free trial)
- premium_lifetime — non-consumable
Open any locked sound (lock icon in Explore) to reach the Premium screen. "Restore purchases" is on the same screen. Terms of Use (Apple standard EULA) and Privacy Policy links are under the plans.

Headphones: binaural beats need headphones to be perceived; ambient sounds work on the speaker.

Health: the app makes no medical claims. Onboarding and each Solfeggio screen state that it is not a medical product and that no medical benefit is claimed.

Microphone: the app never records or requests microphone access. NSMicrophoneUsageDescription is present only because the audio library (expo-audio) links recording APIs; the permission prompt is never shown.

Data: no data collected, no tracking, no analytics, no ads. Favourites and settings are stored only on the device.

Contact: dehbkoclugu@gmail.com
