begin;

alter table public.medical_sources
  add column if not exists content_provider text,
  add column if not exists content_license text,
  add column if not exists reuse_notes_ro text,
  add column if not exists reuse_notes_en text;

create table if not exists public.anatomy_structure_sources (
  structure_id uuid not null
    references public.anatomy_structures(id) on delete cascade,
  source_id uuid not null
    references public.medical_sources(id) on delete cascade,
  evidence_scope text not null,
  is_primary boolean not null default false,
  source_checked_at date not null,
  review_status text not null default 'mapped',
  notes_ro text,
  notes_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (structure_id, source_id),
  constraint anatomy_structure_sources_scope_check
    check (evidence_scope in ('anatomy_function', 'triage', 'supporting')),
  constraint anatomy_structure_sources_review_check
    check (review_status in ('mapped', 'clinically_verified', 'rejected')),
  constraint anatomy_structure_sources_clinical_check
    check (review_status <> 'clinically_verified' or source_checked_at is not null)
);

create unique index if not exists anatomy_structure_sources_primary_scope_idx
  on public.anatomy_structure_sources (structure_id, evidence_scope)
  where is_primary = true;

create index if not exists anatomy_structure_sources_source_idx
  on public.anatomy_structure_sources (source_id, structure_id);

alter table public.anatomy_structure_sources enable row level security;

drop policy if exists public_read on public.anatomy_structure_sources;
create policy public_read
  on public.anatomy_structure_sources
  for select
  using (
    exists (
      select 1
      from public.anatomy_structures structure
      join public.medical_sources source
        on source.id = anatomy_structure_sources.source_id
      where structure.id = anatomy_structure_sources.structure_id
        and source.active = true
    )
  );

grant select on table public.anatomy_structure_sources to anon, authenticated;
revoke insert, update, delete on table public.anatomy_structure_sources from anon, authenticated;
grant all on table public.anatomy_structure_sources to service_role;

create temporary table organ_medical_catalog (
  structure_slug text primary key,
  description_ro text not null,
  description_en text not null,
  function_ro text not null,
  function_en text not null,
  doctor_when_ro text not null,
  doctor_when_en text not null,
  emergency_signs_ro text not null,
  emergency_signs_en text not null,
  questions_ro text not null,
  questions_en text not null,
  anatomy_source_url text not null,
  triage_source_url text not null
) on commit drop;

insert into organ_medical_catalog values
  (
    'organ-inima',
    'Organ muscular aflat în torace, aproximativ de mărimea unui pumn, alcătuit din patru camere care primesc și împing sângele.',
    'A muscular organ in the chest, about the size of a fist, made of four chambers that receive and pump blood.',
    'Pompează sângele către plămâni pentru oxigenare și apoi către restul corpului, menținând circulația.',
    'Pumps blood to the lungs for oxygenation and then to the rest of the body, maintaining circulation.',
    'Cere sfat medical dacă palpitațiile se repetă, apare lipsă de aer la eforturi obișnuite, oboseală neobișnuită sau umflarea picioarelor. Aceste simptome nu arată singure că problema vine de la inimă.',
    'Seek medical advice for repeated palpitations, breathlessness during usual activity, unusual fatigue, or leg swelling. These symptoms alone do not prove that the heart is the cause.',
    'Sună la 112 pentru durere sau presiune în piept care nu trece, mai ales dacă se extinde spre braț, spate, gât ori mandibulă sau apare cu transpirații, greață, lipsă de aer, amețeală ori leșin.',
    'Call emergency services for chest pain or pressure that does not go away, especially if it spreads to an arm, the back, neck, or jaw, or occurs with sweating, nausea, breathlessness, dizziness, or fainting.',
    'Întreabă unde este disconfortul, când a început, dacă apare la efort sau în repaus, dacă se extinde și dacă există lipsă de aer, palpitații, amețeală ori leșin.',
    'Ask where the discomfort is, when it started, whether it occurs with activity or at rest, whether it spreads, and whether there is breathlessness, palpitations, dizziness, or fainting.',
    'https://www.nhlbi.nih.gov/health/heart',
    'https://www.nhs.uk/symptoms/chest-pain/'
  ),
  (
    'organ-plamani',
    'Două organe spongioase aflate în torace, de o parte și de alta a inimii, care conțin căile respiratorii și mici saci de aer.',
    'Two spongy organs in the chest, one on each side of the heart, containing airways and tiny air sacs.',
    'Transferă oxigenul din aer în sânge și elimină dioxidul de carbon din sânge prin respirație.',
    'Move oxygen from the air into the blood and remove carbon dioxide from the blood through breathing.',
    'Cere evaluare medicală dacă lipsa de aer este nouă sau se agravează, tusea persistă, apare respirație șuierătoare ori tușești sânge, chiar și în cantitate mică.',
    'Seek medical assessment for new or worsening breathlessness, a persistent cough, wheezing, or coughing up any blood.',
    'Sună la 112 dacă respirația este atât de dificilă încât gâfâi, te sufoci sau nu poți spune cuvinte, dacă buzele ori pielea devin foarte palide, albăstrui sau gri ori dacă apare confuzie bruscă.',
    'Call emergency services if breathing is so difficult that you are gasping, choking, or unable to speak, if the lips or skin become very pale, blue, or grey, or if sudden confusion develops.',
    'Întreabă când a început lipsa de aer, dacă apare în repaus sau la efort și dacă există tuse, febră, durere toracică, respirație șuierătoare ori sânge eliminat prin tuse.',
    'Ask when breathlessness began, whether it occurs at rest or with activity, and whether there is cough, fever, chest pain, wheezing, or blood when coughing.',
    'https://www.nhlbi.nih.gov/health/lungs',
    'https://www.nhs.uk/symptoms/shortness-of-breath/'
  ),
  (
    'organ-trahee',
    'Tub flexibil al căilor respiratorii care pornește sub laringe și se împarte în cele două bronhii principale.',
    'A flexible airway tube that begins below the larynx and divides into the two main bronchi.',
    'Conduce aerul între gât și plămâni și ajută la menținerea deschisă a căii respiratorii.',
    'Carries air between the throat and lungs and helps keep the airway open.',
    'Cere evaluare medicală pentru respirație zgomotoasă persistentă, răgușeală care nu se ameliorează, tuse persistentă sau episoade repetate de înecare.',
    'Seek medical assessment for persistent noisy breathing, hoarseness that does not improve, a persistent cough, or repeated choking episodes.',
    'Sună la 112 dacă persoana nu poate vorbi, tuși sau respira, dacă se sufocă, își pierde starea de conștiență ori buzele devin albăstrui.',
    'Call emergency services if the person cannot speak, cough, or breathe, is choking, loses consciousness, or develops blue lips.',
    'Întreabă dacă simptomele au început după mâncare sau un obiect mic și dacă există tuse, răgușeală, un sunet ascuțit la inspirație ori dificultate la respirație.',
    'Ask whether symptoms began after food or a small object and whether there is cough, hoarseness, a high-pitched sound while breathing in, or difficulty breathing.',
    'https://www.nhlbi.nih.gov/health/lungs/breathing-benefits',
    'https://www.nhs.uk/tests-and-treatments/first-aid/'
  ),
  (
    'organ-esofag',
    'Tub muscular care leagă gâtul de stomac și prin care trec alimentele și lichidele înghițite.',
    'A muscular tube connecting the throat to the stomach through which swallowed food and liquids pass.',
    'Împinge alimentele și lichidele către stomac prin contracții coordonate ale peretelui său.',
    'Moves food and liquids toward the stomach through coordinated contractions of its wall.',
    'Cere consult dacă înghițirea devine dificilă sau dureroasă, alimentele par să se blocheze, apar regurgitații repetate ori scădere neintenționată în greutate.',
    'Seek medical advice if swallowing becomes difficult or painful, food seems to stick, repeated regurgitation occurs, or there is unintentional weight loss.',
    'Sună la 112 pentru sufocare sau dificultate severă la respirație. Solicită evaluare urgentă dacă nu poți înghiți saliva, un aliment rămâne blocat sau apar vărsături cu sânge.',
    'Call emergency services for choking or severe breathing difficulty. Seek urgent assessment if you cannot swallow saliva, food remains stuck, or you vomit blood.',
    'Întreabă dacă problema apare la solide, lichide sau ambele, dacă înghițirea doare, dacă alimentele se blochează și dacă există arsuri, regurgitații ori scădere în greutate.',
    'Ask whether the problem occurs with solids, liquids, or both, whether swallowing is painful, whether food sticks, and whether there is heartburn, regurgitation, or weight loss.',
    'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
    'https://www.nhs.uk/symptoms/swallowing-problems-dysphagia/'
  ),
  (
    'organ-stomac',
    'Organ muscular gol aflat în partea superioară a abdomenului, între esofag și intestinul subțire.',
    'A hollow muscular organ in the upper abdomen, between the esophagus and small intestine.',
    'Păstrează temporar alimentele, le amestecă cu acid și enzime digestive și le trimite treptat către intestinul subțire.',
    'Temporarily stores food, mixes it with acid and digestive enzymes, and gradually passes it to the small intestine.',
    'Cere consult pentru durere recurentă în partea superioară a abdomenului, vărsături repetate, sațietate după cantități mici de mâncare sau scădere neintenționată în greutate.',
    'Seek medical advice for recurring upper-abdominal pain, repeated vomiting, feeling full after small amounts of food, or unintentional weight loss.',
    'Solicită ajutor medical imediat pentru vărsături cu sânge, scaun negru ca păcura, durere abdominală severă care nu trece, amețeală puternică sau leșin.',
    'Seek immediate medical help for vomiting blood, black tarry stools, severe abdominal pain that does not go away, marked dizziness, or fainting.',
    'Întreabă unde este durerea, cum se leagă de mese și dacă există greață, vărsături, arsuri, sațietate rapidă, scaun negru ori scădere în greutate.',
    'Ask where the pain is, how it relates to meals, and whether there is nausea, vomiting, heartburn, early fullness, black stools, or weight loss.',
    'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
    'https://www.nhs.uk/symptoms/vomiting-blood/'
  ),
  (
    'organ-ficat',
    'Organ mare aflat în principal în partea dreaptă de sus a abdomenului, sub diafragmă.',
    'A large organ located mainly in the upper-right abdomen, below the diaphragm.',
    'Produce bilă, prelucrează substanțele nutritive și participă la eliminarea sau transformarea multor substanțe din organism.',
    'Produces bile, processes nutrients, and helps remove or transform many substances in the body.',
    'Cere ajutor medical urgent dacă pielea sau albul ochilor devin galbene. Solicită consult și pentru urină foarte închisă, scaun foarte deschis, mâncărime persistentă sau durere repetată în dreapta sus a abdomenului.',
    'Seek urgent medical advice if the skin or whites of the eyes become yellow. Also seek assessment for very dark urine, very pale stools, persistent itching, or recurring upper-right abdominal pain.',
    'Solicită ajutor de urgență dacă apar confuzie sau somnolență neobișnuită, vărsături cu sânge, sângerare care nu se oprește, leșin ori durere abdominală severă cu stare generală foarte alterată.',
    'Seek emergency help for new confusion or unusual drowsiness, vomiting blood, bleeding that will not stop, fainting, or severe abdominal pain with marked illness.',
    'Întreabă despre îngălbenirea pielii sau ochilor, urină închisă, scaun deschis, mâncărime, durere în dreapta sus, greață, febră, alcool și medicamente.',
    'Ask about yellow skin or eyes, dark urine, pale stools, itching, upper-right pain, nausea, fever, alcohol use, and medicines.',
    'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
    'https://www.sps.nhs.uk/articles/assessing-liver-function-and-interpreting-liver-blood-tests/'
  ),
  (
    'organ-pancreas',
    'Glandă alungită aflată în partea superioară a abdomenului, în spatele stomacului.',
    'An elongated gland in the upper abdomen, behind the stomach.',
    'Produce enzime care ajută digestia și hormoni, inclusiv insulină, care contribuie la reglarea glicemiei.',
    'Produces enzymes that aid digestion and hormones, including insulin, that help regulate blood glucose.',
    'Cere consult pentru durere recurentă în partea superioară a abdomenului sau în spate, scădere neintenționată în greutate, scaune grase persistente ori simptome digestive care nu se ameliorează.',
    'Seek medical advice for recurring upper-abdominal or back pain, unintentional weight loss, persistent greasy stools, or digestive symptoms that do not improve.',
    'Solicită ajutor urgent pentru durere bruscă și severă în partea superioară a abdomenului, mai ales dacă se extinde spre spate sau apare cu vărsături, febră, puls rapid, dificultate la respirație ori icter.',
    'Seek urgent help for sudden severe upper-abdominal pain, especially if it spreads to the back or occurs with vomiting, fever, a fast heartbeat, breathing difficulty, or jaundice.',
    'Întreabă când a început durerea, dacă merge spre spate, dacă se agravează după masă și dacă există greață, vărsături, febră, icter ori scădere în greutate.',
    'Ask when the pain began, whether it spreads to the back, whether it worsens after eating, and whether there is nausea, vomiting, fever, jaundice, or weight loss.',
    'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
    'https://www.nhs.uk/conditions/acute-pancreatitis/'
  ),
  (
    'organ-intestine',
    'Intestinul subțire și intestinul gros formează cea mai lungă parte a tubului digestiv, între stomac și anus.',
    'The small and large intestines form the longest part of the digestive tract, between the stomach and anus.',
    'Intestinul subțire finalizează digestia și absoarbe majoritatea nutrienților, iar intestinul gros absoarbe apă și transformă resturile în scaun.',
    'The small intestine completes digestion and absorbs most nutrients, while the large intestine absorbs water and turns waste into stool.',
    'Cere consult pentru schimbări persistente ale tranzitului, diaree sau constipație care nu se ameliorează, sânge ori mucus în scaun sau scădere neintenționată în greutate.',
    'Seek medical advice for persistent bowel-habit changes, diarrhea or constipation that does not improve, blood or mucus in stool, or unintentional weight loss.',
    'Solicită ajutor urgent pentru durere abdominală severă sau în creștere, abdomen foarte umflat ori tare, vărsături repetate, imposibilitatea de a elimina gaze sau scaun, sângerare importantă, amețeală ori leșin.',
    'Seek urgent help for severe or worsening abdominal pain, a very swollen or rigid abdomen, repeated vomiting, inability to pass gas or stool, heavy bleeding, dizziness, or fainting.',
    'Întreabă unde este durerea, când a fost ultimul scaun și ultima eliminare de gaze și dacă există diaree, constipație, vărsături, febră, balonare ori sânge în scaun.',
    'Ask where the pain is, when stool and gas were last passed, and whether there is diarrhea, constipation, vomiting, fever, bloating, or blood in stool.',
    'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
    'https://www.niddk.nih.gov/health-information/digestive-diseases/abdominal-adhesions'
  ),
  (
    'organ-rinichi',
    'Două organe în formă de boabă, aflate în partea din spate a abdomenului, de o parte și de alta a coloanei.',
    'Two bean-shaped organs in the back of the abdomen, one on each side of the spine.',
    'Filtrează sângele, elimină deșeurile și apa în exces prin urină și ajută la echilibrul mineralelor și la controlul tensiunii arteriale.',
    'Filter the blood, remove waste and extra water in urine, and help balance minerals and control blood pressure.',
    'Cere evaluare medicală pentru sânge în urină, usturime sau urinări frecvente, umflarea picioarelor ori feței, modificarea cantității de urină sau durere persistentă în spate ori lateral.',
    'Seek medical assessment for blood in urine, painful or frequent urination, swelling of the legs or face, a change in urine output, or persistent back or side pain.',
    'Solicită ajutor medical urgent pentru durere de spate sau lateral însoțită de febră ori frisoane, vărsături, stare generală foarte alterată, confuzie sau lipsa urinei pe parcursul unei zile.',
    'Seek urgent medical help for back or side pain with fever or chills, vomiting, marked illness, confusion, or no urine for an entire day.',
    'Întreabă despre durerea de spate sau lateral, febră, frisoane, usturime, frecvența urinării, sânge în urină, greață, cantitatea de urină și antecedente de calculi.',
    'Ask about back or side pain, fever, chills, burning, urinary frequency, blood in urine, nausea, urine output, and a history of stones.',
    'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work',
    'https://www.nhs.uk/conditions/kidney-infection/'
  ),
  (
    'organ-vezica-urinara',
    'Organ muscular gol aflat în pelvis, care se umple pe măsură ce primește urină de la rinichi.',
    'A hollow muscular organ in the pelvis that fills as it receives urine from the kidneys.',
    'Stochează urina și o elimină prin uretră atunci când mușchiul vezicii se contractă și sfincterele se relaxează.',
    'Stores urine and releases it through the urethra when the bladder muscle contracts and the sphincters relax.',
    'Cere consult pentru usturime, urinări dese sau urgente, pierderi de urină, dificultatea de a porni jetul ori senzația că vezica nu s-a golit complet.',
    'Seek medical advice for burning, frequent or urgent urination, urine leakage, difficulty starting the stream, or a feeling that the bladder has not emptied completely.',
    'Solicită ajutor imediat dacă nu poți urina deloc, mai ales dacă există durere severă în partea de jos a abdomenului. Febra sau frisoanele cu durere de spate și simptome urinare necesită evaluare urgentă.',
    'Seek immediate help if you cannot urinate at all, especially with severe lower-abdominal pain. Fever or chills with back pain and urinary symptoms requires urgent assessment.',
    'Întreabă despre usturime, urinări dese sau urgente, dificultatea de a începe, golirea incompletă, pierderile de urină, sânge, febră și durerea din partea de jos a abdomenului.',
    'Ask about burning, frequent or urgent urination, difficulty starting, incomplete emptying, urine leakage, blood, fever, and lower-abdominal pain.',
    'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works',
    'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-retention/symptoms-causes'
  ),
  (
    'organ-splina',
    'Organ al sistemelor limfatic și sanguin, aflat în partea stângă de sus a abdomenului, sub coaste.',
    'An organ of the lymphatic and blood systems in the upper-left abdomen, beneath the ribs.',
    'Filtrează sângele, îndepărtează globulele roșii îmbătrânite sau deteriorate și contribuie la apărarea împotriva infecțiilor.',
    'Filters blood, removes old or damaged red blood cells, and contributes to defense against infection.',
    'Cere consult pentru disconfort persistent sub coastele stângi, senzația de sațietate după cantități mici de mâncare, oboseală neobișnuită, infecții repetate sau vânătăi ușoare.',
    'Seek medical advice for persistent discomfort beneath the left ribs, feeling full after small amounts of food, unusual fatigue, repeated infections, or easy bruising.',
    'După o lovitură sau cădere, durerea sub coastele stângi împreună cu amețeală, puls rapid, paloare ori leșin poate însemna sângerare internă și necesită ajutor de urgență.',
    'After an impact or fall, pain beneath the left ribs with dizziness, a rapid pulse, pallor, or fainting may indicate internal bleeding and requires emergency help.',
    'Întreabă dacă a existat o lovitură ori cădere, unde este durerea, dacă se extinde spre umărul stâng și dacă există amețeală, slăbiciune, sațietate rapidă, febră sau infecții repetate.',
    'Ask whether there was an impact or fall, where the pain is, whether it spreads to the left shoulder, and whether there is dizziness, weakness, early fullness, fever, or repeated infections.',
    'https://www.cancer.gov/publications/dictionaries/cancer-terms/def/spleen',
    'https://www.nhs.uk/tests-and-treatments/spleen-problems-and-spleen-removal/'
  );

create temporary table organ_source_catalog (
  title_en text not null,
  title_ro text not null,
  url text primary key,
  publisher text not null,
  source_type text not null,
  notes_en text not null,
  notes_ro text not null,
  content_provider text not null,
  content_license text not null
) on commit drop;

insert into organ_source_catalog values
  ('How the Heart Works - The Heart', 'Cum funcționează inima', 'https://www.nhlbi.nih.gov/health/heart', 'National Heart, Lung, and Blood Institute / NIH', 'government_medical_reference', 'Heart anatomy and function.', 'Anatomia și funcția inimii.', 'NHLBI / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('How the Lungs Work - The Lungs', 'Cum funcționează plămânii', 'https://www.nhlbi.nih.gov/health/lungs', 'National Heart, Lung, and Blood Institute / NIH', 'government_medical_reference', 'Lung anatomy, respiratory system and gas exchange.', 'Anatomia plămânilor, sistemul respirator și schimbul de gaze.', 'NHLBI / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('How the Lungs Work - What Breathing Does for the Body', 'Rolul respirației în organism', 'https://www.nhlbi.nih.gov/health/lungs/breathing-benefits', 'National Heart, Lung, and Blood Institute / NIH', 'government_medical_reference', 'Airflow through the trachea, bronchi and lungs.', 'Trecerea aerului prin trahee, bronhii și plămâni.', 'NHLBI / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('Your Digestive System & How it Works', 'Sistemul digestiv și modul în care funcționează', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'government_medical_reference', 'Anatomy and function of the esophagus, stomach, liver, pancreas and intestines.', 'Anatomia și funcția esofagului, stomacului, ficatului, pancreasului și intestinelor.', 'NIDDK / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('Your Kidneys & How They Work', 'Rinichii și modul în care funcționează', 'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'government_medical_reference', 'Kidney anatomy, filtration and urine formation.', 'Anatomia rinichilor, filtrarea și formarea urinei.', 'NIDDK / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('The Urinary Tract & How It Works', 'Tractul urinar și modul în care funcționează', 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'government_medical_reference', 'Urinary tract and bladder storage and emptying.', 'Tractul urinar și stocarea și golirea vezicii.', 'NIDDK / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('Definition of spleen - NCI Dictionary of Cancer Terms', 'Definiția splinei - Dicționarul NCI', 'https://www.cancer.gov/publications/dictionaries/cancer-terms/def/spleen', 'National Cancer Institute / NIH', 'government_medical_dictionary', 'Spleen location and function in the blood and lymphatic systems.', 'Localizarea și funcția splinei în sistemele sanguin și limfatic.', 'National Cancer Institute / NIH', 'NCI information may be reused with attribution; graphics require separate rights checks'),
  ('Chest pain', 'Durere în piept', 'https://www.nhs.uk/symptoms/chest-pain/', 'NHS', 'government_patient_guidance', 'Emergency warning signs associated with chest pain.', 'Semne de urgență asociate durerii în piept.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Shortness of breath', 'Lipsă de aer', 'https://www.nhs.uk/symptoms/shortness-of-breath/', 'NHS', 'government_patient_guidance', 'Emergency and non-emergency breathlessness guidance.', 'Ghidaj pentru lipsa de aer urgentă și non-urgentă.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('First aid', 'Prim ajutor', 'https://www.nhs.uk/tests-and-treatments/first-aid/', 'NHS', 'government_patient_guidance', 'Recognition and immediate response for severe choking.', 'Recunoașterea și răspunsul imediat în înecarea severă.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Dysphagia (swallowing problems)', 'Disfagie (probleme la înghițire)', 'https://www.nhs.uk/symptoms/swallowing-problems-dysphagia/', 'NHS', 'government_patient_guidance', 'Swallowing difficulty symptoms and medical assessment.', 'Simptomele dificultății la înghițire și evaluarea medicală.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Vomiting blood', 'Vărsături cu sânge', 'https://www.nhs.uk/symptoms/vomiting-blood/', 'NHS', 'government_patient_guidance', 'Urgent guidance for vomiting blood.', 'Ghidaj urgent pentru vărsături cu sânge.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Assessing liver function and interpreting liver blood tests', 'Evaluarea funcției ficatului și interpretarea analizelor hepatice', 'https://www.sps.nhs.uk/articles/assessing-liver-function-and-interpreting-liver-blood-tests/', 'NHS Specialist Pharmacy Service', 'government_professional_guidance', 'Liver dysfunction symptoms, urgent referral and limitations of liver tests.', 'Simptomele disfuncției hepatice, trimiterea urgentă și limitele analizelor hepatice.', 'NHS Specialist Pharmacy Service', 'Citation and original paraphrase only; verify page-specific terms before redistribution'),
  ('Acute pancreatitis', 'Pancreatită acută', 'https://www.nhs.uk/conditions/acute-pancreatitis/', 'NHS', 'government_patient_guidance', 'Urgent and emergency warning signs for acute pancreatitis.', 'Semne urgente și de urgență pentru pancreatita acută.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Symptoms & Causes of GI Bleeding', 'Simptomele și cauzele sângerării digestive', 'https://www.niddk.nih.gov/health-information/digestive-diseases/gastrointestinal-bleeding/symptoms-causes', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'government_patient_guidance', 'Visible and occult gastrointestinal bleeding warning signs.', 'Semne de sângerare digestivă vizibilă și ascunsă.', 'NIDDK / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('Abdominal Adhesions', 'Aderențe abdominale', 'https://www.niddk.nih.gov/health-information/digestive-diseases/abdominal-adhesions', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'government_patient_guidance', 'Urgent symptoms of intestinal obstruction.', 'Simptome urgente ale obstrucției intestinale.', 'NIDDK / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('Kidney infection', 'Infecție renală', 'https://www.nhs.uk/conditions/kidney-infection/', 'NHS', 'government_patient_guidance', 'Urgent kidney infection symptoms and escalation guidance.', 'Simptome urgente de infecție renală și recomandări de escaladare.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Symptoms & Causes of Urinary Retention', 'Simptomele și cauzele retenției urinare', 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-retention/symptoms-causes', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'government_patient_guidance', 'Immediate assessment for inability to urinate and severe abdominal pain.', 'Evaluare imediată pentru imposibilitatea de a urina și durere abdominală severă.', 'NIDDK / NIH', 'US federal government content; public domain unless otherwise noted'),
  ('Urinary tract infections (UTIs)', 'Infecții ale tractului urinar', 'https://www.nhs.uk/conditions/urinary-tract-infections-utis/', 'NHS', 'government_patient_guidance', 'Urinary symptoms and signs requiring urgent medical advice.', 'Simptome urinare și semne care necesită sfat medical urgent.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Spleen problems and spleen removal', 'Probleme ale splinei și îndepărtarea splinei', 'https://www.nhs.uk/tests-and-treatments/spleen-problems-and-spleen-removal/', 'NHS', 'government_patient_guidance', 'Symptoms of spleen enlargement and emergency signs after splenic injury.', 'Simptomele splinei mărite și semnele de urgență după traumatism splenic.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Jaundice', 'Icter', 'https://www.nhs.uk/conditions/jaundice/', 'NHS', 'government_patient_guidance', 'Urgent medical advice for yellow skin or eyes.', 'Sfat medical urgent pentru îngălbenirea pielii sau a ochilor.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated'),
  ('Coughing up blood', 'Tuse cu sânge', 'https://www.nhs.uk/symptoms/coughing-up-blood/', 'NHS', 'government_patient_guidance', 'Prompt assessment for coughing up blood.', 'Evaluare promptă pentru tuse cu sânge.', 'NHS', 'NHS website content; Open Government Licence v3.0 except where otherwise stated');

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
  review_status,
  content_provider,
  content_license,
  reuse_notes_ro,
  reuse_notes_en
)
select
  source.title_en,
  source.title_ro,
  source.url,
  source.publisher,
  source.source_type,
  source.notes_en,
  source.notes_ro,
  'en',
  date '2026-06-24',
  true,
  'verified',
  source.content_provider,
  source.content_license,
  'Santix păstrează o parafrazare originală și citarea. Nu sunt copiate imagini, sigle sau pasaje extinse.',
  'Santix stores an original paraphrase and citation. No images, logos, or extended passages are copied.'
from organ_source_catalog source
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
  content_provider = excluded.content_provider,
  content_license = excluded.content_license,
  reuse_notes_ro = excluded.reuse_notes_ro,
  reuse_notes_en = excluded.reuse_notes_en,
  updated_at = now();

update public.organs organ
set
  description_ro = catalog.description_ro,
  description_en = catalog.description_en,
  function_ro = catalog.function_ro,
  function_en = catalog.function_en,
  updated_at = now()
from organ_medical_catalog catalog
where organ.slug = catalog.structure_slug;

update public.anatomy_structures structure
set
  description_ro = catalog.description_ro,
  description_en = catalog.description_en,
  function_ro = catalog.function_ro,
  function_en = catalog.function_en,
  updated_at = now()
from organ_medical_catalog catalog
where structure.slug = catalog.structure_slug;

with ranked as (
  select
    id,
    row_number() over (
      partition by structure_slug, category
      order by updated_at desc, created_at desc, id
    ) as row_number
  from public.ai_knowledge_entries
  where tissue = 'organ'
    and structure_slug in (select structure_slug from organ_medical_catalog)
)
delete from public.ai_knowledge_entries knowledge
using ranked
where knowledge.id = ranked.id
  and ranked.row_number > 1;

with desired as (
  select
    structure.*,
    category.category,
    category.title_ro,
    category.content_ro,
    category.title_en,
    category.content_en,
    category.priority,
    case
      when category.category = 'anatomie'::public.knowledge_category
        then catalog.anatomy_source_url
      else catalog.triage_source_url
    end as primary_source_url
  from organ_medical_catalog catalog
  join public.anatomy_structures structure on structure.slug = catalog.structure_slug
  cross join lateral (
    values
      (
        'anatomie'::public.knowledge_category,
        'Context anatomic: ' || structure.popular_name_ro,
        catalog.description_ro || ' Funcție principală: ' || catalog.function_ro ||
          case when structure.latin_name is not null then ' Denumire latină: ' || structure.latin_name || '.' else '' end,
        'Anatomical context: ' || structure.popular_name_en,
        catalog.description_en || ' Main function: ' || catalog.function_en ||
          case when structure.latin_name is not null then ' Latin name: ' || structure.latin_name || '.' else '' end,
        8::smallint
      ),
      (
        'recomandari'::public.knowledge_category,
        'Când să ceri sfat medical: ' || structure.popular_name_ro,
        catalog.doctor_when_ro,
        'When to seek medical advice: ' || structure.popular_name_en,
        catalog.doctor_when_en,
        8::smallint
      ),
      (
        'semne_alarma'::public.knowledge_category,
        'Semne de alarmă: ' || structure.popular_name_ro,
        catalog.emergency_signs_ro,
        'Warning signs: ' || structure.popular_name_en,
        catalog.emergency_signs_en,
        10::smallint
      ),
      (
        'intrebari_clarificare'::public.knowledge_category,
        'Întrebări utile: ' || structure.popular_name_ro,
        catalog.questions_ro,
        'Useful questions: ' || structure.popular_name_en,
        catalog.questions_en,
        8::smallint
      )
  ) as category(category, title_ro, content_ro, title_en, content_en, priority)
),
updated as (
  update public.ai_knowledge_entries knowledge
  set
    model_selection_id = desired.model_selection_id,
    body_region = desired.body_region,
    title_ro = desired.title_ro,
    content_ro = desired.content_ro,
    title_en = desired.title_en,
    content_en = desired.content_en,
    display_name_ro = desired.popular_name_ro,
    display_name_en = desired.popular_name_en,
    priority = desired.priority,
    source_id = source.id,
    tags = array['organ', desired.body_region, desired.slug, desired.category::text, 'evidence-reviewed'],
    metadata = coalesce(knowledge.metadata, '{}'::jsonb) || jsonb_build_object(
      'seed', 'organ_evidence_v2',
      'medical_review_status', 'evidence_reviewed_not_clinician_verified',
      'source_url', desired.primary_source_url,
      'reviewed_at', '2026-06-24'
    ),
    active = true,
    updated_at = now()
  from desired
  join public.medical_sources source on source.url = desired.primary_source_url
  where knowledge.tissue = 'organ'
    and knowledge.structure_slug = desired.slug
    and knowledge.category = desired.category
  returning knowledge.id
)
insert into public.ai_knowledge_entries (
  tissue,
  structure_slug,
  model_selection_id,
  body_region,
  category,
  title_ro,
  content_ro,
  title_en,
  content_en,
  display_name_ro,
  display_name_en,
  priority,
  source_id,
  tags,
  metadata,
  active
)
select
  'organ'::public.tissue_type,
  desired.slug,
  desired.model_selection_id,
  desired.body_region,
  desired.category,
  desired.title_ro,
  desired.content_ro,
  desired.title_en,
  desired.content_en,
  desired.popular_name_ro,
  desired.popular_name_en,
  desired.priority,
  source.id,
  array['organ', desired.body_region, desired.slug, desired.category::text, 'evidence-reviewed'],
  jsonb_build_object(
    'seed', 'organ_evidence_v2',
    'medical_review_status', 'evidence_reviewed_not_clinician_verified',
    'source_url', desired.primary_source_url,
    'reviewed_at', '2026-06-24'
  ),
  true
from desired
join public.medical_sources source on source.url = desired.primary_source_url
where not exists (
  select 1
  from public.ai_knowledge_entries knowledge
  where knowledge.tissue = 'organ'
    and knowledge.structure_slug = desired.slug
    and knowledge.category = desired.category
);

delete from public.anatomy_structure_sources link
using public.anatomy_structures structure
where link.structure_id = structure.id
  and structure.slug in (select structure_slug from organ_medical_catalog);

insert into public.anatomy_structure_sources (
  structure_id,
  source_id,
  evidence_scope,
  is_primary,
  source_checked_at,
  review_status,
  notes_ro,
  notes_en
)
select
  structure.id,
  source.id,
  source_role.evidence_scope,
  true,
  date '2026-06-24',
  'mapped',
  case source_role.evidence_scope
    when 'anatomy_function' then 'Sursă principală pentru anatomie și funcție; conținutul Santix este parafrazat original.'
    else 'Sursă principală pentru nivelul de urgență și momentul solicitării ajutorului medical.'
  end,
  case source_role.evidence_scope
    when 'anatomy_function' then 'Primary anatomy and function source; Santix content is an original paraphrase.'
    else 'Primary source for urgency level and when to seek medical help.'
  end
from organ_medical_catalog catalog
join public.anatomy_structures structure on structure.slug = catalog.structure_slug
cross join lateral (
  values
    ('anatomy_function', catalog.anatomy_source_url),
    ('triage', catalog.triage_source_url)
) as source_role(evidence_scope, source_url)
join public.medical_sources source on source.url = source_role.source_url;

with supporting(structure_slug, source_url, notes_ro, notes_en) as (
  values
    ('organ-plamani', 'https://www.nhs.uk/symptoms/coughing-up-blood/', 'Susține recomandarea de evaluare promptă pentru tuse cu sânge.', 'Supports prompt assessment for coughing up blood.'),
    ('organ-esofag', 'https://www.nhs.uk/tests-and-treatments/first-aid/', 'Susține escaladarea imediată în caz de sufocare severă.', 'Supports immediate escalation for severe choking.'),
    ('organ-stomac', 'https://www.niddk.nih.gov/health-information/digestive-diseases/gastrointestinal-bleeding/symptoms-causes', 'Susține semnele de sângerare digestivă.', 'Supports gastrointestinal bleeding warning signs.'),
    ('organ-ficat', 'https://www.nhs.uk/conditions/jaundice/', 'Susține necesitatea sfatului medical urgent pentru icter.', 'Supports urgent medical advice for jaundice.'),
    ('organ-intestine', 'https://www.niddk.nih.gov/health-information/digestive-diseases/gastrointestinal-bleeding/symptoms-causes', 'Susține semnele de sângerare intestinală.', 'Supports intestinal bleeding warning signs.'),
    ('organ-vezica-urinara', 'https://www.nhs.uk/conditions/urinary-tract-infections-utis/', 'Susține simptomele urinare și escaladarea în prezența febrei sau durerii de spate.', 'Supports urinary symptoms and escalation with fever or back pain.')
)
insert into public.anatomy_structure_sources (
  structure_id,
  source_id,
  evidence_scope,
  is_primary,
  source_checked_at,
  review_status,
  notes_ro,
  notes_en
)
select
  structure.id,
  source.id,
  'supporting',
  false,
  date '2026-06-24',
  'mapped',
  supporting.notes_ro,
  supporting.notes_en
from supporting
join public.anatomy_structures structure on structure.slug = supporting.structure_slug
join public.medical_sources source on source.url = supporting.source_url
on conflict (structure_id, source_id) do update set
  evidence_scope = excluded.evidence_scope,
  is_primary = false,
  source_checked_at = excluded.source_checked_at,
  review_status = excluded.review_status,
  notes_ro = excluded.notes_ro,
  notes_en = excluded.notes_en,
  updated_at = now();

delete from public.ai_knowledge_sources link
using public.ai_knowledge_entries knowledge
where link.knowledge_entry_id = knowledge.id
  and knowledge.tissue = 'organ'
  and knowledge.structure_slug in (select structure_slug from organ_medical_catalog);

insert into public.ai_knowledge_sources (
  knowledge_entry_id,
  source_id,
  is_primary,
  evidence_scope,
  source_checked_at,
  review_status
)
select
  knowledge.id,
  source.id,
  true,
  case
    when knowledge.category = 'anatomie' then 'anatomy'
    else 'primary'
  end,
  date '2026-06-24',
  'mapped'
from public.ai_knowledge_entries knowledge
join organ_medical_catalog catalog on catalog.structure_slug = knowledge.structure_slug
join public.medical_sources source on source.url = case
  when knowledge.category = 'anatomie' then catalog.anatomy_source_url
  else catalog.triage_source_url
end
where knowledge.tissue = 'organ'
  and knowledge.active = true;

with supporting(structure_slug, source_url) as (
  values
    ('organ-plamani', 'https://www.nhs.uk/symptoms/coughing-up-blood/'),
    ('organ-esofag', 'https://www.nhs.uk/tests-and-treatments/first-aid/'),
    ('organ-stomac', 'https://www.niddk.nih.gov/health-information/digestive-diseases/gastrointestinal-bleeding/symptoms-causes'),
    ('organ-ficat', 'https://www.nhs.uk/conditions/jaundice/'),
    ('organ-intestine', 'https://www.niddk.nih.gov/health-information/digestive-diseases/gastrointestinal-bleeding/symptoms-causes'),
    ('organ-vezica-urinara', 'https://www.nhs.uk/conditions/urinary-tract-infections-utis/')
)
insert into public.ai_knowledge_sources (
  knowledge_entry_id,
  source_id,
  is_primary,
  evidence_scope,
  source_checked_at,
  review_status
)
select
  knowledge.id,
  source.id,
  false,
  'supporting',
  date '2026-06-24',
  'mapped'
from supporting
join public.ai_knowledge_entries knowledge
  on knowledge.structure_slug = supporting.structure_slug
 and knowledge.tissue = 'organ'
 and knowledge.category in ('recomandari', 'semne_alarma', 'intrebari_clarificare')
 and knowledge.active = true
join public.medical_sources source on source.url = supporting.source_url
on conflict (knowledge_entry_id, source_id) do update set
  is_primary = false,
  evidence_scope = 'supporting',
  source_checked_at = excluded.source_checked_at,
  review_status = excluded.review_status;

update public.medical_sources source
set
  active = false,
  review_status = 'archived',
  notes_ro = 'Înlocuită pentru catalogul organelor cu sursa oficială NCI. Nu este folosită ca dovadă activă pentru organele Santix.',
  notes_en = 'Replaced for the organ catalog by the official NCI source. It is not used as active evidence for Santix organs.',
  updated_at = now()
where source.url = 'https://www.ncbi.nlm.nih.gov/books/NBK482235/'
  and not exists (
    select 1
    from public.ai_knowledge_sources link
    where link.source_id = source.id
  )
  and not exists (
    select 1
    from public.anatomy_structure_sources link
    where link.source_id = source.id
  );

do $$
begin
  if (
    select count(*)
    from public.anatomy_structures
    where tissue = 'organ'
      and slug in (select structure_slug from organ_medical_catalog)
  ) <> 11 then
    raise exception 'Catalogul medical verificat nu acoperă exact 11 organe.';
  end if;

  if exists (
    select 1
    from public.anatomy_structures structure
    where structure.slug in (select structure_slug from organ_medical_catalog)
      and (
        nullif(btrim(structure.description_ro), '') is null
        or nullif(btrim(structure.description_en), '') is null
        or nullif(btrim(structure.function_ro), '') is null
        or nullif(btrim(structure.function_en), '') is null
      )
  ) then
    raise exception 'Există organe cu descrieri sau funcții bilingve incomplete.';
  end if;

  if exists (
    select 1
    from organ_medical_catalog catalog
    where (
      select count(distinct link.evidence_scope)
      from public.anatomy_structure_sources link
      join public.anatomy_structures structure on structure.id = link.structure_id
      where structure.slug = catalog.structure_slug
        and link.is_primary = true
        and link.review_status = 'mapped'
        and link.evidence_scope in ('anatomy_function', 'triage')
    ) <> 2
  ) then
    raise exception 'Fiecare organ trebuie să aibă surse principale separate pentru anatomie și triaj.';
  end if;

  if (
    select count(*)
    from public.ai_knowledge_entries
    where tissue = 'organ'
      and active = true
      and structure_slug in (select structure_slug from organ_medical_catalog)
      and category in ('anatomie', 'recomandari', 'semne_alarma', 'intrebari_clarificare')
  ) <> 44 then
    raise exception 'Catalogul AI pentru organe trebuie să conțină exact 44 de intrări active.';
  end if;

  if exists (
    select 1
    from public.anatomy_structure_sources link
    join public.anatomy_structures structure on structure.id = link.structure_id
    join public.medical_sources source on source.id = link.source_id
    where structure.slug in (select structure_slug from organ_medical_catalog)
      and source.url like '%medlineplus.gov/ency/%'
  ) then
    raise exception 'Catalogul organelor nu poate utiliza pagini MedlinePlus A.D.A.M.';
  end if;

  if exists (
    select 1
    from public.anatomy_structure_sources link
    join public.anatomy_structures structure on structure.id = link.structure_id
    where structure.slug in (select structure_slug from organ_medical_catalog)
      and link.review_status = 'clinically_verified'
  ) then
    raise exception 'Sursele nu pot fi marcate clinician_verified fără validare clinică externă.';
  end if;
end $$;

comment on table public.anatomy_structure_sources is
  'Legături verificabile între structurile anatomice Santix și sursele medicale, separate pe anatomie/funcție, triaj și suport.';

comment on column public.medical_sources.content_license is
  'Rezumat operațional al condițiilor de reutilizare; Santix păstrează parafrazări originale și citări, fără a copia media sursei.';

commit;
