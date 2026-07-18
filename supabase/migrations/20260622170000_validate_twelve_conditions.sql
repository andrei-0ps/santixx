begin;

alter table public.conditions
  add column if not exists popular_name_en text,
  add column if not exists medical_validation_status text not null default 'unreviewed',
  add column if not exists medical_evidence_reviewed_at timestamptz,
  add column if not exists medical_evidence_reviewed_by text,
  add column if not exists clinician_verified_at timestamptz,
  add column if not exists clinician_verified_by text,
  add column if not exists clinician_credentials text,
  add column if not exists medical_review_notes_ro text,
  add column if not exists medical_review_notes_en text;

alter table public.conditions
  drop constraint if exists conditions_medical_validation_status_check,
  drop constraint if exists conditions_evidence_review_check,
  drop constraint if exists conditions_clinician_verification_check;

alter table public.conditions
  add constraint conditions_medical_validation_status_check
    check (
      medical_validation_status in (
        'unreviewed',
        'evidence_reviewed',
        'clinician_verified',
        'rejected'
      )
    ),
  add constraint conditions_evidence_review_check
    check (
      medical_validation_status not in ('evidence_reviewed', 'clinician_verified')
      or (
        medical_evidence_reviewed_at is not null
        and nullif(btrim(coalesce(medical_evidence_reviewed_by, '')), '') is not null
      )
    ),
  add constraint conditions_clinician_verification_check
    check (
      medical_validation_status <> 'clinician_verified'
      or (
        clinician_verified_at is not null
        and nullif(btrim(coalesce(clinician_verified_by, '')), '') is not null
        and nullif(btrim(coalesce(clinician_credentials, '')), '') is not null
      )
    );

create table if not exists public.condition_medical_reviews (
  id uuid primary key default gen_random_uuid(),
  condition_id uuid not null references public.conditions(id) on delete cascade,
  review_version integer not null,
  validation_status text not null,
  terminology_status text not null,
  bilingual_status text not null,
  triage_status text not null,
  source_coverage_status text not null,
  reviewer_type text not null,
  reviewer_name text not null,
  reviewer_credentials text,
  reviewed_at timestamptz not null default now(),
  notes_ro text not null,
  notes_en text not null,
  primary_source_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (condition_id, review_version),
  constraint condition_medical_reviews_validation_status_check
    check (validation_status in ('evidence_reviewed', 'clinician_verified', 'rejected')),
  constraint condition_medical_reviews_dimension_status_check
    check (
      terminology_status in ('pass', 'corrected', 'fail')
      and bilingual_status in ('pass', 'corrected', 'fail')
      and triage_status in ('pass', 'corrected', 'fail')
      and source_coverage_status in ('pass', 'corrected', 'fail')
    ),
  constraint condition_medical_reviews_reviewer_type_check
    check (reviewer_type in ('evidence_review', 'clinician')),
  constraint condition_medical_reviews_clinician_check
    check (
      reviewer_type <> 'clinician'
      or nullif(btrim(coalesce(reviewer_credentials, '')), '') is not null
    )
);

create index if not exists condition_medical_reviews_condition_idx
  on public.condition_medical_reviews (condition_id, review_version desc);

alter table public.condition_medical_reviews enable row level security;

drop policy if exists public_read on public.condition_medical_reviews;
create policy public_read
  on public.condition_medical_reviews
  for select
  using (true);

grant select on table public.condition_medical_reviews to anon, authenticated;
revoke insert, update, delete on table public.condition_medical_reviews from anon, authenticated;
grant all on table public.condition_medical_reviews to service_role;

alter table public.condition_sources
  add column if not exists evidence_reviewed_at timestamptz;

alter table public.condition_sources
  drop constraint if exists condition_sources_review_status_check,
  drop constraint if exists condition_sources_evidence_review_check,
  drop constraint if exists condition_sources_clinical_review_check;

alter table public.condition_sources
  add constraint condition_sources_review_status_check
    check (
      review_status in (
        'mapped',
        'evidence_reviewed',
        'clinically_verified',
        'rejected'
      )
    ),
  add constraint condition_sources_evidence_review_check
    check (
      review_status not in ('evidence_reviewed', 'clinically_verified')
      or evidence_reviewed_at is not null
    ),
  add constraint condition_sources_clinical_review_check
    check (review_status <> 'clinically_verified' or verified_at is not null);

update public.conditions
set
  popular_name_en = 'Muscle cramp / charley horse',
  medical_review_notes_ro = 'Definiția, cauzele frecvente, măsurile de autoîngrijire și criteriile de evaluare au fost confruntate cu MedlinePlus și StatPearls. Semnele urgente sunt formulate ca posibile cauze alternative sau complicații, nu ca manifestări obișnuite ale unei crampe.',
  medical_review_notes_en = 'The definition, common causes, self-care and assessment criteria were checked against MedlinePlus and StatPearls. Urgent signs are framed as possible alternative causes or complications, not ordinary features of a cramp.'
where slug = 'crampa-musculara';

update public.conditions
set
  popular_name_ro = 'Rigiditate persistentă / mișcare limitată',
  popular_name_en = 'Persistent stiffness / limited movement',
  description_ro = 'Pierderea persistentă a elasticității mușchiului, tendonului sau altor țesuturi din jurul unei articulații, care limitează întinderea, amplitudinea mișcării și funcția. Nu este echivalentă cu o crampă trecătoare ori cu simpla tensiune musculară.',
  description_en = 'Persistent loss of extensibility in muscle, tendon or other tissues around a joint, limiting stretch, range of motion and function. It is not the same as a temporary cramp or ordinary muscle tightness.',
  scientific_name = 'Contracture',
  educational_note_ro = 'Informație educațională, nu diagnostic. În limbajul obișnuit, „contractură” este folosit uneori pentru un mușchi tensionat; sensul clinic standard descrie însă o limitare persistentă a mișcării.',
  educational_note_en = 'Educational information, not a diagnosis. In everyday speech, contracture is sometimes used for a tight muscle; the standard clinical meaning describes persistent restriction of movement.',
  common_causes_ro = 'Imobilizarea sau folosirea redusă, cicatrizarea după traumatisme ori arsuri, afectarea neurologică, leziunile severe și unele boli musculare pot produce contracturi.',
  common_causes_en = 'Immobilisation or reduced use, scarring after trauma or burns, neurological impairment, severe injuries and some muscle disorders can cause contractures.',
  self_care_ro = 'Urmează planul indicat de personalul medical. Exercițiile, stretchingul, ortezele sau atelele pot fi utile în anumite situații, dar nu forța articulația și nu aplica un program standard fără evaluarea cauzei.',
  self_care_en = 'Follow the plan provided by a healthcare professional. Exercises, stretching, braces or splints may help in some situations, but do not force the joint or use a standard programme without assessing the cause.',
  doctor_when_ro = 'Programează o evaluare dacă observi apariția unei limitări persistente sau scăderea progresivă a mișcării unei articulații.',
  doctor_when_en = 'Arrange an assessment if a persistent restriction appears or the range of motion of a joint progressively decreases.',
  medical_review_notes_ro = 'Definiția a fost corectată pentru a include țesuturile periarticulare și pentru a separa contractura clinică de crampele ori tensiunea musculară temporară.',
  medical_review_notes_en = 'The definition was corrected to include periarticular tissues and to distinguish clinical contracture from temporary cramps or muscle tightness.'
where slug = 'contractura-musculara';

update public.conditions
set
  popular_name_en = 'Muscle bruise',
  medical_review_notes_ro = 'Definiția, simptomele, protejarea zonei și revenirea graduală au fost confruntate cu recomandările AAOS. Riscul de sindrom de compartiment rămâne motiv de evaluare urgentă.',
  medical_review_notes_en = 'The definition, symptoms, protection of the area and gradual return were checked against AAOS guidance. Possible compartment syndrome remains a reason for urgent assessment.'
where slug = 'contuzie-musculara';

update public.conditions
set
  popular_name_en = 'Sprained joint / stretched ligament',
  medical_review_notes_ro = 'Terminologia ligamentară, simptomele și necesitatea excluderii unei fracturi sau luxații au fost verificate față de MedlinePlus și AAOS.',
  medical_review_notes_en = 'Ligament terminology, symptoms and the need to exclude fracture or dislocation were checked against MedlinePlus and AAOS.'
where slug = 'entorsa-articulara';

update public.conditions
set
  popular_name_en = 'Post-workout muscle soreness',
  description_ro = 'Durere, sensibilitate și rigiditate în mușchii solicitați, care apar progresiv la aproximativ una până la trei zile după un efort nou sau mai intens și se ameliorează în următoarele zile.',
  description_en = 'Soreness, tenderness and stiffness in the muscles used during exercise that build gradually about one to three days after a new or more intense workout and improve over the following days.',
  typical_duration_ro = 'Debutează de obicei la una până la trei zile după efort și se remite progresiv în câteva zile; persistența peste aproximativ o săptămână sugerează că trebuie exclusă o leziune.',
  typical_duration_en = 'It usually begins one to three days after exercise and fades progressively over a few days; persistence beyond about a week suggests that an injury should be excluded.',
  self_care_ro = 'Redu temporar intensitatea, menține mișcarea ușoară în limita confortului, odihnește-te și revino gradual la antrenament. Nu forța mușchii dureroși printr-un nou antrenament intens.',
  self_care_en = 'Temporarily reduce intensity, keep up light comfortable movement, rest and return to training gradually. Do not force sore muscles through another intense workout.',
  doctor_when_ro = 'Cere sfat medical dacă durerea este ascuțită sau constantă, durează aproximativ o săptămână ori mai mult, nu se ameliorează cu repausul sau este asociată cu umflare importantă.',
  doctor_when_en = 'Seek medical advice if pain is sharp or constant, lasts about a week or longer, does not improve with rest, or is associated with substantial swelling.',
  medical_review_notes_ro = 'Cronologia a fost corectată la debutul tipic de una până la trei zile și durata obișnuită de câteva zile, conform Cleveland Clinic.',
  medical_review_notes_en = 'Timing was corrected to the typical one-to-three-day onset and a usual duration of a few days, in line with Cleveland Clinic.'
where slug = 'febra-musculara-intarziata';

update public.conditions
set
  popular_name_ro = 'Leziune osoasă de suprasolicitare',
  popular_name_en = 'Bone stress injury / stress fracture',
  description_ro = 'Leziune din spectrul stresului osos produsă când încărcările repetitive depășesc capacitatea osului de refacere. Poate începe ca reacție de stres și poate progresa până la o fisură numită fractură de stres.',
  description_en = 'An injury on the bone-stress spectrum that develops when repetitive loading exceeds the bone''s ability to recover. It may begin as a stress reaction and progress to a crack called a stress fracture.',
  educational_note_ro = 'Informație educațională, nu diagnostic. Continuarea activității dureroase poate agrava o reacție de stres până la fractură, iar radiografia inițială poate fi normală.',
  educational_note_en = 'Educational information, not a diagnosis. Continuing painful activity can allow a stress reaction to progress to a fracture, and an early X-ray may be normal.',
  common_causes_ro = 'Creșterea rapidă a frecvenței, duratei sau intensității alergării și săriturilor, recuperarea insuficientă și factorii care reduc sănătatea osoasă sau aportul energetic.',
  common_causes_en = 'A rapid increase in the frequency, duration or intensity of running and jumping, insufficient recovery, and factors that reduce bone health or energy availability.',
  doctor_when_ro = 'Cere evaluare cât mai curând pentru durere focală pe os care reapare la activitate, apare la mers sau în repaus ori se agravează în ciuda reducerii efortului.',
  doctor_when_en = 'Seek assessment as soon as possible for focal bone pain that recurs with activity, occurs during walking or at rest, or worsens despite reducing activity.',
  medical_review_notes_ro = 'Definiția a fost corectată pentru a diferenția reacția de stres osos de fractura de stres propriu-zisă și pentru a sublinia progresia posibilă.',
  medical_review_notes_en = 'The definition was corrected to distinguish a bone stress reaction from a stress fracture and to emphasise possible progression.'
where slug = 'fractura-de-stres';

update public.conditions
set
  popular_name_en = 'Broken bone / fracture',
  medical_review_notes_ro = 'Definiția, semnele de alarmă și indicația de imobilizare fără repoziționare au fost confruntate cu MedlinePlus, AAOS și Merck Manual.',
  medical_review_notes_en = 'The definition, warning signs and advice to support rather than reposition the area were checked against MedlinePlus, AAOS and Merck Manual.'
where slug = 'fractura-osoasa';

update public.conditions
set
  popular_name_en = 'Pulled muscle',
  description_ro = 'Leziune în care fibrele musculare sunt întinse dincolo de toleranță și pot suferi rupturi microscopice sau parțiale, cel mai frecvent în timpul efortului ori al unei mișcări bruște.',
  description_en = 'An injury in which muscle fibres are stretched beyond their tolerance and may develop microscopic or partial tears, most often during exertion or a sudden movement.',
  educational_note_ro = 'Informație educațională, nu diagnostic. Întinderile musculare au grade diferite; o pierdere mare de forță, deformarea sau vânătaia extinsă poate indica o ruptură severă.',
  educational_note_en = 'Educational information, not a diagnosis. Muscle strains vary in severity; major loss of strength, deformity or extensive bruising may indicate a severe tear.',
  medical_review_notes_ro = 'Definiția a fost rafinată pentru a evita suprapunerea totală cu ruptura musculară și pentru a păstra continuitatea clinică dintre formele ușoare și severe.',
  medical_review_notes_en = 'The definition was refined to avoid complete overlap with muscle rupture while preserving the clinical continuum from mild to severe injury.'
where slug = 'intindere-musculara';

update public.conditions
set
  popular_name_en = 'Joint out of place',
  medical_review_notes_ro = 'Definiția, interdicția de repoziționare și semnele de compromis neurovascular au fost verificate față de MedlinePlus.',
  medical_review_notes_en = 'The definition, advice not to reposition the joint and signs of neurovascular compromise were checked against MedlinePlus.'
where slug = 'luxatie-articulara';

update public.conditions
set
  popular_name_en = 'Torn muscle',
  name_en = 'Muscle tear',
  scientific_name = 'Muscle tear',
  description_ro = 'Rupere parțială importantă sau completă a fibrelor musculare, aflată la capătul sever al spectrului întinderilor musculare, de obicei după contracție puternică, suprasolicitare bruscă ori traumatism.',
  description_en = 'A substantial partial or complete tear of muscle fibres at the severe end of the muscle-strain spectrum, usually after forceful contraction, sudden overload or trauma.',
  educational_note_ro = 'Informație educațională, nu diagnostic. „Întinderea” și „ruptura” fac parte din același spectru; examenul clinic și uneori imagistica stabilesc localizarea și severitatea.',
  educational_note_en = 'Educational information, not a diagnosis. A strain and a tear are part of the same injury spectrum; clinical examination and sometimes imaging determine location and severity.',
  medical_review_notes_ro = 'Terminologia a fost corectată: ruptura musculară nu este o categorie complet separată de întindere, ci forma parțială importantă sau completă a aceluiași spectru lezional.',
  medical_review_notes_en = 'Terminology was corrected: a muscle tear is not completely separate from a strain, but represents a substantial partial or complete injury on the same spectrum.'
where slug = 'ruptura-musculara';

update public.conditions
set
  popular_name_en = 'Torn tendon',
  educational_note_ro = 'Informație educațională, nu diagnostic. Manifestările diferă în funcție de tendon, dar pocnetul, pierderea bruscă a funcției și imposibilitatea unei mișcări obișnuite necesită evaluare promptă.',
  educational_note_en = 'Educational information, not a diagnosis. Features vary by tendon, but a pop, sudden loss of function and inability to perform a usual movement require prompt assessment.',
  medical_review_notes_ro = 'Afirmațiile generale au fost verificate prin surse despre tendoanele Ahile, patelar, cvadriceps și flexor; conduita exactă depinde de tendon și de caracterul parțial sau complet al rupturii.',
  medical_review_notes_en = 'General statements were checked against sources on Achilles, patellar, quadriceps and flexor tendons; exact management depends on the tendon and whether the tear is partial or complete.'
where slug = 'ruptura-tendon';

update public.conditions
set
  popular_name_en = 'Overloaded or painful tendon',
  description_ro = 'Termen general pentru durerea și afectarea unui tendon, frecvent asociate cu schimbări de încărcare și cu reducerea toleranței tendonului la efort.',
  description_en = 'A general term for pain and impaired tendon function, commonly associated with changes in loading and reduced tolerance of the tendon to activity.',
  educational_note_ro = 'Informație educațională, nu diagnostic. Tendinopatia este un termen mai larg decât tendinita; inflamația poate exista, dar nu explică toate formele persistente de durere de tendon.',
  educational_note_en = 'Educational information, not a diagnosis. Tendinopathy is broader than tendinitis; inflammation may be present, but it does not explain every persistent tendon disorder.',
  common_causes_ro = 'Creșterea rapidă sau schimbarea încărcării, mișcările repetitive, recuperarea insuficientă și factori individuali care reduc capacitatea tendonului de a tolera efortul.',
  common_causes_en = 'A rapid increase or change in loading, repetitive movement, insufficient recovery and individual factors that reduce the tendon''s capacity to tolerate activity.',
  medical_review_notes_ro = 'Terminologia a fost corectată pentru a nu folosi tendinită, tendinoză și tendinopatie ca sinonime perfecte.',
  medical_review_notes_en = 'Terminology was corrected so that tendinitis, tendinosis and tendinopathy are not treated as exact synonyms.'
where slug = 'tendinopatie';

update public.conditions
set
  medical_validation_status = 'evidence_reviewed',
  medical_evidence_reviewed_at = now(),
  medical_evidence_reviewed_by = 'Santix evidence review v1 — non-clinician',
  clinician_verified_at = null,
  clinician_verified_by = null,
  clinician_credentials = null,
  review_status = 'reviewed',
  reviewed_at = now(),
  reviewed_by = 'Santix evidence review v1 — non-clinician',
  updated_at = now()
where active = true;

update public.condition_sources
set
  review_status = 'evidence_reviewed',
  evidence_reviewed_at = now(),
  verified_at = null
where condition_id in (
  select id
  from public.conditions
  where active = true
);

insert into public.condition_medical_reviews (
  condition_id,
  review_version,
  validation_status,
  terminology_status,
  bilingual_status,
  triage_status,
  source_coverage_status,
  reviewer_type,
  reviewer_name,
  reviewer_credentials,
  reviewed_at,
  notes_ro,
  notes_en,
  primary_source_urls
)
select
  condition_row.id,
  1,
  'evidence_reviewed',
  case
    when condition_row.slug in (
      'contractura-musculara',
      'febra-musculara-intarziata',
      'fractura-de-stres',
      'intindere-musculara',
      'ruptura-musculara',
      'tendinopatie'
    ) then 'corrected'
    else 'pass'
  end,
  'pass',
  'pass',
  'pass',
  'evidence_review',
  'Santix evidence review v1 — non-clinician',
  null,
  now(),
  condition_row.medical_review_notes_ro,
  condition_row.medical_review_notes_en,
  coalesce(
    (
      select array_agg(source.url order by source.url)
      from public.condition_sources link
      join public.medical_sources source on source.id = link.source_id
      where link.condition_id = condition_row.id
        and link.is_primary = true
    ),
    '{}'
  )
from public.conditions condition_row
where condition_row.active = true
on conflict (condition_id, review_version) do update set
  validation_status = excluded.validation_status,
  terminology_status = excluded.terminology_status,
  bilingual_status = excluded.bilingual_status,
  triage_status = excluded.triage_status,
  source_coverage_status = excluded.source_coverage_status,
  reviewer_type = excluded.reviewer_type,
  reviewer_name = excluded.reviewer_name,
  reviewer_credentials = excluded.reviewer_credentials,
  reviewed_at = excluded.reviewed_at,
  notes_ro = excluded.notes_ro,
  notes_en = excluded.notes_en,
  primary_source_urls = excluded.primary_source_urls;

do $$
begin
  if (
    select count(*)
    from public.conditions
    where active = true
  ) <> 12 then
    raise exception 'Medical validation v1 expects exactly 12 active conditions';
  end if;

  if exists (
    select 1
    from public.conditions
    where active = true
      and (
        medical_validation_status <> 'evidence_reviewed'
        or medical_evidence_reviewed_at is null
        or nullif(btrim(coalesce(medical_evidence_reviewed_by, '')), '') is null
        or nullif(btrim(coalesce(popular_name_ro, '')), '') is null
        or nullif(btrim(coalesce(popular_name_en, '')), '') is null
        or nullif(btrim(coalesce(name_en, '')), '') is null
        or nullif(btrim(coalesce(scientific_name, '')), '') is null
        or nullif(btrim(coalesce(description_ro, '')), '') is null
        or nullif(btrim(coalesce(description_en, '')), '') is null
        or nullif(btrim(coalesce(doctor_when_ro, '')), '') is null
        or nullif(btrim(coalesce(doctor_when_en, '')), '') is null
        or nullif(btrim(coalesce(emergency_signs_ro, '')), '') is null
        or nullif(btrim(coalesce(emergency_signs_en, '')), '') is null
        or nullif(btrim(coalesce(medical_review_notes_ro, '')), '') is null
        or nullif(btrim(coalesce(medical_review_notes_en, '')), '') is null
      )
  ) then
    raise exception 'All active conditions must pass evidence review and bilingual completeness checks';
  end if;

  if (
    select count(*)
    from public.condition_medical_reviews review
    join public.conditions condition_row on condition_row.id = review.condition_id
    where condition_row.active = true
      and review.review_version = 1
      and review.validation_status = 'evidence_reviewed'
  ) <> 12 then
    raise exception 'Every active condition must have a version 1 evidence review';
  end if;

  if exists (
    select 1
    from public.conditions
    where medical_validation_status = 'clinician_verified'
      and (
        clinician_verified_at is null
        or nullif(btrim(coalesce(clinician_verified_by, '')), '') is null
        or nullif(btrim(coalesce(clinician_credentials, '')), '') is null
      )
  ) then
    raise exception 'Clinician verification requires identity, credentials and timestamp';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
