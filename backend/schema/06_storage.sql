-- 06_storage.sql
-- Storage bucket definitions + access policies. Run after 05_rls.sql.
--
-- Supabase Storage is built on top of Postgres; buckets are just rows in
-- storage.buckets and files are rows in storage.objects. Policies on
-- storage.objects gate access.
--
-- We define three buckets:
--   1. documents          — society-wide doc library (mirrors visibility on public.documents row)
--   2. member-documents   — private to one member
--   3. public-assets      — society logo, public images (always public)

-- Buckets
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
  values ('member-documents', 'member-documents', false)
  on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
  values ('public-assets', 'public-assets', true)
  on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
  values ('admin-imports', 'admin-imports', false)
  on conflict (id) do update set public = excluded.public;

-- ─── `documents` bucket policies ──────────────────────────────────────────
-- A file's visibility is determined by the matching row in public.documents.
-- We look it up by storage_path.
create policy "documents.read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.documents d
      where d.storage_bucket = bucket_id
        and d.storage_path = name
        and d.deleted_at is null
        and d.is_published = true
        and (
          d.visibility = 'public'
          or (d.visibility = 'members'   and auth.uid() is not null)
          or (d.visibility = 'committee' and public.is_committee_or_admin())
          or (d.visibility = 'admin'     and public.is_admin())
          or exists (
            select 1 from public.document_access da
            where da.document_id = d.id
              and (
                   da.member_id = public.current_member_id()
                or (da.role is not null and da.role = public.current_role())
                or (da.floor is not null and da.floor = (select floor from public.members where id = public.current_member_id()))
              )
          )
        )
    )
  );

create policy "documents.write_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and public.is_admin())
  with check (bucket_id = 'documents' and public.is_admin());

-- ─── `member-documents` bucket policies ───────────────────────────────────
-- File path convention: <member_id>/<filename>. Members can read their own folder.
create policy "memdocs.read" on storage.objects
  for select to authenticated using (
    bucket_id = 'member-documents'
    and (
      split_part(name, '/', 1)::uuid = public.current_member_id()
      or public.is_admin()
    )
  );

create policy "memdocs.write_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'member-documents' and public.is_admin())
  with check (bucket_id = 'member-documents' and public.is_admin());

-- ─── `public-assets` bucket policies ──────────────────────────────────────
-- Public read; admin write.
create policy "publicassets.read" on storage.objects
  for select using (bucket_id = 'public-assets');

create policy "publicassets.write_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'public-assets' and public.is_admin())
  with check (bucket_id = 'public-assets' and public.is_admin());

create policy "adminimports.admin_only" on storage.objects
  for all to authenticated
  using (bucket_id = 'admin-imports' and public.is_admin())
  with check (bucket_id = 'admin-imports' and public.is_admin());

-- ─── Practical guidance ───────────────────────────────────────────────────
-- Frontend code should NEVER use Supabase signed URLs naively. Use the
-- recommended flow:
--   - For viewing a doc: call POST /api/documents/:id/signed-url; the API
--     verifies the user can access it, then returns a short-lived URL.
--   - For uploads: call POST /api/admin/documents/upload, which writes the
--     row first, then returns a presigned PUT URL for the file.
--
-- Doing it this way ensures the database row exists before the file, so we
-- never end up with orphan files.
