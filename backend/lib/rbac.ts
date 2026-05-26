// backend/lib/rbac.ts
// Role-based access control helpers used by API routes.
// These complement the RLS policies — RLS prevents reads from leaking,
// these provide friendly error messages and let route handlers reject
// inappropriate writes early.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '../types/database';

export class AccessDeniedError extends Error {
  status = 403;
  constructor(message = 'Access denied') { super(message); }
}

export class NotAuthenticatedError extends Error {
  status = 401;
  constructor(message = 'Not signed in') { super(message); }
}

/**
 * Return the currently signed-in user's row in public.users.
 * Throws if not signed in.
 */
export async function requireUser(client: SupabaseClient) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new NotAuthenticatedError();

  const { data: row, error: rowErr } = await client
    .from('users').select('*').eq('id', user.id).single();
  if (rowErr || !row) throw new NotAuthenticatedError('User has no public.users row');
  return row;
}

/**
 * Require the signed-in user to have one of the given roles.
 * The hierarchy is:
 *   member < committee < admin < superadmin
 * A user with role 'admin' satisfies a require('committee') call.
 */
const RANK: Record<UserRole, number> = {
  member: 0, committee: 1, admin: 2, superadmin: 3,
};

export async function requireRole(client: SupabaseClient, minimum: UserRole) {
  const user = await requireUser(client);
  const role = user.role as UserRole;
  if (RANK[role] < RANK[minimum]) {
    throw new AccessDeniedError(`Requires role: ${minimum}`);
  }
  return user;
}

export const requireAdmin       = (c: SupabaseClient) => requireRole(c, 'admin');
export const requireCommittee   = (c: SupabaseClient) => requireRole(c, 'committee');
export const requireSuperadmin  = (c: SupabaseClient) => requireRole(c, 'superadmin');
