-- 04_functions.sql
-- Database functions and triggers. Run after 03_indexes.sql.
--
-- These functions live in the database itself, so they fire whether a write
-- came from the website, a direct API call, or the Supabase Studio UI.

-- ─── updated_at trigger ───────────────────────────────────────────────────
-- Touch updated_at on every row mutation.
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger members_updated_at  before update on public.members
  for each row execute function public.touch_updated_at();
create trigger users_updated_at    before update on public.users
  for each row execute function public.touch_updated_at();
create trigger notices_updated_at  before update on public.notices
  for each row execute function public.touch_updated_at();
create trigger events_updated_at   before update on public.events
  for each row execute function public.touch_updated_at();
create trigger documents_updated_at before update on public.documents
  for each row execute function public.touch_updated_at();
create trigger complaints_updated_at before update on public.complaints
  for each row execute function public.touch_updated_at();
create trigger society_updated_at  before update on public.society
  for each row execute function public.touch_updated_at();

-- ─── Member floor derivation ──────────────────────────────────────────────
-- If floor is null and we know flat_no, derive it.
-- (At Evergreen with 165 flats over 4 floors: G=1–42, 1F=43–84, 2F=85–126, 3F=127–165.)
create or replace function public.derive_floor() returns trigger as $$
begin
  if new.floor is null and new.flat_no is not null then
    new.floor := case
      when new.flat_no <= 42  then 0
      when new.flat_no <= 84  then 1
      when new.flat_no <= 126 then 2
      else 3
    end;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger members_derive_floor before insert or update on public.members
  for each row execute function public.derive_floor();

-- ─── Profile completeness ─────────────────────────────────────────────────
-- Returns 0..100 for a member row based on REQUIRED_FIELDS.
create or replace function public.member_completeness(m public.members) returns int as $$
declare
  total int := 4;
  filled int := 0;
begin
  if m.email is not null and m.email <> '' then filled := filled + 1; end if;
  if m.phone is not null and m.phone <> '' then filled := filled + 1; end if;
  if m.membership_no is not null and m.membership_no <> '' then filled := filled + 1; end if;
  if m.ownership is not null then filled := filled + 1; end if;
  return round((filled::numeric / total) * 100);
end;
$$ language plpgsql immutable;

-- ─── Member login status ──────────────────────────────────────────────────
-- Derived from members + users — saves us from storing duplicate state.
create or replace function public.member_login_status(m public.members) returns login_status as $$
declare
  u public.users;
begin
  if m.status = 'deceased' then return 'disabled'; end if;
  select * into u from public.users where member_id = m.id and is_active = true;
  if found then
    return 'enabled'::login_status;
  end if;
  if m.email is null or m.email = '' then
    return 'no_email'::login_status;
  end if;
  -- Pending if there's an unconsumed self-update token OR an unconfirmed auth.users row.
  if exists (select 1 from public.self_update_tokens where member_id = m.id and used_at is null and expires_at > now()) then
    return 'pending'::login_status;
  end if;
  return 'not_invited'::login_status;
end;
$$ language plpgsql stable;

-- ─── Helper: current user's role (used in RLS) ────────────────────────────
-- Wrapped in SECURITY DEFINER so it can read from public.users without
-- triggering RLS-on-RLS recursion.
create or replace function public.current_role() returns user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.current_member_id() returns uuid as $$
  select member_id from public.users where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_admin() returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin', 'superadmin') and is_active = true
  );
$$ language sql security definer stable;

create or replace function public.is_committee_or_admin() returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('committee', 'admin', 'superadmin') and is_active = true
  );
$$ language sql security definer stable;

create or replace function public.is_superadmin() returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'superadmin' and is_active = true
  );
$$ language sql security definer stable;

-- ─── Activity log writer ──────────────────────────────────────────────────
-- Call from API code:
--   select public.log_activity('member.updated', 'members', m_id, 'Flat 41 — added phone', '{"phone":[null,"+91…"]}');
create or replace function public.log_activity(
  p_action       activity_action,
  p_target_table text default null,
  p_target_id    uuid default null,
  p_target_label text default null,
  p_diff         jsonb default null
) returns uuid as $$
declare
  v_id uuid;
  v_display text;
begin
  select coalesce(
    (select m.display_name from public.users u join public.members m on m.id = u.member_id where u.id = auth.uid()),
    'System'
  ) into v_display;

  insert into public.activity_log
    (actor_user, actor_display, action, target_table, target_id, target_label, diff)
  values
    (auth.uid(), v_display, p_action, p_target_table, p_target_id, p_target_label, p_diff)
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer;

-- ─── Triggers that automatically log certain mutations ────────────────────
-- We log only the most common admin actions automatically. Application code
-- still calls log_activity() for richer entries with diffs.
create or replace function public.tg_log_member_change() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity('member.created', 'members', new.id, 'Flat ' || new.flat_no || ' — ' || new.display_name);
  elsif tg_op = 'UPDATE' then
    -- Only log when meaningful fields change
    if new.email is distinct from old.email
       or new.phone is distinct from old.phone
       or new.ownership is distinct from old.ownership
       or new.vehicle_number is distinct from old.vehicle_number
       or new.status is distinct from old.status then
      perform public.log_activity('member.updated', 'members', new.id, 'Flat ' || new.flat_no);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger members_audit
  after insert or update on public.members
  for each row execute function public.tg_log_member_change();

-- ─── Code generators ──────────────────────────────────────────────────────
-- Cheap human-readable codes. Format: "n-{year}-{seq}", "e-{year}-{seq}", etc.
create sequence if not exists notice_code_seq;
create sequence if not exists event_code_seq;
create sequence if not exists document_code_seq;
create sequence if not exists complaint_code_seq;

create or replace function public.next_notice_code() returns text as $$
  select 'n-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('notice_code_seq')::text, 3, '0');
$$ language sql;

create or replace function public.next_event_code() returns text as $$
  select 'e-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('event_code_seq')::text, 3, '0');
$$ language sql;

create or replace function public.next_document_code() returns text as $$
  select 'd-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('document_code_seq')::text, 3, '0');
$$ language sql;

create or replace function public.next_complaint_code() returns text as $$
  select 'EA-CMP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('complaint_code_seq')::text, 3, '0');
$$ language sql;

-- ─── Aggregate views (used by Dashboard) ──────────────────────────────────
create or replace view public.v_data_completion as
  select
    count(*)                                       as total_members,
    count(*) filter (where email is not null and email <> '') as with_email,
    count(*) filter (where phone is not null and phone <> '') as with_phone,
    count(*) filter (where membership_no is not null)         as with_membership,
    count(*) filter (where ownership is not null)             as with_ownership,
    count(*) filter (where public.member_completeness(members.*) = 100) as full_profiles,
    count(*) filter (where status = 'deceased')               as deceased
  from public.members
  where deleted_at is null;

create or replace view public.v_login_breakdown as
  select
    count(*) filter (where public.member_login_status(members.*) = 'enabled')      as enabled,
    count(*) filter (where public.member_login_status(members.*) = 'pending')      as pending,
    count(*) filter (where public.member_login_status(members.*) = 'not_invited')  as not_invited,
    count(*) filter (where public.member_login_status(members.*) = 'no_email')     as no_email,
    count(*) filter (where public.member_login_status(members.*) = 'disabled')     as disabled
  from public.members
  where deleted_at is null;
