"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, type LocalRole } from "@/app/lib/local-store";

export function AuthGate({ children, role }: { children: React.ReactNode; role?: LocalRole }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (role && !session.roles.includes(role)) {
      router.replace("/member/dashboard");
      return;
    }
    setReady(true);
  }, [router, role]);

  if (!ready) return <div className="loading-pad">Checking session...</div>;
  return <>{children}</>;
}
