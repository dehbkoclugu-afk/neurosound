# Product

<!-- impeccable:product-schema 1 -->

## Platform

React Native / Expo, shipping to iOS, Android, and web from one codebase. Not `adaptive`: the product deliberately runs one unified custom visual language across both native platforms rather than adopting iOS HIG or Material 3 conventions per OS. Native affordances (safe-area insets, touch target size, system back gesture, Dynamic Type/font scaling, haptics) still apply on real device hardware regardless of that choice.

## Users

Someone trying to sleep, focus, relax, or meditate, most often at night in a dark room, reaching for the app one-handed while already lying down or winding down. Not a power user auditioning frequencies for their own sake — they arrive with a goal ("I can't sleep") rather than a taxonomy ("binaural or solfeggio?").

## Product Purpose

Plays ambient/therapeutic audio (binaural beats, solfeggio tones, ambient noise) to help the user fall asleep, focus, relax, or meditate. Success is falling asleep, staying focused, or finishing a calm session — not engagement or time-in-app.

## Positioning

Intent-first entry: the home screen asks "what do you need right now?" and routes by goal (Sleep/Focus/Relax/Meditate), with the technical taxonomy (binaural/solfeggio/noise) available one level down for users who want it. No accounts, no backend, no network calls of any kind — everything (favorites, custom mixes, settings) lives in local on-device storage only and is verifiably never transmitted anywhere. A user falling asleep can also layer sounds in a Mixer (up to 4 channels) and save the combination for reuse, with a sleep timer that fades audio out at the end.

## Operating Context

Used mostly at night, lights off or dim, often with the phone screen also dimmed or face-down, frequently with the user already drowsy — this is why the current implementation biases toward a dark-first, low-blue-light palette and large touch targets. Also used during the day for focus (e.g. working) or short relax/meditate breaks. Headphones matter specifically for binaural beats (each ear needs a distinct frequency); the app warns about this once and lets users proceed without headphones for everything else. A lock-screen/background-audio experience matters: users lock their phone and go to sleep while it keeps playing.

## Capabilities and Constraints

- Preset library: binaural beats (5 types), solfeggio frequencies (multiple), ambient noise (multiple types) — ~33 presets total, real bundled audio (no synthesis-on-the-fly).
- Mixer: layer up to 4 presets simultaneously, per-channel volume and mute, save/rename/delete named mixes.
- Sleep timer with gentle fade-out, independent of which single-preset or mixer session is playing.
- Favorites and recently-played history, both local-only.
- Lock-screen/notification playback controls (native, via expo-audio's now-playing integration).
- Reduced-motion, low-contrast, and haptics-toggle accessibility settings; an epilepsy warning tied to the breathing-ring visualizer.
- Turkish and English localization, fully parallel (enforced by an automated test).
- No user accounts, no server, no analytics/telemetry, no third-party SDKs making network calls — confirmed by code audit (no fetch/axios call sites anywhere in the app).
- No in-app purchases or paywall at present.

## Brand Commitments

None fixed going into this redesign. The existing name "NeuroSound," the current warm-amber ("Kor") identity, typography, and every visual token in `constants/theme.ts` are explicitly *not* binding — the user has asked for a full visual redesign and released color, type, and visual language to be reconsidered from scratch. The app name and core information architecture (Home/Explore/Mixer/Settings tabs; Sleep/Focus/Relax/Meditate intents) are product structure, not visual brand, and carry over unless a redesign decision changes them.

## Evidence on Hand

- Full working React Native/Expo source tree with real (bundled, not placeholder) audio assets for every preset.
- Locally generated atmospheric background images per intent (`assets/images/intents/*.jpg`) — real assets, not stock/placeholder.
- No user testimonials, screenshots for a store listing, usage analytics, or real-user feedback beyond this session's own manual/automated testing and the user's stated reaction to the current visual design ("looks like an elementary-school project, the worst UI I've seen").

## Product Principles

1. Goal-first, not taxonomy-first: every entry point should let a tired, half-asleep user reach the right sound in as few decisions as possible.
2. Calm over stimulating: this is would-be sleep/focus/meditation software; motion, color intensity, and information density should never fight the user's actual state (drowsy, low light, one-handed).
3. Absolute local-only privacy is a real product fact, not a footnote — worth being legible in the design, not just the privacy policy.
4. Native device correctness (safe areas, touch targets, gestures, lock-screen controls, Dynamic Type) is non-negotiable regardless of the chosen visual language.
5. Every screen (not just the showcase ones) must reach the same craft bar — this redesign is triggered by the *whole app* reading as unfinished, not one screen.

## Accessibility & Inclusion

Existing commitments to preserve: reduced-motion mode (disables the breathing-ring animation and screen transitions), a low-contrast mode for visual sensitivity that still holds WCAG AA, a haptics toggle, and an epilepsy warning specifically about the breathing-ring visual. Screen-reader labels on preset rows already combine name + category + frequency + favorite state (a past defect where the name alone was announced) — the redesign must not regress this.
