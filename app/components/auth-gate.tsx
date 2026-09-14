"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { refreshServerSession, type LocalRole } from "@/app/lib/local-store";

export function AuthGate({ children, role }: { children: React.ReactNode; role?: LocalRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    refreshServerSession().then((session) => {
      if (cancelled) return;
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (session.mustChangePassword) {
        router.replace("/change-password");
        return;
      }
      if (role && !session.roles.includes(role)) {
        // Staff logins are admin-only, so send them to the console rather than looping.
        router.replace(session.roles.includes("admin") ? "/admin/dashboard" : "/member/dashboard");
        return;
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router, role, pathname]);

  if (!ready) return <div className="loading-pad">Checking session...</div>;
  return <>{children}</>;
}
