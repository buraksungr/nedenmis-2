// OTOMATİK ÜRETİLDİ — scripts/make-timeline.ts (elle düzenleme)
// Toplam: 1800 kare = 60.00 sn, ${FPS} fps.
export type TimelineEntry = {
  id: string;
  start: number;
  duration: number;
  narration: string;
  caption: string;
  sub?: string;
  audio: string | null;
  kind: "narrated" | "card";
  audioSec: number;
};

export const FPS = 30;
export const TOTAL_FRAMES = 1800;
export const TIMELINE: TimelineEntry[] = [
  {
    "id": "s1-hook",
    "start": 0,
    "duration": 103,
    "narration": "Yazın her yerdesiniz. Kışın... neredesiniz?",
    "caption": "HER YERDEYLER",
    "audio": "s1.wav",
    "kind": "narrated",
    "audioSec": 3.19
  },
  {
    "id": "s2-merak",
    "start": 103,
    "duration": 132,
    "narration": "Hepsi ölüyor olabilir mi? Yoksa saklanacakları bir yer mi var?",
    "caption": "KIŞ GELDİ!",
    "audio": "s2.wav",
    "kind": "narrated",
    "audioSec": 4.15
  },
  {
    "id": "s3-sogukkanli",
    "start": 235,
    "duration": 199,
    "narration": "Cevap, toprağın altında. Karıncalar soğuk kanlıdır; vücut sıcaklıkları hava ile birlikte değişir.",
    "caption": "SOĞUK KANLI",
    "audio": "s3.wav",
    "kind": "narrated",
    "audioSec": 6.39
  },
  {
    "id": "s4-metabolizma",
    "start": 434,
    "duration": 190,
    "narration": "Sıcaklık düştükçe metabolizmaları yavaşlar, kasları çalışmaz ve adeta taşlaşırlar.",
    "caption": "METABOLİZMA YAVAŞLIYOR",
    "audio": "s4.wav",
    "kind": "narrated",
    "audioSec": 6.07
  },
  {
    "id": "s5-sekilme",
    "start": 624,
    "duration": 151,
    "narration": "Bu yüzden koloniler, yuvanın en derin ve en sıcak bölgelerine çekilir.",
    "caption": "YERALTI SIĞINAĞI",
    "audio": "s5.wav",
    "kind": "narrated",
    "audioSec": 4.79
  },
  {
    "id": "s6-derinlik",
    "start": 775,
    "duration": 209,
    "narration": "Yuvanın derinliklerindeki sıcaklık, dışarıdaki donmuş toprakla karşılaştırılamayacak kadar yumuşaktır.",
    "caption": "DERİN = SICAK",
    "audio": "s6.wav",
    "kind": "narrated",
    "audioSec": 6.71
  },
  {
    "id": "s7-kralice",
    "start": 984,
    "duration": 180,
    "narration": "Kışın kraliçe duraklar ve yumurta bırakmaz. İşçiler onun etrafında sıkı bir küme yapar.",
    "caption": "KRALİÇE DURUR",
    "audio": "s7.wav",
    "kind": "narrated",
    "audioSec": 5.75
  },
  {
    "id": "s8-kume",
    "start": 1164,
    "duration": 122,
    "narration": "Küme, birbirlerinin ısısını korur; nem de yuvada tutulur.",
    "caption": "KÜME = ISI",
    "audio": "s8.wav",
    "kind": "narrated",
    "audioSec": 3.83
  },
  {
    "id": "s9-turler",
    "start": 1286,
    "duration": 209,
    "narration": "Ama dikkat: tüm karıncalar aynı şekilde kışlamaz. Bazıları karın altında bile çalışmaya devam eder.",
    "caption": "HER TÜR AYNI DEĞİL",
    "audio": "s9.wav",
    "kind": "narrated",
    "audioSec": 6.71
  },
  {
    "id": "s10-ilkbahar",
    "start": 1495,
    "duration": 190,
    "narration": "İlkbahar toprağı ısıtınca karıncalar yeniden uyanır... ve her yer, bir anda dolup taşar.",
    "caption": "İLKBAHAR GELİYOR!",
    "audio": "s10.wav",
    "kind": "narrated",
    "audioSec": 6.07
  },
  {
    "id": "s11-kapanis",
    "start": 1685,
    "duration": 115,
    "narration": "",
    "caption": "ÖLMEDİLER",
    "sub": "sadece birlikte beklediler",
    "audio": null,
    "kind": "card",
    "audioSec": 0
  }
];
