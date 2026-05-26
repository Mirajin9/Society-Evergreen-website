// backend/lib/supabase-server.ts
// Server-side Supabase client. Uses the SERVICE ROLE key — bypasses RLS.
// MUST only be used inside server actions / API routes / cron jobs —
// NEVER imported into a React component that ships to the browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — set them in .env.local');
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// A server client scoped to the request's signed-in user.
// Use this when you want RLS to apply normally (recommended for most API routes
// — admin powers come from the user's role on public.users, not from bypassing RLS).
export function supabaseForUser(accessToken: string): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const anonKey = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
