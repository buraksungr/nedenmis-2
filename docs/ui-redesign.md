# Arayüz yenilemesi (tek renk, sade)

Amaç: video üretimini **hızlandıran** sakin bir arayüz. Apple tarzı bir taklit değil; aynı disiplinin
işe yarayan kısmı (tek renk, boşluk, tipografi, sınırlı animasyon, net hiyerarşi) alındı.

## Tasarım sistemi

| Öğe | Değer |
| --- | --- |
| Zemin | `#fbfbfd` (neredeyse beyaz) |
| Yüzey | `#ffffff`, ikincil `#f5f5f7` |
| Metin | `#1d1d1f` · ikincil `#6e6e73` · soluk `#8e8e93` |
| Çizgi | `#e3e3e8`, güçlü `#cfcfd6` |
| Vurgu | **siyah** `#111111` (renk yok) |
| Yarıçap | 8 / 12 / 18 px |
| Gölge | iki katmanlı, çok hafif (`0 1px 3px` + `0 12px 32px`) |
| Geçiş | 140–200 ms, `cubic-bezier(.32,.72,0,1)` |
| Tipografi | sistem yazı tipi yığını, başlıklarda negatif harf aralığı |

Renk yalnızca **anlam** için kullanılır ve o da tek renk içinde çözülür: dolu siyah = tamam,
kesikli çerçeve = uyarı, dolu siyah rozet = hata. Renkli (doygun) ton yoktur — bu bir testle ölçülür
(`npm run test:ui` içindeki `monochrome` kontrolü, derlenmiş CSS'te doygunluk > %15 olan renk arar).

## Gezinme

Dört giriş, fazlası yok:

1. **Projeler** — kütüphane
2. **Video oluştur** — konu → plan
3. **Stüdyo** — son açılan proje
4. **Ayarlar** — varsayılanlar + teşhis

Kenar çubuğu tek sütun, 244 px; durum satırları (ses motoru, Chatterbox, FFmpeg, depo) en altta.

## Stüdyo: önizleme önce gelir

Düzen üç katmandır (yukarıdan aşağıya): **başlık ve eylemler → sahne → ayrıntı**.

- **Sahne (ana odak):** büyük, ortalanmış 9:16 video çerçevesi (yükseklik `min(58vh, 520px)`).
  Video hazır değilse aynı çerçevede "önce seslendir, sonra üret" yönlendirmesi görünür.
  Çerçevenin altında doğrulama rozetleri (süre, çözünürlük, kare) ve çıktı bağlantıları.
- **Sağ ray (360 px):** iş ilerlemesi (aşama hapları), **Senaryo kalitesi** paneli
  (puan, ortalama cümle, en uzun cümle, terim sayısı, kanca) ve ses/kalite özeti.
  1180 px altında tek sütuna iner.
- **Zaman çizelgesi:** sahne uzunluklarıyla orantılı ince şerit; tıklayınca sahne seçilir.
- **Sahne kartları:** anlatım, görsel bileşen ve doğrulama; kapalı başlar, tıklayınca açılır.
- **Teknik ayrıntılar:** doğrulama/araştırma sekmeleri, zamanlama tablosu, kare örnekleri ve
  işlem geçmişi katlanır panelde (`<details>`). Arayüzü kalabalıklaştırmaz.
- Sahne kartları varsayılan olarak kapalıdır; tıklayınca anlatım düzenleme + bileşen seçimi açılır
  (progressive disclosure).

## Video oluştur

1. Konu alanı + öneriler.
2. **Anlatım dili** kartları: Sade (varsayılan) / Standart / Ayrıntılı — her biri tek satır açıklamalı.
3. Süre, çıktı kalitesi, görsel karmaşıklık, altyazı.
4. Seslendirme: motor (durum bilgisiyle), gelişmiş ayarlar katlanmış.

## Ayarlar

Dokuz ayar tek ekranda, her biri tek satır açıklamayla: dil karmaşıklığı, hedef süre, görsel karmaşıklık,
altyazı, dışa aktarma kalitesi, en-boy oranı (yalnızca gerçekten desteklenen 9:16), motor, ses/hız,
Chatterbox adresi. Altında motor durum listesi ve **ses önizlemesi** (gerçek WAV üretir).

## Ekran görüntüleri

`node scripts/ui-shots.mjs` gerçek Chrome/Edge ile 1600×1000 (masaüstü) ekran görüntüsü alır ve her
PNG'yi ölçer: boyut, boş olmama (ton çeşitliliği), monokrom oranı, ortalama parlaklık.

- Çıktı: `reports/ui-shots/01-video-olustur.png`, `02-projeler.png`, `03-studyo.png`, `04-ayarlar.png`
- Rapor: `reports/ui-screenshots.json` (`checks.desktopResolution`, `notBlank`, `monochrome`, `lightTheme`)
- Bu görüntüler yayın varlıklarına da eklenir.

> Not: görüntüler tarayıcı gerektirir. Tarayıcı yoksa betik "alınamadı" diye **açıkça** yazar ve
> iş akışını düşürmez; o durumda görsel kanıt Windows CI çalıştırmasından gelir.

## Kullanılabilirlik notları

- Renkli gradyanlar, cam efektleri, gereksiz animasyonlar kaldırıldı; odak videoda.
- Dokunma hedefleri en az 34 px; form alanları 11–15 px dolgu ile tek elle kullanılabilir.
- Küçük ekran (< 860 px) için kenar çubuğu üst şeride dönüşür.
- `prefers-reduced-motion` desteklenir.
