
alter table if exists public.ai_guardrails
  add column if not exists instruction_en text,
  add column if not exists severity_level text not null default 'medium',
  add column if not exists fallback_message_ro text,
  add column if not exists fallback_message_en text,
  add column if not exists category text not null default 'safety';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_guardrails_severity_level_check'
      and conrelid = 'public.ai_guardrails'::regclass
  ) then
    alter table public.ai_guardrails
      add constraint ai_guardrails_severity_level_check
      check (severity_level in ('low', 'medium', 'critical'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_guardrails_category_check'
      and conrelid = 'public.ai_guardrails'::regclass
  ) then
    alter table public.ai_guardrails
      add constraint ai_guardrails_category_check
      check (category in ('safety', 'clinical', 'formatting'));
  end if;
end $$;

insert into public.ai_guardrails (
  name,
  instruction_ro,
  instruction_en,
  severity_level,
  fallback_message_ro,
  fallback_message_en,
  category,
  active
) values
  (
    'use_database_context',
    'Folosește doar informațiile recuperate din baza de date medicală și simptomele introduse de utilizator. Nu inventa boli, tratamente sau recomandări care nu apar în context.',
    'Use only the information retrieved from the medical database and the symptoms provided by the user. Do not invent diseases, treatments, or recommendations that are not present in the provided context.',
    'critical',
    'Nu am suficiente informații sigure în baza Santix pentru a răspunde la această întrebare fără risc de eroare. Te rog reformulează sau consultă un medic specialist.',
    'I do not have enough reliable information in the Santix database to answer this safely. Please rephrase the question or consult a medical specialist.',
    'safety',
    true
  ),
  (
    'medical_scope_only',
    'Răspunde doar despre anatomie, simptome, afecțiuni și triaj educațional. Dacă utilizatorul întreabă despre literatură, politică, divertisment sau alt subiect, refuză politicos și revino la contextul medical.',
    'Answer only about anatomy, symptoms, medical conditions, and educational triage. If the user asks about literature, politics, entertainment, or another unrelated topic, politely refuse and return to the medical context.',
    'critical',
    'Pot ajuta doar cu informații medicale educaționale despre anatomie, simptome, afecțiuni și triaj. Te rog reformulează întrebarea în acest context.',
    'I can only help with educational medical information about anatomy, symptoms, conditions, and triage. Please rephrase your question in that context.',
    'safety',
    true
  ),
  (
    'no_real_diagnosis',
    'Nu formula diagnostic medical cert. Folosește exprimări precum „posibil”, „poate indica”, „este recomandată evaluarea”. Pentru semne de alarmă recomandă consult medical.',
    'Do not provide a definitive medical diagnosis. Use cautious wording such as "possible", "may indicate", and "medical evaluation is recommended". When warning signs are present, recommend medical consultation.',
    'critical',
    'Ne pare rău, dar ca asistent AI nu pot oferi un diagnostic medical cert. Pot oferi doar orientare educațională; pentru diagnostic și tratament, te rog consultă un medic specialist.',
    'I am sorry, but as an AI assistant I cannot provide a definitive medical diagnosis. I can only offer educational guidance; for diagnosis and treatment, please consult a medical specialist.',
    'clinical',
    true
  ),
  (
    'layer_locked_context',
    'Respectă stratul activ: pentru schelet discută doar țesut osos; pentru sistem muscular discută doar mușchi; pentru anatomie completă poți discuta doar despre structura exact selectată și relațiile ei anatomice directe.',
    'Respect the active layer: for the skeleton layer, discuss only bone tissue; for the muscular system, discuss only muscles; for complete anatomy, discuss only the exact selected structure and its direct anatomical relationships.',
    'medium',
    'Pentru siguranță, pot răspunde doar despre stratul anatomic selectat în aplicație. Selectează stratul potrivit dacă dorești informații despre alt sistem.',
    'For safety, I can answer only about the anatomical layer selected in the application. Please select the appropriate layer if you want information about another system.',
    'clinical',
    true
  ),
  (
    'selection_locked_context',
    'Răspunde strict despre structura sau regiunea selectată în modelul 3D. Dacă întrebarea utilizatorului cere altă zonă sau alt sistem anatomic, explică politicos că trebuie selectată zona respectivă în explorer.',
    'Answer strictly about the structure or region selected in the 3D model. If the user asks about another area or anatomical system, politely explain that the relevant area must be selected in the explorer.',
    'medium',
    'Pentru siguranță, pot răspunde doar despre structura selectată în modelul 3D. Selectează zona corectă în explorer pentru întrebări despre altă regiune.',
    'For safety, I can answer only about the structure selected in the 3D model. Please select the correct area in the explorer for questions about another region.',
    'clinical',
    true
  )
on conflict (name) do update set
  instruction_ro = excluded.instruction_ro,
  instruction_en = excluded.instruction_en,
  severity_level = excluded.severity_level,
  fallback_message_ro = excluded.fallback_message_ro,
  fallback_message_en = excluded.fallback_message_en,
  category = excluded.category,
  active = excluded.active;

create index if not exists ai_guardrails_active_category_idx
  on public.ai_guardrails (active, category, severity_level);
