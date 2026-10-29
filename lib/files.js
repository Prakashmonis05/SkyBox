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
 * Fetch all active files for the authenticated user
 */
export async function getAllUserFiles() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Upload a single file to Cloudinary (with fallback to Supabase Storage) and register metadata in PostgreSQL
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

  let storagePath = null;
  let finalSize = file.size;

  // 1. Upload to Cloudinary via server API
  try {
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (uploadRes.ok && uploadData.url) {
      storagePath = uploadData.url;
      finalSize = uploadData.bytes || file.size;
    } else {
      throw new Error(uploadData.error || 'Cloudinary upload failed.');
    }
  } catch (cloudinaryErr) {
    console.warn('Cloudinary upload warning:', cloudinaryErr.message);

    // Fallback: If Cloudinary credentials are not set, attempt Supabase Storage
    const safeName = sanitizeFileName(file.name);
    const fileKey = `${Date.now()}_${safeName}`;
    const fallbackPath = `${user.id}/${fileKey}`;

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fallbackPath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (storageError) {
      throw new Error(cloudinaryErr.message || storageError.message || 'Storage upload failed.');
    }
    storagePath = fallbackPath;
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
      size_bytes: finalSize,
      last_accessed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    // Rollback storage object if DB record creation failed
    if (storagePath.startsWith('http')) {
      fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: storagePath }),
      }).catch(() => {});
    } else {
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    }
    throw new Error(dbError.message || 'Failed to save file metadata.');
  }

  onProgress?.(100);
  return fileRecord;
}

/**
 * Get URL for downloading or previewing (Cloudinary direct CDN URL or Supabase signed URL)
 */
export async function getFileSignedUrl(storagePath, expiresIn = 3600) {
  if (!storagePath) return '';

  // Cloudinary URLs are direct, secure CDN URLs
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

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

  // If stored in Cloudinary
  if (
    file.storage_path &&
    (file.storage_path.startsWith('http://') ||
      file.storage_path.startsWith('https://'))
  ) {
    try {
      const res = await fetch(file.storage_path);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      window.open(file.storage_path, '_blank');
    }

    supabase
      .from('files')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', file.id);
    return;
  }

  // Legacy Supabase Storage download
  const { data: blob, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(file.storage_path);

  if (error) {
    const signedUrl = await getFileSignedUrl(file.storage_path);
    window.open(signedUrl, '_blank');
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

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
 * Permanently delete a file from database and remove its binary from Cloudinary / Supabase Storage
 */
export async function permanentlyDeleteFile(fileId, storagePath) {
  const supabase = createClient();

  // 1. Remove from Cloudinary if it's a Cloudinary URL
  if (
    storagePath &&
    (storagePath.startsWith('http://') || storagePath.startsWith('https://'))
  ) {
    try {
      await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: storagePath }),
      });
    } catch (err) {
      console.warn('Failed to delete Cloudinary object:', err);
    }
  } else if (storagePath) {
    // Legacy Supabase Storage removal
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
