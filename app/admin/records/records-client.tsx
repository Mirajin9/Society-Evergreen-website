"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHead, StatusBadge } from "@/app/components/ui";
import { addDocument, ensureLocalStore, type LocalDocument, type LocalStore, type LocalVisibility } from "@/app/lib/local-store";

export function AdminRecordsClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store) return;
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Choose a file to upload.");
      return;
    }
    if (file.size > 1_800_000) {
      setError("For local testing, keep files below 1.8 MB. Production Supabase storage will support larger files.");
      return;
    }
    const category = String(form.get("category") || "forms");
    const record = store.records.find((item) => item.key === category);
    const document = await addDocument({
      title: String(form.get("title") || file.name),
      category,
      visibility: String(form.get("visibility") || record?.defaultVisibility || "members") as LocalVisibility,
      description: String(form.get("description") || ""),
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      dataUrl: await readAsDataUrl(file)
    });
    const next = await ensureLocalStore();
    setStore({ ...next });
    setNotice(`${document.title} uploaded locally.`);
    event.currentTarget.reset();
  }

  if (!store) return <div className="loading-pad">Loading record categories...</div>;
  return (
    <>
      <PageHead title="Records Library" sub="Upload files and choose who can view or download them." breadcrumb="ADMIN - RECORDS" />
      <div className="page-body">
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.25fr", gap: 24, alignItems: "start" }}>
          <form className="card pad-lg stack" onSubmit={upload}>
            <div className="eyebrow">Upload document</div>
            <div>
              <label className="fl">Title</label>
              <input className="field" name="title" placeholder="e.g. AGM agenda 2026" />
            </div>
            <div>
              <label className="fl">Category</label>
              <select className="field" name="category" defaultValue="agm">
                {store.records.map((record) => <option key={record.key} value={record.key}>{record.label}</option>)}
              </select>
            </div>
            <div>
              <label className="fl">Visibility</label>
              <select className="field" name="visibility" defaultValue="members">
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="committee">Committee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="fl">File</label>
              <input className="field" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.xls,.xlsx" required />
              <div className="auth-note">Local test uploads are stored in this browser only.</div>
            </div>
            <div>
              <label className="fl">Description</label>
              <textarea className="field" name="description" />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Upload document</button>
          </form>

          <div className="card table-wrap">
            <table className="tbl">
              <thead><tr><th>Document</th><th>Category</th><th>Visibility</th><th>Actions</th></tr></thead>
              <tbody>
                {(store.documents || []).map((document) => <DocumentRow document={document} key={document.id} />)}
              </tbody>
            </table>
            {(!store.documents || store.documents.length === 0) && <div className="empty-state" style={{ border: 0 }}>No documents uploaded yet.</div>}
          </div>
        </div>
        <div className="grid g3" style={{ marginTop: 24 }}>
          {store.records.map((record) => (
            <div className="card pad" key={record.key}>
              <div className="tiny">{record.key}</div>
              <h3 style={{ margin: "8px 0", fontSize: 16 }}>{record.label}</h3>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>{record.description}</p>
              <StatusBadge status={record.defaultVisibility} />
            </div>
          ))}
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
      <td>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn btn-ghost btn-sm" href={document.dataUrl} target="_blank" rel="noreferrer">View</a>
          <a className="btn btn-primary btn-sm" href={document.dataUrl} download={document.fileName}>Download</a>
        </div>
      </td>
    </tr>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
