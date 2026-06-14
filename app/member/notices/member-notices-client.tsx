"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/app/components/ui";
import {
  ensureLocalStore, getSession, memberForSession, noticesForFlat,
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

  return (
    <>
      <header className="pub-page-header">
        <div className="eyebrow-pub">Flat {member.flatNo}</div>
        <h1>Website Notifications</h1>
        <p className="ph-sub">Official notices and updates published by the Management Committee.</p>
      </header>

      <section className="pub-section" style={{ background: "#fff", paddingTop: 40, paddingBottom: 40 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Society notices</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {notices.length === 0 && (
            <div className="card pad" style={{ color: "var(--muted)", fontSize: 14 }}>
              No notices have been published yet. New MC updates will appear here and through the notification bell.
            </div>
          )}
          {notices.map((notice) => {
            const cat = CATEGORY_STYLE[notice.category];
            return (
              <div key={notice.id} className="card pad" style={{ border: notice.pinned ? "1px solid var(--saffron-mid)" : undefined }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: cat.bg, color: cat.fg }}>{cat.label}</span>
                  {notice.pinned && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--saffron)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="bell" size={11} color="var(--saffron)" /> Pinned</span>}
                  <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>
                    {notice.targetFlatNos?.length ? "Selected flats - " : ""}
                    {new Date(notice.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", margin: "0 0 6px" }}>{notice.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{notice.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
