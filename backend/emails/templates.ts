// backend/emails/templates.ts
// Email templates rendered as HTML. Kept simple — inline styles, no external
// CSS, so they render the same in every mail client.
//
// Each template is a pure function (data → { subject, html, text }).

import type { MemberRow, NoticeRow, EventRow } from '../types/database';

interface BaseLayoutInput {
  preview?: string;          // preheader text
  title: string;
  body_html: string;
  cta?: { label: string; url: string };
  footer_note?: string;
}

const SIGNATURE = `
  <p style="margin:24px 0 0;color:#6b6f68;font-size:13px;line-height:1.5">
    — Society Office, Evergreen Apartment<br>
    Plot 9, Sector 7, Dwarka, New Delhi 110075<br>
    011-42441492 · evergreensocietyplot9@gmail.com
  </p>`;

function layout({ preview, title, body_html, cta, footer_note }: BaseLayoutInput) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { margin:0; padding:0; background:#f7f6ef; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif; color:#1a1f1c; }
  .wrap { max-width:560px; margin:0 auto; padding:32px 24px; }
  .card { background:#ffffff; border:1px solid #e3e0d3; border-radius:10px; padding:32px 28px; }
  h1 { font-family:Georgia,serif; font-weight:400; font-size:28px; line-height:1.2; margin:0 0 16px; letter-spacing:-0.01em }
  p  { font-size:14.5px; line-height:1.55; color:#3d433f; margin:12px 0 }
  a.btn { display:inline-block; padding:10px 18px; background:#2d5a3d; color:#ffffff; text-decoration:none; border-radius:999px; font-size:14px; font-weight:500; margin:16px 0 }
  .brand { font-family:Georgia,serif; font-size:18px; letter-spacing:-0.005em; margin-bottom:20px }
  .brand em { font-style:italic }
  .meta { font-family:ui-monospace,Menlo,monospace; font-size:11px; color:#9a9c93; letter-spacing:0.04em; margin-top:24px; text-transform:uppercase }
</style></head>
<body>
${preview ? `<div style="display:none;font-size:0;line-height:0">${preview}</div>` : ''}
<div class="wrap">
  <div class="brand">Evergreen <em>Apartment</em></div>
  <div class="card">
    <h1>${title}</h1>
    ${body_html}
    ${cta ? `<a class="btn" href="${cta.url}">${cta.label}</a>` : ''}
    ${SIGNATURE}
  </div>
  ${footer_note ? `<p class="meta">${footer_note}</p>` : ''}
</div>
</body></html>`;
}

// ─── Login invitation ─────────────────────────────────────────────────────
export function loginInvitation(input: {
  member: Pick<MemberRow, 'display_name' | 'flat_no'>;
  invite_url: string;
}) {
  const html = layout({
    title: `Welcome, ${input.member.display_name}.`,
    preview: 'Set up your Evergreen member account in a few steps.',
    body_html: `
      <p>The Society Office has set up an account for you on the Evergreen Apartment member portal.</p>
      <p>You'll use this portal to read notices, view the calendar, download AGM documents and audit reports, and raise maintenance complaints.</p>
      <p><strong>Linked to:</strong> Flat ${input.member.flat_no}</p>
      <p>Click the button below to set a password and sign in for the first time. The link expires in 7 days.</p>`,
    cta: { label: 'Set password & sign in', url: input.invite_url },
    footer_note: 'If you weren\'t expecting this, you can ignore the message and the invite will expire on its own.',
  });
  return {
    subject: `Evergreen Apartment — set up your account (Flat ${input.member.flat_no})`,
    html,
    text: `Welcome ${input.member.display_name}. Set your password at ${input.invite_url}`,
  };
}

// ─── Self-update invitation (no login required) ───────────────────────────
export function selfUpdateInvitation(input: {
  member: Pick<MemberRow, 'display_name' | 'flat_no'>;
  update_url: string;
}) {
  const html = layout({
    title: `Help us complete your member record.`,
    preview: 'Please verify and complete your contact details with the Society Office.',
    body_html: `
      <p>Dear ${input.member.display_name},</p>
      <p>As part of bringing the society records up to date, we'd like to verify the contact details we hold for Flat ${input.member.flat_no}.</p>
      <p>The link below opens a short, secure form. It's unique to your flat and expires in 14 days.</p>`,
    cta: { label: 'Update my details', url: input.update_url },
    footer_note: 'The link is single-use. If you need a new one, write to the Society Office.',
  });
  return {
    subject: `Evergreen Apartment — please complete your member profile (Flat ${input.member.flat_no})`,
    html,
    text: `Please update your details at ${input.update_url}`,
  };
}

// ─── Notice / reminder broadcast ──────────────────────────────────────────
export function noticeBroadcast(input: { notice: NoticeRow; portal_url: string }) {
  const html = layout({
    title: input.notice.title,
    preview: input.notice.body.slice(0, 80),
    body_html: `
      <p style="white-space:pre-wrap">${input.notice.body}</p>`,
    cta: { label: 'Open in portal', url: input.portal_url },
    footer_note: `Notice ${input.notice.code.toUpperCase()} · ${input.notice.category.toUpperCase()}`,
  });
  return {
    subject: `[Evergreen] ${input.notice.title}`,
    html,
    text: input.notice.body,
  };
}

// ─── Event reminder ───────────────────────────────────────────────────────
export function eventReminder(input: {
  event: EventRow;
  days_until: number;
  portal_url: string;
}) {
  const when = new Date(input.event.starts_at);
  const html = layout({
    title: `Reminder: ${input.event.title}`,
    preview: `In ${input.days_until} day${input.days_until === 1 ? '' : 's'}.`,
    body_html: `
      <p>This is a reminder about an upcoming society event:</p>
      <p>
        <strong>${input.event.title}</strong><br>
        <span style="font-family:ui-monospace,monospace;font-size:13px;color:#6b6f68">
          ${when.toLocaleString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          at ${when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}<br>
          ${input.event.location ?? ''}
        </span>
      </p>
      ${input.event.description ? `<p>${input.event.description}</p>` : ''}`,
    cta: { label: 'See full details', url: input.portal_url },
  });
  return {
    subject: `[Evergreen] In ${input.days_until} day${input.days_until === 1 ? '' : 's'}: ${input.event.title}`,
    html,
    text: `${input.event.title} on ${when.toString()}. ${input.portal_url}`,
  };
}

// ─── Complaint reply notification ─────────────────────────────────────────
export function complaintReply(input: {
  member: Pick<MemberRow, 'display_name'>;
  complaint_code: string;
  complaint_title: string;
  reply_excerpt: string;
  portal_url: string;
}) {
  const html = layout({
    title: `New reply on ${input.complaint_code}`,
    preview: input.reply_excerpt.slice(0, 80),
    body_html: `
      <p>Dear ${input.member.display_name},</p>
      <p>There's an update on your complaint <strong>${input.complaint_title}</strong>:</p>
      <p style="background:#f1f0e6;padding:14px 16px;border-radius:8px;font-size:13.5px;color:#3d433f">
        ${input.reply_excerpt}
      </p>`,
    cta: { label: 'View thread', url: input.portal_url },
  });
  return {
    subject: `[Evergreen] Reply on ${input.complaint_code}`,
    html,
    text: `Reply on ${input.complaint_code}: ${input.reply_excerpt}`,
  };
}
