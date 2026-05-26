"use client";

import { useEffect, useState } from "react";
import { CalendarMonth } from "@/app/components/calendar-month";
import { PageHead, StatusBadge } from "@/app/components/ui";
import { ensureLocalStore, type LocalEvent } from "@/app/lib/local-store";

export function MemberCalendarClient() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  useEffect(() => {
    ensureLocalStore().then((store) => setEvents(store.events.filter((event) => event.visibility !== "admin")));
  }, []);
  return (
    <>
      <PageHead title="Calendar" sub="Public and member-visible society events." breadcrumb="MEMBER - CALENDAR" />
      <div className="page-body">
        <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }}>
          <CalendarMonth events={events} title="Member calendar" />
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <div className="tiny">Event list</div>
            </div>
            {events.map((event) => (
              <div key={event.id} className="li-card">
                <div className="date">{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                <div className="body">
                  <h4>{event.title}</h4>
                  <p>{event.startTime} - {event.location}</p>
                  <div className="meta"><StatusBadge status={event.visibility} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
