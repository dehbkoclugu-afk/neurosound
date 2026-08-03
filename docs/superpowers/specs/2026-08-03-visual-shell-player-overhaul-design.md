# NeuroSound Visual Shell and Player Overhaul

**Date:** 2026-08-03  
**Status:** Approved direction, pending implementation plan  
**Mode:** Operate  
**Design read:** A nighttime audio utility with a cinematic sound atlas, using a neutral near-black shell, restrained motion, and clear native controls.

## Problem

The cinematic intent and preset artwork improved discovery, but the surrounding shell still belongs to the older warm “Night Deck” system. On a real Android device this creates five visible failures:

1. The dark theme reads brown instead of neutral black.
2. Home metadata is forced into one row and overflows the featured intent card.
3. The Player uses a large rotary dial that crowds copy, errors, volume, and actions into the same vertical space.
4. Settings exposes an unexplained third dark theme named “Night” and presents most controls as an undifferentiated list.
5. The empty Favorites state is plain text outside the ArtSlot system.

The redesign must unify the new imagery with the operational parts of the app without turning every screen into a photo collage.

## Chosen Direction

Use a **Unified Cinematic Atlas**:

- Discovery surfaces remain image-led.
- The Player becomes an immersive, artwork-led destination.
- Settings remains calm and functional, using grouped graphite surfaces rather than photography.
- The application shell moves to a neutral/cool near-black palette with no brown undertone.
- Existing preset artwork is reused on Player pages; only the empty Favorites artwork is newly generated.

Alternatives rejected:

- Full-bleed imagery on every screen would make Settings noisy and reduce scanability.
- A color-and-overflow-only patch would leave the Player visually generic and structurally fragile.

## Theme Model

### User-facing choices

The theme selector contains exactly:

- **Light**
- **Dark**
- **System**

`ThemeMode` becomes `light | dark | auto`. Persisted `night` values migrate to `dark` during hydration. The resolver must honor an explicit `light` or `dark` selection and consult the OS color scheme only for `auto`.

### Dark palette

The dark shell must be neutral and cool without becoming visibly blue:

- App background: near-black around `#080B10`
- Secondary surface: graphite around `#10151D`
- Cards/elevated surfaces: one controlled step lighter
- Borders: cool low-contrast gray-blue
- Primary text: neutral off-white
- Secondary text: cool gray
- Existing ink-blue accent remains the single interaction color

The old brown paper/charcoal values are removed from dark and low-contrast-dark palettes. The Light palette may retain its warm paper character because the complaint is specifically about Dark mode.

### Theme-aware artwork

Every cinematic asset has a Dark and Light counterpart. The Light version preserves the same subject, composition, crop logic, and semantic identity as its Dark source; only the lighting, tonal range, and material color grade change to soft cool daylight. This keeps a sound visually recognizable across theme changes.

- Dark assets remain under `assets/images/art/`.
- Light counterparts live under `assets/images/art/light/` with matching relative paths and filenames.
- Intent, preset, Player, mixer, and empty-state surfaces resolve the pair from the active Light/Dark/System theme.
- Low-contrast palettes use the artwork variant of their underlying light or dark scheme.
- Light surfaces use a deterministic pale scrim and dark foreground tokens rather than forcing white text over a black overlay.

Runtime color filters and completely different Light scenes are rejected: filters look synthetic, while different scenes break recognition across themes.

## Player

### Approved composition

The approved north-star is `.impeccable/mocks/player-a-immersive-scroll.png`: an immersive artwork hero flowing into a neutral scroll surface. The mockup is compositional guidance, not literal UI. Its playback-error panel exists only to prove the failure state has a safe place; it is absent during normal playback. The title, category, frequency, and description remain one coherent information block rather than being split into multiple decorative cards.

### Structure

The large rotary dial is removed from the Player. The page uses a vertically scrollable layout so controls never overlap on short Android screens.

1. **Artwork hero**
   - Uses `presetArt(preset.id)`.
   - Occupies the upper visual region with rounded lower corners or a clean edge into the control surface.
   - Applies a deterministic dark scrim for text and icon contrast.
   - Contains Back, Favorite, playback status, and one large Play/Pause control.
2. **Identity block**
   - Preset name, category, frequency, and description have separate vertical roles.
   - These elements remain within one continuous information block; natural text wrapping is allowed, but the description is not fragmented into separate panels.
   - Solfeggio disclaimers and binaural guidance remain present but visually subordinate.
3. **Error state**
   - Playback errors render in a dedicated inline alert surface between identity and controls.
   - The alert participates in normal layout and cannot overlay the volume heading.
4. **Volume block**
   - Slider and safety-cap explanation remain together in one surface.
5. **Secondary actions**
   - Timer and “Add to mixer” are equal-width labeled actions.

The page must remain usable at the smallest supported Android height, with large font scaling, and when an error is visible.

### Motion

- Hero artwork may use a subtle one-shot entrance and very slow scale/position drift while playing.
- Play/Pause may use a restrained pulse or ring transition.
- No infinite decorative animation competes with the audio controls.
- `reduceMotion` disables all nonessential movement and leaves state changes immediate.

## Home and Discovery

### Featured intent card

The featured card metadata is split into two layout zones instead of one contested row:

- Session duration and recommended sound stay together.
- Catalog code and sound count move to their own compact line/tag.

Both zones use `numberOfLines`, `flexShrink`, and bounded widths. No translated string may render outside the card.

### Preset rows

Rows keep the existing artwork but enforce:

- A bounded left content column.
- A right-anchored artwork field.
- A flexible name/subline that may shrink without pushing navigation affordances off-screen.
- Stable row height across playback, favorite, and equalizer states.

### Mini-player and tab shell

The mini-player and tab bar use the new neutral dark surfaces. Text and inactive icons must remain readable instead of sinking into the brown/black shell. Existing playback behavior is unchanged.

## Empty Favorites

The plain paragraph becomes a full-width ArtSlot card matching the height and radius of the intent-card family.

- Artwork: a quiet midnight sound archive with one softly illuminated empty listening alcove, leaving the left side dark for copy.
- Copy: the existing localized empty-state instruction.
- A heart icon reinforces the action without introducing a new button or dead-end CTA.
- The card is non-interactive unless a meaningful destination is added; decorative surfaces must not pretend to be controls.

## Settings

Settings uses grouped operational surfaces rather than photography:

1. **Appearance** — three theme choices, motion, contrast, haptics.
2. **Audio** — maximum volume and its safety context.
3. **Language** — one navigation row opening the existing language sheet.
4. **Application** — privacy, listening statistics, version, and reset.

Each group receives a contained graphite panel with consistent row dividers, icon treatment, spacing, and selected states. The epilepsy notice remains near Reduce Motion but is visually compact. The reset action remains clearly destructive and separated from ordinary navigation.

No new settings behavior or dependency is introduced.

## Components and Data Boundaries

- `constants/theme.ts`: source of truth for neutral palettes and theme tokens.
- `stores/settingsStore.ts`: user-facing theme union and persisted-value migration.
- `hooks/use-theme-colors.ts`: correct explicit-theme/auto resolution.
- `components/ui/ArtBackground.tsx`: reusable image scrims; extended only if Player needs a hero variant.
- `lib/artAssets.ts`: paired Dark/Light intent, preset, and empty-favorites assets.
- `app/player/[id].tsx`: Player composition and motion.
- `app/(tabs)/index.tsx`: featured metadata reflow and Favorites empty card.
- `components/ui/PresetRow.tsx`: bounded row layout.
- `app/(tabs)/settings.tsx`: grouped settings presentation and three-choice theme selector.
- `components/ui/MiniPlayer.tsx` and tab layout: shell color/contrast refinements only.

Prefer existing React Native, Expo LinearGradient, and Reanimated capabilities. Add no dependency.

## Accessibility and Internationalization

- Maintain 48-point minimum touch targets.
- Preserve semantic roles and labels for transport, favorite, themes, timer, and mixer actions.
- Artwork remains decorative to screen readers.
- All text uses existing localization keys unless copy genuinely changes.
- Layout must survive long German/Portuguese labels and Android font scaling.
- Every image-overlaid text combination uses a fixed scrim, never artwork-dependent contrast.

## Verification

Implementation is complete only when:

- Theme migration and resolver behavior have focused tests.
- Art asset registry tests include the Favorites empty asset.
- TypeScript, lint, and the full test suite pass.
- Android screenshots verify Home, Explore, Player normal/error states, Settings, and empty Favorites at a representative phone size.
- A bounded second screenshot pass confirms that no text or controls overlap.
- A release APK builds and installs for device review.

## Out of Scope

- Audio engine behavior, claims, preset definitions, and playback ownership.
- New subscription or account functionality.
- A new navigation model.
- New artwork for presets that already have approved cinematic assets.
- Broad changes to the Light theme beyond compatibility with the simplified selector.
