
-- ============ ENUMS ============
create type public.app_role as enum ('super_admin','clinic_owner','clinic_staff','doctor','patient');
create type public.clinic_status as enum ('pending','approved','suspended','rejected');
create type public.appointment_status as enum ('pending','confirmed','completed','cancelled','rejected','rescheduled','no_show');
create type public.gender as enum ('male','female','other','prefer_not_to_say');
create type public.notification_type as enum ('booking_created','booking_confirmed','booking_rejected','booking_cancelled','booking_rescheduled','booking_reminder','review_new','clinic_approved','clinic_rejected','staff_invited','announcement','generic');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  dob date,
  gender public.gender,
  city text,
  bio text,
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role security definer (avoids recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = 'super_admin') $$;

-- ============ CLINICS ============
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  tagline text,
  about text,
  logo_url text,
  banner_url text,
  address text,
  city text,
  phone text,
  whatsapp text,
  email text,
  website text,
  map_url text,
  hours jsonb not null default '{}'::jsonb,
  emergency_available boolean not null default false,
  status public.clinic_status not null default 'pending',
  verified boolean not null default false,
  featured boolean not null default false,
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.clinics enable row level security;
create index on public.clinics(status);
create index on public.clinics(city);

-- ============ CLINIC MEMBERS (owners + staff) ============
create table public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  unique(clinic_id, user_id)
);
alter table public.clinic_members enable row level security;

-- security definer helper to check membership without recursion
create or replace function public.is_clinic_member(_user_id uuid, _clinic_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.clinic_members where user_id = _user_id and clinic_id = _clinic_id) $$;

create or replace function public.is_clinic_owner(_user_id uuid, _clinic_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.clinic_members where user_id = _user_id and clinic_id = _clinic_id and role = 'owner') $$;

-- ============ DOCTORS ============
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  specialty text not null,
  qualification text,
  experience_years int not null default 0,
  fee numeric(10,2) not null default 0,
  gender public.gender,
  image_url text,
  bio text,
  active boolean not null default true,
  online_status boolean not null default true,
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.doctors enable row level security;
create index on public.doctors(clinic_id);
create index on public.doctors(specialty);

-- ============ SERVICES ============
create table public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  category text not null default 'general',
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_min int not null default 30,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
create index on public.services(clinic_id);

-- ============ SCHEDULES ============
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 30,
  max_per_slot int not null default 1,
  buffer_min int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.schedules enable row level security;
create index on public.schedules(doctor_id);

create table public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  date date not null,
  type text not null default 'holiday' check (type in ('holiday','leave')),
  note text,
  created_at timestamptz not null default now()
);
alter table public.schedule_exceptions enable row level security;
create index on public.schedule_exceptions(doctor_id, date);

-- ============ APPOINTMENTS ============
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid references auth.users(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  patient_name text,
  patient_phone text,
  patient_email text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text,
  is_walkin boolean not null default false,
  is_emergency boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.appointments enable row level security;
create index on public.appointments(clinic_id);
create index on public.appointments(doctor_id, starts_at);
create index on public.appointments(patient_id);
create index on public.appointments(status);

-- ============ REVIEWS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  patient_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create index on public.reviews(clinic_id);
create index on public.reviews(doctor_id);

-- ============ FAVORITES ============
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((clinic_id is not null) or (doctor_id is not null))
);
alter table public.favorites enable row level security;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null default 'generic',
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index on public.notifications(user_id, created_at desc);

-- ============ STAFF INVITES ============
create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  email text not null,
  role text not null default 'staff',
  token text not null unique default encode(gen_random_bytes(16),'hex'),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now()
);
alter table public.staff_invites enable row level security;

-- ============ AUDIT + CONTENT + SETTINGS ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;

create table public.content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.content enable row level security;

create table public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

-- ============ TRIGGERS: auto profile + role on signup ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'patient') on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- generic updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger touch_clinics before update on public.clinics for each row execute function public.touch_updated_at();
create trigger touch_doctors before update on public.doctors for each row execute function public.touch_updated_at();
create trigger touch_appointments before update on public.appointments for each row execute function public.touch_updated_at();
create trigger touch_reviews before update on public.reviews for each row execute function public.touch_updated_at();

-- when a clinic is inserted, add the owner to clinic_members and grant clinic_owner role
create or replace function public.handle_new_clinic()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.clinic_members (clinic_id, user_id, role)
  values (new.id, new.owner_id, 'owner') on conflict do nothing;
  insert into public.user_roles (user_id, role)
  values (new.owner_id, 'clinic_owner') on conflict do nothing;
  return new;
end; $$;
create trigger on_clinic_created after insert on public.clinics
  for each row execute function public.handle_new_clinic();

-- update clinic/doctor rating aggregates after review insert/update/delete
create or replace function public.refresh_review_aggregates()
returns trigger language plpgsql security definer set search_path = public
as $$
declare _cid uuid; _did uuid;
begin
  _cid := coalesce(new.clinic_id, old.clinic_id);
  _did := coalesce(new.doctor_id, old.doctor_id);
  update public.clinics c set
    rating = coalesce((select round(avg(rating)::numeric,2) from public.reviews where clinic_id = _cid), 0),
    review_count = (select count(*) from public.reviews where clinic_id = _cid)
  where c.id = _cid;
  if _did is not null then
    update public.doctors d set
      rating = coalesce((select round(avg(rating)::numeric,2) from public.reviews where doctor_id = _did), 0),
      review_count = (select count(*) from public.reviews where doctor_id = _did)
    where d.id = _did;
  end if;
  return coalesce(new, old);
end; $$;
create trigger reviews_aggregate_ins after insert on public.reviews for each row execute function public.refresh_review_aggregates();
create trigger reviews_aggregate_upd after update on public.reviews for each row execute function public.refresh_review_aggregates();
create trigger reviews_aggregate_del after delete on public.reviews for each row execute function public.refresh_review_aggregates();

-- ============ RLS POLICIES ============

-- profiles
create policy "profiles self read" on public.profiles for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles admin delete" on public.profiles for delete using (public.is_admin(auth.uid()));

-- user_roles
create policy "roles self read" on public.user_roles for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "roles admin write" on public.user_roles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- clinics
create policy "clinics public read approved" on public.clinics for select using (status = 'approved' or owner_id = auth.uid() or public.is_clinic_member(auth.uid(), id) or public.is_admin(auth.uid()));
create policy "clinics insert authenticated" on public.clinics for insert with check (auth.uid() = owner_id);
create policy "clinics update by owner/admin" on public.clinics for update using (public.is_clinic_owner(auth.uid(), id) or public.is_admin(auth.uid()));
create policy "clinics delete by admin" on public.clinics for delete using (public.is_admin(auth.uid()));

-- clinic_members
create policy "members read by member or admin" on public.clinic_members for select using (user_id = auth.uid() or public.is_clinic_owner(auth.uid(), clinic_id) or public.is_admin(auth.uid()));
create policy "members write by owner/admin" on public.clinic_members for all using (public.is_clinic_owner(auth.uid(), clinic_id) or public.is_admin(auth.uid())) with check (public.is_clinic_owner(auth.uid(), clinic_id) or public.is_admin(auth.uid()));

-- doctors
create policy "doctors public read" on public.doctors for select using (
  active or public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid())
);
create policy "doctors write by clinic" on public.doctors for all using (public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid())) with check (public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid()));

-- services
create policy "services public read" on public.services for select using (active or public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid()));
create policy "services write by clinic" on public.services for all using (public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid())) with check (public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid()));

-- schedules
create policy "schedules public read" on public.schedules for select using (true);
create policy "schedules write by clinic" on public.schedules for all using (
  exists (select 1 from public.doctors d where d.id = doctor_id and (public.is_clinic_member(auth.uid(), d.clinic_id) or public.is_admin(auth.uid())))
) with check (
  exists (select 1 from public.doctors d where d.id = doctor_id and (public.is_clinic_member(auth.uid(), d.clinic_id) or public.is_admin(auth.uid())))
);

-- schedule_exceptions
create policy "sched_excp public read" on public.schedule_exceptions for select using (true);
create policy "sched_excp write by clinic" on public.schedule_exceptions for all using (
  exists (select 1 from public.doctors d where d.id = doctor_id and (public.is_clinic_member(auth.uid(), d.clinic_id) or public.is_admin(auth.uid())))
) with check (
  exists (select 1 from public.doctors d where d.id = doctor_id and (public.is_clinic_member(auth.uid(), d.clinic_id) or public.is_admin(auth.uid())))
);

-- appointments
create policy "appt read by participants" on public.appointments for select using (
  patient_id = auth.uid()
  or public.is_clinic_member(auth.uid(), clinic_id)
  or public.is_admin(auth.uid())
);
create policy "appt insert by patient or clinic" on public.appointments for insert with check (
  (patient_id = auth.uid())
  or public.is_clinic_member(auth.uid(), clinic_id)
  or public.is_admin(auth.uid())
);
create policy "appt update by clinic or patient" on public.appointments for update using (
  patient_id = auth.uid()
  or public.is_clinic_member(auth.uid(), clinic_id)
  or public.is_admin(auth.uid())
);
create policy "appt delete by admin/clinic" on public.appointments for delete using (
  public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid())
);

-- reviews
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews insert by patient" on public.reviews for insert with check (auth.uid() = patient_id);
create policy "reviews update by patient or clinic-reply" on public.reviews for update using (
  auth.uid() = patient_id or public.is_clinic_member(auth.uid(), clinic_id) or public.is_admin(auth.uid())
);
create policy "reviews delete by patient or admin" on public.reviews for delete using (auth.uid() = patient_id or public.is_admin(auth.uid()));

-- favorites
create policy "favorites self all" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notifications
create policy "notif self read" on public.notifications for select using (auth.uid() = user_id);
create policy "notif self update" on public.notifications for update using (auth.uid() = user_id);
create policy "notif self delete" on public.notifications for delete using (auth.uid() = user_id);
create policy "notif admin insert" on public.notifications for insert with check (
  public.is_admin(auth.uid()) or auth.uid() = user_id
);

-- staff_invites
create policy "invites by clinic" on public.staff_invites for all using (public.is_clinic_owner(auth.uid(), clinic_id) or public.is_admin(auth.uid())) with check (public.is_clinic_owner(auth.uid(), clinic_id) or public.is_admin(auth.uid()));

-- audit
create policy "audit admin read" on public.audit_logs for select using (public.is_admin(auth.uid()));
create policy "audit insert any auth" on public.audit_logs for insert with check (auth.uid() is not null);

-- content + settings: public read, admin write
create policy "content public read" on public.content for select using (true);
create policy "content admin write" on public.content for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "settings public read" on public.app_settings for select using (true);
create policy "settings admin write" on public.app_settings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- realtime
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.appointments;

-- seed default content
insert into public.content (key, value) values
  ('faqs', '[{"q":"How do I book an appointment?","a":"Search for a clinic or doctor, choose a time slot, and confirm your booking."},{"q":"Can I cancel a booking?","a":"Yes — go to your dashboard and cancel anytime before the appointment."},{"q":"Are clinics verified?","a":"Yes — every clinic is reviewed and approved by our admin team before going live."}]'::jsonb),
  ('terms', '{"text":"By using MediBook you agree to our terms..."}'::jsonb),
  ('privacy', '{"text":"We respect your privacy and protect your data..."}'::jsonb),
  ('contact', '{"email":"hello@medibook.app","phone":"+1 555 010 0000"}'::jsonb);

insert into public.app_settings (key, value) values
  ('booking_rules', '{"default_slot_minutes":30,"cutoff_minutes":60,"max_per_slot":1}'::jsonb),
  ('branding', '{"name":"MediBook","tagline":"Healthcare, made effortless"}'::jsonb);
