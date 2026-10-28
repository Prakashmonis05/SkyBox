'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  Folder,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  File
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { restoreFolder, permanentlyDeleteFolder } from '@/lib/folders';
import { restoreFile, permanentlyDeleteFile, formatBytes } from '@/lib/files';
import { getFileTypeIcon } from '@/components/dashboard/FileItem';

export default function TrashPage() {
  const [trashedFolders, setTrashedFolders] = useState([]);
  const [trashedFiles, setTrashedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false }),
        supabase
          .from('files')
          .select('*')
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false }),
      ]);

      if (foldersRes.data) setTrashedFolders(foldersRes.data);
      if (filesRes.data) setTrashedFiles(filesRes.data);
    } catch (err) {
      console.error('Error fetching trash:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestoreFolder = async (folderId) => {
    setActionLoading(true);
    try {
      await restoreFolder(folderId);
      setTrashedFolders((prev) => prev.filter((f) => f.id !== folderId));
      setMessage('Folder restored to original directory or root.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreFile = async (fileId) => {
    setActionLoading(true);
    try {
      await restoreFile(fileId);
      setTrashedFiles((prev) => prev.filter((f) => f.id !== fileId));
      setMessage('File restored to original directory or root.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDeleteFolder = async (folderId) => {
    if (!confirm('Permanently delete this folder? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await permanentlyDeleteFolder(folderId);
      setTrashedFolders((prev) => prev.filter((f) => f.id !== folderId));
      setMessage('Folder permanently erased.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDeleteFile = async (file) => {
    if (!confirm(`Permanently delete "${file.name}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await permanentlyDeleteFile(file.id, file.storage_path);
      setTrashedFiles((prev) => prev.filter((f) => f.id !== file.id));
      setMessage('File and storage object permanently erased.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    setActionLoading(true);
    try {
      // 1. Delete all trashed files from Supabase Storage and DB
      for (const f of trashedFiles) {
        await permanentlyDeleteFile(f.id, f.storage_path);
      }

      // 2. Delete all trashed folders from DB
      await supabase
        .from('folders')
        .delete()
        .not('deleted_at', 'is', null);

      setTrashedFolders([]);
      setTrashedFiles([]);
      setEmptyConfirmOpen(false);
      setMessage('Trash completely emptied.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalTrashCount = trashedFolders.length + trashedFiles.length;

  return (
    <div className="space-y-6">
      {/* Empty Trash Confirmation Modal */}
      {emptyConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Empty Trash Vault</h3>
                <p className="text-xs text-slate-500">Permanent destruction</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All {totalTrashCount} folders, documents, and files currently in Trash will be permanently deleted from database and cloud storage. Are you completely sure?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEmptyConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
              >
                {actionLoading ? 'Erasing...' : 'Empty Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span>Trash Vault</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Soft-deleted files and folders are safely preserved here until you restore or permanently erase them.
          </p>
        </div>

        {totalTrashCount > 0 && (
          <button
            onClick={() => setEmptyConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash ({totalTrashCount})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-20 flex justify-center items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : totalTrashCount > 0 ? (
        <div className="space-y-6">
          {/* Trashed Folders */}
          {trashedFolders.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Deleted Folders ({trashedFolders.length})
              </div>
              <div className="space-y-2">
                {trashedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {folder.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Folder • Deleted{' '}
                          {new Date(folder.deleted_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreFolder(folder.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => handlePermanentDeleteFolder(folder.id)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Permanently Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trashed Files */}
          {trashedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Deleted Files ({trashedFiles.length})
              </div>
              <div className="space-y-2">
                {trashedFiles.map((file) => {
                  const { icon: FileIcon, color, bg } = getFileTypeIcon(
                    file.mime_type,
                    file.name
                  );
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}
                        >
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {file.name}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {formatBytes(file.size_bytes)} • Deleted{' '}
                            {new Date(file.deleted_at).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRestoreFile(file.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => handlePermanentDeleteFile(file)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
            <Trash2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Trash is empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Items you delete from folders will be safely preserved here until you restore them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
