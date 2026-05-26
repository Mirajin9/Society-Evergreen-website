import { readFile } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const source = await readFile(join(process.cwd(), "data.jsx"), "utf8");
  const membersMatch = source.match(/const MEMBERS = (\[[\s\S]*?\n\]);/);
  if (!membersMatch) {
    return NextResponse.json({ error: "Could not read prototype members" }, { status: 500 });
  }

  const members = vm.runInNewContext(`(${membersMatch[1]})`, {}, { timeout: 1000 });
  return NextResponse.json({
    society: {
      name: "Evergreen Apartment",
      registrationNo: "Regd No. 837",
      address: "Plot 9, Sector 7, Dwarka, New Delhi 110075",
      officeTimings: "To be updated",
      email: "evergreensocietyplot9@gmail.com",
      phone: "011-42441492",
      preferredDomain: "evergreen-dwarka"
    },
    members
  });
}
