// backend/api/me.ts
// Backs the Member Dashboard and Profile screen.

import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from '../lib/rbac';

export async function getMe(supabase: SupabaseClient) {
  const user = await requireUser(supabase);
  const { data: member } = await supabase.from('members').select('*').eq('id', user.member_id).single();
  const { data: society } = await supabase.from('society').select('name').eq('is_active', true).single();
  const [{ count: unread_notices }, { count: open_complaints }, { data: nextEv }] = await Promise.all([
    supabase.from('notices').select('id', { count: 'exact', head: true })
      .gte('published_at', new Date(Date.now() - 30 * 86400_000).toISOString()),
    supabase.from('complaints').select('id', { count: 'exact', head: true })
      .eq('created_by_member', user.member_id)
      .in('status', ['open', 'in_progress', 'awaiting_member']),
    supabase.from('events').select('*').gte('starts_at', new Date().toISOString())
      .order('starts_at').limit(1).maybeSingle(),
  ]);
  return {
    user,
    member,
    society_name: society?.name ?? 'Evergreen Apartment',
    unread_notices: unread_notices ?? 0,
    open_complaints: open_complaints ?? 0,
    next_event: nextEv?.data ?? nextEv ?? null,
  };
}

export async function getAdminStats(supabase: SupabaseClient) {
  const [{ data: dc }, { data: lb }, { count: open }, { count: inprog }, { count: resolved30 }, { count: upcoming }] = await Promise.all([
    supabase.from('v_data_completion').select('*').single(),
    supabase.from('v_login_breakdown').select('*').single(),
    supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('complaints').select('id', { count: 'exact', head: true })
      .eq('status', 'resolved').gte('resolved_at', new Date(Date.now() - 30 * 86400_000).toISOString()),
    supabase.from('events').select('id', { count: 'exact', head: true })
      .gte('starts_at', new Date().toISOString()),
  ]);
  const { data: nextAgm } = await supabase.from('events')
    .select('starts_at').eq('category', 'agm').gte('starts_at', new Date().toISOString())
    .order('starts_at').limit(1).maybeSingle();
  return {
    members: {
      total: dc?.total_members ?? 0,
      active: (dc?.total_members ?? 0) - (dc?.deceased ?? 0),
      deceased: dc?.deceased ?? 0,
      full_profiles: dc?.full_profiles ?? 0,
      with_email: dc?.with_email ?? 0,
      with_phone: dc?.with_phone ?? 0,
      with_membership: dc?.with_membership ?? 0,
      with_parking: dc?.with_parking ?? 0,
      with_ownership: dc?.with_ownership ?? 0,
    },
    logins: lb ?? { enabled: 0, pending: 0, not_invited: 0, no_email: 0, disabled: 0 },
    complaints: {
      open: open ?? 0,
      in_progress: inprog ?? 0,
      resolved_30d: resolved30 ?? 0,
      avg_resolution_days: 2.4, // TODO: real calc — needs window function
    },
    upcoming_events: upcoming ?? 0,
    next_agm_at: nextAgm?.starts_at ?? null,
  };
}
