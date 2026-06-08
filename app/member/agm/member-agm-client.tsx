"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/app/components/ui";
import {
  ensureLocalStore, nextAgm, lastAgm,
  type AgmRecord, type LocalStore
} from "@/app/lib/local-store";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function daysFromNow(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function AgendaList({ items }: { items: string[] }) {
  return (
    <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", counterReset: "agenda" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none" }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--navy-light)", color: "var(--navy)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
          <span style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function MemberAgmClient() {
  const [store, setStore] = useState<LocalStore | null>(null);

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  if (!store) return <div className="loading-pad">Loading AGM information...</div>;

  const upcoming: AgmRecord | null = nextAgm(store);
  const previous: AgmRecord | null = lastAgm(store);

  return (
    <>
      <header className="pub-page-header">
        <div className="eyebrow-pub">General Body</div>
        <h1>AGM Information</h1>
        <p className="ph-sub">Details of the upcoming Annual General Meeting and a record of the last one.</p>
      </header>

      <section className="pub-section" style={{ background: "#fff", paddingTop: 40, paddingBottom: 40, display: "flex", flexDirection: "column", gap: 36 }}>

        {/* Upcoming AGM */}
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Upcoming meeting</h2>
          {!upcoming ? (
            <div className="card pad" style={{ color: "var(--muted)", fontSize: 14 }}>No AGM is currently scheduled. A notice will be issued when the next meeting is fixed.</div>
          ) : (
            <div className="card pad-lg" style={{ borderTop: "3px solid var(--saffron)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600 }}>{upcoming.type} · FY {upcoming.fy}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--navy)", marginTop: 4 }}>{fmtDate(upcoming.date)}</div>
                  <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4 }}>{upcoming.time} · {upcoming.venue}</div>
                </div>
                <div style={{ textAlign: "center", background: "var(--saffron-light)", borderRadius: 12, padding: "12px 20px" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#b45309", fontFamily: "var(--font-display)", lineHeight: 1 }}>{Math.max(0, daysFromNow(upcoming.date))}</div>
                  <div style={{ fontSize: 11, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>days to go</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>Agenda</div>
              <AgendaList items={upcoming.agenda} />
            </div>
          )}
        </div>

        {/* Last AGM */}
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Last meeting held</h2>
          {!previous ? (
            <div className="card pad" style={{ color: "var(--muted)", fontSize: 14 }}>No past AGM records are available yet.</div>
          ) : (
            <div className="card pad-lg" style={{ borderTop: "3px solid var(--flag-green)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--flag-green)", fontWeight: 600 }}>{previous.type} · FY {previous.fy}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--navy)", marginTop: 4 }}>{fmtDate(previous.date)}</div>
                  <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4 }}>{previous.time} · {previous.venue}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999, background: "var(--flag-green-lt)", color: "var(--flag-green)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name="shield" size={12} color="var(--flag-green)" /> Concluded
                </span>
              </div>

              <div className="grid g2" style={{ gap: 28 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>Agenda</div>
                  <AgendaList items={previous.agenda} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>Resolutions passed</div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                    {previous.resolutions.map((r, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
                        <Icon name="arr_r" size={15} color="var(--flag-green)" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {previous.minutesAvailable && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>
                    Detailed minutes are available in the Documents &amp; Records section under AGM / General Body Records.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
