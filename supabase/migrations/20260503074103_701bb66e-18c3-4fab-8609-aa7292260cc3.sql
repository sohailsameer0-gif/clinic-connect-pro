
create or replace function public.notify_appointment_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare _clinic_name text; _doctor_name text; _owner_id uuid;
begin
  select name into _clinic_name from public.clinics where id = coalesce(new.clinic_id, old.clinic_id);
  select name into _doctor_name from public.doctors where id = coalesce(new.doctor_id, old.doctor_id);
  select owner_id into _owner_id from public.clinics where id = coalesce(new.clinic_id, old.clinic_id);
  if (tg_op = 'INSERT') then
    if _owner_id is not null then
      insert into public.notifications (user_id, type, title, body, data)
      values (_owner_id, 'booking_created', 'New appointment',
        coalesce(new.patient_name, 'A patient') || ' booked ' || coalesce(_doctor_name, 'a doctor'),
        jsonb_build_object('appointment_id', new.id, 'clinic_id', new.clinic_id));
    end if;
    if new.patient_id is not null then
      insert into public.notifications (user_id, type, title, body, data)
      values (new.patient_id, 'booking_created', 'Appointment requested',
        'Your booking with ' || coalesce(_doctor_name, 'the doctor') || ' at ' || coalesce(_clinic_name, 'the clinic') || ' is pending confirmation.',
        jsonb_build_object('appointment_id', new.id, 'clinic_id', new.clinic_id));
    end if;
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    if new.patient_id is not null then
      insert into public.notifications (user_id, type, title, body, data)
      values (new.patient_id,
        case new.status
          when 'confirmed' then 'booking_confirmed'::notification_type
          when 'cancelled' then 'booking_cancelled'::notification_type
          when 'rejected'  then 'booking_rejected'::notification_type
          when 'rescheduled' then 'booking_rescheduled'::notification_type
          else 'generic'::notification_type
        end,
        'Appointment ' || new.status,
        'Your appointment with ' || coalesce(_doctor_name, 'the doctor') || ' is now ' || new.status || '.',
        jsonb_build_object('appointment_id', new.id, 'clinic_id', new.clinic_id));
    end if;
  end if;
  return coalesce(new, old);
end; $$;

drop trigger if exists trg_notify_appointment_event on public.appointments;
create trigger trg_notify_appointment_event
after insert or update on public.appointments
for each row execute function public.notify_appointment_event();

create or replace function public.notify_clinic_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    if new.status = 'approved' then
      insert into public.notifications (user_id, type, title, body, data)
      values (new.owner_id, 'clinic_approved', 'Clinic approved',
        new.name || ' is now live on MediBook.', jsonb_build_object('clinic_id', new.id));
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, type, title, body, data)
      values (new.owner_id, 'clinic_rejected', 'Clinic rejected',
        new.name || ' was not approved. Please review and resubmit.', jsonb_build_object('clinic_id', new.id));
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_notify_clinic_status on public.clinics;
create trigger trg_notify_clinic_status
after update on public.clinics
for each row execute function public.notify_clinic_status();

drop trigger if exists trg_refresh_review_aggregates on public.reviews;
create trigger trg_refresh_review_aggregates
after insert or update or delete on public.reviews
for each row execute function public.refresh_review_aggregates();

drop trigger if exists trg_handle_new_clinic on public.clinics;
create trigger trg_handle_new_clinic
after insert on public.clinics
for each row execute function public.handle_new_clinic();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index if not exists idx_appointments_clinic_starts on public.appointments (clinic_id, starts_at desc);
create index if not exists idx_appointments_patient_starts on public.appointments (patient_id, starts_at desc);
create index if not exists idx_doctors_clinic on public.doctors (clinic_id);
create index if not exists idx_services_clinic on public.services (clinic_id);
create index if not exists idx_schedules_doctor on public.schedules (doctor_id);
create index if not exists idx_clinics_status on public.clinics (status);
