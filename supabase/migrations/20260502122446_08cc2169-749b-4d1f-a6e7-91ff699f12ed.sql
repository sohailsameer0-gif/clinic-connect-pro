
-- Already set search_path on functions, but ensure consistency + lock execute
-- Revoke broad execute and grant only to authenticated where appropriate.

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

revoke execute on function public.is_clinic_member(uuid, uuid) from public, anon;
grant execute on function public.is_clinic_member(uuid, uuid) to authenticated;

revoke execute on function public.is_clinic_owner(uuid, uuid) from public, anon;
grant execute on function public.is_clinic_owner(uuid, uuid) to authenticated;

-- Trigger functions should not be callable from PostgREST at all
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_clinic() from public, anon, authenticated;
revoke execute on function public.refresh_review_aggregates() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
