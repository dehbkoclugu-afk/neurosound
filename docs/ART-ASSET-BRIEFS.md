# NeuroSound — Cinematic Sound Atlas Prompts

All 76 production images were generated with ChatGPT's built-in image generation and bundled locally. The app never downloads imagery at runtime. Every dark asset has a matching light-theme asset with the same filename under `assets/images/art/light/`.

## Shared production prompt

Append the asset-specific scene below to this prompt:

> Premium cinematic editorial photography with restrained surrealism, realistic tactile materials and subtle 35mm film grain. Extra-wide 2:1 landscape composition for a dark mobile interface. Keep the primary subject and visual detail on the right; leave the left half dark, calm and low-detail for white UI text. Dark-to-mid tonal values, refined and quiet rather than spectacular. The image must remain recognizable in a 96 px-high row crop. No text, letters, numbers, logo, watermark, UI, people, faces, brain imagery, neon, purple-pink AI gradient, HDR, oversaturation or clutter.

## Shared light-theme edit prompt

Each dark source was edited, not re-conceived, with this direction so switching themes changes illumination without changing the sound's visual identity:

> Preserve the exact subject, camera, materials, acoustic pattern, 2:1 crop, right-side focal point and quiet left copy zone. Change only the lighting and color grade to soft cool daylight: pale silver, ivory gray, restrained natural color, airy shadows and calm editorial contrast. Keep the scene recognizable at 96 px row height. Do not add objects, people, text, logos, watermarks, brown/sepia/orange cast, neon, oversaturation or HDR effects.

At runtime the registry selects the dark or light member of each pair from the resolved Light/Dark/Auto theme. Theme-specific scrims and foreground colors are applied in code; no runtime image filter is used.

## Intent assets

| File | Asset-specific scene |
|---|---|
| `intents/sleep.jpg` | Still midnight lake under layered cloud, low mist and a soft indigo opening reflected on the far right. |
| `intents/focus.jpg` | Dark architectural study planes with one exact amber beam, ordered particles converging on a single point. |
| `intents/relax.jpg` | Sheltered mossy forest pool at blue hour, fern, wet stone, mist and one slow ripple. |
| `intents/meditate.jpg` | High mountain basin before dawn, layered ridges above cloud and a solitary still stone. |

## State assets

| File | Asset-specific scene |
|---|---|
| `states/favorites-empty.jpg` | Quiet listening alcove with an intentionally empty sculptural niche on the right and a calm copy zone on the left; inviting rather than error-like. |

## Binaural assets

| File | Asset-specific scene |
|---|---|
| `binaural-delta.jpg` | Massive slow concentric ripples crossing black water beneath low fog. |
| `binaural-theta.jpg` | Pale mist ribbons weaving through a dark basalt canyon. |
| `binaural-alpha.jpg` | Evenly spaced warm light bands crossing calm stone and still water. |
| `binaural-beta.jpg` | Precise architectural planes and repeated narrow amber cuts accelerating toward a vanishing point. |
| `binaural-gamma.jpg` | Thousands of fine gold particles converging into one exact point above dark mineral. |

## Environmental sound assets

| File | Asset-specific scene |
|---|---|
| `noise-white.jpg` | Dense, even mineral dust suspended in cool light. |
| `noise-pink.jpg` | Dusty-rose sand grains flowing in broad layers over dark stone. |
| `noise-brown.jpg` | Espresso earth and walnut strata forming broad, heavy contours. |
| `noise-rain.jpg` | Rain trails on a sheltered window with a soft forest beyond. |
| `noise-thunder.jpg` | Distant storm over a black valley with rain sheets and hidden cloud glow. |
| `noise-ocean.jpg` | Long night swell meeting a volcanic shore, muted foam on one wave. |
| `noise-wind.jpg` | Silver highland grass bending together through streaming mist. |
| `noise-fire.jpg` | Close glowing embers and one slow flame in a dark stone hearth. |
| `noise-forest.jpg` | Old-growth trunks fading through blue-green mist, wet leaves and moss. |
| `noise-stream.jpg` | Clear woodland current over smooth black stones with one small eddy. |
| `noise-fan.jpg` | Partial matte metal fan silhouette casting soft radial shadows on plaster. |
| `noise-airplane.jpg` | Dark aircraft window, wing edge and continuous cloud layer at night. |
| `noise-train.jpg` | Overnight train window with subdued horizontal landscape motion and amber frame reflection. |

## Solfeggio assets

| File | Asset-specific scene |
|---|---|
| `solfeggio-40.jpg` | Four broad pressure contours crossing basalt toward a dim amber seam. |
| `solfeggio-111.jpg` | Three nested mineral arches inside a dark cavern. |
| `solfeggio-174.jpg` | Smooth stone hovering over concentric rings in fine sand. |
| `solfeggio-285.jpg` | Cracked dark clay drawing toward a seamless copper core. |
| `solfeggio-396.jpg` | Taut dark thread releasing from a knot into broad bronze fibers. |
| `solfeggio-417.jpg` | Overlapping ceramic plates rotating into alignment around an amber axis. |
| `solfeggio-432.jpg` | Fine rings spreading through a forest pool and aligning fern reflections. |
| `solfeggio-440.jpg` | Single dark tuning fork above slate with delicate reflected pressure lines. |
| `solfeggio-528.jpg` | Emerald shoot through wet stone with a restrained curve of gold particles. |
| `solfeggio-639.jpg` | Two copper wave fields meeting as one water-interference pattern. |
| `solfeggio-741.jpg` | Narrow cool light passing through layered smoked glass. |
| `solfeggio-777.jpg` | Fine mineral ridges stepping through mist toward a gold horizon. |
| `solfeggio-852.jpg` | Translucent indigo mineral layers unfolding around an ivory center. |
| `solfeggio-888.jpg` | Overlapping patinated brass rings casting a dense harmonious shadow. |
| `solfeggio-963.jpg` | Open pre-dawn sky above cloud with a narrow ivory column dissolving into mist. |
