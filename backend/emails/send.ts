// backend/emails/send.ts
// Wrapper around the Resend SDK. Use this from API routes, not directly.
//
// In production:
//   1. Verify evergreen-dwarka.in as a sender domain in the Resend dashboard.
//   2. Set RESEND_API_KEY in .env.local.
//   3. SENDER_EMAIL should be "notices@evergreen-dwarka.in" once the domain is verified.
//
// During development, point SENDER_EMAIL at "onboarding@resend.dev" — Resend
// will only deliver to your verified email but the API behaves the same.

export type EmailTemplate = { subject: string; html: string; text: string };

export interface SendEmailInput {
  to: string | string[];
  template: EmailTemplate;
  reply_to?: string;
  bcc?: string[];
  tag?: string;             // e.g. 'invite', 'reminder' — useful for Resend dashboards
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.SENDER_EMAIL ?? 'notices@evergreen-dwarka.in';
  if (!key) throw new Error('RESEND_API_KEY missing');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Evergreen Apartment <${from}>`,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.template.subject,
      html: input.template.html,
      text: input.template.text,
      reply_to: input.reply_to,
      bcc: input.bcc,
      tags: input.tag ? [{ name: 'kind', value: input.tag }] : undefined,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Send a batch with throttling. Resend allows 10 req/sec by default.
export async function sendBatch(inputs: SendEmailInput[]) {
  const results: Array<{ to: string; status: 'sent' | 'failed'; error?: string }> = [];
  for (const item of inputs) {
    try {
      await sendEmail(item);
      results.push({ to: String(item.to), status: 'sent' });
    } catch (e: any) {
      results.push({ to: String(item.to), status: 'failed', error: e.message });
    }
    // simple throttle
    await new Promise(r => setTimeout(r, 120));
  }
  return results;
}
