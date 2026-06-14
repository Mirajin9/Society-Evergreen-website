"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/app/components/ui";
import {
  ensureLocalStore, getSession, memberForSession, noticesForFlat,
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

  const notices = noticesForFlat(store, member.flatNo);
  const documents = store.documents || [];

  const tiles = [
    {
      href: "/member/notices",
      icon: "bell",
      title: "Website Notifications",
      desc: "Notices and updates published by the Management Committee.",
      meta: notices.length ? `${notices.length} notice${notices.length === 1 ? "" : "s"}` : "No notices yet"
    },
    {
      href: "/member/documents",
      icon: "doc",
      title: "Documents & Records",
      desc: "AGM records, audit reports, accounts, forms and other documents uploaded by the MC.",
      meta: documents.length ? `${documents.length} document${documents.length === 1 ? "" : "s"}` : "No uploads yet"
    },
    {
      href: "/member/share-certificates",
      icon: "shield",
      title: "Share Certificates",
      desc: "View the share certificate register after it is uploaded by the MC.",
      meta: store.shareCertificateRegister ? "Register available" : "Not uploaded yet"
    },
    {
      href: "/member/profile",
      icon: "user",
      title: "My Profile",
      desc: "Check your member details and request corrections from the society office.",
      meta: `Flat ${member.flatNo}`
    }
  ];

  return (
    <>
      <section className="pub-hero" style={{ padding: "48px 40px 44px" }}>
        <div className="eyebrow-pub">Flat {member.flatNo} - {store.society.name}</div>
        <h1 style={{ fontSize: "clamp(34px, 5vw, 52px)" }}>
          Welcome, <em>{firstName(member.name)}</em>.
        </h1>
        <p className="hero-desc" style={{ marginBottom: 0 }}>
          Use this portal to read MC notices, download society records, view the share certificate register and check your member profile.
        </p>
      </section>

      <section className="pub-tiles-section">
        <h2>Member Portal</h2>
        <p className="section-sub">Only records uploaded or notices published by the MC will appear here.</p>
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
