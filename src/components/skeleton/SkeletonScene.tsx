import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { LayerMode } from "./LayersToggle";
import {
  internalOrgans,
  type InternalOrgan,
  type OrganInteractionZone,
  type OrganModelPart,
} from "@/data/internalOrgans";
import exactAnatomy3dRegistry from "@/data/exactAnatomy3dMappings.generated";
import { getEticheteSchelet } from "@/data/eticheteSchelet";
import { useLanguage } from "@/lib/useLanguage";

const MESH_TO_BONE: Record<string, string> = {
  SM_HumanSkeleton_17: "frontal",
  SM_HumanSkeleton_18: "mandibula",
  SM_HumanSkeleton_13: "scapula",
  SM_HumanSkeleton_15: "scapula",
  SM_HumanSkeleton_10: "humerus",
  SM_HumanSkeleton_12: "humerus",
  SM_HumanSkeleton_08: "coaste",
  SM_HumanSkeleton_20: "vert-toracice",
  SM_HumanSkeleton_16: "coxal",
  SM_HumanSkeleton_14: "radius",
  SM_HumanSkeleton_19: "radius",
  SM_HumanSkeleton_04: "femur",
  SM_HumanSkeleton_05: "femur",
  SM_HumanSkeleton_06: "tibia",
  SM_HumanSkeleton_07: "tibia",
  SM_HumanSkeleton_03: "tars",
  SM_HumanSkeleton_09: "tars",
  SM_HumanSkeleton_01: "carp",
  SM_HumanSkeleton_02: "carp",
};

const MALE_COMPLEX_URL = "/anatomy/z-anatomy-musculoskeletal.glb?v=20260502-selection-2";
const FALLBACK_URL = "/skeleton.glb";
const ORGAN_VERTICAL_LIFT = 0.12;
const HRA_ORGAN_TRANSFORM = {
  position: new THREE.Vector3(0, -0.44 + ORGAN_VERTICAL_LIFT, -0.02),
  scale: new THREE.Vector3(3.15, 3.4, 2.65),
};
const BODY_REFERENCE = {
  height: 5.8,
  thoraxTop: 1.82,
  thoraxBottom: 0.58,
  diaphragm: 0.52,
  abdomenBottom: -0.2,
  pelvisCenter: -0.58,
  centerZ: 0.04,
  posteriorZ: -0.1,
};

const ANATOMICAL_ANCHORS: Record<OrganModelPart["anchor"], THREE.Vector3> = {
  "thoracic-cavity": new THREE.Vector3(0, 1.22, -0.05),
  "heart-mediastinum": new THREE.Vector3(0.05, 1.0, 0.08),
  "right-upper-abdomen": new THREE.Vector3(-0.12, 0.52, 0),
  "left-upper-abdomen": new THREE.Vector3(0.12, 0.48, 0.02),
  "retroperitoneal-pair": new THREE.Vector3(0, 0.34, -0.14),
  "retroperitoneal-left": new THREE.Vector3(0.17, 0.34, -0.14),
  "retroperitoneal-right": new THREE.Vector3(-0.17, 0.34, -0.14),
  "upper-abdomen-center": new THREE.Vector3(0, 0.42, -0.06),
  "spine-reference": new THREE.Vector3(0, 0.1, -0.15),
};

function bodyHalfWidthAtY(y: number) {
  if (y >= BODY_REFERENCE.thoraxBottom) return 0.46;
  if (y >= 0.18) return 0.42;
  if (y >= BODY_REFERENCE.abdomenBottom) return 0.38;
  return 0.24;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function liftOrganPosition(position: [number, number, number]) {
  return [position[0], position[1] + ORGAN_VERTICAL_LIFT, position[2]] as [number, number, number];
}

function resolveAnatomicalPosition(model: OrganModelPart) {
  if (model.preserveScenePosition) {
    const offset = model.offset ? new THREE.Vector3(...model.offset) : new THREE.Vector3();
    return HRA_ORGAN_TRANSFORM.position.clone().add(offset);
  }

  const anchor = ANATOMICAL_ANCHORS[model.anchor].clone();
  const offset = model.offset ? new THREE.Vector3(...model.offset) : new THREE.Vector3();
  const position = anchor.add(offset);
  const targetHalfWidth = Math.min(Math.max(model.targetSize[0], model.targetSize[1]) * 0.42, 0.26);
  const bodyHalfWidth = bodyHalfWidthAtY(position.y);

  position.x = clamp(position.x, -bodyHalfWidth + targetHalfWidth, bodyHalfWidth - targetHalfWidth);
  position.z = clamp(position.z, -0.18, 0.18);

  return position;
}

function resolveAnatomicalScale(model: OrganModelPart, rawSize: THREE.Vector3) {
  if (model.preserveScenePosition) {
    return HRA_ORGAN_TRANSFORM.scale.clone();
  }

  const target = new THREE.Vector3(...model.targetSize);
  const safeSize = new THREE.Vector3(
    rawSize.x || 1,
    rawSize.y || rawSize.x || 1,
    rawSize.z || rawSize.x || 1,
  );

  if (model.scaleMode === "fit-box") {
    return new THREE.Vector3(target.x / safeSize.x, target.y / safeSize.y, target.z / safeSize.z);
  }

  const uniformScale = Math.min(
    target.x / safeSize.x,
    target.y / safeSize.y,
    target.z / safeSize.z,
  );
  return new THREE.Vector3(uniformScale, uniformScale, uniformScale);
}

useGLTF.preload(FALLBACK_URL);

export type SkeletonSide = "male" | "female";
export type TissueType = "os" | "muschi" | "tendon" | "organ";
export type AnatomyModelMode = "simple" | "complex";

export interface BoneSelection {
  id: string;
  side: SkeletonSide;
  tissue: TissueType;
  regionId?: string;
  regionLabel?: string;
  label?: string;
  labelEn?: string;
}

type ExactAnatomy3dMapping = {
  tissue: "os" | "muschi" | "tendon";
  status: "exact" | "unsupported";
  selectionId: string | null;
  regionId: string | null;
  regionLabel: string | null;
  labelRo?: string | null;
  labelEn?: string | null;
};

const EXACT_ANATOMY_3D_MAPPINGS = exactAnatomy3dRegistry.mappings as Record<
  string,
  ExactAnatomy3dMapping
>;

export function resolveExactAnatomy3dMapping(structureId: string) {
  return EXACT_ANATOMY_3D_MAPPINGS[structureId] ?? null;
}

const HOVER_COLOR_BONE = new THREE.Color("#7b5cff");
const HOVER_COLOR_MUSCLE = new THREE.Color("#d91f7b");
const ORGAN_SELECTED_COLOR = new THREE.Color("#9333ea");
const ORGAN_SELECTED_PULSE_COLOR = new THREE.Color("#b36cff");
const SELECT_COLOR = new THREE.Color("#4a2fb7");
const SELECT_EMISSIVE = new THREE.Color("#c01874");
const DIM_COLOR = new THREE.Color("#e7ddf3");
const COMPLETE_REFERENCE_COLOR = new THREE.Color("#7fb7bd");

type RimUniforms = { uRimIntensity: { value: number }; uRimColor: { value: THREE.Color } };

function injectRimShader(
  _material: THREE.MeshPhysicalMaterial,
  rimColor: THREE.Color,
): RimUniforms {
  return { uRimIntensity: { value: 0 }, uRimColor: { value: rimColor.clone() } };
}

function isTissueLayerActive(tissue: TissueType | undefined, layerMode: LayerMode) {
  if (layerMode === "complete")
    return tissue === "os" || tissue === "muschi" || tissue === "tendon" || tissue === "organ";
  if (layerMode === "skeleton") return tissue === "os";
  if (layerMode === "muscles") return tissue === "muschi";
  if (layerMode === "organs") return tissue === "organ";
  return false;
}

function isTissueInteractive(tissue: TissueType | undefined, layerMode: LayerMode) {
  if (layerMode === "complete") return false;
  return isTissueLayerActive(tissue, layerMode);
}

function tissuePriority(tissue: TissueType | undefined, layerMode: LayerMode) {
  if (layerMode === "skeleton") return tissue === "os" ? 0 : 3;
  if (layerMode === "muscles") return tissue === "muschi" ? 0 : 3;
  if (layerMode === "organs") return tissue === "organ" ? 0 : 3;
  if (tissue === "organ") return 0;
  if (tissue === "muschi") return 0;
  if (tissue === "os") return 1;
  if (tissue === "tendon") return 2;
  return 3;
}

function completeLayerOpacity(tissue: TissueType | undefined) {
  if (tissue === "os") return 0.12;
  if (tissue === "muschi") return 0.07;
  if (tissue === "tendon") return 0.08;
  return 0.12;
}

function normalizeAnatomyName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasTerm(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function stripLateralityFromId(value: string) {
  return value.replace(/-(left|right)$/i, "");
}

function stripLateralityFromLabel(value: string) {
  return value
    .replace(/\s*\((stanga|stânga|dreapta|left|right)\)\s*$/i, "")
    .replace(/\b(stanga|stânga|dreapta|left|right)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function makeRegion(regionId: string, regionLabel: string) {
  return { regionId, regionLabel };
}

function makeCatalogSelection(id: string, label: string) {
  const labels = getEticheteSchelet(id);
  return { id, label: labels?.ro ?? label, labelEn: labels?.en ?? label };
}

function makeReadableSelection(id: string, label: string) {
  return { id: stripLateralityFromId(id), label };
}

function inferReadableMuscleSelection(input: { id?: string; label?: string; labelEn?: string }) {
  const name = normalizeAnatomyName(
    [input.labelEn, input.label, input.id].filter(Boolean).join(" "),
  );
  const fallbackId = stripLateralityFromId(
    input.id ?? `muschi-${name.replace(/[^a-z0-9]+/g, "-")}`,
  );

  if (hasTerm(name, ["temporoparietalis"]))
    return makeReadableSelection(fallbackId, "Mușchiul temporoparietal");
  if (hasTerm(name, ["temporalis"])) return makeReadableSelection(fallbackId, "Mușchiul temporal");
  if (hasTerm(name, ["masseter"])) return makeReadableSelection(fallbackId, "Mușchiul maseter");
  if (hasTerm(name, ["buccinator", "bucinator"]))
    return makeReadableSelection(fallbackId, "Mușchiul buccinator");
  if (hasTerm(name, ["orbicularis oculi"]))
    return makeReadableSelection(fallbackId, "Mușchiul orbicular al ochiului");
  if (hasTerm(name, ["orbicularis oris"]))
    return makeReadableSelection(fallbackId, "Mușchiul orbicular al gurii");
  if (hasTerm(name, ["superior rectus muscle"]))
    return makeReadableSelection(fallbackId, "Mușchiul drept superior al ochiului");
  if (hasTerm(name, ["inferior rectus muscle"]))
    return makeReadableSelection(fallbackId, "Mușchiul drept inferior al ochiului");
  if (hasTerm(name, ["lateral rectus muscle"]))
    return makeReadableSelection(fallbackId, "Mușchiul drept lateral al ochiului");
  if (hasTerm(name, ["medial rectus muscle"]))
    return makeReadableSelection(fallbackId, "Mușchiul drept medial al ochiului");
  if (hasTerm(name, ["superior oblique muscle"]))
    return makeReadableSelection(fallbackId, "Mușchiul oblic superior al ochiului");
  if (hasTerm(name, ["inferior oblique muscle"]))
    return makeReadableSelection(fallbackId, "Mușchiul oblic inferior al ochiului");

  const rawLabel = stripLateralityFromLabel(input.label ?? input.labelEn ?? "Mușchi scheletic");
  const readableLabel = rawLabel
    .replace(/^muschiul\s+/i, "Mușchiul ")
    .replace(/^muschi\s+/i, "Mușchi ")
    .replace(/\bmuschiului\b/gi, "mușchiului")
    .replace(/\bmuschiul\b/gi, "mușchiul")
    .replace(/\bmuschi\b/gi, "mușchi")
    .trim();

  return makeReadableSelection(fallbackId, readableLabel || "Mușchi scheletic");
}

export function inferCatalogSelection(input: {
  tissue: TissueType;
  id?: string;
  label?: string;
  labelEn?: string;
}) {
  const name = normalizeAnatomyName(
    [input.labelEn, input.label, input.id].filter(Boolean).join(" "),
  );
  if (input.tissue !== "os") return undefined;

  if (hasTerm(name, ["patellar surface of femur"])) return makeCatalogSelection("femur", "Femur");
  if (hasTerm(name, ["radial notch"])) return makeCatalogSelection("ulna", "Ulnă");
  if (hasTerm(name, ["ulnar notch"])) return makeCatalogSelection("radius", "Radius");
  if (hasTerm(name, ["fibular notch", "fibular articular facet"]))
    return makeCatalogSelection("tibia", "Tibia");
  if (hasTerm(name, ["phalanx"]) && hasTerm(name, ["hand"]))
    return makeCatalogSelection("falange-mana", "Falange ale mâinii");
  if (hasTerm(name, ["phalanx"]) && hasTerm(name, ["foot"]))
    return makeCatalogSelection("falange-picior", "Falange ale piciorului");
  if (hasTerm(name, ["calcaneal"])) return makeCatalogSelection("tars", "Oase tarsiene");
  if (hasTerm(name, ["bony pelvis", "gluteal line", "sciatic foramen", "sciatic notch"]))
    return makeCatalogSelection("coxal", "Oase coxale");
  if (hasTerm(name, ["conoid tubercle"])) return makeCatalogSelection("clavicula", "Clavicule");
  if (
    hasTerm(name, [
      "coronoid fossa",
      "greater tubercle",
      "lesser tubercle",
      "intertubercular sulcus",
      "crest of greater tubercle",
      "crest of lesser tubercle",
    ])
  )
    return makeCatalogSelection("humerus", "Humerus");
  if (hasTerm(name, ["intercondylar fossa", "intercondylar line", "gluteal tuberosity"]))
    return makeCatalogSelection("femur", "Femur");
  if (hasTerm(name, ["anterior intercondylar area", "posterior intercondylar area"]))
    return makeCatalogSelection("tibia", "Tibia");
  if (hasTerm(name, ["lateral malleolus", "malleolar fossa"]))
    return makeCatalogSelection("fibula", "Fibulă");
  if (hasTerm(name, ["medial malleolus"])) return makeCatalogSelection("tibia", "Tibia");
  if (hasTerm(name, ["nuchal line"])) return makeCatalogSelection("occipital", "Os occipital");
  if (
    hasTerm(name, [
      "foramen ovale",
      "foramen rotundum",
      "foramen spinosum",
      "pterygoid",
      "carotid sulcus",
      "chiasmatic sulcus",
      "hypophysial fossa",
      "greater wing",
      "lesser wing",
    ])
  )
    return makeCatalogSelection("sfenoid", "Os sfenoid");
  if (
    hasTerm(name, [
      "hypoglossal canal",
      "condylar canal",
      "condylar fossa",
      "cruciform eminence",
      "cerebellar fossa",
    ])
  )
    return makeCatalogSelection("occipital", "Os occipital");
  if (hasTerm(name, ["arcuate eminence", "mastoid", "groove for transverse sinus"]))
    return makeCatalogSelection("temporal", "Oase temporale");
  if (hasTerm(name, ["genion", "gnathion", "digastric fossa", "mental spine"]))
    return makeCatalogSelection("mandibula", "Mandibulă");

  if (hasTerm(name, ["malleus"])) return makeCatalogSelection("ciocan", "Ciocane");
  if (hasTerm(name, ["incus"])) return makeCatalogSelection("nicovala", "Nicovale");
  if (hasTerm(name, ["stapes"])) return makeCatalogSelection("scarita", "Scărițe");
  if (hasTerm(name, ["hyoid"])) return makeCatalogSelection("hioid", "Os hioid");

  if (hasTerm(name, ["frontal"])) return makeCatalogSelection("frontal", "Os frontal");
  if (hasTerm(name, ["parietal"])) return makeCatalogSelection("parietal", "Oase parietale");
  if (hasTerm(name, ["temporal", "petrous"]))
    return makeCatalogSelection("temporal", "Oase temporale");
  if (hasTerm(name, ["occipital", "foramen magnum"]))
    return makeCatalogSelection("occipital", "Os occipital");
  if (hasTerm(name, ["sphenoid", "clinoid", "sella"]))
    return makeCatalogSelection("sfenoid", "Os sfenoid");
  if (hasTerm(name, ["ethmoid"])) return makeCatalogSelection("etmoid", "Os etmoid");

  if (hasTerm(name, ["maxilla", "maxillary", "infraorbital", "alveolar"]))
    return makeCatalogSelection("maxilar", "Maxilare");
  if (hasTerm(name, ["mandible", "mandibular", "mental foramen"]))
    return makeCatalogSelection("mandibula", "Mandibulă");
  if (hasTerm(name, ["zygomatic"])) return makeCatalogSelection("zigomatic", "Oase zigomatice");
  if (hasTerm(name, ["nasal"])) return makeCatalogSelection("nazal", "Oase nazale");
  if (hasTerm(name, ["lacrimal"])) return makeCatalogSelection("lacrimal", "Oase lacrimale");
  if (hasTerm(name, ["palatine"])) return makeCatalogSelection("palatin", "Oase palatine");
  if (hasTerm(name, ["vomer"])) return makeCatalogSelection("vomer", "Vomer");
  if (hasTerm(name, ["concha", "turbinate"]))
    return makeCatalogSelection("cornet-inf", "Cornete nazale inferioare");

  if (hasTerm(name, ["cervical", "atlas", "axis"]))
    return makeCatalogSelection("vert-cervicale", "Vertebre cervicale");
  if (
    hasTerm(name, [
      "thoracic",
      " t1",
      " t2",
      " t3",
      " t4",
      " t5",
      " t6",
      " t7",
      " t8",
      " t9",
      "t10",
      "t11",
      "t12",
    ])
  ) {
    return makeCatalogSelection("vert-toracice", "Vertebre toracice");
  }
  if (hasTerm(name, ["lumbar", " l1", " l2", " l3", " l4", " l5"]))
    return makeCatalogSelection("vert-lombare", "Vertebre lombare");
  if (hasTerm(name, ["sacrum", "sacral"])) return makeCatalogSelection("sacrum", "Sacrum");
  if (hasTerm(name, ["coccyx", "coccygeal"])) return makeCatalogSelection("coccis", "Coccis");

  if (hasTerm(name, ["sternum", "manubrium", "xiphoid"]))
    return makeCatalogSelection("stern", "Stern");
  if (hasTerm(name, ["rib", "costal"])) return makeCatalogSelection("coaste", "Coaste");
  if (hasTerm(name, ["clavicle", "clavicular"]))
    return makeCatalogSelection("clavicula", "Clavicule");
  if (
    hasTerm(name, [
      "scapula",
      "scapular",
      "acromion",
      "acromial",
      "coracoid",
      "glenoid",
      "supraspinous fossa",
      "infraspinous fossa",
    ])
  ) {
    return makeCatalogSelection("scapula", "Scapule");
  }

  if (
    hasTerm(name, [
      "humerus",
      "humeral",
      "trochlea",
      "capitulum",
      "olecranon fossa",
      "deltoid tuberosity",
    ])
  )
    return makeCatalogSelection("humerus", "Humerus");
  if (hasTerm(name, ["radius", "radial"])) return makeCatalogSelection("radius", "Radius");
  if (hasTerm(name, ["ulna", "ulnar", "olecranon"])) return makeCatalogSelection("ulna", "Ulnă");
  if (
    hasTerm(name, [
      "carpal",
      "scaphoid",
      "lunate",
      "triquetrum",
      "pisiform",
      "trapezium",
      "trapezoid",
      "capitate",
      "hamate",
    ])
  ) {
    return makeCatalogSelection("carp", "Oase carpiene");
  }
  if (hasTerm(name, ["metacarpal"])) return makeCatalogSelection("metacarp", "Metacarpiene");
  if (
    hasTerm(name, [
      "phalanx of hand",
      "distal phalanx hand",
      "middle phalanx hand",
      "proximal phalanx hand",
    ])
  ) {
    return makeCatalogSelection("falange-mana", "Falange ale mâinii");
  }

  if (
    hasTerm(name, [
      "hip bone",
      "ilium",
      "ischium",
      "pubis",
      "acetabulum",
      "acetabular",
      "obturator",
      "iliac",
      "ischial",
      "pubic",
    ])
  ) {
    return makeCatalogSelection("coxal", "Oase coxale");
  }
  if (hasTerm(name, ["patella", "patellar"])) return makeCatalogSelection("rotula", "Rotulă");
  if (hasTerm(name, ["femur", "femoral", "trochanter", "linea aspera", "adductor tubercle"]))
    return makeCatalogSelection("femur", "Femur");
  if (hasTerm(name, ["tibia", "tibial", "intercondylar eminence"]))
    return makeCatalogSelection("tibia", "Tibia");
  if (hasTerm(name, ["fibula", "fibular"])) return makeCatalogSelection("fibula", "Fibulă");
  if (hasTerm(name, ["tarsal", "calcaneus", "talus", "cuboid", "cuneiform", "navicular"]))
    return makeCatalogSelection("tars", "Oase tarsiene");
  if (hasTerm(name, ["metatarsal"])) return makeCatalogSelection("metatars", "Metatarsiene");
  if (
    hasTerm(name, [
      "phalanx of foot",
      "distal phalanx foot",
      "middle phalanx foot",
      "proximal phalanx foot",
    ])
  ) {
    return makeCatalogSelection("falange-picior", "Falange ale piciorului");
  }

  return undefined;
}

export function inferIntuitiveRegion(input: {
  tissue: TissueType;
  id?: string;
  label?: string;
  labelEn?: string;
}) {
  const name = normalizeAnatomyName(
    [input.labelEn, input.label, input.id].filter(Boolean).join(" "),
  );
  const prefix = input.tissue;

  if (input.tissue === "tendon") {
    if (hasTerm(name, ["plantar", "foot", "hallucis", "digiti minimi"])) {
      return makeRegion(`${prefix}:laba-piciorului`, "Laba piciorului");
    }
    if (hasTerm(name, ["palmar", "hand", "pollicis", "carpal", "finger", "digit"])) {
      return makeRegion(`${prefix}:mana`, "Mâna");
    }
    if (hasTerm(name, ["deltoid", "supraspinatus", "infraspinatus", "subscapularis"])) {
      return makeRegion(`${prefix}:umar`, "Umăr");
    }
    if (
      hasTerm(name, [
        "abdominal",
        "external abdominal oblique",
        "internal abdominal oblique",
        "rectus abdominis",
        "transversus abdominis",
      ])
    ) {
      return makeRegion(`${prefix}:abdomen`, "Abdomen");
    }
    return undefined;
  }

  if (input.tissue === "os") {
    if (
      hasTerm(name, [
        "carpal",
        "metacarpal",
        "phalanx of hand",
        "distal phalanx hand",
        "middle phalanx hand",
        "proximal phalanx hand",
      ])
    ) {
      return makeRegion(`${prefix}:schelet-mana`, "Scheletul mâinii");
    }
    if (
      hasTerm(name, [
        "tarsal",
        "metatarsal",
        "phalanx of foot",
        "calcaneus",
        "talus",
        "cuboid",
        "cuneiform",
        "navicular",
      ])
    ) {
      return makeRegion(`${prefix}:schelet-picior`, "Scheletul labei piciorului");
    }
    if (hasTerm(name, ["rib", "sternum", "manubrium", "xiphoid"])) {
      return makeRegion(`${prefix}:cutie-toracica`, "Cutia toracică");
    }
    if (hasTerm(name, ["vertebra", "atlas", "axis"])) {
      if (hasTerm(name, ["cervical", "atlas", "axis"]))
        return makeRegion(`${prefix}:coloana-cervicala`, "Coloana cervicală");
      if (
        hasTerm(name, [
          "thoracic",
          " t1",
          " t2",
          " t3",
          " t4",
          " t5",
          " t6",
          " t7",
          " t8",
          " t9",
          "t10",
          "t11",
          "t12",
        ])
      ) {
        return makeRegion(`${prefix}:coloana-toracala`, "Coloana toracală");
      }
      if (hasTerm(name, ["lumbar", " l1", " l2", " l3", " l4", " l5"]))
        return makeRegion(`${prefix}:coloana-lombara`, "Coloana lombară");
      return makeRegion(`${prefix}:coloana`, "Coloana vertebrală");
    }
    if (
      hasTerm(name, [
        "frontal",
        "parietal",
        "temporal",
        "occipital",
        "sphenoid",
        "ethmoid",
        "clinoid",
        "petrous",
        "foramen magnum",
        "cranial fossa",
      ])
    ) {
      return makeRegion(`${prefix}:craniu`, "Craniu");
    }
    if (
      hasTerm(name, [
        "maxilla",
        "mandible",
        "zygomatic",
        "nasal",
        "lacrimal",
        "palatine",
        "vomer",
        "concha",
        "orbital",
        "alveolar",
        "infraorbital",
        "mental foramen",
        "arytenoid",
        "laryngeal",
      ])
    ) {
      return makeRegion(`${prefix}:fata`, "Oasele feței");
    }
    if (hasTerm(name, ["malleus", "incus", "stapes"])) {
      return makeRegion(`${prefix}:ureche-medie`, "Oasele urechii medii");
    }
    if (hasTerm(name, ["hyoid"])) {
      return makeRegion(`${prefix}:hioid`, "Os hioid");
    }
    if (
      hasTerm(name, [
        "clavicle",
        "scapula",
        "acromion",
        "acromial",
        "coracoid",
        "glenoid",
        "supraspinous fossa",
        "infraspinous fossa",
      ])
    ) {
      return makeRegion(`${prefix}:centura-scapulara`, "Centura scapulară");
    }
    if (
      hasTerm(name, [
        "humerus",
        "humeral",
        "trochlea",
        "capitulum",
        "olecranon fossa",
        "anatomical neck",
        "surgical neck",
        "deltoid tuberosity",
      ])
    ) {
      return makeRegion(`${prefix}:brat`, "Scheletul brațului");
    }
    if (
      hasTerm(name, [
        "radius",
        "radial",
        "ulna",
        "ulnar",
        "olecranon",
        "styloid process of radius",
        "styloid process of ulna",
      ])
    ) {
      return makeRegion(`${prefix}:antebrat`, "Scheletul antebrațului");
    }
    if (
      hasTerm(name, [
        "hip bone",
        "ilium",
        "ischium",
        "pubis",
        "acetabulum",
        "acetabular",
        "obturator",
        "iliac",
        "ischial",
        "pubic",
        "sacral",
        "gluteal line",
      ])
    ) {
      return makeRegion(`${prefix}:bazin`, "Centura pelviană");
    }
    if (
      hasTerm(name, [
        "femur",
        "femoral",
        "patella",
        "patellar",
        "greater trochanter",
        "lesser trochanter",
        "linea aspera",
        "adductor tubercle",
        "intercondylar area",
      ])
    ) {
      return makeRegion(`${prefix}:coapsa`, "Scheletul coapsei");
    }
    if (
      hasTerm(name, ["tibia", "tibial", "fibula", "fibular", "malleolus", "intercondylar eminence"])
    ) {
      return makeRegion(`${prefix}:gamba`, "Scheletul gambei");
    }
    return undefined;
  }

  if (
    hasTerm(name, [
      "temporoparietalis",
      "superior oblique muscle",
      "inferior oblique muscle",
      "superior rectus muscle",
      "inferior rectus muscle",
      "lateral rectus muscle",
      "medial rectus muscle",
      "orbicularis oculi",
      "trochlea of superior oblique",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-capului-gatului`, "Mușchii capului și gâtului");
  }
  if (
    hasTerm(name, [
      "lumbrical",
      "interossei",
      "opponens",
      "palmar",
      "pollicis",
      "digiti minimi of hand",
      "thenar",
      "hypothenar",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-mainii`, "Mușchii mâinii");
  }
  if (
    hasTerm(name, [
      "digitorum brevis",
      "hallucis brevis",
      "adductor hallucis",
      "abductor hallucis",
      "digiti minimi of foot",
      "plantar",
      "quadratus plantae",
      "foot",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-piciorului`, "Mușchii labei piciorului");
  }
  if (
    hasTerm(name, [
      "digitorum longus",
      "hallucis longus",
      "tibialis",
      "fibularis",
      "gastrocnemius",
      "soleus",
      "plantaris",
      "popliteus",
      "compartment of leg",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-gambei`, "Mușchii gambei");
  }
  if (
    hasTerm(name, [
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
      "compartment of thigh",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-coapsei`, "Mușchii coapsei");
  }
  if (
    hasTerm(name, [
      "forearm",
      "flexor carpi",
      "extensor carpi",
      "flexor digitorum superficialis",
      "flexor digitorum profundus",
      "extensor digitorum communis",
      "extensor digitorum muscle",
      "extensor indicis",
      "extensor digiti minimi of hand",
      "pronator",
      "supinator",
      "brachioradialis",
      "palmaris",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-antebratului`, "Mușchii antebrațului");
  }
  if (
    hasTerm(name, [
      "compartment of arm",
      "biceps brachii",
      "brachialis",
      "coracobrachialis",
      "triceps brachii",
      "anconeus",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-bratului`, "Mușchii brațului");
  }
  if (
    hasTerm(name, [
      "external abdominal oblique",
      "internal abdominal oblique",
      "rectus abdominis",
      "transversus abdominis",
      "pyramidalis",
      "quadratus lumborum",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-abdomenului`, "Mușchii abdomenului");
  }
  if (
    hasTerm(name, [
      "pectoralis",
      "serratus anterior",
      "intercostal",
      "diaphragm",
      "subclavius",
      "transversus thoracis",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-toracelui`, "Mușchii toracelui");
  }
  if (
    hasTerm(name, [
      "deltoid",
      "supraspinatus",
      "infraspinatus",
      "subscapularis",
      "teres major",
      "teres minor",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-umarului`, "Mușchii umărului");
  }
  if (
    hasTerm(name, [
      "gluteus",
      "piriformis",
      "obturator",
      "gemellus",
      "quadratus femoris",
      "iliopsoas",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-soldului`, "Mușchii șoldului");
  }
  if (
    hasTerm(name, [
      "bucinator",
      "buccinator",
      "corrugator",
      "depressor",
      "frontalis",
      "levator anguli",
      "levator labii",
      "levator nasolabialis",
      "masseter",
      "mentalis",
      "nasalis",
      "orbicularis",
      "pterygoid",
      "risorius",
      "temporalis",
      "zygomaticus",
      "sternocleidomastoid",
      "scalenus",
      "omohyoid",
      "sternohyoid",
      "thyrohyoid",
      "platysma",
      "digastric",
      "mylohyoid",
      "longus colli",
      "splenius",
      "semispinalis",
      "longissimus capitis",
      "pharyngeal constrictor",
      "common tendinous ring",
      "inferior tarsus",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-capului-gatului`, "Mușchii capului și gâtului");
  }
  if (
    hasTerm(name, [
      "trapezius",
      "latissimus dorsi",
      "rhomboid",
      "levator scapulae",
      "erector spinae",
      "iliocostalis",
      "longissimus",
      "spinalis",
      "multifidus",
      "thoracolumbar",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-spatelui`, "Mușchii spatelui");
  }
  if (hasTerm(name, ["levator ani", "iliopectineal arch", "pelvic floor"])) {
    return makeRegion(`${prefix}:muschii-bazinului`, "Mușchii bazinului");
  }
  if (hasTerm(name, ["extensor digitorum", "extensor digiti minimi"])) {
    return makeRegion(`${prefix}:muschii-antebratului`, "Mușchii antebrațului");
  }
  if (
    hasTerm(name, [
      "levator palpebrae",
      "auditory ossicles",
      "muscles of head",
      "muscles of neck",
      "soft palate",
      "muscles of tongue",
      "epicranius",
      "extra-ocular",
      "auricular",
      "facial muscles",
      "genioglossus",
      "geniohyoid",
      "hyoglossus",
      "intrinsic auricular",
      "laryngeal",
      "masticatory",
      "obliquus inferior capitis",
      "obliquus superior capitis",
      "occipitalis",
      "palatopharyngeus",
      "pharyngeal",
      "procerus",
      "rectus anterior capitis",
      "rectus lateralis capitis",
      "rectus posterior",
      "sternothyroid",
      "cricothyroid",
      "stylohyoid",
      "stylopharyngeus",
      "suboccipital",
      "suprahyoid",
      "infrahyoid",
      "thyro-epiglottic",
      "arytenoid",
      "longus capitis",
      "superior tarsus",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-capului-gatului`, "Mușchii capului și gâtului");
  }
  if (
    hasTerm(name, [
      "levatores costarum",
      "costarum",
      "epaxial",
      "hypaxial muscles of back",
      "interspinales",
      "intertransversarii",
      "serratus posterior",
      "spinotransversales",
      "transversospinal",
      "rotatores",
      "lateral intertransversarii lumborum",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-spatelui`, "Mușchii spatelui");
  }
  if (hasTerm(name, ["linea alba", "muscles of abdomen"])) {
    return makeRegion(`${prefix}:muschii-abdomenului`, "Mușchii abdomenului");
  }
  if (hasTerm(name, ["muscles of thorax"])) {
    return makeRegion(`${prefix}:muschii-toracelui`, "Mușchii toracelui");
  }
  if (hasTerm(name, ["muscles of hand"])) {
    return makeRegion(`${prefix}:muschii-mainii`, "Mușchii mâinii");
  }
  if (
    hasTerm(name, [
      "muscles of pelvis",
      "coccygeus",
      "iliococcygeus",
      "perineal",
      "pubo-analis",
      "pubococcygeus",
      "external anal sphincter",
    ])
  ) {
    return makeRegion(`${prefix}:muschii-bazinului`, "Mușchii bazinului");
  }
  if (hasTerm(name, ["iliacus", "deep gluteal", "superficial gluteal", "psoas major"])) {
    return makeRegion(`${prefix}:muschii-soldului`, "Mușchii șoldului");
  }
  if (hasTerm(name, ["rotator cuff", "scapulohumeral"])) {
    return makeRegion(`${prefix}:muschii-umarului`, "Mușchii umărului");
  }
  if (hasTerm(name, ["muscles of upper limb"])) {
    return makeRegion(`${prefix}:membrul-superior`, "Mușchii membrului superior");
  }
  if (hasTerm(name, ["muscles of lower limb"])) {
    return makeRegion(`${prefix}:membrul-inferior`, "Mușchii membrului inferior");
  }
  if (name === "muschi-muscles" || name.endsWith(" muschi-muscles")) {
    return makeRegion(`${prefix}:sistem-muscular`, "Sistemul muscular");
  }

  return undefined;
}

interface SimpleSkeletonModelProps {
  url: string;
  fallbackUrl?: string;
  xOffset: number;
  label: string;
  side: SkeletonSide;
  variant: "matte" | "pearl";
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
}

function useGLTFWithFallback(url: string, fallback: string) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((r) => {
        if (cancelled) return;
        setResolvedUrl(r.ok ? url : fallback);
      })
      .catch(() => !cancelled && setResolvedUrl(fallback));
    return () => {
      cancelled = true;
    };
  }, [url, fallback]);
  return resolvedUrl;
}

function SimpleSkeletonModel(props: SimpleSkeletonModelProps) {
  const resolvedUrl = useGLTFWithFallback(props.url, props.fallbackUrl ?? props.url);
  if (!resolvedUrl) return null;
  return <ResolvedSimpleSkeletonModel {...props} url={resolvedUrl} />;
}

function ResolvedSimpleSkeletonModel({
  url,
  xOffset,
  label,
  side,
  variant,
  selection,
  onSelect,
}: SimpleSkeletonModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const baseColor = useMemo(
    () => (variant === "pearl" ? new THREE.Color("#f6f1e3") : new THREE.Color("#fbf6e9")),
    [variant],
  );

  const { cloned, allMeshes: simpleMeshes } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const allMeshes: THREE.Mesh[] = [];
    root.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      let cur: THREE.Object3D | null = obj;
      let boneId: string | null = null;
      while (cur) {
        const match = Object.keys(MESH_TO_BONE).find((k) => cur!.name.startsWith(k));
        if (match) {
          boneId = MESH_TO_BONE[match];
          break;
        }
        cur = cur.parent;
      }

      if (
        mesh.name.toLowerCase().includes("outline") ||
        (cur && cur.name.toLowerCase().includes("outline"))
      ) {
        mesh.visible = false;
        mesh.userData.boneId = null;
        return;
      }

      mesh.userData.boneId = boneId;
      mesh.userData.tissue = "os" as TissueType;
      mesh.userData.side = side;

      const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor.clone(),
        roughness: variant === "pearl" ? 0.28 : 0.5,
        metalness: 0,
        clearcoat: variant === "pearl" ? 0.6 : 0.1,
        clearcoatRoughness: variant === "pearl" ? 0.25 : 0.6,
        sheen: variant === "pearl" ? 0.6 : 0,
        sheenColor: new THREE.Color("#e6e0ff"),
        sheenRoughness: 0.6,
        emissive: SELECT_COLOR.clone(),
        emissiveIntensity: 0,
        envMapIntensity: 1.2,
      });
      mesh.userData.rimUniforms = injectRimShader(mat, new THREE.Color("#00f2fe"));
      mesh.material = mat;
      allMeshes.push(mesh);
    });
    return { cloned: root, allMeshes };
  }, [gltf, baseColor, variant, side]);

  const simpleIsDirtyRef = useRef(true);
  useEffect(() => {
    simpleIsDirtyRef.current = true;
  }, [selection]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 5.2;
    const s = targetHeight / (size.y || 1);
    return { scale: s, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [cloned]);

  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    const hovered = hoveredMeshRef.current;
    if (!simpleIsDirtyRef.current && !hovered) return;

    let settling = false;
    for (const mesh of simpleMeshes) {
      if (!mesh.visible || !mesh.material) continue;
      const boneId = mesh.userData.boneId as string | null;
      if (!boneId) continue;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const isSelected = selection !== null && selection.side === side && selection.id === boneId;
      const isHov = !isSelected && !!hovered && (hovered.userData.boneId as string) === boneId;

      const targetEmissive = isSelected ? 0.75 : 0;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.18;
      const targetColor = isSelected ? SELECT_COLOR : isHov ? HOVER_COLOR_BONE : baseColor;
      mat.color.lerp(targetColor, 0.18);

      const rimUniforms = mesh.userData.rimUniforms as RimUniforms | undefined;
      if (rimUniforms) {
        const targetRim = isSelected ? 1.4 : isHov ? 0.75 : 0;
        rimUniforms.uRimIntensity.value += (targetRim - rimUniforms.uRimIntensity.value) * 0.18;
        if (Math.abs(rimUniforms.uRimIntensity.value - targetRim) > 0.004) settling = true;
      }
      if (Math.abs(mat.emissiveIntensity - targetEmissive) > 0.004) settling = true;
    }
    if (!settling && !hovered) simpleIsDirtyRef.current = false;
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const id = mesh.userData?.boneId as string | null;
    if (!id) return;
    hoveredMeshRef.current = mesh;
    simpleIsDirtyRef.current = true;
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoveredMeshRef.current = null;
    simpleIsDirtyRef.current = true;
    document.body.style.cursor = "auto";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = (e.object.userData?.boneId as string | null) ?? null;
    if (id) onSelect({ id, side, tissue: "os" });
  };

  return (
    <group
      ref={groupRef}
      position={[xOffset, 0, 0]}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <primitive object={cloned} position={offset} />
    </group>
  );
}

interface ComplexMaleProps {
  url: string;
  xOffset: number;
  layerMode: LayerMode;
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
}

function ComplexMaleModel({ url, xOffset, layerMode, selection, onSelect }: ComplexMaleProps) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);
  const layerModeRef = useRef(layerMode);

  const { cloned, layerMeshes, allMeshes } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const layerMeshes: Record<TissueType, THREE.Mesh[]> = {
      os: [],
      muschi: [],
      tendon: [],
      organ: [],
    };
    const allMeshes: THREE.Mesh[] = [];
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      allMeshes.push(mesh);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const tissue = (mesh.userData.tissue as TissueType | undefined) ?? "muschi";
      const structureId =
        (mesh.userData.structureId as string | undefined) ??
        `${tissue}-${mesh.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const structureName =
        (mesh.userData.structureName as string | undefined) ??
        mesh.name
          .replace(/\.[a-z]+$/i, "")
          .replace(/[()[\]]/g, "")
          .trim();
      const structureNameEn =
        (mesh.userData.structureNameEn as string | undefined) ?? structureName;
      const exactMapping = resolveExactAnatomy3dMapping(structureId);
      const readableMuscleSelection =
        tissue === "muschi"
          ? inferReadableMuscleSelection({
              id: structureId,
              label: structureName,
              labelEn: structureNameEn,
            })
          : undefined;

      mesh.userData.tissue = tissue;
      mesh.userData.side = "male";
      mesh.userData.exactMappingStatus = exactMapping?.status ?? "unsupported";
      const selectionId =
        exactMapping?.status === "exact" ? (exactMapping.selectionId ?? undefined) : undefined;
      const catalogLabels = getEticheteSchelet(selectionId);
      const selectionLabel =
        tissue === "muschi"
          ? readableMuscleSelection?.label
          : (catalogLabels?.ro ??
            exactMapping?.regionLabel ??
            stripLateralityFromLabel(structureName));
      const selectionLabelEn =
        tissue === "os"
          ? (catalogLabels?.en ?? exactMapping?.labelEn ?? structureNameEn)
          : structureNameEn;

      mesh.userData.selectionId = selectionId;
      mesh.userData.selectionLabel = selectionLabel;
      mesh.userData.selectionLabelEn = selectionLabelEn;
      mesh.userData.selectionRegionId =
        exactMapping?.status === "exact" ? (exactMapping.regionId ?? undefined) : undefined;
      mesh.userData.selectionRegionLabel =
        exactMapping?.status === "exact" ? (exactMapping.regionLabel ?? undefined) : undefined;

      const baseColor =
        tissue === "os"
          ? new THREE.Color("#f6ead2")
          : tissue === "muschi"
            ? new THREE.Color("#b23a32")
            : tissue === "organ"
              ? new THREE.Color("#00d8e8")
              : new THREE.Color("#ead2ad");

      const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        roughness: tissue === "os" ? 0.42 : tissue === "muschi" ? 0.58 : 0.55,
        metalness: 0,
        clearcoat: tissue === "muschi" ? 0.2 : 0.16,
        clearcoatRoughness: 0.45,
        emissive: SELECT_EMISSIVE.clone(),
        emissiveIntensity: 0,
        transparent: true,
        opacity:
          tissue === "muschi" ? 0.62 : tissue === "tendon" ? 0.72 : tissue === "organ" ? 0.88 : 1,
        depthWrite: tissue === "os",
        envMapIntensity: 1.1,
        side: THREE.DoubleSide,
      });
      mat.userData.baseColor = baseColor.clone();
      mat.userData.baseOpacity = mat.opacity;
      mesh.material = mat;
      if (tissue !== "organ") {
        const rimColor =
          tissue === "muschi"
            ? new THREE.Color("#d91f7b")
            : tissue === "tendon"
              ? new THREE.Color("#e8a030")
              : new THREE.Color("#00f2fe");
        mesh.userData.rimUniforms = injectRimShader(mat, rimColor);
      } else {
        mesh.raycast = () => null;
      }
      layerMeshes[tissue].push(mesh);
    });
    return { cloned: root, layerMeshes, allMeshes };
  }, [gltf]);

  useEffect(() => {
    layerModeRef.current = layerMode;
    layerMeshes.os.forEach((m) => (m.visible = isTissueLayerActive("os", layerMode)));
    layerMeshes.muschi.forEach((m) => (m.visible = isTissueLayerActive("muschi", layerMode)));
    layerMeshes.tendon.forEach((m) => (m.visible = isTissueLayerActive("tendon", layerMode)));
    layerMeshes.organ.forEach((m) => (m.visible = false));
  }, [layerMode, layerMeshes]);

  useEffect(() => {
    if (selection?.side !== "male") return;
    if (!isTissueInteractive(selection.tissue, layerMode)) {
      onSelect(null);
    }
  }, [layerMode, onSelect, selection]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 5.8;
    const s = targetHeight / (size.y || size.z || 1);
    return { scale: s, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [cloned]);

  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const isDirtyRef = useRef(true);

  useEffect(() => {
    isDirtyRef.current = true;
  }, [selection, layerMode]);

  useFrame(() => {
    const hovered = hoveredMeshRef.current;
    if (!isDirtyRef.current && !hovered) return;

    let settling = false;
    const hasSelection = selection !== null && selection.side === "male";
    const isCompleteLayer = layerModeRef.current === "complete";

    for (const mesh of allMeshes) {
      if (!mesh.visible || !mesh.material) continue;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const baseColor = (mat.userData.baseColor as THREE.Color) ?? mat.color;
      const baseOpacity = (mat.userData.baseOpacity as number | undefined) ?? mat.opacity;
      const tissue = mesh.userData.tissue as TissueType;
      const selectionId = mesh.userData.selectionId as string | undefined;
      const selectionRegionId = mesh.userData.selectionRegionId as string | undefined;

      const isSelected =
        !isCompleteLayer &&
        selection !== null &&
        selection.side === "male" &&
        (selection.id === selectionId ||
          (tissue !== "muschi" &&
            !!selection.regionId &&
            selection.regionId === selectionRegionId));
      const isHov =
        !isCompleteLayer &&
        !!selectionId &&
        hovered !== null &&
        hovered.userData.selectionId === selectionId &&
        !isSelected;

      mesh.renderOrder = isCompleteLayer ? -10 : isSelected ? 10 : 0;
      mat.depthWrite = isCompleteLayer ? false : isSelected || (!hasSelection && tissue === "os");
      mat.depthTest = true;

      const targetOpacity = isCompleteLayer
        ? completeLayerOpacity(tissue)
        : isSelected
          ? 1
          : hasSelection
            ? tissue === "os"
              ? 0.18
              : tissue === "muschi"
                ? 0.12
                : 0.1
            : isHov
              ? Math.min(1, baseOpacity + 0.2)
              : baseOpacity;
      mat.opacity += (targetOpacity - mat.opacity) * 0.22;

      const targetEmissive = isCompleteLayer ? 0 : isSelected ? 1.35 : isHov ? 0.2 : 0;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.18;

      const hoverColor = tissue === "muschi" ? HOVER_COLOR_MUSCLE : HOVER_COLOR_BONE;
      const targetColor = isCompleteLayer
        ? COMPLETE_REFERENCE_COLOR
        : isSelected
          ? SELECT_COLOR
          : hasSelection
            ? DIM_COLOR
            : isHov
              ? hoverColor
              : baseColor;
      mat.color.lerp(targetColor, 0.18);

      const rimUniforms = mesh.userData.rimUniforms as RimUniforms | undefined;
      if (rimUniforms) {
        const targetRim = isCompleteLayer ? 0 : isSelected ? 1.6 : isHov ? 0.9 : 0;
        rimUniforms.uRimIntensity.value += (targetRim - rimUniforms.uRimIntensity.value) * 0.18;
        if (Math.abs(rimUniforms.uRimIntensity.value - targetRim) > 0.004) settling = true;
      }
      if (Math.abs(mat.opacity - targetOpacity) > 0.004) settling = true;
      if (Math.abs(mat.emissiveIntensity - targetEmissive) > 0.004) settling = true;
    }

    if (!settling && !hovered) isDirtyRef.current = false;
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (layerModeRef.current === "complete") {
      hoveredMeshRef.current = null;
      document.body.style.cursor = "auto";
      return;
    }
    e.stopPropagation();
    const mesh =
      e.intersections
        .map((intersection) => intersection.object as THREE.Mesh)
        .filter((candidate) => {
          const tissue = candidate.userData?.tissue as TissueType | undefined;
          return (
            !!candidate.userData?.selectionId && isTissueInteractive(tissue, layerModeRef.current)
          );
        })
        .sort(
          (a, b) =>
            tissuePriority(a.userData?.tissue as TissueType | undefined, layerModeRef.current) -
            tissuePriority(b.userData?.tissue as TissueType | undefined, layerModeRef.current),
        )[0] ?? null;
    if (!mesh) return;
    hoveredMeshRef.current = mesh;
    isDirtyRef.current = true;
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (layerModeRef.current === "complete") {
      hoveredMeshRef.current = null;
      document.body.style.cursor = "auto";
      return;
    }
    e.stopPropagation();
    hoveredMeshRef.current = null;
    isDirtyRef.current = true;
    document.body.style.cursor = "auto";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (layerModeRef.current === "complete") return;
    e.stopPropagation();
    const mesh =
      e.intersections
        .map((intersection) => intersection.object as THREE.Mesh)
        .filter((candidate) => {
          const tissue = candidate.userData?.tissue as TissueType | undefined;
          return (
            !!candidate.userData?.selectionId && isTissueInteractive(tissue, layerModeRef.current)
          );
        })
        .sort(
          (a, b) =>
            tissuePriority(a.userData?.tissue as TissueType | undefined, layerModeRef.current) -
            tissuePriority(b.userData?.tissue as TissueType | undefined, layerModeRef.current),
        )[0] ?? null;
    if (!mesh) return;
    const tissue = mesh.userData?.tissue as TissueType | undefined;
    const id = mesh.userData?.selectionId as string | undefined;
    const label = mesh.userData?.selectionLabel as string | undefined;
    const labelEn = mesh.userData?.selectionLabelEn as string | undefined;
    const regionId = mesh.userData?.selectionRegionId as string | undefined;
    const regionLabel = mesh.userData?.selectionRegionLabel as string | undefined;
    if (!tissue || !id) return;
    onSelect({
      id,
      side: "male",
      tissue,
      regionId,
      regionLabel,
      label,
      labelEn,
    });
  };
  const isComplexModelInteractive = layerMode !== "organs" && layerMode !== "complete";

  return (
    <group
      ref={groupRef}
      position={[xOffset, 0, 0]}
      scale={scale}
      visible={layerMode !== "organs"}
      onPointerOver={isComplexModelInteractive ? handlePointerOver : undefined}
      onPointerOut={isComplexModelInteractive ? handlePointerOut : undefined}
      onClick={isComplexModelInteractive ? handleClick : undefined}
    >
      <primitive object={cloned} position={offset} />
    </group>
  );
}

function AnatomyGlbModel({
  organ,
  model,
  selected = false,
  selectionPulseKey = 0,
  opacity = 0.42,
  interactive = true,
  onPointerOver,
  onPointerOut,
  onClick,
}: {
  organ?: InternalOrgan;
  model: OrganModelPart;
  selected?: boolean;
  selectionPulseKey?: number;
  opacity?: number;
  interactive?: boolean;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const gltf = useGLTF(model.url);
  const materialsRef = useRef<THREE.Material[]>([]);
  const pulseElapsedRef = useRef(Number.POSITIVE_INFINITY);
  const previousPulseKeyRef = useRef(selectionPulseKey);
  const baseColor = useMemo(
    () => new THREE.Color(organ?.color ?? COMPLETE_REFERENCE_COLOR),
    [organ?.color],
  );
  const glowColor = useMemo(
    () => new THREE.Color(organ?.emissiveColor ?? "#00f2fe"),
    [organ?.emissiveColor],
  );

  const { scene, materials, centerOffset, targetPosition, targetScale } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    const materials: THREE.Material[] = [];

    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      const originalMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const clonedMaterials = originalMaterials.map((sourceMaterial) => {
        const clonedMaterial = sourceMaterial.clone();
        clonedMaterial.transparent = true;
        clonedMaterial.opacity = 0;
        clonedMaterial.depthTest = true;
        clonedMaterial.depthWrite = false;
        clonedMaterial.side = THREE.DoubleSide;
        clonedMaterial.toneMapped = false;

        const standardMaterial = clonedMaterial as THREE.MeshStandardMaterial;
        if ("color" in standardMaterial) {
          standardMaterial.color = baseColor.clone();
          standardMaterial.roughness = Math.max(standardMaterial.roughness ?? 0.4, 0.48);
          standardMaterial.metalness = 0;
        }
        if ("map" in standardMaterial) {
          standardMaterial.map = null;
          standardMaterial.needsUpdate = true;
        }
        if ("emissive" in standardMaterial) {
          standardMaterial.emissive = glowColor.clone();
          standardMaterial.emissiveIntensity = organ ? 0.08 : 0.04;
        }

        materials.push(clonedMaterial);
        return clonedMaterial;
      });

      mesh.material = Array.isArray(mesh.material) ? clonedMaterials : clonedMaterials[0];
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = organ ? 34 : 18;
      // Tag-uim mesh-ul cu id-ul organului, ca focusul de cameră să-l poată găsi
      // în scenă și să încadreze organul selectat (oasele/mușchii au deja boneId
      // / selectionId setate în modelele lor).
      if (organ) mesh.userData.selectionId = organ.id;
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const center = model.preserveScenePosition
      ? new THREE.Vector3()
      : box.getCenter(new THREE.Vector3()).multiplyScalar(-1);
    const size = box.getSize(new THREE.Vector3());
    const scale = resolveAnatomicalScale(model, size);
    if (model.mirrorX) scale.x *= -1;

    return {
      scene: cloned,
      materials,
      centerOffset: center,
      targetPosition: resolveAnatomicalPosition(model),
      targetScale: scale,
    };
  }, [baseColor, gltf.scene, glowColor, model, organ]);

  useEffect(() => {
    materialsRef.current = materials;
  }, [materials]);

  const targetRotation = useMemo(
    () => new THREE.Euler(...(model.rotation ?? [0, 0, 0])),
    [model.rotation],
  );

  useFrame((_, delta) => {
    if (selectionPulseKey !== previousPulseKeyRef.current) {
      previousPulseKeyRef.current = selectionPulseKey;
      pulseElapsedRef.current = 0;
    }

    pulseElapsedRef.current += delta;
    const pulseDuration = 0.34;
    const pulseProgress = Math.min(pulseElapsedRef.current / pulseDuration, 1);
    const pulseStrength =
      selected && pulseProgress < 1 ? Math.sin(pulseProgress * Math.PI) * 0.38 : 0;

    materialsRef.current.forEach((material) => {
      material.opacity += (opacity - material.opacity) * 0.18;

      const standardMaterial = material as THREE.MeshStandardMaterial;
      if ("color" in standardMaterial) {
        const selectedColor = ORGAN_SELECTED_COLOR.clone().lerp(
          ORGAN_SELECTED_PULSE_COLOR,
          pulseStrength,
        );
        standardMaterial.color.lerp(selected ? selectedColor : baseColor, 0.2);
      }
      if ("emissive" in standardMaterial) {
        standardMaterial.emissive.lerp(glowColor, 0.15);
        const originalEmissiveIntensity = organ ? 0.08 : 0.04;
        standardMaterial.emissiveIntensity +=
          (originalEmissiveIntensity - standardMaterial.emissiveIntensity) * 0.22;
      }
    });
  });

  return (
    <group
      position={targetPosition}
      scale={targetScale}
      rotation={targetRotation}
      renderOrder={organ ? 34 : 18}
      onPointerOver={interactive ? onPointerOver : undefined}
      onPointerOut={interactive ? onPointerOut : undefined}
      onClick={interactive ? onClick : undefined}
    >
      <primitive object={scene} position={centerOffset} />
    </group>
  );
}

function OrganInteractionZoneMesh({
  zone,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
  onClick,
}: {
  zone: OrganInteractionZone;
  selected: boolean;
  hovered: boolean;
  onPointerOver: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const rotation = zone.rotation ?? [0, 0, 0];

  return (
    <mesh
      position={liftOrganPosition(zone.position)}
      rotation={rotation}
      scale={
        zone.kind === "ellipsoid"
          ? [zone.size[0] / 2, zone.size[1] / 2, zone.size[2] / 2]
          : [1, 1, 1]
      }
      renderOrder={selected || hovered ? 80 : 10}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {zone.kind === "ellipsoid" ? (
        <sphereGeometry args={[1, 24, 16]} />
      ) : (
        <boxGeometry args={zone.size} />
      )}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}

function InternalOrgansLayer({
  layerMode,
  selection,
  onSelect,
}: {
  layerMode: LayerMode;
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
}) {
  const [hoveredOrganId, setHoveredOrganId] = useState<string | null>(null);
  const [selectedOrganId, setSelectedOrganId] = useState<string | null>(
    selection?.tissue === "organ" ? selection.id : null,
  );
  const [selectionPulse, setSelectionPulse] = useState({ organId: "", key: 0 });

  useEffect(() => {
    setSelectedOrganId(selection?.tissue === "organ" ? selection.id : null);
  }, [selection]);

  useEffect(() => {
    if (layerMode === "organs") return;
    setHoveredOrganId(null);
    document.body.style.cursor = "auto";
  }, [layerMode]);

  const isVisible = layerMode === "organs" || layerMode === "complete";

  return (
    <group visible={isVisible} renderOrder={50}>
      {internalOrgans
        .filter((organ) => organ.modelParts?.length)
        .map((organ) => {
          const selected = layerMode === "organs" && selectedOrganId === organ.id;
          const hovered = hoveredOrganId === organ.id;
          const isInteractive = layerMode === "organs";
          const organOpacity = layerMode === "complete" ? 0.24 : 0.42;
          const selectOrgan = () => {
            setSelectedOrganId(organ.id);
            setSelectionPulse((current) => ({
              organId: organ.id,
              key: current.key + 1,
            }));
            onSelect({
              id: organ.id,
              side: "male",
              tissue: "organ",
              regionId: organ.bodyRegion,
              regionLabel: organ.category,
              label: organ.popularName,
              labelEn: organ.popularNameEn,
            });
          };
          const handleOrganPointerOver = (event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            if (isInteractive) {
              setHoveredOrganId(organ.id);
              document.body.style.cursor = "pointer";
            }
          };
          const handleOrganPointerOut = (event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            setHoveredOrganId((current) => (current === organ.id ? null : current));
            document.body.style.cursor = "auto";
          };
          const handleOrganClick = (event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            if (isInteractive) selectOrgan();
          };
          return (
            <group
              key={organ.id}
              onPointerOver={isInteractive ? handleOrganPointerOver : undefined}
              onPointerOut={isInteractive ? handleOrganPointerOut : undefined}
              onClick={isInteractive ? handleOrganClick : undefined}
            >
              {organ.modelParts?.map((model, index) => (
                <AnatomyGlbModel
                  key={`${organ.id}-model-${index}`}
                  organ={organ}
                  model={model}
                  selected={selected}
                  selectionPulseKey={selectionPulse.organId === organ.id ? selectionPulse.key : 0}
                  opacity={organOpacity}
                  interactive={isInteractive}
                  onPointerOver={handleOrganPointerOver}
                  onPointerOut={handleOrganPointerOut}
                  onClick={handleOrganClick}
                />
              ))}
              {isInteractive &&
                organ.interactionZones?.map((zone, index) => (
                  <OrganInteractionZoneMesh
                    key={`${organ.id}-hit-${index}`}
                    zone={zone}
                    selected={selected}
                    hovered={hovered}
                    onPointerOver={handleOrganPointerOver}
                    onPointerOut={handleOrganPointerOut}
                    onClick={handleOrganClick}
                  />
                ))}
            </group>
          );
        })}
    </group>
  );
}

function LoadingFallback({ lang }: { lang: "ro" | "en" }) {
  const { progress } = useProgress();
  const roundedProgress = Math.round(progress);
  return (
    <Html center>
      <div className="min-w-[240px] rounded-2xl border border-primary/20 bg-black/70 px-4 py-3 text-center shadow-[0_0_32px_rgba(0,242,254,0.14)] backdrop-blur-md">
        <div className="text-sm font-bold tracking-tight text-primary">
          {lang === "en" ? "Loading the anatomy model" : "Se încarcă modelul anatomic"}
        </div>
        <div className="mt-1 text-[11px] font-medium text-muted-foreground">
          {roundedProgress > 0
            ? `${roundedProgress}%`
            : lang === "en"
              ? "Preparing the 3D model..."
              : "Pregătire model 3D..."}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.max(roundedProgress, 8)}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

type FocusControls = {
  target: THREE.Vector3;
  update: () => void;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
};

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0.15, 10);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
export const RESET_VIEW_EVENT = "santix-reset-anatomy-view";

function CameraResetController({ selection }: { selection: BoneSelection | null }) {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as FocusControls | null;
  const goal = useRef<{ target: THREE.Vector3; cameraPosition?: THREE.Vector3 } | null>(null);

  // Drag-ul manual al utilizatorului anulează animația de focus.
  useEffect(() => {
    if (!controls) return;
    const cancel = () => {
      goal.current = null;
    };
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  // La selecție: zoom + focus pe structură, cu camera adusă mereu din FAȚĂ.
  useEffect(() => {
    if (!controls || !selection) return;
    // O selecție poate cuprinde mai multe mesh-uri (toate coastele, un grup
    // muscular, un organ din mai multe părți). Le adunăm într-un bounding box
    // ca să obținem centrul real și dimensiunea structurii.
    const box = new THREE.Box3();
    let found = false;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      const ud = mesh.userData;
      const match =
        (typeof ud.selectionId === "string" && ud.selectionId === selection.id) ||
        (!!selection.regionId && ud.selectionRegionId === selection.regionId) ||
        (typeof ud.boneId === "string" && ud.boneId === selection.id);
      if (match) {
        box.expandByObject(mesh);
        found = true;
      }
    });
    if (!found || box.isEmpty()) {
      goal.current = null;
      return;
    }
    const targetPos = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() / 2, 0.4);
    // Distanța de zoom = cât e nevoie ca structura să încapă curat în cadru la
    // fov-ul curent, cu o mică margine. Limitată ca să nu intre în model.
    const fov = (camera as THREE.PerspectiveCamera).isPerspectiveCamera
      ? (camera as THREE.PerspectiveCamera).fov
      : 30;
    const fitDistance = radius / Math.sin((fov * Math.PI) / 360);
    const offset = THREE.MathUtils.clamp(fitDistance * 1.2, 3.5, 9);
    goal.current = {
      target: targetPos.clone(),
      // FAȚĂ garantată: aceleași X/Y ca piesa, retras pe +Z (fața modelului).
      cameraPosition: new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z + offset),
    };
  }, [selection, scene, controls, camera]);

  useEffect(() => {
    if (!controls) return;
    const resetView = () => {
      goal.current = {
        target: DEFAULT_CAMERA_TARGET.clone(),
        cameraPosition: DEFAULT_CAMERA_POSITION.clone(),
      };
    };

    window.addEventListener(RESET_VIEW_EVENT, resetView);
    return () => window.removeEventListener(RESET_VIEW_EVENT, resetView);
  }, [controls]);

  useFrame(() => {
    if (!controls || !goal.current) return;
    const k = 0.08;
    controls.target.lerp(goal.current.target, k);
    if (goal.current.cameraPosition) {
      camera.position.lerp(goal.current.cameraPosition, k);
    }
    controls.update();
    const targetDone = controls.target.distanceTo(goal.current.target) < 0.01;
    const cameraDone =
      !goal.current.cameraPosition ||
      camera.position.distanceTo(goal.current.cameraPosition) < 0.03;
    if (targetDone && cameraDone) {
      goal.current = null;
    }
  });

  return null;
}

interface SkeletonSceneProps {
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
  layerMode: LayerMode;
  mode: AnatomyModelMode;
}

export function SkeletonScene({ selection, onSelect, layerMode, mode }: SkeletonSceneProps) {
  const { lang } = useLanguage();
  useEffect(
    () => () => {
      document.body.style.cursor = "auto";
    },
    [],
  );
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("light-mode"));
    };
    syncTheme();
    window.addEventListener("santix-theme-change", syncTheme);
    return () => window.removeEventListener("santix-theme-change", syncTheme);
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: DEFAULT_CAMERA_POSITION.toArray(), fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={undefined}
      onWheel={(event) => event.stopPropagation()}
    >
      <color attach="background" args={[isLightMode ? "#eef7f8" : "#03090b"]} />
      <fog attach="fog" args={[isLightMode ? "#dff4f6" : "#051318", 9, 22]} />

      <hemisphereLight
        args={[
          isLightMode ? "#ffffff" : "#dffcff",
          isLightMode ? "#c9e8ec" : "#061014",
          isLightMode ? 1.05 : 0.95,
        ]}
      />
      <ambientLight intensity={isLightMode ? 0.58 : 0.42} />
      <directionalLight
        position={[5, 8, 7]}
        intensity={isLightMode ? 1.22 : 1.12}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-5, 5, 5]} intensity={isLightMode ? 0.6 : 0.5} color="#dffcff" />
      <directionalLight
        position={[0, 4, -8]}
        intensity={isLightMode ? 0.5 : 0.72}
        color="#00f2fe"
      />
      <pointLight position={[0, 2.5, 5]} intensity={isLightMode ? 0.22 : 0.34} color="#00f2fe" />

      <Suspense fallback={<LoadingFallback lang={lang} />}>
        {mode === "complex" ? (
          <>
            <ComplexMaleModel
              url={MALE_COMPLEX_URL}
              xOffset={0}
              layerMode={layerMode}
              selection={selection}
              onSelect={onSelect}
            />
            <InternalOrgansLayer layerMode={layerMode} selection={selection} onSelect={onSelect} />
          </>
        ) : (
          <SimpleSkeletonModel
            url={FALLBACK_URL}
            xOffset={0}
            label="Mod rapid"
            side="male"
            variant="matte"
            selection={selection}
            onSelect={onSelect}
          />
        )}
        <ContactShadows
          position={[0, -2.9, 0]}
          opacity={isLightMode ? 0.16 : 0.22}
          scale={8}
          blur={2.2}
          far={5}
          color={isLightMode ? "#7bcbd4" : "#00b7c7"}
        />
        <Environment preset="studio" environmentIntensity={0.7} />
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableDamping
        autoRotate={false}
        dampingFactor={0.05}
        zoomToCursor
        zoomSpeed={0.95}
        panSpeed={0.85}
        screenSpacePanning
        minDistance={0.8}
        maxDistance={28}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
      <CameraResetController selection={selection} />
    </Canvas>
  );
}
