create type public.knowledge_category as enum (
  'anatomie',
  'simptome',
  'cauze_posibile',
  'recomandari',
  'semne_alarma',
  'intrebari_clarificare'
);

create table public.ai_knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  tissue public.tissue_type not null,
  structure_slug text references public.anatomy_structures(slug) on update cascade on delete cascade,
  model_selection_id text,
  body_region text,
  category public.knowledge_category not null,
  title_ro text not null,
  content_ro text not null,
  priority smallint not null default 3 check (priority between 1 and 10),
  source_id uuid references public.medical_sources(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_knowledge_has_scope check (
    structure_slug is not null
    or model_selection_id is not null
    or body_region is not null
  )
);

create index ai_knowledge_tissue_structure_idx
  on public.ai_knowledge_entries (tissue, structure_slug, active, priority desc);

create index ai_knowledge_tissue_model_idx
  on public.ai_knowledge_entries (tissue, model_selection_id, active, priority desc);

create index ai_knowledge_tissue_region_idx
  on public.ai_knowledge_entries (tissue, body_region, active, priority desc);

alter table public.ai_knowledge_entries enable row level security;

create policy "Authenticated users can read active AI knowledge"
  on public.ai_knowledge_entries for select
  using (auth.role() = 'authenticated' and active = true);

create or replace function public.get_ai_context_for_selection(
  p_tissue public.tissue_type,
  p_model_selection_id text default null,
  p_structure_slug text default null,
  p_body_region text default null,
  p_limit integer default 12
)
returns table (
  id uuid,
  tissue public.tissue_type,
  structure_slug text,
  model_selection_id text,
  body_region text,
  category public.knowledge_category,
  title_ro text,
  content_ro text,
  priority smallint
)
language sql
stable
security invoker
as $$
  select
    k.id,
    k.tissue,
    k.structure_slug,
    k.model_selection_id,
    k.body_region,
    k.category,
    k.title_ro,
    k.content_ro,
    k.priority
  from public.ai_knowledge_entries k
  where k.active = true
    and k.tissue = p_tissue
    and (
      (p_structure_slug is not null and k.structure_slug = p_structure_slug)
      or (p_model_selection_id is not null and k.model_selection_id = p_model_selection_id)
      or (p_body_region is not null and k.body_region = p_body_region)
    )
  order by
    case
      when p_structure_slug is not null and k.structure_slug = p_structure_slug then 0
      when p_model_selection_id is not null and k.model_selection_id = p_model_selection_id then 1
      when p_body_region is not null and k.body_region = p_body_region then 2
      else 3
    end,
    k.priority desc,
    k.created_at asc
  limit greatest(1, least(coalesce(p_limit, 12), 30));
$$;

insert into public.ai_guardrails (name, instruction_ro) values
  (
    'selection_locked_context',
    'Răspunde strict despre structura sau regiunea selectată în modelul 3D. Dacă întrebarea utilizatorului cere altă zonă sau alt sistem anatomic, explică politicos că trebuie selectată zona respectivă în explorer.'
  ),
  (
    'layer_locked_context',
    'Respectă stratul activ: pentru schelet discută doar țesut osos; pentru sistem muscular discută doar mușchi; pentru anatomie completă poți discuta doar despre structura exact selectată și relațiile ei anatomice directe.'
  )
on conflict (name) do update set
  instruction_ro = excluded.instruction_ro,
  active = true;

