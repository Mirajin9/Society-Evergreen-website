import { AuthGate } from "@/app/components/auth-gate";
import { PortalTopbar, type PortalLink } from "@/app/components/portal-topbar";
import { PublicFooter } from "@/app/components/ui";

const MEMBER_LINKS: PortalLink[] = [
  { href: "/member/dashboard", label: "Home" },
  { href: "/member/notices", label: "Notices" },
  { href: "/member/agm", label: "AGM" },
  { href: "/member/documents", label: "Documents" },
  { href: "/member/profile", label: "My Profile" }
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate role="member">
      <div className="app page-shell">
        <PortalTopbar links={MEMBER_LINKS} homeHref="/member/dashboard" />
        <main className="main">{children}</main>
        <PublicFooter />
      </div>
    </AuthGate>
  );
}
