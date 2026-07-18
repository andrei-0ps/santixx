import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migrationsDirectory = resolve(root, "supabase", "migrations");

function readText(path) {
  return readFileSync(resolve(root, path), "utf8").trim();
}

function valueFromEnv(source, name) {
  const match = source.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? null;
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

const anatomyManifest = JSON.parse(readText("public/anatomy/z-anatomy-structures.json"));
const exactAnatomyRegistry = JSON.parse(readText("src/data/exactAnatomy3dMappings.generated.json"));
const uniqueManifestEntries = Array.from(
  new Map(anatomyManifest.map((entry) => [entry.id, entry])).values(),
);
const exactMappingEntries = Object.entries(exactAnatomyRegistry.mappings);
const manifestIds = new Set(uniqueManifestEntries.map((entry) => entry.id));
const registryIds = new Set(exactMappingEntries.map(([id]) => id));

if (manifestIds.size !== registryIds.size || [...manifestIds].some((id) => !registryIds.has(id))) {
  fail(
    `Registrul 3D exact nu corespunde manifestului: manifest=${manifestIds.size}, registry=${registryIds.size}.`,
  );
}

const invalidExactMappings = exactMappingEntries.filter(([, mapping]) => {
  if (!["exact", "unsupported"].includes(mapping.status)) return true;
  if (mapping.status === "unsupported") {
    return mapping.selectionId !== null || mapping.regionId !== null;
  }
  return !mapping.selectionId || !mapping.regionId || mapping.reason !== null;
});
if (invalidExactMappings.length) {
  fail(`Registrul 3D conține ${invalidExactMappings.length} mapări invalide.`);
}

const nonExactMuscles = uniqueManifestEntries.filter(
  (entry) =>
    entry.tissue === "muschi" && exactAnatomyRegistry.mappings[entry.id]?.status !== "exact",
);
if (nonExactMuscles.length) {
  fail(`Registrul 3D are ${nonExactMuscles.length} mușchi fără cheie exactă.`);
}

const config = readText("supabase/config.toml");
const linkedProjectRef = readText("supabase/.temp/project-ref");
const env = readText(".env");
const configuredProjectRef = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1] ?? null;
const envProjectRef = valueFromEnv(env, "VITE_SUPABASE_PROJECT_ID");
const envSupabaseUrl = valueFromEnv(env, "VITE_SUPABASE_URL");
const envUrlProjectRef = envSupabaseUrl ? new URL(envSupabaseUrl).hostname.split(".")[0] : null;

const projectRefs = [
  ["supabase/config.toml", configuredProjectRef],
  ["supabase/.temp/project-ref", linkedProjectRef],
  [".env VITE_SUPABASE_PROJECT_ID", envProjectRef],
  [".env VITE_SUPABASE_URL", envUrlProjectRef],
];

for (const [source, projectRef] of projectRefs) {
  if (!projectRef) {
    fail(`${source} nu conține project ref-ul Supabase.`);
  } else if (projectRef !== linkedProjectRef) {
    fail(`${source} indică ${projectRef}, dar proiectul conectat este ${linkedProjectRef}.`);
  }
}

const localMigrationVersions = readdirSync(migrationsDirectory)
  .filter((name) => /^\d{14}_.+\.sql$/.test(name))
  .map((name) => name.slice(0, 14))
  .sort();

if (!localMigrationVersions.length) {
  fail("Nu există migrări locale Supabase.");
  process.exit();
}

const localMigrationValues = localMigrationVersions.map((version) => `('${version}')`).join(",");

const sql = `
with local_migrations(version) as (
  values ${localMigrationValues}
),
required_relations(name) as (
  values
    ('ai_conversations'),
    ('ai_guardrails'),
    ('ai_knowledge_entries'),
    ('ai_messages'),
    ('ai_rate_limits'),
    ('ai_knowledge_sources'),
    ('anatomy_structures'),
    ('body_regions'),
    ('condition_sources'),
    ('condition_medical_reviews'),
    ('condition_structures'),
    ('condition_symptoms'),
    ('conditions'),
    ('internal_organs'),
    ('medical_sources'),
    ('model_muscle_mappings'),
    ('movement_patterns'),
    ('muscle_groups'),
    ('muscle_movement_patterns'),
    ('muscle_pain_profiles'),
    ('muscles'),
    ('organ_systems'),
    ('organs'),
    ('pain_classifications'),
    ('symptoms'),
    ('triage_options'),
    ('triage_questions'),
    ('triage_rules')
),
required_functions(name) as (
  values
    ('auth_email_exists'),
    ('check_ai_rate_limit'),
    ('delete_current_new_google_user'),
    ('get_ai_context_for_selection'),
    ('get_model_part_medical_context'),
    ('list_missing_romanian_display_names'),
    ('match_ai_knowledge_entries'),
    ('model_part_display_name_en'),
    ('set_updated_at')
),
required_rag_columns(name) as (
  values
    ('embedding'),
    ('embedding_model'),
    ('embedding_updated_at'),
    ('metadata'),
    ('tags')
),
checks as (
  select
    'migration_history'::text as check_name,
    not exists (
      select 1
      from local_migrations l
      left join supabase_migrations.schema_migrations r on r.version = l.version
      where r.version is null
    )
    and not exists (
      select 1
      from supabase_migrations.schema_migrations r
      left join local_migrations l on l.version = r.version
      where l.version is null
    ) as ok,
    format(
      'local=%s remote=%s latest=%s',
      (select count(*) from local_migrations),
      (select count(*) from supabase_migrations.schema_migrations),
      (select max(version) from supabase_migrations.schema_migrations)
    ) as details

  union all

  select
    'required_relations',
    count(*) = 0,
    coalesce(string_agg(r.name, ', ' order by r.name), 'all present')
  from required_relations r
  left join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = r.name
  where t.table_name is null

  union all

  select
    'required_functions',
    count(*) = 0,
    coalesce(string_agg(r.name, ', ' order by r.name), 'all present')
  from required_functions r
  where not exists (
    select 1
    from information_schema.routines f
    where f.routine_schema = 'public'
      and f.routine_name = r.name
  )

  union all

  select
    'rag_columns',
    count(*) = 0,
    coalesce(string_agg(r.name, ', ' order by r.name), 'all present')
  from required_rag_columns r
  where not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'ai_knowledge_entries'
      and c.column_name = r.name
  )

  union all

  select
    'conversation_language',
    exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'ai_conversations'
        and c.column_name = 'language'
        and c.is_nullable = 'NO'
        and c.column_default like '%ro%'
    )
    and exists (
      select 1
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname = 'public'
        and rel.relname = 'ai_conversations'
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) like '%language%'
        and pg_get_constraintdef(con.oid) like '%ro%'
        and pg_get_constraintdef(con.oid) like '%en%'
    ),
    'language must be NOT NULL, default ro, CHECK ro/en'

  union all

  select
    'canonical_anatomy_names',
    count(*) = 0,
    format('incomplete_rows=%s', count(*))
  from public.anatomy_structures
  where nullif(btrim(popular_name_ro), '') is null
     or nullif(btrim(popular_name_en), '') is null
     or nullif(btrim(scientific_name_ro), '') is null
     or nullif(btrim(scientific_name_en), '') is null

  union all

  select
    'canonical_model_names',
    count(*) = 0,
    format('incomplete_rows=%s', count(*))
  from public.model_muscle_mappings
  where nullif(btrim(popular_name_ro), '') is null
     or nullif(btrim(popular_name_en), '') is null
     or nullif(btrim(scientific_name_ro), '') is null
     or nullif(btrim(scientific_name_en), '') is null

  union all

  select
    'bilingual_ai_knowledge',
    count(*) = 0,
    format('incomplete_rows=%s total=%s', count(*), (select count(*) from public.ai_knowledge_entries))
  from public.ai_knowledge_entries
  where nullif(btrim(title_ro), '') is null
     or nullif(btrim(content_ro), '') is null
     or nullif(btrim(title_en), '') is null
     or nullif(btrim(content_en), '') is null
     or tags is null
     or metadata is null

  union all

  select
    'bilingual_organs',
    count(*) = 11
      and count(*) filter (
        where nullif(btrim(popular_name_ro), '') is null
           or nullif(btrim(popular_name_en), '') is null
           or nullif(btrim(scientific_name_ro), '') is null
           or nullif(btrim(scientific_name_en), '') is null
           or nullif(btrim(description_en), '') is null
           or nullif(btrim(function_en), '') is null
      ) = 0,
    format(
      'total=%s incomplete=%s',
      count(*),
      count(*) filter (
        where nullif(btrim(popular_name_ro), '') is null
           or nullif(btrim(popular_name_en), '') is null
           or nullif(btrim(scientific_name_ro), '') is null
           or nullif(btrim(scientific_name_en), '') is null
           or nullif(btrim(description_en), '') is null
           or nullif(btrim(function_en), '') is null
      )
    )
  from public.organs

  union all

  select
    'condition_medical_evidence',
    count(*) = 0
      and not exists (
        select 1
        from public.condition_sources
        where source_checked_at is null
          or review_status not in ('mapped', 'evidence_reviewed', 'clinically_verified')
      ),
    format('conditions_without_two_sources_or_one_primary=%s', count(*))
  from (
    select condition_row.id
    from public.conditions condition_row
    left join public.condition_sources link on link.condition_id = condition_row.id
    where condition_row.active = true
    group by condition_row.id
    having count(link.source_id) < 2
       or count(link.source_id) filter (where link.is_primary) <> 1
  ) incomplete

  union all

  select
    'twelve_conditions_medical_validation',
    count(*) = 12
      and count(*) filter (
        where medical_validation_status = 'evidence_reviewed'
          and medical_evidence_reviewed_at is not null
          and nullif(btrim(coalesce(medical_evidence_reviewed_by, '')), '') is not null
          and nullif(btrim(coalesce(popular_name_ro, '')), '') is not null
          and nullif(btrim(coalesce(popular_name_en, '')), '') is not null
          and nullif(btrim(coalesce(medical_review_notes_ro, '')), '') is not null
          and nullif(btrim(coalesce(medical_review_notes_en, '')), '') is not null
      ) = 12,
    format(
      'active=%s evidence_reviewed_complete=%s',
      count(*),
      count(*) filter (
        where medical_validation_status = 'evidence_reviewed'
          and medical_evidence_reviewed_at is not null
          and nullif(btrim(coalesce(medical_evidence_reviewed_by, '')), '') is not null
          and nullif(btrim(coalesce(popular_name_ro, '')), '') is not null
          and nullif(btrim(coalesce(popular_name_en, '')), '') is not null
          and nullif(btrim(coalesce(medical_review_notes_ro, '')), '') is not null
          and nullif(btrim(coalesce(medical_review_notes_en, '')), '') is not null
      )
    )
  from public.conditions
  where active = true

  union all

  select
    'condition_review_history',
    count(*) = 12,
    format('version_1_evidence_reviews=%s', count(*))
  from public.condition_medical_reviews review
  join public.conditions condition_row on condition_row.id = review.condition_id
  where condition_row.active = true
    and review.review_version = 1
    and review.validation_status = 'evidence_reviewed'

  union all

  select
    'clinician_verification_integrity',
    count(*) = 0,
    format('invalid_clinician_verified_rows=%s', count(*))
  from public.conditions
  where medical_validation_status = 'clinician_verified'
    and (
      clinician_verified_at is null
      or nullif(btrim(coalesce(clinician_verified_by, '')), '') is null
      or nullif(btrim(coalesce(clinician_credentials, '')), '') is null
    )

  union all

  select
    'ai_knowledge_medical_evidence',
    count(*) = 0
      and not exists (
        select 1
        from public.ai_knowledge_sources
        where source_checked_at is null
          or review_status not in ('mapped', 'evidence_reviewed', 'clinically_verified')
      ),
    format('knowledge_without_source_or_primary=%s', count(*))
  from (
    select knowledge.id
    from public.ai_knowledge_entries knowledge
    left join public.ai_knowledge_sources link
      on link.knowledge_entry_id = knowledge.id
    where knowledge.active = true
    group by knowledge.id
    having count(link.source_id) < 1
       or count(link.source_id) filter (where link.is_primary) <> 1
  ) incomplete

  union all

  select
    'step6_bilingual_symptoms',
    count(*) filter (
      where nullif(btrim(name_ro), '') is null
         or nullif(btrim(name_en), '') is null
         or nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
         or cardinality(keywords_ro) = 0
         or cardinality(keywords_en) = 0
    ) = 0,
    format('total=%s incomplete=%s', count(*), count(*) filter (
      where nullif(btrim(name_ro), '') is null
         or nullif(btrim(name_en), '') is null
         or nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
         or cardinality(keywords_ro) = 0
         or cardinality(keywords_en) = 0
    ))
  from public.symptoms

  union all

  select
    'step6_bilingual_structures',
    count(*) filter (
      where nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
         or nullif(btrim(function_ro), '') is null
         or nullif(btrim(function_en), '') is null
    ) = 0,
    format('total=%s incomplete=%s', count(*), count(*) filter (
      where nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
         or nullif(btrim(function_ro), '') is null
         or nullif(btrim(function_en), '') is null
    ))
  from public.anatomy_structures

  union all

  select
    'step6_bilingual_muscles',
    count(*) filter (
      where nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
         or nullif(btrim(location_ro), '') is null
         or nullif(btrim(location_en), '') is null
         or cardinality(primary_actions_ro) = 0
         or cardinality(primary_actions_en) = 0
    ) = 0,
    format('total=%s incomplete=%s', count(*), count(*) filter (
      where nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
         or nullif(btrim(location_ro), '') is null
         or nullif(btrim(location_en), '') is null
         or cardinality(primary_actions_ro) = 0
         or cardinality(primary_actions_en) = 0
    ))
  from public.muscles

  union all

  select
    'step6_bilingual_muscle_groups',
    count(*) filter (
      where nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
    ) = 0,
    format('total=%s incomplete=%s', count(*), count(*) filter (
      where nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
    ))
  from public.muscle_groups

  union all

  select
    'step6_bilingual_movement_patterns',
    count(*) filter (
      where nullif(btrim(name_ro), '') is null
         or nullif(btrim(name_en), '') is null
         or nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
    ) = 0,
    format('total=%s incomplete=%s', count(*), count(*) filter (
      where nullif(btrim(name_ro), '') is null
         or nullif(btrim(name_en), '') is null
         or nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
    ))
  from public.movement_patterns

  union all

  select
    'step6_bilingual_pain',
    (
      select count(*) filter (
        where nullif(btrim(name_ro), '') is null
           or nullif(btrim(name_en), '') is null
           or nullif(btrim(description_ro), '') is null
           or nullif(btrim(description_en), '') is null
           or cardinality(recommendations_ro) = 0
           or cardinality(recommendations_en) = 0
      ) = 0
      from public.pain_classifications
    )
    and (
      select count(*) filter (
        where nullif(btrim(title_ro), '') is null
           or nullif(btrim(title_en), '') is null
           or cardinality(common_symptoms_ro) = 0
           or cardinality(common_symptoms_en) = 0
           or cardinality(common_causes_ro) = 0
           or cardinality(common_causes_en) = 0
           or cardinality(general_treatment_ro) = 0
           or cardinality(general_treatment_en) = 0
           or cardinality(prevention_ro) = 0
           or cardinality(prevention_en) = 0
           or cardinality(stop_training_when_ro) = 0
           or cardinality(stop_training_when_en) = 0
           or cardinality(see_doctor_when_ro) = 0
           or cardinality(see_doctor_when_en) = 0
      ) = 0
      from public.muscle_pain_profiles
    ),
    format(
      'classifications=%s profiles=%s',
      (select count(*) from public.pain_classifications),
      (select count(*) from public.muscle_pain_profiles)
    )

  union all

  select
    'step6_bilingual_triage',
    not exists (
      select 1 from public.triage_questions
      where nullif(btrim(question_ro), '') is null
         or nullif(btrim(question_en), '') is null
    )
    and not exists (
      select 1 from public.triage_options
      where nullif(btrim(option_key), '') is null
         or nullif(btrim(label_ro), '') is null
         or nullif(btrim(label_en), '') is null
         or nullif(btrim(coalesce(finding_ro, '')), '') is null
         or nullif(btrim(finding_en), '') is null
    )
    and not exists (
      select 1 from public.triage_rules
      where nullif(btrim(name_ro), '') is null
         or nullif(btrim(name_en), '') is null
         or nullif(btrim(explanation_ro), '') is null
         or nullif(btrim(explanation_en), '') is null
    )
    and not exists (
      select 1
      from public.triage_rules
      where rule::text like '%"option"%'
        and rule::text not like '%"option_key"%'
    ),
    format(
      'questions=%s options=%s rules=%s',
      (select count(*) from public.triage_questions),
      (select count(*) from public.triage_options),
      (select count(*) from public.triage_rules)
    )

  union all

  select
    'step7_anatomy_catalog',
    (select count(*) from public.anatomy_structures where tissue = 'organ') = 11
    and (select count(*) from public.anatomy_structures where tissue = 'tendon') >= 8
    and (select count(*) from public.anatomy_structures where tissue = 'articulatie') >= 7
    and not exists (
      select 1
      from public.anatomy_structures
      where tissue in ('organ', 'tendon', 'articulatie')
        and (
          model_3d_availability = 'not_mapped'
          or model_3d_notes_ro is null
          or model_3d_notes_en is null
        )
    ),
    format(
      'organs=%s tendons=%s joints=%s',
      (select count(*) from public.anatomy_structures where tissue = 'organ'),
      (select count(*) from public.anatomy_structures where tissue = 'tendon'),
      (select count(*) from public.anatomy_structures where tissue = 'articulatie')
    )

  union all

  select
    'step7_sourced_ai_knowledge',
    not exists (
      select 1
      from public.anatomy_structures structure
      where structure.tissue in ('organ', 'tendon', 'articulatie')
        and (
          select count(distinct knowledge.category)
          from public.ai_knowledge_entries knowledge
          where knowledge.structure_slug = structure.slug
            and knowledge.active = true
            and knowledge.category in ('anatomie', 'semne_alarma', 'intrebari_clarificare')
        ) < 3
    )
    and not exists (
      select 1
      from public.ai_knowledge_entries knowledge
      where knowledge.active = true
        and knowledge.tissue in ('organ', 'tendon', 'articulatie')
        and not exists (
          select 1
          from public.ai_knowledge_sources source_link
          where source_link.knowledge_entry_id = knowledge.id
            and source_link.is_primary = true
            and source_link.review_status <> 'rejected'
        )
    ),
    format(
      'organ=%s tendon=%s joint=%s',
      (select count(*) from public.ai_knowledge_entries where active = true and tissue = 'organ'),
      (select count(*) from public.ai_knowledge_entries where active = true and tissue = 'tendon'),
      (select count(*) from public.ai_knowledge_entries where active = true and tissue = 'articulatie')
    )

  union all

  select
    'step7_condition_structure_links',
    (
      select count(*)
      from public.condition_structures link
      join public.conditions condition_row on condition_row.id = link.condition_id
      join public.anatomy_structures structure on structure.id = link.structure_id
      where condition_row.slug = 'tendinopatie'
        and structure.tissue = 'tendon'
    ) >= 8
    and (
      select count(*)
      from public.condition_structures link
      join public.conditions condition_row on condition_row.id = link.condition_id
      join public.anatomy_structures structure on structure.id = link.structure_id
      where condition_row.slug = 'ruptura-tendon'
        and structure.tissue = 'tendon'
    ) >= 8
    and (
      select count(*)
      from public.condition_structures link
      join public.conditions condition_row on condition_row.id = link.condition_id
      join public.anatomy_structures structure on structure.id = link.structure_id
      where condition_row.slug = 'entorsa-articulara'
        and structure.tissue = 'articulatie'
    ) >= 7
    and (
      select count(*)
      from public.condition_structures link
      join public.conditions condition_row on condition_row.id = link.condition_id
      join public.anatomy_structures structure on structure.id = link.structure_id
      where condition_row.slug = 'luxatie-articulara'
        and structure.tissue = 'articulatie'
    ) >= 7,
    'tendon conditions require >=8 links; joint conditions require >=7 links'

  union all

  select
    'step8_curated_3d_mappings',
    count(*) = 97
      and count(*) filter (where active) = 97
      and count(distinct model_selection_id) = 97
      and count(*) filter (
        where anatomy_structure_id is null
           or mapping_confidence < 90
           or review_status not in ('mapped', 'verified')
      ) = 0,
    format(
      'total=%s active=%s unique=%s invalid=%s',
      count(*),
      count(*) filter (where active),
      count(distinct model_selection_id),
      count(*) filter (
        where anatomy_structure_id is null
           or mapping_confidence < 90
           or review_status not in ('mapped', 'verified')
      )
    )
  from public.model_muscle_mappings

  union all

  select
    'step9_conversation_language_integrity',
    not exists (
      select 1
      from public.ai_conversations conversation
      where conversation.language not in ('ro', 'en')
         or conversation.language is null
    )
    and not exists (
      select 1
      from public.ai_messages message
      join public.ai_conversations conversation on conversation.id = message.conversation_id
      where (conversation.language = 'ro' and nullif(btrim(message.content_ro), '') is null)
         or (conversation.language = 'en' and nullif(btrim(message.content_en), '') is null)
    ),
    format(
      'conversations=%s messages=%s invalid_conversations=%s messages_missing_locked_language=%s',
      (select count(*) from public.ai_conversations),
      (select count(*) from public.ai_messages),
      (
        select count(*)
        from public.ai_conversations
        where language not in ('ro', 'en') or language is null
      ),
      (
        select count(*)
        from public.ai_messages message
        join public.ai_conversations conversation on conversation.id = message.conversation_id
        where (conversation.language = 'ro' and nullif(btrim(message.content_ro), '') is null)
           or (conversation.language = 'en' and nullif(btrim(message.content_en), '') is null)
      )
    )

  union all

  select
    'step9_bilingual_medical_output_integrity',
    not exists (
      select 1
      from public.conditions
      where active = true
        and (
          nullif(btrim(name_ro), '') is null
          or nullif(btrim(name_en), '') is null
          or nullif(btrim(popular_name_ro), '') is null
          or nullif(btrim(popular_name_en), '') is null
          or nullif(btrim(scientific_name), '') is null
          or nullif(btrim(description_ro), '') is null
          or nullif(btrim(description_en), '') is null
          or nullif(btrim(educational_note_ro), '') is null
          or nullif(btrim(educational_note_en), '') is null
        )
    )
    and not exists (
      select 1
      from public.ai_knowledge_entries
      where active = true
        and (
          nullif(btrim(title_ro), '') is null
          or nullif(btrim(title_en), '') is null
          or nullif(btrim(content_ro), '') is null
          or nullif(btrim(content_en), '') is null
        )
    )
    and not exists (
      select 1
      from public.anatomy_structures
      where nullif(btrim(popular_name_ro), '') is null
         or nullif(btrim(popular_name_en), '') is null
         or nullif(btrim(scientific_name_ro), '') is null
         or nullif(btrim(scientific_name_en), '') is null
         or nullif(btrim(description_ro), '') is null
         or nullif(btrim(description_en), '') is null
    ),
    format(
      'active_conditions=%s active_knowledge=%s anatomy_structures=%s',
      (select count(*) from public.conditions where active = true),
      (select count(*) from public.ai_knowledge_entries where active = true),
      (select count(*) from public.anatomy_structures)
    )

  union all

  select
    'verified_organ_medical_catalog',
    (
      select count(*)
      from public.anatomy_structures
      where tissue = 'organ'
    ) = 11
    and (
      select count(*)
      from public.ai_knowledge_entries
      where tissue = 'organ'
        and active = true
        and category in ('anatomie', 'recomandari', 'semne_alarma', 'intrebari_clarificare')
    ) = 44
    and not exists (
      select 1
      from public.anatomy_structures structure
      where structure.tissue = 'organ'
        and (
          select count(distinct link.evidence_scope)
          from public.anatomy_structure_sources link
          where link.structure_id = structure.id
            and link.is_primary = true
            and link.review_status = 'mapped'
            and link.evidence_scope in ('anatomy_function', 'triage')
        ) <> 2
    )
    and not exists (
      select 1
      from public.anatomy_structure_sources link
      join public.anatomy_structures structure on structure.id = link.structure_id
      join public.medical_sources source on source.id = link.source_id
      where structure.tissue = 'organ'
        and (
          source.url like '%medlineplus.gov/ency/%'
          or link.review_status = 'clinically_verified'
          or nullif(btrim(source.content_provider), '') is null
          or nullif(btrim(source.content_license), '') is null
        )
    ),
    format(
      'organs=%s active_knowledge=%s source_links=%s',
      (select count(*) from public.anatomy_structures where tissue = 'organ'),
      (
        select count(*)
        from public.ai_knowledge_entries
        where tissue = 'organ'
          and active = true
          and category in ('anatomie', 'recomandari', 'semne_alarma', 'intrebari_clarificare')
      ),
      (
        select count(*)
        from public.anatomy_structure_sources link
        join public.anatomy_structures structure on structure.id = link.structure_id
        where structure.tissue = 'organ'
      )
    )

  union all

  select
    'critical_rls',
    count(*) = 0,
    coalesce(string_agg(required.name, ', ' order by required.name), 'all enabled')
  from (
    values
      ('ai_conversations'),
      ('ai_messages'),
      ('ai_rate_limits'),
      ('anatomy_structure_sources'),
      ('organ_systems'),
      ('organs'),
      ('internal_organs')
  ) as required(name)
  left join pg_class c on c.relname = required.name
  left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  where c.oid is null or c.relrowsecurity = false

  union all

  select
    'rpc_security',
    not has_function_privilege(
      'anon',
      'public.check_ai_rate_limit(text,integer,integer)',
      'EXECUTE'
    )
    and not has_function_privilege(
      'anon',
      'public.delete_current_new_google_user()',
      'EXECUTE'
    )
    and not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'get_ai_context_for_selection',
          'get_model_part_medical_context',
          'model_part_display_name_en',
          'set_updated_at'
        )
        and not exists (
          select 1
          from unnest(coalesce(p.proconfig, '{}')) setting
          where setting like 'search_path=%'
        )
    ),
    'anonymous access denied for private RPCs; search_path fixed'
)
select check_name, ok, details
from checks
order by check_name;
`;

let output;
const temporaryDirectory = mkdtempSync(join(tmpdir(), "santix-schema-audit-"));
const queryFile = join(temporaryDirectory, "audit.sql");
writeFileSync(queryFile, sql, "utf8");

try {
  output = execFileSync(
    process.platform === "win32" ? "cmd.exe" : "npx",
    process.platform === "win32"
      ? ["/d", "/s", "/c", `npx supabase db query --linked -o json --file ${queryFile}`]
      : ["supabase", "db", "query", "--linked", "-o", "json", "--file", queryFile],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      timeout: 180_000,
    },
  );
} catch (error) {
  fail(`Interogarea Supabase nu a putut fi executată: ${error.message}`);
  process.exit();
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

const jsonStart = output.indexOf("{");
if (jsonStart < 0) {
  fail("Răspunsul Supabase nu conține JSON valid.");
  process.exit();
}

const result = JSON.parse(output.slice(jsonStart));
const checks = result.rows ?? [];

for (const check of checks) {
  const marker = check.ok ? "OK  " : "FAIL";
  console.log(`${marker} ${check.check_name}: ${check.details}`);
  if (!check.ok) process.exitCode = 1;
}

if (!process.exitCode) {
  console.log(
    `OK   step8_exact_3d_registry: total=${registryIds.size} exact=${exactAnatomyRegistry.totals.exact} unsupported=${exactAnatomyRegistry.totals.unsupported}`,
  );
  console.log(`OK   project_ref: ${linkedProjectRef}`);
  console.log("Schema locală și schema Supabase sunt reconciliate.");
}
