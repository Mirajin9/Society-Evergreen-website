"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/app/components/ui";
import {
  ensureLocalStore, getSession, memberForSession,
  duesForFlat, remindersForFlat, sortedNotices, nextAgm,
  type LocalMember, type LocalStore
} from "@/app/lib/local-store";

function firstName(name: string) {
  return name.replace(/^\s*(MR|MRS|MS|SMT|DR|LATE)\.?\s+/i, "").split(/[\s&.]+/)[0] || name;
}

export function MemberDashboardClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [member, setMember] = useState<LocalMember | null>(null);

  useEffect(() => {
    ensureLocalStore().then((next) => {
      setStore(next);
      setMember(memberForSession(next, getSession()));
    });
  }, []);

  if (!store || !member) return <div className="loading-pad">Loading your home...</div>;

  const dues = duesForFlat(store, member.flatNo);
  const reminders = remindersForFlat(store, member.flatNo);
  const notices = sortedNotices(store);
  const agm = nextAgm(store);

  const tiles = [
    {
      href: "/member/notices",
      icon: "notice",
      title: "Notices & Reminders",
      desc: "Society notices, circulars and reminders specific to your flat.",
      meta: `${notices.length} notices · ${reminders.length} reminders`
    },
    {
      href: "/member/agm",
      icon: "meeting",
      title: "AGM Information",
      desc: "Details of the last AGM and the upcoming meeting with its agenda.",
      meta: agm ? `Next: ${new Date(agm.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "No AGM scheduled"
    },
    {
      href: "/member/documents",
      icon: "doc",
      title: "Documents & Records",
      desc: "Audit reports, accounts, share certificates, forms and other records.",
      meta: `${store.records.length} record sections`
    },
    {
      href: "/member/profile",
      icon: "user",
      title: "My Profile",
      desc: "Your details, maintenance dues and personal reminders. Request corrections.",
      meta: dues && dues.outstanding > 0 ? `₹${dues.outstanding.toLocaleString("en-IN")} outstanding` : "All dues clear"
    }
  ];

  return (
    <>
      {/* Welcome hero */}
      <section className="pub-hero" style={{ padding: "48px 40px 44px" }}>
        <div className="eyebrow-pub">Flat {member.flatNo} · {store.society.name}</div>
        <h1 style={{ fontSize: "clamp(34px, 5vw, 52px)" }}>
          Welcome, <em>{firstName(member.name)}</em>.
        </h1>
        <p className="hero-desc" style={{ marginBottom: 0 }}>
          Everything about your flat and the society — notices, AGM information, documents and your
          personal records — is available right here.
        </p>
      </section>

      {/* Quick status strip */}
      <div className="pub-kpi-bar">
        <div className="pub-kpi">
          <div className="v">{dues ? `₹${dues.outstanding.toLocaleString("en-IN")}` : "—"}</div>
          <div className="l">Outstanding dues</div>
          <div className="s">{dues?.status === "paid" ? "All clear" : dues?.status === "overdue" ? "Overdue — please pay" : "Payment due"}</div>
        </div>
        <div className="pub-kpi">
          <div className="v">{reminders.length}</div>
          <div className="l">Active reminders</div>
          <div className="s">Personal + society-wide</div>
        </div>
        <div className="pub-kpi">
          <div className="v">{agm ? new Date(agm.date).getDate() : "—"}</div>
          <div className="l">Next AGM</div>
          <div className="s">{agm ? new Date(agm.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Not scheduled"}</div>
        </div>
        <div className="pub-kpi">
          <div className="v">{member.vehicleNumber || "—"}</div>
          <div className="l">Vehicle on file</div>
          <div className="s">Vehicle ownership record</div>
        </div>
      </div>

      {/* Tiles */}
      <section className="pub-tiles-section">
        <h2>Your society at a glance</h2>
        <p className="section-sub">Select a tile to view details.</p>
        <div className="tile-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="tile-card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div className="tile-icon">
                  <Icon name={tile.icon} size={20} color="var(--navy)" />
                </div>
                <Icon name="arr_r" size={16} color="var(--muted)" />
              </div>
              <div className="tile-title">{tile.title}</div>
              <p className="tile-desc">{tile.desc}</p>
              <div style={{ marginTop: "auto", paddingTop: 8, fontSize: 12.5, fontWeight: 600, color: "var(--saffron)" }}>
                {tile.meta}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
