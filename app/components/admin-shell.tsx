"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, PubLogo } from "@/app/components/ui";
import { logoutLocal } from "@/app/lib/local-store";

const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "home" },
  { href: "/admin/members", label: "Members", icon: "users" },
  { href: "/admin/data-completion", label: "Data Completion", icon: "chart" },
  { href: "/admin/committee", label: "Committee", icon: "shield" },
  { href: "/admin/calendar", label: "Calendar & Events", icon: "cal" },
  { href: "/admin/records", label: "Records", icon: "folder" },
  { href: "/admin/complaints", label: "Complaints", icon: "inbox" },
  { href: "/admin/society", label: "Society Profile", icon: "doc" },
  { href: "/admin/database", label: "Database", icon: "doc" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    logoutLocal();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="app page-shell">
      <div className="pub-topbar">
        <Link href="/admin/dashboard" style={{ textDecoration: "none", flexShrink: 0 }}>
          <PubLogo />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Console</span>
          <button onClick={logout} className="pub-nav-login" style={{ background: "rgba(255,255,255,0.14)" }}>
            <Icon name="lock" size={13} color="#fff" /> Logout
          </button>
        </div>
      </div>

      <nav className="portal-subnav">
        {ADMIN_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href} className={`portal-subnav-link${active ? " active" : ""}`}>
              <Icon name={link.icon} size={14} color={active ? "var(--navy)" : "var(--muted)"} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <main className="main">{children}</main>
    </div>
  );
}
