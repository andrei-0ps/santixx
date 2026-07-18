import { categoryLabels, categoryLabelsEn, type Bone } from "@/data/bones";
import { getEticheteSchelet } from "@/data/eticheteSchelet";
import type { BoneSelection, TissueType } from "@/components/skeleton/SkeletonScene";

export interface AnatomyDisplayName {
  popular_name_ro?: string;
  popular_name_en?: string;
  common_name_ro?: string;
  scientific_name_ro?: string;
  scientific_name_en?: string;
  latin_name?: string;
  original_name: string;
  display_name: string;
  title: string;
  subtitle?: string;
  missing_ro_display_name: boolean;
  source: "db" | "fallback";
}

export interface AnatomyNameRecord {
  slug?: string | null;
  name_ro?: string | null;
  name?: string | null;
  romanian_name?: string | null;
  popular_name_ro?: string | null;
  popular_name_en?: string | null;
  common_name_ro?: string | null;
  scientific_name_ro?: string | null;
  scientific_name_en?: string | null;
  display_name_ro?: string | null;
  display_name_en?: string | null;
  subtitle_name?: string | null;
  english_name?: string | null;
  name_latin?: string | null;
  latin_name?: string | null;
  missing_ro_display_name?: boolean | null;
}

interface DisplayRule {
  terms: string[];
  common_name_ro: string;
  scientific_name_ro: string;
  common_name_en?: string;
  tissue?: TissueType;
}

const muscleDisplayRules: DisplayRule[] = [
  {
    terms: ["occipitalis", "occipital muscle", "occipital"],
    common_name_ro: "Mușchiul din spatele capului",
    scientific_name_ro: "Mușchiul occipital",
    common_name_en: "Back-of-head muscle",
    tissue: "muschi",
  },
  {
    terms: ["brachioradialis", "brahioradial"],
    common_name_ro: "Mușchiul lateral al antebrațului",
    scientific_name_ro: "Brahioradial",
    common_name_en: "Lateral Forearm Muscle",
    tissue: "muschi",
  },
  {
    terms: ["biceps brachii", "biceps brahial"],
    common_name_ro: "Mușchiul biceps al brațului",
    scientific_name_ro: "Biceps brahial",
    common_name_en: "Biceps Muscle",
    tissue: "muschi",
  },
  {
    terms: ["triceps brachii", "triceps brahial"],
    common_name_ro: "Mușchiul triceps al brațului",
    scientific_name_ro: "Triceps brahial",
    common_name_en: "Triceps Muscle",
    tissue: "muschi",
  },
  {
    terms: ["deltoid"],
    common_name_ro: "Mușchiul umărului",
    scientific_name_ro: "deltoid",
    common_name_en: "Shoulder Muscle",
    tissue: "muschi",
  },
  {
    terms: ["gluteus maximus", "fesier mare"],
    common_name_ro: "Mușchiul fesier mare",
    scientific_name_ro: "Mușchiul fesier mare",
    common_name_en: "Gluteus Maximus",
    tissue: "muschi",
  },
  {
    terms: ["gluteus medius", "fesier mijlociu"],
    common_name_ro: "Mușchiul fesier lateral",
    scientific_name_ro: "Mușchiul fesier mijlociu",
    common_name_en: "Gluteus Medius",
    tissue: "muschi",
  },
  {
    terms: ["gluteus minimus", "fesier mic"],
    common_name_ro: "Mușchiul fesier profund",
    scientific_name_ro: "Mușchiul fesier mic",
    common_name_en: "Gluteus Minimus",
    tissue: "muschi",
  },
  {
    terms: ["external abdominal oblique", "oblic extern abdominal"],
    common_name_ro: "Mușchi abdominal lateral",
    scientific_name_ro: "oblic extern abdominal",
    common_name_en: "Lateral Abdominal Muscle",
    tissue: "muschi",
  },
  {
    terms: ["internal abdominal oblique", "oblic intern abdominal"],
    common_name_ro: "Mușchi abdominal lateral profund",
    scientific_name_ro: "oblic intern abdominal",
    common_name_en: "Deep Lateral Abdominal Muscle",
    tissue: "muschi",
  },
  {
    terms: ["rectus abdominis", "drept abdominal"],
    common_name_ro: "Mușchiul abdomenului din față",
    scientific_name_ro: "drept abdominal",
    common_name_en: "Front Abdominal Muscle",
    tissue: "muschi",
  },
  {
    terms: ["transversus abdominis", "transvers abdominal"],
    common_name_ro: "Mușchi abdominal profund",
    scientific_name_ro: "transvers abdominal",
    common_name_en: "Deep Abdominal Muscle",
    tissue: "muschi",
  },
  {
    terms: ["gastrocnemius", "gastrocnemian"],
    common_name_ro: "Mușchiul gambei",
    scientific_name_ro: "gastrocnemian",
    common_name_en: "Calf Muscle",
    tissue: "muschi",
  },
  {
    terms: ["soleus"],
    common_name_ro: "Mușchiul profund al gambei",
    scientific_name_ro: "Mușchiul solear",
    common_name_en: "Deep Calf Muscle",
    tissue: "muschi",
  },
  {
    terms: ["rectus femoris", "vastus", "quadriceps", "cvadriceps"],
    common_name_ro: "Mușchiul coapsei din față",
    scientific_name_ro: "cvadriceps",
    common_name_en: "Front Thigh Muscle",
    tissue: "muschi",
  },
  {
    terms: ["biceps femoris", "semitendinosus", "semimembranosus", "hamstring", "ischiogambieri"],
    common_name_ro: "Mușchiul coapsei din spate",
    scientific_name_ro: "ischiogambieri",
    common_name_en: "Back Thigh Muscles",
    tissue: "muschi",
  },
  {
    terms: ["pectoralis major", "pectoral mare"],
    common_name_ro: "Mușchiul pieptului",
    scientific_name_ro: "pectoral mare",
    common_name_en: "Chest Muscle",
    tissue: "muschi",
  },
  {
    terms: ["latissimus dorsi", "marele dorsal"],
    common_name_ro: "Mușchiul spatelui lateral",
    scientific_name_ro: "marele dorsal",
    common_name_en: "Lateral Back Muscle",
    tissue: "muschi",
  },
  {
    terms: ["sternocleidomastoid", "sternocleidomastoidian"],
    common_name_ro: "Mușchiul gâtului lateral",
    scientific_name_ro: "sternocleidomastoidian",
    common_name_en: "Lateral Neck Muscle",
    tissue: "muschi",
  },
  {
    terms: ["pronator teres", "pronator rotund"],
    common_name_ro: "Mușchi pentru rotirea antebrațului",
    scientific_name_ro: "pronator rotund",
    common_name_en: "Forearm Pronator",
    tissue: "muschi",
  },
  {
    terms: ["pronator quadratus", "pronator patrat"],
    common_name_ro: "Mușchi profund pentru rotirea antebrațului",
    scientific_name_ro: "pronator pătrat",
    common_name_en: "Deep Forearm Pronator",
    tissue: "muschi",
  },
  {
    terms: ["supinator"],
    common_name_ro: "Mușchi pentru întoarcerea palmei în sus",
    scientific_name_ro: "supinator",
    common_name_en: "Forearm Supinator",
    tissue: "muschi",
  },
  {
    terms: ["flexor carpi", "flexor digitorum", "palmaris longus"],
    common_name_ro: "Mușchii flexori ai antebrațului",
    scientific_name_ro: "Flexorii antebrațului",
    common_name_en: "Forearm Flexors",
    tissue: "muschi",
  },
  {
    terms: ["extensor carpi", "extensor digitorum", "extensor indicis", "extensor digiti"],
    common_name_ro: "Mușchii extensori ai antebrațului",
    scientific_name_ro: "Extensorii antebrațului",
    common_name_en: "Forearm Extensors",
    tissue: "muschi",
  },
  {
    terms: ["trapezius", "trapez"],
    common_name_ro: "Mușchiul cefei și spatelui de sus",
    scientific_name_ro: "trapez",
    common_name_en: "Neck and Upper Back Muscle",
    tissue: "muschi",
  },
  {
    terms: ["teres major", "rotund mare"],
    common_name_ro: "Mușchiul umărului posterior",
    scientific_name_ro: "rotund mare",
    common_name_en: "Posterior Shoulder Muscle",
    tissue: "muschi",
  },
  {
    terms: ["teres minor", "rotund mic"],
    common_name_ro: "Mușchiul umărului posterior",
    scientific_name_ro: "rotund mic",
    common_name_en: "Posterior Shoulder Muscle",
    tissue: "muschi",
  },
  {
    terms: ["supraspinatus", "supraspinos"],
    common_name_ro: "Mușchi al umărului de sus",
    scientific_name_ro: "supraspinos",
    common_name_en: "Upper Shoulder Muscle",
    tissue: "muschi",
  },
  {
    terms: ["infraspinatus", "infraspinos"],
    common_name_ro: "Mușchi al umărului posterior",
    scientific_name_ro: "infraspinos",
    common_name_en: "Posterior Shoulder Muscle",
    tissue: "muschi",
  },
  {
    terms: ["subscapularis", "subscapular"],
    common_name_ro: "Mușchi al omoplatului",
    scientific_name_ro: "subscapular",
    common_name_en: "Shoulder Blade Muscle",
    tissue: "muschi",
  },
  {
    terms: ["sartorius", "croitor"],
    common_name_ro: "Mușchiul lung al coapsei",
    scientific_name_ro: "Mușchiul croitor",
    common_name_en: "Long Thigh Muscle",
    tissue: "muschi",
  },
  {
    terms: ["adductor"],
    common_name_ro: "Mușchiul interior al coapsei",
    scientific_name_ro: "adductori",
    common_name_en: "Inner Thigh Muscle",
    tissue: "muschi",
  },
  {
    terms: ["tibialis anterior", "tibial anterior"],
    common_name_ro: "Mușchiul din fața gambei",
    scientific_name_ro: "tibial anterior",
    common_name_en: "Front Shin Muscle",
    tissue: "muschi",
  },
  {
    terms: ["fibularis", "peroneus", "peronier"],
    common_name_ro: "Mușchiul lateral al gambei",
    scientific_name_ro: "peronieri",
    common_name_en: "Lateral Shin Muscle",
    tissue: "muschi",
  },
];

const boneDisplayById: Record<
  string,
  Omit<AnatomyDisplayName, "original_name" | "missing_ro_display_name" | "source"> & {
    title_en?: string;
  }
> = {
  humerus: {
    common_name_ro: "Osul brațului",
    scientific_name_ro: "humerus",
    latin_name: "Humerus",
    display_name: "Osul brațului",
    title: "Osul brațului",
    title_en: "Upper Arm Bone",
    subtitle: "Braț",
  },
  femur: {
    common_name_ro: "Osul coapsei",
    scientific_name_ro: "femur",
    latin_name: "Femur",
    display_name: "Osul coapsei",
    title: "Osul coapsei",
    title_en: "Thigh Bone",
    subtitle: "Coapsă",
  },
  scapula: {
    common_name_ro: "Omoplatul",
    scientific_name_ro: "scapula",
    latin_name: "Scapula",
    display_name: "Omoplatul",
    title: "Omoplatul",
    title_en: "Shoulder Blade",
    subtitle: "Umăr",
  },
  rotula: {
    common_name_ro: "Rotula",
    scientific_name_ro: "patela",
    latin_name: "Patella",
    display_name: "Rotula",
    title: "Rotula",
    title_en: "Kneecap",
    subtitle: "Genunchi",
  },
  sacrum: {
    common_name_ro: "Osul de la baza coloanei",
    scientific_name_ro: "os sacru",
    latin_name: "Os sacrum",
    display_name: "Osul de la baza coloanei",
    title: "Osul de la baza coloanei",
    title_en: "Base-of-spine bone",
    subtitle: "Coloana vertebrală",
  },
  coccis: {
    common_name_ro: "Osul mic de la capătul coloanei",
    scientific_name_ro: "coccis",
    latin_name: "Os coccygis",
    display_name: "Osul mic de la capătul coloanei",
    title: "Osul mic de la capătul coloanei",
    title_en: "Tailbone",
    subtitle: "Coloana vertebrală",
  },
  radius: {
    common_name_ro: "Osul antebrațului de pe partea degetului mare",
    scientific_name_ro: "radius",
    latin_name: "Radius",
    display_name: "Osul antebrațului de pe partea degetului mare",
    title: "Osul antebrațului de pe partea degetului mare",
    title_en: "Thumb-side forearm bone",
    subtitle: "Antebraț",
  },
  ulna: {
    common_name_ro: "Osul antebrațului de pe partea degetului mic",
    scientific_name_ro: "ulnă",
    latin_name: "Ulna",
    display_name: "Osul antebrațului de pe partea degetului mic",
    title: "Osul antebrațului de pe partea degetului mic",
    title_en: "Little-finger-side forearm bone",
    subtitle: "Antebraț",
  },
  carp: {
    common_name_ro: "Oasele încheieturii mâinii",
    scientific_name_ro: "oase carpiene",
    latin_name: "Ossa carpi",
    display_name: "Oasele încheieturii mâinii",
    title: "Oasele încheieturii mâinii",
    title_en: "Wrist bones",
    subtitle: "Mână",
  },
  metacarp: {
    common_name_ro: "Oasele palmei",
    scientific_name_ro: "metacarpiene",
    latin_name: "Ossa metacarpi",
    display_name: "Oasele palmei",
    title: "Oasele palmei",
    title_en: "Palm bones",
    subtitle: "Mână",
  },
  "falange-mana": {
    common_name_ro: "Oasele degetelor mâinii",
    scientific_name_ro: "falangele mâinii",
    latin_name: "Phalanges manus",
    display_name: "Oasele degetelor mâinii",
    title: "Oasele degetelor mâinii",
    title_en: "Finger bones",
    subtitle: "Mână",
  },
  tibia: {
    common_name_ro: "Osul mare al gambei",
    scientific_name_ro: "tibie",
    latin_name: "Tibia",
    display_name: "Osul mare al gambei",
    title: "Osul mare al gambei",
    title_en: "Main shin bone",
    subtitle: "Gambă",
  },
  fibula: {
    common_name_ro: "Osul subțire al gambei",
    scientific_name_ro: "fibulă",
    latin_name: "Fibula",
    display_name: "Osul subțire al gambei",
    title: "Osul subțire al gambei",
    title_en: "Thin outer lower-leg bone",
    subtitle: "Gambă",
  },
  tars: {
    common_name_ro: "Oasele gleznei și călcâiului",
    scientific_name_ro: "oase tarsiene",
    latin_name: "Ossa tarsi",
    display_name: "Oasele gleznei și călcâiului",
    title: "Oasele gleznei și călcâiului",
    title_en: "Ankle and heel bones",
    subtitle: "Picior",
  },
  metatars: {
    common_name_ro: "Oasele din mijlocul labei piciorului",
    scientific_name_ro: "metatarsiene",
    latin_name: "Ossa metatarsi",
    display_name: "Oasele din mijlocul labei piciorului",
    title: "Oasele din mijlocul labei piciorului",
    title_en: "Midfoot bones",
    subtitle: "Picior",
  },
  "falange-picior": {
    common_name_ro: "Oasele degetelor piciorului",
    scientific_name_ro: "falangele piciorului",
    latin_name: "Phalanges pedis",
    display_name: "Oasele degetelor piciorului",
    title: "Oasele degetelor piciorului",
    title_en: "Toe bones",
    subtitle: "Picior",
  },
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t");
}

function stripTechnicalPrefix(value: string) {
  return value
    .replace(/^capul\s+(superficial|profund)\s+al\s+mușchiului\s+/i, "")
    .replace(/^capul\s+(superficial|profund)\s+al\s+muschiului\s+/i, "")
    .replace(/^mușchiul\s+/i, "")
    .replace(/^muschiul\s+/i, "")
    .replace(/^mușchi\s+/i, "")
    .replace(/^muschi\s+/i, "")
    .trim();
}

function formatDisplay(commonName: string) {
  return commonName;
}

function getSelectionLaterality(selection: BoneSelection, lang: "ro" | "en"): string | undefined {
  const source = [selection.id, selection.label, selection.labelEn].filter(Boolean).join(" ");
  if (/(?:-left\b|\((?:stânga|stanga|left)\))/i.test(source)) {
    return lang === "en" ? "left" : "stânga";
  }
  if (/(?:-right\b|\((?:dreapta|right)\))/i.test(source)) {
    return lang === "en" ? "right" : "dreapta";
  }
  return undefined;
}

function withSelectionLaterality(value: string, selection: BoneSelection, lang: "ro" | "en") {
  const side = getSelectionLaterality(selection, lang);
  if (!side || /\((?:stânga|stanga|dreapta|left|right)\)\s*$/i.test(value)) return value;
  return `${value} (${side})`;
}

function compareName(value: string | null | undefined) {
  return normalize(value ?? "").replace(/[^a-z0-9]+/g, "");
}

function isTechnicalBoneTitle(display: AnatomyDisplayName | null, bone: Bone) {
  if (!display) return false;
  const title = compareName(display.title);
  if (!title) return false;
  return [bone.name, bone.latin].some((name) => title === compareName(name));
}

function isWeakBoneDisplayTitle(display: AnatomyDisplayName | null, bone: Bone) {
  if (!display?.title) return false;
  const title = normalize(display.title);

  if (isTechnicalBoneTitle(display, bone)) return true;

  if (
    (bone.id === "radius" || bone.id === "ulna") &&
    /^osul\s+(dinspre|de pe partea)/i.test(title) &&
    !title.includes("antebrat")
  ) {
    return true;
  }

  if (
    (bone.id === "falange-mana" || bone.id === "falange-picior") &&
    /\b(falange|phalanx)\b/i.test(title)
  ) {
    return true;
  }

  return false;
}

const popularRegionNames: Record<string, { ro: string; en: string }> = {
  "muschii-capului-gatului": {
    ro: "Mușchii capului și gâtului",
    en: "Head and neck muscles",
  },
  "muschii-mainii": { ro: "Mușchii mâinii", en: "Hand muscles" },
  "muschii-piciorului": { ro: "Mușchii labei piciorului", en: "Foot muscles" },
  "muschii-gambei": { ro: "Mușchii gambei", en: "Lower-leg muscles" },
  "muschii-coapsei": { ro: "Mușchii coapsei", en: "Thigh muscles" },
  "muschii-antebratului": { ro: "Mușchii antebrațului", en: "Forearm muscles" },
  "muschii-bratului": { ro: "Mușchii brațului", en: "Upper-arm muscles" },
  "muschii-abdomenului": { ro: "Mușchii abdomenului", en: "Abdominal muscles" },
  "muschii-toracelui": { ro: "Mușchii pieptului", en: "Chest muscles" },
  "muschii-umarului": { ro: "Mușchii umărului", en: "Shoulder muscles" },
  "muschii-soldului": { ro: "Mușchii șoldului", en: "Hip muscles" },
  "muschii-spatelui": { ro: "Mușchii spatelui", en: "Back muscles" },
  "muschii-bazinului": { ro: "Mușchii bazinului", en: "Pelvic muscles" },
  "membrul-superior": { ro: "Mușchii membrului superior", en: "Upper-limb muscles" },
  "membrul-inferior": { ro: "Mușchii membrului inferior", en: "Lower-limb muscles" },
  "sistem-muscular": { ro: "Sistemul muscular", en: "Muscular system" },
};

function getPopularRegionName(regionId: string | undefined, lang: "ro" | "en") {
  const key = regionId?.split(":").at(-1);
  if (!key) return undefined;
  return popularRegionNames[key]?.[lang];
}

function matchesRule(rule: DisplayRule, haystack: string, tissue: TissueType) {
  if (rule.tissue && rule.tissue !== tissue) return false;
  return rule.terms.some((term) => haystack.includes(normalize(term)));
}

export function getAnatomyDisplayName(input: {
  bone?: Bone | null;
  selection: BoneSelection;
  dbStructure?: AnatomyNameRecord | null;
  lang?: "ro" | "en";
}): AnatomyDisplayName {
  const { bone, selection, dbStructure, lang = "ro" } = input;
  const isEn = lang === "en";
  const originalName =
    bone?.name ?? selection.label ?? selection.regionLabel ?? "Structură anatomică";

  if (bone) {
    const dbDisplay = getDbDisplayName(dbStructure, originalName, lang);
    if (dbDisplay && !isWeakBoneDisplayTitle(dbDisplay, bone)) return dbDisplay;

    const mapped = boneDisplayById[bone.id];
    if (mapped) {
      const localizedTitle = isEn && mapped.title_en ? mapped.title_en : mapped.title;
      const localizedSubtitle = isEn
        ? categoryLabelsEn[bone.category]
        : (mapped.subtitle ?? categoryLabels[bone.category]);
      return {
        ...mapped,
        display_name: localizedTitle,
        title: localizedTitle,
        subtitle: localizedSubtitle,
        original_name: originalName,
        missing_ro_display_name: false,
        source: "fallback",
      };
    }

    if (dbDisplay) return dbDisplay;

    const catalogLabels = getEticheteSchelet(bone.id);
    const boneTitle = isEn
      ? (catalogLabels?.en ?? selection.labelEn ?? bone.name)
      : (catalogLabels?.ro ?? bone.name);
    return {
      original_name: originalName,
      scientific_name_ro: bone.name,
      latin_name: bone.latin,
      display_name: boneTitle,
      title: boneTitle,
      subtitle: isEn ? categoryLabelsEn[bone.category] : categoryLabels[bone.category],
      missing_ro_display_name: true,
      source: "fallback",
    };
  }

  const dbDisplay = getDbDisplayName(dbStructure, originalName, lang);
  if (dbDisplay) return dbDisplay;

  const haystack = normalize(
    [selection.labelEn, selection.label, selection.regionLabel, selection.id]
      .filter(Boolean)
      .join(" "),
  );
  const rule = muscleDisplayRules.find((candidate) =>
    matchesRule(candidate, haystack, selection.tissue),
  );
  const phalanx =
    inferHandPhalanxDisplay(haystack, lang) ?? inferFootPhalanxDisplay(haystack, lang);

  if (phalanx) {
    return {
      common_name_ro: phalanx,
      scientific_name_ro: originalName,
      original_name: originalName,
      display_name: phalanx,
      title: phalanx,
      missing_ro_display_name: false,
      source: "fallback",
    };
  }

  if (rule) {
    const baseTitle = isEn && rule.common_name_en ? rule.common_name_en : rule.common_name_ro;
    const title = withSelectionLaterality(baseTitle, selection, lang);
    return {
      common_name_ro: rule.common_name_ro,
      scientific_name_ro: rule.scientific_name_ro,
      original_name: originalName,
      display_name: isEn ? title : formatDisplay(rule.common_name_ro),
      title,
      missing_ro_display_name: false,
      source: "fallback",
    };
  }

  const popularRegionName = getPopularRegionName(selection.regionId, lang);
  const fallbackTitleBase =
    selection.tissue === "muschi" && popularRegionName
      ? popularRegionName
      : isEn
        ? (selection.labelEn ?? originalName)
        : originalName;
  const fallbackTitle =
    selection.tissue === "muschi"
      ? withSelectionLaterality(fallbackTitleBase, selection, lang)
      : fallbackTitleBase;
  const fallbackScientific = stripTechnicalPrefix(originalName);
  return {
    original_name: originalName,
    scientific_name_ro: fallbackScientific,
    display_name: fallbackTitle,
    title: fallbackTitle,
    subtitle:
      selection.tissue === "muschi" && fallbackTitle !== originalName
        ? isEn
          ? (selection.labelEn ?? originalName)
          : originalName
        : undefined,
    missing_ro_display_name: true,
    source: "fallback",
  };
}

function firstText(...values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

function getDbDisplayName(
  structure: AnatomyNameRecord | null | undefined,
  originalName: string,
  lang: "ro" | "en" = "ro",
): AnatomyDisplayName | null {
  if (!structure) return null;

  const isEn = lang === "en";
  const popularNameRo = firstText(
    structure.popular_name_ro,
    structure.display_name_ro,
    structure.common_name_ro,
  );
  const popularNameEn = firstText(
    structure.popular_name_en,
    structure.display_name_en,
    structure.english_name,
  );
  const romanianName = firstText(
    structure.romanian_name,
    structure.name_ro,
    isLikelyRomanian(structure.name) ? structure.name : null,
  );
  const scientificName = firstText(structure.scientific_name_ro, structure.name_ro);
  const scientificNameEn = firstText(
    structure.scientific_name_en,
    structure.english_name,
    structure.latin_name,
    structure.name_latin,
  );
  const latinName = firstText(structure.latin_name, structure.name_latin);
  const fallbackName = firstText(
    isEn ? popularNameEn : popularNameRo,
    romanianName,
    structure.name,
    originalName,
  );
  const resolvedTitle = isEn ? popularNameEn : popularNameRo;
  const subtitle = isEn
    ? firstText(
        scientificNameEn && scientificNameEn !== popularNameEn ? scientificNameEn : null,
        structure.subtitle_name,
        latinName && latinName !== popularNameEn ? latinName : null,
      )
    : firstText(
        scientificName && scientificName !== popularNameRo ? scientificName : null,
        structure.subtitle_name,
        latinName && latinName !== popularNameRo ? latinName : null,
      );

  if (resolvedTitle) {
    return {
      popular_name_ro: popularNameRo,
      popular_name_en: popularNameEn,
      common_name_ro: popularNameRo,
      scientific_name_ro: scientificName,
      scientific_name_en: scientificNameEn,
      latin_name: latinName,
      original_name: originalName,
      display_name: resolvedTitle,
      title: resolvedTitle,
      subtitle,
      missing_ro_display_name: Boolean(structure.missing_ro_display_name),
      source: "db",
    };
  }

  if (!fallbackName) return null;

  return {
    popular_name_ro: popularNameRo,
    popular_name_en: popularNameEn,
    common_name_ro: popularNameRo,
    scientific_name_ro: scientificName,
    scientific_name_en: scientificNameEn,
    latin_name: latinName,
    original_name: originalName,
    display_name: fallbackName,
    title: fallbackName,
    subtitle,
    missing_ro_display_name: true,
    source: "db",
  };
}

function isLikelyRomanian(value: string | null | undefined) {
  if (!value) return false;
  return /[ăâîșțĂÂÎȘȚ]/.test(value) || /\b(os|oase|mușchi|muschi|falanga|rotula)\b/i.test(value);
}

function inferHandPhalanxDisplay(haystack: string, lang: "ro" | "en" = "ro") {
  if (!haystack.includes("phalanx")) return null;
  if (!hasAnyNormalized(haystack, ["finger", "thumb", "hand"])) return null;

  if (lang === "en") {
    const segEn = haystack.includes("proximal")
      ? "Proximal"
      : haystack.includes("middle")
        ? "Middle"
        : haystack.includes("distal")
          ? "Distal"
          : null;
    if (!segEn) return null;

    const fingerEn = hasAnyNormalized(haystack, ["thumb"])
      ? "Thumb"
      : hasAnyNormalized(haystack, ["index", "second"])
        ? "Index Finger"
        : hasAnyNormalized(haystack, ["middle finger", "third"])
          ? "Middle Finger"
          : hasAnyNormalized(haystack, ["fourth", "ring"])
            ? "Ring Finger"
            : hasAnyNormalized(haystack, ["little", "fifth"])
              ? "Little Finger"
              : null;
    if (!fingerEn) return null;

    return `${segEn} Phalanx of the ${fingerEn}`;
  }

  const segmentLabel = haystack.includes("proximal")
    ? "Falanga proximală a"
    : haystack.includes("middle")
      ? "Falanga mijlocie a"
      : haystack.includes("distal")
        ? "Falanga distală a"
        : null;
  if (!segmentLabel) return null;

  const finger = hasAnyNormalized(haystack, ["thumb"])
    ? "policelui"
    : hasAnyNormalized(haystack, ["index", "second"])
      ? "degetului arătător"
      : hasAnyNormalized(haystack, ["middle finger", "third"])
        ? "degetului mijlociu"
        : hasAnyNormalized(haystack, ["fourth", "ring"])
          ? "degetului inelar"
          : hasAnyNormalized(haystack, ["little", "fifth"])
            ? "degetului mic"
            : null;
  if (!finger) return null;

  return `${segmentLabel} ${finger}`;
}

function inferFootPhalanxDisplay(haystack: string, lang: "ro" | "en" = "ro") {
  if (!haystack.includes("phalanx")) return null;
  if (!hasAnyNormalized(haystack, ["toe", "foot", "hallux"])) return null;

  if (lang === "en") {
    const segEn = haystack.includes("proximal")
      ? "Proximal"
      : haystack.includes("middle")
        ? "Middle"
        : haystack.includes("distal")
          ? "Distal"
          : null;
    if (!segEn) return null;

    const toeEn = hasAnyNormalized(haystack, ["hallux", "great toe", "big toe", "first toe"])
      ? "Big Toe"
      : hasAnyNormalized(haystack, ["second toe", "2nd toe"])
        ? "Second Toe"
        : hasAnyNormalized(haystack, ["third toe", "3rd toe"])
          ? "Third Toe"
          : hasAnyNormalized(haystack, ["fourth toe", "4th toe"])
            ? "Fourth Toe"
            : hasAnyNormalized(haystack, ["fifth toe", "5th toe", "little toe", "small toe"])
              ? "Little Toe"
              : null;

    return toeEn ? `${segEn} Phalanx of the ${toeEn}` : `${segEn} Phalanx of the Foot`;
  }

  const segmentLabel = haystack.includes("proximal")
    ? "Falanga proximală a"
    : haystack.includes("middle")
      ? "Falanga mijlocie a"
      : haystack.includes("distal")
        ? "Falanga distală a"
        : null;
  if (!segmentLabel) return null;

  const toe = hasAnyNormalized(haystack, ["hallux", "great toe", "big toe", "first toe"])
    ? "halucelui (degetul mare)"
    : hasAnyNormalized(haystack, ["second toe", "2nd toe"])
      ? "degetului 2 de la picior"
      : hasAnyNormalized(haystack, ["third toe", "3rd toe"])
        ? "degetului 3 de la picior"
        : hasAnyNormalized(haystack, ["fourth toe", "4th toe"])
          ? "degetului 4 de la picior"
          : hasAnyNormalized(haystack, ["fifth toe", "5th toe", "little toe", "small toe"])
            ? "degetului mic de la picior"
            : null;

  return toe ? `${segmentLabel} ${toe}` : `${segmentLabel} unui deget de la picior`;
}

function hasAnyNormalized(haystack: string, terms: string[]) {
  return terms.some((term) => haystack.includes(normalize(term)));
}
