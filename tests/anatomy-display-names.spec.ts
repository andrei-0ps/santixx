import { expect, test } from "@playwright/test";
import { bones } from "../src/data/bones";
import { getAnatomyDisplayName, type AnatomyNameRecord } from "../src/data/anatomyDisplayNames";
import { getInternalOrgan } from "../src/data/internalOrgans";
import { localizeInternalOrgan } from "../src/data/organLocalization";
import type { BoneSelection } from "../src/components/skeleton/SkeletonScene";

function selection(overrides: Partial<BoneSelection>): BoneSelection {
  return {
    id: "test-selection",
    side: "male",
    tissue: "os",
    ...overrides,
  };
}

function display(dbStructure: AnatomyNameRecord, selected: BoneSelection) {
  return getAnatomyDisplayName({ dbStructure, selection: selected });
}

function boneById(id: string) {
  const bone = bones.find((item) => item.id === id);
  if (!bone) throw new Error(`Missing test bone: ${id}`);
  return bone;
}

test("uses DB display_name_ro for middle phalanx of fourth finger", () => {
  const result = display(
    {
      display_name_ro: "Falanga mijlocie a degetului inelar",
      subtitle_name: "Middle phalanx of fourth finger",
      english_name: "Middle phalanx of fourth finger",
    },
    selection({
      id: "os-middle-phalanx-of-fourth-finger",
      labelEn: "Middle phalanx of fourth finger",
    }),
  );

  expect(result.title).toBe("Falanga mijlocie a degetului inelar");
  expect(result.subtitle).toBe("Middle phalanx of fourth finger");
  expect(result.title).not.toContain(" al ");
  expect(result.source).toBe("db");
});

test("uses DB common and scientific names for forearm flexors", () => {
  const result = display(
    {
      common_name_ro: "Mușchii flexori ai antebrațului",
      scientific_name_ro: "Flexorii antebrațului",
      english_name: "Forearm flexors",
    },
    selection({
      id: "muschi-forearm-flexors",
      tissue: "muschi",
      labelEn: "Forearm flexors",
    }),
  );

  expect(result.title).toBe("Mușchii flexori ai antebrațului");
  expect(result.subtitle).toBe("Flexorii antebrațului");
});

test("uses DB display and subtitle for humerus", () => {
  const result = display(
    {
      display_name_ro: "Osul brațului",
      subtitle_name: "Humerus",
      english_name: "Humerus",
    },
    selection({ id: "humerus", labelEn: "Humerus" }),
  );

  expect(result.title).toBe("Osul brațului");
  expect(result.subtitle).toBe("Humerus");
});

test("uses DB display and subtitle for brachioradialis", () => {
  const result = display(
    {
      display_name_ro: "Mușchiul lateral al antebrațului",
      subtitle_name: "Brahioradial",
      english_name: "Brachioradialis",
    },
    selection({
      id: "muschi-brachioradialis",
      tissue: "muschi",
      labelEn: "Brachioradialis",
    }),
  );

  expect(result.title).toBe("Mușchiul lateral al antebrațului");
  expect(result.subtitle).toBe("Brahioradial");
});

test("fallback avoids mixed Romanian-English phalanx title while DB migration is pending", () => {
  const result = getAnatomyDisplayName({
    selection: selection({
      id: "os-middle-phalanx-of-fourth-finger",
      label: "Middle phalanx of fourth finger",
      labelEn: "Middle phalanx of fourth finger",
    }),
  });

  expect(result.title).toBe("Falanga mijlocie a degetului inelar");
  expect(result.source).toBe("fallback");
});

test("uses popular bilingual muscle names while keeping scientific names secondary", () => {
  const selected = selection({
    id: "muschi-gastrocnemius-muscle-left",
    tissue: "muschi",
    label: "Mușchiul gastrocnemian (stânga)",
    labelEn: "Gastrocnemius muscle (left)",
  });
  const dbStructure = {
    popular_name_ro: "Mușchiul gambei (stânga)",
    popular_name_en: "Calf muscle (left)",
    scientific_name_ro: "Mușchiul gastrocnemian (stânga)",
    scientific_name_en: "Gastrocnemius muscle (left)",
    display_name_ro: "Mușchiul gambei (stânga)",
    english_name: "Calf muscle (left)",
    subtitle_name: "Mușchiul gastrocnemian (stânga)",
  };

  const ro = getAnatomyDisplayName({ dbStructure, selection: selected, lang: "ro" });
  const en = getAnatomyDisplayName({ dbStructure, selection: selected, lang: "en" });

  expect(ro.title).toBe("Mușchiul gambei (stânga)");
  expect(ro.subtitle).toBe("Mușchiul gastrocnemian (stânga)");
  expect(en.title).toBe("Calf muscle (left)");
  expect(en.subtitle).toBe("Gastrocnemius muscle (left)");
});

test("canonical popular names override conflicting legacy display fields", () => {
  const selected = selection({
    id: "humerus",
    labelEn: "Humerus",
  });
  const dbStructure = {
    popular_name_ro: "Osul de sus al brațului",
    popular_name_en: "Upper arm bone",
    scientific_name_ro: "Humerus",
    scientific_name_en: "Humerus",
    latin_name: "Humerus",
    display_name_ro: "NUME VECHI",
    display_name_en: "OLD NAME",
    english_name: "LEGACY NAME",
  };

  const ro = getAnatomyDisplayName({ dbStructure, selection: selected, lang: "ro" });
  const en = getAnatomyDisplayName({ dbStructure, selection: selected, lang: "en" });

  expect(ro.title).toBe("Osul de sus al brațului");
  expect(en.title).toBe("Upper arm bone");
  expect(ro.subtitle).toBe("Humerus");
  expect(en.subtitle).toBe("Humerus");
});

test("DB popular bone names still win when they are clear for users", () => {
  const selected = selection({
    id: "humerus",
    labelEn: "Humerus",
  });
  const dbStructure = {
    popular_name_ro: "Osul de sus al brațului",
    popular_name_en: "Upper arm bone",
    scientific_name_ro: "Humerus",
    scientific_name_en: "Humerus",
    latin_name: "Humerus",
  };

  const result = getAnatomyDisplayName({
    bone: boneById("humerus"),
    dbStructure,
    selection: selected,
  });

  expect(result.title).toBe("Osul de sus al brațului");
  expect(result.subtitle).toBe("Humerus");
});

test("weak DB forearm bone labels do not replace the user-friendly local title", () => {
  const result = getAnatomyDisplayName({
    bone: boneById("ulna"),
    dbStructure: {
      display_name_ro: "Osul dinspre degetul mic",
      scientific_name_ro: "Ulnă",
      latin_name: "Ulna",
    },
    selection: selection({
      id: "ulna",
      label: "Ulnă",
      labelEn: "Ulnă",
    }),
  });

  expect(result.title).toBe("Osul antebrațului de pe partea degetului mic");
  expect(result.title).toContain("antebrațului");
  expect(result.title).not.toBe("Osul dinspre degetul mic");
});

test("grouped finger bones use plain-language titles instead of phalanx jargon", () => {
  const selected = selection({
    id: "falange-mana",
    label: "Falange ale mâinii",
    labelEn: "Falange ale mâinii",
  });

  const loadingFallback = getAnatomyDisplayName({
    bone: boneById("falange-mana"),
    selection: selected,
  });
  const weakDbResult = getAnatomyDisplayName({
    bone: boneById("falange-mana"),
    dbStructure: {
      display_name_ro: "Falange (mână)",
      scientific_name_ro: "Phalanges manus",
      latin_name: "Phalanges manus",
    },
    selection: selected,
  });

  expect(loadingFallback.title).toBe("Oasele degetelor mâinii");
  expect(weakDbResult.title).toBe("Oasele degetelor mâinii");
  expect(weakDbResult.title).not.toContain("Falange");
});

test("spine base bones use plain-language titles instead of Latin labels", () => {
  const sacrum = getAnatomyDisplayName({
    bone: boneById("sacrum"),
    selection: selection({
      id: "sacrum",
      label: "Sacrum",
      labelEn: "Sacrum",
    }),
  });
  const coccis = getAnatomyDisplayName({
    bone: boneById("coccis"),
    selection: selection({
      id: "coccis",
      label: "Coccis",
      labelEn: "Coccis",
    }),
  });

  expect(sacrum.title).toBe("Osul de la baza coloanei");
  expect(sacrum.title).not.toBe("Sacrum");
  expect(coccis.title).toBe("Osul mic de la capătul coloanei");
  expect(coccis.title).not.toBe("Coccis");
});

test("English skeleton fallback uses English titles and display names", () => {
  const lumbar = getAnatomyDisplayName({
    bone: boneById("vert-lombare"),
    selection: selection({
      id: "vert-lombare",
      label: "Vertebre lombare",
      labelEn: "Vertebre lombare",
    }),
    lang: "en",
  });

  expect(lumbar.title).toBe("Lumbar vertebrae");
  expect(lumbar.display_name).toBe("Lumbar vertebrae");
  expect(lumbar.subtitle).toBe("Vertebral column");
});

test("English skeleton labels do not leak Romanian UI names", () => {
  const romanianUiPattern =
    /[ăâîșțĂÂÎȘȚ]|\b(Osul|Oasele|Oase|Vertebre|Coaste|Clavicule|Scapule|Rotulă|Ulnă|Fibulă|mâinii|piciorului|lombare|toracice|cervicale|coloanei)\b/i;
  const failures = bones.flatMap((bone) => {
    const result = getAnatomyDisplayName({
      bone,
      selection: selection({
        id: bone.id,
        label: bone.name,
        labelEn: bone.name,
      }),
      lang: "en",
    });
    const visibleText = [result.title, result.display_name, result.subtitle]
      .filter(Boolean)
      .join(" ");
    return romanianUiPattern.test(visibleText) ? [`${bone.id}: ${visibleText}`] : [];
  });

  expect(failures, `Romanian labels leaked in EN UI: ${failures.join(", ")}`).toEqual([]);
});

test("internal organs expose canonical popular, scientific, and Latin names in both languages", () => {
  const heartRo = getInternalOrgan("organ:inima");
  const heartEn = localizeInternalOrgan(heartRo, "en");

  expect(heartRo).toMatchObject({
    popularName: "Inimă",
    popularNameEn: "Heart",
    scientificName: "Inimă",
    scientificNameEn: "Heart",
    latinName: "Cor",
  });
  expect(heartEn).toMatchObject({
    popularName: "Heart",
    scientificName: "Heart",
    latinName: "Cor",
  });
});

test("occipitalis is presented with a plain-language title", () => {
  const result = getAnatomyDisplayName({
    selection: selection({
      id: "muschi-occipitalis-muscle-right",
      tissue: "muschi",
      regionId: "muschi:muschii-capului-gatului",
      regionLabel: "Mușchii capului și gâtului",
      label: "Mușchiul Occipitalis (dreapta)",
      labelEn: "Occipitalis muscle (right)",
    }),
  });

  expect(result.title).toBe("Mușchiul din spatele capului (dreapta)");
  expect(result.title).not.toContain("Occipitalis");
});

test("generic muscle fallback keeps the side without exposing the raw model label", () => {
  const result = getAnatomyDisplayName({
    selection: selection({
      id: "muschi-unknown-deep-muscle-left",
      tissue: "muschi",
      regionId: "muschi:muschii-spatelui",
      regionLabel: "Mușchii spatelui",
      label: "Mușchiul Unknown profund (stânga)",
      labelEn: "Unknown deep muscle (left)",
    }),
  });

  expect(result.title).toBe("Mușchii spatelui (stânga)");
  expect(result.title).not.toContain("Unknown");
});
