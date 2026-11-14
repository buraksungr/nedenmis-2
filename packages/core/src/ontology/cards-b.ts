import type { KnowledgeCard, SourceRef } from "./types.js";

const S = (id: string, title: string, publisher: string, url: string, kind: SourceRef["kind"], noteTr?: string): SourceRef => ({
  id,
  title,
  publisher,
  url,
  kind,
  noteTr,
});

export const CARDS_B: KnowledgeCard[] = [
  {
    id: "mitochondria-atp",
    topicTitleTr: "Mitokondri nasıl enerji üretir?",
    aliases: [
      "mitokondri", "mitokondriler", "mitokondri nasıl enerji üretir", "mitokondri enerji",
      "hücre enerji", "atp", "mitochondria", "mitokondrinin görevi", "hücre nasıl enerji üretir",
      "mitokondri nasıl enerji üretir?",
    ],
    domains: ["biology", "chemistry"],
    summaryTr:
      "Mitokondri, çift zarlı bir organeldir. İç zarın krista adı verilen kıvrımları yüzey alanını artırır. Glikozdan gelen yüksek enerjili elektronlar elektron taşıma zincirindeki protein komplekslerine aktarılır; bu sırada açığa çıkan enerji, protonların zarlar arası boşluğa pompalanmasıyla kullanılır ve bir proton eğimi (gradyan) oluşur. Protonlar ATP sentaz üzerinden matrikse geri akarken enzim döner ve ADP ile fosfatı birleştirerek ATP üretir. Oksijen, elektron taşıma zincirinin sonunda elektron alıcısı olarak görev yapar ve su oluşur. Bu sürece oksidatif fosforilasyon denir.",
    concepts: ["cell", "cell_membrane", "mitochondrion", "cristae", "proton_gradient", "atp_synthase", "atp", "electron_transport_chain", "glucose", "oxygen", "water", "carbon_dioxide", "energy"],
    forbiddenConcepts: ["tetrahedral_lattice", "cleavage_plane", "black_hole", "tectonic_plate", "sodium_ion", "rayleigh_scattering"],
    misconceptions: [
      { claim: "Mitokondri enerji üretir.", correction: "Mitokondri enerji yaratmaz; besinlerdeki kimyasal enerjiyi ATP'ye dönüştürür." },
      { claim: "ATP hücrenin yakıtıdır.", correction: "ATP bir enerji taşıyıcısıdır; yakıt glikozdur." },
    ],
    sources: [
      S("src-mito", "Mitochondrion", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Mitochondrion", "encyclopedia", "Yapı ve işlev"),
      S("src-oxphos", "Oxidative phosphorylation", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Oxidative_phosphorylation", "encyclopedia", "Elektron taşıma zinciri ve ATP sentaz"),
      S("src-atp", "ATP synthase", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/ATP_synthase", "encyclopedia", "Dönen motor ve proton akışı"),
      S("src-ncbi", "The mitochondrion", "NCBI Bookshelf — Biochemistry", "https://www.ncbi.nlm.nih.gov/books/NBK9886/", "institution", "Ders kitabı düzeyinde açıklama"),
    ],
    facts: [
      { id: "f-t1", textTr: "Elektron taşıma zinciri, protonları zarlar arası boşluğa pompalayarak proton eğimi oluşturur.", concepts: ["electron_transport_chain", "proton_gradient", "cristae"], sourceIds: ["src-oxphos"], certainty: "established" },
      { id: "f-t2", textTr: "ATP sentaz, protonların geri akışıyla dönerek ADP'den ATP üretir.", concepts: ["atp_synthase", "atp", "proton_gradient"], sourceIds: ["src-atp"], certainty: "established" },
      { id: "f-t3", textTr: "Oksijen, elektron taşıma zincirinin son elektron alıcısıdır ve su oluşur.", concepts: ["oxygen", "water", "electron_transport_chain"], sourceIds: ["src-mito"], certainty: "established" },
    ],
    steps: [
      {
        id: "t-1", mechanism: "cell_section", overlay: "HÜCRENİN İÇİNDE",
        narration: "Hücrenin içinde, enerji ihtiyacının karşılandığı yer mitokondridir. Çift zarlı bu organel kendi DNA'sına bile sahiptir.",
        concepts: ["cell", "cell_membrane", "mitochondrion"],
        params: { cellLabel: "hücre", nucleusLabel: "çekirdek", mitoLabel: "mitokondri" },
        minDuration: 5,
      },
      {
        id: "t-2", mechanism: "mitochondrion_cross", overlay: "KRISTALAR",
        narration: "İç zar, krista denilen kıvrımlar yapar. Bu kıvrımlar tepkime yüzeyini büyütür; enerji üretimi bu zarlarda gerçekleşir.",
        concepts: ["mitochondrion", "cristae", "cell_membrane"],
        params: { outerLabel: "dış zar", innerLabel: "iç zar", cristaeLabel: "krista" },
        minDuration: 5,
      },
      {
        id: "t-3", mechanism: "proton_gradient", overlay: "PROTON EĞİMİ",
        narration: "Besinlerden gelen elektronlar zincir boyunca aktarılır. Bu enerji, protonların zarlar arası boşluğa pompalanmasını sağlar.",
        concepts: ["electron_transport_chain", "proton_gradient", "glucose", "oxygen"],
        params: { complexLabel: "ETZ kompleksleri", protonLabel: "H⁺", gradientLabel: "proton eğimi" },
        minDuration: 5,
      },
      {
        id: "t-4", mechanism: "atp_synthase_rotor", overlay: "ATP SENTAZ",
        narration: "Protonlar ATP sentazdan geri akarken enzim döner. Her dönüşte ADP ve fosfattan ATP üretilir.",
        concepts: ["atp_synthase", "atp", "proton_gradient"],
        params: { rotorLabel: "ATP sentaz", protonLabel: "H⁺", atpLabel: "ATP" },
        minDuration: 5,
      },
      {
        id: "t-5", mechanism: "metabolism_summary", overlay: "GİRDİ VE ÇIKTI",
        narration: "Glikoz ve oksijen kullanılır; karbondioksit, su ve ATP ortaya çıkar. Hücrenin kullanabileceği enerji işte bu ATP'dir.",
        concepts: ["glucose", "oxygen", "carbon_dioxide", "water", "atp"],
        params: { inputLabel: "glikoz + O₂", outputLabel: "ATP + CO₂ + H₂O" },
        minDuration: 5,
      },
      {
        id: "t-6", mechanism: "atp_synthase_rotor", overlay: "ÖZET", optional: true,
        narration: "Kısaca mitokondri, proton eğimini dönen bir moleküler motora çevirip hücrenin enerji taşıyıcısını üretir.",
        concepts: ["atp_synthase", "proton_gradient", "atp"],
        params: { rotorLabel: "ATP sentaz", protonLabel: "H⁺", atpLabel: "ATP" },
        minDuration: 4,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "earthquake",
    topicTitleTr: "Depremler neden olur?",
    aliases: [
      "deprem", "depremler", "deprem neden olur", "depremler neden olur", "deprem nasıl oluşur",
      "fay hattı", "fay", "earthquake", "sismik", "deprem neden olur?", "levha hareketi",
    ],
    domains: ["geology", "earth", "physics"],
    summaryTr:
      "Dünya'nın litosferi, manto üzerinde yavaşça hareket eden tektonik levhalardan oluşur. Levhalar birbirine sürtündüğü fay hatlarında hareket bazen kilitlenir; kaya elastik olarak deforme olur ve gerilme enerjisi birikir. Bu birikim kayanın dayanımını aştığında fay aniden kırılır ve kayar. Açığa çıkan enerji sismik dalgalar olarak yayılır; yüzeyde hissettiğimiz sarsıntı budur. Depremlerin büyüklüğü logaritmik bir ölçekle (moment magnitüdü) ifade edilir ve her birim artış yaklaşık 32 kat daha fazla enerji anlamına gelir. Deprem tahmini bugün güvenilir biçimde mümkün değildir; ancak tehlike ve risk haritaları yapılabilir.",
    concepts: ["tectonic_plate", "fault_line", "elastic_strain", "rupture", "seismic_wave", "plate_motion", "mechanical_stress", "energy"],
    forbiddenConcepts: ["cell", "mitochondrion", "neuron", "black_hole", "atp", "rayleigh_scattering"],
    misconceptions: [
      { claim: "Depremler hava durumuyla ilgilidir.", correction: "Depremler levha hareketleri ve fay kırılmalarıyla oluşur." },
      { claim: "Depremler kesin olarak önceden tahmin edilebilir.", correction: "Bugün kesin zaman ve yer tahmini güvenilir biçimde yapılamıyor." },
      { claim: "Büyüklük iki katına çıkarsa enerji iki katına çıkar.", correction: "Her 1 birim magnitüd artışı yaklaşık 32 kat enerji demektir." },
    ],
    sources: [
      S("src-eq", "Earthquake", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Earthquake", "encyclopedia", "Fay ve sismik dalgalar"),
      S("src-elastic-rebound", "Elastic-rebound theory", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Elastic-rebound_theory", "encyclopedia", "Gerilme birikimi ve kırılma"),
      S("src-usgs", "The Science of Earthquakes", "USGS Earthquake Hazards Program", "https://earthquake.usgs.gov/learn/kids/eqscience.php", "agency", "Kurumsal açıklama"),
      S("src-moment", "Moment magnitude scale", "USGS", "https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release", "agency", "Enerji-magnitüd ilişkisi"),
    ],
    facts: [
      { id: "f-e1", textTr: "Levha hareketleri fay hatlarında elastik gerilme birikimine yol açar.", concepts: ["plate_motion", "fault_line", "elastic_strain"], sourceIds: ["src-elastic-rebound"], certainty: "established" },
      { id: "f-e2", textTr: "Kırılma anında açığa çıkan enerji sismik dalgalar olarak yayılır.", concepts: ["rupture", "seismic_wave"], sourceIds: ["src-eq"], certainty: "established" },
      { id: "f-e3", textTr: "Moment magnitüdündeki 1 birimlik artış yaklaşık 32 kat enerji salımına karşılık gelir.", concepts: ["seismic_wave", "energy"], sourceIds: ["src-moment"], certainty: "strong" },
    ],
    steps: [
      {
        id: "e-1", mechanism: "plate_motion", overlay: "HAREKET EDEN LEVHALAR",
        narration: "Dünya'nın dış katmanı, manto üzerinde yılda birkaç santimetre hareket eden levhalardan oluşur. Bu hareket çoğu zaman fark edilmez.",
        concepts: ["tectonic_plate", "plate_motion"],
        params: { plateLabel: "levha", mantleLabel: "manto", arrowLabel: "hareket" },
        minDuration: 5,
      },
      {
        id: "e-2", mechanism: "elastic_strain", overlay: "GERİLME BİRİKİR",
        narration: "Levhalar birbirine sürtünürken fay bazen kilitlenir. Kaya esner ve yıllar boyunca elastik enerji birikir.",
        concepts: ["fault_line", "elastic_strain", "mechanical_stress"],
        params: { faultLabel: "fay hattı", strainLabel: "biriken gerilme", lockedLabel: "kilitli" },
        minDuration: 5,
      },
      {
        id: "e-3", mechanism: "fault_rupture", overlay: "KIRILMA",
        narration: "Biriken gerilme kayanın dayanımını aştığında fay aniden kırılır ve kayar. Açığa çıkan enerji sarsıntıya dönüşür.",
        concepts: ["rupture", "seismic_wave", "fault_line"],
        params: { ruptureLabel: "kırılma", hypocenterLabel: "odak", waveLabel: "sismik dalga" },
        minDuration: 5,
      },
      {
        id: "e-4", mechanism: "seismic_waves", overlay: "DALGALAR YAYILIR",
        narration: "Sismik dalgalar odaktan her yöne yayılır. Yüzeye ulaştıklarında binaları sarsan hareketi oluşturur.",
        concepts: ["seismic_wave", "energy"],
        params: { pLabel: "P dalgası", sLabel: "S dalgası", surfaceLabel: "yüzey dalgası" },
        minDuration: 5,
      },
      {
        id: "e-5", mechanism: "elastic_strain", overlay: "ÖZET", optional: true,
        narration: "Özetle deprem, levhaların yavaş hareketiyle biriken enerjinin fayda ani bir kırılmayla boşalmasıdır.",
        concepts: ["plate_motion", "elastic_strain", "rupture"],
        params: { faultLabel: "fay hattı", strainLabel: "birikim", lockedLabel: "kırılma" },
        minDuration: 4,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "photosynthesis",
    topicTitleTr: "Fotosentez nasıl çalışır?",
    aliases: [
      "fotosentez", "fotosentez nasıl çalışır", "bitki nasıl besin üretir", "klorofil", "kloroplast",
      "photosynthesis", "fotosentez nedir", "bitkiler nasıl oksijen üretir", "fotosentez nasıl çalışır?",
    ],
    domains: ["biology", "chemistry", "environment"],
    summaryTr:
      "Fotosentez, bitkilerin ışık enerjisini kullanarak karbondioksit ve suyu organik maddeye (glikoz) dönüştürdüğü süreçtir. Kloroplastlarda bulunan klorofil pigmenti ışığı soğurur. Işığa bağımlı tepkimelerde su molekülleri ayrıştırılır, oksijen açığa çıkar ve ATP ile NADPH üretilir. Calvin döngüsünde ise ATP ve NADPH kullanılarak CO₂ bağlanır ve glikoz sentezlenir. Yapraklardaki stomalar gaz alışverişini sağlar. Toplam denklem: 6CO₂ + 6H₂O + ışık → C₆H₁₂O₆ + 6O₂. Süreç, atmosferdeki oksijenin kaynağıdır.",
    concepts: ["chloroplast", "chlorophyll", "light_reaction", "calvin_cycle", "stomata", "sunlight_energy", "carbon_dioxide", "water", "glucose", "oxygen", "energy"],
    forbiddenConcepts: ["mitochondrion", "tetrahedral_lattice", "black_hole", "tectonic_plate", "rayleigh_scattering", "neuron"],
    misconceptions: [
      { claim: "Bitkiler besinlerini topraktan alır.", correction: "Bitkiler glikozu fotosentezle üretir; topraktan su ve mineral alır." },
      { claim: "Fotosentez yalnızca gündüz ve yalnızca yaprakta olur.", correction: "Işık gereklidir; kloroplast bulunan yeşil dokularda gerçekleşir." },
      { claim: "Fotosentez solunumun tam tersidir ve aynı yerde olur.", correction: "Fotosentez kloroplastta, hücresel solunum mitokondride gerçekleşir." },
    ],
    sources: [
      S("src-photo", "Photosynthesis", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Photosynthesis", "encyclopedia", "Genel süreç ve denklem"),
      S("src-lightreact", "Light-dependent reactions", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Light-dependent_reactions", "encyclopedia", "Su ayrışması, ATP/NADPH"),
      S("src-calvin", "Calvin cycle", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Calvin_cycle", "encyclopedia", "Karbon bağlama"),
      S("src-khan", "Photosynthesis", "Khan Academy", "https://www.khanacademy.org/science/biology/photosynthesis-in-plants", "university", "Eğitim kaynağı"),
    ],
    facts: [
      { id: "f-p1", textTr: "Fotosentezin toplam denklemi 6CO₂ + 6H₂O + ışık → C₆H₁₂O₆ + 6O₂'dir.", concepts: ["carbon_dioxide", "water", "glucose", "oxygen"], sourceIds: ["src-photo"], certainty: "established" },
      { id: "f-p2", textTr: "Işığa bağımlı tepkimelerde su ayrışır, oksijen açığa çıkar ve ATP ile NADPH üretilir.", concepts: ["light_reaction", "water", "oxygen"], sourceIds: ["src-lightreact"], certainty: "established" },
      { id: "f-p3", textTr: "Calvin döngüsünde ATP ve NADPH kullanılarak CO₂ bağlanır ve glikoz sentezlenir.", concepts: ["calvin_cycle", "carbon_dioxide", "glucose"], sourceIds: ["src-calvin"], certainty: "established" },
      { id: "f-p4", textTr: "Klorofil pigmenti ışığı soğurur; stomalar CO₂ alışverişini sağlar.", concepts: ["chlorophyll", "stomata", "chloroplast"], sourceIds: ["src-photo"], certainty: "established" },
    ],
    steps: [
      {
        id: "p-1", mechanism: "leaf_section", overlay: "YAPRAKTA BAŞLAR",
        narration: "Bir yaprağın kesitinde, ışığı yakalayan yeşil kloroplastlar bulunur. Gözeneklerden karbondioksit girer, oksijen çıkar.",
        concepts: ["stomata", "chlorophyll", "carbon_dioxide", "oxygen"],
        params: { leafLabel: "yaprak", stomataLabel: "stoma", sunlightLabel: "güneş ışığı", co2Label: "CO₂", o2Label: "O₂" },
        minDuration: 5,
      },
      {
        id: "p-2", mechanism: "chloroplast_zoom", overlay: "KLOROPLAST",
        narration: "Kloroplastın içindeki yassı zarlarda klorofil vardır. Klorofil ışığın enerjisini soğurur ve tepkimeleri başlatır.",
        concepts: ["chloroplast", "chlorophyll", "sunlight_energy"],
        params: { chloroplastLabel: "kloroplast", thylakoidLabel: "tilakoid zar", chlorophyllLabel: "klorofil" },
        minDuration: 5,
      },
      {
        id: "p-3", mechanism: "light_reaction", overlay: "IŞIK TEPKİMELERİ",
        narration: "Işıkla su molekülleri ayrıştırılır. Oksijen açığa çıkar; ATP ve NADPH adlı enerji taşıyıcıları üretilir.",
        concepts: ["light_reaction", "water", "oxygen", "energy"],
        params: { waterLabel: "H₂O", oxygenLabel: "O₂", atpLabel: "ATP", nadphLabel: "NADPH" },
        minDuration: 5,
      },
      {
        id: "p-4", mechanism: "calvin_cycle", overlay: "CALVIN DÖNGÜSÜ",
        narration: "Calvin döngüsünde karbondioksit bağlanır. ATP ve NADPH kullanılarak şeker molekülleri sentezlenir.",
        concepts: ["calvin_cycle", "carbon_dioxide", "glucose", "light_reaction"],
        params: { co2Label: "CO₂", cycleLabel: "Calvin döngüsü", sugarLabel: "glikoz" },
        minDuration: 5,
      },
      {
        id: "p-5", mechanism: "metabolism_summary", overlay: "DENKLEM",
        narration: "Toplamda altı karbondioksit ve altı su, ışıkla birlikte glikoza ve oksijene dönüşür. Atmosferdeki oksijenin kaynağı budur.",
        concepts: ["carbon_dioxide", "water", "glucose", "oxygen", "energy"],
        params: { inputLabel: "6 CO₂ + 6 H₂O + ışık", outputLabel: "C₆H₁₂O₆ + 6 O₂" },
        minDuration: 5,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "brain-memory",
    topicTitleTr: "Beyin anıları nasıl saklar?",
    aliases: [
      "beyin", "bellek", "hafıza", "anı", "anılar", "beyin anıları nasıl saklar", "hafıza nasıl oluşur",
      "memory", "brain memory", "nöron", "sinaps", "hipokampus", "beyin anıları nasıl saklar?",
    ],
    domains: ["biology", "chemistry"],
    summaryTr:
      "Bellek tek bir yerde saklanmaz; nöronlar arasındaki bağlantıların gücünde kodlanır. Öğrenme sırasında sinaptik bağlantılar etkinliğe bağlı olarak güçlenir (uzun süreli güçlenme, LTP). Tekrarlanan sinyaller sinaptik aralıkta nörotransmitter salınımını ve alıcı sayısını artırır; böylece aynı uyarı sonraki sefer daha kolay iletilir. Hipokampus yeni anıların oluşumunda ve pekişmesinde rol oynar; uyku sırasında anılar kortekse yeniden dağıtılır. Kullanılmayan bağlantılar zayıflar ve budanır. Yani anı, bir dosya değil, değişen bir bağlantı örüntüsüdür.",
    concepts: ["neuron", "synapse", "neurotransmitter", "ltp", "hippocampus", "synaptic_pruning", "cell_membrane", "energy"],
    forbiddenConcepts: ["tetrahedral_lattice", "black_hole", "tectonic_plate", "rayleigh_scattering", "sodium_ion", "cristae"],
    misconceptions: [
      { claim: "Anılar beyinde bir dosya gibi tek bir yerde durur.", correction: "Anılar dağıtık bağlantı örüntülerinde saklanır." },
      { claim: "Beyin yeni nöron üretemez.", correction: "Yetişkinlerde de belirli bölgelerde nörojenez görülür; esneklik daha çok sinaptik değişimle olur." },
      { claim: "Anılar birebir kayıt gibidir.", correction: "Her hatırlama anıyı yeniden kurar; bu yüzden değişebilir." },
    ],
    sources: [
      S("src-ltp", "Long-term potentiation", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Long-term_potentiation", "encyclopedia", "Sinaptik güçlenme"),
      S("src-synapse", "Synapse", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Synapse", "encyclopedia", "Nörotransmitter ve sinaptik aralık"),
      S("src-hip", "Hippocampus", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Hippocampus", "encyclopedia", "Bellek oluşumu"),
      S("src-nih", "How memory works", "National Institute on Aging (NIH)", "https://www.nia.nih.gov/health/memory-loss-and-forgetfulness/memory-problems-forgetfulness-and-aging", "agency", "Kurumsal genel bakış"),
    ],
    facts: [
      { id: "f-h1", textTr: "Uzun süreli güçlenme (LTP), tekrarlanan uyarımla sinaptik bağlantının güçlenmesidir.", concepts: ["ltp", "synapse", "neuron"], sourceIds: ["src-ltp"], certainty: "established" },
      { id: "f-h2", textTr: "Nörotransmitterler sinaptik aralıkta sinyali bir nörondan diğerine taşır.", concepts: ["neurotransmitter", "synapse"], sourceIds: ["src-synapse"], certainty: "established" },
      { id: "f-h3", textTr: "Hipokampus yeni anıların oluşumunda ve pekişmesinde rol oynar.", concepts: ["hippocampus", "ltp"], sourceIds: ["src-hip"], certainty: "established" },
      { id: "f-h4", textTr: "Kullanılmayan sinaptik bağlantılar zayıflayıp budanabilir.", concepts: ["synaptic_pruning", "synapse"], sourceIds: ["src-ltp"], certainty: "strong" },
    ],
    steps: [
      {
        id: "h-1", mechanism: "neuron_signal", overlay: "SİNYAL YOLCULUĞU",
        narration: "Beyinde milyarlarca nöron var. Bir anı, tek bir hücrede değil, bu hücreler arasındaki bağlantılarda saklanır.",
        concepts: ["neuron", "synapse", "hippocampus"],
        params: { neuronLabel: "nöron", axonLabel: "akson", signalLabel: "sinyal" },
        minDuration: 5,
      },
      {
        id: "h-2", mechanism: "synapse_zoom", overlay: "SİNAPS",
        narration: "Nöronlar birbirine değmez; arada sinaptik aralık vardır. Sinyal, bu aralığa salınan nörotransmitterlerle taşınır.",
        concepts: ["synapse", "neurotransmitter", "cell_membrane"],
        params: { cleftLabel: "sinaptik aralık", vesicleLabel: "taşıyıcı", receptorLabel: "alıcı" },
        minDuration: 5,
      },
      {
        id: "h-3", mechanism: "synaptic_plasticity", overlay: "LTP: BAĞ GÜÇLENİR",
        narration: "Tekrar eden sinyaller bu bağlantıyı güçlendirir. Buna uzun süreli güçlenme denir ve öğrenmenin hücresel temelidir.",
        concepts: ["ltp", "synapse", "neurotransmitter"],
        params: { weakLabel: "zayıf bağlantı", strongLabel: "güçlenmiş bağlantı", repeatLabel: "tekrar" },
        minDuration: 5,
      },
      {
        id: "h-4", mechanism: "brain_regions", overlay: "HİPOKAMPUS",
        narration: "Hipokampus yeni anıların oluşumunda kritik rol oynar. Uyku sırasında anılar kortekse dağıtılarak kalıcılaşır.",
        concepts: ["hippocampus", "neuron", "ltp"],
        params: { brainLabel: "beyin", hippoLabel: "hipokampus", cortexLabel: "korteks" },
        minDuration: 5,
      },
      {
        id: "h-5", mechanism: "synaptic_plasticity", overlay: "UNUTMA", optional: true,
        narration: "Kullanılmayan bağlantılar zayıflar ve budanır. Unutmak bir hata değil, beynin çalışma biçiminin parçasıdır.",
        concepts: ["synaptic_pruning", "synapse", "ltp"],
        params: { weakLabel: "budanan bağlantı", strongLabel: "korunan bağlantı", repeatLabel: "kullanım" },
        minDuration: 5,
      },
    ],
    naturalDurationSec: 60,
  },

  {
    id: "gravity",
    topicTitleTr: "Yer çekimi nasıl çalışır?",
    aliases: [
      "yer çekimi", "kütle çekim", "kütle çekimi", "gravitasyon", "gravity", "neden düşeriz",
      "yer çekimi nasıl çalışır", "çekim kuvveti", "ağırlık", "yer çekimi neden var",
      "yer çekimi nasıl çalışır?",
    ],
    domains: ["physics", "astronomy"],
    summaryTr:
      "Kütlesi olan her cisim diğerine kütle çekim kuvveti uygular. Newton'ın evrensel çekim yasasına göre bu kuvvet kütlelerle doğru, aralarındaki uzaklığın karesiyle ters orantılıdır. Serbest düşen cisimler, hava direnci yoksa kütlelerinden bağımsız olarak aynı ivmeyle düşer; Dünya yüzeyinde bu ivme yaklaşık 9,8 m/s²'dir. Einstein'ın genel görelilik kuramında çekim, bir kuvvetten çok kütlenin uzay-zamanı bükmesi ve cisimlerin bu eğrilikte izlediği yollar olarak açıklanır. Yörüngedeki uydular sürekli düşer ama yeterli yatay hızları sayesinde Dünya'yı ıskalar. Newton modeli günlük mühendislikte, genel görelilik ise çok güçlü çekimde ve GPS gibi hassas sistemlerde gereklidir.",
    concepts: ["mass", "gravitational_force", "free_fall", "acceleration", "spacetime_curvature", "energy", "force"],
    forbiddenConcepts: ["cell", "mitochondrion", "neuron", "tectonic_plate", "tetrahedral_lattice", "rayleigh_scattering", "atp"],
    misconceptions: [
      { claim: "Ağır cisimler daha hızlı düşer.", correction: "Hava direnci yoksa tüm cisimler aynı ivmeyle düşer." },
      { claim: "Uzayda çekim yoktur.", correction: "Çekim her yerde vardır; uzay istasyonundakiler serbest düşme hâlindedir." },
      { claim: "Yer çekimi manyetizmadır.", correction: "Kütle çekimi kütleyle, manyetizma yükle ilgilidir." },
    ],
    sources: [
      S("src-gravity", "Gravity", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Gravity", "encyclopedia", "Newton ve genel görelilik"),
      S("src-newton", "Newton's law of universal gravitation", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/Newton%27s_law_of_universal_gravitation", "encyclopedia", "Ters kare yasası"),
      S("src-nasa-gravity", "What is gravity?", "NASA Space Place", "https://spaceplace.nasa.gov/what-is-gravity/en/", "agency", "Kurumsal açıklama"),
      S("src-einstein", "General relativity", "Wikipedia (CC BY-SA)", "https://en.wikipedia.org/wiki/General_relativity", "encyclopedia", "Uzay-zaman eğriliği"),
    ],
    facts: [
      { id: "f-g1", textTr: "Kütle çekim kuvveti kütlelerle doğru, uzaklığın karesiyle ters orantılıdır.", concepts: ["gravitational_force", "mass"], sourceIds: ["src-newton"], certainty: "established" },
      { id: "f-g2", textTr: "Dünya yüzeyinde serbest düşme ivmesi yaklaşık 9,8 m/s²'dir ve kütleden bağımsızdır.", concepts: ["free_fall", "acceleration"], sourceIds: ["src-gravity"], certainty: "established" },
      { id: "f-g3", textTr: "Genel görelilikte çekim, kütlenin uzay-zamanı bükmesiyle açıklanır.", concepts: ["spacetime_curvature", "gravitational_force"], sourceIds: ["src-einstein"], certainty: "established" },
    ],
    steps: [
      {
        id: "g-1", mechanism: "gravity_vectors", overlay: "KÜTLE ÇEKER",
        narration: "Kütlesi olan her cisim diğerini çeker. Bu kuvvet kütlelerle doğru, uzaklığın karesiyle ters orantılıdır.",
        concepts: ["mass", "gravitational_force", "force"],
        params: { massLabel: "kütle", forceLabel: "çekim kuvveti", distanceLabel: "uzaklık" },
        minDuration: 5,
      },
      {
        id: "g-2", mechanism: "free_fall", overlay: "SERBEST DÜŞME",
        narration: "Hava direnci yoksa tüm cisimler aynı ivmeyle düşer. Dünya'da bu ivme yaklaşık saniyede saniyede dokuz virgül sekiz metredir.",
        concepts: ["free_fall", "acceleration", "mass"],
        params: { heavyLabel: "ağır cisim", lightLabel: "hafif cisim", gLabel: "g ≈ 9,8 m/s²" },
        minDuration: 5,
      },
      {
        id: "g-3", mechanism: "spacetime_grid", overlay: "EĞRİLEN UZAY-ZAMAN",
        narration: "Einstein'a göre çekim bir kuvvet değil, uzay-zamanın eğriliğidir. Cisimler bu eğrilikte en kısa yolu izler.",
        concepts: ["spacetime_curvature", "mass", "gravitational_force"],
        params: { gridLabel: "uzay-zaman", massLabel: "kütle", wellLabel: "eğrilik" },
        minDuration: 5,
      },
      {
        id: "g-4", mechanism: "orbit_fall", overlay: "YÖRÜNGE",
        narration: "Bir uydu aslında sürekli düşer. Yeterli yatay hızı olduğu için Dünya'yı ıskalar ve yörüngede kalır.",
        concepts: ["free_fall", "gravitational_force", "energy"],
        params: { earthLabel: "Dünya", satelliteLabel: "uydu", pathLabel: "yörünge" },
        minDuration: 5,
      },
      {
        id: "g-5", mechanism: "gravity_vectors", overlay: "ÖZET", optional: true,
        narration: "Newton günlük hesaplarda yeterlidir; çok güçlü çekimde ve duyarlı sistemlerde ise genel görelilik gerekir.",
        concepts: ["gravitational_force", "spacetime_curvature"],
        params: { massLabel: "Dünya", forceLabel: "çekim", distanceLabel: "uzaklık" },
        minDuration: 4,
      },
    ],
    naturalDurationSec: 60,
  },
];
