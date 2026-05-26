# Backend — Evergreen Apartment Portal

This folder contains the **production backend** for the Evergreen Apartment portal: database schema, server-side logic, email templates, scheduled jobs, and the integration map that ties them to the prototype's UI.

The prototype in the project root (`index.html`, `*.jsx`) is a static React mockup. This `backend/` folder is what makes it real.

---

## 1. Stack — what runs where

| Layer | Service | Purpose |
|---|---|---|
| **Database** | Supabase Postgres | All data — members, events, documents, complaints, activity log |
| **Auth** | Supabase Auth | Email + password sign-in, magic-link invites, session tokens |
| **File storage** | Supabase Storage | PDFs (notices, audit reports, agm minutes, parking maps) |
| **Email** | Resend | Login invites, reminders, notices to members, complaint replies |
| **Cron / background** | Supabase Edge Functions (Deno) | Reminder dispatcher, daily compliance check |
| **Hosting (frontend)** | Vercel | Serves the Next.js app converted from the prototype |
| **Domain** | `evergreen-dwarka.in` | Buy from GoDaddy or Namecheap |
| **Optional analytics** | Vercel Analytics or Plausible | Page-view metrics — privacy-friendly |

This stack is chosen for: **a small society's budget** (free or near-free for ≤500 members), **Indian developer familiarity** (Postgres + React are mainstream), **AI-friendly** (Supabase and Next.js are extensively documented, so Claude/Cursor can extend the codebase easily), and **secure-by-default** (RLS at the database level means UI bugs can't accidentally leak data).

Estimated monthly cost at the society's scale:
- Supabase free tier: **₹0** (covers 500MB DB, 1GB storage, 50K monthly active users)
- Resend free tier: **₹0** (100 emails/day; AGM notice = 1 batch of 165 emails, fits comfortably)
- Vercel free tier: **₹0** (hobby projects with custom domain)
- Domain: **~₹800/year**

Upgrades only become necessary if the document library grows beyond 1GB or if you start sending many emails/day. Both have a clear path: Supabase Pro is $25/month, Resend Pro is $20/month.

---

## 2. Terminology — the vocabulary used in code

These terms appear consistently across the schema, types, and APIs. Internalize them once.

| Term | Definition |
|---|---|
| **Member** | A row in the `members` table — represents a flat's occupant. Identified by `flat_no` (1–165). Each member may or may not have a corresponding user login. |
| **User** | A Supabase Auth account. Created when a member is invited. One user belongs to one member; some members have no user (no email, never invited). |
| **Role** | A user's permission level: `member`, `committee`, `admin`, `superadmin`. Stored on the user record. Used for authorization. |
| **Profile completeness** | Of the 5 required fields (email, phone, membership_no, ownership, parking_slot), how many are filled. Computed live as `completeness_pct`. |
| **Notice** | A formal communication published by the office. Has a category (AGM / Election / Maintenance / Payment / Compliance / Notice) and visibility (`public`, `members`, `committee`). |
| **Event** | A row in the society calendar. Same categories + visibility as notices, plus a start/end time and optional location. |
| **Document** | A PDF or other file uploaded to Supabase Storage. Has a visibility row in `document_access` controlling who can download it. |
| **Reminder** | A scheduled email tied to an event or due date. Lives in the `reminders` table with `dispatch_at` and `status` columns; the reminder cron picks up rows where `status = 'queued'` and `dispatch_at <= now()`. |
| **Complaint** | A maintenance/security/parking issue raised by a member. Has a thread of `complaint_messages`. |
| **Activity entry** | A row in `activity_log`. Append-only audit trail of every meaningful action: notice published, member updated, login enabled, document uploaded. Used by the Activity Logs screen and for RCS compliance audits. |
| **Self-update token** | A one-time URL token sent to members so they can fill in their own missing fields without needing a login first. |

---

## 3. Folder structure

```
backend/
├── README.md                   ← this file
├── HOOKUP_GUIDE.md             ← prototype screen → API endpoint map
├── .env.example                ← required environment variables
├── package.json                ← npm dependencies
│
├── schema/                     ← SQL run against Supabase Postgres in order
│   ├── 01_enums.sql
│   ├── 02_tables.sql
│   ├── 03_indexes.sql
│   ├── 04_functions.sql
│   ├── 05_rls.sql
│   ├── 06_storage.sql
│   └── 07_seed.sql
│
├── types/                      ← TypeScript types
│   ├── database.ts             ← Postgres row shapes
│   └── domain.ts               ← API response shapes
│
├── lib/                        ← server-side helpers
│   ├── supabase-server.ts      ← server client w/ service role
│   ├── supabase-browser.ts     ← browser client w/ anon key
│   ├── rbac.ts                 ← role checks
│   └── completeness.ts         ← profile completeness calc
│
├── api/                        ← server actions / route handlers (Next.js App Router)
│   ├── members.ts
│   ├── documents.ts
│   ├── events.ts
│   ├── notices.ts
│   ├── complaints.ts
│   └── activity.ts
│
├── emails/                     ← email templates
│   ├── templates.ts
│   └── send.ts
│
├── jobs/                       ← Supabase Edge Functions (cron)
│   └── dispatch-reminders.ts
│
└── scripts/                    ← one-off scripts
    └── import-members.ts       ← seed 165 members from CSV
```

---

## 4. Data model (high level)

```
auth.users (Supabase Auth)
   ▲
   │ 1:1
   ▼
public.users  ← role, member_id link
   ▲
   │ N:1
   ▼
public.members  (165 rows — one per flat)
   │
   ├── public.member_documents      (per-member docs: NOC, ID proof, etc.)
   ├── public.complaints
   ├── public.complaint_messages
   └── public.parking_slots          (1:1 optional)

public.notices                       (society-wide notices)
public.events                        (calendar events)
public.documents                     (society-wide doc library)
public.document_access               (per-doc visibility — public/members/committee/admin/specific)

public.reminders                     (scheduled email queue)
public.activity_log                  (append-only audit trail)
public.self_update_tokens            (one-time URLs for incomplete profiles)
```

**The single source of truth is the `members` table.** Other tables reference it by `member_id` (UUID). The `flat_no` (1-165) is a stable secondary key — it's what CSV imports match on.

---

## 5. Hookup map — prototype → backend

This is the **most important integration document**. Each prototype screen → which API endpoints back it.

See [`HOOKUP_GUIDE.md`](./HOOKUP_GUIDE.md) for the full table.

Quick summary:

| Prototype screen | Backend endpoints |
|---|---|
| Public Home | `GET /api/notices?vis=public&limit=4`, `GET /api/events?vis=public&upcoming=1` |
| Public Notices | `GET /api/notices?vis=public` |
| Public Documents | `GET /api/documents?vis=public` |
| Login | Supabase Auth `signInWithPassword`, `signInWithOtp` |
| Member Dashboard | `GET /api/me`, `GET /api/notices?vis=members&limit=4`, `GET /api/events?vis=members&upcoming=1` |
| Member Calendar | `GET /api/events?month=YYYY-MM` |
| Member Documents | `GET /api/documents` (RLS filters by role automatically) |
| Member Profile | `GET /api/me`, `PATCH /api/me` |
| Complaints | `GET /api/complaints/mine`, `POST /api/complaints`, `POST /api/complaints/:id/reply` |
| Admin Dashboard | `GET /api/admin/stats`, `GET /api/admin/activity?limit=10` |
| Admin Members | `GET /api/admin/members?filter=…` |
| Edit Member modal | `PATCH /api/admin/members/:id`, `POST /api/admin/members/:id/invite` |
| Data Completion | `GET /api/admin/data-completion`, `POST /api/admin/members/import` |
| Calendar mgmt | `POST /api/admin/events`, `PATCH /api/admin/events/:id` |
| Documents mgmt | `POST /api/admin/documents/upload`, `PATCH /api/admin/documents/:id` |
| Activity Logs | `GET /api/admin/activity?…` |

---

## 6. Security model

Three layers, applied in order:

1. **Supabase Auth** — verifies the user is who they say they are.
2. **Row-Level Security (RLS)** — Postgres policies on every table that filter rows by `auth.uid()` and role. Defined in [`schema/05_rls.sql`](./schema/05_rls.sql).
3. **API layer** — additional input validation, rate limiting, audit log writes.

The crucial property: **RLS makes data leaks impossible from the UI side.** Even if a developer forgets a permission check in a route, the database itself won't return rows the user shouldn't see.

The four roles and what they can do:

| Capability | Member | Committee | Admin | Super Admin |
|---|:-:|:-:|:-:|:-:|
| Read public notices/events/docs | ✓ | ✓ | ✓ | ✓ |
| Read members-only notices/events/docs | ✓ | ✓ | ✓ | ✓ |
| Read own member record | ✓ | ✓ | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ | ✓ |
| Read all members' contact info |   | ✓ | ✓ | ✓ |
| Read committee-only docs |   | ✓ | ✓ | ✓ |
| Create/edit notices, events, docs |   |   | ✓ | ✓ |
| Edit any member, send invites |   |   | ✓ | ✓ |
| View activity log |   |   | ✓ | ✓ |
| Delete records, manage admins |   |   |   | ✓ |

Saurabh Sharma (Flat 133) is the first super admin per your direction.

---

## 7. Getting it running locally

Prerequisites: Node.js 20+, a Supabase account, a Resend account, the project cloned.

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create a Supabase project at supabase.com → Get connection details
# 3. Copy .env.example → .env.local and fill in the values

# 4. Run the SQL schema (in order)
psql $DATABASE_URL -f schema/01_enums.sql
psql $DATABASE_URL -f schema/02_tables.sql
psql $DATABASE_URL -f schema/03_indexes.sql
psql $DATABASE_URL -f schema/04_functions.sql
psql $DATABASE_URL -f schema/05_rls.sql
psql $DATABASE_URL -f schema/06_storage.sql
psql $DATABASE_URL -f schema/07_seed.sql
# Or paste them into the Supabase Studio SQL Editor in the same order.

# 5. Import the 165 members from the docx
npm run import:members
# This reads uploads/MEMBERS LIST.docx, parses it, and inserts into public.members.

# 6. Make yourself a super admin
# In Supabase Studio, run:
#   update public.users set role='superadmin' where email='your-email@example.com';

# 7. Deploy the reminder Edge Function
npx supabase functions deploy dispatch-reminders
```

The Next.js frontend (converted from the prototype) goes in `web/` or a sibling folder, deployed to Vercel separately. See `HOOKUP_GUIDE.md` for migration steps.

---

## 8. Deployment checklist

When you're ready to go live:

- [ ] Supabase project created on the **South Asia (Mumbai)** region for latency
- [ ] All seven SQL files run in order
- [ ] Storage buckets created (see `schema/06_storage.sql`)
- [ ] Resend account verified with `evergreen-dwarka.in` as the sender domain (set up SPF + DKIM)
- [ ] Members imported via the CSV script
- [ ] Super admin promoted in Supabase Studio
- [ ] Edge Function deployed and scheduled (cron: `*/5 * * * *`)
- [ ] Next.js app deployed to Vercel with environment variables set
- [ ] Custom domain wired in Vercel (CNAME + verify)
- [ ] Backup schedule confirmed (Supabase Pro does it automatically; on free tier, set up a weekly `pg_dump` to S3 or Google Drive)
- [ ] Privacy notice published at `/privacy` per IT Rules 2011 (no PII shared with third parties, members can request deletion)

---

## 9. Things explicitly out of scope for v1

To avoid scope creep — the following are **deliberately not** in the backend yet. Add them later if they prove necessary:

- Online maintenance fee payments (Razorpay integration) — until then, dues are tracked offline and the system just shows status
- SMS/WhatsApp notifications — email-only for v1
- Mobile app — the website is responsive
- Visitor management / gate-pass — separate concern, link out to existing system
- CCTV / IoT integration — separate concern
- Vendor management portal — could be added in v2
- Discussion forum / chat — keep it formal for v1
- Multi-language UI — English only, per your direction

---

Read [`HOOKUP_GUIDE.md`](./HOOKUP_GUIDE.md) next — it walks through each prototype screen and tells you exactly what to wire to make it real.
