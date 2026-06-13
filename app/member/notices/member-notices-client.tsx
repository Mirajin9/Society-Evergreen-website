"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/app/components/ui";
import {
  ensureLocalStore, getSession, memberForSession,
  noticesForFlat, remindersForFlat,
  type LocalMember, type LocalStore, type NoticeCategory
} from "@/app/lib/local-store";

const CATEGORY_STYLE: Record<NoticeCategory, { label: string; bg: string; fg: string }> = {
  general: { label: "General", bg: "var(--navy-light)", fg: "var(--navy)" },
  maintenance: { label: "Maintenance", bg: "var(--flag-green-lt)", fg: "var(--flag-green)" },
  agm: { label: "AGM", bg: "var(--saffron-light)", fg: "#b45309" },
  urgent: { label: "Urgent", bg: "#fde8e8", fg: "#b91c1c" },
  event: { label: "Event", bg: "var(--navy-light)", fg: "var(--navy)" }
};

export function MemberNoticesClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [member, setMember] = useState<LocalMember | null>(null);

  useEffect(() => {
    ensureLocalStore().then((next) => {
      setStore(next);
      setMember(memberForSession(next, getSession()));
    });
  }, []);

  if (!store || !member) return <div className="loading-pad">Loading notices...</div>;

  const notices = noticesForFlat(store, member.flatNo);
  const reminders = remindersForFlat(store, member.flatNo);

  return (
    <>
      <header className="pub-page-header">
        <div className="eyebrow-pub">Flat {member.flatNo}</div>
        <h1>Notices &amp; Reminders</h1>
        <p className="ph-sub">Official society notices and reminders that apply to your flat.</p>
      </header>

      <section className="pub-section" style={{ background: "#fff", paddingTop: 40, paddingBottom: 40 }}>
        {/* Reminders */}
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Your reminders</h2>
        {reminders.length === 0 ? (
          <div className="card pad" style={{ color: "var(--muted)", fontSize: 14 }}>No active reminders. You're all caught up.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reminders.map((r) => (
              <div key={r.id} className="card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderLeft: `3px solid ${r.type === "dues" ? "#b91c1c" : "var(--saffron)"}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--saffron-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="bell" size={16} color="var(--saffron)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500 }}>{r.text}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                    {r.flatNo === null ? "All members" : `Flat ${r.flatNo}`}
                    {r.dueDate && ` · Due ${new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notices */}
        <h2 style={{ fontSize: 22, margin: "40px 0 16px" }}>Society notices</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notices.map((n) => {
            const cat = CATEGORY_STYLE[n.category];
            return (
              <div key={n.id} className="card pad" style={{ border: n.pinned ? "1px solid var(--saffron-mid)" : undefined }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: cat.bg, color: cat.fg }}>{cat.label}</span>
                  {n.pinned && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--saffron)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="bell" size={11} color="var(--saffron)" /> Pinned</span>}
                  <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>
                    {n.targetFlatNos?.length ? "Selected flats - " : ""}
                    {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", margin: "0 0 6px" }}>{n.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{n.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
