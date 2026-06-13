-- 08_targeted_notices.sql
-- Run this after the original 01-07 files if the database already exists.
--
-- Targeted notices store selected flat numbers in notices.meta:
--   {"target_flat_nos": [12, 45, 133], "audience": "selected_flats"}
--
-- This policy keeps all-member notices visible to everyone logged in, but
-- selected-flat notices visible only to those flats and admins.

drop policy if exists notices_read on public.notices;

create policy notices_read on public.notices
  for select using (
    deleted_at is null
    and published_at is not null and published_at <= now()
    and (
      visibility = 'public'
      or (visibility = 'members' and auth.uid() is not null and (
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
      or (visibility = 'admin' and public.is_admin())
    )
  );
