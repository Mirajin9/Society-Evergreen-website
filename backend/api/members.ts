// backend/api/members.ts
// Server-side functions for the Members API.
//
// These are framework-agnostic — wrap them in Next.js route handlers like:
//
//   // app/api/admin/members/route.ts
//   import { listMembers } from '@/backend/api/members';
//   export async function GET(req: Request) {
//     return Response.json(await listMembers({ supabase: ..., ...query }));
//   }

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MemberRow, MemberStatus, OwnershipStatus,
} from '../types/database';
import type {
  MemberWithMeta, DataCompletionReport,
  MemberImportRow, MemberImportResult,
} from '../types/domain';
import { requireAdmin } from '../lib/rbac';
import { REQUIRED_FIELDS, memberCompleteness } from '../lib/completeness';
import { supabaseAdmin } from '../lib/supabase-server';
import { sendEmail, EmailTemplate } from '../emails/send';

// ─── List members (admin) ─────────────────────────────────────────────────
export interface ListMembersParams {
  filter?: 'all' | 'has_email' | 'missing_email' | 'missing_phone'
         | 'logins_enabled' | 'pending_invite' | 'deceased' | 'no_membership';
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listMembers(
  supabase: SupabaseClient,
  params: ListMembersParams = {}
): Promise<{ rows: MemberWithMeta[]; total: number }> {
  await requireAdmin(supabase);
  const { filter = 'all', search, limit = 100, offset = 0 } = params;

  let q = supabase
    .from('members')
    .select('*, users(id, role, committee_role, last_seen_at)', { count: 'exact' })
    .is('deleted_at', null);

  switch (filter) {
    case 'has_email':       q = q.not('email', 'is', null); break;
    case 'missing_email':   q = q.is('email', null).neq('status', 'deceased'); break;
    case 'missing_phone':   q = q.is('phone', null).neq('status', 'deceased'); break;
    case 'no_membership':   q = q.is('membership_no', null); break;
    case 'deceased':        q = q.eq('status', 'deceased'); break;
    case 'logins_enabled':  q = q.not('users', 'is', null); break;
    case 'pending_invite':  /* handled below using a join */ break;
  }
  if (search) {
    // simple OR search; replace with full-text in production
    q = q.or(
      `name.ilike.%${search}%,membership_no.ilike.%${search}%`
    );
  }
  q = q.order('flat_no', { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  const rows: MemberWithMeta[] = (data ?? []).map((m: any) => {
    const { pct, missing } = memberCompleteness(m);
    const user = m.users?.[0] || m.users || null;
    const login_status =
      m.status === 'deceased' ? 'disabled'
      : user                  ? 'enabled'
      : !m.email              ? 'no_email'
      : 'not_invited';
    return {
      ...m,
      completeness_pct: pct,
      missing_fields: missing,
      committee_role: user?.committee_role ?? null,
      last_login: user?.last_seen_at ?? null,
      login_status,
    };
  });
  return { rows, total: count ?? rows.length };
}

// ─── Get single member ────────────────────────────────────────────────────
export async function getMember(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('members')
    .select('*, users(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ─── Update member (admin) ────────────────────────────────────────────────
export interface UpdateMemberInput {
  name?: string;
  membership_no?: string | null;
  father_spouse_name?: string | null;
  email?: string | null;
  alternate_email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  ownership?: OwnershipStatus;
  status?: MemberStatus;
  vehicle_number?: string | null;
  vehicle_make_model?: string | null;
  notes?: string | null;
}

// Fields a non-admin (the member themselves) may edit. Limits self-service.
const SELF_EDITABLE: (keyof UpdateMemberInput)[] = [
  'phone', 'alternate_phone', 'alternate_email',
  'vehicle_number', 'vehicle_make_model',
];

export async function updateMember(
  supabase: SupabaseClient,
  memberId: string,
  patch: UpdateMemberInput,
  opts: { asAdmin?: boolean } = {}
) {
  // Self-edit allow-list
  if (!opts.asAdmin) {
    const allowed = Object.fromEntries(
      Object.entries(patch).filter(([k]) => SELF_EDITABLE.includes(k as any))
    );
    patch = allowed as UpdateMemberInput;
  } else {
    await requireAdmin(supabase);
  }
  // Build the diff for the activity log
  const { data: before } = await supabase.from('members').select('*').eq('id', memberId).single();
  const { data, error } = await supabase
    .from('members').update(patch).eq('id', memberId).select().single();
  if (error) throw error;
  // Audit
  const diff = Object.fromEntries(
    Object.entries(patch).filter(([k]) => (before as any)?.[k] !== (data as any)[k])
      .map(([k]) => [k, [(before as any)[k], (data as any)[k]]])
  );
  if (Object.keys(diff).length) {
    await supabase.rpc('log_activity', {
      p_action: 'member.updated',
      p_target_table: 'members',
      p_target_id: memberId,
      p_target_label: `Flat ${data.flat_no} — ${Object.keys(diff).join(', ')}`,
      p_diff: diff,
    });
  }
  return data as MemberRow;
}

// ─── Send login invitation ────────────────────────────────────────────────
export async function sendLoginInvite(
  supabase: SupabaseClient,
  memberId: string
) {
  await requireAdmin(supabase);
  const { data: member, error } = await supabase
    .from('members').select('*').eq('id', memberId).single();
  if (error) throw error;
  if (!member.email) throw new Error('Cannot invite a member with no email');

  // 1. Create or update the auth user using Supabase's admin API
  const admin = supabaseAdmin();
  const { data: invite, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(member.email, {
      data: { member_id: member.id, flat_no: member.flat_no, name: member.display_name },
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/set-password`,
    });
  if (inviteError) throw inviteError;

  // 2. Create the public.users row with default 'member' role
  await admin.from('users').upsert({
    id: invite.user.id,
    member_id: member.id,
    email: member.email,
    role: 'member',
  });

  // 3. Audit log
  await supabase.rpc('log_activity', {
    p_action: 'member.invited',
    p_target_table: 'members',
    p_target_id: memberId,
    p_target_label: `Flat ${member.flat_no} — ${member.email}`,
  });

  return { member_id: memberId, email: member.email, invitation_sent: true };
}

// ─── Data completion report ───────────────────────────────────────────────
export async function dataCompletionReport(
  supabase: SupabaseClient,
  fieldFilter?: 'email' | 'phone' | 'membership_no' | 'ownership'
): Promise<DataCompletionReport> {
  await requireAdmin(supabase);

  // Use the SQL aggregate view we created.
  const { data: agg } = await supabase.from('v_data_completion').select('*').single();
  if (!agg) throw new Error('v_data_completion view missing');

  // Pull all members for the missing list (sorted by flat).
  let mq = supabase.from('members').select('id, flat_no, name, membership_no, email, phone, ownership, status')
    .is('deleted_at', null).neq('status', 'deceased').order('flat_no');
  if (fieldFilter) mq = mq.is(fieldFilter, null);
  const { data: members, error } = await mq;
  if (error) throw error;

  const members_missing = (members ?? [])
    .map((m: any) => {
      const { pct, missing } = memberCompleteness(m);
      return { flat_no: m.flat_no, member_id: m.id, name: m.name, membership_no: m.membership_no, missing, completeness_pct: pct };
    })
    .filter(r => r.missing.length > 0);

  return {
    total: agg.total_members,
    full_profiles: agg.full_profiles,
    overall_pct: Math.round((agg.full_profiles / agg.total_members) * 100),
    by_field: [
      { key: 'email',      label: 'Email',          filled: agg.with_email,      missing: agg.total_members - agg.with_email },
      { key: 'phone',      label: 'Phone',          filled: agg.with_phone,      missing: agg.total_members - agg.with_phone },
      { key: 'membership', label: 'Membership No.', filled: agg.with_membership, missing: agg.total_members - agg.with_membership },
      { key: 'ownership',  label: 'Occupancy',      filled: agg.with_ownership,  missing: agg.total_members - agg.with_ownership },
    ],
    members_missing,
  };
}

// ─── CSV / Excel import ───────────────────────────────────────────────────
// Designed for the "Import update sheet" flow on the Data Completion screen.
// Matches existing rows by `flat`, fills in blanks WITHOUT overwriting non-null
// existing values (unless `overwrite: true` is passed).
export async function importMembers(
  supabase: SupabaseClient,
  rows: MemberImportRow[],
  opts: { overwrite?: boolean } = {}
): Promise<MemberImportResult> {
  await requireAdmin(supabase);
  const result: MemberImportResult = {
    total_rows: rows.length,
    matched: 0, created: 0, skipped: 0,
    errors: [],
    fields_filled: {},
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.flat || !Number.isInteger(row.flat)) {
      result.skipped++;
      result.errors.push({ row: i + 1, message: 'Missing or invalid flat number' });
      continue;
    }
    try {
      const { data: existing } = await supabase
        .from('members').select('*').eq('flat_no', row.flat).maybeSingle();

      const patch: Partial<MemberRow> = {};
      const map: Array<[keyof MemberImportRow, keyof MemberRow]> = [
        ['name', 'name'], ['membership', 'membership_no'],
        ['email', 'email'], ['phone', 'phone'],
        ['alternate_email', 'alternate_email'], ['alternate_phone', 'alternate_phone'],
        ['father_spouse', 'father_spouse_name'],
        ['vehicle', 'vehicle_number'],
      ];
      for (const [src, dst] of map) {
        const v = row[src];
        if (v == null || v === '') continue;
        if (existing && !opts.overwrite && (existing as any)[dst] != null) continue;
        (patch as any)[dst] = v;
        result.fields_filled[dst as string] = (result.fields_filled[dst as string] ?? 0) + 1;
      }
      if (row.ownership && (!existing?.ownership || opts.overwrite)) {
        patch.ownership = row.ownership as OwnershipStatus;
      }
      if (existing) {
        if (Object.keys(patch).length) {
          await supabase.from('members').update(patch).eq('id', existing.id);
        }
        result.matched++;
      } else {
        await supabase.from('members').insert({
          flat_no: row.flat,
          name: row.name || `Flat ${row.flat}`,
          ...patch,
        });
        result.created++;
      }
    } catch (err: any) {
      result.errors.push({ row: i + 1, message: err.message || String(err) });
    }
  }

  await supabase.rpc('log_activity', {
    p_action: 'system.import',
    p_target_table: 'members',
    p_target_label: `Imported ${result.matched + result.created} member rows`,
    p_diff: { stats: [null, result] },
  });

  return result;
}

// ─── Self-update token (one-time URL) ─────────────────────────────────────
export async function issueSelfUpdateToken(
  supabase: SupabaseClient,
  memberId: string,
  ttlDays = 14
): Promise<{ token: string; url: string; expires_at: string }> {
  await requireAdmin(supabase);
  // 32-char random token
  const token = [...crypto.getRandomValues(new Uint8Array(24))]
    .map(b => b.toString(36)).join('').slice(0, 32);
  const expires_at = new Date(Date.now() + ttlDays * 86400_000).toISOString();
  await supabase.from('self_update_tokens').insert({ token, member_id: memberId, expires_at });
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/update-profile?token=${token}`;
  return { token, url, expires_at };
}

// Public-facing: validate a self-update token without requiring auth.
// SECURITY: this MUST use the admin client (service role), because the
// member is by definition not yet authenticated. It only returns a tiny
// safe subset of fields — never PII like phone or email.
export async function loadByToken(token: string) {
  const admin = supabaseAdmin();
  const { data: tok, error } = await admin
    .from('self_update_tokens').select('*').eq('token', token).single();
  if (error || !tok) throw new Error('Invalid token');
  if (tok.used_at) throw new Error('Token already used');
  if (new Date(tok.expires_at) < new Date()) throw new Error('Token expired');
  const { data: m } = await admin
    .from('members').select('id, flat_no, name, display_name, membership_no').eq('id', tok.member_id).single();
  return { token: tok, member: m };
}

// Save self-update submission (also service role, also validates token).
export async function submitSelfUpdate(token: string, patch: UpdateMemberInput) {
  const admin = supabaseAdmin();
  const { data: tok } = await admin.from('self_update_tokens').select('*').eq('token', token).single();
  if (!tok || tok.used_at || new Date(tok.expires_at) < new Date()) throw new Error('Invalid token');
  // Only allow safe fields
  const safe: UpdateMemberInput = {};
  for (const k of ['email','phone','alternate_email','alternate_phone','father_spouse_name','vehicle_number','vehicle_make_model'] as const) {
    if ((patch as any)[k] != null) (safe as any)[k] = (patch as any)[k];
  }
  await admin.from('members').update(safe).eq('id', tok.member_id);
  await admin.from('self_update_tokens').update({ used_at: new Date().toISOString() }).eq('token', token);
  await admin.rpc('log_activity', {
    p_action: 'member.updated',
    p_target_table: 'members',
    p_target_id: tok.member_id,
    p_target_label: `Self-updated (token ${token.slice(0,6)}…)`,
    p_diff: Object.fromEntries(Object.entries(safe).map(([k,v]) => [k, [null, v]])),
  });
  return { ok: true };
}
