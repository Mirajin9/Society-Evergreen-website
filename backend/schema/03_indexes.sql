-- 03_indexes.sql
-- Performance indexes. Run after 02_tables.sql.

-- Members: most common queries are by flat, by missing-field filters, by status.
create index members_flat_no_idx on public.members(flat_no);
create index members_status_idx on public.members(status) where deleted_at is null;
create index members_email_idx on public.members(email) where email is not null;
create index members_membership_no_idx on public.members(membership_no) where membership_no is not null;
create index members_floor_idx on public.members(floor);

-- Notices: chronological by published_at, often filtered by visibility.
create index notices_published_at_idx on public.notices(published_at desc) where deleted_at is null;
create index notices_visibility_idx on public.notices(visibility, published_at desc);
create index notices_category_idx on public.notices(category, published_at desc);
create index notices_pinned_idx on public.notices(is_pinned, published_at desc) where is_pinned = true;

-- Events: queried by month range + visibility.
create index events_starts_at_idx on public.events(starts_at) where deleted_at is null;
create index events_starts_at_visibility_idx on public.events(visibility, starts_at);
create index events_category_idx on public.events(category, starts_at);

-- Documents: most queries are by category + visibility, sorted by document_date.
create index documents_doc_date_idx on public.documents(document_date desc) where deleted_at is null;
create index documents_category_idx on public.documents(category, document_date desc);
create index documents_visibility_idx on public.documents(visibility, document_date desc);
create index documents_linked_event_idx on public.documents(linked_event_id) where linked_event_id is not null;

create index share_certificate_rows_upload_idx on public.share_certificate_rows(upload_id, row_no);
create index share_certificate_rows_flat_idx on public.share_certificate_rows(flat_no) where flat_no is not null;

-- Complaints: by member (for "my complaints"), by status (for admin queues), by date.
create index complaints_member_idx on public.complaints(created_by_member, created_at desc);
create index complaints_status_idx on public.complaints(status, created_at desc);
create index complaints_priority_idx on public.complaints(priority) where status not in ('resolved', 'closed');

create index complaint_messages_thread_idx on public.complaint_messages(complaint_id, created_at);

-- Reminders: the cron job hits this constantly.
create index reminders_due_idx on public.reminders(dispatch_at) where status = 'queued';
create index reminders_event_idx on public.reminders(event_id);

create index sms_messages_status_idx on public.sms_messages(status, queued_at);
create index sms_messages_member_idx on public.sms_messages(member_id, queued_at desc) where member_id is not null;
create index otp_challenges_mobile_idx on public.otp_challenges(mobile, expires_at desc);

-- Activity log: 90% of queries are the latest N items.
create index activity_log_created_at_idx on public.activity_log(created_at desc);
create index activity_log_target_idx on public.activity_log(target_table, target_id);
create index activity_log_actor_idx on public.activity_log(actor_user, created_at desc);

-- Users: lookups by member, by role.
create index users_member_id_idx on public.users(member_id);
create index users_role_idx on public.users(role);
