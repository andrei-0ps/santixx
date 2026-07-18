import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(root, "public", "anatomy", "z-anatomy-structures.json");
const outputPath = resolve(root, "src", "data", "exactAnatomy3dMappings.generated.json");
const moduleOutputPath = resolve(root, "src", "data", "exactAnatomy3dMappings.generated.ts");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const server = await createServer({
  root,
  appType: "custom",
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
  resolve: { alias: { "@": resolve(root, "src") } },
});

function explicitTendonMapping(entry) {
  const normalized = `${entry.id} ${entry.labelEn}`.toLowerCase();
  if (normalized.includes("calcaneal tendon")) {
    return {
      selectionId: "tendon-ahile",
      regionId: "tendon-ahile",
      regionLabel: "Tendonul lui Ahile",
    };
  }
  return null;
}

try {
  const selectionModule = await server.ssrLoadModule("/src/components/skeleton/SkeletonScene.tsx");
  const uniqueEntries = Array.from(
    new Map(manifest.map((entry) => [entry.id, entry])).values(),
  ).sort((left, right) => left.id.localeCompare(right.id));

  const mappings = {};
  const totals = {
    exact: 0,
    unsupported: 0,
    os: { exact: 0, unsupported: 0 },
    muschi: { exact: 0, unsupported: 0 },
    tendon: { exact: 0, unsupported: 0 },
  };

  for (const entry of uniqueEntries) {
    const catalogSelection = selectionModule.inferCatalogSelection(entry);
    const intuitiveRegion = selectionModule.inferIntuitiveRegion(entry);
    let exact = null;

    if (entry.tissue === "os" && catalogSelection) {
      exact = {
        selectionId: catalogSelection.id,
        regionId: `os:${catalogSelection.id}`,
        regionLabel: catalogSelection.label,
      };
    } else if (entry.tissue === "muschi" && intuitiveRegion) {
      exact = {
        selectionId: entry.id,
        regionId: intuitiveRegion.regionId,
        regionLabel: intuitiveRegion.regionLabel,
      };
    } else if (entry.tissue === "tendon") {
      exact = explicitTendonMapping(entry);
    }

    const status = exact ? "exact" : "unsupported";
    totals[status] += 1;
    totals[entry.tissue][status] += 1;
    mappings[entry.id] = {
      tissue: entry.tissue,
      status,
      selectionId: exact?.selectionId ?? null,
      regionId: exact?.regionId ?? null,
      regionLabel: exact?.regionLabel ?? null,
      labelRo: entry.label,
      labelEn: entry.labelEn,
      reason: exact ? null : "no_verified_canonical_target",
    };
  }

  const payload = {
    generatedFrom: "public/anatomy/z-anatomy-structures.json",
    generatedAt: "2026-06-24",
    totals,
    mappings,
  };
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  const runtimePayload = {
    mappings: Object.fromEntries(
      Object.entries(mappings).map(([id, mapping]) => [
        id,
        {
          tissue: mapping.tissue,
          status: mapping.status,
          selectionId: mapping.selectionId,
          regionId: mapping.regionId,
          regionLabel: mapping.regionLabel,
        },
      ]),
    ),
  };
  writeFileSync(
    moduleOutputPath,
    `const exactAnatomy3dMappings = ${JSON.stringify(runtimePayload)} as const;\n\nexport default exactAnatomy3dMappings;\n`,
    "utf8",
  );
  console.log(JSON.stringify(totals, null, 2));
} finally {
  await server.close();
}
