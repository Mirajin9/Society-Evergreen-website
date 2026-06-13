"use client";

import { useEffect, useState } from "react";
import { KPI, PageHead, StatusBadge } from "@/app/components/ui";
import { ensureLocalStore, type LocalStore } from "@/app/lib/local-store";

export function AdminDatabaseClient() {
  const [store, setStore] = useState<LocalStore | null>(null);

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  if (!store) return <div className="loading-pad">Loading local database...</div>;

  const adminCreds = store.credentials.filter((credential) => credential.roles.includes("admin"));
  const memberCreds = [...store.credentials].sort((a, b) => a.flatNo - b.flatNo);
  return (
    <>
      <PageHead title="Database" sub="Local stored data for development and testing." breadcrumb="ADMIN - DATABASE" />
      <div className="page-body">
        <div className="grid g4">
          <KPI label="Members" value={store.members.length} sub="Imported from prototype member list" />
          <KPI label="Credentials" value={store.credentials.length} sub="Mobile + membership rollout" />
          <KPI label="Admin users" value={adminCreds.length} sub="MC accounts" />
          <KPI label="Audit logs" value={(store.auditLogs || []).length} sub="Tracked local actions" />
        </div>
        <div className="grid g2" style={{ marginTop: 24 }}>
          <div className="card pad-lg">
            <div className="eyebrow">Society profile</div>
            <div className="stack">
              <div><div className="tiny">Name</div><div>{store.society.name}</div></div>
              <div><div className="tiny">Registration</div><div>{store.society.registrationNo}</div></div>
              <div><div className="tiny">Address</div><div>{store.society.address}</div></div>
              <div><div className="tiny">Contact</div><div>{store.society.email} - {store.society.phone}</div></div>
            </div>
          </div>
          <div className="card pad-lg">
            <div className="eyebrow">Credential state</div>
            <div className="card table-wrap" style={{ boxShadow: "none" }}>
              <table className="tbl">
                <thead><tr><th>Username</th><th>Password</th><th>Flat</th><th>Roles</th></tr></thead>
                <tbody>
                  {adminCreds.map((credential) => (
                    <tr key={`${credential.username}-${credential.flatNo}`}>
                      <td className="mono">{credential.username}</td>
                      <td className="mono">{credential.password}</td>
                      <td>{credential.flatNo}</td>
                      <td>{credential.roles.map((role) => <StatusBadge key={role} status={role} />)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card table-wrap" style={{ marginTop: 24 }}>
          <div style={{ padding: "16px 18px 0" }}>
            <div className="eyebrow">Password retrieval</div>
            <div className="auth-note">Use this table only for MC-approved account recovery. The OTP login system can replace visible passwords later.</div>
          </div>
          <table className="tbl">
            <thead><tr><th>Flat</th><th>Username</th><th>Password</th><th>Type</th><th>Note</th></tr></thead>
            <tbody>
              {memberCreds.map((credential) => (
                <tr key={`${credential.username}-${credential.flatNo}`}>
                  <td>{credential.flatNo}</td>
                  <td className="mono">{credential.username}</td>
                  <td className="mono">{credential.password}</td>
                  <td>{credential.roles.includes("admin") ? "MC/Admin" : "Member"}</td>
                  <td style={{ color: credential.isGeneratedFallback ? "var(--rust)" : "var(--muted)", fontSize: 12 }}>
                    {credential.note || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card table-wrap" style={{ marginTop: 24 }}>
          <div style={{ padding: "16px 18px 0" }}>
            <div className="eyebrow">Change and upload timeline</div>
            <div className="auth-note">Shows who changed or uploaded what, when the current local rollout captured it.</div>
          </div>
          <table className="tbl">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
            <tbody>
              {(store.auditLogs || []).slice(0, 100).map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                  <td>
                    <div className="mono">{log.actorUsername}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {log.actorFlatNo ? `Flat ${log.actorFlatNo}` : "System"} - {log.actorRole}
                    </div>
                  </td>
                  <td><StatusBadge status={log.action} /></td>
                  <td>{log.targetLabel}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!store.auditLogs || store.auditLogs.length === 0) && <div className="empty-state" style={{ border: 0 }}>No timeline entries yet.</div>}
        </div>
      </div>
    </>
  );
}
