"use client";

import { useEffect, useState } from "react";
import { KPI, PageHead, StatusBadge } from "@/app/components/ui";
import { ensureLocalStore, type LocalRole, type LocalStore } from "@/app/lib/local-store";

interface AccountSummary {
  username: string;
  flatNo: number;
  roles: LocalRole[];
  label: string | null;
  note: string | null;
  passwordVersion: number;
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
}

interface IssuedPassword {
  username: string;
  flatNo: number;
  temporaryPassword: string;
}

export function AdminDatabaseClient() {
  const [store, setStore] = useState<LocalStore | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyUsername, setBusyUsername] = useState("");
  const [issued, setIssued] = useState<IssuedPassword | null>(null);

  useEffect(() => {
    ensureLocalStore().then(setStore);
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const res = await fetch("/api/admin/accounts", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not load member logins.");
      setAccounts(payload.accounts);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function resetPassword(account: AccountSummary, displayName: string) {
    const confirmed = window.confirm(
      `Reset the password for ${account.username} (${displayName})?\n\nTheir current password will stop working and they will be signed out.`
    );
    if (!confirmed) return;
    setBusyUsername(account.username);
    setIssued(null);
    setError("");
    try {
      const res = await fetch("/api/admin/accounts/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: account.username })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not reset the password.");
      setIssued(payload);
      await loadAccounts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyUsername("");
    }
  }

  if (!store) return <div className="loading-pad">Loading local database...</div>;

  const names = new Map(store.members.map((member) => [member.flatNo, member.name]));
  const displayName = (account: AccountSummary) => {
    if (!account.flatNo) return account.label || "Staff";
    const name = names.get(account.flatNo) || `Flat ${account.flatNo}`;
    return account.label ? `${name} (${account.label})` : name;
  };
  const term = search.trim().toLowerCase();
  const visibleAccounts = (accounts || []).filter((account) =>
    !term ||
    account.username.includes(term) ||
    String(account.flatNo) === term ||
    displayName(account).toLowerCase().includes(term)
  );
  const adminCount = (accounts || []).filter((account) => account.roles.includes("admin")).length;
  const pendingCount = (accounts || []).filter((account) => account.mustChangePassword).length;

  return (
    <>
      <PageHead title="Member Logins" sub="Login status, password resets and the change timeline." breadcrumb="ADMIN - MEMBER LOGINS" />
      <div className="page-body">
        <div className="grid g4">
          <KPI label="Members" value={store.members.length} sub="Imported from member list" />
          <KPI label="Logins" value={accounts ? accounts.length : "-"} sub={`${adminCount} MC/staff`} />
          <KPI label="Not yet changed" value={accounts ? pendingCount : "-"} sub="Must set a new password" />
          <KPI label="Audit logs" value={(store.auditLogs || []).length} sub="Tracked local actions" />
        </div>

        {issued && (
          <div className="card pad-lg" style={{ marginTop: 24, border: "2px solid var(--flag-green)" }}>
            <div className="eyebrow">Temporary password issued</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              Username <span className="mono">{issued.username}</span>{issued.flatNo ? ` (Flat ${issued.flatNo})` : ""}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.04em", color: "var(--navy)" }}>
              {issued.temporaryPassword}
            </div>
            <div className="auth-note" style={{ marginTop: 8 }}>
              This is shown only once. Share it privately with the member. They will be asked to set their own password when they sign in.
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setIssued(null)}>Done</button>
          </div>
        )}

        <div className="card table-wrap" style={{ marginTop: 24 }}>
          <div style={{ padding: "16px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow">Member logins</div>
              <div className="auth-note">
                Passwords are stored encrypted and can't be viewed. If a member forgets theirs, reset it and share the temporary password privately.
              </div>
            </div>
            <input
              className="field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search flat, name or username"
              style={{ minWidth: 240 }}
            />
          </div>
          {error && <div className="error-box" style={{ margin: "12px 18px 0" }}>{error}</div>}
          {!accounts && !error && <div className="loading-pad">Loading member logins...</div>}
          {accounts && (
            <table className="tbl">
              <thead><tr><th>Flat / Staff</th><th>Member</th><th>Username</th><th>Roles</th><th>Password</th><th>Last login</th><th></th></tr></thead>
              <tbody>
                {visibleAccounts.map((account) => (
                  <tr key={account.username}>
                    <td>{account.flatNo || "Staff"}</td>
                    <td>{displayName(account)}</td>
                    <td>
                      <div className="mono">{account.username}</div>
                      {account.note && <div style={{ color: "var(--rust)", fontSize: 12 }}>{account.note}</div>}
                    </td>
                    <td>{account.roles.map((role) => <StatusBadge key={role} status={role} />)}</td>
                    <td style={{ fontSize: 12 }}>{passwordStatus(account)}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{formatDateTime(account.lastLoginAt)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={!!busyUsername}
                        onClick={() => resetPassword(account, displayName(account))}
                      >
                        {busyUsername === account.username ? "Resetting..." : "Reset password"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {accounts && visibleAccounts.length === 0 && <div className="empty-state" style={{ border: 0 }}>No logins match your search.</div>}
        </div>

        <div className="grid g2" style={{ marginTop: 24 }}>
          <div className="card pad-lg">
            <div className="eyebrow">Society profile</div>
            <div className="stack">
              <div><div className="tiny">Name</div><div>{store.society.name}</div></div>
              <div><div className="tiny">Registration</div><div>{store.society.registrationNo}</div></div>
              <div><div className="tiny">Address</div><div>{store.society.address}</div></div>
              <div><div className="tiny">Contact</div><div>{store.society.email} - {store.society.phone}</div></div>
            </div>
          </div>
        </div>

        <div className="card table-wrap" style={{ marginTop: 24 }}>
          <div style={{ padding: "16px 18px 0" }}>
            <div className="eyebrow">Change and upload timeline</div>
            <div className="auth-note">Shows who changed or uploaded what, when the current local rollout captured it.</div>
          </div>
          <table className="tbl">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
            <tbody>
              {(store.auditLogs || []).slice(0, 100).map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                  <td>
                    <div className="mono">{log.actorUsername}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {log.actorFlatNo ? `Flat ${log.actorFlatNo}` : "System"} - {log.actorRole}
                    </div>
                  </td>
                  <td><StatusBadge status={log.action} /></td>
                  <td>{log.targetLabel}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!store.auditLogs || store.auditLogs.length === 0) && <div className="empty-state" style={{ border: 0 }}>No timeline entries yet.</div>}
        </div>
      </div>
    </>
  );
}

function passwordStatus(account: AccountSummary) {
  if (account.lockedUntil && Date.parse(account.lockedUntil) > Date.now()) {
    return <span style={{ color: "var(--rust)" }}>Locked until {formatDateTime(account.lockedUntil)}</span>;
  }
  if (account.mustChangePassword) {
    return (
      <span style={{ color: "var(--rust)" }}>
        {account.passwordVersion > 1 ? "Temporary password, must change" : "Initial password, must change"}
      </span>
    );
  }
  return <span style={{ color: "var(--flag-green)" }}>Changed {formatDateTime(account.passwordChangedAt)}</span>;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
