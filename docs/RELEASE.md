# Google Play Yayın Rehberi — NeuroSound

**Geliştirici:** DEHB Koçluğu

**İletişim:** dehbkoclugu@gmail.com

**Paket:** `com.dehbkoclugu.neurosound`

Kaynak kontrolleri hazırdır ve mağaza paketi dokuz dilde yazılmıştır. Yayın sırası, her adımın ön koşuluyla birlikte `store/google-play/release-checklist.md` dosyasındadır — yedi aşama, sırayla yapılır.

## Yerel doğrulama

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test -- --ci --runInBand
npm run verify:android-config
npm run verify:workflows
npm run verify:store-assets
npx expo-doctor
```

## Mağaza paketi

- Listelemeler: `tr-TR`, `en-US`, `hi-IN`, `id-ID`, `vi-VN`, `pt-BR`, `es-ES`, `de-DE`, `ru-RU` — hepsi `store/google-play/` altında. Uygulama 21 dilde; kalan diller sonraki sürüme kalabilir.
- Veri Güvenliği taslağı: `store/google-play/data-safety.md`
- Grafikler: `store/google-play/assets/`
- Yayınlanacak gizlilik sayfası: `docs/privacy.html`
- Hak envanteri: `docs/ASSET_PROVENANCE.md`

Gizlilik sayfası herkese açık HTTPS adresinde yayınlanmalı. Paketlenen ses ve görsellerin kaynağı `docs/ASSET_PROVENANCE.md` dosyasında kayıtlıdır.

## GitHub/EAS

Actions secret'ları:

- `EXPO_TOKEN`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

Anahtar dosyası repoya eklenmez. İş akışı JSON'u yalnız submit sırasında geçici dosyaya yazar, doğrular, izinlerini sınırlar ve her durumda siler.

İlk EAS çalıştırması `platform=android`, `profile=production`, `submit=false` olmalıdır. AAB tamamlanınca Internal testing'e yükleyin; gerçek cihaz kontrolleri geçtikten sonra kademeli yayın kullanın.
