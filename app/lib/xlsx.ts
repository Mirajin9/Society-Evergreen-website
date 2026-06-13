import JSZip from "jszip";

function decodeXml(value = "") {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function columnIndex(ref: string) {
  const match = ref.match(/[A-Z]+/);
  if (!match) return 0;
  let n = 0;
  for (const char of match[0]) n = n * 26 + char.charCodeAt(0) - 64;
  return n - 1;
}

async function sharedStrings(zip: JSZip) {
  const file = zip.file("xl/sharedStrings.xml");
  if (!file) return [];
  const xml = await file.async("string");
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""))
  );
}

export async function parseXlsxRows(input: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const zip = await JSZip.loadAsync(input);
  const strings = await sharedStrings(zip);
  const workbook = await zip.file("xl/workbook.xml")?.async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");

  const firstSheetRelId = workbook?.match(/<sheet\b[^>]*r:id="([^"]+)"/)?.[1];
  const target = firstSheetRelId
    ? rels?.match(new RegExp(`<Relationship[^>]*Id="${firstSheetRelId}"[^>]*Target="([^"]+)"`))?.[1]
    : null;
  const sheetPath = target
    ? `xl/${target.replace(/^\//, "")}`
    : "xl/worksheets/sheet1.xml";
  const sheetXml = await zip.file(sheetPath)?.async("string");
  if (!sheetXml) return [];

  const rows: string[][] = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNo = Number(rowMatch[1].match(/\br="(\d+)"/)?.[1]);
    if (!rowNo) continue;
    const row: string[] = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] ?? "";
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = attrs.match(/\bt="(\w+)"/)?.[1];
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const inlineValue = body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      let value = "";
      if (type === "s" && rawValue) value = strings[Number(rawValue)] ?? "";
      else if (inlineValue) value = decodeXml(inlineValue);
      else if (rawValue) value = decodeXml(rawValue);
      row[columnIndex(ref)] = value.trim();
    }
    rows[rowNo - 1] = row;
  }

  return rows;
}

export function rowsToObjects(rows: string[][]) {
  const headerIndex = rows.findIndex((row) => row?.some((cell) => String(cell).trim()));
  if (headerIndex === -1) return [];
  const headers = rows[headerIndex].map((cell, index) => String(cell || `Column ${index + 1}`).trim());
  return rows.slice(headerIndex + 1).filter(Boolean).map((row) => {
    const out: Record<string, string> = {};
    headers.forEach((header, index) => {
      out[header] = String(row[index] || "").trim();
    });
    return out;
  });
}
