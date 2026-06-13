"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/app/components/ui";
import { ensureLocalStore, type LocalMember, type LocalEvent } from "@/app/lib/local-store";

function missingCount(members: LocalMember[], field: keyof LocalMember) {
  return members.filter((m) => !m[field]).length;
}

function completeness(member: LocalMember) {
  const fields: (keyof LocalMember)[] = ["phone", "email", "membershipNo", "fatherSpouseName"];
  const filled = fields.filter((f) => !!member[f]).length;
  return Math.round((filled / fields.length) * 100);
}

function agmStatus(events: LocalEvent[]) {
  const now = new Date();
  const fyStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1); // April 1
  const agmDeadline = new Date(fyStart.getFullYear() + 1, 8, 30); // Sep 30 next year

  const pastAgms = events
    .filter((e) => e.title.toLowerCase().includes("agm") && new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const nextAgm = events
    .filter((e) => e.title.toLowerCase().includes("agm") && new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const lastAgm = pastAgms[0];
  const lastAgmInFY = lastAgm && new Date(lastAgm.date) >= fyStart;
  const daysToDeadline = Math.ceil((agmDeadline.getTime() - now.getTime()) / 86400000);

  return { lastAgm, nextAgm, lastAgmInFY, daysToDeadline, agmDeadline };
}

export function AdminDashboardClient() {
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureLocalStore().then((store) => {
      setMembers(store.members);
      setEvents(store.events);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading-pad">Loading dashboard...</div>;

  const total = members.length;
  const missingPhone = missingCount(members, "phone");
  const missingEmail = missingCount(members, "email");
  const missingMembership = missingCount(members, "membershipNo");
  const missingFather = missingCount(members, "fatherSpouseName");
  const avgCompleteness = Math.round(members.reduce((s, m) => s + completeness(m), 0) / members.length);
  const { lastAgm, nextAgm, lastAgmInFY, daysToDeadline, agmDeadline } = agmStatus(events);
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const agmUrgent = daysToDeadline < 60 && !lastAgmInFY;
  const agmWarning = daysToDeadline < 120 && !lastAgmInFY;

  return (
    <div>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1>Admin Dashboard</h1>
          <div className="sub">Society compliance overview and action reminders.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn btn-ghost" href="/admin/data-completion">
            <Icon name="chart" size={14} /> Data Completion
          </Link>
          <Link className="btn btn-primary" href="/admin/calendar">
            <Icon name="cal" size={14} /> Create Event
          </Link>
        </div>
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* AGM Compliance Banner */}
        <div style={{
          background: agmUrgent ? "var(--rust-bg)" : agmWarning ? "var(--amber-bg)" : "var(--leaf)",
          border: `1px solid ${agmUrgent ? "#e2c3b3" : agmWarning ? "#e5d39a" : "var(--moss)"}`,
          borderRadius: 12,
          padding: "18px 22px",
          display: "flex", alignItems: "center", gap: 16,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderRadius: "4px 0 0 4px", background: agmUrgent ? "var(--rust)" : agmWarning ? "var(--gold)" : "var(--green)" }} />
          <div style={{ width: 40, height: 40, borderRadius: 10, background: agmUrgent ? "var(--rust)" : agmWarning ? "var(--gold)" : "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="bell" size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: agmUrgent ? "var(--rust)" : agmWarning ? "#7d5a00" : "var(--green-2)", marginBottom: 4 }}>
              {lastAgmInFY
                ? "AGM held this financial year"
                : nextAgm
                  ? `AGM planned: ${new Date(nextAgm.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                  : agmUrgent
                    ? `AGM URGENT — ${daysToDeadline} days to statutory deadline`
                    : agmWarning
                      ? `AGM due soon — ${daysToDeadline} days to deadline (${agmDeadline.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`
                      : `AGM compliance — ${daysToDeadline} days to deadline`}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {lastAgmInFY
                ? `Last AGM: ${new Date(lastAgm!.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · Compliant with DCS Act Section 33`
                : lastAgm
                  ? `Last AGM recorded: ${new Date(lastAgm.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · AGM required annually within 6 months of FY close`
                  : "No AGM recorded this financial year. AGM must be held by Sep 30 (within 6 months of FY close per DCS Act)."}
            </div>
          </div>
          <Link className="btn btn-sm" href="/admin/calendar" style={{ background: agmUrgent ? "var(--rust)" : agmWarning ? "var(--gold)" : "var(--green)", color: "#fff", whiteSpace: "nowrap", border: 0, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="cal" size={12} color="#fff" />
            {nextAgm ? "View AGM event" : "Plan AGM"}
          </Link>
        </div>

        {/* KPI row */}
        <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "Total members", value: total, sub: "165 flats registered", icon: "users", color: "var(--navy)" },
            { label: "Data completeness", value: `${avgCompleteness}%`, sub: `${total - Math.round(total * avgCompleteness / 100)} members incomplete`, icon: "chart", color: "var(--green)" },
            { label: "Missing phone", value: missingPhone, sub: "Cannot receive OTP login", icon: "phone", color: "var(--rust)" },
            { label: "Missing email", value: missingEmail, sub: "Cannot receive invites", icon: "mail", color: "var(--gold)" }
          ].map((kpi) => (
            <div key={kpi.label} className="card stat">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: kpi.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={kpi.icon} size={18} color={kpi.color} />
                </div>
              </div>
              <div className="v" style={{ fontSize: 28, color: kpi.color }}>{kpi.value}</div>
              <div className="l">{kpi.label}</div>
              <div className="d">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Data quality + Upcoming events */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Data Quality Card */}
          <div className="card pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Data Quality</div>
              <Link href="/admin/data-completion" className="btn btn-sm btn-ghost" style={{ textDecoration: "none" }}>
                View all <Icon name="arr_r" size={12} />
              </Link>
            </div>
            <div className="stack">
              {[
                { label: "Phone number", missing: missingPhone, total, icon: "phone" },
                { label: "Email address", missing: missingEmail, total, icon: "mail" },
                { label: "Membership no.", missing: missingMembership, total, icon: "doc" },
                { label: "Father / Spouse name", missing: missingFather, total, icon: "user" }
              ].map((row) => (
                <div key={row.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}>
                      <Icon name={row.icon} size={13} color="var(--muted)" /> {row.label}
                    </span>
                    <span style={{ color: row.missing > 0 ? "var(--rust)" : "var(--green)", fontWeight: 500 }}>
                      {row.missing} missing
                    </span>
                  </div>
                  <div style={{ height: 5, background: "var(--panel)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 999,
                      width: `${Math.round((1 - row.missing / row.total) * 100)}%`,
                      background: row.missing === 0 ? "var(--green)" : row.missing > row.total / 2 ? "var(--rust)" : "var(--gold)"
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: "10px 14px", background: "var(--leaf)", borderRadius: 8, fontSize: 12.5, color: "var(--green-2)" }}>
              Phone numbers are required for OTP login. Collect from members who cannot currently sign in.
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Upcoming Events</div>
              <Link href="/admin/calendar" className="btn btn-sm btn-ghost" style={{ textDecoration: "none" }}>
                <Icon name="plus" size={12} /> Add event
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
                No upcoming events. <Link href="/admin/calendar" style={{ color: "var(--green)", textDecoration: "none" }}>Create one →</Link>
              </div>
            ) : (
              upcomingEvents.map((event) => {
                const d = new Date(event.date);
                const daysUntil = Math.ceil((d.getTime() - Date.now()) / 86400000);
                const isAgm = event.title.toLowerCase().includes("agm") || event.title.toLowerCase().includes("general meeting");
                return (
                  <div key={event.id} className="li-card">
                    <div style={{ width: 48, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: isAgm ? "var(--gold)" : "var(--navy)", lineHeight: 1 }}>
                        {d.getDate()}
                      </div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                        {d.toLocaleDateString("en-IN", { month: "short" })}
                      </div>
                    </div>
                    <div className="body">
                      <h4>{event.title}</h4>
                      <p>{event.location || "No location set"}</p>
                      <div className="meta">
                        <span className={`badge ${isAgm ? "badge-amber" : "badge-green"}`}>{event.visibility}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="card pad">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>RCS Compliance Checklist</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "AGM held this financial year", done: !!lastAgmInFY, desc: "Required by DCS Act Section 33" },
              { label: "Annual return filed with RCS", done: false, desc: "Due within 60 days of AGM" },
              { label: "Accounts audited", done: false, desc: "Audit report required annually" },
              { label: "Member register updated", done: true, desc: "165 members in register" },
              { label: "MC Committee constituted", done: true, desc: "Election records maintained" },
              { label: "Bye-laws on record", done: true, desc: "Available for member inspection" }
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 14px", borderRadius: 8,
                background: item.done ? "var(--leaf)" : "var(--amber-bg)",
                border: `1px solid ${item.done ? "var(--moss)" : "#e5d39a"}`
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  background: item.done ? "var(--green)" : "var(--gold)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{item.done ? "✓" : "!"}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: item.done ? "var(--green-2)" : "#7d5a00" }}>{item.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
