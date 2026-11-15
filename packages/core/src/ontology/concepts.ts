import type { Concept } from "./types.js";

/**
 * Küresel kavram sözlüğü.
 *
 * Her kavram tek bir domain'e aittir. Görsel bileşenler yalnızca bu sözlükteki
 * kavramları "desteklediklerini" beyan edebilir; doğrulayıcı, sahnenin izin
 * verilen kavram kümesinin dışına çıkmasını reddeder.
 */
const C = (c: Concept): Concept => c;

export const CONCEPTS: Record<string, Concept> = Object.fromEntries(
  [
    // ---------- Ortak / nötr bilimsel primitifler ----------
    C({ id: "energy", domain: "physics", labelTr: "enerji", aliases: ["enerji"], kind: "quantity", descriptionTr: "İş yapabilme kapasitesi.", diagramLabel: "enerji" }),
    C({ id: "force", domain: "physics", labelTr: "kuvvet", aliases: ["kuvvet", "kuvvetler"], kind: "quantity", descriptionTr: "Cisimlerin hareketini değiştiren etki.", diagramLabel: "kuvvet" }),
    C({ id: "light", domain: "physics", labelTr: "ışık", aliases: ["ışık", "ışığı", "ışığın", "ışın"], kind: "entity", descriptionTr: "Elektromanyetik dalga.", diagramLabel: "ışık" }),
    C({ id: "photon", domain: "physics", labelTr: "foton", aliases: ["foton", "fotonlar"], kind: "entity", descriptionTr: "Işığın enerji paketi.", diagramLabel: "foton" }),
    C({ id: "atom", domain: "chemistry", labelTr: "atom", aliases: ["atom", "atomlar", "atomların"], kind: "entity", descriptionTr: "Elementin en küçük yapı taşı.", diagramLabel: "atom" }),
    C({ id: "molecule", domain: "chemistry", labelTr: "molekül", aliases: ["molekül", "moleküller"], kind: "entity", descriptionTr: "Atomların kovalent bağla birleşmesi.", diagramLabel: "molekül" }),
    C({ id: "electron", domain: "physics", labelTr: "elektron", aliases: ["elektron", "elektronlar"], kind: "entity", descriptionTr: "Negatif yüklü temel parçacık.", diagramLabel: "elektron" }),

    // ---------- Malzeme / elmas ----------
    C({ id: "carbon_atom", domain: "chemistry", labelTr: "karbon atomu", aliases: ["karbon", "karbon atomu", "karbon atomları"], kind: "entity", descriptionTr: "Elmasın tamamını oluşturan element.", diagramLabel: "karbon" }),
    C({ id: "covalent_bond", domain: "chemistry", labelTr: "kovalent bağ", aliases: ["kovalent", "kovalent bağ", "bağ", "bağlar"], kind: "entity", descriptionTr: "Atomların elektron paylaşarak kurduğu güçlü bağ.", diagramLabel: "kovalent bağ" }),
    C({ id: "tetrahedral_lattice", domain: "materials", labelTr: "dört yüzlü kristal örgü", aliases: ["kristal", "kristal örgü", "kafes", "dört yüzlü", "tetrahedral"], kind: "entity", descriptionTr: "Her karbon atomunun dört karbonla dörtyüzlü biçimde bağlandığı 3B ağ.", diagramLabel: "kristal örgü" }),
    C({ id: "hardness", domain: "materials", labelTr: "sertlik", aliases: ["sert", "sertlik", "sertliği", "çizilmez"], kind: "property", descriptionTr: "Yüzeyin çizilmeye karşı direnci.", diagramLabel: "sertlik" }),
    C({ id: "brittleness", domain: "materials", labelTr: "gevreklik", aliases: ["gevrek", "gevreklik", "kırılgan", "kırılganlık"], kind: "property", descriptionTr: "Kırılmadan önce az deformasyon gösterme; ani kırılma eğilimi.", diagramLabel: "gevreklik" }),
    C({ id: "cleavage_plane", domain: "materials", labelTr: "dilimlenme düzlemi", aliases: ["dilimlenme", "yarma", "kristal düzlemi", "düzlem"], kind: "entity", descriptionTr: "Kristalde bağların en zayıf olduğu, kırılmanın izlediği düzlem.", diagramLabel: "dilimlenme düzlemi" }),
    C({ id: "crack_propagation", domain: "materials", labelTr: "çatlak ilerlemesi", aliases: ["çatlak", "çatlağın", "kırılma", "kırılır", "kırılmaz"], kind: "process", descriptionTr: "Çatlağın gerilme altında kristal boyunca yayılması.", diagramLabel: "çatlak" }),
    C({ id: "mechanical_stress", domain: "physics", labelTr: "mekanik gerilme", aliases: ["gerilme", "stres", "baskı", "darbe", "vurma"], kind: "quantity", descriptionTr: "Birim alana etkiyen kuvvet.", diagramLabel: "gerilme" }),
    C({ id: "toughness", domain: "materials", labelTr: "tokluk", aliases: ["tokluk", "dayanıklılık", "esnek"], kind: "property", descriptionTr: "Kırılmadan önce enerji soğurma kapasitesi.", diagramLabel: "tokluk" }),

    // ---------- Optik / gökyüzü ----------
    C({ id: "sunlight", domain: "physics", labelTr: "güneş ışığı", aliases: ["güneş", "güneş ışığı", "gün ışığı"], kind: "entity", descriptionTr: "Tüm görünür dalga boylarını içeren beyaz ışık.", diagramLabel: "güneş ışığı" }),
    C({ id: "atmosphere", domain: "earth", labelTr: "atmosfer", aliases: ["atmosfer", "hava", "atmosferde", "gökyüzü"], kind: "entity", descriptionTr: "Dünya'yı saran gaz karışımı.", diagramLabel: "atmosfer" }),
    C({ id: "gas_molecule", domain: "chemistry", labelTr: "gaz molekülü", aliases: ["azot", "oksijen molekülü", "moleküller", "gaz"], kind: "entity", descriptionTr: "Atmosferdeki N₂ ve O₂ molekülleri.", diagramLabel: "N₂ / O₂" }),
    C({ id: "rayleigh_scattering", domain: "physics", labelTr: "Rayleigh saçılması", aliases: ["rayleigh", "saçılma", "saçılır", "saçılması"], kind: "process", descriptionTr: "Işığın moleküllerden dalga boyunun dördüncü kuvvetiyle ters orantılı saçılması.", diagramLabel: "Rayleigh saçılması" }),
    C({ id: "wavelength", domain: "physics", labelTr: "dalga boyu", aliases: ["dalga boyu", "dalga boyları", "dalgaboyu", "kısa dalga", "uzun dalga"], kind: "quantity", descriptionTr: "Işığın rengini belirleyen fiziksel uzunluk.", diagramLabel: "dalga boyu" }),
    C({ id: "spectrum", domain: "physics", labelTr: "görünür tayf", aliases: ["tayf", "spektrum", "renk", "renkler", "mavi", "kırmızı"], kind: "entity", descriptionTr: "Görünür ışığın renk bileşenleri.", diagramLabel: "tayf" }),
    C({ id: "observer", domain: "physics", labelTr: "gözlemci", aliases: ["göz", "gözümüz", "bakarız", "görürüz", "görür"], kind: "entity", descriptionTr: "Işığı algılayan kişi.", diagramLabel: "gözlemci" }),
    C({ id: "horizon_path", domain: "earth", labelTr: "ufka yakın yol", aliases: ["ufuk", "gün batımı", "uzun yol", "yatay"], kind: "process", descriptionTr: "Güneş ufuktayken ışığın atmosferde kat ettiği uzun yol.", diagramLabel: "uzun yol" }),

    // ---------- Okyanus tuzluluğu ----------
    C({ id: "ocean", domain: "earth", labelTr: "okyanus", aliases: ["okyanus", "deniz", "denizler", "denizlerin"], kind: "entity", descriptionTr: "Dünya yüzeyinin büyük tuzlu su kütlesi.", diagramLabel: "okyanus" }),
    C({ id: "rock_weathering", domain: "geology", labelTr: "kayaç ayrışması", aliases: ["aşınma", "ayrışma", "kaya", "kayalar", "kayaların"], kind: "process", descriptionTr: "Su ve asitlerin kayadaki mineralleri çözmesi.", diagramLabel: "ayrışma" }),
    C({ id: "river_transport", domain: "earth", labelTr: "akarsu taşınımı", aliases: ["nehir", "nehirler", "akarsu", "akar", "taşır"], kind: "process", descriptionTr: "Çözünmüş iyonların akarsularla denize taşınması.", diagramLabel: "nehir" }),
    C({ id: "sodium_ion", domain: "chemistry", labelTr: "sodyum iyonu", aliases: ["sodyum", "na+", "sodyum iyonu"], kind: "entity", descriptionTr: "Suda çözünmüş pozitif sodyum iyonu.", diagramLabel: "Na⁺" }),
    C({ id: "chloride_ion", domain: "chemistry", labelTr: "klorür iyonu", aliases: ["klor", "klorür", "cl-", "tuz"], kind: "entity", descriptionTr: "Suda çözünmüş negatif klorür iyonu.", diagramLabel: "Cl⁻" }),
    C({ id: "evaporation", domain: "physics", labelTr: "buharlaşma", aliases: ["buharlaşma", "buharlaşır", "buhar"], kind: "process", descriptionTr: "Su moleküllerinin sıvıdan gaz hâline geçmesi.", diagramLabel: "buharlaşma" }),
    C({ id: "water_cycle", domain: "earth", labelTr: "su döngüsü", aliases: ["su döngüsü", "yağmur", "yağış"], kind: "process", descriptionTr: "Suyun deniz, atmosfer ve kara arasındaki dolaşımı.", diagramLabel: "su döngüsü" }),
    C({ id: "ion_hydration", domain: "chemistry", labelTr: "iyon hidratasyonu", aliases: ["hidratasyon", "su molekülleri", "sarmalar", "çevreler"], kind: "process", descriptionTr: "Su moleküllerinin iyonları sararak çözeltide tutması.", diagramLabel: "hidratasyon" }),

    // ---------- Kara delik ----------
    C({ id: "black_hole", domain: "astronomy", labelTr: "kara delik", aliases: ["kara delik", "kara deliğin", "kara delikler"], kind: "entity", descriptionTr: "Işığın kaçamadığı kadar yoğun kütle çekim alanına sahip cisim.", diagramLabel: "kara delik" }),
    C({ id: "event_horizon", domain: "astronomy", labelTr: "olay ufku", aliases: ["olay ufku", "olay ufkunu", "ufuk"], kind: "entity", descriptionTr: "Kara deliğin, kaçış hızının ışık hızını aştığı sınırı.", diagramLabel: "olay ufku" }),
    C({ id: "spacetime_curvature", domain: "astronomy", labelTr: "uzay-zaman eğriliği", aliases: ["uzay-zaman", "uzay zaman", "eğrilik", "eğriliği", "bükülme"], kind: "process", descriptionTr: "Kütlenin uzay-zamanı bükmesi.", diagramLabel: "uzay-zaman" }),
    C({ id: "accretion_disk", domain: "astronomy", labelTr: "yığılma diski", aliases: ["yığılma diski", "disk", "diski"], kind: "entity", descriptionTr: "Kara deliğin çevresinde dönen sıcak madde diski.", diagramLabel: "yığılma diski" }),
    C({ id: "gravitational_lensing", domain: "astronomy", labelTr: "kütle çekimsel mercekleme", aliases: ["mercekleme", "mercek", "bükülür", "sapma"], kind: "process", descriptionTr: "Kütle çekiminin ışığın yolunu bükmesi.", diagramLabel: "mercekleme" }),
    C({ id: "escape_velocity", domain: "astronomy", labelTr: "kaçış hızı", aliases: ["kaçış hızı", "kaçamaz", "kaçar"], kind: "quantity", descriptionTr: "Bir cismin çekim alanından kurtulmak için gereken hız.", diagramLabel: "kaçış hızı" }),
    C({ id: "singularity", domain: "astronomy", labelTr: "tekillik", aliases: ["tekillik", "merkez"], kind: "entity", descriptionTr: "Kara deliğin merkezindeki yoğunluk bölgesi (kuantum kütle çekimi bilinmiyor).", diagramLabel: "tekillik" }),

    // ---------- Elektrik iletkenliği ----------
    C({ id: "metal_lattice", domain: "physics", labelTr: "metal örgüsü", aliases: ["metal", "metaller", "örgü", "metal örgüsü"], kind: "entity", descriptionTr: "Pozitif iyonların düzenli dizildiği metal yapısı.", diagramLabel: "metal örgüsü" }),
    C({ id: "free_electron", domain: "physics", labelTr: "serbest elektron", aliases: ["serbest elektron", "serbest elektronlar", "elektron denizi"], kind: "entity", descriptionTr: "Metalde atomlar arasında serbestçe hareket eden elektronlar.", diagramLabel: "serbest e⁻" }),
    C({ id: "electric_field", domain: "physics", labelTr: "elektrik alanı", aliases: ["elektrik alanı", "gerilim", "voltaj", "potansiyel fark"], kind: "quantity", descriptionTr: "Yüklü parçacıkları iten alan.", diagramLabel: "E alanı" }),
    C({ id: "drift_velocity", domain: "physics", labelTr: "sürüklenme hızı", aliases: ["sürüklenme", "akar", "akım", "hareket eder"], kind: "quantity", descriptionTr: "Elektronların alan yönünde ortalama ilerleme hızı.", diagramLabel: "sürüklenme" }),
    C({ id: "collision_scattering", domain: "physics", labelTr: "çarpışma saçılması", aliases: ["çarpışma", "çarpışır", "titreşim", "direnç"], kind: "process", descriptionTr: "Elektronların iyonlarla çarpışıp enerji kaybetmesi (direnç).", diagramLabel: "direnç" }),
    C({ id: "insulator", domain: "physics", labelTr: "yalıtkan", aliases: ["yalıtkan", "plastik", "cam"], kind: "entity", descriptionTr: "Elektronlarını serbest bırakmayan malzeme.", diagramLabel: "yalıtkan" }),
    C({ id: "current", domain: "physics", labelTr: "elektrik akımı", aliases: ["akım", "elektrik", "amper"], kind: "quantity", descriptionTr: "Birim zamanda geçen yük miktarı.", diagramLabel: "akım" }),

    // ---------- Mitokondri ----------
    C({ id: "cell", domain: "biology", labelTr: "hücre", aliases: ["hücre", "hücrenin", "hücrede"], kind: "entity", descriptionTr: "Canlıların temel yapı birimi.", diagramLabel: "hücre" }),
    C({ id: "cell_membrane", domain: "biology", labelTr: "hücre zarı", aliases: ["zar", "hücre zarı", "membran"], kind: "entity", descriptionTr: "Hücreyi çevreleyen seçici geçirgen zar.", diagramLabel: "hücre zarı" }),
    C({ id: "mitochondrion", domain: "biology", labelTr: "mitokondri", aliases: ["mitokondri", "mitokondriler", "mitokondrinin"], kind: "entity", descriptionTr: "ATP üreten çift zarlı organel.", diagramLabel: "mitokondri" }),
    C({ id: "cristae", domain: "biology", labelTr: "krista", aliases: ["krista", "kristalar", "iç zar", "kıvrım"], kind: "entity", descriptionTr: "İç zarın yüzey alanını artıran kıvrımları.", diagramLabel: "krista" }),
    C({ id: "proton_gradient", domain: "biology", labelTr: "proton eğimi", aliases: ["proton", "proton eğimi", "hidrojen iyonu", "gradyan"], kind: "quantity", descriptionTr: "Zarlar arasındaki H⁺ derişim farkı.", diagramLabel: "H⁺ eğimi" }),
    C({ id: "atp_synthase", domain: "biology", labelTr: "ATP sentaz", aliases: ["atp sentaz", "atp sentez", "sentaz"], kind: "entity", descriptionTr: "Proton akışıyla dönen ve ATP üreten enzim.", diagramLabel: "ATP sentaz" }),
    C({ id: "atp", domain: "biology", labelTr: "ATP", aliases: ["atp", "enerji molekülü"], kind: "entity", descriptionTr: "Hücrenin kullanılabilir enerji taşıyıcısı.", diagramLabel: "ATP" }),
    C({ id: "electron_transport_chain", domain: "biology", labelTr: "elektron taşıma zinciri", aliases: ["elektron taşıma", "zincir", "kompleksler"], kind: "process", descriptionTr: "İç zarda elektronların aktarıldığı protein kompleksleri dizisi.", diagramLabel: "ETZ" }),
    C({ id: "glucose", domain: "biology", labelTr: "glikoz", aliases: ["glikoz", "şeker", "besin"], kind: "entity", descriptionTr: "Solunumda parçalanan altı karbonlu şeker.", diagramLabel: "glikoz" }),
    C({ id: "oxygen", domain: "biology", labelTr: "oksijen", aliases: ["oksijen", "o2"], kind: "entity", descriptionTr: "Solunumun son elektron alıcısı.", diagramLabel: "O₂" }),
    C({ id: "water", domain: "chemistry", labelTr: "su", aliases: ["su", "suyu"], kind: "entity", descriptionTr: "H₂O molekülü.", diagramLabel: "H₂O" }),
    C({ id: "carbon_dioxide", domain: "biology", labelTr: "karbondioksit", aliases: ["karbondioksit", "co2", "karbon dioksit"], kind: "entity", descriptionTr: "Solunumda açığa çıkan gaz.", diagramLabel: "CO₂" }),

    // ---------- Deprem ----------
    C({ id: "tectonic_plate", domain: "geology", labelTr: "tektonik levha", aliases: ["levha", "levhalar", "tektonik", "plaka"], kind: "entity", descriptionTr: "Litosferin hareket eden büyük parçaları.", diagramLabel: "levha" }),
    C({ id: "fault_line", domain: "geology", labelTr: "fay hattı", aliases: ["fay", "fay hattı", "faylar"], kind: "entity", descriptionTr: "Levhalar arasındaki kırık ve gerilme birikim bölgesi.", diagramLabel: "fay" }),
    C({ id: "elastic_strain", domain: "geology", labelTr: "elastik birikim", aliases: ["birikir", "gerilme birikimi", "sıkışma", "elastik"], kind: "quantity", descriptionTr: "Fay kilitliyken kayada depolanan elastik enerji.", diagramLabel: "birikim" }),
    C({ id: "rupture", domain: "geology", labelTr: "kırılma", aliases: ["kırılma", "kopma", "kayma", "aniden"], kind: "process", descriptionTr: "Gerilmenin kayanın dayanımını aşmasıyla fayın aniden kayması.", diagramLabel: "kırılma" }),
    C({ id: "seismic_wave", domain: "geology", labelTr: "sismik dalga", aliases: ["sismik", "deprem dalgası", "dalga", "sarsıntı"], kind: "process", descriptionTr: "Kırılmadan yayılan enerji dalgaları.", diagramLabel: "sismik dalga" }),
    C({ id: "plate_motion", domain: "geology", labelTr: "levha hareketi", aliases: ["hareket", "kayar", "yaklaşır", "uzaklaşır"], kind: "process", descriptionTr: "Manto konveksiyonuyla levhaların yılda birkaç cm hareketi.", diagramLabel: "levha hareketi" }),

    // ---------- Fotosentez ----------
    C({ id: "chloroplast", domain: "biology", labelTr: "kloroplast", aliases: ["kloroplast", "kloroplastlar"], kind: "entity", descriptionTr: "Bitkide fotosentezin gerçekleştiği organel.", diagramLabel: "kloroplast" }),
    C({ id: "chlorophyll", domain: "biology", labelTr: "klorofil", aliases: ["klorofil", "pigment", "yeşil"], kind: "entity", descriptionTr: "Işığı soğuran yeşil pigment.", diagramLabel: "klorofil" }),
    C({ id: "light_reaction", domain: "biology", labelTr: "ışık tepkimeleri", aliases: ["ışık tepkimeleri", "ışık enerjisi", "fotosentez"], kind: "process", descriptionTr: "Su ve ışıkla ATP ile NADPH üretimi.", diagramLabel: "ışık tepkimesi" }),
    C({ id: "calvin_cycle", domain: "biology", labelTr: "Calvin döngüsü", aliases: ["calvin", "karbon bağlama", "şeker üretimi"], kind: "process", descriptionTr: "CO₂'nin şekere dönüştürüldüğü döngü.", diagramLabel: "Calvin döngüsü" }),
    C({ id: "stomata", domain: "biology", labelTr: "stoma", aliases: ["stoma", "gözenek", "yaprak"], kind: "entity", descriptionTr: "Yaprakta gaz alışverişini sağlayan gözenekler.", diagramLabel: "stoma" }),
    C({ id: "sunlight_energy", domain: "biology", labelTr: "ışık enerjisi", aliases: ["güneş enerjisi", "ışık enerjisi", "güneş ışığı"], kind: "quantity", descriptionTr: "Fotosentezi süren enerji girdisi.", diagramLabel: "ışık enerjisi" }),

    // ---------- Beyin / bellek ----------
    C({ id: "neuron", domain: "biology", labelTr: "nöron", aliases: ["nöron", "nöronlar", "sinir hücresi"], kind: "entity", descriptionTr: "Sinir sinyali taşıyan hücre.", diagramLabel: "nöron" }),
    C({ id: "synapse", domain: "biology", labelTr: "sinaps", aliases: ["sinaps", "sinapslar", "bağlantı noktası"], kind: "entity", descriptionTr: "İki nöron arasındaki iletişim bölgesi.", diagramLabel: "sinaps" }),
    C({ id: "neurotransmitter", domain: "biology", labelTr: "nörotransmitter", aliases: ["nörotransmitter", "taşıyıcı molekül"], kind: "entity", descriptionTr: "Sinaptik aralığa salınan kimyasal haberci.", diagramLabel: "nörotransmitter" }),
    C({ id: "ltp", domain: "biology", labelTr: "uzun süreli güçlenme", aliases: ["güçlenir", "ltp", "uzun süreli", "pekişir"], kind: "process", descriptionTr: "Sık kullanılan sinaptik bağlantının güçlenmesi.", diagramLabel: "LTP" }),
    C({ id: "hippocampus", domain: "biology", labelTr: "hipokampus", aliases: ["hipokampus", "beyin", "beynin"], kind: "entity", descriptionTr: "Bellek oluşumunda rol alan beyin bölgesi.", diagramLabel: "hipokampus" }),
    C({ id: "synaptic_pruning", domain: "biology", labelTr: "sinaptik budama", aliases: ["budama", "zayıflar", "silinir", "unutma"], kind: "process", descriptionTr: "Kullanılmayan bağlantıların zayıflayıp elenmesi.", diagramLabel: "budama" }),

    // ---------- Gravitasyon ----------
    C({ id: "mass", domain: "physics", labelTr: "kütle", aliases: ["kütle", "ağır", "kütlesi"], kind: "quantity", descriptionTr: "Madde miktarı ve çekim kaynağı.", diagramLabel: "kütle" }),
    C({ id: "gravitational_force", domain: "physics", labelTr: "kütle çekim kuvveti", aliases: ["kütle çekim", "yer çekimi", "çekim kuvveti", "çekim"], kind: "quantity", descriptionTr: "Kütlelerin birbirini çekmesi.", diagramLabel: "çekim" }),
    C({ id: "free_fall", domain: "physics", labelTr: "serbest düşme", aliases: ["düşme", "düşer", "serbest düşme"], kind: "process", descriptionTr: "Yalnızca çekim etkisiyle hareket.", diagramLabel: "serbest düşme" }),
    C({ id: "acceleration", domain: "physics", labelTr: "ivme", aliases: ["ivme", "hızlanma", "hızlanır"], kind: "quantity", descriptionTr: "Hızın zamanla değişimi.", diagramLabel: "ivme" }),
  ].map((c) => [c.id, c]),
);

export function getConcept(id: string): Concept {
  const c = CONCEPTS[id];
  if (!c) throw new Error(`Bilinmeyen kavram: ${id}`);
  return c;
}

export function conceptLabels(ids: string[]): string[] {
  return ids.map((id) => CONCEPTS[id]?.labelTr ?? id);
}
