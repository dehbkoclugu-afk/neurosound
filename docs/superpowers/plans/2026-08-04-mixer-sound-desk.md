# Mixer Sound Desk Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox syntax.

**Goal:** Recompose Mixer into one artwork-led session deck with compact channel rails and saved-mix cards without changing audio behavior.

**Architecture:** `MixerScreen` remains the state/controller boundary. Small file-local presentational functions render the session deck, channel strips, empty action, and saved mix cards using existing `ArtBackground`, `Slider`, `TransportButton`, and artwork registry APIs.

**Tech Stack:** React Native, Expo, Zustand, existing audio controller, Jest, TypeScript.

## Global Constraints

- Do not modify the audio engine, controller signatures, timer behavior, mix persistence shape, or four-channel limit.
- Reuse existing art and shared controls; add no waveform, drag reorder, new asset, or dependency.

---

### Task 1: Recompose the active session deck

**Files:**
- Modify: `app/(tabs)/mixer.tsx`
- Test: `app/(tabs)/__tests__/mixer-layout.test.ts`

**Interfaces:**
- Consumes: `channels`, `isPlaying`, timer state, master volume, first valid preset artwork.
- Produces: `sessionDeck`, `sessionMeta`, and `sessionActions` visual regions with existing callbacks.

- [ ] **Step 1: Write the failing layout invariant test**
  Read `mixer.tsx` and assert it defines `styles.sessionDeck`, renders an `ArtBackground` with `variant="card"` for the session, and contains the existing `TransportButton`, timer callback, master-volume callback, and save callback inside the session section.
- [ ] **Step 2: Run it and verify the expected failure**
  Run `npm test -- --runInBand app/'(tabs)'/__tests__/mixer-layout.test.ts`; expect failure because controls are currently separate blocks.
- [ ] **Step 3: Implement the minimum correct session deck**
  Use the first channel artwork when present and fallback surface when empty. Place channel count and category accents at top, transport/timer centrally, master slider and save action below when active, and a disabled explanatory state when empty.
- [ ] **Step 4: Run verification**
  Run the focused test, `stores/__tests__/audioStore.test.ts`, TypeScript, and lint; expect success.
- [ ] **Step 5: Commit**
  Commit Mixer and its test with `feat: compose mixer session deck`.

### Task 2: Refine channel and empty states

**Files:**
- Modify: `app/(tabs)/mixer.tsx`
- Modify: `app/(tabs)/__tests__/mixer-layout.test.ts`

**Interfaces:**
- Consumes: existing channel mute/remove/volume handlers and `MAX_MIXER_CHANNELS`.
- Produces: compact channel artwork strips with one 96 px trailing action rail; a single add-first-sound empty surface and sample action.

- [ ] **Step 1: Extend the failing test**
  Assert `styles.channelActionRail` has a dark translucent background and contains two 48 px action buttons; assert `EMPTY_SLOTS` is no longer declared and the sample callback remains.
- [ ] **Step 2: Run it and verify the expected failure**
  Run the mixer layout test; expect the rail/empty-state assertions to fail.
- [ ] **Step 3: Implement the minimum correct change**
  Move mute/remove into a trailing rail, keep name/slider in the center, remove four ghost slots, and add one full-width add surface showing `0/4` capacity plus the existing sample action.
- [ ] **Step 4: Run verification**
  Run the mixer layout and audio-store tests, TypeScript, and lint; expect success.
- [ ] **Step 5: Commit**
  Commit with `feat: refine mixer channels and empty state`.

### Task 3: Convert saved mixes into artwork cards and ship

**Files:**
- Modify: `app/(tabs)/mixer.tsx`
- Modify: `app/(tabs)/__tests__/mixer-layout.test.ts`

**Interfaces:**
- Consumes: `mixPresets(mix)`, first valid preset art, current load/rename/delete handlers.
- Produces: compact `savedMixCard` artwork surfaces with separate accessible actions.

- [ ] **Step 1: Extend the failing test**
  Assert the saved-mix renderer resolves `presetArt(presets[0].id)`, uses `ArtBackground`, and retains load, rename, and delete handler calls.
- [ ] **Step 2: Run it and verify the expected failure**
  Run the mixer layout test; expect the artwork-card assertion to fail.
- [ ] **Step 3: Implement the minimum correct change**
  Render the first valid artwork behind each saved mix, keep catalog/name/icons/loaded stamp in the content zone, and place rename/delete in a separate trailing action region so touch targets never overlap load.
- [ ] **Step 4: Run full verification**
  Run `npx tsc --noEmit`, `EXPO_NO_TELEMETRY=1 npm run lint`, `npm test -- --runInBand`, all three repository verification scripts, `EXPO_NO_TELEMETRY=1 npx expo export --platform web --output-dir /tmp/neurosound-explore-mixer-web`, and `git diff --check`; expect success.
- [ ] **Step 5: Commit**
  Commit with `feat: turn saved mixes into artwork cards`.
- [ ] **Step 6: Publish for review**
  Push `agent/explore-mixer-polish`, open a PR against `master`, wait for CI, build a review APK, and report artifact/test status without merging until requested.

