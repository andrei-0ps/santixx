begin;

alter function public.set_updated_at()
  set search_path = public;

alter function public.model_part_display_name_en(text)
  set search_path = public;

alter function public.get_model_part_medical_context(text)
  set search_path = public;

alter function public.get_ai_context_for_selection(
  public.tissue_type,
  text,
  text,
  text,
  integer
)
  set search_path = public;

alter function public.check_ai_rate_limit(text, integer, integer)
  security invoker;

revoke execute on function public.check_ai_rate_limit(text, integer, integer) from anon;
grant execute on function public.check_ai_rate_limit(text, integer, integer) to authenticated, service_role;

revoke execute on function public.delete_current_new_google_user() from anon;
grant execute on function public.delete_current_new_google_user() to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
