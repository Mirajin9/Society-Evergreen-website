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
  records: Array<{ key: string; label: string; defaultVisibility: LocalVisibility; description: string }>;
  complaintCategories: string[];
}

export interface LocalSession {
  username: string;
  flatNo: number;
  activeRole: LocalRole;
  roles: LocalRole[];
}

const STORE_KEY = "evergreen.localStore.v1";
const SESSION_KEY = "evergreen.localSession.v1";
const CURRENT_VERSION = 2;

const recordCategories = [
  ["agm", "AGM / SGM / General Body Records", "members", "Meeting notice, agenda, minutes, resolutions, annexures."],
  ["mc", "Managing Committee Records", "members", "MC notices, agendas, minutes, resolutions and decisions."],
  ["finance", "Financial & Audit Records", "members", "Audit reports, audited accounts, annual returns, statements."],
  ["notices", "Notices & Announcements", "members", "Society notices, shutdown notices, circulars and emergency notices."],
  ["elections", "Election Records", "members", "Election schedule, nominations, candidate lists and results."],
  ["parking", "Parking Information", "members", "Parking policies, allocations, visitor rules and vehicle records."],
  ["forms", "Forms & Downloadable Formats", "members", "NOC, tenant, renovation, parking, complaint and update forms."]
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

let initPromise: Promise<LocalStore> | null = null;

export async function ensureLocalStore(): Promise<LocalStore> {
  if (initPromise) return initPromise;
  initPromise = loadStore();
  return initPromise;
}

async function loadStore(): Promise<LocalStore> {
  const existing = readStore();
  if (existing) return migrateStore(existing);

  const seed = await fetch("/api/local/seed", { cache: "no-store" }).then((res) => res.json());
  const members = (seed.members || []).map(normalizeMember) as LocalMember[];
  const store: LocalStore = {
    version: CURRENT_VERSION,
    society: seed.society,
    members,
    credentials: members.map((member) => ({
      username: String(member.flatNo),
      flatNo: member.flatNo,
      password: member.flatNo === 111 ? "admin4321" : "admin123",
      roles: member.flatNo === 111 ? ["member", "admin"] : ["member"]
    })),
    events: defaultEvents,
    documents: [],
    records: recordCategories.map(([key, label, defaultVisibility, description]) => ({
      key,
      label,
      defaultVisibility,
      description
    })),
    complaintCategories: [
      "Maintenance",
      "Water",
      "Electricity",
      "Lift",
      "Security",
      "Parking",
      "Cleanliness",
      "Billing/accounts",
      "Structural/repair",
      "Staff/vendor issue",
      "Other"
    ]
  };
  writeStore(store);
  return store;
}

function migrateStore(store: LocalStore): LocalStore {
  let changed = false;
  const next = { ...store } as LocalStore;
  if (!Array.isArray(next.documents)) {
    next.documents = [];
    changed = true;
  }
  if (next.version !== CURRENT_VERSION) {
    next.version = CURRENT_VERSION;
    changed = true;
  }
  if (changed) writeStore(next);
  return next;
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
  const credential = store.credentials.find((item) => item.username === username.trim());
  if (!credential || credential.password !== password) {
    throw new Error("Invalid flat number or password.");
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
  writeStore(store);
  return member;
}

export async function updateSociety(society: LocalStore["society"]) {
  const store = await ensureLocalStore();
  store.society = society;
  writeStore(store);
  return society;
}

export async function addEvent(event: Omit<LocalEvent, "id">) {
  const store = await ensureLocalStore();
  const next = { ...event, id: `evt-${Date.now()}` };
  store.events = [...store.events, next];
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
  writeStore(store);
  return next;
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
  return {
    id: member.id,
    flatNo: member.flat,
    membershipNo: member.membership,
    block: "Main",
    floor: member.floor ?? null,
    name: member.name,
    fatherSpouseName: null,
    email: member.email,
    phone: member.phone,
    alternatePhone: member.alternatePhone,
    ownership: member.ownership || "Owner",
    status: member.status || "Active",
    dateOfMembership: null,
    parkingSlot: member.parking,
    vehicleNumber: member.vehicleNumber,
    remarks: member.deceased ? "Marked deceased in imported member list" : null,
    committeeRole: member.committee
  };
}
