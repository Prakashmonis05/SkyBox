'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QuickActions from '@/components/dashboard/QuickActions';
import StorageCard from '@/components/dashboard/StorageCard';
import NewFolderModal from '@/components/dashboard/NewFolderModal';
import UploadModal from '@/components/dashboard/UploadModal';
import TextEditorModal from '@/components/dashboard/TextEditorModal';
import FileItem from '@/components/dashboard/FileItem';
import FilePreviewModal from '@/components/dashboard/FilePreviewModal';
import RenameFileModal from '@/components/dashboard/RenameFileModal';
import MoveFileModal from '@/components/dashboard/MoveFileModal';
import DeleteFileModal from '@/components/dashboard/DeleteFileModal';
import {
  Folder,
  FileText,
  UploadCloud,
  LayoutGrid,
  List,
  Clock,
  HardDrive,
  FolderPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getUserStorageUsage,
  downloadFile,
  toggleStarFile,
  notifyStorageUpdated,
} from '@/lib/files';

export default function DashboardHomePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid');
  const [recentFolders, setRecentFolders] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [folderCount, setFolderCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [textEditorModalOpen, setTextEditorModalOpen] = useState(false);
  const [editingTextFile, setEditingTextFile] = useState(null);

  const [previewFile, setPreviewFile] = useState(null);
  const [renameFile, setRenameFile] = useState(null);
  const [moveFile, setMoveFile] = useState(null);
  const [deleteFile, setDeleteFile] = useState(null);

  const supabase = createClient();

  const fetchHomeData = async () => {
    try {
      const [
        { data: foldersData, count: fCount },
        { data: filesData, count: fileExactCount },
        { count: trashedFolderCount },
        { count: trashedFileCount },
        storageUsage,
      ] = await Promise.all([
        supabase
          .from('folders')
          .select('*', { count: 'exact' })
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(6),
        supabase
          .from('files')
          .select('*', { count: 'exact' })
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(8),
        supabase
          .from('folders')
          .select('*', { count: 'exact', head: true })
          .not('deleted_at', 'is', null),
        supabase
          .from('files')
          .select('*', { count: 'exact', head: true })
          .not('deleted_at', 'is', null),
        getUserStorageUsage(),
      ]);

      if (foldersData) setRecentFolders(foldersData);
      if (filesData) setRecentFiles(filesData);
      setFolderCount(fCount || 0);
      setFileCount(fileExactCount || 0);
      setTrashCount((trashedFolderCount || 0) + (trashedFileCount || 0));
      setUsedBytes(storageUsage.totalBytes);
      notifyStorageUpdated(storageUsage);
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleQuickAction = (actionName) => {
    if (actionName === 'New Folder') {
      setNewFolderOpen(true);
    } else if (actionName === 'Upload Files') {
      setUploadModalOpen(true);
    } else if (actionName === 'New Text File' || actionName === 'New Text File (.txt)') {
      setEditingTextFile(null);
      setTextEditorModalOpen(true);
    } else if (actionName === 'Online Clipboard') {
      router.push('/dashboard/clipboard');
    }
  };

  const handleEditTextFile = (file) => {
    setEditingTextFile(file);
    setTextEditorModalOpen(true);
  };

  const handleToggleFileStar = async (targetFile) => {
    try {
      const updated = await toggleStarFile(targetFile.id, !targetFile.is_starred);
      setRecentFiles((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const textNotesCount = recentFiles.filter(
    (f) => f.mime_type.includes('text') || f.name.endsWith('.txt')
  ).length;

  return (
    <div className="space-y-8">
      {/* Modals */}
      <NewFolderModal
        isOpen={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        parentId={null}
        parentName="My Files"
        onFolderCreated={() => fetchHomeData()}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={null}
        folderName="My Files"
        onUploadComplete={() => fetchHomeData()}
      />

      <TextEditorModal
        isOpen={textEditorModalOpen}
        onClose={() => {
          setTextEditorModalOpen(false);
          setEditingTextFile(null);
        }}
        folderId={null}
        folderName="My Files"
        editingFile={editingTextFile}
        onFileSaved={() => fetchHomeData()}
      />

      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      <RenameFileModal
        isOpen={Boolean(renameFile)}
        onClose={() => setRenameFile(null)}
        file={renameFile}
        onFileRenamed={() => fetchHomeData()}
      />

      <MoveFileModal
        isOpen={Boolean(moveFile)}
        onClose={() => setMoveFile(null)}
        file={moveFile}
        onFileMoved={() => fetchHomeData()}
      />

      <DeleteFileModal
        isOpen={Boolean(deleteFile)}
        onClose={() => setDeleteFile(null)}
        file={deleteFile}
        onFileDeleted={() => fetchHomeData()}
      />

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Personal Cloud Space Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to your SkyBox Vault
          </h1>
          <p className="text-sm text-slate-500">
            All your files, folders, and plain-text notes in one private, secure place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/files"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Folder className="w-4 h-4" />
            <span>Browse My Files</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions Component */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Actions
          </h2>
        </div>
        <QuickActions onAction={handleQuickAction} />
      </div>

      {/* Storage and Overview Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">Total Files</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{fileCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Stored in vault</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">Folders</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{folderCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Hierarchical trees</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">Text Notes</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{textNotesCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">.txt plain files</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-medium text-slate-500">In Trash</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{trashCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Restorable items</div>
            </div>
          </div>

          {/* Quick Notice Card on Data Isolation */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Zero-Trust Isolation Enforced: </span>
              Your vault records and storage objects are locked to your Supabase credentials. Only you can view, upload, download, or edit items within this account.
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <StorageCard usedBytes={usedBytes} totalBytes={1073741824} />
        </div>
      </div>

      {/* Recent Folders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Folders</h3>
          </div>
          <Link
            href="/dashboard/files"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : recentFolders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentFolders.map((f) => (
              <Link
                key={f.id}
                href={`/dashboard/files?folderId=${f.id}`}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Folder className="w-5 h-5 fill-amber-500/20" />
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                    {f.name}
                  </h4>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(f.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">No folders created yet</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Organize your documents into folders and subfolders for quick navigation.
              </p>
            </div>
            <button
              onClick={() => setNewFolderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>Create First Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Recently Accessed Files Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Files</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : recentFiles.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  viewMode="grid"
                  onPreview={(f) => setPreviewFile(f)}
                  onEdit={handleEditTextFile}
                  onDownload={(f) => downloadFile(f)}
                  onRename={(f) => setRenameFile(f)}
                  onMove={(f) => setMoveFile(f)}
                  onDelete={(f) => setDeleteFile(f)}
                  onToggleStar={handleToggleFileStar}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  viewMode="list"
                  onPreview={(f) => setPreviewFile(f)}
                  onEdit={handleEditTextFile}
                  onDownload={(f) => downloadFile(f)}
                  onRename={(f) => setRenameFile(f)}
                  onMove={(f) => setMoveFile(f)}
                  onDelete={(f) => setDeleteFile(f)}
                  onToggleStar={handleToggleFileStar}
                />
              ))}
            </div>
          )
        ) : (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                Your SkyBox file storage is empty
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Upload documents, images, and videos from your computer, or create an instant plain-text note.
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
                  setTextEditorModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-2xs transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>New Text File (.txt)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
