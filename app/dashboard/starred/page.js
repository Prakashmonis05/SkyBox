'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Folder, File, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toggleStarFolder } from '@/lib/folders';
import { toggleStarFile, downloadFile } from '@/lib/files';
import FolderItem from '@/components/dashboard/FolderItem';
import FileItem from '@/components/dashboard/FileItem';
import RenameFolderModal from '@/components/dashboard/RenameFolderModal';
import MoveFolderModal from '@/components/dashboard/MoveFolderModal';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';
import FilePreviewModal from '@/components/dashboard/FilePreviewModal';
import RenameFileModal from '@/components/dashboard/RenameFileModal';
import MoveFileModal from '@/components/dashboard/MoveFileModal';
import DeleteFileModal from '@/components/dashboard/DeleteFileModal';

export default function StarredPage() {
  const router = useRouter();
  const [starredFolders, setStarredFolders] = useState([]);
  const [starredFiles, setStarredFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Folder Modals
  const [renameFolderTarget, setRenameFolderTarget] = useState(null);
  const [moveFolderTarget, setMoveFolderTarget] = useState(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  // File Modals
  const [previewFile, setPreviewFile] = useState(null);
  const [renameFileTarget, setRenameFileTarget] = useState(null);
  const [moveFileTarget, setMoveFileTarget] = useState(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState(null);

  const supabase = createClient();

  const fetchStarred = async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .eq('is_starred', true)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false }),
        supabase
          .from('files')
          .select('*')
          .eq('is_starred', true)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false }),
      ]);

      if (foldersRes.data) setStarredFolders(foldersRes.data);
      if (filesRes.data) setStarredFiles(filesRes.data);
    } catch (err) {
      console.error('Error fetching starred:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarred();
  }, []);

  const handleToggleFolderStar = async (folder) => {
    try {
      await toggleStarFolder(folder.id, false);
      setStarredFolders((prev) => prev.filter((f) => f.id !== folder.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFileStar = async (file) => {
    try {
      await toggleStarFile(file.id, false);
      setStarredFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error(err);
    }
  };

  const isEmpty = starredFolders.length === 0 && starredFiles.length === 0;

  return (
    <div className="space-y-6">
      {/* Folder Modals */}
      <RenameFolderModal
        isOpen={Boolean(renameFolderTarget)}
        onClose={() => setRenameFolderTarget(null)}
        folder={renameFolderTarget}
        onFolderRenamed={() => fetchStarred()}
      />

      <MoveFolderModal
        isOpen={Boolean(moveFolderTarget)}
        onClose={() => setMoveFolderTarget(null)}
        folder={moveFolderTarget}
        onFolderMoved={() => fetchStarred()}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteFolderTarget)}
        onClose={() => setDeleteFolderTarget(null)}
        folder={deleteFolderTarget}
        onFolderDeleted={(id) => {
          setStarredFolders((prev) => prev.filter((f) => f.id !== id));
        }}
      />

      {/* File Modals */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      <RenameFileModal
        isOpen={Boolean(renameFileTarget)}
        onClose={() => setRenameFileTarget(null)}
        file={renameFileTarget}
        onFileRenamed={() => fetchStarred()}
      />

      <MoveFileModal
        isOpen={Boolean(moveFileTarget)}
        onClose={() => setMoveFileTarget(null)}
        file={moveFileTarget}
        onFileMoved={() => fetchStarred()}
      />

      <DeleteFileModal
        isOpen={Boolean(deleteFileTarget)}
        onClose={() => setDeleteFileTarget(null)}
        file={deleteFileTarget}
        onFileDeleted={(id) => {
          setStarredFiles((prev) => prev.filter((f) => f.id !== id));
        }}
      />

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <span>Starred Items</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pinned folders and important files for immediate access.
        </p>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : isEmpty ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
            <Star className="w-8 h-8 fill-amber-400/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No starred items yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the star icon on any folder or file to keep it conveniently pinned here.
            </p>
          </div>
          <Link
            href="/dashboard/files"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition"
          >
            <Folder className="w-4 h-4" />
            <span>Browse Vault</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Starred Folders */}
          {starredFolders.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Starred Folders ({starredFolders.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {starredFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    viewMode="grid"
                    onOpen={(f) => router.push(`/dashboard/files?folderId=${f.id}`)}
                    onRename={(f) => setRenameFolderTarget(f)}
                    onMove={(f) => setMoveFolderTarget(f)}
                    onDelete={(f) => setDeleteFolderTarget(f)}
                    onToggleStar={handleToggleFolderStar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Starred Files */}
          {starredFiles.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Starred Files ({starredFiles.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {starredFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    viewMode="grid"
                    onPreview={(f) => setPreviewFile(f)}
                    onDownload={(f) => downloadFile(f)}
                    onRename={(f) => setRenameFileTarget(f)}
                    onMove={(f) => setMoveFileTarget(f)}
                    onDelete={(f) => setDeleteFileTarget(f)}
                    onToggleStar={handleToggleFileStar}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
