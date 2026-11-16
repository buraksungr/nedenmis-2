#!/usr/bin/env python3
"""Chatterbox Türkçe sentez doğrulaması (gerçek sentez, gerçek WAV).

Bu betik modelin gerçekten çalıştığını kanıtlar; çalışmıyorsa bunu açıkça yazar.
Hiçbir koşulda "başarılı" taklidi yapmaz ve HER durumda bir JSON rapor bırakır
(çökme dahil), böylece yayına bayat bir sonuç taşınmaz.

Kullanım:
  python scripts/chatterbox-verify.py \
      --wav reports/chatterbox-turkish-sample.wav \
      --json reports/chatterbox-tr.json

Çıkış kodları:
  0  Türkçe WAV üretildi ve doğrulandı
  3  chatterbox-tts kurulu değil (sentez yapılmadı)
  4  kurulu ama sentez başarısız / ses kullanılabilir değil
  5  beklenmeyen çökme (rapor yine yazılır)
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import time
import traceback
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVER_PY = ROOT / "packages" / "core" / "scripts" / "chatterbox_server.py"
TEST_TEXT = "Elmas neden kolay kırılmaz? Serttir, ama yine de kırılabilir."
# Kısa ikinci cümle: ikinci (sıcak) sentezin süresini ölçmek için.
WARM_TEXT = "Gökyüzü mavidir."


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
    duration = frames / rate if rate else 0
    return {
        "ok": True,
        "sampleRate": rate,
        "channels": channels,
        "frames": frames,
        "durationSec": round(duration, 3),
        "peak": int(peak),
        "rms": round(rms, 1),
        "silenceRatio": round(silent / max(1, total), 3),
        "fullScalePeak": round(peak / 32768, 4),
    }


def words(text: str) -> int:
    return len([w for w in text.replace("?", " ").replace(".", " ").split() if w.strip()])


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), "utf-8")


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
        write_json(json_path, report)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 3

    if not report.get("turkishSupported"):
        report.update(ok=False, outcome="turkish-unsupported", note="Kurulu paket Türkçe (tr) dil kodunu desteklemiyor.")
        write_json(json_path, report)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 4

    # --- soğuk sentez (model indirme + yükleme dahil) ---
    started = time.time()
    try:
        wav_bytes = bridge.generate_wav(args.text)
    except Exception as e:
        message = str(e)
        hint = None
        if "watermark" in message.lower() or "pkg_resources" in message.lower():
            hint = 'pip install "setuptools<81" (resemble-perth pkg_resources bağımlılığı)'
        report.update(
            ok=False,
            outcome="synthesis-failed",
            error=message,
            hint=hint,
            traceback=traceback.format_exc()[-4000:],
            elapsedSec=round(time.time() - started, 1),
        )
        write_json(json_path, report)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 4

    cold_elapsed = round(time.time() - started, 1)
    wav_path.write_bytes(wav_bytes)
    analysis = analyze_wav(wav_path)

    # --- sıcak sentez (model bellekteyken gerçek çıkarım süresi) ---
    warm_elapsed = None
    warm_rtf = None
    try:
        warm_started = time.time()
        warm_bytes = bridge.generate_wav(WARM_TEXT)
        warm_elapsed = round(time.time() - warm_started, 1)
        warm_path = wav_path.with_name("chatterbox-turkish-warm.wav")
        warm_path.write_bytes(warm_bytes)
        warm_analysis = analyze_wav(warm_path)
        if warm_analysis.get("durationSec"):
            warm_rtf = round(warm_elapsed / warm_analysis["durationSec"], 2)
        report["warm"] = {
            "text": WARM_TEXT,
            "elapsedSec": warm_elapsed,
            "audio": warm_analysis,
            "realtimeFactor": warm_rtf,
            "wav": str(warm_path),
        }
    except Exception as e:  # sıcak sentez başarısızsa soğuk sonucu geçersiz saymayız, ama yazarız
        report["warm"] = {"error": str(e), "traceback": traceback.format_exc()[-2000:]}

    audio_ok = bool(analysis.get("ok")) and analysis.get("peak", 0) > 800 and analysis.get("silenceRatio", 1) < 0.95
    # Konuşma hızı: Türkçe anlatım için makul aralık ~1.6-3.4 kelime/sn.
    duration = analysis.get("durationSec") or 0
    wps = round(words(args.text) / duration, 2) if duration else None
    plausible_rate = bool(wps and 1.2 <= wps <= 4.2)

    if warm_rtf is None:
        feasibility = "ölçülemedi"
    elif warm_rtf <= 1.0:
        feasibility = "gerçek zamandan hızlı — CPU'da pratik"
    elif warm_rtf <= 3.0:
        feasibility = "gerçek zamanın 1-3 katı — CPU'da kullanılabilir (30 sn anlatım ~%s sn)" % round(30 * warm_rtf)
    else:
        feasibility = "gerçek zamanın %s katı — CPU'da pratik değil" % warm_rtf

    report.update(
        ok=audio_ok and plausible_rate,
        outcome="synthesized" if (audio_ok and plausible_rate) else "synthesized-but-unusable",
        elapsedSec=cold_elapsed,
        coldElapsedSec=cold_elapsed,
        wav=str(wav_path),
        wavBytes=len(wav_bytes),
        audio=analysis,
        wordsPerSecond=wps,
        ratePlausible=plausible_rate,
        cpuFeasibility=feasibility,
        note=(
            "Türkçe örnek gerçekten üretildi ve dalga biçimi incelendi (sessiz/boş değil). "
            "Telaffuz ve doğallık ancak dinlenerek onaylanır; WAV yayına eklenir."
            if audio_ok and plausible_rate
            else "Dosya üretildi ancak ses seviyesi/sessizlik/konuşma hızı kontrolü başarısız — kullanılabilir kabul edilmiyor."
        ),
    )
    write_json(json_path, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 4


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception:  # beklenmeyen çökme: rapor yine de yazılsın
        payload = {
            "ok": False,
            "outcome": "crashed",
            "error": "doğrulama betiği beklenmeyen bir hatayla durdu",
            "traceback": traceback.format_exc()[-4000:],
            "finishedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        try:
            target = Path("reports/chatterbox-tr.json")
            target.parent.mkdir(parents=True, exist_ok=True)
            write_json(target, payload)
        except Exception:
            pass
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        sys.exit(5)
