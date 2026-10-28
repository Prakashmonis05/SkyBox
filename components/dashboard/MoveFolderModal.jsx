'use client';

import { useState, useEffect } from 'react';
import { FolderInput, X, Loader2, AlertCircle, Folder, Home } from 'lucide-react';
import { getAllUserFolders, moveFolder } from '@/lib/folders';

export default function MoveFolderModal({ isOpen, onClose, folder, onFolderMoved }) {
  const [folders, setFolders] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && folder) {
      setSelectedParentId(folder.parent_id || null);
      setError('');
      setLoading(true);

      getAllUserFolders(folder.id)
        .then((data) => setFolders(data))
        .catch((err) => setError(err.message || 'Failed to load folders.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, folder]);

  if (!isOpen || !folder) return null;

  const handleMove = async () => {
    setMoving(true);
    setError('');

    try {
      const updated = await moveFolder(folder.id, selectedParentId);
      onFolderMoved?.(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to move folder.');
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Move Folder</h3>
              <p className="text-xs text-slate-500">
                Move &ldquo;{folder.name}&rdquo; to a new location
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

        {/* Destination Chooser */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Select Destination Folder
          </label>

          {loading ? (
            <div className="py-8 flex justify-center items-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1 p-1 border border-slate-200 rounded-xl bg-slate-50">
              {/* Option 1: Root / My Files */}
              <button
                type="button"
                onClick={() => setSelectedParentId(null)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                  selectedParentId === null
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>My Files (Root level)</span>
              </button>

              {folders.map((f) => {
                const isSelected = selectedParentId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedParentId(f.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                    <span className="truncate">{f.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={moving}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={moving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer disabled:opacity-60"
          >
            {moving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Move Here</span>
          </button>
        </div>
      </div>
    </div>
  );
}
