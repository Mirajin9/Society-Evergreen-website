import { Icon } from "@/app/components/ui";
import Link from "next/link";

export const metadata = {
  title: "Downloads - Evergreen Apartment",
  description: "Public documents, forms, and DCS reference material for Evergreen Apartment CGHS Ltd."
};

type DownloadItem = {
  title: string;
  desc: string;
  date: string;
  href?: string;
  external?: string;
  action?: "Download" | "Visit site";
};

const CATEGORIES: Array<{ title: string; items: DownloadItem[] }> = [
  {
    title: "Membership & Transfer Forms",
    items: [
      { title: "Form 20 - Membership Application", desc: "Application of membership for transfer or purchase cases", date: "PDF", href: "/files/form-20.pdf" },
      { title: "Form 21", desc: "Statutory form for society membership / transfer records", date: "PDF", href: "/files/form-21.pdf" },
      { title: "Nomination Form", desc: "Nomination form for member records", date: "PDF", href: "/files/nomination-form.pdf" },
      { title: "Share Certificate Request Form", desc: "Application to obtain or reissue society share certificate", date: "Available at office" },
      { title: "Prerequisites for Share Certificate", desc: "Required documents and steps for share certificate requests", date: "Placeholder" }
    ]
  },
  {
    title: "DCS Act & Rules Reference",
    items: [
      {
        title: "Delhi Cooperative Societies Act, 2003",
        desc: "Full text of the governing act for cooperative societies in Delhi",
        date: "Government publication",
        external: "https://www.indiacode.nic.in/bitstream/123456789/13605/1/dcs_act%2C_2003.pdf",
        action: "Download"
      },
      {
        title: "Delhi Cooperative Societies Rules, 2007",
        desc: "Rules framed under the DCS Act for administration of societies",
        date: "RCS publication",
        external: "https://rcs.delhi.gov.in/sites/default/files/generic_multiple_files/update_file_dcs_rule_1.pdf",
        action: "Download"
      },
      { title: "Model Bye-Laws for CGHS", desc: "Standard bye-laws template for cooperative group housing societies", date: "PDF", href: "/files/model-bye-laws-cghs-delhi.pdf" }
    ]
  },
  {
    title: "Society Bye-Laws & Documents",
    items: [
      { title: "Evergreen Apartment Bye-Laws", desc: "Registered bye-laws of Evergreen Apartment CGHS Ltd.", date: "DOCX", href: "/files/evergreen-cghs-bye-laws.docx" },
      { title: "Society Registration Certificate", desc: "Certificate of registration from Registrar of Cooperative Societies", date: "Contact office" }
    ]
  },
  {
    title: "Other Reference Documents",
    items: [
      { title: "Visitor & Security Guidelines", desc: "Society rules for visitors, security, and MyGate app access", date: "To be shared" }
    ]
  }
];

export default function DownloadsPage() {
  return (
    <>
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
              Annual returns, audit reports, meeting records, AGM/MC resolutions, accounts, member lists, and share-certificate source records are available only to registered members or admins after login.
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
                  <div className="dl-meta">{item.desc} - <span>{item.date}</span></div>
                </div>
                {item.href ? (
                  <a href={item.href} className="dl-btn" download>
                    <Icon name="dl" size={12} color="#fff" /> Download
                  </a>
                ) : item.external ? (
                  <a href={item.external} target="_blank" rel="noopener noreferrer" className="dl-btn">
                    <Icon name="arr_r" size={12} color="#fff" /> {item.action || "Visit site"}
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
            <div style={{ fontSize: 13, color: "var(--navy)" }}><strong>Office hours:</strong> Mon-Sat, 10am-1pm</div>
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
