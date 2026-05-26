"use client";

import { useEffect, useState } from "react";
import { PageHead, StatusBadge } from "@/app/components/ui";
import { ensureLocalStore, getSession, visibleDocuments, type LocalDocument, type LocalStore } from "@/app/lib/local-store";

export function MemberDocumentsClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [category, setCategory] = useState("all");
  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);
  if (!store) return <div className="loading-pad">Loading documents...</div>;

  const session = getSession();
  const documents = visibleDocuments(store, session?.activeRole || "member")
    .filter((document) => category === "all" || document.category === category);

  return (
    <>
      <PageHead title="Documents" sub="View and download documents shared with members." breadcrumb="MEMBER - DOCUMENTS" />
      <div className="page-body">
        <div className="chips" style={{ marginBottom: 18 }}>
          <button className={`chip ${category === "all" ? "on" : ""}`} onClick={() => setCategory("all")}>All</button>
          {store.records.map((record) => <button key={record.key} className={`chip ${category === record.key ? "on" : ""}`} onClick={() => setCategory(record.key)}>{record.label}</button>)}
        </div>
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Document</th><th>Category</th><th>Visibility</th><th>Uploaded</th><th>Actions</th></tr></thead>
            <tbody>
              {documents.map((document) => <DocumentRow document={document} key={document.id} />)}
            </tbody>
          </table>
          {documents.length === 0 && <div className="empty-state" style={{ border: 0 }}>No documents are available in this section yet.</div>}
        </div>
      </div>
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
