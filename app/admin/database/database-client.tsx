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
  return (
    <>
      <PageHead title="Database" sub="Local stored data for development and testing." breadcrumb="ADMIN - DATABASE" />
      <div className="page-body">
        <div className="grid g4">
          <KPI label="Members" value={store.members.length} sub="Imported from prototype member list" />
          <KPI label="Credentials" value={store.credentials.length} sub="Flat-number logins" />
          <KPI label="Admin users" value={adminCreds.length} sub="Includes flat 111" />
          <KPI label="Documents" value={(store.documents || []).length} sub="Uploaded local files" />
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
                <thead><tr><th>Username</th><th>Flat</th><th>Roles</th></tr></thead>
                <tbody>
                  {adminCreds.map((credential) => (
                    <tr key={credential.username}>
                      <td className="mono">{credential.username}</td>
                      <td>{credential.flatNo}</td>
                      <td>{credential.roles.map((role) => <StatusBadge key={role} status={role} />)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
