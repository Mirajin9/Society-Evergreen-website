import { NextResponse, type NextRequest } from "next/server";
import { parseDocxRows } from "@/app/lib/docx";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { parseXlsxRows } from "@/app/lib/xlsx";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Choose a register file." }, { status: 400 });
    }
    if (!/\.(xlsx|docx)$/i.test(file.name)) {
      return NextResponse.json({ error: "Upload an .xlsx or .docx register file." }, { status: 400 });
    }

    const actor = String(form.get("actor") || "MC user");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const rows = /\.docx$/i.test(file.name)
      ? await parseDocxRows(bytes)
      : await parseXlsxRows(bytes);
    const parsed = tableFromRows(rows);
    if (!parsed.rows.length) {
      return NextResponse.json({ error: "No table rows were found in the register file." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const storagePath = `share-certificates/${Date.now()}-${slug(file.name)}${extension(file.name)}`;
    const upload = await supabase.storage
      .from("admin-imports")
      .upload(storagePath, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
    if (upload.error) throw upload.error;

    const { data: source, error: uploadRowError } = await supabase.from("share_certificate_uploads").insert({
      file_name: file.name,
      storage_bucket: "admin-imports",
      storage_path: storagePath,
      row_count: parsed.rows.length
    }).select("id").single();
    if (uploadRowError) throw uploadRowError;

    const dbRows = parsed.rows.map((row, index) => ({
      upload_id: source.id,
      row_no: index + 1,
      flat_no: numberFrom(row, ["flat", "flat no", "flat number"]),
      membership_no: valueFrom(row, ["membership", "membership no", "member no"]),
      member_name: valueFrom(row, ["name", "member", "member name", "allottee"]),
      certificate_no: valueFrom(row, ["certificate", "certificate no", "share certificate"]),
      issue_date: dateFrom(row, ["issue date", "date"]),
      shares_count: numberFrom(row, ["shares", "no of shares", "share count"]),
      distinctive_from: valueFrom(row, ["distinctive from", "from"]),
      distinctive_to: valueFrom(row, ["distinctive to", "to"]),
      remarks: valueFrom(row, ["remarks", "remark"]),
      row_data: row
    }));

    const { error: rowsError } = await supabase.from("share_certificate_rows").insert(dbRows);
    if (rowsError) throw rowsError;

    await supabase.from("activity_log").insert({
      actor_display: actor,
      action: "system.import",
      target_table: "share_certificate_rows",
      target_id: source.id,
      target_label: file.name,
      diff: { row_count: parsed.rows.length, storage_path: storagePath }
    });

    return NextResponse.json({ uploadId: source.id, rowCount: parsed.rows.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import share certificates." }, { status: 500 });
  }
}

function tableFromRows(rows: string[][]) {
  const headerIndex = rows.findIndex((row) => row?.filter(Boolean).length >= 2);
  if (headerIndex === -1) return { columns: [], rows: [] as Record<string, string>[] };
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

function valueFrom(row: Record<string, string>, labels: string[]) {
  const entries = Object.entries(row);
  for (const label of labels) {
    const found = entries.find(([key]) => key.toLowerCase().replace(/\s+/g, " ").includes(label));
    if (found?.[1]) return found[1];
  }
  return null;
}

function numberFrom(row: Record<string, string>, labels: string[]) {
  const value = valueFrom(row, labels);
  if (!value) return null;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function dateFrom(row: Record<string, string>, labels: string[]) {
  const value = valueFrom(row, labels);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function slug(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extension(value: string) {
  const match = value.match(/\.[a-z0-9]+$/i);
  return match?.[0].toLowerCase() || "";
}
