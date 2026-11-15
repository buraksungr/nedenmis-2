#!/usr/bin/env python3
"""eSpeak NG köprüsü — Nedenmiş Studio yerel (çevrimdışı) seslendirme.

Neden burada: Chatterbox Multilingual birincil motor, ancak model ağırlıkları
(~2 GB) ve PyTorch gerektirir. GPU'su olmayan/zayıf makinelerde uygulamanın
gerçekten ses üretebilmesi için libespeak-ng tabanlı bir çevrimdışı motor gerekir.
Üretilen ses gerçektir (Türkçe, anlaşılır) ancak nöral TTS değildir; robotik
tınısı vardır. Bu gerçek, videonun meta verisinde ve arayüzde açıkça belirtilir.

Gereksinim: pip install espeakng-loader
Kullanım:
  python espeak_tts.py --check
  python espeak_tts.py --text-file metin.txt --out ses.wav [--voice tr] [--wpm 165]
"""
from __future__ import annotations

import argparse
import ctypes
import os
import struct
import sys
import wave

AUDIO_OUTPUT_RETRIEVAL = 2
espeakRATE = 1
espeakVOLUME = 2
espeakPITCH = 3
espeakRANGE = 4
espeak_WORD = 3
POS_CHARACTER = 1


def load_library():
    try:
        import espeakng_loader  # type: ignore

        lib_path = str(espeakng_loader.get_library_path())
        data_path = str(espeakng_loader.get_data_path())
        lib = ctypes.CDLL(lib_path)
        return lib, data_path, "espeakng-loader"
    except Exception as loader_error:  # pragma: no cover
        # Sistemde kurulu libespeak-ng'e düş.
        last = loader_error
        for name in (
            "libespeak-ng.so.1",
            "libespeak-ng.so",
            "libespeak-ng.dylib",
            "libespeak-ng.dll",
            "espeak-ng.dll",
        ):
            try:
                lib = ctypes.CDLL(name)
                return lib, "", f"system:{name}"
            except Exception as e:  # noqa: PERF203
                last = e
        raise RuntimeError(
            "libespeak-ng bulunamadı. Kurun: pip install espeakng-loader"
        ) from last


def init_engine(lib, data_path: str) -> int:
    lib.espeak_Initialize.restype = ctypes.c_int
    lib.espeak_Initialize.argtypes = [
        ctypes.c_int,
        ctypes.c_int,
        ctypes.c_char_p,
        ctypes.c_int,
    ]
    data = data_path.encode("utf-8") if data_path else None
    rate = lib.espeak_Initialize(
        AUDIO_OUTPUT_RETRIEVAL, 0, data, 0x01 | 0x10
    )  # ESLOWAUDIO
    if rate <= 0:
        raise RuntimeError("espeak_Initialize başarısız oldu")
    return int(rate)


def synth(text: str, voice: str, wpm: int) -> tuple[bytes, int]:
    lib, data_path, source = load_library()
    rate = init_engine(lib, data_path)
    lib.espeak_SetVoiceByName.argtypes = [ctypes.c_char_p]
    rc = lib.espeak_SetVoiceByName(voice.encode("utf-8"))
    if rc != 0:
        raise RuntimeError(f"Ses bulunamadı: {voice} (kaynak: {source})")
    lib.espeak_SetParameter(espeakRATE, int(wpm), 0)
    lib.espeak_SetParameter(espeakPITCH, 48, 0)
    lib.espeak_SetParameter(espeakVOLUME, 100, 0)

    chunks: list[bytes] = []
    CB = ctypes.CFUNCTYPE(
        ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p
    )

    def _cb(wav, n_samples, events):
        if n_samples > 0 and wav:
            chunks.append(bytes(bytearray(ctypes.string_at(wav, n_samples * 2))))
        return 0

    cb = CB(_cb)
    lib.espeak_SetSynthCallback(cb)
    lib.espeak_Synth.argtypes = [
        ctypes.c_char_p,
        ctypes.c_size_t,
        ctypes.c_uint,
        ctypes.c_int,
        ctypes.c_uint,
        ctypes.c_uint,
        ctypes.c_void_p,
        ctypes.c_void_p,
        ctypes.c_void_p,
    ]
    payload = text.encode("utf-8")
    rc = lib.espeak_Synth(
        payload, len(payload) + 1, 0, POS_CHARACTER, 0, 0, None, None, None
    )
    if rc != 0:
        raise RuntimeError(f"espeak_Synth hatası: {rc}")
    lib.espeak_Synchronize()
    pcm = b"".join(chunks)
    if len(pcm) < 2000:
        raise RuntimeError("Ses üretilemedi (boş çıktı)")
    return pcm, rate


def write_wav(path: str, pcm: bytes, rate: int) -> float:
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)
    return len(pcm) / 2.0 / rate


def main() -> int:
    ap = argparse.ArgumentParser(description="Nedenmiş Studio eSpeak NG köprüsü")
    ap.add_argument("--check", action="store_true", help="Kurulumu doğrula")
    ap.add_argument("--text-file")
    ap.add_argument("--out")
    ap.add_argument("--voice", default="tr")
    ap.add_argument("--wpm", type=int, default=165)
    args = ap.parse_args()

    if args.check:
        try:
            lib, data_path, source = load_library()
            rate = init_engine(lib, data_path)
            lib.espeak_SetVoiceByName.argtypes = [ctypes.c_char_p]
            rc = lib.espeak_SetVoiceByName(args.voice.encode("utf-8"))
            if rc != 0:
                print(f"Ses yok: {args.voice}", file=sys.stderr)
                return 2
            print(f"espeak-ng OK ({source}), {rate} Hz, ses={args.voice}")
            return 0
        except Exception as e:
            print(f"HATA: {e}", file=sys.stderr)
            return 1

    if not args.text_file or not args.out:
        print("--text-file ve --out gerekli", file=sys.stderr)
        return 2
    with open(args.text_file, "r", encoding="utf-8") as f:
        text = f.read().strip()
    pcm, rate = synth(text, args.voice, args.wpm)
    dur = write_wav(args.out, pcm, rate)
    print(f"{args.out} ({dur:.2f} sn, {rate} Hz)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
