import { createClient } from '@/lib/supabase/client';
import { BUCKET_NAME, sanitizeFileName } from './files';

/**
 * Ensure filename has .txt extension
 */
export function ensureTxtExtension(filename) {
  if (!filename || !filename.trim()) return 'Untitled.txt';
  const trimmed = filename.trim();
  if (trimmed.toLowerCase().endsWith('.txt')) {
    return trimmed;
  }
  return `${trimmed}.txt`;
}

/**
 * Create a new .txt file directly in Supabase Storage and register in PostgreSQL
 */
export async function createTextFile({ name = 'Untitled.txt', content = '', folderId = null }) {
  const finalName = ensureTxtExtension(name);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated.');

  // Generate unique storage path
  const safeName = sanitizeFileName(finalName);
  const fileKey = `${Date.now()}_${safeName}`;
  const storagePath = `${user.id}/${fileKey}`;

  // 1. Upload .txt file to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, blob, {
      contentType: 'text/plain',
      upsert: false,
    });

  if (storageError) {
    console.error('Text file storage upload error:', storageError);
    throw new Error(storageError.message || 'Failed to save text file to storage.');
  }

  // 2. Insert metadata into public.files
  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .insert({
      owner_id: user.id,
      folder_id: folderId || null,
      name: finalName,
      storage_path: storagePath,
      mime_type: 'text/plain',
      size_bytes: blob.size,
      last_accessed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded object if database insert fails
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error(dbError.message || 'Failed to register text file metadata.');
  }

  return fileRecord;
}

/**
 * Load text content of an existing .txt file from Supabase Storage
 */
export async function loadTextFileContent(storagePath) {
  const supabase = createClient();
  const { data: blob, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);

  if (error) {
    throw new Error(error.message || 'Failed to download text file content.');
  }

  return await blob.text();
}

/**
 * Update an existing .txt file in Supabase Storage and PostgreSQL
 */
export async function updateTextFile({ fileId, storagePath, name, content }) {
  const finalName = ensureTxtExtension(name);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

  const supabase = createClient();

  // 1. Update existing object in Supabase Storage (upsert: true)
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, blob, {
      contentType: 'text/plain',
      upsert: true,
    });

  if (storageError) {
    throw new Error(storageError.message || 'Failed to update text file in storage.');
  }

  // 2. Update PostgreSQL files record
  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .update({
      name: finalName,
      size_bytes: blob.size,
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();

  if (dbError) {
    throw new Error(dbError.message || 'Failed to update file metadata.');
  }

  return fileRecord;
}
