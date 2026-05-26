"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, StatusBadge } from "./ui";
import type { LocalEvent } from "@/app/lib/local-store";

export function CalendarMonth({ events, title = "Calendar" }: { events: LocalEvent[]; title?: string }) {
  const initialMonth = useMemo(() => {
    const firstEvent = events[0]?.date;
    return firstEvent ? firstEvent.slice(0, 7) : new Date().toISOString().slice(0, 7);
  }, [events]);
  const [month, setMonth] = useState(initialMonth);
  const cells = useMemo(() => buildMonth(month), [month]);
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  useEffect(() => {
    if (events[0]?.date) setMonth(events[0].date.slice(0, 7));
  }, [events]);

  function shift(delta: number) {
    const date = new Date(`${month}-01T00:00:00`);
    date.setMonth(date.getMonth() + delta);
    setMonth(date.toISOString().slice(0, 7));
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div className="tiny">{title}</div>
          <h3 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 500 }}>{monthLabel}</h3>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-icon" onClick={() => shift(-1)} aria-label="Previous month"><Icon name="arr_l" size={14} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMonth(new Date().toISOString().slice(0, 7))}>Today</button>
          <button className="btn-icon" onClick={() => shift(1)} aria-label="Next month"><Icon name="arr_r" size={14} /></button>
        </div>
      </div>
      <div className="cal-grid" style={{ border: 0, borderRadius: 0 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div className="cal-head" key={day}>{day}</div>)}
        {cells.map((cell) => {
          const dayEvents = events.filter((event) => event.date === cell.iso);
          return (
            <div className={`cal-cell ${cell.inMonth ? "" : "out"} ${cell.iso === new Date().toISOString().slice(0, 10) ? "today" : ""}`} key={cell.iso}>
              <span className="dn">{cell.day}</span>
              {dayEvents.map((event) => (
                <div className={`cal-event ${event.visibility}`} key={event.id} title={`${event.title} - ${event.startTime}`}>
                  {event.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--line)" }}>
        {Array.from(new Set(events.map((event) => event.visibility))).map((visibility) => <StatusBadge key={visibility} status={visibility} />)}
      </div>
    </div>
  );
}

function buildMonth(month: string) {
  const start = new Date(`${month}-01T00:00:00`);
  const first = new Date(start);
  first.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return {
      iso: date.toISOString().slice(0, 10),
      day: date.getDate(),
      inMonth: date.getMonth() === start.getMonth()
    };
  });
}
