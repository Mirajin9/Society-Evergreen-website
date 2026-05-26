import Link from "next/link";
import { AuthGate } from "@/app/components/auth-gate";
import { Logo, Icon } from "@/app/components/ui";
import { PortalHeader } from "@/app/components/portal-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate role="admin">
      <div className="shell">
        <aside className="sidebar">
          <div className="sb-brand"><Link href="/admin/database"><Logo /></Link></div>
          <div className="sb-group">Office</div>
          <Link className="sb-link" href="/admin/database"><span className="ic"><Icon name="chart" /></span><span>Database</span></Link>
          <Link className="sb-link" href="/admin/society"><span className="ic"><Icon name="home" /></span><span>Society Profile</span></Link>
          <Link className="sb-link" href="/admin/members"><span className="ic"><Icon name="users" /></span><span>Members</span></Link>
          <Link className="sb-link" href="/admin/committee"><span className="ic"><Icon name="users" /></span><span>Committee</span></Link>
          <div className="sb-group">Records</div>
          <Link className="sb-link" href="/admin/calendar"><span className="ic"><Icon name="cal" /></span><span>Calendar</span></Link>
          <Link className="sb-link" href="/admin/records"><span className="ic"><Icon name="folder" /></span><span>Records Library</span></Link>
          <Link className="sb-link" href="/admin/complaints"><span className="ic"><Icon name="inbox" /></span><span>Complaints</span></Link>
          <div className="sb-foot">
            <div className="sb-avatar">AD</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Society Office</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Admin console</div>
            </div>
          </div>
        </aside>
        <main className="main">
          <PortalHeader label="Admin console" />
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
