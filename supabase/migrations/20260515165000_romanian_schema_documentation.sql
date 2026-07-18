comment on table public.anatomy_structures is
  'structuri_anatomice: catalogul structurilor anatomice folosite de Santix pentru selectie 3D, explicatii si mapping AI';

comment on table public.conditions is
  'afectiuni: conditii/posibile explicatii medicale educationale asociate structurilor si simptomelor';

comment on table public.symptoms is
  'simptome: dictionar de simptome si cuvinte cheie in romana folosite pentru triere si AI';

comment on table public.triage_questions is
  'intrebari_triaj: intrebari educationale pentru evaluarea locala a durerii';

comment on table public.triage_options is
  'optiuni_triaj: raspunsuri posibile pentru intrebarile de triaj si scorurile asociate';

comment on table public.triage_rules is
  'reguli_triaj: reguli deterministe pentru recomandari educationale';

comment on table public.medical_sources is
  'surse_medicale: surse si referinte folosite pentru continutul educational';

comment on table public.ai_guardrails is
  'reguli_siguranta_ai: instructiuni de siguranta pentru raspunsurile AI';

comment on table public.ai_conversations is
  'conversatii_ai: istoricul conversatiilor AI ale utilizatorilor autentificati, protejat prin RLS';

comment on table public.ai_messages is
  'mesaje_ai: mesajele utilizator/asistent asociate conversatiilor AI, sterse in cascada cu conversatia';

comment on table public.ai_knowledge_entries is
  'cunostinte_ai: fragmente educationale folosite pentru retrieval/RAG in raspunsurile Santix';

comment on column public.ai_conversations.structured_state is
  'stare_structurata: state conversational incremental pentru interpretarea raspunsurilor scurte si a contextului medical educational';
