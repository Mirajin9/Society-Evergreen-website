// backend/scripts/upload-documents.ts
//
// Uploads launch documents from uploads/ into Supabase Storage and public.documents.
//
// Run from the repo root:
//   npm --prefix backend run upload:documents

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = resolve(__dirname, '../../uploads');

loadEnvLocal();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    [
      'Missing Supabase upload credentials.',
      'Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local in the project root.',
      'Do not use the publishable key for document uploads.',
    ].join('\n'),
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const launchDocuments: Record<string, {
  title: string;
  description: string;
  category: 'form' | 'bye_laws' | 'share_certificates';
  visibility: 'public' | 'members' | 'admin';
  storagePath: string;
}> = {
  'FORM 20.pdf': {
    title: 'Form 20',
    description: 'Society statutory form uploaded for member reference.',
    category: 'form',
    visibility: 'members',
    storagePath: 'forms/form-20.pdf',
  },
  'FORM 21.pdf': {
    title: 'Form 21',
    description: 'Society statutory form uploaded for member reference.',
    category: 'form',
    visibility: 'members',
    storagePath: 'forms/form-21.pdf',
  },
  'NOMINATION FORM.pdf': {
    title: 'Nomination Form',
    description: 'Nomination form for member records.',
    category: 'form',
    visibility: 'members',
    storagePath: 'forms/nomination-form.pdf',
  },
  'ModelByLawsCGHS-Delhi.pdf': {
    title: 'Model Bye-Laws CGHS Delhi',
    description: 'Delhi CGHS model bye-laws reference document.',
    category: 'bye_laws',
    visibility: 'public',
    storagePath: 'reference/model-bye-laws-cghs-delhi.pdf',
  },
  'Evergreen CGHS bye-laws.docx': {
    title: 'Evergreen CGHS Bye-Laws',
    description: 'Evergreen CGHS bye-laws document uploaded for member reference.',
    category: 'bye_laws',
    visibility: 'members',
    storagePath: 'reference/evergreen-cghs-bye-laws.docx',
  },
  'SHARE CERTIFICATE LIST.docx': {
    title: 'Share Certificate List Source',
    description: 'Admin source file for the share certificate register. Members should use the view-only register table.',
    category: 'share_certificates',
    visibility: 'admin',
    storagePath: 'admin/share-certificate-list.docx',
  },
};

async function main() {
  if (!existsSync(uploadsDir)) throw new Error(`Uploads folder not found: ${uploadsDir}`);

  const files = await readdir(uploadsDir);
  const available = files.filter((file) => launchDocuments[file]);
  if (!available.length) {
    console.log('No launch PDFs found in uploads/.');
    return;
  }

  for (const fileName of available) {
    const config = launchDocuments[fileName];
    const filePath = resolve(uploadsDir, fileName);
    const bytes = await readFile(filePath);
    const info = statSync(filePath);
    const mimeType = mimeTypeFor(fileName);

    const upload = await supabase.storage
      .from('documents')
      .upload(config.storagePath, bytes, { contentType: mimeType, upsert: true });
    if (upload.error) throw new Error(`Could not upload ${fileName}: ${upload.error.message}`);

    const row = {
      code: `launch-${slug(fileName)}`,
      title: config.title,
      description: config.description,
      category: config.category,
      visibility: config.visibility,
      storage_bucket: 'documents',
      storage_path: config.storagePath,
      size_bytes: info.size,
      mime_type: mimeType,
      version: 'v1',
      document_date: info.mtime.toISOString().slice(0, 10),
      is_published: true,
      meta: { source_file: fileName, imported_by: 'upload-documents.ts' },
    };

    const { error } = await supabase
      .from('documents')
      .upsert(row, { onConflict: 'code' });
    if (error) throw new Error(`Could not save document row for ${fileName}: ${error.message}`);

    console.log(`Uploaded ${fileName} -> documents/${config.storagePath}`);
  }

  console.log(`Uploaded ${available.length} launch document(s).`);
}

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

function mimeTypeFor(fileName: string) {
  if (extname(fileName).toLowerCase() === '.pdf') return 'application/pdf';
  if (extname(fileName).toLowerCase() === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

function slug(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
