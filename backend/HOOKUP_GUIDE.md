# Hookup Guide — Prototype to Backend

For each screen in the prototype, this guide lists:
- The **data it shows** (and where that data lives in the database)
- The **API endpoints** to call
- The **events the user can trigger** and what those should call

When converting the prototype to a real Next.js + Supabase app, work through this guide screen-by-screen. By the end every interaction in the UI has a corresponding backend call.

---

## Conventions

- **Endpoints** are Next.js Route Handlers under `app/api/…` calling functions from `backend/api/`.
- **Auth**: every authenticated endpoint expects `Authorization: Bearer <access_token>` (handled automatically by `supabaseBrowser()` from the frontend).
- **Errors**: 401 = not logged in, 403 = wrong role, 404 = not found, 422 = validation.
- **Pagination**: list endpoints accept `?limit=N&offset=N`. Default limit 100.
- **Real-time** (optional): Supabase channels can push live updates for `notices`, `events`, and `complaint_messages` — wire after the basic flows work.

---

## Public-facing screens (no auth required)

### `public/home`
- **Shows**: hero text from `society` row · 4 latest public notices · 4 upcoming public events · 6 public documents
- **API**: 
  - `GET /api/society` → `{ name, established_year, num_flats, num_floors, land_area, registration_no }`
  - `GET /api/notices?visibility=public&limit=4`
  - `GET /api/events?upcoming=1&visibility=public&limit=4`
  - `GET /api/documents?visibility=public&limit=6`

### `public/notices`
- **Shows**: full list of public notices, filterable by category
- **API**: `GET /api/notices?visibility=public[&category=…]`

### `public/committee`
- **Shows**: roster of MC members + roles
- **API**: `GET /api/committee` — backed by `users` where `role='committee'` JOIN `members`

### `public/documents`
- **Shows**: all public + member documents (member-only rows show as locked)
- **API**: `GET /api/documents` (RLS auto-filters)
- **Lock state**: render a row as locked if `visibility !== 'public'` and `auth.uid()` is null

### `public/calendar`
- **Shows**: month calendar with public events only
- **API**: `GET /api/events?month=YYYY-MM&visibility=public`

### `public/contact`
- **Shows**: society address, office hours, grievance officer
- **Form submit**: `POST /api/public/enquiry` → inserts into a `public_enquiries` table (not yet defined — add when needed)

### `public/login`
- **Sign in**: `supabase.auth.signInWithPassword({ email, password })` via the browser SDK
- **Forgot password**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '…/reset' })`
- **First-time setup**: redirect user to `/set-password` after invite link → calls `supabase.auth.updateUser({ password })`

---

## Member portal (auth required)

### `member/dashboard`
- **Shows**: greeting · KPIs (open complaints, unread notices, next event, maintenance dues) · upcoming events · recent notices · recent documents · "your details" sidecar
- **API**: 
  - `GET /api/me` → `{ user, member, society_name, unread_notices, open_complaints, next_event }`
  - `GET /api/notices?visibility=members&limit=4`
  - `GET /api/events?upcoming=1&limit=5`
  - `GET /api/documents?limit=4`

### `member/calendar`
- **Shows**: full month grid · sidebar list · event detail modal with attached docs
- **API**: 
  - `GET /api/events?month=YYYY-MM` → returns all events visible to current user (RLS handles it)
  - When opening an event: `GET /api/events/:id/documents` to fetch attached docs

### `member/notices`
- **Shows**: all notices the member can see (includes members-only)
- **API**: `GET /api/notices` (RLS filters)

### `member/documents`
- **Shows**: full document library scoped to the member's access
- **API**: `GET /api/documents`
- **Download click**: `POST /api/documents/:id/download` → returns short-lived signed URL via `getDownloadUrl()`

### `member/meetings`
- **Shows**: AGM/SGM/MC meeting records with attached docs
- **API**: `GET /api/meetings`

### `member/profile`
- **Shows**: 4 tabs (Profile, Account, Notifications, Parking)
- **Reads**: `GET /api/me`
- **Profile tab "Request profile update" → opens modal**:
  - For fields in `SELF_EDITABLE` (phone, alt phone, vehicle): `PATCH /api/me` with the changes — applied immediately
  - For other fields (email, name, ownership): `POST /api/profile/change-request` — creates a row in `profile_change_requests` table (to be added) for admin approval
- **Account tab → Change password**: `supabase.auth.updateUser({ password })` via browser SDK
- **Account tab → Change email**: `supabase.auth.updateUser({ email })`; user receives confirmation link
- **Notifications tab → toggle**: `PATCH /api/me` with new `notification_prefs` payload
- **Parking tab → request slot change**: opens complaint with category=`parking`

### `member/complaints`
- **Shows**: KPIs · table of my complaints · selected complaint thread
- **API**: 
  - `GET /api/complaints/mine`
  - `GET /api/complaints/:id` → `{ complaint, messages }`
- **"New complaint" modal → submit**: `POST /api/complaints` → returns the new complaint
- **"Post reply" in thread**: `POST /api/complaints/:id/reply`

### `member/settings`
- Most rows are display-only for now
- **API**: `PATCH /api/me` with field updates (timezone, language pref)

---

## Admin console (role: admin or superadmin)

### `admin/dashboard`
- **Shows**: KPIs (active members, logins, AGM countdown) · Data Quality banner · RCS compliance checklist · Reminder queue · Login setup · Recent activity · Open complaints
- **API**:
  - `GET /api/admin/stats` → `AdminStats`
  - `GET /api/admin/data-completion` → `DataCompletionReport`
  - `GET /api/admin/reminders?status=queued`
  - `GET /api/admin/activity?limit=7`
  - `GET /api/admin/complaints?status=open&limit=4`
- **"Complete member data" CTA → navigates to `admin/data`**
- **"New event" CTA → navigates to `admin/calendar`** (opens modal)

### `admin/data` (Data Completion)
- **Shows**: ring chart (overall %) · per-field stats · 3 workflow cards · table of members missing field X
- **API**: 
  - `GET /api/admin/data-completion[?field=email]`
- **"Import update sheet" → uploads file**: parse CSV/XLSX client-side (papaparse) → preview → confirm → `POST /api/admin/members/import` with `MemberImportRow[]`
- **"Compose invite" → opens modal → confirm**: `POST /api/admin/members/self-update-invites` with optional filter — backend iterates eligible members (with email, incomplete profile), creates self-update tokens, sends emails via `selfUpdateInvitation` template
- **"Fill in" / inline row edit → opens EditMemberModal**: `PATCH /api/admin/members/:id`

### `admin/members`
- **Shows**: filterable + searchable table of 165 members with completeness bars
- **API**: 
  - `GET /api/admin/members?filter=…&search=…`
- **Edit pencil → modal**: `PATCH /api/admin/members/:id`
- **"Send invite" button (inside modal, only shown if email exists)**: `POST /api/admin/members/:id/invite` → uses `sendLoginInvite()`
- **"Reset password"**: `POST /api/admin/members/:id/reset-password`
- **"Disable login"**: `PATCH /api/admin/users/:id { is_active: false }`
- **"Import CSV" modal**: same as Data Completion → `POST /api/admin/members/import`
- **"Export"**: `GET /api/admin/members/export.csv` → streams CSV

### `admin/calendar`
- **Shows**: calendar grid + events feed table
- **API**: 
  - `GET /api/admin/events`
- **"New event" modal → submit**: `POST /api/admin/events` (uses `createEvent()`) — includes linking documents and queuing reminders in one call
- **Edit pencil**: `PATCH /api/admin/events/:id`
- **Cancel event**: `DELETE /api/admin/events/:id` (soft delete)

### `admin/documents`
- **Shows**: KPI cards · filterable table of all documents
- **API**: 
  - `GET /api/admin/documents`
- **"Upload document" modal → submit**:
  1. `POST /api/admin/documents/upload-init` with metadata → returns presigned URL
  2. Frontend `PUT`s file to the signed URL
  3. `POST /api/admin/documents/:id/finalize` to publish
- **Edit pencil**: `PATCH /api/admin/documents/:id`
- **Visibility change**: `PATCH /api/admin/documents/:id/visibility`

### `admin/notices`
- **Shows**: list of all notices
- **API**: `GET /api/admin/notices`
- **"Compose notice" modal → submit**: `POST /api/admin/notices` (uses `createNotice()`)
- **Pin toggle**: `PATCH /api/admin/notices/:id { is_pinned }`

### `admin/complaints`
- **Shows**: KPIs · filterable table
- **API**: 
  - `GET /api/admin/complaints?status=…`
- **Assign / change status / change priority**: `PATCH /api/admin/complaints/:id`
- **Reply as admin**: `POST /api/complaints/:id/reply?as=admin`

### `admin/activity`
- **Shows**: filterable list of activity log entries
- **API**: `GET /api/admin/activity?actor=…&action_kind=…&since_days=…`

### `admin/parking`
- **Shows**: KPI cards · table of allocated slots
- **API**: 
  - `GET /api/admin/parking-allocations`
- **Edit pencil → modal**: `PATCH /api/admin/parking-slots/:slot_no { allocated_to_member_id, vehicle_number, … }`
- **Waitlist add**: `POST /api/admin/parking-waitlist`

### `admin/committee`
- **Shows**: current MC roster
- **API**: 
  - `GET /api/committee`
- **"Edit roster" → modal**: bulk-promote/demote users — `PATCH /api/admin/users` with `[{ id, role, committee_role }]`
- **Election records**: stretch goal — separate page that lists past MC compositions by term

---

## Wiring order — recommended sequence

Don't try to wire everything at once. Do it in this order:

1. **Auth + Me** — get the user signed in, fetch their profile, render their name on the Dashboard. This unblocks every other screen.
2. **Members list (admin)** — read-only first, then enable editing one column at a time (start with phone — simplest).
3. **Invitations** — once members are editable, wire `sendLoginInvite()` so the Edit Member modal can issue invites end-to-end.
4. **Documents — read** — make the document library load real rows. Don't wire upload yet.
5. **Documents — upload** — finally wire the two-step upload flow.
6. **Events** — calendar grid, then event creation.
7. **Notices** — list, then composition.
8. **Complaints** — member submission, then admin reply.
9. **Reminders** — wire the cron job last; everything works without it, it just adds the automated emails.
10. **Activity log** — passive on most actions (triggers handle it automatically); only the Activity screen needs work.

Each step is a self-contained PR/commit that ships value. The site is usable after step 2.

---

## Migration cheat sheet — prototype → Next.js

The prototype files in the project root map to Next.js components like this:

| Prototype file | Becomes |
|---|---|
| `index.html` | `app/layout.tsx` (HTML skeleton) + `app/page.tsx` (router) |
| `styles.css` | `app/globals.css` |
| `data.jsx` | **DELETED** — replaced with API calls |
| `components.jsx` | `components/*.tsx` (Logo, Sidebar, Topbar, etc., split per file) |
| `public.jsx` | `app/(public)/*/page.tsx` route group |
| `member.jsx` | `app/(portal)/member/*/page.tsx` route group |
| `admin.jsx` | `app/(portal)/admin/*/page.tsx` route group |
| `app.jsx` | `middleware.ts` + route groups (auth gating) |
| `tweaks-panel.jsx` | **DELETED** — was a prototype-only dev tool |

The actual React component code is mostly reusable: change `useState` data to `useQuery` calls (TanStack Query is recommended), keep the JSX, remove the `tweaks` glue.
