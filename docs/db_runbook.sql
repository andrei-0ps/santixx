-- ============================================================================
-- SANTIX — Runbook DB (proiect LIVE: quvngtmmbbxomwwntnbr)
-- Rulează în Supabase Dashboard → SQL Editor (rulează ca superuser, ocolește RLS).
-- Parcurge pe rând PASUL 1 → 4. Citește rezultatele de la PASUL 1 înainte de PASUL 3.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PASUL 1 — DIAGNOSTIC (read-only). Rulează și citește rezultatele.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a) Câte intrări de cunoaștere AI există, pe țesut?
select tissue, count(*) as intrari
from public.ai_knowledge_entries
group by tissue
order by tissue;

-- 1b) Total + câte sunt pentru mușchi (P3/P5). Dacă muschi = 0 → trebuie PASUL 3.
select
  (select count(*) from public.ai_knowledge_entries)                       as total_ai,
  (select count(*) from public.ai_knowledge_entries where tissue='muschi') as ai_muschi,
  (select count(*) from public.anatomy_structures where tissue='muschi')   as structuri_muschi;

-- 1c) Subgrupe musculare fără descriere (P7). Lista ar trebui să fie GOALĂ după PASUL 4.
select slug, coalesce(description_ro,'(gol)') as descriere
from public.anatomy_structures
where tissue='muschi' and coalesce(description_ro,'')=''
order by slug;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASUL 2 — GUARD pentru re-seed în siguranță (P3).
-- Rulează DOAR dacă la PASUL 3 vei rula seed-ul (20260605130000_*).
-- Șterge intrările pe care le inserează acel seed, ca re-rularea să nu dubleze.
-- (Dacă ai_muschi era deja > 0 și corect, poți sări peste PASUL 2 și 3.)
-- ─────────────────────────────────────────────────────────────────────────────

delete from public.ai_knowledge_entries
where structure_slug in (
  -- 13 regiuni musculare
  'muschii-capului-gatului','muschii-umarului','muschii-bratului','muschii-antebratului',
  'muschii-mainii','muschii-toracelui','muschii-abdomenului','muschii-spatelui',
  'muschii-soldului','muschii-coapsei','muschii-gambei','muschii-labei-piciorului',
  'muschii-bazinului',
  -- 18 subgrupe
  'cvadriceps','ischiogambieri','adductori','coafa-rotatorilor','muschii-fesieri',
  'muschii-tibiali-peronieri','muschii-spatelui-superficiali','muschii-spatelui-profunzi',
  'muschii-abdominali','muschii-pieptului','muschii-gatului','muschii-masticatori',
  'muschii-soldului-profunzi','muschii-bratului-anteriori','muschii-bratului-posteriori',
  -- oase de bază
  'schelet-cap','schelet-coloana','schelet-torace','schelet-membrul-superior','schelet-membrul-inferior'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASUL 3 — SEED AI (P3 + P5). NU este în acest fișier (are 777 de linii).
-- Deschide fișierul și copiază TOT conținutul în SQL Editor, apoi Run:
--    supabase/migrations/20260605130000_ai_knowledge_full_seed.sql
-- După rulare, repetă PASUL 1b: ai_muschi trebuie să fie ~130.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- PASUL 4 — DESCRIERI SUBGRUPE (P7). Deschide și rulează în SQL Editor:
--    supabase/migrations/20260612120000_muscle_subgroup_descriptions.sql
-- E idempotent. După rulare, PASUL 1c trebuie să nu mai returneze rânduri.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- (OPȚIONAL) PASUL 5 — verifică prin RPC-ul real folosit de aplicație.
-- Trebuie să returneze rânduri (titluri pe categorii) pentru umăr.
-- ─────────────────────────────────────────────────────────────────────────────

select category, title_ro
from public.get_ai_context_for_selection(
  'muschi'::public.tissue_type,
  'muschi:muschii-umarului',
  'muschii-umarului',
  'umar_centura_scapulara',
  8
);
