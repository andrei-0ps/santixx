begin;

alter table public.anatomy_structures
  add column if not exists model_3d_availability text not null default 'not_mapped',
  add column if not exists model_3d_selectable boolean not null default false,
  add column if not exists model_3d_notes_ro text,
  add column if not exists model_3d_notes_en text;

alter table public.anatomy_structures
  drop constraint if exists anatomy_structures_model_3d_availability_check,
  add constraint anatomy_structures_model_3d_availability_check
    check (
      model_3d_availability in (
        'exact_mesh',
        'embedded_mesh',
        'regional_only',
        'not_available',
        'not_mapped'
      )
    ),
  drop constraint if exists anatomy_structures_model_3d_selectable_check,
  add constraint anatomy_structures_model_3d_selectable_check
    check (
      model_3d_selectable = false
      or model_3d_availability = 'exact_mesh'
    );

update public.anatomy_structures
set
  model_3d_availability = case slug
    when 'organ-inima' then 'exact_mesh'
    when 'organ-plamani' then 'exact_mesh'
    when 'organ-ficat' then 'exact_mesh'
    when 'organ-rinichi' then 'exact_mesh'
    when 'organ-intestine' then 'exact_mesh'
    when 'organ-pancreas' then 'exact_mesh'
    when 'organ-vezica-urinara' then 'exact_mesh'
    when 'organ-trahee' then 'embedded_mesh'
    else 'not_available'
  end,
  model_3d_selectable = slug in (
    'organ-inima',
    'organ-plamani',
    'organ-ficat',
    'organ-rinichi',
    'organ-intestine',
    'organ-pancreas',
    'organ-vezica-urinara'
  ),
  model_3d_notes_ro = case slug
    when 'organ-trahee' then 'Traheea este inclusă vizual în modelul respirator, dar nu este selectabilă separat.'
    when 'organ-stomac' then 'Modelul 3D actual nu conține un obiect separat și verificat pentru stomac.'
    when 'organ-splina' then 'Modelul 3D actual nu conține un obiect separat și verificat pentru splină.'
    when 'organ-esofag' then 'Modelul 3D actual nu conține un obiect separat și verificat pentru esofag.'
    else 'Structura are un obiect 3D separat și poate fi selectată în stratul de organe.'
  end,
  model_3d_notes_en = case slug
    when 'organ-trahee' then 'The trachea is visually embedded in the respiratory model but is not separately selectable.'
    when 'organ-stomac' then 'The current 3D model does not contain a separate verified stomach object.'
    when 'organ-splina' then 'The current 3D model does not contain a separate verified spleen object.'
    when 'organ-esofag' then 'The current 3D model does not contain a separate verified esophagus object.'
    else 'The structure has a separate 3D object and can be selected in the organ layer.'
  end,
  updated_at = now()
where tissue = 'organ';

insert into public.anatomy_structures (
  slug,
  name_ro,
  name_latin,
  tissue,
  body_region,
  model_selection_id,
  description_ro,
  description_en,
  function_ro,
  function_en,
  common_name_ro,
  scientific_name_ro,
  scientific_name_en,
  display_name_ro,
  display_name_en,
  popular_name_ro,
  popular_name_en,
  english_name,
  latin_name,
  aliases_ro,
  missing_ro_display_name,
  model_3d_availability,
  model_3d_selectable,
  model_3d_notes_ro,
  model_3d_notes_en
)
values
  (
    'tendon-ahile',
    'Tendonul calcanean',
    'Tendo calcaneus',
    'tendon',
    'gamba_picior',
    null,
    'Tendon puternic aflat în spatele gleznei, format prin unirea tendoanelor mușchilor gastrocnemian și solear.',
    'A strong tendon at the back of the ankle, formed by the joining of the gastrocnemius and soleus tendons.',
    'Transmite forța mușchilor gambei către călcâi și ajută la ridicarea pe vârfuri, mers, alergare și sărituri.',
    'Transfers calf-muscle force to the heel and helps with rising onto the toes, walking, running and jumping.',
    'Tendonul lui Ahile',
    'Tendonul calcanean',
    'Calcaneal tendon',
    'Tendonul lui Ahile',
    'Achilles tendon',
    'Tendonul lui Ahile',
    'Achilles tendon',
    'Achilles tendon',
    'Tendo calcaneus',
    array['tendonul lui Ahile', 'tendon Ahile', 'tendon calcanean'],
    false,
    'exact_mesh',
    false,
    'Modelul conține obiecte stânga/dreapta pentru tendonul calcanean, dar selecția lor exactă va fi activată la pasul 8.',
    'The model contains left and right calcaneal tendon objects, but exact selection will be enabled in step 8.'
  ),
  (
    'tendon-patelar',
    'Ligamentul patelar',
    'Ligamentum patellae',
    'tendon',
    'genunchi',
    null,
    'Bandă fibroasă puternică situată sub rotulă, numită frecvent tendon patelar deoarece continuă mecanismul tendonului cvadricepsului.',
    'A strong fibrous band below the kneecap, commonly called the patellar tendon because it continues the quadriceps tendon mechanism.',
    'Leagă rotula de tibie și permite transmiterea forței necesare pentru îndreptarea genunchiului.',
    'Connects the kneecap to the tibia and transfers the force needed to straighten the knee.',
    'Tendonul de sub rotulă',
    'Ligamentul patelar',
    'Patellar ligament',
    'Tendonul de sub rotulă',
    'Patellar tendon',
    'Tendonul de sub rotulă',
    'Patellar tendon',
    'Patellar tendon',
    'Ligamentum patellae',
    array['tendon patelar', 'tendon rotulian', 'ligament patelar'],
    false,
    'regional_only',
    false,
    'Nu există un mesh separat verificat; poate fi asociat doar regiunii anterioare a genunchiului.',
    'There is no verified separate mesh; it can only be associated with the front of the knee.'
  ),
  (
    'tendon-cvadriceps',
    'Tendonul cvadricepsului femural',
    'Tendo musculi quadricipitis femoris',
    'tendon',
    'genunchi',
    null,
    'Tendon comun aflat deasupra rotulei, format de cele patru componente ale mușchiului cvadriceps femural.',
    'The common tendon above the kneecap formed by the four components of the quadriceps femoris muscle.',
    'Transmite forța cvadricepsului către rotulă și participă la îndreptarea genunchiului.',
    'Transfers quadriceps force to the kneecap and contributes to straightening the knee.',
    'Tendonul de deasupra rotulei',
    'Tendonul cvadricepsului femural',
    'Quadriceps tendon',
    'Tendonul de deasupra rotulei',
    'Quadriceps tendon',
    'Tendonul de deasupra rotulei',
    'Quadriceps tendon',
    'Quadriceps tendon',
    'Tendo musculi quadricipitis femoris',
    array['tendon cvadriceps', 'tendonul cvadricepsului'],
    false,
    'regional_only',
    false,
    'Nu există un mesh separat verificat; poate fi asociat doar regiunii de deasupra rotulei.',
    'There is no verified separate mesh; it can only be associated with the area above the kneecap.'
  ),
  (
    'tendoane-coafa-rotatorilor',
    'Tendoanele coafei rotatorilor',
    null,
    'tendon',
    'umar',
    null,
    'Grup de patru tendoane care înconjoară capul humerusului și aparțin mușchilor supraspinos, infraspinos, rotund mic și subscapular.',
    'A group of four tendons surrounding the head of the humerus, belonging to the supraspinatus, infraspinatus, teres minor and subscapularis muscles.',
    'Stabilizează umărul și transmit forța necesară pentru ridicarea și rotirea brațului.',
    'Stabilise the shoulder and transfer force for lifting and rotating the arm.',
    'Tendoanele umărului',
    'Tendoanele coafei rotatorilor',
    'Rotator cuff tendons',
    'Tendoanele umărului',
    'Shoulder tendons',
    'Tendoanele umărului',
    'Shoulder tendons',
    'Rotator cuff tendons',
    null,
    array['coafa rotatorilor', 'tendoane umăr', 'tendon supraspinos'],
    false,
    'regional_only',
    false,
    'Modelul are mușchii coafei rotatorilor, dar nu are tendoanele separate și selectabile.',
    'The model contains the rotator cuff muscles but not separate selectable tendons.'
  ),
  (
    'tendon-biceps-brahial-proximal',
    'Tendoanele proximale ale bicepsului brahial',
    null,
    'tendon',
    'umar',
    null,
    'Tendoanele capului lung și capului scurt ale bicepsului, situate la capătul superior al brațului și conectate de regiunea umărului.',
    'The long-head and short-head biceps tendons at the upper end of the arm, connected to the shoulder region.',
    'Ancorează partea superioară a bicepsului și contribuie la mișcările umărului și brațului.',
    'Anchor the upper biceps and contribute to shoulder and arm movement.',
    'Tendoanele bicepsului de la umăr',
    'Tendoanele proximale ale bicepsului brahial',
    'Proximal biceps brachii tendons',
    'Tendoanele bicepsului de la umăr',
    'Biceps tendons at the shoulder',
    'Tendoanele bicepsului de la umăr',
    'Biceps tendons at the shoulder',
    'Proximal biceps tendons',
    null,
    array['tendon biceps umăr', 'tendon cap lung biceps'],
    false,
    'regional_only',
    false,
    'Modelul are bicepsul, dar nu separă tendoanele proximale.',
    'The model contains the biceps muscle but does not separate the proximal tendons.'
  ),
  (
    'tendon-biceps-brahial-distal',
    'Tendonul distal al bicepsului brahial',
    'Tendo musculi bicipitis brachii',
    'tendon',
    'cot',
    null,
    'Tendon aflat în partea din față a cotului, prin care bicepsul se fixează pe radius.',
    'The tendon at the front of the elbow through which the biceps attaches to the radius.',
    'Ajută la îndoirea cotului și mai ales la rotirea antebrațului cu palma în sus.',
    'Helps bend the elbow and especially rotate the forearm so the palm faces upward.',
    'Tendonul bicepsului de la cot',
    'Tendonul distal al bicepsului brahial',
    'Distal biceps brachii tendon',
    'Tendonul bicepsului de la cot',
    'Biceps tendon at the elbow',
    'Tendonul bicepsului de la cot',
    'Biceps tendon at the elbow',
    'Distal biceps tendon',
    'Tendo musculi bicipitis brachii',
    array['tendon biceps cot', 'tendon distal biceps'],
    false,
    'regional_only',
    false,
    'Modelul are bicepsul și oasele cotului, dar nu are tendonul distal separat.',
    'The model contains the biceps and elbow bones but not a separate distal tendon.'
  ),
  (
    'tendon-triceps-brahial',
    'Tendonul tricepsului brahial',
    'Tendo musculi tricipitis brachii',
    'tendon',
    'cot',
    null,
    'Tendon aflat în spatele cotului, prin care tricepsul se fixează pe olecranul ulnei.',
    'The tendon at the back of the elbow through which the triceps attaches to the olecranon of the ulna.',
    'Transmite forța tricepsului pentru îndreptarea cotului.',
    'Transfers triceps force to straighten the elbow.',
    'Tendonul din spatele cotului',
    'Tendonul tricepsului brahial',
    'Triceps brachii tendon',
    'Tendonul din spatele cotului',
    'Tendon at the back of the elbow',
    'Tendonul din spatele cotului',
    'Tendon at the back of the elbow',
    'Triceps tendon',
    'Tendo musculi tricipitis brachii',
    array['tendon triceps', 'tendon posterior cot'],
    false,
    'regional_only',
    false,
    'Modelul are tricepsul și oasele cotului, dar nu are tendonul separat.',
    'The model contains the triceps and elbow bones but not a separate tendon.'
  ),
  (
    'tendoane-flexoare-degete',
    'Tendoanele flexoare ale degetelor mâinii',
    null,
    'tendon',
    'mana_antebrat',
    null,
    'Tendoane care trec din antebraț prin palmă către degete, pe partea palmară a mâinii.',
    'Tendons running from the forearm through the palm to the fingers on the palm side of the hand.',
    'Transmit forța mușchilor flexori și permit îndoirea degetelor și prinderea obiectelor.',
    'Transfer flexor-muscle force and allow the fingers to bend and grip objects.',
    'Tendoanele care îndoaie degetele',
    'Tendoanele flexoare ale degetelor mâinii',
    'Finger flexor tendons',
    'Tendoanele care îndoaie degetele',
    'Finger-bending tendons',
    'Tendoanele care îndoaie degetele',
    'Finger-bending tendons',
    'Finger flexor tendons',
    null,
    array['tendoane flexoare', 'tendoane palmă', 'tendoane degete'],
    false,
    'regional_only',
    false,
    'Modelul actual nu separă tendoanele flexoare ale fiecărui deget.',
    'The current model does not separate the flexor tendons of each finger.'
  ),
  (
    'articulatie-umar',
    'Articulația glenohumerală',
    'Articulatio humeri',
    'articulatie',
    'umar',
    null,
    'Articulația principală a umărului, formată între capul humerusului și cavitatea glenoidă a scapulei.',
    'The main shoulder joint, formed between the head of the humerus and the glenoid cavity of the scapula.',
    'Permite mișcări ample ale brațului în mai multe direcții.',
    'Allows a wide range of arm movement in several directions.',
    'Articulația umărului',
    'Articulația glenohumerală',
    'Glenohumeral joint',
    'Articulația umărului',
    'Shoulder joint',
    'Articulația umărului',
    'Shoulder joint',
    'Shoulder joint',
    'Articulatio humeri',
    array['umăr', 'încheietura umărului', 'articulație glenohumerală'],
    false,
    'regional_only',
    false,
    'Suprafețele osoase sunt vizibile, dar articulația nu este un obiect 3D separat.',
    'The bony surfaces are visible, but the joint is not a separate 3D object.'
  ),
  (
    'articulatie-cot',
    'Articulația cotului',
    'Articulatio cubiti',
    'articulatie',
    'cot',
    null,
    'Complex articular format între humerus, ulnă și radius.',
    'A joint complex formed between the humerus, ulna and radius.',
    'Permite îndoirea și îndreptarea cotului și participă la rotirea antebrațului.',
    'Allows bending and straightening of the elbow and contributes to forearm rotation.',
    'Articulația cotului',
    'Articulația cotului',
    'Elbow joint',
    'Articulația cotului',
    'Elbow joint',
    'Articulația cotului',
    'Elbow joint',
    'Elbow joint',
    'Articulatio cubiti',
    array['cot', 'încheietura cotului'],
    false,
    'regional_only',
    false,
    'Oasele sunt vizibile, dar articulația și ligamentele nu sunt selectabile separat.',
    'The bones are visible, but the joint and ligaments are not separately selectable.'
  ),
  (
    'articulatie-pumn',
    'Articulația radiocarpiană',
    'Articulatio radiocarpalis',
    'articulatie',
    'mana_antebrat',
    null,
    'Articulația principală a pumnului, între radius și primul rând de oase carpiene.',
    'The main wrist joint, between the radius and the first row of carpal bones.',
    'Permite îndoirea, întinderea și înclinarea mâinii.',
    'Allows the hand to bend, extend and move side to side.',
    'Încheietura mâinii',
    'Articulația radiocarpiană',
    'Radiocarpal joint',
    'Încheietura mâinii',
    'Wrist joint',
    'Încheietura mâinii',
    'Wrist joint',
    'Wrist joint',
    'Articulatio radiocarpalis',
    array['pumn', 'încheietura mâinii', 'articulație radiocarpiană'],
    false,
    'regional_only',
    false,
    'Oasele pumnului sunt vizibile, dar articulația nu este un obiect separat.',
    'The wrist bones are visible, but the joint is not a separate object.'
  ),
  (
    'articulatie-sold',
    'Articulația coxofemurală',
    'Articulatio coxae',
    'articulatie',
    'sold_fesieri',
    null,
    'Articulație între capul femurului și acetabulul bazinului.',
    'The joint between the head of the femur and the acetabulum of the pelvis.',
    'Susține greutatea corpului și permite mișcările coapsei.',
    'Supports body weight and allows movement of the thigh.',
    'Articulația șoldului',
    'Articulația coxofemurală',
    'Hip joint',
    'Articulația șoldului',
    'Hip joint',
    'Articulația șoldului',
    'Hip joint',
    'Hip joint',
    'Articulatio coxae',
    array['șold', 'articulație coxofemurală'],
    false,
    'regional_only',
    false,
    'Suprafețele osoase sunt vizibile, dar articulația nu este selectabilă separat.',
    'The bony surfaces are visible, but the joint is not separately selectable.'
  ),
  (
    'articulatie-genunchi',
    'Articulația genunchiului',
    'Articulatio genus',
    'articulatie',
    'genunchi',
    null,
    'Complex articular format în principal între femur, tibie și rotulă.',
    'A joint complex formed mainly between the femur, tibia and kneecap.',
    'Permite îndoirea și îndreptarea membrului inferior și contribuie la stabilitate în sprijin.',
    'Allows the lower limb to bend and straighten and contributes to stability while bearing weight.',
    'Articulația genunchiului',
    'Articulația genunchiului',
    'Knee joint',
    'Articulația genunchiului',
    'Knee joint',
    'Articulația genunchiului',
    'Knee joint',
    'Knee joint',
    'Articulatio genus',
    array['genunchi', 'încheietura genunchiului'],
    false,
    'regional_only',
    false,
    'Oasele sunt vizibile, dar ligamentele, meniscurile și articulația nu sunt obiecte selectabile separat.',
    'The bones are visible, but the ligaments, menisci and joint are not separately selectable objects.'
  ),
  (
    'articulatie-glezna',
    'Articulația talocrurală',
    'Articulatio talocruralis',
    'articulatie',
    'gamba_picior',
    null,
    'Articulația principală a gleznei, formată între tibie, fibulă și talus.',
    'The main ankle joint, formed between the tibia, fibula and talus.',
    'Permite ridicarea și coborârea labei piciorului și ajută la mers și echilibru.',
    'Allows the foot to move upward and downward and supports walking and balance.',
    'Articulația gleznei',
    'Articulația talocrurală',
    'Talocrural joint',
    'Articulația gleznei',
    'Ankle joint',
    'Articulația gleznei',
    'Ankle joint',
    'Ankle joint',
    'Articulatio talocruralis',
    array['gleznă', 'încheietura gleznei', 'articulație talocrurală'],
    false,
    'regional_only',
    false,
    'Oasele sunt vizibile, dar articulația și ligamentele gleznei nu sunt selectabile separat.',
    'The bones are visible, but the ankle joint and ligaments are not separately selectable.'
  ),
  (
    'articulatie-temporomandibulara',
    'Articulația temporomandibulară',
    'Articulatio temporomandibularis',
    'articulatie',
    'cap_gat',
    null,
    'Articulația dintre mandibulă și osul temporal, situată în fața urechii.',
    'The joint between the mandible and temporal bone, located in front of the ear.',
    'Permite deschiderea gurii, masticația și mișcările laterale ale mandibulei.',
    'Allows mouth opening, chewing and side-to-side jaw movement.',
    'Articulația maxilarului',
    'Articulația temporomandibulară',
    'Temporomandibular joint',
    'Articulația maxilarului',
    'Jaw joint',
    'Articulația maxilarului',
    'Jaw joint',
    'Temporomandibular joint',
    'Articulatio temporomandibularis',
    array['ATM', 'articulația mandibulei', 'articulația maxilarului'],
    false,
    'regional_only',
    false,
    'Mandibula și osul temporal sunt vizibile, dar articulația nu este un obiect separat.',
    'The mandible and temporal bone are visible, but the joint is not a separate object.'
  )
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  name_latin = excluded.name_latin,
  tissue = excluded.tissue,
  body_region = excluded.body_region,
  model_selection_id = excluded.model_selection_id,
  description_ro = excluded.description_ro,
  description_en = excluded.description_en,
  function_ro = excluded.function_ro,
  function_en = excluded.function_en,
  common_name_ro = excluded.common_name_ro,
  scientific_name_ro = excluded.scientific_name_ro,
  scientific_name_en = excluded.scientific_name_en,
  display_name_ro = excluded.display_name_ro,
  display_name_en = excluded.display_name_en,
  popular_name_ro = excluded.popular_name_ro,
  popular_name_en = excluded.popular_name_en,
  english_name = excluded.english_name,
  latin_name = excluded.latin_name,
  aliases_ro = excluded.aliases_ro,
  missing_ro_display_name = false,
  model_3d_availability = excluded.model_3d_availability,
  model_3d_selectable = excluded.model_3d_selectable,
  model_3d_notes_ro = excluded.model_3d_notes_ro,
  model_3d_notes_en = excluded.model_3d_notes_en,
  updated_at = now();

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
)
values
  ('How the Heart Works', 'Cum funcționează inima', 'https://www.nhlbi.nih.gov/health/heart', 'National Heart, Lung, and Blood Institute / NIH', 'medical_reference', 'heart anatomy and function', 'anatomia și funcția inimii', 'en', date '2026-06-23', true, 'verified'),
  ('How the Lungs Work', 'Cum funcționează plămânii', 'https://www.nhlbi.nih.gov/health/lungs', 'National Heart, Lung, and Blood Institute / NIH', 'medical_reference', 'lungs and respiratory system', 'plămâni și sistem respirator', 'en', date '2026-06-23', true, 'verified'),
  ('Your Digestive System and How It Works', 'Sistemul digestiv și modul în care funcționează', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'medical_reference', 'digestive organs', 'organe digestive', 'en', date '2026-06-23', true, 'verified'),
  ('Your Kidneys and How They Work', 'Rinichii și modul în care funcționează', 'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'medical_reference', 'kidney anatomy and function', 'anatomia și funcția rinichilor', 'en', date '2026-06-23', true, 'verified'),
  ('The Urinary Tract and How It Works', 'Tractul urinar și modul în care funcționează', 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works', 'National Institute of Diabetes and Digestive and Kidney Diseases / NIH', 'medical_reference', 'urinary tract and bladder', 'tract urinar și vezică urinară', 'en', date '2026-06-23', true, 'verified'),
  ('Anatomy, Abdomen and Pelvis, Spleen', 'Anatomia splinei', 'https://www.ncbi.nlm.nih.gov/books/NBK482235/', 'NCBI Bookshelf / StatPearls', 'clinical_review', 'spleen anatomy and function', 'anatomia și funcția splinei', 'en', date '2026-06-23', true, 'verified'),
  ('Achilles Tendinitis', 'Tendinopatia tendonului lui Ahile', 'https://orthoinfo.aaos.org/en/diseases--conditions/achilles-tendinitis/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'Achilles tendon anatomy and tendinopathy', 'anatomia și tendinopatia tendonului lui Ahile', 'en', date '2026-06-23', true, 'verified'),
  ('Patellar Tendon Tear', 'Ruptura tendonului patelar', 'https://orthoinfo.aaos.org/en/diseases--conditions/patellar-tendon-tear/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'patellar tendon anatomy and tear', 'anatomia și ruptura tendonului patelar', 'en', date '2026-06-23', true, 'verified'),
  ('Quadriceps Tendon Tear', 'Ruptura tendonului cvadricepsului', 'https://orthoinfo.aaos.org/en/diseases--conditions/quadriceps-tendon-tear/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'quadriceps tendon anatomy and tear', 'anatomia și ruptura tendonului cvadricepsului', 'en', date '2026-06-23', true, 'verified'),
  ('Rotator Cuff Tears', 'Rupturile coafei rotatorilor', 'https://orthoinfo.aaos.org/en/diseases--conditions/rotator-cuff-tears/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'rotator cuff tendon anatomy and tears', 'anatomia și rupturile tendoanelor coafei rotatorilor', 'en', date '2026-06-23', true, 'verified'),
  ('Biceps Tendon Tear at the Shoulder', 'Ruptura tendonului bicepsului la umăr', 'https://orthoinfo.aaos.org/en/diseases--conditions/biceps-tendon-tear-at-the-shoulder/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'proximal biceps tendons', 'tendoanele proximale ale bicepsului', 'en', date '2026-06-23', true, 'verified'),
  ('Biceps Tendon Tear at the Elbow', 'Ruptura tendonului bicepsului la cot', 'https://orthoinfo.aaos.org/en/diseases--conditions/biceps-tendon-tear-at-the-elbow/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'distal biceps tendon', 'tendonul distal al bicepsului', 'en', date '2026-06-23', true, 'verified'),
  ('Triceps Tendon Tear at the Elbow', 'Ruptura tendonului tricepsului la cot', 'https://orthoinfo.aaos.org/en/diseases--conditions/triceps-tendon-tear-at-the-elbow/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'triceps tendon', 'tendonul tricepsului', 'en', date '2026-06-23', true, 'verified'),
  ('Flexor Tendon Injuries', 'Leziunile tendoanelor flexoare', 'https://orthoinfo.aaos.org/en/diseases--conditions/flexor-tendon-injuries/', 'American Academy of Orthopaedic Surgeons (AAOS)', 'medical_reference', 'finger flexor tendons', 'tendoanele flexoare ale degetelor', 'en', date '2026-06-23', true, 'verified'),
  ('Joint Disorders', 'Afecțiuni ale articulațiilor', 'https://medlineplus.gov/jointdisorders.html', 'MedlinePlus / NIH', 'medical_reference', 'joint anatomy, injuries and disorders', 'anatomia, leziunile și afecțiunile articulațiilor', 'en', date '2026-06-23', true, 'verified')
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

delete from public.ai_knowledge_entries
where metadata ->> 'seed' = 'step7_v1';

with source_map(structure_slug, source_url) as (
  values
    ('organ-inima', 'https://www.nhlbi.nih.gov/health/heart'),
    ('organ-plamani', 'https://www.nhlbi.nih.gov/health/lungs'),
    ('organ-trahee', 'https://www.nhlbi.nih.gov/health/lungs'),
    ('organ-esofag', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-stomac', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-ficat', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-pancreas', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-intestine', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-rinichi', 'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work'),
    ('organ-vezica-urinara', 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works'),
    ('organ-splina', 'https://www.ncbi.nlm.nih.gov/books/NBK482235/'),
    ('tendon-ahile', 'https://orthoinfo.aaos.org/en/diseases--conditions/achilles-tendinitis/'),
    ('tendon-patelar', 'https://orthoinfo.aaos.org/en/diseases--conditions/patellar-tendon-tear/'),
    ('tendon-cvadriceps', 'https://orthoinfo.aaos.org/en/diseases--conditions/quadriceps-tendon-tear/'),
    ('tendoane-coafa-rotatorilor', 'https://orthoinfo.aaos.org/en/diseases--conditions/rotator-cuff-tears/'),
    ('tendon-biceps-brahial-proximal', 'https://orthoinfo.aaos.org/en/diseases--conditions/biceps-tendon-tear-at-the-shoulder/'),
    ('tendon-biceps-brahial-distal', 'https://orthoinfo.aaos.org/en/diseases--conditions/biceps-tendon-tear-at-the-elbow/'),
    ('tendon-triceps-brahial', 'https://orthoinfo.aaos.org/en/diseases--conditions/triceps-tendon-tear-at-the-elbow/'),
    ('tendoane-flexoare-degete', 'https://orthoinfo.aaos.org/en/diseases--conditions/flexor-tendon-injuries/'),
    ('articulatie-umar', 'https://medlineplus.gov/jointdisorders.html'),
    ('articulatie-cot', 'https://medlineplus.gov/jointdisorders.html'),
    ('articulatie-pumn', 'https://medlineplus.gov/jointdisorders.html'),
    ('articulatie-sold', 'https://medlineplus.gov/jointdisorders.html'),
    ('articulatie-genunchi', 'https://medlineplus.gov/jointdisorders.html'),
    ('articulatie-glezna', 'https://medlineplus.gov/jointdisorders.html'),
    ('articulatie-temporomandibulara', 'https://medlineplus.gov/jointdisorders.html')
),
targets as (
  select structure.*, source.id as source_id, source_map.source_url
  from public.anatomy_structures structure
  join source_map on source_map.structure_slug = structure.slug
  join public.medical_sources source on source.url = source_map.source_url
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
  target.tissue,
  target.slug,
  target.model_selection_id,
  target.body_region,
  'anatomie'::public.knowledge_category,
  'Context anatomic: ' || target.popular_name_ro,
  target.description_ro || ' Funcție principală: ' || target.function_ro ||
    case when target.latin_name is not null then ' Denumire latină: ' || target.latin_name || '.' else '' end,
  'Anatomical context: ' || target.popular_name_en,
  target.description_en || ' Main function: ' || target.function_en ||
    case when target.latin_name is not null then ' Latin name: ' || target.latin_name || '.' else '' end,
  target.popular_name_ro,
  target.popular_name_en,
  8,
  target.source_id,
  array[target.tissue::text, target.body_region, target.slug, 'anatomie'],
  jsonb_build_object(
    'seed', 'step7_v1',
    'source_url', target.source_url,
    'model_3d_availability', target.model_3d_availability,
    'model_3d_selectable', target.model_3d_selectable
  ),
  true
from targets target;

with organ_guidance(
  structure_slug,
  warning_ro,
  warning_en,
  questions_ro,
  questions_en
) as (
  values
    (
      'organ-inima',
      'Durerea sau presiunea în piept, lipsa de aer, transpirațiile reci, leșinul ori durerea care se extinde spre braț, spate, gât sau mandibulă necesită evaluare de urgență.',
      'Chest pain or pressure, shortness of breath, cold sweats, fainting, or pain spreading to the arm, back, neck or jaw requires emergency assessment.',
      'Întreabă unde este disconfortul, când a început, dacă apare la efort, dacă se extinde în altă zonă și dacă există lipsă de aer, palpitații, amețeală sau leșin.',
      'Ask where the discomfort is, when it began, whether it occurs with exertion, whether it spreads, and whether there is shortness of breath, palpitations, dizziness or fainting.'
    ),
    (
      'organ-plamani',
      'Lipsa severă de aer, buzele albăstrui, durerea toracică bruscă, tusea cu sânge, confuzia sau scăderea stării de conștiență necesită ajutor medical urgent.',
      'Severe shortness of breath, blue lips, sudden chest pain, coughing up blood, confusion or reduced consciousness requires urgent medical help.',
      'Întreabă când a început lipsa de aer, dacă există tuse, febră, durere toracică, respirație șuierătoare, sânge în spută și dacă simptomele apar în repaus sau la efort.',
      'Ask when breathlessness began, whether there is cough, fever, chest pain, wheezing or blood in sputum, and whether symptoms occur at rest or with activity.'
    ),
    (
      'organ-trahee',
      'Respirația zgomotoasă apărută brusc, senzația de sufocare, imposibilitatea de a vorbi sau înghiți și colorarea albăstruie a buzelor indică o urgență.',
      'Sudden noisy breathing, choking, inability to speak or swallow, and blue lips indicate an emergency.',
      'Întreabă dacă simptomele au început după înghițirea unui aliment sau obiect, dacă există tuse, răgușeală, dificultate la respirație ori la înghițire.',
      'Ask whether symptoms began after swallowing food or an object and whether there is cough, hoarseness, difficulty breathing or difficulty swallowing.'
    ),
    (
      'organ-esofag',
      'Imposibilitatea de a înghiți saliva, senzația de aliment blocat, durerea toracică severă, vărsăturile cu sânge sau dificultatea de respirație necesită evaluare urgentă.',
      'Inability to swallow saliva, food feeling stuck, severe chest pain, vomiting blood or difficulty breathing requires urgent assessment.',
      'Întreabă dacă problema apare la solide, lichide sau ambele, dacă înghițirea doare, dacă există arsuri, regurgitație, scădere în greutate ori senzație de aliment blocat.',
      'Ask whether the problem occurs with solids, liquids or both, whether swallowing is painful, and whether there is heartburn, regurgitation, weight loss or food sticking.'
    ),
    (
      'organ-stomac',
      'Durerea abdominală severă, abdomenul rigid, vărsăturile persistente, vărsăturile cu sânge, scaunul negru sau leșinul necesită evaluare urgentă.',
      'Severe abdominal pain, a rigid abdomen, persistent vomiting, vomiting blood, black stools or fainting requires urgent assessment.',
      'Întreabă unde este durerea, legătura cu mesele, prezența grețurilor, vărsăturilor, arsurilor, balonării, scaunului negru și a scăderii în greutate.',
      'Ask where the pain is, how it relates to meals, and whether there is nausea, vomiting, heartburn, bloating, black stools or weight loss.'
    ),
    (
      'organ-ficat',
      'Icterul apărut rapid, confuzia, somnolența neobișnuită, sângerarea, vărsăturile cu sânge sau durerea abdominală severă necesită evaluare urgentă.',
      'Rapid-onset jaundice, confusion, unusual drowsiness, bleeding, vomiting blood or severe abdominal pain requires urgent assessment.',
      'Întreabă despre durerea din dreapta sus a abdomenului, colorarea galbenă a pielii, urina închisă, scaunul decolorat, greață, medicamente, alcool și febră.',
      'Ask about right-upper abdominal pain, yellow skin, dark urine, pale stools, nausea, medicines, alcohol use and fever.'
    ),
    (
      'organ-pancreas',
      'Durerea severă în abdomenul superior care se extinde spre spate, vărsăturile persistente, febra, leșinul sau starea generală foarte alterată necesită evaluare urgentă.',
      'Severe upper-abdominal pain spreading to the back, persistent vomiting, fever, fainting or a markedly unwell state requires urgent assessment.',
      'Întreabă unde este durerea, dacă merge spre spate, când a început, dacă există greață, vărsături, febră și dacă simptomele se agravează după masă.',
      'Ask where the pain is, whether it spreads to the back, when it began, whether there is nausea, vomiting or fever, and whether it worsens after eating.'
    ),
    (
      'organ-intestine',
      'Durerea abdominală severă sau în creștere, abdomenul rigid, sângele în scaun, vărsăturile persistente, imposibilitatea eliminării gazelor ori leșinul necesită evaluare urgentă.',
      'Severe or worsening abdominal pain, a rigid abdomen, blood in stool, persistent vomiting, inability to pass gas or fainting requires urgent assessment.',
      'Întreabă despre localizarea durerii, tranzit, diaree, constipație, sânge, vărsături, febră, balonare și ultima eliminare de gaze sau scaun.',
      'Ask about pain location, bowel movements, diarrhoea, constipation, blood, vomiting, fever, bloating and the last passage of gas or stool.'
    ),
    (
      'organ-rinichi',
      'Durerea puternică de flanc cu febră sau frisoane, sângele vizibil în urină, imposibilitatea de a urina, confuzia ori starea generală foarte alterată necesită evaluare urgentă.',
      'Severe flank pain with fever or chills, visible blood in urine, inability to urinate, confusion or a markedly unwell state requires urgent assessment.',
      'Întreabă despre durerea de flanc sau spate, febră, usturime la urinare, frecvență, sânge în urină, greață, cantitatea de urină și antecedente de calculi.',
      'Ask about flank or back pain, fever, burning urination, frequency, blood in urine, nausea, urine output and a history of stones.'
    ),
    (
      'organ-vezica-urinara',
      'Imposibilitatea de a urina cu durere abdominală, sângele vizibil în urină, febra cu frisoane, confuzia sau durerea severă necesită evaluare urgentă.',
      'Inability to urinate with abdominal pain, visible blood in urine, fever with chills, confusion or severe pain requires urgent assessment.',
      'Întreabă despre usturime, urinări dese sau urgente, dificultatea de a porni jetul, golirea incompletă, sânge, febră și durerea din partea de jos a abdomenului.',
      'Ask about burning, frequent or urgent urination, difficulty starting, incomplete emptying, blood, fever and lower-abdominal pain.'
    ),
    (
      'organ-splina',
      'După o lovitură, durerea în stânga sus a abdomenului sau în umărul stâng, amețeala, leșinul, paloarea ori pulsul rapid pot indica sângerare internă și necesită urgență.',
      'After an impact, pain in the left upper abdomen or left shoulder, dizziness, fainting, pallor or a rapid pulse may indicate internal bleeding and requires emergency care.',
      'Întreabă dacă a existat o lovitură sau cădere, unde este durerea, dacă se extinde spre umărul stâng și dacă există amețeală, slăbiciune, febră sau senzație de plenitudine.',
      'Ask whether there was an impact or fall, where the pain is, whether it spreads to the left shoulder, and whether there is dizziness, weakness, fever or fullness.'
    )
),
source_map(structure_slug, source_url) as (
  values
    ('organ-inima', 'https://www.nhlbi.nih.gov/health/heart'),
    ('organ-plamani', 'https://www.nhlbi.nih.gov/health/lungs'),
    ('organ-trahee', 'https://www.nhlbi.nih.gov/health/lungs'),
    ('organ-esofag', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-stomac', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-ficat', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-pancreas', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-intestine', 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'),
    ('organ-rinichi', 'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work'),
    ('organ-vezica-urinara', 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works'),
    ('organ-splina', 'https://www.ncbi.nlm.nih.gov/books/NBK482235/')
),
organ_targets as (
  select structure.*, guidance.*, source.id as source_id, source_map.source_url
  from organ_guidance guidance
  join public.anatomy_structures structure on structure.slug = guidance.structure_slug
  join source_map on source_map.structure_slug = structure.slug
  join public.medical_sources source on source.url = source_map.source_url
),
guidance_rows as (
  select
    target.*,
    'semne_alarma'::public.knowledge_category as category,
    'Semne de alarmă: ' || target.popular_name_ro as title_ro,
    target.warning_ro as content_ro,
    'Warning signs: ' || target.popular_name_en as title_en,
    target.warning_en as content_en,
    10::smallint as priority
  from organ_targets target
  union all
  select
    target.*,
    'intrebari_clarificare'::public.knowledge_category,
    'Întrebări utile: ' || target.popular_name_ro,
    target.questions_ro,
    'Useful questions: ' || target.popular_name_en,
    target.questions_en,
    8::smallint
  from organ_targets target
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
  row.tissue,
  row.slug,
  row.model_selection_id,
  row.body_region,
  row.category,
  row.title_ro,
  row.content_ro,
  row.title_en,
  row.content_en,
  row.popular_name_ro,
  row.popular_name_en,
  row.priority,
  row.source_id,
  array[row.tissue::text, row.body_region, row.slug, row.category::text],
  jsonb_build_object(
    'seed', 'step7_v1',
    'source_url', row.source_url,
    'model_3d_availability', row.model_3d_availability,
    'model_3d_selectable', row.model_3d_selectable
  ),
  true
from guidance_rows row;

with source_map(structure_slug, source_url) as (
  values
    ('tendon-ahile', 'https://orthoinfo.aaos.org/en/diseases--conditions/achilles-tendinitis/'),
    ('tendon-patelar', 'https://orthoinfo.aaos.org/en/diseases--conditions/patellar-tendon-tear/'),
    ('tendon-cvadriceps', 'https://orthoinfo.aaos.org/en/diseases--conditions/quadriceps-tendon-tear/'),
    ('tendoane-coafa-rotatorilor', 'https://orthoinfo.aaos.org/en/diseases--conditions/rotator-cuff-tears/'),
    ('tendon-biceps-brahial-proximal', 'https://orthoinfo.aaos.org/en/diseases--conditions/biceps-tendon-tear-at-the-shoulder/'),
    ('tendon-biceps-brahial-distal', 'https://orthoinfo.aaos.org/en/diseases--conditions/biceps-tendon-tear-at-the-elbow/'),
    ('tendon-triceps-brahial', 'https://orthoinfo.aaos.org/en/diseases--conditions/triceps-tendon-tear-at-the-elbow/'),
    ('tendoane-flexoare-degete', 'https://orthoinfo.aaos.org/en/diseases--conditions/flexor-tendon-injuries/')
),
targets as (
  select structure.*, source.id as source_id, source_map.source_url
  from public.anatomy_structures structure
  join source_map on source_map.structure_slug = structure.slug
  join public.medical_sources source on source.url = source_map.source_url
),
guidance_rows as (
  select
    target.*,
    'semne_alarma'::public.knowledge_category as category,
    'Semne de alarmă: ' || target.popular_name_ro as title_ro,
    'Un pocnet urmat de pierderea bruscă a funcției, imposibilitatea mișcării obișnuite, deformarea, o vânătaie care se extinde rapid, o plagă deschisă sau amorțeala necesită evaluare medicală promptă.' as content_ro,
    'Warning signs: ' || target.popular_name_en as title_en,
    'A pop followed by sudden loss of function, inability to perform the usual movement, deformity, rapidly spreading bruising, an open wound or numbness requires prompt medical assessment.' as content_en,
    10::smallint as priority
  from targets target
  union all
  select
    target.*,
    'intrebari_clarificare'::public.knowledge_category,
    'Întrebări utile: ' || target.popular_name_ro,
    'Întreabă dacă durerea a apărut brusc sau treptat, dacă s-a auzit un pocnet, ce mișcare a declanșat problema, unde este durerea, dacă există umflare sau vânătaie și ce mișcare nu mai poate fi făcută.',
    'Useful questions: ' || target.popular_name_en,
    'Ask whether pain began suddenly or gradually, whether there was a pop, what movement triggered it, where the pain is, whether there is swelling or bruising, and which movement can no longer be performed.',
    8::smallint
  from targets target
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
  row.tissue,
  row.slug,
  row.model_selection_id,
  row.body_region,
  row.category,
  row.title_ro,
  row.content_ro,
  row.title_en,
  row.content_en,
  row.popular_name_ro,
  row.popular_name_en,
  row.priority,
  row.source_id,
  array[row.tissue::text, row.body_region, row.slug, row.category::text],
  jsonb_build_object(
    'seed', 'step7_v1',
    'source_url', row.source_url,
    'model_3d_availability', row.model_3d_availability,
    'model_3d_selectable', row.model_3d_selectable
  ),
  true
from guidance_rows row;

with targets as (
  select structure.*, source.id as source_id
  from public.anatomy_structures structure
  cross join lateral (
    select id
    from public.medical_sources
    where url = 'https://medlineplus.gov/jointdisorders.html'
  ) source
  where structure.tissue = 'articulatie'
    and structure.slug in (
      'articulatie-umar',
      'articulatie-cot',
      'articulatie-pumn',
      'articulatie-sold',
      'articulatie-genunchi',
      'articulatie-glezna',
      'articulatie-temporomandibulara'
    )
),
guidance_rows as (
  select
    target.*,
    'semne_alarma'::public.knowledge_category as category,
    'Semne de alarmă: ' || target.popular_name_ro as title_ro,
    'Deformarea sau poziția anormală după traumatism, imposibilitatea de a mișca sau sprijini, amorțeala, răcirea ori paloarea extremității, umflarea rapidă, o plagă deschisă sau o articulație roșie și fierbinte cu febră necesită evaluare urgentă.' as content_ro,
    'Warning signs: ' || target.popular_name_en as title_en,
    'Deformity or an abnormal position after injury, inability to move or bear weight, numbness, a cold or pale limb, rapid swelling, an open wound, or a red hot joint with fever requires urgent assessment.' as content_en,
    10::smallint as priority
  from targets target
  union all
  select
    target.*,
    'intrebari_clarificare'::public.knowledge_category,
    'Întrebări utile: ' || target.popular_name_ro,
    'Întreabă dacă a existat o răsucire, cădere sau lovitură, când a apărut umflarea, dacă articulația pare instabilă sau blocată, ce mișcări sunt posibile, dacă se poate face sprijin și dacă există febră, amorțeală sau modificarea culorii.',
    'Useful questions: ' || target.popular_name_en,
    'Ask whether there was a twist, fall or impact, when swelling appeared, whether the joint feels unstable or locked, which movements remain possible, whether weight can be borne, and whether there is fever, numbness or colour change.',
    8::smallint
  from targets target
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
  row.tissue,
  row.slug,
  row.model_selection_id,
  row.body_region,
  row.category,
  row.title_ro,
  row.content_ro,
  row.title_en,
  row.content_en,
  row.popular_name_ro,
  row.popular_name_en,
  row.priority,
  row.source_id,
  array[row.tissue::text, row.body_region, row.slug, row.category::text],
  jsonb_build_object(
    'seed', 'step7_v1',
    'source_url', 'https://medlineplus.gov/jointdisorders.html',
    'model_3d_availability', row.model_3d_availability,
    'model_3d_selectable', row.model_3d_selectable
  ),
  true
from guidance_rows row;

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
  knowledge.source_id,
  true,
  case
    when knowledge.category = 'anatomie' then 'anatomy'
    else 'primary'
  end,
  date '2026-06-23',
  'mapped'
from public.ai_knowledge_entries knowledge
where knowledge.metadata ->> 'seed' = 'step7_v1'
  and knowledge.source_id is not null
on conflict (knowledge_entry_id, source_id) do update set
  is_primary = true,
  evidence_scope = excluded.evidence_scope,
  source_checked_at = excluded.source_checked_at,
  review_status = excluded.review_status,
  verified_at = null;

insert into public.condition_structures (
  condition_id,
  structure_id,
  relevance,
  relevance_ro,
  relevance_en
)
select
  condition_row.id,
  structure.id,
  mapping.relevance,
  mapping.relevance_ro,
  mapping.relevance_en
from (
  values
    ('tendinopatie', 'tendon-ahile', 5, 'Tendon frecvent afectat de suprasolicitare și schimbări bruște ale încărcării.', 'A tendon commonly affected by overuse and sudden changes in loading.'),
    ('tendinopatie', 'tendon-patelar', 5, 'Durerea tendonului patelar apare frecvent în activități cu alergare și sărituri.', 'Patellar tendon pain commonly occurs in running and jumping activities.'),
    ('tendinopatie', 'tendon-cvadriceps', 4, 'Poate fi afectat de suprasolicitarea mecanismului de extensie al genunchiului.', 'May be affected by overload of the knee extensor mechanism.'),
    ('tendinopatie', 'tendoane-coafa-rotatorilor', 5, 'Tendoanele coafei rotatorilor sunt o cauză frecventă de durere la ridicarea brațului.', 'Rotator cuff tendons are a common source of pain when lifting the arm.'),
    ('tendinopatie', 'tendon-biceps-brahial-proximal', 4, 'Tendonul proximal al bicepsului poate contribui la durerea din partea anterioară a umărului.', 'The proximal biceps tendon may contribute to pain at the front of the shoulder.'),
    ('tendinopatie', 'tendon-biceps-brahial-distal', 3, 'Durerea de tendon poate apărea anterior la cot după solicitări repetitive.', 'Tendon pain may occur at the front of the elbow after repetitive loading.'),
    ('tendinopatie', 'tendon-triceps-brahial', 3, 'Suprasolicitarea poate produce durere în partea posterioară a cotului.', 'Overuse may cause pain at the back of the elbow.'),
    ('tendinopatie', 'tendoane-flexoare-degete', 4, 'Mișcările repetitive de prindere pot irita tendoanele flexoare și tecile lor.', 'Repetitive gripping may irritate the flexor tendons and their sheaths.'),
    ('ruptura-tendon', 'tendon-ahile', 5, 'Ruptura poate produce pocnet, durere bruscă și dificultate la împingerea în picior.', 'A tear may cause a pop, sudden pain and difficulty pushing off the foot.'),
    ('ruptura-tendon', 'tendon-patelar', 5, 'Ruptura completă poate împiedica îndreptarea activă a genunchiului.', 'A complete tear may prevent active straightening of the knee.'),
    ('ruptura-tendon', 'tendon-cvadriceps', 5, 'Ruptura poate produce pierderea extensiei genunchiului și o adâncitură deasupra rotulei.', 'A tear may cause loss of knee extension and a gap above the kneecap.'),
    ('ruptura-tendon', 'tendoane-coafa-rotatorilor', 4, 'Rupturile pot produce durere, slăbiciune și dificultate la ridicarea brațului.', 'Tears may cause pain, weakness and difficulty lifting the arm.'),
    ('ruptura-tendon', 'tendon-biceps-brahial-proximal', 4, 'Ruptura poate produce durere, vânătaie și modificarea conturului bicepsului.', 'A tear may cause pain, bruising and a change in the contour of the biceps.'),
    ('ruptura-tendon', 'tendon-biceps-brahial-distal', 5, 'Ruptura distală poate reduce forța de rotire a antebrațului și de îndoire a cotului.', 'A distal tear may reduce forearm rotation and elbow-bending strength.'),
    ('ruptura-tendon', 'tendon-triceps-brahial', 5, 'Ruptura poate produce slăbiciune importantă la îndreptarea cotului.', 'A tear may cause substantial weakness when straightening the elbow.'),
    ('ruptura-tendon', 'tendoane-flexoare-degete', 5, 'O secțiune sau ruptură poate împiedica îndoirea unuia sau mai multor degete.', 'A cut or tear may prevent one or more fingers from bending.'),
    ('entorsa-articulara', 'articulatie-umar', 4, 'Ligamentele și capsula umărului pot fi lezate prin cădere, răsucire sau tracțiune.', 'The shoulder ligaments and capsule may be injured by a fall, twist or traction.'),
    ('entorsa-articulara', 'articulatie-cot', 4, 'Entorsa poate apărea prin hiperextensie, cădere sau răsucirea forțată a cotului.', 'A sprain may occur through hyperextension, a fall or forced twisting of the elbow.'),
    ('entorsa-articulara', 'articulatie-pumn', 5, 'Căderea pe mâna întinsă este un mecanism frecvent pentru entorsa pumnului.', 'Falling onto an outstretched hand is a common mechanism for a wrist sprain.'),
    ('entorsa-articulara', 'articulatie-sold', 2, 'Entorsa șoldului este mai puțin frecventă, dar poate apărea după traumatisme sau mișcări forțate.', 'A hip sprain is less common but may occur after trauma or forced movement.'),
    ('entorsa-articulara', 'articulatie-genunchi', 5, 'Răsucirea sau schimbarea bruscă de direcție poate leza ligamentele genunchiului.', 'Twisting or a sudden change of direction may injure the knee ligaments.'),
    ('entorsa-articulara', 'articulatie-glezna', 5, 'Glezna este una dintre articulațiile cel mai frecvent afectate de entorse.', 'The ankle is one of the joints most commonly affected by sprains.'),
    ('entorsa-articulara', 'articulatie-temporomandibulara', 2, 'Întinderea structurilor articulare poate apărea după deschiderea forțată sau un traumatism.', 'Strain of joint structures may occur after forced opening or trauma.'),
    ('luxatie-articulara', 'articulatie-umar', 5, 'Umărul are mobilitate mare și este frecvent implicat în luxații traumatice.', 'The shoulder has a wide range of motion and is commonly involved in traumatic dislocations.'),
    ('luxatie-articulara', 'articulatie-cot', 5, 'Luxația cotului produce de obicei deformare și pierderea funcției după traumatism.', 'Elbow dislocation usually causes deformity and loss of function after trauma.'),
    ('luxatie-articulara', 'articulatie-pumn', 3, 'Luxațiile carpiene sunt mai rare, dar sunt leziuni importante după traumatisme puternice.', 'Carpal dislocations are less common but are important injuries after major trauma.'),
    ('luxatie-articulara', 'articulatie-sold', 5, 'Luxația șoldului este o urgență produsă de obicei prin traumatisme cu energie mare.', 'Hip dislocation is an emergency usually caused by high-energy trauma.'),
    ('luxatie-articulara', 'articulatie-genunchi', 5, 'Luxația genunchiului poate afecta vasele și nervii și necesită evaluare imediată.', 'Knee dislocation may injure blood vessels and nerves and requires immediate assessment.'),
    ('luxatie-articulara', 'articulatie-glezna', 4, 'Poate apărea împreună cu fracturi și necesită evaluare urgentă.', 'It may occur with fractures and requires urgent assessment.'),
    ('luxatie-articulara', 'articulatie-temporomandibulara', 4, 'Mandibula poate rămâne blocată cu gura deschisă și nu trebuie forțată la loc de utilizator.', 'The jaw may remain locked open and should not be forced back by the user.')
) as mapping(
  condition_slug,
  structure_slug,
  relevance,
  relevance_ro,
  relevance_en
)
join public.conditions condition_row
  on condition_row.slug = mapping.condition_slug
 and condition_row.active = true
join public.anatomy_structures structure
  on structure.slug = mapping.structure_slug
on conflict (condition_id, structure_id) do update set
  relevance = excluded.relevance,
  relevance_ro = excluded.relevance_ro,
  relevance_en = excluded.relevance_en;

create index if not exists anatomy_structures_tissue_3d_idx
  on public.anatomy_structures (tissue, model_3d_availability, model_3d_selectable);

create index if not exists anatomy_structures_body_region_tissue_idx
  on public.anatomy_structures (body_region, tissue);

notify pgrst, 'reload schema';

commit;
