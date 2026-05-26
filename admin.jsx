// admin.jsx — Admin panel screens.

// ── Admin Dashboard ──────────────────────────────────────────────────────
const AdminDashboard = ({ onNav }) => {
  const dc = DATA_COMPLETION;
  const overallPct = Math.round((dc.fullProfiles / dc.total) * 100);
  return (
  <>
    <PageHead
      title="Society overview"
      sub={`Office Dashboard · 23 May 2026 · ${SOCIETY.name}`}
      breadcrumb="ADMIN · OVERVIEW"
      actions={<>
        <button className="btn btn-ghost btn-sm" onClick={() => onNav("admin/data")}><Icon name="upload" size={13}/> Complete member data</button>
        <button className="btn btn-primary btn-sm" onClick={() => onNav("admin/calendar")}><Icon name="plus" size={13} color="#fff"/> New event</button>
      </>}
    />
    <div className="page-body">
      {/* Top KPIs */}
      <div className="grid g4">
        <KPI label="Total flats" value={SOCIETY.flats} sub={`Single building · ${SOCIETY.floors} floors`} />
        <KPI label="Active members" value={dc.total - dc.deceased} sub={`${dc.deceased} deceased / vacant`} />
        <KPI label="Logins enabled" value={dc.loginEnabled} delta={`${Math.round(dc.loginEnabled / dc.total * 100)}%`} deltaTone="up" />
        <KPI label="AGM countdown" value="50 days" sub="Reminders queued" />
      </div>

      {/* Data completion banner — central call-to-action */}
      <div className="card pad-lg" style={{ marginTop: 24, background: "var(--panel)", borderColor: "var(--moss)" }}>
        <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <div className="eyebrow" style={{ color: "var(--green-2)" }}>Data quality</div>
            <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, margin: "8px 0 8px" }}>Complete the member database.</h3>
            <p style={{ color: "var(--ink-2)", fontSize: 13.5, margin: 0, maxWidth: 540 }}>
              You have <strong>{dc.fullProfiles} of {dc.total}</strong> profiles fully populated. {dc.noEmail} members have no email on file —
              they cannot receive notices or login invites until added.
            </p>
            <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.6)", overflow: "hidden", position: "relative", maxWidth: 420 }}>
                <div style={{ position: "absolute", inset: 0, width: `${overallPct}%`, background: "var(--green)" }}/>
              </div>
              <span className="mono tabular" style={{ fontSize: 12, color: "var(--green-2)", fontWeight: 500 }}>{overallPct}%</span>
            </div>
            <button className="btn btn-green" style={{ marginTop: 20 }} onClick={() => onNav("admin/data")}>
              Go to Data Completion <Icon name="arr_r" size={12} color="#fff"/>
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 20, flex: "1 1 320px" }}>
            {dc.byField.map(f => {
              const pct = Math.round(f.filled / dc.total * 100);
              return (
                <div key={f.key}>
                  <div className="tiny">{f.label}</div>
                  <div className="serif" style={{ fontSize: 26, lineHeight: 1, marginTop: 8 }}>{f.filled}<span style={{ color: "var(--muted-2)", fontSize: 16 }}> / {dc.total}</span></div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.6)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: pct > 75 ? "var(--green)" : pct > 40 ? "var(--gold)" : "var(--rust)" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compliance + queue */}
      <div className="grid g-12-8" style={{ marginTop: 24 }}>
        <div className="card pad-lg">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>RCS compliance status</h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>FY 2025-26</span>
          </div>
          <div className="stack">
            {[
              ["Annual Return (Form-A) filed", "Apr 28, 2026", "Active"],
              ["Statutory Audit Report filed", "Apr 28, 2026", "Active"],
              ["AGM held in last 6 months", "Jul 12, 2026 (scheduled)", "Pending"],
              ["MC composition reported", "Aug 2024", "Active"],
              ["Bye-laws on file (current)", "Jan 15, 2023 · v3", "Active"],
              ["Website &amp; member access", "Audited Mar 4, 2026", "Active"],
              ["Members' contact data masking", "Verified", "Active"],
            ].map(([k, v, s], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr auto", gap: 16, padding: "10px 0", borderBottom: "1px dashed var(--line)", alignItems: "center" }}>
                <span style={{ fontSize: 13.5 }} dangerouslySetInnerHTML={{ __html: k }}/>
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{v}</span>
                <StatusBadge status={s} />
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card pad">
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Reminder queue</h3>
            <div className="stack" style={{ marginTop: 14 }}>
              {[
                { t: "AGM · 7-day reminder", r: `${dc.loginEnabled} members`, when: "Jul 5, 9:00 AM" },
                { t: "AGM · 1-day reminder", r: `${dc.loginEnabled} members`, when: "Jul 11, 6:00 PM" },
                { t: "Q2 dues · 3-day", r: "98 not paid", when: "Jun 7, 10:00 AM" },
                { t: "Lift Phase-1 · 1-day", r: "All members", when: "Jun 1, 7:00 PM" },
              ].map(r => (
                <div key={r.t} style={{ padding: "10px 0", borderBottom: "1px dashed var(--line)" }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.t}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                    {r.r} · scheduled {r.when}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>Manage reminders</button>
          </div>

          <div className="card pad">
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Login setup</h3>
            <div style={{ marginTop: 16, position: "relative", height: 10, borderRadius: 5, background: "var(--panel)", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, width: `${Math.round(dc.loginEnabled / dc.total * 100)}%`, background: "var(--green)" }}/>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
              <span style={{ fontSize: 12.5 }}><strong>{dc.loginEnabled}</strong> activated</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{Math.round(dc.loginEnabled / dc.total * 100)}% of {dc.total}</span>
            </div>
            <div className="stack" style={{ marginTop: 12, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Awaiting first login</span><span className="mono">{dc.loginPending}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>No email on file</span><span className="mono">{dc.noEmail}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Not yet invited</span><span className="mono">{dc.loginNotInvited}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity + complaints */}
      <div className="grid g2" style={{ marginTop: 24 }}>
        <div className="card pad-lg">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Recent activity</h3>
            <button className="btn-link" onClick={() => onNav("admin/activity")} style={{ fontSize: 12.5, color: "var(--green)" }}>All logs →</button>
          </div>
          {ACTIVITY.slice(0, 7).map((a, i) => (
            <div key={i} className="log-row">
              <span className="t">{a.t}</span>
              <span><strong>{a.who}</strong> <span style={{ color: "var(--muted)" }}>{a.action.toLowerCase()}</span> <span>{a.target}</span></span>
              <Icon name="arr_r" size={12} color="var(--muted-2)" />
            </div>
          ))}
        </div>
        <div className="card pad-lg">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Open complaints</h3>
            <button className="btn-link" onClick={() => onNav("admin/complaints")} style={{ fontSize: 12.5, color: "var(--green)" }}>Manage →</button>
          </div>
          <div className="stack">
            {COMPLAINTS.filter(c => c.status !== "Resolved").slice(0, 4).map(c => (
              <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px dashed var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.title}</div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  {c.id} · {c.by} (Flat {c.flat}) · {c.assignee}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
  );
};

// ── Member Management ────────────────────────────────────────────────────
const AdminMembers = ({ onNav }) => {
  const [show, setShow] = React.useState(false);
  const [filter, setFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState(null);

  const filters = ["All", "Has email", "Missing email", "Missing phone", "Logins enabled", "Pending invite", "Deceased"];
  let visible = MEMBERS;
  if (filter === "Has email") visible = visible.filter(m => m.email);
  if (filter === "Missing email") visible = visible.filter(m => !m.email && !m.deceased);
  if (filter === "Missing phone") visible = visible.filter(m => !m.phone && !m.deceased);
  if (filter === "Logins enabled") visible = visible.filter(m => m.login === "Enabled");
  if (filter === "Pending invite") visible = visible.filter(m => m.login === "Pending");
  if (filter === "Deceased") visible = visible.filter(m => m.deceased);
  if (search) {
    const s = search.toLowerCase();
    visible = visible.filter(m =>
      m.name.toLowerCase().includes(s) ||
      String(m.flat).includes(s) ||
      m.id.toLowerCase().includes(s) ||
      (m.membership || "").includes(s)
    );
  }

  return (
    <>
      <PageHead
        title="Members"
        sub={`${MEMBERS.length} flats · ${DATA_COMPLETION.loginEnabled} active logins · ${DATA_COMPLETION.fullProfiles} complete profiles`}
        breadcrumb="ADMIN · MEMBERS"
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("admin/data")}><Icon name="chart" size={13}/> Data completion</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShow(true)}><Icon name="upload" size={13}/> Import CSV</button>
          <button className="btn btn-ghost btn-sm"><Icon name="dl" size={13}/> Export</button>
        </>}
      />
      <div className="page-body">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div className="chips">
            {filters.map(b => <button key={b} className={`chip ${filter === b ? "on" : ""}`} onClick={() => setFilter(b)}>{b}</button>)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="field" placeholder="Search name, flat, ID, membership no…"
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 24 }}><input type="checkbox" /></th>
              <th>Member</th>
              <th>Flat</th>
              <th>M-No.</th>
              <th>Contact</th>
              <th>Ownership</th>
              <th>Parking</th>
              <th>Profile</th>
              <th>Login</th>
              <th></th>
            </tr></thead>
            <tbody>
              {visible.map(m => {
                const comp = memberCompleteness(m);
                return (
                  <tr key={m.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 11, background: m.deceased ? "var(--muted)" : m.committee ? "var(--gold)" : "var(--green)" }}>
                          {personInitials(m.name).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div>
                          <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>
                            {m.id}{m.committee && <> · <span style={{ color: "var(--gold)" }}>{m.committee}</span></>}{m.hasCoOwner && <> · joint</>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{m.flat}<div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>Floor {m.floor}</div></td>
                    <td className="mono" style={{ fontSize: 12, color: m.membership ? "inherit" : "var(--rust)" }}>
                      {m.membership || <span style={{ color: "var(--rust)" }}>—</span>}
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: 11.5, color: m.email ? "var(--ink-2)" : "var(--muted-2)" }}>
                        {m.email || <span style={{ color: "var(--rust)" }}>no email</span>}
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: m.phone ? "var(--muted)" : "var(--muted-2)", marginTop: 2 }}>
                        {m.phone || <span style={{ color: "var(--rust)" }}>no phone</span>}
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12.5, color: m.deceased ? "var(--muted-2)" : "inherit" }}>{m.ownership}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{m.parking || <span style={{ color: "var(--muted-2)" }}>—</span>}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 32, height: 4, background: "var(--panel)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${comp.pct}%`, height: "100%", background: comp.pct === 100 ? "var(--green)" : comp.pct >= 60 ? "var(--gold)" : "var(--rust)" }}/>
                        </div>
                        <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)", minWidth: 24 }}>{comp.pct}%</span>
                      </div>
                    </td>
                    <td><StatusBadge status={m.login} /></td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-icon" onClick={() => setEditing(m)}><Icon name="edit" size={13}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", background: "var(--panel)", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Showing {visible.length} of {MEMBERS.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn-icon"><Icon name="chev_l" size={14}/></button>
              <button className="btn-icon"><Icon name="chev_r" size={14}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* Import CSV modal */}
      <ImportMembersModal open={show} onClose={() => setShow(false)} />
      {/* Edit member modal */}
      <EditMemberModal member={editing} onClose={() => setEditing(null)} />
    </>
  );
};

// ── Data Completion screen ───────────────────────────────────────────────
const AdminDataCompletion = ({ onNav }) => {
  const dc = DATA_COMPLETION;
  const [editing, setEditing] = React.useState(null);
  const [field, setField] = React.useState("email");
  const [showInvite, setShowInvite] = React.useState(false);

  const missing = MEMBERS.filter(m => !m[field] && !m.deceased);
  const fieldMeta = REQUIRED_FIELDS.find(f => f.key === field) || REQUIRED_FIELDS[0];
  const overallPct = Math.round((dc.fullProfiles / dc.total) * 100);

  return (
    <>
      <PageHead
        title="Data completion"
        sub={`${dc.fullProfiles} of ${dc.total} profiles complete. Track what's missing, who needs an invite, and what to import next.`}
        breadcrumb="ADMIN · DATA COMPLETION"
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(true)}><Icon name="bell" size={13}/> Send self-update invites</button>
          <button className="btn btn-primary btn-sm"><Icon name="upload" size={13} color="#fff"/> Import update sheet</button>
        </>}
      />
      <div className="page-body">
        {/* Overview */}
        <div className="card pad-lg" style={{ background: "var(--panel)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "center" }}>
            <div>
              {/* Ring chart */}
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14"/>
                <circle cx="80" cy="80" r="62"
                        fill="none" stroke="var(--green)" strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 62 * overallPct / 100} ${2 * Math.PI * 62}`}
                        transform="rotate(-90 80 80)" />
                <text x="80" y="78" textAnchor="middle" style={{ font: "400 38px 'Instrument Serif', serif" }}>{overallPct}%</text>
                <text x="80" y="98" textAnchor="middle" style={{ font: "11px 'JetBrains Mono', monospace", fill: "var(--muted)", letterSpacing: "0.04em" }}>COMPLETE</text>
              </svg>
            </div>
            <div>
              <div className="eyebrow" style={{ color: "var(--green-2)" }}>Database status</div>
              <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, margin: "8px 0 12px", lineHeight: 1.1 }}>
                {dc.total - dc.fullProfiles} member records still need <em style={{ fontStyle: "italic", color: "var(--green)" }}>filling in</em>.
              </h2>
              <p style={{ color: "var(--ink-2)", fontSize: 14, margin: "0 0 20px", maxWidth: 600 }}>
                Records were imported from <span className="mono">MEMBERS LIST.docx</span> on 23 May 2026. Each record has flat number, member name, and (where available) RCS membership number. Email, phone, parking, and ownership status need to be added — either by uploading an update sheet, asking members to self-update, or editing inline below.
              </p>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 18, marginTop: 8 }}>
                {dc.byField.map(f => {
                  const pct = Math.round(f.filled / dc.total * 100);
                  return (
                    <button key={f.key} onClick={() => setField(f.key)}
                      style={{
                        appearance: "none", textAlign: "left", border: "1px solid",
                        borderColor: field === f.key ? "var(--green)" : "transparent",
                        background: field === f.key ? "rgba(255,255,255,0.7)" : "transparent",
                        padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                      }}>
                      <div className="tiny">{f.label}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                        <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>{f.filled}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>/ {dc.total}</div>
                      </div>
                      <div style={{ marginTop: 6, height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct > 75 ? "var(--green)" : pct > 40 ? "var(--gold)" : "var(--rust)" }}/>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* What you can do — guidance */}
        <div className="grid g3" style={{ marginTop: 24 }}>
          <div className="card pad">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--leaf)", color: "var(--green-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="upload" size={14} color="var(--green-2)" />
              </div>
              <strong style={{ fontSize: 13.5 }}>Import update sheet</strong>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
              Upload an Excel/CSV with <span className="mono">flat</span> as the key column. Matching rows get email, phone, parking and ownership updated. Existing values are preserved unless overridden.
            </p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>Choose file <Icon name="arr_r" size={11}/></button>
          </div>
          <div className="card pad">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--leaf)", color: "var(--green-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="bell" size={14} color="var(--green-2)" />
              </div>
              <strong style={{ fontSize: 13.5 }}>Ask members to update</strong>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
              Send a one-time link to members with at least an email on file. They land on a self-service form, fill in what's missing, and your records are updated.
            </p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => setShowInvite(true)}>Compose invite <Icon name="arr_r" size={11}/></button>
          </div>
          <div className="card pad">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--leaf)", color: "var(--green-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="edit" size={14} color="var(--green-2)" />
              </div>
              <strong style={{ fontSize: 13.5 }}>Edit inline</strong>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
              Click any row below to open the member, fill in fields one at a time. Best for the last mile after bulk imports.
            </p>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginTop: 14 }}>
              All edits are recorded in the activity log.
            </span>
          </div>
        </div>

        {/* Missing field list */}
        <div className="card" style={{ marginTop: 24, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
                Members missing <em style={{ fontStyle: "italic", color: "var(--green)" }}>{fieldMeta.label.toLowerCase()}</em>
              </h3>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{missing.length} of {dc.total} · click any row to fill in</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {REQUIRED_FIELDS.map(f => (
                <button key={f.key} className={`chip ${field === f.key ? "on" : ""}`} onClick={() => setField(f.key)}>{f.label}</button>
              ))}
            </div>
          </div>
          {missing.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center", color: "var(--muted)" }}>
              <Icon name="check" size={28} color="var(--green)" />
              <div className="serif" style={{ fontSize: 22, marginTop: 12 }}>Nothing missing.</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Every active member has a {fieldMeta.label.toLowerCase()} on file.</div>
            </div>
          ) : (
            <table className="tbl">
              <thead><tr>
                <th>Flat</th>
                <th>Member</th>
                <th>M-No.</th>
                <th>What's on file</th>
                <th>Completeness</th>
                <th></th>
              </tr></thead>
              <tbody>
                {missing.slice(0, 50).map(m => {
                  const comp = memberCompleteness(m);
                  return (
                    <tr key={m.id} onClick={() => setEditing(m)} style={{ cursor: "pointer" }}>
                      <td className="mono" style={{ fontSize: 12 }}>{m.flat}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>{m.id}</div>
                      </td>
                      <td className="mono" style={{ fontSize: 12, color: m.membership ? "inherit" : "var(--rust)" }}>
                        {m.membership || "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11.5 }}>
                          {REQUIRED_FIELDS.map(f => (
                            <span key={f.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: 3, background: m[f.key] ? "var(--green)" : "var(--rust)" }}/>
                              <span style={{ color: m[f.key] ? "var(--ink-2)" : "var(--muted-2)" }}>{f.label}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 48, height: 5, background: "var(--panel)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${comp.pct}%`, height: "100%", background: comp.pct === 100 ? "var(--green)" : comp.pct >= 60 ? "var(--gold)" : "var(--rust)" }}/>
                          </div>
                          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{comp.pct}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setEditing(m); }}>
                          <Icon name="edit" size={12}/> Fill in
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {missing.length > 50 && (
            <div style={{ padding: "14px 22px", borderTop: "1px solid var(--line)", background: "var(--panel)", textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Showing first 50 of {missing.length} · </span>
              <button className="btn-link" style={{ fontSize: 12, color: "var(--green)" }}>Load all</button>
            </div>
          )}
        </div>
      </div>

      <EditMemberModal member={editing} onClose={() => setEditing(null)} />
      <Modal open={showInvite} title="Send self-update invitations" onClose={() => setShowInvite(false)}
        footer={<>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(false)}>Send {DATA_COMPLETION.byField[0].filled} invitations</button>
        </>}>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Send a one-time secure link to members who have an email on file but incomplete profiles. They'll fill in their own contact details, ownership status, parking and vehicle info.
        </p>
        <div className="card pad" style={{ marginTop: 16, background: "var(--panel)" }}>
          <div className="grid g2">
            <div><div className="tiny">Eligible (have email)</div><div className="serif" style={{ fontSize: 28, marginTop: 4 }}>{DATA_COMPLETION.byField.find(f => f.key === "email").filled}</div></div>
            <div><div className="tiny">Excluded (no email)</div><div className="serif" style={{ fontSize: 28, marginTop: 4 }}>{DATA_COMPLETION.noEmail}</div></div>
          </div>
        </div>
        <div className="stack" style={{ marginTop: 18 }}>
          <div><label className="fl">Subject line</label><input className="field" defaultValue="Evergreen Apartment — please complete your member profile" /></div>
          <div><label className="fl">Message preview</label>
            <textarea className="field" rows="6" defaultValue={`Dear member,\n\nAs part of bringing the society records up to date, we would like to verify and complete the contact details we hold for your flat.\n\nPlease use the link below to view and update your profile. The link is unique to you and expires in 14 days.\n\n— Society Office, Evergreen Apartment`}/>
          </div>
          <label style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" defaultChecked /> Send a reminder after 7 days if profile still incomplete
          </label>
        </div>
      </Modal>
    </>
  );
};

// ── Edit Member modal (reusable) ─────────────────────────────────────────
const EditMemberModal = ({ member, onClose }) => {
  if (!member) return null;
  return (
    <Modal open={true} title={`Edit member — Flat ${member.flat}`} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={onClose}>Save changes</button>
      </>}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
        <div className="sb-avatar" style={{ width: 48, height: 48, fontSize: 16, background: member.committee ? "var(--gold)" : "var(--green)" }}>
          {personInitials(member.name).toUpperCase()}
        </div>
        <div>
          <div className="serif" style={{ fontSize: 22 }}>{member.name}</div>
          <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{member.id} · Flat {member.flat} · Floor {member.floor}{member.committee && <> · {member.committee}</>}</div>
        </div>
      </div>

      <div className="tiny" style={{ marginBottom: 10 }}>Identity</div>
      <div className="grid g2" style={{ gap: 12 }}>
        <div><label className="fl">Member name</label><input className="field" defaultValue={member.name} /></div>
        <div><label className="fl">Membership number</label><input className="field" defaultValue={member.membership || ""} placeholder="Missing — fill in from registration records" /></div>
        <div><label className="fl">Father / spouse name</label><input className="field" placeholder="Required by RCS · missing" /></div>
        <div><label className="fl">Date of joining</label><input className="field" type="date" /></div>
      </div>

      <div className="tiny" style={{ marginTop: 18, marginBottom: 10 }}>Contact</div>
      <div className="grid g2" style={{ gap: 12 }}>
        <div><label className="fl">Primary email <span style={{ color: !member.email ? "var(--rust)" : "var(--green)" }}>·</span></label><input className="field" defaultValue={member.email || ""} placeholder="member@email.com" /></div>
        <div><label className="fl">Mobile phone <span style={{ color: !member.phone ? "var(--rust)" : "var(--green)" }}>·</span></label><input className="field" defaultValue={member.phone || ""} placeholder="+91 ••••• •••••" /></div>
        <div><label className="fl">Alternate email</label><input className="field" defaultValue="" /></div>
        <div><label className="fl">Alternate phone</label><input className="field" defaultValue={member.alternatePhone || ""} /></div>
      </div>

      <div className="tiny" style={{ marginTop: 18, marginBottom: 10 }}>Occupancy &amp; parking</div>
      <div className="grid g2" style={{ gap: 12 }}>
        <div><label className="fl">Ownership status</label>
          <select className="field" defaultValue={member.ownership}>
            <option>Owner</option><option>Owner (Joint)</option><option>Tenant</option><option>Vacant / Deceased</option><option>Disputed</option>
          </select>
        </div>
        <div><label className="fl">Membership status</label>
          <select className="field" defaultValue={member.status}>
            <option>Active</option><option>Transferred</option><option>Disputed</option><option>Deceased</option>
          </select>
        </div>
        <div><label className="fl">Parking slot</label><input className="field" defaultValue={member.parking || ""} placeholder="P-•••" /></div>
        <div><label className="fl">Vehicle number</label><input className="field" defaultValue={member.vehicleNumber || ""} placeholder="DL-•• ••-••••" /></div>
      </div>

      <div className="tiny" style={{ marginTop: 18, marginBottom: 10 }}>Login &amp; access</div>
      <div className="card pad" style={{ background: "var(--panel)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Member login: <StatusBadge status={member.login} /></div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              {member.login === "Enabled" ? `Last sign-in: ${member.lastLogin}` :
               member.login === "Pending"  ? "Invitation sent · awaiting first login" :
               member.login === "No email" ? "Add an email to enable login" :
               "No invitation sent yet"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {member.email && member.login !== "Enabled" && <button className="btn btn-green btn-sm">Send invite</button>}
            {member.login === "Enabled" && <button className="btn btn-ghost btn-sm">Reset password</button>}
            {member.login === "Enabled" && <button className="btn btn-ghost btn-sm">Disable</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Import members modal ─────────────────────────────────────────────────
const ImportMembersModal = ({ open, onClose }) => (
  <Modal open={open} title="Import members from CSV / Excel" onClose={onClose}
    footer={<>
      <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary btn-sm">Continue to mapping</button>
    </>}>
    <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
      Upload a CSV/XLSX with member details. The system matches existing rows by <span className="mono">flat</span> and fills in missing fields without overwriting existing values.
    </p>
    <p style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 8 }}>
      Required: <span className="mono">flat, name</span> · Recommended: <span className="mono">membership, email, phone</span> · Optional: <span className="mono">father_spouse, parking, vehicle, alternate_phone, ownership</span>
    </p>
    <div style={{ padding: 24, border: "1px dashed var(--line-2)", borderRadius: 8, textAlign: "center", marginTop: 16 }}>
      <Icon name="upload" size={22} color="var(--muted)" />
      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500 }}>Drop CSV or XLSX, or click to browse</div>
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>UTF-8 · up to 2 MB · max 1000 rows</div>
    </div>
    <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <a className="btn-link" style={{ fontSize: 12.5, color: "var(--green)" }}><Icon name="dl" size={11}/> Download template.csv</a>
      <label style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
        <input type="checkbox" defaultChecked /> Send login invitations to new emails after import
      </label>
    </div>
  </Modal>
);

// ── Calendar Management ──────────────────────────────────────────────────
const AdminCalendar = ({ onNav }) => {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <PageHead
        title="Calendar management"
        sub="Create events, link documents, schedule reminders."
        breadcrumb="ADMIN · CALENDAR"
        actions={<button className="btn btn-primary btn-sm" onClick={() => setShow(true)}><Icon name="plus" size={13} color="#fff"/> New event</button>}
      />
      <div className="page-body">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <CalendarGrid eventsVisibility="all" />
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Events feed</h3>
            <div className="card" style={{ marginTop: 14, overflow: "hidden" }}>
              <table className="tbl">
                <thead><tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Vis.</th>
                  <th>Docs</th>
                  <th>Reminders</th>
                  <th></th>
                </tr></thead>
                <tbody>
                  {EVENTS.map(e => (
                    <tr key={e.id}>
                      <td className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td><div style={{ fontWeight: 500, fontSize: 13 }}>{e.title}</div><div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{e.id} · {e.time}</div></td>
                      <td><CategoryPill cat={e.cat} /></td>
                      <td><StatusBadge status={e.vis} /></td>
                      <td className="mono" style={{ fontSize: 12 }}>{e.docs}</td>
                      <td className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{["AGM", "Election"].includes(e.cat) ? "7d, 1d" : e.cat === "Payment" ? "3d, 1d" : "1d"}</td>
                      <td style={{ textAlign: "right" }}><button className="btn-icon"><Icon name="edit" size={13}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* New event modal */}
      <Modal open={show} title="New calendar event" onClose={() => setShow(false)}
        footer={<>
          <button className="btn btn-ghost btn-sm" onClick={() => setShow(false)}>Save as draft</button>
          <button className="btn btn-primary btn-sm">Publish event</button>
        </>}>
        <div className="stack">
          <div><label className="fl">Event title</label><input className="field" placeholder="e.g. 28th Annual General Meeting" /></div>
          <div className="grid g2" style={{ gap: 12 }}>
            <div><label className="fl">Category</label>
              <select className="field"><option>AGM</option><option>SGM</option><option>MC Meeting</option><option>Election</option><option>Maintenance</option><option>Payment Due</option><option>Compliance</option><option>Society Event</option><option>Emergency</option></select>
            </div>
            <div><label className="fl">Visibility</label>
              <select className="field"><option>Members only</option><option>Public</option><option>MC only</option><option>Admin only</option></select>
            </div>
          </div>
          <div className="grid g2" style={{ gap: 12 }}>
            <div><label className="fl">Start</label><input className="field" type="datetime-local" defaultValue="2026-07-12T17:00" /></div>
            <div><label className="fl">End</label><input className="field" type="datetime-local" defaultValue="2026-07-12T19:00" /></div>
          </div>
          <div><label className="fl">Location</label><input className="field" defaultValue="Community Hall, Ground Floor" /></div>
          <div><label className="fl">Description</label><textarea className="field" rows="4" placeholder="Brief description visible to recipients…"></textarea></div>

          <hr className="divider" />
          <div>
            <label className="fl">Attach documents</label>
            <div className="card" style={{ padding: 0, border: "1px solid var(--line)" }}>
              {DOCUMENTS.slice(0, 4).map((d, i) => (
                <label key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < 3 ? "1px solid var(--line)" : "0", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked={i < 2} />
                  <Icon name="doc" size={14} color="var(--muted)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.title}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{d.cat} · {d.size}</div>
                  </div>
                </label>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}><Icon name="upload" size={12}/> Upload new</button>
          </div>

          <hr className="divider" />
          <div>
            <label className="fl">Reminders</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["7 days before", "3 days before", "1 day before", "Same day morning", "Custom…"].map((r, i) => (
                <button key={r} className={`chip ${i === 0 || i === 2 ? "on" : ""}`}>{r}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12.5 }}>
              Send to: <select className="field" style={{ display: "inline-block", width: "auto", padding: "5px 10px" }}><option>All members</option><option>Floor 1-5 only</option><option>Managing Committee only</option><option>Defaulters</option><option>Custom recipients…</option></select>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ── Documents Management ─────────────────────────────────────────────────
const AdminDocs = ({ onNav }) => {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <PageHead
        title="Documents"
        sub="Library of statutory records, resolutions, audit reports, forms."
        breadcrumb="ADMIN · DOCUMENTS"
        actions={<>
          <button className="btn btn-ghost btn-sm"><Icon name="folder" size={13}/> Manage categories</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}><Icon name="upload" size={13} color="#fff"/> Upload document</button>
        </>}
      />
      <div className="page-body">
        <div className="grid g4" style={{ marginBottom: 24 }}>
          <KPI label="Total documents" value={DOCUMENTS.length} />
          <KPI label="Published" value={DOCUMENTS.length} sub="100%" />
          <KPI label="Draft" value="0" sub="None pending" />
          <KPI label="Storage" value="2.4 GB" sub="of 10 GB" />
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div className="chips">
              <button className="chip on">All</button>
              <button className="chip">AGM</button>
              <button className="chip">Audit</button>
              <button className="chip">MC</button>
              <button className="chip">Election</button>
              <button className="chip">Compliance</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm">Bulk actions</button>
              <button className="btn btn-ghost btn-sm"><Icon name="filter" size={13}/> Filters</button>
            </div>
          </div>
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 24 }}><input type="checkbox" /></th>
              <th>Document</th>
              <th>Category</th>
              <th>Date</th>
              <th>Size</th>
              <th>Visibility</th>
              <th>Linked event</th>
              <th>Status</th>
              <th>Uploaded by</th>
              <th></th>
            </tr></thead>
            <tbody>
              {DOCUMENTS.map(d => {
                const ev = d.linkedEvent ? EVENTS.find(e => e.id === d.linkedEvent) : null;
                return (
                  <tr key={d.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.title}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{d.id.toUpperCase()} · {d.ver}</div>
                    </td>
                    <td><CategoryPill cat={d.cat} /></td>
                    <td className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{d.date}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{d.size}</td>
                    <td><StatusBadge status={d.vis} /></td>
                    <td style={{ fontSize: 12 }}>{ev ? <span style={{ color: "var(--ink-2)" }}>{ev.title}</span> : <span style={{ color: "var(--muted-2)" }}>—</span>}</td>
                    <td><StatusBadge status="Published" /></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{d.uploadedBy}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-icon"><Icon name="edit" size={13}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload modal */}
      <Modal open={show} title="Upload document" onClose={() => setShow(false)}
        footer={<>
          <button className="btn btn-ghost btn-sm" onClick={() => setShow(false)}>Save draft</button>
          <button className="btn btn-primary btn-sm">Upload &amp; publish</button>
        </>}>
        <div className="stack">
          <div style={{ padding: 24, border: "1px dashed var(--line-2)", borderRadius: 8, textAlign: "center" }}>
            <Icon name="upload" size={22} color="var(--muted)" />
            <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 500 }}>Drop a file or click to browse</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>PDF · DOCX · XLSX · JPG · up to 20 MB</div>
          </div>
          <div><label className="fl">Title</label><input className="field" placeholder="e.g. Minutes of June MC Meeting" /></div>
          <div className="grid g2" style={{ gap: 12 }}>
            <div><label className="fl">Category</label>
              <select className="field"><option>AGM</option><option>SGM</option><option>MC Resolution</option><option>Audit Report</option><option>Annual Return</option><option>Election</option><option>Parking</option><option>Compliance</option><option>Form</option><option>Maintenance</option><option>Bye-laws</option><option>Calendar attachment</option></select>
            </div>
            <div><label className="fl">Document date</label><input className="field" type="date" defaultValue="2026-05-25" /></div>
          </div>

          <div>
            <label className="fl">Visibility</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["Members only", true], ["Public", false], ["MC only", false], ["Admin only", false], ["Specific floor…", false], ["Specific member…", false]].map(([l, on]) => (
                <button key={l} className={`chip ${on ? "on" : ""}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="grid g2" style={{ gap: 12 }}>
            <div><label className="fl">Link to calendar event (optional)</label>
              <select className="field"><option>— None —</option>{EVENTS.map(e => <option key={e.id}>{e.title}</option>)}</select>
            </div>
            <div><label className="fl">Status</label>
              <select className="field"><option>Published</option><option>Draft</option><option>Archived</option></select>
            </div>
          </div>
          <label style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" defaultChecked /> Notify members in scope when published
          </label>
        </div>
      </Modal>
    </>
  );
};

// ── Notices admin ────────────────────────────────────────────────────────
const AdminNotices = ({ onNav }) => (
  <>
    <PageHead title="Notices" sub="Public notices and circulars."
      breadcrumb="ADMIN · NOTICES"
      actions={<button className="btn btn-primary btn-sm"><Icon name="plus" size={13} color="#fff"/> Compose notice</button>}
    />
    <div className="page-body">
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr>
            <th>ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Published</th>
            <th>Visibility</th>
            <th>Pinned</th>
            <th></th>
          </tr></thead>
          <tbody>
            {NOTICES.map(n => (
              <tr key={n.id}>
                <td className="mono" style={{ fontSize: 11 }}>{n.id.toUpperCase()}</td>
                <td><div style={{ fontWeight: 500 }}>{n.title}</div></td>
                <td><CategoryPill cat={n.cat} /></td>
                <td className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{n.date}</td>
                <td><StatusBadge status={n.vis} /></td>
                <td>{n.pinned ? <Icon name="check" size={14} color="var(--green)"/> : <span style={{ color: "var(--muted-2)" }}>—</span>}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn-icon"><Icon name="edit" size={13}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

// ── Complaints admin ─────────────────────────────────────────────────────
const AdminComplaints = ({ onNav }) => (
  <>
    <PageHead title="Complaints &amp; requests" sub="3 open · 1 high priority"
      breadcrumb="ADMIN · COMPLAINTS"
      actions={<button className="btn btn-ghost btn-sm"><Icon name="dl" size={13}/> Export</button>}
    />
    <div className="page-body">
      <div className="grid g4" style={{ marginBottom: 24 }}>
        <KPI label="Open" value="2" deltaTone="down" />
        <KPI label="In progress" value="1" sub="Lift vendor" />
        <KPI label="Resolved this month" value="8" delta="↑ 33%" deltaTone="up" />
        <KPI label="Avg. resolution" value="2.4 days" sub="across society" />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="chips">
            <button className="chip on">All</button>
            <button className="chip">Open</button>
            <button className="chip">In progress</button>
            <button className="chip">Resolved</button>
          </div>
          <input className="field" placeholder="Search…" style={{ width: 240 }} />
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Ticket</th>
            <th>Title</th>
            <th>Category</th>
            <th>By</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Filed</th>
          </tr></thead>
          <tbody>
            {COMPLAINTS.map(c => (
              <tr key={c.id}>
                <td className="mono" style={{ fontSize: 11.5 }}>{c.id}</td>
                <td><div style={{ fontWeight: 500 }}>{c.title}</div></td>
                <td><CategoryPill cat={c.cat} /></td>
                <td style={{ fontSize: 12.5 }}>{c.by}<div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Flat {c.flat}</div></td>
                <td>
                  <span className={`badge ${c.priority === "High" ? "badge-rust" : c.priority === "Medium" ? "badge-amber" : ""} badge-dot`}>{c.priority}</span>
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.assignee}</td>
                <td className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

// ── Activity Logs ────────────────────────────────────────────────────────
const AdminActivity = ({ onNav }) => (
  <>
    <PageHead title="Activity logs" sub="All admin and system actions, retained 365 days."
      breadcrumb="ADMIN · LOGS"
      actions={<button className="btn btn-ghost btn-sm"><Icon name="dl" size={13}/> Export CSV</button>}
    />
    <div className="page-body">
      <div className="card pad-lg" style={{ maxWidth: 980 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <select className="field" style={{ width: "auto" }}><option>All actors</option><option>Admins only</option><option>System</option><option>Members</option></select>
          <select className="field" style={{ width: "auto" }}><option>All actions</option><option>Document</option><option>Member</option><option>Notice</option><option>Reminder</option></select>
          <select className="field" style={{ width: "auto" }}><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option><option>This FY</option></select>
        </div>
        {[...ACTIVITY, ...ACTIVITY].map((a, i) => (
          <div key={i} className="log-row">
            <span className="t">{a.t}</span>
            <span><strong style={{ fontWeight: 500 }}>{a.who}</strong> <span style={{ color: "var(--muted)" }}>{a.action.toLowerCase()}</span> <span>{a.target}</span></span>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>10.144.{(i * 17) % 255}.{(i * 41) % 255}</span>
          </div>
        ))}
      </div>
    </div>
  </>
);

// ── Stubs for remaining admin pages ──────────────────────────────────────
const SimpleAdminPage = ({ title, sub, breadcrumb, children }) => (
  <>
    <PageHead title={title} sub={sub} breadcrumb={breadcrumb} />
    <div className="page-body">{children}</div>
  </>
);

const AdminParking = () => {
  const allocated = MEMBERS.filter(m => m.parking);
  return (
    <SimpleAdminPage title="Parking management" sub={`Slot allocation. ${allocated.length} of ${MEMBERS.length} flats have parking on file.`} breadcrumb="ADMIN · PARKING">
      <div className="grid g4" style={{ marginBottom: 24 }}>
        <KPI label="Total flats" value={MEMBERS.length} />
        <KPI label="With parking" value={allocated.length} sub={`${Math.round(allocated.length / MEMBERS.length * 100)}%`} />
        <KPI label="Without parking on file" value={MEMBERS.length - allocated.length} sub="Update needed" deltaTone="down" />
        <KPI label="Vehicle numbers" value={MEMBERS.filter(m => m.vehicleNumber).length} sub="Recorded" />
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr><th>Slot</th><th>Flat</th><th>Allocated to</th><th>Vehicle</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {allocated.slice(0, 12).map(m => (
              <tr key={m.id}>
                <td className="mono">{m.parking}</td>
                <td className="mono">{m.flat}</td>
                <td><div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div><div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Floor {m.floor}</div></td>
                <td className="mono" style={{ fontSize: 12 }}>{m.vehicleNumber || <span style={{ color: "var(--muted-2)" }}>not recorded</span>}</td>
                <td><StatusBadge status="Active" /></td>
                <td style={{ textAlign: "right" }}><button className="btn-icon"><Icon name="edit" size={13}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SimpleAdminPage>
  );
};

const AdminCommittee = () => (
  <SimpleAdminPage title="Committee management" sub="Current and historical Managing Committee composition." breadcrumb="ADMIN · COMMITTEE">
    <div className="card pad-lg">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="tiny">Current term</div>
          <div className="serif" style={{ fontSize: 32, marginTop: 4 }}>2024 – 2026</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="folder" size={13}/> Election records</button>
          <button className="btn btn-primary btn-sm">Edit roster</button>
        </div>
      </div>
      <table className="tbl">
        <thead><tr><th>Member</th><th>Role</th><th>Flat</th><th>Term</th><th>Contact</th></tr></thead>
        <tbody>
          {COMMITTEE.map(m => (
            <tr key={m.flat}>
              <td><div style={{ fontWeight: 500 }}>{m.name}</div></td>
              <td><span className="badge badge-green">{m.role}</span></td>
              <td className="mono">{m.flat}</td>
              <td className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{m.term}</td>
              <td className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{m.email || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SimpleAdminPage>
);

Object.assign(window, {
  AdminDashboard, AdminMembers, AdminCalendar, AdminDocs, AdminNotices, AdminComplaints, AdminActivity, AdminParking, AdminCommittee, AdminDataCompletion,
});
