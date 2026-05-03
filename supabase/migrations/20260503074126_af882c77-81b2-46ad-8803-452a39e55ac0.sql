
revoke execute on function public.notify_appointment_event() from public, anon, authenticated;
revoke execute on function public.notify_clinic_status() from public, anon, authenticated;
revoke execute on function public.refresh_review_aggregates() from public, anon, authenticated;
revoke execute on function public.handle_new_clinic() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
