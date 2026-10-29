'use client';

import { UploadCloud, FolderPlus, FileText, Share2 } from 'lucide-react';

export default function QuickActions({ onAction }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Upload Files */}
      <button
        type="button"
        onClick={() => onAction?.('Upload Files')}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition text-left group cursor-pointer"
      >
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition shadow-2xs">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
            Upload Files
          </div>
          <div className="text-xs text-slate-500">
            PDF, Images, Video, Docs
          </div>
        </div>
      </button>

      {/* New Folder */}
      <button
        type="button"
        onClick={() => onAction?.('New Folder')}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-md transition text-left group cursor-pointer"
      >
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition shadow-2xs">
          <FolderPlus className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
            New Folder
          </div>
          <div className="text-xs text-slate-500">
            Create nested subfolder
          </div>
        </div>
      </button>

      {/* New Text File */}
      <button
        type="button"
        onClick={() => onAction?.('New Text File')}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition text-left group cursor-pointer"
      >
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition shadow-2xs">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">
            New Text File
          </div>
          <div className="text-xs text-slate-500">
            Plain-text (.txt) note
          </div>
        </div>
      </button>

      {/* Online Clipboard */}
      <button
        type="button"
        onClick={() => onAction?.('Online Clipboard')}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition text-left group cursor-pointer"
      >
        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition shadow-2xs">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition">
            Online Clipboard
          </div>
          <div className="text-xs text-slate-500">
            6-digit quick share
          </div>
        </div>
      </button>
    </div>
  );
}
