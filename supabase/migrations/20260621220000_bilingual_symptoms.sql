alter table public.symptoms
  add column if not exists name_en text,
  add column if not exists description_en text,
  add column if not exists keywords_en text[] not null default '{}';

update public.symptoms
set
  description_ro = 'Durere suportabilă, care nu împiedică activitățile obișnuite și nu se agravează rapid.',
  name_en = 'Mild pain',
  description_en = 'Tolerable pain that does not prevent usual activities and is not rapidly worsening.',
  keywords_en = array['mild pain', 'slight pain', 'minor pain', 'ache', 'discomfort', 'sore']
where slug = 'durere-usoara';

update public.symptoms
set
  description_ro = 'Durere care interferează cu mișcarea sau activitățile obișnuite, dar rămâne suportabilă.',
  name_en = 'Moderate pain',
  description_en = 'Pain that interferes with movement or usual activities but remains manageable.',
  keywords_en = array['moderate pain', 'persistent pain', 'manageable pain', 'affects movement', 'interferes with activity']
where slug = 'durere-moderata';

update public.symptoms
set
  description_ro = 'Durere intensă sau greu de suportat, mai ales dacă apare brusc, se agravează, urmează unui traumatism ori este însoțită de alte semne de alarmă.',
  name_en = 'Severe pain',
  description_en = 'Intense or unbearable pain, especially when sudden, worsening, following trauma, or accompanied by other warning signs.',
  keywords_en = array['severe pain', 'unbearable pain', 'excruciating pain', 'worst pain', 'intense pain']
where slug = 'durere-severa';

update public.symptoms
set
  description_ro = 'Pocnet sau trosnet, cădere, lovitură ori accident asociat cu debutul simptomelor.',
  name_en = 'Popping sound or trauma',
  description_en = 'A popping or snapping sound, fall, impact, or accident associated with symptom onset.',
  keywords_en = array['pop', 'popping', 'snap', 'snapping', 'trauma', 'injury', 'fall', 'impact', 'hit', 'accident']
where slug = 'pocnet-trauma';

update public.symptoms
set
  description_ro = 'Dificultate sau imposibilitate de a mișca, folosi, îndoi, ridica, sprijini ori încărca zona afectată.',
  name_en = 'Limited movement',
  description_en = 'Difficulty or inability to move, use, bend, lift, walk, or bear weight on the affected area.',
  keywords_en = array['cannot move', 'can''t move', 'limited movement', 'cannot use', 'cannot bend', 'cannot lift', 'cannot walk', 'cannot bear weight']
where slug = 'limitare-miscare';

update public.symptoms
set
  description_ro = 'Umflare vizibilă, edem, vânătaie sau schimbare de culoare a pielii în jurul zonei afectate.',
  name_en = 'Swelling or bruising',
  description_en = 'Visible swelling, puffiness, bruising, or skin discoloration around the affected area.',
  keywords_en = array['swelling', 'swollen', 'puffy', 'bruise', 'bruising', 'bruised', 'black and blue']
where slug = 'umflare-vanataie';

update public.symptoms
set
  description_ro = 'Pierderea sau reducerea sensibilității, furnicături ori scăderea forței în zona afectată.',
  name_en = 'Numbness or weakness',
  description_en = 'Loss or reduction of sensation, tingling, or reduced strength in the affected area.',
  keywords_en = array['numbness', 'numb', 'tingling', 'pins and needles', 'weakness', 'weak', 'loss of strength', 'loss of sensation']
where slug = 'amorteala-slabiciune';

do $$
begin
  if exists (
    select 1
    from public.symptoms
    where nullif(btrim(name_en), '') is null
       or nullif(btrim(description_ro), '') is null
       or nullif(btrim(description_en), '') is null
       or cardinality(keywords_en) = 0
  ) then
    raise exception 'All symptoms must have complete Romanian and English content before constraints are enabled';
  end if;
end
$$;

alter table public.symptoms
  alter column name_en set not null,
  alter column description_en set not null;

alter table public.symptoms
  drop constraint if exists symptoms_name_en_not_blank,
  add constraint symptoms_name_en_not_blank check (btrim(name_en) <> ''),
  drop constraint if exists symptoms_description_ro_not_blank,
  add constraint symptoms_description_ro_not_blank check (btrim(description_ro) <> ''),
  drop constraint if exists symptoms_description_en_not_blank,
  add constraint symptoms_description_en_not_blank check (btrim(description_en) <> ''),
  drop constraint if exists symptoms_keywords_en_not_empty,
  add constraint symptoms_keywords_en_not_empty check (cardinality(keywords_en) > 0);

create index if not exists symptoms_keywords_en_idx
  on public.symptoms using gin (keywords_en);
