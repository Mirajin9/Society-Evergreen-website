-- 05_rls.sql
-- Row-Level Security policies. Run after 04_functions.sql.
--
-- This is the SECURITY-CRITICAL file. Even if the application code has bugs,
-- these policies prevent unauthorized reads/writes at the database level.

-- ─── Enable RLS on every public table ─────────────────────────────────────
alter table public.society               enable row level security;
alter table public.members               enable row level security;
alter table public.users                 enable row level security;
alter table public.self_update_tokens    enable row level security;
alter table public.notices               enable row level security;
alter table public.events                enable row level security;
alter table public.documents             enable row level security;
alter table public.document_access       enable row level security;
alter table public.member_documents      enable row level security;
alter table public.share_certificate_uploads enable row level security;
alter table public.share_certificate_rows    enable row level security;
alter table public.complaints            enable row level security;
alter table public.complaint_messages    enable row level security;
alter table public.reminders             enable row level security;
alter table public.sms_messages          enable row level security;
alter table public.otp_challenges        enable row level security;
alter table public.activity_log          enable row level security;
alter table public.meetings              enable row level security;
alter table public.meeting_documents     enable row level security;

-- ─── Society (single row, read by anyone, write by admin) ─────────────────
create policy society_read_anyone on public.society
  for select using (true);
create policy society_write_admin on public.society
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Members ──────────────────────────────────────────────────────────────
-- Anyone with a session can see their OWN member row.
-- Committee/admin can see all.
-- Public visitors see nothing — member directory is not public.
create policy members_read_own on public.members
  for select to authenticated
  using (
    id = public.current_member_id()
    or public.is_committee_or_admin()
  );

-- Members can edit only their own profile (and only a subset of fields — this
-- restriction is enforced by the API layer; the policy allows the row but the
-- API uses an allow-list of editable columns).
create policy members_update_own on public.members
  for update to authenticated
  using (id = public.current_member_id())
  with check (id = public.current_member_id());

-- Admins can do anything.
create policy members_admin_all on public.members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Users ────────────────────────────────────────────────────────────────
-- A user can read their own user row. Admins can read all.
create policy users_read_self on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy users_admin_all on public.users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Self-update tokens ───────────────────────────────────────────────────
-- These are used by the unauthenticated "self-update" flow. The token itself
-- is the credential — anyone with the token string can read the row it
-- references via a stored procedure (NOT via direct table select).
-- So we lock down the table entirely and expose a SECURITY DEFINER function.
create policy self_update_tokens_admin on public.self_update_tokens
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Notices ──────────────────────────────────────────────────────────────
-- Public can read public notices. Members can read public + members. Committee
-- adds committee. Admin adds admin.
create policy notices_read on public.notices
  for select using (
    deleted_at is null
    and published_at is not null and published_at <= now()
    and (
      visibility = 'public'
      or (visibility = 'members'   and auth.uid() is not null and (
        public.is_admin()
        or coalesce(jsonb_array_length(meta -> 'target_flat_nos'), 0) = 0
        or exists (
          select 1 from jsonb_array_elements_text(meta -> 'target_flat_nos') target(flat_no)
          where target.flat_no::int = (
            select flat_no from public.members where id = public.current_member_id()
          )
        )
      ))
      or (visibility = 'committee' and public.is_committee_or_admin())
      or (visibility = 'admin'     and public.is_admin())
    )
  );

create policy notices_write_admin on public.notices
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Events ───────────────────────────────────────────────────────────────
create policy events_read on public.events
  for select using (
    deleted_at is null
    and (
      visibility = 'public'
      or (visibility = 'members'   and auth.uid() is not null)
      or (visibility = 'committee' and public.is_committee_or_admin())
      or (visibility = 'admin'     and public.is_admin())
    )
  );

create policy events_write_admin on public.events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Documents ────────────────────────────────────────────────────────────
-- Mirrors notices, plus respects per-row document_access overrides.
create policy documents_read on public.documents
  for select using (
    deleted_at is null and is_published = true
    and (
      visibility = 'public'
      or (visibility = 'members'   and auth.uid() is not null)
      or (visibility = 'committee' and public.is_committee_or_admin())
      or (visibility = 'admin'     and public.is_admin())
      or exists (
        select 1 from public.document_access da
        where da.document_id = documents.id
          and (
               da.member_id = public.current_member_id()
            or (da.role is not null and da.role = public.current_role())
            or (da.floor is not null and da.floor = (select floor from public.members where id = public.current_member_id()))
          )
      )
    )
  );

create policy documents_write_admin on public.documents
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy document_access_admin on public.document_access
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Member documents (private to one member) ─────────────────────────────
-- A member can read their own member_documents. Admin can read all.
create policy member_docs_read on public.member_documents
  for select to authenticated
  using (
    member_id = public.current_member_id()
    or public.is_admin()
  );

create policy member_docs_write_admin on public.member_documents
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Share certificate register: members can read parsed rows only. Upload
-- metadata/source files stay admin-only so there is no member download path.
create policy share_cert_rows_read_members on public.share_certificate_rows
  for select to authenticated using (true);
create policy share_cert_rows_admin_all on public.share_certificate_rows
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy share_cert_uploads_admin_all on public.share_certificate_uploads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Complaints ───────────────────────────────────────────────────────────
-- A member sees only their own complaints. Admin sees all.
create policy complaints_read on public.complaints
  for select to authenticated
  using (
    created_by_member = public.current_member_id()
    or public.is_admin()
  );

-- Members can create complaints from their own member_id.
create policy complaints_insert_own on public.complaints
  for insert to authenticated
  with check (created_by_member = public.current_member_id());

-- Members can't update complaints (only admins can change status, assignee).
create policy complaints_update_admin on public.complaints
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy complaints_delete_superadmin on public.complaints
  for delete to authenticated
  using (public.is_superadmin());

-- Complaint messages: members can read/write on their own complaints, admins on any.
create policy complaint_msgs_read on public.complaint_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id
        and (c.created_by_member = public.current_member_id() or public.is_admin())
    )
  );

create policy complaint_msgs_insert on public.complaint_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id
        and (c.created_by_member = public.current_member_id() or public.is_admin())
    )
  );

-- ─── Reminders (admin-only) ───────────────────────────────────────────────
create policy reminders_admin on public.reminders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy sms_messages_admin on public.sms_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy otp_challenges_admin on public.otp_challenges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Activity log (read-only for admins) ──────────────────────────────────
create policy activity_log_admin_read on public.activity_log
  for select to authenticated
  using (public.is_admin());

-- Application code inserts via security-definer function log_activity(); no
-- direct INSERT policy needed and rejecting one prevents tampering.

-- ─── Meetings (members read, admins write) ────────────────────────────────
create policy meetings_read on public.meetings
  for select to authenticated using (true);
create policy meetings_write_admin on public.meetings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy meeting_docs_read on public.meeting_documents
  for select to authenticated using (true);
create policy meeting_docs_write_admin on public.meeting_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
