-- 02_tables.sql
-- Core schema. Run after 01_enums.sql.
--
-- Naming conventions:
--   - Table names are plural snake_case.
--   - Primary keys are `id uuid` everywhere, default gen_random_uuid().
--   - Foreign keys are `<entity>_id`.
--   - Timestamps are `*_at timestamptz default now()`.
--   - Soft deletes use `deleted_at timestamptz` (null means alive).
--   - Free-form JSON metadata sits in a `meta jsonb default '{}'::jsonb` column when needed.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Society config (single-row table, simpler than env vars) ────────────
create table public.society (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  registration_no      text,
  pan                  text,
  address              text not null,
  email                text not null,
  phone                text,
  established_year     int,
  num_flats            int not null,
  num_floors           int not null,
  land_area            text,
  domain               text,
  -- single row enforced by partial unique index below
  is_active            boolean not null default true,
  meta                 jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create unique index society_singleton on public.society ((is_active)) where is_active = true;

-- ─── Members (the 165 flats) ──────────────────────────────────────────────
create table public.members (
  id                   uuid primary key default gen_random_uuid(),
  flat_no              int not null unique,            -- 1..165 — stable secondary key
  membership_no        text,                            -- RCS membership number, e.g. "176"
  name                 text not null,                   -- includes honorific (MR./SMT./LATE) in original case
  display_name         text generated always as (regexp_replace(name, '^(MR|MRS|MS|SMT|DR|LATE)\.?\s+', '', 'i')) stored,
  father_spouse_name   text,
  date_of_joining      date,
  email                text,
  alternate_email      text,
  phone                text,
  alternate_phone      text,
  ownership            ownership_status default 'owner',
  status               member_status not null default 'active',
  floor                int,                            -- derived: G=0, 1F=1, …
  has_co_owner         boolean not null default false,
  co_owner_name        text,
  vehicle_number       text,
  vehicle_make_model   text,
  notes                text,
  meta                 jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

-- ─── Users (linked to Supabase Auth) ──────────────────────────────────────
-- A row here is created when a member is invited and successfully signs up.
-- `id` matches auth.users.id so RLS policies can use auth.uid() directly.
create table public.users (
  id                   uuid primary key references auth.users(id) on delete cascade,
  member_id            uuid not null references public.members(id) on delete restrict,
  role                 user_role not null default 'member',
  committee_role       text,                           -- "President", "Vice-President", … when role = 'committee'
  committee_term       text,                           -- e.g. "2024-2026"
  email                text not null,                  -- mirrored from auth.users for convenience
  last_seen_at         timestamptz,
  notification_prefs   jsonb not null default '{
    "agm_sgm": true, "elections": true, "maintenance": true,
    "payments": true, "mc_minutes": false, "society_events": true,
    "channel_email": true, "channel_sms": false
  }'::jsonb,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- One user per member (members can have at most one login).
create unique index users_member_id_unique on public.users (member_id);

-- ─── Self-update tokens ───────────────────────────────────────────────────
-- Sent to members who have email but incomplete profiles. Single-use, 14d ttl.
create table public.self_update_tokens (
  token                text primary key,                -- random ~32-char string
  member_id            uuid not null references public.members(id) on delete cascade,
  created_at           timestamptz not null default now(),
  expires_at           timestamptz not null,
  used_at              timestamptz,                     -- null = unused
  created_by           uuid references public.users(id) on delete set null
);

-- ─── Notices ──────────────────────────────────────────────────────────────
create table public.notices (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,            -- "n-2026-018" — human-friendly id, shown in UI
  title                text not null,
  body                 text not null,                   -- markdown allowed
  category             notice_category not null,
  visibility           visibility not null default 'members',
  is_pinned            boolean not null default false,
  published_at         timestamptz,                     -- null = draft
  expires_at           timestamptz,                     -- null = never
  published_by         uuid references public.users(id) on delete set null,
  meta                 jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

-- ─── Events (calendar) ────────────────────────────────────────────────────
create table public.events (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,            -- "e-2026-014"
  title                text not null,
  description          text,
  category             event_category not null,
  visibility           visibility not null default 'members',
  starts_at            timestamptz not null,
  ends_at              timestamptz,
  is_all_day           boolean not null default false,
  location             text,
  -- Recurrence is held as RFC-5545 RRULE string; null = single occurrence.
  rrule                text,
  recipients_filter    jsonb,                           -- {"all": true} | {"floors": [1, 2]} | {"role": "committee"} | {"defaulters": true}
  created_by           uuid references public.users(id) on delete set null,
  meta                 jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

-- ─── Documents (society-wide library) ─────────────────────────────────────
create table public.documents (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,            -- "d-2026-018"
  title                text not null,
  description          text,
  category             document_category not null,
  visibility           visibility not null default 'members',
  -- Storage path inside Supabase Storage. The actual file isn't in Postgres.
  storage_bucket       text not null default 'documents',
  storage_path         text not null,                   -- e.g. "agm/2026/notice-of-28th-agm.pdf"
  size_bytes           bigint,
  mime_type            text,
  version              text default 'v1',
  document_date        date,                            -- date on the document itself (e.g. AGM notice dated May 22)
  uploaded_by          uuid references public.users(id) on delete set null,
  linked_event_id      uuid references public.events(id) on delete set null,
  is_published         boolean not null default true,
  meta                 jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

-- Per-document access overrides. Used when a doc should be visible only to
-- specific members or a specific floor — beyond the basic `visibility` enum.
create table public.document_access (
  id                   uuid primary key default gen_random_uuid(),
  document_id          uuid not null references public.documents(id) on delete cascade,
  -- exactly one of these should be set:
  member_id            uuid references public.members(id) on delete cascade,
  floor                int,
  role                 user_role,
  granted_at           timestamptz not null default now(),
  granted_by           uuid references public.users(id) on delete set null
);

-- Member-private documents (NOC, ID proof, share certificate). Different table
-- so a member can never see another member's private docs even with a wrong RLS write.
create table public.member_documents (
  id                   uuid primary key default gen_random_uuid(),
  member_id            uuid not null references public.members(id) on delete cascade,
  title                text not null,
  doc_kind             text not null,                   -- "id_proof", "noc", "share_cert", "nominee_decl", "allotment"
  storage_bucket       text not null default 'member-documents',
  storage_path         text not null,
  size_bytes           bigint,
  uploaded_by          uuid references public.users(id) on delete set null,
  created_at           timestamptz not null default now()
);

create table public.share_certificate_uploads (
  id                   uuid primary key default gen_random_uuid(),
  file_name            text not null,
  storage_bucket       text not null default 'admin-imports',
  storage_path         text,
  row_count            int not null default 0,
  uploaded_by          uuid references public.users(id) on delete set null,
  created_at           timestamptz not null default now()
);

create table public.share_certificate_rows (
  id                   uuid primary key default gen_random_uuid(),
  upload_id            uuid not null references public.share_certificate_uploads(id) on delete cascade,
  row_no               int not null,
  flat_no              int references public.members(flat_no) on delete set null,
  membership_no        text,
  member_name          text,
  certificate_no       text,
  issue_date           date,
  shares_count         int,
  distinctive_from     text,
  distinctive_to       text,
  remarks              text,
  row_data             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now()
);

-- ─── Complaints ───────────────────────────────────────────────────────────
create table public.complaints (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,            -- "EA-CMP-2026-041"
  title                text not null,
  description          text,
  category             complaint_category not null,
  priority             complaint_priority not null default 'medium',
  status               complaint_status not null default 'open',
  created_by_member    uuid not null references public.members(id) on delete restrict,
  assigned_to          text,                            -- free-text vendor or staff name
  assigned_to_user     uuid references public.users(id) on delete set null,
  resolved_at          timestamptz,
  meta                 jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.complaint_messages (
  id                   uuid primary key default gen_random_uuid(),
  complaint_id         uuid not null references public.complaints(id) on delete cascade,
  author_user          uuid references public.users(id) on delete set null,
  author_display       text not null,                   -- "Society Office", vendor name, etc.
  is_admin             boolean not null default false,
  body                 text not null,
  attachment_path      text,                            -- optional storage path
  created_at           timestamptz not null default now()
);

-- ─── Reminders (the scheduled-email queue) ────────────────────────────────
create table public.reminders (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid references public.events(id) on delete cascade,
  notice_id            uuid references public.notices(id) on delete cascade,
  -- The reason for the reminder, for the audit log
  kind                 text not null,                   -- "agm-7d", "payment-3d", "lift-1d", etc.
  recipients_filter    jsonb not null default '{"all": true}',
  subject              text not null,
  body                 text not null,
  dispatch_at          timestamptz not null,
  status               reminder_status not null default 'queued',
  sent_count           int,                             -- how many emails actually went out
  failed_count         int,
  error_message        text,
  created_by           uuid references public.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  sent_at              timestamptz
);

create table public.sms_messages (
  id                   uuid primary key default gen_random_uuid(),
  member_id            uuid references public.members(id) on delete set null,
  mobile               text not null,
  template_key         text not null,
  body                 text not null,
  provider             text,
  provider_message_id  text,
  status               text not null default 'queued',
  error_message        text,
  queued_at            timestamptz not null default now(),
  sent_at              timestamptz,
  meta                 jsonb not null default '{}'::jsonb
);

create table public.otp_challenges (
  id                   uuid primary key default gen_random_uuid(),
  member_id            uuid references public.members(id) on delete cascade,
  mobile               text not null,
  otp_hash             text not null,
  expires_at           timestamptz not null,
  consumed_at          timestamptz,
  attempts             int not null default 0,
  created_at           timestamptz not null default now()
);

-- ─── Activity log (audit trail) ───────────────────────────────────────────
-- Append-only. Triggered by application code AND by table triggers (see 04_functions.sql).
create table public.activity_log (
  id                   uuid primary key default gen_random_uuid(),
  actor_user           uuid references public.users(id) on delete set null,
  actor_display        text not null,                   -- snapshot of name at time of action
  action               activity_action not null,
  target_table         text,                            -- "members", "documents", etc.
  target_id            uuid,
  target_label         text,                            -- human-readable: "Flat 41 — added phone"
  diff                 jsonb,                           -- {field: [old, new]} pairs for updates
  ip_address           inet,
  user_agent           text,
  created_at           timestamptz not null default now()
);

-- ─── Meetings (records of AGMs, SGMs, MC meetings) ────────────────────────
create table public.meetings (
  id                   uuid primary key default gen_random_uuid(),
  code                 text unique not null,            -- "M-2026-04"
  kind                 text not null,                   -- "agm" | "sgm" | "mc"
  title                text not null,
  meeting_date         date not null,
  attendees_count      int,
  minutes_document_id  uuid references public.documents(id) on delete set null,
  notes                text,
  created_by           uuid references public.users(id) on delete set null,
  created_at           timestamptz not null default now()
);

-- Connecting attached documents to meetings (many-to-many).
create table public.meeting_documents (
  meeting_id           uuid not null references public.meetings(id) on delete cascade,
  document_id          uuid not null references public.documents(id) on delete cascade,
  primary key (meeting_id, document_id)
);

-- ─── Audit/updated_at trigger glue (used in 04_functions.sql) ─────────────
-- We'll add the updated_at trigger after defining the trigger function.
