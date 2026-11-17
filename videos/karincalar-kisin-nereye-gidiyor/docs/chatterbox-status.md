# Chatterbox durumu — bu ortamda ölçülen sonuç

## Yapılan gerçek deneme (2026-11-17)

1. `chatterbox-tts==0.1.7` gerçekten kuruldu (`/tmp/cbvenv`, torch 2.6.0+cu124, setuptools 80.10.2).
2. Köprü durum raporu (`packages/core/scripts/chatterbox_server.py --status`) şunu **doğruladı**:

   ```json
   {
     "installed": true,
     "version": "0.1.7",
     "turkishSupported": true,
     "languageCount": 23,
     "watermarker": { "available": true, "import": "ok" },
     "api": {
       "from_pretrained": "(device: torch.device) -> 'ChatterboxMultilingualTTS'",
       "generate": "(self, text, language_id, audio_prompt_path=None, exaggeration=0.5, ...)"
     },
     "modelCached": false,
     "torch": "2.6.0+cu124",
     "cuda": false
   }
   ```

3. Gerçek sentez denemesi (`--self-test`) **başarısız** oldu; HuggingFace model ağırlıklarına erişim yok:

   ```
   SONUÇ: sentez HATASI: Got: ConnectError: TLS/SSL connection has been closed (EOF) (_ssl.c:992)
   An error happened while trying to locate the files on the Hub, and we cannot find the
   appropriate snapshot folder for the specified revision on the local disk.
   ```

   Ayrıca `curl -I https://huggingface.co` → `000` (bağlantı yok). Model ağırlıkları
   (~2 GB) yalnızca HuggingFace üzerinde yayınlandığı için bu ortamda indirilemiyor.

## Sonuç ve dürüst uyarı

**Chatterbox bu ortamda çalışmıyor.** Sahte bir başarı gösterilmedi: `audio/*.wav` dosyaları
Chatterbox değil, bu oturumun gerçek TTS ses motoru (`voice-00`, Türkçe erkek anlatıcı) ile
üretilmiştir. Küprü kodunda hiçbir değişiklik yapılmadı; depo durumu aynı.

- Kullanılan ses: `voice-00` (Türkçe, erkek, belgesel anlatımı)
- Her sahne ayrı sentezlendi: `audio/s1.wav … audio/s9.wav` (44,1 kHz, mono, 16-bit PCM)
- Revizyon transkripti 9 segment olduğu için 9 klip üretildi (üretim başına 10 klip sınırı içinde).
- Eski 11 segmentlik sürümün `s10.wav` / `s11.wav` dosyaları silinmiştir.

## Chatterbox'a internetli bir makinede nasıl geçilir

```bash
python -m venv .venv-cb && source .venv-cb/bin/activate
pip install chatterbox-tts "setuptools<81"
python packages/core/scripts/chatterbox_server.py --port 8123
# Studio → Ayarlar → Seslendirme → Motor: Chatterbox → http://127.0.0.1:8123
```

Bu projenin Render betikleri `FFMPEG`/`CHROMIUM_PATH` ortam değişkenlerini kabul eder; TTS ise
şu an için Arena platform ses motoruna bağlıdır.
