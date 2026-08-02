# Google Play Yayın Rehberi — NeuroSound

**Geliştirici:** DEHB Koçluğu

**İletişim:** dehbkoclugu@gmail.com

**Paket:** `com.neurosound.app`

Kaynak kontrolleri ve Türkçe/İngilizce mağaza paketi hazırdır. Ana kontrol listesi `store/google-play/release-checklist.md` dosyasındadır.

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

- Listelemeler: `store/google-play/tr-TR/` ve `store/google-play/en-US/`
- Veri Güvenliği taslağı: `store/google-play/data-safety.md`
- Grafikler: `store/google-play/assets/`
- Yayınlanacak gizlilik sayfası: `docs/privacy.html`
- Hak envanteri: `docs/ASSET_PROVENANCE.md`

Gizlilik sayfası herkese açık HTTPS adresinde yayınlanmalı. Bundled sesler ve intent görselleri için ticari hak kanıtı tamamlanmadan üretime çıkılmamalıdır.

## GitHub/EAS

Actions secret'ları:

- `EXPO_TOKEN`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

Anahtar dosyası repoya eklenmez. İş akışı JSON'u yalnız submit sırasında geçici dosyaya yazar, doğrular, izinlerini sınırlar ve her durumda siler.

İlk EAS çalıştırması `platform=android`, `profile=production`, `submit=false` olmalıdır. AAB tamamlanınca Internal testing'e yükleyin; gerçek cihaz kontrolleri geçtikten sonra kademeli yayın kullanın.
