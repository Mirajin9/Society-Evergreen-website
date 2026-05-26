import { PublicFooter, PublicTopbar } from "@/app/components/ui";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app page-shell">
      <PublicTopbar />
      <main className="main">{children}</main>
      <PublicFooter />
    </div>
  );
}
