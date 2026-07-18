import { classifyAnatomyStructure } from "@/data/anatomyCurriculum";
import type { MedicalConversationFlowId } from "./questionTypes";

export type AnatomicalStructureGroup =
  | "axial_chest_bone"
  | "spine"
  | "upper_limb_long_bone"
  | "lower_limb_long_bone"
  | "hand_or_finger"
  | "foot_or_toe"
  | "joint"
  | "superficial_muscle"
  | "deep_muscle"
  | "abdominal_organ"
  | "urinary_organ"
  | "respiratory_organ"
  | "cardiovascular_organ"
  | "unknown_structure_context";

export type AnatomicalContext = {
  structureId: string | null;
  displayName: string;
  technicalName: string | null;
  tissue: string;
  bodyRegion: string | null;
  anatomySystem: string;
  anatomySegment: string;
  anatomyGroup: string;
  anatomySubgroup: string | null;
  structureGroup: AnatomicalStructureGroup;
  functionalContext: string[];
};

export type QuestionPlan = {
  activeFlow: MedicalConversationFlowId;
  anatomicalContext: AnatomicalContext;
  questionIds: string[];
  commonQuestionIds: string[];
  contextualQuestionIds: string[];
  omittedQuestionIds: string[];
  completionCriteria: {
    requiredQuestionIds: string[];
    minimumAnswered: number;
  };
};

export type AnatomicalContextInput = {
  structureId?: string | null;
  displayName: string;
  technicalName?: string | null;
  tissue?: string | null;
  bodyRegion?: string | null;
};

type QuestionPlanInput = {
  activeFlow: MedicalConversationFlowId;
  anatomicalContext: AnatomicalContext;
  initialMessage: string;
  existingAnswers: Record<string, string>;
  availableQuestionIds?: string[];
};

const MUSCULOSKELETAL_COMMON = [
  "trauma",
  "onset",
  "movementLimitation",
  "severity",
  "associatedSigns",
  "duration",
] as const;

const CONTEXTUAL_QUESTION_IDS: Partial<Record<AnatomicalStructureGroup, string[]>> = {
  axial_chest_bone: [
    "trauma",
    "chestBreathingChange",
    "chestLocalTenderness",
    "chestPressureOrBreathingDifficulty",
    "severity",
    "duration",
  ],
  spine: [
    "trauma",
    "spineMovement",
    "spineNeurologicalSigns",
    "severity",
    "onset",
    "duration",
  ],
  upper_limb_long_bone: [
    "trauma",
    "upperLimbJointMovement",
    "upperLimbSwellingOrDeformity",
    "upperLimbNeurologicalSigns",
    "severity",
    "duration",
  ],
  lower_limb_long_bone: [
    "trauma",
    "lowerLimbWeightBearing",
    "lowerLimbSwellingOrDeformity",
    "lowerLimbSensationOrCirculation",
    "severity",
    "duration",
  ],
  hand_or_finger: [
    "fingerConcernType",
    "trauma",
    "fingerMovement",
    "fingerSwellingOrDeformity",
    "fingerSensation",
    "severity",
    "duration",
  ],
  foot_or_toe: [
    "trauma",
    "toeWeightBearing",
    "toeSwellingOrBruising",
    "toeShapeOrWound",
    "toeSensationOrCirculation",
    "severity",
    "duration",
  ],
  joint: [
    "trauma",
    "jointMovement",
    "jointSwellingOrInstability",
    "severity",
    "onset",
    "duration",
  ],
  superficial_muscle: [
    "trauma",
    "muscleLoadChange",
    "movementLimitation",
    "severity",
    "associatedSigns",
    "duration",
  ],
  deep_muscle: [
    "trauma",
    "deepMuscleMovementOrBreathingChange",
    "movementLimitation",
    "severity",
    "duration",
  ],
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function structureGroupFor(input: {
  tissue: string;
  combined: string;
  system: string;
  segment: string;
  group: string;
  subgroup: string;
}): AnatomicalStructureGroup {
  const { tissue, combined, system, segment, group, subgroup } = input;
  const metadata = normalize([system, segment, group, subgroup].join(" "));

  if (tissue === "organ") {
    if (
      includesAny(combined, ["rinichi", "kidney", "renal", "ureter", "vezica", "bladder"]) ||
      includesAny(metadata, ["urinar", "urinary"])
    ) {
      return "urinary_organ";
    }
    if (
      includesAny(combined, ["plaman", "lung", "trahee", "trachea", "bronh", "bronch"]) ||
      includesAny(metadata, ["respirator", "respiratory"])
    ) {
      return "respiratory_organ";
    }
    if (
      includesAny(combined, ["inima", "heart", "cardiac", "aorta"]) ||
      includesAny(metadata, ["cardiovascular", "circulator"])
    ) {
      return "cardiovascular_organ";
    }
    return "abdominal_organ";
  }

  if (tissue === "muschi" || tissue === "tendon") {
    return includesAny(`${combined} ${metadata}`, ["profund", "deep", "intrinsic"])
      ? "deep_muscle"
      : "superficial_muscle";
  }

  if (includesAny(combined, ["articul", "joint", "genunch", "knee", "glezna", "ankle"])) {
    return "joint";
  }
  if (includesAny(combined, ["stern", "coasta", "coaste", "rib", "thorac", "torac"])) {
    return "axial_chest_bone";
  }
  if (includesAny(combined, ["vertebr", "coloana", "spine", "sacru", "sacrum", "coccis"])) {
    return "spine";
  }
  if (
    includesAny(combined, [
      "degetele mainii",
      "degetul mainii",
      "finger",
      "metacarp",
      "carpal",
      "falanga mainii",
      "phalange of hand",
      "police",
      "thumb",
    ]) ||
    includesAny(metadata, ["mana", "hand"])
  ) {
    return "hand_or_finger";
  }
  if (
    includesAny(combined, [
      "degetele piciorului",
      "degetul piciorului",
      "toe",
      "metatars",
      "tarsal",
      "falanga piciorului",
      "phalange of foot",
      "hallux",
    ]) ||
    includesAny(metadata, ["picior", "foot"])
  ) {
    return "foot_or_toe";
  }
  if (
    includesAny(combined, ["humerus", "radius", "ulna", "clavicul", "scapul"]) ||
    includesAny(metadata, ["membrul superior", "upper limb", "brat", "antebrat"])
  ) {
    return "upper_limb_long_bone";
  }
  if (
    includesAny(combined, ["femur", "tibia", "fibula", "peroneu"]) ||
    includesAny(metadata, ["membrul inferior", "lower limb", "coapsa", "gamba"])
  ) {
    return "lower_limb_long_bone";
  }
  return "unknown_structure_context";
}

function functionalContextFor(group: AnatomicalStructureGroup) {
  const contexts: Record<AnatomicalStructureGroup, string[]> = {
    axial_chest_bone: ["breathing", "cough", "trunk_movement", "thoracic_protection"],
    spine: ["posture", "trunk_movement", "neurological_screen"],
    upper_limb_long_bone: ["shoulder_movement", "elbow_movement", "upper_limb_sensation"],
    lower_limb_long_bone: ["weight_bearing", "walking", "lower_limb_circulation"],
    hand_or_finger: ["grip", "fine_movement", "wound_screen", "finger_sensation"],
    foot_or_toe: ["weight_bearing", "walking", "nail_wound_screen", "toe_circulation"],
    joint: ["range_of_motion", "stability", "swelling"],
    superficial_muscle: ["contraction", "stretch", "load"],
    deep_muscle: ["deep_movement", "posture", "breathing_when_relevant"],
    abdominal_organ: ["abdominal_symptoms"],
    urinary_organ: ["urination", "fever", "flank_pain"],
    respiratory_organ: ["breathing", "cough"],
    cardiovascular_organ: ["circulation", "chest_symptoms"],
    unknown_structure_context: [],
  };
  return contexts[group];
}

export function buildAnatomicalContext(input: AnatomicalContextInput): AnatomicalContext {
  const tissue = input.tissue ?? "unknown";
  const supportedTissue =
    tissue === "os" || tissue === "muschi" || tissue === "tendon" || tissue === "organ"
      ? tissue
      : "os";
  const curriculum = classifyAnatomyStructure({
    tissue: supportedTissue,
    label: input.displayName,
    labelEn: input.technicalName ?? undefined,
    id: input.structureId ?? undefined,
  });
  const combined = normalize(
    [
      input.structureId,
      input.displayName,
      input.technicalName,
      input.bodyRegion,
      curriculum.segment,
      curriculum.group,
      curriculum.subgroup,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const structureGroup = structureGroupFor({
    tissue,
    combined,
    system: curriculum.system,
    segment: curriculum.segment,
    group: curriculum.group,
    subgroup: curriculum.subgroup ?? "",
  });

  return {
    structureId: input.structureId?.trim() || null,
    displayName: input.displayName.trim() || "Structură anatomică",
    technicalName: input.technicalName?.trim() || null,
    tissue,
    bodyRegion: input.bodyRegion?.trim() || curriculum.segment || null,
    anatomySystem: curriculum.system,
    anatomySegment: curriculum.segment,
    anatomyGroup: curriculum.group,
    anatomySubgroup: curriculum.subgroup ?? null,
    structureGroup,
    functionalContext: functionalContextFor(structureGroup),
  };
}

export function buildQuestionPlan(input: QuestionPlanInput): QuestionPlan {
  const available = unique(input.availableQuestionIds ?? []);
  if (input.activeFlow !== "musculoskeletal_pain") {
    return {
      activeFlow: input.activeFlow,
      anatomicalContext: input.anatomicalContext,
      questionIds: available,
      commonQuestionIds: available,
      contextualQuestionIds: [],
      omittedQuestionIds: [],
      completionCriteria: {
        requiredQuestionIds: available,
        minimumAnswered: available.length,
      },
    };
  }

  const contextual = CONTEXTUAL_QUESTION_IDS[input.anatomicalContext.structureGroup] ?? [];
  const questionIds = contextual.length ? unique(contextual) : available;
  const commonQuestionIds = questionIds.filter((id) =>
    MUSCULOSKELETAL_COMMON.includes(id as (typeof MUSCULOSKELETAL_COMMON)[number]),
  );
  const contextualQuestionIds = questionIds.filter((id) => !commonQuestionIds.includes(id));
  const omittedQuestionIds = available.filter((id) => !questionIds.includes(id));

  return {
    activeFlow: input.activeFlow,
    anatomicalContext: input.anatomicalContext,
    questionIds,
    commonQuestionIds,
    contextualQuestionIds,
    omittedQuestionIds,
    completionCriteria: {
      requiredQuestionIds: questionIds,
      minimumAnswered: questionIds.length,
    },
  };
}
