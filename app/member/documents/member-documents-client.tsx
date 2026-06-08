"use client";

import { useEffect, useState } from "react";
import { Icon, StatusBadge } from "@/app/components/ui";
import { ensureLocalStore, getSession, visibleDocuments, type LocalDocument, type LocalStore } from "@/app/lib/local-store";

export function MemberDocumentsClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  if (!store) return <div className="loading-pad">Loading documents...</div>;

  const session = getSession();
  const allDocs = visibleDocuments(store, session?.activeRole || "member");
  const documents = allDocs.filter((document) => category === "all" || document.category === category);

  return (
    <>
      <header className="pub-page-header">
        <div className="eyebrow-pub">Member library</div>
        <h1>Documents &amp; Records</h1>
        <p className="ph-sub">View and download official society records shared with members.</p>
      </header>

      <section className="pub-section" style={{ background: "#fff", paddingTop: 36, paddingBottom: 44 }}>
        <div className="chips" style={{ marginBottom: 24 }}>
          <button className={`chip ${category === "all" ? "on" : ""}`} onClick={() => setCategory("all")}>All</button>
          {store.records.map((record) => (
            <button key={record.key} className={`chip ${category === record.key ? "on" : ""}`} onClick={() => setCategory(record.key)}>{record.label}</button>
          ))}
        </div>

        {/* Record categories overview */}
        <div className="tile-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 32 }}>
          {store.records
            .filter((r) => category === "all" || r.key === category)
            .map((record) => {
              const count = allDocs.filter((d) => d.category === record.key).length;
              return (
                <div key={record.key} className="tile-card" style={{ cursor: "default" }}>
                  <div className="tile-icon"><Icon name="folder" size={20} color="var(--navy)" /></div>
                  <div className="tile-title">{record.label}</div>
                  <p className="tile-desc">{record.description}</p>
                  <div style={{ marginTop: "auto", paddingTop: 8, fontSize: 12.5, fontWeight: 600, color: count > 0 ? "var(--flag-green)" : "var(--muted)" }}>
                    {count > 0 ? `${count} document${count > 1 ? "s" : ""}` : "No documents yet"}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Uploaded documents table */}
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>Available downloads</h2>
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Document</th><th>Category</th><th>Visibility</th><th>Uploaded</th><th>Actions</th></tr></thead>
            <tbody>
              {documents.map((document) => <DocumentRow document={document} key={document.id} />)}
            </tbody>
          </table>
          {documents.length === 0 && (
            <div className="empty-state" style={{ border: 0 }}>
              No documents have been uploaded in this section yet. The society office will publish records here.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function DocumentRow({ document }: { document: LocalDocument }) {
  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500 }}>{document.title}</div>
        <div className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{document.fileName} - {formatSize(document.sizeBytes)}</div>
      </td>
      <td>{document.category}</td>
      <td><StatusBadge status={document.visibility} /></td>
      <td className="mono" style={{ fontSize: 11 }}>{new Date(document.uploadedAt).toLocaleDateString("en-IN")}</td>
      <td>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn btn-ghost btn-sm" href={document.dataUrl} target="_blank" rel="noreferrer">View</a>
          <a className="btn btn-primary btn-sm" href={document.dataUrl} download={document.fileName}>Download</a>
        </div>
      </td>
    </tr>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
