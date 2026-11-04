# App Store ret kontrol listesi — 852Hz (iOS ilk gönderim)

En sık ret nedenlerinden derlenmiş 100 madde, bu uygulamaya karşı tek tek kontrol edildi (4 Kasım 2026).

- ✅ kontrol edildi, sorun yok
- 🔧 bu turda düzeltildi
- 👤 App Store Connect'te senin yapman gereken
- ⚠️ kalan risk, nedeniyle

Metinler: `store/app-store/{en-US,tr}/metadata.md`. İnceleme notu: `store/app-store/review-notes.md`. Alan sınırları ve yasak kelimeler `lib/__tests__/app-store-content.test.ts` ile test ediliyor.

## 1. Güvenlik ve içerik (Guideline 1)

1. ✅ 1.1 Rahatsız edici içerik yok.
2. ✅ 1.2 Kullanıcı içeriği (UGC), sohbet, akış yok. Yaş anketindeki sosyal medya soruları "hayır".
3. ✅ 1.3 Çocuk kategorisi seçilmeyecek.
4. 🔧 1.4.1 Sağlık iddiası: Gamma açıklaması "Higher cognitive functions" ve 396 Hz adı "Liberation from Fear" 21 dilde nötr metinle değiştirildi ("Fast, bright rhythm", "Letting Go").
5. ✅ 1.4.1 Onboarding "tıbbi ürün değildir" diyor; her Solfeggio sesinin oynatıcı açıklaması "tıbbi fayda iddia edilmez" uyarısı.
6. ✅ 1.4.1 Mağaza metinlerinde tedavi/şifa/DNA/uykusuzluk/kaygı kelimesi yok (test ediyor).
7. ⚠️ 1.4.1 "Love Frequency", "Divine Luck", "Abundance", "Cosmic Consciousness" geleneksel Solfeggio adları olarak kaldı. Uyarı her ekranda. Reddedilirse ilk değiştirilecekler bunlar.
8. ✅ 1.4.1 İşitme uyarısı onboarding'de ("sesi rahat düzeyde tut").
9. ✅ 1.5 Geliştirici iletişimi destek sayfasında ve uygulama içi gizlilik ekranında.
10. ✅ 1.6 Veri güvenliği: veri toplanmıyor, sunucu yok.

## 2. Performans ve eksiksizlik (Guideline 2)

11. ✅ 2.1 Placeholder metin/görsel yok; "Lorem", "TODO", "test" taraması temiz.
12. ✅ 2.1 Açılışta çökme: web derlemesinde ana sayfa, Sesler, Mikser, Premium çalıştı. ⚠️ iOS cihazında henüz açılmadı; TestFlight'ta denenmeli.
13. 👤 2.1 Uygulama içi ürünler binary ile **aynı gönderimde** incelemeye eklenmeli ("Ready to Submit", inceleme ekran görüntüsüyle).
14. ✅ 2.1 Demo hesabı gerekmiyor; hesap yok. İnceleme notunda belirtildi.
15. ✅ 2.1 İnceleme notu her özelliğe nasıl ulaşılacağını anlatıyor.
16. ✅ 2.1 Ağ yokken çalışıyor; tüm ses ve görseller pakette.
17. ✅ 2.1 IPv6: ağ isteği yok, StoreKit dışında.
18. ✅ 2.2 Beta/demo/deneme ibaresi yok.
19. ✅ 2.3.1 Gizli özellik yok; açıklama gerçek özellikleri anlatıyor.
20. ✅ 2.3.1 Açıklamadaki her özellik uygulamada var (21 dil, açık/koyu tema, 4 kanallı mikser, zamanlayıcı, kilit ekranı).
21. 🔧 2.3.3 iPhone 6.9" (1320×2868) ekran görüntüleri yeni tasarımla üretildi: `store/app-store/screenshots/{en-US,tr}/` (4'er adet, `scripts/app-store-screenshots/capture.mjs`). Play görüntüleri eski tasarım ve Android çubuğu içerdiği için kullanılmadı.
22. 👤 2.3.3 Görüntüler uygulamanın kullanımını göstermeli; yalnızca logo ya da başlık ekranı olmamalı.
23. ✅ 2.3.4 Önizleme videosu zorunlu değil; eklenmeyecek.
24. ✅ 2.3.5 Kategori: Health & Fitness yerine **Music** ya da **Lifestyle** öner. Health kategorisi sağlık iddiası incelemesini sertleştirir.
25. ✅ 2.3.7 Ad 30, alt başlık 30, anahtar kelime 100 sınırında (test ediyor).
26. ✅ 2.3.7 Anahtar kelimelerde rakip adı yok (Calm, Endel, Headspace yok).
27. ✅ 2.3.7 Fiyat ya da "ücretsiz", "en iyi", "#1" gibi ifadeler ad ve alt başlıkta yok.
28. ✅ 2.3.8 Mağaza adı "852Hz: …" ana ekran adıyla ("852Hz") uyumlu.
29. ✅ 2.3.8 Simge 1024×1024, RGB, şeffaflık yok (ITMS-90717 riski yok).
30. ✅ 2.3.10 Uygulama içinde iOS'ta "Android/Google Play" geçmiyor. Bu metinlerin hepsinin `_ios` karşılığı var.
31. ✅ 2.3.10 Mağaza metinlerinde başka platform adı yok (test ediyor).
32. ✅ 2.3.12 "What's New" dolu.
33. ✅ 2.4.1 iPhone-only (supportsTablet false). iPad'de uyumluluk modunda açılır; iPad ekran görüntüsü gerekmez.
34. ✅ 2.4.2 Pil: arka planda ses dışında iş yok. Zamanlayıcı bitince ses duruyor.
35. ✅ 2.4.5 Uygulama başka uygulama ya da kod indirmiyor.
36. ✅ 2.5.1 Yalnızca genel API'ler (Expo SDK 54).
37. ✅ 2.5.2 Çalışma anında kod indirme/OTA yok (expo-updates paketi kurulu değil).
38. ✅ 2.5.4 Arka plan modu yalnızca `audio`; uygulama gerçekten arka planda ses çalıyor. İnceleme notunda gerekçesi var.
39. ✅ 2.5.5 IPv6 uyumlu (ağ yok).
40. ✅ 2.5.9 Ses düğmeleri, sessiz modu ya da sistem davranışları değiştirilmiyor. Sessiz modda çalma bilinçli (`playsInSilentMode`); uyku uygulaması için beklenen davranış.
41. ✅ 2.5.11 Siri/Shortcuts yok.
42. ✅ 2.5.14 Kayıt yok. Mikrofon izni hiç istenmiyor.
43. ✅ 2.5.16 Widget/eklenti yok.
44. 🔧 ITMS-90683: expo-audio kayıt API'lerini içerdiği için `NSMicrophoneUsageDescription` iOS'ta eklendi. İzin istenmiyor. Android kaydı hâlâ engelli (`verify:android-config`).
45. 🔧 ITMS-91053: `PrivacyInfo.xcprivacy` için `ios.privacyManifests` eklendi (UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1; takip yok, toplanan veri yok).
46. 🔧 Şifreleme: `ITSAppUsesNonExemptEncryption: false`. Her yüklemede export compliance sorusu sorulmaz.
47. ✅ `CFBundleLocalizations` 21 dil; App Store dil listesi doğru görünür.
48. ✅ Bundle ID `com.dehbkoclugu.neurosound` Android paketiyle aynı.
49. ✅ Build numarası EAS'te uzaktan (`appVersionSource: remote`), production'da otomatik artıyor.
50. ✅ Sürüm 1.0.0.

## 3. İş modeli ve satın alma (Guideline 3)

51. ✅ 3.1.1 Dijital içerik yalnızca Apple IAP ile açılıyor; dış ödeme bağlantısı yok.
52. ✅ 3.1.1 "Satın alımları geri yükle" düğmesi Premium ekranında.
53. ✅ 3.1.1 Geri yükleme ömür boyu (non-consumable) satın almayı da kapsıyor (`getAvailablePurchases`).
54. ✅ 3.1.1 Kilitli içerik ücretsiz içeriği engellemiyor; uygulama Premium'suz da kullanışlı (ortam sesleri, 4 binaural, 3 Solfeggio, mikser).
55. 🔧 3.1.2 iOS'ta yenileme ve iptal metni Apple diliyle: Apple ID, 24 saat kuralı, App Store hesap ayarları (21 dil).
56. 🔧 3.1.2 Premium ekranında iOS'ta Kullanım Koşulları (Apple standart EULA) ve Gizlilik Politikası bağlantıları.
57. ✅ 3.1.2 Mağaza açıklamasında EULA ve gizlilik bağlantısı var (test ediyor).
58. ✅ 3.1.2 Her planda süre ve fiyat görünüyor ("X / yıl", "X / ay", "X tek sefer").
59. 🔧 3.1.2 Deneme süresi iOS'ta da algılanıyor (introductory offer). Önceden yalnızca Google verisi okunuyordu.
60. 👤 3.1.2 Yıllık planın denemesi App Store Connect'te **1 hafta ücretsiz** olmalı. Ekranda "7 gün ücretsiz" yazıyor.
61. ⚠️ 3.1.2 Denemeyi daha önce kullanmış birine iOS yine "deneme var" gösterebilir. Gerçek fiyat Apple'ın onay ekranında doğru çıkar; uygunluk kontrolü sonraki sürüme kaldı.
62. ✅ 3.1.2 Fiyat, deneme yazısından daha büyük ve belirgin. Deneme yazısı düğmenin hemen üstünde, fiyatla birlikte.
63. ✅ 3.1.2 Premium ekranı kapatılabiliyor (X düğmesi); açılışta zorla gösterilmiyor.
64. ✅ 3.1.2(a) Abonelik sürekli değer sunuyor (tüm kütüphane ve mikser).
65. 👤 3.1.2 Aylık ve yıllık abonelik aynı **abonelik grubunda** olmalı; ömür boyu ayrı bir non-consumable.
66. 👤 3.1.2 Ürün kimlikleri birebir: `premium_monthly`, `premium_yearly`, `premium_lifetime`.
67. 👤 Her ürün için görünen ad, açıklama (en az TR+EN) ve inceleme ekran görüntüsü (Premium ekranının görüntüsü) gerekli.
68. 👤 Paid Applications sözleşmesi, banka ve vergi formları "Active" olmalı. Değilse ürünler sandbox'ta bile yüklenmez ve inceleme reddeder.
69. ✅ 3.1.3 Okuyucu/çoklu platform istisnası kullanılmıyor.
70. ✅ 3.1.4 Donanım ya da fiziksel ürün satışı yok.
71. ✅ 3.2.2 Uygulama içi reklam, ödüllü reklam ya da inceleme için teşvik yok.
72. ✅ 3.2.2 Değerlendirme isteği yok; olsaydı SKStoreReviewController şart olurdu.

## 4. Tasarım (Guideline 4)

73. ⚠️ 4.3 Spam: frekans/beyaz gürültü uygulaması çok fazla. Ayırt edici özellikler inceleme notunda: amaçla başlama, hazır süreli seanslar, 4 kanallı mikser, hazır karışımlar, 21 dil. Ret gelirse yanıt bu farkları anlatmalı.
74. ✅ 4.2 Minimum işlev: web görünümü saran bir uygulama değil; yerel ses motoru, mikser, zamanlayıcı, kilit ekranı kontrolü.
75. ✅ 4.1 Başka uygulamanın adı, simgesi ya da görünümü kopyalanmadı.
76. ✅ 4.0 Güvenli alanlar: alt menü `insets.bottom` kullanıyor (Android'deki çift boşluk düzeltmesi iOS'ta da geçerli). ⚠️ Dynamic Island ve ana ekran çubuğu TestFlight'ta gözle kontrol edilmeli.
77. ✅ 4.0 Dokunma alanları en az 44pt (`AccessibilitySize.minTouchTarget`).
78. ✅ 4.0 Koyu ve açık tema sistem ayarını izliyor.
79. ✅ 4.0 Dinamik yazı boyutu: metinler ölçekleniyor; büyük boyutta taşma TestFlight'ta denenmeli.
80. ✅ 4.5 Apple markası ya da logosu kullanılmıyor (yalnızca "App Store", "Apple ID" metinde).
81. ✅ 4.7 Mini uygulama/oyun/eklenti çalıştırılmıyor.
82. ✅ 4.8 Hesap ve giriş yok; Sign in with Apple gerekmiyor.
83. ✅ 4.9 Apple Pay yok.
84. ✅ 4.10 Bildirim yok; push izni istenmiyor.

## 5. Yasal ve gizlilik (Guideline 5)

85. ✅ 5.1.1 Gizlilik politikası bağlantısı uygulama içinde (Ayarlar ve Premium) ve mağazada.
86. 🔧 5.1.1 Gizlilik sayfasına iPhone'a özel iCloud yedeği ve Apple ödeme satırları eklendi (TR+EN).
87. ✅ 5.1.1 Uygulama içi gizlilik metni iOS'ta iCloud ve App Store'dan söz ediyor.
88. ✅ 5.1.1(v) Hesap yok; hesap silme zorunluluğu yok. Yerel veriler Ayarlar › Sıfırla ile siliniyor.
89. ✅ 5.1.1 Gereksiz izin yok: konum, kişiler, kamera, fotoğraf, takip, bildirim yok.
90. 👤 5.1.1 App Privacy formu: **"Data Not Collected"**. Ödeme Apple'a ait, geliştirici veri almıyor.
91. ✅ 5.1.2 ATT gerekmiyor (IDFA, takip SDK'sı, reklam yok).
92. ✅ 5.1.4 Çocuklara yönelik değil; Kids kategorisi seçilmeyecek.
93. ✅ 5.2.1 Ses ve görsellerin kaynağı `docs/ASSET_PROVENANCE.md` dosyasında kayıtlı.
94. ✅ 5.2.2 Üçüncü taraf hizmeti yok.
95. ✅ 5.2.5 Apple ürünlerini taklit eden arayüz yok.
96. ✅ 5.3 Kumar, piyango ya da yarışma yok.
97. ✅ 5.6 Geliştirici adı ve iletişimi tutarlı: DEHB Koçluğu, dehbkoclugu@gmail.com.

## App Store Connect formları

98. 👤 Yaş derecelendirmesi anketi (2025 yeni sorular + 2026 sosyal medya soruları): hepsi "Hayır" / "Yok". Beklenen sonuç **4+**. "Tıbbi veya sağlık konuları" sorusunda: tıbbi bilgi yok, "Hayır".
99. 👤 Destek URL'si: `https://dehbkoclugu-afk.github.io/neurosound/support.html`. Push sonrası Pages iş akışı yayınlar; göndermeden önce adresin açıldığını kontrol et.
100. 👤 Telif hakkı: "2026 DEHB Koçluğu". İletişim bilgileri (ad, telefon, e-posta) App Review Information'da dolu olmalı.

## Gönderimden önce kalan

- iOS derlemesi (`eas build -p ios --profile production`) ve TestFlight'ta bir tur: açılış, Premium sandbox satın alma, geri yükleme, kilit ekranında zamanlayıcı.
- App Store Connect'te uygulama kaydı, ürünler, gizlilik formu, yaş anketi.
