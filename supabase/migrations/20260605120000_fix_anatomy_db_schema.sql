
alter table if exists public.anatomy_structures
  add column if not exists common_name_ro        text,
  add column if not exists scientific_name_ro    text,
  add column if not exists display_name_ro       text,
  add column if not exists subtitle_name         text,
  add column if not exists english_name          text,
  add column if not exists latin_name            text,
  add column if not exists aliases_ro            text[] not null default '{}',
  add column if not exists missing_ro_display_name boolean not null default false;

create index if not exists anatomy_structures_display_lookup_idx
  on public.anatomy_structures (slug, model_selection_id, tissue);

create index if not exists anatomy_structures_aliases_ro_idx
  on public.anatomy_structures using gin (aliases_ro);

update public.anatomy_structures
set
  display_name_ro       = coalesce(display_name_ro, name_ro),
  common_name_ro        = coalesce(common_name_ro, name_ro),
  scientific_name_ro    = coalesce(scientific_name_ro, name_ro),
  latin_name            = coalesce(latin_name, name_latin),
  missing_ro_display_name = false
where tissue = 'os'
  and display_name_ro is null;


delete from public.anatomy_structures
where tissue = 'muschi'
  and slug in (
    'muschi-cap-gat',
    'muschi-brat-umar',
    'muschi-mana-antebrat',
    'muschi-trunchi',
    'muschi-membru-inferior',
    'muschi-picior'
  );


insert into public.anatomy_structures
  (slug, model_selection_id, tissue, body_region,
   name_ro, common_name_ro, scientific_name_ro, display_name_ro,
   english_name, latin_name,
   description_ro, function_ro,
   missing_ro_display_name)
values

  ('muschii-capului-gatului',
   'muschi:muschii-capului-gatului',
   'muschi', 'cap_gat',
   'Mușchii capului și gâtului',
   'Mușchii capului și gâtului',
   'Mușchii capului și gâtului',
   'Mușchii capului și gâtului',
   'Head and neck muscles', null,
   'Mușchii capului și gâtului controlează expresiile feței, masticația, mișcările capului și stabilizarea coloanei cervicale. Includ mușchii mimicii, mușchii masticatori și mușchii gâtului.',
   'Participă la expresiile feței, mestecat, mișcări ale capului și stabilizarea gâtului.',
   false),

  ('muschii-mainii',
   'muschi:muschii-mainii',
   'muschi', 'mana',
   'Mușchii mâinii',
   'Mușchii mâinii',
   'Mușchii mâinii',
   'Mușchii mâinii',
   'Hand muscles', null,
   'Mușchii mâinii permit mișcările fine ale degetelor, priza și manipularea obiectelor. Includ mușchii tenari (policele), hipotenari (degetul mic) și mușchii interosoși.',
   'Permit mișcările fine ale degetelor și priza mâinii.',
   false),

  ('muschii-labei-piciorului',
   'muschi:muschii-piciorului',
   'muschi', 'picior',
   'Mușchii labei piciorului',
   'Mușchii labei piciorului',
   'Mușchii labei piciorului',
   'Mușchii labei piciorului',
   'Foot muscles', null,
   'Mușchii labei piciorului susțin bolta plantară, controlează mișcările degetelor și contribuie la echilibru și propulsie în mers.',
   'Susțin bolta plantară și mișcările degetelor de la picior.',
   false),

  ('muschii-gambei',
   'muschi:muschii-gambei',
   'muschi', 'gamba',
   'Mușchii gambei',
   'Mușchii gambei',
   'Mușchii gambei',
   'Mușchii gambei',
   'Calf and shin muscles', null,
   'Mușchii gambei controlează mișcările gleznei și ale labei piciorului. Gastrocnemianul și solearul formează masele musculare din spate; tibialul anterior acționează pe față.',
   'Controlează mișcările gambei, labei piciorului și degetelor.',
   false),

  ('muschii-coapsei',
   'muschi:muschii-coapsei',
   'muschi', 'coapsa',
   'Mușchii coapsei',
   'Mușchii coapsei',
   'Mușchii coapsei',
   'Mușchii coapsei',
   'Thigh muscles', null,
   'Mușchii coapsei sunt printre cei mai puternici din corp. Cvadricepsul extinde genunchiul, ischiogambierii flectează genunchiul, iar adductorii stabilizează membrul inferior.',
   'Participă la mișcările coapsei, genunchiului și la mers.',
   false),

  ('muschii-antebratului',
   'muschi:muschii-antebratului',
   'muschi', 'antebrat',
   'Mușchii antebrațului',
   'Mușchii antebrațului',
   'Mușchii antebrațului',
   'Mușchii antebrațului',
   'Forearm muscles', null,
   'Mușchii antebrațului controlează mișcările încheieturii mâinii, ale degetelor și rotațiile antebrațului (pronație/supinație). Sunt esențiali pentru activitățile de precizie.',
   'Controlează mișcările antebrațului, mâinii și degetelor.',
   false),

  ('muschii-bratului',
   'muschi:muschii-bratului',
   'muschi', 'brat',
   'Mușchii brațului',
   'Mușchii brațului',
   'Mușchii brațului',
   'Mușchii brațului',
   'Arm muscles', null,
   'Mușchii brațului realizează flexia și extensia cotului. Bicepsul brahial (față) flectează cotul și supinează antebrațul; tricepsul brahial (spate) extinde cotul.',
   'Realizează mișcările brațului și antebrațului (flexie, extensie).',
   false),

  ('muschii-abdomenului',
   'muschi:muschii-abdomenului',
   'muschi', 'abdomen',
   'Mușchii abdomenului',
   'Mușchii abdomenului',
   'Mușchii abdomenului',
   'Mușchii abdomenului',
   'Abdominal muscles', null,
   'Mușchii abdomenului susțin organele interne, stabilizează coloana vertebrală și participă la respirație, tuse și mișcările trunchiului. Dreptul abdominal, oblicii și transversul lucrează împreună.',
   'Susțin abdomenul și participă la flexia și rotația trunchiului.',
   false),

  ('muschii-toracelui',
   'muschi:muschii-toracelui',
   'muschi', 'torace',
   'Mușchii pieptului',
   'Mușchii pieptului',
   'Mușchii pieptului',
   'Mușchii pieptului',
   'Chest muscles', null,
   'Mușchii pieptului participă la mișcările brațului, respirație și stabilizarea umărului. Pectoral mare este cel mai vizibil; diafragma și intercostalii asigură respirația.',
   'Contribuie la mișcările pieptului, respirație și stabilizarea umărului.',
   false),

  ('muschii-umarului',
   'muschi:muschii-umarului',
   'muschi', 'umar_centura_scapulara',
   'Mușchii umărului',
   'Mușchii umărului',
   'Mușchii umărului',
   'Mușchii umărului',
   'Shoulder muscles', null,
   'Mușchii umărului asigură mobilitatea complexă a articulației scapulo-humerale: ridicare, rotație, abducție și adducție. Deltoidul este mușchiul principal; coafa rotatorilor (supraspinos, infraspinos, subscapular, rotund mic) stabilizează articulația.',
   'Mobilizează și stabilizează umărul.',
   false),

  ('muschii-soldului',
   'muschi:muschii-soldului',
   'muschi', 'sold',
   'Mușchii șoldului',
   'Mușchii șoldului',
   'Mușchii șoldului',
   'Mușchii șoldului',
   'Hip and gluteal muscles', null,
   'Mușchii șoldului, inclusiv cei trei mușchi fesieri, sunt esențiali pentru mers, alergare, urcat scări și stabilizarea pelvisului. Mușchiul fesier mare este cel mai puternic din corp.',
   'Stabilizează șoldul și participă la mișcările coapsei.',
   false),

  ('muschii-spatelui',
   'muschi:muschii-spatelui',
   'muschi', 'spate',
   'Mușchii spatelui',
   'Mușchii spatelui',
   'Mușchii spatelui',
   'Mușchii spatelui',
   'Back muscles', null,
   'Mușchii spatelui mențin postura, susțin coloana vertebrală și realizează mișcările de extensie și rotație ale trunchiului. Trapezul și marele dorsal sunt cei mai mari; mușchii erector spinae mențin coloana dreaptă.',
   'Susțin postura și participă la mișcările trunchiului și umerilor.',
   false)

on conflict (slug) do update set
  model_selection_id     = excluded.model_selection_id,
  common_name_ro         = excluded.common_name_ro,
  scientific_name_ro     = excluded.scientific_name_ro,
  display_name_ro        = excluded.display_name_ro,
  english_name           = excluded.english_name,
  description_ro         = excluded.description_ro,
  function_ro            = excluded.function_ro,
  missing_ro_display_name = false,
  updated_at             = now();

insert into public.anatomy_structures
  (slug, model_selection_id, tissue, body_region,
   name_ro, common_name_ro, scientific_name_ro, display_name_ro,
   english_name, latin_name,
   description_ro, function_ro,
   missing_ro_display_name)
values
  ('muschii-bazinului',
   'muschi:muschii-bazinului',
   'muschi', 'pelvis',
   'Mușchii bazinului',
   'Mușchii bazinului',
   'Mușchii bazinului',
   'Mușchii bazinului',
   'Pelvic floor muscles', null,
   'Mușchii planșeului pelvian susțin organele pelviene și controlează sfincterele.',
   'Susțin organele pelviene și asigură controlul sfincterelor.',
   false)
on conflict (slug) do update set
  model_selection_id     = excluded.model_selection_id,
  display_name_ro        = excluded.display_name_ro,
  missing_ro_display_name = false,
  updated_at             = now();
