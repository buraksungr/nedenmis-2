/**
 * "Karıncalar Kışın Neden Ortadan Kaybolur?" — 60 sn'lik belgesel shorts senaryosu.
 *
 * Bilimsel çerçeve (doğrulanmış):
 * - Karıncalar ektoterm (soğuk kanlı) hayvanlardır; vücut sıcaklıkları çevreye bağlıdır.
 * - Sıcaklık düştükçe metabolizma hızı (Q10 etkisi) ve kas aktivitesi azalır, hareket yavaşlar.
 * - Tempersiz (ılıman) türler kışın yuvanın daha derin, sıcaklığı daha sabit bölgelerine çekilir;
 *   kraliçe yumurta bırakmaz, işçiler kraliçe etrafında küme oluşturur.
 * - Küme, birey arası ısı kaybını azaltır; yuva içi nem ve CO2 dengesi korunur.
 * - Tüm türler aynı şekilde kışlamaz: bazı türler kar altının altında (subnival) aktif kalır,
 *   bazılarının kraliçesi yalnız kışlar, bazıları için kış etkisi yoktur (tropikal).
 * - İlkbahar toprak sıcaklığının yükselmesiyle aktivite yeniden başlar.
 */

export type ScriptScene = {
  id: string;
  /** Anlatım metni (Türkçe). */
  narration: string;
  /** Ekrandaki büyük kelime/kısa ifade. */
  caption: string;
  /** Sahne başına düşen hedef süre (sn) — TTS ölçüsüyle berni güncellenir. */
  targetSec: number;
  /** Seslendirme dosyası (audio/ altında). Sadece kapanış kartı için null. */
  audio: string | null;
  /** Kapanış kartı gibi ek alt başlık. */
  sub?: string;
  /** Sahne türü: narrated | card */
  kind: "narrated" | "card";
};

export const TITLE = "Karıncalar Kışın Neden Ortadan Kaybolur?";

export const SCENES: ScriptScene[] = [
  {
    id: "s1-hook",
    narration: "Yazın her yerdesiniz. Kışın... neredesiniz?",
    caption: "HER YERDEYLER",
    targetSec: 3.5,
    audio: "s1.wav",
    kind: "narrated",
  },
  {
    id: "s2-merak",
    narration: "Hepsi ölüyor olabilir mi? Yoksa saklanacakları bir yer mi var?",
    caption: "KIŞ GELDİ!",
    targetSec: 5.5,
    audio: "s2.wav",
    kind: "narrated",
  },
  {
    id: "s3-sogukkanli",
    narration: "Cevap, toprağın altında. Karıncalar soğuk kanlıdır; vücut sıcaklıkları hava ile birlikte değişir.",
    caption: "SOĞUK KANLI",
    targetSec: 6.0,
    audio: "s3.wav",
    kind: "narrated",
  },
  {
    id: "s4-metabolizma",
    narration: "Sıcaklık düştükçe metabolizmaları yavaşlar, kasları çalışmaz ve adeta taşlaşırlar.",
    caption: "METABOLİZMA YAVAŞLIYOR",
    targetSec: 5.5,
    audio: "s4.wav",
    kind: "narrated",
  },
  {
    id: "s5-sekilme",
    narration: "Bu yüzden koloniler, yuvanın en derin ve en sıcak bölgelerine çekilir.",
    caption: "YERALTI SIĞINAĞI",
    targetSec: 5.0,
    audio: "s5.wav",
    kind: "narrated",
  },
  {
    id: "s6-derinlik",
    narration: "Yuvanın derinliklerindeki sıcaklık, dışarıdaki donmuş toprakla karşılaştırılamayacak kadar yumuşaktır.",
    caption: "DERİN = SICAK",
    targetSec: 5.5,
    audio: "s6.wav",
    kind: "narrated",
  },
  {
    id: "s7-kralice",
    narration: "Kışın kraliçe duraklar ve yumurta bırakmaz. İşçiler onun etrafında sıkı bir küme yapar.",
    caption: "KRALİÇE DURUR",
    targetSec: 6.0,
    audio: "s7.wav",
    kind: "narrated",
  },
  {
    id: "s8-kume",
    narration: "Küme, birbirlerinin ısısını korur; nem de yuvada tutulur.",
    caption: "KÜME = ISI",
    targetSec: 4.5,
    audio: "s8.wav",
    kind: "narrated",
  },
  {
    id: "s9-turler",
    narration: "Ama dikkat: tüm karıncalar aynı şekilde kışlamaz. Bazıları karın altında bile çalışmaya devam eder.",
    caption: "HER TÜR AYNI DEĞİL",
    targetSec: 6.5,
    audio: "s9.wav",
    kind: "narrated",
  },
  {
    id: "s10-ilkbahar",
    narration: "İlkbahar toprağı ısıtınca karıncalar yeniden uyanır... ve her yer, bir anda dolup taşar.",
    caption: "İLKBAHAR GELİYOR!",
    targetSec: 6.0,
    audio: "s10.wav",
    kind: "narrated",
  },
  {
    // Not: bu sahne sessizdir; 10 klip/kısa anlatım üretim sınırı nedeniyle
    // kapanış cümlesi tipografi kartı olarak ekrana gelir.
    id: "s11-kapanis",
    narration: "",
    caption: "ÖLMEDİLER",
    sub: "sadece birlikte beklediler",
    targetSec: 6.0,
    audio: null,
    kind: "card",
  },
];

export const TARGET_TOTAL_SEC = 60;
