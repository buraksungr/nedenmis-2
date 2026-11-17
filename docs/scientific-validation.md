# Bilimsel görsel doğrulama raporu

Bu rapor **elle yazılmamıştır**: `scripts/gen-validation-report.ts` tarafından
`samples/` altındaki gerçek üretim çıktılarından (visual-validation.json, verification.json,
manifest.json) üretilmiştir. Üretim tarihi: 2026-11-15T23:05:33.233Z.

## 1. Yöntem

Her video şu zincirden geçer:

1. **Konu çözümleme** — konu metni doğrulanmış bilgi kartlarıyla eşleştirilir. Kart yoksa video üretilmez.
2. **Araştırma özeti** — karttaki kanıtlar (facts) ve kaynaklar (sources) projeye bağlanır.
3. **Adım seçimi** — hedef süre bütçesine göre mekanizma adımları seçilir; giriş her zaman korunur.
4. **Görsel seçimi** — her adım için kavram kapsamı + mekanizma + alan uyumuna göre bir görsel bileşen seçilir.
   Bileşenler konu adına göre değil, **ne gösterebildiklerine** göre eşleşir; her bileşenin
   `incompatibleConcepts` listesi vardır.
5. **Sahne denetimi (10 kontrol)**:
   - bileşen mevcut mu
   - sahne alanı ile bileşen alanları uyumlu mu
   - adım mekanizması bileşenin desteklediği mekanizmalar arasında mı
   - sahnenin zorunlu kavramları bileşen tarafından kapsanıyor mu
   - yasaklı kavram (incompatibleConcepts) kullanılmış mı
   - kartın yanılgı (misconception) ifadeleri anlatımda geçiyor mu
   - yabancı alan etiketi var mı
   - şematik geri dönüş (fallback) kullanılmış mı
   - etiketler görselle ilişkili mi
   - anlatım uzunluğu sahne için makul mü
6. **Kapı** — tek bir hata bile varsa sahne `rejected` olur ve `assertApproved` render'ı başlatmaz.
7. **Render sonrası** — FFprobe ile süre, kare sayısı, kodek, örnekleme hızı, ses-görüntü senkronu ve
   sahne başına parlaklık/varyans ölçülür.

## 2. Yayın örneklerinin doğrulama sonuçları

| Video | Bilgi kartı | Sahne | Süre (hedefe sapma) | Kare | Çözünürlük | Kodekler | FFprobe |
|---|---|---|---|---|---|---|---|
| Elmas neden kolay kırılmaz? | `diamond-hardness` | 6 | 62.33 sn (3.9%) | 1870 | 1080x1920 | h264/aac 48 kHz | ✅ GEÇTİ |
| Gökyüzü neden mavi? | `sky-blue` | 6 | 62.03 sn (3.4%) | 1861 | 1080x1920 | h264/aac 48 kHz | ✅ GEÇTİ |
| Denizler neden tuzlu? | `ocean-salty` | 5 | 62.27 sn (3.8%) | 1868 | 1080x1920 | h264/aac 48 kHz | ✅ GEÇTİ |
| Kara delikler nasıl çalışır? | `black-hole` | 4 | 57.70 sn (-3.8%) | 1731 | 1080x1920 | h264/aac 48 kHz | ✅ GEÇTİ |
| Metaller elektriği neden iletir? | `metal-conduction` | 5 | 62.73 sn (4.6%) | 1882 | 1080x1920 | h264/aac 48 kHz | ✅ GEÇTİ |
| Mitokondri nasıl enerji üretir? | `mitochondria-atp` | 6 | 62.00 sn (3.3%) | 1860 | 1080x1920 | h264/aac 48 kHz | ✅ GEÇTİ |

> Seslendirme motoru: tüm örneklerde **espeak**.
> Chatterbox Multilingual adaptörü kodda mevcuttur ancak bu üretim ortamında model ağırlıkları
> indirilemediği için doğrulanmamıştır; uygulama sessizce başka motora geçmez.

## 3. Sahne bazlı görsel eşleşmeler


**Elmas neden kolay kırılmaz?** — 6 sahnenin tamamı bilimsel görsel doğrulamadan geçti (3 uyarı).

| Sahne | Görsel bileşen | Mekanizma | Durum | Skor | Hata | Uyarı |
|---|---|---|---|---|---|---|
| diamond-hardness-s1 | `crystal_lattice` | crystal_lattice | onaylı | 86.00 | 0 | 1 |
| diamond-hardness-s2 | `bond_network` | bond_network | onaylı | 100.00 | 0 | 0 |
| diamond-hardness-s3 | `hardness_measure` | hardness_measure | onaylı | 86.00 | 0 | 1 |
| diamond-hardness-s4 | `brittleness_compare` | brittleness_compare | onaylı | 100.00 | 0 | 0 |
| diamond-hardness-s5 | `cleavage_fracture` | cleavage_fracture | onaylı | 100.00 | 0 | 0 |
| diamond-hardness-s6 | `brittleness_compare` | hardness_compare_summary | onaylı | 86.00 | 0 | 1 |


**Gökyüzü neden mavi?** — 6 sahnenin tamamı bilimsel görsel doğrulamadan geçti (6 uyarı).

| Sahne | Görsel bileşen | Mekanizma | Durum | Skor | Hata | Uyarı |
|---|---|---|---|---|---|---|
| sky-blue-s1 | `spectrum_split` | spectrum_split | onaylı | 86.00 | 0 | 1 |
| sky-blue-s2 | `rayleigh_scattering` | rayleigh_scattering | onaylı | 86.00 | 0 | 1 |
| sky-blue-s3 | `wavelength_scale` | wavelength_scale | onaylı | 86.00 | 0 | 1 |
| sky-blue-s4 | `rayleigh_scattering` | sky_dome_view | onaylı | 86.00 | 0 | 1 |
| sky-blue-s5 | `atmosphere_path` | atmosphere_path | onaylı | 86.00 | 0 | 1 |
| sky-blue-s6 | `atmosphere_path` | atmosphere_path | onaylı | 86.00 | 0 | 1 |


**Denizler neden tuzlu?** — 5 sahnenin tamamı bilimsel görsel doğrulamadan geçti (4 uyarı).

| Sahne | Görsel bileşen | Mekanizma | Durum | Skor | Hata | Uyarı |
|---|---|---|---|---|---|---|
| ocean-salty-s1 | `rock_weathering` | rock_weathering | onaylı | 86.00 | 0 | 1 |
| ocean-salty-s2 | `river_to_sea` | river_to_sea | onaylı | 86.00 | 0 | 1 |
| ocean-salty-s3 | `ion_solution` | ion_solution | onaylı | 86.00 | 0 | 1 |
| ocean-salty-s4 | `evaporation_cycle` | evaporation_cycle | onaylı | 86.00 | 0 | 1 |
| ocean-salty-s5 | `river_to_sea` | river_to_sea | onaylı | 100.00 | 0 | 0 |


**Kara delikler nasıl çalışır?** — 4 sahnenin tamamı bilimsel görsel doğrulamadan geçti (4 uyarı).

| Sahne | Görsel bileşen | Mekanizma | Durum | Skor | Hata | Uyarı |
|---|---|---|---|---|---|---|
| black-hole-s1 | `spacetime_grid` | spacetime_grid | onaylı | 86.00 | 0 | 1 |
| black-hole-s2 | `event_horizon` | event_horizon | onaylı | 86.00 | 0 | 1 |
| black-hole-s3 | `accretion_disk` | accretion_disk | onaylı | 86.00 | 0 | 1 |
| black-hole-s5 | `event_horizon` | event_horizon | onaylı | 86.00 | 0 | 1 |


**Metaller elektriği neden iletir?** — 5 sahnenin tamamı bilimsel görsel doğrulamadan geçti (5 uyarı).

| Sahne | Görsel bileşen | Mekanizma | Durum | Skor | Hata | Uyarı |
|---|---|---|---|---|---|---|
| metal-conduction-s1 | `electron_sea` | electron_sea | onaylı | 86.00 | 0 | 1 |
| metal-conduction-s2 | `electron_drift` | electron_drift | onaylı | 86.00 | 0 | 1 |
| metal-conduction-s3 | `resistance_heat` | resistance_heat | onaylı | 86.00 | 0 | 1 |
| metal-conduction-s4 | `insulator_compare` | insulator_compare | onaylı | 86.00 | 0 | 1 |
| metal-conduction-s5 | `electron_drift` | electron_drift | onaylı | 86.00 | 0 | 1 |


**Mitokondri nasıl enerji üretir?** — 6 sahnenin tamamı bilimsel görsel doğrulamadan geçti (5 uyarı).

| Sahne | Görsel bileşen | Mekanizma | Durum | Skor | Hata | Uyarı |
|---|---|---|---|---|---|---|
| mitochondria-atp-s1 | `cell_section` | cell_section | onaylı | 86.00 | 0 | 1 |
| mitochondria-atp-s2 | `mitochondrion_cross` | mitochondrion_cross | onaylı | 86.00 | 0 | 1 |
| mitochondria-atp-s3 | `proton_gradient` | proton_gradient | onaylı | 86.00 | 0 | 1 |
| mitochondria-atp-s4 | `atp_synthase_rotor` | atp_synthase_rotor | onaylı | 100.00 | 0 | 0 |
| mitochondria-atp-s5 | `metabolism_summary` | metabolism_summary | onaylı | 86.00 | 0 | 1 |
| mitochondria-atp-s6 | `atp_synthase_rotor` | atp_synthase_rotor | onaylı | 86.00 | 0 | 1 |


## 4. Doğrulanan özellikler

- Her sahnede kullanılan bileşen, kartın alanıyla (domain) uyumludur.
- Elmas, metaller, kara delik gibi fizik/malzeme konularında biyoloji bileşeni kullanılmamıştır.
- Mitokondri konusunda biyoloji bileşenleri **doğru şekilde** kullanılmıştır (bağlam korunur).
- Hiçbir sahnede yasaklı kavram (incompatibleConcepts) veya kart yanılgısı metni yoktur.
- Tüm çıktılar 1080×1920, 30 fps, H.264 + AAC 48 kHz'tir ve hedef süreye ±%5 içinde oturur.

## 5. Bilinen sınırlar (dürüst beyan)

- Bilgi tabanı **11 kuratörlü konu kartı** içerir. Kart olmayan konularda video üretilmez; bu bir hata değil,
  yanlış görsel üretmemek için bilinçli bir sınırdır.
- Görseller **prosedürel/şematiktir** (fotoğrafik değil). Sahneler bilimsel olarak doğru fikri aktarmak için
  tasarlanmıştır; estetik derinlik ikincildir.
- Doğrulama **kural tabanlıdır** (kavram/mekanizma/alan uyumu). Anlatımın bilimsel doğruluğu kartın
  kaynaklarına dayanır; serbest metin üretimi yoktur.
- eSpeak NG robotik bir sestir; Chatterbox sesi bu ortamda üretilememiştir.
