// backend/lib/completeness.ts
// Mirror of the SQL `public.member_completeness` function in JS, so the
// frontend can compute completeness without a round-trip.

import type { MemberRow, LoginStatus } from '../types/database';

export const REQUIRED_FIELDS = [
  { key: 'email',         label: 'Email' },
  { key: 'phone',         label: 'Phone' },
  { key: 'membership_no', label: 'Membership No.' },
  { key: 'ownership',     label: 'Occupancy' },
] as const;

export type RequiredFieldKey = (typeof REQUIRED_FIELDS)[number]['key'];

export function memberCompleteness(m: Partial<MemberRow>) {
  const missing: RequiredFieldKey[] = [];
  for (const f of REQUIRED_FIELDS) {
    const v = (m as any)[f.key];
    if (v == null || v === '') missing.push(f.key);
  }
  return {
    pct: Math.round(((REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length) * 100),
    missing,
  };
}

/**
 * Derive a member's login status from raw fields. The same calculation runs
 * in SQL via `public.member_login_status` — we keep them in sync.
 */
export function deriveLoginStatus(
  m: Pick<MemberRow, 'email' | 'status'>,
  hasUser: boolean,
  hasUnconsumedToken: boolean
): LoginStatus {
  if (m.status === 'deceased') return 'disabled';
  if (hasUser) return 'enabled';
  if (!m.email) return 'no_email';
  if (hasUnconsumedToken) return 'pending';
  return 'not_invited';
}
