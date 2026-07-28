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

8. **[P1] Üç farklı play düğmesi dili.** Player: kadran (216px daire). Mixer:
   `borderRadius: 36` dolu daire, 72px. MiniPlayer: `Radius.card` (10) yuvarlak
   kare, 36px. Aynı eylem, üç ayrı şekil.

9. **[P2] İki farklı modal deseni.** TimerModal ortalanmış diyalog
   (`maxWidth: 320`), Mixer'ın kaydet/yeniden adlandır diyaloğu alt sayfa. Aynı
   uygulamada iki modal grameri.

10. **[P2] Kart kenarlık dili tutarsız.** Home intent kartlarında `borderWidth: 1`
    + `Radius.card`; Explore/Settings satırlarında sadece `borderBottomWidth:
    hairline`, kutu yok. İkisine de "kart" deniyor.

11. **[P2] `withAlpha(color, 0.16)` dört yerde elle tekrarlanıyor** (PresetCard,
    mixer picker, mixer channel, index intentIconTag). Token'a çıkar:
    `Alpha.badge = 0.16` — madde 2'nin düzeltmesi de tek yerden yapılabilir.

12. **[P2] Derinlik/gölge dili yok.** Slider thumb'ında `elevation: 3` + shadow
    var (`Slider.tsx:217-226`), başka hiçbir yerde gölge yok. Ya sistemli bir
    yükseklik ölçeği ekle ya bu tekil gölgeyi kaldır.

13. **[P2] `AccessibilitySize.minTouchTarget` (48) hem dokunma hedefi hem düzen
    ölçüsü olarak kullanılıyor** (ör. `favoriteFilter` genişliği, `languageButton`
    yüksekliği). Anlamsal olarak ayrı iki şey; düzen ölçüsü değişince
    erişilebilirlik tabanı da kayar.

14. **[P3] `Spacing` skalası 7 adım (4/8/16/24/32/48/64) ama 12 ve 20 elle
    yazılıyor** (`content.paddingBottom: 20` üç ekranda). Ya token ekle ya en
    yakın adıma yuvarla.

15. **[P3] `CategoryColors` yorumu güncel değil.** "Her palette 3:1 geçer" diyor
    ama renk artık kendi rozetinin üstünde kullanılıyor — kural değişti, doküman
    değişmedi. Madde 2'nin kök nedeni budur.

---

## B. Home (16–26)

16. **[P1] Dört intent kartı birebir aynı boy ve yapıda.** Craft-floor'un "aynı
    boy kart dizisi sayfa yapısı olarak" uyarısı. Öneri: ilk kart (ya da günün
    saatine göre önerilen) ~1.4× yüksek olsun, alt satırında o intent'in ilk
    preset'inin adı görünsün.

17. **[P1] Gece uygulaması ama saat farkındalığı yok.** 23:00'te açılan Home ile
    09:00'da açılan aynı. Öneri: gece saatlerinde Sleep başa gelsin/vurgulansın,
    "Bu gece" mikro-başlığı.

18. **[P2] "Recently Played" katlamanın altında kalıyor.** Dört kart + başlık onu
    aşağı itiyor; ilk kullanıcıda zaten boş olduğu için bu bölümün varlığı hiç
    öğrenilmiyor.

19. **[P2] Wordmark ("NeuroSound") sadece Home'da.** Explore/Mixer/Settings'te yok.
    Ya kaldır ya sistemli hale getir.

20. **[P2] Katalog kodları (ND-01…04) tamamen kozmetik.** Hiçbir bilgi taşımıyor.
    Öneri: kodu preset sayısıyla eşle (`ND-01 · 6 ses`) — katalog dili korunur,
    bilgi kazanır.

21. **[P2] Intent kartında süre yok.** `recommendedMinutes` veride var (30/45/20/15)
    ama Home'da görünmüyor; kullanıcı Intent ekranına girmeden "30 dk" bilgisini
    alamıyor.

22. **[P2] Aynı ekranda iki farklı preset gösterimi.** Favoriler `PresetCard`
    (liste satırı), Recently Played `PresetCardSmall` (chip).

23. **[P3] Kulaklık notu sayfanın dibinde, ortalanmış, warning renginde** — hiçbir
    eyleme bağlı değil, her zaman orada. Öneri: sadece binaural bir preset
    görünürken göster.

24. **[P3] Intent kartlarında basılı tutma önizlemesi yok.** Long-press → o
    intent'in önerilen sesini 3 sn çal.

25. **[P3] Çalan preset Home'da işaretlenmiyor.** Favoriler/Recently listesinde
    çalan öğe için küçük bir ekolayzer animasyonu.

26. **[P3] Kartların giriş animasyonu yok.** 40ms aralıklı stagger, ekranın ana
    kararını daha okunur yapar.

---

## C. Explore (27–40)

27. **[P0 — ÇÖZÜLDÜ] Kategori sekmeleri taşma riski taşıyor.** `tabsContainer` sabit
    `flexDirection: row` + `gap: Spacing.lg`, kaydırma yok (`explore.tsx:339-344`).
    Mevcut ekran görüntüsünde "Ambient Sounds" sağ kenara *değiyor*. Türkçe'de
    ("Binaural Vuruşlar / Solfeggio / Ortam Sesleri") ve büyük sistem yazı
    boyutunda kesin taşar. `ScrollView horizontal` yap.

28. **[P1] Aktif sekme alt çizgisi ekran kenarına dayanıyor.** Sağ padding yok.

29. **[P1] Arama kutusunda web'de tarayıcı odak halkası sızıyor** — odaklanınca
    metnin etrafında açık renkli bir dikdörtgen beliriyor. Native'de görünmez,
    web hedefinde kırık duruyor.

30. **[P1 — ÇÖZÜLDÜ] Mono Hz'de çift boşluk etkisi.** Kural `Typography.numeral`
    olarak tokenlandı: mono **yalnızca sayıya** uygulanıyor, birim ve çevresindeki
    kelimeler Nunito'da kalıyor. Aynı denetimde redesign'ın kendi soktuğu bir hata
    da çıktı: Player'daki "Volume capped at 80%" **cümlesinin tamamı** monospace'ti. "Binaural Beats · 2␣␣Hz" — monospace
    boşluk karakteri geniş olduğu için sayı ile "Hz" arasında fazladan boşluk
    okunuyor. Sadece sayıyı mono yap, "Hz"i normal fontta bırak.

31. **[P1] Sonuç sayısı yok.** 33 preset, arama + favori filtresi var ama
    "5 sonuç" bilgisi hiçbir yerde yok.

32. **[P2] Favori filtresi çıplak ikon** (`explore.tsx:387`). Arama kutusunun
    yanında ama onun gibi bir zemini yok — aynı satırdaki iki kontrol iki farklı
    dilde.

33. **[P2] Kategori açıklaması body boyutunda 3-4 satır** ve listeyi aşağı itiyor.
    `footnote`'a indir.

34. **[P2] Preset satırlarında açılım göstergesi (chevron) yok.** Tıklanabilirlik
    sadece ikondan sezilmeye çalışılıyor.

35. **[P2] Favori kalbi 16px, satırın en sağında** — tarama sırasında kaçıyor.

36. **[P2] Frekans bandı görsel ölçek olarak sunulmuyor.** Delta→Gamma doğal bir
    spektrum; mini bir bant göstergesi (0.5 Hz ——●—— 100 Hz) kategoriyi öğretir.

37. **[P3] Sekmeler kategori rengini kullanmıyor.** `CategoryColors` var, sekme
    alt çizgisi hep `accent`. Her sekmenin kendi ince renk şeridi kart-katalog
    dilini pekiştirir.

38. **[P3] Arama sonuçlarında eşleşen metin vurgulanmıyor.**

39. **[P3] Sıralama seçeneği yok** (frekansa göre / alfabetik / en çok çalınan).

40. **[P3] Boş sonuç durumu tek satır metin.** "Filtreyi temizle" gibi bir çıkış
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

45. **[P1] Zamanlayıcı geri sayımı kadranda görünmüyor.** Uykuya dalan kullanıcının
    en çok merak ettiği bilgi; şu an sadece alttaki küçük rozette.

46. **[P2] Kadranın tıklanabilirliği zayıf işaretli.** Altındaki 13px "Play"
    etiketi dışında affordance yok.

47. **[P2 — ÇÖZÜLDÜ] Gece temasında minör tikler kaybolacak.** `withAlpha(color, 0.28)`,
    1.5px genişlik, `#050403` zemin — OLED'de neredeyse görünmez.

48. **[P2] Alt kontrol satırı seyrek.** Zamanlayıcı ve mixer ikonları
    `gap: Spacing.xxl` ile ortada; eskiden aralarında play butonu vardı, şimdi
    boşluk var.

49. **[P2] Ses yüzdesi hiç yazmıyor.** `showValue={false}` (`player:299`).
    "Volume capped at 80%" yazıyor ama mevcut seviye yazmıyor.

50. **[P2] Kategori noktası 6px.** `CategoryColors` bu ekranda sadece burada
    görünüyor ve çok küçük.

51. **[P2] Favori kalbi başlıkta 22px, Explore'da 16px** — aynı anlam, iki boy.

52. **[P3] Preset açıklaması tek satır, bağlamsız.** Binaural'in nasıl çalıştığı
    Explore'da anlatılıyor, kullanıcının onu dinlediği yerde değil.

53. **[P3] Kadran çevresinde zamanlayıcı ilerleme yayı** — kalan süreyi kadranın
    kenarına çiz.

54. **[P3] Kadran detent'lerinde haptik tık** (ses ayarlanırken her %10'da).

55. **[P3] Preset geçişinde çapraz geçiş (crossfade) yok** — sert kesme.

56. **[P3] Yatay mod desteklenmiyor.** Uyku uygulaması yan yatan telefonda
    kullanılır; kadran yatayda doğal olarak sola, bilgi sağa gidebilir.

---

## E. Mixer (57–70)

57. **[P1] Boş durumda dev bir boşluk var.** "Add Sound" ile play butonu arasında
    ~120px hiçlik, sonra devre dışı play + Save Preset. Ekranın alt yarısı ölü.

58. **[P1] Devre dışı play butonu gri dolu daire** — devre dışı olduğu anlaşılıyor,
    *neden* olduğu anlaşılmıyor.

59. **[P1] Boş durum jenerik SaaS kalıbı** (daire-içinde-ikon + başlık + alt metin
    + link). Plak/kadran dünyasına hiç bağlanmıyor. Öneri: 4 boş kanal yuvası
    çiz, "her yuvaya bir ses" desin — hem boşluğu doldurur hem mikseri öğretir.

60. **[P1] 4 kanal = 4 tam genişlik slider,** görsel olarak çok tekrarlı. Kanalları
    yan yana dikey fader şeridi olarak dizmek gerçek mikser dilidir.

61. **[P2] Sil ve yeniden adlandır ikonları aynı boy, aynı renk.** Yıkıcı eylem
    ayrışmıyor.

62. **[P2] Stil adı yanlış:** yeniden adlandırma butonu `styles.deleteButton`
    kullanıyor (`mixer.tsx:438`). Kozmetik değil, bakım tuzağı.

63. **[P2] "0/4" sayacı caption boyutunda, çok silik.** Mono + bir adım büyük olsa
    gerçek bir sayaç gibi okunur.

64. **[P2] Kaydedilmiş karışım satırında kanal ikonları yok** — hangi seslerden
    oluştuğu görünmüyor, sadece "3 sounds".

65. **[P2] Yüklü karışım göstergesi sadece renk + "Loaded" metni.** Katalog
    dilinde bir "çalıyor" damgası daha güçlü olur.

66. **[P2] Ses seçici tam ekran modal, kaydetme alt sayfa** — aynı ekranda iki
    modal boyu.

67. **[P3] Kanal sırası değiştirilemiyor.**

68. **[P3] Master (genel) ses seviyesi yok** — her kanal ayrı, toplu kontrol yok.

69. **[P3] Karışıma isim önerisi yok.** "Rain + Brown + Alpha" otomatik önerilebilir.

70. **[P3] Kaydedilmiş karışımların katalog kodu yok** (ND-M01 gibi) — Home'daki
    dille bağ kurulabilir.

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

90. **[P0] Tab etiketleri sistem fontunda** (madde 1 — bu bölüme de ait, çünkü
    global chrome'un tamamını etkiliyor).

91. **[P1] MiniPlayer'ın play butonu yuvarlak kare, diğer iki play daire**
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

Kalanlar için sıra önerisi:

## Önce şunlar

1. **#8** — üç farklı play düğmesi şekli (kadran / dolu daire / yuvarlak kare).
   Kadran artık yerine oturduğuna göre sıradaki en görünür tutarsızlık bu.
2. **#57/#59/#60** — Mixer boş durumu ve 4 tekrarlı slider; ekranın alt yarısı
   hâlâ ölü ve boş durum jenerik SaaS kalıbında.
3. **#16/#17** — Home'un dört özdeş kartı ve saat farkındalığının yokluğu.
