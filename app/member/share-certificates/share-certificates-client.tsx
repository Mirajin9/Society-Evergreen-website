"use client";

import { useEffect, useState } from "react";
import { ensureLocalStore, type LocalStore } from "@/app/lib/local-store";

export function MemberShareCertificatesClient() {
  const [store, setStore] = useState<LocalStore | null>(null);

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  if (!store) return <div className="loading-pad">Loading share certificate register...</div>;

  const register = store.shareCertificateRegister;

  return (
    <>
      <header className="pub-page-header">
        <div className="eyebrow-pub">Member register</div>
        <h1>Share Certificates</h1>
        <p className="ph-sub">View the MC-issued share certificate register.</p>
      </header>

      <section className="pub-section" style={{ background: "#fff", paddingTop: 36, paddingBottom: 44 }}>
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {(register?.columns || ["Status"]).map((column) => <th key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {register?.rows.map((row, index) => (
                <tr key={index}>
                  {register.columns.map((column) => <td key={column}>{row[column] || "-"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {!register && (
            <div className="empty-state" style={{ border: 0 }}>
              The share certificate register has not been uploaded yet.
            </div>
          )}
        </div>
        {register && (
          <div className="auth-note" style={{ marginTop: 12 }}>
            Last updated {new Date(register.uploadedAt).toLocaleString("en-IN")}. This page is view-only.
          </div>
        )}
      </section>
    </>
  );
}
