"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PubLogo, Icon } from "@/app/components/ui";
import {
  changePassword,
  logoutLocal,
  refreshServerSession,
  safeNextPath,
  type LocalSession
} from "@/app/lib/local-store";

export function ChangePasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [session, setSession] = useState<LocalSession | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshServerSession().then((current) => {
      if (!current) router.replace("/login?next=/change-password");
      else setSession(current);
    });
  }, [router]);

  if (!session) return <div className="loading-pad">Checking session...</div>;

  const forced = !!session.mustChangePassword;
  const home = session.roles.includes("admin") ? "/admin/dashboard" : "/member/dashboard";
  const destination = safeNextPath(params.get("next"), home);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  function signOut() {
    logoutLocal();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="otp-shell">
      <div className="otp-art">
        <Link href="/" style={{ position: "absolute", top: 40, left: 40 }}>
          <PubLogo />
        </Link>
        <h2>Secure your<br /><em>Account</em></h2>
        <p>
          Choose a password only you know. The MC and society office will never ask you for it.
        </p>
      </div>

      <div className="otp-form-wrap">
        <form className="otp-form" onSubmit={handleSubmit}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 12 }}>
            Evergreen Apartment
          </div>
          <h1>{forced ? "Set a new password" : "Change password"}</h1>
          <p className="otp-sub">
            {forced
              ? "For your security, replace the password you were given before continuing."
              : <>Signed in as <span className="mono">{session.username}</span>.</>}
          </p>

          {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <label className="fl">{forced ? "Password you were given" : "Current password"}</label>
            <input
              className="field field-lg"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="fl">New password</label>
            <input
              className="field field-lg"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="fl">Confirm new password</label>
            <input
              className="field field-lg"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button className="otp-verify-btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save new password"}
          </button>

          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16, lineHeight: 1.6 }}>
            Use at least 8 characters, and not only numbers. Changing your password signs you out on other devices.
          </p>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13 }}>
            {forced ? (
              <button
                type="button"
                onClick={signOut}
                style={{ color: "var(--navy)", background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="lock" size={13} color="var(--navy)" /> Sign out
              </button>
            ) : (
              <Link href={destination} style={{ color: "var(--navy)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="arr_l" size={13} color="var(--navy)" /> Back
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
