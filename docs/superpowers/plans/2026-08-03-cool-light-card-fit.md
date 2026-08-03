# Cool Light Shell and Card Fit Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox syntax.

**Goal:** Remove Android artwork gaps and replace the yellow Light shell with a cool fog palette that matches the paired artwork.

**Architecture:** `ArtBackground` remains the single crop owner for every image-backed card and row, so one full-width image-style correction fixes all consumers. `constants/theme.ts` remains the only palette source; existing contrast tests protect the new Light and low-contrast-Light values.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript, Expo LinearGradient, Jest.

## Global Constraints

- Add no dependency and change no navigation, playback, dimensions, copy, or touch behavior.
- Preserve the paired Dark/Light artwork registry and existing theme resolution.
- Fix the root cause in shared primitives rather than adding per-screen offsets.

---

### Task 1: Make artwork fill every clipped surface

**Files:**
- Modify: `components/ui/ArtBackground.tsx`
- Test: `lib/__tests__/artAssets.test.ts`

**Interfaces:**
- Consumes: `ArtBackgroundProps.source`, `variant`, and `resizeMode="cover"`
- Produces: a full-bounds image layer with theme-specific directional scrim

- [ ] **Step 1: Confirm the failing device condition** by locating the percentage `left` and `width` image style that leaves the right Android gap.
- [ ] **Step 2: Implement the minimum correct change** by removing percentage positioning and keeping the default full-bounds image layout; retain the hero override only if it remains necessary.
- [ ] **Step 3: Run verification** with `npx tsc --noEmit`, `EXPO_NO_TELEMETRY=1 npm run lint`, and `npm test -- --runInBand`; expect success.
- [ ] **Step 4: Commit** `components/ui/ArtBackground.tsx` as `fix: make artwork fill card bounds`.

### Task 2: Replace warm paper with cool fog tokens

**Files:**
- Modify: `constants/theme.ts`
- Modify: `constants/__tests__/contrast.test.ts`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: `Colors.light`, `Colors.lowContrastLight`
- Produces: cool fog backgrounds, cool near-white cards, blue-gray borders and graphite text while retaining ink-blue interaction colors

- [ ] **Step 1: Update the contrast fixture expectations** to the approved Light surfaces: background `#F1F4F7`, secondary `#E8EDF2`, card `#F8FAFC`, border/slider `#D5DDE6`, and graphite foregrounds.
- [ ] **Step 2: Run `npm test -- --runInBand constants/__tests__/contrast.test.ts`** and verify it fails against the old warm values.
- [ ] **Step 3: Implement the minimum correct token change** in both Light palettes without changing Dark tokens or the ink-blue accent family.
- [ ] **Step 4: Record the cool-fog Light shell and full-bounds crop rule** in `DESIGN.md`.
- [ ] **Step 5: Run full verification** with TypeScript, lint, Jest, Android config, workflow, store-asset checks, and a static Expo web export; expect success.
- [ ] **Step 6: Commit** the palette, test, and design doc as `fix: align light shell with artwork`.

### Task 3: Publish the device-review build

**Files:**
- No production source changes beyond Tasks 1–2

**Interfaces:**
- Consumes: the verified branch head
- Produces: pushed branch, pull request, green CI, merged `master`, and downloadable Android APK artifact

- [ ] **Step 1: Inspect `git status -sb` and `git diff --check`**; expect only intended changes and a clean patch.
- [ ] **Step 2: Push the branch and open a ready pull request** targeting `master` with validation results and the Android root cause.
- [ ] **Step 3: Wait for CI** and inspect logs if any check fails.
- [ ] **Step 4: Build the test APK** through GitHub Actions and verify the downloaded file type and SHA-256.
- [ ] **Step 5: Remove any temporary workflow used only to trigger the APK build, rerun CI, and squash-merge the PR.**
