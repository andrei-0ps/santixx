import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  inferCatalogSelection,
  inferIntuitiveRegion,
  resolveExactAnatomy3dMapping,
} from "../src/components/skeleton/SkeletonScene";
import { getAnatomyDisplayName } from "../src/data/anatomyDisplayNames";

test("patellar surface is assigned to the femur, not the patella", () => {
  expect(
    inferCatalogSelection({
      tissue: "os",
      id: "os-patellar-surface-of-femur",
      labelEn: "Patellar surface of femur",
    }),
  ).toEqual({ id: "femur", label: "Femur", labelEn: "Femur" });
});

test("radial notch is assigned to the ulna", () => {
  expect(
    inferCatalogSelection({
      tissue: "os",
      id: "os-radial-notch",
      labelEn: "Radial notch",
    }),
  ).toEqual({ id: "ulna", label: "Ulnă", labelEn: "Ulna" });
});

test("ulnar notch is assigned to the radius", () => {
  expect(
    inferCatalogSelection({
      tissue: "os",
      id: "os-ulnar-notch",
      labelEn: "Ulnar notch",
    }),
  ).toEqual({ id: "radius", label: "Radius", labelEn: "Radius" });
});

test("fibular notch is assigned to the tibia", () => {
  expect(
    inferCatalogSelection({
      tissue: "os",
      id: "os-fibular-notch",
      labelEn: "Fibular notch",
    }),
  ).toEqual({ id: "tibia", label: "Tibia", labelEn: "Tibia" });
});

test("bone catalog selections keep English labels separate from Romanian labels", () => {
  expect(
    inferCatalogSelection({
      tissue: "os",
      id: "os-lumbar-vertebra-l4",
      label: "Vertebră lombară L4",
      labelEn: "Lumbar vertebra L4",
    }),
  ).toEqual({
    id: "vert-lombare",
    label: "Vertebre lombare",
    labelEn: "Lumbar vertebrae",
  });

  expect(
    inferCatalogSelection({
      tissue: "os",
      id: "os-distal-phalanx-of-fifth-finger-of-hand-left",
      labelEn: "Distal phalanx of fifth finger of hand",
    }),
  ).toEqual({
    id: "falange-mana",
    label: "Falange ale mâinii",
    labelEn: "Finger bones",
  });
});

test("every muscle segment in the exported model resolves to an intuitive region", () => {
  const manifest = JSON.parse(
    readFileSync(resolve("public/anatomy/z-anatomy-structures.json"), "utf8"),
  ) as Array<{
    id: string;
    label: string;
    labelEn: string;
    tissue: "os" | "muschi" | "tendon";
  }>;
  const uniqueMuscles = Array.from(
    new Map(
      manifest.filter((entry) => entry.tissue === "muschi").map((entry) => [entry.id, entry]),
    ).values(),
  );
  const missing = uniqueMuscles
    .filter(
      (entry) =>
        !inferIntuitiveRegion({
          tissue: "muschi",
          id: entry.id,
          label: entry.label,
          labelEn: entry.labelEn,
        }),
    )
    .map((entry) => entry.id);

  expect(missing, `Unmapped muscle regions: ${missing.join(", ")}`).toEqual([]);
});

test("every muscle segment gets a non-technical primary title", () => {
  const manifest = JSON.parse(
    readFileSync(resolve("public/anatomy/z-anatomy-structures.json"), "utf8"),
  ) as Array<{
    id: string;
    label: string;
    labelEn: string;
    tissue: "os" | "muschi" | "tendon";
  }>;
  const uniqueMuscles = Array.from(
    new Map(
      manifest.filter((entry) => entry.tissue === "muschi").map((entry) => [entry.id, entry]),
    ).values(),
  );
  const failures = uniqueMuscles.flatMap((entry) => {
    const region = inferIntuitiveRegion(entry);
    const display = getAnatomyDisplayName({
      selection: {
        ...entry,
        side: "male",
        regionId: region?.regionId,
        regionLabel: region?.regionLabel,
      },
    });

    return display.title === entry.label || display.title === entry.labelEn
      ? [`${entry.id}: ${display.title}`]
      : [];
  });

  expect(failures, `Technical primary titles: ${failures.join(", ")}`).toEqual([]);
});

test("exact 3D registry covers every exported structure without regional guessing", () => {
  const manifest = JSON.parse(
    readFileSync(resolve("public/anatomy/z-anatomy-structures.json"), "utf8"),
  ) as Array<{
    id: string;
    label: string;
    labelEn: string;
    tissue: "os" | "muschi" | "tendon";
  }>;
  const registry = JSON.parse(
    readFileSync(resolve("src/data/exactAnatomy3dMappings.generated.json"), "utf8"),
  ) as {
    mappings: Record<
      string,
      {
        tissue: "os" | "muschi" | "tendon";
        status: "exact" | "unsupported";
        selectionId: string | null;
        regionId: string | null;
        reason: string | null;
      }
    >;
  };
  const uniqueEntries = Array.from(new Map(manifest.map((entry) => [entry.id, entry])).values());

  expect(Object.keys(registry.mappings)).toHaveLength(uniqueEntries.length);
  for (const entry of uniqueEntries) {
    const mapping = registry.mappings[entry.id];
    expect(mapping, `Missing registry entry for ${entry.id}`).toBeTruthy();
    expect(mapping.tissue).toBe(entry.tissue);
    expect(["exact", "unsupported"]).toContain(mapping.status);
    if (mapping.status === "exact") {
      expect(mapping.selectionId).toBeTruthy();
      expect(mapping.regionId).toBeTruthy();
      expect(mapping.reason).toBeNull();
    } else {
      expect(mapping.selectionId).toBeNull();
      expect(mapping.regionId).toBeNull();
      expect(mapping.reason).toBe("no_verified_canonical_target");
    }
  }
});

test("every exported muscle preserves its exact model key", () => {
  const manifest = JSON.parse(
    readFileSync(resolve("public/anatomy/z-anatomy-structures.json"), "utf8"),
  ) as Array<{ id: string; tissue: "os" | "muschi" | "tendon" }>;
  const muscles = Array.from(
    new Map(
      manifest.filter((entry) => entry.tissue === "muschi").map((entry) => [entry.id, entry]),
    ).values(),
  );
  const failures = muscles.flatMap((entry) => {
    const mapping = resolveExactAnatomy3dMapping(entry.id);
    return mapping?.status === "exact" && mapping.selectionId === entry.id ? [] : [entry.id];
  });

  expect(failures, `Muscles without exact keys: ${failures.join(", ")}`).toEqual([]);
});

test("ambiguous non-bone meshes fail closed instead of selecting a regional fallback", () => {
  const cartilage = resolveExactAnatomy3dMapping("os-cricoid-cartilage");
  expect(cartilage).toMatchObject({
    tissue: "os",
    status: "unsupported",
    selectionId: null,
    regionId: null,
  });
});

test("finger phalanges resolve to their exact canonical parent", () => {
  expect(
    resolveExactAnatomy3dMapping("os-distal-phalanx-of-fifth-finger-of-hand-left"),
  ).toMatchObject({
    status: "exact",
    selectionId: "falange-mana",
    regionId: "os:falange-mana",
  });
});
