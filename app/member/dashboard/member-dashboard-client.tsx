"use client";

import { useEffect, useState } from "react";
import { KPI, PageHead, StatusBadge } from "@/app/components/ui";
import { ensureLocalStore, getSession, memberForSession, type LocalMember, type LocalStore } from "@/app/lib/local-store";

export function MemberDashboardClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [member, setMember] = useState<LocalMember | null>(null);

  useEffect(() => {
    ensureLocalStore().then((next) => {
      setStore(next);
      setMember(memberForSession(next, getSession()));
    });
  }, []);

  if (!store || !member) return <div className="loading-pad">Loading your profile...</div>;
  const visibleEvents = store.events.filter((event) => event.visibility === "public" || event.visibility === "members");

  return (
    <>
      <PageHead
        title={`Welcome, ${member.name.replace(/^\s*(MR|MRS|MS|SMT|DR|LATE)\.?\s+/i, "")}.`}
        sub={`Flat ${member.flatNo} - ${store.society.name}`}
        breadcrumb="MEMBER - DASHBOARD"
      />
      <div className="page-body">
        <div className="grid g4">
          <KPI label="Upcoming events" value={visibleEvents.length} sub="Public + member calendar" />
          <KPI label="Documents" value={store.records.length} sub="Member-only library sections" />
          <KPI label="Parking" value={member.parkingSlot || "-"} sub={member.vehicleNumber || "Vehicle not on file"} />
          <KPI label="Status" value={member.status} sub={member.ownership} />
        </div>
        <div className="card pad-lg" style={{ marginTop: 24 }}>
          <div className="eyebrow">Your member record</div>
          <h2 style={{ marginBottom: 12 }}>Stored locally for testing.</h2>
          <div className="grid g2">
            <div><div className="tiny">Email</div><div>{member.email || "Missing"}</div></div>
            <div><div className="tiny">Phone</div><div>{member.phone || "Missing"}</div></div>
            <div><div className="tiny">Membership number</div><div>{member.membershipNo || "Missing"}</div></div>
            <div><div className="tiny">Status</div><StatusBadge status={member.status} /></div>
          </div>
        </div>
      </div>
    </>
  );
}
