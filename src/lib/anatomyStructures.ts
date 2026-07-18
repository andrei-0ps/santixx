import { supabase } from "@/lib/supabase";
import type { AnatomyNameRecord } from "@/data/anatomyDisplayNames";
import type { TissueType } from "@/components/skeleton/SkeletonScene";

const ANATOMY_NAME_COLUMNS =
  "slug, name_ro, popular_name_ro, popular_name_en, scientific_name_ro, scientific_name_en, latin_name, display_name_ro, display_name_en, common_name_ro, subtitle_name, english_name, name_latin, aliases_ro, missing_ro_display_name, model_selection_id, tissue, model_3d_availability, model_3d_selectable, model_3d_notes_ro, model_3d_notes_en";

export type AnatomyStructureNameRow = AnatomyNameRecord & {
  aliases_ro?: string[] | null;
  model_selection_id?: string | null;
  tissue?: TissueType | null;
  model_3d_availability?: string | null;
  model_3d_selectable?: boolean | null;
  model_3d_notes_ro?: string | null;
  model_3d_notes_en?: string | null;
};

function normalize(value: string | null | undefined) {
  return value
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}

export function anatomyLookupKeys(input: {
  id?: string | null;
  label?: string | null;
  labelEn?: string | null;
  regionId?: string | null;
}) {
  const normalizedLabel = normalize(input.labelEn ?? input.label);
  return unique([
    input.id,
    input.regionId,
    normalizedLabel,
    normalizedLabel ? `os-${normalizedLabel}` : null,
    normalizedLabel ? `muschi-${normalizedLabel}` : null,
    normalizedLabel ? `tendon-${normalizedLabel}` : null,
    normalizedLabel ? `organ-${normalizedLabel}` : null,
  ]);
}

export async function fetchAnatomyStructureName(input: {
  id?: string | null;
  label?: string | null;
  labelEn?: string | null;
  regionId?: string | null;
  tissue?: TissueType | null;
}): Promise<AnatomyStructureNameRow | null> {
  const keys = anatomyLookupKeys(input);
  const englishName = input.labelEn?.trim() ?? input.label?.trim();

  if (!keys.length && !englishName) return null;

  if (input.tissue === "muschi" && input.id) {
    const { data: mapping, error: mappingError } = await supabase
      .from("model_3d_mappings")
      .select(
        "model_part_key, display_name_ro, display_name_en, popular_name_ro, popular_name_en, scientific_name_ro, scientific_name_en, latin_name, anatomy_structure_slug",
      )
      .eq("model_part_key", input.id)
      .eq("active", true)
      .maybeSingle();

    if (!mappingError && mapping) {
      return {
        slug: mapping.anatomy_structure_slug,
        name_ro: mapping.scientific_name_ro,
        common_name_ro: mapping.popular_name_ro,
        popular_name_ro: mapping.popular_name_ro,
        popular_name_en: mapping.popular_name_en,
        scientific_name_ro: mapping.scientific_name_ro,
        scientific_name_en: mapping.scientific_name_en,
        display_name_ro: mapping.popular_name_ro,
        display_name_en: mapping.popular_name_en,
        subtitle_name:
          mapping.scientific_name_ro !== mapping.popular_name_ro
            ? mapping.scientific_name_ro
            : mapping.latin_name,
        english_name: mapping.popular_name_en,
        latin_name: mapping.latin_name,
        model_selection_id: mapping.model_part_key,
        tissue: "muschi",
        missing_ro_display_name: false,
      };
    }
  }

  const byKey =
    keys.length > 0
      ? await supabase
          .from("anatomy_structures")
          .select(ANATOMY_NAME_COLUMNS)
          .or(`slug.in.(${keys.join(",")}),model_selection_id.in.(${keys.join(",")})`)
          .limit(10)
      : { data: null, error: null };

  if (!byKey.error && byKey.data?.length) {
    const rows = byKey.data as AnatomyStructureNameRow[];
    const matched =
      rows.find((row) => row.tissue === input.tissue && row.model_selection_id === input.id) ??
      rows.find((row) => row.tissue === input.tissue) ??
      rows[0] ??
      null;

    if (
      matched &&
      input.tissue === "muschi" &&
      input.id &&
      input.regionId &&
      matched.model_selection_id !== input.id
    ) {
      const popularName =
        matched.popular_name_ro ??
        matched.display_name_ro ??
        matched.common_name_ro ??
        matched.name_ro ??
        input.regionId;
      return {
        ...matched,
        name_ro: matched.scientific_name_ro ?? input.label ?? matched.name_ro,
        common_name_ro: popularName,
        popular_name_ro: popularName,
        popular_name_en: matched.popular_name_en,
        scientific_name_ro: matched.scientific_name_ro ?? input.label,
        scientific_name_en: matched.scientific_name_en ?? input.labelEn,
        display_name_ro: popularName,
        display_name_en: matched.popular_name_en ?? matched.display_name_en,
        subtitle_name: matched.scientific_name_ro ?? input.label ?? matched.subtitle_name,
        english_name: matched.popular_name_en ?? matched.english_name,
        model_selection_id: input.id,
        missing_ro_display_name: false,
      };
    }

    return matched;
  }

  if (!englishName) return null;

  const { data, error } = await supabase
    .from("anatomy_structures")
    .select(ANATOMY_NAME_COLUMNS)
    .ilike("english_name", `%${englishName}%`)
    .limit(10);

  if (error || !data?.length) return null;
  const rows = data as AnatomyStructureNameRow[];
  return rows.find((row) => row.tissue === input.tissue) ?? rows[0] ?? null;
}

export async function listMissingRomanianDisplayNames() {
  const { data, error } = await supabase.rpc("list_missing_romanian_display_names");
  if (error) throw error;
  return data ?? [];
}
