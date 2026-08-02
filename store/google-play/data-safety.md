# Google Play Data Safety Worksheet

**App:** NeuroSound (`com.neurosound.app`)  
**Developer:** DEHB Koçluğu — dehbkoclugu@gmail.com  
**Prepared:** 2026-08-01

This worksheet must be compared with the final AAB before Play Console submission.

| Play question | Proposed answer | Evidence |
|---|---|---|
| Does the app collect or share user data? | No | No account, backend, analytics, or ads SDK. Preferences and mixes use on-device storage. |
| Is data transferred off-device? | No | No application network call sites; audio and images are bundled. |
| Account deletion required? | Not applicable | The app has no account system. |
| Microphone or recording? | No | Recording is disabled in Expo Audio and the permission is blocked. |
| Location, contacts, identifiers? | No | No matching permission or product flow. |
| Foreground service? | Media playback only | Playback is user-started and controllable from notification/lock screen. |
| Health feature? | No medical function claimed | No diagnosis, treatment, or outcome promise. |

Android cloud backup is disabled. Re-check the generated manifest and SDK Index against the final signed AAB.
