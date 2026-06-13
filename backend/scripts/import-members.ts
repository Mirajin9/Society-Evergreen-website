// backend/scripts/import-members.ts
//
// Imports the latest uploaded member workbook into public.members.
//
// Run from the repo root:
//   npm --prefix backend run import:members
//
// Required env vars in .env.local or shell:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import JSZip from 'jszip';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvLocal();

const WORKBOOKS = [
  resolve(__dirname, '../../uploads/Members all Details - Copy (1).xlsx'),
  resolve(__dirname, '../../uploads/Members all Details - Copy.xlsx'),
];

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  const commentedServiceKey = envFileHasCommentedKey('SUPABASE_SERVICE_ROLE_KEY');
  throw new Error(
    [
      'Missing Supabase import credentials.',
      'Add these to .env.local in the project root:',
      '  SUPABASE_URL=https://mbxxytpegkmsmvprtsqh.supabase.co',
      '  SUPABASE_SERVICE_ROLE_KEY=<your Supabase secret/service-role key>',
      commentedServiceKey ? 'A SUPABASE_SERVICE_ROLE_KEY line exists, but it is commented out. Remove the leading #.' : null,
      'Do not use the publishable key for imports; imports need the secret key.',
    ].filter(Boolean).join('\n'),
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: false } },
);

function loadEnvLocal() {
  const envPaths = [
    resolve(__dirname, '../../.env.local'),
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../.env.local'),
    resolve(__dirname, '../.env'),
  ];
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue;
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function envFileHasCommentedKey(name: string) {
  const envPaths = [
    resolve(__dirname, '../../.env.local'),
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../.env.local'),
    resolve(__dirname, '../.env'),
  ];
  return envPaths.some((envPath) => {
    if (!existsSync(envPath)) return false;
    return readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .some((line) => line.trim().startsWith(`# ${name}=`) || line.trim().startsWith(`#${name}=`));
  });
}

interface RawMember {
  flat: number;
  membership: string | null;
  name: string;
  block: string | null;
  ownership: string | null;
  phone: string | null;
  email: string | null;
  vehicle: string | null;
  father: string | null;
  tankCapacity: string | null;
}

function decodeXml(value = '') {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function columnIndex(ref: string) {
  const match = ref.match(/[A-Z]+/);
  if (!match) return 0;
  let n = 0;
  for (const char of match[0]) n = n * 26 + char.charCodeAt(0) - 64;
  return n - 1;
}

async function readFirstExisting() {
  let lastError: unknown;
  for (const path of WORKBOOKS) {
    try {
      return { path, buffer: await readFile(path) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function parseXlsx(path: string): Promise<string[][]> {
  const buffer = await readFile(path);
  const zip = await JSZip.loadAsync(buffer);
  const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  const strings = sharedXml
    ? [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
        decodeXml([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
      )
    : [];
  const workbook = await zip.file('xl/workbook.xml')?.async('string');
  const rels = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
  const relId = workbook?.match(/<sheet\b[^>]*r:id="([^"]+)"/)?.[1];
  const target = relId
    ? rels?.match(new RegExp(`<Relationship[^>]*Id="${relId}"[^>]*Target="([^"]+)"`))?.[1]
    : null;
  const sheetPath = target ? `xl/${target.replace(/^\//, '')}` : 'xl/worksheets/sheet1.xml';
  const sheetXml = await zip.file(sheetPath)?.async('string');
  if (!sheetXml) return [];

  const rows: string[][] = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNo = Number(rowMatch[1].match(/\br="(\d+)"/)?.[1]);
    if (!rowNo) continue;
    const row: string[] = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] ?? '';
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = attrs.match(/\bt="(\w+)"/)?.[1];
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const inlineValue = body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      let value = '';
      if (type === 's' && rawValue) value = strings[Number(rawValue)] ?? '';
      else if (inlineValue) value = decodeXml(inlineValue);
      else if (rawValue) value = decodeXml(rawValue);
      row[columnIndex(ref)] = value.trim();
    }
    rows[rowNo - 1] = row;
  }
  return rows;
}

function parseMembers(rows: string[][]): RawMember[] {
  const headerIndex = rows.findIndex((row) => row?.some((cell) => /flat\s*no/i.test(cell)));
  if (headerIndex === -1) return [];
  return rows.slice(headerIndex + 1)
    .filter((row) => row?.[0] && /^\d+$/.test(row[0]))
    .map((row) => {
      const vehicle = row[9] && !/^no\s*car$/i.test(row[9]) ? row[9] : null;
      return {
        flat: Number(row[0]),
        membership: row[1] || null,
        name: cleanName(row[2] || `Flat ${row[0]}`),
        block: row[3] || null,
        ownership: row[4] || null,
        phone: row[7] || null,
        email: validEmail(row[8]) ? row[8] : null,
        vehicle,
        father: row[6] || null,
        tankCapacity: row[10] || null,
      };
    });
}

function cleanName(value: string) {
  return value.replace(/\s+/g, ' ').trim().replace(/^late\./i, 'LATE');
}

function validEmail(value: string | undefined) {
  return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function floorFor(flat: number) {
  if (flat <= 42) return 0;
  if (flat <= 84) return 1;
  if (flat <= 126) return 2;
  return 3;
}

function ownershipFor(row: RawMember) {
  if (/tenant/i.test(row.ownership || '')) return 'tenant';
  if (/&| and /i.test(row.name)) return 'owner_joint';
  return 'owner';
}

async function main() {
  const selected = await readFirstExisting();
  console.log(`Reading ${selected.path}`);
  const rows = await parseXlsx(selected.path);
  const members = parseMembers(rows);
  console.log(`Parsed ${members.length} members.`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of members) {
    const deceased = /^LATE\b/i.test(row.name);
    const payload = {
      flat_no: row.flat,
      membership_no: row.membership,
      name: row.name,
      father_spouse_name: row.father,
      email: row.email,
      phone: row.phone,
      ownership: deceased ? 'vacant' : ownershipFor(row),
      status: deceased ? 'deceased' : 'active',
      floor: floorFor(row.flat),
      has_co_owner: /&| and /i.test(row.name),
      vehicle_number: row.vehicle,
      meta: {
        block: row.block,
        tank_capacity: row.tankCapacity,
        import_source: 'Members all Details - Copy (1).xlsx',
      },
    };

    try {
      const { data: existing, error: lookupError } = await supabase
        .from('members')
        .select('id')
        .eq('flat_no', row.flat)
        .maybeSingle();
      if (lookupError) throw lookupError;

      if (existing) {
        const { error } = await supabase.from('members').update(payload).eq('id', existing.id);
        if (error) throw error;
        updated++;
      } else {
        const { error } = await supabase.from('members').insert(payload);
        if (error) throw error;
        created++;
      }
    } catch (error: any) {
      console.error(`Flat ${row.flat}: ${error.message || error}`);
      errors++;
    }
  }

  await supabase.rpc('log_activity', {
    p_action: 'system.import',
    p_target_table: 'members',
    p_target_label: `Member workbook import: ${created} created, ${updated} updated`,
  });

  console.log(`Done. Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
