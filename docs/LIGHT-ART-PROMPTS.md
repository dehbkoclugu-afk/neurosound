# 852Hz — Açık tema görselleri (ChatGPT komutları)

38 görselin gündüz versiyonları. Her biri, uygulamadaki koyu görselin **aynı
kompozisyonda, canlı gündüz ışığında** hali olmalı.

## Nasıl kullanılır

1. ChatGPT'de yeni bir sohbet aç. Önce aşağıdaki **Ana komut**'u gönder.
2. Sonra her görsel için: `assets/images/art/...` altındaki **koyu orijinali
   yükle** ve listedeki satırı yaz (ör. `noise-fire`). Orijinali yüklemek,
   kompozisyonun birebir aynı kalmasını sağlar; uygulama açık ve koyu arasında
   geçerken görsel yerinden oynamaz.
3. Çıkan görseli aynı adla indir ve `assets/images/art/light/...` altındaki
   eskisinin yerine koy (intents → `light/intents/`, diğerleri →
   `light/presets/` veya `light/states/`).

ChatGPT tek mesajda 38 görsel üretemez; aynı sohbette sırayla gitmek stili
tutarlı tutar. Arada stil kayarsa Ana komutu tekrar yapıştır.

## Ana komut

```
You will create DAYTIME versions of a set of images for a calm sleep, focus
and meditation app called 852Hz. For every image I send next, I will upload
the original NIGHT version. Recreate the SAME scene with the SAME composition,
camera angle, subject placement and framing — only the time of day and light
change.

Style for every image:
- Bright, natural daylight or golden morning sun. Clear, vivid but not neon
  colour: real greens, warm stone, blue water, honey light. Never grey,
  washed out, foggy-white or desaturated.
- Photographic, cinematic, tactile materials, shallow depth of field where it
  fits. No text, no logos, no people, no UI.
- Keep the main subject on the RIGHT half. Keep the LEFT third and the BOTTOM
  quarter calm and low-detail, because white-ish app text and a soft cream
  fade (#F5F1EB) sit there.
- Overall brightness: light and airy, but with enough colour and contrast that
  the scene is instantly recognisable at thumbnail size.
- Output size: the same aspect ratio as the original I upload (16:9 for
  "intent" images, 2:1 for all others), at least 1600 px wide.

Reply only with the image. I will send them one by one, each with its name.
```

## Görsel listesi (her birine orijinali yükleyip satırı yaz)

### Amaçlar — 16:9 — `light/intents/`
| Dosya | Yazılacak satır |
|---|---|
| sleep.jpg | `sleep — same lake and mountains, soft late-afternoon sun, pastel blue sky, calm reflections` |
| focus.jpg | `focus — same architecture, clean morning sunbeam, warm stone, crisp shadows` |
| relax.jpg | `relax — same forest pool, sunlit ferns, emerald water, dappled light` |
| meditate.jpg | `meditate — same mountain basin at sunrise, golden light on ridges, clear sky` |

### Durum — 2:1 — `light/states/`
| Dosya | Yazılacak satır |
|---|---|
| favorites-empty.jpg | `favorites-empty — same alcove and empty niche, warm daylight through a window, cream plaster` |

### Binaural — 2:1 — `light/presets/`
| Dosya | Yazılacak satır |
|---|---|
| binaural-delta.jpg | `binaural-delta — same slow ripples, clear turquoise lake water in soft sun` |
| binaural-theta.jpg | `binaural-theta — same canyon, sunlit sandstone, light mist ribbons` |
| binaural-alpha.jpg | `binaural-alpha — same light bands across stone and water, bright honey sunlight` |
| binaural-beta.jpg | `binaural-beta — same architectural planes, sharp white daylight, warm accents` |
| binaural-gamma.jpg | `binaural-gamma — same gold particles converging, bright warm daylight on mineral` |

### Doğa sesleri — 2:1 — `light/presets/`
| Dosya | Yazılacak satır |
|---|---|
| noise-white.jpg | `noise-white — same suspended dust, bright clean daylight, pale blue tint` |
| noise-pink.jpg | `noise-pink — same rose sand layers, soft pink morning sun` |
| noise-brown.jpg | `noise-brown — same earth strata, warm terracotta and walnut in sunlight` |
| noise-rain.jpg | `noise-rain — same window with raindrops, bright green forest outside, daylight rain` |
| noise-thunder.jpg | `noise-thunder — same valley, dramatic daytime storm clouds with sunbreaks` |
| noise-ocean.jpg | `noise-ocean — same shore and swell, sunny day, turquoise water, white foam` |
| noise-wind.jpg | `noise-wind — same highland grass bending, golden sunlight, blue sky` |
| noise-fire.jpg | `noise-fire — same hearth and logs, bright orange flames, warm sunlit stone room` |
| noise-forest.jpg | `noise-forest — same old-growth trunks, sunbeams through green canopy` |
| noise-stream.jpg | `noise-stream — same stream over stones, clear sunlit water, green moss` |
| noise-fan.jpg | `noise-fan — same fan and shadows, bright airy room, cream wall, sunlight` |
| noise-airplane.jpg | `noise-airplane — same window and wing, sunny sky above white clouds` |
| noise-train.jpg | `noise-train — same train window, bright countryside passing, daylight` |

### Solfeggio — 2:1 — `light/presets/`
| Dosya | Yazılacak satır |
|---|---|
| solfeggio-40.jpg | `solfeggio-40 — same contours on stone, warm sunlight, amber seam glowing` |
| solfeggio-111.jpg | `solfeggio-111 — same arches, sunlit cavern opening, warm stone` |
| solfeggio-174.jpg | `solfeggio-174 — same stone over sand rings, soft beach daylight` |
| solfeggio-285.jpg | `solfeggio-285 — same clay and copper core, warm afternoon sun` |
| solfeggio-396.jpg | `solfeggio-396 — same thread and bronze fibers, bright studio daylight` |
| solfeggio-417.jpg | `solfeggio-417 — same ceramic plates, clean daylight, amber axis` |
| solfeggio-432.jpg | `solfeggio-432 — same forest pool rings, sunlit ferns, clear water` |
| solfeggio-440.jpg | `solfeggio-440 — same tuning fork on slate, bright window light` |
| solfeggio-528.jpg | `solfeggio-528 — same green shoot from stone, morning sun, golden particles` |
| solfeggio-639.jpg | `solfeggio-639 — same copper wave fields, bright warm daylight` |
| solfeggio-741.jpg | `solfeggio-741 — same light through layered glass, sunny, cool blues` |
| solfeggio-777.jpg | `solfeggio-777 — same ridges toward horizon, golden morning, light haze` |
| solfeggio-852.jpg | `solfeggio-852 — same layered mineral, luminous lavender and ivory in daylight` |
| solfeggio-888.jpg | `solfeggio-888 — same brass rings and shadow, warm sunlight` |
| solfeggio-963.jpg | `solfeggio-963 — same sky above clouds, bright sunrise, ivory light column` |
