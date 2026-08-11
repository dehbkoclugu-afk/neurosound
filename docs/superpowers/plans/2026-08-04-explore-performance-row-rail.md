# Explore Performance and Row Rail Implementation Plan

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox syntax.

**Goal:** Preserve swipeable Explore categories while virtualizing artwork rows and centering every preset chevron in a fixed trailing rail.

**Architecture:** A horizontal paging `FlatList<CategoryTab>` owns category selection and delegates each page to a vertical `FlatList<FrequencyPreset>`. `PresetRow` remains the shared visual row and adds one decorative trailing rail inside its existing press target.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript, React Native `FlatList`, Jest, Reanimated.

## Global Constraints

- Add no list dependency and preserve search, sort, favorites, category descriptions, tab presses, swipe paging, mini-player inset, localization, and accessibility.
- Do not lower artwork resolution to hide the performance problem.

---

### Task 1: Add the shared navigation rail

**Files:**
- Modify: `components/ui/PresetRow.tsx`
- Test: `components/ui/__tests__/preset-row-layout.test.ts`

**Interfaces:**
- Consumes: `PresetRowProps` unchanged.
- Produces: exported `PRESET_ROW_HEIGHT` and `PRESET_ROW_GAP` layout constants; a decorative 48 px trailing rail.

- [ ] **Step 1: Write the failing test**
  Create a source-level invariant test that reads `PresetRow.tsx` and asserts it exports `PRESET_ROW_HEIGHT = 92`, renders `styles.chevronRail`, and gives that style `width: 48`, `alignItems: 'center'`, and `justifyContent: 'center'`.
- [ ] **Step 2: Run it and verify the expected failure**
  Run `npm test -- --runInBand components/ui/__tests__/preset-row-layout.test.ts`; expect failure because the constants and rail do not exist.
- [ ] **Step 3: Implement the minimum correct change**
  Export the two layout constants, replace the bare chevron with `<View style={styles.chevronRail}>`, use a theme-aware translucent graphite/navy background, and remove the row's trailing horizontal padding so the rail meets the clipped card edge.
- [ ] **Step 4: Run verification**
  Run the focused Jest test, `npx tsc --noEmit`, and `EXPO_NO_TELEMETRY=1 npm run lint`; expect success.
- [ ] **Step 5: Commit**
  Commit `components/ui/PresetRow.tsx` and its test with `fix: center preset navigation rail`.

### Task 2: Virtualize the swipeable Explore catalogue

**Files:**
- Modify: `app/(tabs)/explore.tsx`
- Test: `app/(tabs)/__tests__/explore-list-config.test.ts`

**Interfaces:**
- Consumes: `categories`, `filteredPresetsByCategory`, `PRESET_ROW_HEIGHT`, `PRESET_ROW_GAP`.
- Produces: horizontal `FlatList<CategoryTab>` pager and vertical `FlatList<FrequencyPreset>` pages.

- [ ] **Step 1: Write the failing test**
  Read `explore.tsx` and assert it imports `FlatList`, declares `initialNumToRender={6}`, `windowSize={5}`, `removeClippedSubviews`, and uses `getItemLayout` for preset rows; assert the old `categories.map` nested vertical `ScrollView` pager marker is absent.
- [ ] **Step 2: Run it and verify the expected failure**
  Run `npm test -- --runInBand app/'(tabs)'/__tests__/explore-list-config.test.ts`; expect failure because Explore still mounts nested scroll views.
- [ ] **Step 3: Implement the minimum correct change**
  Build a memoized category-page component around a vertical `FlatList`, move description/count into `ListHeaderComponent`, move empty results into `ListEmptyComponent`, and use stable `keyExtractor`, `renderItem`, and `getItemLayout`. Replace the outer pager with a horizontal paging `FlatList`, keep `scrollToIndex`, and recover from a pre-layout `scrollToIndex` failure by retrying after layout.
- [ ] **Step 4: Bound row animation**
  Pass `index` only for the first six initially rendered items so recycled/off-screen rows do not replay staggered entrances.
- [ ] **Step 5: Run verification**
  Run the focused test, `npx tsc --noEmit`, `EXPO_NO_TELEMETRY=1 npm run lint`, and `npm test -- --runInBand`; expect success.
- [ ] **Step 6: Commit**
  Commit Explore and its test with `perf: virtualize swipeable frequency lists`.

