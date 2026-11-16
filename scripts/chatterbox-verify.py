#!/usr/bin/env python3
"""Chatterbox Türkçe sentez doğrulaması (gerçek sentez, gerçek WAV).

Bu betik modelin gerçekten çalıştığını kanıtlar; çalışmıyorsa bunu açıkça yazar.
Hiçbir koşulda "başarılı" taklidi yapmaz.

Kullanım:
  python scripts/chatterbox-verify.py \
      --wav reports/chatterbox-turkish-sample.wav \
      --json reports/chatterbox-tr.json

Çıkış kodları:
  0  Türkçe WAV üretildi ve doğrulandı
  3  chatterbox-tts kurulu değil (sentez yapılmadı)
  4  kurulu ama sentez başarısız
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import time
import traceback
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVER_PY = ROOT / "packages" / "core" / "scripts" / "chatterbox_server.py"
TEST_TEXT = "Elmas neden kolay kırılmaz? Serttir, ama yine de kırılabilir."


def load_bridge():
    spec = importlib.util.spec_from_file_location("chatterbox_server", SERVER_PY)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def analyze_wav(path: Path) -> dict:
    with wave.open(str(path), "rb") as f:
        channels = f.getnchannels()
        width = f.getsampwidth()
        rate = f.getframerate()
        frames = f.getnframes()
        raw = f.readframes(frames)
    if width != 2:
        return {"ok": False, "error": f"beklenmeyen örnek genişliği: {width}"}
    samples = memoryview(raw).cast("h")
    peak = max((abs(s) for s in samples), default=0)
    rms = (sum(float(s) * s for s in samples) / max(1, len(samples))) ** 0.5
    # Sessizlik oranı: kısa pencerelerde tepe değeri çok düşük olanlar.
    window = max(1, rate // 50)
    silent = 0
    total = 0
    for start in range(0, len(samples), window):
        chunk = samples[start : start + window]
        if not chunk:
            continue
        total += 1
        if max((abs(s) for s in chunk), default=0) < 200:
            silent += 1
    return {
        "sampleRate": rate,
        "channels": channels,
        "frames": frames,
        "durationSec": round(frames / rate, 3) if rate else 0,
        "peak": int(peak),
        "rms": round(rms, 1),
        "silenceRatio": round(silent / max(1, total), 3),
        "fullScalePeak": round(peak / 32768, 4),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", default="reports/chatterbox-turkish-sample.wav")
    ap.add_argument("--json", default="reports/chatterbox-tr.json")
    ap.add_argument("--text", default=TEST_TEXT)
    args = ap.parse_args()

    wav_path = Path(args.wav)
    json_path = Path(args.json)
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.parent.mkdir(parents=True, exist_ok=True)

    bridge = load_bridge()
    report = bridge.status_report()
    report["testText"] = args.text
    report["startedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    if not report.get("installed"):
        report.update(
            ok=False,
            outcome="not-installed",
            note=(
                "chatterbox-tts kurulu değil; Türkçe sentez YAPILMADI. Studio bu durumda Chatterbox'ı "
                "'kullanılamıyor' olarak gösterir ve yedek motoru (eSpeak NG) açıkça etiketler."
            ),
        )
        json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), "utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 3

    if not report.get("turkishSupported"):
        report.update(ok=False, outcome="turkish-unsupported", note="Kurulu paket Türkçe (tr) dil kodunu desteklemiyor.")
        json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), "utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 4

    started = time.time()
    try:
        wav_bytes = bridge.generate_wav(args.text)
    except Exception as e:  # model indirilemedi, bellek yetersiz, vb.
        message = str(e)
        hint = None
        if "watermark" in message.lower() or "setuptools" in message.lower():
            hint = "pip install setuptools (resemble-perth pkg_resources bağımlılığı)"
        report.update(
            ok=False,
            outcome="synthesis-failed",
            error=message,
            hint=hint,
            traceback=traceback.format_exc()[-4000:],
            elapsedSec=round(time.time() - started, 1),
        )
        json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), "utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 4

    wav_path.write_bytes(wav_bytes)
    elapsed = round(time.time() - started, 1)
    analysis = analyze_wav(wav_path)
    audible = analysis.get("ok", True) and analysis.get("peak", 0) > 800 and analysis.get("silenceRatio", 1) < 0.95
    report.update(
        ok=bool(audible),
        outcome="synthesized" if audible else "synthesized-but-silent",
        elapsedSec=elapsed,
        wav=str(wav_path),
        wavBytes=len(wav_bytes),
        audio=analysis,
        note=(
            "Türkçe örnek gerçekten üretildi ve dalga biçimi incelendi (sessiz/boş değil)."
            if audible
            else "Dosya üretildi ama ses seviyesi/sessizlik kontrolü başarısız — kullanılabilir kabul edilmiyor."
        ),
    )
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), "utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if audible else 4


if __name__ == "__main__":
    sys.exit(main())
