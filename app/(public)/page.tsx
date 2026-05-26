import Link from "next/link";
import { Icon, KPI } from "@/app/components/ui";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">Plot 9 - Sector 7 - Dwarka</div>
        <h1 className="display">
          Evergreen<br />
          <em>Apartment</em>
        </h1>
        <p className="sub">
          A cooperative group housing society in Dwarka, New Delhi. This website
          introduces the society and provides a private member area for records,
          events, forms, and society office workflows.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/login"><Icon name="lock" size={13} color="#fff" /> Member Login</Link>
          <Link className="btn btn-ghost" href="/calendar">View calendar <Icon name="arr_r" size={13} /></Link>
        </div>
      </section>

      <section className="section" style={{ background: "var(--panel)" }}>
        <div className="grid g4">
          <KPI label="Registered name" value="Evergreen Apartment" sub="Cooperative Group Housing Society" />
          <KPI label="Registration" value="837" sub="Regd No. 837" />
          <KPI label="Member flats" value="165" sub="Main residential building" />
          <KPI label="Location" value="Dwarka" sub="Sector 7, New Delhi" />
        </div>
      </section>

      <section className="section">
        <div className="grid g-8-12" style={{ gap: 48, alignItems: "start" }}>
          <div>
            <div className="eyebrow">Society information</div>
            <h2>Quiet, practical information for residents and visitors.</h2>
            <p className="lead">
              Evergreen Apartment is located at Plot 9, Sector 7, Dwarka, New Delhi 110075.
              The public website is intentionally simple: society identity, contact details,
              and public calendar items. Member-specific records remain behind login.
            </p>
          </div>
          <div className="card pad-lg">
            <div className="grid g2">
              <div><div className="tiny">Official email</div><div>evergreensocietyplot9@gmail.com</div></div>
              <div><div className="tiny">Phone</div><div>011-42441492</div></div>
              <div><div className="tiny">Office timings</div><div>To be updated</div></div>
              <div><div className="tiny">Preferred domain</div><div>evergreen-dwarka</div></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
