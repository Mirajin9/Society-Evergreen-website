import { Icon } from "@/app/components/ui";

export const metadata = {
  title: "Amenities - Evergreen Apartment",
  description: "Amenities, flat category, MyGate access, and resident conveniences at Evergreen Apartment, Dwarka."
};

const AMENITIES = [
  { icon: "shield", title: "24x7 Security", desc: "Security personnel at the society entrance with visitor checks and resident coordination." },
  { icon: "phone", title: "MyGate App Access", desc: "Residents can use MyGate for visitor pre-approval, staff tracking, and gate convenience." },
  { icon: "leaf", title: "Green Surroundings", desc: "Common green areas and trees maintained for a calm residential environment." },
  { icon: "bell", title: "Temple", desc: "A small community temple within the society premises for residents." },
  { icon: "home", title: "Society Office", desc: "Office support for member records, maintenance requests, and administrative matters." },
  { icon: "parking", title: "Vehicle Records", desc: "Member vehicle details are maintained by the society for security and gate coordination." }
];

export default function AmenitiesPage() {
  return (
    <>
      <div className="pub-page-header">
        <div className="eyebrow-pub">Resident Convenience</div>
        <h1>Amenities</h1>
        <p className="ph-sub">Facilities and conveniences available to members at Evergreen Apartment.</p>
      </div>

      <section className="pub-section" style={{ background: "#fff" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 14 }}>
          Flat Category
        </div>
        <h2 style={{ color: "var(--navy)", marginBottom: 8 }}>2-4 BHK Apartment</h2>
        <p className="lead" style={{ marginBottom: 32 }}>
          Evergreen Apartment comprises 165 residential flats across 4 floors in a cooperative group housing society at Plot 9, Sector 7, Dwarka.
        </p>

        <div className="info-grid">
          <div className="info-card">
            <h4>Residential Setup</h4>
            <ul>
              <li>2-4 BHK apartment category</li>
              <li>165 member flats</li>
              <li>4 residential floors</li>
              <li>Common society amenities access</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Location</h4>
            <ul>
              <li>Plot 9, Sector 7, Dwarka</li>
              <li>New Delhi 110075</li>
              <li>Near Dwarka Sector 9 Metro Station</li>
              <li>Close to schools, hospitals, markets, banks, and parks</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Society Structure</h4>
            <ul>
              <li>Cooperative Group Housing Society</li>
              <li>Member-managed through elected MC</li>
              <li>Regular AGMs and MC meetings</li>
              <li>Society records maintained through the office and portal</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Member Convenience</h4>
            <ul>
              <li>MyGate-enabled visitor coordination</li>
              <li>Society office support</li>
              <li>Portal access for notices and documents</li>
              <li>Maintained security and vehicle records</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="pub-section" style={{ background: "var(--flag-green-lt)" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--flag-green)", fontWeight: 600, marginBottom: 14 }}>
          Society Amenities
        </div>
        <h2 style={{ color: "var(--navy)", marginBottom: 8 }}>Facilities for Residents</h2>
        <p className="lead" style={{ marginBottom: 32 }}>
          Common facilities are maintained by the society for member safety, convenience, and day-to-day community use.
        </p>
        <div className="committee-grid">
          {AMENITIES.map((item) => (
            <div key={item.title} className="committee-card">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--navy-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Icon name={item.icon} size={20} color="var(--navy)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--navy)" }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-section" style={{ background: "#fff" }}>
        <div className="card pad" style={{ border: "1px solid var(--line)", borderRadius: 12, maxWidth: 620 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--navy)", marginBottom: 8 }}>Open MyGate</div>
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 18px" }}>
            Members can use the official MyGate dashboard for visitor and gate-related convenience.
          </p>
          <a href="https://dashboard.mygate.com/login" target="_blank" rel="noopener noreferrer" className="dl-btn" style={{ display: "inline-flex" }}>
            <Icon name="dl" size={12} color="#fff" /> Open MyGate
          </a>
        </div>
      </section>
    </>
  );
}
