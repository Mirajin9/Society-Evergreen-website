"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarMonth } from "@/app/components/calendar-month";
import { PageHead, StatusBadge } from "@/app/components/ui";
import { addEvent, ensureLocalStore, type LocalEvent, type LocalVisibility } from "@/app/lib/local-store";

export function AdminCalendarClient() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    ensureLocalStore().then((store) => setEvents(store.events));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const created = await addEvent({
      title: String(form.get("title") || ""),
      date: String(form.get("date") || ""),
      startTime: String(form.get("startTime") || ""),
      endTime: String(form.get("endTime") || ""),
      location: String(form.get("location") || ""),
      description: String(form.get("description") || ""),
      visibility: String(form.get("visibility") || "members") as LocalVisibility,
      reminder: form.get("reminder") === "on"
    });
    setEvents((current) => [...current, created]);
    setNotice("Event saved locally.");
    event.currentTarget.reset();
  }

  return (
    <>
      <PageHead title="Calendar" sub="Create events and choose what is visible publicly." breadcrumb="ADMIN - CALENDAR" />
      <div className="page-body">
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        <div className="grid" style={{ gridTemplateColumns: "1.35fr 1fr", gap: 24, alignItems: "start" }}>
          <CalendarMonth events={events} title="Admin calendar" />
          <form className="card pad-lg stack" onSubmit={save}>
            <Field name="title" label="Event title" required />
            <div className="grid g2">
              <Field name="date" label="Event date" type="date" required />
              <Field name="startTime" label="Start time" type="time" required />
              <Field name="endTime" label="End time" type="time" />
              <Field name="location" label="Location" />
            </div>
            <div>
              <label className="fl">Visibility</label>
              <select className="field" name="visibility" defaultValue="members">
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="committee">Committee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div><label className="fl">Short description</label><textarea className="field" name="description" /></div>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input name="reminder" type="checkbox" /> Send reminder later</label>
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Create event</button>
          </form>
        </div>
        <div className="card table-wrap" style={{ marginTop: 24 }}>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Title</th><th>Visibility</th><th>Reminder</th></tr></thead>
            <tbody>{events.map((item) => <tr key={item.id}><td className="mono">{item.date}</td><td>{item.title}</td><td><StatusBadge status={item.visibility} /></td><td>{item.reminder ? "Yes" : "No"}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <div><label className="fl">{label}</label><input className="field" name={name} type={type} required={required} /></div>;
}
