// backend/api/complaints.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types/database';
import { requireUser, requireAdmin } from '../lib/rbac';

// List MY complaints (member view)
export async function listMyComplaints(supabase: SupabaseClient) {
  const user = await requireUser(supabase);
  const { data, error } = await supabase.from('complaints')
    .select('*, latest:complaint_messages(*)')
    .eq('created_by_member', user.member_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Admin: list all complaints
export async function listComplaints(
  supabase: SupabaseClient,
  params: { status?: ComplaintStatus; limit?: number } = {}
) {
  await requireAdmin(supabase);
  let q = supabase.from('complaints')
    .select('*, member:members(name, flat_no)')
    .order('created_at', { ascending: false });
  if (params.status) q = q.eq('status', params.status);
  q = q.limit(params.limit ?? 100);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// File a complaint (member action)
export interface CreateComplaintInput {
  title: string;
  description?: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  attachment_path?: string;
}

export async function createComplaint(supabase: SupabaseClient, input: CreateComplaintInput) {
  const user = await requireUser(supabase);
  const { data: code } = await supabase.rpc('next_complaint_code');
  const { data, error } = await supabase.from('complaints').insert({
    code,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority ?? 'medium',
    created_by_member: user.member_id,
  }).select().single();
  if (error) throw error;

  if (input.description) {
    await supabase.from('complaint_messages').insert({
      complaint_id: data.id,
      author_user: user.id,
      author_display: 'Member',
      is_admin: false,
      body: input.description,
      attachment_path: input.attachment_path,
    });
  }
  await supabase.rpc('log_activity', {
    p_action: 'complaint.created',
    p_target_table: 'complaints',
    p_target_id: data.id,
    p_target_label: data.title,
  });
  return data;
}

// Post a reply to an existing complaint
export async function replyToComplaint(
  supabase: SupabaseClient,
  complaintId: string,
  body: string,
  asAdmin: boolean = false
) {
  const user = await requireUser(supabase);
  if (asAdmin) await requireAdmin(supabase);
  const { data, error } = await supabase.from('complaint_messages').insert({
    complaint_id: complaintId,
    author_user: user.id,
    author_display: asAdmin ? 'Society Office' : 'Member',
    is_admin: asAdmin,
    body,
  }).select().single();
  if (error) throw error;
  await supabase.rpc('log_activity', {
    p_action: 'complaint.replied',
    p_target_table: 'complaints',
    p_target_id: complaintId,
  });
  return data;
}

// Admin: change status / assignee
export async function updateComplaint(
  supabase: SupabaseClient,
  complaintId: string,
  patch: { status?: ComplaintStatus; assigned_to?: string; priority?: ComplaintPriority }
) {
  await requireAdmin(supabase);
  const updates: Record<string, unknown> = { ...patch };
  if (patch.status === 'resolved') updates.resolved_at = new Date().toISOString();
  const { data, error } = await supabase.from('complaints')
    .update(updates).eq('id', complaintId).select().single();
  if (error) throw error;
  await supabase.rpc('log_activity', {
    p_action: patch.status ? 'complaint.status_changed' : 'complaint.assigned',
    p_target_table: 'complaints',
    p_target_id: complaintId,
    p_target_label: `${data.code} — ${data.status}`,
    p_diff: patch,
  });
  return data;
}
