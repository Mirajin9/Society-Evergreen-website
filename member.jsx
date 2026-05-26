// member.jsx — Member portal screens.

// ── Member Dashboard ──────────────────────────────────────────────────────
const MemberDashboard = ({ onNav, role }) => {
  const me = CURRENT_MEMBER;
  return (
    <>
      <div className="page-head">
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: 0.05 }}>
            FLAT {me.flat} · {me.id}
          </div>
          <h1>Good morning, <em style={{ fontStyle: "italic", color: "var(--green)", fontFamily: "var(--font-display)" }}>{personFirstName(me.name)}</em>.</h1>
          <div className="sub">
            {role === "mc" && me.committee ? `Logged in as Managing Committee — ${me.committee}. ` : ""}
            You have 3 unread notices and 1 open complaint.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="bell" size={13}/> Notifications</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNav("member/complaints")}>Raise a complaint</button>
        </div>
      </div>

      <div className="page-body">
        {/* KPIs */}
        <div className="grid g4">
          <KPI label="Open complaints" value="1" sub="In progress · Lift Vendor" deltaTone="up" />
          <KPI label="Unread notices" value="3" sub="Latest: AGM Notice" />
          <KPI label="Next event" value="Jun 10" sub="Q2 maintenance dues" />
          <KPI label="Maintenance dues" value="₹ 14,820" delta="Due 10 Jun" deltaTone="down" />
        </div>

        {/* Body grid */}
        <div className="grid g-12-8" style={{ marginTop: 24 }}>
          {/* Upcoming events */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--line)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Upcoming events</h3>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>From the society calendar</div>
              </div>
              <button className="btn-link" onClick={() => onNav("member/calendar")} style={{ fontSize: 12.5, color: "var(--green)" }}>View calendar →</button>
            </div>
            {EVENTS.slice(0, 5).map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ width: 52, textAlign: "center", flexShrink: 0 }}>
                  <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit" })}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, letterSpacing: 0.08 }}>{new Date(e.date).toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{e.title}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "center" }}>
                    <CategoryPill cat={e.cat} />
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{e.time} · {e.loc}</span>
                  </div>
                </div>
                {e.docs > 0 && (
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="paperclip" size={11}/> {e.docs}
                  </div>
                )}
                {e.vis === "members" && <span className="badge badge-dot">Members</span>}
              </div>
            ))}
          </div>

          {/* Right column */}
          <div className="stack">
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Your details</h3>
              <div className="stack" style={{ fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Member ID</span><span className="mono">{me.id}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Flat</span><span>{me.flat}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Parking</span><span className="mono">{me.parking}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Status</span><StatusBadge status={me.status} /></div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} onClick={() => onNav("member/profile")}>View profile</button>
            </div>

            <div className="banner-stripe" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="bell" size={16} color="var(--green-2)" />
                <strong style={{ fontSize: 13, color: "var(--green-2)" }}>AGM reminder</strong>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--green-2)", marginTop: 4 }}>
                28th AGM on 12 July, 5:00 PM at the Community Hall. Six documents attached.
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, background: "rgba(255,255,255,0.5)" }} onClick={() => onNav("member/calendar")}>Open event</button>
            </div>
          </div>
        </div>

        {/* Latest notices + recent docs */}
        <div className="grid g2" style={{ marginTop: 24 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Recent notices</h3>
              <button className="btn-link" onClick={() => onNav("member/notices")} style={{ fontSize: 12.5, color: "var(--green)" }}>All →</button>
            </div>
            {NOTICES.slice(0, 4).map(n => (
              <div key={n.id} className="li-card" style={{ padding: "14px 22px" }}>
                <div className="date" style={{ width: 64 }}>{n.date}</div>
                <div className="body">
                  <h4 style={{ fontSize: 13.5 }}>{n.title}</h4>
                  <div style={{ marginTop: 6 }}><CategoryPill cat={n.cat} /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Recently added documents</h3>
              <button className="btn-link" onClick={() => onNav("member/documents")} style={{ fontSize: 12.5, color: "var(--green)" }}>Library →</button>
            </div>
            {DOCUMENTS.filter(d => d.vis !== "admin").slice(0, 4).map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderBottom: "1px solid var(--line)" }}>
                <Icon name="doc" size={16} color="var(--muted)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{d.title}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{d.cat} · {d.size} · {d.date}</div>
                </div>
                <button className="btn-icon"><Icon name="dl" size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Member Calendar (full month view) ────────────────────────────────────
const MemberCalendar = ({ onNav }) => {
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [filter, setFilter] = React.useState("All");
  const cats = ["All", "AGM", "MC Meeting", "Election", "Maintenance", "Payment", "Society Event"];

  return (
    <>
      <PageHead title="Calendar" sub="All society events you have access to." breadcrumb="MEMBER · CALENDAR"
        actions={<>
          <button className="btn btn-ghost btn-sm"><Icon name="dl" size={13}/> Export .ics</button>
          <button className="btn btn-ghost btn-sm">Subscribe (Google / Outlook)</button>
        </>}
      />
      <div className="page-body">
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, justifyContent: "space-between" }}>
          <div className="chips">
            {cats.map(c => <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm">Month</button>
            <button className="btn btn-ghost btn-sm" style={{ opacity: 0.55 }}>List</button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1.55fr 1fr", gap: 24, alignItems: "start" }}>
          <CalendarGrid eventsVisibility="all" onEventClick={setSelectedEvent} />
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <div className="tiny">All events</div>
            </div>
            {EVENTS.filter(e => filter === "All" || e.cat === filter).map(e => (
              <div key={e.id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", cursor: "pointer" }} onClick={() => setSelectedEvent(e)}>
                <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 70 }}>
                    {new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {e.time !== "23:59" ? e.time : "EOD"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.title}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                      <CategoryPill cat={e.cat} />
                      {e.docs > 0 && <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}><Icon name="paperclip" size={10}/> {e.docs}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!selectedEvent} title={selectedEvent?.title || ""} onClose={() => setSelectedEvent(null)}
        footer={<>
          <button className="btn btn-ghost btn-sm">Add to Google Calendar</button>
          <button className="btn btn-primary btn-sm">Set reminder</button>
        </>}>
        {selectedEvent && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <CategoryPill cat={selectedEvent.cat} />
              <StatusBadge status={selectedEvent.vis} />
            </div>
            <div className="stack" style={{ fontSize: 13.5 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <Icon name="cal" size={16} color="var(--muted)" />
                <span>{new Date(selectedEvent.date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {selectedEvent.time}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Icon name="pin" size={16} color="var(--muted)" />
                <span>{selectedEvent.loc}</span>
              </div>
            </div>
            {selectedEvent.docs > 0 && (
              <>
                <hr className="divider" style={{ margin: "20px 0" }} />
                <div className="tiny" style={{ marginBottom: 10 }}>Attached documents ({selectedEvent.docs})</div>
                <div className="stack" style={{ marginTop: 0 }}>
                  {DOCUMENTS.filter(d => d.linkedEvent === selectedEvent.id).slice(0, selectedEvent.docs).map(d => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid var(--line)", borderRadius: 8 }}>
                      <Icon name="doc" size={16} color="var(--muted)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{d.title}</div>
                        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{d.size} · {d.ver}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm"><Icon name="dl" size={12}/> PDF</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

// ── My Documents ─────────────────────────────────────────────────────────
const MemberDocs = ({ onNav, role }) => {
  const [filter, setFilter] = React.useState("All");
  const cats = ["All", "AGM", "Audit", "Annual", "MC", "Election", "Compliance", "Maintenance", "Form", "Bye-laws"];
  const visible = DOCUMENTS
    .filter(d => role === "admin" || d.vis !== "admin")
    .filter(d => filter === "All" || d.cat === filter);
  return (
    <>
      <PageHead title="My documents"
        sub="Statutory records, member-only resolutions and forms."
        breadcrumb="MEMBER · DOCUMENTS"
        actions={<button className="btn btn-ghost btn-sm"><Icon name="search" size={13}/> Search archive</button>}
      />
      <div className="page-body">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
          <div className="chips">{cats.map(c => <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="tiny">Sort by</span>
            <select className="field" style={{ width: 160, padding: "6px 10px" }}>
              <option>Newest first</option>
              <option>Oldest first</option>
              <option>Title</option>
              <option>Size</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead><tr>
              <th></th>
              <th>Document</th>
              <th>Category</th>
              <th>Date</th>
              <th>Linked event</th>
              <th>Access</th>
              <th></th>
            </tr></thead>
            <tbody>
              {visible.map(d => {
                const ev = d.linkedEvent ? EVENTS.find(e => e.id === d.linkedEvent) : null;
                return (
                  <tr key={d.id}>
                    <td><Icon name="doc" size={16} color="var(--muted)"/></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.title}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{d.id.toUpperCase()} · {d.ver} · {d.size}</div>
                    </td>
                    <td><CategoryPill cat={d.cat} /></td>
                    <td className="tabular" style={{ color: "var(--muted)", fontSize: 12.5 }}>{d.date}</td>
                    <td style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{ev ? ev.title : <span style={{ color: "var(--muted-2)" }}>—</span>}</td>
                    <td><StatusBadge status={d.vis} /></td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-ghost btn-sm"><Icon name="dl" size={12}/> PDF</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ── My Profile ───────────────────────────────────────────────────────────
const MemberProfile = ({ onNav, role }) => {
  const me = CURRENT_MEMBER;
  const [tab, setTab] = React.useState("profile");
  return (
    <>
      <PageHead title="My profile" sub="View and edit your account, contact, and preferences." breadcrumb="MEMBER · PROFILE" />
      <div className="page-body">
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 28 }}>
          {[["profile", "Profile"], ["account", "Login & email"], ["notifs", "Notifications"], ["parking", "Parking"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{
                appearance: "none", border: 0, background: "transparent", fontFamily: "inherit",
                padding: "12px 20px", cursor: "pointer", fontSize: 13.5, fontWeight: 500,
                color: tab === k ? "var(--ink)" : "var(--muted)",
                borderBottom: tab === k ? "2px solid var(--green)" : "2px solid transparent",
                marginBottom: -1,
              }}>{l}</button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="grid g-12-8" style={{ gap: 32, alignItems: "start" }}>
            <div className="card pad-lg">
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div className="av-lg" style={{ width: 80, height: 80, fontSize: 32 }}>{personInitials(me.name).toUpperCase()}</div>
                <div>
                  <div className="serif" style={{ fontSize: 32, lineHeight: 1.1 }}>{me.name}</div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{me.id} · FLAT {me.flat}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                    <StatusBadge status={me.status} />
                    <span className="badge">{me.ownership}</span>
                    {role === "mc" && me.committee && <span className="badge badge-green badge-dot">MC · {me.committee}</span>}
                  </div>
                </div>
              </div>
              <hr className="divider" style={{ margin: "24px 0" }} />
              <div className="grid g2" style={{ rowGap: 20 }}>
                <div>
                  <div className="tiny">Father / Spouse name</div>
                  <div style={{ marginTop: 6 }}>S.K. Sharma (s/o)</div>
                </div>
                <div>
                  <div className="tiny">Flat / Floor</div>
                  <div style={{ marginTop: 6 }} className="mono">Flat {me.flat} — Floor {me.floor}</div>
                </div>
                <div>
                  <div className="tiny">Date of joining</div>
                  <div style={{ marginTop: 6 }}>21 March 2005</div>
                </div>
                <div>
                  <div className="tiny">Membership type</div>
                  <div style={{ marginTop: 6 }}>Original allottee</div>
                </div>
                <div>
                  <div className="tiny">Primary email</div>
                  <div style={{ marginTop: 6 }} className="mono">{me.email}</div>
                </div>
                <div>
                  <div className="tiny">Alternate email</div>
                  <div style={{ marginTop: 6, color: "var(--muted)" }}>—</div>
                </div>
                <div>
                  <div className="tiny">Phone (primary)</div>
                  <div style={{ marginTop: 6 }} className="mono">{me.phone}</div>
                </div>
                <div>
                  <div className="tiny">Parking</div>
                  <div style={{ marginTop: 6 }} className="mono">{me.parking}</div>
                </div>
              </div>
              <hr className="divider" style={{ margin: "24px 0" }} />
              <button className="btn btn-ghost"><Icon name="edit" size={13}/> Request profile update</button>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
                Profile changes are verified by the Society Office before being applied.
              </div>
            </div>

            <div className="stack">
              <div className="card pad">
                <div className="tiny">Account health</div>
                <div className="stack" style={{ marginTop: 12, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Email verified</span><StatusBadge status="Active" /></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Phone verified</span><StatusBadge status="Active" /></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>2FA</span><span className="badge">Off</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Last sign-in</span><span className="mono" style={{ fontSize: 12 }}>Today, 9:14 AM</span></div>
                </div>
              </div>
              <div className="card pad">
                <div className="tiny">Documents on file</div>
                <div className="stack" style={{ marginTop: 12, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Original allotment letter</span>
                    <Icon name="check" size={14} color="var(--green)"/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>NOC / share certificate</span>
                    <Icon name="check" size={14} color="var(--green)"/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>ID proof (Aadhaar)</span>
                    <Icon name="check" size={14} color="var(--green)"/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Nominee declaration</span>
                    <span style={{ color: "var(--muted)" }}>Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "account" && (
          <div className="grid g2" style={{ gap: 24, maxWidth: 980 }}>
            <div className="card pad-lg">
              <h3 className="serif" style={{ fontSize: 22, fontWeight: 400, margin: "0 0 6px" }}>Change password</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 22px" }}>Used to sign in to your member portal.</p>
              <div className="stack">
                <div><label className="fl">Current password</label><input className="field" type="password" defaultValue="••••••••••" /></div>
                <div><label className="fl">New password</label><input className="field" type="password" placeholder="At least 10 characters" /></div>
                <div><label className="fl">Confirm new password</label><input className="field" type="password" /></div>
                <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Update password</button>
              </div>
            </div>
            <div className="card pad-lg">
              <h3 className="serif" style={{ fontSize: 22, fontWeight: 400, margin: "0 0 6px" }}>Update email</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 22px" }}>We'll send a verification link before the change is applied.</p>
              <div className="stack">
                <div><label className="fl">Current email</label><input className="field" defaultValue={CURRENT_MEMBER.email} disabled /></div>
                <div><label className="fl">New email</label><input className="field" placeholder="new@email.com" /></div>
                <div><label className="fl">Confirm with current password</label><input className="field" type="password" /></div>
                <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}>Send verification</button>
              </div>
            </div>
          </div>
        )}

        {tab === "notifs" && (
          <div className="card pad-lg" style={{ maxWidth: 700 }}>
            <h3 className="serif" style={{ fontSize: 22, fontWeight: 400, margin: "0 0 18px" }}>Notification preferences</h3>
            <div className="stack">
              {[
                ["AGM / SGM notices", "Required by bye-laws · cannot be disabled", true, true],
                ["Election notices", "Required by bye-laws · cannot be disabled", true, true],
                ["Maintenance shutdowns", "Email + reminder 1 day before", true, false],
                ["Payment due reminders", "Email reminder 7, 3 and 1 day before", true, false],
                ["MC meeting minutes published", "Email when new minutes are uploaded", false, false],
                ["Society events", "Concerts, festivals, RWA gatherings", true, false],
              ].map(([t, s, on, locked]) => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px dashed var(--line)" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{s}</div>
                  </div>
                  <span className={`badge ${on ? "badge-green" : ""}`}>{on ? "On" : "Off"}{locked ? " · Locked" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "parking" && (
          <div className="grid g2" style={{ maxWidth: 900, gap: 24 }}>
            <div className="card pad-lg">
              <div className="tiny">Allocated parking</div>
              <div className="serif" style={{ fontSize: 56, lineHeight: 1, marginTop: 12 }}>{me.parking}</div>
              <div style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-2)" }}>
                Covered, basement level 1 · Tower entry
              </div>
              <hr className="divider" style={{ margin: "20px 0" }} />
              <div className="stack" style={{ fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Vehicle</span><span className="mono">{me.vehicleNumber || "Not on file"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>RFID tag</span><span className="mono">EA-RF-{String(me.flat).padStart(4,"0")}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Allocation since</span><span>21 March 2005</span></div>
              </div>
            </div>
            <PH label="parking_map_basement.png" h={320} />
          </div>
        )}
      </div>
    </>
  );
};

// ── Notices (member) ─────────────────────────────────────────────────────
const MemberNotices = ({ onNav }) => {
  const [filter, setFilter] = React.useState("All");
  const cats = ["All", "AGM", "Election", "Maintenance", "Payment", "Compliance"];
  const visible = NOTICES.filter(n => filter === "All" || n.cat === filter);
  return (
    <>
      <PageHead title="Notices &amp; circulars" sub="Includes member-only notices not visible to the public." breadcrumb="MEMBER · NOTICES" />
      <div className="page-body">
        <div className="chips" style={{ marginBottom: 20 }}>
          {cats.map(c => <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          {visible.map(n => (
            <div key={n.id} className="li-card">
              <div className="date">{n.date}</div>
              <div className="body">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                <div className="meta">
                  <CategoryPill cat={n.cat} />
                  {n.pinned && <span className="badge badge-amber badge-dot">Pinned</span>}
                  <StatusBadge status={n.vis} />
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted-2)" }}>{n.id.toUpperCase()}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm"><Icon name="dl" size={12}/> PDF</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ── Meeting Records ──────────────────────────────────────────────────────
const MemberMeetings = ({ onNav }) => {
  const meetings = [
    { id: "M-2026-04", type: "MC Meeting", date: "Apr 12, 2026", title: "Apr MC Meeting — Lift modernisation approval", attendees: 6, docs: 3 },
    { id: "M-2026-03", type: "MC Meeting", date: "Mar 15, 2026", title: "Mar MC Meeting — Budget review", attendees: 7, docs: 2 },
    { id: "M-2025-AGM", type: "AGM", date: "Jul 13, 2025", title: "27th Annual General Meeting", attendees: 184, docs: 6 },
    { id: "M-2025-SGM", type: "SGM", date: "Oct 22, 2025", title: "SGM — Bye-laws amendment", attendees: 156, docs: 4 },
    { id: "M-2026-02", type: "MC Meeting", date: "Feb 18, 2026", title: "Feb MC Meeting — Vendor onboarding", attendees: 5, docs: 2 },
    { id: "M-2026-01", type: "MC Meeting", date: "Jan 14, 2026", title: "Jan MC Meeting — Annual planning", attendees: 7, docs: 3 },
  ];
  return (
    <>
      <PageHead title="Meeting records" sub="AGM, SGM, and MC meeting minutes with attached resolutions." breadcrumb="MEMBER · MEETINGS" />
      <div className="page-body">
        <div className="grid g2">
          {meetings.map(m => (
            <div key={m.id} className="card pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <CategoryPill cat={m.type === "MC Meeting" ? "MC Meeting" : m.type === "AGM" ? "AGM" : "SGM"} />
                <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{m.id}</span>
              </div>
              <div className="serif" style={{ fontSize: 22, marginTop: 14, lineHeight: 1.2 }}>{m.title}</div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>{m.date} · {m.attendees} attendees</div>
              <hr className="divider" style={{ margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                  <Icon name="paperclip" size={12}/> {m.docs} documents attached
                </span>
                <button className="btn btn-ghost btn-sm">Open record <Icon name="arr_r" size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ── Complaints (member) ──────────────────────────────────────────────────
const MemberComplaints = ({ onNav }) => {
  const [show, setShow] = React.useState(false);
  const my = COMPLAINTS.filter(c => c.flat === CURRENT_MEMBER.flat).concat(COMPLAINTS.slice(0, 2));
  return (
    <>
      <PageHead title="Complaints &amp; requests" sub="Track open issues and submit new requests." breadcrumb="MEMBER · COMPLAINTS"
        actions={<button className="btn btn-primary btn-sm" onClick={() => setShow(true)}><Icon name="plus" size={13} color="#fff"/> New complaint</button>}
      />
      <div className="page-body">
        <div className="grid g3" style={{ marginBottom: 24 }}>
          <KPI label="Open" value="1" sub="In progress" />
          <KPI label="Resolved (90 days)" value="3" delta="↑ 1 vs prev" deltaTone="up" />
          <KPI label="Avg. resolution time" value="2.4 days" sub="Society average" />
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>My complaints</h3>
            <div className="chips">
              <button className="chip on">All</button>
              <button className="chip">Open</button>
              <button className="chip">In progress</button>
              <button className="chip">Resolved</button>
            </div>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>Ticket</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Filed</th>
            </tr></thead>
            <tbody>
              {my.map((c, i) => (
                <tr key={c.id + i}>
                  <td className="mono" style={{ fontSize: 11.5 }}>{c.id}</td>
                  <td><div style={{ fontWeight: 500 }}>{c.title}</div></td>
                  <td><CategoryPill cat={c.cat} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.assignee}</td>
                  <td className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conversation preview */}
        <div className="card pad-lg" style={{ marginTop: 24 }}>
          <div className="tiny">Latest update · EA-CMP-2026-038</div>
          <div className="serif" style={{ fontSize: 24, lineHeight: 1.2, marginTop: 8, marginBottom: 18 }}>Lift makes scraping sound on 4th floor</div>
          <div className="stack">
            <div className="thread-msg">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontSize: 13 }}>Saurabh Sharma (you)</strong>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>May 12, 9:18 AM</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>The lift between floors 3 and 4 makes a scraping sound and stops briefly. Happens 4–5 times a day.</p>
            </div>
            <div className="thread-msg admin">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontSize: 13 }}>Society Office</strong>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>May 13, 11:22 AM</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>Vendor inspection scheduled for May 16, 11:00 AM. We'll keep the lift offline for 2 hours during inspection. Apologies for the disruption.</p>
            </div>
            <div className="thread-msg admin">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong style={{ fontSize: 13 }}>Lift Vendor (Schindler)</strong>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>May 16, 1:48 PM</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>Door guide rollers worn out on cabin floor 3. Part ordered, ETA 3 working days. Lift is operational; sound will continue until replacement.</p>
            </div>
          </div>
          <hr className="divider" style={{ margin: "20px 0" }} />
          <textarea className="field" placeholder="Add a reply…"></textarea>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="paperclip" size={12}/> Attach photo</button>
            <button className="btn btn-primary btn-sm">Post reply</button>
          </div>
        </div>
      </div>

      <Modal open={show} title="New complaint or request" onClose={() => setShow(false)}
        footer={<>
          <button className="btn btn-ghost btn-sm" onClick={() => setShow(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShow(false)}>Submit</button>
        </>}>
        <div className="stack">
          <div className="grid g2" style={{ gap: 12 }}>
            <div><label className="fl">Category</label>
              <select className="field"><option>Maintenance</option><option>Security</option><option>Parking</option><option>Cleanliness</option><option>Noise</option><option>Other</option></select>
            </div>
            <div><label className="fl">Priority</label>
              <select className="field"><option>Low</option><option>Medium</option><option>High</option></select>
            </div>
          </div>
          <div><label className="fl">Title</label><input className="field" placeholder="Brief summary of the issue" /></div>
          <div><label className="fl">Description</label><textarea className="field" rows="5" placeholder="What's happening, where, how often, any time-sensitive concerns…"></textarea></div>
          <div><label className="fl">Attach photo (optional)</label>
            <div style={{ display: "flex", gap: 10, padding: 14, border: "1px dashed var(--line-2)", borderRadius: 8, alignItems: "center", color: "var(--muted)", fontSize: 13 }}>
              <Icon name="upload" size={14}/> Drop a photo or click to browse · JPG, PNG up to 5 MB
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ── Settings (placeholder) ───────────────────────────────────────────────
const MemberSettings = () => (
  <>
    <PageHead title="Account settings" sub="Configure your portal experience." breadcrumb="MEMBER · SETTINGS" />
    <div className="page-body">
      <div className="card pad-lg" style={{ maxWidth: 700 }}>
        <div className="stack">
          {[
            ["Time zone", "Asia/Kolkata (IST · UTC+05:30)"],
            ["Language", "English (Indian)"],
            ["Date format", "DD MMM YYYY"],
            ["Currency", "Indian Rupee — ₹"],
            ["Session timeout", "30 minutes"],
            ["Marketing", "Off"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px dashed var(--line)" }}>
              <span style={{ color: "var(--muted)" }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

Object.assign(window, {
  MemberDashboard, MemberCalendar, MemberDocs, MemberProfile, MemberNotices, MemberMeetings, MemberComplaints, MemberSettings,
});
