# NeuroSound ArtSlot Redesign Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox syntax.

**Goal:** Replace text-heavy sound choices with locally bundled cinematic artwork on every intent card and sound row.

**Architecture:** A static asset registry maps intent and preset ids to local images. One reusable `ArtBackground` primitive owns cropping and scrims; existing `PresetRow`, Home intent cards, and mixer channel rows consume it without changing navigation or playback behavior.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript, `expo-image`, `expo-linear-gradient`, Jest.

## Global Constraints

- Keep all imagery offline and bundled; add no dependency and no network call.
- Preserve existing accessibility labels, touch targets, localization, playback, favourites, search, and reduced-motion behavior.
- Use ChatGPT-generated art with no embedded text, logos, faces, or UI.

---

### Task 1: Lock the asset contract

**Files:**
- Create: `lib/artAssets.ts`
- Create: `__tests__/artAssets.test.ts`
- Create: `docs/ART-ASSET-BRIEFS.md`

**Interfaces:**
- Consumes: `IntentId`, `FrequencyPreset.id`
- Produces: `intentArt(id)` and `presetArt(id)` returning bundled image sources

- [ ] **Step 1: Write the failing test** asserting every intent and every preset id resolves to an art source.
- [ ] **Step 2: Run it and verify the expected failure** with `npm test -- --runInBand __tests__/artAssets.test.ts`.
- [ ] **Step 3: Implement the minimum correct change** with static `require(...)` maps and record the exact prompt/file contract.
- [ ] **Step 4: Run verification** and expect the registry completeness test to pass.
- [ ] **Step 5: Commit** `lib/artAssets.ts`, the test, and the briefs as `feat: define local art asset registry`.

### Task 2: Produce and optimize artwork

**Files:**
- Create: `assets/images/art/intents/*`
- Create: `assets/images/art/presets/*`

**Interfaces:**
- Consumes: prompts and filenames in `docs/ART-ASSET-BRIEFS.md`
- Produces: compressed landscape raster assets referenced by `lib/artAssets.ts`

- [ ] **Step 1: Generate the approved intent and preset scenes** with ChatGPT built-in image generation, one semantic prompt per source image.
- [ ] **Step 2: Inspect source images** for text, artifacts, misplaced focal points, and inconsistent style.
- [ ] **Step 3: Resize and compress** to mobile-appropriate landscape files while retaining source crops.
- [ ] **Step 4: Run verification** with the registry test and `scripts/verify-store-assets.mjs`.
- [ ] **Step 5: Commit** image assets as `feat: add cinematic sound artwork`.

### Task 3: Build the shared art surface

**Files:**
- Create: `components/ui/ArtBackground.tsx`
- Create: `__tests__/ArtBackground.test.tsx`

**Interfaces:**
- Consumes: React Native `ImageSourcePropType`, optional scrim strength, children
- Produces: clipped local image background with a deterministic dark text-safe scrim

- [ ] **Step 1: Write the failing test** checking artwork, scrim, and children render without changing accessibility ownership.
- [ ] **Step 2: Run it and verify the expected failure** with `npm test -- --runInBand __tests__/ArtBackground.test.tsx`.
- [ ] **Step 3: Implement the minimum correct change** using the installed `expo-image` and `expo-linear-gradient` packages.
- [ ] **Step 4: Run verification** and expect the component test to pass.
- [ ] **Step 5: Commit** as `feat: add reusable art background`.

### Task 4: Redesign intent cards and preset rows

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `components/ui/PresetRow.tsx`
- Modify: `app/intent/[id].tsx`

**Interfaces:**
- Consumes: `intentArt`, `presetArt`, `ArtBackground`
- Produces: image-led Home cards and 88–96 px sound rows across Home, Explore, and Intent screens

- [ ] **Step 1: Add focused render assertions** for artwork sources and preserved accessibility labels.
- [ ] **Step 2: Run them and verify the expected failure**.
- [ ] **Step 3: Replace the Home label-card chrome and `PresetRow` hairline layout** while preserving handlers and state indicators.
- [ ] **Step 4: Run `npm test -- --runInBand`, `npm run lint`, and `npx tsc --noEmit`** and expect success.
- [ ] **Step 5: Commit** as `feat: make sound choices image led`.

### Task 5: Carry artwork into mixer channels

**Files:**
- Modify: `app/(tabs)/mixer.tsx`

**Interfaces:**
- Consumes: selected channel `preset.id`, `presetArt`, `ArtBackground`
- Produces: image-backed active channels while keeping sliders and buttons stable

- [ ] **Step 1: Add a render assertion** that an active channel resolves its preset artwork.
- [ ] **Step 2: Run it and verify the expected failure**.
- [ ] **Step 3: Add the restrained right-side artwork layer** without changing mixer controller calls.
- [ ] **Step 4: Run full tests, lint, TypeScript, and Android configuration verification** and expect success.
- [ ] **Step 5: Commit** as `feat: add artwork to mixer channels`.

### Task 6: Visual QA and documentation

**Files:**
- Modify: `DESIGN.md`
- Modify: `docs/ASSET_PROVENANCE.md`
- Update: `store/google-play/assets/phone/tr-TR/*.png`
- Update: `store/google-play/assets/phone/en-US/*.png`

**Interfaces:**
- Consumes: completed app render
- Produces: verified design contract, provenance, and current store screenshots

- [ ] **Step 1: Capture one batched mobile screenshot set** for Home, Explore, Intent, and Mixer in Turkish and English.
- [ ] **Step 2: Fix crop, contrast, overflow, repetition, and touch-target defects in one bounded pass**.
- [ ] **Step 3: Capture one confirmation batch** and verify the accepted direction against the design specification.
- [ ] **Step 4: Run `npm test -- --runInBand`, `npm run lint`, `npx tsc --noEmit`, and release verification scripts** and expect success.
- [ ] **Step 5: Commit** docs and screenshots as `docs: record cinematic sound atlas design`.

