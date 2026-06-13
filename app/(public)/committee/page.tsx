import { Icon } from "@/app/components/ui";

export const metadata = {
  title: "MC Committee — Evergreen Apartments",
  description: "Current Management Committee members of Evergreen Apartments Cooperative Group Housing Society Ltd."
};

const MC_MEMBERS = [
  {
    name: "Mr. Jugal Kishore",
    designation: "President",
    phone: "Contact society office",
    email: null,
    displayOrder: 1
  },
  {
    name: "Mr. Saurabh Sharma",
    designation: "Vice President",
    phone: "Contact society office",
    email: null,
    displayOrder: 2
  },
  {
    name: "Mrs. Sudha Sharma",
    designation: "Secretary",
    phone: "Contact society office",
    email: null,
    displayOrder: 3
  },
  {
    name: "Ms. Santosh",
    designation: "Treasurer",
    phone: "Contact society office",
    email: null,
    displayOrder: 4
  },
  {
    name: "Mr. Suneet Dargan",
    designation: "MC Member",
    phone: "Contact society office",
    email: null,
    displayOrder: 5
  }
];

function roleColor(designation: string) {
  if (designation === "President") return "#FF9933";
  if (designation === "Vice President") return "#138808";
  if (designation === "Secretary") return "#1A3A6B";
  if (designation === "Treasurer") return "#6B2A1A";
  return "var(--muted)";
}

export default function CommitteePage() {
  const sorted = [...MC_MEMBERS].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      {/* Page Header */}
      <div className="pub-page-header">
        <div className="eyebrow-pub">Governance</div>
        <h1>Management Committee</h1>
        <p className="ph-sub">Current elected Management Committee of Evergreen Apartments CGHS Ltd.</p>
      </div>

      <section className="pub-section" style={{ background: "#fff" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 14 }}>
          Current MC Term
        </div>
        <h2 style={{ color: "var(--navy)", marginBottom: 8 }}>Elected Representatives</h2>
        <p className="lead" style={{ marginBottom: 36 }}>
          The Management Committee is elected by the general body of members for a three-year term
          under the Delhi Cooperative Societies Act, 2003. The MC is responsible for the day-to-day
          administration, maintenance, and compliance of the society.
        </p>

        <div className="committee-grid">
          {sorted.map((member, i) => (
            <div key={i} className="committee-card">
              <div className="cc-role" style={{ color: roleColor(member.designation) }}>
                {member.designation}
              </div>
              <div className="cc-name">{member.name}</div>
              <div className="cc-contact">
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <Icon name="phone" size={13} color="var(--muted)" />
                  <span>{member.phone}</span>
                </div>
                {member.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <Icon name="mail" size={13} color="var(--muted)" />
                    <a href={`mailto:${member.email}`}>{member.email}</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles & Responsibilities */}
      <section className="pub-section" style={{ background: "var(--flag-green-lt)" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--flag-green)", fontWeight: 600, marginBottom: 14 }}>
          Committee Structure
        </div>
        <h2 style={{ color: "var(--navy)", marginBottom: 24 }}>Roles &amp; Responsibilities</h2>
        <div className="info-grid">
          <div className="info-card">
            <h4 style={{ color: "#FF9933" }}>President</h4>
            <ul>
              <li>Chairs all MC and general body meetings</li>
              <li>Signs official correspondence and cheques</li>
              <li>Overall society administration oversight</li>
            </ul>
          </div>
          <div className="info-card">
            <h4 style={{ color: "#138808" }}>Vice-President</h4>
            <ul>
              <li>Assists the President in administrative duties</li>
              <li>Presides over meetings in President's absence</li>
              <li>Oversees specific committee functions</li>
            </ul>
          </div>
          <div className="info-card">
            <h4 style={{ color: "#1A3A6B" }}>Secretary</h4>
            <ul>
              <li>Maintains society records and registers</li>
              <li>Issues notices for meetings</li>
              <li>Files annual returns with RCS</li>
              <li>Primary point of contact for members</li>
            </ul>
          </div>
          <div className="info-card">
            <h4 style={{ color: "#6B2A1A" }}>Treasurer</h4>
            <ul>
              <li>Manages society accounts and funds</li>
              <li>Issues maintenance bills and receipts</li>
              <li>Prepares financial statements for audit</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pub-section" style={{ background: "#fff" }}>
        <h2 style={{ color: "var(--navy)", marginBottom: 16 }}>Contacting the Committee</h2>
        <div className="card pad" style={{ border: "1px solid var(--line)", borderRadius: 12, maxWidth: 540 }}>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.65 }}>
            For general queries, maintenance issues, or society matters, contact the society office.
            The office is staffed on weekdays and Saturday mornings.
          </p>
          <div className="stack" style={{ fontSize: 14, color: "var(--navy)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="mail" size={15} color="var(--saffron)" />
              <strong>evergreensocietyplot9@gmail.com</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="phone" size={15} color="var(--saffron)" />
              <strong>011-42441492</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="home" size={15} color="var(--saffron)" />
              <span>Plot 9, Sector 7, Dwarka, New Delhi 110075</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="cal" size={15} color="var(--saffron)" />
              <span>Mon–Sat, 10am–1pm</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
