"use client";

import { useEffect, useState } from "react";
import { Icon, Modal } from "@/app/components/ui";
import {
  addChangeRequest, changeRequestsForFlat, ensureLocalStore, getSession, memberForSession,
  type ChangeRequest, type LocalMember, type LocalStore
} from "@/app/lib/local-store";

const EDITABLE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "alternatePhone", label: "Alternate phone" },
  { key: "membershipNo", label: "Membership number" },
  { key: "vehicleNumber", label: "Vehicle number(s)" },
  { key: "fatherSpouseName", label: "Father / Spouse name" }
] as const;

const DASH = "-";
const ARROW = "->";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="tiny" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: value ? "var(--navy)" : "var(--muted)", fontWeight: 500 }}>{value || "Not on file"}</div>
    </div>
  );
}

function reqBadge(status: ChangeRequest["status"]) {
  const map = {
    pending: { bg: "var(--saffron-light)", fg: "#b45309", label: "Pending" },
    approved: { bg: "var(--flag-green-lt)", fg: "var(--flag-green)", label: "Approved" },
    rejected: { bg: "#fde8e8", fg: "#b91c1c", label: "Rejected" }
  }[status];
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: map.bg, color: map.fg }}>{map.label}</span>;
}

export function MemberProfileClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [member, setMember] = useState<LocalMember | null>(null);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [field, setField] = useState<string>(EDITABLE_FIELDS[0].key);
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ensureLocalStore().then((next) => {
      const currentMember = memberForSession(next, getSession());
      setStore(next);
      setMember(currentMember);
      if (currentMember) setRequests(changeRequestsForFlat(next, currentMember.flatNo));
    });
  }, []);

  if (!store || !member) return <div className="loading-pad">Loading your profile...</div>;

  const currentValue = (member as unknown as Record<string, string | null>)[field] || "";

  async function submitRequest() {
    if (!member || !requestedValue.trim()) return;
    setSubmitting(true);
    const fieldLabel = EDITABLE_FIELDS.find((f) => f.key === field)?.label || field;
    await addChangeRequest({
      flatNo: member.flatNo,
      field: fieldLabel,
      currentValue: String((member as unknown as Record<string, string | null>)[field] || DASH),
      requestedValue: requestedValue.trim(),
      reason: reason.trim()
    });
    const store2 = await ensureLocalStore();
    setRequests(changeRequestsForFlat(store2, member.flatNo));
    setSubmitting(false);
    setModalOpen(false);
    setRequestedValue("");
    setReason("");
  }

  return (
    <>
      <header className="pub-page-header">
        <div className="eyebrow-pub">Flat {member.flatNo}</div>
        <h1>My Profile</h1>
        <p className="ph-sub">Your member details as recorded by the society office.</p>
      </header>

      <section className="pub-section" style={{ background: "#fff", paddingTop: 40, paddingBottom: 40, display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>Your details</h2>
            <button className="dl-btn" onClick={() => setModalOpen(true)}>
              <Icon name="edit" size={13} color="#fff" /> Request a correction
            </button>
          </div>
          <div className="card pad-lg">
            <div className="grid g3" style={{ gap: 24, rowGap: 20 }}>
              <Row label="Name" value={member.name} />
              <Row label="Flat number" value={member.flatNo} />
              <Row label="Membership number" value={member.membershipNo} />
              <Row label="Email" value={member.email} />
              <Row label="Phone" value={member.phone} />
              <Row label="Alternate phone" value={member.alternatePhone} />
              <Row label="Ownership" value={member.ownership} />
              <Row label="Status" value={member.status} />
              <Row label="Floor" value={member.floor != null ? member.floor : null} />
              <Row label="Vehicle number(s)" value={member.vehicleNumber} />
              <Row label="Father / Spouse name" value={member.fatherSpouseName} />
            </div>
            <div style={{ marginTop: 18, padding: "10px 14px", background: "var(--navy-light)", borderRadius: 8, fontSize: 12.5, color: "var(--navy)" }}>
              Found something wrong? Use <strong>Request a correction</strong>. The society office will review and update your record.
            </div>
          </div>
        </div>

        {requests.length > 0 && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Your correction requests</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {requests.map((req) => (
                <div key={req.id} className="card pad">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{req.field}</span>
                    {reqBadge(req.status)}
                    <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>{new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    <span style={{ color: "var(--muted)" }}>{req.currentValue || DASH}</span> {ARROW} <strong>{req.requestedValue}</strong>
                  </div>
                  {req.reason && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>Reason: {req.reason}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {modalOpen && (
        <Modal
          title="Request a correction"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="dl-btn" onClick={submitRequest} disabled={submitting || !requestedValue.trim()}>
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label>
              <div className="tiny" style={{ marginBottom: 6 }}>Which field is incorrect?</div>
              <select className="field" value={field} onChange={(e) => setField(e.target.value)} style={{ width: "100%" }}>
                {EDITABLE_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </label>
            <div>
              <div className="tiny" style={{ marginBottom: 6 }}>Current value on record</div>
              <div style={{ fontSize: 14, color: "var(--muted)", padding: "8px 12px", background: "var(--panel)", borderRadius: 8 }}>{currentValue || "Not on file"}</div>
            </div>
            <label>
              <div className="tiny" style={{ marginBottom: 6 }}>Correct value</div>
              <input className="field" value={requestedValue} onChange={(e) => setRequestedValue(e.target.value)} placeholder="Enter the correct value" style={{ width: "100%" }} />
            </label>
            <label>
              <div className="tiny" style={{ marginBottom: 6 }}>Reason / note (optional)</div>
              <textarea className="field" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Any details that help the office verify this" style={{ width: "100%", resize: "vertical" }} />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
