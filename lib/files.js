import { createClient } from '@/lib/supabase/client';

export const BUCKET_NAME = 'skybox-vault';
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB per file

/**
 * Sanitize filename to avoid problematic characters in storage paths
 */
export function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Format bytes to readable size (KB, MB, GB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Fetch files in a specific folder (or root if folderId is null)
 */
export async function getFiles(folderId = null) {
  const supabase = createClient();
  let query = supabase
    .from('files')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (folderId) {
    query = query.eq('folder_id', folderId);
  } else {
    query = query.is('folder_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Upload a single file to Supabase Storage and register metadata in PostgreSQL
 */
export async function uploadFile(file, folderId = null, onProgress = null) {
  if (!file) throw new Error('No file provided.');

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size exceeds 50MB limit (${formatBytes(file.size)}).`
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User is not authenticated.');

  onProgress?.(20);

  // Generate unique storage path: <user_id>/<timestamp>_<filename>
  const safeName = sanitizeFileName(file.name);
  const fileKey = `${Date.now()}_${safeName}`;
  const storagePath = `${user.id}/${fileKey}`;

  // 1. Upload to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (storageError) {
    console.error('Storage upload error:', storageError);
    throw new Error(storageError.message || 'Storage upload failed.');
  }

  onProgress?.(70);

  // 2. Insert metadata into public.files
  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .insert({
      owner_id: user.id,
      folder_id: folderId || null,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      last_accessed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    // Rollback storage object if DB record creation failed
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error(dbError.message || 'Failed to save file metadata.');
  }

  onProgress?.(100);
  return fileRecord;
}

/**
 * Get short-lived signed URL for downloading or previewing
 */
export async function getFileSignedUrl(storagePath, expiresIn = 3600) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data?.signedUrl;
}

/**
 * Download a file to client machine
 */
export async function downloadFile(file) {
  const supabase = createClient();

  // Try direct blob download
  const { data: blob, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(file.storage_path);

  if (error) {
    // Fallback to signed URL redirect
    const signedUrl = await getFileSignedUrl(file.storage_path);
    window.open(signedUrl, '_blank');
    return;
  }

  // Create temporary browser anchor to trigger clean save
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  // Update last_accessed_at in background
  supabase
    .from('files')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', file.id);
}

/**
 * Rename a file
 */
export async function renameFile(fileId, newName) {
  if (!newName || !newName.trim()) {
    throw new Error('Filename cannot be empty.');
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('files')
    .update({
      name: newName.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Move a file to another folder (or root if targetFolderId is null)
 */
export async function moveFile(fileId, targetFolderId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('files')
    .update({
      folder_id: targetFolderId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle starred status of a file
 */
export async function toggleStarFile(fileId, isStarred) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('files')
    .update({
      is_starred: isStarred,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft-delete file (moves to Trash)
 */
export async function softDeleteFile(fileId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('files')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Restore file from Trash
 */
export async function restoreFile(fileId) {
  const supabase = createClient();

  const { data: file } = await supabase
    .from('files')
    .select('folder_id')
    .eq('id', fileId)
    .single();

  let finalFolderId = file?.folder_id;

  // If parent folder was also deleted, restore to root
  if (finalFolderId) {
    const { data: folder } = await supabase
      .from('folders')
      .select('id, deleted_at')
      .eq('id', finalFolderId)
      .single();

    if (!folder || folder.deleted_at) {
      finalFolderId = null;
    }
  }

  const { data, error } = await supabase
    .from('files')
    .update({
      deleted_at: null,
      folder_id: finalFolderId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Permanently delete a file from database and remove its binary from Supabase Storage
 */
export async function permanentlyDeleteFile(fileId, storagePath) {
  const supabase = createClient();

  // 1. Remove from Supabase Storage
  if (storagePath) {
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  }

  // 2. Remove record from public.files
  const { error } = await supabase.from('files').delete().eq('id', fileId);
  if (error) throw error;
  return true;
}

/**
 * Calculate user's total vault storage usage in bytes
 */
export async function getUserStorageUsage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('files')
    .select('size_bytes')
    .is('deleted_at', null);

  if (error) return { totalBytes: 0, fileCount: 0 };

  const totalBytes = (data || []).reduce(
    (acc, curr) => acc + (Number(curr.size_bytes) || 0),
    0
  );
  return {
    totalBytes,
    fileCount: data ? data.length : 0,
  };
}
