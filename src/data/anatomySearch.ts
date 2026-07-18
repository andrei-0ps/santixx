import { bones } from "./bones";
import { getAnatomyDisplayName } from "./anatomyDisplayNames";
import { internalOrgans } from "./internalOrgans";
import type { BoneSelection } from "@/components/skeleton/SkeletonScene";
import type { LayerMode } from "@/components/skeleton/LayersToggle";

export type AnatomySearchResult = {
  key: string;
  tissue: "os" | "muschi" | "organ";
  layer: LayerMode;
  label: string;
  labelEn: string;
  subtitle: string;
  subtitleEn: string;
  selection: BoneSelection;
  keywords: string[];
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Everyday / popular terms keyed by structure id, so a user can type "umăr",
// "talpă" or "fluierul piciorului" instead of the anatomical name.
const BONE_ALIASES: Record<string, string[]> = {
  frontal: ["cap", "frunte", "craniu", "teasta", "scafarlie"],
  parietal: ["cap", "craniu", "crestet"],
  temporal: ["tampla", "cap", "craniu"],
  occipital: ["ceafa", "spatele capului", "craniu"],
  mandibula: ["falca", "barbie", "maxilar inferior"],
  maxilar: ["falca", "maxilar superior"],
  zigomatic: ["pomet", "obraz"],
  nazal: ["nas", "puntea nasului"],
  "vert-cervicale": ["gat", "ceafa", "cervical"],
  "vert-toracice": ["spate", "spate superior", "coloana", "sira spinarii"],
  "vert-lombare": ["spate", "spate jos", "sale", "lombara", "mijloc"],
  sacrum: ["sacru", "bazin", "coccis"],
  coccis: ["coada", "os coada"],
  stern: ["piept", "osul pieptului"],
  coaste: ["coasta", "piept", "cutia toracica"],
  clavicula: ["umar", "claviculă", "gat umar"],
  scapula: ["umar", "omoplat", "spate umar"],
  humerus: ["brat", "os brat"],
  radius: ["antebrat", "cot"],
  ulna: ["antebrat", "cot", "cubitus"],
  carp: ["incheietura", "pumn", "incheietura mainii", "mana"],
  metacarp: ["mana", "palma", "dosul palmei"],
  "falange-mana": ["degete", "deget mana", "falange"],
  coxal: ["sold", "bazin", "pelvis", "soldul"],
  femur: ["coapsa", "os coapsa", "picior"],
  rotula: ["genunchi", "rotula", "patela"],
  tibia: ["fluierul piciorului", "gamba", "tibie", "picior"],
  fibula: ["gamba", "peroneu", "picior"],
  tars: ["glezna", "calcai", "calcaiul"],
  metatars: ["talpa", "laba piciorului", "picior"],
  "falange-picior": ["degete picior", "deget picior", "haluce"],
  ciocan: ["ureche", "urechea medie"],
  nicovala: ["ureche", "urechea medie"],
  scarita: ["ureche", "urechea medie"],
  hioid: ["gat", "limba"],
};

const ORGAN_ALIASES: Record<string, string[]> = {
  "organ:inima": ["cord", "puls", "bataie", "cardiac"],
  "organ:plamani": ["plaman", "respiratie", "bronhii"],
  "organ:ficat": ["fiere", "hepatic"],
  "organ:stomac": ["burta", "gastric", "stomacul"],
  "organ:rinichi": ["renal", "rinichii"],
  "organ:intestine": ["intestin", "intestine", "burta", "matze"],
  "organ:vezica": ["basica", "urina", "vezica urinara"],
  "organ:splina": ["splina"],
  "organ:pancreas": ["pancreas", "glicemie"],
  "organ:creier": ["creier", "cap", "minte", "cerebral"],
};

type MuscleRegion = {
  id: string;
  ro: string;
  en: string;
  aliases: string[];
};

const MUSCLE_REGIONS: MuscleRegion[] = [
  {
    id: "muschi:muschii-capului-gatului",
    ro: "Mușchii capului și gâtului",
    en: "Head and neck muscles",
    aliases: ["gat", "ceafa", "fata"],
  },
  {
    id: "muschi:muschii-umarului",
    ro: "Mușchii umărului",
    en: "Shoulder muscles",
    aliases: ["umar", "deltoid"],
  },
  {
    id: "muschi:muschii-bratului",
    ro: "Mușchii brațului",
    en: "Arm muscles",
    aliases: ["brat", "biceps", "triceps"],
  },
  {
    id: "muschi:muschii-antebratului",
    ro: "Mușchii antebrațului",
    en: "Forearm muscles",
    aliases: ["antebrat"],
  },
  {
    id: "muschi:muschii-mainii",
    ro: "Mușchii mâinii",
    en: "Hand muscles",
    aliases: ["mana", "palma", "degete"],
  },
  {
    id: "muschi:muschii-toracelui",
    ro: "Mușchii toracelui",
    en: "Chest muscles",
    aliases: ["piept", "pectoral", "pectorali"],
  },
  {
    id: "muschi:muschii-spatelui",
    ro: "Mușchii spatelui",
    en: "Back muscles",
    aliases: ["spate", "dorsali", "trapez"],
  },
  {
    id: "muschi:muschii-soldului",
    ro: "Mușchii șoldului",
    en: "Hip muscles",
    aliases: ["sold", "fesa", "fesieri", "fund"],
  },
  {
    id: "muschi:muschii-coapsei",
    ro: "Mușchii coapsei",
    en: "Thigh muscles",
    aliases: ["coapsa", "cvadriceps", "ischiogambieri"],
  },
  {
    id: "muschi:muschii-gambei",
    ro: "Mușchii gambei",
    en: "Calf muscles",
    aliases: ["gamba", "pulpa", "gemeni", "soleus"],
  },
  {
    id: "muschi:muschii-piciorului",
    ro: "Mușchii labei piciorului",
    en: "Foot muscles",
    aliases: ["talpa", "laba piciorului", "picior"],
  },
];

function buildIndex(): AnatomySearchResult[] {
  const entries: AnatomySearchResult[] = [];

  for (const bone of bones) {
    const aliases = BONE_ALIASES[bone.id] ?? [];
    const selection: BoneSelection = {
      id: bone.id,
      side: "male",
      tissue: "os",
      label: bone.name,
      labelEn: bone.name,
    };
    const displayRo = getAnatomyDisplayName({ bone, selection, lang: "ro" });
    const displayEn = getAnatomyDisplayName({ bone, selection, lang: "en" });
    entries.push({
      key: `os:${bone.id}`,
      tissue: "os",
      layer: "skeleton",
      label: displayRo.title,
      labelEn: displayEn.title,
      subtitle: displayRo.subtitle ?? "Os",
      subtitleEn: displayEn.subtitle ?? "Bone",
      selection: {
        ...selection,
        label: displayRo.title,
        labelEn: displayEn.title,
      },
      keywords: [bone.name, bone.latin, displayRo.title, displayEn.title, ...aliases].map(
        normalize,
      ),
    });
  }

  for (const region of MUSCLE_REGIONS) {
    entries.push({
      key: region.id,
      tissue: "muschi",
      layer: "muscles",
      label: region.ro,
      labelEn: region.en,
      subtitle: "Grup muscular",
      subtitleEn: "Muscle group",
      selection: {
        id: region.id,
        side: "male",
        tissue: "muschi",
        regionId: region.id,
        regionLabel: region.ro,
        label: region.ro,
        labelEn: region.en,
      },
      keywords: [region.ro, region.en, ...region.aliases].map(normalize),
    });
  }

  for (const organ of internalOrgans) {
    const aliases = ORGAN_ALIASES[organ.id] ?? [];
    entries.push({
      key: organ.id,
      tissue: "organ",
      layer: "organs",
      label: organ.name,
      labelEn: organ.name,
      subtitle: organ.category,
      subtitleEn: organ.category,
      selection: {
        id: organ.id,
        side: "male",
        tissue: "organ",
        regionId: organ.id,
        regionLabel: organ.category,
        label: organ.name,
      },
      keywords: [organ.name, organ.latinName, organ.category, ...aliases].map(normalize),
    });
  }

  return entries;
}

let INDEX: AnatomySearchResult[] | null = null;

function getIndex(): AnatomySearchResult[] {
  if (!INDEX) INDEX = buildIndex();
  return INDEX;
}

function scoreEntry(entry: AnatomySearchResult, query: string): number {
  let best = 0;
  for (const keyword of entry.keywords) {
    if (!keyword) continue;
    if (keyword === query) {
      best = Math.max(best, 100);
      continue;
    }
    if (keyword.startsWith(query)) {
      best = Math.max(best, 80);
      continue;
    }
    // token-level prefix match (e.g. "fluier" matches "fluierul piciorului")
    if (keyword.split(" ").some((token) => token.startsWith(query))) {
      best = Math.max(best, 65);
      continue;
    }
    if (keyword.includes(query)) {
      best = Math.max(best, 45);
    }
  }
  return best;
}

export function searchAnatomy(rawQuery: string, limit = 8): AnatomySearchResult[] {
  const query = normalize(rawQuery);
  if (query.length < 2) return [];

  return getIndex()
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit)
    .map((item) => item.entry);
}
