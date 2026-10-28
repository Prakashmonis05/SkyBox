'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Folder,
  ChevronRight,
  FolderPlus,
  UploadCloud,
  FileText,
  LayoutGrid,
  List,
  Home,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import {
  getFolders,
  getFolderById,
  getBreadcrumbTrail,
  toggleStarFolder,
} from '@/lib/folders';
import {
  getFiles,
  downloadFile,
  toggleStarFile,
} from '@/lib/files';
import FolderItem from '@/components/dashboard/FolderItem';
import FileItem from '@/components/dashboard/FileItem';
import NewFolderModal from '@/components/dashboard/NewFolderModal';
import RenameFolderModal from '@/components/dashboard/RenameFolderModal';
import MoveFolderModal from '@/components/dashboard/MoveFolderModal';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';
import UploadModal from '@/components/dashboard/UploadModal';
import FilePreviewModal from '@/components/dashboard/FilePreviewModal';
import RenameFileModal from '@/components/dashboard/RenameFileModal';
import MoveFileModal from '@/components/dashboard/MoveFileModal';
import DeleteFileModal from '@/components/dashboard/DeleteFileModal';
import TextEditorModal from '@/components/dashboard/TextEditorModal';

function FilesExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folderId') || null;

  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Files' }]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isDragOverPage, setIsDragOverPage] = useState(false);

  // Folder Modals
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState(null);
  const [moveFolderTarget, setMoveFolderTarget] = useState(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  // File Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewFileTarget, setPreviewFileTarget] = useState(null);
  const [renameFileTarget, setRenameFileTarget] = useState(null);
  const [moveFileTarget, setMoveFileTarget] = useState(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState(null);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [editingTextFile, setEditingTextFile] = useState(null);

  const fetchDirectoryContents = async () => {
    setLoading(true);
    setError('');

    try {
      if (folderId) {
        const folder = await getFolderById(folderId);
        setCurrentFolder(folder);
      } else {
        setCurrentFolder(null);
      }

      const [trail, subfolders, directoryFiles] = await Promise.all([
        getBreadcrumbTrail(folderId),
        getFolders(folderId),
        getFiles(folderId),
      ]);

      setBreadcrumbs(trail);
      setFolders(subfolders);
      setFiles(directoryFiles);
    } catch (err) {
      console.error('Failed to load directory:', err);
      setError(err.message || 'Failed to load directory contents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectoryContents();
  }, [folderId]);

  const handleOpenFolder = (targetFolder) => {
    router.push(`/dashboard/files?folderId=${targetFolder.id}`);
  };

  const handleToggleFolderStar = async (targetFolder) => {
    try {
      const updated = await toggleStarFolder(targetFolder.id, !targetFolder.is_starred);
      setFolders((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
    } catch (err) {
      console.error('Failed to star folder:', err);
    }
  };

  const handleToggleFileStar = async (targetFile) => {
    try {
      const updated = await toggleStarFile(targetFile.id, !targetFile.is_starred);
      setFiles((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
    } catch (err) {
      console.error('Failed to star file:', err);
    }
  };

  const handleEditTextFile = (file) => {
    setEditingTextFile(file);
    setTextEditorOpen(true);
  };

  const parentName = currentFolder ? currentFolder.name : 'My Files';

  // Global drag-and-drop onto page
  const handlePageDragOver = (e) => {
    e.preventDefault();
    setIsDragOverPage(true);
  };

  const handlePageDrop = (e) => {
    e.preventDefault();
    setIsDragOverPage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadModalOpen(true);
    }
  };

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div
      onDragOver={handlePageDragOver}
      onDragLeave={() => setIsDragOverPage(false)}
      onDrop={handlePageDrop}
      className={`space-y-6 min-h-[70vh] transition-colors rounded-3xl ${
        isDragOverPage ? 'bg-blue-50/40 outline-2 outline-dashed outline-blue-400 p-2' : ''
      }`}
    >
      {/* Folder Modals */}
      <NewFolderModal
        isOpen={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        parentId={folderId}
        parentName={parentName}
        onFolderCreated={(newFolder) => {
          setFolders((prev) => [...prev, newFolder]);
        }}
      />

      <RenameFolderModal
        isOpen={Boolean(renameFolderTarget)}
        onClose={() => setRenameFolderTarget(null)}
        folder={renameFolderTarget}
        onFolderRenamed={(updated) => {
          setFolders((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f))
          );
        }}
      />

      <MoveFolderModal
        isOpen={Boolean(moveFolderTarget)}
        onClose={() => setMoveFolderTarget(null)}
        folder={moveFolderTarget}
        onFolderMoved={() => {
          fetchDirectoryContents();
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteFolderTarget)}
        onClose={() => setDeleteFolderTarget(null)}
        folder={deleteFolderTarget}
        onFolderDeleted={(deletedId) => {
          setFolders((prev) => prev.filter((f) => f.id !== deletedId));
        }}
      />

      {/* File Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={folderId}
        folderName={parentName}
        onUploadComplete={() => {
          fetchDirectoryContents();
        }}
      />

      <FilePreviewModal
        isOpen={Boolean(previewFileTarget)}
        onClose={() => setPreviewFileTarget(null)}
        file={previewFileTarget}
      />

      <TextEditorModal
        isOpen={textEditorOpen}
        onClose={() => {
          setTextEditorOpen(false);
          setEditingTextFile(null);
        }}
        folderId={folderId}
        folderName={parentName}
        editingFile={editingTextFile}
        onFileSaved={() => {
          fetchDirectoryContents();
        }}
      />

      <RenameFileModal
        isOpen={Boolean(renameFileTarget)}
        onClose={() => setRenameFileTarget(null)}
        file={renameFileTarget}
        onFileRenamed={(updated) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f))
          );
        }}
      />

      <MoveFileModal
        isOpen={Boolean(moveFileTarget)}
        onClose={() => setMoveFileTarget(null)}
        file={moveFileTarget}
        onFileMoved={() => {
          fetchDirectoryContents();
        }}
      />

      <DeleteFileModal
        isOpen={Boolean(deleteFileTarget)}
        onClose={() => setDeleteFileTarget(null)}
        file={deleteFileTarget}
        onFileDeleted={(deletedId) => {
          setFiles((prev) => prev.filter((f) => f.id !== deletedId));
        }}
      />

      {/* Breadcrumb Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-sm text-slate-500 overflow-x-auto py-1 scrollbar-none">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const href = crumb.id
              ? `/dashboard/files?folderId=${crumb.id}`
              : '/dashboard/files';

            return (
              <div key={crumb.id || 'root'} className="flex items-center gap-1.5 shrink-0">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                {isLast ? (
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100">
                    {idx === 0 ? (
                      <Home className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{crumb.name}</span>
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-blue-600 font-medium px-1.5 py-0.5 rounded transition flex items-center gap-1"
                  >
                    {idx === 0 && <Home className="w-3.5 h-3.5" />}
                    <span>{crumb.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {folderId && (
            <button
              onClick={() => {
                if (breadcrumbs.length > 1) {
                  const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
                  const upHref = parentCrumb?.id
                    ? `/dashboard/files?folderId=${parentCrumb.id}`
                    : '/dashboard/files';
                  router.push(upHref);
                } else {
                  router.push('/dashboard/files');
                }
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              title="Go to parent folder"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setNewFolderOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => {
              setEditingTextFile(null);
              setTextEditorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>New .txt File</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Contents */}
      {loading ? (
        <div className="p-20 flex flex-col justify-center items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Loading files and folders...</span>
        </div>
      ) : isEmpty ? (
        /* Empty Folder State */
        <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {currentFolder ? `"${currentFolder.name}" is empty` : 'Your vault is empty'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload documents, media, and files directly, create plain-text notes, or create organized subfolders.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Files</span>
            </button>
            <button
              onClick={() => {
                setEditingTextFile(null);
                setTextEditorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>New Text File (.txt)</span>
            </button>
            <button
              onClick={() => setNewFolderOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span>Create Folder</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Folders ({folders.length})
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {folders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      viewMode="grid"
                      onOpen={handleOpenFolder}
                      onRename={(f) => setRenameFolderTarget(f)}
                      onMove={(f) => setMoveFolderTarget(f)}
                      onDelete={(f) => setDeleteFolderTarget(f)}
                      onToggleStar={handleToggleFolderStar}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      viewMode="list"
                      onOpen={handleOpenFolder}
                      onRename={(f) => setRenameFolderTarget(f)}
                      onMove={(f) => setMoveFolderTarget(f)}
                      onDelete={(f) => setDeleteFolderTarget(f)}
                      onToggleStar={handleToggleFolderStar}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Files ({files.length})
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode="grid"
                      onPreview={(f) => setPreviewFileTarget(f)}
                      onEdit={handleEditTextFile}
                      onDownload={(f) => downloadFile(f)}
                      onRename={(f) => setRenameFileTarget(f)}
                      onMove={(f) => setMoveFileTarget(f)}
                      onDelete={(f) => setDeleteFileTarget(f)}
                      onToggleStar={handleToggleFileStar}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode="list"
                      onPreview={(f) => setPreviewFileTarget(f)}
                      onEdit={handleEditTextFile}
                      onDownload={(f) => downloadFile(f)}
                      onRename={(f) => setRenameFileTarget(f)}
                      onMove={(f) => setMoveFileTarget(f)}
                      onDelete={(f) => setDeleteFileTarget(f)}
                      onToggleStar={handleToggleFileStar}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyFilesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <FilesExplorer />
    </Suspense>
  );
}
