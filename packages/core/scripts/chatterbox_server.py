#!/usr/bin/env python3
"""Chatterbox Multilingual TTS sunucusu (Nedenmiş Studio birincil seslendirme motoru).

Bu sunucu, Resemble AI'nin Chatterbox Multilingual modelini CPU üzerinde çalıştırır
ve Nedenmiş Studio'nun kullandığı küçük bir HTTP arayüzü sunar:

  GET  /health      -> {"ok": true, "model": "...", "language": "tr", "device": "cpu"}
  POST /synthesize  -> {"text": "...", "language_id": "tr", "voice_ref": "..."}  (WAV döner)

ÖNEMLİ (dürüstlük notu): Bu betik, resmî chatterbox-tts API'sine göre yazılmıştır.
Çalıştırmak için `pip install chatterbox-tts torch torchaudio` gerekir (~2 GB model
indirmesi). Nedenmiş Studio geliştirme ortamında (ağ kısıtlı, 3 GB RAM, GPU yok)
model çalıştırılamadı; bu nedenle örnek videolarda eSpeak NG motoru kullanıldı ve
bunu videonun meta verisinde açıkça belirtiyoruz. Chatterbox API imzaları
çalışma zamanında içe aktarılıp doğrulanır; varsayım yapılmaz.

Kullanım:
  python chatterbox_server.py --host 127.0.0.1 --port 8123
  python chatterbox_server.py --self-test            # imzaları yazdır + kısa sentez
"""
from __future__ import annotations

import argparse
import inspect
import io
import json
import os
import sys
import threading
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODEL = None
MODEL_LOCK = threading.Lock()
DEVICE = os.environ.get("CHATTERBOX_DEVICE", "cpu")
LANGUAGE_ID = os.environ.get("CHATTERBOX_LANG", "tr")


def load_model():
    global MODEL
    with MODEL_LOCK:
        if MODEL is not None:
            return MODEL
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # type: ignore

        sig = inspect.signature(ChatterboxMultilingualTTS.from_pretrained)
        kwargs = {}
        if "device" in sig.parameters:
            kwargs["device"] = DEVICE
        MODEL = ChatterboxMultilingualTTS.from_pretrained(**kwargs)
        return MODEL


def generate_wav(text: str, voice_ref: str | None) -> bytes:
    model = load_model()
    generate = getattr(model, "generate")
    params = inspect.signature(generate).parameters
    kwargs = {}
    if "language_id" in params:
        kwargs["language_id"] = LANGUAGE_ID
    if voice_ref and "audio_prompt_path" in params:
        kwargs["audio_prompt_path"] = voice_ref
    wav = generate(text, **kwargs)
    sample_rate = getattr(model, "sr", 24000)
    try:
        import torchaudio  # type: ignore

        buf = io.BytesIO()
        audio = wav if wav.dim() == 1 else wav.squeeze(0)
        torchaudio.save(buf, audio.unsqueeze(0).cpu(), sample_rate, format="wav")
        return buf.getvalue()
    except Exception:
        try:
            import soundfile as sf  # type: ignore

            buf = io.BytesIO()
            audio = wav.detach().cpu().numpy().squeeze()
            sf.write(buf, audio, sample_rate, format="WAV")
            return buf.getvalue()
        except Exception as e:  # pragma: no cover
            raise RuntimeError("WAV kodlanamadı (torchaudio/soundfile gerekli)") from e


class Handler(BaseHTTPRequestHandler):
    server_version = "NedenmisChatterbox/1.0"

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802
        if self.path.rstrip("/") == "/health":
            try:
                load_model()
                self._json(200, {"ok": True, "model": type(MODEL).__name__, "language": LANGUAGE_ID, "device": DEVICE})
            except Exception as e:
                self._json(503, {"ok": False, "error": f"{e}", "hint": "pip install chatterbox-tts torch torchaudio"})
            return
        self._json(404, {"ok": False, "error": "bilinmeyen yol"})

    def do_POST(self):  # noqa: N802
        if self.path.rstrip("/") != "/synthesize":
            self._json(404, {"ok": False, "error": "bilinmeyen yol"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            text = (payload.get("text") or "").strip()
            if not text:
                self._json(400, {"ok": False, "error": "text boş"})
                return
            wav = generate_wav(text, payload.get("voice_ref"))
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(wav)))
            self.end_headers()
            self.wfile.write(wav)
        except Exception as e:
            traceback.print_exc()
            self._json(500, {"ok": False, "error": str(e)})

    def log_message(self, fmt, *args):
        sys.stderr.write("[chatterbox] " + (fmt % args) + "\n")


def self_test():
    print("chatterbox-tts sürüm bilgisi:")
    try:
        import chatterbox  # type: ignore

        print("  chatterbox:", getattr(chatterbox, "__version__", "bilinmiyor"))
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # type: ignore

        print("  from_pretrained:", inspect.signature(ChatterboxMultilingualTTS.from_pretrained))
        print("  generate:", inspect.signature(ChatterboxMultilingualTTS.generate))
        print("  supported_languages:", getattr(ChatterboxMultilingualTTS, "SUPPORTED_LANGUAGES", "?"))
    except Exception as e:
        print("  HATA: chatterbox içe aktarılamadı:", e)
        return 1
    text = "Elmas neden kolay kırılmaz? Bu bir seslendirme testidir."
    try:
        wav = generate_wav(text, None)
        out = os.environ.get("CHATTERBOX_TEST_OUT", "chatterbox_test.wav")
        with open(out, "wb") as f:
            f.write(wav)
        print(f"  sentez OK -> {out} ({len(wav)} bayt)")
        return 0
    except Exception as e:
        print("  sentez HATASI:", e)
        return 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8123)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        sys.exit(self_test())
    print(f"[chatterbox] {args.host}:{args.port} üzerinde dinleniyor (device={DEVICE}, dil={LANGUAGE_ID})")
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
