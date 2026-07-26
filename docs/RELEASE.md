# Yayın Rehberi — NeuroSound

Sıralı kontrol listesi. Kod, testler ve CI tarafı hazır; buradaki adımların
çoğu SENİN hesaplarını ve gerçek bir cihazı gerektirir. Tik atarak ilerle.

## 0. Ön koşullar

- [ ] Apple Developer hesabı (99$/yıl)
- [ ] Google Play Console hesabı (25$ tek seferlik)
- [ ] Expo hesabı (ücretsiz) — `npx eas login`

## 1. Hızlı test APK'sı (EAS'a hiç gerek yok)

`.github/workflows/android-apk.yml` Actions sekmesinden elle tetiklenir,
`expo prebuild` + Gradle ile doğrudan runner'da bir APK üretir ve bir
emülatörde açıp logcat'te çökme arar. Mağazaya gitmez, sadece sideload/test
içindir — production build ayrı (bkz. §4).

- [ ] GitHub → Actions → "Android APK" → Run workflow
- [ ] "neurosound-apk" artifact'ini indirip gerçek bir Android cihaza kur
- [ ] "logcat" artifact'inde FATAL EXCEPTION / native crash yok

## 2. Proje bağlama (bir kez)

```bash
npx eas login
npx eas init          # app.json'daki projectId'yi doğrular/bağlar
```

## 3. Dev build + cihaz testleri

```bash
npx eas build --profile development --platform ios      # veya android
```

Cihazda test listesi (bu oturumda sandbox'ta doğrulanamayan, gerçek cihaz
gerektiren maddeler):

- [ ] Zamanlayıcı gerçekten sıfıra inince ses düzgün duruyor (15/30/60/120 dk
      hepsi, en azından 15 dk'lık olan gerçek zamanlı denenmeli)
- [ ] Kilit ekranında oynatma/duraklatma kontrolleri çalışıyor
- [ ] Telefon araması gelince veya kulaklık çekilince davranış (duraklıyor mu?)
- [ ] Uygulama arka plandayken OS tarafından öldürülme sonrası durum
- [ ] Binaural uyarısı kulaklıksız/kulaklıklı gerçek farkı hissettiriyor
- [ ] iPad'de gerçek düzen (kod `maxWidth: 640` ile sınırlıyor, hiç gerçek
      cihazda görülmedi)
- [ ] TR/EN geçişi; VoiceOver/TalkBack ile ana akış gezilebiliyor

## 4. Yasal + mağaza metadata

- [ ] Uygulama içindeki Gizlilik Politikası (`app/privacy.tsx` metni) bir web
      sayfasına taşınıp yayınlandı (GitHub Pages yeterli), URL'i not al
- [ ] Play Console: paket adı `com.neurosound.app`, Veri Güvenliği formu
      ("veri toplanmıyor" — kod bunu destekliyor, hiç network isteği yok),
      içerik derecelendirme anketi, ekran görüntüleri, feature graphic
      (1024×500), açıklama
- [ ] App Store Connect: bundle ID `com.neurosound.app`, App Privacy
      formu (veri toplanmıyor), ekran görüntüleri (iPhone + tablet destekli
      olduğu için muhtemelen iPad), destek URL/e-posta, açıklama
- [ ] Play Console'da servis hesabı oluşturup JSON key'i indir, repo köküne
      `google-services.json` olarak koy (`.gitignore`'da zaten hariç
      tutuluyor — asla commit'lenmeyecek)
- [ ] `eas.json`'a `submit.production.ios` bloğunu ekle (ilk
      `eas submit --platform ios` çalıştırıldığında CLI interaktif olarak
      sorup dolduruyor)

## 5. Production build + gönderim

```bash
npx eas build --profile production --platform all
npx eas submit --platform ios       # TestFlight
npx eas submit --platform android   # Internal testing
```

- [ ] TestFlight / kapalı testte birkaç gün gerçek kullanım
- [ ] Mağaza incelemesine gönder

## 6. Yayın sonrası

- [ ] Bir hata izleme servisi kur (ör. Sentry'nin Expo eklentisi) — şu an
      production'da bir şey patlarsa hiç haberin olmaz
