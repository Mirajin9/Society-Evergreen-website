# Evergreen Apartment — Society Portal

A high-fidelity, **clickable** prototype of the proposed compliance website + member portal + admin panel for **Evergreen Apartment CGHS Ltd.**, Plot 9, Sector 7, Dwarka, New Delhi.

It is currently a **static HTML prototype** — all data is in JavaScript, nothing is saved to a real database. The next step (described below) is to wire it to a real backend.

---

## 1. How to download and run locally

The whole project is plain files. To get it onto your computer:

1. From the file tree on the left, right-click the project root and choose **Download as ZIP** (or use the download icon at the top). You'll get a folder with all the `.html`, `.jsx`, `.css` files.
2. Extract the ZIP somewhere convenient (e.g. `~/evergreen-portal`).
3. To open it: just double-click `index.html` — it runs in any modern browser (Chrome, Safari, Firefox, Edge). No build step needed for this version.
4. To edit it: open the folder in **VS Code** (free, [code.visualstudio.com](https://code.visualstudio.com)) or any code editor. Save the file, reload the browser tab.

### Putting it on GitHub (recommended)

1. Install **git** if you don't have it, then in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial prototype from Claude"
   ```
2. Create an empty repository on GitHub (don't tick "add README").
3. Follow the instructions GitHub shows you — usually:
   ```bash
   git remote add origin https://github.com/<your-username>/evergreen-portal.git
   git push -u origin main
   ```

Now your repo is online. Any future developer (or yourself with Claude / Cursor) can clone and continue.

---

## 2. What's coded right now

### File layout

```
index.html                ← the shell that loads everything
styles.css                ← all visual styles & design tokens
tweaks-panel.jsx          ← the bottom-right Tweaks panel (preview as Visitor/Member/MC/Admin)

data.jsx                  ← ALL DATA: 165 members, society constants, notices,
                            events, documents, complaints, activity log
components.jsx            ← shared building blocks: Logo, Sidebar, Topbar,
                            Modal, KPI card, badges, calendar grid, icons
public.jsx                ← Public-facing pages (Home, Notices, Committee,
                            Documents, Calendar, Contact, Login)
member.jsx                ← Logged-in member pages (Dashboard, Calendar,
                            Documents, Profile, Notices, Meetings,
                            Complaints, Settings)
admin.jsx                 ← Society Office admin pages (Dashboard, Members,
                            Data Completion, Calendar mgmt, Documents mgmt,
                            Notices, Complaints, Activity Logs, Parking,
                            Committee)
app.jsx                   ← Router + role switching
uploads/MEMBERS LIST.docx ← the original member list (kept for reference)
```

### Pages that work end-to-end as a clickable demo

**Public site** — Home, Notices & Circulars, Management Committee, Public Documents library, Calendar preview, Contact form (form posts a fake confirmation), Login.

**Member portal** — Dashboard with KPIs and upcoming events, full month Calendar with event modal + attached documents, My Documents library with category filters, Profile with 4 tabs (Profile / Login & email / Notifications / Parking), Notices, Meeting Records, Complaints (full thread + new complaint modal), Settings.

**Admin console** — Society overview with RCS compliance checklist, reminder queue, login-setup progress bar; the new **Data Completion** module; Member Management table with filters/search/edit modal; CSV import modal; Calendar Management with full event-creation modal (categories, visibility, doc attachments, reminders); Document Management with upload modal; Notices admin; Complaints admin; Activity Logs; Parking; Committee.

### What's interactive (real React state)

- Switching roles via the Tweaks panel actually rebuilds the navigation and the screens
- Card style toggle (flat / bordered / soft) re-styles every card live
- All filters, chips, search inputs, modals open and close
- Calendar month nav works; clicking an event opens the detail modal
- The Login screen has three shortcut buttons (Sign in as Member / MC / Admin) so you can preview each layer without typing

### What's **not** wired up (stubs / mock data)

- The form submit buttons (login, raise complaint, upload document, send invite, new event…) **don't save anything**. They just close the modal.
- Uploaded files / CSVs are not actually processed.
- Emails are not actually sent.
- The 165 members live in `data.jsx`. Edits made in the prototype reset on reload.
- Search is UI-only.
- "Public Documents" links don't open real PDFs — the placeholders are just visual.

---

## 3. How the member system works (the design intent)

This is the **architecture** you'll implement in the real backend. The prototype shows you exactly how it should behave.

### Data model

Each member record (`MEMBERS` array in `data.jsx`) has these fields:

| Field            | Source                              | Notes |
|------------------|-------------------------------------|-------|
| `id`             | Auto-generated `EA-{flat}`          | Stable handle |
| `flat`           | From your imported docx             | Primary key |
| `membership`     | RCS membership number               | 142 of 165 known, 23 missing |
| `name`           | Cleaned from docx                   | Honorifics (MR./SMT./LATE) preserved |
| `email`          | **Missing for most** — fill in      | Required for login |
| `phone`          | **Missing for many** — fill in      | Used for reminders |
| `alternatePhone` | Optional                            | |
| `parking`        | Slot number `P-001`…`P-165`         | ~78% on file in the mock |
| `vehicleNumber`  | Optional                            | |
| `ownership`      | Owner / Tenant / Joint / Vacant     | |
| `status`         | Active / Deceased / Disputed        | |
| `floor`          | Derived from flat number            | G/1/2/3 |
| `login`          | Enabled / Pending / Not invited / No email / Disabled | |
| `lastLogin`      | Computed                            | |
| `committee`      | Role name if MC member, else `null` | President / VP / Secretary / Treasurer / Member |

### The data completion flow

This is the key insight: **you don't need everyone's data on day one.** The system is designed to ingest what you have, then incrementally fill in the rest:

1. **Initial import** — you upload the docx (or a CSV) once. Every flat gets a row with at least `flat + name + membership`. Email/phone/parking are empty.
2. **Admin Dashboard → Data Quality banner** shows you the gap — e.g. "97 members have no email on file."
3. **Data Completion module** has three workflows:
   - **Import update sheet** — admin gets an Excel file from any source (your secretary's notebook, an RWA WhatsApp survey, etc), uploads it. System matches by `flat` and fills in blank fields without overwriting existing ones.
   - **Self-service invite** — for the members who *do* have an email, the system emails a one-time link. They land on a form, fill in their own missing fields, the record updates.
   - **Inline edit** — for stragglers (no email, won't respond), the admin opens the row and types in what they know.
4. Each member has a **completeness %** computed live (5 required fields). A member becomes "fully on file" when all 5 are present.
5. **Login is gated on email** — the system refuses to send a login invite to a member without an email. The Edit Member modal only shows the "Send invite" button after an email is filled in. This is the security guard.

### Role-based access (what the prototype enforces)

| Role         | Sees                                                                                     |
|--------------|------------------------------------------------------------------------------------------|
| **Visitor**  | Public Home, Notices marked public, Committee, public Documents, public Calendar events, Login |
| **Member**   | All of the above + Member Dashboard, member-only documents, member-only calendar events, their own profile only, their own complaints |
| **MC**       | Same as Member + extra committee badge / committee-only docs (in real backend)           |
| **Admin**    | Full admin panel — member management, calendar management, all documents, all complaints, activity logs, data completion |
| **Super admin** (Saurabh Sharma, Flat 133) | Same as Admin + ability to delete files and manage other admins (UI bones in place) |

Per your earlier choices:
- **Member directory is admin/MC only** — members cannot see other members' contact details.
- **Audit reports and MC resolutions default to members-only** — public visitors see them as locked rows.
- **Calendar is mostly members-only** — only Society Events (Independence Day, etc.) are tagged public by default.
- **Email is the only contact channel for v1.** SMS/WhatsApp can be added later.

---

## 4. What you can do right now in the prototype

Use the **Tweaks panel (bottom-right corner)** to switch between roles:

- **Visitor** → see the public website
- **Member** → see Saurabh Sharma's view (Flat 133)
- **Managing Committee** → see Saurabh with extra committee badges
- **Admin (Society Office)** → see the admin panel including Data Completion

The card-style toggle (flat / bordered / soft) lets you preview different visual densities — useful to pick a final direction.

You can also use the **Sign in as Member/MC/Admin** shortcut buttons on the login screen to switch roles.

---

## 4b. Backend — ready to deploy

The complete backend scaffold lives in [`backend/`](./backend/). Start with [`backend/README.md`](./backend/README.md) for the architecture and [`backend/HOOKUP_GUIDE.md`](./backend/HOOKUP_GUIDE.md) for the screen-by-screen integration map.

Quick summary of what's in there:

- **`backend/schema/`** — Seven SQL files run in order to set up the Supabase Postgres database: enums, tables, indexes, functions/triggers, Row-Level Security policies, storage buckets, and seed data.
- **`backend/types/`** — TypeScript types matching every database row + API response.
- **`backend/lib/`** — Supabase client setup (server + browser), RBAC helpers, completeness calculator.
- **`backend/api/`** — Framework-agnostic server functions: members (list/edit/invite/import), documents (upload/download), events, notices, complaints, activity, me.
- **`backend/emails/`** — Email templates (invitations, reminders, broadcasts) and a Resend wrapper.
- **`backend/jobs/dispatch-reminders.ts`** — Supabase Edge Function that runs every 5 minutes, dispatching scheduled emails.
- **`backend/scripts/import-members.ts`** — One-shot importer for the 165 members from `MEMBERS LIST.docx`. Idempotent.
- **`backend/.env.example`** — Every environment variable you need.
- **`backend/GLOSSARY.md`** — Vocabulary used across the codebase, in one place.

---

## 5. What does NOT work yet (and why)

This is a **front-end prototype with mock data**. The following all look real but are not connected to anything:

- **Real authentication** — currently the "Sign in" buttons just switch roles in memory. No password is actually checked, no session token is issued.
- **Saving data** — edits to a member (e.g. filling in an email) close the modal but don't persist. Refresh the page and the change is gone.
- **File uploads** — drop zones open file pickers but don't upload anywhere.
- **Email sending** — the "Send invite" / "Send reminders" buttons don't email anyone.
- **CSV import** — the modal looks like it'd work but doesn't actually parse and merge a file.
- **Search** — the search inputs don't filter results.
- **PDF viewing/downloading** — Download buttons don't download real files.
- **Calendar reminders firing on schedule** — no background job runs.
- **Activity log** — what you see is fake history, not a real audit trail.

**Why** — building a real backend means servers, a database, authentication, email service, file storage, and 4–8 weeks of development. The prototype's job is to lock the design so that's a smooth, scoped project rather than guesswork.

---

## 6. Turning this into a real, live website

When you're ready to make it live, you (or a developer) will:

### Architecture

```
                ┌────────────────┐
                │   Vercel       │  Next.js — hosts the website,
                │   (hosting)    │  serves pages, handles routing
                └────────┬───────┘
                         │
                ┌────────▼───────┐
                │   Supabase     │  Postgres database + Auth +
                │   (backend)    │  File storage + Row-level security
                └────────┬───────┘
                         │
                ┌────────▼───────┐
                │   Resend       │  Sends login invites, reminders,
                │   (email)      │  notice notifications
                └────────────────┘
```

### Build order (matches your original plan)

1. **Convert prototype to Next.js** — replace the inline Babel scripts with proper React components in a Next.js project. The screens are already designed; this is mostly file reorganization.
2. **Set up Supabase** — create the database tables described in your plan (`users`, `members`, `calendar_events`, `documents`, `document_access`, `reminders`, `notices`, `meetings`, `complaints`, `activity_logs`).
3. **Configure Supabase Auth** — email + password, with magic-link invitations for new members.
4. **Add Row-Level Security policies** — these are the rules in the database that enforce "members only see their own data," "audit reports require login," etc. Without these, anyone could query anything.
5. **Wire the storage bucket** — uploaded PDFs go into Supabase Storage with the same access rules.
6. **Wire the forms** — replace every `onClick={() => setShow(false)}` with a real database call.
7. **Cron job for reminders** — Supabase has Edge Functions that can run on a schedule. They check the `reminders` table every minute and send pending emails via Resend.
8. **Buy and connect a domain** — `evergreen-dwarka.in` (your preference). Vercel makes this 2 clicks.

### Estimated effort

- A solo developer comfortable with Next.js + Supabase: **4–6 weeks** for a full v1.
- A two-person team: **2–4 weeks**.
- AI-assisted (Cursor / Claude Code): meaningfully faster — much of the boring wiring can be generated from the prototype.

---

## 7. Getting unblocked

When usage runs out, you can keep going by:

1. **Downloading the project ZIP** and opening it in VS Code locally (totally free).
2. **Continuing with Cursor or Claude Code** — paid AI coding tools that work on your local files. Point them at this repo with the instruction *"Continue building the Evergreen Apartment portal. Phase 1: convert this prototype to Next.js + Supabase. Reference the README."*
3. **Hiring a developer** — share this repo, share your original plan document, and they'll have an unusually clear brief. Most society websites get built from a 1-page Word doc; you have a full clickable prototype + data model.

---

## 8. Things to decide before going live

These are decisions you'll need to make once before development starts:

- **Domain name** — buy `evergreen-dwarka.in` (GoDaddy or Namecheap, ~₹800/year).
- **Email sender** — sign up for Resend or SendGrid (free tier covers 100/day, paid is ~$20/month).
- **Supabase plan** — free tier is enough for 165 members and a few GB of documents; paid is $25/month if you grow.
- **Initial admin users** — three people from MC who'll have admin access on day one (you've named Saurabh as super admin).
- **Initial data drop** — the docx is in `uploads/`. Adding emails for the first 20–30 members (committee + active residents) gets the system usable for everyone else.

---

## 9. Quick FAQ

**Can I edit text on the prototype to show another society member or committee?**
Yes — open `data.jsx` in any code editor. The `SOCIETY`, `COMMITTEE`, and `MEMBERS` constants at the top are plain JavaScript. Change a value, save, reload.

**Can I show this to MC members on a phone?**
Yes — it's mobile-responsive (cards stack at narrow widths). Just double-click `index.html`; for sharing with others, host the folder on Netlify (drag & drop the folder, get a URL) or GitHub Pages.

**Where are the 165 members' details kept?**
In `data.jsx`, the `MEMBERS` array — line ~28 onwards. Each member is one line of JavaScript. The original docx is preserved in `uploads/MEMBERS LIST.docx`.

**Can someone else continue from where Claude left off?**
Yes. The code is in normal React + JSX, with comments. Any front-end developer or any AI coding assistant can pick it up.

---

*Generated 25 May 2026 · Evergreen Apartment Cooperative Group Housing Society Ltd.*
