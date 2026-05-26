// backend/api/activity.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '../lib/rbac';
import type { ActivityAction } from '../types/database';

export interface ListActivityParams {
  actor?: 'all' | 'admins' | 'system' | 'members';
  action_kind?: 'all' | 'document' | 'member' | 'notice' | 'reminder';
  since_days?: number;             // 7 | 30 | 90 | 365
  limit?: number;
}

export async function listActivity(supabase: SupabaseClient, params: ListActivityParams = {}) {
  await requireAdmin(supabase);
  let q = supabase.from('activity_log').select('*').order('created_at', { ascending: false });
  if (params.action_kind && params.action_kind !== 'all') {
    q = q.like('action', `${params.action_kind}.%`);
  }
  if (params.since_days) {
    q = q.gte('created_at', new Date(Date.now() - params.since_days * 86400_000).toISOString());
  }
  q = q.limit(params.limit ?? 100);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}
