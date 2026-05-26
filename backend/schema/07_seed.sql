-- 07_seed.sql
-- Initial seed data. Run after 06_storage.sql.
--
-- This file sets up:
--   - The single Society row
--   - A few notice templates
--   - The parking slot inventory (165 slots + a few visitor slots)
--
-- Member rows are NOT seeded here — that happens via the import script in
-- backend/scripts/import-members.ts which reads MEMBERS LIST.docx.

insert into public.society
  (name, registration_no, pan, address, email, phone,
   established_year, num_flats, num_floors, land_area, domain)
values
  ('Evergreen Apartment',
   'Regd. No. 837',
   'AAATE0837F',
   'Plot 9, Sector 7, Dwarka, New Delhi 110075',
   'evergreensocietyplot9@gmail.com',
   '011-42441492',
   1998,
   165,
   4,
   '2.6 acres',
   'evergreen-dwarka.in')
on conflict do nothing;

-- ─── Parking inventory ────────────────────────────────────────────────────
-- 165 resident slots numbered P-001 to P-165, plus 14 visitor slots.
do $$
declare i int;
begin
  for i in 1..165 loop
    insert into public.parking_slots (slot_no, zone, is_visitor, is_active)
      values ('P-' || lpad(i::text, 3, '0'),
              case when i <= 80 then 'basement-1' else 'basement-2' end,
              false, true)
      on conflict (slot_no) do nothing;
  end loop;
  for i in 1..14 loop
    insert into public.parking_slots (slot_no, zone, is_visitor, is_active)
      values ('P-V-' || lpad(i::text, 2, '0'), 'open', true, true)
      on conflict (slot_no) do nothing;
  end loop;
end $$;

-- ─── Sample notice (welcome notice, useful for first deploy QA) ───────────
insert into public.notices
  (code, title, body, category, visibility, is_pinned, published_at)
values
  ('n-2026-001',
   'Welcome to the Evergreen member portal',
   E'Dear members,\n\nThis is the official Evergreen Apartment member portal. You can now access society notices, calendar events, audit reports, and AGM materials in one place.\n\nIf any of your contact details are missing or outdated, please use the "My Profile" page to update them, or write to the Society Office.\n\n— Managing Committee',
   'notice',
   'members',
   true,
   now())
on conflict (code) do nothing;

-- ─── Notes ────────────────────────────────────────────────────────────────
-- After running this seed:
-- 1. Run `npm run import:members` from backend/ — that creates 165 rows in
--    public.members with the data from MEMBERS LIST.docx.
-- 2. Manually create the super-admin auth user in Supabase Studio:
--      Authentication → Users → Add user → email = saurabh@…
-- 3. Then promote them:
--      update public.users set role='superadmin'
--        where id = (select id from auth.users where email = 'saurabh@…');
-- 4. Saurabh then signs in once with the password set in step 2; on first
--    login the trigger ensures a public.users row exists linked to member
--    Flat 133.
