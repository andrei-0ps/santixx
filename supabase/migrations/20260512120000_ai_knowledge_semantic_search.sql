create extension if not exists vector with schema extensions;

alter table public.ai_knowledge_entries
  add column if not exists embedding extensions.vector(1536),
  add column if not exists embedding_model text,
  add column if not exists embedding_updated_at timestamptz;

create index if not exists ai_knowledge_embedding_cosine_idx
  on public.ai_knowledge_entries
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100)
  where active = true and embedding is not null;

create or replace function public.match_ai_knowledge_entries(
  p_query_embedding extensions.vector(1536),
  p_ai_layer text default null,
  p_body_region text default null,
  p_structure_slug text default null,
  p_match_threshold double precision default 0.72,
  p_match_count integer default 8
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
  priority smallint,
  similarity double precision
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
    k.priority,
    1 - (k.embedding <=> p_query_embedding) as similarity
  from public.ai_knowledge_entries k
  where k.active = true
    and k.embedding is not null
    and (
      p_ai_layer is null
      or (p_ai_layer = 'skeleton' and k.tissue = 'os')
      or (p_ai_layer = 'muscular' and k.tissue = 'muschi')
    )
    and (
      p_body_region is null
      or k.body_region = p_body_region
      or k.structure_slug = p_structure_slug
    )
    and 1 - (k.embedding <=> p_query_embedding) >= p_match_threshold
  order by
    case when p_structure_slug is not null and k.structure_slug = p_structure_slug then 0 else 1 end,
    similarity desc,
    k.priority desc
  limit greatest(1, least(coalesce(p_match_count, 8), 20));
$$;
