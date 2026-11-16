#!/usr/bin/env python3
"""Chatterbox Multilingual TTS köprüsü (Nedenmiş Studio isteğe bağlı birincil motor).

Resmî `chatterbox-tts` paketi (0.1.7) üzerinde çalışır ve Studio'nun kullandığı
küçük bir HTTP arayüzü sunar:

  GET  /health      -> {"ok": bool, "state": "starting|downloading|ready|unavailable",
                        "language": "tr", "device": "cpu", "detail": "...", "cacheMb": n}
  POST /synthesize  -> {"text": "...", "language_id": "tr", "voice_ref": "..."}  (24 kHz WAV)
  GET  /languages   -> desteklenen diller (paketten okunur, sabit yazılmaz)

Doğrulanmış API (chatterbox-tts 0.1.7 kaynağından okundu, varsayım yok):
  ChatterboxMultilingualTTS.from_pretrained(device)         # device zorunlu ("cpu" olabilir)
  model.generate(text, language_id, audio_prompt_path=None, exaggeration=0.5, ...)
  model.sr == 24000                                          # S3GEN_SR
  dil listesinde "tr": "Turkish" var                        # SUPPORTED_LANGUAGES
  model ağırlıkları HuggingFace'ten indirilir (ResembleAI/chatterbox)

Dürüstlük notu:
  * Model ağırlıkları (~2 GB) uygulamayla birlikte GELMEZ; ilk çalıştırmada
    huggingface.co üzerinden indirilir. Kapalı ağda bu adım başarısız olur.
  * CUDA yoksa CPU'da çalışır ve gerçek zamanın birkaç katı yavaştır.
  * Bu köprü kurulamazsa Studio sessizce başka bir motor kullanmaz: eSpeak NG
    gibi bir yedek seçilirse arayüzde "robotik yedek ses" olarak etiketlenir.

Kullanım:
  python chatterbox_server.py --host 127.0.0.1 --port 8123
  python chatterbox_server.py --status        # kurulum + API imza kontrolü (JSON)
  python chatterbox_server.py --self-test     # Türkçe örnek sentez + WAV yaz
"""
from __future__ import annotations

import argparse
import inspect
import io
import json
import os
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MODEL = None
MODEL_LOCK = threading.Lock()
DEVICE = os.environ.get("CHATTERBOX_DEVICE", "cpu")
LANGUAGE_ID = os.environ.get("CHATTERBOX_LANG", "tr")
PREVIEW_TEXT = "Merhaba, ben Nedenmiş. Elmas çok serttir ama yine de kırılabilir."

STATE: dict = {
    "state": "starting",
    "detail": "model yükleniyor",
    "startedAt": time.time(),
    "readyAt": None,
    "error": None,
    "model": None,
    "cacheMb": 0,
    "loadSec": None,
    "synthSec": None,
    "audioSec": None,
}

REQUIRED_HINT = "pip install chatterbox-tts \"setuptools<81\"  (Python 3.10+; torch/torchaudio ile birlikte ~2 GB)"
# resemble-perth, pkg_resources üzerinden model dosyası arıyor. Python 3.12 venv'lerinde
# setuptools varsayılan gelmediği için içe aktarma sessizce başarısız olur ve paket
# PerthImplicitWatermarker = None yapar; sonuç: "'NoneType' object is not callable".
WATERMARK_HINT = "pip install setuptools  (resemble-perth'in pkg_resources bağımlılığı)"


def watermarker_status() -> dict:
    """Filigran (perth) kullanılabilir mi? Sessiz bozulmayı önceden yakalar."""
    try:
        import perth  # type: ignore

        impl = getattr(perth, "PerthImplicitWatermarker", None)
        return {
            "available": impl is not None,
            "import": "ok",
            "detail": None if impl is not None else "PerthImplicitWatermarker yüklenemedi (pkg_resources eksik olabilir)",
        }
    except Exception as e:
        return {"available": False, "import": "failed", "detail": str(e)}


def ensure_watermarker(model) -> None:
    """model.watermarker None ise anlaşılır hata ver (derinlerde NoneType hatası yerine)."""
    if getattr(model, "watermarker", "missing") is None:
        raise RuntimeError(
            "Chatterbox filigran modülü yüklenemedi: resemble-perth içe aktarılamıyor. "
            f"Çözüm: {WATERMARK_HINT}"
        )


def hf_cache_dir() -> Path:
    base = os.environ.get("HF_HOME")
    if base:
        return Path(base) / "hub"
    return Path.home() / ".cache" / "huggingface" / "hub"


def cache_megabytes() -> int:
    """İndirilen model ağırlıklarının boyutu (ilk çalıştırma ilerlemesi için)."""
    total = 0
    models_dir = hf_cache_dir() / "models--ResembleAI--chatterbox"
    if not models_dir.exists():
        return 0
    for p in models_dir.rglob("*"):
        try:
            if p.is_file():
                total += p.stat().st_size
        except OSError:
            continue
    return int(total / (1024 * 1024))


def _set(state: str, detail: str, error: str | None = None) -> None:
    STATE.update(state=state, detail=detail, error=error)
    if state == "ready":
        STATE["readyAt"] = time.time()


def load_model():
    global MODEL
    with MODEL_LOCK:
        if MODEL is not None:
            return MODEL
        try:
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # type: ignore
        except Exception as e:  # paket yok
            _set("unavailable", f"chatterbox-tts kurulu değil: {e}", REQUIRED_HINT)
            raise
        if DEVICE == "cpu":
            # CPU'da çıkarım için iş parçacığı sayısı belirgin fark yaratıyor.
            try:
                import torch  # type: ignore

                threads = max(1, min(8, os.cpu_count() or 1))
                torch.set_num_threads(threads)
                STATE["threads"] = threads
            except Exception:
                pass
        _set("downloading", "model ağırlıkları indiriliyor (ilk çalıştırma)")
        started = time.time()
        try:
            MODEL = ChatterboxMultilingualTTS.from_pretrained(device=DEVICE)
        except Exception as e:
            _set("unavailable", f"model yüklenemedi: {e}", REQUIRED_HINT)
            STATE["traceback"] = traceback.format_exc()[-4000:]
            raise
        ensure_watermarker(MODEL)
        STATE["loadSec"] = round(time.time() - started, 1)
        _set("ready", f"model hazır ({DEVICE}); yükleme {STATE['loadSec']} sn")
        STATE["model"] = type(MODEL).__name__
        return MODEL


def warmup_async() -> None:
    def run():
        try:
            load_model()
        except Exception:
            traceback.print_exc()

    threading.Thread(target=run, name="chatterbox-warmup", daemon=True).start()


def generate_wav(text: str, voice_ref: str | None = None) -> bytes:
    model = load_model()
    started = time.time()
    params = inspect.signature(model.generate).parameters
    kwargs: dict = {}
    if "language_id" in params:
        kwargs["language_id"] = LANGUAGE_ID
    else:  # imza değişirse sessizce yanlış çalışmak yerine dur
        raise RuntimeError("chatterbox generate() imzasında language_id yok; paket sürümü değişmiş olabilir")
    if voice_ref and "audio_prompt_path" in params:
        kwargs["audio_prompt_path"] = voice_ref
    wav = model.generate(text, **kwargs)
    STATE["synthSec"] = round(time.time() - started, 2)
    sample_rate = int(getattr(model, "sr", 24000))
    audio = wav if getattr(wav, "dim", lambda: 1)() == 1 else wav.squeeze(0)
    try:
        import torchaudio  # type: ignore

        buf = io.BytesIO()
        torchaudio.save(buf, audio.unsqueeze(0).cpu(), sample_rate, format="wav")
        return buf.getvalue()
    except Exception:
        try:
            import soundfile as sf  # type: ignore

            buf = io.BytesIO()
            sf.write(buf, audio.detach().cpu().numpy().squeeze(), sample_rate, format="WAV")
            return buf.getvalue()
        except Exception as e:  # pragma: no cover
            raise RuntimeError("WAV kodlanamadı (torchaudio/soundfile gerekli)") from e


class Handler(BaseHTTPRequestHandler):
    server_version = "NedenmisChatterbox/1.1"

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _health_payload(self) -> dict:
        cache = cache_megabytes()
        STATE["cacheMb"] = cache
        installed = True
        version = None
        try:
            import chatterbox  # type: ignore

            version = getattr(chatterbox, "__version__", None)
        except Exception:
            installed = False
        return {
            "ok": STATE["state"] == "ready",
            "state": STATE["state"],
            "detail": STATE["detail"],
            "error": STATE["error"],
            "installed": installed,
            "version": version,
            "model": STATE["model"],
            "language": LANGUAGE_ID,
            "device": DEVICE,
            "cacheMb": cache,
            "sampleRate": 24000,
            "loadSec": STATE.get("loadSec"),
            "synthSec": STATE.get("synthSec"),
            "threads": STATE.get("threads"),
            "hint": None if installed else REQUIRED_HINT,
        }

    def do_GET(self):  # noqa: N802
        path = self.path.rstrip("/")
        if path == "/health":
            self._json(200, self._health_payload())
            return
        if path == "/languages":
            try:
                from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # type: ignore

                langs = ChatterboxMultilingualTTS.get_supported_languages()
                self._json(200, {"ok": True, "languages": langs, "turkish": langs.get("tr")})
            except Exception as e:
                self._json(503, {"ok": False, "error": str(e), "hint": REQUIRED_HINT})
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
            started = time.time()
            wav = generate_wav(text, payload.get("voice_ref"))
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(wav)))
            self.send_header("X-Chatterbox-Elapsed", f"{time.time() - started:.2f}")
            self.end_headers()
            self.wfile.write(wav)
        except Exception as e:
            traceback.print_exc()
            self._json(500, {"ok": False, "error": str(e), "state": STATE["state"]})

    def log_message(self, fmt, *args):
        sys.stderr.write("[chatterbox] " + (fmt % args) + "\n")


def status_report() -> dict:
    report: dict = {
        "python": sys.version.split()[0],
        "platform": sys.platform,
        "device": DEVICE,
        "language": LANGUAGE_ID,
        "installed": False,
        "version": None,
        "api": {},
        "turkishSupported": False,
        "modelCached": False,
        "cacheMb": cache_megabytes(),
        "watermarker": watermarker_status(),
        "hint": REQUIRED_HINT,
    }
    try:
        import chatterbox  # type: ignore

        report["installed"] = True
        report["version"] = getattr(chatterbox, "__version__", None)
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # type: ignore

        report["api"] = {
            "from_pretrained": str(inspect.signature(ChatterboxMultilingualTTS.from_pretrained)),
            "generate": str(inspect.signature(ChatterboxMultilingualTTS.generate)),
        }
        langs = ChatterboxMultilingualTTS.get_supported_languages()
        report["turkishSupported"] = "tr" in langs
        report["languageCount"] = len(langs)
        try:
            import torch  # type: ignore

            report["torch"] = torch.__version__
            report["cuda"] = bool(torch.cuda.is_available())
        except Exception:
            report["torch"] = None
    except Exception as e:
        report["error"] = str(e)
    report["modelCached"] = (hf_cache_dir() / "models--ResembleAI--chatterbox").exists()
    return report


def self_test() -> int:
    report = status_report()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not report["installed"]:
        print("SONUÇ: chatterbox-tts kurulu değil — sentez yapılmadı.")
        return 1
    if not report["turkishSupported"]:
        print("SONUÇ: kurulu paket Türkçe desteklemiyor — sentez yapılmadı.")
        return 1
    out = os.environ.get("CHATTERBOX_TEST_OUT", "chatterbox_test.wav")
    started = time.time()
    try:
        wav = generate_wav("Elmas neden kolay kırılmaz? Bu bir Türkçe seslendirme testidir.")
    except Exception as e:
        print("SONUÇ: sentez HATASI:", e)
        return 2
    Path(out).write_bytes(wav)
    elapsed = time.time() - started
    import wave

    with wave.open(out, "rb") as f:
        frames, rate, channels = f.getnframes(), f.getframerate(), f.getnchannels()
    duration = frames / rate if rate else 0
    print(
        json.dumps(
            {
                "ok": True,
                "out": out,
                "bytes": len(wav),
                "sampleRate": rate,
                "channels": channels,
                "durationSec": round(duration, 3),
                "elapsedSec": round(elapsed, 2),
                "text": "Elmas neden kolay kırılmaz? Bu bir Türkçe seslendirme testidir.",
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    print("SONUÇ: Türkçe örnek sentez üretildi ->", out)
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8123)
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--preview-text", default=PREVIEW_TEXT)
    args = ap.parse_args()
    if args.status:
        print(json.dumps(status_report(), ensure_ascii=False, indent=2))
        sys.exit(0)
    if args.self_test:
        sys.exit(self_test())
    warmup_async()
    print(f"[chatterbox] {args.host}:{args.port} üzerinde dinleniyor (device={DEVICE}, dil={LANGUAGE_ID})")
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
