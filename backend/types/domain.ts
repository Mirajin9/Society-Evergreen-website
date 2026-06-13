// backend/types/domain.ts
// API-facing types — what your React components consume.
// These are richer than the raw DB rows: they include computed fields,
// joined data, and presentation-friendly shapes.

import type {
  MemberRow, UserRow, NoticeRow, EventRow, DocumentRow,
  ComplaintRow, ComplaintMessageRow, ActivityLogRow,
  LoginStatus, UserRole,
} from './database';

// What `GET /api/me` returns.
export interface MeResponse {
  user: UserRow;
  member: MemberRow;
  society_name: string;
  society_logo_url: string | null;
  unread_notices: number;
  open_complaints: number;
  next_event: EventSummary | null;
}

// A member row with computed fields, used in admin tables.
export interface MemberWithMeta extends MemberRow {
  login_status: LoginStatus;
  completeness_pct: number;            // 0..100
  missing_fields: string[];            // ["email", "phone", …]
  committee_role: string | null;       // joined from public.users
  last_login: string | null;           // joined from public.users.last_seen_at
}

// Compact event for dashboards / lists.
export interface EventSummary {
  id: string;
  code: string;
  title: string;
  category: EventRow['category'];
  starts_at: string;
  location: string | null;
  visibility: EventRow['visibility'];
  docs_count: number;
}

// Compact notice for dashboards.
export interface NoticeSummary {
  id: string;
  code: string;
  title: string;
  body: string;
  category: NoticeRow['category'];
  visibility: NoticeRow['visibility'];
  is_pinned: boolean;
  published_at: string;
}

// Document for the library view.
export interface DocumentWithLink extends DocumentRow {
  linked_event_title: string | null;
  uploader_name: string | null;
}

// Complaint + thread for the detail view.
export interface ComplaintDetail {
  complaint: ComplaintRow & {
    member_name: string;
    flat_no: number;
  };
  messages: ComplaintMessageRow[];
}

// What `GET /api/admin/stats` returns.
export interface AdminStats {
  members: {
    total: number;
    active: number;
    deceased: number;
    full_profiles: number;
    with_email: number;
    with_phone: number;
    with_membership: number;
    with_ownership: number;
  };
  logins: {
    enabled: number;
    pending: number;
    not_invited: number;
    no_email: number;
    disabled: number;
  };
  complaints: {
    open: number;
    in_progress: number;
    resolved_30d: number;
    avg_resolution_days: number;
  };
  upcoming_events: number;
  next_agm_at: string | null;
}

// What `GET /api/admin/data-completion` returns.
export interface DataCompletionReport {
  total: number;
  full_profiles: number;
  overall_pct: number;
  by_field: {
    key: 'email' | 'phone' | 'membership' | 'ownership';
    label: string;
    filled: number;
    missing: number;
  }[];
  members_missing: Array<{
    flat_no: number;
    member_id: string;
    name: string;
    membership_no: string | null;
    missing: string[];
    completeness_pct: number;
  }>;
}

// What `POST /api/admin/members/import` accepts.
export interface MemberImportRow {
  flat: number;                        // required, the key
  name?: string;
  membership?: string;
  email?: string;
  phone?: string;
  alternate_email?: string;
  alternate_phone?: string;
  father_spouse?: string;
  ownership?: 'owner' | 'tenant' | 'owner_joint' | 'vacant';
  vehicle?: string;
}

export interface MemberImportResult {
  total_rows: number;
  matched: number;                     // existing flats updated
  created: number;                     // new flats inserted
  skipped: number;                     // rows with no flat number
  errors: Array<{ row: number; message: string }>;
  fields_filled: Record<string, number>;
}

// Auth shapes
export interface InviteResult {
  member_id: string;
  email: string;
  invitation_sent: boolean;
  expires_at: string;
}
