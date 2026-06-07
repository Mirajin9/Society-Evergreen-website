"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession, loginLocal, logoutLocal } from "@/app/lib/local-store";
import type { LocalSession } from "@/app/lib/local-store";

const VIEWS = [
  { label: "Public", action: "public", color: "#6b7280" },
  { label: "Member", action: "member", color: "#138808" },
  { label: "Admin", action: "admin", color: "#1A3A6B" },
];

export function DebugPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSession(getSession());
  }, [pathname]);

  async function switchTo(action: string) {
    setBusy(true);
    try {
      if (action === "public") {
        logoutLocal();
        router.push("/");
      } else if (action === "member") {
        await loginLocal("1", "admin123");
        router.push("/member/dashboard");
      } else if (action === "admin") {
        await loginLocal("111", "admin4321");
        router.push("/admin/dashboard");
      }
      router.refresh();
      setSession(getSession());
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  const currentRole = session?.activeRole ?? "public";
  const dotColor = currentRole === "admin" ? "#1A3A6B" : currentRole === "member" ? "#138808" : "#9ca3af";

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      fontFamily: "var(--font-mono, monospace)", fontSize: 12,
    }}>
      {open && (
        <div style={{
          background: "#111827", color: "#f9fafb", borderRadius: 10,
          padding: "14px 16px", marginBottom: 8, width: 230,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          border: "1px solid #374151",
        }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Debug — view as
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {VIEWS.map((v) => {
              const active = currentRole === v.action || (v.action === "public" && !session);
              return (
                <button
                  key={v.action}
                  disabled={busy || active}
                  onClick={() => switchTo(v.action)}
                  style={{
                    background: active ? v.color : "#1f2937",
                    color: active ? "#fff" : "#d1d5db",
                    border: `1px solid ${active ? v.color : "#374151"}`,
                    borderRadius: 6, padding: "7px 12px",
                    cursor: active ? "default" : "pointer",
                    textAlign: "left", fontFamily: "inherit", fontSize: 12,
                    display: "flex", alignItems: "center", gap: 8,
                    opacity: busy && !active ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: active ? "#fff" : v.color, flexShrink: 0,
                  }} />
                  {v.label}
                  {active && <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.7 }}>active</span>}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #374151", fontSize: 10.5, color: "#6b7280", lineHeight: 1.5 }}>
            {session
              ? <>Flat {session.flatNo} · {session.activeRole}<br />{pathname}</>
              : <>Not logged in<br />{pathname}</>}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        title="Debug panel — switch view"
        style={{
          background: "#111827", color: "#f9fafb",
          border: "1px solid #374151", borderRadius: 8,
          padding: "7px 12px", cursor: "pointer",
          fontFamily: "inherit", fontSize: 12,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          transition: "all 0.15s",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        {open ? "Close" : "Debug"}
      </button>
    </div>
  );
}
