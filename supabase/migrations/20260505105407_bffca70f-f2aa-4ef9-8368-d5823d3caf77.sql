-- 1. Clinic type enum + column
do $$ begin
  create type public.clinic_type as enum ('dental','general','multi');
exception when duplicate_object then null; end $$;

alter table public.clinics
  add column if not exists clinic_type public.clinic_type not null default 'general';

-- 2. Storage buckets
insert into storage.buckets (id, name, public)
values
  ('clinic-logos','clinic-logos',true),
  ('clinic-banners','clinic-banners',true),
  ('doctor-photos','doctor-photos',true),
  ('service-images','service-images',true),
  ('avatars','avatars',true)
on conflict (id) do nothing;

-- 3. Storage policies (public read, owner-folder write)
do $$
declare
  b text;
begin
  foreach b in array array['clinic-logos','clinic-banners','doctor-photos','service-images','avatars']
  loop
    execute format($f$
      drop policy if exists "public read %1$s" on storage.objects;
      create policy "public read %1$s" on storage.objects
        for select using (bucket_id = %1$L);

      drop policy if exists "auth upload %1$s" on storage.objects;
      create policy "auth upload %1$s" on storage.objects
        for insert to authenticated
        with check (bucket_id = %1$L and auth.uid()::text = (storage.foldername(name))[1]);

      drop policy if exists "auth update %1$s" on storage.objects;
      create policy "auth update %1$s" on storage.objects
        for update to authenticated
        using (bucket_id = %1$L and auth.uid()::text = (storage.foldername(name))[1]);

      drop policy if exists "auth delete %1$s" on storage.objects;
      create policy "auth delete %1$s" on storage.objects
        for delete to authenticated
        using (bucket_id = %1$L and auth.uid()::text = (storage.foldername(name))[1]);
    $f$, b);
  end loop;
end $$;

-- 4. Permanent admin user
do $$
declare _uid uuid;
begin
  select id into _uid from auth.users where email = 'sohailsameer0@gmail.com';
  if _uid is null then
    _uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', _uid, 'authenticated','authenticated',
      'sohailsameer0@gmail.com', crypt('Pakistan@12', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Platform Admin"}'::jsonb,
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), _uid,
      jsonb_build_object('sub', _uid::text, 'email', 'sohailsameer0@gmail.com', 'email_verified', true),
      'email', _uid::text, now(), now(), now());
  else
    update auth.users
      set encrypted_password = crypt('Pakistan@12', gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          updated_at = now()
      where id = _uid;
  end if;

  insert into public.profiles (id, full_name)
  values (_uid, 'Platform Admin')
  on conflict (id) do nothing;

  -- Remove any default 'patient' role and ensure super_admin
  delete from public.user_roles where user_id = _uid and role <> 'super_admin';
  insert into public.user_roles (user_id, role)
  values (_uid, 'super_admin')
  on conflict (user_id, role) do nothing;
end $$;