// public.jsx — Public-facing screens.

// ── Public Home ───────────────────────────────────────────────────────────
const PublicHome = ({ onNav, onLogin }) => {
  const featured = NOTICES.slice(0, 4);
  const upcoming = EVENTS.filter(e => e.vis === "public").slice(0, 4);
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="eyebrow">Sector 7 · Dwarka · New Delhi</div>
        <h1 className="display">
          A society<br/>
          <em>that keeps</em> its records.
        </h1>
        <p className="sub">
          The official compliance portal for Evergreen Apartment CGHS Ltd.,
          maintained in accordance with circulars issued by the Office of the Registrar
          of Cooperative Societies, Govt. of NCT of Delhi.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
          <button className="btn btn-primary" onClick={onLogin}>
            <Icon name="lock" size={13} color="#fff" /> Member Login
          </button>
          <button className="btn btn-ghost" onClick={() => onNav("public/notices")}>
            Read latest notices <Icon name="arr_r" size={13} />
          </button>
        </div>

        {/* Society spec strip */}
        <div style={{
          marginTop: 64, paddingTop: 32, borderTop: "1px solid var(--line)",
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24,
        }}>
          {[
            { l: "Established", v: SOCIETY.est },
            { l: "Member flats",v: SOCIETY.flats },
            { l: "Floors",      v: SOCIETY.floors },
            { l: "Land area",   v: SOCIETY.area },
            { l: "Registration",v: SOCIETY.regNo.split(". ").pop(), m: SOCIETY.regNo },
          ].map(s => (
            <div key={s.l}>
              <div className="tiny">{s.l}</div>
              <div className="serif" style={{ fontSize: 32, marginTop: 6, lineHeight: 1 }}>{s.v}</div>
              {s.m && <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>{s.m}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Compliance band */}
      <section style={{ padding: "32px 40px", background: "var(--panel)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Icon name="check" size={18} color="var(--green)" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Compliant with RCS Circular No. F.47/01/Web/Co-op/2024 (transparency &amp; member access).</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Last verified: 04 March 2026 · Next review: 04 March 2027</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="badge badge-green badge-dot">Audit FY24-25 filed</span>
            <span className="badge badge-green badge-dot">Annual Return filed</span>
            <span className="badge badge-amber badge-dot">AGM scheduled · Jul 12</span>
          </div>
        </div>
      </section>

      {/* Two-column: notices + calendar */}
      <section className="section" style={{ padding: "56px 40px" }}>
        <div className="grid g2" style={{ gap: 40 }}>
          {/* Latest Notices */}
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div className="eyebrow">Public Bulletin</div>
                <h2 style={{ margin: 0 }}>Latest notices &amp; circulars</h2>
              </div>
              <button className="btn btn-link" onClick={() => onNav("public/notices")}>View all <Icon name="arr_r" size={12}/></button>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              {featured.map(n => (
                <div key={n.id} className="li-card" onClick={() => onNav("public/notices")} style={{ cursor: "pointer" }}>
                  <div className="date">{n.date.replace(", 2026", "")}<br/>2026</div>
                  <div className="body">
                    <h4>{n.title}</h4>
                    <p>{n.body}</p>
                    <div className="meta">
                      <CategoryPill cat={n.cat} />
                      {n.pinned && <span className="badge badge-amber badge-dot">Pinned</span>}
                      <span className="mono" style={{ fontSize: 10.5, color: "var(--muted-2)" }}>{n.id.toUpperCase()}</span>
                    </div>
                  </div>
                  <Icon name="arr_r" size={14} color="var(--muted)" />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div className="eyebrow">On the calendar</div>
                <h2 style={{ margin: 0 }}>Upcoming events</h2>
              </div>
              <button className="btn btn-link" onClick={() => onNav("public/calendar")}>Full calendar <Icon name="arr_r" size={12}/></button>
            </div>

            <div className="card stack" style={{ padding: 0 }}>
              {upcoming.map(e => {
                const d = new Date(e.date);
                const day = d.toLocaleDateString("en-IN", { day: "2-digit" });
                const mon = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ textAlign: "center", width: 56, flexShrink: 0, paddingRight: 18, borderRight: "1px solid var(--line)" }}>
                      <div className="serif" style={{ fontSize: 28, lineHeight: 1 }}>{day}</div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, letterSpacing: 0.08 }}>{mon}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{e.title}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <CategoryPill cat={e.cat} />
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{e.time} · {e.loc}</span>
                        {e.docs > 0 && (
                          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                            <Icon name="paperclip" size={11} /> {e.docs} doc{e.docs > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Some events visible to members only — login required.</span>
                <button className="btn-link" onClick={onLogin} style={{ fontSize: 12.5, color: "var(--green)" }}>Login →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Society */}
      <section className="section" style={{ background: "var(--panel)", borderTop: "1px solid var(--line)" }}>
        <div className="grid g-8-12" style={{ gap: 48, alignItems: "start" }}>
          <div>
            <div className="eyebrow">The Society</div>
            <h2>Twenty-eight years on the same plot.</h2>
            <p className="lead">
              Evergreen was among the first cooperative housing societies built in Dwarka,
              completed in 1998 across a 2.6-acre plot in Sector 7. Today, 165 families
              live across four floors, with a Managing Committee of seven members elected
              every two years.
            </p>
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 460 }}>
              <div>
                <div className="tiny">Registered office</div>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>Plot 9, Sector 7,<br/>Dwarka, New Delhi 110075</div>
              </div>
              <div>
                <div className="tiny">Office hours</div>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>Mon–Sat<br/>10:00 AM – 6:00 PM</div>
              </div>
            </div>
          </div>
          <PH label="society_facade_dwarka.jpg" ratio="4/3" />
        </div>
      </section>

      {/* Public doc strip */}
      <section className="section">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div className="eyebrow">Open records</div>
            <h2 style={{ margin: 0 }}>Public documents</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("public/documents")}>Browse library <Icon name="arr_r" size={12}/></button>
        </div>
        <div className="grid g3">
          {DOCUMENTS.filter(d => d.vis === "public").slice(0, 6).map(d => (
            <div key={d.id} className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <CategoryPill cat={d.cat} />
                <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>{d.ver}</span>
              </div>
              <div className="serif" style={{ fontSize: 20, marginTop: 14, lineHeight: 1.2 }}>{d.title}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{d.date} · {d.size} · PDF</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 18 }}>
                <Icon name="dl" size={12} /> Download
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

// ── Notices & Circulars ──────────────────────────────────────────────────
const PublicNotices = ({ onNav }) => {
  const [filter, setFilter] = React.useState("All");
  const cats = ["All", "AGM", "Election", "Maintenance", "Payment", "Compliance", "Notice"];
  const visible = NOTICES.filter(n => filter === "All" || n.cat === filter);
  return (
    <section className="section">
      <div style={{ maxWidth: 880 }}>
        <div className="eyebrow">Public bulletin</div>
        <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.0, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
          Notices &amp; Circulars
        </h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 560 }}>
          Official notices issued to members and the public. Sensitive resolutions and
          internal circulars are visible after login.
        </p>

        <div className="chips" style={{ marginTop: 32 }}>
          {cats.map(c => (
            <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>

        <div className="card" style={{ marginTop: 28, overflow: "hidden" }}>
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
              <button className="btn btn-ghost btn-sm">
                {n.vis === "members" ? <><Icon name="lock" size={12}/> Login to read</> : <><Icon name="dl" size={12}/> PDF</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Management Committee ─────────────────────────────────────────────────
const PublicCommittee = ({ onNav }) => (
  <section className="section">
    <div style={{ maxWidth: 1100 }}>
      <div className="eyebrow">Elected representatives</div>
      <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.0, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
        Managing Committee
      </h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 600 }}>
        Seven members elected by the General Body for a two-year term (2024–2026).
        Next election scheduled for 20 July 2026.
      </p>

      <div className="banner-stripe" style={{ marginTop: 28, maxWidth: 700 }}>
        <Icon name="bell" size={18} color="var(--green-2)" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green-2)" }}>Nominations open until 18 June 2026.</div>
          <div style={{ fontSize: 12, color: "var(--green-2)" }}>Form-A available from Society Office or Public Documents.</div>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 40, gap: 16 }}>
        {COMMITTEE.map(m => (
          <div key={m.flat} className="card" style={{ padding: 24, display: "flex", gap: 18 }}>
            <div className="av-lg">{personInitials(m.name).toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="serif" style={{ fontSize: 22, lineHeight: 1.15 }}>{m.name}</div>
              <div style={{ fontSize: 13, color: "var(--green)", marginTop: 2, fontWeight: 500 }}>{m.role}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
                <div>
                  <div className="tiny">Flat</div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 2 }}>{m.flat}</div>
                </div>
                <div>
                  <div className="tiny">Term</div>
                  <div className="mono" style={{ fontSize: 12, marginTop: 2 }}>{m.term}</div>
                </div>
                {m.email && (
                  <div style={{ minWidth: 0 }}>
                    <div className="tiny">Email</div>
                    <div className="mono" style={{ fontSize: 12, marginTop: 2, color: "var(--ink-2)" }}>{m.email}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Public Documents ─────────────────────────────────────────────────────
const PublicDocs = ({ onNav, onLogin }) => {
  const [filter, setFilter] = React.useState("All");
  const cats = ["All", "AGM", "Audit", "Election", "Bye-laws", "Compliance", "Form", "Maintenance"];
  const visible = DOCUMENTS
    .filter(d => d.vis === "public" || d.vis === "members")
    .filter(d => filter === "All" || d.cat === filter);
  return (
    <section className="section">
      <div className="eyebrow">Document repository</div>
      <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.0, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
        Public documents
      </h1>
      <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 560 }}>
        Statutory and public-record documents. Member-only files appear locked until login.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
        <div className="chips">
          {cats.map(c => <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}
        </div>
        <div style={{ position: "relative" }}>
          <Icon name="search" size={14} color="var(--muted)" />
          <input className="field" placeholder="Search title, ID, category…"
            style={{ paddingLeft: 36, width: 320, position: "relative", marginLeft: -22 }} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 24, overflow: "hidden" }}>
        <table className="tbl">
          <thead><tr>
            <th style={{ width: 36 }}></th>
            <th>Title</th>
            <th>Category</th>
            <th>Date</th>
            <th>Size</th>
            <th>Access</th>
            <th></th>
          </tr></thead>
          <tbody>
            {visible.map(d => (
              <tr key={d.id}>
                <td><Icon name="doc" size={16} color="var(--muted)" /></td>
                <td>
                  <div style={{ fontWeight: 500 }}>{d.title}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{d.id.toUpperCase()} · {d.ver}</div>
                </td>
                <td><CategoryPill cat={d.cat} /></td>
                <td className="tabular" style={{ color: "var(--muted)", fontSize: 12.5 }}>{d.date}</td>
                <td className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{d.size}</td>
                <td><StatusBadge status={d.vis} /></td>
                <td style={{ textAlign: "right" }}>
                  {d.vis === "members"
                    ? <button className="btn btn-ghost btn-sm" onClick={onLogin}><Icon name="lock" size={12}/> Login</button>
                    : <button className="btn btn-ghost btn-sm"><Icon name="dl" size={12}/> Download</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ── Public Calendar preview ──────────────────────────────────────────────
const PublicCalendar = ({ onNav, onLogin }) => (
  <section className="section">
    <div className="eyebrow">Society Calendar</div>
    <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.0, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
      What's on, when.
    </h1>
    <p style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 560 }}>
      Public-facing events: AGMs, elections, maintenance windows, and society events.
      Internal MC meetings and payment deadlines visible after login.
    </p>

    <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 32, marginTop: 36, alignItems: "start" }}>
      <CalendarGrid eventsVisibility="public" />
      <div className="stack">
        <div className="card" style={{ padding: 22 }}>
          <div className="tiny" style={{ marginBottom: 12 }}>Upcoming</div>
          {EVENTS.filter(e => e.vis === "public").slice(0, 5).map(e => (
            <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 64 }}>
                  {new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{e.title}</span>
              </div>
              <div style={{ marginLeft: 74, marginTop: 4 }}><CategoryPill cat={e.cat} /></div>
            </div>
          ))}
        </div>
        <div className="banner-stripe">
          <Icon name="lock" size={16} color="var(--green-2)" />
          <div style={{ fontSize: 12.5, color: "var(--green-2)" }}>
            <strong>Members see more.</strong> MC meetings, payment due dates and member-only resolutions appear after login.
            <button className="btn-link" onClick={onLogin} style={{ marginLeft: 8, color: "var(--green-2)", fontWeight: 500 }}>Login →</button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Calendar grid (shared between public/member views) ──────────────────
const CalendarGrid = ({ eventsVisibility = "all", onEventClick }) => {
  // Render a fixed month: June 2026. Today = 23 May 2026 → still showing June for upcoming view.
  const [month, setMonth] = React.useState({ y: 2026, m: 5 }); // 0-indexed (5=Jun)
  const monthName = new Date(month.y, month.m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstDow = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells = [];
  // leading
  const prevDays = new Date(month.y, month.m, 0).getDate();
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ d: prevDays - i, out: true });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, out: false });
  while (cells.length % 7) cells.push({ d: cells.length - daysInMonth - firstDow + 1, out: true });

  const eventsForCell = (c) => {
    if (c.out) return [];
    const iso = `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(c.d).padStart(2, "0")}`;
    return EVENTS.filter(e => e.date === iso && (eventsVisibility === "all" || e.vis === eventsVisibility || (eventsVisibility === "members" && e.vis === "public")));
  };
  const today = "2026-06-23";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div className="serif" style={{ fontSize: 28, lineHeight: 1 }}>{monthName}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {EVENTS.filter(e => e.date.startsWith(`${month.y}-${String(month.m+1).padStart(2,"0")}`)).length} events
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMonth(m => ({ ...m, m: m.m === 0 ? 11 : m.m - 1, y: m.m === 0 ? m.y - 1 : m.y }))}><Icon name="chev_l" size={12}/></button>
          <button className="btn btn-ghost btn-sm">Today</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMonth(m => ({ ...m, m: m.m === 11 ? 0 : m.m + 1, y: m.m === 11 ? m.y + 1 : m.y }))}><Icon name="chev_r" size={12}/></button>
        </div>
      </div>
      <div className="cal-grid">
        {["MON","TUE","WED","THU","FRI","SAT","SUN"].map(d => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((c, i) => {
          const evs = eventsForCell(c);
          const iso = c.out ? "" : `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(c.d).padStart(2, "0")}`;
          return (
            <div key={i} className={`cal-cell ${c.out ? "out" : ""} ${iso === today ? "today" : ""}`}>
              <div className="dn">{c.d}</div>
              {evs.map(e => {
                const klass = e.cat === "AGM" ? "agm"
                  : e.cat === "MC Meeting" ? "mc"
                  : e.cat === "Maintenance" ? "maint"
                  : e.cat === "Payment" ? "pay" : "";
                return <div key={e.id} className={`cal-event ${klass}`} onClick={() => onEventClick && onEventClick(e)} style={{ cursor: onEventClick ? "pointer" : "default" }}>{e.time !== "23:59" && <span style={{ fontFamily: "var(--font-mono)", marginRight: 4 }}>{e.time}</span>}{e.title}</div>;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Contact ──────────────────────────────────────────────────────────────
const PublicContact = ({ onNav }) => (
  <section className="section">
    <div style={{ maxWidth: 1100 }}>
      <div className="eyebrow">Reach us</div>
      <h1 className="serif" style={{ fontSize: 56, lineHeight: 1.0, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
        Contact the Society Office.
      </h1>

      <div className="grid g-12-8" style={{ gap: 48, marginTop: 40, alignItems: "start" }}>
        <div className="stack">
          <div className="card pad-lg">
            <div className="tiny">Office address</div>
            <div className="serif" style={{ fontSize: 22, marginTop: 8, lineHeight: 1.3 }}>
              Plot 9, Sector 7,<br/>Dwarka, New Delhi 110075
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 14, letterSpacing: 0.04 }}>
              Mon–Sat · 10:00 AM – 6:00 PM
            </div>
            <hr className="divider" style={{ margin: "18px 0" }} />
            <div className="grid g2">
              <div>
                <div className="tiny">Front office</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>{SOCIETY.phone}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{SOCIETY.email}</div>
              </div>
              <div>
                <div className="tiny">Grievance officer</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>Kunal Aggarwal · Secretary</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>secretary@evergreen-dwarka.in</div>
              </div>
            </div>
          </div>
          <PH label="society_map_dwarka.png" h={280} />
        </div>

        <form className="card pad-lg" onSubmit={(e) => { e.preventDefault(); alert("Message recorded — Society Office will respond on the next business day."); }}>
          <h3 className="serif" style={{ fontSize: 24, margin: "0 0 4px", fontWeight: 400 }}>Send a public enquiry</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 22px" }}>For member-specific issues, please use Complaints in the member portal.</p>
          <div className="stack">
            <div>
              <label className="fl">Full name</label>
              <input className="field" placeholder="Jane Doe" />
            </div>
            <div className="grid g2">
              <div>
                <label className="fl">Email</label>
                <input className="field" placeholder="jane@email.com" />
              </div>
              <div>
                <label className="fl">Phone</label>
                <input className="field" placeholder="+91 ••••• •••••" />
              </div>
            </div>
            <div>
              <label className="fl">Subject</label>
              <select className="field">
                <option>General enquiry</option>
                <option>Form / document request</option>
                <option>Membership transfer</option>
                <option>Press / vendor</option>
              </select>
            </div>
            <div>
              <label className="fl">Message</label>
              <textarea className="field" rows="5" placeholder="A brief description…"></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Submit enquiry</button>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              Public enquiries are logged and forwarded to the Society Office.
            </div>
          </div>
        </form>
      </div>
    </div>
  </section>
);

// ── Login ────────────────────────────────────────────────────────────────
const LoginScreen = ({ onAuth, onNav }) => {
  const [mode, setMode] = React.useState("login"); // login | reset | invite
  return (
    <div className="login-shell">
      <div className="login-art">
        <div style={{ position: "absolute", top: 32, left: 32 }}>
          <a onClick={() => onNav("public/home")} style={{ cursor: "pointer" }}><Logo size="sm" /></a>
        </div>
        <div style={{ position: "absolute", bottom: 40, left: 40, right: 40 }}>
          <div className="eyebrow">Member access</div>
          <div className="serif" style={{ fontSize: 56, lineHeight: 1.0, letterSpacing: "-0.02em" }}>
            Records that <em style={{ fontStyle: "italic", color: "var(--green)" }}>belong</em> to you,<br/>
            kept where they belong.
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 20, letterSpacing: 0.04 }}>
            ENCRYPTED · ROLE-BASED · AUDIT-LOGGED
          </div>
        </div>
        {/* Soft striped decoration */}
        <svg width="100%" height="100%" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
          <defs>
            <pattern id="lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y="0" x2="0" y2="20" stroke="var(--green)" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <circle cx="380" cy="240" r="320" fill="url(#lines)" />
        </svg>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.06 }}>
            {mode === "login" ? "MEMBER LOGIN" : mode === "reset" ? "RESET PASSWORD" : "SET YOUR PASSWORD"}
          </div>
          <h2 className="serif" style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.015em", margin: "6px 0 8px" }}>
            {mode === "login" ? "Welcome back."
              : mode === "reset" ? "We'll email you a link."
              : "Activate your account."}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 28 }}>
            {mode === "login" ? "Sign in with the email on file with the Society Office."
              : mode === "reset" ? "Enter the email on file — we'll send a secure link to reset your password."
              : "You're a few steps from your member portal. Pick a password and you're in."}
          </p>

          <form className="stack" onSubmit={(e) => { e.preventDefault(); if (mode === "login") onAuth("member"); else setMode("login"); }}>
            <div>
              <label className="fl">Email address</label>
              <input className="field field-lg" type="email" defaultValue={mode === "login" ? (CURRENT_MEMBER.email || "") : ""} placeholder="member@email.com" />
            </div>
            {mode !== "reset" && (
              <div>
                <label className="fl" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Password</span>
                  {mode === "login" && <a onClick={() => setMode("reset")} style={{ cursor: "pointer", color: "var(--green)", fontWeight: 500 }}>Forgot?</a>}
                </label>
                <input className="field field-lg" type="password" defaultValue={mode === "login" ? "••••••••••••" : ""} />
              </div>
            )}
            <button type="submit" className="btn btn-green" style={{ padding: "13px 18px", justifyContent: "center", marginTop: 6 }}>
              {mode === "login" ? "Sign in" : mode === "reset" ? "Send reset link" : "Set password & continue"}
            </button>
          </form>

          <hr className="divider" style={{ margin: "28px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
            <span style={{ color: "var(--muted)" }}>{mode === "login" ? "First-time member?" : "Already registered?"}</span>
            <button className="btn-link" onClick={() => setMode(mode === "login" ? "invite" : "login")} style={{ fontWeight: 500 }}>
              {mode === "login" ? "Set up account" : "Back to sign in"}
            </button>
          </div>

          <div className="mono" style={{ fontSize: 10.5, color: "var(--muted-2)", marginTop: 36, letterSpacing: 0.04 }}>
            By signing in you agree to the society Bye-laws and Acceptable Use Policy.<br/>
            Sessions expire after 30 minutes of inactivity.
          </div>

          <div style={{ marginTop: 24, padding: 14, background: "var(--panel)", borderRadius: 8, fontSize: 12, color: "var(--muted)" }}>
            <div className="tiny" style={{ marginBottom: 6 }}>Prototype shortcuts</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => onAuth("member")}>Sign in as Member</button>
              <button className="btn btn-ghost btn-sm" onClick={() => onAuth("mc")}>Sign in as MC</button>
              <button className="btn btn-ghost btn-sm" onClick={() => onAuth("admin")}>Sign in as Admin</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  PublicHome, PublicNotices, PublicCommittee, PublicDocs, PublicCalendar, PublicContact, LoginScreen, CalendarGrid,
});
