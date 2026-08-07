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
- [ ] `versionCode` 1 — ilk yükleme için doğru. Her yeni yüklemede artması
      gerektiğini unutma, Play aynı değeri ikinci kez kabul etmez.

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

Ses yolu — bu sürümde düzeltilen bug tam olarak burada görünür:

- [ ] Her kategoriden en az bir preset çal: binaural, solfeggio, ve hem
      üretilen (white/pink/brown) hem dosyadan gelen (yağmur, okyanus) gürültü.
- [ ] Hiçbirinde "Ses başlatılamadı. Tekrar deneyin." çıkmamalı.
- [ ] Mikserde 3-4 kanal aynı anda çalmalı ve kanallardan biri hata verdiğinde
      diğerleri susmamalı.
- [ ] **Kulaklıkla dinle.** 40 Hz ve 111 Hz tonlar ile binaural presetler
      telefon hoparlöründe duyulmaz; bu bir hata değil, Player ekranındaki
      kulaklık uyarısı bunun için var.
- [ ] Uygulamayı arka plana al, kilitle, birkaç dakika sonra tekrar aç —
      ses kesilmemeli, hata görünmemeli.

Diller — uygulama 21 dilde, hepsi cihazda hiç görülmedi:

- [ ] Cihaz dilini **हिन्दी**, **বাংলা** ve **ไทย** yap ve uygulamayı aç.
      Uygulama Nunito Sans kullanıyor; bu font Devanagari, Bengali ve Thai
      gliflerini içermiyor. Beklenen davranış sistem fontuna düşmesi, yani
      metin okunur ama tipografi diğer dillerden farklı görünür.
      **Kutucuk (tofu) görürsen** o dile font eklemek gerekir — o hâlde ya
      `@expo-google-fonts` üzerinden Noto Sans Devanagari/Bengali/Thai ekle,
      ya da o üç dili bu sürümden çıkar.
- [ ] Ayarlar → Dil listesinde 21 satırın hepsi kayıyor ve seçilebiliyor.
- [ ] Uzun çevirilerin taşmadığını gör: Almanca ve Felemenkçe en uzun
      metinleri üretiyor, mikser kanal adlarına ve onboarding başlıklarına bak.

Oturum ve arayüz:

- [ ] Geri dönen kullanıcının soğuk açılışı onboarding'e yönlendirmiyor.
- [ ] Tekli çalma kilit ekranını atlatıyor; kilit ekranından play/pause
      doğru çalışıyor. **Aşağıdaki bilinen sorunu oku.**
- [ ] Mikser tek bir medya oturumu gösteriyor ve tüm kanalları birlikte
      yönetiyor.
- [ ] Uyku zamanlayıcısı kilitliyken doluyor, son 30 saniyede kısılıyor ve
      sesi durduruyor.
- [ ] Ses kesintisi (arama, bildirim), kulaklık çıkarma ve bildirim davranışı
      kabul edilebilir.

### Bilinen sorun — kilit ekranı kontrolleri Android 13+

`POST_NOTIFICATIONS` izni merge sonrası release manifest'te **yok** —
tahmin değil, yukarıdaki izin listesinden okundu.
Android 13 ve üstünde medya foreground service'i çalışmaya devam eder ama
bildirimi — ki kilit ekranı kontrolü **odur** — kullanıcı bu izni çalışma
anında vermeden gösterilmez. Yani kilit ekranı kontrolleri modern Android'de
büyük ihtimalle hiç görünmeyecek.

Karar senin, üç seçenek var:

1. Bu sürümde kabul et, kilit ekranı kontrollerini özellik olarak duyurma.
   Ses arka planda çalmaya devam ediyor; sadece kontroller yok.
2. İzni `app.json`'a ekle ve çalışma anında iste. Doğru yapmak için bir izin
   modülü gerekir (yeni bağımlılık), ve ilk açılışta bir izin sorusu daha
   çıkar.
3. Yalnız izni tanımla, istemeden bırak. **Bunu yapma** — bildirim yine
   görünmez, karşılığında Play'e açıkladığın izin listesi uzar.

Seçtiğini `docs/RELEASE.md`'ye not et; Aşama 6'daki foreground service
beyanı buna göre doldurulur.

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
- [ ] Ekran görüntüleri: `store/google-play/assets/` içindekiler İngilizce.
      Yerelleştirilmiş görüntü zorunlu değil, ama eklersen Aşama 3'teki
      derlemeden al, tasarım değişmeden önce değil.

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
