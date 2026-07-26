# Design — "Night Deck"

<!-- impeccable:design-doc -->

Recorded at finish, from the built world (see `git log` around this change for the exact commits). This replaces the app's prior "quiet instrument" identity — a single-amber, typographic, card-free system — after the user rejected it outright ("looks like an elementary-school project, the worst UI I've seen").

## Direction contract

**THESIS.** NeuroSound is already a mixer and a nighttime instrument; the UI should read like one — an analog dial and record-label print system, not another pastel meditation app.

**OWN-WORLD.** Warm paper neutrals (cream in light mode, warm near-black in dark/night) with a single deep ink-blue accent (`#2F5C8A` light / `#7FA8CC` dark, replacing the old amber). Flat printed "record label" cards with a coloured spine bar and a cosmetic catalog code (`ND-01`…`ND-04`) instead of photo-gradient blocks. Tabular "tape-counter" monospace numerals reserved for Hz/frequency and timer readouts only — never for prose. A rotary analog dial (tick marks, needle, hub) is the Player's one authored moment.

**STORY.** The visitor picks a sound like choosing a record, drops the needle to play, mixes multiple sounds like layering tracks, and reads the interface's numerals like a tape counter, not app chrome.

**FIRST VIEWPORT.** Home's intent list is four flat catalog-card rows (Sleep/Focus/Relax/Meditate), each a coloured spine + catalog code + title + description + icon tag — no full-bleed photography repeated four times down the page.

**FORM.** Directions considered: analog hi-fi/mixing-console dial language, planetarium/observatory, aviation night-vision cockpit mode, vinyl/tape-deck ritual (**assigned and built**, `concept-seed.mjs --scope direction --mode operate`, seed key `35b67484`, index 4), apothecary/pharmacy labels, onsen/ryokan paper signage, lighthouse beacon rhythm.

## Tokens

Source of truth: `constants/theme.ts`.

- **Color** — Restrained strategy (Operate default): warm paper/charcoal neutrals + one ink-blue accent. Five palettes (`light`, `dark`, `night`, `lowContrastLight`, `lowContrastDark`), same shape as before, all values recomputed and contrast-verified (≥4.5:1 for text/accent, ≥3:1 for the three category marker colors against every surface in every palette).
- **Category markers** (`CategoryColors`) — binaural `#5D7A9E` (cool ink blue-gray), solfeggio `#9A5A6B` (dusty maroon), noise `#6B7F55` (moss). Decorative only: icon tint and a small tag/spine swatch, never carrying meaning alone.
- **Intent colors** (`lib/intents.ts`) — one muted ink tone per intent (sleep `#5A7FA2`, focus `#9A733A`, relax `#6E8C61`, meditate `#8F6C8C`), used only as the Home card's spine bar and icon-tag tint.
- **Radius** (`Radius`) — `tag: 4`, `card: 10`, `sheet: 20`. Flatter, more die-cut than the old system's pill/circle defaults; a handful of genuinely circular elements (icon badges, the dial, chips) opt in explicitly.
- **Typography** — same six-level scale as before (largeTitle/title/headline/body/footnote/caption) plus `label` (11pt, tracked, semibold — the one sanctioned tracked-uppercase use, applied system-wide to section headers via `CategoryHeader`, never scattered ad hoc). `FontFamily.mono` (platform monospace: Menlo on iOS, monospace on Android) reserved for numeral-only readouts.

## Components

- **`components/ui/Dial.tsx`** (new) — the Player's signature instrument. Tapping the dial plays/pauses; a needle sweeps like a VU meter while playing and rests at a calm-but-visible angle (never fading toward invisible) while paused. Reanimated-driven; respects `reduceMotion` by jumping between two fixed positions instead of sweeping.
- **`components/player/WaveVisualizer.tsx`** — removed. Fully superseded by `Dial`.
- **`PresetCard` / Mixer picker & channel rows** — icon sits in a tinted circular tag (category color at 16% alpha) rather than floating bare, giving list rows a visual anchor. Shared `presetIcon()` helper (exported from `PresetCard.tsx`) keeps the type→icon mapping in one place.
- **Home intent cards** — flat card, coloured left spine, catalog code in tracked mono caps, icon tag, title, description. No photography in the repeated grid; the Intent *detail* screen keeps its real photographic hero (a single full-bleed moment earns it; the repeated list does not).
- **`CategoryHeader`** — section titles now render in the tracked-uppercase `label` style system-wide.

## Assets

- `assets/images/icon.png`, `android-icon-{foreground,background,monochrome}.png`, `splash-icon.png`, `favicon.png` — regenerated (Pillow, supersampled + alpha-composited) as the dial mark itself, replacing a generic "glowing brain silhouette with soundwave rings" stock-feeling icon. `app.json` splash/adaptive-icon background colors updated to match the new palette.
- `assets/images/intents/*.jpg` — unchanged; still real locally-generated atmospheric art, used only on the Intent detail hero.

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
