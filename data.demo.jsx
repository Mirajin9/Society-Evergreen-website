// data.demo.jsx — ANONYMIZED demo data for the public GitHub Pages prototype.
// This file uses ENTIRELY FICTIONAL names, emails, and numbers.
// Real member data (data.jsx) is NEVER included in public deployments.

const SOCIETY = {
  name: "Evergreen Apartment",
  tagline: "A Cooperative Group Housing Society",
  est: "1998",
  location: "Plot 9, Sector 7, Dwarka, New Delhi — 110075",
  regNo: "Regd. No. 837",
  pan: "AAATE0837F",
  blocks: 1,
  flats: 165,
  floors: 4,
  area: "2.6 acres",
  email: "evergreensocietyplot9@gmail.com",
  phone: "011-42441492",
  domain: "evergreen-dwarka.in",
};

// 12 fully fictional demo members — NOT real residents
const MEMBERS = [
  { id: "EA-DEMO-01", sn: 1, flat: 1, membership: "101", name: "MR. Arjun Demo", deceased: false, hasCoOwner: false, floor: 0, email: "demo.member1@example.com", phone: "+91 99999 00001", alternatePhone: null, parking: "P-001", ownership: "Owner", status: "Active", login: "Enabled", lastLogin: "Today", committee: "President", vehicleNumber: "DL-XX-1001" },
  { id: "EA-DEMO-02", sn: 2, flat: 2, membership: null, name: "MRS. Priya Sample", deceased: false, hasCoOwner: false, floor: 0, email: null, phone: null, alternatePhone: null, parking: "P-002", ownership: "Owner", status: "Active", login: "No email", lastLogin: "—", committee: null, vehicleNumber: null },
  { id: "EA-DEMO-03", sn: 3, flat: 3, membership: "103", name: "MR. Ravi Placeholder", deceased: false, hasCoOwner: false, floor: 0, email: null, phone: "+91 99999 00003", alternatePhone: null, parking: null, ownership: "Owner", status: "Active", login: "No email", lastLogin: "—", committee: null, vehicleNumber: null },
  { id: "EA-DEMO-04", sn: 4, flat: 4, membership: "104", name: "MRS. Sunita Testcase", deceased: false, hasCoOwner: false, floor: 0, email: "demo.member4@example.com", phone: "+91 99999 00004", alternatePhone: null, parking: "P-004", ownership: "Owner", status: "Active", login: "Enabled", lastLogin: "2 days ago", committee: "Secretary", vehicleNumber: "DL-XX-1004" },
  { id: "EA-DEMO-05", sn: 5, flat: 5, membership: null, name: "MR. Amit Mockdata", deceased: false, hasCoOwner: false, floor: 0, email: null, phone: null, alternatePhone: null, parking: "P-005", ownership: "Tenant", status: "Active", login: "No email", lastLogin: "—", committee: null, vehicleNumber: null },
  { id: "EA-DEMO-06", sn: 6, flat: 6, membership: "106", name: "SMT. Kavita Sampleset", deceased: false, hasCoOwner: false, floor: 1, email: "demo.member6@example.com", phone: "+91 99999 00006", alternatePhone: null, parking: "P-006", ownership: "Owner", status: "Active", login: "Enabled", lastLogin: "Today", committee: "Treasurer", vehicleNumber: "DL-XX-1006" },
  { id: "EA-DEMO-07", sn: 7, flat: 7, membership: "107", name: "MR. Suresh & MRS Rekha Demouser", deceased: false, hasCoOwner: true, floor: 1, email: null, phone: "+91 99999 00007", alternatePhone: null, parking: null, ownership: "Owner (Joint)", status: "Active", login: "No email", lastLogin: "—", committee: null, vehicleNumber: null },
  { id: "EA-DEMO-08", sn: 8, flat: 8, membership: null, name: "MR. Vikram Testflat", deceased: false, hasCoOwner: false, floor: 1, email: "demo.member8@example.com", phone: null, alternatePhone: null, parking: "P-008", ownership: "Owner", status: "Active", login: "Pending", lastLogin: "—", committee: "Vice-President", vehicleNumber: "DL-XX-1008" },
  { id: "EA-DEMO-09", sn: 9, flat: 9, membership: "109", name: "MS. Nisha Demoname", deceased: false, hasCoOwner: false, floor: 2, email: null, phone: null, alternatePhone: null, parking: null, ownership: "Tenant", status: "Active", login: "No email", lastLogin: "—", committee: null, vehicleNumber: null },
  { id: "EA-DEMO-10", sn: 10, flat: 10, membership: "110", name: "MR. Anil Sampleman", deceased: false, hasCoOwner: false, floor: 2, email: "demo.member10@example.com", phone: "+91 99999 00010", alternatePhone: "+91 88888 00010", parking: "P-010", ownership: "Owner", status: "Active", login: "Enabled", lastLogin: "3 days ago", committee: null, vehicleNumber: "DL-XX-1010" },
  { id: "EA-DEMO-11", sn: 11, flat: 11, membership: "111", name: "ADMIN Testaccount", deceased: false, hasCoOwner: false, floor: 0, email: "admin@example.com", phone: "+91 99999 00111", alternatePhone: null, parking: "P-111", ownership: "Owner", status: "Active", login: "Enabled", lastLogin: "Today", committee: null, vehicleNumber: null },
  { id: "EA-DEMO-12", sn: 12, flat: 12, membership: null, name: "MRS. Demo Resident", deceased: false, hasCoOwner: false, floor: 3, email: null, phone: null, alternatePhone: null, parking: null, ownership: "Owner", status: "Inactive", login: "No email", lastLogin: "—", committee: null, vehicleNumber: null },
];

// ── Remaining 153 placeholder members (flat 13–165) ─────────────────────────
for (let i = 13; i <= 165; i++) {
  const hasEmail = i % 3 === 0;
  const hasPhone = i % 2 === 0;
  const hasParking = i % 4 !== 0;
  const hasMembership = i % 5 !== 0;
  MEMBERS.push({
    id: `EA-DEMO-${String(i).padStart(3, "0")}`,
    sn: i,
    flat: i,
    membership: hasMembership ? String(200 + i) : null,
    name: `Demo Resident ${i}`,
    deceased: false,
    hasCoOwner: false,
    floor: Math.floor((i - 1) / 41),
    email: hasEmail ? `demo.flat${i}@example.com` : null,
    phone: hasPhone ? `+91 99999 ${String(10000 + i).slice(1)}` : null,
    alternatePhone: null,
    parking: hasParking ? `P-${String(i).padStart(3, "0")}` : null,
    ownership: i % 7 === 0 ? "Tenant" : "Owner",
    status: "Active",
    login: hasEmail ? "Enabled" : "No email",
    lastLogin: hasEmail && i % 6 === 0 ? "Today" : "—",
    committee: null,
    vehicleNumber: null,
  });
}

// Admin credentials: flat 111 / password "admin4321"
// Member credentials: any flat number / password "admin123"
