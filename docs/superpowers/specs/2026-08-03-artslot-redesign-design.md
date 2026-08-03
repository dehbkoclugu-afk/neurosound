# NeuroSound ArtSlot Redesign

## Status

Approved in conversation on 2026-08-03. The user rejected the current text-led Night Deck presentation and approved an image-led cinematic system for intent cards and sound rows.

## Goal

Make every sound choice visually legible before reading it, without sacrificing nighttime readability, accessibility, or fast one-handed operation.

## Direction

NeuroSound becomes a cinematic sound atlas. Artwork is dark, tactile, atmospheric, and semantically tied to the sound or intent. It avoids generic wellness gradients, neon, literal brain imagery, text inside images, faces, logos, and stock-photo clichés.

The operating scene remains a dim room at night. Artwork therefore stays dark-to-mid value and places detail on the right, leaving a calm left field for copy.

## Surface Rules

### Intent cards

- Home intent cards use full-bleed cinematic artwork rather than paper label cards.
- The suggested intent remains larger than the other three.
- Copy sits on a left-to-right dark scrim; artwork has its focal point on the right.
- Existing name, description, recommendation, sound count, routing, accessibility label, and time-based ordering remain intact.

### Preset rows

- Every `PresetRow` receives artwork through one shared registry keyed by preset id.
- Rows are 88–96 px tall, clipped to a restrained card radius, with breathing room between rows.
- Artwork fills the row but is most visible on the right 45–55%; a strong dark scrim protects left-aligned copy.
- Name, frequency/category, favourite state, current-playback equalizer, band scale, search highlighting, and chevron remain functional and readable.
- Binaural, solfeggio, and environmental sounds each get semantically distinct artwork. No category-wide placeholder repeated across the whole list.

### Mixer

- Preset picker rows inherit `PresetRow` artwork automatically.
- Active mixer channels use the selected preset artwork as a restrained right-side crop; controls remain on a stable dark surface.
- Empty mixer slots remain functional shapes rather than decorative image cards.

### Technical screens

- Settings, privacy, forms, modal controls, and destructive actions do not receive photographic backgrounds. They retain clear operational surfaces.
- This exception prevents the product from becoming visually noisy while satisfying the image-led treatment for content and sound choices.

## Art Production

- ChatGPT's built-in image generation creates the raster artwork.
- Final mobile assets are landscape WebP/JPEG files, compressed and stored locally; the app makes no network requests.
- Generation prompts and filename mapping are stored in `docs/ART-ASSET-BRIEFS.md`.
- A typed static registry maps every intent and preset id to a bundled `require(...)` asset. Missing ids use a deliberate dark fallback rather than crashing.
- The approved initial references are Focus, Sleep, and Rain: cinematic, low-key, right-weighted compositions with left-side negative space.

## Accessibility and Performance

- Text contrast is protected by an opaque scrim rather than assumed from source artwork.
- Screen-reader labels and touch targets do not regress.
- Images are resized to the maximum useful mobile display density and compressed before bundling.
- Reduced-motion affects animation only; imagery remains static.
- No remote image loading, analytics, tracking, or runtime generation is introduced.

## Verification

- Registry completeness test covers all intent and preset ids.
- TypeScript, lint, and Jest pass.
- Home, Explore, Intent, Player-linked rows, Mixer picker, mixer channels, favourites, recent items, search highlighting, low-contrast mode, Turkish, and English are inspected.
- One mobile screenshot batch checks crop quality, contrast, row density, and visual repetition.

