# NeuroSound — 100 Kritik Tasarım Önerisi

Kaynak: `app/`, `components/`, `constants/theme.ts`, `lib/`, `stores/`, `locales/` tam okuma.
Mercek: Impeccable (critique + native audit), Emil Kowalski design engineering, Apple HIG / Designing Fluid Interfaces.

**Öncelik**: P0 görevi bloke eder · P1 sürüm öncesi · P2 sonraki tur · P3 cila

---

## Teşhis

Uygulamanın tek en büyük problemi **kimlik çatallanması**. `constants/theme.ts` başlığında yazan söz ("Kor — tek amber aksan, sakin, karanlık öncelikli") liste ekranlarında tutuluyor ama Player'da tutulmuyor: orada 33 presetin her biri kendi rengiyle (mavi, mor, yeşil, kırmızı, pembe, fuşya...) ekranı yıkıyor. İki sistem arasında köprü kuran hiçbir ekran yok. İkinci büyük problem: **uygulama "preset çalar" olarak tasarlanmış, ama kullanım senaryosu "uyku seansı"**. Uyuyan kullanıcı için kritik olan her şey (zamanlayıcı kalıcılığı, kilit ekranı kontrolü, ses seviyesi hafızası, mixer'ın global kontrolü) eksik ya da kırık.

---

## A. Kimlik ve yön (1–8)

1. **[P1] İki renk sistemi arasında karar ver.** `theme.ts:4` "tek amber aksan" diyor, `player/[id].tsx:139` presetin kendi rengiyle tüm ekranı boyuyor. Ya Player'ı amber'a çek, ya listelere de preset rengini taşı. Şu an ikisi de yarım.
2. **[P1] 15 solfeggio için 15 ayrı gradyan aşırı.** `theme.ts:83-97`. Renk anlam taşımalı; 963 Hz'in fuşya olması hiçbir şey öğretmiyor. Üç kategori = üç renk yeter.
3. **[P1] Uygulama ikonu markadan kopuk.** `app.json` adaptive icon arkaplanı `#6366F1` (indigo), uygulama amber `#D99A4E`. Ana ekranda uygulama başka, içeride başka görünüyor.
4. **[P1] Splash ekranı marka rengini kullanmıyor.** `app.json` splash `#ffffff` / `#000000`; uygulama arkaplanı `#131110`. Açılışta beyaz parlama → sıcak koyu zıplaması var. Splash'i `#131110`'a al.
5. **[P2] Ölü token'ları sil.** `GradientColors` (41 satır) ve `FrequencyColors` hiçbir yerde import edilmiyor (doğrulandı). `Shadows.medium`/`large`, `AccessibilitySize.borderRadiusLarge/XL/iconSizeLarge` de kullanılmıyor. Tasarım sistemi kendi kendine yalan söylüyor.
6. **[P2] `night` teması gerçekten farklılaşmalı.** Şu an sadece kısılmış `dark`. Gece modu: animasyonu tamamen durdur, kırmızı-kaydırmalı aksan, tab bar'ı gizle, sadece player'ı bırak.
7. **[P2] "Düşük Kontrast" ayarı yanlış isimlendirilmiş.** Kullanıcı faydayı değil mekanizmayı okuyor. "Yumuşak görünüm" / "Gözü yormayan mod".
8. **[P3] Ürün adı ekranda üç kez tekrar ediyor.** Splash, home başlığı, `locales.home.title`. Home'daki 32px "NeuroSound" başlığı ekranın en değerli yerini marka tekrarına harcıyor — oraya "Ne yapmak istiyorsun?" gelsin.

## B. Renk ve kontrast (9–20)

9. **[P1] Beyaz-üstü-amber WCAG'i açık ara ihlal ediyor.** `settings.tsx:101` ve `Button.tsx:103`: `#FFFFFF` üzerine `#D99A4E` = **2.42:1**. AA için 4.5:1 gerekiyor. Aynı uygulamada `player/[id].tsx:257` doğru yapıyor (`#1A140C` = 7.56:1). Tüm primary-dolgu metinleri `#1A140C`'ye çevir.
10. **[P1] "Düşük kontrast" modu ikincil metni okunmaz yapıyor.** `theme.ts:196` `lowContrastLight.textSecondary` `#948A7C` / `#F8F5F0` = **3.12:1**. Görsel hassasiyet ayarı erişilebilirliği bozuyorsa ters çalışıyor. Minimum 4.5:1'e çek.
11. **[P1] Gece modu ikincil metni sınırda kalıyor.** `theme.ts:165` `#7A6F5F` / `#050403` = **4.15:1**, 13px footnote için yetersiz. `#8A7E6C`'ye çıkar (≈5.1:1).
12. **[P1] Intent bloklarındaki metin kontrastı garanti değil.** `index.tsx:151-164`: rastgele foto üzerine sabit scrim. Foto açık gelirse beyaz başlık kaybolur. Alt %40'a düz `rgba(0,0,0,0.55)` taban ekle, gradyanı onun üstüne koy.
13. **[P2] `colors.warning` tanımlı ama hiç kullanılmıyor.** Oysa kulaklık uyarısı, maksimum ses limiti, epilepsi notu — üçü de uyarı rengi isteyen yerler; hepsi düz `textSecondary`.
14. **[P2] Hata rengi tek başına anlam taşıyor.** `player/[id].tsx:202` playback hatası sadece kırmızı metin. İkon + metin ekle (renk körlüğü).
15. **[P2] Mixer sil ikonu `colors.error` ile sürekli kırmızı duruyor.** `mixer.tsx:269`. 4 kaydedilmiş karışımda 4 kırmızı ikon = ekranın en dikkat çeken şeyi silme eylemi oluyor. Nötr yap, sadece onay diyaloğunda kırmızıya geç.
16. **[P2] `preset.color + '2E'` alfa birleştirmesi kırılgan.** `player/[id].tsx:139,173-175`. 3 haneli hex ya da `rgb()` gelirse sessizce bozulur. `withAlpha(hex, a)` yardımcısı yaz.
17. **[P2] Tab bar'da hem gölge hem hairline var.** `(tabs)/_layout.tsx:33-38`. Düz tasarımda ikisi birden fazlalık; gölgeyi at.
18. **[P3] Aksan rengi seçili durumu her yerde farklı gösteriyor.** Explore'da 2px alt çizgi, Settings'te dolu hap, Timer modalında checkmark, Onboarding'de nokta. Tek bir "seçili" dili belirle.
19. **[P3] Kategori kartlarında ölü renk verisi var.** `index.tsx:41,47,53` üç hex tanımlıyor ama `CategoryCard` `color` prop'unu "API uyumu için tutuldu, kullanılmıyor" diye yoksayıyor. Sil.
20. **[P3] Player'daki üç katmanlı glow (`0F`/`14`/`1C`) OLED'de bantlaşma yapıyor.** `player/[id].tsx:343-360`. Tek bir radial gradyan ya da hafif noise dokusu kullan.

## C. Tipografi (21–29)

21. **[P1] Settings ekranı tasarım sisteminin dışında.** `settings.tsx:249-322` `Typography` yerine ham `fontSize`/`fontWeight` kullanıyor. **Bu görsel bir hata**: Nunito Sans varyantları `fontFamily` ile yükleniyor, RN özel fontlarda `fontWeight`'i sentezlemiyor → Settings sistem fontunda render oluyor, diğer ekranlar Nunito'da. `Typography` token'larına geçir.
22. **[P1] Aynı hata `Button.tsx:93` ve `Slider.tsx:169-174`'te de var.** `fontWeight: '600'` / `'500'` — `FontFamily.semibold` olmalı.
23. **[P2] Ekran başlıkları tutarsız.** Home `largeTitle` (32), Mixer `largeTitle` (32), Explore `title1` (27), Settings ham `28`. Dördü de aynı hiyerarşi seviyesinde; tek değere sabitle.
24. **[P2] Tipo ölçeği 11 basamak, ihtiyaç 6.** `theme.ts:296-358`. 17/16/15 pratikte ayırt edilemiyor. `largeTitle · title · headline · body · footnote · caption` yeterli.
25. **[P2] Hiçbir yerde letter-spacing yok.** Apple kuralı: büyük metin negatif tracking ister. 32px `largeTitle` Nunito'nun varsayılan aralığında dağınık duruyor — `-0.4` ekle, `caption2`'ye `+0.2`.
26. **[P2] `Typography.mono` tanımlı ama sıfır kullanım (doğrulandı).** Bunun yerine `fontVariant: ['tabular-nums']` beş ayrı dosyada elle tekrarlanıyor. Ya token'ı kullan ya sil.
27. **[P2] Sayaç `120:00` gösteriyor.** `player/[id].tsx:117-121` `formatTime` saat kavramı bilmiyor; 2 saatlik zamanlayıcı 11px `caption2`'de 6 karakter oluyor. `2:00:00` formatına geç.
28. **[P3] `numberOfLines={1}` intent açıklamasını kesiyor.** `index.tsx:168`. Türkçe açıklamalar İngilizce'den ~%20 uzun; "Dikkatini toplamak için ritim ve gürültü" 108px blokta kırpılacak. İki satıra izin ver.
29. **[P3] Dinamik Type desteklenmiyor.** Tüm ölçüler sabit px, `minHeight: 52/56`, intent bloğu `height: 108`. Sistem yazı boyutu büyütüldüğünde metin kırpılır. En azından intent bloğunu ve satırları `minHeight` + esnek yüksekliğe çevir.

## D. Bilgi mimarisi ve navigasyon (30–40)

30. **[P0] Mixer çalarken hiçbir global kontrol yok.** `MiniPlayer` sadece `currentPreset`'e bakıyor (`MiniPlayer.tsx:35`), mixer ise `mixerChannels`/`isMixerPlaying` kullanıyor. Mixer'ı başlatıp Ana Sayfa'ya geçen kullanıcı sesi durduramıyor, çaldığını bile göremiyor. MiniPlayer'ı iki kaynağı da gösterecek şekilde genelleştir.
31. **[P0] MiniPlayer içeriği örtüyor.** `(tabs)/_layout.tsx:108` MiniPlayer'ı tab bar'ın 56px üstüne mutlak konumluyor, ama ekranların `contentContainerStyle.paddingBottom` değeri `20`. Bir ses çalarken her listenin son satırı erişilemez oluyor. Çalarken `paddingBottom`'u 76+ yap.
32. **[P1] Settings bir tab slotu harcıyor.** Dört üst seviye slottan biri ayarlar; üstelik Home'da da ayarlar butonu var (`index.tsx:127`) — iki giriş noktası. Settings'i Home başlığındaki butona bırak, o slota "Favoriler" ya da "Seanslar" koy.
33. **[P1] Home → Kategoriler, Explore tab'ının birebir kopyası.** `index.tsx:222-233` üç kategoriyi listeleyip Explore'a yönlendiriyor. Aynı hedefe iki yol; kaldır.
34. **[P1] 33 preset var, arama yok.** Explore, Mixer picker, Intent — hiçbirinde filtre/arama yok. Mixer picker'da 33 satırlık düz kaydırma var (`mixer.tsx:297-318`).
35. **[P1] "Uyku seansı" kavramı yok.** Uygulama "preset seç → zamanlayıcı ayarla → sesi ayarla" istiyor; uyumak üzere olan kullanıcı bunu her gece üç adımda yapıyor. Intent ekranına "30 dk uyku seansı başlat" tek dokunuş ekle (preset + timer + ses rampası birlikte).
36. **[P1] Son çalınan sürdürülemiyor.** `audioStore` persist edilmiyor (`stores/audioStore.ts:61`) — `volume` her açılışta 0.5'e dönüyor. Kullanıcı ses seviyesini her gece yeniden ayarlıyor.
37. **[P2] Intent ekranı jenerik bir preset listesinden ibaret.** `intent/[id].tsx:103-112`. "Uyku" ile "Odak" arasındaki tek fark hangi presetlerin listelendiği; önerilen süre, önerilen ses seviyesi, sıralama mantığı yok.
38. **[P2] Favoriler 4 ile sınırlı ve devamı yok.** `index.tsx:205` `slice(0, 4)`; `CategoryHeader` `onSeeAll` destekliyor ama hiç geçirilmiyor. 5. favori erişilemez.
39. **[P2] Onboarding ilk render'dan sonra `push` ediliyor.** `index.tsx:65-69`. Ana ekran bir kare görünüp üstüne onboarding biniyor. Ayrıca bitişte `router.back()` (`onboarding.tsx:53`) — derin linkle gelindiğinde geri gidecek yer yok. Route guard'a çevir.
40. **[P3] Player'a derin link gelirse `router.back()` uygulamadan çıkarıyor.** `player/[id].tsx:113`. `router.canGoBack()` kontrolü ekle, yoksa `/(tabs)`'a git.

## E. Player (41–54)

41. **[P0] Kilit ekranı / bildirim kontrolü yok.** `app.json` `UIBackgroundModes: ["audio"]` tanımlı ama now-playing metadata'sı yok. Uykuya dalan kullanıcının telefonu kilitli — sesi durdurmak için uygulamayı açması gerekiyor. Bir arka plan sesi uygulaması için bu temel eksik.
42. **[P0] Zamanlayıcı süreç ölürse tamamen kayboluyor.** `playerController.ts:204` JS `setInterval`; `timerStartedAt` store'da var ama persist edilmiyor. Android'de foreground service olmadığı için OS uygulamayı öldürebilir → 2 saatlik zamanlayıcı sessizce iptal olur, ses sabaha kadar çalar. `timerStartedAt`'i diske yaz, açılışta duvar saatinden yeniden hesapla.
43. **[P1] Ana kontrolde basma geri bildirimi yok.** `player/[id].tsx:243-261` sadece `activeOpacity`. Emil kuralı: basılabilir her şey `scale(0.97)`. 72px play butonu uygulamanın en önemli dokunuşu ve şu an ölü hissettiriyor.
44. **[P1] `reduceMotion` yanlış uygulanmış.** Kod her yerde `activeOpacity: reduceMotion ? 1 : 0.6` yapıyor (`PresetCard.tsx:64`, `mixer.tsx:191`, `CategoryHeader.tsx:51`...). Bu hareketi değil *geri bildirimi* kapatıyor. Kural tam tersi: hareketi kaldır, opaklık/renk geçişini koru.
45. **[P1] Solfeggio açıklaması Player'da gizleniyor.** `player/[id].tsx:195`. En çok açıklama gereken kategori — "Sevgi Frekansı", "Korkudan Arınma" — hiçbir bağlam vermeden çalıyor. Sorumluluk açısından da riskli (bkz. #92).
46. **[P1] Sağdaki 60px slot boş bir `View`.** `player/[id].tsx:264` "simetri için". Kullanıcının en çok isteyeceği eylemler (mixer'a ekle, seansı kaydet, arkaplan sesi ekle) için hazır bir yer boşa gidiyor.
47. **[P1] Ses kaydırıcısı gerçek seviyeyi göstermiyor.** `maxVolume` 0.8 iken kaydırıcı %100'e gidiyor ama gerçek çıkış %80. `showValue={false}` (`player/[id].tsx:217`) olduğu için kullanıcı hiçbir sayı da görmüyor.
48. **[P2] Zamanlayıcı modalı `reduceMotion`'ı yoksayıyor.** `player/[id].tsx:272` sabit `animationType="fade"`; Mixer'ın modalları `reduceMotion ? 'none' : 'slide'` yapıyor. Tutarsız.
49. **[P2] Zamanlayıcı modalında iptal butonu yok.** Sadece scrim'e dokunmak kapatıyor — keşfedilebilir değil.
50. **[P2] Zamanlayıcı seçenekleri esnek değil.** 15/30/60/120 dk sabit. Uyku için en çok istenen "sesli alarma kadar" ve "ben uyuyunca" yok; en azından 45 dk ve 8 saat ekle.
51. **[P2] Zamanlayıcı geri sayımı sessiz.** Son 30 saniyede ses kısılıyor (`playerController.ts:218`) ama ekranda hiçbir işaret yok. VoiceOver kullanıcısı hiç bilmiyor.
52. **[P2] Nefes alan halka sonsuza kadar dönüyor.** `WaveVisualizer.tsx` + `getVisualTempoMs`: delta için 6000ms döngü = 0.167 Hz. Apple'ın azaltılmış-hareket rehberi tam bu bandı (≈0.2 Hz, yavaş salınım) işaret ediyor. 90 saniye sonra sönümlendir.
53. **[P3] Duraklatıldığında halka anında donuyor.** `isPlaying` false olunca opaklık `0.15`'e sıçrıyor. Sese yumuşak sönümleme var, görsele yok — ikisi eşleşmeli.
54. **[P3] `player.nowPlaying` / `player.paused` başlığı sessizce değişiyor.** `accessibilityLiveRegion="polite"` ekle.

## F. Mixer (55–64)

55. **[P1] Kaydedilmiş karışıma dokunmak hiçbir geri bildirim vermiyor.** `mixer.tsx:240` kanalları yüklüyor ama çalmıyor, o bölüme kaydırmıyor, bir şey olduğunu söylemiyor. Kullanıcı ekranın altında, değişiklik ekranın üstünde.
56. **[P1] İç içe `TouchableOpacity` var.** `mixer.tsx:238` satırının içinde `mixer.tsx:252` sil butonu. Android'de dokunma hedefleri çakışıyor; sil ikonu satırı da tetikleyebiliyor. Sil'i `Pressable` + `hitSlop` ile ayır ya da satırı kaydırmalı eyleme çevir.
57. **[P1] Butonlar var-yok oluyor, düzen zıplıyor.** `mixer.tsx:204` ve `:223` — ilk kanal eklendiğinde play butonu ve kaydet butonu bir anda beliriyor. Yerlerini baştan ayır, disabled göster.
58. **[P1] 4 kanal doluyken "Ses Ekle" satırı sessizce kayboluyor.** `mixer.tsx:188`. Kullanıcı butonun nereye gittiğini anlamıyor. Yerinde bırak, "4/4 — eklemek için birini çıkar" yaz.
59. **[P2] Başarı mesajı için `Alert.alert` kullanılıyor.** `mixer.tsx:109`. Bir kaydetme onayı için modal alert ağır — kullanıcıyı durduruyor. Kısa bir inline toast yeterli.
60. **[P2] Kaydetme diyaloğu tek metin alanı için tam ekran modal.** `mixer.tsx:324-364`. Alt sayfa (bottom sheet) ya da inline alan kullan.
61. **[P2] Kanal başına sustur/yalnız (mute/solo) yok.** Karıştırıcının temel eylemi: bir sesi geçici kısmak için ya kaydırıcıyı sıfıra çekip değeri kaybediyorsun ya da kanalı siliyorsun.
62. **[P2] Kaydedilmiş karışım yeniden adlandırılamıyor, düzenlenemiyor.** Sadece yükle ve sil.
63. **[P3] Hangi karışımın yüklü olduğu belli değil.** Yükledikten sonra listede hiçbir seçili durum yok.
64. **[P3] `mixName` diyalog kapatılınca temizlenmiyor.** `mixer.tsx:107` sadece başarılı kayıtta sıfırlıyor; X ile kapatıp tekrar açınca eski metin duruyor.

## G. Ana ekran, Explore, Intent (65–74)

65. **[P0] Intent görselleri uzak sunucudan gelen placeholder.** `lib/intents.ts:26` — `picsum.photos`. Ana ekranın birincil giriş noktası dört rastgele fotoğrafa bağlı. Uçakta / uçak modunda / metroda ana ekran dört boş blok. Yerel asset'e taşı, `expo-image` `placeholder` (blurhash) + `cachePolicy` ver.
66. **[P1] Aynı görseller sanat yönetimsiz.** `picsum` seed'i sabit olsa da içerik rastgele: "Uyku" bloğunda bir araba fotoğrafı çıkabilir. Yayın öncesi dört gerçek atmosferik görsel şart (kod yorumu da bunu söylüyor).
67. **[P1] Kulaklık uyarısı üç yerde farklı davranıyor.** Onboarding adım 2'de anlatılıyor, sonra `index.tsx:74` ve `intent/[id].tsx:48`'de tekrar `Alert` çıkıyor, bir de `index.tsx:237`'de sayfa dibinde sabit not olarak duruyor — üstelik aynı string üç farklı işi yapıyor. Onboarding'i gördüyse Alert'i atla.
68. **[P1] `ScrollView` içinde yatay `FlatList`.** `index.tsx:183`. Sanallaştırma iç içe geçtiğinde iptal oluyor; 10 elemanlık liste için `ScrollView horizontal` daha doğru.
69. **[P2] Explore kategori açıklaması her ziyarette tekrar okutuluyor.** `explore.tsx:141`. 3 satırlık paragraf listeyi aşağı itiyor; katlanabilir yap ya da bir kez göster.
70. **[P2] Explore'da kategori sekmeleri arasında kaydırma yok.** Sekme varsa yatay kaydırma beklenir (platform kuralı).
71. **[P2] Explore'da favori filtresi yok.** Kalp ikonu satırlarda gösteriliyor (`PresetCard.tsx:80`) ama filtrelenemiyor.
72. **[P2] Intent kahramanı ile ana ekrandaki blok arasında süreklilik yok.** `index.tsx:143` bloğu ile `intent/[id].tsx:78` kahramanı aynı görsel ve aynı renk — paylaşılan eleman geçişi buranın doğal adayı. Şu an sert bir push.
73. **[P3] Boş "Son Dinlenenler" bölümü hiç görünmüyor.** İlk kullanıcı bu özelliğin varlığını öğrenmiyor. Favoriler bölümü boş durumu doğru yapıyor (`home.favoritesEmpty`), bu da yapmalı.
74. **[P3] `PresetCardSmall` ile `PresetCard` aynı veriyi iki farklı dilde gösteriyor.** Biri hap, diğeri satır; biri Hz gösteriyor, diğeri göstermiyor.

## H. Ayarlar ve onboarding (75–83)

75. **[P0] Kayıtlı dil açılışta uygulanmıyor.** `i18n/index.ts:27` `lng`'yi **cihaz diline** göre kuruyor; `settingsStore` `language`'ı persist ediyor ama `app/_layout.tsx` açılışta `i18n.changeLanguage()` çağırmıyor. İngilizce seçip uygulamayı kapatan Türk kullanıcı Türkçe'ye dönüyor — ama Settings ekranı hâlâ "English" seçili gösteriyor. Ayrıca ilk açılışta store `'tr'` derken i18n cihaz dilinde olabiliyor.
76. **[P1] Slider erişilebilirlik etiketleri sabit Türkçe.** `Slider.tsx:118-119` `'Artır'` / `'Azalt'`. İngilizce modda VoiceOver Türkçe konuşuyor.
77. **[P1] Onboarding atlanamıyor.** `onboarding.tsx` üç adım zorunlu, geri adım yok, atla yok. Güncelleme sonrası tekrar kuran kullanıcı üç ekranı yeniden geçiyor.
78. **[P1] Onboarding'de dil seçimi yok.** Uygulama Türkçe varsayılanla açılıyor; İngilizce kullanıcı önce Ayarlar'ı bulmak zorunda.
79. **[P2] Epilepsi uyarısı Ayarlar'ın en dibinde.** `settings.tsx:219`. Uyarı, uyarılacak şeyin (nefes alan halka) yanında olmalı — ya da hiç olmamalı. Şu an ikisinin ortasında.
80. **[P2] Haptik kapatma seçeneği yok.** `haptic-tab.tsx` her sekme dokunuşunda titriyor — en anlamsız an. Anlamlı anlarda (çal/duraklat, favori, zamanlayıcı kuruldu) hiç titremiyor. Apple §13 "fayda" kuralının tam tersi.
81. **[P2] Sürüm numarası elle yazılmış.** `settings.tsx:214` `'1.0.0'`. `expo-constants`'tan oku, yoksa her sürümde unutulur.
82. **[P2] Veri temizleme / sıfırlama yok.** `resetSettings` ve `presetsStore.reset` kodda var ama hiçbir arayüze bağlı değil.
83. **[P3] Onboarding'de tanımlı ikonlar hiç render edilmiyor.** `onboarding.tsx:22-36` her adıma bir ikon veriyor, JSX'te kullanılmıyor. Üç adım da düz metin — görsel hiyerarşi yok.

## I. Hareket, haptik, geri bildirim (84–92)

84. **[P1] MiniPlayer anında beliriyor/kayboluyor.** `(tabs)/_layout.tsx:107`. Emil: "geçişsiz beliren/kaybolan elemanlar bozuk hissettirir." 200ms `translateY` + opaklık ile alttan kaydır, çıkışı 150ms yap.
85. **[P1] Hiçbir butonda basma ölçeği yok.** Play (Player + Mixer + MiniPlayer), Button, PresetCard, CategoryCard, tab butonları. `Pressable` + `scale(0.97)` / 160ms `ease-out` tek bir yerde çözülür.
86. **[P1] Reanimated 4 kurulu ama kullanılmıyor.** `package.json` `react-native-reanimated ~4.1.1` ve `react-native-worklets` var; tüm animasyon eski `Animated` API'sinde (`WaveVisualizer.tsx`). Spring tabanlı, kesintiye uğratılabilir hareket için gerekli araç zaten paket içinde.
87. **[P2] Onboarding adım geçişi anlık.** `onboarding.tsx:56` `setStep` — metin bir karede değişiyor. 200ms crossfade + noktalar için genişlik animasyonu.
88. **[P2] Onboarding noktaları animasyonsuz genişliyor.** `onboarding.tsx:79` `width: i === step ? 22 : 8` anında.
89. **[P2] Zamanlayıcı rozeti anında beliriyor.** `player/[id].tsx:236`. Zamanlayıcı kurmak onaylanması gereken bir eylem — beliriş + hafif haptik.
90. **[P2] Favori kalbi anında doluyor.** `player/[id].tsx:162`. Nadir ve ödüllendirici bir eylem; Emil'in "nadir olaylara delight ekle" kategorisi. Scale-pop + haptik.
91. **[P2] Yükleme durumu spinner ile gösteriliyor.** `player/[id].tsx:251`. Ses üretimi için spinner yanlış metafor — halkayı soluk göster, ses hazır olduğunda nefes almaya başlasın.
92. **[P3] Intent bloklarında stagger yok.** `index.tsx:142` dört blok aynı anda geliyor. 40ms aralıklı giriş, ekranın ana kararını daha okunur yapar.

## J. Erişilebilirlik ve uyarlanabilirlik (93–100)

93. **[P1] `PresetCard` erişilebilirlik etiketi bilgiyi düşürüyor.** `PresetCard.tsx:67` sadece isim okuyor; alt satırdaki kategori + Hz ve favori durumu ekran okuyucuya hiç ulaşmıyor. `accessibilityLabel` üçünü de birleştirsin.
94. **[P1] iPad portrait'e kilitli ve telefon düzeni geriyor.** `app.json` `orientation: "portrait"` + `supportsTablet: true`. iPad'de 108px yüksekliğinde ~1000px genişliğinde intent blokları çıkıyor. Ya tablet desteğini kapat ya `maxWidth: 640` merkezli kap ekle.
95. **[P1] Yatay mod hiç yok.** Uyku uygulaması yan yatan telefonda kullanılır. En azından Player yatayı desteklemeli.
96. **[P1] Android predictive back kapatılmış.** `app.json` `predictiveBackGestureEnabled: false`. Android 14+ sistem davranışını iptal ediyor; bu uygulamada bunu gerektiren hiçbir şey yok.
97. **[P2] Dekoratif ikonlar erişilebilirlik ağacında.** `PresetCard.tsx:70`, `CategoryHeader.tsx:91`, `player/[id].tsx:212,222` ses ikonları — hepsi `importantForAccessibility="no"` / `accessibilityElementsHidden` olmalı.
98. **[P2] Ekran başlıklarında `accessibilityRole="header"` yok.** Hiçbir ekranda. VoiceOver başlık atlaması çalışmıyor.
99. **[P2] Modallarda `accessibilityViewIsModal` yok.** `player/[id].tsx:269`, `mixer.tsx:279,324` — ekran okuyucu arkadaki içeriğe kaçıyor.
100. **[P2] Explore sekme grubu semantik değil.** `explore.tsx:111` tek tek `accessibilityRole="tab"` veriyor ama sarmalayıcıda `accessibilityRole="tablist"` yok — "3 sekmeden 1." bildirimi çıkmıyor.

---

## Önce şunlar

Yüzü de yapmak gerekmiyor. Sıra:

1. **#41, #42, #30** — arka plan sesi uygulamasının çalışması için gereken üç şey (kilit ekranı kontrolü, kalıcı zamanlayıcı, mixer için global kontrol).
2. **#9, #10, #21** — kontrast ihlalleri ve Settings'in yanlış fontla render olması. Üçü de tek satırlık düzeltmeler, üçü de görünür.
3. **#65, #75** — placeholder görseller ve dil kopukluğu. Yayın engelleyici.
4. **#1** — kimlik kararı. Bunu vermeden #2, #18, #20 anlamsız.
5. **#44, #85** — hareket sisteminin temeli: `reduceMotion` mantığını düzelt, basma ölçeğini tek yerden ver.
