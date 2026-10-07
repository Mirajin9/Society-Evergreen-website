"use client";

import { DEFAULT_SOCIETY, RECORD_CATEGORIES } from "@/app/lib/portal-constants";
import { MC_ROLES_BY_FLAT } from "@/app/lib/society-roles";

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
  staffLabel?: string;
  staffPhone?: string;
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

export type DocumentDetails = Pick<LocalDocument, "title" | "category" | "visibility" | "description">;

export interface LocalShareCertificateRegister {
  id: string;
  fileName: string;
  uploadedAt: string;
  columns: string[];
  rows: Record<string, string>[];
}

export type NoticeCategory = "general" | "maintenance" | "agm" | "urgent" | "event";
export type GalleryCategory = "activities" | "visits" | "celebrations" | "maintenance" | "community";

export interface LocalNotice {
  id: string;
  title: string;
  body: string;
  date: string;            // ISO date
  category: NoticeCategory;
  pinned: boolean;
  targetFlatNos: number[] | null; // null = all members
}

export interface LocalGalleryItem {
  id: string;
  title: string;
  caption: string;
  category: GalleryCategory;
  eventDate: string;       // ISO date
  imageName: string;
  mimeType: string;
  sizeBytes: number;
  imageDataUrl: string;
  featured: boolean;
  publishedAt: string;     // ISO datetime
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
  notices: LocalNotice[];
  galleryItems: LocalGalleryItem[];
  agms: AgmRecord[];
  changeRequests: ChangeRequest[];
  auditLogs: LocalAuditLog[];
}

export interface LocalSession {
  username: string;
  flatNo: number;
  activeRole: LocalRole;
  roles: LocalRole[];
  mustChangePassword?: boolean;
}

const SESSION_KEY = "evergreen.localSession.v1";
// Before server storage, each browser kept its own copy of the portal data under this key.
const LEGACY_STORE_KEY = "evergreen.localStore.v1";

let initPromise: Promise<LocalStore> | null = null;

// Portal data lives on the server (so every member sees the same notices and records);
// this caches one copy per page load. Any change through the functions below clears it.
export async function ensureLocalStore(): Promise<LocalStore> {
  initPromise ??= loadStore();
  return initPromise;
}

async function loadStore(): Promise<LocalStore> {
  let res: Response;
  try {
    res = await fetch("/api/portal/store", { cache: "no-store" });
  } catch {
    // Static deployment (e.g. GitHub Pages): no API, so show bundled demo data.
    initPromise = null;
    return emptyStore(DEMO_MEMBERS.map(normalizeMember));
  }
  if (!res.ok) {
    // Not signed in, or a password change is pending: show nothing and try again next time.
    initPromise = null;
    return emptyStore();
  }
  const store = (await res.json()).store as LocalStore;
  if (await syncLegacyBrowserData(store)) {
    const refreshed = await fetch("/api/portal/store", { cache: "no-store" }).catch(() => null);
    if (refreshed?.ok) return (await refreshed.json()).store as LocalStore;
  }
  return store;
}

function emptyStore(members: LocalMember[] = []): LocalStore {
  return {
    version: 12,
    society: { ...DEFAULT_SOCIETY },
    members,
    credentials: [],
    events: [],
    documents: [],
    shareCertificateRegister: null,
    records: RECORD_CATEGORIES.map((record) => ({ ...record })),
    notices: [],
    galleryItems: [],
    agms: [],
    changeRequests: [],
    auditLogs: []
  };
}

// Older builds saved MC notices, uploads, the share register and correction requests only in
// the browser that created them, so nobody else could see them. Copy anything still sitting in
// this browser up to the server once. The server ignores repeats (matched by legacyId).
async function syncLegacyBrowserData(server: LocalStore): Promise<boolean> {
  let legacy: Partial<LocalStore> | null = null;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORE_KEY);
    legacy = raw ? JSON.parse(raw) : null;
  } catch {
    legacy = null;
  }
  const session = getSession();
  if (!legacy || !session) return false;

  const admin = session.roles.includes("admin");
  const notices = legacy.notices || [];
  const uploads = (legacy.documents || []).filter((document) => document.dataUrl?.startsWith("data:"));
  const register = legacy.shareCertificateRegister || null;
  let sent = 0;
  let failed = 0;
  const post = async (url: string, init: RequestInit) => {
    try {
      const res = await fetch(url, { method: "POST", cache: "no-store", ...init });
      if (res.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  };

  if (admin) {
    for (const notice of notices) {
      await post("/api/portal/notices", jsonBody({ ...notice, legacyId: notice.id }));
    }
    for (const document of uploads) {
      try {
        const blob = await (await fetch(document.dataUrl)).blob();
        const form = new FormData();
        form.set("file", new File([blob], document.fileName, { type: document.mimeType }));
        form.set("title", document.title);
        form.set("category", document.category);
        form.set("visibility", document.visibility);
        form.set("description", document.description || "");
        form.set("legacyId", document.id);
        await post("/api/portal/documents", { body: form });
      } catch {
        failed++;
      }
    }
    if (register && !server.shareCertificateRegister) {
      await post("/api/portal/share-certificates", jsonBody(register));
    }
  }
  for (const request of legacy.changeRequests || []) {
    if (request.flatNo === session.flatNo) {
      await post("/api/portal/change-requests", jsonBody({ ...request, legacyId: request.id }));
    }
  }

  // A member's session can't upload MC content, so keep that for when an MC account signs in here.
  const hasMcContent = notices.length > 0 || uploads.length > 0 || !!register;
  if (failed === 0 && (admin || !hasMcContent)) window.localStorage.removeItem(LEGACY_STORE_KEY);
  return sent > 0;
}

function jsonBody(body: unknown): RequestInit {
  return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

async function send<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Something went wrong. Please try again.");
  initPromise = null;
  return payload as T;
}

interface ServerSession {
  username: string;
  flatNo: number;
  roles: LocalRole[];
  activeRole: LocalRole;
  mustChangePassword: boolean;
}

// The real session is an httpOnly cookie; this browser copy only drives the UI.
function mirrorServerSession(server: ServerSession): LocalSession {
  const previous = getSession();
  const activeRole = previous?.username === server.username && server.roles.includes(previous.activeRole)
    ? previous.activeRole
    : server.activeRole;
  const session: LocalSession = {
    username: server.username,
    flatNo: server.flatNo,
    roles: server.roles,
    activeRole,
    mustChangePassword: server.mustChangePassword
  };
  setSession(session);
  return session;
}

export async function loginLocal(username: string, password: string): Promise<LocalSession> {
  const payload = await send<{ session: ServerSession }>("/api/auth/login", { method: "POST", ...jsonBody({ username, password }) });
  window.localStorage.removeItem(SESSION_KEY);
  return mirrorServerSession(payload.session);
}

export async function refreshServerSession(): Promise<LocalSession | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return mirrorServerSession((await res.json()).session);
  } catch {
    return getSession();
  }
}

export function safeNextPath(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
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
  initPromise = null;
  void fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => undefined);
}

export async function switchRole(role: LocalRole) {
  const session = getSession();
  if (!session || !session.roles.includes(role)) throw new Error("Role not available.");
  const next = { ...session, activeRole: role };
  setSession(next);
  return next;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<LocalSession> {
  const payload = await send<{ session: ServerSession }>("/api/auth/change-password", {
    method: "POST",
    ...jsonBody({ currentPassword, newPassword })
  });
  return mirrorServerSession(payload.session);
}

export function memberForSession(store: LocalStore, session: LocalSession | null) {
  if (!session) return null;
  return store.members.find((member) => member.flatNo === session.flatNo) || null;
}

export async function updateMember(member: LocalMember): Promise<LocalMember> {
  const payload = await send<{ member: LocalMember }>(`/api/portal/members/${member.flatNo}`, { method: "PATCH", ...jsonBody(member) });
  return payload.member;
}

export async function updateSociety(society: LocalStore["society"]): Promise<LocalStore["society"]> {
  const payload = await send<{ society: LocalStore["society"] }>("/api/portal/society", { method: "PUT", ...jsonBody(society) });
  return payload.society;
}

export async function addDocument(input: {
  title: string;
  category: string;
  visibility: LocalVisibility;
  description: string;
  file: File;
}): Promise<LocalDocument> {
  const form = new FormData();
  form.set("file", input.file);
  form.set("title", input.title);
  form.set("category", input.category);
  form.set("visibility", input.visibility);
  form.set("description", input.description);
  const payload = await send<{ document: LocalDocument }>("/api/portal/documents", { method: "POST", body: form });
  return payload.document;
}

export async function updateDocument(id: string, details: DocumentDetails): Promise<LocalDocument> {
  const payload = await send<{ document: LocalDocument }>(`/api/portal/documents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    ...jsonBody(details)
  });
  return payload.document;
}

export async function deleteDocument(id: string): Promise<void> {
  await send(`/api/portal/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function addNotice(notice: Omit<LocalNotice, "id" | "date" | "targetFlatNos"> & { date?: string; targetFlatNos?: number[] | null }): Promise<LocalNotice> {
  const payload = await send<{ notice: LocalNotice }>("/api/portal/notices", { method: "POST", ...jsonBody(notice) });
  return payload.notice;
}

export async function saveShareCertificateRegister(input: Omit<LocalShareCertificateRegister, "id" | "uploadedAt">): Promise<LocalShareCertificateRegister> {
  const payload = await send<{ register: LocalShareCertificateRegister }>("/api/portal/share-certificates", { method: "POST", ...jsonBody(input) });
  return payload.register;
}

export async function addChangeRequest(input: Omit<ChangeRequest, "id" | "status" | "createdAt">): Promise<ChangeRequest> {
  const payload = await send<{ request: ChangeRequest }>("/api/portal/change-requests", { method: "POST", ...jsonBody(input) });
  return payload.request;
}

export async function reviewChangeRequest(id: string, status: "approved" | "rejected"): Promise<ChangeRequest> {
  const payload = await send<{ request: ChangeRequest }>(`/api/portal/change-requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    ...jsonBody({ status })
  });
  return payload.request;
}

export function sortedNotices(store: LocalStore): LocalNotice[] {
  return [...(store.notices || [])].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function sortedGalleryItems(store: LocalStore): LocalGalleryItem[] {
  return [...(store.galleryItems || [])].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
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

// Fictional data for the static GitHub Pages demo only.
const DEMO_MEMBERS = [
  { id: "EA-DEMO-01", flat: 1, membership: "101", name: "MR. Arjun Demo", floor: 0, email: "demo.member1@example.com", phone: "+91 99999 00001", alternatePhone: null, ownership: "Owner", status: "Active", vehicleNumber: "DL-XX-1001" },
  { id: "EA-DEMO-02", flat: 2, membership: null, name: "MRS. Priya Sample", floor: 0, email: null, phone: null, alternatePhone: null, ownership: "Owner", status: "Active", vehicleNumber: null },
  { id: "EA-DEMO-03", flat: 3, membership: "103", name: "MR. Ravi Placeholder", floor: 0, email: null, phone: "+91 99999 00003", alternatePhone: null, ownership: "Owner", status: "Active", vehicleNumber: null },
  { id: "EA-DEMO-04", flat: 4, membership: "104", name: "MRS. Sunita Testcase", floor: 0, email: "demo.member4@example.com", phone: "+91 99999 00004", alternatePhone: null, ownership: "Owner", status: "Active", vehicleNumber: "DL-XX-1004" },
  { id: "EA-DEMO-05", flat: 5, membership: null, name: "MR. Amit Mockdata", floor: 0, email: null, phone: null, alternatePhone: null, ownership: "Tenant", status: "Active", vehicleNumber: null },
  { id: "EA-DEMO-06", flat: 6, membership: "106", name: "SMT. Kavita Sampleset", floor: 1, email: "demo.member6@example.com", phone: "+91 99999 00006", alternatePhone: null, ownership: "Owner", status: "Active", vehicleNumber: "DL-XX-1006" },
  { id: "EA-DEMO-07", flat: 7, membership: "107", name: "MR. Suresh Demouser", floor: 1, email: null, phone: "+91 99999 00007", alternatePhone: null, ownership: "Owner (Joint)", status: "Active", vehicleNumber: null },
  { id: "EA-DEMO-08", flat: 8, membership: null, name: "MR. Vikram Testflat", floor: 1, email: "demo.member8@example.com", phone: null, alternatePhone: null, ownership: "Owner", status: "Active", vehicleNumber: "DL-XX-1008" },
  { id: "EA-DEMO-09", flat: 9, membership: "109", name: "MS. Nisha Demoname", floor: 2, email: null, phone: null, alternatePhone: null, ownership: "Tenant", status: "Active", vehicleNumber: null },
  { id: "EA-DEMO-10", flat: 10, membership: "110", name: "MR. Anil Sampleman", floor: 2, email: "demo.member10@example.com", phone: "+91 99999 00010", alternatePhone: "+91 88888 00010", ownership: "Owner", status: "Active", vehicleNumber: "DL-XX-1010" },
  { id: "EA-DEMO-11", flat: 111, membership: "111", name: "ADMIN Testaccount", floor: 0, email: "admin@example.com", phone: "+91 99999 00111", alternatePhone: null, ownership: "Owner", status: "Active", vehicleNumber: null },
  { id: "EA-DEMO-12", flat: 12, membership: null, name: "MRS. Demo Resident", floor: 3, email: null, phone: null, alternatePhone: null, ownership: "Owner", status: "Inactive", vehicleNumber: null }
];

function normalizeMember(member: (typeof DEMO_MEMBERS)[number]): LocalMember {
  return {
    id: member.id,
    flatNo: member.flat,
    membershipNo: member.membership,
    block: "Main",
    floor: member.floor,
    name: member.name,
    fatherSpouseName: null,
    email: member.email,
    phone: member.phone,
    alternatePhone: member.alternatePhone,
    ownership: member.ownership,
    status: member.status,
    dateOfMembership: null,
    parkingSlot: null,
    vehicleNumber: member.vehicleNumber,
    remarks: null,
    committeeRole: MC_ROLES_BY_FLAT[member.flat] || null
  };
}
