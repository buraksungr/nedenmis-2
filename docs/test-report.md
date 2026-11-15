# Test raporu

Üretim tarihi: 2026-11-15T00:42:38.286Z

## Otomatik testler

| Takım | Komut | Sonuç |
|---|---|---|
| Birim testleri (19 test) | `npm test` | ✅ 19/19 geçti |
| Uçtan uca (gerçek TTS + FFmpeg + FFprobe) | `npm run test:e2e` | ✅ geçti |
| Örnek doğrulama | `npm run verify:samples` | `samples/verification-summary.json` |
| Windows duman testi | GitHub Actions → `npm run smoke` | CI çalıştırması bekleniyor |

Birim testlerinin kapsadığı alanlar:

- Konu çözümleme ve bilgi kartı bütünlüğü (kaynak/adım/kavram zorunlulukları)
- Görsel doğrulama: yanlış bileşenin reddedilmesi, mekanizma uyuşmazlığı, render kapısının kapanması
- Elmas planında biyoloji sızıntısı olmaması; mitokondri planında biyolojinin doğru kullanılması
- Zaman çizelgesi: kare matematiği, ±%5 tolerans, aşırı anlatımda `DurationError`
- 41 görsel bileşenin tamamının geçerli SVG üretmesi (NaN/undefined yok, etiket dengesi)
- SQLite proje deposu: yazma, okuma, listeleme, silme, tekrar kayıt

## Üretilen örnekler

- Toplam sahne: **32**, onaylı: **32**, reddedilen: **0**
- Üretilen video: **6** adet 1080×1920 H.264/AAC dosyası, hepsi FFprobe ile doğrulandı.
- `samples/elmas-neden-kirilmaz/` — 62.33 sn, 1870 kare, 5.5 MB, render 415.2 sn, SHA-256 `11d57c8caad451bc…`
- `samples/gokyuzu-neden-mavi/` — 62.03 sn, 1861 kare, 4.3 MB, render 520 sn, SHA-256 `aa2f7e89fa59224f…`
- `samples/denizler-neden-tuzlu/` — 62.27 sn, 1868 kare, 4.6 MB, render 322.6 sn, SHA-256 `91cfeb016756750d…`
- `samples/kara-delik-nedir/` — 57.70 sn, 1731 kare, 3.9 MB, render 683.1 sn, SHA-256 `d7228a54359691ec…`
- `samples/metaller-neden-iletken/` — 62.73 sn, 1882 kare, 5.1 MB, render 496 sn, SHA-256 `75a83fbb725279ce…`
- `samples/mitokondri-neden-onemli/` — 62.00 sn, 1860 kare, 4.6 MB, render 510.3 sn, SHA-256 `e7f4252341d8110b…`

## Ölçüm ortamı

- Linux x64 konteyner, 2 vCPU, 3.8 GB RAM, GPU yok
- Node v22.22.3, FFmpeg/FFprobe (npm ikili dağıtımı), Python 3.11 + espeakng-loader
- Render hızı: 1080×1920'de yaklaşık 4–5 kare/sn (yüksek kalite), 540p taslakta ~12 kare/sn

Windows kurulum/paketleme adımları `.github/workflows/windows-build.yml` içinde tanımlıdır; bu rapor
hangi adımların hangi ortamda çalıştığını gizlemez.
