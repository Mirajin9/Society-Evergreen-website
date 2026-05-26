// backend/api/documents.ts
// Document upload + signed URL flow.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentRow, DocumentCategory, Visibility } from '../types/database';
import { requireAdmin } from '../lib/rbac';

// ─── List documents (RLS handles access) ──────────────────────────────────
export async function listDocuments(
  supabase: SupabaseClient,
  params: { category?: DocumentCategory; visibility?: Visibility; limit?: number } = {}
) {
  let q = supabase.from('documents').select('*, linked_event:events(id,title)').is('deleted_at', null);
  if (params.category) q = q.eq('category', params.category);
  if (params.visibility) q = q.eq('visibility', params.visibility);
  q = q.order('document_date', { ascending: false }).limit(params.limit ?? 100);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ─── Upload a document ────────────────────────────────────────────────────
// Two-step flow so we never end up with orphan files:
//   1. Frontend calls POST /api/admin/documents/upload-init with metadata.
//   2. We insert the public.documents row and return a presigned PUT URL.
//   3. Frontend uploads the file directly to Supabase Storage.
//   4. Frontend calls POST /api/admin/documents/:id/finalize to mark it published.
export interface UploadInitInput {
  title: string;
  description?: string;
  category: DocumentCategory;
  visibility: Visibility;
  document_date?: string;
  linked_event_id?: string | null;
  filename: string;            // original filename, used for storage_path
  mime_type: string;
  size_bytes: number;
}

export async function uploadInit(supabase: SupabaseClient, input: UploadInitInput) {
  const user = await requireAdmin(supabase);
  const code = await nextCode(supabase, 'document');
  const slug = input.filename.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').slice(0, 80);
  const yearMonth = new Date().toISOString().slice(0, 7);
  const storage_path = `${input.category}/${yearMonth}/${code}-${slug}`;

  const { data: doc, error } = await supabase.from('documents').insert({
    code,
    title: input.title,
    description: input.description,
    category: input.category,
    visibility: input.visibility,
    document_date: input.document_date ?? new Date().toISOString().slice(0, 10),
    linked_event_id: input.linked_event_id ?? null,
    storage_bucket: 'documents',
    storage_path,
    size_bytes: input.size_bytes,
    mime_type: input.mime_type,
    uploaded_by: user.id,
    is_published: false,
  }).select().single();
  if (error) throw error;

  // Presigned PUT URL — 5 minute expiry
  const { data: signed, error: signErr } = await supabase.storage
    .from('documents').createSignedUploadUrl(storage_path);
  if (signErr) throw signErr;

  return { document: doc, upload_url: signed.signedUrl, token: signed.token };
}

export async function uploadFinalize(supabase: SupabaseClient, documentId: string) {
  await requireAdmin(supabase);
  const { data, error } = await supabase.from('documents')
    .update({ is_published: true })
    .eq('id', documentId).select().single();
  if (error) throw error;
  await supabase.rpc('log_activity', {
    p_action: 'document.uploaded',
    p_target_table: 'documents',
    p_target_id: documentId,
    p_target_label: data.title,
  });
  return data;
}

// ─── Get a signed download URL ────────────────────────────────────────────
// Used by the "Download PDF" buttons. RLS on storage.objects guarantees the
// signed URL is only issued if the user can read the doc.
export async function getDownloadUrl(
  supabase: SupabaseClient,
  documentId: string,
  expiresInSeconds = 60
) {
  const { data: doc, error } = await supabase
    .from('documents').select('storage_bucket, storage_path, title').eq('id', documentId).single();
  if (error) throw error;
  const { data: signed, error: signErr } = await supabase.storage
    .from(doc.storage_bucket).createSignedUrl(doc.storage_path, expiresInSeconds);
  if (signErr) throw signErr;
  // Audit
  await supabase.rpc('log_activity', {
    p_action: 'document.downloaded',
    p_target_table: 'documents',
    p_target_id: documentId,
    p_target_label: doc.title,
  });
  return { url: signed.signedUrl, expires_in_seconds: expiresInSeconds };
}

// ─── Set visibility ───────────────────────────────────────────────────────
export async function setDocumentVisibility(
  supabase: SupabaseClient,
  documentId: string,
  visibility: Visibility
) {
  await requireAdmin(supabase);
  const { data: before } = await supabase.from('documents').select('visibility,title').eq('id', documentId).single();
  const { data, error } = await supabase.from('documents')
    .update({ visibility }).eq('id', documentId).select().single();
  if (error) throw error;
  await supabase.rpc('log_activity', {
    p_action: 'document.visibility_changed',
    p_target_table: 'documents',
    p_target_id: documentId,
    p_target_label: `${before?.title} → ${visibility}`,
    p_diff: { visibility: [before?.visibility, visibility] },
  });
  return data;
}

// ─── Code generator helper ────────────────────────────────────────────────
async function nextCode(supabase: SupabaseClient, kind: 'document' | 'notice' | 'event') {
  const fn = `next_${kind}_code`;
  const { data, error } = await supabase.rpc(fn);
  if (error) throw error;
  return data as string;
}
