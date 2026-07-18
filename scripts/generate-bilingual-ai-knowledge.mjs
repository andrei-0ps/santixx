import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const workspace = process.cwd();
const envFiles = [".env.local", ".env", ".env.production"];
const env = {};

for (const file of envFiles) {
  try {
    const content = await readFile(path.join(workspace, file), "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      env[key] = value;
    }
  } catch {
    continue;
  }
}

const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
const supabaseKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase public configuration is unavailable.");
}

const response = await fetch(
  `${supabaseUrl}/rest/v1/ai_knowledge_entries?select=id,category,title_ro,content_ro,display_name_en&active=eq.true&order=id.asc&limit=1000`,
  {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
);

if (!response.ok) {
  throw new Error(`Could not read AI knowledge: ${response.status} ${await response.text()}`);
}

const rows = await response.json();
const titleTemplates = {
  anatomie: (name) => `Anatomical context: ${name}`,
  simptome: (name) => `Possible symptoms involving ${name}`,
  cauze_posibile: (name) => `Possible causes of pain involving ${name}`,
  recomandari: (name) => `Educational guidance for ${name}`,
  semne_alarma: (name) => `Warning signs involving ${name}`,
  intrebari_clarificare: (name) => `Useful questions about ${name}`,
};
const reviewedContentOverrides = {
  "091f6c80-1ff7-48cf-8ab1-04b258312f82":
    "Has your bite changed? Can you open your mouth? Do you have numbness in your lip or any loose teeth?",
  "1bc0e909-6a81-40dd-83d6-13312b12986b":
    "Seek emergency medical care for inability to bear weight, visible deformity, an open wound, numbness, cold or pale toes, or a wound or post-traumatic pain in a person with diabetes or vascular disease.",
  "2bf2183a-d9e6-4869-a459-48f759995235":
    "Warning signs include inability to place the foot on the ground after trauma, visible deformity, persistent numbness or tingling, suddenly pale or cold toes, severe pain with rapid swelling, or a wound or infection in a person with diabetes. These require urgent medical evaluation.",
  "5b601a65-f1e5-4eb1-a02e-03ff9a3e9848":
    "Can you walk? Is the pain over the shin bone or on the outer side over the fibula? Was there an impact, a twisting injury, or repeated strain?",
  "5b243b53-75d6-499f-9947-75afcc95f80a":
    "Possible causes include overuse from repetitive activity such as typing, playing a musical instrument, or sport; cramps; direct contusion; arthritis, especially in the small finger joints; carpal tunnel syndrome, which may cause numbness in the thumb, index finger, and middle finger; or trigger finger, where a finger catches, locks, or clicks.",
  "6331a985-ada9-4c13-aa89-cf1775015f02":
    "Seek emergency medical care for inability to bear weight, visible deformity, an open wound, numbness, cold or pale toes, or a wound or post-traumatic pain in a person with diabetes or vascular disease.",
  "8a690fc7-a29b-4d2a-a1f8-10e4173c57f2":
    "Can you walk? Is the pain over the shin bone or on the outer side over the fibula? Was there an impact, a twisting injury, or repeated strain?",
  "a3b56f2b-744f-4a75-aa5b-4d7a7c3b3126":
    "There are 5 metatarsal bones in the middle of each foot. Their main functions are to support the arches of the foot and transfer weight during standing and movement.",
  "b65dc5b1-97d2-4084-a75b-cf1a29f3953c":
    "The tibialis anterior, on the front of the lower leg, lifts the front of the foot through dorsiflexion and turns the sole inward. This is essential during walking because it helps prevent the toes from catching the ground. The fibularis longus and brevis, on the outer side of the lower leg, turn the sole outward and help stabilize the outer ankle.",
  "f71a367e-ed35-4450-8878-0bf211e6d70d":
    "Can you stand? Is the pain in the groin or on the outer side of the hip? Was there a fall or accident? Do you feel dizzy or weak?",
  "32289aaa-3d37-4609-8587-80b81b1cb487":
    "The lower leg has three muscle groups: the superficial posterior group, including the gastrocnemius and soleus; both plantarflex the foot, while the gastrocnemius also flexes the knee. The deep posterior group includes flexor digitorum longus, tibialis posterior, and flexor hallucis longus; they move the toes and turn the sole inward. The anterior and lateral groups include tibialis anterior, which lifts the front of the foot, and the fibularis muscles, which turn the sole outward. The Achilles tendon connects the gastrocnemius and soleus to the heel.",
  "8f6ac6c9-80ea-4b00-a0c9-4aabf5b6e278":
    "Plantar fasciitis, which commonly causes pain with the first steps in the morning; cramps related to fatigue or dehydration; overuse from running or prolonged standing; unsuitable footwear with a stiff sole or high heel; contusion; or a stress fracture in athletes. Morton's neuroma can cause pain and numbness between toes 3 and 4.",
  "9f6656b2-303d-4e98-a705-d2b3f3678c3b":
    "Does the pain occur with the first steps in the morning or while walking in general? Is it on the sole, in the toes, or on the top of the foot? Did it begin after running or an impact, or without an obvious cause? Is there swelling or bruising? What type of footwear do you use? Do you have numbness in your toes?",
  "b90ce585-eaf5-4bb4-915f-c41e4ab8496e":
    "Complete loss of strength when lifting the arm may indicate a full rotator cuff tear. Other warning signs include being unable to raise the arm out to the side, severe sudden pain with complete loss of function, visible deformity, or progressive pain that does not improve with rest or anti-inflammatory medicine.",
  "bca0133a-bc6c-46dc-94ac-d958eb901886":
    "Does the pain occur while typing, gripping, or moving the wrist? Is it worse on the inner side toward the little finger or on the outer side toward the thumb? Do you have numbness in your fingers? Does the pain wake you at night? Is it related to a sport or repetitive activity?",
  "cc729d19-1e34-4ee8-be9c-d9b37c27642e":
    "Seek emergency medical care for inability to bear weight, visible deformity, an open wound, numbness, cold or pale toes, or a wound or post-traumatic pain in a person with diabetes or vascular disease.",
  "bf2a3e1c-215d-4484-8f53-a085fd008453":
    "The hand contains intrinsic muscles: the thenar muscles move and oppose the thumb; the hypothenar muscles move the little finger; the interossei spread the fingers apart and bring them together; and the lumbricals flex the first finger joints while extending the other joints. These muscles enable very fine movements, including precision grip, grasping, pinching, and rotation.",
  "d2baf51a-8cb5-4017-9a9a-568037e4ccb0":
    "Each hand has 14 phalanges: 2 in the thumb and 3 in each of the other fingers. Their main function is to enable fine finger movement.",
  "db5ffd86-a360-4c36-b73a-20849cb0e39e":
    "Stretch the plantar fascia in the morning before the first step by gently pulling the toes toward you. Other measures include rolling a tennis ball under the sole, wearing shoes with good arch support, and avoiding walking barefoot on hard surfaces. Seek medical advice for persistent pain, numbness, deformity, or inability to bear weight.",
  "e07f88fc-e7c0-4a73-9e64-2aaf0c130c44":
    "Back or spinal pain with numbness or weakness in the limbs may indicate nerve compression. Loss of bladder or bowel control is an EMERGENCY and may indicate cauda equina syndrome. After trauma with a suspected vertebral fracture, do not move the person. Other warning signs include progressive pain at night or sudden spinal deformity.",
  "e13752ac-12c5-47ef-9f44-b3dd5b8ea0bc":
    "The gastrocnemius and soleus form the calf and are the main plantarflexors of the foot, which makes them essential for walking, running, and jumping. The gastrocnemius has two heads that attach above the knee, so it also helps flex the knee. The soleus lies deeper and is more resistant to fatigue. The Achilles tendon connects both muscles to the heel.",
  "fcc5ca04-c95a-4fd0-aef4-db71672fe1b9":
    "The upper limb includes the humerus in the upper arm; the radius and ulna in the forearm; 8 carpal bones in the wrist; 5 metacarpal bones in the palm; and 14 phalanges in the fingers, with 2 in the thumb and 3 in each other finger. The main joints are the shoulder, elbow, radioulnar joints, wrist, metacarpophalangeal joints, and interphalangeal joints.",
};

const footStructures = new Set([
  "calcaneu",
  "talus",
  "tars",
  "metatars",
  "falange-picior",
  "schelet-membrul-inferior",
  "muschii-labei-piciorului",
  "muschii-gambei",
  "muschii-tibiali-peronieri",
]);

function prepareRomanianForTranslation(row) {
  let value = row.content_ro
    .replace(/\bdeformare\b/gi, "deformitate")
    .replace(/\bimpotență funcțională\b/gi, "pierderea funcției")
    .replace(/\bpocnet\b/gi, "sunet de pocnitură")
    .replace(/\bnu mobiliza pacientul\b/gi, "nu mișca persoana")
    .replace(/\bcoafă rotatorie\b/gi, "coafa rotatorilor")
    .replace(/\bcoafă\b/gi, "coafa rotatorilor")
    .replace(/\bmolet\b/gi, "mușchiul gambei")
    .replace(/\bcalcat\b/gi, "mers")
    .replace(
      /ridicare, rece învelit și reducerea sprijinului/gi,
      "ridicarea membrului, aplicarea unei comprese reci învelite și reducerea sprijinului greutății",
    );

  if (footStructures.has(row.structure_slug)) {
    value = value
      .replace(/\bdegetele\b/gi, "degetele de la picior")
      .replace(/\bdegete\b/gi, "degete de la picior")
      .replace(/\bplanta\b/gi, "talpa piciorului")
      .replace(/\bplantei\b/gi, "tălpii piciorului")
      .replace(/\bimposibilitate de sprijin\b/gi, "imposibilitate de a pune greutate pe picior")
      .replace(/\breducerea sprijinului\b/gi, "reducerea greutății puse pe picior");
  }

  if (
    ["carp", "metacarp", "falange-mana", "muschii-mainii", "muschii-antebratului"].includes(
      row.structure_slug,
    )
  ) {
    value = value
      .replace(/\bpolicele\b/gi, "degetul mare al mâinii")
      .replace(/\bpolice\b/gi, "degetul mare al mâinii")
      .replace(/\bpumn \(încheietura\)/gi, "încheietura mâinii");
  }

  return value;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function translateText(text, attempt = 1) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "ro");
  url.searchParams.set("tl", "en");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  try {
    const translateResponse = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Santix bilingual medical knowledge migration",
      },
    });

    if (!translateResponse.ok) {
      throw new Error(`Translation request failed with ${translateResponse.status}`);
    }

    const result = await translateResponse.json();
    const translated = result[0]
      .map((part) => part[0])
      .join("")
      .trim();

    if (!translated) throw new Error("Translation response was empty.");
    return translated;
  } catch (error) {
    if (attempt >= 4) throw error;
    await delay(400 * 2 ** attempt);
    return translateText(text, attempt + 1);
  }
}

function polishMedicalEnglish(value) {
  return value
    .replace(/\bthe parietals\b/gi, "the parietal bones")
    .replace(/\bexternal malleolus\b/gi, "lateral malleolus")
    .replace(/\binternal malleolus\b/gi, "medial malleolus")
    .replace(/\bperoneal\b/gi, "fibular")
    .replace(/\bperoneus\b/gi, "fibularis")
    .replace(/\bshoulder blade\b/gi, "shoulder blade")
    .replace(/\bmedical consultation\b/gi, "medical evaluation")
    .replace(/\burgently call the doctor\/112\b/gi, "call a doctor or 112 urgently")
    .replace(/\bcall the doctor\/112 urgently\b/gi, "call a doctor or 112 urgently")
    .replace(/\bcall the emergency room\b/gi, "seek emergency medical care")
    .replace(/\bdeformation\b/gi, "deformity")
    .replace(/\bcall a doctor urgently\/112\b/gi, "call 112 or seek urgent medical care")
    .replace(/\binability to support\b/gi, "inability to bear weight")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function numbersIn(value) {
  return [...value.matchAll(/\b\d+(?:[.,]\d+)?\b/g)].map((match) => match[0].replace(",", "."));
}

function validateTranslation(row, contentEn) {
  const problems = [];
  const remainingRomanian = [
    /\b(durere|umflare|amorțeală|slăbiciune|vânătaie|cădere|lovitură)\b/i,
    /[ăâîșț]/i,
  ];

  if (remainingRomanian.some((pattern) => pattern.test(contentEn))) {
    problems.push("Romanian text remains");
  }
  if ((row.content_ro.match(/\?/g) ?? []).length !== (contentEn.match(/\?/g) ?? []).length) {
    problems.push("question count changed");
  }

  const sourceNumbers = numbersIn(row.content_ro);
  const translatedNumbers = numbersIn(contentEn);
  for (const number of sourceNumbers) {
    if (!translatedNumbers.includes(number)) {
      problems.push(`missing number ${number}`);
    }
  }

  if (/112/.test(row.content_ro) && !/112/.test(contentEn)) {
    problems.push("emergency number 112 was lost");
  }
  if (/URGENȚĂ|URGENT/i.test(row.content_ro) && !/EMERGENCY|URGENT/i.test(contentEn)) {
    problems.push("urgency marker was weakened");
  }
  if (!contentEn || contentEn.length < Math.max(12, row.content_ro.length * 0.35)) {
    problems.push("translation is unexpectedly short");
  }

  return problems;
}

const translations = new Array(rows.length);
const failures = [];
let cursor = 0;

async function worker() {
  while (true) {
    const index = cursor;
    cursor += 1;
    if (index >= rows.length) return;

    const row = rows[index];
    const translatedContent =
      reviewedContentOverrides[row.id] ??
      polishMedicalEnglish(await translateText(prepareRomanianForTranslation(row)));
    const displayName = row.display_name_en?.trim() || "the selected structure";
    const titleBuilder = titleTemplates[row.category];
    const titleEn = titleBuilder
      ? titleBuilder(displayName)
      : polishMedicalEnglish(await translateText(row.title_ro));
    const problems = validateTranslation(row, translatedContent);

    if (problems.length) {
      failures.push({
        id: row.id,
        title_ro: row.title_ro,
        problems,
        content_ro: row.content_ro,
        content_en: translatedContent,
      });
    }

    translations[index] = {
      id: row.id,
      title_en: titleEn,
      content_en: translatedContent,
    };

    if ((index + 1) % 25 === 0 || index + 1 === rows.length) {
      console.log(`Translated ${index + 1}/${rows.length}`);
    }
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));

if (failures.length) {
  await writeFile(
    path.join(workspace, "test-results", "ai-knowledge-translation-review.json"),
    JSON.stringify(failures, null, 2),
    "utf8",
  );
  throw new Error(
    `${failures.length} translations require review. See test-results/ai-knowledge-translation-review.json`,
  );
}

const migration = `alter table public.ai_knowledge_entries
  add column if not exists title_en text,
  add column if not exists content_en text;

with translated as (
  select *
  from jsonb_to_recordset($knowledge$
${JSON.stringify(translations, null, 2)}
$knowledge$::jsonb) as value(id uuid, title_en text, content_en text)
)
update public.ai_knowledge_entries as knowledge
set
  title_en = translated.title_en,
  content_en = translated.content_en,
  updated_at = now()
from translated
where knowledge.id = translated.id;

do $validation$
begin
  if exists (
    select 1
    from public.ai_knowledge_entries
    where active = true
      and (
        nullif(trim(title_en), '') is null
        or nullif(trim(content_en), '') is null
      )
  ) then
    raise exception 'Active AI knowledge entries must contain complete English translations';
  end if;
end
$validation$;

alter table public.ai_knowledge_entries
  alter column title_en set not null,
  alter column content_en set not null;

alter table public.ai_knowledge_entries
  drop constraint if exists ai_knowledge_entries_title_en_not_blank,
  drop constraint if exists ai_knowledge_entries_content_en_not_blank;

alter table public.ai_knowledge_entries
  add constraint ai_knowledge_entries_title_en_not_blank
    check (char_length(trim(title_en)) > 0),
  add constraint ai_knowledge_entries_content_en_not_blank
    check (char_length(trim(content_en)) > 0);

drop function if exists public.get_ai_context_for_selection(
  public.tissue_type,
  text,
  text,
  text,
  integer
);

create function public.get_ai_context_for_selection(
  p_tissue public.tissue_type,
  p_model_selection_id text default null,
  p_structure_slug text default null,
  p_body_region text default null,
  p_limit integer default 12
)
returns table (
  id uuid,
  tissue public.tissue_type,
  structure_slug text,
  model_selection_id text,
  body_region text,
  category public.knowledge_category,
  title_ro text,
  content_ro text,
  title_en text,
  content_en text,
  priority smallint
)
language sql
stable
security invoker
as $function$
  select
    knowledge.id,
    knowledge.tissue,
    knowledge.structure_slug,
    knowledge.model_selection_id,
    knowledge.body_region,
    knowledge.category,
    knowledge.title_ro,
    knowledge.content_ro,
    knowledge.title_en,
    knowledge.content_en,
    knowledge.priority
  from public.ai_knowledge_entries as knowledge
  where knowledge.active = true
    and knowledge.tissue = p_tissue
    and (
      (p_structure_slug is not null and knowledge.structure_slug = p_structure_slug)
      or (
        p_model_selection_id is not null
        and knowledge.model_selection_id = p_model_selection_id
      )
      or (p_body_region is not null and knowledge.body_region = p_body_region)
    )
  order by
    case
      when p_structure_slug is not null and knowledge.structure_slug = p_structure_slug then 0
      when (
        p_model_selection_id is not null
        and knowledge.model_selection_id = p_model_selection_id
      ) then 1
      when p_body_region is not null and knowledge.body_region = p_body_region then 2
      else 3
    end,
    knowledge.priority desc,
    knowledge.created_at asc
  limit greatest(1, least(coalesce(p_limit, 12), 30));
$function$;
`;

await writeFile(
  path.join(workspace, "supabase", "migrations", "20260621210000_bilingual_ai_knowledge.sql"),
  migration,
  "utf8",
);

console.log(`Generated migration with ${translations.length} complete translations.`);
