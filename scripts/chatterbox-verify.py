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
import struct
import sys
import time
import traceback
from pathlib import Path

# Windows konsolu varsayılan olarak cp1252 kullanır; Türkçe karakter basınca
# UnicodeEncodeError ile çöker. Çıktıyı her zaman UTF-8'e sabitle.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    except Exception:
        pass

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
    """WAV'ı biçimden bağımsız çözümler.

    Chatterbox/torchaudio çıktısı IEEE float32 (wFormatTag=3) olabilir; Python'un
    `wave` modülü bunu okuyamaz. Burada RIFF başlığı doğrudan ayrıştırılır.
    """
    data = path.read_bytes()
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ValueError("geçerli bir RIFF/WAVE dosyası değil")
    pos = 12
    fmt = None
    payload = None
    while pos + 8 <= len(data):
        chunk_id = data[pos : pos + 4]
        size = struct.unpack("<I", data[pos + 4 : pos + 8])[0]
        body = data[pos + 8 : pos + 8 + size]
        if chunk_id == b"fmt ":
            fmt = body
        elif chunk_id == b"data":
            payload = body
            break
        pos += 8 + size + (size & 1)
    if fmt is None or payload is None:
        raise ValueError("fmt/data bölümü bulunamadı")
    tag, channels, rate, _byte_rate, _block_align, bits = struct.unpack("<HHIIHH", fmt[:16])

    if tag == 3 and bits == 32:
        raw = struct.unpack(f"<{len(payload) // 4}f", payload)
        fmt_name = "float32"
    elif tag == 1 and bits == 16:
        raw = [v / 32768.0 for v in struct.unpack(f"<{len(payload) // 2}h", payload)]
        fmt_name = "pcm16"
    elif tag == 1 and bits == 32:
        raw = [v / 2147483648.0 for v in struct.unpack(f"<{len(payload) // 4}i", payload)]
        fmt_name = "pcm32"
    elif tag == 1 and bits == 24:
        count = len(payload) // 3
        raw = []
        for i in range(count):
            b = payload[i * 3 : i * 3 + 3]
            v = int.from_bytes(b + (b"\xff" if b[2] & 0x80 else b"\x00"), "little", signed=True)
            raw.append(v / 8388608.0)
        fmt_name = "pcm24"
    else:
        raise ValueError(f"desteklenmeyen WAV biçimi: tag={tag} bits={bits}")

    total = len(raw)
    frames = total // max(1, channels)
    duration = frames / rate if rate else 0
    peak = max((abs(v) for v in raw), default=0.0)
    rms = (sum(v * v for v in raw) / max(1, total)) ** 0.5
    # Sessizlik: 20 ms pencerelerde tepe < -60 dBFS
    window = max(1, int(rate * 0.02) * channels)
    silent = 0
    windows = 0
    for start in range(0, total, window):
        chunk = raw[start : start + window]
        if not chunk:
            continue
        windows += 1
        if max((abs(v) for v in chunk), default=0.0) < 0.001:
            silent += 1
    return {
        "ok": True,
        "format": fmt_name,
        "formatTag": tag,
        "bitsPerSample": bits,
        "sampleRate": rate,
        "channels": channels,
        "frames": frames,
        "durationSec": round(duration, 3),
        "peak": round(peak, 4),
        "rms": round(rms, 4),
        "silenceRatio": round(silent / max(1, windows), 3),
        "clippingRatio": round(sum(1 for v in raw if abs(v) >= 0.999) / max(1, total), 5),
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
    try:
        analysis = analyze_wav(wav_path)
    except Exception as e:
        analysis = {
            "ok": False,
            "error": f"WAV çözümlenemedi: {e}",
            "traceback": traceback.format_exc()[-1500:],
            "wavBytes": len(wav_bytes),
        }

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

    audio_ok = bool(analysis.get("ok")) and analysis.get("peak", 0) > 0.02 and analysis.get("silenceRatio", 1) < 0.95
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
