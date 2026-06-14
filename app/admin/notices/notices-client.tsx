"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHead, StatusBadge } from "@/app/components/ui";
import {
  addNotice,
  ensureLocalStore,
  getSession,
  sortedNotices,
  type LocalStore,
  type NoticeCategory
} from "@/app/lib/local-store";

const categories: Array<{ value: NoticeCategory; label: string }> = [
  { value: "general", label: "General" },
  { value: "maintenance", label: "Maintenance" },
  { value: "agm", label: "AGM / SGM" },
  { value: "urgent", label: "Urgent" },
  { value: "event", label: "Event" }
];

export function AdminNoticesClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [audience, setAudience] = useState<"all" | "selected">("all");

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const body = String(form.get("body") || "").trim();
    if (!title || !body) {
      setError("Add both a notice title and body.");
      return;
    }

    const targetFlatNos = audience === "selected"
      ? form.getAll("flatNos").map((value) => Number(value)).filter(Boolean)
      : null;
    if (audience === "selected" && (!targetFlatNos || targetFlatNos.length === 0)) {
      setError("Select at least one flat, or choose all members.");
      return;
    }

    const payload = {
      title,
      body,
      category: String(form.get("category") || "general") as NoticeCategory,
      date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
      pinned: form.get("pinned") === "on",
      targetFlatNos,
      actor: getSession()?.username || "MC user"
    };

    let savedToSupabase = false;
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      savedToSupabase = res.ok;
    } catch {
      savedToSupabase = false;
    }

    const notice = await addNotice(payload);
    const next = await ensureLocalStore();
    setStore({ ...next });
    setMessage(`${notice.title} published${savedToSupabase ? " to Supabase and local preview" : " locally. Supabase publish did not complete."}.`);
    setAudience("all");
    event.currentTarget.reset();
  }

  if (!store) return <div className="loading-pad">Loading notices...</div>;

  const notices = sortedNotices(store);

  return (
    <>
      <PageHead title="Notices" sub="Publish website notifications visible to logged-in members." breadcrumb="MC - NOTICES" />
      <div className="page-body">
        {message && <div className="success-box" style={{ marginBottom: 14 }}>{message}</div>}
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="grid" style={{ gridTemplateColumns: "0.9fr 1.3fr", gap: 24, alignItems: "start" }}>
          <form className="card pad-lg stack" onSubmit={publish}>
            <div className="eyebrow">Compose notice</div>
            <div>
              <label className="fl">Title</label>
              <input className="field" name="title" placeholder="e.g. Water supply shutdown" required />
            </div>
            <div>
              <label className="fl">Category</label>
              <select className="field" name="category" defaultValue="general">
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="fl">Date</label>
              <input className="field" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="fl">Body</label>
              <textarea className="field" name="body" rows={7} required />
            </div>
            <div>
              <label className="fl">Audience</label>
              <select className="field" value={audience} onChange={(event) => setAudience(event.target.value as "all" | "selected")}>
                <option value="all">All members</option>
                <option value="selected">Selected flats only</option>
              </select>
            </div>
            {audience === "selected" && (
              <div>
                <label className="fl">Select flats</label>
                <select className="field" name="flatNos" multiple size={8} required>
                  {[...store.members].sort((a, b) => a.flatNo - b.flatNo).map((member) => (
                    <option key={member.flatNo} value={member.flatNo}>
                      Flat {member.flatNo} - {member.name}
                    </option>
                  ))}
                </select>
                <div className="auth-note">Hold Ctrl while clicking to choose more than one flat.</div>
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input name="pinned" type="checkbox" />
              Pin this notice at the top
            </label>
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Publish notice</button>
          </form>

          <div className="card table-wrap">
            <table className="tbl">
              <thead><tr><th>Notice</th><th>Audience</th><th>Category</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{notice.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{notice.body.slice(0, 110)}{notice.body.length > 110 ? "..." : ""}</div>
                    </td>
                    <td>{notice.targetFlatNos?.length ? `Flats ${notice.targetFlatNos.join(", ")}` : "All members"}</td>
                    <td>{notice.category}</td>
                    <td>{new Date(notice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td><StatusBadge status={notice.pinned ? "Pinned" : "Published"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {notices.length === 0 && <div className="empty-state" style={{ border: 0 }}>No notices published yet.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
