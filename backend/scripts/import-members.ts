// backend/scripts/import-members.ts
//
// One-time importer for the original MEMBERS LIST.docx.
//
// Run: `npm run import:members` from the backend/ folder.
//
// What it does:
//   1. Reads ../uploads/MEMBERS LIST.docx
//   2. Parses 165 rows into structured records
//   3. Inserts them into public.members
//   4. Idempotent: if a row already exists for that flat_no, it updates
//      missing fields without overwriting existing ones.

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import JSZip from 'jszip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCX_PATH = resolve(__dirname, '../../uploads/MEMBERS LIST.docx');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

interface RawMember {
  sn: number;
  flat: number;
  membership: string | null;
  name: string;
}

async function parseDocx(path: string): Promise<RawMember[]> {
  const buf = await readFile(path);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')!.async('string');
  const text = xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&');
  const lines = text.split('\n').map(l => l.trim());

  const out: RawMember[] = [];
  let i = 0;
  // skip until first row (S.No 1)
  while (i < lines.length && lines[i] !== '1') i++;
  while (i < lines.length - 3) {
    const sn = lines[i];
    const flat = lines[i + 1];
    const mship = lines[i + 2];
    const name = lines[i + 3];
    if (!/^\d+$/.test(sn) || !/^\d+$/.test(flat)) { i++; continue; }
    out.push({
      sn: +sn,
      flat: +flat,
      membership: /^\d+/.test(mship) ? mship.trim() : null,
      name: name.replace(/\s+/g, ' ').replace(/#/g, '').trim(),
    });
    i += 4;
  }
  return out;
}

function cleanName(n: string): string {
  return n.split(' ').map(w => {
    if (/^[A-Z]\.[A-Z]\./i.test(w)) return w.toUpperCase();
    if (/^(MR|MRS|MS|SMT|DR|LATE)\.?$/i.test(w)) {
      return w.toUpperCase().replace(/^LATE\.?$/i, 'LATE');
    }
    if (w.length <= 2) return w.toUpperCase();
    if (/[a-z]/.test(w)) return w.charAt(0).toUpperCase() + w.slice(1);
    return w.charAt(0) + w.slice(1).toLowerCase();
  }).join(' ');
}

async function main() {
  console.log(`Reading ${DOCX_PATH}…`);
  const raw = await parseDocx(DOCX_PATH);
  console.log(`Parsed ${raw.length} members.`);

  let created = 0, updated = 0, errors = 0;
  for (const r of raw) {
    const name = cleanName(r.name);
    const deceased = /^LATE/i.test(r.name);
    const hasCoOwner = /&| and /i.test(r.name);

    const { data: existing } = await supabase
      .from('members').select('*').eq('flat_no', r.flat).maybeSingle();

    const base = {
      flat_no: r.flat,
      name,
      membership_no: r.membership,
      status: deceased ? 'deceased' : 'active',
      has_co_owner: hasCoOwner,
      ownership: deceased ? 'vacant' : 'owner',
    };

    try {
      if (existing) {
        // Fill in only NULLs, don't overwrite.
        const patch: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(base)) {
          if ((existing as any)[k] == null && v != null) (patch as any)[k] = v;
        }
        if (Object.keys(patch).length) {
          await supabase.from('members').update(patch).eq('id', existing.id);
        }
        updated++;
      } else {
        const { error } = await supabase.from('members').insert(base);
        if (error) throw error;
        created++;
      }
    } catch (e: any) {
      console.error(`Flat ${r.flat}: ${e.message}`);
      errors++;
    }
    if (r.flat % 25 === 0) process.stdout.write('.');
  }

  await supabase.rpc('log_activity', {
    p_action: 'system.import',
    p_target_table: 'members',
    p_target_label: `Initial import: ${created} created, ${updated} updated`,
  });

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
}

main().catch(err => { console.error(err); process.exit(1); });
