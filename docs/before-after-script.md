# Senaryo öncesi / sonrası karşılaştırma

_Oluşturma: 2026-11-16T23:34:28.769Z_

Bu rapor gerçek verilerle üretilir (`node scripts/script-compare.mjs`). "Önce" metni v1.0.1'de kullanılan akademik anlatımdır; "sonra" metni bu sürümde bilgi kartından üretilen sade anlatımdır. Ölçümler `packages/core/src/script/style.ts` içindeki değerlendiriciyle hesaplanır.

## Özet

| Konu | Ort. kelime/cümle | En uzun cümle | Teknik terim | Puan | Sade dil kapısı |
| --- | --- | --- | --- | --- | --- |
| Elmas neden kolay kırılmaz? | 14.8 → **6.5** | 17 → **11** | 3 → **0** | 86 → **100** | **kaldı** → **geçti** |
| Gökyüzü neden mavi? | 14 → **5.8** | 19 → **10** | 1 → **0** | 96 → **100** | **kaldı** → **geçti** |
| Denizler neden tuzlu? | 11.8 → **4.7** | 15 → **8** | 0 → **0** | 92 → **100** | geçti → **geçti** |
| Kara delikler nasıl çalışır? | 14 → **6.1** | 16 → **8** | 1 → **0** | 100 → **100** | geçti → **geçti** |

## Elmas neden kolay kırılmaz?

**Önce (akademik):**

Elmasın üç boyutlu tetrahedral kristal kafes yapısı, karbon atomları arasındaki güçlü kovalent bağlarla meydana gelir. Bu bağ ağı, ona çok yüksek sertlik kazandırır; ancak sertlik ile tokluk farklı özelliklerdir ve elmas gevrektir. Kristal, belirli düşük endeksli dilimlenme düzlemlerinde daha zayıf bağ yoğunluğuna sahiptir. Bir darbe çatlak başlatırsa, çatlak bu düzlemi izleyerek ses hızı mertebesinde ilerler ve makroskobik kırılma gerçekleşir.

**Sonra (sade, gerçek üretim):**

- **ELMASIN SIRRI** — Elmas, dünyada bilinen en sert doğal madde. Peki neden bu kadar sert? Ve neden yine de kırılabiliyor?
- **ÇOK GÜÇLÜ BAĞLAR** — Elmasın içindeki karbon atomları birbirine çok sıkı tutunur. Her atom, dört komşusuna birden bağlıdır. Bu yüzden ağ gibi bir yapı oluşur.
- **SERTLİK** — Bu sıkı düzen sayesinde elması çizmek çok zordur. Sertlik sıralamasında en üstte yer alır.
- **SERT AMA KIRILGAN** — Ama sert olmak, kırılmaz olmak demek değil. Elmas serttir. Yine de darbeyle çatlayabilir.
- **ZAYIF HATLAR** — Elmasın içinde bazı düzlemler daha zayıftır. Bir darbe çatlak başlatırsa, çatlak o zayıf hattı izleyip hızla ilerler.
- **İKİ FARKLI ÖZELLİK** — Yani elması sert yapan yapı, onu kırılmaz yapmıyor. Sertlik ve kırılganlık aynı taşın iki ayrı özelliği.

Ölçüm: ortalama cümle 14.8 → 6.5 kelime, teknik terim 3 → 0, puan 86 → 100.

## Gökyüzü neden mavi?

**Önce (akademik):**

Güneş ışınımı, atmosferdeki moleküller tarafından Rayleigh saçılmasına uğratılır. Saçılma tesir kesiti dalga boyunun dördüncü kuvvetiyle ters orantılıdır; bu nedenle kısa dalga boylu bileşenler baskın hâle gelir. Gözlemciye ulaşan dağınık ışınımın tayfsal dağılımı, mavi bölgede belirgin biçimde yükselir. Güneş ufka yakınken optik yol uzunluğu arttığından kısa dalga boylu bileşenler absorbe ve saçılmaya uğrar; geriye kırmızı-turuncu bölge kalır.

**Sonra (sade, gerçek üretim):**

- **BEYAZ IŞIK** — Gökyüzü neden mavi? Aslında gökyüzünün kendi rengi yok. Rengi ışık yapıyor.
- **IŞIK DAĞILIYOR** — Güneş ışığı havadaki moleküllere çarpar. Moleküller ışığı her yöne dağıtır.
- **MAVİ DAHA ÇOK** — Mavi ışık bu dağılmaya daha çok yakalanır. Kırmızı ışık ise neredeyse hiç sapmadan geçer.
- **HER YÖNDEN MAVİ** — Bu yüzden gökyüzüne baktığınız her yerde mavi ışık gözünüze ulaşır. Gökyüzü mavi görünür.
- **GÜN BATIMI** — Güneş batarken ışık havada daha uzun yol alır. Mavi ışık yolda dağılır. Geriye kırmızı ve turuncu kalır.
- **ÖZET** — Kısacası: mavi ışık daha çok dağıldığı için gökyüzü mavi. Yol uzadığında ise gün batımı kızıl olur.

Ölçüm: ortalama cümle 14 → 5.8 kelime, teknik terim 1 → 0, puan 96 → 100.

## Denizler neden tuzlu?

**Önce (akademik):**

Deniz suyunun tuzluluğunun başlıca kaynağı, kıtasal kabukta gerçekleşen kimyasal ayrışma süreçleridir. Atmosferik karbondioksitin çözünmesiyle oluşan karbonik asit, silikat ve karbonat minerallerini iyonlaştırır. Akarsu ağı, çözünmüş iyonları hidrolojik döngü aracılığıyla okyanus havzasına taşır. Buharlaşma sırasında su molekülleri faz değiştirirken çözünmüş tuzlar geride kalır; tuzluluk jeolojik zaman ölçeğinde artar.

**Sonra (sade, gerçek üretim):**

- **TUZUN KAYNAĞI** — Denizdeki tuz denizden gelmiyor. Peki nereden geliyor? Karadan. Yağmurla.
- **AKARSULAR TAŞIR** — Bu su, kayalardaki tuzları çözer. Dereler bu tuzu milyonlarca yıl boyunca denize taşır.
- **TUZ SUDA** — Denizde tuz parçacıkları suyun içinde serbestçe dolaşır. Su molekülleri onları sarar ve suda tutar.
- **TUZ GERİDE KALIR** — Güneş deniz suyunu buharlaştırır. Su buharlaşıp yukarı çıkar. Tuz ise denizde kalır.
- **YAKLAŞIK %3,5** — Böylece tuz milyonlarca yıl birikir. Bugün deniz suyunun yaklaşık yüzde üç buçuğu tuzdur.

Ölçüm: ortalama cümle 11.8 → 4.7 kelime, teknik terim 0 → 0, puan 92 → 100.

## Kara delikler nasıl çalışır?

**Önce (akademik):**

Kara delikler, genel görelilik denklemlerinin küresel simetrik vakum çözümü olan Schwarzschild metriğiyle tanımlanır. Olay ufku, kaçış hızının ışık hızına eşitlendiği koordinat yüzeyidir; nedensel olarak iç bölge dış evrenle bağlantısızdır. Yığılma diski içinde viskoz açısal momentum transferi maddeyi ısıtır ve X-ışını bölgesinde ışınım üretir. Kütle çekimsel mercekleme, arka plan kaynaklarının çoklu görüntülerinin ve Einstein halkalarının gözlenmesini sağlar.

**Sonra (sade, gerçek üretim):**

- **UZAY-ZAMAN** — Kara delik, ışığın bile kaçamadığı bir yer. Peki bu nasıl oluyor? Uzayı bir çarşaf gibi düşünün.
- **GERİ DÖNÜŞ YOK** — Çukur yeterince derin olursa bir sınır oluşur. Bu sınırdan içeri giren hiçbir şey geri dönemez. Işık bile.
- **DÖNEN SICAK MADDE** — Kara deliğin çevresine madde düşerken dönmeye başlar. Bu madde ısınır ve parlak ışık yayar.
- **IŞIK BÜKÜLÜR** — Kara deliğin arkasındaki yıldızların ışığı bükülür. Bu yüzden aynı yıldızı iki ayrı yerde görebiliriz.
- **UFKUN ÖTESİ** — Sınırın ötesini hiçbir teleskopla göremeyiz. Bu yüzden içeride ne olduğu hâlâ tartışılıyor.

Ölçüm: ortalama cümle 14 → 6.1 kelime, teknik terim 1 → 0, puan 100 → 100.
