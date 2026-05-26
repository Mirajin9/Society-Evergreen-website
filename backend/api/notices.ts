// backend/api/notices.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NoticeCategory, Visibility } from '../types/database';
import { requireAdmin } from '../lib/rbac';

export async function listNotices(
  supabase: SupabaseClient,
  params: { visibility?: Visibility; category?: NoticeCategory; limit?: number; pinned?: boolean } = {}
) {
  let q = supabase.from('notices').select('*').is('deleted_at', null)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString());
  if (params.visibility) q = q.eq('visibility', params.visibility);
  if (params.category)   q = q.eq('category', params.category);
  if (params.pinned)     q = q.eq('is_pinned', true);
  q = q.order('is_pinned', { ascending: false })
       .order('published_at', { ascending: false })
       .limit(params.limit ?? 50);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  category: NoticeCategory;
  visibility: Visibility;
  is_pinned?: boolean;
  publish?: boolean;          // false = save as draft
  expires_at?: string | null;
}

export async function createNotice(supabase: SupabaseClient, input: CreateNoticeInput) {
  const user = await requireAdmin(supabase);
  const { data: code } = await supabase.rpc('next_notice_code');
  const { data, error } = await supabase.from('notices').insert({
    code,
    title: input.title,
    body: input.body,
    category: input.category,
    visibility: input.visibility,
    is_pinned: input.is_pinned ?? false,
    published_at: input.publish === false ? null : new Date().toISOString(),
    published_by: user.id,
    expires_at: input.expires_at ?? null,
  }).select().single();
  if (error) throw error;
  if (input.publish !== false) {
    await supabase.rpc('log_activity', {
      p_action: 'notice.published',
      p_target_table: 'notices',
      p_target_id: data.id,
      p_target_label: data.title,
    });
  }
  return data;
}
