import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";
import { NextResponse } from "next/server";
import { parseDocxRows } from "@/app/lib/docx";
import { parseXlsxRows } from "@/app/lib/xlsx";

export const runtime = "nodejs";

export async function GET() {
  const workbook = await readWorkbookMembers();
  const documents = await readUploadedDocuments();
  const shareCertificateRegister = await readShareCertificateRegister();
  if (workbook.length) {
    return NextResponse.json({
      society: societySeed(),
      members: workbook,
      documents,
      shareCertificateRegister
    });
  }

  const source = await readFile(join(process.cwd(), "data.jsx"), "utf8");
  const membersMatch = source.match(/const MEMBERS = (\[[\s\S]*?\n\]);/);
  if (!membersMatch) {
    return NextResponse.json({ error: "Could not read prototype members" }, { status: 500 });
  }

  const members = vm.runInNewContext(`(${membersMatch[1]})`, {}, { timeout: 1000 });
  return NextResponse.json({
    society: societySeed(),
    members,
    documents,
    shareCertificateRegister
  });
}

async function readWorkbookMembers() {
  try {
    const buffer = await readFirstExisting([
      "Members all Details - Copy (1).xlsx",
      "Members all Details - Copy.xlsx"
    ]);
    const rows = await parseXlsxRows(buffer);
    const headerIndex = rows.findIndex((row) => row?.some((cell) => /flat\s*no/i.test(cell)));
    if (headerIndex === -1) return [];

    return rows.slice(headerIndex + 1)
      .filter((row) => row?.[0] && /^\d+$/.test(row[0]))
      .map((row) => {
        const flat = Number(row[0]);
        const name = cleanName(row[2] || `Flat ${flat}`);
        const vehicle = row[9] && !/^no\s*car$/i.test(row[9]) ? row[9] : null;
        return {
          id: `EA-${String(flat).padStart(4, "0")}`,
          sn: flat,
          flat,
          membership: row[1] || null,
          name,
          deceased: /^late\b/i.test(name),
          hasCoOwner: /&| and /i.test(name),
          block: row[3] || "Main",
          floor: deriveFloor(flat),
          email: validEmail(row[8]) ? row[8] : null,
          phone: row[7] || null,
          alternatePhone: null,
          ownership: /tenant/i.test(row[4] || "") ? "Tenant" : /joint|&/i.test(name) ? "Owner (Joint)" : "Owner",
          status: /^late\b/i.test(name) ? "Deceased" : "Active",
          login: validEmail(row[8]) ? "Enabled" : "No email",
          lastLogin: "—",
          committee: null,
          vehicleNumber: vehicle,
          father: row[6] || null,
          tankCapacity: row[10] || null
        };
      });
  } catch {
    return [];
  }
}

async function readFirstExisting(names: string[]) {
  let lastError: unknown;
  for (const name of names) {
    try {
      return await readFile(join(process.cwd(), "uploads", name));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function readUploadedDocuments() {
  try {
    const dir = join(process.cwd(), "uploads");
    const files = await readdir(dir);
    const docs = await Promise.all(files
      .filter((name) => /\.(pdf|docx)$/i.test(name))
      .filter((name) => !/^share certificate list\.docx$/i.test(name))
      .map(async (name) => {
        const info = await stat(join(dir, name));
        return {
          id: `seed-${slug(name)}`,
          title: titleFromFile(name),
          category: categoryFromFile(name),
          visibility: "members",
          description: "Seeded from the local uploads folder.",
          fileName: name,
          mimeType: mimeTypeFromFile(name),
          sizeBytes: info.size,
          dataUrl: `/api/local/uploads?name=${encodeURIComponent(name)}`,
          uploadedAt: info.mtime.toISOString()
        };
      }));
    return docs;
  } catch {
    return [];
  }
}

async function readShareCertificateRegister() {
  try {
    const fileName = "SHARE CERTIFICATE LIST.docx";
    const buffer = await readFile(join(process.cwd(), "uploads", fileName));
    const rows = await parseDocxRows(buffer);
    const parsed = tableFromRows(rows);
    if (!parsed.rows.length) return null;
    const info = await stat(join(process.cwd(), "uploads", fileName));
    return {
      id: "seed-share-certificate-list",
      fileName,
      uploadedAt: info.mtime.toISOString(),
      columns: parsed.columns,
      rows: parsed.rows
    };
  } catch {
    return null;
  }
}

function societySeed() {
  return {
    name: "Evergreen Apartment",
    registrationNo: "Regd No. 837",
    address: "Plot 9, Sector 7, Dwarka, New Delhi 110075",
    officeTimings: "To be updated",
    email: "evergreensocietyplot9@gmail.com",
    phone: "011-42441492",
    preferredDomain: "evergreen-dwarka"
  };
}

function deriveFloor(flat: number) {
  if (flat <= 42) return 0;
  if (flat <= 84) return 1;
  if (flat <= 126) return 2;
  return 3;
}

function validEmail(value: string | undefined) {
  return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^late\./i, "LATE");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleFromFile(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function categoryFromFile(value: string) {
  if (/bye|bylaw|laws/i.test(value)) return "bye_laws";
  if (/form|nomination/i.test(value)) return "forms";
  return "other";
}

function mimeTypeFromFile(value: string) {
  if (/\.pdf$/i.test(value)) return "application/pdf";
  if (/\.docx$/i.test(value)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

function tableFromRows(rows: string[][]) {
  const headerIndex = rows.findIndex((row) => row?.filter(Boolean).length >= 2);
  if (headerIndex === -1) return { columns: [], rows: [] };
  const columns = rows[headerIndex].map((cell, index) => cell || `Column ${index + 1}`).filter(Boolean);
  const tableRows = rows.slice(headerIndex + 1)
    .filter((row) => row?.some(Boolean))
    .map((row) => {
      const out: Record<string, string> = {};
      columns.forEach((column, index) => {
        out[column] = row[index] || "";
      });
      return out;
    });
  return { columns, rows: tableRows };
}
