// app.jsx — Main App: routing, role switching, Tweaks panel.

const DEFAULT_VIEW_FOR_ROLE = {
  visitor: "public/home",
  member:  "member/dashboard",
  mc:      "member/dashboard",
  admin:   "admin/dashboard",
};

const SCREENS = {
  // public
  "public/home":       PublicHome,
  "public/notices":    PublicNotices,
  "public/committee":  PublicCommittee,
  "public/documents":  PublicDocs,
  "public/calendar":   PublicCalendar,
  "public/contact":    PublicContact,
  "public/forms":      PublicDocs,
  "public/login":      LoginScreen,
  // member
  "member/dashboard":  MemberDashboard,
  "member/calendar":   MemberCalendar,
  "member/documents":  MemberDocs,
  "member/profile":    MemberProfile,
  "member/notices":    MemberNotices,
  "member/meetings":   MemberMeetings,
  "member/complaints": MemberComplaints,
  "member/settings":   MemberSettings,
  // admin
  "admin/dashboard":   AdminDashboard,
  "admin/members":     AdminMembers,
  "admin/data":        AdminDataCompletion,
  "admin/calendar":    AdminCalendar,
  "admin/documents":   AdminDocs,
  "admin/notices":     AdminNotices,
  "admin/complaints":  AdminComplaints,
  "admin/activity":    AdminActivity,
  "admin/parking":     AdminParking,
  "admin/committee":   AdminCommittee,
};

function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const [view, setView] = React.useState(DEFAULT_VIEW_FOR_ROLE[t.role]);
  const lastRoleRef = React.useRef(t.role);

  // When role changes via Tweaks panel, jump to that role's default view.
  React.useEffect(() => {
    if (lastRoleRef.current !== t.role) {
      lastRoleRef.current = t.role;
      setView(DEFAULT_VIEW_FOR_ROLE[t.role]);
    }
  }, [t.role]);

  // Apply card style to root.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-card-style", t.cardStyle);
  }, [t.cardStyle]);

  // Scroll to top on navigation
  React.useEffect(() => {
    const main = document.querySelector(".main") || document.documentElement;
    main.scrollTo?.({ top: 0 });
    window.scrollTo?.({ top: 0 });
  }, [view]);

  const onNav = (v) => setView(v);
  const onLogin = () => setView("public/login");
  const onAuth = (asRole) => {
    setTweak("role", asRole);
    setView(DEFAULT_VIEW_FOR_ROLE[asRole]);
  };
  const onLogout = () => {
    setTweak("role", "visitor");
    setView("public/home");
  };

  const Screen = SCREENS[view] || PublicHome;

  // Login screen is full-bleed
  if (view === "public/login") {
    return (
      <>
        <LoginScreen onAuth={onAuth} onNav={onNav} />
        <TweaksUI t={t} setTweak={setTweak} />
      </>
    );
  }

  // Public layout
  if (t.role === "visitor" || view.startsWith("public/")) {
    return (
      <div className="app">
        <Topbar view={view} onNav={onNav} onLogin={onLogin} />
        <main className="main">
          <Screen onNav={onNav} onLogin={onLogin} role={t.role} />
        </main>
        <PublicFooter onNav={onNav} />
        <TweaksUI t={t} setTweak={setTweak} />
      </div>
    );
  }

  // Portal layout (member / mc / admin)
  return (
    <div className="shell">
      <Sidebar role={t.role === "admin" ? "admin" : "member"} view={view} onNav={onNav} />
      <main className="main">
        <PortalHeader role={t.role} onNav={onNav} onLogout={onLogout} />
        <Screen onNav={onNav} role={t.role} />
      </main>
      <TweaksUI t={t} setTweak={setTweak} />
    </div>
  );
}

// Slim top header for portal layouts (search + role badge + logout)
function PortalHeader({ role, onNav, onLogout }) {
  const labels = {
    member: { tag: "Member portal",  pill: "Member" },
    mc:     { tag: "Member portal",  pill: "Managing Committee" },
    admin:  { tag: "Admin console",  pill: "Society Office" },
  };
  const L = labels[role] || labels.member;
  return (
    <div className="portal-head">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.08, textTransform: "uppercase" }}>
          {L.tag}
        </span>
        <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--muted-2)" }} />
        <span className={`badge ${role === "admin" ? "badge-rust" : role === "mc" ? "badge-amber" : "badge-green"} badge-dot`}>{L.pill}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 auto", justifyContent: "flex-end", minWidth: 0 }}>
        <div className="search">
          <Icon name="search" size={14} color="var(--muted)" />
          <input className="field" placeholder="Search documents, members, events…" />
        </div>
        <button className="btn-icon"><Icon name="bell" size={16}/></button>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign out</button>
      </div>
    </div>
  );
}

// ── Tweaks UI (role + card style) ────────────────────────────────────────
function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks · Evergreen">
      <TweakSection label="Preview as" />
      <TweakSelect
        label="Logged-in role"
        value={t.role}
        options={[
          { value: "visitor", label: "Visitor (public site)" },
          { value: "member",  label: "Member" },
          { value: "mc",      label: "Managing Committee" },
          { value: "admin",   label: "Admin (Society Office)" },
        ]}
        onChange={(v) => setTweak("role", v)}
      />
      <TweakSection label="Style" />
      <TweakRadio
        label="Card style"
        value={t.cardStyle}
        options={["flat", "bordered", "soft"]}
        onChange={(v) => setTweak("cardStyle", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
