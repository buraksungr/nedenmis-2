import type { KnowledgeCard, SourceRef } from "./types.js";

const S = (id: string, title: string, publisher: string, url: string, kind: SourceRef["kind"], noteTr?: string): SourceRef => ({
  id,
  title,
  publisher,
  url,
  kind,
  noteTr,
});

/**
 * Bilgi kartları.
 *
 * Her kart: doğrulanmış bilimsel özet + kavram listesi + sahne adımları +
 * gerçek kaynak referansları + yasak kavramlar (ör. elmasta hücre) içerir.
 * Anlatım metinleri bu kartlardan üretilir; model uydurma bilgi eklemez.
 */
export const CARDS_A: KnowledgeCard[] = [
  {
    id: "diamond-hardness",
    topicTitleTr: "Elmas neden kolay kırılmaz?",
    aliases: [
      "elmas", "elmaslar", "elmasın", "elmas neden kırılmaz", "elmas neden kolay kırılmaz",
      "elmas neden zor kırılır", "elmasın sertliği", "elmas neden sert", "elmas neden kırılgan",
      "elmas kırılır mı", "diamond", "diamond hardness", "elmas neden kolay kırılmaz?",
    ],
    domains: ["materials", "chemistry", "physics"],
    summaryTr:
      "Elmas, her karbon atomunun dört karbon atomuna kovalent bağlarla bağlandığı üç boyutlu bir kristal örgüdür (dörtyüzlü yapı). Bu bağ ağı ona çok yüksek sertlik (çizilmeye karşı direnç) kazandırır; Mohs ölçeğinde 10 ile en sert doğal mineraldir. Ancak sertlik ile tokluk (kırılmaya karşı dayanıklılık) farklı özelliklerdir: elmas gevrektir. Kristal belirli düzlemlerde (111 dilimlenme düzlemleri) daha zayıf olduğu için darbe altında çatlak bu düzlemleri izleyerek hızla ilerler ve elmas ani biçimde kırılabilir.",
    concepts: [
      "carbon_atom", "covalent_bond", "tetrahedral_lattice", "hardness", "brittleness",
      "cleavage_plane", "crack_propagation", "mechanical_stress", "toughness", "energy",
    ],
    forbiddenConcepts: ["cell", "cell_membrane", "mitochondrion", "neuron", "chloroplast", "atp", "cristae"],
    misconceptions: [
      { claim: "Elmas hiç kırılmaz.", correction: "Elmas çok serttir ama gevrektir; darbe ile kırılabilir." },
      { claim: "Sertlik ve dayanıklılık aynı şeydir.", correction: "Sertlik çizilmeye, tokluk kırılmaya karşı dirençtir." },
      { claim: "Elmasın kırılması atomların kaynamasıdır.", correction: "Kırılma, kovalent bağların belirli düzlemlerde kopmasıdır." },
    ],
    sources: [
      S("src-diamond-wiki", "Diamond", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Diamond", "encyclopedia", "Kristal yapı, sertlik ve dilimlenme"),
      S("src-mohs", "Mohs scale of mineral hardness", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Mohs_scale", "encyclopedia", "Elmasın 10. derece sertliği"),
      S("src-cleavage", "Cleavage (crystal)", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Cleavage_(crystal)", "encyclopedia", "Dilimlenme düzlemleri"),
      S("src-diamond-gem", "Diamond", "Gemological Institute of America", "https://www.gia.edu/diamond", "institution", "Elmasın sertlik ve dayanıklılık özellikleri"),
    ],
    facts: [
      { id: "f-d1", textTr: "Elmas, karbon atomlarının dörtyüzlü (tetrahedral) kovalent ağ oluşturduğu bir kristaldir.", concepts: ["carbon_atom", "covalent_bond", "tetrahedral_lattice"], sourceIds: ["src-diamond-wiki"], certainty: "established" },
      { id: "f-d2", textTr: "Elmas Mohs sertlik ölçeğinde 10 değerindedir; en sert doğal mineraldir.", concepts: ["hardness"], sourceIds: ["src-mohs"], certainty: "established" },
      { id: "f-d3", textTr: "Elmasın dilimlenme düzlemleri zayıf bağ yoğunluğuna sahiptir; kırılma bu düzlemleri izler.", concepts: ["cleavage_plane", "crack_propagation"], sourceIds: ["src-cleavage"], certainty: "established" },
      { id: "f-d4", textTr: "Sertlik çizilmeye karşı direnç, tokluk ise kırılmadan önce soğurulan enerjidir; elmas sert ama gevrektir.", concepts: ["hardness", "toughness", "brittleness"], sourceIds: ["src-diamond-gem"], certainty: "strong" },
    ],
    steps: [
      {
        id: "d-1", mechanism: "crystal_lattice", overlay: "ELMASIN SIRRI",
        narration: "Elmas dünyanın en sert doğal maddesi. Peki neden sert olduğu kadar kolay da kırılabiliyor?",
        narrationSimple: "Elmas, dünyada bilinen en sert doğal madde. Peki neden bu kadar sert? Ve neden yine de kırılabiliyor?",
        concepts: ["carbon_atom", "tetrahedral_lattice", "hardness"],
        params: { atomLabel: "karbon", bondLabel: "kovalent bağ", latticeLabel: "dörtyüzlü örgü", focus: "lattice" },
        minDuration: 5,
      },
      {
        id: "d-2", mechanism: "bond_network", overlay: "KOVALENT BAĞLAR",
        overlaySimple: "ÇOK GÜÇLÜ BAĞLAR",
        narration: "Her karbon atomu dört komşusuna kovalent bağla bağlanır. Bu bağlar elektron paylaşımıyla kurulan çok güçlü bağlardır.",
        narrationSimple: "Elmasın içindeki karbon atomları birbirine çok sıkı tutunur. Her atom, dört komşusuna birden bağlıdır. Bu yüzden ağ gibi bir yapı oluşur.",
        concepts: ["carbon_atom", "covalent_bond", "tetrahedral_lattice"],
        params: { atomLabel: "C", bondLabel: "kovalent bağ", bonds: 4, mode: "tetrahedral" },
        minDuration: 5,
      },
      {
        id: "d-3", mechanism: "hardness_measure", overlay: "SERTLİK",
        narration: "Bu sıkı ağ, yüzeyin çizilmeye karşı direncini yani sertliği olağanüstü artırır. Elmas Mohs ölçeğinde on değerindedir.",
        narrationSimple: "Bu sıkı düzen sayesinde elması çizmek çok zordur. Sertlik sıralamasında en üstte yer alır.",
        concepts: ["hardness", "carbon_atom", "covalent_bond"],
        params: { scale: "mohs", value: 10, probeLabel: "çizme ucu" },
        minDuration: 4,
      },
      {
        id: "d-4", mechanism: "brittleness_compare", overlay: "GEVREKLİK",
        overlaySimple: "SERT AMA KIRILGAN",
        narration: "Ama sertlik, kırılmaya dayanıklılık demek değildir. Elmas gevrektir; yani kırılmadan önce çok az esneyebilir.",
        narrationSimple: "Ama sert olmak, kırılmaz olmak demek değil. Elmas serttir; yine de darbeyle çatlayabilir.",
        concepts: ["brittleness", "toughness", "hardness"],
        params: { leftLabel: "sertlik: yüksek", rightLabel: "tokluk: düşük" },
        minDuration: 5,
      },
      {
        id: "d-5", mechanism: "cleavage_fracture", overlay: "DİLİMLENME DÜZLEMİ",
        overlaySimple: "ZAYIF HATLAR",
        narration: "Kristal, belirli düzlemlerde daha zayıftır. Bir darbe çatlak başlatırsa, çatlak bu düzlemi izleyerek çok hızlı ilerler.",
        narrationSimple: "Elmasın içinde bazı düzlemler daha zayıftır. Bir darbe çatlak başlatırsa, çatlak o zayıf hattı izleyip hızla ilerler.",
        concepts: ["cleavage_plane", "crack_propagation", "mechanical_stress"],
        params: { planeLabel: "dilimlenme düzlemi", crackLabel: "çatlak", stressLabel: "darbe" },
        minDuration: 5,
      },
      {
        id: "d-6", mechanism: "hardness_compare_summary", overlay: "İKİ FARKLI ÖZELLİK", optional: true,
        narration: "Yani elması sert yapan şey elması kırılmaz yapmaz. Sertlik ve gevreklik, aynı kristalin iki ayrı özelliğidir.",
        narrationSimple: "Yani elması sert yapan yapı, onu kırılmaz yapmıyor. Sertlik ve kırılganlık aynı taşın iki ayrı özelliği.",
        concepts: ["hardness", "brittleness", "tetrahedral_lattice"],
        params: { leftLabel: "sert", rightLabel: "gevrek" },
        minDuration: 5,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "sky-blue",
    topicTitleTr: "Gökyüzü neden mavi?",
    aliases: [
      "gökyüzü", "gökyüzü neden mavi", "gökyüzü neden mavidir", "sema neden mavi", "sky blue",
      "gökyüzü rengi", "neden gökyüzü mavi", "gün batımı neden kırmızı", "gökyüzü neden mavi?",
    ],
    domains: ["physics", "earth", "chemistry"],
    summaryTr:
      "Güneş ışığı tüm görünür dalga boylarını içerir. Atmosferdeki azot ve oksijen molekülleri, ışığı Rayleigh saçılmasıyla saçar: saçılma şiddeti dalga boyunun dördüncü kuvvetiyle ters orantılıdır. Mavi ışığın dalga boyu kırmızıdan kısa olduğu için yaklaşık 5-6 kat daha fazla saçılır ve gökyüzünün her yönünden gözümüze ulaşır. Güneş ufka yaklaştığında ışık atmosferde daha uzun yol alır; mavi ışık yolda saçılıp dağıldığı için geriye kırmızı-turuncu tonlar kalır. Mor ışık daha da kısa dalga boyludur ama güneş ışığında daha az bulunur ve gözümüz maviye daha duyarlıdır.",
    concepts: ["sunlight", "atmosphere", "gas_molecule", "rayleigh_scattering", "wavelength", "spectrum", "observer", "horizon_path", "photon", "light"],
    forbiddenConcepts: ["cell", "mitochondrion", "tetrahedral_lattice", "covalent_bond", "tectonic_plate", "black_hole"],
    misconceptions: [
      { claim: "Gökyüzü, denizin yansıması olduğu için mavidir.", correction: "Gökyüzünün maviliği atmosferdeki Rayleigh saçılmasından kaynaklanır." },
      { claim: "Gökyüzü mavidir çünkü atmosferdeki oksijen mavidir.", correction: "Gazlar renksizdir; mavi görünüm saçılma farkından doğar." },
    ],
    sources: [
      S("src-rayleigh", "Rayleigh scattering", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Rayleigh_scattering", "encyclopedia", "1/λ⁴ bağımlılığı"),
      S("src-diffuse-sky", "Diffuse sky radiation", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Diffuse_sky_radiation", "encyclopedia", "Gökyüzü parlaklığı ve gün batımı"),
      S("src-noaa-sky", "Why is the sky blue?", "NOAA SciJinks", "https://scijinks.gov/blue-sky/", "agency", "Kurumsal açıklama"),
      S("src-hyperphysics", "Blue Sky and Rayleigh Scattering", "Georgia State University — HyperPhysics", "http://hyperphysics.phy-astr.gsu.edu/hbase/atmos/blusky.html", "university", "Saçılma şiddeti"),
    ],
    facts: [
      { id: "f-s1", textTr: "Rayleigh saçılmasında saçılan şiddet dalga boyunun dördüncü kuvvetiyle ters orantılıdır.", concepts: ["rayleigh_scattering", "wavelength"], sourceIds: ["src-rayleigh"], certainty: "established" },
      { id: "f-s2", textTr: "Mavi ışığın dalga boyu yaklaşık 450 nm, kırmızı ışığınki yaklaşık 700 nm'dir.", concepts: ["wavelength", "spectrum"], sourceIds: ["src-hyperphysics"], certainty: "established" },
      { id: "f-s3", textTr: "Gün batımında ışık atmosferde daha uzun yol alır; mavi ışık saçılarak uzaklaşır, kırmızı baskın kalır.", concepts: ["horizon_path", "sunlight"], sourceIds: ["src-diffuse-sky"], certainty: "established" },
    ],
    steps: [
      {
        id: "s-1", mechanism: "spectrum_split", overlay: "BEYAZ IŞIK",
        narration: "Güneş ışığı beyaz görünür ama aslında tüm renkleri içinde taşır. Prizmadan geçirdiğinizde bunu görebilirsiniz.",
        narrationSimple: "Gökyüzü neden mavi? Aslında gökyüzünün kendi rengi yok. Rengi ışık yapıyor.",
        concepts: ["sunlight", "spectrum", "light"],
        params: { spectrumLabel: "görünür tayf", startLabel: "güneş ışığı" },
        minDuration: 5,
      },
      {
        id: "s-2", mechanism: "rayleigh_scattering", overlay: "MOLEKÜLLERDEN SAÇILMA",
        overlaySimple: "IŞIK DAĞILIYOR",
        narration: "Atmosferdeki azot ve oksijen molekülleri bu ışığı her yöne saçmaya başlar. Bu olayın adı Rayleigh saçılmasıdır.",
        narrationSimple: "Güneş ışığı havadaki moleküllere çarpar. Moleküller ışığı her yöne dağıtır.",
        concepts: ["atmosphere", "gas_molecule", "rayleigh_scattering", "photon"],
        params: { moleculeLabel: "N₂ / O₂", incidentLabel: "güneş ışığı", scatteredLabel: "saçılan ışık" },
        minDuration: 5,
      },
      {
        id: "s-3", mechanism: "wavelength_scale", overlay: "DALGA BOYU ETKİSİ",
        overlaySimple: "MAVİ DAHA ÇOK",
        narration: "Saçılma şiddeti dalga boyunun dördüncü kuvvetiyle ters orantılıdır. Bu yüzden kısa dalgalı mavi ışık, kırmızıdan kat kat fazla saçılır.",
        narrationSimple: "Mavi ışık bu dağılmaya daha çok yakalanır. Kırmızı ışık ise neredeyse hiç sapmadan geçer.",
        concepts: ["wavelength", "rayleigh_scattering", "spectrum"],
        params: { blueLabel: "mavi ≈ 450 nm", redLabel: "kırmızı ≈ 700 nm" },
        minDuration: 5,
      },
      {
        id: "s-4", mechanism: "sky_dome_view", overlay: "HER YÖNDEN MAVİ",
        narration: "Gökyüzüne baktığınız her yönde, o saçılan mavi fotonlar gözünüze ulaşır. Bu yüzden gökyüzü mavidir.",
        narrationSimple: "Bu yüzden gökyüzüne baktığınız her yerde mavi ışık gözünüze ulaşır. Gökyüzü mavi görünür.",
        concepts: ["observer", "rayleigh_scattering", "spectrum"],
        params: { sunLabel: "güneş", observerLabel: "gözlemci", scatteredLabel: "mavi saçılma" },
        minDuration: 5,
      },
      {
        id: "s-5", mechanism: "atmosphere_path", overlay: "GÜN BATIMI",
        narration: "Güneş ufka yaklaştığında ışık atmosferde çok daha uzun yol alır. Mavi ışık yolda dağılır, geriye kırmızı ve turuncu kalır.",
        narrationSimple: "Güneş batarken ışık havada daha uzun yol alır. Mavi ışık yolda dağılır; geriye kırmızı ve turuncu kalır.",
        concepts: ["horizon_path", "wavelength", "atmosphere", "sunlight"],
        params: { lowSunLabel: "ufuktaki güneş", longPathLabel: "uzun yol", redLabel: "kırmızı" },
        minDuration: 5,
      },
      {
        id: "s-6", mechanism: "atmosphere_path", overlay: "ÖZET", optional: true,
        narration: "Kısaca: mavi ışık daha çok saçıldığı için gökyüzü mavi, yolu uzadığında ise gün batımı kızıldır.",
        narrationSimple: "Kısacası: mavi ışık daha çok dağıldığı için gökyüzü mavi. Yol uzadığında ise gün batımı kızıl olur.",
        concepts: ["rayleigh_scattering", "wavelength", "horizon_path"],
        params: { lowSunLabel: "gün batımı", longPathLabel: "uzun yol", redLabel: "kırmızı" },
        minDuration: 5,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "ocean-salty",
    topicTitleTr: "Denizler neden tuzlu?",
    aliases: [
      "deniz neden tuzlu", "denizler neden tuzlu", "okyanus neden tuzlu", "deniz suyu neden tuzlu",
      "denizler neden tuzludur", "sea salty", "ocean salty", "denizlerin tuzluluğu", "deniz neden tuzlu?",
    ],
    domains: ["earth", "chemistry", "geology", "environment"],
    summaryTr:
      "Denizlerdeki tuzun ana kaynağı karalardır. Yağmur suyu atmosferdeki karbondioksiti alarak hafif asidik hâle gelir; bu su kayalardaki mineralleri kimyasal olarak ayrıştırır ve iyonlara ayırır. Akarsular bu iyonları (başlıca sodyum ve klorür) okyanuslara taşır. Okyanuslarda su buharlaşır, ancak çözünmüş tuzlar geride kalır; bu yüzden tuz derişimi milyonlarca yıl boyunca birikmiştir. Bugün deniz suyunda yaklaşık %3,5 çözünmüş tuz bulunur ve bunun büyük kısmı sodyum klorürdür. Süreç milyonlarca yıldır sürer ve tuz dengesi hidrotermal kaynaklar ile tortullaşma gibi süreçlerle düzenlenir.",
    concepts: ["ocean", "rock_weathering", "river_transport", "sodium_ion", "chloride_ion", "evaporation", "water_cycle", "ion_hydration", "water"],
    forbiddenConcepts: ["cell", "mitochondrion", "black_hole", "tetrahedral_lattice", "neuron"],
    misconceptions: [
      { claim: "Denizler tuzludur çünkü balinalar ve balıklar tuz üretir.", correction: "Tuzun kaynağı ağırlıklı olarak karalardaki kayaç ayrışmasıdır." },
      { claim: "Yağmur denize tuz taşır.", correction: "Yağmur tatlıdır; tuzu akarsular çözünmüş iyon olarak taşır." },
    ],
    sources: [
      S("src-seawater", "Seawater", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Seawater", "encyclopedia", "Tuzluluk oranı ve bileşim"),
      S("src-salinity", "Salinity", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Salinity", "encyclopedia", "Tuzluluk tanımı"),
      S("src-noaa-ocean", "Why is the ocean salty?", "NOAA — National Ocean Service", "https://oceanservice.noaa.gov/facts/why_oceans_salty.html", "agency", "Kayaç ayrışması ve taşınım"),
      S("src-whoi", "Ocean salinity", "Woods Hole Oceanographic Institution", "https://www.whoi.edu/know-your-ocean/did-you-know/why-is-the-ocean-salty/", "institution", "Okyanus tuz dengesi"),
    ],
    facts: [
      { id: "f-o1", textTr: "Deniz suyu ortalama %3,5 oranında çözünmüş tuz içerir; baskın iyonlar sodyum ve klorürdür.", concepts: ["ocean", "sodium_ion", "chloride_ion"], sourceIds: ["src-seawater"], certainty: "established" },
      { id: "f-o2", textTr: "Kayaç ayrışması, minerallerin iyonlara ayrılıp akarsularla denize taşınmasını sağlar.", concepts: ["rock_weathering", "river_transport"], sourceIds: ["src-noaa-ocean"], certainty: "established" },
      { id: "f-o3", textTr: "Buharlaşma suyu atmosfere taşırken çözünmüş tuzlar denizde kalır.", concepts: ["evaporation", "water_cycle"], sourceIds: ["src-noaa-ocean"], certainty: "established" },
    ],
    steps: [
      {
        id: "o-1", mechanism: "rock_weathering", overlay: "TUZUN KAYNAĞI",
        narration: "Denizlerdeki tuzun kaynağı deniz değil, karadır. Yağmur, atmosferden karbondioksit alarak hafif asitli hâle gelir.",
        narrationSimple: "Denizdeki tuz denizden gelmiyor. Peki nereden geliyor? Karadan; yağmurla.",
        concepts: ["rock_weathering", "water_cycle", "water"],
        params: { rainLabel: "asitli yağmur", rockLabel: "kayaç", ionLabel: "çözünen iyonlar" },
        minDuration: 5,
      },
      {
        id: "o-2", mechanism: "river_to_sea", overlay: "AKARSULAR TAŞIR",
        narration: "Bu su, kayalardaki mineralleri çözerek iyonlara ayırır. Akarsular iyonları milyonlarca yıl boyunca okyanuslara taşır.",
        narrationSimple: "Bu su, kayalardaki tuzları çözer. Dereler bu tuzu milyonlarca yıl boyunca denize taşır.",
        concepts: ["river_transport", "sodium_ion", "chloride_ion"],
        params: { riverLabel: "akarsu", seaLabel: "okyanus", ionLabel: "Na⁺ / Cl⁻" },
        minDuration: 5,
      },
      {
        id: "o-3", mechanism: "ion_solution", overlay: "ÇÖZÜNMÜŞ İYONLAR",
        overlaySimple: "TUZ SUDA",
        narration: "Deniz suyunda bu iyonlar serbest dolaşır. Su molekülleri onları sarar ve çözeltide tutar; buna hidratasyon denir.",
        narrationSimple: "Denizde tuz parçacıkları suyun içinde serbestçe dolaşır. Su molekülleri onları sarar ve suda tutar.",
        concepts: ["sodium_ion", "chloride_ion", "ion_hydration", "water"],
        params: { cationLabel: "Na⁺", anionLabel: "Cl⁻", waterLabel: "su molekülü" },
        minDuration: 5,
      },
      {
        id: "o-4", mechanism: "evaporation_cycle", overlay: "TUZ GERİDE KALIR",
        narration: "Güneş deniz suyunu buharlaştırır. Su gökyüzüne çıkar ama tuz geride kalır. Böylece tuz milyonlarca yıl birikir.",
        narrationSimple: "Güneş deniz suyunu buharlaştırır. Su buharlaşıp yukarı çıkar; tuz ise denizde kalır.",
        concepts: ["evaporation", "water_cycle", "ocean", "sodium_ion"],
        params: { sunLabel: "güneş", vaporLabel: "su buharı", saltLabel: "tuz" },
        minDuration: 5,
      },
      {
        id: "o-5", mechanism: "river_to_sea", overlay: "YAKLAŞIK %3,5", optional: true,
        narration: "Bugün deniz suyunun yaklaşık yüzde üç buçuğu çözünmüş tuzdur. Bu denge milyonlarca yılda oluştu.",
        narrationSimple: "Böylece tuz milyonlarca yıl birikir. Bugün deniz suyunun yaklaşık yüzde üç buçuğu tuzdur.",
        concepts: ["ocean", "sodium_ion", "chloride_ion"],
        params: { riverLabel: "akarsu", seaLabel: "okyanus", ionLabel: "%3,5 tuz" },
        minDuration: 4,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "black-hole",
    topicTitleTr: "Kara delikler nasıl çalışır?",
    aliases: [
      "kara delik", "kara delikler", "kara delik nasıl", "kara delikler nasıl çalışır", "black hole",
      "kara deliğin", "olay ufku", "kara delik nedir", "kara delikler nasıl oluşur", "kara delikler nasıl çalışır?",
    ],
    domains: ["astronomy", "physics"],
    summaryTr:
      "Kara delik, kütlesinin çok küçük bir hacimde toplandığı, kütle çekiminin ışığın bile kaçamayacağı kadar güçlü olduğu bir gök cismidir. Genel göreliliğe göre kütle uzay-zamanı büker; kara deliğin sınırı olan olay ufkunun içinde kaçış hızı ışık hızını aşar. Çevresine düşen madde bir yığılma diski oluşturur; sürtünme nedeniyle ısınan disk X-ışını yayar. Kara deliğin arkasındaki ışık, kütle çekimsel mercekleme ile bükülerek birden fazla görüntü ve halka oluşturabilir. Kara delikler yıldız çöküşü veya birleşmelerle oluşur; olay ufkunun ötesi doğrudan gözlenemez.",
    concepts: ["black_hole", "event_horizon", "spacetime_curvature", "accretion_disk", "gravitational_lensing", "escape_velocity", "singularity", "mass", "gravitational_force", "light"],
    forbiddenConcepts: ["cell", "mitochondrion", "neuron", "chloroplast", "sodium_ion", "tectonic_plate"],
    misconceptions: [
      { claim: "Kara delikler her şeyi bir elektrikli süpürge gibi içine çeker.", correction: "Kara delik yalnızca kütle çekim uygular; uzaktaki cisimler yörüngede kalabilir." },
      { claim: "Kara deliğin içinde ne olduğu gözlemlerle bilinir.", correction: "Olay ufkunun ötesi gözlenemez; iç yapı kuramsaldır." },
    ],
    sources: [
      S("src-bh", "Black hole", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Black_hole", "encyclopedia", "Olay ufku, yığılma diski"),
      S("src-eh", "Event horizon", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Event_horizon", "encyclopedia", "Kaçış hızı sınırı"),
      S("src-nasa-bh", "Black Holes", "NASA Science", "https://science.nasa.gov/universe/black-holes/", "agency", "Kurumsal genel bakış"),
      S("src-lensing", "Gravitational lens", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Gravitational_lens", "encyclopedia", "Işığın bükülmesi"),
    ],
    facts: [
      { id: "f-b1", textTr: "Olay ufku, kaçış hızının ışık hızına eşit olduğu sınırdır.", concepts: ["event_horizon", "escape_velocity"], sourceIds: ["src-eh"], certainty: "established" },
      { id: "f-b2", textTr: "Yığılma diski, kara deliğe düşen maddenin açısal momentumu nedeniyle oluşur ve X-ışını yayar.", concepts: ["accretion_disk", "black_hole"], sourceIds: ["src-nasa-bh"], certainty: "established" },
      { id: "f-b3", textTr: "Kütle çekimi ışığın yolunu büker; bu etki kütle çekimsel mercekleme olarak gözlenir.", concepts: ["gravitational_lensing", "light"], sourceIds: ["src-lensing"], certainty: "established" },
    ],
    steps: [
      {
        id: "b-1", mechanism: "spacetime_grid", overlay: "UZAY-ZAMAN",
        narration: "Kara delikleri anlamanın yolu uzay-zamandan geçer. Kütle, uzay-zamanı bir çarşaf gibi büker.",
        narrationSimple: "Kara delik, ışığın bile kaçamadığı bir yer. Peki bu nasıl oluyor? Uzayı bir çarşaf gibi düşünün.",
        concepts: ["spacetime_curvature", "mass", "gravitational_force"],
        params: { gridLabel: "uzay-zaman", massLabel: "kütle", wellLabel: "çukur" },
        minDuration: 5,
      },
      {
        id: "b-2", mechanism: "event_horizon", overlay: "OLAY UFKU",
        overlaySimple: "GERİ DÖNÜŞ YOK",
        narration: "Bu eğrilik yeterince güçlü olduğunda bir sınır oluşur: olay ufku. İçeride kaçış hızı ışık hızını aşar.",
        narrationSimple: "Çukur yeterince derin olursa bir sınır oluşur. Bu sınırdan içeri giren hiçbir şey geri dönemez; ışık bile.",
        concepts: ["event_horizon", "escape_velocity", "black_hole"],
        params: { horizonLabel: "olay ufku", photonLabel: "foton", escapeLabel: "kaçabilir", trappedLabel: "kaçamaz" },
        minDuration: 5,
      },
      {
        id: "b-3", mechanism: "accretion_disk", overlay: "YIĞILMA DİSKİ",
        overlaySimple: "DÖNEN SICAK MADDE",
        narration: "Kara deliğin çevresine madde düşerken bir disk oluşur. Sürtünmeyle ısınan bu madde parlak X-ışınları yayar.",
        narrationSimple: "Kara deliğin çevresine madde düşerken dönmeye başlar. Bu madde ısınır ve parlak ışık yayar.",
        concepts: ["accretion_disk", "black_hole", "mass"],
        params: { diskLabel: "yığılma diski", holeLabel: "kara delik", heatLabel: "sıcak madde" },
        minDuration: 5,
      },
      {
        id: "b-4", mechanism: "gravitational_lensing", overlay: "MERCEKLEME",
        overlaySimple: "IŞIK BÜKÜLÜR",
        narration: "Kara deliğin arkasındaki yıldızların ışığı bükülür. Bu yüzden aynı yıldızı birden fazla yerde görebiliriz.",
        narrationSimple: "Kara deliğin arkasındaki yıldızların ışığı bükülür. Bu yüzden aynı yıldızı iki ayrı yerde görebiliriz.",
        concepts: ["gravitational_lensing", "light", "spacetime_curvature"],
        params: { starLabel: "arka plan yıldızı", ringLabel: "ışık halkası", holeLabel: "kara delik" },
        minDuration: 5,
      },
      {
        id: "b-5", mechanism: "event_horizon", overlay: "UFKUN ÖTESİ", optional: true,
        narration: "Olay ufkunun ötesini gözlemleyemeyiz. Bu yüzden kara deliklerin iç yapısı hâlâ kuramsal bir tartışmadır.",
        narrationSimple: "Sınırın ötesini hiçbir teleskopla göremeyiz. Bu yüzden içeride ne olduğu hâlâ tartışılıyor.",
        concepts: ["event_horizon", "singularity", "black_hole"],
        params: { horizonLabel: "olay ufku", photonLabel: "ışık", escapeLabel: "dışarı", trappedLabel: "bilinmiyor" },
        minDuration: 5,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "metal-conduction",
    topicTitleTr: "Metaller elektriği neden iletir?",
    aliases: [
      "metal elektrik", "metaller elektriği neden iletir", "elektrik iletkenliği", "metal neden iletir",
      "metallerde elektrik", "iletken", "metaller neden elektriği iletir", "electrical conduction",
      "elektrik nasıl iletilir", "metaller elektriği neden iletir?",
    ],
    domains: ["physics", "chemistry", "materials"],
    summaryTr:
      "Metallerde dış elektronlar atomlara zayıf bağlıdır ve tüm kristal boyunca hareket edebilen bir 'serbest elektron denizi' oluşturur. Bir gerilim (potansiyel fark) uygulandığında elektronlar elektrik alanının tersi yönünde sürüklenir; bu toplu harekete elektrik akımı denir. Elektronlar ilerlerken titreşen iyonlarla çarpışır; bu çarpışmalar direnci ve ısınmayı oluşturur. Yalıtkanlarda ise elektronlar atomlara sıkı bağlıdır, bu yüzden serbest yük taşıyıcısı yoktur ve akım akmaz. İletkenlik, malzemenin serbest yük taşıyıcı yoğunluğuna ve hareketliliğine bağlıdır.",
    concepts: ["metal_lattice", "free_electron", "electric_field", "drift_velocity", "collision_scattering", "insulator", "current", "electron", "atom"],
    forbiddenConcepts: ["cell", "mitochondrion", "neuron", "black_hole", "tetrahedral_lattice", "tectonic_plate"],
    misconceptions: [
      { claim: "Elektrik, elektronların ışık hızında kabloda uçmasıdır.", correction: "Sinyal hızlı yayılır ama elektronların sürüklenme hızı mikrometre/saniye düzeyindedir." },
      { claim: "Elektronlar kabloda tükenir.", correction: "Yük korunur; devre kapalıysa aynı elektronlar dolaşır." },
    ],
    sources: [
      S("src-metallic-bond", "Metallic bonding", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Metallic_bonding", "encyclopedia", "Serbest elektron denizi"),
      S("src-conduction", "Electrical resistivity and conductivity", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Electrical_resistivity_and_conductivity", "encyclopedia", "Direnç ve iletkenlik"),
      S("src-hyperphys-conduct", "Electrical conduction in metals", "Georgia State University — HyperPhysics", "http://hyperphysics.phy-astr.gsu.edu/hbase/electric/conins.html", "university", "Sürüklenme modeli"),
      S("src-doe", "Conductors and insulators", "U.S. Department of Energy", "https://www.energy.gov/articles/how-electricity-travels", "agency", "Temel açıklama"),
    ],
    facts: [
      { id: "f-m1", textTr: "Metallerde serbest elektronlar kristal boyunca hareket edebilir ve akımı taşır.", concepts: ["metal_lattice", "free_electron", "current"], sourceIds: ["src-metallic-bond"], certainty: "established" },
      { id: "f-m2", textTr: "Elektronların iyonlarla çarpışması direnci ve joule ısınmasını oluşturur.", concepts: ["collision_scattering", "metal_lattice"], sourceIds: ["src-conduction"], certainty: "established" },
      { id: "f-m3", textTr: "Yalıtkanlarda serbest yük taşıyıcısı yoktur; bu nedenle elektrik akımı akmaz.", concepts: ["insulator", "electron"], sourceIds: ["src-doe"], certainty: "established" },
    ],
    steps: [
      {
        id: "m-1", mechanism: "electron_sea", overlay: "ELEKTRON DENİZİ",
        overlaySimple: "SERBEST ELEKTRONLAR",
        narration: "Metallerde atomlar sıkı bir örgü oluşturur. Dış elektronlar ise atomlara zayıf bağlıdır ve serbestçe dolaşır.",
        narrationSimple: "Metale bir pil bağlayınca elektrik akar. Peki neden? Çünkü metalin içinde serbest elektronlar var.",
        concepts: ["metal_lattice", "free_electron", "atom"],
        params: { ionLabel: "metal iyonu", electronLabel: "serbest elektron" },
        minDuration: 5,
      },
      {
        id: "m-2", mechanism: "electron_drift", overlay: "GERİLİM VE AKIM",
        narration: "Bir pile bağlandığında elektrik alanı oluşur. Serbest elektronlar bu alanın tersine doğru sürüklenmeye başlar.",
        narrationSimple: "Pile bağlayınca elektrik itici bir güç oluşur. Serbest elektronlar bu güçle harekete geçer.",
        concepts: ["electric_field", "drift_velocity", "current", "free_electron"],
        params: { fieldLabel: "elektrik alanı", electronLabel: "elektron", batteryLabel: "pil" },
        minDuration: 5,
      },
      {
        id: "m-3", mechanism: "resistance_heat", overlay: "DİRENÇ",
        overlaySimple: "TEL ISINIR",
        narration: "Elektronlar ilerlerken titreşen iyonlarla çarpışır. Bu çarpışmalar direnci oluşturur ve tel ısınır.",
        narrationSimple: "Elektronlar ilerlerken titreyen atomlara çarpar. Bu çarpışmalar teli ısıtır ve akımı zorlaştırır.",
        concepts: ["collision_scattering", "metal_lattice", "drift_velocity"],
        params: { collisionLabel: "çarpışma", heatLabel: "ısı", ionLabel: "iyon" },
        minDuration: 5,
      },
      {
        id: "m-4", mechanism: "insulator_compare", overlay: "YALITKANLAR",
        narration: "Yalıtkanlarda elektronlar atomlara sıkı bağlıdır. Serbest taşıyıcı olmadığı için akım akmaz.",
        narrationSimple: "Yalıtkanlarda elektronlar atomlara sıkı bağlıdır. Serbest elektron olmadığı için elektrik geçmez.",
        concepts: ["insulator", "electron", "current"],
        params: { conductorLabel: "iletken", insulatorLabel: "yalıtkan", electronLabel: "elektron" },
        minDuration: 5,
      },
      {
        id: "m-5", mechanism: "electron_drift", overlay: "NEDEN METAL?", optional: true,
        narration: "Metalleri iyi iletken yapan şey, bu serbest elektronların bolluğu ve hareketliliğidir.",
        narrationSimple: "Metalleri iyi ileten şey, bu serbest elektronların çokluğu ve rahat hareket etmesidir.",
        concepts: ["free_electron", "drift_velocity", "current"],
        params: { fieldLabel: "elektrik alanı", electronLabel: "elektron", batteryLabel: "pil" },
        minDuration: 4,
      },
    ],
    naturalDurationSec: 60,
  },
];

export const sourceList = (cards: KnowledgeCard[]): SourceRef[] => cards.flatMap((c) => c.sources);
