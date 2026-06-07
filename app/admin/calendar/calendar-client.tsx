"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarMonth } from "@/app/components/calendar-month";
import { Icon, PageHead, StatusBadge } from "@/app/components/ui";
import { addEvent, ensureLocalStore, type LocalEvent, type LocalMember, type LocalVisibility } from "@/app/lib/local-store";

type EventCategory = "general" | "agm" | "sgm" | "election" | "maintenance" | "payment" | "holiday" | "emergency";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  general: "General / Society",
  agm: "AGM — Annual General Meeting",
  sgm: "SGM — Special General Meeting",
  election: "Election",
  maintenance: "Maintenance / Work",
  payment: "Payment / Dues",
  holiday: "Holiday / Social",
  emergency: "Emergency"
};

const AGM_LIKE: EventCategory[] = ["agm", "sgm", "election"];

function inviteEligible(members: LocalMember[]) {
  return members.filter((m) => m.email || m.phone).length;
}

export function AdminCalendarClient() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [notice, setNotice] = useState("");
  const [category, setCategory] = useState<EventCategory>("general");
  const [sendInvite, setSendInvite] = useState(false);
  const [showInvitePreview, setShowInvitePreview] = useState(false);
  const [inviteTitle, setInviteTitle] = useState("");

  useEffect(() => {
    ensureLocalStore().then((store) => {
      setEvents(store.events);
      setMembers(store.members);
    });
  }, []);

  function handleCategoryChange(val: EventCategory) {
    setCategory(val);
    if (AGM_LIKE.includes(val)) setSendInvite(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "");

    const created = await addEvent({
      title,
      date: String(form.get("date") || ""),
      startTime: String(form.get("startTime") || ""),
      endTime: String(form.get("endTime") || ""),
      location: String(form.get("location") || ""),
      description: `[${CATEGORY_LABELS[category]}] ${String(form.get("description") || "")}`,
      visibility: String(form.get("visibility") || "members") as LocalVisibility,
      reminder: form.get("reminder") === "on" || sendInvite
    });

    setEvents((current) => [...current, created]);

    if (sendInvite) {
      const eligible = inviteEligible(members);
      setNotice(`Event "${title}" created. Invite queued for ${eligible} members (${members.filter((m) => m.email).length} email · ${members.filter((m) => m.phone && !m.email).length} SMS).`);
    } else {
      setNotice(`Event "${title}" saved.`);
    }

    setSendInvite(false);
    setCategory("general");
    setInviteTitle("");
    event.currentTarget.reset();
    setTimeout(() => setNotice(""), 6000);
  }

  const eligibleCount = inviteEligible(members);
  const withEmail = members.filter((m) => m.email).length;
  const withPhoneOnly = members.filter((m) => m.phone && !m.email).length;
  const upcoming = events.filter((e) => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = events.filter((e) => new Date(e.date) < new Date()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <PageHead title="Calendar & Events" sub="Create events, plan AGMs, and send member invites." breadcrumb="ADMIN - CALENDAR" />
      <div className="page-body">
        {notice && (
          <div className="success-box" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bell" size={15} color="var(--green-2)" /> {notice}
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: "1.35fr 1fr", gap: 24, alignItems: "start" }}>
          <CalendarMonth events={events} title="Event calendar" />

          {/* Create event form */}
          <form className="card pad-lg stack" onSubmit={save}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Create Event</div>

            <div>
              <label className="fl">Event type</label>
              <select className="field" value={category} onChange={(e) => handleCategoryChange(e.target.value as EventCategory)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {AGM_LIKE.includes(category) && (
              <div style={{ background: "var(--amber-bg)", border: "1px solid #e5d39a", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#7d5a00", display: "flex", gap: 8 }}>
                <Icon name="bell" size={14} color="var(--gold)" />
                <span>
                  {category === "agm" && "AGM must be held by Sep 30 (within 6 months of FY close). 21-day advance notice required to all members per DCS Act."}
                  {category === "sgm" && "SGM requires 14-day advance notice. Agenda must be circulated in advance."}
                  {category === "election" && "Election notice must be sent to all members. Ballot procedure per society bylaws."}
                </span>
              </div>
            )}

            <div>
              <label className="fl">Event title</label>
              <input
                className="field"
                name="title"
                required
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
                placeholder={category === "agm" ? "e.g. AGM 2026 — Evergreen Apartments" : ""}
              />
            </div>

            <div className="grid g2">
              <Field name="date" label="Date" type="date" required />
              <Field name="startTime" label="Start time" type="time" required />
              <Field name="endTime" label="End time" type="time" />
              <Field name="location" label="Venue" />
            </div>

            <div>
              <label className="fl">Visibility</label>
              <select className="field" name="visibility" defaultValue="members">
                <option value="public">Public — visible on public website</option>
                <option value="members">Members only</option>
                <option value="committee">Committee only</option>
                <option value="admin">Admin only</option>
              </select>
            </div>

            <div>
              <label className="fl">Agenda / description</label>
              <textarea className="field" name="description" rows={3} placeholder="Agenda items, instructions, or notes..." />
            </div>

            {/* Invite / reminder section */}
            <div style={{
              background: sendInvite ? "var(--leaf)" : "var(--panel)",
              border: `1px solid ${sendInvite ? "var(--moss)" : "var(--line)"}`,
              borderRadius: 8, padding: "12px 14px"
            }}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <input
                  name="reminder"
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: sendInvite ? "var(--green-2)" : "var(--ink-2)" }}>
                    Send invite &amp; reminder to all members
                  </div>
                  {sendInvite ? (
                    <div style={{ fontSize: 12, color: "var(--green-2)", marginTop: 3 }}>
                      Will reach <strong>{eligibleCount}</strong> members —{" "}
                      <strong>{withEmail}</strong> email · <strong>{withPhoneOnly}</strong> SMS-only
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                      Enable to notify members via email and SMS when this event is created
                    </div>
                  )}
                </div>
              </label>

              {sendInvite && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowInvitePreview((p) => !p)}>
                    {showInvitePreview ? "Hide" : "Preview"} invite
                  </button>
                  {showInvitePreview && (
                    <div style={{ width: "100%", marginTop: 8, background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: "12px 14px", fontSize: 12.5 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 8 }}>
                        Invite email preview
                      </div>
                      <div style={{ color: "var(--ink-2)", lineHeight: 1.7, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        <b>Subject:</b> Invitation — {inviteTitle || "[Event title]"}<br />
                        <b>To:</b> {withEmail} members (email) + {withPhoneOnly} (SMS)<br />
                        <br />
                        Dear [Member name],<br />
                        <br />
                        You are cordially invited to attend:<br />
                        <b>{inviteTitle || CATEGORY_LABELS[category]}</b><br />
                        <br />
                        Date: [Date] · Time: [Start time]<br />
                        Venue: [Location]<br />
                        <br />
                        Kindly mark your attendance.<br />
                        For queries: evergreensocietyplot9@gmail.com<br />
                        <br />
                        Regards,<br />
                        Management Committee<br />
                        Evergreen Apartments CGHS Ltd.
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)", padding: "6px 10px", background: "var(--amber-bg)", borderRadius: 4 }}>
                        Dev mode: invites are not actually sent. In production, wire to /api/notices with broadcast + SMS provider (MSG91/Twilio).
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              <Icon name="cal" size={14} color="#fff" />
              {sendInvite ? "Create event & send invites" : "Create event"}
            </button>
          </form>
        </div>

        {/* Upcoming events */}
        <div className="card table-wrap" style={{ marginTop: 24 }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Upcoming events ({upcoming.length})</span>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ padding: "24px", color: "var(--muted)", fontSize: 13.5, textAlign: "center" }}>No upcoming events scheduled.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th>Date</th><th>Title</th><th>Venue</th><th>Visibility</th><th>Invite sent</th></tr>
              </thead>
              <tbody>
                {upcoming.map((item) => (
                  <tr key={item.id}>
                    <td className="mono" style={{ fontSize: 12.5 }}>{item.date}</td>
                    <td style={{ fontWeight: 500 }}>{item.title}</td>
                    <td style={{ color: "var(--muted)" }}>{item.location || "—"}</td>
                    <td><StatusBadge status={item.visibility} /></td>
                    <td>
                      {item.reminder
                        ? <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 500 }}>✓ queued</span>
                        : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Past events */}
        {past.length > 0 && (
          <div className="card table-wrap" style={{ marginTop: 16 }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--muted)" }}>Past events ({past.length})</span>
            </div>
            <table className="tbl">
              <thead><tr><th>Date</th><th>Title</th><th>Visibility</th></tr></thead>
              <tbody>
                {past.map((item) => (
                  <tr key={item.id} style={{ opacity: 0.6 }}>
                    <td className="mono" style={{ fontSize: 12.5 }}>{item.date}</td>
                    <td>{item.title}</td>
                    <td><StatusBadge status={item.visibility} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="fl">{label}</label>
      <input className="field" name={name} type={type} required={required} />
    </div>
  );
}
