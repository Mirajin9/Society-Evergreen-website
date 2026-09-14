import { readFile } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";
import type { LocalMember } from "@/app/lib/local-store";
import { MC_ROLES_BY_FLAT } from "@/app/lib/society-roles";
import { parseXlsxRows } from "@/app/lib/xlsx";

// Raw member rows from the member sheet (or data.jsx), used for portal member records and initial logins.
export type SourceMember = {
  id: string;
  flat: number;
  membership: string | null;
  name: string;
  phone: string | null;
  alternatePhone: string | null;
  [key: string]: unknown;
};

export async function loadSourceMembers(): Promise<SourceMember[]> {
  const workbook = await readWorkbookMembers();
  if (workbook.length) return workbook;
  return readPrototypeMembers();
}

async function readPrototypeMembers(): Promise<SourceMember[]> {
  const source = await readFile(join(/*turbopackIgnore: true*/ process.cwd(), "data.jsx"), "utf8");
  const membersMatch = source.match(/const MEMBERS = (\[[\s\S]*?\n\]);/);
  if (!membersMatch) throw new Error("Could not read prototype members");
  return vm.runInNewContext(`(${membersMatch[1]})`, {}, { timeout: 1000 });
}

async function readWorkbookMembers(): Promise<SourceMember[]> {
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
      return await readFile(join(/*turbopackIgnore: true*/ process.cwd(), "uploads", name));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
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

export function toMemberRecord(member: SourceMember): LocalMember {
  const flatNo = Number(member.flat);
  const optional = (value: unknown) => (value === null || value === undefined || value === "" ? null : String(value));
  const rawVehicle = member.vehicleNumber ?? member.cars ?? null;
  const vehicleNumber = rawVehicle && !/^no\s*car$/i.test(String(rawVehicle)) ? String(rawVehicle) : null;
  return {
    id: optional(member.id) || `EA-${String(flatNo).padStart(4, "0")}`,
    flatNo,
    membershipNo: optional(member.membership),
    block: optional(member.block) || "Main",
    floor: typeof member.floor === "number" ? member.floor : null,
    name: optional(member.name) || `Flat ${flatNo}`,
    fatherSpouseName: optional(member.fatherSpouseName ?? member.father),
    email: optional(member.email),
    phone: optional(member.phone),
    alternatePhone: optional(member.alternatePhone),
    ownership: optional(member.ownership) || "Owner",
    status: optional(member.status) || "Active",
    dateOfMembership: null,
    parkingSlot: null,
    vehicleNumber,
    remarks: member.deceased ? "Marked deceased in imported member list" : null,
    committeeRole: MC_ROLES_BY_FLAT[flatNo] || null
  };
}
