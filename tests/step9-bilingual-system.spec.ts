import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { translations } from "../src/lib/translations";
import { runSantixAiTurn } from "../src/lib/ai/service";
import { knowledgeContent, knowledgeTitle, type KnowledgeEntry } from "../src/lib/ai/retrieval";
import { internalOrgans } from "../src/data/internalOrgans";
import { localizeInternalOrgan } from "../src/data/organLocalization";
import { getAnatomyDisplayName } from "../src/data/anatomyDisplayNames";

type ManifestEntry = {
  id: string;
  label: string;
  labelEn: string;
  tissue: "os" | "muschi" | "tendon";
};

type RegistryEntry = {
  status: "exact" | "unsupported";
  selectionId: string | null;
  regionId: string | null;
  regionLabel: string | null;
  labelRo: string;
  labelEn: string;
};

function valueShape(value: unknown): string {
  if (Array.isArray(value)) return `array:${value.length}`;
  return typeof value;
}

test("RO and EN interface dictionaries have identical, non-empty structures", () => {
  const ro = translations.ro as Record<string, unknown>;
  const en = translations.en as Record<string, unknown>;
  const roKeys = Object.keys(ro).sort();
  const enKeys = Object.keys(en).sort();

  expect(enKeys).toEqual(roKeys);
  for (const key of roKeys) {
    expect(valueShape(en[key]), `Different value shape for ${key}`).toBe(valueShape(ro[key]));
    if (typeof ro[key] === "string") {
      expect((ro[key] as string).trim(), `Empty Romanian translation for ${key}`).not.toBe("");
      expect((en[key] as string).trim(), `Empty English translation for ${key}`).not.toBe("");
    }
    if (Array.isArray(ro[key])) {
      expect(en[key]).toHaveLength((ro[key] as unknown[]).length);
      expect((ro[key] as unknown[]).every((value) => String(value).trim())).toBe(true);
      expect((en[key] as unknown[]).every((value) => String(value).trim())).toBe(true);
    }
  }
});

test("every exact 3D structure produces usable Romanian and English display names", () => {
  const manifest = JSON.parse(
    readFileSync(resolve("public/anatomy/z-anatomy-structures.json"), "utf8"),
  ) as ManifestEntry[];
  const registry = JSON.parse(
    readFileSync(resolve("src/data/exactAnatomy3dMappings.generated.json"), "utf8"),
  ) as { mappings: Record<string, RegistryEntry> };
  const uniqueEntries = Array.from(new Map(manifest.map((entry) => [entry.id, entry])).values());
  const failures: string[] = [];

  for (const entry of uniqueEntries) {
    const mapping = registry.mappings[entry.id];
    if (mapping.status !== "exact") continue;
    const selection = {
      ...entry,
      side: "male" as const,
      id: mapping.selectionId ?? entry.id,
      regionId: mapping.regionId ?? undefined,
      regionLabel: mapping.regionLabel ?? undefined,
    };
    const ro = getAnatomyDisplayName({ selection, lang: "ro" });
    const en = getAnatomyDisplayName({ selection, lang: "en" });

    if (!ro.title.trim() || !en.title.trim()) failures.push(`${entry.id}: empty title`);
    if (ro.title === entry.id || en.title === entry.id) failures.push(`${entry.id}: raw model key`);
  }

  expect(failures, failures.join("\n")).toEqual([]);
});

test("all internal organs expose complete Romanian and English user content", () => {
  const failures = internalOrgans.flatMap((organ) => {
    const english = localizeInternalOrgan(organ, "en");
    const requiredRomanian = [
      organ.popularName,
      organ.scientificName,
      organ.latinName,
      organ.description,
      organ.function,
    ];
    const requiredEnglish = english
      ? [
          english.popularName,
          english.scientificName,
          english.latinName,
          english.description,
          english.function,
        ]
      : [];
    return english &&
      english.popularName === organ.popularNameEn &&
      english.scientificName === organ.scientificNameEn &&
      requiredRomanian.every((value) => value.trim()) &&
      requiredEnglish.every((value) => value.trim()) &&
      english.quiz.every(
        (question) =>
          question.question.trim() &&
          question.explanation.trim() &&
          question.options.every((option) => option.trim()),
      )
      ? []
      : [organ.id];
  });

  expect(failures, `Incomplete organ localization: ${failures.join(", ")}`).toEqual([]);
});

test("knowledge retrieval selects the conversation language without mixing columns", () => {
  const entry: KnowledgeEntry = {
    id: "test",
    category: "anatomie",
    title_ro: "Titlu românesc",
    content_ro: "Conținut românesc",
    title_en: "English title",
    content_en: "English content",
    priority: 1,
  };

  expect(knowledgeTitle(entry, "ro")).toBe("Titlu românesc");
  expect(knowledgeContent(entry, "ro")).toBe("Conținut românesc");
  expect(knowledgeTitle(entry, "en")).toBe("English title");
  expect(knowledgeContent(entry, "en")).toBe("English content");
});

test("deterministic AI keeps equivalent Romanian and English pain flows in their locked language", async () => {
  const ro = await runSantixAiTurn({
    message: "Mă doare glezna după ce am căzut.",
    language: "ro",
  });
  const en = await runSantixAiTurn({
    message: "My ankle hurts after I fell.",
    language: "en",
  });

  expect(en.classification).toBe(ro.classification);
  expect(en.next_step).toBe(ro.next_step);
  expect(ro.reply).toContain("A început");
  expect(en.reply).toContain("Did it start");
  expect(en.reply).not.toMatch(/[ăâîșț]/i);
});

test("urgent AI guidance is emitted in the locked conversation language", async () => {
  const ro = await runSantixAiTurn({
    message: "Mă doare foarte tare glezna și nu pot călca.",
    language: "ro",
  });
  const en = await runSantixAiTurn({
    message: "My ankle is extremely painful and I cannot bear weight.",
    language: "en",
  });

  expect(ro.next_step).toBe("urgent");
  expect(en.next_step).toBe("urgent");
  expect(ro.reply).toContain("evaluare medicală");
  expect(en.reply).toContain("medical evaluation");
});
