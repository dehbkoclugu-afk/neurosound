# Asset Provenance

The Play release owner must attach invoices, licenses, source links, or original-production records before production release.

| Asset group | Files | Status |
|---|---|---|
| App icons and splash artwork | `assets/images/icon.png`, `android-icon-*`, `splash-icon.png`, `favicon.png` | Generated for this app; retain generation/source records. |
| Cinematic intent and preset artwork | `assets/images/art/**/*.jpg` | Original production generated with ChatGPT's built-in image generation on 2026-08-03; prompts and mapping retained in `docs/ART-ASSET-BRIEFS.md`. |
| Superseded intent placeholders | `assets/images/intents/*.jpg` | Unused legacy placeholders; not included through any runtime registry. |
| Bundled sounds | `assets/sounds/*.mp3` | **REQUIRED BEFORE RELEASE:** commercial distribution-rights evidence for all 10 tracks. |
| Google Play graphics | `store/google-play/assets/*` | Produced from NeuroSound UI and brand assets for this release. |

Do not infer a license from a filename or from possession of the file.
