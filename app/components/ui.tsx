import Link from "next/link";

export function Icon({ name, size = 16, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.7,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  } as const;
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5" {...stroke} /><path d="M5 10.5V20h14v-9.5" {...stroke} /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" {...stroke} /><path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} /></>,
    users: <><circle cx="9" cy="9" r="3.2" {...stroke} /><path d="M3 19c0-3 3-5 6-5s6 2 6 5" {...stroke} /><circle cx="17" cy="8" r="2.4" {...stroke} /><path d="M14.5 16c1.5-1 4-1 5.5 0 1 .7 1 2 1 3" {...stroke} /></>,
    user: <><circle cx="12" cy="8" r="3.5" {...stroke} /><path d="M5 20c0-4 3-6 7-6s7 2 7 6" {...stroke} /></>,
    chart: <><path d="M4 4v16h16" {...stroke} /><path d="M7 15l4-4 3 3 5-6" {...stroke} /></>,
    doc: <><path d="M6 3h8l4 4v14H6z" {...stroke} /><path d="M14 3v4h4M9 12h6M9 16h6" {...stroke} /></>,
    cal: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" {...stroke} /><path d="M8 3v4M16 3v4M3.5 10h17" {...stroke} /></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" {...stroke} /></>,
    inbox: <><path d="M3 13h5l1 2h6l1-2h5" {...stroke} /><path d="M5 5h14l2 8v6H3v-6Z" {...stroke} /></>,
    edit: <><path d="M14 4l6 6L9 21H3v-6Z" {...stroke} /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" {...stroke} /><path d="M10 21a2 2 0 0 0 4 0" {...stroke} /></>,
    arr_r: <><path d="M5 12h14M13 6l6 6-6 6" {...stroke} /></>,
    arr_l: <><path d="M19 12H5M11 6l-6 6 6 6" {...stroke} /></>,
    leaf: <><path d="M5 19c0-9 6-15 15-15-1 12-7 17-15 17z" {...stroke} /><path d="M5 19c4-5 8-7 12-9" {...stroke} /></>,
    x: <><path d="M6 6l12 12M18 6 6 18" {...stroke} /></>,
    plus: <><path d="M12 5v14M5 12h14" {...stroke} /></>,
    search: <><circle cx="11" cy="11" r="6.5" {...stroke} /><path d="m20 20-3.5-3.5" {...stroke} /></>,
    dl: <><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" {...stroke} /></>
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      {paths[name] ?? paths.home}
    </svg>
  );
}

export function Logo({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? { font: 28, sub: 11, mark: 38 } : size === "md" ? { font: 22, sub: 10, mark: 30 } : { font: 16, sub: 9, mark: 22 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={s.mark} height={s.mark} viewBox="0 0 40 40" style={{ flexShrink: 0 }} aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="none" stroke="var(--ink)" strokeWidth="1" />
        <path d="M11 28 C 11 17, 17 11, 29 11 C 28 23, 22 29, 11 28 Z" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
        <path d="M11 28 Q 18 22, 26 16" fill="none" stroke="var(--ink)" strokeWidth="1" />
      </svg>
      <div style={{ lineHeight: 1.1 }}>
        <div className="serif" style={{ fontSize: s.font }}>Evergreen <em style={{ fontStyle: "italic" }}>Apartment</em></div>
        <div className="mono" style={{ fontSize: s.sub, color: "var(--muted)", marginTop: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Est. 1998 - Sector 7, Dwarka
        </div>
      </div>
    </div>
  );
}

export function PublicTopbar() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/calendar", label: "Calendar" }
  ];
  return (
    <div className="topbar">
      <Link href="/"><Logo /></Link>
      <nav>{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      <Link className="btn btn-primary btn-sm" href="/login"><Icon name="lock" size={13} color="#fff" /> Member Login</Link>
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="foot">
      <div>
        <Logo />
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14, maxWidth: 340, lineHeight: 1.55 }}>
          Evergreen Apartment, Plot 9, Sector 7, Dwarka, New Delhi 110075.
        </p>
      </div>
      <div><h5>Society</h5><Link href="/">Home</Link><Link href="/calendar">Calendar</Link></div>
      <div><h5>Contact</h5><span className="muted">evergreensocietyplot9@gmail.com<br />011-42441492</span></div>
      <div><h5>Office</h5><span className="muted">Timings to be updated<br />Regd No. 837</span></div>
    </footer>
  );
}

export function PageHead({ title, sub, breadcrumb, actions }: { title: string; sub?: string; breadcrumb?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {breadcrumb && <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.05em" }}>{breadcrumb}</div>}
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

export function KPI({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return <div className="card stat"><div className="v">{value}</div><div className="l">{label}</div>{sub && <div className="d">{sub}</div>}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cls = normalized.includes("enabled") || normalized.includes("active") || normalized === "public" ? "badge-green"
    : normalized.includes("disabled") || normalized.includes("deceased") || normalized.includes("no_email") ? "badge-rust"
    : normalized.includes("pending") ? "badge-amber" : "";
  const label = status.replaceAll("_", " ");
  return <span className={`badge badge-dot ${cls}`}>{label}</span>;
}

export function Modal({ title, children, footer, onClose }: { title: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-bg" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}

export function personInitials(name?: string | null) {
  return (name || "")
    .replace(/^\s*(MR|MRS|MS|SMT|DR|LATE)\.?\s+/i, "")
    .split(/[\s.&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("") || "EA";
}
