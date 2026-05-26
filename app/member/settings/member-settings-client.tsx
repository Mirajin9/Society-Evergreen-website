"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHead } from "@/app/components/ui";
import { changeLocalCredentials, getSession, type LocalSession } from "@/app/lib/local-store";

export function MemberSettingsClient() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const next = await changeLocalCredentials({
        username: String(form.get("username") || ""),
        password: String(form.get("password") || "")
      });
      setSession(next);
      setNotice("Username and password updated locally.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <PageHead title="Settings" sub="Change your temporary local username and password." breadcrumb="MEMBER - SETTINGS" />
      <div className="page-body">
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
        <form className="card pad-lg stack" onSubmit={save} style={{ maxWidth: 520 }}>
          <div>
            <label className="fl">Username</label>
            <input className="field" name="username" defaultValue={session?.username || ""} />
          </div>
          <div>
            <label className="fl">New password</label>
            <input className="field" name="password" type="password" minLength={6} required placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Save credentials</button>
        </form>
      </div>
    </>
  );
}
