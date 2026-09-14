// Shared by the browser store and the server portal store.

export type PortalVisibility = "public" | "members" | "committee" | "admin";

export const VISIBILITIES: readonly PortalVisibility[] = ["public", "members", "committee", "admin"];

export const NOTICE_CATEGORIES = ["general", "maintenance", "agm", "urgent", "event"] as const;

export const RECORD_CATEGORIES: ReadonlyArray<{ key: string; label: string; defaultVisibility: PortalVisibility; description: string }> = [
  { key: "agm", label: "AGM / General Body Records", defaultVisibility: "members", description: "AGM notices, agendas, minutes, resolutions and annexures." },
  { key: "finance", label: "Audit Reports & Accounts", defaultVisibility: "members", description: "Audit reports, audited accounts, annual returns and financial statements." },
  { key: "notices", label: "Notices & Circulars", defaultVisibility: "members", description: "Society notices, circulars and important member updates." },
  { key: "share_certificates", label: "Share Certificate Register", defaultVisibility: "members", description: "Register of share certificates issued by the MC." },
  { key: "forms", label: "Forms & Downloadable Formats", defaultVisibility: "members", description: "Member forms and official formats shared by the society office." }
];

export const DEFAULT_SOCIETY = {
  name: "Evergreen Apartment",
  registrationNo: "Regd No. 837",
  address: "Plot 9, Sector 7, Dwarka, New Delhi 110075",
  officeTimings: "To be updated",
  email: "evergreensocietyplot9@gmail.com",
  phone: "011-42441492",
  preferredDomain: "evergreen-dwarka"
};

// Profile details members can ask the office to correct; a request stores the label.
export const CORRECTABLE_MEMBER_FIELDS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "alternatePhone", label: "Alternate phone" },
  { key: "membershipNo", label: "Membership number" },
  { key: "vehicleNumber", label: "Vehicle number(s)" },
  { key: "fatherSpouseName", label: "Father / Spouse name" }
] as const;

export const MAX_DOCUMENT_BYTES = 8_000_000;
export const DOCUMENT_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".txt", ".doc", ".docx", ".xls", ".xlsx"];
