/**
 * "Karıncalar Kışın Nereye Kayboluyor?" — 60 sn'lik belgesel shorts.
 * Senaryo: kullanıcının verdiği transkript (birebir, 9 segment).
 * Bilimsel çerçeve: soğukta hareket yavaşlar, metabolizma düşer, koloni
 * yuvanın derin/sıcak bölgelerine çekilir, enerji tasarrufu + yaz stoku
 * hayatta kalmayı sağlar; ilkbaharın ısınmasıyla yuvalarından çıkarlar.
 * Not: karıncalar türlerine göre farklı kış stratejileri kullanır.
 */

export type ScriptScene = {
  id: string;
  /** Anlatım metni (kullanıcının transkripti). */
  narration: string;
  /** En tepedeki küçük etiket — 1-2 kelime, büyük değil. */
  topLabel: string;
  targetSec: number;
  audio: string;
};

export const TITLE = "Karıncalar Kışın Nereye Kayboluyor?";

export const SCENES: ScriptScene[] = [
  {
    id: "s1-hook",
    narration: "Hiç dikkat ettin mi? Yazın her yerde gördüğümüz karıncalar, kış geldiğinde bir anda nereye kayboluyor?",
    topLabel: "HER YERDE",
    targetSec: 6.7,
    audio: "s1.wav",
  },
  {
    id: "s2-kabol",
    narration: "Aslında karıncalar ortadan kaybolmuyor. Sadece yaşamlarını sürdürmek için farklı bir yönteme geçiyorlar.",
    topLabel: "KIŞ GELDİ",
    targetSec: 6.4,
    audio: "s2.wav",
  },
  {
    id: "s3-yavasliyor",
    narration: "Hava sıcaklığı düştükçe hareketleri yavaşlıyor. Çünkü soğuk havada vücutlarını hareket ettirmek ve yiyecek bulmak onlar için çok daha zor hale geliyor.",
    topLabel: "YAVAŞLIYOR",
    targetSec: 9.0,
    audio: "s3.wav",
  },
  {
    id: "s4-derinyuva",
    narration: "Bu yüzden birçok karınca türü yuvalarının daha derin ve sıcak bölümlerine çekiliyor.",
    topLabel: "DERİN YUVA",
    targetSec: 5.1,
    audio: "s4.wav",
  },
  {
    id: "s5-dinlenme",
    narration: "Burada enerji harcamalarını azaltıyor, neredeyse hareketsiz hale geliyor ve ilkbaharın gelmesini bekliyorlar.",
    topLabel: "DİNLENME",
    targetSec: 7.0,
    audio: "s5.wav",
  },
  {
    id: "s6-stok",
    narration: "Üstelik yaz boyunca topladıkları yiyecekler de bu zorlu dönemde hayatta kalmalarına yardımcı oluyor.",
    topLabel: "STOK",
    targetSec: 5.8,
    audio: "s6.wav",
  },
  {
    id: "s7-ilkbahar",
    narration: "Hava yeniden ısındığında ise karıncalar yavaş yavaş yuvalarından çıkmaya başlıyor.",
    topLabel: "İLKBAHAR",
    targetSec: 5.1,
    audio: "s7.wav",
  },
  {
    id: "s8-bekleyis",
    narration: "Yani kışın ortalıkta görmediğimiz karıncalar aslında yok olmuyor. Sadece bahara kadar sürecek uzun bir dinlenme dönemine giriyorlar.",
    topLabel: "BEKLEYİŞ",
    targetSec: 8.3,
    audio: "s8.wav",
  },
  {
    id: "s9-sicakgun",
    narration: "Bir sonraki sıcak günde onları yeniden yürürken gördüğünde, aslında nereden geldiklerini artık biliyorsun.",
    topLabel: "SICAK GÜN",
    targetSec: 6.7,
    audio: "s9.wav",
  },
];

/** Hedef minimum süre (sn). Konuşma buna geridedir — tamponlarla doldurulur. */
export const TARGET_TOTAL_SEC = 60;
