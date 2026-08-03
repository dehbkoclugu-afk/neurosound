# Design — "Cinematic Sound Atlas"

<!-- impeccable:design-doc -->

The image-led system supersedes Night Deck's typographic record-label presentation after device review showed that its empty cards and rows still read as unfinished. Product behavior and the nighttime operating context remain unchanged.

## Direction contract

**THESIS.** Every sound should be recognizable before it is read. NeuroSound is a cinematic atlas of acoustic environments, not a text catalogue with decorative icons.

**OWN-WORLD.** Dark, tactile, cinematic landscapes and material studies: midnight navy, graphite, forest green, smoked violet and restrained amber/ivory light. Every composition concentrates detail on the right and preserves a calm dark field beneath left-aligned copy. The Player's rotary dial remains the authored control moment; imagery carries discovery and selection surfaces.

**STORY.** The user scans environments and resonant materials, recognizes the state or sound they need, then enters the existing player or layers those scenes in the mixer.

**FIRST VIEWPORT.** Home opens with one large time-aware cinematic intent card, followed by three shorter scene cards. Copy stays readable through a deterministic dark scrim; artwork remains visible on the right.

**FORM.** Operate mode with authored cinematic content. Full-bleed art is reserved for destinations and sound choices; settings, privacy, forms and destructive controls stay on stable operational surfaces.

## Tokens

Source of truth: `constants/theme.ts`.

- **Color** — Restrained strategy (Operate default): warm paper/charcoal neutrals + one ink-blue accent. Five palettes (`light`, `dark`, `night`, `lowContrastLight`, `lowContrastDark`), same shape as before, all values recomputed and contrast-verified (≥4.5:1 for text/accent, ≥3:1 for the three category marker colors against every surface in every palette).
- **Category markers** (`CategoryColors`) — binaural `#5D7A9E` (cool ink blue-gray), solfeggio `#9A5A6B` (dusty maroon), noise `#6B7F55` (moss). Decorative only: icon tint and a small tag/spine swatch, never carrying meaning alone.
- **Intent colors** (`lib/intents.ts`) — one muted ink tone per intent (sleep `#5A7FA2`, focus `#9A733A`, relax `#6E8C61`, meditate `#8F6C8C`), used only as the Home card's spine bar and icon-tag tint.
- **Depth** (`Elevation`) — one token, `Elevation.control`, and one rule: a control the finger *drags along a surface* reads as sitting on that surface. Nothing else in the app is raised. Removing it entirely was tried and reverted — see DESIGN-REVIEW-2 #12.
- **Control sizes** — `AccessibilitySize.minTouchTarget` (48) is an accessibility *floor*, used only where the number exists to keep a finger target big enough. Chosen layout heights live in `ControlSize` (`row: 48`, `cta: 52`) so raising the floor never silently resizes the app, and so nobody writes `minTouchTarget + 4` again.
- **Radius** (`Radius`) — `tag: 4`, `card: 10`, `sheet: 20`. Flatter, more die-cut than the old system's pill/circle defaults; a handful of genuinely circular elements (icon badges, the dial, chips) opt in explicitly.
- **Typography** — same six-level scale as before (largeTitle/title/headline/body/footnote/caption) plus `label` (11pt, tracked, semibold — the one sanctioned tracked-uppercase use, applied system-wide to section headers via `CategoryHeader`, never scattered ad hoc). `FontFamily.mono` (platform monospace: Menlo on iOS, monospace on Android) reserved for numeral-only readouts.

## Components

- **`components/ui/Dial.tsx`** (new) — the Player's signature instrument. Tapping the dial plays/pauses; a needle sweeps like a VU meter while playing and rests at a calm-but-visible angle (never fading toward invisible) while paused. Reanimated-driven; respects `reduceMotion` by jumping between two fixed positions instead of sweeping.
- **`components/player/WaveVisualizer.tsx`** — removed. Fully superseded by `Dial`.
- **`ArtBackground`** — the single image surface for cards, preset rows and active mixer channels. It owns local-image cropping and the left-to-right scrim, so contrast does not depend on a particular source image.
- **`PresetRow` / Mixer picker & channel rows** — every one of the 33 presets resolves to distinct bundled art through `lib/artAssets.ts`. Rows are 92px-tall image surfaces with a stable left text zone; existing search highlighting, category/frequency text, favourite state, band scale, equalizer and accessibility labels remain.
- **`components/ui/Toast.tsx`** — three variants (`success` / `error` / `info`), each with its own icon and live-region politeness. Info is the default; most confirmations are neither good news nor bad.
- **`components/ui/EqualizerBars.tsx`** — three animated bars marking the row whose sound is currently playing, shared by Home, Explore and the Intent screen via `PresetRow`'s `isPlaying`. Holds at three unequal heights under `reduceMotion`; decorative to a screen reader, so the state is spoken in the row's own label instead.
- **`components/ui/Sheet.tsx`** — the one modal grammar. Everything that comes forward arrives from the bottom edge with a grabber, a left-aligned title and a close button; `tall` (85% height) is for content that scrolls. There is no centred dialog and no full-screen modal.
- **Home intent cards** — four full-bleed scenes, with the time-suggested intent given more height. Catalogue metadata remains secondary; the scene and intent name lead.
- **`CategoryHeader`** — section titles now render in the tracked-uppercase `label` style system-wide.

## Languages

Eleven: Turkish, plus the ten the App Store actually runs on (English, Chinese, Japanese, Spanish, German, French, Korean, Portuguese, Italian, Russian). `locales/index.ts` is the single source of truth — i18n's resource bundle, device detection, the picker and the parity test all read from it, so adding a twelfth is a JSON file and one row.

Codes are bare two-letter tags (`pt`, not `pt-BR`): `expo-localization` reports `languageCode`, so detection is a lookup rather than locale matching, and there is one file per language rather than per region. New files are generated from `en.json`'s shape by `scripts/build-locale.py`, which refuses to write anything whose keys or `{{interpolation}}` placeholders don't match.

The picker is a `Sheet`, not a row of pills: two fitted, eleven changed shape per language. Each language is listed under its own name — "Chinese" is no use to someone who only reads Chinese, and that is exactly who the list is for. Flags are a colour cue only, never the identifier; on Android, where system fonts have no flag glyphs, the regional-indicator pair falls back to rendering the two letters, which is the country code it replaced.

## Counters

The app tracks total listening time and session count (`presetsStore`), shown in Settings → About in the tape-counter face. Time is measured as wall-clock deltas between playback start and stop, never a ticking counter: JS timers are throttled while the app is backgrounded, which is exactly when a sleep app is doing its job.

## Assets

- `assets/images/icon.png`, `android-icon-{foreground,background,monochrome}.png`, `splash-icon.png`, `favicon.png` — generated by `scripts/generate-icons.py` from the Dial's own constants (21 ticks across a 270° sweep, dead zone at the bottom, needle at rest). Re-run the script after changing the dial's geometry; the constants are duplicated into the script deliberately, with a note, since Python cannot import the TSX. Replaces a generic "glowing brain silhouette with soundwave rings" stock-feeling icon, and before that a full-circle clock face that was a different drawing from the in-app dial. `app.json` splash/adaptive-icon background colors updated to match the new palette.
- `assets/images/art/intents/*.jpg` — four original ChatGPT-generated scenes used by Home and Intent heroes.
- `assets/images/art/presets/*.jpg` — 33 original ChatGPT-generated scenes/material studies, one per preset. Production prompts live in `docs/ART-ASSET-BRIEFS.md`; all are compressed local JPEGs and add roughly 2.7 MB to the bundle.

## What did not change

Product structure (tabs, screens, routes), all copy and functional behavior, accessibility commitments (reduced motion, low contrast, haptics toggle, epilepsy warning, screen-reader labels), and the privacy/offline-only product facts in PRODUCT.md.

## Finish review

`impeccable-finish-reviewer` isn't available as a named subagent in this harness; a general-purpose agent ran the same fresh-eyes pass instead (disclosed here per the skill's substitution rule) against the screenshot batch and the token/product files, with no knowledge of how the build was done. It found two real defects, both fixed and re-verified before this doc was closed out:

- **Settings switches leaked Material teal on web.** `react-native-web`'s `Switch` reads separate `activeThumbColor`/`activeTrackColor` props for the ON state instead of `thumbColor`/`trackColor.true` — an extension not in RN's official types, and not present on native, where `thumbColor` alone governs both states. Left unset, the ON-state thumb fell back to react-native-web's hardcoded `#009688`, the one stray non-token color in the whole app. Fixed in `app/(tabs)/settings.tsx`.
- **Explore/Intent row Hz readings weren't using the tape-counter mono font.** Only the Player screen and horizontal chips got the treatment `theme.ts` documents as system-wide. Fixed by splitting `PresetCard`'s subline into a regular-font category label and a mono-font Hz reading (nested `Text`), rather than monospacing the whole string.

Two more observations were logged as accepted trade-offs, not defects: the Home intent cards' spine-bar-plus-icon-tag shape sits close to the generic "colored-border-left card" pattern craft-floor warns about (the catalog code and tracked-caps label type are what keep it on the right side of that line); and the Mixer's empty state (icon-in-circle, heading, subtext, link) is a familiar SaaS shape not deeply reskinned into the record-label motif. Both are legitimate targets for a future pass, not blockers.

## Known gaps at finish

- No native-device verification (this environment has no iOS/Android simulator); the Dial's touch target, contrast, and Reanimated performance are unverified on real hardware.
- The `Dial`'s tick-mark density (28 ticks) was tuned for the Player screen's ~216px size; if reused smaller elsewhere, re-check legibility.
