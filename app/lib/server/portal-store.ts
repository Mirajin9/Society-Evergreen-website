import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { AuthError, type StoredAccount } from "@/app/lib/auth/accounts";
import { parseDocxRows } from "@/app/lib/docx";
import { loadSourceMembers, toMemberRecord, type SourceMember } from "@/app/lib/member-source";
import {
  CORRECTABLE_MEMBER_FIELDS,
  DEFAULT_SOCIETY,
  DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_BYTES,
  NOTICE_CATEGORIES,
  RECORD_CATEGORIES,
  VISIBILITIES
} from "@/app/lib/portal-constants";
import { dataPath } from "@/app/lib/server/data-dir";
import { createJsonStore } from "@/app/lib/server/json-store";
import type {
  ChangeRequest,
  LocalAuditLog,
  LocalDocument,
  LocalEvent,
  LocalMember,
  LocalNotice,
  LocalShareCertificateRegister,
  LocalStore,
  LocalVisibility,
  NoticeCategory
} from "@/app/lib/local-store";

const EDITABLE_MEMBER_KEYS = [
  "name", "membershipNo", "fatherSpouseName", "email", "phone", "alternatePhone",
  "ownership", "status", "dateOfMembership", "vehicleNumber", "remarks"
] as const;

type MemberPatch = Partial<Record<(typeof EDITABLE_MEMBER_KEYS)[number], string | null>>;
type StoredNotice = LocalNotice & { createdBy: string; legacyId?: string };
type StoredDocument = Omit<LocalDocument, "dataUrl"> & {
  storedFile: string;
  uploadedBy: string;
  legacyId?: string;
  deletedAt?: string;
  deletedBy?: string;
};
type StoredRegister = LocalShareCertificateRegister & { uploadedBy: string };
type StoredChangeRequest = ChangeRequest & { reviewedBy?: string; reviewedAt?: string; legacyId?: string };

interface PortalData {
  version: 1;
  society: LocalStore["society"] | null;
  memberOverrides: Record<string, MemberPatch>;
  notices: StoredNotice[];
  documents: StoredDocument[];
  shareCertificateRegister: StoredRegister | null;
  changeRequests: StoredChangeRequest[];
  events: LocalEvent[];
  auditLogs: LocalAuditLog[];
}

const VISIBILITY_RANK: Record<LocalVisibility, number> = { public: 0, members: 1, committee: 2, admin: 3 };

const portal = createJsonStore<PortalData>(() => dataPath("portal", "portal.json"), () => ({
  version: 1,
  society: null,
  memberOverrides: {},
  notices: [],
  documents: [],
  shareCertificateRegister: null,
  changeRequests: [],
  events: [],
  auditLogs: []
}));

const isAdmin = (account: StoredAccount) => account.roles.includes("admin");

// Everything a signed-in visitor may see, in the shape the portal pages already use.
export async function portalSnapshot(account: StoredAccount): Promise<LocalStore> {
  const [data, sourceMembers, seedDocuments, seedRegister] = await Promise.all([
    portal.read(),
    loadMembers(),
    readSeedDocuments(),
    readSeedShareRegister()
  ]);
  const admin = isAdmin(account);
  const userRank = admin ? VISIBILITY_RANK.admin : VISIBILITY_RANK.members;
  const members = sourceMembers.map((member) => withOverride(toMemberRecord(member), data.memberOverrides[String(member.flat)]));
  const uploaded = data.documents.filter((document) => !document.deletedAt).map(toClientDocument);

  return {
    version: 12,
    society: data.society || { ...DEFAULT_SOCIETY },
    // Members only need their own record; the MC sees the full directory.
    members: admin ? members : members.filter((member) => member.flatNo === account.flatNo),
    credentials: [],
    events: data.events.filter((event) => VISIBILITY_RANK[event.visibility] <= userRank),
    documents: [...uploaded, ...seedDocuments].filter((document) => VISIBILITY_RANK[document.visibility] <= userRank),
    shareCertificateRegister: data.shareCertificateRegister || seedRegister,
    records: RECORD_CATEGORIES.map((record) => ({ ...record })),
    notices: admin
      ? data.notices
      : data.notices.filter((notice) => !notice.targetFlatNos?.length || notice.targetFlatNos.includes(account.flatNo)),
    galleryItems: [],
    agms: [],
    changeRequests: admin ? data.changeRequests : data.changeRequests.filter((request) => request.flatNo === account.flatNo),
    auditLogs: admin ? data.auditLogs.slice(0, 200) : []
  };
}

export async function portalCounts() {
  const data = await portal.read();
  return {
    notices: data.notices.length,
    documents: data.documents.filter((document) => !document.deletedAt).length,
    shareCertificateRegister: !!data.shareCertificateRegister,
    changeRequests: data.changeRequests.length
  };
}

export function createNotice(account: StoredAccount, input: unknown) {
  const body = asRecord(input);
  const title = text(body.title, 200);
  const content = text(body.body, 10000);
  if (!title || !content) throw new AuthError(400, "Add both a notice title and body.");
  const category = oneOf<NoticeCategory>(body.category, NOTICE_CATEGORIES, "general");
  const date = isoDate(body.date) || new Date().toISOString().slice(0, 10);
  const targetFlatNos = Array.isArray(body.targetFlatNos)
    ? [...new Set(body.targetFlatNos.map(Number).filter((flat) => Number.isInteger(flat) && flat > 0))]
    : [];
  const legacyId = text(body.legacyId, 100) || undefined;

  return portal.update((data) => {
    const existing = legacyId && data.notices.find((notice) => notice.legacyId === legacyId);
    if (existing) return existing;
    const notice: StoredNotice = {
      id: newId("ntc"),
      title,
      body: content,
      date,
      category,
      pinned: body.pinned === true,
      targetFlatNos: targetFlatNos.length ? targetFlatNos : null,
      createdBy: account.username,
      legacyId
    };
    data.notices.unshift(notice);
    audit(data, account, "notice.published", "notice", title,
      notice.targetFlatNos ? `Targeted to flats ${notice.targetFlatNos.join(", ")}.` : "Published to all members.");
    return notice;
  });
}

export async function createDocument(account: StoredAccount, form: FormData): Promise<LocalDocument> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new AuthError(400, "Choose a file to upload.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new AuthError(400, "Keep uploads below 8 MB.");
  const ext = extname(file.name).toLowerCase();
  if (!DOCUMENT_EXTENSIONS.includes(ext)) {
    throw new AuthError(400, "Upload a PDF, image, text, Word or Excel file.");
  }
  const category = oneOf(form.get("category"), RECORD_CATEGORIES.map((record) => record.key), "forms");
  const visibility = oneOf<LocalVisibility>(form.get("visibility"), VISIBILITIES, "members");
  const title = text(form.get("title"), 200) || file.name.slice(0, 200);
  const description = text(form.get("description"), 2000);
  const legacyId = text(form.get("legacyId"), 100) || undefined;
  const bytes = Buffer.from(await file.arrayBuffer());

  return portal.update(async (data) => {
    const existing = legacyId && data.documents.find((document) => document.legacyId === legacyId);
    if (existing) return toClientDocument(existing);
    const id = newId("doc");
    const storedFile = `${id}${ext}`;
    await mkdir(dataPath("documents"), { recursive: true });
    await writeFile(dataPath("documents", storedFile), bytes);
    const document: StoredDocument = {
      id,
      title,
      category,
      visibility,
      description,
      fileName: file.name.slice(0, 200),
      mimeType: mimeTypeFor(ext),
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      storedFile,
      uploadedBy: account.username,
      legacyId
    };
    data.documents.unshift(document);
    audit(data, account, "document.uploaded", "document", title, `${document.fileName} uploaded as ${category} with ${visibility} visibility.`);
    return toClientDocument(document);
  });
}

export async function documentFile(account: StoredAccount, id: string) {
  const data = await portal.read();
  const document = data.documents.find((item) => item.id === id);
  const userRank = isAdmin(account) ? VISIBILITY_RANK.admin : VISIBILITY_RANK.members;
  if (!document || document.deletedAt || VISIBILITY_RANK[document.visibility] > userRank) throw new AuthError(404, "Document not found.");
  return { path: dataPath("documents", document.storedFile), fileName: document.fileName, mimeType: document.mimeType };
}

export function updateDocument(account: StoredAccount, id: string, input: unknown) {
  if (!isAdmin(account)) throw new AuthError(403, "MC access is required.");
  const body = asRecord(input);
  const patch: Partial<Pick<LocalDocument, "title" | "category" | "visibility" | "description">> = {};
  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 200) {
      throw new AuthError(400, "Add a document title of up to 200 characters.");
    }
    patch.title = body.title.trim();
  }
  if ("description" in body) {
    if (typeof body.description !== "string" || body.description.trim().length > 2000) {
      throw new AuthError(400, "Keep the description within 2,000 characters.");
    }
    patch.description = body.description.trim();
  }
  if ("category" in body) {
    if (typeof body.category !== "string" || !RECORD_CATEGORIES.some((record) => record.key === body.category)) {
      throw new AuthError(400, "Choose a valid document category.");
    }
    patch.category = body.category;
  }
  if ("visibility" in body) {
    if (!VISIBILITIES.includes(body.visibility as LocalVisibility)) {
      throw new AuthError(400, "Choose a valid document visibility.");
    }
    patch.visibility = body.visibility as LocalVisibility;
  }
  if (!Object.keys(patch).length) throw new AuthError(400, "Choose document details to update.");

  return portal.update((data) => {
    const document = data.documents.find((item) => item.id === id && !item.deletedAt);
    if (!document) throw new AuthError(404, "Document not found.");
    const changes = Object.entries(patch).filter(([key, value]) => document[key as keyof typeof patch] !== value);
    if (changes.length) {
      const details = changes.map(([key, value]) => `${key}: ${JSON.stringify(document[key as keyof typeof patch])} -> ${JSON.stringify(value)}`).join("; ");
      Object.assign(document, patch);
      audit(data, account, "document.updated", "document", document.title, details);
    }
    return toClientDocument(document);
  });
}

export function deleteDocument(account: StoredAccount, id: string) {
  if (!isAdmin(account)) throw new AuthError(403, "MC access is required.");
  return portal.update((data) => {
    const document = data.documents.find((item) => item.id === id && !item.deletedAt);
    if (!document) throw new AuthError(404, "Document not found.");
    // Keep the file and legacy ID for recovery and to prevent old browser data re-uploading it.
    // Deleted records are excluded from every library and cannot be downloaded by ID.
    document.deletedAt = new Date().toISOString();
    document.deletedBy = account.username;
    audit(data, account, "document.deleted", "document", document.title, `${document.fileName} removed from the document library.`);
    return { deleted: true };
  });
}

export function saveShareCertificateRegister(account: StoredAccount, input: unknown) {
  const body = asRecord(input);
  const columns = Array.isArray(body.columns)
    ? [...new Set(body.columns.map((column) => cell(column, 200)).filter(Boolean))].slice(0, 60)
    : [];
  const rows = Array.isArray(body.rows)
    ? body.rows.slice(0, 10000).map((row) => {
        const source = asRecord(row);
        return Object.fromEntries(columns.map((column) => [column, cell(source[column], 1000)]));
      })
    : [];
  if (!columns.length || !rows.length) throw new AuthError(400, "No table rows were found in this register.");

  return portal.update((data) => {
    const register: StoredRegister = {
      id: newId("share-cert"),
      fileName: text(body.fileName, 200) || "Share certificate register",
      uploadedAt: new Date().toISOString(),
      columns,
      rows,
      uploadedBy: account.username
    };
    data.shareCertificateRegister = register;
    audit(data, account, "share_certificates.imported", "share_certificate_register", register.fileName,
      `${rows.length} row(s) imported for member view-only access.`);
    return register;
  });
}

export function createChangeRequest(account: StoredAccount, input: unknown) {
  if (!account.flatNo) throw new AuthError(400, "Only flat logins can request profile corrections.");
  const body = asRecord(input);
  const field = CORRECTABLE_MEMBER_FIELDS.find((item) => item.label === body.field || item.key === body.field);
  if (!field) throw new AuthError(400, "Choose which detail needs correcting.");
  const requestedValue = text(body.requestedValue, 500);
  if (!requestedValue) throw new AuthError(400, "Enter the correct value.");
  const legacyId = text(body.legacyId, 100) || undefined;

  return portal.update((data) => {
    const existing = legacyId && data.changeRequests.find((request) => request.legacyId === legacyId);
    if (existing) return existing;
    const pending = data.changeRequests.filter((request) => request.flatNo === account.flatNo && request.status === "pending");
    if (pending.length >= 20) {
      throw new AuthError(429, "You already have many requests waiting. Please wait for the office to review them.");
    }
    const request: StoredChangeRequest = {
      id: newId("req"),
      flatNo: account.flatNo,
      field: field.label,
      currentValue: text(body.currentValue, 500),
      requestedValue,
      reason: text(body.reason, 1000),
      status: "pending",
      createdAt: new Date().toISOString(),
      legacyId
    };
    data.changeRequests.unshift(request);
    audit(data, account, "change_request.created", "change_request", `Flat ${request.flatNo} - ${request.field}`,
      `Requested change from "${request.currentValue}" to "${request.requestedValue}".`);
    return request;
  });
}

export function reviewChangeRequest(account: StoredAccount, id: string, input: unknown) {
  const status = asRecord(input).status;
  if (status !== "approved" && status !== "rejected") throw new AuthError(400, "Choose approve or reject.");

  return portal.update((data) => {
    const request = data.changeRequests.find((item) => item.id === id);
    if (!request) throw new AuthError(404, "That request was not found.");
    if (request.status !== "pending") throw new AuthError(400, "This request has already been reviewed.");
    request.status = status;
    request.reviewedBy = account.username;
    request.reviewedAt = new Date().toISOString();
    const field = CORRECTABLE_MEMBER_FIELDS.find((item) => item.label === request.field);
    if (status === "approved" && field) {
      const key = String(request.flatNo);
      data.memberOverrides[key] = { ...(data.memberOverrides[key] || {}), [field.key]: request.requestedValue };
    }
    audit(data, account, `change_request.${status}`, "change_request", `Flat ${request.flatNo} - ${request.field}`,
      status === "approved" ? `Record updated to "${request.requestedValue}".` : "Request rejected.");
    return request;
  });
}

export async function updateMemberRecord(account: StoredAccount, flatNo: string, input: unknown): Promise<LocalMember> {
  const flat = Number(flatNo);
  const source = (await loadMembers()).find((member) => Number(member.flat) === flat);
  if (!source) throw new AuthError(404, "That flat was not found.");
  const body = asRecord(input);
  const patch: MemberPatch = {};
  for (const key of EDITABLE_MEMBER_KEYS) {
    if (!(key in body)) continue;
    patch[key] = key === "dateOfMembership"
      ? isoDate(body[key])
      : nullableText(body[key], key === "remarks" ? 2000 : 300);
  }
  for (const required of ["name", "ownership", "status"] as const) {
    if (required in patch && !patch[required]) {
      if (required === "name") throw new AuthError(400, "Member name can't be empty.");
      delete patch[required];
    }
  }

  return portal.update((data) => {
    const key = String(flat);
    data.memberOverrides[key] = { ...(data.memberOverrides[key] || {}), ...patch };
    audit(data, account, "member.updated", "member", `Flat ${flat}`, "Member profile details were updated.");
    return withOverride(toMemberRecord(source), data.memberOverrides[key]);
  });
}

export function updateSociety(account: StoredAccount, input: unknown) {
  const body = asRecord(input);
  const society = {
    name: text(body.name, 300),
    registrationNo: text(body.registrationNo, 100),
    address: text(body.address, 500),
    officeTimings: text(body.officeTimings, 200),
    email: text(body.email, 200),
    phone: text(body.phone, 100),
    preferredDomain: text(body.preferredDomain, 200)
  };
  if (!society.name) throw new AuthError(400, "Society name can't be empty.");
  return portal.update((data) => {
    data.society = society;
    audit(data, account, "society.updated", "society", society.name, "Society profile settings were updated.");
    return society;
  });
}

let membersCache: { at: number; members: Promise<SourceMember[]> } | null = null;

function loadMembers() {
  if (!membersCache || Date.now() - membersCache.at > 5 * 60_000) {
    const members = loadSourceMembers().catch((error) => {
      membersCache = null;
      throw error;
    });
    membersCache = { at: Date.now(), members };
  }
  return membersCache.members;
}

function withOverride(record: LocalMember, patch: MemberPatch | undefined): LocalMember {
  return patch ? ({ ...record, ...patch } as LocalMember) : record;
}

function toClientDocument({ storedFile: _file, uploadedBy: _by, legacyId: _legacy, deletedAt: _deletedAt, deletedBy: _deletedBy, ...document }: StoredDocument): LocalDocument {
  return { ...document, dataUrl: `/api/portal/documents/${encodeURIComponent(document.id)}` };
}

function audit(data: PortalData, account: StoredAccount, action: string, targetType: string, targetLabel: string, details: string) {
  data.auditLogs = [{
    id: newId("log"),
    actorUsername: account.username,
    actorFlatNo: account.flatNo || null,
    actorRole: isAdmin(account) ? "admin" as const : "member" as const,
    action,
    targetType,
    targetLabel,
    details,
    createdAt: new Date().toISOString()
  }, ...data.auditLogs].slice(0, 1000);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cell(value: unknown, max: number) {
  return value === null || value === undefined ? "" : String(value).trim().slice(0, max);
}

function nullableText(value: unknown, max: number) {
  return cell(value, max) || null;
}

function isoDate(value: unknown) {
  const date = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 6)}`;
}

function mimeTypeFor(ext: string) {
  const types: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".txt": "text/plain; charset=utf-8",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
  return types[ext] || "application/octet-stream";
}

// Official forms committed to the repo (public/files) always appear in the member library.
async function readSeedDocuments(): Promise<LocalDocument[]> {
  const dir = join(/*turbopackIgnore: true*/ process.cwd(), "public", "files");
  try {
    const files = (await readdir(dir)).filter((name) => /\.(pdf|docx)$/i.test(name));
    return await Promise.all(files.map(async (name) => {
      const info = await stat(join(dir, name));
      return {
        id: `seed-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
        title: name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        category: "forms",
        visibility: "members" as const,
        description: "Official society form.",
        fileName: name,
        mimeType: mimeTypeFor(extname(name).toLowerCase()),
        sizeBytes: info.size,
        dataUrl: `/files/${encodeURIComponent(name)}`,
        uploadedAt: info.mtime.toISOString()
      };
    }));
  } catch {
    return [];
  }
}

// Local development only: the register document in the git-ignored uploads/ folder.
async function readSeedShareRegister(): Promise<LocalShareCertificateRegister | null> {
  try {
    const file = join(/*turbopackIgnore: true*/ process.cwd(), "uploads", "SHARE CERTIFICATE LIST.docx");
    const rows = await parseDocxRows(await readFile(file));
    const headerIndex = rows.findIndex((row) => row?.filter(Boolean).length >= 2);
    if (headerIndex === -1) return null;
    const columns = rows[headerIndex].map((value, index) => value || `Column ${index + 1}`).filter(Boolean);
    const tableRows = rows.slice(headerIndex + 1)
      .filter((row) => row?.some(Boolean))
      .map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index] || ""])));
    if (!tableRows.length) return null;
    return {
      id: "seed-share-certificate-list",
      fileName: "SHARE CERTIFICATE LIST.docx",
      uploadedAt: (await stat(file)).mtime.toISOString(),
      columns,
      rows: tableRows
    };
  } catch {
    return null;
  }
}
