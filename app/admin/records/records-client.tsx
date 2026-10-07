"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal, PageHead, StatusBadge } from "@/app/components/ui";
import { addDocument, deleteDocument, ensureLocalStore, updateDocument, type LocalDocument, type LocalStore, type LocalVisibility } from "@/app/lib/local-store";
import { MAX_DOCUMENT_BYTES } from "@/app/lib/portal-constants";

const documentChecklist = [
  { title: "Latest audited accounts", category: "finance" },
  { title: "Latest annual return", category: "finance" },
  { title: "AGM notice and agenda", category: "agm" },
  { title: "Last AGM minutes", category: "agm" },
  { title: "MC circulars / notices", category: "notices" },
  { title: "Share certificate register", category: "share_certificates" }
];

export function AdminRecordsClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [editing, setEditing] = useState<LocalDocument | null>(null);

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store || uploading) return;
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Choose a file to upload.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`This file is ${formatSize(file.size)}. The limit is ${MAX_DOCUMENT_BYTES / 1_000_000} MB; compress the PDF or split it into smaller parts.`);
      return;
    }
    const category = String(form.get("category") || "forms");
    const record = store.records.find((item) => item.key === category);
    const formEl = event.currentTarget;
    setUploading(true);
    try {
      const document = await addDocument({
        title: String(form.get("title") || file.name),
        category,
        visibility: String(form.get("visibility") || record?.defaultVisibility || "members") as LocalVisibility,
        description: String(form.get("description") || ""),
        file
      });
      setStore({ ...(await ensureLocalStore()) });
      setNotice(`${document.title} uploaded. Members can find it under Documents.`);
      formEl.reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(document: LocalDocument) {
    if (busyId || !window.confirm(`Delete "${document.title}" from the document library? Members will no longer be able to view or download it.`)) return;
    setNotice("");
    setError("");
    setBusyId(document.id);
    try {
      await deleteDocument(document.id);
      setStore((current) => current ? { ...current, documents: current.documents.filter((item) => item.id !== document.id) } : current);
      setNotice(`"${document.title}" deleted from the document library.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId("");
    }
  }

  function saved(document: LocalDocument) {
    setStore((current) => current ? { ...current, documents: current.documents.map((item) => item.id === document.id ? document : item) } : current);
    setEditing(null);
    setNotice(`"${document.title}" updated. Members will see the corrected details.`);
  }

  if (!store) return <div className="loading-pad">Loading record categories...</div>;
  return (
    <>
      <PageHead title="Upload Records" sub="Upload and manage AGM minutes, audit reports, accounts, notices and official records." breadcrumb="MC - RECORDS" />
      <div className="page-body">
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.25fr", gap: 24, alignItems: "start" }}>
          <form className="card pad-lg stack" onSubmit={upload}>
            <div className="eyebrow">Upload document</div>
            <div>
              <label className="fl" htmlFor="upload-document-title">Display title</label>
              <input className="field" id="upload-document-title" name="title" maxLength={200} placeholder="e.g. AGM agenda 2026" />
              <div className="auth-note">Members see this title above the original filename. Leave blank to use the filename.</div>
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
              <div className="auth-note">Maximum {MAX_DOCUMENT_BYTES / 1_000_000} MB per file. Uploaded files appear in the member Documents section.</div>
            </div>
            <div>
              <label className="fl">Description</label>
              <textarea className="field" name="description" maxLength={2000} />
            </div>
            <button className="btn btn-primary" disabled={uploading} style={{ alignSelf: "flex-start" }}>{uploading ? "Uploading..." : "Upload document"}</button>
          </form>

          <div className="card table-wrap">
            <table className="tbl">
              <thead><tr><th>Document</th><th>Category</th><th>Visibility</th><th>Actions</th></tr></thead>
              <tbody>
                {(store.documents || []).map((document) => <DocumentRow
                  document={document}
                  key={document.id}
                  busy={!!busyId}
                  deleting={busyId === document.id}
                  onEdit={() => { setNotice(""); setError(""); setEditing(document); }}
                  onDelete={() => remove(document)}
                />)}
              </tbody>
            </table>
            {(!store.documents || store.documents.length === 0) && <div className="empty-state" style={{ border: 0 }}>No documents uploaded yet.</div>}
          </div>
        </div>
        <div className="card pad-lg" style={{ marginTop: 24 }}>
          <div className="eyebrow">Suggested upload checklist</div>
          <div className="grid g3" style={{ marginTop: 12 }}>
            {documentChecklist.map((item) => {
              const uploaded = (store.documents || []).some((document) => {
                const haystack = `${document.title} ${document.fileName} ${document.category}`.toLowerCase();
                return item.title.toLowerCase().split(/\s+/).some((word) => word.length > 4 && haystack.includes(word));
              });
              return (
                <div className="card pad" key={item.title} style={{ boxShadow: "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                    <StatusBadge status={uploaded ? "Uploaded" : "Pending"} />
                  </div>
                  <div className="tiny" style={{ marginTop: 8 }}>{item.category}</div>
                </div>
              );
            })}
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
      {editing && <EditDocumentModal document={editing} records={store.records} onClose={() => setEditing(null)} onSaved={saved} />}
    </>
  );
}

function DocumentRow({ document, busy, deleting, onEdit, onDelete }: {
  document: LocalDocument;
  busy: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500 }}>{document.title}</div>
        <div className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{document.fileName} - {formatSize(document.sizeBytes)}</div>
      </td>
      <td>{document.category}</td>
      <td><StatusBadge status={document.visibility} /></td>
      <td>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="btn btn-ghost btn-sm" href={document.dataUrl} target="_blank" rel="noreferrer">View</a>
          <a className="btn btn-primary btn-sm" href={document.dataUrl} download={document.fileName}>Download</a>
          {!document.id.startsWith("seed-") && <>
            <button className="btn btn-ghost btn-sm" type="button" disabled={busy} onClick={onEdit} aria-label={`Edit ${document.title}`}>Edit</button>
            <button className="btn btn-ghost btn-sm" type="button" disabled={busy} onClick={onDelete} style={{ color: "var(--rust)" }} aria-label={`Delete ${document.title}`}>{deleting ? "Deleting..." : "Delete"}</button>
          </>}
        </div>
      </td>
    </tr>
  );
}

function EditDocumentModal({ document, records, onClose, onSaved }: {
  document: LocalDocument;
  records: LocalStore["records"];
  onClose: () => void;
  onSaved: (document: LocalDocument) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title) { setError("Add a display title."); return; }
    setSaving(true);
    setError("");
    try {
      onSaved(await updateDocument(document.id, {
        title,
        category: String(form.get("category")),
        visibility: String(form.get("visibility")) as LocalVisibility,
        description: String(form.get("description") || "")
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return <Modal
    title="Edit document"
    onClose={() => { if (!saving) onClose(); }}
    footer={<>
      <button className="btn btn-ghost btn-sm" type="button" disabled={saving} onClick={onClose}>Cancel</button>
      <button className="btn btn-primary btn-sm" type="submit" form="edit-document-form" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
    </>}
  >
    {error && <div className="error-box" role="alert" style={{ marginBottom: 14 }}>{error}</div>}
    <form className="stack" id="edit-document-form" onSubmit={save}>
      <div>
        <label className="fl" htmlFor="edit-document-title">Display title</label>
        <input className="field" id="edit-document-title" name="title" defaultValue={document.title} maxLength={200} required autoFocus disabled={saving} />
        <div className="auth-note">Members see this title above {document.fileName}.</div>
      </div>
      <div>
        <label className="fl" htmlFor="edit-document-category">Category</label>
        <select className="field" id="edit-document-category" name="category" defaultValue={document.category} disabled={saving}>
          {records.map((record) => <option key={record.key} value={record.key}>{record.label}</option>)}
        </select>
      </div>
      <div>
        <label className="fl" htmlFor="edit-document-visibility">Visibility</label>
        <select className="field" id="edit-document-visibility" name="visibility" defaultValue={document.visibility} disabled={saving}>
          <option value="public">Public</option>
          <option value="members">Members</option>
          <option value="committee">Committee</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label className="fl" htmlFor="edit-document-description">Description</label>
        <textarea className="field" id="edit-document-description" name="description" defaultValue={document.description} maxLength={2000} disabled={saving} />
      </div>
    </form>
  </Modal>;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
