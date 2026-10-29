import { createClient } from '@/lib/supabase/client';
import {
  BUCKET_NAME,
  sanitizeFileName,
  uploadFile,
  formatBytes,
  getUserStorageUsage,
  STORAGE_LIMIT_BYTES,
  notifyStorageUpdated,
} from './files';

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
 * Create a new .txt file directly in Cloudinary / Supabase Storage and register in PostgreSQL
 */
export async function createTextFile({ name = 'Untitled.txt', content = '', folderId = null }) {
  const finalName = ensureTxtExtension(name);
  const file = new File([content], finalName, { type: 'text/plain;charset=utf-8' });
  return await uploadFile(file, folderId);
}

/**
 * Load text content of an existing .txt file from Cloudinary or Supabase Storage
 */
export async function loadTextFileContent(storagePath) {
  if (!storagePath) return '';

  // If stored in Cloudinary
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    const res = await fetch(storagePath);
    if (!res.ok) {
      throw new Error(`Failed to download text note from cloud (${res.statusText}).`);
    }
    return await res.text();
  }

  // Legacy Supabase Storage download
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
 * Update an existing .txt file in Cloudinary or Supabase Storage and PostgreSQL
 */
export async function updateTextFile({ fileId, storagePath, name, content }) {
  const finalName = ensureTxtExtension(name);
  const supabase = createClient();

  const newBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });

  // Validate 1 GB storage limit if size is expanding
  const { data: existingFile } = await supabase
    .from('files')
    .select('size_bytes')
    .eq('id', fileId)
    .single();

  const sizeDiff = newBlob.size - (existingFile?.size_bytes || 0);
  if (sizeDiff > 0) {
    const usage = await getUserStorageUsage();
    if (usage.totalBytes + sizeDiff > STORAGE_LIMIT_BYTES) {
      const remaining = Math.max(0, STORAGE_LIMIT_BYTES - usage.totalBytes);
      throw new Error(
        `Storage quota exceeded (1 GB limit). You have ${formatBytes(remaining)} remaining space.`
      );
    }
  }

  let newStoragePath = storagePath;

  // If using Cloudinary
  if (storagePath && (storagePath.startsWith('http://') || storagePath.startsWith('https://'))) {
    try {
      const file = new File([content], finalName, { type: 'text/plain;charset=utf-8' });
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await res.json();
      if (res.ok && uploadData.url) {
        newStoragePath = uploadData.url;

        // Delete old Cloudinary file in background
        fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: storagePath }),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Cloudinary text update error, keeping existing path:', err);
    }
  } else if (storagePath) {
    // Legacy Supabase Storage update
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, newBlob, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (storageError) {
      throw new Error(storageError.message || 'Failed to update text file in storage.');
    }
  }

  // Update PostgreSQL files record
  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .update({
      name: finalName,
      storage_path: newStoragePath,
      size_bytes: newBlob.size,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();

  if (dbError) {
    throw new Error(dbError.message || 'Failed to update file record.');
  }

  notifyStorageUpdated();
  return fileRecord;
}
