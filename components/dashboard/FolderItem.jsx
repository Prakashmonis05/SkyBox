'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Folder,
  MoreVertical,
  Star,
  Edit2,
  FolderInput,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function FolderItem({
  folder,
  viewMode = 'grid',
  onOpen,
  onRename,
  onMove,
  onDelete,
  onToggleStar,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDate = folder.updated_at
    ? new Date(folder.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '';

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition group">
        <div
          onClick={() => onOpen(folder)}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Folder className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition">
              {folder.name}
            </div>
            <div className="text-[11px] text-slate-400">Folder • Updated {formattedDate}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <button
            onClick={() => onToggleStar(folder)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              folder.is_starred
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
            }`}
            title={folder.is_starred ? 'Remove Star' : 'Star Folder'}
          >
            <Star className={`w-4 h-4 ${folder.is_starred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 text-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpen(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Folder</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMove(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <FolderInput className="w-3.5 h-3.5 text-purple-600" />
                <span>Move</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleStar(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>{folder.is_starred ? 'Unstar' : 'Star'}</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(folder);
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
          onClick={() => onOpen(folder)}
          className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center cursor-pointer group-hover:scale-105 transition shadow-2xs"
        >
          <Folder className="w-7 h-7 fill-amber-500/20" />
        </div>

        <div className="flex items-center gap-1" ref={menuRef}>
          <button
            onClick={() => onToggleStar(folder)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              folder.is_starred
                ? 'text-amber-500'
                : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
            }`}
            title={folder.is_starred ? 'Remove Star' : 'Star Folder'}
          >
            <Star className={`w-4 h-4 ${folder.is_starred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-3 top-12 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-30 text-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpen(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Folder</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMove(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <FolderInput className="w-3.5 h-3.5 text-purple-600" />
                <span>Move</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onToggleStar(folder);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 transition cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>{folder.is_starred ? 'Unstar' : 'Star'}</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(folder);
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

      <div onClick={() => onOpen(folder)} className="mt-3 cursor-pointer">
        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
          {folder.name}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
          <span>Folder</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
