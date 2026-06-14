"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHead } from "@/app/components/ui";
import { ensureLocalStore, getSession, saveShareCertificateRegister, type LocalStore } from "@/app/lib/local-store";
import { parseDocxRows } from "@/app/lib/docx";
import { parseXlsxRows } from "@/app/lib/xlsx";

export function AdminShareCertificatesClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  const register = store?.shareCertificateRegister || null;
  const previewRows = useMemo(() => register?.rows.slice(0, 25) || [], [register]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      setError("Choose an Excel or Word file to upload.");
      return;
    }
    if (!/\.(xlsx|docx)$/i.test(file.name)) {
      setError("Upload an .xlsx or .docx file for the share certificate register.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const rows = /\.docx$/i.test(file.name)
        ? await parseDocxRows(buffer)
        : await parseXlsxRows(buffer);
      const parsed = tableFromRows(rows);
      if (!parsed.rows.length) {
        setError("No table rows were found in this workbook.");
        return;
      }
      const serverForm = new FormData();
      serverForm.set("file", file);
      const session = getSession();
      serverForm.set("actor", session ? `${session.username} / Flat ${session.flatNo}` : "MC user");
      let importedToSupabase = false;
      try {
        const res = await fetch("/api/admin/share-certificates/import", { method: "POST", body: serverForm });
        importedToSupabase = res.ok;
      } catch {
        importedToSupabase = false;
      }
      const saved = await saveShareCertificateRegister({
        fileName: file.name,
        columns: parsed.columns,
        rows: parsed.rows
      });
      const next = await ensureLocalStore();
      setStore({ ...next, shareCertificateRegister: saved });
      setNotice(`${saved.rows.length} share certificate rows uploaded from ${file.name}${importedToSupabase ? " and saved to Supabase" : " locally. Supabase import did not complete"}.`);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this register file.");
    }
  }

  if (!store) return <div className="loading-pad">Loading share certificate register...</div>;

  return (
    <>
      <PageHead title="Share Certificates" sub="Upload the MC-issued share certificate register as Excel or Word." breadcrumb="ADMIN - SHARE CERTIFICATES" />
      <div className="page-body">
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="grid" style={{ gridTemplateColumns: "0.85fr 1.4fr", gap: 24, alignItems: "start" }}>
          <form className="card pad-lg stack" onSubmit={upload}>
            <div className="eyebrow">MC upload</div>
            <div>
              <label className="fl">Share certificate register</label>
              <input className="field" name="file" type="file" accept=".xlsx,.docx" required />
              <div className="auth-note">The file is parsed into a member-visible table.</div>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Upload register</button>
          </form>

          <div className="card table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {(register?.columns || ["Status"]).map((column) => <th key={column}>{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index}>
                    {register?.columns.map((column) => <td key={column}>{row[column] || "-"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {!register && <div className="empty-state" style={{ border: 0 }}>No share certificate register uploaded yet.</div>}
            {register && (
              <div className="auth-note" style={{ padding: 16 }}>
                Showing first {previewRows.length} of {register.rows.length} rows. Last upload: {new Date(register.uploadedAt).toLocaleString("en-IN")}.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function tableFromRows(rows: string[][]) {
  const headerIndex = rows.findIndex((row) => row?.filter(Boolean).length >= 2);
  if (headerIndex === -1) return { columns: [], rows: [] };
  const columns = rows[headerIndex].map((cell, index) => cell || `Column ${index + 1}`).filter(Boolean);
  const tableRows = rows.slice(headerIndex + 1)
    .filter((row) => row?.some(Boolean))
    .map((row) => {
      const out: Record<string, string> = {};
      columns.forEach((column, index) => {
        out[column] = row[index] || "";
      });
      return out;
    });
  return { columns, rows: tableRows };
}
