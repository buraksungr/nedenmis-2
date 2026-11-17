# Görsel stil referansı analizi — `image-1.png`

Referans görsel **doğrudan videoya koyulmamıştır**; yalnızca sanat yönetimi (palet, kontur,
doku, kompozisyon) için ölçümlenir. Tüm sahneler sıfırdan Remotion + SVG/CSS ile çizilmiştir.

## Ölçülen özellikler (programlı analiz)

| Ölçüm | Değer | Yorum |
| --- | --- | --- |
| Boyut | 1280×698 piksel, RGB | yatay editorial kompozisyon |
| Ortalama renk | RGB (158, 136, 116) | sıcak bej/okre ağırlıklı |
| Sıcak piksel oranı (r > b+12) | **%86,1** | kaplama sıcak; soğuk yalnızca gökyüzü |
| Ortalama doygunluk | 0,359 | orta — ham, topraksı |
| Renklilik (Hasler–Süsstrunk) | 38,1 | orta; neon yok |
| Güçlü kenar oranı (|∇| > 60) | **%25,5** | kalın mürekkep kontur + yüzey detayı |
| Üst bant ort. rengi | (202, 219, 229) | açık mavimsi gökyüzü |
| Alt bant ort. rengi | (149, 121, 95) | sıcak toprak |
| En koyu %2 | (29, 6, 0) | neredeyse siyah kahve mürekkep |
| En açık %2 | (246, 248, 247) | kırık beyaz |
| Yeşil oranı | %1,0 | yeşil yalnızca küçük vurgu |
| Gökyüzü vurgusu | #cce4e4 / #e4e4fc | soluk camgöbeği–beyaz |

## Birebir çıkarılan palet (koda sabit yazıldı)

| Token | Değer | Kullanım |
| --- | --- | --- |
| `ink` | `#2b1a0c` | kontur, mürekkep, tipografi şeridi |
| `inkDeep` | `#1d1106` | en koyu gölge |
| `soilDark` | `#3a2410` | derin toprak |
| `soil` | `#6b4423` | toprak |
| `soilLight` | `#8a6230` | aydınlık toprak |
| `ochre` | `#a88838` | ana toprak/zemin |
| `gold` | `#d8c858` | vurgu, altın çizgi, güneş |
| `sand` | `#e8dca0` | açık toprak, ikincil metin |
| `cream` | `#f4ecd6` | ana tipografi rengi |
| `sky` | `#cfe3e6` | yaz gökyüzü |
| `skyCold` | `#b9cdd4` | kış gökyüzü |
| `sage` | `#9fb06a` | tek yeşil vurgu (çimen/sürgün) |
| `antBody` | `#3a2410` | karınca gövdesi |

## Sanat yönetimi kuralları (tüm sahnelere uygulandı)

1. **İnce mürekkep kontur (revizyon):** karınca gövde hatları 2,8–3 px; bacaklar 2,4–3 px;
   anten 2,2–2,6 px; mandibula 1,8 px. Diğer öğeler (termometre, çim, odacık duvarı) için 5–8 px
   kalınlığa izin verilir. Karınca üst sınırı `MAX_ANT_SCALE = 2,3` ile sabit tutulur.
2. **Sıcak ağırlıklı palet:** her karede sıcak piksel baskın; soğuk yalnızca kış sahnelerinde ve gökyüzüde.
3. **Dokulu yüzey:** `public/grain.png` (512² deterministik gren) tüm karelere `%10` opaklıkla `overlay` uygulanır.
4. **Vinyet:** `public/vignette.png` ile köşeler koyulaştırılır; böylece sinematik derinlik hissi verilir.
5. **Tipografi:** Archivo Black (büyük kelime) + Archivo 600/700 (etiket). Mürekkep şerit + altın alt çizgi.
6. **Karakter tutarlılığı:** tek `Ant` bileşeni; worker/queen varyantları aynı anatomide (baş–göğüs–karın, dirsekli anten, 6 bacak).
7. **Kompozisyon çeşitliliği:** her sahne farklı kamera açısı/ölçeği (makro, kesit, yandan, kuşbakışı yok, pan/tilt).
8. **Hareket:** yalnızca statik slayt değil; bacak gönderileri, anten salınımı, karının yuvarlanması, kamera pan/zoom, parallax katmanları.
