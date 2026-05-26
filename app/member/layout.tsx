import Link from "next/link";
import { AuthGate } from "@/app/components/auth-gate";
import { Icon, Logo } from "@/app/components/ui";
import { PortalHeader } from "@/app/components/portal-header";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate role="member">
      <div className="shell">
        <aside className="sidebar">
          <div className="sb-brand"><Link href="/member/dashboard"><Logo /></Link></div>
          <div className="sb-group">Workspace</div>
          <Link className="sb-link" href="/member/dashboard"><span className="ic"><Icon name="home" /></span><span>Dashboard</span></Link>
          <Link className="sb-link" href="/member/calendar"><span className="ic"><Icon name="cal" /></span><span>Calendar</span></Link>
          <Link className="sb-link" href="/member/documents"><span className="ic"><Icon name="doc" /></span><span>Documents</span></Link>
          <Link className="sb-link" href="/member/complaints"><span className="ic"><Icon name="inbox" /></span><span>Complaints</span></Link>
          <div className="sb-group">Account</div>
          <Link className="sb-link" href="/member/settings"><span className="ic"><Icon name="user" /></span><span>Settings</span></Link>
          <div className="sb-foot">
            <div className="sb-avatar">ME</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Member portal</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Signed-in member</div>
            </div>
          </div>
        </aside>
        <main className="main">
          <PortalHeader label="Member portal" />
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
