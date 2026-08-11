# Home Quick Controls and Theme Scrims Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox syntax.

**Goal:** Add compact Home language/theme controls and make artwork visible under balanced Light and Dark scrims.

**Architecture:** Home reuses `LanguageSheet` and the existing settings store. A pure `nextExplicitTheme` helper owns System-to-explicit toggle behavior. Theme shell tokens stay in `constants/theme.ts`; shared photograph overlays stay in `ArtBackground`.

**Tech Stack:** React Native, Expo Router, Zustand, i18next, Jest, TypeScript.

## Global Constraints

- Keep Settings as the complete Light/Dark/System interface and add no duplicate language state.
- Preserve WCAG AA text contrast and use no runtime image filter.

---

### Task 1: Define and test the quick theme transition

**Files:**
- Modify: `lib/themeMode.ts`
- Modify: `lib/__tests__/themeMode.test.ts`

**Interfaces:**
- Consumes: `theme: ThemeMode`, `resolvedScheme: 'light' | 'dark'`.
- Produces: `nextExplicitTheme(theme, resolvedScheme): 'light' | 'dark'`.

- [ ] **Step 1: Write the failing test**
  Add assertions that Light becomes Dark, Dark becomes Light, System resolved to Light becomes Dark, and System resolved to Dark becomes Light.
- [ ] **Step 2: Run it and verify the expected failure**
  Run `npm test -- --runInBand lib/__tests__/themeMode.test.ts`; expect `nextExplicitTheme` to be missing.
- [ ] **Step 3: Implement the minimum correct helper**
  Return the opposite of the explicit theme, or the opposite of `resolvedScheme` when `theme === 'auto'`.
- [ ] **Step 4: Run verification**
  Run the focused test and `npx tsc --noEmit`; expect success.
- [ ] **Step 5: Commit**
  Commit both files with `feat: define quick theme toggle`.

### Task 2: Add Home quick controls

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Test: `app/(tabs)/__tests__/home-quick-controls.test.ts`

**Interfaces:**
- Consumes: `language`, `theme`, `setTheme`, resolved color scheme, `LanguageSheet`.
- Produces: two 44×44 accessible header controls and language-sheet visibility state.

- [ ] **Step 1: Write the failing test**
  Read `index.tsx` and assert it renders `LanguageSheet`, calls `nextExplicitTheme`, and defines `styles.quickControl` with width and height 44.
- [ ] **Step 2: Run it and verify the expected failure**
  Run `npm test -- --runInBand app/'(tabs)'/__tests__/home-quick-controls.test.ts`; expect failure because the controls are absent.
- [ ] **Step 3: Implement the minimum correct change**
  Convert the Home title into a row, show the current `languageFlag(language)`, open the shared sheet, render a sun/moon icon from the resolved scheme, and store the helper's explicit result on press. Add localized accessibility labels by composing existing Settings translations.
- [ ] **Step 4: Run verification**
  Run the focused test, TypeScript, and lint; expect success.
- [ ] **Step 5: Commit**
  Commit Home and its test with `feat: add home language and theme controls`.

### Task 3: Rebalance Light and Dark artwork surfaces

**Files:**
- Modify: `constants/theme.ts`
- Modify: `constants/__tests__/contrast.test.ts`
- Modify: `components/ui/ArtBackground.tsx`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: existing palette shape and `ArtBackground` variants.
- Produces: deeper cool Light shell and lower-opacity cool-gray/graphite-navy directional scrims.

- [ ] **Step 1: Write the failing palette test**
  Pin the approved Light shell tokens to `background: '#E7ECF1'`, `backgroundSecondary: '#DDE4EB'`, `card: '#F0F4F7'`, and `cardBorder: '#C8D2DC'`; retain existing foreground thresholds in the contrast suite.
- [ ] **Step 2: Run it and verify the expected failure**
  Run `npm test -- --runInBand constants/__tests__/contrast.test.ts`; expect token mismatch against the brighter current palette.
- [ ] **Step 3: Implement shell and scrim changes**
  Update Light and low-contrast Light surfaces within the same cool family. Lower `LIGHT_SCRIMS` opacity and tint it cool gray; lift `DARK_SCRIMS` from near-black to graphite navy for card, row, and channel while keeping hero strong enough for controls.
- [ ] **Step 4: Run verification**
  Run contrast tests, TypeScript, lint, and `git diff --check`; expect success.
- [ ] **Step 5: Commit**
  Commit theme, scrim, test, and documentation changes with `fix: reveal artwork in both themes`.

