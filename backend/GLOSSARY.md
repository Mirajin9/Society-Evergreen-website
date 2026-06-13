# Glossary — Evergreen Portal

A single reference for every term used in code, schema, and conversations about the system. When in doubt, name new things using this vocabulary.

---

## People

**Member** — A row in `public.members`. Represents one flat (1–165). Has a name, may have email/phone, may have a login. *Synonyms (avoid)*: resident, owner, occupant.

**User** — A row in `public.users` linked 1:1 to a Supabase Auth account. A member becomes a user when they're successfully invited and complete signup. Some members will never have a user (no email).

**Visitor** — Anyone not signed in. Sees the public site only.

**Role** — A user's tier of permission. One of `member`, `committee`, `admin`, `superadmin`. Higher tiers always include lower-tier capabilities.

**Committee** / **MC** — Short for Managing Committee. The 7 elected representatives. Stored as users with `role = 'committee'` (and `committee_role` like "President").

**Admin** — Staff at the Society Office. Has read/write on everything except deleting records and managing other admins.

**Super admin** — Top-level access. Currently Saurabh Sharma (Flat 133). Can delete records, promote/demote admins.

---

## Permissions

**RLS** — Row-Level Security. Postgres policies that filter rows by `auth.uid()` and role. The database itself refuses to return rows the user shouldn't see, regardless of what the API or UI does.

**Visibility** — A column on `notices`, `events`, `documents` controlling which role can see the row. Values: `public`, `members`, `committee`, `admin`.

**Document access** — Per-document overrides in `document_access` table for cases where the basic visibility enum isn't enough (e.g. "only Flat 12 can see this").

**Self-update token** — A random one-time URL token sent to a member's email so they can fill in missing profile fields without needing to log in. Stored in `self_update_tokens`. Expires in 14 days.

---

## Data shapes

**Notice** — A formal communication published by the office. Has a category (AGM, Election, Maintenance, …) and a visibility. May be `pinned` so it stays on top of lists.

**Event** — A row on the society calendar. Has start/end times, category, visibility, optional location and recurrence rule (RFC-5545 RRULE).

**Document** — A file uploaded to Supabase Storage. The metadata lives in `public.documents`, the file itself in the `documents` bucket. May be linked to a specific event.

**Member document** — A private file belonging to one member (NOC, share certificate, ID proof). Lives in the `member-documents` bucket, scoped by member ID in the path.

**Complaint** — A maintenance/security/cleanliness issue raised by a member. Goes through statuses: `open → in_progress → resolved → closed` (or `awaiting_member` when admin needs info back).

**Reminder** — A scheduled email tied to an event or notice. The cron job picks up due rows from the `reminders` table and dispatches them.

**Activity entry** — Append-only audit log row in `activity_log`. Written by triggers AND by application code via `log_activity()`. Used for the Activity Logs admin screen and for RCS compliance audits.

**Meeting record** — A row in `public.meetings`. Represents an AGM, SGM, or MC meeting. Linked to its minutes document via `meeting_documents`.

---

## Data quality

**Completeness** — Percentage of the 4 required fields filled in for a member: email, phone, membership_no, ownership. 100% = "fully on file." Computed by `member_completeness(m)` in SQL and `memberCompleteness(m)` in TypeScript.

**Login status** — Derived from members + users state:
- `enabled`     — user account active, can sign in
- `pending`     — invite sent, not yet signed in
- `not_invited` — has email but no invite sent
- `no_email`    — cannot be invited yet
- `disabled`    — admin has revoked access (or member is deceased)

**Membership number** — The RCS-assigned member ID, distinct from our internal `members.id` (UUID) and `EA-NNNN` code. Some members don't have one yet — that's a known gap.

---

## System

**Stack** — Supabase (Postgres + Auth + Storage + Edge Functions) for backend, Next.js + Vercel for frontend, Resend for email. See `README.md` for cost details.

**Edge Function** — A Deno script running on Supabase's edge runtime. Used here only for the reminder cron job (`dispatch-reminders.ts`).

**Service role key** — The secret Supabase key that bypasses RLS. Used only inside server-side code (API routes, Edge Functions). NEVER ship to the browser.

**Anon key** — The public Supabase key that ships with the frontend. Subject to RLS at all times. Safe to expose.

**Storage bucket** — A namespace inside Supabase Storage. We have three: `documents` (society-wide library), `member-documents` (per-member private files), `public-assets` (logo, public images).

**Signed URL** — A short-lived URL (60s by default) that grants access to a stored file. Issued by API routes after verifying the user can read the file.

---

## Lifecycle

**Draft** — A notice or event with no `published_at` timestamp. Visible to admins only.

**Soft delete** — Setting `deleted_at` to a timestamp instead of actually deleting the row. RLS policies exclude soft-deleted rows from reads, so they vanish from UI without losing history.

**Cron schedule** — `*/5 * * * *` (every 5 minutes). The reminder dispatcher runs at this cadence.

**Self-update flow** — The path a member takes to fill in their own missing fields: admin issues token → email goes out → member clicks link → fills form → token marked used. No login required.

**Invitation flow** — The path a member takes to get a login: admin clicks "Send invite" → `auth.admin.inviteUserByEmail()` → email goes out → member clicks link → sets password → `auth.users` row activated → trigger writes `public.users` row → member can sign in.

---

## Things named consistently in code

| Concept | SQL column | TS field |
|---|---|---|
| Flat number | `flat_no` | `flat_no` |
| Member primary key | `id uuid` | `id: string` |
| Membership number | `membership_no` | `membership_no` |
| Email | `email` | `email` |
| Phone | `phone` | `phone` |
| Created date | `created_at timestamptz` | `created_at: string` (ISO) |
| Soft-deleted | `deleted_at timestamptz` | `deleted_at: string \| null` |
| Visibility | `visibility visibility` (enum) | `visibility: Visibility` |
| Whether a row is published | `published_at`, `is_published` | (same) |
| Foreign key to a person | `<entity>_user_id`, `<entity>_member_id` | (same) |

Use `member_id` (UUID) when persisting references in your code. Use `flat_no` only when accepting input (CSV imports) or displaying to humans.
