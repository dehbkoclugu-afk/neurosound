# Görsel İyileştirme Önerileri — "Night Deck" sonrası

100 madde, 10 başlık altında, P0–P3 öncelikli, dosya:satır referanslı. Bu inceleme
redesign *sonrasındaki* durumu ele alıyor; ilk 100 maddelik denetim
`DESIGN-REVIEW.md`'de, tasarım kararlarının kaydı `DESIGN.md`'de.

Öncelikler: **P0** ölçülmüş hata / kırık davranış · **P1** kullanıcının fark
edeceği net tutarsızlık · **P2** cila · **P3** fırsat.

---

## A. Sistem tutarlılığı — token kayması (1–15)

1. **[P0 — ÇÖZÜLDÜ] Tab bar etiketleri Nunito değil, sistem fontunda.** `app/(tabs)/_layout.tsx:48`
   ham `fontWeight: '600'` kullanıyor, `fontFamily` yok. Kod tabanı bu hatayı iki
   ayrı yerde belgeliyor (`settings.tsx:410`, `Button.tsx:87`): React Native
   yüklenmiş Nunito Sans için ağırlık sentezlemez, sessizce sistem fontuna düşer.
   Ekranın her yerinde sürekli duran 4 etiket yanlış fontta render oluyor.

2. **[P0 — ÇÖZÜLDÜ] Kategori/intent renkleri iki ayrı eşiği birden kaçırıyordu.**
   Solfeggio ikonu kendi %16 alfalı rozetinin üstünde **2.88:1** (grafik için
   gereken 3:1'in altında); daha kötüsü, Home'daki katalog kodu (`ND-01`)
   intent rengini **11px metin** olarak kullanıyordu, yani 3:1 değil 4.5:1
   gerekiyordu — ve 20 yüzey/tema kombinasyonunun **16'sında** kalıyordu
   (en kötü 3.42:1).

   *Not: bu maddenin ilk halinde "rozet alfasını 0.16→0.22 çıkar" yazıyordu;
   ölçüm bunun tersini gösterdi — alfayı artırmak rozeti ikonun rengine
   yaklaştırıp kontrastı düşürüyor.* Gerçek kök neden mimariydi: her renk
   paletle değişirken kategori/intent renkleri tek sabitti ve `#F7F2E7` ile
   `#050403` arasında değişen beş yüzeye tek ton yetmiyordu. Renkler palete
   taşındı (açık/koyu iki çözülmüş set), rozet alfası 0.16'da kaldı, ve
   `constants/__tests__/contrast.test.ts` her iki eşiği de sabitledi.

3. **[P1 — ÇÖZÜLDÜ] `Radius` token'ı var ama atlanıyordu.** Denetleyince 20 ham
   değerin çoğunun aslında `boyut/2` daire olduğu görüldü — bunlar kayma değil,
   doğru kullanım (bir dairenin yarıçapı token'lanmaz). Gerçek kaymalar hap
   butonlar (26/20) ve arama kutularıydı (12); hepsi `Radius.pill` / `Radius.card`
   oldu. Kalan ham değerler yalnızca daireler ve 1px tik yuvarlamaları.

4. **[P1 — ÇÖZÜLDÜ] `Radius` skalasında "pill" yok.** Onboarding ve Intent'in birincil
   butonları 26px hap; token'da karşılığı olmadığı için ikisi de elle yazılmış.
   Ya `Radius.pill` ekle ya bu butonları `Radius.card`'a indir.

5. **[P1 — ÇÖZÜLDÜ] Bölüm başlıkları iki farklı sistemde.** Settings artık aynı
   `CategoryHeader` bileşenini kullanıyor — stilleri eşlemek yerine bileşeni
   paylaşarak, ki tek uygulama kalsın. `CategoryHeader` yeni
   `Typography.label` (11px, tracked, uppercase) kullanıyor; `settings.tsx:419`
   `sectionTitle` hâlâ `Typography.title` (22px). Home/Mixer'da "RECENTLY PLAYED",
   Settings'te "Appearance" — aynı hiyerarşi seviyesi, iki farklı görünüm.

6. **[P1 — ÇÖZÜLDÜ] Tape-counter mono kuralı MiniPlayer'da uygulanmamış.** `MiniPlayer.tsx:185`
   `presetType` sadece `tabular-nums` alıyor, `FontFamily.mono` almıyor. PresetCard,
   Player, Slider ve timer rozeti mono; ekranın altında sürekli duran satır değil.

7. **[P1 — ÇÖZÜLDÜ] Settings'teki versiyon numarası da mono değil.** `aboutValue`'da
   `tabular-nums` var, `FontFamily.mono` yok — "1.0.0" tam olarak tape-counter
   kuralının kapsadığı türden bir okuma.

8. **[P1 — ÇÖZÜLDÜ] Üç farklı play düğmesi dili.** Mixer ve MiniPlayer artık
   tek bir `TransportButton` bileşenini iki boyda (72 / 36) kullanıyor: aynı
   daire, aynı ikon, aynı optik merkez düzeltmesi. Kadran ayrı kalıyor —
   o bir düğme değil, sürüklenen bir alet.

9. **[P2 — ÇÖZÜLDÜ] İki farklı modal deseni.** Yeni `components/ui/Sheet.tsx`
   tek gramer: her şey alt kenardan geliyor, tutamak + solda başlık + sağda
   kapat. Timer, kaydet/yeniden adlandır ve ses seçici üçü de bunu kullanıyor.
   `tall` varyantı kaydırılan içerik için (bkz. #66).

10. **[P2 — ÇÖZÜLDÜ] Kart kenarlık dili tutarsız.** İki sınırı tek biçime
    zorlamadım — aralarındaki fark gerçek. Kural yazıldı (DESIGN.md): **kart**
    kenarlıklı bir kutudur ve *aralarından seçtiğin* bir hedefi taşır (Home
    intent kartları); **satır** listedeki bir öğedir, tek ayıracı hairline'dır,
    kutusu yoktur. Asıl hata isimdeydi: `PresetCard` kendi başlık yorumunda
    "no cards" derken kart adını taşıyordu, `PresetRow` oldu.

11. **[P2 — ÇÖZÜLDÜ] `withAlpha(color, 0.16)` dört yerde elle tekrarlanıyor** (PresetCard,
    mixer picker, mixer channel, index intentIconTag). Token'a çıkar:
    `Alpha.badge = 0.16` — madde 2'nin düzeltmesi de tek yerden yapılabilir.

12. **[P2 — ÇÖZÜLDÜ, ama önce yanlış çözdüm.]** Önce "tek gölgeyi kaldır"
    dedim ve kaldırdım. Stylesheet'te doğru göründü, ekranda yanlıştı: %100'de
    thumb accent dolgunun üstünde kalıyor ve **barda açılmış bir delik gibi**
    okunuyordu. Ekran görüntüsünü büyütünce asıl sebep çıktı — beş paletin
    üçünde `sliderThumb` ile `accent` **birebir aynı hex**'ti; gölge yıllardır
    bir token hatasını örtüyormuş. Şimdi: `sliderThumb` her palette `text`
    değerine çekildi (kâğıt üstüne mürekkep), 2px halka boş oluğun renginde,
    ve gölge `Elevation.control` adıyla tek bir token olarak geri kondu —
    kuralı da yazılı: yüzey boyunca *parmakla sürüklenen* kontrol o yüzeyin
    üstünde durmalı, başka hiçbir şey yükseltilmez. İki ilişki teste
    sabitlendi (thumb↔boş oluk, halka↔her dolgu rengi).

13. **[P2 — ÇÖZÜLDÜ] `AccessibilitySize.minTouchTarget` hem dokunma hedefi hem
    düzen ölçüsü.** Yeni `ControlSize` (`row: 48`, `cta: 52`) düzen yükseklikleri
    için; `minTouchTarget` artık yalnızca sayının varlık sebebi parmağa yer
    açmak olan yerlerde (kare ikon butonlar, `Button`'ın min ölçüleri). Böylece
    tabanı yükseltmek uygulamanın yarısını sessizce yeniden boyutlandırmıyor ve
    `minTouchTarget + 4` gibi bir ölçek olmayan sabit üzerinde aritmetik
    kalmadı.

14. **[P3 — ÇÖZÜLDÜ] `Spacing` skalası dışında elle yazılan değerler.**
    Dört ekrandaki `content.paddingBottom: 20` zaten ölüydü — aynı
    `contentContainerStyle` dizisinde satır içi mini-player boşluğu onu
    eziyordu; silindi. Elle yazılan `minHeight: 52` ve `44` değerleri
    `ControlSize.row` ve yeni `ControlSize.field`'a bağlandı.

15. **[P3 — ÇÖZÜLDÜ] `CategoryColors` yorumu güncel değil.** "Her palette 3:1 geçer" diyor
    ama renk artık kendi rozetinin üstünde kullanılıyor — kural değişti, doküman
    değişmedi. Madde 2'nin kök nedeni budur.

---

## B. Home (16–26)

16. **[P1 — ÇÖZÜLDÜ] Dört intent kartı birebir aynı boy ve yapıda.** Saatin
    önerdiği intent artık öne çıkan bir kart: 10px sırt, `Spacing.lg` iç boşluk,
    28px ad, 40px ikon rozeti ve kendi renginde kenarlık. Kalan üçü eski kompakt
    biçimde, "OR SOMETHING ELSE" başlığının altında.

17. **[P1 — ÇÖZÜLDÜ] Gece uygulaması ama saat farkındalığı yok.** `getTimeBand()`
    saati dört kuşağa ayırıyor (22–06 gece → Sleep, 06–09 sabah → Meditate,
    09–17 gündüz → Focus, 17–22 akşam → Relax) ve kartın üstüne "TONIGHT / THIS
    MORNING / RIGHT NOW / THIS EVENING" mikro-başlığını basıyor. Kural saf bir
    fonksiyon ve `lib/__tests__/intents.test.ts`'te 24 saatin tamamı için
    sınanıyor; ekran onu mount başına bir kez okuyor (dakikalık re-render yok).

18. **[P2 — ÇÖZÜLDÜ] "Recently Played" katlamanın altında kalıyor.** Bölüm artık
    öne çıkan kart ile "OR SOMETHING ELSE" grubunun arasında, ilk ekranda
    görünür (390×844'te başlık ~450px). Üç satırla sınırlı — geri dönen bir
    kullanıcının en olası eylemi dün geceki sesi tekrar açmak, arşiv değil.
    Geçmiş yokken bölüm hiç çizilmiyor: boş bir "burada birikecek" paneli aynı
    dikey alanı yiyip hiçbir şey öğretmiyordu.

19. **[P2 — ÇÖZÜLDÜ] Wordmark ("NeuroSound") sadece Home'da.** Kaldırıldı.
    Dört sekmenin birinde duran bir marka izi sistem değil, kalıntı; katalog da
    her sayfasına yayıncısının adını basmaz. Sayfa ~40px yukarı kaydı, bu da
    #18'e ek olarak yaradı.

20. **[P2 — ÇÖZÜLDÜ] Katalog kodları (ND-01…04) tamamen kozmetik.** Artık
    `ND-01 · 6 SOUNDS`: kod işaret ettiği şeyin boyunu da söylüyor. Kod mono
    yüzünü koruyor, çevresindeki kelimeler Nunito'da kalıyor (iç içe `Text`) —
    mono boşluk glifinin açtığı çift boşluk tuzağına düşmemek için.

21. **[P2 — KISMEN ÇÖZÜLDÜ] Intent kartında süre yok.** Öne çıkan kartta artık
    saat ikonu + mono rakamla "30 min recommended" satırı var. Kompakt üç kartta
    hâlâ yok — dört kartın hepsine koymak öne çıkanın farkını siliyordu.

22. **[P2 — ÇÖZÜLDÜ] Aynı ekranda iki farklı preset gösterimi.** Home'un iki
    listesi de `PresetCard` satırı. `PresetCardSmall` başka hiçbir yerde
    kullanılmıyordu, silindi (`getFrequencyOnly` ve chip stilleriyle birlikte).

23. **[P3 — ÇÖZÜLDÜ] Kulaklık notu sayfanın dibinde, ortalanmış, warning
    renginde.** Artık yalnızca ekranda gerçekten binaural bir preset varken
    çiziliyor (geçmiş ya da görünen favoriler listesinde). Her ziyarette orada
    duran bir uyarı, uyarı okumamayı öğretmenin en hızlı yolu; üstelik ilk
    binaural çalışta zaten bir diyalog çıkıyor. Tarayıcıda üç durumda
    doğrulandı: geçmişsiz → yok, yalnız gürültü geçmişi → yok, binaural
    geçmişi → var.

24. **[P3 — KISMEN: bilgi evet, ses hayır.]** Öne çıkan kart artık ne
    çalacağını söylüyor: `⏱ 45 dk · Beta (14-30 Hz)`. Sesli önizlemeyi
    yapmadım, çünkü tek preset ile mikser tasarım gereği birbirini dışlıyor:
    3 saniyelik bir önizleme, seçmene yardım etmesi gereken uyku sesini
    sessizce sonlandırırdı. Ayrıca karanlıkta ani ses, bu uygulamanın kullanım
    sahnesinde tam olarak istenmeyen şey.

25. **[P3 — ÇÖZÜLDÜ] Çalan preset listede işaretlenmiyor.** Yeni
    `EqualizerBars` + `PresetRow`'un `isPlaying` prop'u: ad accent rengine
    geçiyor, sağda üç çubuk oynuyor. Home'la sınırlı kalmadı — bileşen paylaşımlı
    olduğu için Explore ve Intent ekranlarında da çalışıyor. `reduceMotion`
    açıkken çubuklar üç farklı yükseklikte duruyor (işaret bilgi, hareket
    yalnızca dikkat). Ekran okuyucu için çubuklar dekoratif, o yüzden durum
    satırın etiketine yazılıyor: tarayıcıda "Rain, Ambient Sounds, now playing"
    olarak doğrulandı.

26. **[P3] Kartların giriş animasyonu yok.** 40ms aralıklı stagger, ekranın ana
    kararını daha okunur yapar.

---

## C. Explore (27–40)

27. **[P0 — ÇÖZÜLDÜ] Kategori sekmeleri taşma riski taşıyor.** `tabsContainer` sabit
    `flexDirection: row` + `gap: Spacing.lg`, kaydırma yok (`explore.tsx:339-344`).
    Mevcut ekran görüntüsünde "Ambient Sounds" sağ kenara *değiyor*. Türkçe'de
    ("Binaural Vuruşlar / Solfeggio / Ortam Sesleri") ve büyük sistem yazı
    boyutunda kesin taşar. `ScrollView horizontal` yap.

28. **[P1 — ÇÖZÜLDÜ] Aktif sekme alt çizgisi ekran kenarına dayanıyor.** Sağ padding yok.

29. **[P1 — ÇÖZÜLDÜ] Arama kutusunda web'de tarayıcı odak halkası sızıyor** — odaklanınca
    metnin etrafında açık renkli bir dikdörtgen beliriyor. Native'de görünmez,
    web hedefinde kırık duruyor.

30. **[P1 — ÇÖZÜLDÜ] Mono Hz'de çift boşluk etkisi.** Kural `Typography.numeral`
    olarak tokenlandı: mono **yalnızca sayıya** uygulanıyor, birim ve çevresindeki
    kelimeler Nunito'da kalıyor. Aynı denetimde redesign'ın kendi soktuğu bir hata
    da çıktı: Player'daki "Volume capped at 80%" **cümlesinin tamamı** monospace'ti. "Binaural Beats · 2␣␣Hz" — monospace
    boşluk karakteri geniş olduğu için sayı ile "Hz" arasında fazladan boşluk
    okunuyor. Sadece sayıyı mono yap, "Hz"i normal fontta bırak.

31. **[P1 — ÇÖZÜLDÜ] Sonuç sayısı yok.** 33 preset, arama + favori filtresi var ama
    "5 sonuç" bilgisi hiçbir yerde yok.

32. **[P2 — ÇÖZÜLDÜ] Favori filtresi çıplak ikon** (`explore.tsx:387`). Arama kutusunun
    yanında ama onun gibi bir zemini yok — aynı satırdaki iki kontrol iki farklı
    dilde.

33. **[P2 — ÇÖZÜLDÜ] Kategori açıklaması body boyutunda 3-4 satır** ve listeyi aşağı itiyor.
    `footnote`'a indir.

34. **[P2 — ÇÖZÜLDÜ] Preset satırlarında açılım göstergesi (chevron) yok.** Tıklanabilirlik
    sadece ikondan sezilmeye çalışılıyor.

35. **[P2 — ÇÖZÜLDÜ] Favori kalbi 16px, satırın en sağında** — tarama sırasında kaçıyor.

36. **[P2 — ÇÖZÜLDÜ] Frekans bandı görsel ölçek olarak sunulmuyor.** Delta→Gamma doğal bir
    spektrum; mini bir bant göstergesi (0.5 Hz ——●—— 100 Hz) kategoriyi öğretir.

37. **[P3 — ÇÖZÜLDÜ] Sekmeler kategori rengini kullanmıyor.** `CategoryColors` var, sekme
    alt çizgisi hep `accent`. Her sekmenin kendi ince renk şeridi kart-katalog
    dilini pekiştirir.

38. **[P3 — ÇÖZÜLDÜ] Arama sonuçlarında eşleşen metin vurgulanmıyor.**

39. **[P3 — ÇÖZÜLDÜ] Sıralama seçeneği yok** (frekansa göre / alfabetik / en çok çalınan).

40. **[P3 — ÇÖZÜLDÜ] Boş sonuç durumu tek satır metin.** "Filtreyi temizle" gibi bir çıkış
    yolu yok.

---

## D. Player + Dial (41–56)

41. **[P0 — ÇÖZÜLDÜ] `Dial`'ın `isLoading` prop'u alınıyor ama hiç kullanılmıyor**
    (`Dial.tsx:40,49` — destructuring'de var, gövdede hiç geçmiyor). Player
    yükleme durumunu geçiyor, kadran görmezden geliyor → ses yüklenirken ekranda
    hiçbir işaret yok. Eski tasarımda halka sönük durup hazır olunca nefes almaya
    başlıyordu; bu affordance redesign'da kayboldu.

42. **[P1 — ÇÖZÜLDÜ] Kadran bir kadran gibi davranmıyor.** Artık sürüklenerek ses
    ayarlanıyor (dikey hareket — donanım fader'larının ve DAW knob'larının standart
    jesti; gerçek rotary takip merkeze yakın kullanışsız ve tek elle karanlıkta
    daha da kötü). Dokunma hâlâ çal/duraklat: hareket eşiği (6px) ikisini ayırıyor.
    *Slider kaldırılmadı* — bu maddede "slider'ı kaldır" demiştim ama kaldırmak
    hassasiyeti ve daha önemlisi ekran okuyucu erişimini kaybettirirdi
    (`accessibilityRole="adjustable"` zaten çal/duraklat butonu olan bir düğüme
    verilemez). Kadran ifade edici kontrol, slider hassas ve erişilebilir olan. Döndürülemiyor, ses seviyesine
    bağlı değil; altında ayrı bir yatay slider var. Kadranı sürükleyerek ses
    ayarlamak "analog enstrüman" tezini gerçek yapar, slider'ı da gereksiz kılar.

43. **[P1 — ÇÖZÜLDÜ] Kadranda ölçek/rakam yok.** Tikler artık tam çember değil,
    altta ölü bölge bırakan 270°'lik bir gain yayı boyunca diziliyor ve %0/25/50/75/100
    uzun tik alıyor — seviyeyi karşısında okuyabileceğin gerçek bir ölçek. Gerçek bir VU/gain kadranında sayı ya da
    min–max işareti olur; buradaki 28 tik tamamen dekoratif.

44. **[P1 — ÇÖZÜLDÜ] İbre ses seviyesini değil sabit bir salınımı gösteriyor.**
    İbre artık mevcut sesi gösteriyor; çalarken o seviyenin etrafında hafifçe
    titriyor (gerçek bir VU ibresi gibi), sabit bir döngüde gidip gelmiyor. `SWEEP_MIN/MAX`
    sabit; `volume` bilgisi Dial'a hiç gitmiyor. (Eski `WaveVisualizer`
    `intensity={volume}` alıyordu — bu bağ koptu.)

45. **[P1 — ÇÖZÜLDÜ] Zamanlayıcı geri sayımı kadranda görünmüyor.** Uykuya dalan kullanıcının
    en çok merak ettiği bilgi; şu an sadece alttaki küçük rozette.

46. **[P2 — ÇÖZÜLDÜ] Kadranın tıklanabilirliği zayıf işaretli.** Altındaki 13px "Play"
    etiketi dışında affordance yok.

47. **[P2 — ÇÖZÜLDÜ] Gece temasında minör tikler kaybolacak.** `withAlpha(color, 0.28)`,
    1.5px genişlik, `#050403` zemin — OLED'de neredeyse görünmez.

48. **[P2 — ÇÖZÜLDÜ] Alt kontrol satırı seyrek.** Zamanlayıcı ve mixer ikonları
    `gap: Spacing.xxl` ile ortada; eskiden aralarında play butonu vardı, şimdi
    boşluk var.

49. **[P2 — ÇÖZÜLDÜ] Ses yüzdesi hiç yazmıyor.** `showValue={false}` (`player:299`).
    "Volume capped at 80%" yazıyor ama mevcut seviye yazmıyor.

50. **[P2 — ÇÖZÜLDÜ] Kategori noktası 6px.** `CategoryColors` bu ekranda sadece burada
    görünüyor ve çok küçük.

51. **[P2 — ÇÖZÜLDÜ] Favori kalbi başlıkta 22px, Explore'da 16px** — aynı anlam, iki boy.

52. **[P3 — ÇÖZÜLDÜ] Preset açıklaması tek satır, bağlamsız.** Binaural'in nasıl çalıştığı
    Explore'da anlatılıyor, kullanıcının onu dinlediği yerde değil.

53. **[P3 — ÇÖZÜLDÜ] Kadran çevresinde zamanlayıcı ilerleme yayı** — kalan süreyi kadranın
    kenarına çiz.

54. **[P3 — ÇÖZÜLDÜ] Kadran detent'lerinde haptik tık** (ses ayarlanırken her %10'da).

55. **[P3 — ÇÖZÜLDÜ] Preset geçişinde çapraz geçiş (crossfade) yok** — sert kesme.

56. **[P3 — YAPILMADI, gerekçeli] Yatay mod desteklenmiyor.** Uyku uygulaması yan yatan telefonda
    kullanılır; kadran yatayda doğal olarak sola, bilgi sağa gidebilir.

---

## E. Mixer (57–70)

57. **[P1 — ÇÖZÜLDÜ] Boş durumda dev bir boşluk var.** Boş durum artık dört
    hayalet kanal şeridi; alt yarı doluyor, transport 844px'lik ekranda görünür
    kalıyor.

58. **[P1 — ÇÖZÜLDÜ] Devre dışı play butonu gri dolu daire.** Kanal yokken
    transport'un altında "Add a sound to play or save this mix." satırı var;
    aynı metin hem play düğmesinin hem Save Preset'in `accessibilityHint`'i —
    ekran okuyucu daha önce hiçbir gerekçe almıyordu.

59. **[P1 — ÇÖZÜLDÜ] Boş durum jenerik SaaS kalıbı.** Daire-içinde-ikon +
    başlık + link kalıbı kalktı; yerine kapasiteyi biçimle söyleyen dört yuva
    (kesikli rozet, ad, boş oluk) geldi. İlk yuva "Add Sound", kalanı "Empty
    channel" ve giderek soluyor. Hayalet oluk canlı slider'ın 48pt dokunma
    hedefinden bilinçli olarak ince: tam boyda dört yuva transport'u ilk
    ekranın dışına itiyordu.

60. **[P1 — ÇÖZÜLDÜ, farklı çözümle] 4 kanal = 4 tam genişlik slider.** Dikey
    fader şeridi önerisini uygulamadım: karanlıkta tek elle kullanılan bir
    uygulamada ince dikey fader'lar dokunma doğruluğunu düşürüyor. Bunun yerine
    `Slider`'a `fillColor` eklendi ve her kanal kendi kategori rengini taşıyor —
    üst üste dizili kanallar tek kontrolün tekrarı gibi değil, üç ayrı ses gibi
    okunuyor.

61. **[P2 — ÇÖZÜLDÜ] Sil ve yeniden adlandır ikonları aynı boy, aynı renk.**
    Sil artık `colors.error` taşıyor, yeniden adlandır grinin içinde kalıyor.
    Renk beş paletin ikisinde de yüzeyde ölçüldü (en düşük 4.65:1, ikonun
    ihtiyacı olan 3:1'in epey üstünde) ve `contrast.test.ts`'e sabitlendi.

62. **[P2 — ÇÖZÜLDÜ] Stil adı yanlış.** İki buton da `styles.mixAction`
    kullanıyor; `deleteButton` adı kalktı.

63. **[P2 — ÇÖZÜLDÜ] "0/4" sayacı caption boyutunda, çok silik.**
    `CategoryHeader`'a `counter` prop'u eklendi: sağa hizalı, teyp sayacı
    yüzünde, footnote boyunda. `subtitle` düz metin için kaldı.

64. **[P2 — ÇÖZÜLDÜ] Kaydedilmiş karışım satırında kanal ikonları yok.**
    "3 sounds" kaçını söylüyordu, hangilerini değil. Yerine kanalların
    kategori rozetleri geliyor — kanal satırlarının kullandığı alfabenin
    aynısı. Çözülmeyen preset id'leri boş rozet olarak çizilmiyor, atılıyor.

65. **[P2 — ÇÖZÜLDÜ] Yüklü karışım göstergesi sadece renk + "Loaded" metni.**
    Adın yanında kenarlıklı bir "LOADED" damgası var artık; caption grisinde
    bir satır daha değil.

66. **[P2 — ÇÖZÜLDÜ] Ses seçici tam ekran modal, kaydetme alt sayfa.** Seçici
    artık `Sheet tall` (%85 yükseklik): 33 öğe için gereken boy var ama arkada
    mikser görünmeye devam ediyor, yani sesi mikserden *çıkarak* değil ona
    *uzanarak* seçiyorsun. Sayfa kapanırken arama metni de temizleniyor.

67. **[P3 — YAPILMADI, gerekçeli]** Kanal sırası değiştirilemiyor. Gerçek bir
    mikserde sıra sinyal akışını anlatır; burada kanallar paralel ve sıranın
    duyulabilir hiçbir etkisi yok. Dört satır için sürükle-bırak (ya da satır
    başına iki ok daha) tamamen kozmetik bir sıralama uğruna zaten kalabalık
    olan satıra kontrol eklemek olurdu. Kullanıcı isterse kanalı silip yeniden
    ekleyebiliyor. Bu maddeyi kapatmıyorum, reddediyorum — isteyen açar.

68. **[P3 — ÇÖZÜLDÜ] Master (genel) ses seviyesi yok.** Kanal listesinin altında,
    aralarına çizilen bir hairline ile ayrılmış tek fader. Kanal seviyelerini
    yeniden yazmıyor, hepsini birlikte ölçekliyor — dengeyi kullanıcı kurdu,
    sesi kısmak ona mal olmamalı. Kazanç zinciri tek noktada:
    `kanal × master × maxVolume` (`channelVolume`). Tarayıcıda ölçüldü: master
    %100 → %30 sürüklendi, iki kanal sliderı yerinde kaldı. Ayarın kendisi
    kalıcı (bir oturum durumu değil).

69. **[P3 — ÇÖZÜLDÜ] Karışıma isim önerisi yok.** Kaydet sayfası artık
    "Ocean Waves + Alpha (8-14 Hz)" ile açılıyor (40 karakterde kesiliyor;
    daha uzunu satırı kalıcı olarak kırpık bırakıyor). Dayatma değil öneri:
    `selectTextOnFocus` ile yazmaya başlayınca siliniyor.

70. **[P3 — ÇÖZÜLDÜ] Kaydedilmiş karışımların katalog kodu yok.** `ND-M01`
    damgası kanal rozetlerinin soluna geldi. Numara liste konumundan değil,
    oluşturma anında verilen ve tekrar kullanılmayan `catalogNumber`'dan
    geliyor — konumdan türetseydim silinen bir karışımın altındakiler yeniden
    numaralanırdı, yani #20'de şikâyet edilen "kimlik kılığındaki satır
    numarası" olurdu. Alan opsiyonel: eski kayıtlar için konuma düşülüyor,
    bir damga uğruna migration yazmaya değmez.

---

## F. Settings (71–78)

71. **[P1] Bölüm başlıkları uygulamanın geri kalanıyla uyumsuz** (bkz. madde 5).

72. **[P1] "Reset data" satırı normal satır gibi görünüyor,** sadece metin rengi
    `error`. Yıkıcı eylem için ikon + ayrı bölüm ya da kenarlık gerekir.

73. **[P2] Epilepsi uyarısı iki switch arasında serbest yüzüyor** — kendi
    zemini/kenarlığı yok, hangi ayara ait olduğu görsel olarak belirsiz (koda
    göre Reduce Motion'a ait).

74. **[P2] Tema seçenekleri 4 hap buton, `flexWrap` ile sarmalanıyor.** Türkçe'de
    ("Açık/Koyu/Gece/Otomatik") iki satıra düşme riski var.

75. **[P2] Tema seçenekleri sadece metin** — hiçbir renk önizlemesi yok. Her
    butonda küçük bir palet noktası seçimi anında anlaşılır kılar.

76. **[P2] Maksimum ses sınırının ne yaptığı görsel değil.** Player'daki slider'ın
    üstünde bir "tavan" işareti bu bağı kurar.

77. **[P3] Dil seçimi "Türkçe/English"** — yeterli, ama katalog dilinde bir kod
    (TR/EN) Home'daki ND-01 mantığıyla daha tutarlı olurdu.

78. **[P3] Ayar değişikliklerinde görsel onay yok** (tema hariç, o zaten görünür).
    Haptik var, görsel yok.

---

## G. Onboarding (79–84)

79. **[P1] Birincil buton 26px hap,** uygulamanın geri kalanı 10px. Kullanıcının
    gördüğü ilk ekran, sistemin dışında.

80. **[P2] Geri butonu yok** — sadece Skip ve Next; 2. adımdan 1'e dönülemiyor.

81. **[P2] İçerik dikeyde ortalanmış, üstte ve altta çok büyük boşluk.** 40px ikon
    + başlık + iki satır — ekranın ~%60'ı boş.

82. **[P2] Adım ikonu tek başına dekoratif,** kadran kimliğiyle bağı yok. Öneri:
    her adımda kadranın farklı bir açısı.

83. **[P3] Dil seçimi "TR / EN" sol üstte, çok silik** — ilk kullanıcının en
    kritik kararı.

84. **[P3] Adım geçişinde yatay kaydırma jesti yok** — nokta göstergesi kaydırma
    vaat ediyor ama sadece buton çalışıyor.

---

## H. Intent (85–89)

85. **[P1] Fotoğraf kullanan tek ekran burası.** Home artık düz kart, burada 260px
    fotoğraf kahraman. Bilinçli bir karardı (`DESIGN.md`'de yazılı) ama uygulamada
    kopukluk yaratıyor — ya Home'a bir fotoğraf izi dönmeli ya buradaki azalmalı.

86. **[P1] Başlat butonu 26px hap** (bkz. madde 4).

87. **[P2] Geri butonunun fotoğraf üzerinde zemini yok** — açık bir fotoğraf
    bölgesinde beyaz ok kaybolur.

88. **[P2] Kahraman metni sabit beyaz** (`#FFFFFF`, `intent:210`) — token dışı.

89. **[P3] "30 dk seans başlat" ne çalacağını söylemiyor.** İlk preset'in adı
    butonun altında yazabilir.

---

## I. MiniPlayer / tab bar / global chrome (90–96)

90. **[P0 — ÇÖZÜLDÜ] Tab etiketleri sistem fontunda** (madde 1 — bu bölüme de ait, çünkü
    global chrome'un tamamını etkiliyor).

91. **[P1 — ÇÖZÜLDÜ, madde 8 ile] MiniPlayer'ın play butonu yuvarlak kare**
    (bkz. madde 8).

92. **[P1] MiniPlayer'da zamanlayıcı/ilerleme izi yok.** Zamanlayıcı çalışırken
    alt şeritte hiçbir işaret yok; kullanıcı Player'ı açmadan kalan süreyi
    göremiyor.

93. **[P2] Kapatma (X) ile duraklat aynı görsel ağırlıkta.** X oturumu bitiriyor
    (yıkıcı), play sadece duraklatıyor; ikisi de 36×36.

94. **[P2] MiniPlayer'ın stop butonunun zemini yok, play'in var** — yan yana duran
    iki kontrol asimetrik.

95. **[P2] Tab bar yüksekliği `MINI_PLAYER_HEIGHT` sabitinden türetiliyor**
    (`_layout.tsx:42`). Anlamsal olarak ilgisiz iki ölçü tek sabite bağlı; biri
    değişince diğeri sessizce bozulur.

96. **[P3] Toast her zaman aynı görünümde** — başarı/hata/bilgi ayrımı yok.

---

## J. Kimlik ve fırsatlar (97–100)

97. **[P2] Uygulama ikonu ile uygulama içi kadran aynı çizim değil.** İkon 24 tik,
    uygulama 28 tik kullanıyor. Neredeyse aynı ama tam değil — tek bir kaynaktan
    üretilmeli (ortak bir geometri sabiti).

98. **[P3] Kilit ekranı görseli yok.** Now-playing metadata'sında artwork alanı
    boş; kadranın o preset'in kategori renginde bir varyantı üretilebilir — kimlik
    uygulamanın dışına taşar.

99. **[P3] Ana ekran widget'ı yok.** "Dün gece 6s 20dk · Delta" gibi bir
    tape-counter widget'ı katalog dilini doğal biçimde genişletir.

100. **[P3] Oturum geçmişi / sayaç yok.** Uygulama ne kadar kullanıldığını hiç
     göstermiyor; katalog/teyp dilinde "çalma sayacı" zaten hazır bir metafor.

---

## D bölümü notu (Player + Dial)

- **#45/#53 birlikte çözüldü.** Geri sayım artık kadranın *içinde*, teyp
  sayacı yüzünde 20px; yanında yüzün iç kenarına çizilen 25 tikli tükenen bir
  halka var. İki ölçek çakışmıyor: kazanç tikleri yüzün *dışında*, zamanlayıcı
  tikleri *içinde*, ama aynı 270°'lik yayı paylaşıyorlar.
- **#55 (crossfade)** gerçek bir ses değişikliği. `loadPreset` giden
  generator'ı sert kesmek yerine kendi zamanlayıcısıyla söndürüyor; gelen
  zaten `FADE_IN_MS` ile açılıyor, yani geçiş bir crossfade oluyor. Bunun
  güvenli olmasının tek sebebi `getBinauralPlayer()` ve kardeşlerinin her
  çağrıda yeni örnek döndürmesi — singleton olsalardı giden'i emekliye
  ayırmak geleni 250ms sonra susturacaktı. Kodda not düşüldü.
- **#56 (yatay mod) yapılmadı, gerekçesi `app.json`'a yazıldı:** uyku
  uygulaması yatarak kullanılıyor, ivmeölçer her dönüşte ekranı çeviriyor;
  kadran ve transport tek elle dik tutulan telefona göre yerleşmiş. Yatay
  destek, önemli olan tek ekran için ikinci bir düzen gerektirir ve yine de
  kimse kıpırdamadan dururken dönerdi.

## C bölümü notu (Explore)

Explore turunda listede olmayan **iki gerçek hata** çıktı, ikisi de yalnızca
tarayıcıda görünüyordu:

- Arama kutusundaki temizle (×) düğmesi hiç görünmüyordu. Sebep DOM'a bakınca
  çıktı: `TextInput`'in `flex: 1` var ama `minWidth: 0` yok, web'de flex
  öğesinin varsayılan min genişliği içeriği kadardır, yani girdi kendi
  yuvarlak kutusunu ~13px taşırıp düğmeyi sıralama butonunun altına itiyordu.
  Aynı hata Mixer'ın seçici arama kutusunda da vardı; ikisi de düzeltildi.
- Aynı taşma, kutunun kenarlığının da yanlış yerde bitmesine yol açıyordu.

## Durum

**P0'ların tamamı düzeltildi** (#1/#90, #2, #27, #41), ardından **token kayması
(#3–#7)** ve **kadran davranışı (#42/#43/#44)**. Yol boyunca listede olmayan üç
hata daha çıktı ve düzeltildi:

- `lowContrastLight.textSecondary` ikincil yüzeyde 4.15:1'di (yorumu "AA on both
  surface levels" diyordu ama ikinci yüzey hiç ölçülmemişti) → 4.74:1. Kontrast
  testi yazılır yazılmaz yakaladı.
- Player'daki "Volume capped at 80%" cümlesinin **tamamı** monospace'ti — mono
  kuralını uygularken redesign'ın kendi soktuğu bir hata.
- #47 (gece temasında kaybolan minör tikler).

Ayrıca #3'ün kendisi de fazla iddialıymış: 20 ham `borderRadius` değerinin çoğu
`boyut/2` daireydi, yani kayma değil doğru kullanım.

Sonraki turda **#8** (tek `TransportButton`), **#57/#59/#60** (Mixer'ın boş
durumu ve tekrarlı slider'ları) ve **#16/#17/#21** (Home'un saat farkındalığı ve
öne çıkan kart) kapatıldı. Bu turda da listede olmayan iki şey düzeldi:
`MiniPlayer` ve `mixer` ekranlarında ölü kalan importlar, ve öne çıkan kartın
mikro-başlığı — önce katalog kodlarının mono stilini kullanıyordu, oysa "TONIGHT"
bir kod değil kelime; `Typography.label`'a alındı.

Onu izleyen turda **#58** (devre dışı transport'un gerekçesi), **#18/#22**
(Home'un tek preset gösterimi ve yukarı taşınan geçmişi) ve **#9/#66** (tek
modal grameri) kapatıldı. Yol boyunca üç şey daha temizlendi: `PresetCardSmall`
artık kullanılmıyordu, silindi; `mixer.emptyDesc`, `mixer.emptyHint` ve
`home.recentlyPlayedEmpty` anahtarları ekranda karşılıksız kalmıştı, kaldırıldı;
`Sheet`'e geçince `mixer.tsx`'te `Modal`/`Pressable`/`KeyboardAvoidingView` ve
on kadar ölü stil kaldı, onlar da gitti.

Dördüncü turda **#61/#62** (yıkıcı eylemin ayrışması ve stil adı), **#63/#64/
#65** (sayaç, karışımın içeriği, yüklü damgası) ve **#23** (koşullu kulaklık
notu) kapatıldı.

Beşinci turda **#19/#20** (wordmark ve katalog kodları), **#10/#13** (kart/satır
kuralı ve kontrol ölçüleri) ve **#68** (master fader) kapatıldı; **#67** gerekçeli
olarak reddedildi.

Altıncı turda **#25** (çalan satırın işaretlenmesi), **#12/#14** (tek yükseklik
token'ı ve elle yazılan ölçüler) ve **#69/#70** (isim önerisi, karışım katalog
kodu) kapatıldı; **#24**'ün yalnız bilgi tarafı yapıldı. Bu tur asıl kazancı
gözle bakmak verdi: #12'yi ilk denemede yanlış çözdüm ve ekran görüntüsünü
büyütmek beş paletin üçünde duran gerçek bir token hatasını ortaya çıkardı.

Kalanlar için sıra önerisi:

## Önce şunlar

1. **#26** — kartların/satırların giriş animasyonu yok; 40ms aralıklı bir
   stagger ekranın ana kararını daha okunur yapar.
2. **#28/#29/#31** (Explore) ve **#48–#56** (Player/Dial) — bu iki bölümde
   hâlâ dokunulmamış P2/P3'ler var; sıradaki turda toplu bakılmalı.
3. **#96–#100** — kilit ekranı görseli, widget, oturum sayacı: kimlik
   fırsatları, hiçbiri açılmadı.
