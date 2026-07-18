import type { TissueType } from "@/components/skeleton/SkeletonScene";

export interface AnatomyCurriculumInfo {
  system: string;
  segment: string;
  group: string;
  subgroup?: string;
  aspect?: string;
  functionHint: string;
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function inferAspect(name: string): string {
  if (hasAny(name, ["clavicular part of deltoid", "pectoralis", "sternum", "manubrium", "xiphoid"])) {
    return "Față anterioară";
  }

  if (
    hasAny(name, [
      "scapular spinal part of deltoid",
      "infraspinatus",
      "teres major",
      "teres minor",
      "triceps",
      "anconeus",
      "rhomboid",
      "trapezius",
      "latissimus dorsi",
      "occipital",
      "posterior",
      "dorsal",
      "extensor",
      "gluteus",
      "biceps femoris",
      "semitendinosus",
      "semimembranosus",
      "gastrocnemius",
      "soleus",
    ])
  ) {
    return "Față posterioară";
  }

  if (
    hasAny(name, [
      "anterior",
      "frontal",
      "biceps brachii",
      "brachialis",
      "coracobrachialis",
      "flexor",
      "pronator",
      "rectus",
      "sartorius",
      "vastus",
      "tibialis anterior",
    ])
  ) {
    return "Față anterioară";
  }

  if (hasAny(name, ["lateral", "acromial part of deltoid", "fibularis", "zygomatic", "temporal"])) {
    return "Față laterală";
  }

  if (hasAny(name, ["medial", "adductor", "gracilis", "ulna", "palatine", "vomer"])) {
    return "Față medială";
  }

  if (hasAny(name, ["deep", "profund", "subscapularis", "multifidus", "interossei"])) {
    return "Plan profund";
  }

  return "Plan general";
}

function withAspect(info: AnatomyCurriculumInfo, name: string): AnatomyCurriculumInfo {
  return {
    ...info,
    aspect: info.aspect ?? inferAspect(name),
  };
}

function muscleInfo(name: string): AnatomyCurriculumInfo {
  if (
    hasAny(name, [
      "occipitalis",
      "splenius",
      "rectus posterior",
      "obliquus superior capitis",
      "obliquus inferior capitis",
      "semispinalis",
      "longissimus capitis",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Cap și gât",
      group: "Mușchii cefei",
      subgroup: "Zona posterioară",
      aspect: "Față posterioară",
      functionHint: "Participă la extensia, rotația și stabilizarea capului și gâtului.",
    };
  }

  if (
    hasAny(name, [
      "frontalis",
      "occipitalis",
      "temporalis",
      "masseter",
      "orbicularis",
      "zygomaticus",
      "buccinator",
      "mentalis",
      "risorius",
      "nasalis",
      "pterygoid",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Cap",
      group: "Mușchii capului",
      subgroup: hasAny(name, ["masseter", "temporalis", "pterygoid"])
        ? "Mușchii masticatori"
        : "Mușchii feței",
      functionHint: "Participă la expresiile feței sau la mestecat.",
    };
  }

  if (
    hasAny(name, [
      "sternocleidomastoid",
      "scalenus",
      "omohyoid",
      "sternohyoid",
      "sternothyroid",
      "thyrohyoid",
      "longus colli",
      "platysma",
      "digastric",
      "mylohyoid",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Gât",
      group: "Mușchii gâtului",
      subgroup: "Zona laterală a gâtului",
      functionHint: "Ajută la mișcările capului și gâtului.",
    };
  }

  if (
    hasAny(name, [
      "trapezius",
      "latissimus dorsi",
      "rhomboid",
      "levator scapulae",
      "splenius",
      "iliocostalis",
      "longissimus",
      "spinalis",
      "multifidus",
      "thoracolumbar",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Trunchi",
      group: "Mușchii spatelui",
      subgroup: "Planuri superficial și profund",
      functionHint: "Susțin postura și participă la mișcările trunchiului și umerilor.",
    };
  }

  if (
    hasAny(name, [
      "pectoralis",
      "serratus anterior",
      "intercostal",
      "subclavius",
      "transversus thoracis",
      "diaphragm",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Trunchi",
      group: "Mușchii pieptului",
      subgroup: hasAny(name, ["intercostal", "diaphragm"])
        ? "Mușchii respiratori"
        : "Peretele pieptului",
      functionHint: "Contribuie la mișcările pieptului, respirație și stabilizarea umărului.",
    };
  }

  if (
    hasAny(name, [
      "rectus abdominis",
      "oblique",
      "transversus abdominis",
      "pyramidalis",
      "quadratus lumborum",
      "linea alba",
      "inguinal ligament",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Trunchi",
      group: "Mușchii abdomenului",
      subgroup: "Peretele abdominal",
      functionHint: "Susțin abdomenul și participă la flexia și rotația trunchiului.",
    };
  }

  if (
    hasAny(name, [
      "deltoid",
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres major",
      "teres minor",
    ])
  ) {
    const shoulderSubgroup = hasAny(name, ["clavicular part of deltoid", "subscapularis"])
      ? "Umăr față"
      : hasAny(name, ["scapular spinal part of deltoid", "infraspinatus", "teres major", "teres minor"])
        ? "Umăr spate"
        : hasAny(name, ["acromial part of deltoid", "supraspinatus"])
          ? "Umăr lateral"
          : "Articulația umărului";

    return {
      system: "Sistem muscular",
      segment: "Membrul superior",
      group: "Mușchii umărului",
      subgroup: shoulderSubgroup,
      aspect: shoulderSubgroup.includes("spate")
        ? "Față posterioară"
        : shoulderSubgroup.includes("față")
          ? "Față anterioară"
          : shoulderSubgroup.includes("lateral")
            ? "Față laterală"
            : undefined,
      functionHint: "Mobilizează și stabilizează umărul.",
    };
  }

  if (
    hasAny(name, [
      "biceps brachii",
      "brachialis",
      "coracobrachialis",
      "triceps brachii",
      "anconeus",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membrul superior",
      group: "Mușchii brațului",
      subgroup: hasAny(name, ["triceps", "anconeus"]) ? "Față posterioară" : "Față anterioară",
      functionHint: "Realizează mișcările brațului și antebrațului (flexie, extensie).",
    };
  }

  if (
    hasAny(name, [
      "pronator",
      "supinator",
      "flexor carpi",
      "extensor carpi",
      "flexor digitorum",
      "extensor digitorum",
      "brachioradialis",
      "palmaris",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membrul superior",
      group: "Mușchii antebrațului",
      subgroup: hasAny(name, ["flexor", "pronator"]) ? "Față anterioară" : "Față posterioară/laterală",
      functionHint: "Controlează mișcările antebrațului, mâinii și degetelor.",
    };
  }

  if (hasAny(name, ["pollicis", "lumbrical", "interossei", "opponens", "palmar", "digiti minimi of hand"])) {
    return {
      system: "Sistem muscular",
      segment: "Membrul superior",
      group: "Mușchii mâinii",
      subgroup: "Palma mâinii",
      functionHint: "Permit mișcările fine ale degetelor și priza mâinii.",
    };
  }

  if (hasAny(name, ["gluteus", "piriformis", "gemellus", "obturator", "quadratus femoris", "iliopsoas"])) {
    return {
      system: "Sistem muscular",
      segment: "Membrul inferior",
      group: "Mușchii șoldului",
      subgroup: "Zona șoldului",
      functionHint: "Stabilizează șoldul și participă la mișcările coapsei.",
    };
  }

  if (
    hasAny(name, [
      "sartorius",
      "rectus femoris",
      "vastus",
      "adductor",
      "gracilis",
      "biceps femoris",
      "semitendinosus",
      "semimembranosus",
      "tensor fasciae latae",
      "pectineus",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membrul inferior",
      group: "Mușchii coapsei",
      subgroup: hasAny(name, ["biceps femoris", "semitendinosus", "semimembranosus"])
        ? "Față posterioară"
        : hasAny(name, ["adductor", "gracilis", "pectineus"])
          ? "Interior"
          : "Față anterioară",
      functionHint: "Participă la mișcările coapsei, genunchiului și la mers.",
    };
  }

  if (
    hasAny(name, [
      "tibialis",
      "fibularis",
      "gastrocnemius",
      "soleus",
      "plantaris",
      "popliteus",
      "extensor hallucis",
      "flexor hallucis",
    ])
  ) {
    return {
      system: "Sistem muscular",
      segment: "Membrul inferior",
      group: "Mușchii gambei",
      subgroup: hasAny(name, ["tibialis anterior", "extensor"])
        ? "Față anterolaterală"
        : "Față posterioară",
      functionHint: "Controlează mișcările gambei, labei piciorului și degetelor.",
    };
  }

  if (hasAny(name, ["hallucis", "digiti minimi of foot", "plantar", "foot", "quadratus plantae"])) {
    return {
      system: "Sistem muscular",
      segment: "Membrul inferior",
      group: "Mușchii labei piciorului",
      subgroup: "Dosul și talpa piciorului",
      functionHint: "Susțin bolta plantară și mișcările degetelor de la picior.",
    };
  }

  return {
    system: "Sistem muscular",
    segment: "Corp",
    group: "Mușchi scheletici",
    subgroup: "General",
    functionHint: "Mușchii scheletici sunt componenta activă a mișcării.",
  };
}

function boneInfo(name: string): AnatomyCurriculumInfo {
  if (
    hasAny(name, [
      "frontal",
      "parietal",
      "temporal",
      "occipital",
      "sphenoid",
      "ethmoid",
      "maxilla",
      "mandible",
      "zygomatic",
      "nasal",
      "lacrimal",
      "palatine",
      "vomer",
    ])
  ) {
    const cranialSubgroup = hasAny(name, ["occipital"])
      ? "Neurocraniu - zona posterioară"
      : hasAny(name, ["frontal"])
        ? "Neurocraniu - zona anterioară"
        : hasAny(name, ["parietal"])
          ? "Neurocraniu - zona superolaterală"
          : hasAny(name, ["temporal"])
            ? "Neurocraniu - zona laterală"
            : hasAny(name, ["maxilla", "mandible", "zygomatic", "nasal", "lacrimal", "palatine", "vomer"])
              ? "Viscerocraniu"
              : "Neurocraniu";

    return {
      system: "Sistem osos",
      segment: "Cap",
      group: "Scheletul capului",
      subgroup: cranialSubgroup,
      aspect: cranialSubgroup.includes("posterioară")
        ? "Față posterioară"
        : cranialSubgroup.includes("anterioară")
          ? "Față anterioară"
          : cranialSubgroup.includes("laterală")
            ? "Față laterală"
            : undefined,
      functionHint: "Protejează encefalul și formează suportul feței.",
    };
  }

  if (hasAny(name, ["vertebra", "atlas", "axis", "sacrum", "coccyx"])) {
    return {
      system: "Sistem osos",
      segment: "Trunchi",
      group: "Coloana vertebrală",
      subgroup: hasAny(name, ["cervical", "atlas", "axis"])
        ? "Zona cervicală"
        : hasAny(name, ["thoracic", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12"])
          ? "Zona toracală"
          : hasAny(name, ["lumbar", "l1", "l2", "l3", "l4", "l5"])
            ? "Zona lombară"
            : "Zona sacrală/coccigiană",
      functionHint: "Susține corpul, protejează măduva spinării și permite mișcări ale trunchiului.",
    };
  }

  if (hasAny(name, ["rib", "sternum", "manubrium", "xiphoid"])) {
    return {
      system: "Sistem osos",
      segment: "Trunchi",
      group: "Scheletul toracelui",
      subgroup: hasAny(name, ["rib"]) ? "Coaste" : "Stern",
      functionHint: "Protejează inima și plămânii și participă la mecanica respirației.",
    };
  }

  if (hasAny(name, ["hip bone", "ilium", "ischium", "pubis", "acetabulum"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul inferior",
      group: "Centura pelviană",
      subgroup: "Os coxal și bazin osos",
      functionHint: "Leagă membrul inferior de trunchi și preia greutatea corpului.",
    };
  }

  if (hasAny(name, ["clavicle", "scapula"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul superior",
      group: "Centura scapulară",
      subgroup: "Claviculă și scapulă",
      functionHint: "Leagă membrul superior de torace.",
    };
  }

  if (hasAny(name, ["humerus"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul superior",
      group: "Scheletul brațului",
      subgroup: "Humerus",
      functionHint: "Acționează ca pârghie pentru mișcările membrului superior.",
    };
  }

  if (hasAny(name, ["radius", "ulna"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul superior",
      group: "Scheletul antebrațului",
      subgroup: "Radius și ulnă",
      functionHint: "Susține mișcările antebrațului și mâinii.",
    };
  }

  if (hasAny(name, ["carpal", "metacarpal", "phalanx of hand"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul superior",
      group: "Scheletul mâinii",
      subgroup: "Carpiene, metacarpiene și falange",
      functionHint: "Asigură suportul pentru mișcările fine ale mâinii.",
    };
  }

  if (hasAny(name, ["femur", "patella"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul inferior",
      group: "Scheletul coapsei",
      subgroup: hasAny(name, ["patella"]) ? "Rotulă" : "Femur",
      functionHint: "Preia greutatea corpului și participă la locomoție.",
    };
  }

  if (hasAny(name, ["tibia", "fibula"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul inferior",
      group: "Scheletul gambei",
      subgroup: "Tibie și fibulă",
      functionHint: "Susține greutatea și mișcările gambei.",
    };
  }

  if (hasAny(name, ["tarsal", "metatarsal", "phalanx of foot", "calcaneus", "talus", "cuboid", "cuneiform", "navicular"])) {
    return {
      system: "Sistem osos",
      segment: "Membrul inferior",
      group: "Scheletul labei piciorului",
      subgroup: "Tarsiene, metatarsiene și falange",
      functionHint: "Susține statica, mersul și echilibrul.",
    };
  }

  return {
    system: "Sistem osos",
    segment: "Corp",
    group: "Schelet",
    subgroup: "General",
    functionHint: "Oasele formează componenta pasivă a aparatului locomotor.",
  };
}

function organInfo(name: string): AnatomyCurriculumInfo {
  if (hasAny(name, ["heart", "cor", "inima"])) {
    return {
      system: "Organe interne",
      segment: "Torace",
      group: "Aparat cardiovascular",
      subgroup: "Inimă",
      functionHint: "Pompează sângele către plămâni și restul corpului.",
    };
  }

  if (hasAny(name, ["lung", "pulmon", "plaman"])) {
    return {
      system: "Organe interne",
      segment: "Torace",
      group: "Aparat respirator",
      subgroup: "Plămâni",
      functionHint: "Realizează schimbul de oxigen și dioxid de carbon.",
    };
  }

  if (hasAny(name, ["liver", "hepar", "ficat", "stomach", "ventriculus", "stomac", "intestine", "pancreas", "esophagus", "oesophagus", "esofag"])) {
    return {
      system: "Organe interne",
      segment: "Abdomen",
      group: "Aparat digestiv",
      subgroup: "Organe digestive",
      functionHint: "Participă la digestie, absorbție sau procesarea nutrienților.",
    };
  }

  if (hasAny(name, ["kidney", "renes", "rinichi", "bladder", "vesica", "vezica"])) {
    return {
      system: "Organe interne",
      segment: "Abdomen și pelvis",
      group: "Aparat urinar",
      subgroup: "Organe urinare",
      functionHint: "Participă la filtrarea, stocarea și eliminarea urinei.",
    };
  }

  if (hasAny(name, ["trachea", "trahee"])) {
    return {
      system: "Organe interne",
      segment: "Gât și torace",
      group: "Aparat respirator",
      subgroup: "Căi respiratorii",
      functionHint: "Permite trecerea aerului către plămâni.",
    };
  }

  return {
    system: "Organe interne",
    segment: "Corp",
    group: "Organe interne",
    subgroup: "General",
    functionHint: "Organ intern implicat în funcționarea organismului.",
  };
}

export function classifyAnatomyStructure(input: {
  tissue: TissueType;
  label?: string;
  labelEn?: string;
  id?: string;
}): AnatomyCurriculumInfo {
  const name = normalize([input.labelEn, input.label, input.id].filter(Boolean).join(" "));

  if (input.tissue === "os") return withAspect(boneInfo(name), name);
  if (input.tissue === "organ") return withAspect(organInfo(name), name);

  if (input.tissue === "tendon") {
    const muscle = muscleInfo(name);
    return withAspect({
      ...muscle,
      system: "Tendoane și țesut conjunctiv",
      group: muscle.group.replace("Mușchii", "Tendoanele/fasciile asociate mușchilor"),
      functionHint: "Leagă, stabilizează sau transmit forța dintre mușchi, oase și articulații.",
    }, name);
  }

  return withAspect(muscleInfo(name), name);
}


const systemMapEn: Record<string, string> = {
  "Sistem osos": "Skeletal system",
  "Sistem muscular": "Muscular system",
  "Organe interne": "Internal organs",
  "Tendoane și țesut conjunctiv": "Tendons and connective tissue",
};

const segmentMapEn: Record<string, string> = {
  "Cap și gât": "Head and neck",
  "Cap": "Head",
  "Gât": "Neck",
  "Trunchi": "Trunk",
  "Torace": "Thorax",
  "Abdomen": "Abdomen",
  "Abdomen și pelvis": "Abdomen and pelvis",
  "Gât și torace": "Neck and thorax",
  "Membrul superior": "Upper limb",
  "Membrul inferior": "Lower limb",
  "Corp": "Body",
};

const groupMapEn: Record<string, string> = {
  "Mușchii cefei": "Nape muscles",
  "Mușchii capului": "Head muscles",
  "Mușchii gâtului": "Neck muscles",
  "Mușchii spatelui": "Back muscles",
  "Mușchii pieptului": "Chest muscles",
  "Mușchii abdomenului": "Abdominal muscles",
  "Mușchii umărului": "Shoulder muscles",
  "Mușchii brațului": "Arm muscles",
  "Mușchii antebrațului": "Forearm muscles",
  "Mușchii mâinii": "Hand muscles",
  "Mușchii șoldului": "Hip muscles",
  "Mușchii coapsei": "Thigh muscles",
  "Mușchii gambei": "Calf muscles",
  "Mușchii labei piciorului": "Foot muscles",
  "Mușchi scheletici": "Skeletal muscles",
  "Scheletul capului": "Skull",
  "Coloana vertebrală": "Vertebral column",
  "Scheletul toracelui": "Thoracic skeleton",
  "Centura pelviană": "Pelvic girdle",
  "Centura scapulară": "Shoulder girdle",
  "Scheletul brațului": "Arm skeleton",
  "Scheletul antebrațului": "Forearm skeleton",
  "Scheletul mâinii": "Hand skeleton",
  "Scheletul coapsei": "Thigh skeleton",
  "Scheletul gambei": "Leg skeleton",
  "Scheletul labei piciorului": "Foot skeleton",
  "Schelet": "Skeleton",
  "Aparat cardiovascular": "Cardiovascular system",
  "Aparat respirator": "Respiratory system",
  "Aparat digestiv": "Digestive system",
  "Aparat urinar": "Urinary system",
};

const subgroupMapEn: Record<string, string> = {
  "Zona posterioară": "Posterior zone",
  "Mușchii masticatori": "Masticatory muscles",
  "Mușchii feței": "Facial expression muscles",
  "Zona laterală a gâtului": "Lateral neck zone",
  "Planuri superficial și profund": "Superficial and deep planes",
  "Mușchii respiratori": "Respiratory muscles",
  "Peretele pieptului": "Chest wall",
  "Peretele abdominal": "Abdominal wall",
  "Umăr față": "Anterior shoulder",
  "Umăr spate": "Posterior shoulder",
  "Umăr lateral": "Lateral shoulder",
  "Articulația umărului": "Shoulder joint",
  "Față posterioară": "Posterior face",
  "Față anterioară": "Anterior face",
  "Interior": "Medial compartment",
  "Față anterolaterală": "Anterolateral face",
  "Față posterioară/laterală": "Posterior / lateral face",
  "Palma mâinii": "Palm of the hand",
  "Dosul și talpa piciorului": "Dorsal and plantar foot",
  "Zona șoldului": "Hip region",
  "General": "General",
  "Neurocraniu - zona posterioară": "Neurocranium – posterior zone",
  "Neurocraniu - zona anterioară": "Neurocranium – anterior zone",
  "Neurocraniu - zona superolaterală": "Neurocranium – superolateral zone",
  "Neurocraniu - zona laterală": "Neurocranium – lateral zone",
  "Viscerocraniu": "Viscerocranium",
  "Neurocraniu": "Neurocranium",
  "Zona cervicală": "Cervical region",
  "Zona toracală": "Thoracic region",
  "Zona lombară": "Lumbar region",
  "Zona sacrală/coccigiană": "Sacral / coccygeal region",
  "Coaste": "Ribs",
  "Stern": "Sternum",
  "Os coxal și bazin osos": "Hip bone and bony pelvis",
  "Claviculă și scapulă": "Clavicle and scapula",
  "Humerus": "Humerus",
  "Radius și ulnă": "Radius and ulna",
  "Carpiene, metacarpiene și falange": "Carpals, metacarpals and phalanges",
  "Rotulă": "Patella",
  "Femur": "Femur",
  "Tibie și fibulă": "Tibia and fibula",
  "Tarsiene, metatarsiene și falange": "Tarsals, metatarsals and phalanges",
  "Inimă": "Heart",
  "Plămâni": "Lungs",
  "Organe digestive": "Digestive organs",
  "Organe urinare": "Urinary organs",
  "Căi respiratorii": "Airway",
  "Organe interne": "Internal organs",
};

const aspectMapEn: Record<string, string> = {
  "Față anterioară": "Anterior face",
  "Față posterioară": "Posterior face",
  "Față laterală": "Lateral face",
  "Față medială": "Medial face",
  "Plan profund": "Deep plane",
  "Plan general": "General plane",
};

const functionHintMapEn: Record<string, string> = {
  "Participă la extensia, rotația și stabilizarea capului și gâtului.":
    "Participates in extension, rotation and stabilisation of the head and neck.",
  "Participă la expresiile feței sau la mestecat.":
    "Participates in facial expressions or mastication.",
  "Ajută la mișcările capului și gâtului.":
    "Assists with head and neck movements.",
  "Susțin postura și participă la mișcările trunchiului și umerilor.":
    "Supports posture and participates in movements of the trunk and shoulders.",
  "Contribuie la mișcările pieptului, respirație și stabilizarea umărului.":
    "Contributes to chest movements, respiration and shoulder stabilisation.",
  "Susțin abdomenul și participă la flexia și rotația trunchiului.":
    "Supports the abdomen and participates in trunk flexion and rotation.",
  "Mobilizează și stabilizează umărul.": "Mobilises and stabilises the shoulder.",
  "Realizează mișcările brațului și antebrațului (flexie, extensie).":
    "Performs arm and forearm movements (flexion, extension).",
  "Controlează mișcările antebrațului, mâinii și degetelor.":
    "Controls forearm, hand and finger movements.",
  "Permit mișcările fine ale degetelor și priza mâinii.":
    "Enables fine finger movements and hand grip.",
  "Stabilizează șoldul și participă la mișcările coapsei.":
    "Stabilises the hip and participates in thigh movements.",
  "Participă la mișcările coapsei, genunchiului și la mers.":
    "Participates in thigh and knee movements and walking.",
  "Controlează mișcările gambei, labei piciorului și degetelor.":
    "Controls movements of the leg, foot and toes.",
  "Susțin bolta plantară și mișcările degetelor de la picior.":
    "Supports the plantar arch and toe movements.",
  "Mușchii scheletici sunt componenta activă a mișcării.":
    "Skeletal muscles are the active component of movement.",
  "Protejează encefalul și formează suportul feței.":
    "Protects the brain and forms the facial support.",
  "Susține corpul, protejează măduva spinării și permite mișcări ale trunchiului.":
    "Supports the body, protects the spinal cord and allows trunk movements.",
  "Protejează inima și plămânii și participă la mecanica respirației.":
    "Protects the heart and lungs and participates in the mechanics of respiration.",
  "Leagă membrul inferior de trunchi și preia greutatea corpului.":
    "Connects the lower limb to the trunk and bears body weight.",
  "Leagă membrul superior de torace.": "Connects the upper limb to the thorax.",
  "Acționează ca pârghie pentru mișcările membrului superior.":
    "Acts as a lever for upper limb movements.",
  "Susține mișcările antebrațului și mâinii.": "Supports forearm and hand movements.",
  "Asigură suportul pentru mișcările fine ale mâinii.":
    "Provides support for fine hand movements.",
  "Preia greutatea corpului și participă la locomoție.":
    "Bears body weight and participates in locomotion.",
  "Susține greutatea și mișcările gambei.": "Supports the weight and movements of the leg.",
  "Susține statica, mersul și echilibrul.": "Supports static posture, walking and balance.",
  "Oasele formează componenta pasivă a aparatului locomotor.":
    "Bones form the passive component of the locomotor system.",
  "Pompează sângele către plămâni și restul corpului.":
    "Pumps blood to the lungs and to the rest of the body.",
  "Realizează schimbul de oxigen și dioxid de carbon.":
    "Performs the exchange of oxygen and carbon dioxide.",
  "Participă la digestie, absorbție sau procesarea nutrienților.":
    "Participates in digestion, absorption or processing of nutrients.",
  "Participă la filtrarea, stocarea și eliminarea urinei.":
    "Participates in filtration, storage and elimination of urine.",
  "Permite trecerea aerului către plămâni.": "Allows air passage to the lungs.",
  "Organ intern implicat în funcționarea organismului.":
    "Internal organ involved in the functioning of the organism.",
  "Leagă, stabilizează sau transmit forța dintre mușchi, oase și articulații.":
    "Connects, stabilises or transmits force between muscles, bones and joints.",
};

function translateGroup(group: string): string {
  const tendonPrefix = "Tendoanele/fasciile asociate mușchilor ";
  if (group.startsWith(tendonPrefix)) {
    const muscleGroup = "Mușchii " + group.slice(tendonPrefix.length);
    const translatedMuscle = groupMapEn[muscleGroup] ?? muscleGroup;
    return `Tendons / fascia of: ${translatedMuscle}`;
  }
  return groupMapEn[group] ?? group;
}

export function translateCurriculumInfo(
  info: AnatomyCurriculumInfo,
  lang: "ro" | "en",
): AnatomyCurriculumInfo {
  if (lang !== "en") return info;
  return {
    system: systemMapEn[info.system] ?? info.system,
    segment: segmentMapEn[info.segment] ?? info.segment,
    group: translateGroup(info.group),
    subgroup: info.subgroup ? (subgroupMapEn[info.subgroup] ?? info.subgroup) : undefined,
    aspect: info.aspect ? (aspectMapEn[info.aspect] ?? info.aspect) : undefined,
    functionHint: functionHintMapEn[info.functionHint] ?? info.functionHint,
  };
}
