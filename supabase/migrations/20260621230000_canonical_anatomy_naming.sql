begin;

alter table public.anatomy_structures
  add column if not exists popular_name_ro text,
  add column if not exists popular_name_en text,
  add column if not exists scientific_name_en text;

alter table public.muscles
  add column if not exists popular_name_ro text,
  add column if not exists popular_name_en text,
  add column if not exists scientific_name_ro text,
  add column if not exists scientific_name_en text;

alter table public.muscle_groups
  add column if not exists popular_name_ro text,
  add column if not exists popular_name_en text,
  add column if not exists scientific_name_ro text,
  add column if not exists scientific_name_en text;

alter table public.body_regions
  add column if not exists popular_name_ro text,
  add column if not exists popular_name_en text,
  add column if not exists scientific_name_ro text,
  add column if not exists scientific_name_en text,
  add column if not exists latin_name text;

alter table public.model_muscle_mappings
  add column if not exists latin_name text;

insert into public.anatomy_structures (
  slug,
  name_ro,
  name_latin,
  tissue,
  body_region,
  model_selection_id,
  description_ro,
  function_ro,
  common_name_ro,
  scientific_name_ro,
  scientific_name_en,
  display_name_ro,
  display_name_en,
  popular_name_ro,
  popular_name_en,
  english_name,
  latin_name,
  missing_ro_display_name
)
values
  ('organ-inima', 'Inimă', 'Cor', 'organ', 'torace', 'organ:inima', 'Organ muscular situat în torace, între plămâni.', 'Pompează sângele către plămâni și către restul corpului.', 'Inimă', 'Inimă', 'Heart', 'Inimă', 'Heart', 'Inimă', 'Heart', 'Heart', 'Cor', false),
  ('organ-plamani', 'Plămâni', 'Pulmones', 'organ', 'torace', 'organ:plamani', 'Organe pereche responsabile de schimbul de gaze dintre aer și sânge.', 'Permit oxigenarea sângelui și eliminarea dioxidului de carbon.', 'Plămâni', 'Plămâni', 'Lungs', 'Plămâni', 'Lungs', 'Plămâni', 'Lungs', 'Lungs', 'Pulmones', false),
  ('organ-ficat', 'Ficat', 'Hepar', 'organ', 'abdomen', 'organ:ficat', 'Organ voluminos din partea dreaptă superioară a abdomenului.', 'Procesează nutrienți, produce bilă și participă la detoxifiere.', 'Ficat', 'Ficat', 'Liver', 'Ficat', 'Liver', 'Ficat', 'Liver', 'Liver', 'Hepar', false),
  ('organ-stomac', 'Stomac', 'Ventriculus', 'organ', 'abdomen', 'organ:stomac', 'Organ cavitar al digestiei, situat în abdomenul superior.', 'Amestecă alimentele cu sucuri gastrice și începe digestia proteinelor.', 'Stomac', 'Stomac', 'Stomach', 'Stomac', 'Stomach', 'Stomac', 'Stomach', 'Stomach', 'Ventriculus', false),
  ('organ-rinichi', 'Rinichi', 'Renes', 'organ', 'abdomen', 'organ:rinichi', 'Organe pereche care filtrează sângele și contribuie la formarea urinei.', 'Reglează eliminarea produselor de metabolism, a apei și a sărurilor.', 'Rinichi', 'Rinichi', 'Kidneys', 'Rinichi', 'Kidneys', 'Rinichi', 'Kidneys', 'Kidneys', 'Renes', false),
  ('organ-intestine', 'Intestine', 'Intestina', 'organ', 'abdomen', 'organ:intestine', 'Segmente digestive implicate în absorbția nutrienților și eliminare.', 'Finalizează digestia, absorb nutrienți și formează materiile fecale.', 'Intestine', 'Intestine', 'Intestines', 'Intestine', 'Intestines', 'Intestine', 'Intestines', 'Intestines', 'Intestina', false),
  ('organ-splina', 'Splină', 'Lien', 'organ', 'abdomen', 'organ:splina', 'Organ limfoid situat în partea stângă superioară a abdomenului.', 'Filtrează sângele și contribuie la răspunsul imun.', 'Splină', 'Splină', 'Spleen', 'Splină', 'Spleen', 'Splină', 'Spleen', 'Spleen', 'Lien', false),
  ('organ-pancreas', 'Pancreas', 'Pancreas', 'organ', 'abdomen', 'organ:pancreas', 'Organ situat posterior de stomac, cu rol digestiv și endocrin.', 'Produce enzime digestive și hormoni implicați în reglarea glicemiei.', 'Pancreas', 'Pancreas', 'Pancreas', 'Pancreas', 'Pancreas', 'Pancreas', 'Pancreas', 'Pancreas', 'Pancreas', false),
  ('organ-vezica-urinara', 'Vezică urinară', 'Vesica urinaria', 'organ', 'pelvis', 'organ:vezica-urinara', 'Organ cavitar din pelvis care depozitează urina.', 'Stochează urina înainte de eliminare.', 'Vezică urinară', 'Vezică urinară', 'Urinary bladder', 'Vezică urinară', 'Urinary bladder', 'Vezică urinară', 'Urinary bladder', 'Urinary bladder', 'Vesica urinaria', false),
  ('organ-esofag', 'Esofag', 'Oesophagus', 'organ', 'gat_torace', 'organ:esofag', 'Tub muscular care transportă alimentele către stomac.', 'Conduce bolul alimentar prin mișcări peristaltice.', 'Esofag', 'Esofag', 'Esophagus', 'Esofag', 'Esophagus', 'Esofag', 'Esophagus', 'Esophagus', 'Oesophagus', false),
  ('organ-trahee', 'Trahee', 'Trachea', 'organ', 'gat_torace', 'organ:trahee', 'Conduct respirator care leagă laringele de bronhii.', 'Permite trecerea aerului către plămâni.', 'Trahee', 'Trahee', 'Trachea', 'Trahee', 'Trachea', 'Trahee', 'Trachea', 'Trachea', 'Trachea', false)
on conflict (slug) do update set
  model_selection_id = excluded.model_selection_id,
  popular_name_ro = excluded.popular_name_ro,
  popular_name_en = excluded.popular_name_en,
  scientific_name_ro = excluded.scientific_name_ro,
  scientific_name_en = excluded.scientific_name_en,
  latin_name = excluded.latin_name,
  display_name_ro = excluded.popular_name_ro,
  display_name_en = excluded.popular_name_en,
  english_name = excluded.popular_name_en,
  updated_at = now();

update public.anatomy_structures
set
  popular_name_ro = coalesce(nullif(trim(popular_name_ro), ''), nullif(trim(display_name_ro), ''), nullif(trim(common_name_ro), ''), name_ro),
  popular_name_en = coalesce(nullif(trim(popular_name_en), ''), nullif(trim(display_name_en), ''), nullif(trim(english_name), ''), nullif(trim(name_latin), ''), name_ro),
  scientific_name_ro = coalesce(nullif(trim(scientific_name_ro), ''), name_ro),
  scientific_name_en = coalesce(
    nullif(trim(scientific_name_en), ''),
    case slug
      when 'carp' then 'Carpal bones'
      when 'ciocan' then 'Malleus'
      when 'clavicula' then 'Clavicle'
      when 'coaste' then 'Ribs'
      when 'coccis' then 'Coccyx'
      when 'cornet-inf' then 'Inferior nasal conchae'
      when 'coxal' then 'Hip bones'
      when 'etmoid' then 'Ethmoid bone'
      when 'falange-mana' then 'Hand phalanges'
      when 'falange-picior' then 'Foot phalanges'
      when 'femur' then 'Femur'
      when 'fibula' then 'Fibula'
      when 'frontal' then 'Frontal bone'
      when 'hioid' then 'Hyoid bone'
      when 'humerus' then 'Humerus'
      when 'lacrimal' then 'Lacrimal bones'
      when 'mandibula' then 'Mandible'
      when 'maxilar' then 'Maxillae'
      when 'metacarp' then 'Metacarpal bones'
      when 'metatars' then 'Metatarsal bones'
      when 'nazal' then 'Nasal bones'
      when 'nicovala' then 'Incus'
      when 'occipital' then 'Occipital bone'
      when 'palatin' then 'Palatine bones'
      when 'parietal' then 'Parietal bones'
      when 'radius' then 'Radius'
      when 'rotula' then 'Patellae'
      when 'sacrum' then 'Sacrum'
      when 'scapula' then 'Scapulae'
      when 'scarita' then 'Stapes'
      when 'schelet-cap' then 'Skull'
      when 'schelet-coloana' then 'Vertebral column'
      when 'schelet-membrul-inferior' then 'Lower limb'
      when 'schelet-membrul-superior' then 'Upper limb'
      when 'schelet-torace' then 'Thoracic cage'
      when 'sfenoid' then 'Sphenoid bone'
      when 'stern' then 'Sternum'
      when 'tars' then 'Tarsal bones'
      when 'temporal' then 'Temporal bones'
      when 'tibia' then 'Tibia'
      when 'ulna' then 'Ulna'
      when 'vert-cervicale' then 'Cervical vertebrae'
      when 'vert-lombare' then 'Lumbar vertebrae'
      when 'vert-toracice' then 'Thoracic vertebrae'
      when 'vomer' then 'Vomer'
      when 'zigomatic' then 'Zygomatic bones'
      when 'adductori' then 'Adductor muscles'
      when 'coafa-rotatorilor' then 'Rotator cuff'
      when 'cvadriceps' then 'Quadriceps femoris'
      when 'ischiogambieri' then 'Hamstring muscles'
      when 'muschii-abdomenului' then 'Abdominal muscles'
      when 'muschii-abdominali' then 'Abdominal muscles'
      when 'muschii-antebratului' then 'Forearm muscles'
      when 'muschii-bazinului' then 'Pelvic floor muscles'
      when 'muschii-bratului' then 'Upper-arm muscles'
      when 'muschii-bratului-anteriori' then 'Anterior upper-arm muscles'
      when 'muschii-bratului-posteriori' then 'Posterior upper-arm muscles'
      when 'muschii-capului-gatului' then 'Head and neck muscles'
      when 'muschii-coapsei' then 'Thigh muscles'
      when 'muschii-fesieri' then 'Gluteal muscles'
      when 'muschii-gambei' then 'Lower-leg muscles'
      when 'muschii-gatului' then 'Neck muscles'
      when 'muschii-labei-piciorului' then 'Foot muscles'
      when 'muschii-mainii' then 'Hand muscles'
      when 'muschii-masticatori' then 'Muscles of mastication'
      when 'muschii-pieptului' then 'Pectoral muscles'
      when 'muschii-soldului' then 'Hip and gluteal muscles'
      when 'muschii-soldului-profunzi' then 'Deep hip muscles'
      when 'muschii-spatelui' then 'Back muscles'
      when 'muschii-spatelui-profunzi' then 'Deep back muscles'
      when 'muschii-spatelui-superficiali' then 'Superficial back muscles'
      when 'muschii-tibiali-peronieri' then 'Tibial and fibular muscles'
      when 'muschii-toracelui' then 'Thoracic muscles'
      when 'muschii-umarului' then 'Shoulder muscles'
      else coalesce(nullif(trim(name_latin), ''), nullif(trim(english_name), ''), name_ro)
    end
  ),
  latin_name = coalesce(nullif(trim(latin_name), ''), nullif(trim(name_latin), '')),
  display_name_ro = coalesce(nullif(trim(popular_name_ro), ''), nullif(trim(display_name_ro), ''), name_ro),
  display_name_en = coalesce(nullif(trim(popular_name_en), ''), nullif(trim(display_name_en), ''), nullif(trim(english_name), ''), name_ro),
  common_name_ro = coalesce(nullif(trim(popular_name_ro), ''), nullif(trim(common_name_ro), ''), name_ro),
  english_name = coalesce(nullif(trim(popular_name_en), ''), nullif(trim(english_name), ''), nullif(trim(display_name_en), ''), name_ro),
  missing_ro_display_name = false,
  updated_at = now();

update public.muscles
set
  scientific_name_ro = case
    when is_group_label then upper(left(name, 1)) || substr(name, 2)
    else 'Mușchiul ' || name
  end,
  scientific_name_en = case
    when is_group_label then upper(left(english_name, 1)) || substr(english_name, 2)
    else upper(left(english_name, 1)) || substr(english_name, 2) || ' muscle'
  end,
  popular_name_ro = case slug
    when 'adductor-lung' then 'Mușchi din interiorul coapsei'
    when 'adductor-mare' then 'Mușchi mare din interiorul coapsei'
    when 'anconeu' then 'Mușchi mic din spatele cotului'
    when 'biceps-brahial' then 'Bicepsul brațului'
    when 'biceps-femural' then 'Mușchi din spatele coapsei'
    when 'brahial' then 'Mușchi profund din fața brațului'
    when 'brahioradial' then 'Mușchiul lateral al antebrațului'
    when 'coracobrahial' then 'Mușchi din interiorul brațului'
    when 'deltoid-anterior' then 'Partea din față a mușchiului umărului'
    when 'deltoid-lateral' then 'Partea laterală a mușchiului umărului'
    when 'deltoid-posterior' then 'Partea din spate a mușchiului umărului'
    when 'dintat-anterior' then 'Mușchiul lateral al pieptului'
    when 'dorsal-mare' then 'Mușchiul lateral al spatelui'
    when 'drept-abdominal' then 'Mușchiul abdomenului / Pătrățele'
    when 'drept-femural' then 'Mușchi din fața coapsei'
    when 'erectori-spinali' then 'Mușchii profunzi care țin spatele drept'
    when 'extensori-antebrat' then 'Mușchii care întind mâna și degetele'
    when 'fesier-mare' then 'Mușchiul fesier / Fund'
    when 'fesier-mic' then 'Mușchi profund al șoldului'
    when 'fesier-mijlociu' then 'Mușchiul lateral al șoldului'
    when 'flexori-antebrat' then 'Mușchii care îndoaie mâna și degetele'
    when 'gastrocnemian' then 'Mușchiul gambei'
    when 'gracilis' then 'Mușchi subțire din interiorul coapsei'
    when 'iliopsoas' then 'Mușchii profunzi din fața șoldului'
    when 'infraspinos' then 'Mușchi din spatele umărului'
    when 'intercostali' then 'Mușchii dintre coaste'
    when 'maseter' then 'Mușchiul maxilarului / pentru mestecat'
    when 'multifizi' then 'Mușchii mici care stabilizează coloana'
    when 'oblic-extern' then 'Mușchi abdominal lateral'
    when 'oblic-intern' then 'Mușchi abdominal lateral profund'
    when 'pectineu' then 'Mușchi din partea de sus a coapsei'
    when 'pectoral-mare' then 'Mușchiul pieptului'
    when 'pectoral-mic' then 'Mușchi profund al pieptului'
    when 'peronieri' then 'Mușchii laterali ai gambei'
    when 'piriform' then 'Mușchi profund al șoldului și fesierului'
    when 'popliteu' then 'Mușchi mic din spatele genunchiului'
    when 'pronator-rotund' then 'Mușchi care rotește palma în jos'
    when 'ridicator-scapula' then 'Mușchiul care ridică omoplatul'
    when 'romboizi' then 'Mușchii dintre omoplați'
    when 'rotund-mare' then 'Mușchi din spatele umărului'
    when 'rotund-mic' then 'Mușchi mic din spatele umărului'
    when 'sartorius' then 'Mușchiul lung, oblic, al coapsei'
    when 'scaleni' then 'Mușchii laterali ai gâtului'
    when 'semimembranos' then 'Mușchi din spatele coapsei'
    when 'semitendinos' then 'Mușchi din spatele coapsei'
    when 'solear' then 'Mușchiul profund al gambei'
    when 'splenius-capului' then 'Mușchi din spatele gâtului'
    when 'sternocleidomastoidian' then 'Mușchiul lateral al gâtului'
    when 'subscapular' then 'Mușchi profund din fața umărului'
    when 'supinator' then 'Mușchi care întoarce palma în sus'
    when 'supraspinos' then 'Mușchi deasupra omoplatului'
    when 'temporal' then 'Mușchiul tâmplei / pentru mestecat'
    when 'tensor-fascie-lata' then 'Mușchiul lateral al șoldului'
    when 'tibial-anterior' then 'Mușchiul din fața gambei'
    when 'tibial-posterior' then 'Mușchi profund din spatele gambei'
    when 'transvers-abdominal' then 'Mușchiul abdominal profund'
    when 'trapez' then 'Mușchiul cefei și spatelui de sus'
    when 'triceps-brahial' then 'Tricepsul brațului'
    when 'vast-intermediar' then 'Mușchi profund din fața coapsei'
    when 'vast-lateral' then 'Mușchiul exterior din fața coapsei'
    when 'vast-medial' then 'Mușchiul interior din fața coapsei'
    else upper(left(name, 1)) || substr(name, 2)
  end,
  popular_name_en = case slug
    when 'adductor-lung' then 'Inner thigh muscle'
    when 'adductor-mare' then 'Large inner thigh muscle'
    when 'anconeu' then 'Small muscle behind the elbow'
    when 'biceps-brahial' then 'Biceps muscle'
    when 'biceps-femural' then 'Back thigh muscle'
    when 'brahial' then 'Deep front upper-arm muscle'
    when 'brahioradial' then 'Outer forearm muscle'
    when 'coracobrahial' then 'Inner upper-arm muscle'
    when 'deltoid-anterior' then 'Front shoulder muscle'
    when 'deltoid-lateral' then 'Side shoulder muscle'
    when 'deltoid-posterior' then 'Back shoulder muscle'
    when 'dintat-anterior' then 'Side chest muscle'
    when 'dorsal-mare' then 'Side back muscle'
    when 'drept-abdominal' then 'Abs muscle'
    when 'drept-femural' then 'Front thigh muscle'
    when 'erectori-spinali' then 'Deep muscles that keep the back upright'
    when 'extensori-antebrat' then 'Muscles that straighten the wrist and fingers'
    when 'fesier-mare' then 'Glute / Buttock muscle'
    when 'fesier-mic' then 'Deep hip muscle'
    when 'fesier-mijlociu' then 'Side hip muscle'
    when 'flexori-antebrat' then 'Muscles that bend the wrist and fingers'
    when 'gastrocnemian' then 'Calf muscle'
    when 'gracilis' then 'Thin inner thigh muscle'
    when 'iliopsoas' then 'Deep front hip muscles'
    when 'infraspinos' then 'Back shoulder muscle'
    when 'intercostali' then 'Muscles between the ribs'
    when 'maseter' then 'Jaw / Chewing muscle'
    when 'multifizi' then 'Small spine-stabilizing muscles'
    when 'oblic-extern' then 'Side abdominal muscle'
    when 'oblic-intern' then 'Deep side abdominal muscle'
    when 'pectineu' then 'Upper inner thigh muscle'
    when 'pectoral-mare' then 'Chest muscle'
    when 'pectoral-mic' then 'Deep chest muscle'
    when 'peronieri' then 'Outer lower-leg muscles'
    when 'piriform' then 'Deep hip and buttock muscle'
    when 'popliteu' then 'Small muscle behind the knee'
    when 'pronator-rotund' then 'Muscle that turns the palm down'
    when 'ridicator-scapula' then 'Muscle that lifts the shoulder blade'
    when 'romboizi' then 'Muscles between the shoulder blades'
    when 'rotund-mare' then 'Back shoulder muscle'
    when 'rotund-mic' then 'Small back shoulder muscle'
    when 'sartorius' then 'Long diagonal thigh muscle'
    when 'scaleni' then 'Side neck muscles'
    when 'semimembranos' then 'Back thigh muscle'
    when 'semitendinos' then 'Back thigh muscle'
    when 'solear' then 'Deep calf muscle'
    when 'splenius-capului' then 'Back neck muscle'
    when 'sternocleidomastoidian' then 'Side neck muscle'
    when 'subscapular' then 'Deep front shoulder muscle'
    when 'supinator' then 'Muscle that turns the palm up'
    when 'supraspinos' then 'Muscle above the shoulder blade'
    when 'temporal' then 'Temple / Chewing muscle'
    when 'tensor-fascie-lata' then 'Outer hip muscle'
    when 'tibial-anterior' then 'Front shin muscle'
    when 'tibial-posterior' then 'Deep back lower-leg muscle'
    when 'transvers-abdominal' then 'Deep abdominal muscle'
    when 'trapez' then 'Neck and upper-back muscle'
    when 'triceps-brahial' then 'Triceps muscle'
    when 'vast-intermediar' then 'Deep front thigh muscle'
    when 'vast-lateral' then 'Outer front thigh muscle'
    when 'vast-medial' then 'Inner front thigh muscle'
    else upper(left(english_name, 1)) || substr(english_name, 2)
  end,
  updated_at = now();

update public.muscle_groups
set
  popular_name_ro = upper(left(name, 1)) || substr(name, 2),
  popular_name_en = upper(left(english_name, 1)) || substr(english_name, 2),
  scientific_name_ro = upper(left(name, 1)) || substr(name, 2),
  scientific_name_en = upper(left(english_name, 1)) || substr(english_name, 2),
  updated_at = now();

update public.body_regions
set
  popular_name_ro = upper(left(name_ro, 1)) || substr(name_ro, 2),
  popular_name_en = upper(left(name_en, 1)) || substr(name_en, 2),
  scientific_name_ro = case slug
    when 'cap-gat' then 'Regiunea capului și gâtului'
    when 'torace' then 'Regiunea toracică'
    when 'spate' then 'Regiunea dorsală'
    when 'abdomen-core' then 'Regiunea abdominală și trunchiul'
    when 'umar' then 'Regiunea umărului'
    when 'brat-antebrat' then 'Regiunea brațului și antebrațului'
    when 'sold-fesieri' then 'Regiunea șoldului și fesieră'
    when 'coapsa' then 'Regiunea coapsei'
    when 'gamba-picior' then 'Regiunea gambei și piciorului'
    else upper(left(name_ro, 1)) || substr(name_ro, 2)
  end,
  scientific_name_en = case slug
    when 'cap-gat' then 'Head and neck region'
    when 'torace' then 'Thoracic region'
    when 'spate' then 'Dorsal region'
    when 'abdomen-core' then 'Abdominal and core region'
    when 'umar' then 'Shoulder region'
    when 'brat-antebrat' then 'Arm and forearm region'
    when 'sold-fesieri' then 'Hip and gluteal region'
    when 'coapsa' then 'Thigh region'
    when 'gamba-picior' then 'Lower-leg and foot region'
    else upper(left(name_en, 1)) || substr(name_en, 2)
  end,
  updated_at = now();

update public.model_muscle_mappings mm
set
  display_name_ro = mm.popular_name_ro,
  display_name_en = mm.popular_name_en,
  latin_name = m.latin_name,
  updated_at = now()
from public.muscles m
where m.id = mm.muscle_id;

update public.model_muscle_mappings mm
set
  display_name_ro = mm.popular_name_ro,
  display_name_en = mm.popular_name_en,
  latin_name = mg.latin_name,
  updated_at = now()
from public.muscle_groups mg
where mg.id = mm.muscle_group_id
  and mm.muscle_id is null;

do $$
begin
  if exists (
    select 1
    from public.anatomy_structures
    where nullif(trim(popular_name_ro), '') is null
       or nullif(trim(popular_name_en), '') is null
       or nullif(trim(scientific_name_ro), '') is null
       or nullif(trim(scientific_name_en), '') is null
  ) then
    raise exception 'anatomy_structures contains incomplete canonical names';
  end if;

  if exists (
    select 1
    from public.muscles
    where nullif(trim(popular_name_ro), '') is null
       or nullif(trim(popular_name_en), '') is null
       or nullif(trim(scientific_name_ro), '') is null
       or nullif(trim(scientific_name_en), '') is null
  ) then
    raise exception 'muscles contains incomplete canonical names';
  end if;

  if exists (
    select 1
    from public.muscle_groups
    where nullif(trim(popular_name_ro), '') is null
       or nullif(trim(popular_name_en), '') is null
       or nullif(trim(scientific_name_ro), '') is null
       or nullif(trim(scientific_name_en), '') is null
  ) then
    raise exception 'muscle_groups contains incomplete canonical names';
  end if;

  if exists (
    select 1
    from public.body_regions
    where nullif(trim(popular_name_ro), '') is null
       or nullif(trim(popular_name_en), '') is null
       or nullif(trim(scientific_name_ro), '') is null
       or nullif(trim(scientific_name_en), '') is null
  ) then
    raise exception 'body_regions contains incomplete canonical names';
  end if;
end
$$;

alter table public.anatomy_structures
  alter column popular_name_ro set not null,
  alter column popular_name_en set not null,
  alter column scientific_name_ro set not null,
  alter column scientific_name_en set not null;

alter table public.muscles
  alter column popular_name_ro set not null,
  alter column popular_name_en set not null,
  alter column scientific_name_ro set not null,
  alter column scientific_name_en set not null;

alter table public.muscle_groups
  alter column popular_name_ro set not null,
  alter column popular_name_en set not null,
  alter column scientific_name_ro set not null,
  alter column scientific_name_en set not null;

alter table public.body_regions
  alter column popular_name_ro set not null,
  alter column popular_name_en set not null,
  alter column scientific_name_ro set not null,
  alter column scientific_name_en set not null;

alter table public.model_muscle_mappings
  drop constraint if exists model_muscle_mappings_display_matches_popular_ro,
  drop constraint if exists model_muscle_mappings_display_matches_popular_en;

alter table public.model_muscle_mappings
  add constraint model_muscle_mappings_display_matches_popular_ro
    check (display_name_ro = popular_name_ro),
  add constraint model_muscle_mappings_display_matches_popular_en
    check (display_name_en = popular_name_en);

create index if not exists anatomy_structures_popular_names_idx
  on public.anatomy_structures (popular_name_ro, popular_name_en);

create index if not exists muscles_popular_names_idx
  on public.muscles (popular_name_ro, popular_name_en);

create index if not exists muscle_groups_popular_names_idx
  on public.muscle_groups (popular_name_ro, popular_name_en);

drop view if exists public.anatomy_name_catalog;

create view public.anatomy_name_catalog
with (security_invoker = true)
as
select
  'anatomy_structures'::text as source_table,
  a.id::text as entity_id,
  a.slug,
  a.model_selection_id,
  a.tissue::text as entity_type,
  a.popular_name_ro,
  a.popular_name_en,
  a.scientific_name_ro,
  a.scientific_name_en,
  a.latin_name
from public.anatomy_structures a
union all
select
  'muscles',
  m.id::text,
  m.slug,
  null::text,
  'muscle',
  m.popular_name_ro,
  m.popular_name_en,
  m.scientific_name_ro,
  m.scientific_name_en,
  m.latin_name
from public.muscles m
union all
select
  'muscle_groups',
  mg.id::text,
  mg.slug,
  null::text,
  'muscle_group',
  mg.popular_name_ro,
  mg.popular_name_en,
  mg.scientific_name_ro,
  mg.scientific_name_en,
  mg.latin_name
from public.muscle_groups mg
union all
select
  'body_regions',
  br.id::text,
  br.slug,
  null::text,
  'body_region',
  br.popular_name_ro,
  br.popular_name_en,
  br.scientific_name_ro,
  br.scientific_name_en,
  br.latin_name
from public.body_regions br
union all
select
  'model_muscle_mappings',
  mm.id::text,
  mm.model_selection_id,
  mm.model_selection_id,
  mm.entity_type::text,
  mm.popular_name_ro,
  mm.popular_name_en,
  mm.scientific_name_ro,
  mm.scientific_name_en,
  mm.latin_name
from public.model_muscle_mappings mm
where mm.active = true;

comment on view public.anatomy_name_catalog is
  'Catalogul canonic Santix: popular_name_ro/en este destinat interfeței, scientific_name_ro/en și latin_name sunt destinate AI-ului și detaliilor anatomice.';

grant select on table public.anatomy_name_catalog to anon, authenticated;

commit;
