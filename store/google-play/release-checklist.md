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
- [x] Desteklenmeyen şifa iddiaları 11 dilin hepsinden çıkarıldı.
- [x] Paketlenen görsel ve seslerin kaynağı kayıtlı — `docs/ASSET_PROVENANCE.md`.

Yerel doğrulama zinciri (`docs/RELEASE.md`) yeşil: `tsc`, `lint`, 161 test,
üç `verify:*` script'i, `expo-doctor` 18/18.

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
- [ ] Çıkan AAB'de imzayı, `versionCode`'u, hedef SDK'yı, 16 KB sayfa boyutu
      uyumluluğunu ve nihai izin listesini doğrula.
- [ ] İzin listesinde `RECORD_AUDIO`, `READ/WRITE_EXTERNAL_STORAGE` ve
      `SYSTEM_ALERT_WINDOW` **bulunmadığını** teyit et — `app.json` bunları
      kaldırıyor, merge sonrası manifest'te gerçekten yok olmalı.

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

`POST_NOTIFICATIONS` izni ne projede ne de bağımlılıklarında tanımlı.
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

Seçtiğini `docs/RELEASE.md`'ye not et; Aşama 5'teki foreground service
beyanı buna göre doldurulur.

## Aşama 5 — Play Console beyanları

Aşama 4 bittikten sonra doldur; beyanların gözlemlenen davranışla uyuşması
gerekiyor.

- [ ] App access — uygulama giriş istemiyor, "tüm içerik erişilebilir" seç.
- [ ] Ads — reklam yok.
- [ ] Data safety — `store/google-play/data-safety.md` taslağını kullan.
- [ ] Content rating anketi.
- [ ] Target audience — sağlık iddiası olmadığından çocuk kategorisi seçme.
- [ ] Health apps beyanı — uygulama tıbbi fayda iddia etmiyor, solfeggio
      açıklamaları bunu zaten yazıyor.
- [ ] Foreground service beyanı — `mediaPlayback` türü, gerekçe: kullanıcının
      başlattığı arka plan ses çalma. Aşama 4'teki kararla tutarlı olmalı.

## Aşama 6 — Yayın

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
