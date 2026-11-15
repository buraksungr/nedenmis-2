# İçerik kimliği ve dil kuralları

Nedenmiş, **genel merak kanalıdır** — akademik bir yayın değil. Yayın ilkesi tek cümlede şudur:

> Karmaşık şeyleri, bilimsel olarak yanlış yapmadan, sade bir dille anlat.

Hedef kitle: YouTube Shorts izleyen, konuya meraklı ama ön bilgisi olmayan genel izleyici.
Anlatıcı sesi: konuyu gerçekten bilen, samimi bir arkadaş. Ders anlatan bir öğretmen değil;
belgesel okuyan robotik bir ses de hiç değil.

## Yapı: her video aynı omurgayı izler

| Adım | Ne yapar | Kural |
| --- | --- | --- |
| **A) Kanca** | Soru veya şaşırtıcı bilgi | İlk iki cümle içinde merak uyandırmalı. "Peki neden?" tipik kalıptır. |
| **B) Sade açıklama** | Konunun ana fikri | Jargon yok; gerekliyse önce günlük karşılığı, sonra terim. |
| **C) Görsel mekanizma** | Neden-sonuç zinciri, sahne sahne | Her sahnede tek ana fikir; görsel o fikri gösterir. |
| **D) Ek ilginç ayrıntı** | Yalnızca gerçekten değerliyse | Süs olsun diye eklenmez; süre bütçesini yer. |
| **E) Akılda kalan kapanış** | Tek cümlelik özet fikir | Aynı şeyleri tekrar eden özet yazılmaz. |

Kapanış sahnesi (son adım) süre bütçesi elverdiği sürece **her zaman korunur**; kanca da öyle.
Ara adımlar bütçeye sığmazsa zincir ortadan bölünmez, sondan kısaltılır — böylece neden-sonuç akışı kopmaz.

## Terim kuralı

1. Önce fikir sade sözlerle anlatılır.
2. Sonra terim söylenir.
3. Terim hemen bir cümleyle tanımlanır.

Örnek (elmas):

> Elmasın içindeki karbon atomları birbirine çok sıkı tutunur. **Her atom, dört komşusuna birden bağlıdır.**
> Bu yüzden ağ gibi bir yapı oluşur.

Akademik doğruluk içeride (bilgi kartı, görsel planlama, `scientificNote`, doğrulama raporu) korunur;
**son anlatım sade olmak zorundadır**. İç bilimsel metin silinmez — `narration` olarak saklanır,
`narrationSimple` son kullanıcıya gider.

## Dil düzeyleri

| Düzey | Cümle | Terim | Kullanım |
| --- | --- | --- | --- |
| **Sade** (varsayılan) | ortalama ≤ 14 kelime, en uzun ≤ 18 | en fazla 2 | Genel izleyici, Shorts |
| Standart | ortalama ≤ 17 kelime | en fazla 6 | Konuya biraz aşina izleyici |
| Ayrıntılı | ortalama ≤ 22 kelime | en fazla 12 | Meraklı izleyici — **ders anlatımı değil** |

Varsayılan **her zaman Sade**'dir (`normalizeLevel(undefined) === "simple"`). Bilinmeyen bir değer gelirse
yine Sade'ye düşer; yanlışlıkla akademik metin yayınlanmaz.

## Değerlendirici (senaryo kalite kapısı)

`packages/core/src/script/style.ts` içindeki `evaluateScript` her senaryoyu ölçer:

- cümle başına ortalama kelime ve en uzun cümle,
- teknik terim yoğunluğu (terim sözlüğü + Türkçe çekim toleransı),
- kanca (ilk iki cümlede soru/şaşırtıcı bilgi),
- uzun cümle oranı, çok kısa senaryo uyarısı.

Sade düzeyde eşik aşılırsa `ok=false` olur ve `createProject` senaryoyu **yeniden sadeleştirir**
(`ensureSimple`). Sonuç projede `scriptQuality` olarak saklanır ve Stüdyo'da "Senaryo kalitesi"
panelinde ölçümleriyle birlikte görünür.

## Görsel anlatım kuralları

- Sahnede **tek ana fikir**; ekran başlığı kısa (`ÇOK GÜÇLÜ BAĞLAR`, `ZAYIF HATLAR`, `SERT AMA KIRILGAN`).
- Sade dil düzeyinde ekran başlıkları jargon içermez (`overlaySimple` alanı kullanılır).
- "Sade" görsel karmaşıklığında en fazla 2 etiket; "zengin" seçilse bile sahne sayısı artmaz, yalnızca etiket artar.
- Görsel doğrulama değişmedi: bileşen/mekanizma/alan uyumu ve yanılgı denetimi hâlâ render kapısını kapatır.
- Sade anlatımda jargon olmadığı için kavram bağı **bilimsel anlatım üzerinden** denetlenir
  (`scene.narrationScientific`); böylece dil sadeleşirken doğrulama zayıflamaz.

## Örnek: elmas videosu (yeni anlatım)

| Sahne | Ekran | Anlatım |
| --- | --- | --- |
| 1 | ELMASIN SIRRI | Elmas, dünyada bilinen en sert doğal madde. Peki neden bu kadar sert? Ve neden yine de kırılabiliyor? |
| 2 | ÇOK GÜÇLÜ BAĞLAR | Elmasın içindeki karbon atomları birbirine çok sıkı tutunur. Her atom, dört komşusuna birden bağlıdır. |
| 3 | SERTLİK | Bu sıkı düzen sayesinde elması çizmek çok zordur. Sertlik sıralamasında en üstte yer alır. |
| 4 | SERT AMA KIRILGAN | Ama sert olmak, kırılmaz olmak demek değil. Elmas serttir; yine de darbeyle çatlayabilir. |
| 5 | ZAYIF HATLAR | Elmasın içinde bazı düzlemler daha zayıftır. Bir darbe çatlak başlatırsa, çatlak o zayıf hattı izleyip hızla ilerler. |
| 6 | İKİ FARKLI ÖZELLİK | Yani elması sert yapan yapı, onu kırılmaz yapmıyor. Sertlik ve kırılganlık aynı taşın iki ayrı özelliği. |

Ölçüm: ortalama cümle 14,8 → 6,5 kelime · teknik terim 3 → 0 · sade dil kapısı **kaldı → geçti**.
Tam karşılaştırma: [`before-after-script.md`](before-after-script.md) (üretici: `node scripts/script-compare.mjs`).

## Kaçınılanlar

- Uzun, virgülle zincirlenmiş akademik cümleler.
- "Bu olayın adı X'tir" ile başlayıp hiç açıklamama.
- Çocuklaştırma: "minik atomcuklar" gibi ifadeler yok.
- Bilimsel yanlış: sadeleştirme sırasında iddia değişmez. Örneğin "sert olduğu için kırılmaz" gibi bir
  yanılgı üretilmesi doğrulama tarafından engellenir.
