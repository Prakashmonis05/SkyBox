import { createClient } from '@/lib/supabase/client';

/**
 * Fetch folders in a given directory level (or root if parentId is null).
 */
export async function getFolders(parentId = null) {
  const supabase = createClient();
  let query = supabase
    .from('folders')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single folder by ID.
 */
export async function getFolderById(folderId) {
  if (!folderId) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', folderId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Build breadcrumb trail from root to the specified folder.
 * Returns array like: [{ id: null, name: 'My Files' }, { id: '...', name: 'Folder 1' }, ...]
 */
export async function getBreadcrumbTrail(folderId) {
  const trail = [{ id: null, name: 'My Files' }];
  if (!folderId) return trail;

  const supabase = createClient();
  let currentId = folderId;
  const chain = [];

  // Traverse up the tree to root
  while (currentId) {
    const { data: folder, error } = await supabase
      .from('folders')
      .select('id, name, parent_id')
      .eq('id', currentId)
      .single();

    if (error || !folder) break;
    chain.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parent_id;
  }

  return [...trail, ...chain];
}

/**
 * Create a new folder under a parent (or root if parentId is null).
 */
export async function createFolder(name, parentId = null) {
  if (!name || !name.trim()) {
    throw new Error('Folder name cannot be empty.');
  }

  const sanitizedName = name.trim();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated.');

  const { data, error } = await supabase
    .from('folders')
    .insert({
      owner_id: user.id,
      name: sanitizedName,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Rename an existing folder.
 */
export async function renameFolder(folderId, newName) {
  if (!newName || !newName.trim()) {
    throw new Error('Folder name cannot be empty.');
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('folders')
    .update({ name: newName.trim(), updated_at: new Date().toISOString() })
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Move a folder to a new parent folder.
 * Validates that folder cannot be moved into itself or its descendants.
 */
export async function moveFolder(targetFolderId, newParentId) {
  if (targetFolderId === newParentId) {
    throw new Error('Cannot move a folder into itself.');
  }

  const supabase = createClient();

  // Validate using the PostgreSQL function if available, or client check
  if (newParentId) {
    const { data: isValid, error: rpcError } = await supabase.rpc(
      'is_valid_folder_move',
      {
        target_folder_id: targetFolderId,
        new_parent_id: newParentId,
      }
    );

    if (!rpcError && isValid === false) {
      throw new Error('Cannot move a folder into one of its subfolders.');
    }
  }

  const { data, error } = await supabase
    .from('folders')
    .update({
      parent_id: newParentId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetFolderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle starred status of a folder.
 */
export async function toggleStarFolder(folderId, isStarred) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('folders')
    .update({
      is_starred: isStarred,
      updated_at: new Date().toISOString(),
    })
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft delete a folder (moves it to Trash).
 */
export async function softDeleteFolder(folderId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('folders')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Restore a folder from Trash.
 */
export async function restoreFolder(folderId) {
  const supabase = createClient();

  // Check if original parent is also in trash or deleted
  const { data: folder } = await supabase
    .from('folders')
    .select('parent_id')
    .eq('id', folderId)
    .single();

  let finalParentId = folder?.parent_id;

  if (finalParentId) {
    const { data: parent } = await supabase
      .from('folders')
      .select('id, deleted_at')
      .eq('id', finalParentId)
      .single();

    if (!parent || parent.deleted_at) {
      // Parent no longer exists or is deleted, restore to root
      finalParentId = null;
    }
  }

  const { data, error } = await supabase
    .from('folders')
    .update({
      deleted_at: null,
      parent_id: finalParentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Permanently delete a folder from database.
 */
export async function permanentlyDeleteFolder(folderId) {
  const supabase = createClient();
  const { error } = await supabase.from('folders').delete().eq('id', folderId);
  if (error) throw error;
  return true;
}

/**
 * Fetch all folders for move dialog dropdown tree.
 */
export async function getAllUserFolders(excludeFolderId = null) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) throw error;
  if (!excludeFolderId) return data || [];

  // Exclude the folder itself and its descendants
  const excludedIds = new Set([excludeFolderId]);
  let added = true;

  while (added) {
    added = false;
    for (const f of data || []) {
      if (f.parent_id && excludedIds.has(f.parent_id) && !excludedIds.has(f.id)) {
        excludedIds.add(f.id);
        added = true;
      }
    }
  }

  return (data || []).filter((f) => !excludedIds.has(f.id));
}
