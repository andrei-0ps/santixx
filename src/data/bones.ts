
export type BoneCategory =
  | "craniu"
  | "fata"
  | "ureche"
  | "gat"
  | "coloana"
  | "torace"
  | "centura-scapulara"
  | "brat"
  | "antebrat"
  | "mana"
  | "centura-pelviana"
  | "coapsa"
  | "gamba"
  | "picior";

export interface Bone {
  id: string;
  name: string;
  latin: string;
  category: BoneCategory;
  count: number; // câte există în corp
  description: string;
  funcție: string;
  description_en?: string;
  functie_en?: string;
}

export const categoryLabels: Record<BoneCategory, string> = {
  craniu: "Craniu (neurocraniu)",
  fata: "Oasele feței",
  ureche: "Urechea medie",
  gat: "Gât și hioid",
  coloana: "Coloana vertebrală",
  torace: "Cutia toracică",
  "centura-scapulara": "Centura scapulară",
  brat: "Brațul",
  antebrat: "Antebrațul",
  mana: "Mâna",
  "centura-pelviana": "Centura pelviană",
  coapsa: "Coapsa",
  gamba: "Gamba",
  picior: "Piciorul",
};

export const categoryLabelsEn: Record<BoneCategory, string> = {
  craniu: "Skull (neurocranium)",
  fata: "Facial bones",
  ureche: "Middle ear",
  gat: "Neck and hyoid",
  coloana: "Vertebral column",
  torace: "Thoracic cage",
  "centura-scapulara": "Shoulder girdle",
  brat: "Arm",
  antebrat: "Forearm",
  mana: "Hand",
  "centura-pelviana": "Pelvic girdle",
  coapsa: "Thigh",
  gamba: "Leg",
  picior: "Foot",
};

export const bones: Bone[] = [
  { id: "frontal", name: "Os frontal", latin: "Os frontale", category: "craniu", count: 1, description: "Os plat ce formează fruntea și partea anterioară a bolții craniene.", funcție: "Protejează lobii frontali ai creierului și formează plafonul orbitelor.", description_en: "Flat bone forming the forehead and the anterior part of the skull vault.", functie_en: "Protects the frontal lobes of the brain and forms the roof of the eye sockets." },
  { id: "parietal", name: "Oase parietale", latin: "Os parietale", category: "craniu", count: 2, description: "Două oase pereche ce alcătuiesc părțile laterale și superioare ale calotei craniene.", funcție: "Protejează emisferele cerebrale.", description_en: "Two paired bones forming the lateral and superior parts of the skull cap.", functie_en: "Protect the cerebral hemispheres." },
  { id: "temporal", name: "Oase temporale", latin: "Os temporale", category: "craniu", count: 2, description: "Conțin urechea internă și medie; situate lateral, sub parietale.", funcție: "Adăpostesc structurile auditive și de echilibru.", description_en: "Contain the inner and middle ear; located laterally, below the parietal bones.", functie_en: "House the auditory and balance structures." },
  { id: "occipital", name: "Os occipital", latin: "Os occipitale", category: "craniu", count: 1, description: "Os posterior al craniului, cu marele orificiu (foramen magnum).", funcție: "Permite trecerea măduvei spinării și protejează cerebelul.", description_en: "Posterior bone of the skull, with the large opening (foramen magnum).", functie_en: "Allows passage of the spinal cord and protects the cerebellum." },
  { id: "sfenoid", name: "Os sfenoid", latin: "Os sphenoidale", category: "craniu", count: 1, description: "Os central în formă de fluture, articulat cu toate celelalte oase craniene.", funcție: "Susține baza craniului și conține șaua turcească pentru hipofiză.", description_en: "Central butterfly-shaped bone, articulating with all other cranial bones.", functie_en: "Supports the base of the skull and contains the sella turcica for the pituitary gland." },
  { id: "etmoid", name: "Os etmoid", latin: "Os ethmoidale", category: "craniu", count: 1, description: "Os ușor și spongios, situat între orbite, formând tavanul cavității nazale.", funcție: "Suport pentru mucoasa olfactivă; conține celulele etmoidale.", description_en: "Light, spongy bone situated between the orbits, forming the roof of the nasal cavity.", functie_en: "Supports the olfactory mucosa; contains the ethmoidal air cells." },

  { id: "maxilar", name: "Maxilare", latin: "Maxilla", category: "fata", count: 2, description: "Formează mandibula superioară și conțin alveolele dentare superioare.", funcție: "Susțin dentiția superioară și formează plafonul cavității bucale.", description_en: "Form the upper jaw and contain the upper dental sockets.", functie_en: "Support the upper teeth and form the roof of the oral cavity." },
  { id: "mandibula", name: "Mandibulă", latin: "Mandibula", category: "fata", count: 1, description: "Singurul os mobil al craniului; formează maxilarul inferior.", funcție: "Permite masticația și articularea vorbirii.", description_en: "The only mobile bone of the skull; forms the lower jaw.", functie_en: "Enables chewing and articulation of speech." },
  { id: "zigomatic", name: "Oase zigomatice", latin: "Os zygomaticum", category: "fata", count: 2, description: "Oasele pomeților obrajilor.", funcție: "Conturează fața și protejează lateral orbitele.", description_en: "The cheekbones.", functie_en: "Contour the face and protect the orbits laterally." },
  { id: "nazal", name: "Oase nazale", latin: "Os nasale", category: "fata", count: 2, description: "Două oase mici ce formează puntea nasului.", funcție: "Susțin partea superioară a piramidei nazale.", description_en: "Two small bones forming the bridge of the nose.", functie_en: "Support the upper part of the nasal bridge." },
  { id: "lacrimal", name: "Oase lacrimale", latin: "Os lacrimale", category: "fata", count: 2, description: "Cele mai mici oase ale feței, situate în peretele medial al orbitei.", funcție: "Conțin canalul nazo-lacrimal.", description_en: "The smallest facial bones, located in the medial wall of the orbit.", functie_en: "Contain the nasolacrimal duct." },
  { id: "palatin", name: "Oase palatine", latin: "Os palatinum", category: "fata", count: 2, description: "Formează partea posterioară a palatului dur.", funcție: "Separă cavitatea bucală de cea nazală.", description_en: "Form the posterior part of the hard palate.", functie_en: "Separate the oral cavity from the nasal cavity." },
  { id: "vomer", name: "Vomer", latin: "Vomer", category: "fata", count: 1, description: "Os subțire ce formează partea inferioară a septului nazal.", funcție: "Divide cavitatea nazală în două fose.", description_en: "Thin bone forming the inferior part of the nasal septum.", functie_en: "Divides the nasal cavity into two fossae." },
  { id: "cornet-inf", name: "Cornete nazale inferioare", latin: "Concha nasalis inferior", category: "fata", count: 2, description: "Lame osoase încârligate în peretele lateral al cavității nazale.", funcție: "Încălzesc și umidifică aerul inspirat.", description_en: "Curved bony plates in the lateral wall of the nasal cavity.", functie_en: "Warm and humidify inspired air." },

  { id: "ciocan", name: "Ciocane (Maleole)", latin: "Malleus", category: "ureche", count: 2, description: "Cel mai mare osișor al urechii medii, atașat de timpan.", funcție: "Transmite vibrațiile timpanului către nicovală.", description_en: "The largest ossicle of the middle ear, attached to the eardrum.", functie_en: "Transmits eardrum vibrations to the incus." },
  { id: "nicovala", name: "Nicovale", latin: "Incus", category: "ureche", count: 2, description: "Os în formă de nicovală, situat între ciocan și scăriță.", funcție: "Continuă transmiterea vibrațiilor sonore.", description_en: "Anvil-shaped bone situated between the malleus and the stapes.", functie_en: "Continues the transmission of sound vibrations." },
  { id: "scarita", name: "Scărițe", latin: "Stapes", category: "ureche", count: 2, description: "Cel mai mic os din corp; sprijinit pe fereastra ovală.", funcție: "Transmite vibrațiile către urechea internă.", description_en: "The smallest bone in the body; rests on the oval window.", functie_en: "Transmits vibrations to the inner ear." },

  { id: "hioid", name: "Os hioid", latin: "Os hyoideum", category: "gat", count: 1, description: "Os în formă de potcoavă, suspendat în gât, fără articulații cu alte oase.", funcție: "Punct de inserție pentru mușchii limbii și ai laringelui.", description_en: "Horseshoe-shaped bone suspended in the neck, not articulating with any other bone.", functie_en: "Attachment point for the muscles of the tongue and larynx." },

  { id: "vert-cervicale", name: "Vertebre cervicale (C1–C7)", latin: "Vertebrae cervicales", category: "coloana", count: 7, description: "Cele 7 vertebre ale gâtului, cu Atlas (C1) și Axis (C2) ca primele două.", funcție: "Susțin capul și permit rotația și flexia gâtului." , description_en: "The 7 neck vertebrae, with the Atlas (C1) and Axis (C2) as the first two.", functie_en: "Support the head and allow rotation and flexion of the neck." },
  { id: "vert-toracice", name: "Vertebre toracice (T1–T12)", latin: "Vertebrae thoracicae", category: "coloana", count: 12, description: "Vertebrele zonei toracice, articulate cu coastele.", funcție: "Punct de inserție pentru coaste; protejează măduva." , description_en: "The vertebrae of the thoracic region, articulated with the ribs.", functie_en: "Attachment point for ribs; protect the spinal cord." },
  { id: "vert-lombare", name: "Vertebre lombare (L1–L5)", latin: "Vertebrae lumbales", category: "coloana", count: 5, description: "Cele mai mari vertebre, situate în zona inferioară a spatelui.", funcție: "Susțin greutatea trunchiului superior." , description_en: "The largest vertebrae, located in the lower back.", functie_en: "Support the weight of the upper trunk." },
  { id: "sacrum", name: "Sacrum", latin: "Os sacrum", category: "coloana", count: 1, description: "Os triunghiular format prin fuziunea a 5 vertebre sacrale.", funcție: "Conectează coloana cu pelvisul." , description_en: "Triangular bone formed by the fusion of 5 sacral vertebrae.", functie_en: "Connects the spine to the pelvis." },
  { id: "coccis", name: "Coccis", latin: "Os coccygis", category: "coloana", count: 1, description: "Vârful coloanei, format din 3–5 vertebre fuzionate.", funcție: "Punct de atașare pentru mușchii planșeului pelvian." , description_en: "The tip of the spine, formed from 3–5 fused vertebrae.", functie_en: "Attachment point for the pelvic floor muscles." },

  { id: "stern", name: "Stern", latin: "Sternum", category: "torace", count: 1, description: "Os plat central al toracelui, format din manubriu, corp și apendicele xifoid.", funcție: "Protejează inima și plămânii; punct de inserție pentru coaste." , description_en: "Flat central bone of the thorax, consisting of the manubrium, body and xiphoid process.", functie_en: "Protects the heart and lungs; attachment point for the ribs." },
  { id: "coaste", name: "Coaste", latin: "Costae", category: "torace", count: 24, description: "12 perechi: 7 adevărate, 3 false, 2 flotante.", funcție: "Formează cutia toracică și protejează organele vitale." , description_en: "12 pairs: 7 true, 3 false, 2 floating.", functie_en: "Form the rib cage and protect the vital organs." },

  { id: "clavicula", name: "Clavicule", latin: "Clavicula", category: "centura-scapulara", count: 2, description: "Os lung în formă de S, situat orizontal deasupra primei coaste.", funcție: "Conectează membrul superior de torace." , description_en: "Long S-shaped bone, positioned horizontally above the first rib.", functie_en: "Connects the upper limb to the thorax." },
  { id: "scapula", name: "Scapule (omoplați)", latin: "Scapula", category: "centura-scapulara", count: 2, description: "Oase plate triunghiulare situate posterior pe torace.", funcție: "Articulație pentru humerus; mobilitate amplă a brațului." , description_en: "Flat triangular bones situated on the posterior thorax.", functie_en: "Articulation for the humerus; provides wide range of arm movement." },

  { id: "humerus", name: "Humerus", latin: "Humerus", category: "brat", count: 2, description: "Cel mai mare os al membrului superior, între umăr și cot.", funcție: "Suport pentru mușchii brațului; permite mișcările umărului." , description_en: "The largest bone of the upper limb, between the shoulder and elbow.", functie_en: "Supports the arm muscles; enables shoulder movements." },

  { id: "radius", name: "Radius", latin: "Radius", category: "antebrat", count: 2, description: "Osul lateral al antebrațului, pe partea policelui.", funcție: "Permite rotația antebrațului (pronație/supinație)." , description_en: "The lateral bone of the forearm, on the thumb side.", functie_en: "Enables forearm rotation (pronation and supination)." },
  { id: "ulna", name: "Ulnă (cubitus)", latin: "Ulna", category: "antebrat", count: 2, description: "Osul medial al antebrațului, formează vârful cotului.", funcție: "Stabilizează articulația cotului." , description_en: "The medial bone of the forearm, forming the tip of the elbow.", functie_en: "Stabilises the elbow joint." },

  { id: "carp", name: "Oase carpiene", latin: "Ossa carpi", category: "mana", count: 16, description: "8 oase pe fiecare mână, dispuse pe două rânduri (scafoid, semilunar, piramidal etc.).", funcție: "Formează încheietura mâinii; permit mobilitate fină." , description_en: "8 bones in each hand, arranged in two rows (scaphoid, lunate, triquetrum, etc.).", functie_en: "Form the wrist joint; allow fine mobility." },
  { id: "metacarp", name: "Metacarpiene", latin: "Ossa metacarpi", category: "mana", count: 10, description: "5 oase lungi în palma fiecărei mâini.", funcție: "Susțin palma și articulează degetele." , description_en: "5 long bones in the palm of each hand.", functie_en: "Support the palm and connect to the fingers." },
  { id: "falange-mana", name: "Falange (mână)", latin: "Phalanges manus", category: "mana", count: 28, description: "14 falange pe mână: 2 pentru police, 3 pentru fiecare deget.", funcție: "Permit mișcarea fină a degetelor." , description_en: "14 phalanges per hand: 2 for the thumb, 3 for each finger.", functie_en: "Enable fine finger movement." },

  { id: "coxal", name: "Oase coxale", latin: "Os coxae", category: "centura-pelviana", count: 2, description: "Fiecare format din ilion, ischion și pubis fuzionate.", funcție: "Formează pelvisul; suportă greutatea trunchiului." , description_en: "Each formed from the fused ilium, ischium and pubis.", functie_en: "Form the pelvis; support the weight of the trunk." },

  { id: "femur", name: "Femur", latin: "Femur", category: "coapsa", count: 2, description: "Cel mai lung și puternic os din corp.", funcție: "Suportă greutatea corpului în mers și sprijin." , description_en: "The longest and strongest bone in the body.", functie_en: "Supports body weight during walking and standing." },
  { id: "rotula", name: "Rotule (patelă)", latin: "Patella", category: "coapsa", count: 2, description: "Os sesamoid în fața articulației genunchiului.", funcție: "Protejează genunchiul și optimizează acțiunea cvadricepsului." , description_en: "Sesamoid bone in front of the knee joint.", functie_en: "Protects the knee and optimises quadriceps action." },

  { id: "tibia", name: "Tibia", latin: "Tibia", category: "gamba", count: 2, description: "Osul medial și mai gros al gambei.", funcție: "Suportă greutatea corpului între genunchi și gleznă." , description_en: "The medial and thicker bone of the leg.", functie_en: "Supports body weight between the knee and ankle." },
  { id: "fibula", name: "Fibulă (peroneu)", latin: "Fibula", category: "gamba", count: 2, description: "Osul subțire lateral al gambei.", funcție: "Stabilizează glezna; punct de inserție musculară." , description_en: "The thin lateral bone of the leg.", functie_en: "Stabilises the ankle; muscular insertion point." },

  { id: "tars", name: "Oase tarsiene", latin: "Ossa tarsi", category: "picior", count: 14, description: "7 oase pe picior, inclusiv calcaneu (călcâi) și astragal.", funcție: "Formează glezna și partea posterioară a piciorului." , description_en: "7 bones per foot, including the calcaneus (heel bone) and talus.", functie_en: "Form the ankle and rear part of the foot." },
  { id: "metatars", name: "Metatarsiene", latin: "Ossa metatarsi", category: "picior", count: 10, description: "5 oase lungi în partea mijlocie a fiecărui picior.", funcție: "Susțin bolta plantară și transferă greutatea." , description_en: "5 long bones in the midfoot of each foot.", functie_en: "Support the plantar arch and transfer body weight." },
  { id: "falange-picior", name: "Falange (picior)", latin: "Phalanges pedis", category: "picior", count: 28, description: "14 falange pe picior: 2 pentru haluce, 3 pentru fiecare deget.", funcție: "Permit propulsia în mers și echilibrul." , description_en: "14 phalanges per foot: 2 for the big toe, 3 for each other toe.", functie_en: "Enable propulsion during walking and help maintain balance." },
];

export const totalBoneCount = bones.reduce((sum, b) => sum + b.count, 0);
