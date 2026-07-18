begin;

alter table public.condition_sources
  add column if not exists is_primary boolean not null default false,
  add column if not exists supports_fields text[] not null default '{}',
  add column if not exists notes_ro text,
  add column if not exists notes_en text,
  add column if not exists verified_at date,
  add column if not exists created_at timestamptz not null default now();

alter table public.condition_sources
  drop constraint if exists condition_sources_supports_fields_check;

alter table public.condition_sources
  add constraint condition_sources_supports_fields_check
  check (
    supports_fields <@ array[
      'definition',
      'symptoms',
      'causes',
      'duration',
      'self_care',
      'doctor_when',
      'emergency_signs',
      'prevention',
      'anatomy'
    ]::text[]
  );

create unique index if not exists condition_sources_one_primary_idx
  on public.condition_sources (condition_id)
  where is_primary = true;

create index if not exists condition_sources_source_idx
  on public.condition_sources (source_id, condition_id);

create table if not exists public.ai_knowledge_sources (
  knowledge_entry_id uuid not null
    references public.ai_knowledge_entries(id) on delete cascade,
  source_id uuid not null
    references public.medical_sources(id) on delete cascade,
  is_primary boolean not null default false,
  evidence_scope text not null default 'supporting',
  verified_at date,
  created_at timestamptz not null default now(),
  primary key (knowledge_entry_id, source_id),
  constraint ai_knowledge_sources_scope_check
    check (evidence_scope in ('primary', 'supporting', 'anatomy', 'regional'))
);

create unique index if not exists ai_knowledge_sources_one_primary_idx
  on public.ai_knowledge_sources (knowledge_entry_id)
  where is_primary = true;

create index if not exists ai_knowledge_sources_source_idx
  on public.ai_knowledge_sources (source_id, knowledge_entry_id);

alter table public.ai_knowledge_sources enable row level security;

drop policy if exists public_read on public.ai_knowledge_sources;
create policy public_read
  on public.ai_knowledge_sources
  for select
  using (
    exists (
      select 1
      from public.ai_knowledge_entries knowledge
      join public.medical_sources source
        on source.id = ai_knowledge_sources.source_id
      where knowledge.id = ai_knowledge_sources.knowledge_entry_id
        and knowledge.active = true
        and source.active = true
    )
  );

grant select on table public.ai_knowledge_sources to anon, authenticated;
revoke insert, update, delete on table public.ai_knowledge_sources from anon, authenticated;
grant all on table public.ai_knowledge_sources to service_role;

insert into public.medical_sources (
  title_en,
  title_ro,
  url,
  publisher,
  source_type,
  notes_en,
  notes_ro,
  source_language,
  last_verified_at,
  active,
  review_status
) values
  (
    'Muscle Cramps',
    'Crampe musculare',
    'https://medlineplus.gov/musclecramps.html',
    'MedlinePlus / NIH',
    'medical_reference',
    'muscle cramps',
    'crampe musculare',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Muscle Cramps',
    'Crampe musculare',
    'https://www.ncbi.nlm.nih.gov/books/NBK499895/',
    'NCBI Bookshelf / StatPearls',
    'clinical_review',
    'muscle cramps clinical review',
    'sinteză clinică despre crampele musculare',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Sprains and Strains',
    'Entorse și întinderi',
    'https://medlineplus.gov/sprainsandstrains.html',
    'MedlinePlus / NIH',
    'medical_reference',
    'sprains and muscle strains',
    'entorse și întinderi musculare',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Contracture Deformity',
    'Deformare prin contractură',
    'https://medlineplus.gov/ency/article/003185.htm',
    'MedlinePlus / NIH',
    'medical_reference',
    'contracture',
    'contractură',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Limited Range of Motion',
    'Limitarea amplitudinii de mișcare',
    'https://medlineplus.gov/ency/article/003173.htm',
    'MedlinePlus / NIH',
    'medical_reference',
    'limited range of motion',
    'limitarea amplitudinii de mișcare',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Delayed Onset Muscle Soreness (DOMS)',
    'Febră musculară cu debut întârziat (DOMS)',
    'https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness',
    'Cleveland Clinic',
    'medical_reference',
    'delayed-onset muscle soreness',
    'febră musculară cu debut întârziat',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Eccentric Contractions Are Responsible for Muscle Damage and Protection From Future Injury',
    'Contracțiile excentrice, afectarea musculară și protecția față de leziuni viitoare',
    'https://acsm.org/eccentric-contractions-muscle-damage/',
    'American College of Sports Medicine',
    'professional_reference',
    'eccentric exercise and delayed-onset muscle soreness',
    'efort excentric și febră musculară cu debut întârziat',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Muscle Contusion (Bruise)',
    'Contuzie musculară',
    'https://orthoinfo.aaos.org/en/diseases--conditions/muscle-contusion-bruise/',
    'American Academy of Orthopaedic Surgeons (AAOS)',
    'medical_reference',
    'muscle contusion',
    'contuzie musculară',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Sprains, Strains and Other Soft-Tissue Injuries',
    'Entorse, întinderi și alte leziuni ale țesuturilor moi',
    'https://orthoinfo.aaos.org/en/diseases--conditions/sprains-strains-and-other-soft-tissue-injuries/',
    'American Academy of Orthopaedic Surgeons (AAOS)',
    'medical_reference',
    'soft-tissue injuries',
    'leziuni ale țesuturilor moi',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Muscle Strains in the Thigh',
    'Întinderi și rupturi musculare ale coapsei',
    'https://orthoinfo.aaos.org/en/diseases--conditions/muscle-strains-in-the-thigh/',
    'American Academy of Orthopaedic Surgeons (AAOS)',
    'medical_reference',
    'muscle strain and tear',
    'întindere și ruptură musculară',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Dislocations',
    'Luxații',
    'https://medlineplus.gov/dislocations.html',
    'MedlinePlus / NIH',
    'medical_reference',
    'joint dislocations',
    'luxații articulare',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Dislocation',
    'Luxație',
    'https://medlineplus.gov/ency/article/000014.htm',
    'MedlinePlus / NIH',
    'medical_reference',
    'joint dislocation clinical overview',
    'prezentare clinică a luxației articulare',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Stress Fractures',
    'Fracturi de stres',
    'https://orthoinfo.aaos.org/en/diseases--conditions/stress-fractures/',
    'American Academy of Orthopaedic Surgeons (AAOS)',
    'medical_reference',
    'stress fractures',
    'fracturi de stres',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Fractures (Broken Bones)',
    'Fracturi osoase',
    'https://orthoinfo.aaos.org/en/diseases--conditions/fractures-broken-bones/',
    'American Academy of Orthopaedic Surgeons (AAOS)',
    'medical_reference',
    'bone fractures',
    'fracturi osoase',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Tendinitis',
    'Tendinită',
    'https://medlineplus.gov/tendinitis.html',
    'MedlinePlus / NIH',
    'medical_reference',
    'tendon overuse injuries',
    'leziuni de suprasolicitare ale tendonului',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Tendinosis',
    'Tendinoză și tendinopatie',
    'https://www.ncbi.nlm.nih.gov/books/NBK448174/',
    'NCBI Bookshelf / StatPearls',
    'clinical_review',
    'tendinopathy and tendinosis',
    'tendinopatie și tendinoză',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Achilles Tendon Rupture (Tear)',
    'Ruptura tendonului lui Ahile',
    'https://orthoinfo.aaos.org/en/diseases--conditions/achilles-tendon-rupture-tear/',
    'American Academy of Orthopaedic Surgeons (AAOS)',
    'medical_reference',
    'tendon rupture',
    'ruptură de tendon',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Achilles Tendon Rupture',
    'Ruptura tendonului lui Ahile',
    'https://www.ncbi.nlm.nih.gov/books/NBK430844/',
    'NCBI Bookshelf / StatPearls',
    'clinical_review',
    'tendon rupture clinical review',
    'sinteză clinică despre ruptura de tendon',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Anatomy, Skeletal Muscle',
    'Anatomia mușchiului scheletic',
    'https://www.ncbi.nlm.nih.gov/books/NBK537236/',
    'NCBI Bookshelf / StatPearls',
    'anatomy_reference',
    'skeletal muscle anatomy',
    'anatomia mușchiului scheletic',
    'en',
    date '2026-06-22',
    true,
    'verified'
  ),
  (
    'Anatomy, Bones',
    'Anatomia oaselor',
    'https://www.ncbi.nlm.nih.gov/books/NBK537199/',
    'NCBI Bookshelf / StatPearls',
    'anatomy_reference',
    'bone anatomy',
    'anatomia oaselor',
    'en',
    date '2026-06-22',
    true,
    'verified'
  )
on conflict (url) where url is not null do update set
  title_en = excluded.title_en,
  title_ro = excluded.title_ro,
  publisher = excluded.publisher,
  source_type = excluded.source_type,
  notes_en = excluded.notes_en,
  notes_ro = excluded.notes_ro,
  source_language = excluded.source_language,
  last_verified_at = excluded.last_verified_at,
  active = true,
  review_status = 'verified',
  updated_at = now();

delete from public.condition_sources;

with mappings (
  condition_slug,
  source_url,
  is_primary,
  supports_fields,
  notes_ro,
  notes_en
) as (
  values
    (
      'crampa-musculara',
      'https://medlineplus.gov/musclecramps.html',
      true,
      array['definition','symptoms','causes','duration','self_care','doctor_when','prevention'],
      'Sursa principală pentru definiție, manifestări și recomandări generale.',
      'Primary source for definition, presentation and general guidance.'
    ),
    (
      'crampa-musculara',
      'https://www.ncbi.nlm.nih.gov/books/NBK499895/',
      false,
      array['definition','symptoms','causes','doctor_when'],
      'Sinteză clinică suplimentară.',
      'Additional clinical review.'
    ),
    (
      'contractura-musculara',
      'https://medlineplus.gov/ency/article/003185.htm',
      true,
      array['definition','causes','doctor_when','prevention'],
      'Clarifică sensul clinic al contracturii persistente.',
      'Clarifies the clinical meaning of persistent contracture.'
    ),
    (
      'contractura-musculara',
      'https://medlineplus.gov/ency/article/003173.htm',
      false,
      array['symptoms','doctor_when'],
      'Documentează limitarea amplitudinii de mișcare.',
      'Documents limited range of motion.'
    ),
    (
      'contuzie-musculara',
      'https://orthoinfo.aaos.org/en/diseases--conditions/muscle-contusion-bruise/',
      true,
      array['definition','symptoms','causes','duration','self_care','doctor_when','emergency_signs','prevention'],
      'Sursa principală pentru contuzia musculară.',
      'Primary source for muscle contusion.'
    ),
    (
      'contuzie-musculara',
      'https://orthoinfo.aaos.org/en/diseases--conditions/sprains-strains-and-other-soft-tissue-injuries/',
      false,
      array['definition','symptoms','self_care','doctor_when'],
      'Context suplimentar despre leziunile țesuturilor moi.',
      'Additional soft-tissue injury context.'
    ),
    (
      'entorsa-articulara',
      'https://medlineplus.gov/sprainsandstrains.html',
      true,
      array['definition','symptoms','causes','duration','self_care','doctor_when','prevention'],
      'Sursa principală pentru entorse.',
      'Primary source for sprains.'
    ),
    (
      'entorsa-articulara',
      'https://orthoinfo.aaos.org/en/diseases--conditions/sprains-strains-and-other-soft-tissue-injuries/',
      false,
      array['definition','symptoms','causes','self_care','emergency_signs'],
      'Referință ortopedică suplimentară.',
      'Additional orthopaedic reference.'
    ),
    (
      'febra-musculara-intarziata',
      'https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness',
      true,
      array['definition','symptoms','causes','duration','self_care','doctor_when','emergency_signs','prevention'],
      'Sursa principală pentru DOMS.',
      'Primary source for DOMS.'
    ),
    (
      'febra-musculara-intarziata',
      'https://acsm.org/eccentric-contractions-muscle-damage/',
      false,
      array['causes','duration','prevention'],
      'Context profesional privind efortul excentric și DOMS.',
      'Professional context on eccentric exercise and DOMS.'
    ),
    (
      'fractura-de-stres',
      'https://orthoinfo.aaos.org/en/diseases--conditions/stress-fractures/',
      true,
      array['definition','symptoms','causes','duration','self_care','doctor_when','prevention'],
      'Sursa principală pentru fracturile de stres.',
      'Primary source for stress fractures.'
    ),
    (
      'fractura-de-stres',
      'https://orthoinfo.aaos.org/en/diseases--conditions/fractures-broken-bones/',
      false,
      array['definition','causes','doctor_when','emergency_signs'],
      'Context general despre fracturi.',
      'General fracture context.'
    ),
    (
      'fractura-osoasa',
      'https://medlineplus.gov/fractures.html',
      true,
      array['definition','symptoms','causes','duration','doctor_when','emergency_signs','prevention'],
      'Sursa principală pentru fracturi.',
      'Primary source for fractures.'
    ),
    (
      'fractura-osoasa',
      'https://www.merckmanuals.com/home/injuries-and-poisoning/fractures/overview-of-fractures',
      false,
      array['definition','symptoms','causes','doctor_when','emergency_signs'],
      'Sinteză clinică suplimentară.',
      'Additional clinical overview.'
    ),
    (
      'fractura-osoasa',
      'https://orthoinfo.aaos.org/en/diseases--conditions/fractures-broken-bones/',
      false,
      array['definition','symptoms','duration','doctor_when','prevention'],
      'Referință ortopedică suplimentară.',
      'Additional orthopaedic reference.'
    ),
    (
      'intindere-musculara',
      'https://medlineplus.gov/sprainsandstrains.html',
      true,
      array['definition','symptoms','causes','duration','self_care','doctor_when','prevention'],
      'Sursa principală pentru întinderea musculară.',
      'Primary source for muscle strain.'
    ),
    (
      'intindere-musculara',
      'https://orthoinfo.aaos.org/en/diseases--conditions/sprains-strains-and-other-soft-tissue-injuries/',
      false,
      array['definition','symptoms','causes','self_care','emergency_signs'],
      'Referință ortopedică suplimentară.',
      'Additional orthopaedic reference.'
    ),
    (
      'intindere-musculara',
      'https://orthoinfo.aaos.org/en/diseases--conditions/muscle-strains-in-the-thigh/',
      false,
      array['symptoms','duration','doctor_when'],
      'Exemplu clinic de întindere musculară.',
      'Clinical example of muscle strain.'
    ),
    (
      'luxatie-articulara',
      'https://medlineplus.gov/dislocations.html',
      true,
      array['definition','symptoms','causes','doctor_when','emergency_signs','prevention'],
      'Sursa principală pentru luxații.',
      'Primary source for dislocations.'
    ),
    (
      'luxatie-articulara',
      'https://medlineplus.gov/ency/article/000014.htm',
      false,
      array['definition','symptoms','self_care','doctor_when','emergency_signs'],
      'Sinteză clinică suplimentară.',
      'Additional clinical overview.'
    ),
    (
      'ruptura-musculara',
      'https://orthoinfo.aaos.org/en/diseases--conditions/muscle-strains-in-the-thigh/',
      true,
      array['definition','symptoms','causes','duration','doctor_when','emergency_signs','prevention'],
      'Sursa principală pentru ruptură musculară în spectrul leziunilor de tip strain.',
      'Primary source for muscle tear within the strain injury spectrum.'
    ),
    (
      'ruptura-musculara',
      'https://orthoinfo.aaos.org/en/diseases--conditions/sprains-strains-and-other-soft-tissue-injuries/',
      false,
      array['definition','symptoms','causes','self_care','emergency_signs'],
      'Context general despre rupturile țesuturilor moi.',
      'General context for soft-tissue tears.'
    ),
    (
      'ruptura-tendon',
      'https://orthoinfo.aaos.org/en/diseases--conditions/achilles-tendon-rupture-tear/',
      true,
      array['definition','symptoms','causes','duration','doctor_when','emergency_signs','prevention'],
      'Sursa principală pentru ruptura de tendon.',
      'Primary source for tendon rupture.'
    ),
    (
      'ruptura-tendon',
      'https://www.ncbi.nlm.nih.gov/books/NBK430844/',
      false,
      array['definition','symptoms','causes','doctor_when'],
      'Sinteză clinică suplimentară.',
      'Additional clinical review.'
    ),
    (
      'tendinopatie',
      'https://medlineplus.gov/tendinitis.html',
      true,
      array['definition','symptoms','causes','self_care','doctor_when','prevention'],
      'Sursa principală pentru afecțiunile de suprasolicitare ale tendonului.',
      'Primary source for tendon overuse disorders.'
    ),
    (
      'tendinopatie',
      'https://www.ncbi.nlm.nih.gov/books/NBK448174/',
      false,
      array['definition','causes','duration','doctor_when'],
      'Clarifică termenii tendinopatie și tendinoză.',
      'Clarifies the terms tendinopathy and tendinosis.'
    )
)
insert into public.condition_sources (
  condition_id,
  source_id,
  is_primary,
  supports_fields,
  notes_ro,
  notes_en,
  verified_at
)
select
  condition_row.id,
  source_row.id,
  mappings.is_primary,
  mappings.supports_fields,
  mappings.notes_ro,
  mappings.notes_en,
  date '2026-06-22'
from mappings
join public.conditions condition_row
  on condition_row.slug = mappings.condition_slug
join public.medical_sources source_row
  on source_row.url = mappings.source_url;

delete from public.ai_knowledge_sources;

update public.ai_knowledge_entries knowledge
set source_id = case
  when knowledge.category = 'anatomie' and knowledge.tissue = 'muschi' then (
    select id from public.medical_sources
    where url = 'https://www.ncbi.nlm.nih.gov/books/NBK537236/'
  )
  when knowledge.category = 'anatomie' and knowledge.tissue = 'os' then (
    select id from public.medical_sources
    where url = 'https://www.ncbi.nlm.nih.gov/books/NBK537199/'
  )
  when knowledge.tissue = 'muschi'
    and lower(knowledge.title_en || ' ' || knowledge.content_en) like '%cramp%' then (
      select id from public.medical_sources
      where url = 'https://medlineplus.gov/musclecramps.html'
    )
  when knowledge.tissue = 'muschi'
    and (
      lower(knowledge.title_en || ' ' || knowledge.content_en) like '%delayed-onset muscle soreness%'
      or lower(knowledge.title_en || ' ' || knowledge.content_en) like '%doms%'
    ) then (
      select id from public.medical_sources
      where url = 'https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness'
    )
  when knowledge.tissue = 'muschi'
    and lower(knowledge.title_en || ' ' || knowledge.content_en) like '%contracture%' then (
      select id from public.medical_sources
      where url = 'https://medlineplus.gov/ency/article/003185.htm'
    )
  when knowledge.tissue = 'muschi'
    and lower(knowledge.title_en || ' ' || knowledge.content_en) like '%contusion%' then (
      select id from public.medical_sources
      where url = 'https://orthoinfo.aaos.org/en/diseases--conditions/muscle-contusion-bruise/'
    )
  when knowledge.tissue = 'muschi' then (
    select id from public.medical_sources
    where url = 'https://medlineplus.gov/sprainsandstrains.html'
  )
  when knowledge.tissue = 'os' and knowledge.category <> 'anatomie' then (
    select id from public.medical_sources
    where url = 'https://medlineplus.gov/fractures.html'
  )
  else knowledge.source_id
end
where knowledge.active = true;

insert into public.ai_knowledge_sources (
  knowledge_entry_id,
  source_id,
  is_primary,
  evidence_scope,
  verified_at
)
select
  knowledge.id,
  knowledge.source_id,
  true,
  case when knowledge.category = 'anatomie' then 'anatomy' else 'primary' end,
  date '2026-06-22'
from public.ai_knowledge_entries knowledge
where knowledge.active = true
  and knowledge.source_id is not null;

insert into public.ai_knowledge_sources (
  knowledge_entry_id,
  source_id,
  is_primary,
  evidence_scope,
  verified_at
)
select
  knowledge.id,
  source.id,
  false,
  'supporting',
  date '2026-06-22'
from public.ai_knowledge_entries knowledge
join public.medical_sources source
  on source.url = case
    when knowledge.tissue = 'muschi'
      and knowledge.category <> 'anatomie'
      then 'https://orthoinfo.aaos.org/en/diseases--conditions/sprains-strains-and-other-soft-tissue-injuries/'
    when knowledge.tissue = 'os'
      and knowledge.category <> 'anatomie'
      then 'https://www.merckmanuals.com/home/injuries-and-poisoning/fractures/overview-of-fractures'
    else null
  end
where knowledge.active = true
on conflict (knowledge_entry_id, source_id) do nothing;

insert into public.ai_knowledge_sources (
  knowledge_entry_id,
  source_id,
  is_primary,
  evidence_scope,
  verified_at
)
select
  knowledge.id,
  source.id,
  false,
  'supporting',
  date '2026-06-22'
from public.ai_knowledge_entries knowledge
join public.medical_sources source
  on source.url = case
    when lower(knowledge.title_en || ' ' || knowledge.content_en) like '%cramp%'
      then 'https://www.ncbi.nlm.nih.gov/books/NBK499895/'
    when lower(knowledge.title_en || ' ' || knowledge.content_en) like '%contracture%'
      then 'https://medlineplus.gov/ency/article/003173.htm'
    when (
      lower(knowledge.title_en || ' ' || knowledge.content_en) like '%delayed-onset muscle soreness%'
      or lower(knowledge.title_en || ' ' || knowledge.content_en) like '%doms%'
    )
      then 'https://acsm.org/eccentric-contractions-muscle-damage/'
    when lower(knowledge.title_en || ' ' || knowledge.content_en) like '%contusion%'
      then 'https://orthoinfo.aaos.org/en/diseases--conditions/muscle-contusion-bruise/'
    else null
  end
where knowledge.active = true
  and knowledge.tissue = 'muschi'
  and knowledge.category <> 'anatomie'
on conflict (knowledge_entry_id, source_id) do nothing;

with regional_sources (body_region, structure_slug, source_url) as (
  values
    ('antebrat', null, 'https://medlineplus.gov/arminjuriesanddisorders.html'),
    ('brat', null, 'https://medlineplus.gov/arminjuriesanddisorders.html'),
    ('umar_centura_scapulara', null, 'https://medlineplus.gov/arminjuriesanddisorders.html'),
    ('coapsa_sold_genunchi', null, 'https://medlineplus.gov/hipinjuriesanddisorders.html'),
    ('pelvis', null, 'https://medlineplus.gov/hipinjuriesanddisorders.html'),
    ('coloana', null, 'https://medlineplus.gov/ency/article/000443.htm'),
    ('fata', null, 'https://www.hopkinsmedicine.org/health/conditions-and-diseases/facial-trauma'),
    ('cap_craniu', null, 'https://www.hopkinsmedicine.org/health/conditions-and-diseases/facial-trauma'),
    ('picior', null, 'https://medlineplus.gov/footinjuriesanddisorders.html'),
    ('gamba', null, 'https://medlineplus.gov/footinjuriesanddisorders.html'),
    ('torace', null, 'https://www.nhs.uk/conditions/broken-or-bruised-ribs/'),
    (null, 'rotula', 'https://www.hopkinsmedicine.org/health/conditions-and-diseases/kneecap-fractures'),
    (null, 'nazal', 'https://www.ncbi.nlm.nih.gov/sites/books/NBK538299/')
)
insert into public.ai_knowledge_sources (
  knowledge_entry_id,
  source_id,
  is_primary,
  evidence_scope,
  verified_at
)
select
  knowledge.id,
  source.id,
  false,
  'regional',
  date '2026-06-22'
from regional_sources mapping
join public.ai_knowledge_entries knowledge
  on knowledge.tissue = 'os'
 and knowledge.category <> 'anatomie'
 and (
   (mapping.body_region is not null and knowledge.body_region = mapping.body_region)
   or (mapping.structure_slug is not null and knowledge.structure_slug = mapping.structure_slug)
 )
join public.medical_sources source
  on source.url = mapping.source_url
where knowledge.active = true
on conflict (knowledge_entry_id, source_id) do nothing;

update public.ai_knowledge_entries knowledge
set metadata = coalesce(knowledge.metadata, '{}'::jsonb) || jsonb_build_object(
  'medical_sources_linked',
  true,
  'medical_source_count',
  (
    select count(*)
    from public.ai_knowledge_sources link
    where link.knowledge_entry_id = knowledge.id
  )
)
where knowledge.active = true;

create or replace function public.sync_ai_knowledge_primary_source()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_knowledge_entry_id uuid := coalesce(new.knowledge_entry_id, old.knowledge_entry_id);
  v_source_id uuid;
begin
  select link.source_id
  into v_source_id
  from public.ai_knowledge_sources link
  where link.knowledge_entry_id = v_knowledge_entry_id
  order by link.is_primary desc, link.created_at asc, link.source_id
  limit 1;

  update public.ai_knowledge_entries
  set source_id = v_source_id
  where id = v_knowledge_entry_id
    and source_id is distinct from v_source_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists ai_knowledge_sources_sync_primary on public.ai_knowledge_sources;
create trigger ai_knowledge_sources_sync_primary
after insert or update or delete on public.ai_knowledge_sources
for each row execute function public.sync_ai_knowledge_primary_source();

drop view if exists public.ai_knowledge_with_sources;
create view public.ai_knowledge_with_sources
with (security_invoker = true)
as
select
  knowledge.*,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', source.id,
          'title_ro', source.title_ro,
          'title_en', source.title_en,
          'publisher', source.publisher,
          'url', source.url,
          'is_primary', link.is_primary,
          'evidence_scope', link.evidence_scope,
          'verified_at', link.verified_at
        )
        order by link.is_primary desc, source.publisher, source.title_en
      )
      from public.ai_knowledge_sources link
      join public.medical_sources source on source.id = link.source_id
      where link.knowledge_entry_id = knowledge.id
        and source.active = true
    ),
    '[]'::jsonb
  ) as sources
from public.ai_knowledge_entries knowledge;

drop view if exists public.condition_evidence_catalog;
create view public.condition_evidence_catalog
with (security_invoker = true)
as
select
  condition_row.id as condition_id,
  condition_row.slug as condition_slug,
  condition_row.name_ro,
  condition_row.name_en,
  count(source.id) as source_count,
  count(source.id) filter (where link.is_primary) as primary_source_count,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', source.id,
        'title_ro', source.title_ro,
        'title_en', source.title_en,
        'publisher', source.publisher,
        'url', source.url,
        'is_primary', link.is_primary,
        'supports_fields', link.supports_fields,
        'verified_at', link.verified_at
      )
      order by link.is_primary desc, source.publisher, source.title_en
    ) filter (where source.id is not null),
    '[]'::jsonb
  ) as sources
from public.conditions condition_row
left join public.condition_sources link on link.condition_id = condition_row.id
left join public.medical_sources source
  on source.id = link.source_id
 and source.active = true
group by
  condition_row.id,
  condition_row.slug,
  condition_row.name_ro,
  condition_row.name_en;

grant select on table public.ai_knowledge_with_sources to anon, authenticated;
grant select on table public.condition_evidence_catalog to anon, authenticated;

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
  priority smallint,
  tags text[],
  metadata jsonb,
  sources jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
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
    knowledge.priority,
    knowledge.tags,
    knowledge.metadata,
    knowledge.sources
  from public.ai_knowledge_with_sources knowledge
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
$$;

revoke all on function public.get_ai_context_for_selection(
  public.tissue_type,
  text,
  text,
  text,
  integer
) from public;

grant execute on function public.get_ai_context_for_selection(
  public.tissue_type,
  text,
  text,
  text,
  integer
) to authenticated, service_role;

drop function if exists public.match_ai_knowledge_entries(
  extensions.vector,
  text,
  text,
  text,
  public.knowledge_category[],
  text[],
  double precision,
  integer
);

create function public.match_ai_knowledge_entries(
  p_query_embedding extensions.vector(1536),
  p_ai_layer text default null,
  p_body_region text default null,
  p_structure_slug text default null,
  p_categories public.knowledge_category[] default null,
  p_tags text[] default null,
  p_match_threshold double precision default 0.72,
  p_match_count integer default 8
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
  display_name_ro text,
  display_name_en text,
  priority smallint,
  tags text[],
  metadata jsonb,
  sources jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
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
    knowledge.display_name_ro,
    knowledge.display_name_en,
    knowledge.priority,
    knowledge.tags,
    knowledge.metadata,
    knowledge.sources,
    1 - (knowledge.embedding <=> p_query_embedding) as similarity
  from public.ai_knowledge_with_sources knowledge
  where knowledge.active = true
    and knowledge.embedding is not null
    and (
      p_ai_layer is null
      or (p_ai_layer = 'skeleton' and knowledge.tissue = 'os')
      or (p_ai_layer = 'muscular' and knowledge.tissue = 'muschi')
      or (p_ai_layer = 'organs' and knowledge.tissue = 'organ')
    )
    and (
      p_body_region is null
      or knowledge.body_region = p_body_region
      or knowledge.structure_slug = p_structure_slug
    )
    and (
      p_categories is null
      or cardinality(p_categories) = 0
      or knowledge.category = any(p_categories)
    )
    and (
      p_tags is null
      or cardinality(p_tags) = 0
      or knowledge.tags && p_tags
    )
    and 1 - (knowledge.embedding <=> p_query_embedding) >= p_match_threshold
  order by
    case
      when p_structure_slug is not null and knowledge.structure_slug = p_structure_slug then 0
      else 1
    end,
    case
      when p_body_region is not null and knowledge.body_region = p_body_region then 0
      else 1
    end,
    similarity desc,
    knowledge.priority desc
  limit greatest(1, least(coalesce(p_match_count, 8), 30));
$$;

revoke all on function public.match_ai_knowledge_entries(
  extensions.vector,
  text,
  text,
  text,
  public.knowledge_category[],
  text[],
  double precision,
  integer
) from public;

grant execute on function public.match_ai_knowledge_entries(
  extensions.vector,
  text,
  text,
  text,
  public.knowledge_category[],
  text[],
  double precision,
  integer
) to authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from public.conditions condition_row
    left join public.condition_sources link
      on link.condition_id = condition_row.id
    where condition_row.active = true
    group by condition_row.id
    having count(link.source_id) < 2
       or count(link.source_id) filter (where link.is_primary) <> 1
  ) then
    raise exception 'Every active condition must have at least two sources and exactly one primary source';
  end if;

  if exists (
    select 1
    from public.ai_knowledge_entries knowledge
    left join public.ai_knowledge_sources link
      on link.knowledge_entry_id = knowledge.id
    where knowledge.active = true
    group by knowledge.id
    having count(link.source_id) < 1
       or count(link.source_id) filter (where link.is_primary) <> 1
  ) then
    raise exception 'Every active AI knowledge entry must have at least one source and exactly one primary source';
  end if;

  if exists (
    select 1
    from public.ai_knowledge_entries
    where active = true
      and source_id is null
  ) then
    raise exception 'Every active AI knowledge entry must keep a legacy primary source_id';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
