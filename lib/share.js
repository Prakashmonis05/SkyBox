import { createClient } from '@/lib/supabase/client';

const LOCAL_STORAGE_SHARE_KEY = 'skybox_demo_shared_clips';

function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return !url || url.includes('placeholder');
}

/**
 * Generate a memorable 6-digit numerical Share Code
 * e.g. "482910"
 */
export function generateShareCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getLocalSharedClips() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHARE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    const now = Date.now();
    return items.filter((item) => new Date(item.expires_at).getTime() > now);
  } catch {
    return [];
  }
}

function saveLocalSharedClips(items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SHARE_KEY, JSON.stringify(items));
  } catch {}
}

/**
 * Create a public shared clip (accessible without login via 6-digit code)
 */
export async function createPublicClip({
  title = 'Shared Clip',
  content = '',
  fileName = null,
  fileSize = 0,
  mimeType = 'text/plain',
  minutes = 1440, // 24 hours
  isCloudFile = false,
  storagePath = null,
  fileId = null,
}) {
  const shareCode = generateShareCode();
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  let ownerId = null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) ownerId = user.id;
  } catch {}

  const newClip = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `share_${Date.now()}`,
    share_code: shareCode,
    owner_id: ownerId,
    file_id: fileId,
    file_name: fileName || (content ? 'snippet.txt' : 'file.bin'),
    file_size: fileSize || (content ? new Blob([content]).size : 0),
    mime_type: mimeType,
    storage_path: storagePath,
    title: title.trim() || 'Shared Clip',
    content: content || '',
    is_cloud_file: isCloudFile,
    expires_at: expiresAt,
    download_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isDemoMode()) {
    const local = getLocalSharedClips();
    saveLocalSharedClips([newClip, ...local]);
    return newClip;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shared_clips')
      .insert({
        share_code: shareCode,
        owner_id: ownerId,
        file_id: fileId,
        file_name: newClip.file_name,
        file_size: newClip.file_size,
        mime_type: newClip.mime_type,
        storage_path: storagePath,
        title: newClip.title,
        content: newClip.content,
        is_cloud_file: isCloudFile,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert failed, storing locally:', error.message);
      const local = getLocalSharedClips();
      saveLocalSharedClips([newClip, ...local]);
      return newClip;
    }

    return data;
  } catch (err) {
    const local = getLocalSharedClips();
    saveLocalSharedClips([newClip, ...local]);
    return newClip;
  }
}

/**
 * Retrieve a shared clip using its 6-digit share code.
 * Works for any visitor without login!
 */
export async function getSharedClipByCode(code) {
  if (!code || !code.trim()) return null;
  const cleanCode = code.trim().toUpperCase();

  if (isDemoMode()) {
    const local = getLocalSharedClips();
    const found = local.find(
      (c) => c.share_code.toUpperCase() === cleanCode && new Date(c.expires_at).getTime() > Date.now()
    );
    if (found) {
      found.download_count = (found.download_count || 0) + 1;
      saveLocalSharedClips(local);
      return found;
    }
    return null;
  }

  try {
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('shared_clips')
      .select('*')
      .ilike('share_code', cleanCode)
      .gt('expires_at', nowIso)
      .maybeSingle();

    if (error || !data) {
      // Check local fallback
      const local = getLocalSharedClips();
      return (
        local.find(
          (c) =>
            c.share_code.toUpperCase() === cleanCode &&
            new Date(c.expires_at).getTime() > Date.now()
        ) || null
      );
    }

    // Increment download count asynchronously
    supabase
      .from('shared_clips')
      .update({ download_count: (data.download_count || 0) + 1 })
      .eq('id', data.id);

    return data;
  } catch (err) {
    const local = getLocalSharedClips();
    return (
      local.find(
        (c) =>
          c.share_code.toUpperCase() === cleanCode &&
          new Date(c.expires_at).getTime() > Date.now()
      ) || null
    );
  }
}

/**
 * Logged-in user: Share an uploaded cloud file directly via a short 6-digit code!
 */
export async function shareCloudFile(file, minutes = 1440) {
  if (!file) throw new Error('File object is required.');

  return await createPublicClip({
    title: file.name,
    content: '',
    fileName: file.name,
    fileSize: file.size_bytes || 0,
    mimeType: file.mime_type || 'application/octet-stream',
    minutes,
    isCloudFile: true,
    storagePath: file.storage_path,
    fileId: file.id,
  });
}
