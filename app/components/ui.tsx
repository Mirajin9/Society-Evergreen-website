"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
    trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" {...stroke} /></>,
    plus: <><path d="M12 5v14M5 12h14" {...stroke} /></>,
    search: <><circle cx="11" cy="11" r="6.5" {...stroke} /><path d="m20 20-3.5-3.5" {...stroke} /></>,
    image: <><rect x="4" y="5" width="16" height="14" rx="2" {...stroke} /><circle cx="9" cy="10" r="1.6" {...stroke} /><path d="m7 17 4.2-4.2 3 3L16 14l3 3" {...stroke} /></>,
    dl: <><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" {...stroke} /></>,
    audit: <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" {...stroke} /><rect x="9" y="3" width="6" height="4" rx="1" {...stroke} /><path d="M9 12h6M9 16h4" {...stroke} /></>,
    meeting: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...stroke} /><circle cx="9" cy="7" r="4" {...stroke} /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" {...stroke} /></>,
    notice: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...stroke} /><polyline points="14,2 14,8 20,8" {...stroke} /><line x1="16" y1="13" x2="8" y2="13" {...stroke} /><line x1="16" y1="17" x2="8" y2="17" {...stroke} /><polyline points="10,9 9,9 8,9" {...stroke} /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...stroke} /></>,
    bar_chart: <><rect x="3" y="12" width="4" height="9" {...stroke} /><rect x="10" y="7" width="4" height="14" {...stroke} /><rect x="17" y="3" width="4" height="18" {...stroke} /></>,
    parking: <><rect x="3" y="3" width="18" height="18" rx="2" {...stroke} /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" {...stroke} /></>,
    form: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...stroke} /><path d="M14 2v6h6M8 12h8M8 16h5" {...stroke} /></>,
    menu: <><path d="M3 12h18M3 6h18M3 18h18" {...stroke} /></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.79a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l.8-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" {...stroke} /></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" {...stroke} /><polyline points="22,6 12,13 2,6" {...stroke} /></>
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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/downloads", label: "Downloads" },
    { href: "/sale-inquiry", label: "Sale Inquiry" },
    { href: "/gallery", label: "Gallery" },
    { href: "/committee", label: "MC Committee" }
  ];
  return (
    <>
      <div className="pub-topbar">
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <PubLogo />
        </Link>
        <nav>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`pub-nav-link${pathname === link.href ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/login" className="pub-nav-login">
          <Icon name="lock" size={13} color="#fff" /> Login
        </Link>
        <button className="pub-hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          <Icon name="menu" size={22} color="#fff" />
        </button>
      </div>
      <div className={`pub-mobile-menu${menuOpen ? " open" : ""}`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="pub-nav-link" onClick={() => setMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link href="/login" className="pub-nav-login" onClick={() => setMenuOpen(false)}>
          <Icon name="lock" size={13} color="#fff" /> Login with Mobile
        </Link>
      </div>
    </>
  );
}

export function PubLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <path d="M11 28 C 11 17, 17 11, 29 11 C 28 23, 22 29, 11 28 Z" fill="none" stroke="#FF9933" strokeWidth="1.4" />
        <path d="M11 28 Q 18 22, 26 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </svg>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "var(--font-body)" }}>Evergreen Apartments</div>
        <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>
          CGHS Ltd · Sector 7, Dwarka
        </div>
      </div>
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div>
        <div className="foot-brand">Evergreen <em style={{ fontStyle: "italic" }}>Apartments</em></div>
        <div className="foot-addr">
          Plot 9, Sector 7, Dwarka<br />New Delhi 110075<br />
          Regd. No. 837 · Est. 1998
        </div>
      </div>
      <div>
        <h5>Society</h5>
        <Link href="/">Home</Link>
        <Link href="/about">About Us</Link>
        <Link href="/downloads">Downloads</Link>
        <Link href="/sale-inquiry">Sale Inquiry</Link>
        <Link href="/gallery">Gallery</Link>
        <Link href="/committee">MC Committee</Link>
      </div>
      <div>
        <h5>Members</h5>
        <Link href="/login">Member Login</Link>
        <Link href="/member/dashboard">My Dashboard</Link>
        <Link href="/member/documents">Documents</Link>
      </div>
      <div>
        <h5>Contact</h5>
        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7 }}>
          evergreensocietyplot9@gmail.com<br />011-42441492
        </span>
      </div>
      <div className="foot-copy">
        © {new Date().getFullYear()} Evergreen Apartments Cooperative Group Housing Society Ltd. All rights reserved.
      </div>
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
