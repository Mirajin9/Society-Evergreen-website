-- 01_enums.sql
-- Shared enum types used across tables. Run this first.
--
-- Conventions:
--   user_role:  Authorization tier
--   visibility: Who can read a notice/event/document
--   complaint_*: Lifecycle states for complaints
--   login_status: Derived state used by the Members admin table

create type user_role as enum (
  'member',       -- can see members-only content, edit own profile
  'committee',    -- + can see committee-only content, no admin powers
  'admin',        -- + can manage all data, send invites
  'superadmin'    -- + can delete records, promote/demote other admins
);

create type visibility as enum (
  'public',       -- visible to anyone on the public site
  'members',      -- requires login, visible to any member
  'committee',    -- requires login + committee/admin role
  'admin'         -- requires admin role (audit reports, parking map, etc.)
);

create type ownership_status as enum (
  'owner',
  'owner_joint',
  'tenant',
  'vacant',
  'disputed'
);

create type member_status as enum (
  'active',
  'inactive',
  'transferred',
  'deceased',
  'disputed'
);

create type login_status as enum (
  'enabled',          -- account exists, password set, can sign in
  'pending',          -- invite sent, awaiting first sign-in
  'not_invited',      -- has email on file but no invite sent yet
  'no_email',         -- cannot invite — no email available
  'disabled'          -- admin has revoked access
);

create type notice_category as enum (
  'agm', 'sgm', 'election', 'maintenance', 'payment',
  'compliance', 'notice', 'emergency', 'society_event'
);

create type event_category as enum (
  'agm', 'sgm', 'mc_meeting', 'election', 'maintenance',
  'payment_due', 'compliance', 'society_event', 'emergency'
);

create type document_category as enum (
  'agm', 'sgm', 'audit', 'annual_return', 'mc_resolution',
  'election', 'parking', 'compliance', 'form', 'maintenance',
  'bye_laws', 'calendar_attachment', 'member_document', 'other'
);

create type complaint_category as enum (
  'maintenance', 'security', 'parking', 'cleanliness',
  'noise', 'pets', 'other'
);

create type complaint_status as enum (
  'open',
  'in_progress',
  'awaiting_member',  -- needs reply from complainant
  'resolved',
  'closed'
);

create type complaint_priority as enum ('low', 'medium', 'high');

create type reminder_status as enum (
  'queued', 'sent', 'failed', 'cancelled'
);

create type activity_action as enum (
  -- Members
  'member.created', 'member.updated', 'member.deleted',
  'member.invited', 'member.activated', 'member.disabled',
  -- Documents
  'document.uploaded', 'document.updated', 'document.deleted',
  'document.visibility_changed', 'document.downloaded',
  -- Notices
  'notice.published', 'notice.updated', 'notice.pinned',
  -- Events
  'event.created', 'event.updated', 'event.cancelled',
  -- Complaints
  'complaint.created', 'complaint.replied',
  'complaint.assigned', 'complaint.status_changed',
  -- Reminders
  'reminder.scheduled', 'reminder.sent', 'reminder.failed',
  -- Auth
  'user.signed_in', 'user.signed_out', 'user.password_changed',
  -- System
  'system.import', 'system.backup'
);
