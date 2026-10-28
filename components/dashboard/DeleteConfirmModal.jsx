'use client';

import { useState } from 'react';
import { Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { softDeleteFolder } from '@/lib/folders';

export default function DeleteConfirmModal({ isOpen, onClose, folder, onFolderDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !folder) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await softDeleteFolder(folder.id);
      onFolderDeleted?.(folder.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete folder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Move to Trash</h3>
              <p className="text-xs text-slate-500">
                Safely recoverable from Trash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to move <span className="font-semibold text-slate-900">&ldquo;{folder.name}&rdquo;</span> to Trash? Any files and subfolders inside it will also be preserved in Trash.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 shadow-sm shadow-red-500/20 transition cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Move to Trash</span>
          </button>
        </div>
      </div>
    </div>
  );
}
