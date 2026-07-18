create extension if not exists pgcrypto;

create type public.tissue_type as enum ('os', 'muschi', 'tendon', 'nerv', 'organ', 'articulatie');
create type public.pain_level as enum ('usor', 'mediu', 'consultare_doctor');
create type public.question_kind as enum ('single_choice', 'multi_choice', 'number', 'text');

create table public.anatomy_structures (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ro text not null,
  name_latin text,
  tissue public.tissue_type not null,
  body_region text not null,
  parent_slug text references public.anatomy_structures(slug) on update cascade on delete set null,
  model_selection_id text,
  description_ro text not null default '',
  function_ro text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conditions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ro text not null,
  medical_name text,
  tissue public.tissue_type not null,
  default_level public.pain_level not null,
  description_ro text not null,
  educational_note_ro text not null default 'Informație educațională. Nu înlocuiește consultul medical.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.condition_structures (
  condition_id uuid not null references public.conditions(id) on delete cascade,
  structure_id uuid not null references public.anatomy_structures(id) on delete cascade,
  relevance smallint not null default 3 check (relevance between 1 and 5),
  primary key (condition_id, structure_id)
);

create table public.symptoms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ro text not null,
  description_ro text not null default '',
  keywords_ro text[] not null default '{}',
  red_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.condition_symptoms (
  condition_id uuid not null references public.conditions(id) on delete cascade,
  symptom_id uuid not null references public.symptoms(id) on delete cascade,
  weight smallint not null default 2 check (weight between 1 and 5),
  required boolean not null default false,
  primary key (condition_id, symptom_id)
);

create table public.triage_questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  tissue public.tissue_type,
  body_region text,
  question_ro text not null,
  kind public.question_kind not null default 'single_choice',
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.triage_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.triage_questions(id) on delete cascade,
  label_ro text not null,
  score_usor smallint not null default 0,
  score_mediu smallint not null default 0,
  score_consultare_doctor smallint not null default 0,
  finding_ro text,
  sort_order integer not null default 0
);

create table public.triage_rules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ro text not null,
  condition_id uuid references public.conditions(id) on delete cascade,
  tissue public.tissue_type,
  body_region text,
  level public.pain_level not null,
  priority smallint not null default 1 check (priority between 1 and 10),
  rule jsonb not null,
  explanation_ro text not null
);

create table public.medical_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  publisher text,
  source_type text not null default 'manual',
  notes text,
  created_at timestamptz not null default now()
);

create table public.condition_sources (
  condition_id uuid not null references public.conditions(id) on delete cascade,
  source_id uuid not null references public.medical_sources(id) on delete cascade,
  primary key (condition_id, source_id)
);

create table public.ai_guardrails (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  instruction_ro text not null,
  active boolean not null default true
);

create index anatomy_structures_tissue_region_idx on public.anatomy_structures (tissue, body_region);
create index conditions_tissue_level_idx on public.conditions (tissue, default_level);
create index symptoms_keywords_idx on public.symptoms using gin (keywords_ro);
create index triage_questions_scope_idx on public.triage_questions (tissue, body_region, active);
create index triage_rules_scope_idx on public.triage_rules (tissue, body_region, level);

insert into public.ai_guardrails (name, instruction_ro) values
  (
    'medical_scope_only',
    'Răspunde doar despre anatomie, simptome, afecțiuni și triaj educațional. Dacă utilizatorul întreabă despre literatură, politică, divertisment sau alt subiect, refuză politicos și revino la contextul medical.'
  ),
  (
    'no_real_diagnosis',
    'Nu formula diagnostic medical cert. Folosește exprimări precum „posibil”, „poate indica”, „este recomandată evaluarea”. Pentru semne de alarmă recomandă consult medical.'
  ),
  (
    'use_database_context',
    'Folosește doar informațiile recuperate din baza de date medicală și simptomele introduse de utilizator. Nu inventa boli, tratamente sau recomandări care nu apar în context.'
  );

insert into public.anatomy_structures (slug, name_ro, name_latin, tissue, body_region, model_selection_id, description_ro, function_ro) values
  ('muschi-cap-gat', 'Mușchii capului și gâtului', null, 'muschi', 'cap_gat', 'muschi-cap-gat', 'Grup muscular implicat în mișcările capului, gâtului și mimicii.', 'Ajută la mișcare, stabilizare și expresie facială.'),
  ('muschi-brat-umar', 'Mușchii brațului și umărului', null, 'muschi', 'membru_superior', 'muschi-brat-umar', 'Grup muscular implicat în mișcarea umărului și brațului.', 'Permite ridicarea, rotația și stabilizarea membrului superior.'),
  ('muschi-mana-antebrat', 'Mușchii mâinii și antebrațului', null, 'muschi', 'mana_antebrat', 'muschi-mana-antebrat', 'Grup muscular implicat în mișcarea mâinii, degetelor și încheieturii.', 'Controlează prinderea, extensia, flexia și finețea mișcărilor.'),
  ('muschi-trunchi', 'Mușchii trunchiului', null, 'muschi', 'trunchi', 'muschi-trunchi', 'Grup muscular implicat în postură și mișcările trunchiului.', 'Stabilizează coloana, toracele și bazinul.'),
  ('muschi-membru-inferior', 'Mușchii coapsei și gambei', null, 'muschi', 'membru_inferior', 'muschi-membru-inferior', 'Grup muscular implicat în mers, alergare și sprijin.', 'Permite extensia, flexia și stabilitatea membrului inferior.'),
  ('muschi-picior', 'Mușchii piciorului', null, 'muschi', 'picior', 'muschi-picior', 'Grup muscular implicat în sprijinul și mișcarea piciorului.', 'Ajută la echilibru, mers și adaptarea tălpii la sol.');

insert into public.conditions (slug, name_ro, medical_name, tissue, default_level, description_ro) values
  ('crampa-musculara', 'Crampă musculară', 'spasm muscular', 'muschi', 'usor', 'Contracție involuntară și dureroasă a unui mușchi, frecvent asociată cu oboseală, efort sau hidratare insuficientă.'),
  ('contractura-musculara', 'Contractură musculară', 'contractură musculară', 'muschi', 'mediu', 'Tensiune musculară persistentă care poate limita mișcarea și produce durere locală.'),
  ('intindere-musculara', 'Întindere musculară', 'strain muscular', 'muschi', 'mediu', 'Leziune prin suprasolicitare a fibrelor musculare, de obicei după efort sau mișcare bruscă.'),
  ('ruptura-musculara', 'Ruptură musculară posibilă', 'ruptură musculară', 'muschi', 'consultare_doctor', 'Leziune importantă a fibrelor musculare, posibil asociată cu durere severă, vânătaie, umflare sau pierdere de forță.');

insert into public.symptoms (slug, name_ro, keywords_ro, red_flag) values
  ('durere-usoara', 'Durere ușoară', array['durere ușoară','usor','ușor','jenă','jena'], false),
  ('durere-moderata', 'Durere moderată', array['moderat','mediu','persistent','deranjează mișcarea'], false),
  ('durere-severa', 'Durere severă', array['sever','insuportabil','foarte tare'], true),
  ('pocnet-trauma', 'Pocnet sau traumă', array['pocnet','pocnit','traumă','trauma','cădere','cadere','lovitură','lovitura'], true),
  ('limitare-miscare', 'Limitare la mișcare', array['nu pot mișca','nu pot misca','limitare','nu pot folosi'], true),
  ('umflare-vanataie', 'Umflare sau vânătaie', array['umflat','umflare','vânătaie','vanataie'], false),
  ('amorteala-slabiciune', 'Amorțeală sau slăbiciune', array['amorțeală','amorteala','slăbiciune','slabiciune'], true);

insert into public.condition_symptoms (condition_id, symptom_id, weight, required)
select c.id, s.id, v.weight, v.required
from (values
  ('crampa-musculara', 'durere-usoara', 2, false),
  ('crampa-musculara', 'durere-moderata', 1, false),
  ('contractura-musculara', 'durere-moderata', 3, false),
  ('contractura-musculara', 'limitare-miscare', 2, false),
  ('intindere-musculara', 'durere-moderata', 3, false),
  ('intindere-musculara', 'pocnet-trauma', 2, false),
  ('ruptura-musculara', 'durere-severa', 4, true),
  ('ruptura-musculara', 'pocnet-trauma', 4, false),
  ('ruptura-musculara', 'limitare-miscare', 5, false),
  ('ruptura-musculara', 'amorteala-slabiciune', 5, false)
) as v(condition_slug, symptom_slug, weight, required)
join public.conditions c on c.slug = v.condition_slug
join public.symptoms s on s.slug = v.symptom_slug;

insert into public.triage_questions (slug, tissue, question_ro, sort_order) values
  ('intensitate-durere', 'muschi', 'Cât de intensă este durerea?', 10),
  ('debut-durere', 'muschi', 'Cum a început durerea?', 20),
  ('functie-zona', 'muschi', 'Poți folosi zona afectată?', 30),
  ('semne-asociate', 'muschi', 'Există semne vizibile sau simptome asociate?', 40),
  ('durata-durere', 'muschi', 'De cât timp persistă?', 50);

insert into public.triage_options (question_id, label_ro, score_usor, score_mediu, score_consultare_doctor, finding_ro, sort_order)
select q.id, v.label_ro, v.score_usor, v.score_mediu, v.score_consultare_doctor, v.finding_ro, v.sort_order
from (values
  ('intensitate-durere', 'Ușoară, suportabilă', 2, 0, 0, 'durere ușoară', 1),
  ('intensitate-durere', 'Moderată, deranjează mișcarea', 0, 3, 0, 'durere moderată', 2),
  ('intensitate-durere', 'Severă sau insuportabilă', 0, 0, 5, 'durere severă', 3),
  ('debut-durere', 'Treptat, după efort', 2, 1, 0, 'debut după efort', 1),
  ('debut-durere', 'Brusc, în timpul unei mișcări', 0, 2, 1, 'debut brusc', 2),
  ('debut-durere', 'După lovitură, cădere sau pocnet', 0, 0, 5, 'traumă sau pocnet', 3),
  ('functie-zona', 'Da, aproape normal', 2, 0, 0, 'funcție păstrată', 1),
  ('functie-zona', 'Da, dar cu limitare', 0, 3, 0, 'funcție limitată', 2),
  ('functie-zona', 'Nu pot folosi zona', 0, 0, 5, 'imposibilitate funcțională', 3),
  ('semne-asociate', 'Nu, doar disconfort', 2, 0, 0, 'fără semne vizibile', 1),
  ('semne-asociate', 'Umflare ușoară sau sensibilitate', 0, 2, 0, 'umflare sau sensibilitate', 2),
  ('semne-asociate', 'Vânătaie mare, deformare, febră, amorțeală sau slăbiciune', 0, 0, 6, 'semne de alarmă', 3),
  ('durata-durere', 'Mai puțin de 24-48 ore', 1, 0, 0, 'durată scurtă', 1),
  ('durata-durere', 'Câteva zile și nu trece', 0, 2, 0, 'persistență de câteva zile', 2),
  ('durata-durere', 'Se agravează sau revine frecvent', 0, 2, 2, 'agravare sau recurență', 3)
) as v(question_slug, label_ro, score_usor, score_mediu, score_consultare_doctor, finding_ro, sort_order)
join public.triage_questions q on q.slug = v.question_slug;

insert into public.triage_rules (slug, name_ro, tissue, level, priority, rule, explanation_ro) values
  (
    'contradictie-usor-nu-pot-folosi',
    'Contradicție: durere ușoară dar imposibilitate funcțională',
    'muschi',
    'consultare_doctor',
    9,
    '{"if":[{"question":"intensitate-durere","option":"Ușoară, suportabilă"},{"question":"functie-zona","option":"Nu pot folosi zona"}],"action":"clarify"}',
    'Dacă utilizatorul spune că durerea este ușoară, dar nu poate folosi zona, aplicația trebuie să ceară clarificare înainte de verdict.'
  ),
  (
    'red-flags-consult',
    'Semne de alarmă',
    'muschi',
    'consultare_doctor',
    10,
    '{"any_symptom_red_flag":true,"action":"consultare_doctor"}',
    'Semnele de alarmă precum traumă, amorțeală, slăbiciune, deformare sau imposibilitate funcțională cresc triajul la consult medical.'
  );
