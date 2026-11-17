// OTOMATİK ÜRETİLDİ — scripts/make-timeline.ts (elle düzenleme)
// Toplam: 1873 kare = 62.43 sn, ${FPS} fps.
// Giriş 0.45s + 9 sahne (konuşma + 0.18s nefes) + sonda 0.3s.
export type TimelineEntry = {
  id: string;
  start: number;
  duration: number;
  narration: string;
  topLabel: string;
  audio: string;
  audioSec: number;
};

export const FPS = 30;
export const TOTAL_FRAMES = 1873;
export const TOTAL_SEC = 62.433;
export const TIMELINE: TimelineEntry[] = [
  {
    "id": "s1-hook",
    "start": 14,
    "duration": 207,
    "narration": "Hiç dikkat ettin mi? Yazın her yerde gördüğümüz karıncalar, kış geldiğinde bir anda nereye kayboluyor?",
    "topLabel": "HER YERDE",
    "audio": "s1.wav",
    "audioSec": 6.71
  },
  {
    "id": "s2-kabol",
    "start": 221,
    "duration": 197,
    "narration": "Aslında karıncalar ortadan kaybolmuyor. Sadece yaşamlarını sürdürmek için farklı bir yönteme geçiyorlar.",
    "topLabel": "KIŞ GELDİ",
    "audio": "s2.wav",
    "audioSec": 6.39
  },
  {
    "id": "s3-yavasliyor",
    "start": 418,
    "duration": 274,
    "narration": "Hava sıcaklığı düştükçe hareketleri yavaşlıyor. Çünkü soğuk havada vücutlarını hareket ettirmek ve yiyecek bulmak onlar için çok daha zor hale geliyor.",
    "topLabel": "YAVAŞLIYOR",
    "audio": "s3.wav",
    "audioSec": 8.95
  },
  {
    "id": "s4-derinyuva",
    "start": 692,
    "duration": 159,
    "narration": "Bu yüzden birçok karınca türü yuvalarının daha derin ve sıcak bölümlerine çekiliyor.",
    "topLabel": "DERİN YUVA",
    "audio": "s4.wav",
    "audioSec": 5.11
  },
  {
    "id": "s5-dinlenme",
    "start": 851,
    "duration": 216,
    "narration": "Burada enerji harcamalarını azaltıyor, neredeyse hareketsiz hale geliyor ve ilkbaharın gelmesini bekliyorlar.",
    "topLabel": "DİNLENME",
    "audio": "s5.wav",
    "audioSec": 7.03
  },
  {
    "id": "s6-stok",
    "start": 1067,
    "duration": 178,
    "narration": "Üstelik yaz boyunca topladıkları yiyecekler de bu zorlu dönemde hayatta kalmalarına yardımcı oluyor.",
    "topLabel": "STOK",
    "audio": "s6.wav",
    "audioSec": 5.75
  },
  {
    "id": "s7-ilkbahar",
    "start": 1245,
    "duration": 159,
    "narration": "Hava yeniden ısındığında ise karıncalar yavaş yavaş yuvalarından çıkmaya başlıyor.",
    "topLabel": "İLKBAHAR",
    "audio": "s7.wav",
    "audioSec": 5.11
  },
  {
    "id": "s8-bekleyis",
    "start": 1404,
    "duration": 255,
    "narration": "Yani kışın ortalıkta görmediğimiz karıncalar aslında yok olmuyor. Sadece bahara kadar sürecek uzun bir dinlenme dönemine giriyorlar.",
    "topLabel": "BEKLEYİŞ",
    "audio": "s8.wav",
    "audioSec": 8.31
  },
  {
    "id": "s9-sicakgun",
    "start": 1659,
    "duration": 214,
    "narration": "Bir sonraki sıcak günde onları yeniden yürürken gördüğünde, aslında nereden geldiklerini artık biliyorsun.",
    "topLabel": "SICAK GÜN",
    "audio": "s9.wav",
    "audioSec": 6.71
  }
];
