# Explore Performance, Quick Controls, and Mixer Polish

**Status:** Approved

## Goal

Make Explore scroll smoothly without removing horizontal category swiping, correct the preset-row navigation affordance, add compact language and theme controls to Home, and turn Mixer into a cohesive sound desk. Refine both theme scrims so artwork remains visible instead of being buried under white or black overlays.

## Constraints

- Preserve horizontal swipe navigation between Binaural, Solfeggio, and Ambient categories.
- Preserve the existing audio engine, four-channel limit, timer, saved mixes, search, filters, navigation, localization, and accessibility behavior.
- Reuse the existing artwork registry and shared sheets; add no dependency and generate no new artwork.
- Keep Settings as the complete location for Light, Dark, and System theme selection.
- Optimize the root cause rather than reducing image quality or removing semantic artwork.

## Explore

### Virtualized pager

Replace the horizontal `ScrollView` containing three vertical `ScrollView` trees with a horizontal, paging-enabled `FlatList`. Each category page owns a vertical `FlatList` of its filtered presets. The pager preserves tab presses and horizontal swipes while list virtualization prevents all 33 artwork rows from mounting at once.

The outer pager renders a bounded window and clips off-screen pages. Each vertical list uses stable preset IDs, a fixed row estimate/layout derived from the 92 px row plus spacing, a small initial render batch, and clipped subviews on Android. Search, favorites-only filtering, alphabetical sorting, category descriptions, result counts, mini-player inset, and empty results become list header/footer content rather than a surrounding `ScrollView`.

Entrance animation is limited to the initial visible rows. Rows must not replay staggered entrance animation during ordinary vertical scrolling or category page recycling. The existing reduce-motion preference remains authoritative.

### Navigation rail

`PresetRow` keeps artwork full bleed. Its chevron moves into a fixed 48 px trailing rail centered both horizontally and vertically. The rail uses a theme-aware dark translucent graphite/navy surface, so the affordance is visually anchored and never appears left-aligned. The row remains one accessible press target; the rail is decorative and does not become a nested button.

Because `PresetRow` is shared, Home, Explore, and Intent screens receive the same corrected affordance.

## Home quick controls

Place a compact control group at the top-right of the Home title row:

- Language: a 44×44 control showing the current language flag. It opens the existing `LanguageSheet`; language selection and persistence remain unchanged.
- Theme: a 44×44 sun/moon control. It toggles directly between explicit Light and Dark. If the stored mode is System, the first press chooses the opposite of the currently resolved appearance and stores that explicit mode.

Both controls use the current theme surface and border tokens, expose descriptive accessibility labels and selected/current state, and retain at least a 44 px touch target. They do not replace the full controls in Settings.

## Mixer sound desk

### Session deck

Create one wide session deck below the Mixer title. When empty it uses a quiet existing fallback surface. When channels exist it uses the first channel's paired artwork and subtle category-color accents from the active channels. It groups the current channel count, play/pause transport, timer, and master volume so the mix reads as one authored object instead of unrelated controls.

The play control remains the primary centered action. Timer state remains visible. Master volume appears only when a mix exists. Save remains a clear secondary action associated with the active session.

### Channel strips

Active channels become tighter artwork strips:

- left: semantic icon/art identity;
- center: localized name and volume slider;
- right: a dedicated dark translucent action rail containing mute and remove controls.

Muted state remains visibly dimmed without hiding the channel. Each action keeps its own accessible 48 px target and label. Category-colored slider fills and all existing controller calls remain unchanged.

### Empty and saved states

Replace four repetitive ghost slots with one strong “add first sound” surface followed by the existing one-tap sample mix action. It must communicate the four-channel capacity in copy or compact metadata without rendering four inert rows.

Saved mixes become compact artwork cards using the first valid preset artwork, with mix name, catalog code, constituent sound icons, loaded state, and clearly separated load/rename/delete actions. Invalid removed preset IDs continue to be ignored safely.

## Artwork and theme refinement

### Light

Move the shell from near-white to a slightly deeper cool blue-gray fog. Replace the nearly opaque white card scrims with lower-opacity cool gray scrims. The artwork must retain visible texture and color while the left copy zone remains calm enough for graphite text.

### Dark

Replace the heaviest near-black card/row/channel scrims with lighter graphite-navy overlays. Artwork must read more clearly without turning text gray or lowering contrast below the existing accessibility floor. Hero treatment may remain stronger where controls sit directly over photography.

Theme tokens and scrim values must be contrast-tested against the actual foreground roles. No runtime image filters are introduced.

## Performance and state boundaries

- List performance work is confined to Explore and shared row rendering.
- `FlatList` render functions and item callbacks use stable references where they materially prevent row churn.
- Theme and language controls read/write the existing settings store; no duplicate state is introduced.
- Mixer presentation continues to call the current `playerController` and Zustand stores; audio ownership is unchanged.
- Artwork sources continue through `useArtwork`, ensuring Light/Dark pairs change with the resolved theme.

## Verification

- Explore preserves tab selection, horizontal paging, vertical position stability, search, sort, favorite filtering, descriptions, empty results, and navigation.
- Android device/emulator review confirms visibly smoother vertical scrolling and no chevron misalignment.
- Home language sheet opens, selection persists, and theme toggle handles Light, Dark, and System correctly.
- Mixer empty, partial, full, muted, playing, timed, saved, renamed, loaded, and deleted states remain functional.
- Light and Dark screenshots confirm artwork is more visible and text remains readable.
- TypeScript, lint, unit tests, contrast tests, Android configuration checks, workflow checks, store-asset checks, and a production web export pass.

## Out of scope

- Changes to sound synthesis, playback behavior, medical claims, preset content, navigation destinations, or the four-channel maximum.
- New artwork, third-party list libraries, drag-to-reorder, live waveform visualization, or a new theme mode.
