"use client";

export type LocalRole = "member" | "admin";
export type LocalVisibility = "public" | "members" | "committee" | "admin";

export interface LocalMember {
  id: string;
  flatNo: number;
  membershipNo: string | null;
  block: string;
  floor: number | null;
  name: string;
  fatherSpouseName: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  ownership: string;
  status: string;
  dateOfMembership: string | null;
  parkingSlot: string | null;
  vehicleNumber: string | null;
  remarks: string | null;
  committeeRole: string | null;
}

export interface LocalCredential {
  username: string;
  flatNo: number;
  password: string;
  roles: LocalRole[];
  isGeneratedFallback?: boolean;
  note?: string;
}

export interface LocalEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  visibility: LocalVisibility;
  reminder: boolean;
}

export interface LocalDocument {
  id: string;
  title: string;
  category: string;
  visibility: LocalVisibility;
  description: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface LocalShareCertificateRegister {
  id: string;
  fileName: string;
  uploadedAt: string;
  columns: string[];
  rows: Record<string, string>[];
}

export type NoticeCategory = "general" | "maintenance" | "agm" | "urgent" | "event";

export interface LocalNotice {
  id: string;
  title: string;
  body: string;
  date: string;            // ISO date
  category: NoticeCategory;
  pinned: boolean;
  targetFlatNos: number[] | null; // null = all members
}

export interface LocalReminder {
  id: string;
  flatNo: number | null;   // null = applies to all members
  text: string;
  dueDate: string | null;  // ISO date
  type: "dues" | "document" | "general";
}

export interface LocalDues {
  flatNo: number;
  monthlyMaintenance: number;
  outstanding: number;
  lastPaidDate: string | null;
  lastPaidAmount: number;
  status: "paid" | "due" | "overdue";
}

export interface AgmRecord {
  id: string;
  type: "AGM" | "SGM";
  fy: string;              // e.g. "2024-25"
  date: string;           // ISO date
  status: "completed" | "scheduled";
  venue: string;
  time: string;
  agenda: string[];
  resolutions: string[];  // populated for completed meetings
  minutesAvailable: boolean;
}

export interface ChangeRequest {
  id: string;
  flatNo: number;
  field: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;       // ISO datetime
}

export interface LocalAuditLog {
  id: string;
  actorUsername: string;
  actorFlatNo: number | null;
  actorRole: LocalRole | "system";
  action: string;
  targetType: string;
  targetLabel: string;
  details: string;
  createdAt: string;
}

export interface LocalStore {
  version: number;
  society: {
    name: string;
    registrationNo: string;
    address: string;
    officeTimings: string;
    email: string;
    phone: string;
    preferredDomain: string;
  };
  members: LocalMember[];
  credentials: LocalCredential[];
  events: LocalEvent[];
  documents: LocalDocument[];
  shareCertificateRegister: LocalShareCertificateRegister | null;
  records: Array<{ key: string; label: string; defaultVisibility: LocalVisibility; description: string }>;
  complaintCategories: string[];
  notices: LocalNotice[];
  reminders: LocalReminder[];
  dues: LocalDues[];
  agms: AgmRecord[];
  changeRequests: ChangeRequest[];
  auditLogs: LocalAuditLog[];
}

export interface LocalSession {
  username: string;
  flatNo: number;
  activeRole: LocalRole;
  roles: LocalRole[];
}

const STORE_KEY = "evergreen.localStore.v1";
const SESSION_KEY = "evergreen.localSession.v1";
const CURRENT_VERSION = 7;

const MC_ROLES_BY_FLAT: Record<number, string> = {
  157: "President",
  133: "Vice President",
  113: "Secretary",
  99: "Treasurer",
  111: "MC Member"
};

const recordCategories = [
  ["agm", "AGM / SGM / General Body Records", "members", "Meeting notice, agenda, minutes, resolutions, annexures."],
  ["mc", "Managing Committee Records", "members", "MC notices, agendas, minutes, resolutions and decisions."],
  ["share_certificates", "Share Certificate Register", "members", "Read-only register of share certificates issued by the MC."],
  ["finance", "Financial & Audit Records", "members", "Audit reports, audited accounts, annual returns, statements."],
  ["notices", "Notices & Announcements", "members", "Society notices, shutdown notices, circulars and emergency notices."],
  ["elections", "Election Records", "members", "Election schedule, nominations, candidate lists and results."],
  ["vehicles", "Vehicle Register", "members", "List of vehicles declared by members."],
  ["forms", "Forms & Downloadable Formats", "members", "NOC, tenant, renovation, complaint and update forms."]
] as const;

const defaultEvents: LocalEvent[] = [
  {
    id: "evt-public-1",
    title: "Independence Day gathering",
    date: "2026-08-15",
    startTime: "08:00",
    endTime: "10:00",
    location: "Central lawn",
    description: "Flag hoisting and breakfast for residents and guests.",
    visibility: "public",
    reminder: false
  },
  {
    id: "evt-member-1",
    title: "Monthly Managing Committee meeting",
    date: "2026-06-15",
    startTime: "18:30",
    endTime: "19:30",
    location: "Society office",
    description: "Internal committee meeting.",
    visibility: "members",
    reminder: true
  }
];

const defaultNotices: LocalNotice[] = [
  {
    id: "ntc-1",
    title: "47th Annual General Meeting — Notice",
    body: "Notice is hereby given that the 47th AGM of Evergreen Apartment CGHS Ltd. will be held on 28 September 2026 at 11:00 AM in the Community Hall. All members are requested to attend. Agenda enclosed.",
    date: "2026-09-05",
    category: "agm",
    pinned: true,
    targetFlatNos: null
  },
  {
    id: "ntc-2",
    title: "Water tank cleaning — 12 June",
    body: "Overhead and underground water tanks will be cleaned on 12 June 2026 between 10 AM and 2 PM. Water supply will remain suspended during this period. Kindly store water in advance.",
    date: "2026-06-08",
    category: "maintenance",
    pinned: false,
    targetFlatNos: null
  },
  {
    id: "ntc-3",
    title: "Maintenance charges for Q2 FY 2026-27",
    body: "Quarterly maintenance charges for July–September 2026 are now due. Members are requested to clear dues by 15 July 2026 to avoid a late fee of ₹100 per month.",
    date: "2026-06-01",
    category: "general",
    pinned: false,
    targetFlatNos: null
  },
  {
    id: "ntc-4",
    title: "Lift modernization work — Block A",
    body: "Modernization of the Block A lift will be carried out from 18–20 June 2026. Residents may use the Block B lift during this period. Inconvenience is regretted.",
    date: "2026-05-28",
    category: "urgent",
    pinned: false,
    targetFlatNos: null
  }
];

const defaultAgms: AgmRecord[] = [
  {
    id: "agm-next",
    type: "AGM",
    fy: "2025-26",
    date: "2026-09-28",
    status: "scheduled",
    venue: "Community Hall, Evergreen Apartment",
    time: "11:00 AM",
    agenda: [
      "Confirmation of the minutes of the previous AGM",
      "Adoption of the audited accounts for FY 2025-26",
      "Consideration of the auditor's report and replies to audit observations",
      "Approval of the annual budget for FY 2026-27",
      "Revision of monthly maintenance charges",
      "Appointment of the statutory auditor for the next financial year",
      "Election of the new Managing Committee",
      "Any other matter with the permission of the Chair"
    ],
    resolutions: [],
    minutesAvailable: false
  },
  {
    id: "agm-last",
    type: "AGM",
    fy: "2024-25",
    date: "2025-09-21",
    status: "completed",
    venue: "Community Hall, Evergreen Apartment",
    time: "11:00 AM",
    agenda: [
      "Confirmation of the minutes of the previous AGM",
      "Adoption of the audited accounts for FY 2024-25",
      "Approval of the annual budget for FY 2025-26",
      "Repair and waterproofing of terrace",
      "Appointment of the statutory auditor"
    ],
    resolutions: [
      "Audited accounts for FY 2024-25 were adopted unanimously.",
      "Annual budget for FY 2025-26 was approved with no objections.",
      "Terrace waterproofing approved at an estimated cost of ₹4.5 lakh, funded from the sinking fund.",
      "M/s. Verma & Associates re-appointed as statutory auditor for FY 2025-26.",
      "Monthly maintenance retained at the existing rate."
    ],
    minutesAvailable: true
  }
];

// Generates demo maintenance dues for every member (fictional figures).
function makeDuesForMembers(members: LocalMember[]): LocalDues[] {
  return members.map((m) => {
    const base = 2500;
    const cyclesOwed = m.flatNo % 4; // 0..3 quarters outstanding
    const outstanding = cyclesOwed * base;
    const status: LocalDues["status"] = outstanding === 0 ? "paid" : cyclesOwed >= 3 ? "overdue" : "due";
    return {
      flatNo: m.flatNo,
      monthlyMaintenance: base,
      outstanding,
      lastPaidDate: outstanding === 0 ? "2026-06-02" : "2026-03-05",
      lastPaidAmount: base,
      status
    };
  });
}

// A small set of demo personal + society-wide reminders.
function makeRemindersForMembers(members: LocalMember[]): LocalReminder[] {
  const reminders: LocalReminder[] = [
    { id: "rem-all-1", flatNo: null, text: "Submit updated KYC / ownership proof to the society office.", dueDate: "2026-06-30", type: "document" },
    { id: "rem-all-2", flatNo: null, text: "47th AGM on 28 September 2026 — please mark your attendance.", dueDate: "2026-09-28", type: "general" }
  ];
  // Add a dues reminder for flats with outstanding amounts (first few only for demo).
  members.filter((m) => m.flatNo % 4 !== 0).slice(0, 30).forEach((m) => {
    reminders.push({
      id: `rem-dues-${m.flatNo}`,
      flatNo: m.flatNo,
      text: "Maintenance dues are pending for your flat. Kindly clear them at the earliest.",
      dueDate: "2026-07-15",
      type: "dues"
    });
  });
  return reminders;
}

let initPromise: Promise<LocalStore> | null = null;

export async function ensureLocalStore(): Promise<LocalStore> {
  if (initPromise) return initPromise;
  initPromise = loadStore();
  return initPromise;
}

// Bundled fallback seed used when /api/local/seed is unavailable (e.g. static GitHub Pages).
// Fictional data only — 12 demo members, all @example.com emails.
const DEMO_SEED = {
  society: {
    name: "Evergreen Apartment", registrationNo: "Regd No. 837",
    address: "Plot 9, Sector 7, Dwarka, New Delhi 110075",
    officeTimings: "To be updated", email: "evergreensocietyplot9@gmail.com",
    phone: "011-42441492", preferredDomain: "evergreen-dwarka"
  },
  documents: [] as LocalDocument[],
  shareCertificateRegister: null as LocalShareCertificateRegister | null,
  members: [
    { id: "EA-DEMO-01", flat: 1, membership: "101", name: "MR. Arjun Demo", floor: 0, email: "demo.member1@example.com", phone: "+91 99999 00001", alternatePhone: null, ownership: "Owner", status: "Active", committee: "President", vehicleNumber: "DL-XX-1001" },
    { id: "EA-DEMO-02", flat: 2, membership: null, name: "MRS. Priya Sample", floor: 0, email: null, phone: null, alternatePhone: null, ownership: "Owner", status: "Active", committee: null, vehicleNumber: null },
    { id: "EA-DEMO-03", flat: 3, membership: "103", name: "MR. Ravi Placeholder", floor: 0, email: null, phone: "+91 99999 00003", alternatePhone: null, ownership: "Owner", status: "Active", committee: null, vehicleNumber: null },
    { id: "EA-DEMO-04", flat: 4, membership: "104", name: "MRS. Sunita Testcase", floor: 0, email: "demo.member4@example.com", phone: "+91 99999 00004", alternatePhone: null, ownership: "Owner", status: "Active", committee: "Secretary", vehicleNumber: "DL-XX-1004" },
    { id: "EA-DEMO-05", flat: 5, membership: null, name: "MR. Amit Mockdata", floor: 0, email: null, phone: null, alternatePhone: null, ownership: "Tenant", status: "Active", committee: null, vehicleNumber: null },
    { id: "EA-DEMO-06", flat: 6, membership: "106", name: "SMT. Kavita Sampleset", floor: 1, email: "demo.member6@example.com", phone: "+91 99999 00006", alternatePhone: null, ownership: "Owner", status: "Active", committee: "Treasurer", vehicleNumber: "DL-XX-1006" },
    { id: "EA-DEMO-07", flat: 7, membership: "107", name: "MR. Suresh Demouser", floor: 1, email: null, phone: "+91 99999 00007", alternatePhone: null, ownership: "Owner (Joint)", status: "Active", committee: null, vehicleNumber: null },
    { id: "EA-DEMO-08", flat: 8, membership: null, name: "MR. Vikram Testflat", floor: 1, email: "demo.member8@example.com", phone: null, alternatePhone: null, ownership: "Owner", status: "Active", committee: "Vice-President", vehicleNumber: "DL-XX-1008" },
    { id: "EA-DEMO-09", flat: 9, membership: "109", name: "MS. Nisha Demoname", floor: 2, email: null, phone: null, alternatePhone: null, ownership: "Tenant", status: "Active", committee: null, vehicleNumber: null },
    { id: "EA-DEMO-10", flat: 10, membership: "110", name: "MR. Anil Sampleman", floor: 2, email: "demo.member10@example.com", phone: "+91 99999 00010", alternatePhone: "+91 88888 00010", ownership: "Owner", status: "Active", committee: null, vehicleNumber: "DL-XX-1010" },
    { id: "EA-DEMO-11", flat: 111, membership: "111", name: "ADMIN Testaccount", floor: 0, email: "admin@example.com", phone: "+91 99999 00111", alternatePhone: null, ownership: "Owner", status: "Active", committee: null, vehicleNumber: null },
    { id: "EA-DEMO-12", flat: 12, membership: null, name: "MRS. Demo Resident", floor: 3, email: null, phone: null, alternatePhone: null, ownership: "Owner", status: "Inactive", committee: null, vehicleNumber: null },
  ]
};

async function loadStore(): Promise<LocalStore> {
  const existing = readStore();
  const seed = await loadSeed();
  if (existing) return migrateStore(existing, seed);

  const members = (seed.members || []).map(normalizeMember) as LocalMember[];
  const store: LocalStore = {
    version: CURRENT_VERSION,
    society: seed.society,
    members,
    credentials: makeCredentials(members),
    events: defaultEvents,
    documents: seed.documents || [],
    shareCertificateRegister: null,
    records: makeRecordCategories(),
    complaintCategories: [
      "Maintenance",
      "Water",
      "Electricity",
      "Lift",
      "Security",
      "Cleanliness",
      "Billing/accounts",
      "Structural/repair",
      "Staff/vendor issue",
      "Other"
    ],
    notices: defaultNotices,
    reminders: makeRemindersForMembers(members),
    dues: makeDuesForMembers(members),
    agms: defaultAgms,
    changeRequests: [],
    auditLogs: [
      makeAuditLog({
        action: "system.seeded",
        targetType: "system",
        targetLabel: "Local portal data",
        details: "Initial local store created from uploaded member list and default records.",
        actorRole: "system"
      })
    ]
  };
  writeStore(store);
  return store;
}

async function loadSeed(): Promise<typeof DEMO_SEED> {
  let seed: typeof DEMO_SEED = DEMO_SEED;
  try {
    const res = await fetch("/api/local/seed", { cache: "no-store" });
    if (res.ok) seed = await res.json();
  } catch {
    // Static deployment (e.g. GitHub Pages) — API unavailable, using bundled demo data
  }
  return seed;
}

function migrateStore(store: LocalStore, seed: typeof DEMO_SEED): LocalStore {
  let changed = false;
  const next = { ...store } as LocalStore;
  if (store.version < 7 && seed.members?.length) {
    next.members = seed.members.map(normalizeMember);
    next.credentials = makeCredentials(next.members);
    next.reminders = makeRemindersForMembers(next.members);
    next.dues = makeDuesForMembers(next.members);
    changed = true;
  } else if (store.version < 5) {
    next.credentials = makeCredentials(next.members || []);
    if (seed.documents?.length && (!next.documents || next.documents.length === 0)) {
      next.documents = seed.documents;
    }
    changed = true;
  } else {
    next.members = (next.members || []).map((member) => ({
      ...member,
      committeeRole: MC_ROLES_BY_FLAT[member.flatNo] || member.committeeRole || null,
      parkingSlot: null
    }));
    next.credentials = makeCredentials(next.members);
  }
  if (!Array.isArray(next.documents)) {
    next.documents = [];
    changed = true;
  }
  const mergedDocuments = mergeSeedDocuments(next.documents, seed.documents || []);
  if (mergedDocuments.length !== next.documents.length) {
    next.documents = mergedDocuments;
    changed = true;
  }
  if ((next as Partial<LocalStore>).shareCertificateRegister === undefined) {
    next.shareCertificateRegister = seed.shareCertificateRegister || null;
    changed = true;
  }
  if (!next.shareCertificateRegister && seed.shareCertificateRegister) {
    next.shareCertificateRegister = seed.shareCertificateRegister;
    changed = true;
  }
  next.records = makeRecordCategories();
  if (!Array.isArray(next.notices)) {
    next.notices = defaultNotices;
    changed = true;
  } else {
    next.notices = next.notices.map((notice) => ({
      ...notice,
      targetFlatNos: notice.targetFlatNos === undefined ? null : notice.targetFlatNos
    }));
  }
  if (!Array.isArray(next.reminders)) {
    next.reminders = makeRemindersForMembers(next.members || []);
    changed = true;
  }
  if (!Array.isArray(next.dues)) {
    next.dues = makeDuesForMembers(next.members || []);
    changed = true;
  }
  if (!Array.isArray(next.agms)) {
    next.agms = defaultAgms;
    changed = true;
  }
  if (!Array.isArray(next.changeRequests)) {
    next.changeRequests = [];
    changed = true;
  }
  if (!Array.isArray(next.auditLogs)) {
    next.auditLogs = [
      makeAuditLog({
        action: "system.migrated",
        targetType: "system",
        targetLabel: "Local portal data",
        details: "Audit timeline enabled for local admin review.",
        actorRole: "system"
      })
    ];
    changed = true;
  }
  if (next.version !== CURRENT_VERSION) {
    next.version = CURRENT_VERSION;
    changed = true;
  }
  if (changed) writeStore(next);
  return next;
}

function mergeSeedDocuments(current: LocalDocument[], seed: LocalDocument[]) {
  if (!seed.length) return current;
  const existing = new Set(current.map((document) => document.id));
  const missing = seed.filter((document) => !existing.has(document.id));
  return missing.length ? [...missing, ...current] : current;
}

function makeAuditLog(input: {
  action: string;
  targetType: string;
  targetLabel: string;
  details: string;
  actorRole?: LocalRole | "system";
}): LocalAuditLog {
  const session = getSession();
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorUsername: session?.username || "system",
    actorFlatNo: session?.flatNo || null,
    actorRole: input.actorRole || session?.activeRole || "system",
    action: input.action,
    targetType: input.targetType,
    targetLabel: input.targetLabel,
    details: input.details,
    createdAt: new Date().toISOString()
  };
}

function appendAudit(store: LocalStore, input: Parameters<typeof makeAuditLog>[0]) {
  store.auditLogs = [makeAuditLog(input), ...(store.auditLogs || [])].slice(0, 500);
}

function makeRecordCategories() {
  return recordCategories.map(([key, label, defaultVisibility, description]) => ({
    key,
    label,
    defaultVisibility,
    description
  }));
}

function makeCredentials(members: LocalMember[]): LocalCredential[] {
  return members.map((member) => {
    const roles: LocalRole[] = member.committeeRole ? ["member", "admin"] : ["member"];
    const mobile = primaryMobile(member);
    const membership = member.membershipNo?.trim();
    if (roles.includes("admin")) {
      const suffix = mobile?.slice(-4) || String(member.flatNo).padStart(3, "0");
      return {
        username: `mc${member.flatNo}`,
        flatNo: member.flatNo,
        password: `MC@${member.flatNo}${suffix}`,
        roles,
        isGeneratedFallback: true,
        note: `${member.committeeRole} account. Share directly with the MC member.`
      };
    }
    return {
      username: mobile || `flat${member.flatNo}`,
      flatNo: member.flatNo,
      password: membership || `EA@${String(member.flatNo).padStart(3, "0")}`,
      roles,
      isGeneratedFallback: !mobile || !membership,
      note: !mobile && !membership
        ? "Missing mobile and membership number; generated fallback credentials."
        : !mobile
          ? "Missing mobile number; generated fallback username."
          : !membership
            ? "Missing membership number; generated fallback password."
            : "Initial username is registered mobile; initial password is membership number."
    };
  });
}

function primaryMobile(member: LocalMember) {
  return firstTenDigitNumber(member.phone) || firstTenDigitNumber(member.alternatePhone);
}

function firstTenDigitNumber(value: string | null) {
  const digits = value?.replace(/\D/g, "") || "";
  if (digits.length < 10) return null;
  return digits.match(/[6-9]\d{9}/)?.[0] || digits.slice(0, 10);
}

export function readStore(): LocalStore | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORE_KEY);
  return raw ? JSON.parse(raw) as LocalStore : null;
}

export function writeStore(store: LocalStore) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export async function loginLocal(username: string, password: string): Promise<LocalSession> {
  const store = await ensureLocalStore();
  const normalizedUsername = username.trim();
  const credential = store.credentials.find((item) => item.username === normalizedUsername && item.password === password);
  if (!credential) {
    throw new Error("Invalid username or password.");
  }
  const session: LocalSession = {
    username: credential.username,
    flatNo: credential.flatNo,
    activeRole: credential.roles.includes("admin") ? "admin" : "member",
    roles: credential.roles
  };
  setSession(session);
  return session;
}

const OTP_KEY = "evergreen.otp.v1";
const MOCK_OTP = "123456";

interface OtpState { mobile: string; flatNo: number; expiresAt: number }

export async function requestOtp(mobile: string): Promise<{ flatNo: number }> {
  const store = await ensureLocalStore();
  const normalized = mobile.replace(/\D/g, "");
  const member = store.members.find(
    (m) =>
      m.phone?.replace(/\D/g, "") === normalized ||
      m.alternatePhone?.replace(/\D/g, "") === normalized
  );
  if (!member) {
    throw new Error("NOT_REGISTERED");
  }
  const state: OtpState = { mobile: normalized, flatNo: member.flatNo, expiresAt: Date.now() + 5 * 60 * 1000 };
  window.localStorage.setItem(OTP_KEY, JSON.stringify(state));
  // Mock: log OTP to console instead of sending SMS
  console.log(`[DEV] OTP for ${mobile} (Flat ${member.flatNo}): ${MOCK_OTP}`);
  return { flatNo: member.flatNo };
}

export async function verifyOtp(mobile: string, otp: string): Promise<LocalSession> {
  const raw = window.localStorage.getItem(OTP_KEY);
  if (!raw) throw new Error("OTP expired. Please request a new one.");
  const state = JSON.parse(raw) as OtpState;
  const normalized = mobile.replace(/\D/g, "");
  if (state.mobile !== normalized) throw new Error("Mobile number mismatch. Please request a new OTP.");
  if (Date.now() > state.expiresAt) {
    window.localStorage.removeItem(OTP_KEY);
    throw new Error("OTP has expired. Please request a new one.");
  }
  if (otp.trim() !== MOCK_OTP) {
    throw new Error("INVALID_OTP");
  }
  window.localStorage.removeItem(OTP_KEY);
  const store = await ensureLocalStore();
  const member = store.members.find((m) => m.flatNo === state.flatNo);
  const credential = store.credentials.find((c) => c.flatNo === state.flatNo);
  const session: LocalSession = {
    username: String(state.flatNo),
    flatNo: state.flatNo,
    activeRole: credential?.roles.includes("admin") ? "admin" : "member",
    roles: credential?.roles || ["member"]
  };
  setSession(session);
  return session;
}

export function getSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) as LocalSession : null;
}

export function setSession(session: LocalSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function logoutLocal() {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function switchRole(role: LocalRole) {
  const session = getSession();
  if (!session || !session.roles.includes(role)) throw new Error("Role not available.");
  const next = { ...session, activeRole: role };
  setSession(next);
  return next;
}

export async function changeLocalCredentials(input: { username: string; password: string }) {
  const session = getSession();
  if (!session) throw new Error("Please sign in again.");
  const store = await ensureLocalStore();
  if (!input.username.trim() || input.password.length < 6) {
    throw new Error("Username is required and password must be at least 6 characters.");
  }
  const duplicate = store.credentials.some((item) => item.username === input.username.trim() && item.flatNo !== session.flatNo);
  if (duplicate) throw new Error("That username is already in use.");
  store.credentials = store.credentials.map((item) => item.flatNo === session.flatNo
    ? { ...item, username: input.username.trim(), password: input.password }
    : item);
  writeStore(store);
  const next = { ...session, username: input.username.trim() };
  setSession(next);
  return next;
}

export function memberForSession(store: LocalStore, session: LocalSession | null) {
  if (!session) return null;
  return store.members.find((member) => member.flatNo === session.flatNo) || null;
}

export async function updateMember(member: LocalMember) {
  const store = await ensureLocalStore();
  store.members = store.members.map((item) => item.id === member.id ? member : item);
  appendAudit(store, {
    action: "member.updated",
    targetType: "member",
    targetLabel: `Flat ${member.flatNo}`,
    details: "Member profile details were updated."
  });
  writeStore(store);
  return member;
}

export async function updateSociety(society: LocalStore["society"]) {
  const store = await ensureLocalStore();
  store.society = society;
  appendAudit(store, {
    action: "society.updated",
    targetType: "society",
    targetLabel: society.name,
    details: "Society profile settings were updated."
  });
  writeStore(store);
  return society;
}

export async function addEvent(event: Omit<LocalEvent, "id">) {
  const store = await ensureLocalStore();
  const next = { ...event, id: `evt-${Date.now()}` };
  store.events = [...store.events, next];
  appendAudit(store, {
    action: "event.created",
    targetType: "event",
    targetLabel: next.title,
    details: `${next.visibility} event scheduled for ${next.date}.`
  });
  writeStore(store);
  return next;
}

export async function addDocument(document: Omit<LocalDocument, "id" | "uploadedAt">) {
  const store = await ensureLocalStore();
  const next: LocalDocument = {
    ...document,
    id: `doc-${Date.now()}`,
    uploadedAt: new Date().toISOString()
  };
  store.documents = [next, ...(store.documents || [])];
  appendAudit(store, {
    action: "document.uploaded",
    targetType: "document",
    targetLabel: next.title,
    details: `${next.fileName} uploaded as ${next.category} with ${next.visibility} visibility.`
  });
  writeStore(store);
  return next;
}

export async function addNotice(notice: Omit<LocalNotice, "id" | "date" | "targetFlatNos"> & { date?: string; targetFlatNos?: number[] | null }) {
  const store = await ensureLocalStore();
  const next: LocalNotice = {
    ...notice,
    id: `ntc-${Date.now()}`,
    date: notice.date || new Date().toISOString().slice(0, 10),
    targetFlatNos: notice.targetFlatNos ?? null
  };
  store.notices = [next, ...(store.notices || [])];
  appendAudit(store, {
    action: "notice.published",
    targetType: "notice",
    targetLabel: next.title,
    details: next.targetFlatNos?.length
      ? `Targeted to flats ${next.targetFlatNos.join(", ")}.`
      : "Published to all members."
  });
  writeStore(store);
  return next;
}

export async function saveShareCertificateRegister(input: Omit<LocalShareCertificateRegister, "id" | "uploadedAt">) {
  const store = await ensureLocalStore();
  const next: LocalShareCertificateRegister = {
    ...input,
    id: `share-cert-${Date.now()}`,
    uploadedAt: new Date().toISOString()
  };
  store.shareCertificateRegister = next;
  appendAudit(store, {
    action: "share_certificates.imported",
    targetType: "share_certificate_register",
    targetLabel: input.fileName,
    details: `${next.rows.length} row(s) imported for member view-only access.`
  });
  writeStore(store);
  return next;
}

export function duesForFlat(store: LocalStore, flatNo: number): LocalDues | null {
  return (store.dues || []).find((d) => d.flatNo === flatNo) || null;
}

export function remindersForFlat(store: LocalStore, flatNo: number): LocalReminder[] {
  return (store.reminders || []).filter((r) => r.flatNo === null || r.flatNo === flatNo);
}

export function sortedNotices(store: LocalStore): LocalNotice[] {
  return [...(store.notices || [])].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function noticesForFlat(store: LocalStore, flatNo: number): LocalNotice[] {
  return sortedNotices(store).filter((notice) => {
    return !notice.targetFlatNos?.length || notice.targetFlatNos.includes(flatNo);
  });
}

export function nextAgm(store: LocalStore): AgmRecord | null {
  return (store.agms || [])
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;
}

export function lastAgm(store: LocalStore): AgmRecord | null {
  return (store.agms || [])
    .filter((a) => a.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;
}

export async function addChangeRequest(input: Omit<ChangeRequest, "id" | "status" | "createdAt">) {
  const store = await ensureLocalStore();
  const next: ChangeRequest = {
    ...input,
    id: `req-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  store.changeRequests = [next, ...(store.changeRequests || [])];
  appendAudit(store, {
    action: "change_request.created",
    targetType: "change_request",
    targetLabel: `Flat ${next.flatNo} - ${next.field}`,
    details: `Requested change from "${next.currentValue}" to "${next.requestedValue}".`
  });
  writeStore(store);
  return next;
}

export function changeRequestsForFlat(store: LocalStore, flatNo: number): ChangeRequest[] {
  return (store.changeRequests || [])
    .filter((r) => r.flatNo === flatNo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function visibleDocuments(store: LocalStore, role: LocalRole) {
  const rank: Record<LocalVisibility, number> = {
    public: 0,
    members: 1,
    committee: 2,
    admin: 3
  };
  const userRank = role === "admin" ? 3 : 1;
  return (store.documents || []).filter((document) => rank[document.visibility] <= userRank);
}

function normalizeMember(member: any): LocalMember {
  const flatNo = Number(member.flat ?? member.flatNo);
  const rawVehicle = member.vehicleNumber ?? member.cars ?? null;
  const vehicleNumber = rawVehicle && !/^no\s*car$/i.test(String(rawVehicle)) ? String(rawVehicle) : null;
  return {
    id: member.id || `EA-${String(flatNo).padStart(4, "0")}`,
    flatNo,
    membershipNo: member.membership,
    block: member.block || "Main",
    floor: member.floor ?? null,
    name: member.name,
    fatherSpouseName: member.fatherSpouseName ?? member.father ?? null,
    email: member.email,
    phone: member.phone,
    alternatePhone: member.alternatePhone,
    ownership: member.ownership || "Owner",
    status: member.status || "Active",
    dateOfMembership: null,
    parkingSlot: null,
    vehicleNumber,
    remarks: member.deceased ? "Marked deceased in imported member list" : null,
    committeeRole: MC_ROLES_BY_FLAT[flatNo] || member.committee || null
  };
}
