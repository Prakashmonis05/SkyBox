'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  FileImage,
  FileCode,
  FileAudio,
  FileVideo,
  FileArchive,
  File,
  Download,
  Eye,
  Edit2,
  FolderInput,
  Star,
  Trash2,
  MoreVertical,
  Share2
} from 'lucide-react';
import { formatBytes } from '@/lib/files';

export function getFileTypeIcon(mimeType = '', name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50' };
  }
  if (mimeType.includes('pdf') || ext === 'pdf') {
    return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50' };
  }
  if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'csv'].includes(ext)) {
    return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
  }
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv'].includes(ext)) {
    return { icon: FileVideo, color: 'text-indigo-600', bg: 'bg-indigo-50' };
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return { icon: FileAudio, color: 'text-amber-600', bg: 'bg-amber-50' };
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return { icon: FileArchive, color: 'text-emerald-600', bg: 'bg-emerald-50' };
  }
  return { icon: File, color: 'text-slate-600', bg: 'bg-slate-100' };
}

export default function FileItem({
  file,
  viewMode = 'grid',
  onPreview,
  onEdit,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onToggleStar,
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isTextFile =
    file.name.toLowerCase().endsWith('.txt') ||
    file.mime_type === 'text/plain';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { icon: FileIcon, color, bg } = getFileTypeIcon(file.mime_type, file.name);

  const formattedDate = file.updated_at
    ? new Date(file.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '';

  const handlePrimaryClick = () => {
    if (isTextFile && onEdit) {
      onEdit(file);
    } else {
      onPreview(file);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition group">
        <div
          onClick={handlePrimaryClick}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
            <FileIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition">
              {file.name}
            </div>
            <div className="text-[11px] text-slate-400">
              {formatBytes(file.size_bytes)} • Modified {formattedDate}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <button
            onClick={() => onToggleStar(file)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              file.is_starred
                ? 'text-amber-500'
                : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
            }`}
            title={file.is_starred ? 'Remove Star' : 'Star File'}
          >
            <Star className={`w-4 h-4 ${file.is_starred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => onDownload(file)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 text-xs">
              {isTextFile && onEdit && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(file);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-blue-600 font-semibold flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Note (.txt)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onPreview(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Preview</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/dashboard/clipboard?shareFileId=${encodeURIComponent(file.id)}`);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-blue-600 font-semibold transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via Code</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDownload(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMove(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <FolderInput className="w-3.5 h-3.5 text-purple-600" />
                <span>Move</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleStar(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>{file.is_starred ? 'Unstar' : 'Star'}</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid Card Mode
  return (
    <div className="relative p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div
          onClick={handlePrimaryClick}
          className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center cursor-pointer group-hover:scale-105 transition shadow-2xs`}
        >
          <FileIcon className="w-6 h-6" />
        </div>

        <div className="flex items-center gap-1" ref={menuRef}>
          <button
            onClick={() => onToggleStar(file)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              file.is_starred
                ? 'text-amber-500'
                : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
            }`}
            title={file.is_starred ? 'Remove Star' : 'Star File'}
          >
            <Star className={`w-4 h-4 ${file.is_starred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-3 top-12 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 text-xs">
              {isTextFile && onEdit && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(file);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-blue-600 font-semibold flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Note (.txt)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onPreview(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Preview</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/dashboard/clipboard?shareFileId=${encodeURIComponent(file.id)}`);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center gap-2.5 text-blue-600 font-semibold transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via Code</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDownload(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMove(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <FolderInput className="w-3.5 h-3.5 text-purple-600" />
                <span>Move</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleStar(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>{file.is_starred ? 'Unstar' : 'Star'}</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(file);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div onClick={handlePrimaryClick} className="mt-3 cursor-pointer">
        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
          <span>{formatBytes(file.size_bytes)}</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
