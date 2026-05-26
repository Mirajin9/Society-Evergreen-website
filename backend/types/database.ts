// backend/types/database.ts
// Postgres row shapes. These match the columns in backend/schema/02_tables.sql.
// In a real Next.js project, replace this hand-written file with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts

export type UserRole = 'member' | 'committee' | 'admin' | 'superadmin';
export type Visibility = 'public' | 'members' | 'committee' | 'admin';

export type OwnershipStatus =
  | 'owner' | 'owner_joint' | 'tenant' | 'vacant' | 'disputed';

export type MemberStatus =
  | 'active' | 'inactive' | 'transferred' | 'deceased' | 'disputed';

export type LoginStatus =
  | 'enabled' | 'pending' | 'not_invited' | 'no_email' | 'disabled';

export type NoticeCategory =
  | 'agm' | 'sgm' | 'election' | 'maintenance' | 'payment'
  | 'compliance' | 'notice' | 'emergency' | 'society_event';

export type EventCategory =
  | 'agm' | 'sgm' | 'mc_meeting' | 'election' | 'maintenance'
  | 'payment_due' | 'compliance' | 'society_event' | 'emergency';

export type DocumentCategory =
  | 'agm' | 'sgm' | 'audit' | 'annual_return' | 'mc_resolution'
  | 'election' | 'parking' | 'compliance' | 'form' | 'maintenance'
  | 'bye_laws' | 'calendar_attachment' | 'member_document' | 'other';

export type ComplaintCategory =
  | 'maintenance' | 'security' | 'parking' | 'cleanliness'
  | 'noise' | 'pets' | 'other';

export type ComplaintStatus =
  | 'open' | 'in_progress' | 'awaiting_member' | 'resolved' | 'closed';

export type ComplaintPriority = 'low' | 'medium' | 'high';
export type ReminderStatus = 'queued' | 'sent' | 'failed' | 'cancelled';

export type ActivityAction =
  | 'member.created'   | 'member.updated'   | 'member.deleted'
  | 'member.invited'   | 'member.activated' | 'member.disabled'
  | 'document.uploaded'| 'document.updated' | 'document.deleted'
  | 'document.visibility_changed' | 'document.downloaded'
  | 'notice.published' | 'notice.updated'   | 'notice.pinned'
  | 'event.created'    | 'event.updated'    | 'event.cancelled'
  | 'complaint.created'| 'complaint.replied'
  | 'complaint.assigned'           | 'complaint.status_changed'
  | 'reminder.scheduled'           | 'reminder.sent'  | 'reminder.failed'
  | 'user.signed_in'   | 'user.signed_out'  | 'user.password_changed'
  | 'system.import'    | 'system.backup';

// ─── Table row types ──────────────────────────────────────────────────────

export interface SocietyRow {
  id: string;
  name: string;
  registration_no: string | null;
  pan: string | null;
  address: string;
  email: string;
  phone: string | null;
  established_year: number | null;
  num_flats: number;
  num_floors: number;
  land_area: string | null;
  domain: string | null;
  is_active: boolean;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MemberRow {
  id: string;
  flat_no: number;
  membership_no: string | null;
  name: string;                       // raw, with honorific
  display_name: string;               // generated column — without honorific
  father_spouse_name: string | null;
  date_of_joining: string | null;
  email: string | null;
  alternate_email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  ownership: OwnershipStatus | null;
  status: MemberStatus;
  floor: number | null;
  has_co_owner: boolean;
  co_owner_name: string | null;
  parking_slot: string | null;
  vehicle_number: string | null;
  vehicle_make_model: string | null;
  rfid_tag: string | null;
  notes: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserRow {
  id: string;                         // matches auth.users.id
  member_id: string;
  role: UserRole;
  committee_role: string | null;
  committee_term: string | null;
  email: string;
  last_seen_at: string | null;
  notification_prefs: NotificationPrefs;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPrefs {
  agm_sgm: boolean;
  elections: boolean;
  maintenance: boolean;
  payments: boolean;
  mc_minutes: boolean;
  society_events: boolean;
  channel_email: boolean;
  channel_sms: boolean;
}

export interface NoticeRow {
  id: string;
  code: string;
  title: string;
  body: string;
  category: NoticeCategory;
  visibility: Visibility;
  is_pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  published_by: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EventRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: EventCategory;
  visibility: Visibility;
  starts_at: string;
  ends_at: string | null;
  is_all_day: boolean;
  location: string | null;
  rrule: string | null;
  recipients_filter: Record<string, unknown> | null;
  created_by: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DocumentRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  visibility: Visibility;
  storage_bucket: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  version: string | null;
  document_date: string | null;
  uploaded_by: string | null;
  linked_event_id: string | null;
  is_published: boolean;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ComplaintRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  created_by_member: string;
  assigned_to: string | null;
  assigned_to_user: string | null;
  resolved_at: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplaintMessageRow {
  id: string;
  complaint_id: string;
  author_user: string | null;
  author_display: string;
  is_admin: boolean;
  body: string;
  attachment_path: string | null;
  created_at: string;
}

export interface ReminderRow {
  id: string;
  event_id: string | null;
  notice_id: string | null;
  kind: string;
  recipients_filter: Record<string, unknown>;
  subject: string;
  body: string;
  dispatch_at: string;
  status: ReminderStatus;
  sent_count: number | null;
  failed_count: number | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface ActivityLogRow {
  id: string;
  actor_user: string | null;
  actor_display: string;
  action: ActivityAction;
  target_table: string | null;
  target_id: string | null;
  target_label: string | null;
  diff: Record<string, [unknown, unknown]> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
