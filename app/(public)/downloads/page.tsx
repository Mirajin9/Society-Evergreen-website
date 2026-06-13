import { Icon } from "@/app/components/ui";
import Link from "next/link";

export const metadata = {
  title: "Downloads — Evergreen Apartments",
  description: "Public documents, forms, and DCS reference material for Evergreen Apartments CGHS Ltd."
};

const CATEGORIES = [
  {
    title: "Membership & Transfer Forms",
    items: [
      { title: "Membership Application Form", desc: "For new member registration with the society", date: "Available at office" },
      { title: "Flat Transfer Application Form", desc: "Required for transfer of flat ownership to buyer/nominee", date: "Available at office" },
      { title: "No-Dues Certificate Request Form", desc: "Request form for obtaining no-dues certificate from society", date: "Available at office" },
      { title: "Share Certificate Request Form", desc: "Application to obtain or reissue society share certificate", date: "Available at office" }
    ]
  },
  {
    title: "DCS Act & Rules Reference",
    items: [
      { title: "Delhi Cooperative Societies Act, 2003", desc: "Full text of the governing act for cooperative societies in Delhi", date: "Government publication", external: "https://dcsdelhi.nic.in" },
      { title: "Delhi Cooperative Societies Rules, 2007", desc: "Rules framed under the DCS Act for administration of societies", date: "Government publication", external: "https://dcsdelhi.nic.in" },
      { title: "Model Bye-Laws for CGHS", desc: "Standard bye-laws template for cooperative group housing societies", date: "RCS Office" }
    ]
  },
  {
    title: "Society Bye-Laws & Documents",
    items: [
      { title: "Evergreen Apartments Bye-Laws", desc: "Registered bye-laws of Evergreen Apartments CGHS Ltd.", date: "Contact office" },
      { title: "Society Registration Certificate", desc: "Certificate of registration from Registrar of Cooperative Societies", date: "Contact office" }
    ]
  },
  {
    title: "Other Reference Documents",
    items: [
      { title: "Maintenance Calculation Basis", desc: "Basis and methodology for society maintenance charge calculation", date: "Contact office" },
      { title: "Vehicle Update Form", desc: "Form for updating vehicle details maintained by the society", date: "Contact office" },
      { title: "Visitor & Security Guidelines", desc: "Society rules for visitors, security, and MyGate app access", date: "Contact office" }
    ]
  }
];

export default function DownloadsPage() {
  return (
    <>
      {/* Page Header */}
      <div className="pub-page-header">
        <div className="eyebrow-pub">Public Documents</div>
        <h1>Downloads</h1>
        <p className="ph-sub">Forms, DCS Act references, and publicly available society documents.</p>
      </div>

      <section className="pub-section" style={{ background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 20px", background: "var(--saffron-light)", border: "1px solid var(--saffron-mid)", borderRadius: 10, marginBottom: 36 }}>
          <Icon name="bell" size={18} color="var(--saffron)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--navy)" }}>Member documents require login</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Annual returns, audit reports, meeting records, AGM/MC resolutions, and accounts are available to registered members after login.
              This page contains publicly accessible forms and reference documents only.
            </div>
          </div>
        </div>

        {CATEGORIES.map((cat) => (
          <div key={cat.title} className="dl-category">
            <h3>{cat.title}</h3>
            {cat.items.map((item) => (
              <div key={item.title} className="dl-item">
                <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--navy-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="doc" size={18} color="var(--navy)" />
                </div>
                <div className="dl-info">
                  <h4>{item.title}</h4>
                  <div className="dl-meta">{item.desc} · <span>{item.date}</span></div>
                </div>
                {"external" in item ? (
                  <a href={(item as { external: string }).external} target="_blank" rel="noopener noreferrer" className="dl-btn">
                    <Icon name="arr_r" size={12} color="#fff" /> Visit site
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>Contact office</span>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 48, padding: 24, background: "var(--navy-light)", borderRadius: 12, border: "1px solid var(--navy-mid)" }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--navy)", marginBottom: 8 }}>Need a specific document?</div>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 16px", lineHeight: 1.6 }}>
            For society documents not listed here, please contact the society office during office hours.
            Members with login access can download annual returns, audit reports, and other official records directly from their dashboard.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "var(--navy)" }}><strong>Email:</strong> evergreensocietyplot9@gmail.com</div>
            <div style={{ fontSize: 13, color: "var(--navy)" }}><strong>Phone:</strong> 011-42441492</div>
            <div style={{ fontSize: 13, color: "var(--navy)" }}><strong>Office hours:</strong> Mon–Sat, 10am–1pm</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--navy)", color: "#fff", padding: "9px 18px", borderRadius: 999, fontWeight: 500, fontSize: 13.5, textDecoration: "none" }}>
              <Icon name="lock" size={13} color="#fff" /> Member Login for Private Documents
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
