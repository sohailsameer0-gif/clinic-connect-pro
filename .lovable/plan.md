## MediBook — Multi-Clinic Appointment Booking Platform

A premium multi-tenant SaaS for dental and medical clinics with three role-based panels (Admin, Clinic, Patient). Built on Lovable Cloud with a modular data layer so the backend can be swapped later if needed.

### Design direction

A premium, modern medical aesthetic — calm, trustworthy, and clinical without feeling sterile.

- Palette: deep teal/ocean primary, soft neutrals, white surfaces, subtle gradients on hero/dashboard cards
- Typography: Inter, generous spacing, rounded-xl cards, soft shadows
- Light + dark mode, fully responsive (mobile → desktop)
- Framer Motion micro-interactions (page transitions, dialog springs, list stagger)
- Skeleton loaders, empty states, toast feedback, confirmation dialogs everywhere

### Scope (Core MVP)

This is the first build pass. It delivers a fully working end-to-end product. Payments, advanced analytics charts, and reports come in a follow-up phase.

#### 1. Authentication & roles
- Email/password + Google sign-in (Lovable Cloud)
- Email verification, forgot password, reset page
- Roles stored in a separate `user_roles` table (security best practice): `super_admin`, `clinic_owner`, `clinic_staff`, `doctor`, `patient`
- Role-aware route guards using a `_authenticated` layout + role-specific layouts (`_admin`, `_clinic`, `_patient`)
- Patient signup is self-serve; clinic signup creates a pending clinic awaiting admin approval

#### 2. Patient panel (public + authenticated)
- Landing page: hero, search bar (specialty / city / clinic name), featured clinics, top doctors, how-it-works, testimonials, FAQ, footer
- Search & browse with filters: specialty, city, rating, fee range, gender, availability
- Clinic detail page: about, doctors list, services, hours, map placeholder, reviews
- Doctor detail page: bio, qualifications, fee, schedule, reviews
- Booking flow: pick doctor → service → date → available slot → confirm. Real-time slot availability, double-booking prevention, cutoff time enforcement
- Patient dashboard: upcoming + past appointments, reschedule, cancel
- Profile: personal info, medical history notes, favorite clinics/doctors
- Reviews: rate + review after a completed appointment; edit/delete own
- Notification bell (realtime in-app) + email confirmations

#### 3. Clinic panel
- Dashboard: today's appointments, week overview, totals, quick actions
- Clinic profile: logo, banner, about, address, contact, working hours, social links
- Doctors: CRUD (specialty, qualification, experience, fee, image, online status)
- Services: CRUD (category, price, duration, description)
- Schedule management per doctor: working days, time slots, slot interval, breaks, holidays/leaves
- Appointments: list with filters; accept / reject / reschedule / mark complete / mark no-show; appointment notes
- Walk-in / emergency booking entry
- Patient records (visit history per patient)
- Staff accounts: invite receptionist with limited permissions
- Reviews inbox with reply
- Notifications

#### 4. Admin (super admin) panel
- Dashboard: total clinics, doctors, patients, appointments, recent activity, pending approvals
- Clinic management: approve / reject / suspend / feature / delete; verification status
- Doctor oversight: view all, suspend
- User management: view patients, block/unblock
- Appointments overview: filter across the whole platform
- Content: banners, FAQs, terms, privacy, contact info
- Notification center: send platform-wide announcements
- Settings: app branding, booking rules (slot interval defaults, cutoff window, max bookings/slot)

#### 5. Booking engine
- Slot generator derives availability from each doctor's schedule + booked appointments + holidays
- Server-side validation prevents double-booking and out-of-window bookings
- Statuses: `pending`, `confirmed`, `completed`, `cancelled`, `rejected`, `rescheduled`, `no_show`
- Buffer time and max-per-slot enforced at the database/server-function layer
- Realtime updates so two patients can't grab the same slot

#### 6. Notifications
- In-app realtime notification center (bell + dropdown + history page, mark-as-read, unread badge) on all three panels
- Transactional emails via Lovable Emails: booking created, confirmed, rejected, rescheduled, cancelled, reminder (24h before), new review, clinic approval status, staff invite
- Realtime delivery using Supabase Realtime on a `notifications` table

#### 7. Cross-cutting quality
- React Hook Form + Zod on every form, with friendly inline errors
- TanStack Query for caching, with route loaders priming the cache (no loading flashes)
- Error boundaries on every route, 404 page, retry buttons
- Skeletons + empty states + toasts everywhere
- Audit log table for sensitive admin actions

### Data model (high level)

```text
profiles(id → auth.users, full_name, phone, avatar_url, dob, gender, …)
user_roles(user_id, role)                  -- separate table, has_role() SECURITY DEFINER
clinics(id, owner_id, name, slug, logo, banner, about, address, city,
        phone, email, hours_json, status, featured, verified, …)
doctors(id, clinic_id, user_id?, name, specialty, qualification,
        experience_years, fee, image, gender, bio, active)
services(id, clinic_id, category, name, price, duration_min, description, image)
schedules(id, doctor_id, weekday, start_time, end_time, slot_minutes,
          max_per_slot, buffer_min)
schedule_exceptions(id, doctor_id, date, type)   -- holiday / leave / extra
appointments(id, clinic_id, doctor_id, patient_id, service_id,
             starts_at, ends_at, status, notes, created_at)
reviews(id, clinic_id, doctor_id, patient_id, appointment_id, rating, comment)
favorites(user_id, clinic_id|doctor_id)
notifications(id, user_id, type, title, body, data, read, created_at)
staff_invites(id, clinic_id, email, role, status, token)
audit_logs(id, actor_id, action, target, meta, created_at)
content(key, value_json)                  -- banners, FAQs, terms, etc.
app_settings(key, value_json)
```

RLS on every table. Patients see only their own data. Clinic users see only data for clinics they belong to (via a `clinic_members` table). Admins use `has_role(auth.uid(), 'super_admin')`.

### Architecture & technical notes

- TanStack Start + Lovable Cloud (Supabase under the hood). All sensitive reads/writes go through `createServerFn` with `requireSupabaseAuth` so RLS is enforced as the user.
- Modular data layer: a thin `src/lib/data/*` repository layer wraps Supabase calls. Components/hooks call the repository, never Supabase directly. A future swap to Firebase or another backend means rewriting only this folder.
- File-based routes:
  ```text
  src/routes/
    __root.tsx
    index.tsx                       # landing
    clinics.tsx, clinics.$slug.tsx
    doctors.$id.tsx
    search.tsx
    login.tsx, signup.tsx, reset-password.tsx
    _authenticated.tsx
      patient/dashboard.tsx, patient/appointments.tsx, patient/profile.tsx, …
      clinic/dashboard.tsx, clinic/doctors.tsx, clinic/services.tsx,
      clinic/schedule.tsx, clinic/appointments.tsx, clinic/staff.tsx, clinic/profile.tsx
      admin/dashboard.tsx, admin/clinics.tsx, admin/users.tsx, admin/content.tsx, admin/settings.tsx
    unsubscribe.tsx
  ```
- Email setup: Lovable Cloud + a sender domain are required for transactional emails. The plan includes prompting you to set this up; in-app + UI work is fully functional without it.
- Charts: small KPI cards + sparkline summaries in v1. Full analytics dashboards land in phase 2.

### What is intentionally deferred to phase 2

So the first build is rock-solid, these are explicitly NOT in this pass. We add them next, once the core is verified working:

- Stripe / Paddle subscriptions and billing pages
- Full revenue/booking analytics dashboards with multi-series charts and CSV/PDF export
- Web push / FCM browser push (in-app realtime + email cover the v1 need)
- Multi-language i18n (architecture leaves space, no translations shipped)
- File/report uploads on patient profiles (storage bucket scaffolded, UI in phase 2)

### Deliverable

A working, polished, fully-navigable platform: anyone can sign up as a patient and book; any clinic owner can sign up, get approved by admin, configure doctors/services/schedule, and start receiving bookings; admins can manage the whole platform. Every route renders, every form validates, every CRUD works, RLS protects data, notifications fire in realtime, and emails go out for key events.