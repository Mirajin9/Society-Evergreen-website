"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHead } from "@/app/components/ui";
import { ensureLocalStore, updateSociety, type LocalStore } from "@/app/lib/local-store";

export function AdminSocietyClient() {
  const [society, setSociety] = useState<LocalStore["society"] | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    ensureLocalStore().then((store) => setSociety(store.society));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      name: String(form.get("name") || ""),
      registrationNo: String(form.get("registrationNo") || ""),
      address: String(form.get("address") || ""),
      officeTimings: String(form.get("officeTimings") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      preferredDomain: String(form.get("preferredDomain") || "")
    };
    await updateSociety(next);
    setSociety(next);
    setNotice("Society profile saved locally.");
  }

  if (!society) return <div className="loading-pad">Loading society profile...</div>;

  return (
    <>
      <PageHead title="Society Profile" sub="Basic information shown on the public website." breadcrumb="ADMIN - SOCIETY" />
      <div className="page-body">
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        <form className="card pad-lg stack" onSubmit={save}>
          <div className="grid g2">
            <Field name="name" label="Full registered name" value={society.name} />
            <Field name="registrationNo" label="Registration number" value={society.registrationNo} />
            <Field name="email" label="Official email ID" value={society.email} type="email" />
            <Field name="phone" label="Official phone/contact number" value={society.phone} />
            <Field name="officeTimings" label="Society office timings" value={society.officeTimings} />
            <Field name="preferredDomain" label="Preferred domain name" value={society.preferredDomain} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="fl">Complete registered office address</label>
              <textarea className="field" name="address" defaultValue={society.address} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Save profile</button>
        </form>
      </div>
    </>
  );
}

function Field({ name, label, value, type = "text" }: { name: string; label: string; value: string; type?: string }) {
  return <div><label className="fl">{label}</label><input className="field" name={name} type={type} defaultValue={value} /></div>;
}
