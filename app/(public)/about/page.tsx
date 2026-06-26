import Link from "next/link";
import { Icon } from "@/app/components/ui";

export const metadata = {
  title: "About Us — Evergreen Apartment",
  description: "Society incorporation details, history, and registration information for Evergreen Apartment CGHS Ltd."
};

export default function AboutPage() {
  return (
    <>
      {/* Page Header */}
      <div className="pub-page-header">
        <div className="eyebrow-pub">Society Information</div>
        <h1>About Evergreen Apartment</h1>
        <p className="ph-sub">Cooperative Group Housing Society Ltd. · Sector 7, Dwarka · New Delhi</p>
      </div>

      {/* Society Overview */}
      <section className="pub-section" style={{ background: "#fff" }}>
        <div className="grid g-12-8" style={{ gap: 48, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 14 }}>
              Our Society
            </div>
            <h2 style={{ marginBottom: 16 }}>A cooperative community since 1998.</h2>
            <p className="lead">
              Evergreen Apartment Cooperative Group Housing Society Ltd. is a registered cooperative
              group housing society located at Plot 9, Sector 7, Dwarka, New Delhi — one of Delhi's
              well-established residential enclaves.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 16, lineHeight: 1.7 }}>
              Incorporated under the Delhi Cooperative Societies Act, the society was established
              to provide its members with quality cooperative housing. Over the years, it has grown
              into a vibrant community of 165 residential flats spread across four floors,
              with a dedicated Management Committee elected by members to oversee administration,
              maintenance, and compliance.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 12, lineHeight: 1.7 }}>
              The society operates with transparency and accountability, maintaining regular records,
              conducting Annual General Meetings, and filing returns with the Registrar of Cooperative
              Societies, Delhi.
            </p>
          </div>

          {/* Key Details Card */}
          <div>
            <div className="card pad" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--navy)", fontWeight: 600, marginBottom: 16 }}>
                Registration Details
              </div>
              <div className="stack">
                {[
                  { label: "Full name", value: "Evergreen Apartment Cooperative Group Housing Society Ltd." },
                  { label: "Registration number", value: "837" },
                  { label: "Registered with", value: "Registrar of Cooperative Societies (RCS), Delhi" },
                  { label: "Type", value: "Cooperative Group Housing Society (CGHS)" },
                  { label: "Year of establishment", value: "1998" },
                  { label: "Total flats", value: "165 (Main residential building)" },
                  { label: "Residential floors", value: "4 floors" },
                  { label: "Address", value: "Plot 9, Sector 7, Dwarka, New Delhi 110075" }
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", width: 120, flexShrink: 0, paddingTop: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13.5, color: "var(--navy)", fontWeight: 500, flex: 1 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DCS Act Information */}
      <section className="pub-section" style={{ background: "var(--flag-green-lt)" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--flag-green)", fontWeight: 600, marginBottom: 14 }}>
          Legal Framework
        </div>
        <h2 style={{ color: "var(--navy)" }}>Delhi Cooperative Societies Act</h2>
        <div className="info-grid" style={{ marginTop: 24 }}>
          <div className="info-card">
            <h4>Governing Act</h4>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
              Evergreen Apartment operates under the Delhi Cooperative Societies Act, 2003,
              and the Delhi Cooperative Societies Rules, 2007. These laws govern the registration,
              management, and dissolution of cooperative societies in Delhi.
            </p>
          </div>
          <div className="info-card">
            <h4>Management Committee</h4>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
              The society is governed by an elected Management Committee (MC) comprising a President,
              Vice-President, Secretary, Treasurer, and additional members. The MC is elected by
              general body members for a term of three years.
            </p>
          </div>
          <div className="info-card">
            <h4>Annual General Meeting</h4>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
              An AGM is held every year within six months of the close of the financial year.
              Members are informed in advance. AGM resolutions, accounts, and audit reports are
              available for members to download from this portal.
            </p>
          </div>
          <div className="info-card">
            <h4>Member Rights</h4>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
              Every registered member has the right to attend general body meetings, vote,
              inspect society records, and receive copies of audited accounts. The DCS Act
              guarantees these rights for all registered members.
            </p>
          </div>
        </div>
      </section>

      {/* Registration & Compliance */}
      <section className="pub-section" style={{ background: "#fff" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--saffron)", fontWeight: 600, marginBottom: 14 }}>
          Compliance &amp; Registration
        </div>
        <h2 style={{ color: "var(--navy)" }}>Society Registration Information</h2>
        <p className="lead" style={{ marginBottom: 32 }}>
          The society maintains statutory compliance by filing annual returns and audit reports
          with the Registrar of Cooperative Societies, Delhi.
        </p>
        <div className="info-grid">
          <div className="info-card">
            <h4>Annual Returns</h4>
            <ul>
              <li>Filed annually with the RCS office</li>
              <li>Covers member list, accounts, AGM details</li>
              <li>Available for members to download</li>
              <li>As per DCS Act Section 45</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Audit Requirements</h4>
            <ul>
              <li>Accounts audited by a qualified auditor</li>
              <li>Audit report submitted to RCS annually</li>
              <li>Audit reports available for member download</li>
              <li>As per DCS Act Section 60</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Amenities &amp; Convenience</h4>
            <ul>
              <li>MyGate app access for visitor and gate convenience</li>
              <li>24x7 security coordination at the society entrance</li>
              <li>Society office support for member records</li>
              <li>Member portal access for notices and documents</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>Member Registration</h4>
            <ul>
              <li>New members registered on purchase/inheritance</li>
              <li>Share certificate issued to registered members</li>
              <li>Membership register maintained at office</li>
              <li>Members logged in RCS register</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/downloads" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--navy)", color: "#fff", padding: "10px 20px", borderRadius: 999, fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
            <Icon name="dl" size={14} color="#fff" /> Download Forms &amp; DCS Documents
          </Link>
          <Link href="/committee" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--navy)", color: "var(--navy)", padding: "10px 20px", borderRadius: 999, fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
            View MC Committee <Icon name="arr_r" size={14} color="var(--navy)" />
          </Link>
        </div>
      </section>
    </>
  );
}
