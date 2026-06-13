import JSZip from "jszip";

function decodeXml(value = "") {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function textFromXml(xml: string) {
  return decodeXml(
    [...xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
      .map((match) => match[1])
      .join("")
  ).replace(/\s+/g, " ").trim();
}

export async function parseDocxTables(input: ArrayBuffer | Uint8Array): Promise<string[][][]> {
  const zip = await JSZip.loadAsync(input);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) return [];

  return [...documentXml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/g)].map((tableMatch) => {
    return [...tableMatch[0].matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)].map((rowMatch) => {
      return [...rowMatch[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)]
        .map((cellMatch) => textFromXml(cellMatch[0]));
    }).filter((row) => row.some(Boolean));
  }).filter((table) => table.length);
}

export async function parseDocxRows(input: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const tables = await parseDocxTables(input);
  return tables.sort((a, b) => b.length - a.length)[0] || [];
}
