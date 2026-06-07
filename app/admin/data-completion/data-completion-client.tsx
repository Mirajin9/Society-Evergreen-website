"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/app/components/ui";
import { ensureLocalStore, type LocalMember } from "@/app/lib/local-store";

type FilterKey = "all" | "missing_phone" | "missing_email" | "missing_membership" | "missing_parking" | "missing_father";

const FIELDS: Array<{ key: keyof LocalMember | "fatherSpouseName"; label: string; short: string; icon: string }> = [
  { key: "phone",           label: "Phone",          short: "Phone",    icon: "phone" },
  { key: "email",           label: "Email",           short: "Email",    icon: "mail"  },
  { key: "membershipNo",    label: "Membership No.",  short: "Mem. No.", icon: "doc"   },
  { key: "parkingSlot",     label: "Parking Slot",   short: "Parking",  icon: "parking" },
  { key: "fatherSpouseName",label: "Father/Spouse",  short: "F/S Name", icon: "user"  }
];

function pct(filled: number, total: number) {
  return Math.round((filled / total) * 100);
}

function memberCompleteness(m: LocalMember) {
  const fields: (keyof LocalMember)[] = ["phone", "email", "membershipNo", "parkingSlot", "fatherSpouseName"];
  const filled = fields.filter((f) => !!m[f]).length;
  return Math.round((filled / fields.length) * 100);
}

function PctBar({ value, small }: { value: number; small?: boolean }) {
  const color = value >= 80 ? "var(--green)" : value >= 50 ? "var(--gold)" : "var(--rust)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: small ? 4 : 6, background: "var(--panel)", borderRadius: 999, overflow: "hidden", minWidth: small ? 40 : 60 }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: small ? 10.5 : 12, color, fontWeight: 500, width: 32, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <span style={{ color: "var(--green)", fontSize: 14 }}>✓</span>
    : <span style={{ color: "var(--rust)", fontSize: 13, fontWeight: 700 }}>✗</span>;
}

export function DataCompletionClient() {
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"flat" | "completeness">("completeness");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureLocalStore().then((store) => {
      setMembers(store.members);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = members.length;
    return {
      total,
      missingPhone:       members.filter((m) => !m.phone).length,
      missingEmail:       members.filter((m) => !m.email).length,
      missingMembership:  members.filter((m) => !m.membershipNo).length,
      missingParking:     members.filter((m) => !m.parkingSlot).length,
      missingFather:      members.filter((m) => !m.fatherSpouseName).length,
    };
  }, [members]);

  const displayed = useMemo(() => {
    let list = [...members];
    if (filter === "missing_phone")      list = list.filter((m) => !m.phone);
    if (filter === "missing_email")      list = list.filter((m) => !m.email);
    if (filter === "missing_membership") list = list.filter((m) => !m.membershipNo);
    if (filter === "missing_parking")    list = list.filter((m) => !m.parkingSlot);
    if (filter === "missing_father")     list = list.filter((m) => !m.fatherSpouseName);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        String(m.flatNo).includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.membershipNo || "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "completeness") list.sort((a, b) => memberCompleteness(a) - memberCompleteness(b));
    if (sortBy === "flat")         list.sort((a, b) => a.flatNo - b.flatNo);
    return list;
  }, [members, filter, search, sortBy]);

  if (loading) return <div className="loading-pad">Loading member data...</div>;

  const { total, missingPhone, missingEmail, missingMembership, missingParking, missingFather } = stats;

  const FILTERS: Array<{ key: FilterKey; label: string; count: number; color: string }> = [
    { key: "all",                label: "All members",       count: total,            color: "var(--ink)" },
    { key: "missing_phone",      label: "Missing phone",     count: missingPhone,     color: "var(--rust)" },
    { key: "missing_email",      label: "Missing email",     count: missingEmail,     color: "var(--gold)" },
    { key: "missing_membership", label: "Missing mem. no.",  count: missingMembership,color: "var(--gold)" },
    { key: "missing_parking",    label: "Missing parking",   count: missingParking,   color: "var(--muted)" },
    { key: "missing_father",     label: "Missing F/S name",  count: missingFather,    color: "var(--muted)" }
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Data Completion</h1>
          <div className="sub">Missing information across all 165 member records.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn btn-ghost" href="/admin/members">
            <Icon name="edit" size={14} /> Edit Members
          </Link>
        </div>
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Summary stats */}
        <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { label: "Phone missing",      missing: missingPhone,      icon: "phone",   color: "var(--rust)" },
            { label: "Email missing",      missing: missingEmail,       icon: "mail",    color: "var(--gold)" },
            { label: "Membership missing", missing: missingMembership,  icon: "doc",     color: "var(--gold)" },
            { label: "Parking missing",    missing: missingParking,     icon: "parking", color: "var(--muted)" },
            { label: "F/S name missing",   missing: missingFather,      icon: "user",    color: "var(--muted)" }
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <Icon name={s.icon} size={16} color={s.color} />
                <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {pct(total - s.missing, total)}% ok
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.missing > 0 ? s.color : "var(--green)", lineHeight: 1 }}>
                {s.missing}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
              <PctBar value={pct(total - s.missing, total)} small />
            </div>
          ))}
        </div>

        {/* Phone collection banner */}
        {missingPhone > 0 && (
          <div style={{ background: "var(--rust-bg)", border: "1px solid #e2c3b3", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Icon name="phone" size={18} color="var(--rust)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--rust)", marginBottom: 3 }}>
                {missingPhone} members cannot log in — phone number missing
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
                The OTP login system requires a registered mobile number. Collect phone numbers from these members and add them using the Edit Members page. Once added, they can log in immediately.
              </div>
            </div>
            <Link href="/admin/members" className="btn btn-sm" style={{ background: "var(--rust)", color: "#fff", border: 0, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              Edit Members →
            </Link>
          </div>
        )}

        {/* Filter chips + search + sort */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="chips" style={{ flex: 1, minWidth: 0 }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`chip${filter === f.key ? " on" : ""}`}
                onClick={() => setFilter(f.key)}
                style={filter === f.key ? {} : { borderColor: f.count === total && f.key !== "all" ? "var(--green)" : undefined }}
              >
                {f.label}
                <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.8 }}>({f.count})</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <input
              className="field"
              placeholder="Search flat / name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <select className="field" value={sortBy} onChange={(e) => setSortBy(e.target.value as "flat" | "completeness")} style={{ width: "auto" }}>
              <option value="completeness">Sort: Least complete first</option>
              <option value="flat">Sort: Flat number</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
          Showing <strong>{displayed.length}</strong> members
          {filter !== "all" && <> · filtered by <strong>{FILTERS.find((f) => f.key === filter)?.label}</strong></>}
        </div>

        {/* Main table */}
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Flat</th>
                <th>Member name</th>
                <th style={{ width: 70, textAlign: "center" }}>Phone</th>
                <th style={{ width: 70, textAlign: "center" }}>Email</th>
                <th style={{ width: 90, textAlign: "center" }}>Mem. No.</th>
                <th style={{ width: 80, textAlign: "center" }}>Parking</th>
                <th style={{ width: 80, textAlign: "center" }}>F/S Name</th>
                <th style={{ width: 90 }}>Complete</th>
                <th style={{ width: 60 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((m) => {
                const pctVal = memberCompleteness(m);
                return (
                  <tr key={m.id} style={{ background: pctVal === 0 ? "rgba(158,74,51,0.03)" : undefined }}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600, color: "var(--navy)" }}>
                      {m.flatNo}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {m.ownership} · {m.status}
                        {m.membershipNo && <span style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 10.5 }}>#{m.membershipNo}</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {m.phone
                        ? <span title={m.phone}><Check ok /></span>
                        : <span title="Phone missing"><Check ok={false} /></span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {m.email
                        ? <span title={m.email}><Check ok /></span>
                        : <Check ok={false} />}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {m.membershipNo
                        ? <span className="mono" style={{ fontSize: 11.5 }}>{m.membershipNo}</span>
                        : <Check ok={false} />}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {m.parkingSlot
                        ? <span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>{m.parkingSlot}</span>
                        : <Check ok={false} />}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <Check ok={!!m.fatherSpouseName} />
                    </td>
                    <td>
                      <PctBar value={pctVal} small />
                    </td>
                    <td>
                      <Link
                        href={`/admin/members?edit=${m.flatNo}`}
                        className="btn btn-icon btn-sm"
                        title="Edit member"
                        style={{ textDecoration: "none" }}
                      >
                        <Icon name="edit" size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Field legend */}
        <div className="card pad" style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>Field key</div>
          {FIELDS.map((f) => (
            <div key={f.key as string} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-2)" }}>
              <Icon name={f.icon} size={13} color="var(--muted)" />
              <strong>{f.short}</strong> — {f.label}
            </div>
          ))}
          <div style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>
            ✓ = present · ✗ = missing
          </div>
        </div>

      </div>
    </div>
  );
}
