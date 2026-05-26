// components.jsx — Shared components for Evergreen Apartments portal.

// ── Icon library (simple line icons, 16-20px) ──────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const c = color, s = size;
  const stroke = { stroke: c, strokeWidth: 1.5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    home:    <><path d="M3 11.5 12 4l9 7.5" {...stroke}/><path d="M5 10.5V20h14v-9.5" {...stroke}/></>,
    bell:    <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" {...stroke}/><path d="M10 21a2 2 0 0 0 4 0" {...stroke}/></>,
    cal:     <><rect x="3.5" y="5" width="17" height="15.5" rx="2" {...stroke}/><path d="M8 3v4M16 3v4M3.5 10h17" {...stroke}/></>,
    doc:     <><path d="M6 3h8l4 4v14H6z" {...stroke}/><path d="M14 3v4h4M9 12h6M9 16h6" {...stroke}/></>,
    folder:  <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" {...stroke}/></>,
    users:   <><circle cx="9" cy="9" r="3.2" {...stroke}/><path d="M3 19c0-3 3-5 6-5s6 2 6 5" {...stroke}/><circle cx="17" cy="8" r="2.4" {...stroke}/><path d="M14.5 16c1.5-1 4-1 5.5 0 1 .7 1 2 1 3" {...stroke}/></>,
    user:    <><circle cx="12" cy="8" r="3.5" {...stroke}/><path d="M5 20c0-4 3-6 7-6s7 2 7 6" {...stroke}/></>,
    inbox:   <><path d="M3 13h5l1 2h6l1-2h5" {...stroke}/><path d="M5 5h14l2 8v6H3v-6Z" {...stroke}/></>,
    cog:     <><circle cx="12" cy="12" r="3" {...stroke}/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" {...stroke}/></>,
    search:  <><circle cx="11" cy="11" r="6.5" {...stroke}/><path d="m20 20-3.5-3.5" {...stroke}/></>,
    plus:    <><path d="M12 5v14M5 12h14" {...stroke}/></>,
    arr_r:   <><path d="M5 12h14M13 6l6 6-6 6" {...stroke}/></>,
    arr_l:   <><path d="M19 12H5M11 6l-6 6 6 6" {...stroke}/></>,
    chev_d:  <><path d="m6 9 6 6 6-6" {...stroke}/></>,
    chev_r:  <><path d="m9 6 6 6-6 6" {...stroke}/></>,
    chev_l:  <><path d="m15 6-6 6 6 6" {...stroke}/></>,
    dl:      <><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" {...stroke}/></>,
    upload:  <><path d="M12 20V8m0 0-4 4m4-4 4 4M4 4h16" {...stroke}/></>,
    lock:    <><rect x="5" y="11" width="14" height="9" rx="2" {...stroke}/><path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke}/></>,
    eye:     <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" {...stroke}/><circle cx="12" cy="12" r="3" {...stroke}/></>,
    chart:   <><path d="M4 4v16h16" {...stroke}/><path d="M7 15l4-4 3 3 5-6" {...stroke}/></>,
    flag:    <><path d="M5 21V4l9 3-2 4 3 4-10 1" {...stroke}/></>,
    car:     <><path d="M5 17h14v-5l-2-5H7l-2 5v5Z" {...stroke}/><circle cx="8" cy="17" r="1.5" {...stroke}/><circle cx="16" cy="17" r="1.5" {...stroke}/></>,
    pin:     <><path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z" {...stroke}/><circle cx="12" cy="9" r="2.5" {...stroke}/></>,
    paperclip: <><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 1 1-2.8-2.8l7.3-7.3" {...stroke}/></>,
    x:       <><path d="M6 6l12 12M18 6 6 18" {...stroke}/></>,
    check:   <><path d="m4 12 5 5L20 6" {...stroke}/></>,
    filter:  <><path d="M4 5h16l-6 8v6l-4-2v-4Z" {...stroke}/></>,
    edit:    <><path d="M14 4l6 6L9 21H3v-6Z" {...stroke}/></>,
    leaf:    <><path d="M5 19c0-9 6-15 15-15-1 12-7 17-15 17z" {...stroke}/><path d="M5 19c4-5 8-7 12-9" {...stroke}/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
};

// ── Brand / Logo ──────────────────────────────────────────────────────────
const Logo = ({ size = "md", color = "ink" }) => {
  const s = size === "lg" ? { font: 28, sub: 11, mark: 38 }
        : size === "sm" ? { font: 16, sub: 9, mark: 22 }
        : { font: 22, sub: 10, mark: 30 };
  const ink = color === "white" ? "#fff" : "var(--ink)";
  const muted = color === "white" ? "rgba(255,255,255,0.65)" : "var(--muted)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={s.mark} height={s.mark} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
        <circle cx="20" cy="20" r="19" fill="none" stroke={ink} strokeWidth="1" />
        {/* A simple inscribed leaf glyph */}
        <path d="M11 28 C 11 17, 17 11, 29 11 C 28 23, 22 29, 11 28 Z"
              fill="none" stroke={ink} strokeWidth="1.2" />
        <path d="M11 28 Q 18 22, 26 16" fill="none" stroke={ink} strokeWidth="1" />
      </svg>
      <div style={{ lineHeight: 1.1 }}>
        <div className="serif" style={{ fontSize: s.font, color: ink, letterSpacing: "-0.005em" }}>
          Evergreen <em style={{ fontStyle: "italic" }}>Apartment</em>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: s.sub, color: muted, marginTop: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Est. 1998 · Sector 7, Dwarka
        </div>
      </div>
    </div>
  );
};

// ── Striped image placeholder ──────────────────────────────────────────────
const PH = ({ label, h = 240, ratio = null, style = {} }) => (
  <div className="ph" style={{ height: ratio ? "auto" : h, aspectRatio: ratio || "auto", ...style }}>
    <span>{label}</span>
  </div>
);

// ── Status badge for compliance / state ────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    "Open":         { cls: "badge-amber",  label: "Open" },
    "In Progress":  { cls: "badge-amber",  label: "In Progress" },
    "Resolved":     { cls: "badge-green",  label: "Resolved" },
    "Closed":       { cls: "",             label: "Closed" },
    "Active":       { cls: "badge-green",  label: "Active" },
    "Inactive":     { cls: "",             label: "Inactive" },
    "Pending":      { cls: "badge-amber",  label: "Pending" },
    "Enabled":      { cls: "badge-green",  label: "Enabled" },
    "Disabled":     { cls: "badge-rust",   label: "Disabled" },
    "Draft":        { cls: "badge-amber",  label: "Draft" },
    "Published":    { cls: "badge-green",  label: "Published" },
    "members":      { cls: "",             label: "Members only" },
    "admin":        { cls: "badge-rust",   label: "Admin only" },
    "public":       { cls: "badge-green",  label: "Public" },
  };
  const m = map[status] || { cls: "", label: status };
  return <span className={`badge badge-dot ${m.cls}`}>{m.label}</span>;
};

// ── Category pill for events ───────────────────────────────────────────────
const CategoryPill = ({ cat }) => {
  const map = {
    "AGM":          { c: "var(--gold)",  bg: "#f4ead0" },
    "SGM":          { c: "var(--gold)",  bg: "#f4ead0" },
    "MC Meeting":   { c: "var(--ink-2)", bg: "#e5e2d2" },
    "Election":     { c: "var(--ink)",   bg: "#dddacb" },
    "Maintenance":  { c: "var(--rust)",  bg: "var(--rust-bg)" },
    "Payment":      { c: "#6d4d1d",      bg: "#efe3d4" },
    "Compliance":   { c: "var(--green-2)", bg: "var(--leaf)" },
    "Society Event":{ c: "var(--green-2)", bg: "var(--leaf)" },
    "Notice":       { c: "var(--ink-2)", bg: "var(--panel)" },
    "Emergency":    { c: "#7a1f1f",      bg: "#f1d3d3" },
    "Payment Due":  { c: "#6d4d1d",      bg: "#efe3d4" },
  };
  const m = map[cat] || { c: "var(--ink-2)", bg: "var(--panel)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "2px 9px", borderRadius: 4, fontSize: 11,
      background: m.bg, color: m.c, fontWeight: 500, letterSpacing: 0.02
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 1, background: m.c }} />
      {cat}
    </span>
  );
};

// ── Sidebar (member/admin shell) ──────────────────────────────────────────
const Sidebar = ({ role, view, onNav }) => {
  const memberNav = [
    { group: "Workspace", items: [
      { id: "member/dashboard", label: "Dashboard", icon: "home" },
      { id: "member/calendar",  label: "Calendar",  icon: "cal" },
      { id: "member/notices",   label: "Notices",   icon: "bell", count: 3 },
    ]},
    { group: "Records", items: [
      { id: "member/documents", label: "My Documents", icon: "doc" },
      { id: "member/meetings",  label: "Meeting Records", icon: "folder" },
      { id: "member/profile",   label: "My Profile", icon: "user" },
    ]},
    { group: "Service", items: [
      { id: "member/complaints", label: "Complaints", icon: "flag", count: 1 },
      { id: "member/settings",   label: "Account Settings", icon: "cog" },
    ]},
  ];
  const adminNav = [
    { group: "Overview", items: [
      { id: "admin/dashboard",  label: "Dashboard", icon: "chart" },
      { id: "admin/data",       label: "Data completion", icon: "edit", count: SOCIETY.flats - DATA_COMPLETION.fullProfiles },
      { id: "admin/activity",   label: "Activity Logs", icon: "eye" },
    ]},
    { group: "Records", items: [
      { id: "admin/members",    label: "Members", icon: "users", count: SOCIETY.flats },
      { id: "admin/calendar",   label: "Calendar", icon: "cal" },
      { id: "admin/documents",  label: "Documents", icon: "doc" },
      { id: "admin/notices",    label: "Notices", icon: "bell" },
    ]},
    { group: "Service", items: [
      { id: "admin/complaints", label: "Complaints", icon: "inbox", count: 3 },
      { id: "admin/parking",    label: "Parking", icon: "car" },
      { id: "admin/committee",  label: "Committee", icon: "users" },
    ]},
  ];
  const nav = role === "admin" ? adminNav : memberNav;
  const me = role === "admin"
    ? { name: "Admin · Office", flat: "Society Office" }
    : { name: CURRENT_MEMBER.name, flat: CURRENT_MEMBER.flat };
  const initials = personInitials(me.name).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <a onClick={() => onNav(role === "admin" ? "admin/dashboard" : "member/dashboard")} style={{ cursor: "pointer" }}>
          <Logo size="sm" />
        </a>
      </div>
      {nav.map(g => (
        <div key={g.group}>
          <div className="sb-group">{g.group}</div>
          {g.items.map(it => (
            <a key={it.id} className={`sb-link ${view === it.id ? "active" : ""}`} onClick={() => onNav(it.id)}>
              <span className="ic"><Icon name={it.icon} size={16}/></span>
              <span>{it.label}</span>
              {it.count != null && <span className="count">{it.count}</span>}
            </a>
          ))}
        </div>
      ))}
      <div className="sb-foot">
        <div className="sb-avatar">{initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{me.name}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{role === "mc" ? "Managing Committee" : role === "admin" ? "Society Office" : `Flat ${me.flat}`}</div>
        </div>
      </div>
    </aside>
  );
};

// ── Public site topbar ────────────────────────────────────────────────────
const Topbar = ({ view, onNav, onLogin }) => {
  const links = [
    { id: "public/home",      label: "Home" },
    { id: "public/notices",   label: "Notices" },
    { id: "public/committee", label: "Committee" },
    { id: "public/documents", label: "Documents" },
    { id: "public/calendar",  label: "Calendar" },
    { id: "public/contact",   label: "Contact" },
  ];
  return (
    <div className="topbar">
      <a onClick={() => onNav("public/home")} style={{ cursor: "pointer" }}>
        <Logo size="sm" />
      </a>
      <nav>
        {links.map(l => (
          <a key={l.id} onClick={() => onNav(l.id)} className={view === l.id ? "active" : ""}>{l.label}</a>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a onClick={() => onNav("public/forms")} style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>Forms</a>
        <button className="btn btn-primary btn-sm" onClick={onLogin}>
          <Icon name="lock" size={13} color="#fff" />
          Member Login
        </button>
      </div>
    </div>
  );
};

// ── Public footer ─────────────────────────────────────────────────────────
const PublicFooter = ({ onNav }) => (
  <footer className="foot">
    <div>
      <Logo size="sm" />
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14, maxWidth: 340, lineHeight: 1.55 }}>
        Evergreen Apartment Cooperative Group Housing Society Ltd., registered under the Delhi Cooperative Societies Act, 2003.
      </p>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 16, letterSpacing: 0.05 }}>
        Reg. No. {SOCIETY.regNo} · PAN {SOCIETY.pan}
      </div>
    </div>
    <div>
      <h5>Society</h5>
      <a onClick={() => onNav("public/home")}>About</a>
      <a onClick={() => onNav("public/committee")}>Committee</a>
      <a onClick={() => onNav("public/notices")}>Notices</a>
      <a onClick={() => onNav("public/documents")}>Documents</a>
    </div>
    <div>
      <h5>Resources</h5>
      <a onClick={() => onNav("public/forms")}>Forms</a>
      <a onClick={() => onNav("public/calendar")}>Calendar</a>
      <a>RCS Circulars</a>
      <a>Bye-laws</a>
    </div>
    <div>
      <h5>Legal</h5>
      <a>Privacy Policy</a>
      <a>Disclaimer</a>
      <a>Grievance Officer</a>
      <a onClick={() => onNav("public/contact")}>Contact</a>
    </div>
  </footer>
);

// ── Page header (member/admin pages) ──────────────────────────────────────
const PageHead = ({ title, sub, actions, breadcrumb }) => (
  <div className="page-head">
    <div>
      {breadcrumb && (
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: 0.05 }}>
          {breadcrumb}
        </div>
      )}
      <h1>{title}</h1>
      {sub && <div className="sub">{sub}</div>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────
const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
};

// ── KPI card ──────────────────────────────────────────────────────────────
const KPI = ({ label, value, delta, deltaTone = "neutral", sub }) => {
  const toneColor = deltaTone === "up" ? "var(--green)" : deltaTone === "down" ? "var(--rust)" : "var(--muted)";
  return (
    <div className="card stat">
      <div className="l">{label}</div>
      <div className="v">{value}</div>
      {(delta || sub) && (
        <div className="d" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {delta && <span style={{ color: toneColor, fontWeight: 500 }}>{delta}</span>}
          {sub && <span style={{ color: "var(--muted)" }}>{sub}</span>}
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  Icon, Logo, PH, StatusBadge, CategoryPill, Sidebar, Topbar, PublicFooter, PageHead, Modal, KPI,
});
