# Senaryo — "Karıncalar Kışın Nereye Kayboluyor?"

- **Süre:** 62,43 sn · **Kare:** 1873 · **FPS:** 30 · **Çözünürlük:** 1080×1920 (9:16)
- **Dil:** Türkçe · **Anlatıcı:** erkek (belgesel anlatım)
- **Çıktı:** `output/karincalar-kisin-nereye-gidiyor.mp4`
- **Senaryo kaynağı:** kullanıcının verdiği transkript (birebir, 9 segment)

## Anlatım yapısı

| # | Süre (sn) | Bölüm | Üst etiket (küçük) |
| --- | --- | --- | --- |
| 1 | 0,47–7,37 | HOOK | HER YERDE |
| 2 | 7,37–13,93 | KIŞ | KIŞ GELDİ |
| 3 | 13,93–23,07 | BİLİM | YAVAŞLIYOR |
| 4 | 23,07–28,37 | BİLİM | DERİN YUVA |
| 5 | 28,37–35,57 | BİLİM | DİNLENME |
| 6 | 35,57–41,50 | DETAY | STOK |
| 7 | 41,50–46,80 | SONUÇ | İLKBAHAR |
| 8 | 46,80–55,30 | SONUÇ | BEKLEYİŞ |
| 9 | 55,30–62,43 | KAPANIŞ | SICAK GÜN |

> Süreler `scripts/make-timeline.ts` çıktısıdır: her sahne = anlatım süresi + 0,18 sn nefes;
> başa 0,45 sn, sonda 0,30 sn tampon vardır. Görüntülenen etiketler **1–2 kelimelik küçük**
> etiketlerdir; büyük başlık kullanılmaz.

## Görsel kurgu

1. **HER YERDE (yaz):** Yer seviyesi. Ön planda yiyecek taşıyan bir karınca, arkada karınca yolu;
   kamera yavaş **push-in**. Sıcak okre ışık.
2. **KIŞ GELDİ:** Aynı kadrajda mevsim değişir — yapraklar düşer, kar başlar; karıncalar yuva
   ağzına akıp kaybolur. **Baj** ile geçiş.
3. **YAVAŞLIYOR:** Kış yüzeyinde tek karınca; yürüyüş hızı ve bacak genliği sahne içinde azalır,
   üzerinde don çizgileri belirir. Sağda **termometre** düşer; kamera **pan**.
4. **DERİN YUVA:** Kamera **dikey inme** — yüzey yukarı kayıp toprak kesiti açılır; karıncalar
   tünele iner. Kahverengi baj.
5. **DİNLENME:** Derin odacık; karıncalar sıkı bir kümede neredeyse hareketsiz; ısı dalgaları ve
   sıcak ışıma. Kamera **push-in**.
6. **STOK:** Tohum/stok odacığı; tohum taşıyan karıncalar yığınına akar.
7. **İLKBAHAR:** Kamera **tilt-up** — toprak ısınır, kar erir, termometre yükselir; karıncalar
   tünelden yukarı çıkar.
8. **BEKLEYİŞ:** Kış kesiti — üstte boş, karlı bir yüzey (karınca yok); altta toprak kesicinde
   küme halinde bekleyen koloni. Kar kesikte "görünmez" olduğunu gösterir.
9. **SICAK GÜN:** Yaz/yazlık yüzey; karıncalar yuvadan yayılıp yeniden yürüyor. Kamera yavaş
   **crane-out**, sıcak ışık.

## Altyazı

`src/components/Text.tsx` içindeki `Subtitle`, anlatım metnini karakter sayısına orantılı
okunabilir parçalara böler ve her parçayı sahnedeki **ses süresine** yayarak konuşmayla senkron
görünmesini sağlar. Tüm sahnelerde aynı alt konumda (y ≈ 1652), koyu, yuvarlatılmış zemin üzerinde
açık metin. Üst etiket `Tag` ile y ≈ 92'de, 25 px, 0,24 em harf aralığıyla sade bir bölüm
etiketidir.

## Tam anlatım metni (altyazı bu metinden üretilir)

1. "Hiç dikkat ettin mi? Yazın her yerde gördüğümüz karıncalar, kış geldiğinde bir anda nereye kayboluyor?"
2. "Aslında karıncalar ortadan kaybolmuyor. Sadece yaşamlarını sürdürmek için farklı bir yönteme geçiyorlar."
3. "Hava sıcaklığı düştükçe hareketleri yavaşlıyor. Çünkü soğuk havada vücutlarını hareket ettirmek ve yiyecek bulmak onlar için çok daha zor hale geliyor."
4. "Bu yüzden birçok karınca türü yuvalarının daha derin ve sıcak bölümlerine çekiliyor."
5. "Burada enerji harcamalarını azaltıyor, neredeyse hareketsiz hale geliyor ve ilkbaharın gelmesini bekliyorlar."
6. "Üstelik yaz boyunca topladıkları yiyecekler de bu zorlu dönemde hayatta kalmalarına yardımcı oluyor."
7. "Hava yeniden ısındığında ise karıncalar yavaş yavaş yuvalarından çıkmaya başlıyor."
8. "Yani kışın ortalıkta görmediğimiz karıncalar aslında yok olmuyor. Sadece bahara kadar sürecek uzun bir dinlenme dönemine giriyorlar."
9. "Bir sonraki sıcak günde onları yeniden yürürken gördüğünde, aslında nereden geldiklerini artık biliyorsun."

## Bilimsel doğruluk notları

- **Ektotermi:** karıncalar soğuk kanlıdır; vücut sıcaklığı çevreyle birlikte değişir. Bu yüzden
  soğukta hareket yavaşlar. ✔
- **Hareket / enerji:** sıcaklık düştükçe kas çalışması ve av arama zorlaşır. ✔
- **Yuva derinliği:** birçok tür kışın yuvanın daha derin ve sıcaklığı daha stabil bölgelerine
  çekilir. ✔
- **Enerji tasarrufu + stok:** koloni hareketi azaltır, yaz boyunca biriktirilen yiyecekler
  hayatta kalmaya yardımcı olur. ✔
- **İlkbahar:** toprak yeniden ısınınca aktivite artar. ✔
- **Tür farkı:** transkript "birçok karınca türü" diyerek çoğullaştırıyor; tüm karıncalar aynı
  şekilde kışlamaz. ✔
- **Kaçınılan yanılgı:** "karıncalar kış uykusuna yatar" denmemiştir; "neredeyse hareketsiz hale
  geliyor" / "uzun bir dinlenme dönemi" ifadeleri kullanılmıştır.

## Bu revizyonda yapılan görsel düzeltmeler

- **Karınca konumu:** karıncalar artık ekranın en altına değil, orta-alt bölgeye (≈ ekranın
  %55–%60'ı) oturuyor; altyazıyle çakışmıyor.
- **Karınca ölçeği:** `MAX_ANT_SCALE = 2.3` sınırı eklendi; kamera dar kadrajda geçiştiren
  dev karınca kullanılmıyor (maks. 1,85).
- **Kontur:** ana hatlar 6 px'ten 2,8–3 px'e indirildi (bacaklar 2,4–3 px; anten 2,2–2,6 px).
