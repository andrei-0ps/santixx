begin;

do $$
declare
  v_has_medical_name boolean;
  v_has_scientific_name boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conditions'
      and column_name = 'medical_name'
  ) into v_has_medical_name;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conditions'
      and column_name = 'scientific_name'
  ) into v_has_scientific_name;

  if v_has_medical_name and not v_has_scientific_name then
    execute 'alter table public.conditions rename column medical_name to scientific_name';
  elsif v_has_medical_name and v_has_scientific_name then
    execute '
      update public.conditions
      set scientific_name = coalesce(
        nullif(trim(scientific_name), ''''),
        nullif(trim(medical_name), '''')
      )
    ';
    execute 'alter table public.conditions drop column medical_name';
  elsif not v_has_scientific_name then
    execute 'alter table public.conditions add column scientific_name text';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conditions'
      and column_name = 'medical_name_en'
  ) then
    execute '
      update public.conditions
      set scientific_name = coalesce(
        nullif(trim(scientific_name), ''''),
        nullif(trim(medical_name_en), '''')
      )
    ';
    execute 'alter table public.conditions drop column medical_name_en';
  end if;
end $$;

alter table public.conditions
  add column if not exists name_en text,
  add column if not exists description_en text,
  add column if not exists educational_note_en text,
  add column if not exists condition_category text,
  add column if not exists aliases_ro text[],
  add column if not exists aliases_en text[],
  add column if not exists keywords_ro text[],
  add column if not exists keywords_en text[],
  add column if not exists typical_duration_ro text,
  add column if not exists typical_duration_en text,
  add column if not exists common_causes_ro text,
  add column if not exists common_causes_en text,
  add column if not exists self_care_ro text,
  add column if not exists self_care_en text,
  add column if not exists doctor_when_ro text,
  add column if not exists doctor_when_en text,
  add column if not exists emergency_signs_ro text,
  add column if not exists emergency_signs_en text,
  add column if not exists prevention_ro text,
  add column if not exists prevention_en text,
  add column if not exists icd10_code text,
  add column if not exists snomed_ct_id text,
  add column if not exists triage_priority smallint,
  add column if not exists active boolean,
  add column if not exists review_status text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

update public.conditions
set
  condition_category = coalesce(
    nullif(trim(condition_category), ''),
    case
      when tissue in ('muschi', 'tendon', 'os', 'articulatie') then 'musculoskeletal'
      else 'general'
    end
  ),
  educational_note_en = coalesce(
    nullif(trim(educational_note_en), ''),
    'Educational information only. This content does not provide a diagnosis and does not replace evaluation by a qualified healthcare professional.'
  ),
  aliases_ro = coalesce(aliases_ro, '{}'),
  aliases_en = coalesce(aliases_en, '{}'),
  keywords_ro = coalesce(keywords_ro, '{}'),
  keywords_en = coalesce(keywords_en, '{}'),
  triage_priority = coalesce(
    triage_priority,
    case default_level
      when 'consultare_doctor' then 8
      when 'mediu' then 5
      else 3
    end
  ),
  active = coalesce(active, true),
  review_status = coalesce(nullif(trim(review_status), ''), 'needs_review')
where true;

alter table public.conditions
  alter column educational_note_en
    set default 'Educational information only. This content does not provide a diagnosis and does not replace evaluation by a qualified healthcare professional.',
  alter column educational_note_en set not null,
  alter column condition_category set default 'general',
  alter column condition_category set not null,
  alter column aliases_ro set default '{}',
  alter column aliases_ro set not null,
  alter column aliases_en set default '{}',
  alter column aliases_en set not null,
  alter column keywords_ro set default '{}',
  alter column keywords_ro set not null,
  alter column keywords_en set default '{}',
  alter column keywords_en set not null,
  alter column triage_priority set default 5,
  alter column triage_priority set not null,
  alter column active set default true,
  alter column active set not null,
  alter column review_status set default 'needs_review',
  alter column review_status set not null;

update public.conditions
set
  name_ro = 'Crampă musculară',
  name_en = 'Muscle cramp',
  scientific_name = 'Muscle cramp',
  description_ro = 'Contracție bruscă, involuntară și dureroasă a unuia sau mai multor mușchi, care poate dura de la câteva secunde la câteva minute.',
  description_en = 'A sudden, involuntary and painful contraction of one or more muscles that may last from a few seconds to several minutes.',
  educational_note_ro = 'Informație educațională, nu diagnostic. Crampele recurente, severe sau asociate cu alte simptome necesită evaluarea cauzei.',
  educational_note_en = 'Educational information, not a diagnosis. Recurrent or severe cramps, or cramps associated with other symptoms, require assessment of the underlying cause.',
  condition_category = 'muscle_function',
  aliases_ro = array['spasm muscular dureros', 'cârcel'],
  aliases_en = array['painful muscle spasm', 'charley horse'],
  keywords_ro = array['crampă', 'cârcel', 'spasm', 'contracție involuntară', 'durere musculară'],
  keywords_en = array['cramp', 'muscle spasm', 'involuntary contraction', 'muscle pain'],
  typical_duration_ro = 'De obicei câteva secunde până la câteva minute; sensibilitatea locală poate persista după episod.',
  typical_duration_en = 'Usually a few seconds to several minutes; local soreness may persist after the episode.',
  common_causes_ro = 'Efortul, oboseala musculară, menținerea prelungită a unei poziții, căldura și uneori pierderea de lichide sau electroliți pot contribui; unele crampe nu au o cauză evidentă.',
  common_causes_en = 'Exertion, muscle fatigue, prolonged positioning, heat and sometimes fluid or electrolyte loss may contribute; some cramps have no obvious cause.',
  self_care_ro = 'Oprește temporar activitatea, întinde blând și masează mușchiul afectat. Reia mișcarea gradual și hidratează-te adecvat contextului.',
  self_care_en = 'Pause the activity, gently stretch and massage the affected muscle. Resume movement gradually and maintain hydration appropriate to the situation.',
  doctor_when_ro = 'Cere sfat medical dacă episoadele sunt frecvente, prelungite, foarte dureroase, apar fără explicație sau sunt asociate cu slăbiciune, umflare ori modificări după începerea unui medicament.',
  doctor_when_en = 'Seek medical advice if episodes are frequent, prolonged, very painful, unexplained, or associated with weakness, swelling or changes after starting a medicine.',
  emergency_signs_ro = 'Solicită evaluare rapidă pentru crampă asociată cu umflare, roșeață și căldură la un singur membru, slăbiciune marcată, confuzie, dificultăți de respirație sau urină foarte închisă după efort intens.',
  emergency_signs_en = 'Seek urgent assessment for a cramp associated with one-sided limb swelling, redness and warmth, marked weakness, confusion, breathing difficulty or very dark urine after intense exertion.',
  prevention_ro = 'Crește gradual intensitatea efortului, include pauze și recuperare și menține un aport adecvat de lichide. Nu lua suplimente doar pe baza presupunerii că orice crampă înseamnă deficit de magneziu.',
  prevention_en = 'Increase exercise intensity gradually, include rest and recovery, and maintain adequate fluid intake. Do not take supplements solely on the assumption that every cramp indicates magnesium deficiency.',
  triage_priority = 3,
  active = true,
  review_status = 'needs_review',
  reviewed_at = null,
  reviewed_by = null,
  updated_at = now()
where slug = 'crampa-musculara';

update public.conditions
set
  name_ro = 'Contractură musculară',
  name_en = 'Muscle contracture',
  scientific_name = 'Muscle contracture',
  description_ro = 'Scurtare și rigidizare persistentă a mușchiului sau a unității mușchi-tendon, care reduce amplitudinea normală a mișcării și nu este echivalentă cu o crampă trecătoare.',
  description_en = 'Persistent shortening and stiffness of a muscle or muscle-tendon unit that restricts the normal range of motion and is not the same as a temporary cramp.',
  educational_note_ro = 'Informație educațională, nu diagnostic. Termenul „contractură” este folosit uneori informal pentru tensiune musculară, dar sensul clinic standard implică o limitare persistentă a mișcării.',
  educational_note_en = 'Educational information, not a diagnosis. The word contracture is sometimes used informally for muscle tightness, but its standard clinical meaning involves persistent restriction of movement.',
  condition_category = 'muscle_function',
  aliases_ro = array['scurtare musculară persistentă', 'rigiditate musculară fixă'],
  aliases_en = array['fixed muscle shortening', 'persistent muscle contracture'],
  keywords_ro = array['contractură', 'rigiditate', 'scurtare musculară', 'mobilitate redusă', 'limitare persistentă'],
  keywords_en = array['contracture', 'stiffness', 'muscle shortening', 'reduced range of motion', 'persistent limitation'],
  typical_duration_ro = 'Persistentă; durata depinde de cauză și de tratamentul afecțiunii de bază.',
  typical_duration_en = 'Persistent; duration depends on the cause and management of the underlying condition.',
  common_causes_ro = 'Imobilizarea prelungită, cicatrizarea, afectarea neurologică și modificările structurale ale mușchilor sau tendoanelor pot produce contractură.',
  common_causes_en = 'Prolonged immobilisation, scarring, neurological impairment and structural changes in muscles or tendons can cause contracture.',
  self_care_ro = 'Nu forța articulația sau mușchiul. Mișcarea blândă în limita confortului poate fi utilă, dar un plan de stretching sau recuperare trebuie adaptat cauzei.',
  self_care_en = 'Do not force the joint or muscle. Gentle movement within a comfortable range may help, but stretching or rehabilitation should be tailored to the cause.',
  doctor_when_ro = 'Este recomandată evaluarea medicală când limitarea persistă, se agravează, afectează activitățile zilnice sau apare după imobilizare, accident vascular cerebral, traumatism ori intervenție.',
  doctor_when_en = 'Medical evaluation is recommended when the restriction persists, worsens, affects daily activities, or develops after immobilisation, stroke, trauma or surgery.',
  emergency_signs_ro = 'Cere evaluare urgentă dacă rigiditatea apare după traumatism și este însoțită de durere severă, umflare rapidă, amorțeală, slăbiciune sau un membru rece ori palid.',
  emergency_signs_en = 'Seek urgent assessment if stiffness follows trauma and is accompanied by severe pain, rapidly increasing swelling, numbness, weakness, or a cold or pale limb.',
  prevention_ro = 'În perioadele de imobilizare, urmează recomandările medicale privind poziționarea și mobilizarea sigură. Menținerea mobilității trebuie adaptată afecțiunii de bază.',
  prevention_en = 'During immobilisation, follow clinical advice on positioning and safe movement. Mobility maintenance must be adapted to the underlying condition.',
  icd10_code = 'M62.4',
  triage_priority = 5,
  active = true,
  review_status = 'needs_review',
  reviewed_at = null,
  reviewed_by = null,
  updated_at = now()
where slug = 'contractura-musculara';

update public.conditions
set
  name_ro = 'Ruptură musculară',
  name_en = 'Muscle rupture',
  scientific_name = 'Muscle rupture',
  description_ro = 'Rupere parțială sau completă a fibrelor musculare, de obicei după o contracție puternică, o întindere bruscă ori un traumatism, cu durere, pierdere de forță și uneori umflare sau vânătaie.',
  description_en = 'A partial or complete tear of muscle fibres, usually after forceful contraction, sudden overstretching or trauma, causing pain, loss of strength and sometimes swelling or bruising.',
  educational_note_ro = 'Informație educațională, nu diagnostic. O ruptură nu poate fi confirmată doar din simptome; examenul clinic și uneori imagistica stabilesc severitatea.',
  educational_note_en = 'Educational information, not a diagnosis. A rupture cannot be confirmed from symptoms alone; clinical examination and sometimes imaging determine its severity.',
  condition_category = 'acute_muscle_injury',
  aliases_ro = array['ruptură de mușchi', 'ruptură de fibre musculare', 'leziune musculară grad înalt'],
  aliases_en = array['muscle tear', 'torn muscle', 'high-grade muscle injury'],
  keywords_ro = array['ruptură', 'pocnet', 'vânătaie', 'umflare', 'pierdere de forță', 'durere bruscă'],
  keywords_en = array['rupture', 'tear', 'pop', 'bruising', 'swelling', 'loss of strength', 'sudden pain'],
  typical_duration_ro = 'Vindecarea poate dura de la câteva săptămâni la câteva luni, în funcție de localizare, întindere și tratament.',
  typical_duration_en = 'Recovery may take several weeks to several months, depending on location, extent and treatment.',
  common_causes_ro = 'Sprintul, schimbarea bruscă de direcție, ridicarea unei greutăți mari, contracția explozivă sau impactul direct pot produce o ruptură.',
  common_causes_en = 'Sprinting, sudden direction changes, heavy lifting, explosive contraction or direct impact can cause a rupture.',
  self_care_ro = 'Oprește activitatea, protejează zona și evită încărcarea sau întinderea forțată. Poți aplica rece printr-un material textil pentru perioade scurte până la evaluare.',
  self_care_en = 'Stop the activity, protect the area and avoid loading or forceful stretching. A wrapped cold pack may be used for short periods while awaiting assessment.',
  doctor_when_ro = 'Este recomandată evaluarea medicală promptă pentru durere bruscă importantă, pocnet, vânătaie extinsă, deformare sau pierdere evidentă de forță.',
  doctor_when_en = 'Prompt medical evaluation is recommended for substantial sudden pain, a popping sensation, extensive bruising, deformity or obvious loss of strength.',
  emergency_signs_ro = 'Solicită ajutor urgent dacă nu poți folosi membrul, umflarea crește rapid, durerea este disproporționat de mare, apare amorțeală sau zona distală devine rece ori palidă.',
  emergency_signs_en = 'Seek urgent help if the limb cannot be used, swelling increases rapidly, pain is out of proportion, numbness develops, or the area beyond the injury becomes cold or pale.',
  prevention_ro = 'Crește gradual intensitatea antrenamentului, recuperează-te adecvat și evită efortul exploziv când mușchii sunt obosiți sau insuficient pregătiți.',
  prevention_en = 'Increase training intensity gradually, allow adequate recovery, and avoid explosive effort when muscles are fatigued or insufficiently prepared.',
  icd10_code = null,
  triage_priority = 8,
  active = true,
  review_status = 'needs_review',
  reviewed_at = null,
  reviewed_by = null,
  updated_at = now()
where slug = 'ruptura-musculara';

update public.conditions
set
  name_ro = 'Întindere musculară',
  name_en = 'Muscle strain',
  scientific_name = 'Muscle strain',
  description_ro = 'Leziune în care fibrele musculare sunt suprasolicitate, întinse excesiv sau rupte parțial, cel mai frecvent în timpul efortului ori al unei mișcări bruște.',
  description_en = 'An injury in which muscle fibres are overloaded, overstretched or partially torn, most often during exertion or a sudden movement.',
  educational_note_ro = 'Informație educațională, nu diagnostic. Severitatea întinderii variază, iar durerea importantă, pierderea de forță sau imposibilitatea de folosire a zonei necesită evaluare.',
  educational_note_en = 'Educational information, not a diagnosis. Strains vary in severity, and substantial pain, loss of strength or inability to use the area requires assessment.',
  condition_category = 'acute_muscle_injury',
  aliases_ro = array['leziune musculară prin întindere', 'mușchi întins', 'elongare musculară'],
  aliases_en = array['pulled muscle', 'muscle fibre strain', 'muscle overstretch injury'],
  keywords_ro = array['întindere', 'elongare', 'durere la mișcare', 'suprasolicitare', 'spasm', 'umflare'],
  keywords_en = array['strain', 'pulled muscle', 'pain with movement', 'overuse', 'spasm', 'swelling'],
  typical_duration_ro = 'Formele ușoare se pot ameliora în zile sau săptămâni; leziunile mai importante necesită recuperare mai lungă.',
  typical_duration_en = 'Mild strains may improve over days or weeks; more substantial injuries require longer recovery.',
  common_causes_ro = 'Mișcările bruște, efortul peste nivelul de pregătire, oboseala, schimbarea rapidă de direcție și suprasolicitarea repetată sunt cauze frecvente.',
  common_causes_en = 'Sudden movement, effort beyond the current conditioning level, fatigue, rapid direction changes and repetitive overload are common causes.',
  self_care_ro = 'Oprește activitatea care provoacă durere, protejează zona și folosește repaus relativ. Recele aplicat printr-un material textil poate limita disconfortul în faza inițială; revenirea la efort trebuie să fie graduală.',
  self_care_en = 'Stop the painful activity, protect the area and use relative rest. A wrapped cold pack may reduce early discomfort; return to activity should be gradual.',
  doctor_when_ro = 'Cere evaluare dacă durerea sau umflarea sunt importante, mersul ori mișcarea sunt limitate, slăbiciunea persistă sau simptomele nu se ameliorează.',
  doctor_when_en = 'Seek assessment if pain or swelling is substantial, walking or movement is limited, weakness persists, or symptoms do not improve.',
  emergency_signs_ro = 'Solicită evaluare rapidă pentru deformare, pocnet cu pierdere bruscă de forță, imposibilitatea de a folosi zona, amorțeală sau umflare care crește rapid.',
  emergency_signs_en = 'Seek urgent assessment for deformity, a pop with sudden loss of strength, inability to use the area, numbness or rapidly increasing swelling.',
  prevention_ro = 'Încălzește-te progresiv, crește treptat volumul și intensitatea efortului, folosește tehnică adecvată și acordă timp recuperării.',
  prevention_en = 'Warm up progressively, increase exercise volume and intensity gradually, use appropriate technique and allow time for recovery.',
  icd10_code = null,
  triage_priority = 5,
  active = true,
  review_status = 'needs_review',
  reviewed_at = null,
  reviewed_by = null,
  updated_at = now()
where slug = 'intindere-musculara';

do $$
begin
  if (
    select count(*)
    from public.conditions
    where slug in (
      'crampa-musculara',
      'contractura-musculara',
      'ruptura-musculara',
      'intindere-musculara'
    )
  ) <> 4 then
    raise exception 'Expected all four baseline muscle conditions to exist before enrichment';
  end if;
end $$;

insert into public.conditions (
  slug,
  name_ro,
  name_en,
  scientific_name,
  tissue,
  default_level,
  description_ro,
  description_en,
  educational_note_ro,
  educational_note_en,
  condition_category,
  aliases_ro,
  aliases_en,
  keywords_ro,
  keywords_en,
  typical_duration_ro,
  typical_duration_en,
  common_causes_ro,
  common_causes_en,
  self_care_ro,
  self_care_en,
  doctor_when_ro,
  doctor_when_en,
  emergency_signs_ro,
  emergency_signs_en,
  prevention_ro,
  prevention_en,
  triage_priority,
  active,
  review_status
) values
  (
    'febra-musculara-intarziata',
    'Febră musculară cu debut întârziat',
    'Delayed-onset muscle soreness',
    'Delayed-onset muscle soreness (DOMS)',
    'muschi',
    'usor',
    'Durere și rigiditate musculară apărute după un efort neobișnuit sau mai intens, cu debut întârziat și ameliorare progresivă în următoarele zile.',
    'Muscle soreness and stiffness that develop after unfamiliar or more intense exercise, with delayed onset and gradual improvement over the following days.',
    'Informație educațională, nu diagnostic. Durerea severă, umflarea importantă, slăbiciunea marcată sau urina închisă la culoare nu trebuie presupuse automat ca fiind febră musculară.',
    'Educational information, not a diagnosis. Severe pain, substantial swelling, marked weakness or dark urine should not automatically be assumed to be DOMS.',
    'exercise_related',
    array['DOMS', 'durere musculară după efort', 'febră musculară'],
    array['DOMS', 'post-exercise muscle soreness', 'exercise soreness'],
    array['febră musculară', 'după sală', 'după antrenament', 'rigiditate', 'durere întârziată'],
    array['DOMS', 'after workout', 'after exercise', 'stiffness', 'delayed soreness'],
    'Apare după efort și se ameliorează de regulă progresiv în câteva zile.',
    'It develops after exercise and usually improves progressively over several days.',
    'Efort nou, creșterea bruscă a volumului sau intensității și exercițiile cu încărcare excentrică.',
    'New exercise, a sudden increase in volume or intensity, and exercises with eccentric loading.',
    'Mișcare ușoară, repaus relativ, somn și revenire graduală la antrenament, fără a forța mușchiul dureros.',
    'Light movement, relative rest, sleep and a gradual return to training without forcing the sore muscle.',
    'Cere sfat medical dacă durerea este severă, se agravează, nu se ameliorează progresiv sau este asociată cu slăbiciune ori umflare importantă.',
    'Seek medical advice if pain is severe, worsening, not gradually improving, or associated with substantial weakness or swelling.',
    'Solicită evaluare urgentă pentru urină foarte închisă, scăderea cantității de urină, confuzie, slăbiciune extremă sau umflare musculară importantă după efort.',
    'Seek urgent assessment for very dark urine, reduced urine output, confusion, extreme weakness or substantial muscle swelling after exertion.',
    'Crește treptat volumul și intensitatea exercițiilor și acordă timp recuperării între antrenamente solicitante.',
    'Increase exercise volume and intensity gradually and allow recovery time between demanding sessions.',
    3,
    true,
    'needs_review'
  ),
  (
    'contuzie-musculara',
    'Contuzie musculară',
    'Muscle contusion',
    'Muscle contusion',
    'muschi',
    'mediu',
    'Leziune produsă prin impact direct, fără plagă deschisă, care poate cauza durere, sensibilitate, umflare și vânătaie în mușchi.',
    'An injury caused by direct impact without an open wound that may produce pain, tenderness, swelling and bruising within a muscle.',
    'Informație educațională, nu diagnostic. Intensitatea impactului și funcția zonei trebuie evaluate pentru a exclude o leziune mai importantă.',
    'Educational information, not a diagnosis. Impact severity and function of the area must be assessed to exclude a more substantial injury.',
    'acute_muscle_injury',
    array['lovitură musculară', 'hematom muscular traumatic'],
    array['muscle bruise', 'traumatic muscle bruise'],
    array['contuzie', 'lovitură', 'vânătaie', 'hematom', 'umflare', 'durere la apăsare'],
    array['contusion', 'direct blow', 'bruise', 'haematoma', 'swelling', 'tenderness'],
    'Formele ușoare se ameliorează în zile sau săptămâni; contuziile importante pot necesita recuperare mai lungă.',
    'Mild cases improve over days or weeks; substantial contusions may require longer recovery.',
    'Lovitură directă în sport, cădere, impact cu un obiect sau compresie locală.',
    'A direct blow during sport, a fall, impact with an object or local compression.',
    'Protejează zona, folosește repaus relativ și evită masajul agresiv sau revenirea rapidă la efort. Recele poate fi aplicat printr-un material textil pentru perioade scurte.',
    'Protect the area, use relative rest and avoid aggressive massage or rapid return to activity. A wrapped cold pack may be used for short periods.',
    'Cere evaluare dacă hematomul este mare, durerea ori umflarea cresc, mișcarea este limitată sau persoana urmează tratament anticoagulant.',
    'Seek assessment if bruising is extensive, pain or swelling increases, movement is limited, or the person uses anticoagulant medication.',
    'Solicită ajutor urgent pentru durere disproporționat de mare, tensiune accentuată a zonei, amorțeală, slăbiciune sau extremitate rece ori palidă.',
    'Seek urgent help for pain out of proportion, marked tightness of the area, numbness, weakness, or a cold or pale limb.',
    'Folosește echipament de protecție adecvat activității și revino la sport după recuperarea funcției și a forței.',
    'Use protective equipment appropriate to the activity and return to sport after function and strength have recovered.',
    5,
    true,
    'needs_review'
  ),
  (
    'tendinopatie',
    'Tendinopatie',
    'Tendinopathy',
    'Tendinopathy',
    'tendon',
    'mediu',
    'Afecțiune a tendonului asociată frecvent cu suprasolicitare, durere localizată și reducerea toleranței la efort.',
    'A tendon disorder commonly associated with overload, localised pain and reduced tolerance to loading.',
    'Informație educațională, nu diagnostic. Termenul tendinopatie descrie o problemă de tendon, dar localizarea și cauza trebuie evaluate.',
    'Educational information, not a diagnosis. Tendinopathy describes a tendon problem, but its location and cause require assessment.',
    'tendon_overuse',
    array['suprasolicitare de tendon', 'durere de tendon'],
    array['tendon overuse disorder', 'tendon pain'],
    array['tendinopatie', 'tendon', 'suprasolicitare', 'durere la efort', 'rigiditate'],
    array['tendinopathy', 'tendon', 'overuse', 'load-related pain', 'stiffness'],
    'Poate persista săptămâni sau luni și necesită adaptarea progresivă a încărcării.',
    'It may persist for weeks or months and requires progressive load management.',
    'Creșterea prea rapidă a volumului de efort, mișcările repetitive, recuperarea insuficientă și modificările bruște ale activității.',
    'A rapid increase in workload, repetitive movement, insufficient recovery and sudden changes in activity.',
    'Redu temporar activitățile care agravează durerea, dar evită imobilizarea completă prelungită. Recuperarea progresivă este de obicei individualizată.',
    'Temporarily reduce activities that aggravate pain, but avoid prolonged complete immobilisation. Progressive rehabilitation is usually individualised.',
    'Cere evaluare dacă durerea persistă, limitează activitatea, revine frecvent sau apare slăbiciune evidentă.',
    'Seek assessment if pain persists, limits activity, frequently recurs or is accompanied by obvious weakness.',
    'Un pocnet brusc, deformarea, vânătaia rapidă sau pierderea funcției pot indica ruptură și necesită evaluare promptă.',
    'A sudden pop, deformity, rapid bruising or loss of function may indicate rupture and requires prompt assessment.',
    'Crește gradual încărcarea, alternează perioadele de efort și recuperare și corectează tehnica sau echipamentul nepotrivit.',
    'Increase load gradually, alternate activity with recovery, and address unsuitable technique or equipment.',
    5,
    true,
    'needs_review'
  ),
  (
    'ruptura-tendon',
    'Ruptură de tendon',
    'Tendon rupture',
    'Tendon rupture',
    'tendon',
    'consultare_doctor',
    'Rupere parțială sau completă a unui tendon, cu pierderea variabilă a transmiterii forței dintre mușchi și os.',
    'A partial or complete tear of a tendon with variable loss of force transmission between muscle and bone.',
    'Informație educațională, nu diagnostic. Ruptura de tendon necesită evaluare clinică promptă și uneori investigații imagistice.',
    'Educational information, not a diagnosis. Tendon rupture requires prompt clinical assessment and sometimes imaging.',
    'acute_tendon_injury',
    array['tendon rupt', 'ruptură tendinoasă'],
    array['torn tendon', 'tendon tear'],
    array['ruptură tendon', 'pocnet', 'pierdere de forță', 'deformare', 'vânătaie'],
    array['tendon rupture', 'pop', 'loss of strength', 'deformity', 'bruising'],
    'Recuperarea durează frecvent săptămâni sau luni și depinde de tendon, severitate și tratament.',
    'Recovery commonly takes weeks or months and depends on the tendon, severity and treatment.',
    'Contracție bruscă, suprasolicitare, cădere, traumatism sau degenerarea preexistentă a tendonului.',
    'Sudden contraction, overload, a fall, trauma or pre-existing tendon degeneration.',
    'Oprește activitatea, protejează și nu forța zona. Evită testarea repetată a forței până la evaluare.',
    'Stop the activity, protect the area and do not force it. Avoid repeatedly testing strength before assessment.',
    'Cere evaluare medicală promptă pentru pocnet, pierdere bruscă de forță, imposibilitatea unei mișcări obișnuite sau deformare.',
    'Seek prompt medical assessment for a pop, sudden loss of strength, inability to perform a usual movement or deformity.',
    'Solicită ajutor urgent dacă există rană deschisă, compromis circulator, amorțeală progresivă, durere severă sau traumatism major asociat.',
    'Seek urgent help for an open wound, impaired circulation, progressive numbness, severe pain or associated major trauma.',
    'Progresează gradual încărcarea, respectă recuperarea după tendinopatie sau accidentare și folosește tehnică adecvată.',
    'Progress loading gradually, complete rehabilitation after tendinopathy or injury, and use appropriate technique.',
    8,
    true,
    'needs_review'
  ),
  (
    'entorsa-articulara',
    'Entorsă',
    'Sprain',
    'Ligament sprain',
    'articulatie',
    'mediu',
    'Întindere excesivă sau rupere parțială ori completă a unuia sau mai multor ligamente care stabilizează o articulație.',
    'Overstretching or partial or complete tearing of one or more ligaments that stabilise a joint.',
    'Informație educațională, nu diagnostic. O entorsă poate semăna cu o fractură sau luxație, mai ales după traumatism important.',
    'Educational information, not a diagnosis. A sprain can resemble a fracture or dislocation, especially after substantial trauma.',
    'acute_joint_injury',
    array['leziune de ligament', 'ligament întins'],
    array['ligament injury', 'stretched ligament'],
    array['entorsă', 'ligament', 'răsucire', 'umflare', 'vânătaie', 'instabilitate'],
    array['sprain', 'ligament', 'twist', 'swelling', 'bruising', 'instability'],
    'Formele ușoare se pot ameliora în câteva săptămâni; entorsele severe necesită recuperare mai lungă.',
    'Mild sprains may improve over several weeks; severe sprains require longer recovery.',
    'Răsucirea articulației, căderea, schimbarea bruscă de direcție sau aterizarea incorectă.',
    'Twisting a joint, falling, changing direction suddenly or landing awkwardly.',
    'Protejează articulația, redu temporar încărcarea și evită mișcările care agravează durerea. Recele aplicat prin material textil poate reduce disconfortul inițial.',
    'Protect the joint, temporarily reduce loading and avoid movements that worsen pain. A wrapped cold pack may reduce early discomfort.',
    'Cere evaluare dacă nu poți susține greutatea, articulația este instabilă, umflarea este mare sau simptomele nu se ameliorează.',
    'Seek assessment if weight cannot be borne, the joint feels unstable, swelling is substantial or symptoms do not improve.',
    'Solicită evaluare urgentă pentru deformare, articulație blocată, amorțeală, extremitate rece ori palidă sau durere severă după traumatism.',
    'Seek urgent assessment for deformity, a locked joint, numbness, a cold or pale limb, or severe pain after trauma.',
    'Antrenează forța, echilibrul și controlul mișcării și folosește echipament potrivit activității.',
    'Train strength, balance and movement control, and use equipment appropriate to the activity.',
    6,
    true,
    'needs_review'
  ),
  (
    'luxatie-articulara',
    'Luxație articulară',
    'Joint dislocation',
    'Joint dislocation',
    'articulatie',
    'consultare_doctor',
    'Deplasarea completă a suprafețelor osoase ale unei articulații din poziția lor normală, de obicei după traumatism.',
    'Complete displacement of the bony surfaces of a joint from their normal position, usually after trauma.',
    'Informație educațională, nu diagnostic. Nu încerca repoziționarea unei articulații suspectate ca luxată fără personal medical.',
    'Educational information, not a diagnosis. Do not attempt to reposition a suspected dislocated joint without medical personnel.',
    'acute_joint_injury',
    array['articulație ieșită din loc', 'dislocare articulară'],
    array['dislocated joint', 'joint out of place'],
    array['luxație', 'deformare', 'articulație blocată', 'durere severă', 'traumatism'],
    array['dislocation', 'deformity', 'locked joint', 'severe pain', 'trauma'],
    'Necesită evaluare și tratament; recuperarea depinde de articulație și leziunile asociate.',
    'It requires assessment and treatment; recovery depends on the joint and associated injuries.',
    'Cădere, impact sportiv, accident sau forțarea articulației dincolo de amplitudinea normală.',
    'A fall, sports impact, accident or force beyond the normal range of the joint.',
    'Susține zona în poziția găsită, nu încerca să repoziționezi articulația și solicită evaluare promptă.',
    'Support the area in the position found, do not attempt to reposition the joint, and seek prompt assessment.',
    'Orice suspiciune de luxație necesită evaluare medicală promptă, chiar dacă articulația pare să fi revenit singură.',
    'Any suspected dislocation requires prompt medical assessment, even if the joint appears to have moved back by itself.',
    'Apelează urgent pentru membru rece, palid sau albăstrui, puls distal slab, amorțeală, rană deschisă, traumatism major sau durere necontrolată.',
    'Seek urgent help for a cold, pale or blue limb, weak distal pulse, numbness, an open wound, major trauma or uncontrolled pain.',
    'Recuperează forța și stabilitatea după accidentare și folosește protecție adecvată în activitățile cu risc.',
    'Restore strength and stability after injury and use appropriate protection in higher-risk activities.',
    9,
    true,
    'needs_review'
  ),
  (
    'fractura-osoasa',
    'Fractură osoasă',
    'Bone fracture',
    'Bone fracture',
    'os',
    'consultare_doctor',
    'Întrerupere parțială sau completă a continuității unui os, produsă de traumatism sau, uneori, de fragilitate ori boală osoasă.',
    'A partial or complete break in the continuity of a bone caused by trauma or, sometimes, bone fragility or disease.',
    'Informație educațională, nu diagnostic. Confirmarea și clasificarea unei fracturi necesită evaluare medicală și, de obicei, imagistică.',
    'Educational information, not a diagnosis. Confirmation and classification of a fracture require medical assessment and usually imaging.',
    'acute_bone_injury',
    array['os rupt', 'fisură osoasă'],
    array['broken bone', 'bone break'],
    array['fractură', 'fisură', 'durere osoasă', 'deformare', 'traumatism', 'imposibilitate de sprijin'],
    array['fracture', 'bone break', 'bone pain', 'deformity', 'trauma', 'unable to bear weight'],
    'Vindecarea durează frecvent mai multe săptămâni și depinde de os, tipul fracturii, vârstă și tratament.',
    'Healing commonly takes several weeks and depends on the bone, fracture type, age and treatment.',
    'Cădere, impact direct, accident, răsucire puternică sau fragilitate osoasă.',
    'A fall, direct impact, accident, forceful twisting or bone fragility.',
    'Nu îndrepta și nu încărca zona suspectă. Susține membrul în poziția găsită și solicită evaluare medicală.',
    'Do not straighten or load the suspected area. Support the limb in the position found and seek medical assessment.',
    'Cere evaluare promptă pentru durere osoasă importantă după traumatism, sensibilitate focală, umflare, deformare sau imposibilitatea de folosire.',
    'Seek prompt assessment for substantial bone pain after trauma, focal tenderness, swelling, deformity or inability to use the area.',
    'Apelează urgent pentru os vizibil sau rană deschisă, sângerare importantă, deformare severă, amorțeală, membru rece ori palid, traumatism cranian sau de coloană.',
    'Seek urgent help for visible bone or an open wound, major bleeding, severe deformity, numbness, a cold or pale limb, or head or spinal trauma.',
    'Folosește măsuri de protecție împotriva căderilor și echipament adecvat; sănătatea osoasă trebuie evaluată la fracturi produse prin traumatisme minore.',
    'Use fall-prevention measures and appropriate protective equipment; bone health should be assessed when fractures follow minor trauma.',
    9,
    true,
    'needs_review'
  ),
  (
    'fractura-de-stres',
    'Fractură de stres',
    'Stress fracture',
    'Stress fracture',
    'os',
    'consultare_doctor',
    'Leziune osoasă de suprasolicitare produsă prin încărcări repetitive, frecvent cu durere localizată care se accentuează la activitate.',
    'An overuse bone injury caused by repetitive loading, commonly producing localised pain that worsens with activity.',
    'Informație educațională, nu diagnostic. Continuarea impactului poate agrava leziunea, iar radiografia inițială poate să nu arate toate fracturile de stres.',
    'Educational information, not a diagnosis. Continued impact can worsen the injury, and an early X-ray may not show every stress fracture.',
    'bone_overuse',
    array['fractură de oboseală', 'leziune osoasă de stres'],
    array['fatigue fracture', 'bone stress injury'],
    array['fractură de stres', 'durere focală', 'alergare', 'suprasolicitare', 'durere la impact'],
    array['stress fracture', 'focal pain', 'running', 'overuse', 'impact pain'],
    'Recuperarea necesită de obicei mai multe săptămâni și reluarea graduală a impactului.',
    'Recovery usually requires several weeks and a gradual return to impact activity.',
    'Creșterea rapidă a volumului de alergare sau sărituri, recuperarea insuficientă, suprafețele dure și factorii care reduc sănătatea osoasă.',
    'A rapid increase in running or jumping volume, insufficient recovery, hard surfaces and factors that reduce bone health.',
    'Oprește activitatea cu impact care provoacă durere și înlocuiește-o temporar cu activități fără durere până la evaluare.',
    'Stop impact activity that causes pain and temporarily replace it with pain-free activity while awaiting assessment.',
    'Cere evaluare pentru durere osoasă focală ce reapare la impact, persistă în repaus sau se agravează în ciuda reducerii activității.',
    'Seek assessment for focal bone pain that recurs with impact, persists at rest or worsens despite reduced activity.',
    'Solicită evaluare rapidă dacă nu poți susține greutatea, durerea devine brusc severă sau apare o deformare după continuarea efortului.',
    'Seek urgent assessment if weight cannot be borne, pain suddenly becomes severe or deformity develops after continued activity.',
    'Crește gradual volumul de impact, planifică recuperarea, folosește încălțăminte adecvată și investighează factorii de risc pentru sănătatea osoasă.',
    'Increase impact volume gradually, plan recovery, use appropriate footwear and investigate risk factors affecting bone health.',
    7,
    true,
    'needs_review'
  )
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  name_en = excluded.name_en,
  scientific_name = excluded.scientific_name,
  tissue = excluded.tissue,
  default_level = excluded.default_level,
  description_ro = excluded.description_ro,
  description_en = excluded.description_en,
  educational_note_ro = excluded.educational_note_ro,
  educational_note_en = excluded.educational_note_en,
  condition_category = excluded.condition_category,
  aliases_ro = excluded.aliases_ro,
  aliases_en = excluded.aliases_en,
  keywords_ro = excluded.keywords_ro,
  keywords_en = excluded.keywords_en,
  typical_duration_ro = excluded.typical_duration_ro,
  typical_duration_en = excluded.typical_duration_en,
  common_causes_ro = excluded.common_causes_ro,
  common_causes_en = excluded.common_causes_en,
  self_care_ro = excluded.self_care_ro,
  self_care_en = excluded.self_care_en,
  doctor_when_ro = excluded.doctor_when_ro,
  doctor_when_en = excluded.doctor_when_en,
  emergency_signs_ro = excluded.emergency_signs_ro,
  emergency_signs_en = excluded.emergency_signs_en,
  prevention_ro = excluded.prevention_ro,
  prevention_en = excluded.prevention_en,
  triage_priority = excluded.triage_priority,
  active = excluded.active,
  review_status = excluded.review_status,
  reviewed_at = null,
  reviewed_by = null,
  updated_at = now();

alter table public.conditions
  drop constraint if exists conditions_name_ro_not_blank,
  drop constraint if exists conditions_scientific_name_not_blank,
  drop constraint if exists conditions_description_ro_not_blank,
  drop constraint if exists conditions_category_not_blank,
  drop constraint if exists conditions_review_status_check,
  drop constraint if exists conditions_triage_priority_check,
  drop constraint if exists conditions_reviewed_content_check,
  drop constraint if exists conditions_archived_inactive_check;

alter table public.conditions
  add constraint conditions_name_ro_not_blank
    check (char_length(trim(name_ro)) > 0),
  add constraint conditions_scientific_name_not_blank
    check (scientific_name is null or char_length(trim(scientific_name)) > 0),
  add constraint conditions_description_ro_not_blank
    check (char_length(trim(description_ro)) > 0),
  add constraint conditions_category_not_blank
    check (char_length(trim(condition_category)) > 0),
  add constraint conditions_review_status_check
    check (review_status in ('needs_review', 'reviewed', 'archived')),
  add constraint conditions_triage_priority_check
    check (triage_priority between 1 and 10),
  add constraint conditions_reviewed_content_check
    check (
      review_status <> 'reviewed'
      or (
        nullif(trim(coalesce(name_en, '')), '') is not null
        and nullif(trim(coalesce(scientific_name, '')), '') is not null
        and nullif(trim(coalesce(description_en, '')), '') is not null
        and nullif(trim(coalesce(educational_note_en, '')), '') is not null
        and nullif(trim(coalesce(doctor_when_ro, '')), '') is not null
        and nullif(trim(coalesce(emergency_signs_ro, '')), '') is not null
        and nullif(trim(coalesce(doctor_when_en, '')), '') is not null
        and nullif(trim(coalesce(emergency_signs_en, '')), '') is not null
        and reviewed_at is not null
        and nullif(trim(coalesce(reviewed_by, '')), '') is not null
      )
    ),
  add constraint conditions_archived_inactive_check
    check (review_status <> 'archived' or active = false);

create index if not exists conditions_active_tissue_level_idx
  on public.conditions (active, tissue, default_level, triage_priority desc);

create index if not exists conditions_category_idx
  on public.conditions (condition_category);

create index if not exists conditions_review_status_idx
  on public.conditions (review_status);

create index if not exists conditions_aliases_ro_idx
  on public.conditions using gin (aliases_ro);

create index if not exists conditions_aliases_en_idx
  on public.conditions using gin (aliases_en);

create index if not exists conditions_keywords_ro_idx
  on public.conditions using gin (keywords_ro);

create index if not exists conditions_keywords_en_idx
  on public.conditions using gin (keywords_en);

drop index if exists public.conditions_search_ro_idx;
create index conditions_search_ro_idx
  on public.conditions using gin (
    to_tsvector(
      'simple',
      coalesce(name_ro, '') || ' ' ||
      coalesce(scientific_name, '') || ' ' ||
      coalesce(description_ro, '') || ' ' ||
      coalesce(common_causes_ro, '') || ' ' ||
      coalesce(doctor_when_ro, '') || ' ' ||
      coalesce(emergency_signs_ro, '')
    )
  );

drop index if exists public.conditions_search_en_idx;
create index conditions_search_en_idx
  on public.conditions using gin (
    to_tsvector(
      'english',
      coalesce(name_en, '') || ' ' ||
      coalesce(scientific_name, '') || ' ' ||
      coalesce(description_en, '') || ' ' ||
      coalesce(common_causes_en, '') || ' ' ||
      coalesce(doctor_when_en, '') || ' ' ||
      coalesce(emergency_signs_en, '')
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conditions_set_updated_at on public.conditions;
create trigger conditions_set_updated_at
  before update on public.conditions
  for each row
  execute function public.set_updated_at();

drop policy if exists public_read on public.conditions;
create policy public_read
  on public.conditions
  for select
  using (active = true);

grant select on table public.conditions to anon, authenticated;
revoke insert, update, delete on table public.conditions from anon, authenticated;

commit;
