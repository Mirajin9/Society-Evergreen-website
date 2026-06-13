-- 07_seed.sql
-- Initial seed data. Run after 06_storage.sql.
--
-- This file sets up:
--   - The single Society row
--   - A few notice templates
--
-- Member rows are NOT seeded here — that happens via the import script in
-- backend/scripts/import-members.ts which reads the latest uploaded workbook.

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
   'evergreenapartment.in')
on conflict do nothing;

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
-- 1. Run `npm --prefix backend run import:members` from the project root.
--    That imports 165 rows into public.members from the latest workbook in
--    uploads/.
-- 2. Run `npm --prefix backend run upload:documents` from the project root.
--    That uploads the launch PDFs/forms into Supabase Storage and
--    public.documents.
-- 3. Create any long-term Supabase Auth admin users once the hosted login
--    flow is moved from local username/password to Supabase-backed auth.
