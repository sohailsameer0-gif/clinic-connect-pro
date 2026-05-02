
alter function public.has_role(uuid, public.app_role) set search_path = public;
alter function public.is_admin(uuid) set search_path = public;
alter function public.is_clinic_member(uuid, uuid) set search_path = public;
alter function public.is_clinic_owner(uuid, uuid) set search_path = public;
alter function public.touch_updated_at() set search_path = public;
