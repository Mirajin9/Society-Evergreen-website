import Link from "next/link";
import { Icon } from "@/app/components/ui";

export const metadata = {
  title: "Sale Inquiry — Evergreen Apartments",
  description: "Apartment details, society facilities, and information for buyers and renters at Evergreen Apartments, Dwarka."
};

const FACILITIES = [
  { icon: "shield", title: "24×7 Security", desc: "Round-the-clock security personnel at the society entrance with visitor management system." },
  { icon: "users", title: "MyGate App Access", desc: "Residents use the MyGate app for visitor pre-approval, staff tracking, and gate management." },
  { icon: "home", title: "Member Vehicle Records", desc: "The society maintains vehicle ownership records declared by members." },
  { icon: "leaf", title: "Green Surroundings", desc: "Landscaped common areas with trees and garden space maintained by the society." },
  { icon: "bell", title: "Temple", desc: "A small community temple within the society premises for residents." },
  { icon: "home", title: "Society Office", desc: "Active society office with staff available for maintenance requests and administrative matters." }
];

export default function SaleInquiryPage() {
  return (
    <>
      {/* Page Header */}
      <div className="pub-page-header">
        <div className="eyebrow-pub">Buying or Renting</div>
        <h1>Sale Inquiry</h1>
        <p className="ph-sub">General information about apartments and society facilities at Evergreen Apartments.</p>
      </div>

      {/* Disclaimer */}
      <section className="pub-section" style={{ background: "#fff", paddingBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px", background: "var(--saffron-light)", border: "1px solid var(--saffron-mid)", borderRadius: 10, marginBottom: 40 }}>
          <Icon name="bell" size={18} color="var(--saffron)" />
          <div style={{ fontSize: 13.5, color: "var(--navy)", lineHeight: 1.6 }}>
            <strong>This is an informational page only.</strong> This society website does not facilitate
            real estate listings or direct transactions. For actual sale or rental, please contact
            verified local brokers or reach out to existing flat owners directly.
            All transfers require approval from the Management Committee.
          </div>
        </div>
      </section>

      {/* Apartment Details */}
      <section className="pub-section" style={{ background: "#fff" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 14 }}>
          Apartment Types
        </div>
        <h2 style={{ color: "var(--navy)", marginBottom: 8 }}>Flat Categories at Evergreen</h2>
        <p className="lead" style={{ marginBottom: 32 }}>
          Evergreen Apartments comprises 165 residential flats across 4 floors.
          The society has different flat categories based on floor and size.
        </p>

        <div className="info-grid">
          <div className="info-card">
            <h4>Standard Flats</h4>
            <ul>
              <li>Available across all 4 floors</li>
              <li>Majority of the 165 units</li>
              <li>Typically 2–3 BHK configuration</li>
              <li>Member vehicle details maintained by the society</li>
              <li>Common society amenities access</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Location</h4>
            <ul>
              <li>Plot 9, Sector 7, Dwarka</li>
              <li>New Delhi 110075</li>
              <li>Near Dwarka Sector 9 Metro Station</li>
              <li>Close to schools, hospitals, markets</li>
              <li>DDA parks and green belts nearby</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Society Structure</h4>
            <ul>
              <li>165 flats in main building</li>
              <li>4 residential floors</li>
              <li>Cooperative Group Housing Society</li>
              <li>Member-managed via elected MC</li>
              <li>Regular AGMs and MC meetings</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Transfer Requirements</h4>
            <ul>
              <li>MC approval required for all transfers</li>
              <li>Society no-dues certificate needed</li>
              <li>Transfer form submission to office</li>
              <li>New member registration with RCS</li>
              <li>Applicable transfer fees as per bylaws</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Society Facilities */}
      <section className="pub-section" style={{ background: "var(--flag-green-lt)" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--flag-green)", fontWeight: 600, marginBottom: 14 }}>
          What's included
        </div>
        <h2 style={{ color: "var(--navy)", marginBottom: 8 }}>Society Facilities</h2>
        <p className="lead" style={{ marginBottom: 32 }}>
          Residents enjoy well-maintained common facilities managed by the elected Management Committee.
        </p>
        <div className="committee-grid">
          {FACILITIES.map((f) => (
            <div key={f.title} className="committee-card">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--navy-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <Icon name={f.icon} size={20} color="var(--navy)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--navy)" }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Location Advantages */}
      <section className="pub-section" style={{ background: "#fff" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 14 }}>
          Why Dwarka Sector 7
        </div>
        <h2 style={{ color: "var(--navy)", marginBottom: 24 }}>Location Advantages</h2>
        <div className="grid g-12-8" style={{ gap: 40, alignItems: "start" }}>
          <div className="info-grid" style={{ marginTop: 0 }}>
            <div className="info-card">
              <h4>Connectivity</h4>
              <ul>
                <li>Delhi Metro (Blue Line) nearby</li>
                <li>NH-48 (Delhi–Gurgaon Expressway) accessible</li>
                <li>Indira Gandhi International Airport ~15 km</li>
                <li>Good DTC bus connectivity</li>
              </ul>
            </div>
            <div className="info-card">
              <h4>Essentials Nearby</h4>
              <ul>
                <li>Multiple schools within Dwarka Sector 7–10</li>
                <li>Hospitals and clinics in nearby sectors</li>
                <li>Markets, malls, and supermarkets</li>
                <li>Banks and ATMs in vicinity</li>
              </ul>
            </div>
          </div>
          <div className="card pad" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--navy)", marginBottom: 16 }}>Inquiry &amp; Contact</div>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 20px" }}>
              For specific details about flat availability, sizes, or to connect with flat owners,
              please contact the society office. The office can confirm membership and provide
              contact details of flat owners who wish to sell or rent.
            </p>
            <div className="stack" style={{ fontSize: 14, color: "var(--navy)" }}>
              <div><strong>Email:</strong> evergreensocietyplot9@gmail.com</div>
              <div><strong>Phone:</strong> 011-42441492</div>
              <div><strong>Office hours:</strong> Mon–Sat, 10am–1pm</div>
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <Link href="/downloads" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--navy)", fontWeight: 500, fontSize: 13.5, textDecoration: "none" }}>
                <Icon name="dl" size={14} color="var(--navy)" /> Download Transfer Forms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
