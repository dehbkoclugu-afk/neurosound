# NeuroSound Visual Shell and Player Overhaul Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox syntax.

**Goal:** Replace the warm-brown dark shell with a neutral near-black system and ship an artwork-led, overlap-safe Player plus consistent Home, Favorites, preset-row, mini-player, and Settings surfaces.

**Architecture:** Theme persistence and palette resolution move through one pure helper so persisted legacy values and explicit theme choices cannot diverge. Existing preset artwork remains the single source for discovery and Player imagery; one new registered asset serves the empty Favorites state. Screen changes reuse the existing React Native, Expo LinearGradient, Reanimated, and store patterns without adding dependencies.

**Tech Stack:** Expo Router, React Native, TypeScript, Zustand, Expo LinearGradient, React Native Reanimated, Jest, Expo lint.

## Global Constraints

- Preserve audio-engine behavior, playback ownership, preset data, localization coverage, and navigation structure.
- Add no runtime dependency.
- Keep every interactive target at least 48 points and retain existing accessibility labels/roles.
- All optional motion must respect `reduceMotion`.
- Text over artwork must use deterministic scrims and remain bounded under Turkish, German, and Portuguese copy.
- Make each task an independently useful commit; do not mix unrelated refactors.

---

### Task 1: Correct theme persistence, resolution, and neutral dark tokens

**Files:**
- Create: `lib/themeMode.ts`
- Create: `lib/__tests__/themeMode.test.ts`
- Modify: `stores/settingsStore.ts`
- Modify: `hooks/use-theme-colors.ts`
- Modify: `constants/theme.ts`

**Interfaces:**
- Consumes: persisted unknown theme value, `ThemeMode`, OS scheme `light | dark | null | undefined`, and `lowContrast: boolean`.
- Produces: `normalizeThemeMode(value): ThemeMode` and `resolvePaletteKey(theme, systemScheme, lowContrast): PaletteKey`.

- [ ] **Step 1: Write the failing theme tests**

  ```ts
  import { normalizeThemeMode, resolvePaletteKey } from '../themeMode';

  describe('theme mode', () => {
    it('migrates the removed night mode to dark', () => {
      expect(normalizeThemeMode('night')).toBe('dark');
      expect(normalizeThemeMode('unknown')).toBe('dark');
    });

    it('honors explicit themes and uses the OS only for auto', () => {
      expect(resolvePaletteKey('light', 'dark', false)).toBe('light');
      expect(resolvePaletteKey('dark', 'light', false)).toBe('dark');
      expect(resolvePaletteKey('auto', 'light', false)).toBe('light');
      expect(resolvePaletteKey('auto', 'dark', true)).toBe('lowContrastDark');
    });
  });
  ```

- [ ] **Step 2: Run the focused test and verify it fails**

  Run `npm test -- --runInBand lib/__tests__/themeMode.test.ts`. Expected: module/functions are missing.

- [ ] **Step 3: Implement the pure theme helper and migration**

  Define `ThemeMode = 'light' | 'dark' | 'auto'`, `PaletteKey = 'light' | 'dark' | 'lowContrastLight' | 'lowContrastDark'`, normalize legacy/invalid values to `dark`, and resolve explicit choices before OS `auto`. Update Zustand persistence with a versioned `migrate` callback and normalize any restored theme.

- [ ] **Step 4: Replace warm dark tokens**

  Recompute `dark` and `lowContrastDark` around `#080B10`, `#10151D`, cool gray borders, neutral off-white text, and the existing ink-blue accent. Remove the user-facing dependency on `Colors.night`; delete the palette if no caller remains.

- [ ] **Step 5: Verify the theme unit**

  Run `npm test -- --runInBand lib/__tests__/themeMode.test.ts`, `npx tsc --noEmit`, and `git diff --check`. Expected: all pass.

- [ ] **Step 6: Commit**

  Commit `lib/themeMode.ts lib/__tests__/themeMode.test.ts stores/settingsStore.ts hooks/use-theme-colors.ts constants/theme.ts` with `fix: make dark mode neutral and deterministic`.

---

### Task 2: Replace the rotary Player with an artwork-led scroll layout

**Files:**
- Modify: `components/ui/ArtBackground.tsx`
- Modify: `app/player/[id].tsx`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: `presetArt(preset.id)`, current preset/store state, `reduceMotion`, timer, playback error, and existing controller actions.
- Produces: a scrollable Player with an artwork hero, normal-flow error callout, isolated volume surface, and labeled secondary actions.

- [ ] **Step 1: Add a Player-specific ArtBackground variant**

  Add `hero` to the variant union. Use a vertical/bottom-weighted scrim appropriate for header/title/control contrast while preserving existing `card`, `row`, and `channel` rendering unchanged.

- [ ] **Step 2: Recompose the Player hierarchy**

  Replace the fixed `flex: 1` dial composition with a `ScrollView`. Follow `.impeccable/mocks/player-a-immersive-scroll.png`: render the artwork hero first, overlay Back/Favorite/status, and use the existing `TransportButton` at an appropriately large size for Play/Pause. Keep title, category/frequency, description, and guidance in one continuous identity block; render the conditional error, volume, and actions as subsequent normal-flow sections.

- [ ] **Step 3: Add restrained motion**

  Apply a one-shot hero entrance and a subtle playing-state art scale/translation using existing Reanimated APIs. When `reduceMotion` is true, render identity transforms with no entering animation.

- [ ] **Step 4: Remove obsolete dial coupling**

  Remove Player imports/styles/comments tied to `Dial`, but leave `components/ui/Dial.tsx` untouched unless repository search proves it has no remaining callers and deletion is independently safe.

- [ ] **Step 5: Verify Player structure**

  Run `rg -n "<Dial|from '@/components/ui/Dial'" app components`, `npx tsc --noEmit`, `CI=1 EXPO_NO_TELEMETRY=1 npx expo lint`, and `git diff --check`. Expected: no Player dial call, no type/lint errors.

- [ ] **Step 6: Commit**

  Commit `components/ui/ArtBackground.tsx app/player/[id].tsx DESIGN.md` with `feat: rebuild player around cinematic artwork`.

---

### Task 3: Fix Home overflow and create the empty Favorites ArtSlot

**Files:**
- Create: `assets/images/art/states/favorites-empty.jpg`
- Modify: `lib/artAssets.ts`
- Modify: `lib/__tests__/artAssets.test.ts`
- Modify: `app/(tabs)/index.tsx`
- Modify: `docs/ART-ASSET-BRIEFS.md`
- Modify: `docs/ASSET_PROVENANCE.md`

**Interfaces:**
- Consumes: existing intent metadata, localized Favorites copy, and the new static asset.
- Produces: bounded featured-card metadata and `stateArt('favorites-empty')` for a full-height empty Favorites card.

- [ ] **Step 1: Extend the failing registry test**

  Add:

  ```ts
  import { stateArt } from '../artAssets';

  it('registers the favorites empty state artwork', () => {
    expect(stateArt('favorites-empty')).toBeTruthy();
  });
  ```

- [ ] **Step 2: Run the focused test and verify it fails**

  Run `npm test -- --runInBand lib/__tests__/artAssets.test.ts`. Expected: `stateArt` is missing.

- [ ] **Step 3: Generate one project-bound asset with built-in image generation**

  Generate a cinematic dark midnight sound archive with one softly illuminated empty listening alcove, detail concentrated on the right, a calm near-black field on the left, no people, text, logos, UI, neon, or brown cast. Save the selected JPG as `assets/images/art/states/favorites-empty.jpg`, inspect it, and record the final prompt/provenance.

- [ ] **Step 4: Register the state asset**

  Add a typed `STATE_ART` record and `stateArt(id)` accessor without changing existing intent/preset accessors.

- [ ] **Step 5: Reflow featured metadata and render the empty card**

  Split duration/recommended sound from catalog code/sound count; add bounded widths, shrink behavior, and line limits. Replace the empty paragraph with a non-interactive ArtSlot card matching intent-card height/radius and containing a heart badge plus existing localized copy.

- [ ] **Step 6: Verify Home and registry**

  Run `npm test -- --runInBand lib/__tests__/artAssets.test.ts`, `npx tsc --noEmit`, and `git diff --check`. Expected: all pass.

- [ ] **Step 7: Commit**

  Commit the asset, registry, test, Home, and asset docs with `feat: give favorites an artwork-led empty state`.

---

### Task 4: Harden preset rows and shell chrome

**Files:**
- Modify: `components/ui/PresetRow.tsx`
- Modify: `components/ui/MiniPlayer.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: existing preset, favorite/playback state, mini-player state, and resolved palette.
- Produces: stable row geometry and readable neutral mini-player/tab surfaces with unchanged actions.

- [ ] **Step 1: Bound row content**

  Give icon, content, playback indicator, and chevron explicit shrink/grow behavior; set `minWidth: 0` on the text column; keep title/subline line-limited; prevent the equalizer and chevron from being pushed outside the row.

- [ ] **Step 2: Refine mini-player geometry**

  Keep the existing sibling-button accessibility structure, ensure the info column uses `minWidth: 0`, and use the resolved `miniPlayer` surface instead of the page background.

- [ ] **Step 3: Refine tab contrast**

  Remove `night`-specific label/height behavior and render one consistent tab geometry for Light, Dark, and System modes. Keep safe-area handling unchanged.

- [ ] **Step 4: Verify shell changes**

  Run `npx tsc --noEmit`, `CI=1 EXPO_NO_TELEMETRY=1 npx expo lint`, and `git diff --check`. Expected: all pass.

- [ ] **Step 5: Commit**

  Commit the three UI files with `fix: stabilize sound rows and playback chrome`.

---

### Task 5: Produce and resolve Light artwork counterparts

**Files:**
- Create: `assets/images/art/light/intents/*.jpg`
- Create: `assets/images/art/light/presets/*.jpg`
- Create: `assets/images/art/light/states/favorites-empty.jpg`
- Modify: `lib/artAssets.ts`
- Modify: `lib/__tests__/artAssets.test.ts`
- Modify: `components/ui/ArtBackground.tsx`
- Modify: artwork-consuming screens/components returned by `rg -n "intentArt|presetArt|stateArt" app components`
- Modify: `docs/ART-ASSET-BRIEFS.md`
- Modify: `docs/ASSET_PROVENANCE.md`

**Interfaces:**
- Consumes: one Dark source asset, active resolved `light | dark` scheme, and existing artwork IDs.
- Produces: an `ArtworkPair` for every intent, preset, and state plus theme-correct source/scrim/foreground rendering.

- [ ] **Step 1: Extend registry tests to require both variants**

  Assert every intent, every preset, and `favorites-empty` returns truthy `dark` and `light` sources and that preset ID sets remain exact.

- [ ] **Step 2: Generate 38 Light edits with built-in image generation**

  For each Dark source, preserve subject, camera, composition, crop-safe left/right zones, and semantic identity. Change only illumination and tonal grade to soft cool daylight with airy ivory-gray highlights, natural restrained color, no brown/sepia cast, text, people, logos, neon, HDR, or new objects. Save compressed JPEG counterparts under `assets/images/art/light/` with matching relative names.

- [ ] **Step 3: Register typed artwork pairs**

  Define `ArtworkPair = { dark: ImageSourcePropType; light: ImageSourcePropType }` and return pairs from intent, preset, and state accessors.

- [ ] **Step 4: Resolve pair, scrim, and foreground from the active scheme**

  Add one shared artwork-appearance hook. Dark uses existing dark scrims/white foreground; Light uses pale deterministic scrims/dark graphite foreground. Update every artwork consumer without duplicating theme logic.

- [ ] **Step 5: Verify asset coverage and UI types**

  Run `npm test -- --runInBand lib/__tests__/artAssets.test.ts`, `npx tsc --noEmit`, `CI=1 EXPO_NO_TELEMETRY=1 npx expo lint`, and `git diff --check`. Expected: all pass.

- [ ] **Step 6: Commit**

  Commit Light assets, registry, consumers, tests, and provenance with `feat: pair cinematic artwork with light mode`.

---

### Task 6: Rebuild Settings as grouped operational panels

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Interfaces:**
- Consumes: three `ThemeMode` choices, existing accessibility/audio/language/about settings and actions.
- Produces: Appearance, Audio, Language, and Application panels with consistent row/divider/icon/selection treatment.

- [ ] **Step 1: Reduce the theme selector to three choices**

  Remove the `night` option and render Light, Dark, and System as three equal, understandable choices with swatches and radio semantics.

- [ ] **Step 2: Group settings into panels**

  Wrap each logical group in one graphite/card surface, use shared row spacing and internal dividers, keep destructive Reset visually separated, and preserve every existing action.

- [ ] **Step 3: Compact the epilepsy notice**

  Keep it adjacent to Reduce Motion, reduce its visual dominance, and retain the warning content and semantic readability.

- [ ] **Step 4: Check localization and accessibility**

  Reuse the existing `settings.themes.light`, `settings.themes.dark`, and `settings.themes.auto` keys without changing copy. Confirm theme options retain `accessibilityRole="radio"` and selected state.

- [ ] **Step 5: Verify Settings**

  Run `npm test -- --ci`, `npx tsc --noEmit`, `CI=1 EXPO_NO_TELEMETRY=1 npx expo lint`, and `git diff --check`. Expected: all pass.

- [ ] **Step 6: Commit**

  Commit Settings and any locale changes with `feat: clarify and group application settings`.

---

### Task 7: Bounded visual QA, release verification, and delivery

**Files:**
- Modify: only files implicated by the first screenshot pass
- Create: `tmp/qa/home.png`
- Create: `tmp/qa/explore.png`
- Create: `tmp/qa/player-error.png`
- Create: `tmp/qa/settings.png`

**Interfaces:**
- Consumes: completed branch and representative Home, Explore, Player, Settings, and empty-Favorites states.
- Produces: verified UI, release-ready commit history, APK, pushed branch, and pull request.

- [ ] **Step 1: Run the complete automated gate**

  Run `npm test -- --ci`, `npx tsc --noEmit`, `CI=1 EXPO_NO_TELEMETRY=1 npx expo lint`, `npm run verify:android-config`, `npm run verify:workflows`, `npm run verify:store-assets`, and `npx expo export --platform web`. Expected: all pass.

- [ ] **Step 2: Capture one bounded visual QA pass**

  At approximately 390×844, capture Home with the featured metadata and empty Favorites, Explore with long rows, Player with an error visible, and Settings. Inspect overflow, contrast, touch targets, safe-area clearance, and mini-player/tab stacking together.

- [ ] **Step 3: Fix every issue from the first pass in one batch**

  Modify only implicated files, then rerun TypeScript, lint, and focused tests.

- [ ] **Step 4: Capture one confirmation pass**

  Re-capture the same states once. Expected: no clipped text, overlapping controls, brown shell, or inaccessible contrast.

- [ ] **Step 5: Build and checksum the Android APK**

  Use the repository's Android APK GitHub Actions path, download the artifact, extract the APK, and calculate SHA-256. Expected: successful release APK artifact.

- [ ] **Step 6: Publish**

  Push `agent/visual-shell-player-overhaul`, open a draft PR against `master`, wait for CI, remove any one-time workflow from the final tree, mark ready, and merge only after checks pass and existing user authorization still covers the merge.
