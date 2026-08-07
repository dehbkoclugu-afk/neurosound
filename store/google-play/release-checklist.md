# NeuroSound — Google Play yayın yol haritası

**Sahip / iletişim:** DEHB Koçluğu — dehbkoclugu@gmail.com
**Paket:** `com.neurosound.app`

Aşamalar sırayla yapılır. Her aşama bir sonrakinin ön koşulu; sıra atlanırsa
sonraki adım ya reddedilir ya da yanlış şeyi doğrular. Bir aşama tamamlanınca
kutuları işaretle.

---

## Aşama 0 — Depo hazır (tamamlandı)

- [x] Paket `com.neurosound.app`, production çıktısı AAB.
- [x] Android bulut yedeklemesi kapalı.
- [x] Kayıt, mikrofon, eski depolama ve overlay izinleri engellendi.
- [x] Gizlilik metinleri geliştiriciyi ve iletişimi tanımlıyor.
- [x] Türkçe/İngilizce listeleme metni ve mağaza grafikleri hazır.
- [x] Desteklenmeyen şifa iddiaları 21 dilin hepsinden çıkarıldı; kontrol
      `lib/__tests__/release-content.test.ts` içinde, dil başına bir terimle.
- [x] Paketlenen görsel ve seslerin kaynağı kayıtlı — `docs/ASSET_PROVENANCE.md`.

Yerel doğrulama zinciri (`docs/RELEASE.md`) yeşil: `tsc`, `lint`, 218 test,
üç `verify:*` script'i, `expo-doctor` 18/18.

- [x] Merge sonrası release manifest'i yerelde üretildi ve izin listesi
      doğrulandı (`gradlew :app:processReleaseManifest`). Sonuç aşağıda.

---

## Aşama 1 — Yayından önce dışarıda olması gerekenler

Play Console formları bu ikisini istiyor, elinde yokken forma başlama.

- [ ] `docs/privacy.html`'i herkese açık bir HTTPS adresinde yayınla.
      Depoda GitHub Pages zaten kurulu (`dehbkoclugu-afk.github.io`); URL'yi
      not et, Console'da ve uygulama içi gizlilik bağlantısında aynısı geçmeli.
- [ ] Yayınlanan URL'nin gizli pencerede, girişsiz açıldığını doğrula.

## Aşama 2 — Derleme kimlik bilgileri

- [ ] GitHub deposuna korumalı secret olarak `EXPO_TOKEN` ekle.
- [ ] GitHub deposuna korumalı secret olarak `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
      ekle. Anahtar dosyası depoya **girmez**; iş akışı onu yalnız submit
      sırasında geçici dosyaya yazar, doğrular, izinlerini kısar ve her
      durumda siler.
- [ ] Play Console'da servis hesabına yalnız gereken yetkileri ver.

## Aşama 3 — İlk üretim derlemesi (submit yok)

- [ ] EAS'ı `platform=android`, `profile=production`, `submit=false` ile çalıştır.
- [ ] Çıkan AAB'de imzayı ve 16 KB sayfa boyutu uyumluluğunu doğrula.

Release APK yerelde derlendi (`gradlew assembleRelease`, 14 dk, başarılı) ve
`aapt2 dump badging` ile okundu — sürüm bilgisi şu:

```
package  com.neurosound.app   versionCode 1   versionName 1.0.0
minSdk 24   targetSdk 36   compileSdk 36
ABI: arm64-v8a, armeabi-v7a, x86, x86_64
```

- [x] Release derlemesi geçiyor; hedef SDK 36, Play'in asgarisinin üstünde.
- [x] `versionCode` elle yönetilmiyor ve yönetilmemeli. `eas.json` içinde
      `cli.appVersionSource: "remote"` ve production profilinde
      `autoIncrement: true` var — EAS numarayı sunucuda tutup her production
      derlemesinde artırıyor, `app.json`'daki değeri yok sayıyor. Yukarıdaki
      yerel APK'da görünen `versionCode 1` yalnız Expo'nun yerel varsayılanı,
      Play'e giden AAB'de geçerli değil.
      `verify:android-config` bu iki ayarın yerinde kaldığını kontrol ediyor;
      biri silinirse ilk yüklemeden sonraki her yükleme "duplicate
      versionCode" ile reddedilir ve hata mesajından sebebi anlaşılmaz.

İzin listesi yerelde zaten doğrulandı — merge sonrası release manifest'te
tam olarak şunlar var, başka hiçbir şey yok:

```
ACCESS_NETWORK_STATE
FOREGROUND_SERVICE
FOREGROUND_SERVICE_MEDIA_PLAYBACK
INTERNET
MODIFY_AUDIO_SETTINGS
VIBRATE
com.neurosound.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
```

- [x] `RECORD_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE` ve `SYSTEM_ALERT_WINDOW`
      merge sonrası manifest'te **yok**. `app.json`'daki engelleme çalışıyor.
- [x] `allowBackup="false"` merge sonrası manifest'te korunuyor.
- [ ] AAB'nin izin listesinin bununla aynı olduğunu Play Console'da teyit et.
      Yukarıdaki APK derlemesinden alındı; AAB farklı çıkmamalı ama bakması
      bedava.

### Karar gerektiren — INTERNET izni

Manifest `INTERNET` ve `ACCESS_NETWORK_STATE` içeriyor; bunları React Native
ve Expo varsayılan olarak ekliyor. Ama gizlilik metni 21 dilde "hiçbir ağ
isteği yapmaz, tamamen çevrimdışı çalışır" diyor ve Data safety formunda da
bunu beyan edeceksin.

İzin sahibi olmak kullanmak demek değil, yani teknik bir çelişki yok. Yine de
izin listesine bakan kullanıcı ile metnin arasında görünür bir uyuşmazlık var.
`expo-updates` kapalı, analiz SDK'sı yok, fontlar ve sesler pakete gömülü —
görünürde ağa çıkan bir şey yok.

Seçenekler:

1. Bırak. Beyanla teknik olarak çelişmiyor, en düşük riskli yol.
2. `app.json` → `android.blockedPermissions` listesine `INTERNET` ve
   `ACCESS_NETWORK_STATE` ekle. Gizlilik iddiasını izin listesiyle
   kanıtlanabilir hâle getirir. **Ama önce cihazda dene** — release
   derlemesinde ağ kullanan bir şey kalmışsa sessizce bozulur, ve bunu
   emülatörsüz doğrulayamadım. Aşama 4'te denenecek bir değişiklik, körlemesine
   yapılacak değil.

## Aşama 4 — Internal testing ve fiziksel cihaz kabulü

AAB'yi Internal testing'e yükle ve uygulamayı **Google Play üzerinden** kur.
Sideload edilmiş APK ile test etme; foreground service ve bildirim davranışı
kurulum kaynağına göre değişebiliyor.

Aşağıda `[x]` işaretli maddeler **emülatörde, Android 15, release APK ile**
doğrulandı. Yine de gerçek cihazda tekrarlanmalı — emülatörün hoparlörü yok,
Play üzerinden kurulum farkı da orada sınanamaz.

Ses yolu — bu sürümde düzeltilen bug tam olarak burada görünür:

- [x] Sekiz preset üç kategoriden de çalındı: `binaural-alpha`,
      `solfeggio-40`, `solfeggio-528`, `noise-white`, `noise-brown`,
      `noise-rain`, `noise-airplane`, `noise-train`. Her birinde
      `dumpsys media.audio_flinger` **1 aktif AudioTrack** gösterdi; ton mono
      (0x1), gürültü ve binaural stereo (0x3), hepsi 44100 Hz.
- [x] Hiçbirinde "Ses başlatılamadı" çıkmadı. `ForegroundServiceStartNotAllowed`
      sayısı her koşuda **0** — yani o hiç sebep değildi.
- [x] Mikser: örnek mix üç kanalı birden çaldı, **3 aktif AudioTrack**,
      uygulamanın üç AudioTrack'i de `started`.
- [x] Ses dil değişimleri ve gezinme boyunca ~6 dakika kesintisiz çaldı.
- [x] Ekran kilitlendikten sonra çalmaya devam etti.
- [ ] **Kulaklıkla dinle.** Emülatörde yapılamaz. 40 Hz ve 111 Hz tonlar ile
      binaural presetler telefon hoparlöründe duyulmaz; bu bir hata değil,
      Player ekranındaki kulaklık uyarısı bunun için var.

Diller:

- [x] **हिन्दी**, **বাংলা** ve **ไทย** cihazda açıldı ve ekran görüntüsü alındı.
      **Tofu yok.** Devanagari bileşik harfleri (ध्यान, ध्वनियाँ), Bengalce
      যুক্তাক্ষর (মুহূর্তে, বৃষ্টি) ve Tayca ton işaretleri (ตอนนี้, คลื่นทะเล)
      doğru çiziliyor. Nunito Sans bu yazıları içermiyor, sistem fontuna
      düşüyor ve sonuç okunur. Font eklemeye gerek yok.
- [x] Dil listesinde 21 satırın hepsi görünüyor, kayıyor ve seçilebiliyor;
      bayraklar gerçek bayrak olarak çiziliyor.
- [x] Uzun çeviri taşması yok: Almanca mikserde "Braunes Rauschen" ve
      "Einstellungen" kırpılmadan sığıyor.

Oturum ve arayüz:

- [x] Geri dönen kullanıcının soğuk açılışı doğrudan ana ekrana geliyor,
      onboarding'e sapmıyor.
- [x] Kilit ekranı kontrolleri çalışıyor — aşağıdaki bölüme bak, orada
      gerçek bir bug bulundu ve düzeltildi.
- [x] Mikser tek bir medya oturumu gösteriyor.
- [ ] Uyku zamanlayıcısı kilitliyken doluyor, son 30 saniyede kısılıyor ve
      sesi durduruyor. Emülatörde saat ileri alınamadığı için denenmedi;
      dolma ve kısılma mantığı birim testlerinde kapsanıyor
      (`lib/audio/__tests__/playerController.test.ts`), ama cihazda bir kez
      gerçek süreyle görülmeli.
- [ ] Ses kesintisi (arama, bildirim) ve kulaklık çıkarma davranışı.
      Emülatörde anlamlı şekilde denenemedi.

### Çözüldü — kilit ekranı kontrolleri

Bu daha önce "Android 13+'ta muhtemelen hiç görünmeyecek" diye açık bir soru
olarak duruyordu. Emülatörde Android 15 üzerinde denendi; **iki varsayım da
yanlıştı ve altında gerçek bir bug vardı.**

Gerçek sebep `POST_NOTIFICATIONS` değildi. Release derlemesinde her
`setActiveForLockScreen` çağrısı reddediliyordu:

```
Cannot cast 'String' for field 'artworkUrl' ('java.net.URL?')
java.net.MalformedURLException: no protocol: assets_images_icon
```

`ensureArtwork()` şemasız bir kaynak adı veriyordu, `expo-audio` ise bunu
`java.net.URL`'e çevirmeye çalışıyordu. Düzeltildi — artık yalnız şeması olan
bir değer geçiliyor.

Düzeltme sonrası cihazda doğrulandı:

- Medya oturumu `active=true`, `state=PLAYING(3)`, uygulama sistemin medya
  düğmesi sahibi.
- Bildirim gölgesindeki medya kartı tam çalışıyor: başlık, "NeuroSound",
  duraklat, çıkış seçici.
- Bunların hepsi `POST_NOTIFICATION: ignore` iken, yani izin **verilmemişken**.
  Medya kontrolleri MediaSession'dan geliyor, bildirim izninden bağımsız.

Yani `POST_NOTIFICATIONS` eklemeye gerek yok. İzin listesi olduğu gibi kalır.

- [ ] Kalan tek kozmetik eksik: medya kartındaki **artwork karesi boş**.
      `Asset.downloadAsync()` release derlemesinde kullanılabilir bir
      `localUri` üretmiyor; başlık ve kontroller çalıştığı için yayını
      engellemez. Düzeltmek istersen ikonu çalışma anında bir dosyaya
      kopyalamak gerekir.

## Aşama 5 — Mağaza listelemeleri

Uygulama 21 dilde, mağaza sayfası iki dilde. Play listelemesi çevrilmemiş bir
dilde `en-US`'e düşer — kullanıcı uygulamayı kendi dilinde görmeden önce
sayfayı yabancı dilde görür, kurulum oranı orada düşer.

- [ ] `store/google-play/{locale}/listing.md` dosyalarını yaz. Mevcut iki
      dosya (`tr-TR`, `en-US`) şablon; aynı `## Kısa açıklama` /
      `## Tam açıklama` başlıklarını koru — `release-content.test.ts` uzunluk
      sınırlarını o başlıklardan okuyor.
- [ ] Play alan sınırları: kısa açıklama **80 karakter**, tam açıklama
      **4000 karakter**. Test bunu yalnız `tr-TR` ve `en-US` için kontrol
      ediyor; yeni dil eklersen o listeye de ekle, yoksa denetlenmez.
- [ ] Öncelik sırası, kurulum hacmine göre: `hi-IN`, `id-ID`, `vi-VN`,
      `pt-BR`, `es-ES`, `de-DE`, `ru-RU`. Kalanlar sonraki sürüme kalabilir —
      hepsini beklemek yayını geciktirmeye değmez.
- [ ] Metinlerde sağlık iddiası olmadığını doğrula. Play her dili ayrı
      değerlendiriyor; bir dilde geçen "tedavi eder" ifadesi tüm listelemeyi
      reddettirir.
- [x] **Ekran görüntüleri 21 dilin hepsinde var** — `assets/phone/{locale}/`
      altında dörder tane (ana ekran, keşfet, oynatıcı, mikser). Release
      APK'sından emülatörde çekildi, her biri kendi dilinde, durum çubuğu
      demo moduyla temizlendi (sabit saat, tam batarya, bildirim yok).
      JPEG q88; PNG olarak 95 MB tutuyorlardı, şimdi 16 MB.

      Yeniden çekmek gerekirse dikkat: dil değişimini doğrulamadan ilerleyen
      bir script, değişim sessizce başarısız olduğunda sonraki bütün dilleri
      yanlış dilde çeker ve hiçbir şey itiraz etmez. Doğrulama açık seçicideki
      satıra değil, sekme çubuğu etiketine bakmalı.

## Aşama 6 — Play Console beyanları

Aşama 4 bittikten sonra doldur; beyanların gözlemlenen davranışla uyuşması
gerekiyor.

- [ ] App access — uygulama giriş istemiyor, "tüm içerik erişilebilir" seç.
- [ ] Ads — reklam yok.
- [ ] Data safety — `store/google-play/data-safety.md` taslağını kullan.
- [ ] Content rating anketi.
- [ ] Target audience — sağlık iddiası olmadığından çocuk kategorisi seçme.
- [ ] Health apps beyanı — uygulama tıbbi fayda iddia etmiyor, solfeggio
      açıklamaları bunu zaten yazıyor.
- [ ] Foreground service beyanı — **yalnız `mediaPlayback`**, gerekçe:
      kullanıcının başlattığı arka plan ses çalma. Manifest'te başka tür yok,
      aşağıya bak. Aşama 4'teki `POST_NOTIFICATIONS` kararıyla tutarlı olmalı.
- [ ] Console'da her listeleme dilini etkinleştir (Aşama 5'te yazdıkların).

### Çözüldü — mikrofon foreground service türü kaldırıldı

`expo-audio` iki servis bildiriyor ve ikincisi bu uygulamada asla
başlatılamaz — `RECORD_AUDIO` engellenmiş durumda. Ama manifest'te durduğu
sürece Play, foreground service beyanında **mikrofon türü için de gerekçe
isterdi**; mikrofon kullanmayan bir uygulama için doldurulamaz bir form.

Kütüphanenin kendi eklentisi bunu çözmüyor: `recordAudioAndroid: false` yalnız
izni kaldırıyor, servis bildirimine dokunmuyor
(`node_modules/expo-audio/plugin/build/withAudio.js`).

`plugins/withoutMicrophoneService.js` servisi `tools:node="remove"` ile
düşürüyor. Merge sonrası release manifest'inde doğrulandı — geriye tek tür
kalıyor:

```
foregroundServiceType="mediaPlayback"
```

`verify:android-config` artık eklentinin kayıtlı kaldığını kontrol ediyor, yani
biri `app.json`'dan çıkarırsa yayın kapısı kırmızıya döner.

## Aşama 7 — Yayın

- [ ] Pre-launch report'u incele.
- [ ] Android vitals'ta çökme ve ANR oranlarına bak.
- [ ] Kademeli yayın (staged rollout) ile başla, %100'e bir seferde çıkma.

---

## Yayın sonrası izlenecekler

- Android vitals'ta `ForegroundServiceStartNotAllowedException` — bu sürümde
  yutuluyor, yani artık kullanıcıyı etkilemiyor, ama görülmeye devam ederse
  kilit ekranı kontrolleri o cihazlarda hiç açılmıyor demektir.
- Düşük RAM'li cihazlarda binaural ve gürültü presetlerinin başlama süresi.
  Tampon JS'de üretilip base64 olarak aktarılıyor; binaural 2 saniyeye
  indirildi, üretilen gürültü hâlâ 10 saniye.
