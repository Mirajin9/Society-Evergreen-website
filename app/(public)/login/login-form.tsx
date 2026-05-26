"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/app/components/ui";
import { loginLocal } from "@/app/lib/local-store";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("111");
  const [password, setPassword] = useState("admin4321");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await loginLocal(username, password);
      router.push(session.activeRole === "admin" ? "/admin/database" : "/member/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-art">
        <div style={{ padding: 40 }}><Link href="/"><Logo size="md" /></Link></div>
        <div style={{ position: "absolute", left: 40, bottom: 40, maxWidth: 440 }}>
          <div className="eyebrow">Member access</div>
          <h1 className="serif" style={{ fontSize: 54, lineHeight: 1, margin: 0 }}>Sign in with your flat number.</h1>
          <p style={{ color: "var(--muted)", maxWidth: 360 }}>Temporary testing credentials are enabled while the production database is being prepared.</p>
        </div>
      </div>
      <div className="login-form-wrap">
        <form className="login-form stack" onSubmit={submit}>
          <div>
            <div className="eyebrow">Evergreen Apartment</div>
            <h1 className="serif" style={{ fontSize: 42, margin: 0, lineHeight: 1 }}>Member login</h1>
            <p className="auth-note">Use flat number as username. Default member password is admin123. Test admin: 111 / admin4321.</p>
          </div>
          {error && <div className="error-box">{error}</div>}
          <div>
            <label className="fl">Username / flat number</label>
            <input className="field field-lg" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <label className="fl">Password</label>
            <input className="field field-lg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <Link className="btn btn-ghost" href="/" style={{ justifyContent: "center" }}>Back to public site</Link>
        </form>
      </div>
    </div>
  );
}
