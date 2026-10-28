'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  LayoutGrid,
  List,
  Folder,
  Loader2,
  FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadFile, toggleStarFile } from '@/lib/files';
import FileItem from '@/components/dashboard/FileItem';
import FilePreviewModal from '@/components/dashboard/FilePreviewModal';
import TextEditorModal from '@/components/dashboard/TextEditorModal';
import RenameFileModal from '@/components/dashboard/RenameFileModal';
import MoveFileModal from '@/components/dashboard/MoveFileModal';
import DeleteFileModal from '@/components/dashboard/DeleteFileModal';

export default function RecentPage() {
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  // Modals
  const [previewFile, setPreviewFile] = useState(null);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [editingTextFile, setEditingTextFile] = useState(null);
  const [renameFile, setRenameFile] = useState(null);
  const [moveFile, setMoveFile] = useState(null);
  const [deleteFile, setDeleteFile] = useState(null);

  const supabase = createClient();

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .is('deleted_at', null)
        .order('last_accessed_at', { ascending: false })
        .limit(25);

      if (!error && data) {
        setRecentFiles(data);
      }
    } catch (err) {
      console.error('Error fetching recent files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleEditTextFile = (file) => {
    setEditingTextFile(file);
    setTextEditorOpen(true);
  };

  const handleToggleStar = async (targetFile) => {
    try {
      const updated = await toggleStarFile(targetFile.id, !targetFile.is_starred);
      setRecentFiles((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      <TextEditorModal
        isOpen={textEditorOpen}
        onClose={() => {
          setTextEditorOpen(false);
          setEditingTextFile(null);
        }}
        editingFile={editingTextFile}
        onFileSaved={() => fetchRecent()}
      />

      <RenameFileModal
        isOpen={Boolean(renameFile)}
        onClose={() => setRenameFile(null)}
        file={renameFile}
        onFileRenamed={() => fetchRecent()}
      />

      <MoveFileModal
        isOpen={Boolean(moveFile)}
        onClose={() => setMoveFile(null)}
        file={moveFile}
        onFileMoved={() => fetchRecent()}
      />

      <DeleteFileModal
        isOpen={Boolean(deleteFile)}
        onClose={() => setDeleteFile(null)}
        file={deleteFile}
        onFileDeleted={() => fetchRecent()}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Recent Activity</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Files and plain-text notes you opened or modified recently.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center items-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                onToggleStar={handleToggleStar}
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
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        )
      ) : (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No recent files yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once you upload files or create plain-text notes, they will appear here in chronological order.
            </p>
          </div>
          <Link
            href="/dashboard/files"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition"
          >
            <Folder className="w-4 h-4" />
            <span>Open My Files</span>
          </Link>
        </div>
      )}
    </div>
  );
}
