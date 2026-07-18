begin;

comment on table public.body_regions is
  'Zone generale ale corpului folosite pentru localizarea durerii și filtrarea informațiilor medicale.';

comment on table public.anatomy_structures is
  'Catalogul central al structurilor anatomice afișate sau utilizate de Santix: oase, mușchi, tendoane și organe.';

comment on table public.muscles is
  'Catalogul mușchilor individuali, cu denumiri anatomice, traduceri și legături către grupele musculare.';

comment on table public.muscle_groups is
  'Grupe musculare ușor de înțeles, folosite pentru organizarea mușchilor și pentru selecția regională în modelul 3D.';

comment on table public.conditions is
  'Afecțiunile și leziunile medicale cunoscute de sistem, cu denumiri populare și științifice, descrieri și niveluri de triaj.';

comment on table public.symptoms is
  'Simptomele pe care utilizatorul le poate raporta, inclusiv sinonime, cuvinte-cheie și marcaje pentru semnale de alarmă.';

comment on table public.pain_classifications is
  'Clasificări ale durerii după intensitate, caracter și context, utilizate pentru interpretarea răspunsurilor utilizatorului.';

comment on table public.medical_sources is
  'Sursele medicale verificate din care provin informațiile educaționale și regulile folosite de Santix.';

comment on table public.triage_questions is
  'Întrebările adresate utilizatorului în fluxul de triaj pentru clarificarea simptomelor și a contextului.';

comment on table public.triage_options is
  'Variantele de răspuns pentru întrebările de triaj și punctajele asociate fiecărei alegeri.';

comment on table public.triage_rules is
  'Regulile deterministe care transformă răspunsurile utilizatorului în recomandări și niveluri orientative de triaj.';

comment on view public.model_3d_mappings is
  'Interfață read-only care reunește mapările modelului 3D cu denumirile populare, anatomice și latine ale structurilor.';

comment on table public.model_muscle_mappings is
  'Maparea segmentelor selectabile ale modelului 3D către mușchii și grupele musculare din baza de date.';

comment on table public.muscle_movement_patterns is
  'Legătura dintre mușchi și tipurile de mișcare la care participă.';

comment on table public.muscle_pain_profiles is
  'Profiluri orientative de durere pentru grupele musculare, folosite pentru explicații și întrebări contextuale.';

comment on table public.movement_patterns is
  'Catalogul mișcărilor corpului și al tiparelor funcționale utilizate în evaluarea musculară.';

comment on table public.condition_sources is
  'Tabel de legătură între afecțiuni și sursele medicale care le documentează.';

comment on table public.condition_structures is
  'Tabel de legătură între afecțiuni și structurile anatomice în care acestea pot apărea.';

comment on table public.condition_symptoms is
  'Tabel de legătură între afecțiuni și simptome, cu ponderi și reguli de asociere.';

comment on table public.ai_conversations is
  'Conversațiile utilizatorilor cu asistentul Santix și starea structurată a fiecărei evaluări.';

comment on table public.ai_messages is
  'Mesajele individuale trimise de utilizator și de asistent în cadrul conversațiilor.';

comment on table public.ai_knowledge_entries is
  'Fragmentele de cunoștințe medicale recuperate de sistem pentru a construi răspunsuri relevante și documentate.';

comment on table public.ai_guardrails is
  'Regulile de siguranță care limitează răspunsurile riscante, detectează urgențele și mențin rolul educațional al aplicației.';

drop view if exists public."DictionarBazaDate";

create view public."DictionarBazaDate"
with (security_invoker = true)
as
select *
from (
  values
    (1, 'body_regions', 'Zone ale corpului', 'tabel', 'Anatomie', 'Localizează zona generală indicată de utilizator.'),
    (2, 'anatomy_structures', 'Structuri anatomice', 'tabel', 'Anatomie', 'Catalog central pentru structurile selectate în modelul 3D.'),
    (3, 'muscles', 'Mușchi', 'tabel', 'Anatomie', 'Păstrează mușchii individuali și denumirile lor anatomice.'),
    (4, 'muscle_groups', 'Grupe musculare', 'tabel', 'Anatomie', 'Grupează mușchii în regiuni ușor de recunoscut.'),
    (5, 'conditions', 'Afecțiuni', 'tabel', 'Medical', 'Conține afecțiunile, explicațiile și nivelurile orientative de triaj.'),
    (6, 'symptoms', 'Simptome', 'tabel', 'Medical', 'Conține simptomele, sinonimele și semnalele de alarmă.'),
    (7, 'pain_classifications', 'Clasificări ale durerii', 'tabel', 'Medical', 'Descrie tipurile și intensitatea durerii.'),
    (8, 'medical_sources', 'Surse medicale', 'tabel', 'Medical', 'Păstrează bibliografia și sursele verificate.'),
    (9, 'triage_questions', 'Întrebări de triaj', 'tabel', 'Triaj', 'Întrebările afișate în evaluarea orientativă.'),
    (10, 'triage_options', 'Opțiuni de triaj', 'tabel', 'Triaj', 'Răspunsurile posibile și punctajele lor.'),
    (11, 'triage_rules', 'Reguli de triaj', 'tabel', 'Triaj', 'Stabilește recomandarea pe baza răspunsurilor.'),
    (12, 'model_3d_mappings', 'Interfață mapări model 3D', 'view', 'Model 3D', 'Prezintă într-un singur loc mapările și denumirile structurilor 3D.'),
    (13, 'model_muscle_mappings', 'Mapări mușchi în modelul 3D', 'tabel', 'Model 3D', 'Leagă fiecare segment 3D de mușchiul sau grupa corectă.'),
    (14, 'muscle_movement_patterns', 'Legături mușchi–mișcare', 'tabel', 'Mișcare', 'Arată la ce mișcări participă fiecare mușchi.'),
    (15, 'muscle_pain_profiles', 'Profiluri de durere musculară', 'tabel', 'Mișcare', 'Descrie manifestările orientative ale durerii pe regiuni musculare.'),
    (16, 'movement_patterns', 'Tipare de mișcare', 'tabel', 'Mișcare', 'Catalogul mișcărilor folosite în evaluare.'),
    (17, 'condition_sources', 'Legături afecțiuni–surse', 'tabel de legătură', 'Relații', 'Leagă fiecare afecțiune de sursele care o documentează.'),
    (18, 'condition_structures', 'Legături afecțiuni–structuri', 'tabel de legătură', 'Relații', 'Leagă afecțiunile de zonele anatomice relevante.'),
    (19, 'condition_symptoms', 'Legături afecțiuni–simptome', 'tabel de legătură', 'Relații', 'Leagă afecțiunile de simptomele caracteristice.'),
    (20, 'ai_conversations', 'Conversații cu asistentul', 'tabel', 'Asistent', 'Păstrează sesiunile de ghidaj ale utilizatorilor.'),
    (21, 'ai_messages', 'Mesajele asistentului', 'tabel', 'Asistent', 'Păstrează mesajele din fiecare conversație.'),
    (22, 'ai_knowledge_entries', 'Baza de cunoștințe a asistentului', 'tabel', 'Asistent', 'Conține informațiile medicale recuperate pentru răspunsuri.'),
    (23, 'ai_guardrails', 'Reguli de siguranță ale asistentului', 'tabel', 'Asistent', 'Previne răspunsurile riscante și identifică situațiile urgente.')
) as dictionar(
  "ordine",
  "numeTehnic",
  "numeRomanesc",
  "tipObiect",
  "categorie",
  "rolInSantix"
);

comment on view public."DictionarBazaDate" is
  'Dicționar read-only în limba română pentru prezentarea și înțelegerea structurii bazei de date Santix.';

revoke all on table public."DictionarBazaDate" from anon, authenticated;

commit;
