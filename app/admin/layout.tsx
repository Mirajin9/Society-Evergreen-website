import { AuthGate } from "@/app/components/auth-gate";
import { AdminShell } from "@/app/components/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate role="admin">
      <AdminShell>{children}</AdminShell>
    </AuthGate>
  );
}
