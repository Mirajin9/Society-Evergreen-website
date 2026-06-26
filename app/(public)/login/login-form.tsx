"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { PubLogo, Icon } from "@/app/components/ui";
import { loginLocal } from "@/app/lib/local-store";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get("next") || "/member/dashboard";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      const session = await loginLocal(username, password);
      router.push(session.activeRole === "admin" ? "/admin/database" : nextUrl);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="otp-shell">
      <div className="otp-art">
        <Link href="/" style={{ position: "absolute", top: 40, left: 40 }}>
          <PubLogo />
        </Link>
        <h2>Member<br /><em>Portal</em></h2>
        <p>
          Initial rollout uses username and password login. OTP login will be enabled after the site is live on the society domain.
        </p>
      </div>

      <div className="otp-form-wrap">
        <form className="otp-form" onSubmit={handleLogin}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 12 }}>
            Evergreen Apartment
          </div>
          <h1>Member Login</h1>
          <p className="otp-sub">
            Members can use their registered mobile number as username and membership number as password.
            MC accounts use the separate username and password issued by the society office.
          </p>

          {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <label className="fl">Username</label>
            <input
              className="field field-lg"
              value={username}
              onChange={(event) => setUsername(event.target.value.trim())}
              placeholder="Registered mobile number or MC username"
              autoComplete="username"
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="fl">Password</label>
            <input
              className="field field-lg"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Membership number or issued password"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="otp-verify-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16, lineHeight: 1.6 }}>
            After signing in, members can change their username and password from My Profile.
            For account recovery, contact the MC or society office.
          </p>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13 }}>
            <Link href="/" style={{ color: "var(--navy)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="arr_l" size={13} color="var(--navy)" /> Back to public site
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
