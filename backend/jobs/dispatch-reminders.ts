// backend/jobs/dispatch-reminders.ts
//
// Supabase Edge Function. Runs on a schedule via the Supabase cron extension:
//   select cron.schedule('reminders', '*/5 * * * *',
//     $$ select net.http_post(
//          url := 'https://<your-project>.functions.supabase.co/dispatch-reminders',
//          headers := '{"Authorization": "Bearer <FUNCTION_SECRET>"}'::jsonb
//        ); $$);
//
// What it does:
//   1. Picks up reminders where status='queued' AND dispatch_at <= now()
//   2. Resolves recipients_filter to a list of email addresses
//   3. Sends one email per recipient via Resend
//   4. Updates reminders row to status='sent' or 'failed'
//   5. Writes an activity_log entry
//
// Deploy: `npx supabase functions deploy dispatch-reminders`

// @ts-ignore — Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
// @ts-ignore
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
// @ts-ignore
const SENDER = Deno.env.get('SENDER_EMAIL') ?? 'notices@evergreen-dwarka.in';
// @ts-ignore
const PORTAL_URL = Deno.env.get('PORTAL_URL') ?? 'https://evergreen-dwarka.in';

// @ts-ignore
Deno.serve(async (req: Request) => {
  // Optional shared secret to avoid public invocation
  const auth = req.headers.get('Authorization');
  // @ts-ignore
  if (auth !== `Bearer ${Deno.env.get('FUNCTION_SECRET')}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const { data: due, error } = await supabase
    .from('reminders').select('*')
    .eq('status', 'queued')
    .lte('dispatch_at', new Date().toISOString())
    .order('dispatch_at')
    .limit(25);
  if (error) return new Response(error.message, { status: 500 });

  const out: any[] = [];
  for (const r of due ?? []) {
    try {
      const recipients = await resolveRecipients(r.recipients_filter);
      let sent = 0, failed = 0;
      for (const email of recipients) {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `Evergreen Apartment <${SENDER}>`,
            to: [email],
            subject: r.subject,
            html: `<p style="white-space:pre-wrap">${escapeHtml(r.body)}</p><p><a href="${PORTAL_URL}">Open the portal</a></p>`,
            text: `${r.body}\n\n${PORTAL_URL}`,
            tags: [{ name: 'kind', value: 'reminder' }, { name: 'reminder_kind', value: r.kind }],
          }),
        });
        if (resp.ok) sent++; else failed++;
        await new Promise(res => setTimeout(res, 120));
      }
      await supabase.from('reminders').update({
        status: failed > 0 && sent === 0 ? 'failed' : 'sent',
        sent_count: sent, failed_count: failed,
        sent_at: new Date().toISOString(),
      }).eq('id', r.id);
      await supabase.rpc('log_activity', {
        p_action: 'reminder.sent',
        p_target_table: 'reminders',
        p_target_id: r.id,
        p_target_label: `${r.kind} — ${sent}/${recipients.length}`,
      });
      out.push({ id: r.id, sent, failed });
    } catch (e: any) {
      await supabase.from('reminders').update({
        status: 'failed', error_message: e.message,
      }).eq('id', r.id);
      out.push({ id: r.id, error: e.message });
    }
  }
  return Response.json({ processed: out.length, results: out });
});

async function resolveRecipients(filter: any): Promise<string[]> {
  // {"all": true}            → every active member with an email
  // {"floors": [1, 2]}       → members on those floors
  // {"role": "committee"}    → users with that role
  // {"member_ids": [...]}    → explicit list
  let q = supabase.from('members')
    .select('email')
    .not('email', 'is', null)
    .neq('status', 'deceased');
  if (filter?.floors?.length) q = q.in('floor', filter.floors);
  if (filter?.member_ids?.length) q = q.in('id', filter.member_ids);
  if (filter?.role) {
    // tricky — pull from users instead
    const { data } = await supabase.from('users').select('email').eq('role', filter.role);
    return (data ?? []).map((d: any) => d.email);
  }
  const { data } = await q;
  return (data ?? []).map((d: any) => d.email!).filter(Boolean);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] as string));
}
