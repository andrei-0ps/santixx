create table if not exists public.internal_organs (
  slug text primary key,
  name_ro text not null,
  latin_name text,
  category_ro text not null,
  body_region text not null,
  difficulty text not null default 'incepator',
  description_ro text not null default '',
  function_ro text not null default '',
  origin_ro text not null default '',
  insertion_ro text not null default '',
  innervation_ro text not null default '',
  action_ro text not null default '',
  quiz jsonb not null default '[]'::jsonb,
  model_selection_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.internal_organs enable row level security;

drop policy if exists "Oricine poate citi organele interne" on public.internal_organs;
create policy "Oricine poate citi organele interne"
  on public.internal_organs for select
  using (true);

insert into public.internal_organs (
  slug,
  name_ro,
  latin_name,
  category_ro,
  body_region,
  difficulty,
  description_ro,
  function_ro,
  origin_ro,
  insertion_ro,
  innervation_ro,
  action_ro,
  quiz,
  model_selection_id
) values
  (
    'organ-inima',
    'Inimă',
    'Cor',
    'Aparat cardiovascular',
    'torace',
    'incepator',
    'Organ muscular situat în torace, între plămâni, cu rol central în circulația sângelui.',
    'Pompează sângele către plămâni și către restul corpului.',
    'Situată în mediastin, ușor spre stânga liniei mediane.',
    'Conectată cu vasele mari: aorta, venele cave, artera pulmonară și venele pulmonare.',
    'Reglată de sistemul nervos autonom prin fibre simpatice și parasimpatice.',
    'Realizează contracții ritmice care mențin circulația sângelui.',
    '[{"question":"Care este rolul principal al inimii?","options":["Filtrează aerul","Pompează sângele","Produce bila"],"correctIndex":1,"explanation":"Inima pompează sângele prin vasele de sânge."}]',
    'organ:inima'
  ),
  (
    'organ-plamani',
    'Plămâni',
    'Pulmones',
    'Aparat respirator',
    'torace',
    'incepator',
    'Organe pereche din torace, responsabile de schimbul de gaze dintre aer și sânge.',
    'Permit oxigenarea sângelui și eliminarea dioxidului de carbon.',
    'Așezați de o parte și de alta a inimii, în cavitatea toracică.',
    'Comunică cu traheea prin bronhiile principale.',
    'Reglați de fibre autonome implicate în calibrul bronhiilor și ritmul respirator.',
    'Participă la inspirație și expirație prin schimbul de oxigen și dioxid de carbon.',
    '[{"question":"Ce schimb de gaze are loc în plămâni?","options":["Oxigen și dioxid de carbon","Calciu și fier","Apă și sare"],"correctIndex":0,"explanation":"Plămânii preiau oxigen și elimină dioxid de carbon."}]',
    'organ:plamani'
  ),
  (
    'organ-ficat',
    'Ficat',
    'Hepar',
    'Aparat digestiv',
    'abdomen',
    'incepator',
    'Organ voluminos din partea dreaptă superioară a abdomenului.',
    'Procesează nutrienți, produce bilă și participă la detoxifierea organismului.',
    'Localizat sub diafragmă, predominant în partea dreaptă a abdomenului superior.',
    'Conectat funcțional cu vezica biliară, vasele hepatice și sistemul digestiv.',
    'Primește fibre autonome prin plexuri nervoase abdominale.',
    'Metabolizează substanțe, produce bilă și susține echilibrul metabolic.',
    '[{"question":"Ce produce ficatul pentru digestia grăsimilor?","options":["Bilă","Insulină","Aer"],"correctIndex":0,"explanation":"Bila ajută la digestia grăsimilor."}]',
    'organ:ficat'
  ),
  (
    'organ-stomac',
    'Stomac',
    'Ventriculus',
    'Aparat digestiv',
    'abdomen',
    'incepator',
    'Organ cavitar al digestiei, situat în abdomenul superior.',
    'Amestecă alimentele cu sucuri gastrice și începe digestia proteinelor.',
    'Localizat în abdomenul superior, mai ales spre partea stângă.',
    'Primește alimente prin esofag și continuă către duoden.',
    'Reglat de sistemul nervos autonom, inclusiv prin nervul vag.',
    'Depozitează, amestecă și fragmentează alimentele înainte de intestin.',
    '[{"question":"Stomacul primește alimentele prin:","options":["Esofag","Trahee","Aortă"],"correctIndex":0,"explanation":"Esofagul transportă alimentele către stomac."}]',
    'organ:stomac'
  ),
  (
    'organ-rinichi',
    'Rinichi',
    'Renes',
    'Aparat urinar',
    'abdomen',
    'incepator',
    'Organe pereche care filtrează sângele și contribuie la formarea urinei.',
    'Elimină produse de metabolism și reglează echilibrul de apă și săruri.',
    'Situați posterior în abdomen, de o parte și de alta a coloanei lombare.',
    'Se continuă prin uretere către vezica urinară.',
    'Primesc fibre autonome prin plexurile renale.',
    'Filtrează sângele, formează urina și susțin echilibrul intern.',
    '[{"question":"Ce formează rinichii?","options":["Urină","Bilă","Aer"],"correctIndex":0,"explanation":"Rinichii filtrează sângele și formează urina."}]',
    'organ:rinichi'
  ),
  (
    'organ-intestine',
    'Intestine',
    'Intestina',
    'Aparat digestiv',
    'abdomen',
    'incepator',
    'Segmente digestive aflate în abdomen, implicate în absorbția nutrienților și eliminare.',
    'Finalizează digestia, absoarbe nutrienți și formează materiile fecale.',
    'Așezate în cavitatea abdominală, sub stomac.',
    'Se continuă de la duoden către intestinul subțire, colon și rect.',
    'Controlate de sistemul nervos enteric și fibre autonome.',
    'Amestecă, propulsează și absorb componentele utile din alimente.',
    '[{"question":"Ce rol important au intestinele?","options":["Absorb nutrienți","Pompează sânge","Mișcă oasele"],"correctIndex":0,"explanation":"Intestinele absorb nutrienți după digestie."}]',
    'organ:intestine'
  ),
  (
    'organ-pancreas',
    'Pancreas',
    'Pancreas',
    'Aparat digestiv și endocrin',
    'abdomen',
    'mediu',
    'Organ alungit situat posterior de stomac, cu rol digestiv și endocrin.',
    'Produce enzime digestive și hormoni implicați în reglarea glicemiei.',
    'Așezat transversal în abdomenul superior, în spatele stomacului.',
    'Conectat funcțional cu duodenul prin secrețiile pancreatice.',
    'Reglat de fibre autonome abdominale.',
    'Secretă enzime digestive și hormoni precum insulina și glucagonul.',
    '[{"question":"Pancreasul produce:","options":["Enzime digestive și hormoni","Oase","Aer"],"correctIndex":0,"explanation":"Pancreasul are rol digestiv și endocrin."}]',
    'organ:pancreas'
  ),
  (
    'organ-vezica-urinara',
    'Vezică urinară',
    'Vesica urinaria',
    'Aparat urinar',
    'pelvis',
    'incepator',
    'Organ cavitar din pelvis care depozitează urina.',
    'Stochează urina înainte de eliminare.',
    'Situată în pelvis, sub abdomenul inferior.',
    'Primește urina prin uretere și se continuă cu uretra.',
    'Controlată de fibre autonome și somatice implicate în micțiune.',
    'Se umple, stochează urina și se contractă pentru eliminare.',
    '[{"question":"Ce depozitează vezica urinară?","options":["Urină","Bilă","Oxigen"],"correctIndex":0,"explanation":"Vezica urinară stochează urina."}]',
    'organ:vezica-urinara'
  ),
  (
    'organ-esofag',
    'Esofag',
    'Oesophagus',
    'Aparat digestiv',
    'gat_torace',
    'incepator',
    'Tub muscular care transportă alimentele din faringe către stomac.',
    'Conduce bolul alimentar către stomac prin mișcări peristaltice.',
    'Pornește din zona faringelui și coboară prin gât și torace.',
    'Se deschide în stomac.',
    'Reglat de nervi autonomi și fibre asociate nervului vag.',
    'Transportă alimentele către stomac.',
    '[{"question":"Esofagul transportă alimentele către:","options":["Stomac","Plămâni","Rinichi"],"correctIndex":0,"explanation":"Esofagul face legătura dintre faringe și stomac."}]',
    'organ:esofag'
  ),
  (
    'organ-trahee',
    'Trahee',
    'Trachea',
    'Aparat respirator',
    'gat_torace',
    'incepator',
    'Conduct respirator care face legătura dintre laringe și bronhii.',
    'Permite trecerea aerului către plămâni.',
    'Pornește sub laringe, în regiunea gâtului.',
    'Se bifurcă în bronhiile principale care intră în plămâni.',
    'Reglată de fibre autonome și reflexe respiratorii.',
    'Menține o cale deschisă pentru trecerea aerului.',
    '[{"question":"Traheea transportă:","options":["Aer","Urină","Bilă"],"correctIndex":0,"explanation":"Traheea conduce aerul către bronhii și plămâni."}]',
    'organ:trahee'
  )
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  latin_name = excluded.latin_name,
  category_ro = excluded.category_ro,
  body_region = excluded.body_region,
  difficulty = excluded.difficulty,
  description_ro = excluded.description_ro,
  function_ro = excluded.function_ro,
  origin_ro = excluded.origin_ro,
  insertion_ro = excluded.insertion_ro,
  innervation_ro = excluded.innervation_ro,
  action_ro = excluded.action_ro,
  quiz = excluded.quiz,
  model_selection_id = excluded.model_selection_id,
  updated_at = now();

insert into public.anatomy_structures (
  slug,
  name_ro,
  name_latin,
  tissue,
  body_region,
  model_selection_id,
  description_ro,
  function_ro
)
select
  slug,
  name_ro,
  latin_name,
  'organ'::public.tissue_type,
  body_region,
  model_selection_id,
  description_ro,
  function_ro
from public.internal_organs
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  name_latin = excluded.name_latin,
  tissue = excluded.tissue,
  body_region = excluded.body_region,
  model_selection_id = excluded.model_selection_id,
  description_ro = excluded.description_ro,
  function_ro = excluded.function_ro,
  updated_at = now();

insert into public.ai_knowledge_entries (
  tissue,
  structure_slug,
  model_selection_id,
  body_region,
  category,
  title_ro,
  content_ro,
  priority,
  tags,
  metadata
)
select
  'organ'::public.tissue_type,
  slug,
  model_selection_id,
  body_region,
  'anatomie',
  'Organ intern: ' || name_ro,
  description_ro || ' Funcție: ' || function_ro || ' Repere: ' || origin_ro,
  8,
  array[body_region, lower(name_ro), 'organ'],
  jsonb_build_object(
    'category', category_ro,
    'difficulty', difficulty,
    'latin_name', latin_name
  )
from public.internal_organs
on conflict do nothing;

