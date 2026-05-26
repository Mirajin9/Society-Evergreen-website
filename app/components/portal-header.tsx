"use client";

import { useRouter } from "next/navigation";
import { getSession, logoutLocal, switchRole } from "@/app/lib/local-store";
import { Icon } from "./ui";

export function PortalHeader({ label }: { label: string }) {
  const router = useRouter();
  const session = getSession();

  function signOut() {
    logoutLocal();
    router.push("/login");
    router.refresh();
  }

  async function setRole(role: "member" | "admin") {
    await switchRole(role);
    router.push(role === "admin" ? "/admin/database" : "/member/dashboard");
    router.refresh();
  }

  return (
    <div className="portal-head">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span className="badge badge-green badge-dot">Local testing mode</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 auto", justifyContent: "flex-end", minWidth: 0 }}>
        <div className="search">
          <Icon name="search" size={14} color="var(--muted)" />
          <input className="field" placeholder="Search documents, members, events" />
        </div>
        {session?.roles.includes("member") && session?.activeRole !== "member" && (
          <button className="btn btn-ghost btn-sm" onClick={() => setRole("member")}>Member view</button>
        )}
        {session?.roles.includes("admin") && session?.activeRole !== "admin" && (
          <button className="btn btn-green btn-sm" onClick={() => setRole("admin")}>Admin console</button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
