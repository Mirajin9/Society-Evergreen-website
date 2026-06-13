"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Icon, Modal, PageHead, StatusBadge, personInitials } from "@/app/components/ui";
import { ensureLocalStore, updateMember, type LocalMember } from "@/app/lib/local-store";

export function AdminMembersClient() {
  const [rows, setRows] = useState<LocalMember[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<LocalMember | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    ensureLocalStore().then((store) => setRows(store.members));
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((member) => filter === "all"
        || (filter === "missing_email" && !member.email)
        || (filter === "missing_phone" && !member.phone)
        || (filter === "committee" && member.committeeRole)
        || (filter === "deceased" && member.status.toLowerCase().includes("deceased")))
      .filter((member) => !term
        || member.name.toLowerCase().includes(term)
        || String(member.flatNo).includes(term)
        || (member.membershipNo || "").toLowerCase().includes(term));
  }, [filter, rows, search]);

  function onSaved(member: LocalMember) {
    setRows((current) => current.map((item) => item.id === member.id ? member : item));
    setEditing(null);
    setNotice(`Flat ${member.flatNo} updated in local database.`);
  }

  return (
    <>
      <PageHead
        title="Members"
        sub={`${rows.length} member records in local database - admin-only directory`}
        breadcrumb="ADMIN - MEMBERS"
        actions={<button className="btn btn-ghost btn-sm" disabled><Icon name="dl" size={13} /> Export later</button>}
      />
      <div className="page-body">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div className="chips">
            {[
              ["all", "All"],
              ["missing_email", "Missing email"],
              ["missing_phone", "Missing phone"],
              ["committee", "Committee"],
              ["deceased", "Deceased"]
            ].map(([key, label]) => <button key={key} className={`chip ${filter === key ? "on" : ""}`} onClick={() => setFilter(key)}>{label}</button>)}
          </div>
          <input className="field" placeholder="Search name, flat, membership no" value={search} onChange={(event) => setSearch(event.target.value)} style={{ width: 280 }} />
        </div>
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Member</th>
                <th>Flat</th>
                <th>M-No.</th>
                <th>Contact</th>
                <th>Occupancy</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{personInitials(member.name).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{member.name}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>
                          {member.id}{member.committeeRole && <> - <span style={{ color: "var(--gold)" }}>{member.committeeRole}</span></>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{member.flatNo}<div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>Floor {member.floor ?? "-"}</div></td>
                  <td className="mono" style={{ fontSize: 12, color: member.membershipNo ? "inherit" : "var(--rust)" }}>{member.membershipNo || "missing"}</td>
                  <td>
                    <div className="mono" style={{ fontSize: 11.5, color: member.email ? "var(--ink-2)" : "var(--rust)" }}>{member.email || "no email"}</div>
                    <div className="mono" style={{ fontSize: 11, color: member.phone ? "var(--muted)" : "var(--rust)", marginTop: 2 }}>{member.phone || "no phone"}</div>
                  </td>
                  <td>{member.ownership}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{member.vehicleNumber || "-"}</td>
                  <td><StatusBadge status={member.status} /></td>
                  <td className="admin-member-actions"><button className="btn-icon" onClick={() => setEditing(member)} aria-label={`Edit flat ${member.flatNo}`}><Icon name="edit" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <EditMemberModal member={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </>
  );
}

function EditMemberModal({ member, onClose, onSaved }: { member: LocalMember; onClose: () => void; onSaved: (member: LocalMember) => void }) {
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const next: LocalMember = {
      ...member,
      name: text(form, "name"),
      membershipNo: nullable(form, "membershipNo"),
      fatherSpouseName: nullable(form, "fatherSpouseName"),
      email: nullable(form, "email"),
      phone: nullable(form, "phone"),
      alternatePhone: nullable(form, "alternatePhone"),
      ownership: text(form, "ownership"),
      status: text(form, "status"),
      dateOfMembership: nullable(form, "dateOfMembership"),
      vehicleNumber: nullable(form, "vehicleNumber"),
      remarks: nullable(form, "remarks")
    };
    try {
      await updateMember(next);
      onSaved(next);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal
      title={`Edit member - Flat ${member.flatNo}`}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" type="submit" form="edit-member-form">Save changes</button>
      </>}
    >
      <form id="edit-member-form" className="stack" onSubmit={save}>
        {error && <div className="error-box">{error}</div>}
        <div className="grid g2" style={{ gap: 12 }}>
          <Field name="name" label="Member full name" defaultValue={member.name} />
          <Field name="membershipNo" label="Member ID / Membership no." defaultValue={member.membershipNo || ""} />
          <Field name="fatherSpouseName" label="Father / spouse name" defaultValue={member.fatherSpouseName || ""} />
          <Field name="dateOfMembership" label="Date of membership" defaultValue={member.dateOfMembership || ""} type="date" />
          <Field name="email" label="Email ID" defaultValue={member.email || ""} type="email" />
          <Field name="phone" label="Mobile number" defaultValue={member.phone || ""} />
          <Field name="alternatePhone" label="Alternate phone" defaultValue={member.alternatePhone || ""} />
          <Field name="vehicleNumber" label="Vehicle number(s)" defaultValue={member.vehicleNumber || ""} />
          <div>
            <label className="fl">Occupancy status</label>
            <select className="field" name="ownership" defaultValue={member.ownership}>
              <option>Owner</option><option>Owner (Joint)</option><option>Tenant</option><option>Vacant</option><option>Disputed</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="fl">Membership status</label>
            <select className="field" name="status" defaultValue={member.status}>
              <option>Active</option><option>Transferred</option><option>Disputed</option><option>Deceased</option><option>Other</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="fl">Remarks</label>
            <textarea className="field" name="remarks" defaultValue={member.remarks || ""} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Field({ name, label, defaultValue, type = "text" }: { name: string; label: string; defaultValue: string; type?: string }) {
  return <div><label className="fl">{label}</label><input className="field" name={name} type={type} defaultValue={defaultValue} /></div>;
}

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}

function nullable(form: FormData, key: string) {
  const value = text(form, key);
  return value || null;
}
