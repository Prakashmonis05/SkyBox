import { createClient } from '@/lib/supabase/client';

const LOCAL_STORAGE_KEY = 'skybox_demo_clipboard_items';

function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return !url || url.includes('placeholder');
}

function getLocalClips() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    const now = Date.now();
    // Filter expired
    return items.filter((item) => new Date(item.expires_at).getTime() > now);
  } catch {
    return [];
  }
}

function saveLocalClips(items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

/**
 * Fetch all active clipboard items for the authenticated user.
 * Automatically purges or filters out expired items.
 */
export async function getClipboardItems() {
  if (isDemoMode()) {
    return getLocalClips();
  }

  try {
    const supabase = createClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('clipboard_items')
      .select('*')
      .gt('expires_at', nowIso)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase clipboard error, using local fallback:', error.message);
      return getLocalClips();
    }
    return data || [];
  } catch (err) {
    console.warn('Clipboard fetch exception, using local fallback:', err);
    return getLocalClips();
  }
}

/**
 * Add a new text or code snippet to Online Clipboard with 60-minute default timeout.
 */
export async function createClip({ title = 'Untitled Clip', content, minutes = 60 }) {
  if (!content || !content.trim()) {
    throw new Error('Clipboard content cannot be empty.');
  }

  const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  const newClip = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `clip_${Date.now()}`,
    title: title.trim() || 'Untitled Clip',
    content: content.trim(),
    expires_at: expiresAt,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isDemoMode()) {
    const existing = getLocalClips();
    const updated = [newClip, ...existing];
    saveLocalClips(updated);
    return newClip;
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const existing = getLocalClips();
      const updated = [newClip, ...existing];
      saveLocalClips(updated);
      return newClip;
    }

    const { data, error } = await supabase
      .from('clipboard_items')
      .insert({
        owner_id: user.id,
        title: title.trim() || 'Untitled Clip',
        content: content.trim(),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert failed, saving locally:', error.message);
      const existing = getLocalClips();
      const updated = [newClip, ...existing];
      saveLocalClips(updated);
      return newClip;
    }

    return data;
  } catch (err) {
    const existing = getLocalClips();
    const updated = [newClip, ...existing];
    saveLocalClips(updated);
    return newClip;
  }
}

/**
 * Reset / Extend the clip timeout timer for another 60 minutes
 */
export async function extendClipTimer(clipId, minutes = 60) {
  const newExpiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  if (isDemoMode()) {
    const existing = getLocalClips();
    const updated = existing.map((c) =>
      c.id === clipId ? { ...c, expires_at: newExpiresAt, updated_at: new Date().toISOString() } : c
    );
    saveLocalClips(updated);
    return updated.find((c) => c.id === clipId);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clipboard_items')
      .update({
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clipId)
      .select()
      .single();

    if (error) {
      const existing = getLocalClips();
      const updated = existing.map((c) =>
        c.id === clipId ? { ...c, expires_at: newExpiresAt } : c
      );
      saveLocalClips(updated);
      return updated.find((c) => c.id === clipId);
    }
    return data;
  } catch (err) {
    const existing = getLocalClips();
    const updated = existing.map((c) =>
      c.id === clipId ? { ...c, expires_at: newExpiresAt } : c
    );
    saveLocalClips(updated);
    return updated.find((c) => c.id === clipId);
  }
}

/**
 * Toggle pinned status of clip
 */
export async function togglePinClip(clipId, isPinned) {
  if (isDemoMode()) {
    const existing = getLocalClips();
    const updated = existing.map((c) =>
      c.id === clipId ? { ...c, is_pinned: isPinned, updated_at: new Date().toISOString() } : c
    );
    saveLocalClips(updated);
    return updated.find((c) => c.id === clipId);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clipboard_items')
      .update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clipId)
      .select()
      .single();

    if (error) {
      const existing = getLocalClips();
      const updated = existing.map((c) =>
        c.id === clipId ? { ...c, is_pinned: isPinned } : c
      );
      saveLocalClips(updated);
      return updated.find((c) => c.id === clipId);
    }
    return data;
  } catch (err) {
    const existing = getLocalClips();
    const updated = existing.map((c) =>
      c.id === clipId ? { ...c, is_pinned: isPinned } : c
    );
    saveLocalClips(updated);
    return updated.find((c) => c.id === clipId);
  }
}

/**
 * Delete a single clipboard item
 */
export async function deleteClip(clipId) {
  if (isDemoMode()) {
    const existing = getLocalClips();
    saveLocalClips(existing.filter((c) => c.id !== clipId));
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('clipboard_items')
      .delete()
      .eq('id', clipId);

    if (error) {
      const existing = getLocalClips();
      saveLocalClips(existing.filter((c) => c.id !== clipId));
    }
    return true;
  } catch (err) {
    const existing = getLocalClips();
    saveLocalClips(existing.filter((c) => c.id !== clipId));
    return true;
  }
}

/**
 * Clear all clipboard items
 */
export async function clearAllClips() {
  if (isDemoMode()) {
    saveLocalClips([]);
    return true;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('clipboard_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      saveLocalClips([]);
    }
    return true;
  } catch (err) {
    saveLocalClips([]);
    return true;
  }
}
