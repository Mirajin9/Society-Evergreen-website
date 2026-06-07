import Link from "next/link";
import { Icon } from "@/app/components/ui";

const TILES = [
  {
    id: "annual-returns",
    icon: "bar_chart",
    title: "Annual Returns",
    desc: "Access society annual returns filed with the Registrar of Cooperative Societies.",
    href: "/member/documents?cat=annual_return"
  },
  {
    id: "audit-reports",
    icon: "audit",
    title: "Annual Audit Reports",
    desc: "Download yearly audit reports and certified financial review documents.",
    href: "/member/documents?cat=audit"
  },
  {
    id: "meeting-records",
    icon: "meeting",
    title: "Meeting Records",
    desc: "Access General Body, MC, AGM, and SGM meeting minutes and attendance records.",
    href: "/member/documents?cat=agm"
  },
  {
    id: "notices",
    icon: "notice",
    title: "Notices & Circulars",
    desc: "View official society notices and circulars issued by the Management Committee.",
    href: "/member/documents?cat=compliance"
  },
  {
    id: "agm-resolutions",
    icon: "doc",
    title: "AGM Resolutions",
    desc: "Read resolutions passed at Annual General Meetings of the society.",
    href: "/member/documents?cat=agm"
  },
  {
    id: "mc-resolutions",
    icon: "shield",
    title: "MC Resolutions",
    desc: "Access resolutions passed by the Management Committee during its term.",
    href: "/member/documents?cat=mc_resolution"
  },
  {
    id: "accounts",
    icon: "chart",
    title: "Accounts",
    desc: "View society account statements, income/expenditure, and financial summaries.",
    href: "/member/documents?cat=audit"
  },
  {
    id: "parking",
    icon: "parking",
    title: "Parking Allocation",
    desc: "Check the official parking slot allocation register for all flats.",
    href: "/member/documents?cat=parking"
  },
  {
    id: "forms",
    icon: "form",
    title: "Forms & DCS Info",
    desc: "Download transfer forms, DCS Act documents, and other society reference forms.",
    href: "/downloads"
  }
];

export default function HomePage() {
  return (
    <>
      {/* Notice Strip */}
      <div className="notice-strip">
        <span className="ns-label">Notice</span>
        <span className="ns-text">
          The society portal is now live. Members may log in using their registered mobile number. For access issues, contact the society office.
        </span>
      </div>

      {/* Hero */}
      <section className="pub-hero">
        <div className="eyebrow-pub">Plot 9 · Sector 7 · Dwarka · New Delhi</div>
        <h1>Evergreen<br /><em>Apartments</em></h1>
        <p className="hero-sub">A transparent, connected, and resident-first society portal.</p>
        <p className="hero-desc">
          Evergreen Apartments brings society information, official records, notices, circulars,
          and member services into one simple digital platform — helping residents access important
          updates and documents securely.
        </p>
        <div className="pub-hero-actions">
          <Link href="/login" className="hero-cta">
            <Icon name="lock" size={16} color="#fff" />
            Login with Registered Mobile Number
          </Link>
          <Link href="/about" className="hero-cta-ghost">
            About the Society <Icon name="arr_r" size={14} color="currentColor" />
          </Link>
        </div>
      </section>

      {/* KPI Bar */}
      <div className="pub-kpi-bar">
        <div className="pub-kpi">
          <div className="v">165</div>
          <div className="l">Member Flats</div>
          <div className="s">Cooperative Group Housing</div>
        </div>
        <div className="pub-kpi">
          <div className="v">837</div>
          <div className="l">Registration No.</div>
          <div className="s">Regd. with DCS, Delhi</div>
        </div>
        <div className="pub-kpi">
          <div className="v">1998</div>
          <div className="l">Established</div>
          <div className="s">Est. under DCS Act</div>
        </div>
        <div className="pub-kpi">
          <div className="v">4</div>
          <div className="l">Residential Floors</div>
          <div className="s">Sector 7, Dwarka</div>
        </div>
      </div>

      {/* Document Tile Dashboard */}
      <section className="pub-tiles-section">
        <h2>Society Documents &amp; Records</h2>
        <p className="section-sub">
          Member login required to access documents. Click any tile to log in and view.
        </p>
        <div className="tile-grid">
          {TILES.map((tile) => (
            <Link key={tile.id} href={`/login?next=${tile.href}`} className="tile-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div className="tile-icon">
                  <Icon name={tile.icon} size={20} color="var(--navy)" />
                </div>
                <div className="tile-lock">
                  <Icon name="lock" size={11} color="var(--saffron)" />
                </div>
              </div>
              <div className="tile-title">{tile.title}</div>
              <p className="tile-desc">{tile.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="pub-section" style={{ background: "#fff" }}>
        <div className="grid g-12-8" style={{ gap: 48, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 14 }}>
              About Evergreen Apartments
            </div>
            <h2 style={{ marginBottom: 16 }}>A society built on transparency and trust.</h2>
            <p className="lead">
              Evergreen Apartments Cooperative Group Housing Society Ltd. is located at Plot 9,
              Sector 7, Dwarka, New Delhi 110075. The society was incorporated under the Delhi
              Cooperative Societies Act and has been serving residents since 1998.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 16, lineHeight: 1.7 }}>
              This portal provides members with secure digital access to society records, notices,
              account statements, and official documents — fulfilling the society's commitment to
              transparency and compliance.
            </p>
            <Link href="/about" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, color: "var(--navy)", fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
              Read full society information <Icon name="arr_r" size={14} color="var(--navy)" />
            </Link>
          </div>
          <div>
            <div className="card pad" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {[
                  { label: "Official email", value: "evergreensocietyplot9@gmail.com" },
                  { label: "Phone", value: "011-42441492" },
                  { label: "Office timings", value: "Mon–Sat, 10am–1pm" },
                  { label: "Address", value: "Plot 9, Sector 7, Dwarka, New Delhi 110075" }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="tiny" style={{ marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <Link href="/sale-inquiry" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--navy)", fontWeight: 500, fontSize: 13.5, textDecoration: "none" }}>
                  Interested in buying or renting? <Icon name="arr_r" size={13} color="var(--navy)" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
