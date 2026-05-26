// backend/api/events.ts
// Calendar events API.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventCategory, Visibility } from '../types/database';
import { requireAdmin } from '../lib/rbac';

// ─── List events ──────────────────────────────────────────────────────────
export interface ListEventsParams {
  // Either month (YYYY-MM) for the calendar grid OR upcoming=true for dashboards.
  month?: string;
  upcoming?: boolean;
  category?: EventCategory;
  visibility?: Visibility;
  limit?: number;
}

export async function listEvents(supabase: SupabaseClient, params: ListEventsParams = {}) {
  let q = supabase.from('events').select('*, document_count:documents(count)').is('deleted_at', null);
  if (params.month) {
    const start = `${params.month}-01T00:00:00Z`;
    const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1).toISOString();
    q = q.gte('starts_at', start).lt('starts_at', end);
  } else if (params.upcoming) {
    q = q.gte('starts_at', new Date().toISOString());
  }
  if (params.category) q = q.eq('category', params.category);
  if (params.visibility) q = q.eq('visibility', params.visibility);
  q = q.order('starts_at', { ascending: true }).limit(params.limit ?? 200);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ─── Create event (+ optionally queue reminders) ──────────────────────────
export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  visibility: Visibility;
  starts_at: string;
  ends_at?: string | null;
  is_all_day?: boolean;
  location?: string | null;
  document_ids?: string[];     // attach existing docs to this event
  reminders?: ReminderSpec[];  // e.g. [{ days_before: 7 }, { days_before: 1 }]
  recipients_filter?: Record<string, unknown> | null;
}

export interface ReminderSpec {
  days_before?: number;          // either days_before
  at?: string;                   // or absolute timestamp
  subject?: string;
  body?: string;
}

export async function createEvent(supabase: SupabaseClient, input: CreateEventInput) {
  const user = await requireAdmin(supabase);
  const { data: codeRes } = await supabase.rpc('next_event_code');
  const { data: event, error } = await supabase.from('events').insert({
    code: codeRes,
    title: input.title,
    description: input.description,
    category: input.category,
    visibility: input.visibility,
    starts_at: input.starts_at,
    ends_at: input.ends_at ?? null,
    is_all_day: input.is_all_day ?? false,
    location: input.location ?? null,
    created_by: user.id,
    recipients_filter: input.recipients_filter ?? { all: true },
  }).select().single();
  if (error) throw error;

  // Link docs
  if (input.document_ids?.length) {
    await supabase.from('documents').update({ linked_event_id: event.id })
      .in('id', input.document_ids);
  }

  // Queue reminders
  if (input.reminders?.length) {
    const reminders = input.reminders.map((r, idx) => {
      const dispatchAt = r.at
        ? new Date(r.at)
        : new Date(new Date(input.starts_at).getTime() - (r.days_before ?? 1) * 86400_000);
      return {
        event_id: event.id,
        kind: r.days_before ? `${event.category}-${r.days_before}d` : `${event.category}-custom-${idx}`,
        recipients_filter: input.recipients_filter ?? { all: true },
        subject: r.subject ?? `Reminder: ${input.title}`,
        body: r.body ?? `This is a reminder for ${input.title} scheduled at ${input.starts_at}.`,
        dispatch_at: dispatchAt.toISOString(),
      };
    });
    await supabase.from('reminders').insert(reminders);
  }

  await supabase.rpc('log_activity', {
    p_action: 'event.created',
    p_target_table: 'events',
    p_target_id: event.id,
    p_target_label: event.title,
  });
  return event;
}
