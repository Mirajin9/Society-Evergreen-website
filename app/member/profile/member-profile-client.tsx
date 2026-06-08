"use client";

import { useEffect, useState } from "react";
import { Icon, Modal } from "@/app/components/ui";
import {
  ensureLocalStore, getSession, memberForSession,
  duesForFlat, remindersForFlat, changeRequestsForFlat, addChangeRequest,
  type LocalMember, type LocalStore, type ChangeRequest
} from "@/app/lib/local-store";

const EDITABLE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "alternatePhone", label: "Alternate phone" },
  { key: "membershipNo", label: "Membership number" },
  { key: "parkingSlot", label: "Parking slot" },
  { key: "vehicleNumber", label: "Vehicle number" },
  { key: "fatherSpouseName", label: "Father / Spouse name" }
] as const;

const RUPEE = "₹";
const ARROW = "→";
const MIDDOT = "·";
const DASH = "—";

function rupee(n: number) {
  return `${RUPEE}${n.toLocaleString("en-IN")}`;
}

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
      const m = memberForSession(next, getSession());
      setStore(next);
      setMember(m);
      if (m) setRequests(changeRequestsForFlat(next, m.flatNo));
    });
  }, []);

  if (!store || !member) return <div className="loading-pad">Loading your profile...</div>;

  const dues = duesForFlat(store, member.flatNo);
  const reminders = remindersForFlat(store, member.flatNo);
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

  const duesColor = dues?.status === "paid" ? "var(--flag-green)" : dues?.status === "overdue" ? "#b91c1c" : "#b45309";

  return (
    <>
      <header className="pub-page-header">
        <div className="eyebrow-pub">Flat {member.flatNo}</div>
        <h1>My Profile</h1>
        <p className="ph-sub">Your details, maintenance dues and personal reminders.</p>
      </header>

      <section className="pub-section" style={{ background: "#fff", paddingTop: 40, paddingBottom: 40, display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Maintenance dues */}
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Maintenance dues</h2>
          <div className="card pad-lg" style={{ borderLeft: `3px solid ${duesColor}` }}>
            {!dues ? (
              <div style={{ color: "var(--muted)", fontSize: 14 }}>No dues record found for your flat.</div>
            ) : (
              <div className="grid g4" style={{ gap: 24 }}>
                <Row label="Monthly maintenance" value={rupee(dues.monthlyMaintenance)} />
                <div>
                  <div className="tiny" style={{ marginBottom: 4 }}>Outstanding</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: duesColor }}>{rupee(dues.outstanding)}</div>
                </div>
                <Row label="Last payment" value={dues.lastPaidDate ? `${rupee(dues.lastPaidAmount)} ${MIDDOT} ${new Date(dues.lastPaidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : DASH} />
                <div>
                  <div className="tiny" style={{ marginBottom: 4 }}>Status</div>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999, background: dues.status === "paid" ? "var(--flag-green-lt)" : dues.status === "overdue" ? "#fde8e8" : "var(--saffron-light)", color: duesColor, textTransform: "capitalize" }}>{dues.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal info */}
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
              <Row label="Parking slot" value={member.parkingSlot} />
              <Row label="Vehicle number" value={member.vehicleNumber} />
              <Row label="Father / Spouse name" value={member.fatherSpouseName} />
            </div>
            <div style={{ marginTop: 18, padding: "10px 14px", background: "var(--navy-light)", borderRadius: 8, fontSize: 12.5, color: "var(--navy)" }}>
              Found something wrong? Use <strong>Request a correction</strong> {DASH} the society office will review and update your record.
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Personal reminders</h2>
          {reminders.length === 0 ? (
            <div className="card pad" style={{ color: "var(--muted)", fontSize: 14 }}>No active reminders.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reminders.map((r) => (
                <div key={r.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                  <Icon name="bell" size={15} color="var(--saffron)" />
                  <span style={{ fontSize: 14, color: "var(--navy)", flex: 1 }}>{r.text}</span>
                  {r.dueDate && <span style={{ fontSize: 12, color: "var(--muted)" }}>Due {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change requests history */}
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
